// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function num(n: unknown): number {
  return Math.max(0, Math.floor(Number(n) || 0));
}

async function insertPayment(row: any) {
  const { error } = await supabase.from("payments").insert(row);
  if (error) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const sig = req.headers.get("stripe-signature")!;
    const buf = await req.arrayBuffer();

    const event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Soft dedupe (DB also has a unique index on stripe_event_id ideally)
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_event_id", event.id)
      .limit(1);
    if (existing && existing.length) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const s: any = event.data.object;

        // -------- ONE-OFF (mode=payment) --------
        if (s.mode === "payment") {
          const supporter_id = s.metadata?.supporter_id || null;
          const recipient_id = s.metadata?.recipient_id!;
          const recipient_username = s.metadata?.recipient_username || "";

          // Retrieve PI with expand so we can rely on latest_charge if needed
          const piId =
            typeof s.payment_intent === "string"
              ? s.payment_intent
              : s.payment_intent?.id;

          const pi: any = piId
            ? await stripe.paymentIntents.retrieve(piId, {
              expand: ["latest_charge.balance_transaction"],
            })
            : null;

          // Prefer latest_charge (charges list is not used)
          const charge: any =
            pi && pi.latest_charge && typeof pi.latest_charge !== "string"
              ? pi.latest_charge
              : null;

          const currency = (pi?.currency || "usd").toLowerCase();
          const amount_minor = num(pi?.amount_received ?? pi?.amount);
          const platform_fee_minor = num(pi?.application_fee_amount ?? 0);

          await insertPayment({
            supporter_id,
            recipient_id,
            recipient_username,
            currency,
            amount_minor,
            platform_fee_minor,
            tax_minor: 0, // optional: derive from balance tx fees if you want
            net_to_recipient_minor: Math.max(
              0,
              amount_minor - platform_fee_minor
            ),
            kind: "one_time",
            status: "succeeded",
            message: s.metadata?.message || null,
            stripe_event_id: event.id,
            stripe_checkout_session_id: s.id,
            stripe_payment_intent_id: piId || null,
            stripe_charge_id: charge?.id || null,
            stripe_transfer_id: charge?.transfer || null,
            stripe_invoice_id: null,
            stripe_subscription_id: null,
          });
        }

        // -------- SUB INITIAL (mode=subscription) --------
        if (s.mode === "subscription") {
          const subId =
            typeof s.subscription === "string"
              ? s.subscription
              : s.subscription?.id;

          // Get the invoice ID (fallback to subscription.latest_invoice if session.invoice missing)
          const invoiceId =
            (typeof s.invoice === "string" && s.invoice) ||
            (typeof s.invoice === "object" && s.invoice?.id) ||
            (subId
              ? (await stripe.subscriptions.retrieve(subId)).latest_invoice
              : null);

          const invoice: any = invoiceId
            ? await stripe.invoices.retrieve(String(invoiceId))
            : null;

          // Fetch the PI referenced by the invoice to read application_fee_amount
          const invPiId =
            typeof invoice?.payment_intent === "string"
              ? invoice.payment_intent
              : invoice?.payment_intent?.id;

          const invPi: any = invPiId
            ? await stripe.paymentIntents.retrieve(invPiId, {
              expand: ["latest_charge.balance_transaction"],
            })
            : null;

          if (!invoice || !invPiId) {
            console.log("[subs] skip initial insert; no invoice yet", { session: s.id, subId });
            break; // invoice.paid will insert later
          }

          const currency = (invoice?.currency || "usd").toLowerCase();
          const amount_minor = num(invoice?.amount_paid ?? invoice?.amount_due);

          // App fee from PaymentIntent (not invoice)
          const platform_fee_minor = num(invPi?.application_fee_amount ?? 0);

          // Tax from total_tax_amounts (fallback amount_tax)
          const tax_minor = Array.isArray(invoice?.total_tax_amounts)
            ? invoice.total_tax_amounts.reduce(
              (sum: number, t: any) => sum + num(t.amount),
              0
            )
            : num(invoice?.amount_tax ?? 0);

          await insertPayment({
            supporter_id: s.metadata?.supporter_id || null,
            recipient_id: s.metadata?.recipient_id!,
            recipient_username: s.metadata?.recipient_username || "",
            currency,
            amount_minor,
            platform_fee_minor,
            tax_minor,
            net_to_recipient_minor: Math.max(
              0,
              amount_minor - platform_fee_minor
            ),
            kind: "subscription_initial",
            status: "succeeded",
            message: s.metadata?.message || null,
            stripe_event_id: event.id,
            stripe_checkout_session_id: s.id,
            stripe_payment_intent_id: invPiId || null,
            stripe_charge_id: null,
            stripe_transfer_id: null,
            stripe_invoice_id: invoice?.id || null,
            stripe_subscription_id: subId || null,
          });
        }

        break;
      }

      case "invoice.paid": {
        const inv: any = event.data.object;
        if (!inv.subscription) break;

        const subId =
          typeof inv.subscription === "string"
            ? inv.subscription
            : inv.subscription.id;

        // Retrieve subscription to read our copied metadata
        const sub = await getStripe().subscriptions.retrieve(subId);
        const md = sub.metadata || {};

        // Read app fee from the invoice's PI
        const invPiId =
          typeof inv.payment_intent === "string"
            ? inv.payment_intent
            : inv.payment_intent?.id;

        const invPi: any = invPiId
          ? await getStripe().paymentIntents.retrieve(invPiId, {
            expand: ["latest_charge.balance_transaction"],
          })
          : null;

        const amount_minor = num(inv.amount_paid ?? inv.amount_due);
        const platform_fee_minor = num(invPi?.application_fee_amount ?? 0);

        // Tax from total_tax_amounts (fallback amount_tax)
        const tax_minor = Array.isArray(inv.total_tax_amounts)
          ? inv.total_tax_amounts.reduce(
            (sum: number, t: any) => sum + num(t.amount),
            0
          )
          : num(inv.amount_tax ?? 0);

        await insertPayment({
          supporter_id: md.supporter_id || null,
          recipient_id: md.recipient_id!,
          recipient_username: md.recipient_username || "",
          currency: (inv.currency || "usd").toLowerCase(),
          amount_minor,
          platform_fee_minor,
          tax_minor,
          net_to_recipient_minor: Math.max(
            0,
            amount_minor - platform_fee_minor
          ),
          kind: "subscription_renewal",
          status: "succeeded",
          message: null,
          stripe_event_id: event.id,
          stripe_checkout_session_id: null,
          stripe_payment_intent_id: invPiId || null,
          stripe_charge_id: null,
          stripe_transfer_id: null,
          stripe_invoice_id: inv.id,
          stripe_subscription_id: subId,
        });
        break;
      }

      case "charge.refunded": {
        const ch: any = event.data.object;
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_charge_id", ch.id);
        break;
      }

      default:
        // ignore others
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook error:", err?.message || err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
