// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const buf = Buffer.from(await req.arrayBuffer());

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session: any = event.data.object;

      // ONE-OFF tips only (we ignore subscription sessions here; renewals are tracked via invoice.paid)
      if (session.mode !== "payment") break;

      const paymentIntentId = session.payment_intent as string;
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["charges"] });

      const amount = pi.amount; // minor units
      const status = pi.status;
      const currency = pi.currency;

      const stripeCustomerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null;
      const supporterEmail = session.customer_details?.email || null;
      const supporterName = session.customer_details?.name || null;

      const supporterId = session.metadata?.supporter_id || null;
      const recipientId = session.metadata?.recipient_id;

      if (status === "succeeded" && recipientId) {
        const { error } = await supabase.from("payments").insert({
          supporter_id: supporterId || null,
          supporter_email: supporterEmail,
          supporter_name: supporterName,
          stripe_customer_id: stripeCustomerId,
          recipient_id: recipientId,
          amount,
          currency,
          type: "one_time",
          status: "succeeded",
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: session.id,
        });
        if (error) console.error("Supabase insert failed", error);
      }
      break;
    }

    case "invoice.paid": {
      const invoice: any = event.data.object;
      if (!invoice.subscription) break;

      // Pull metadata from the subscription we created in /subscription
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      const recipientId = sub.metadata?.recipient_id;
      const supporterId = sub.metadata?.supporter_id || null;

      // Customer info for guests
      const stripeCustomerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id || null;
      const supporterEmail = invoice.customer_email || null;

      const amount = invoice.amount_paid; // minor units
      const currency = invoice.currency;

      // Derive the period from the first line item
      const firstLine = invoice.lines?.data?.[0];
      const periodStart = firstLine?.period?.start ? new Date(firstLine.period.start * 1000).toISOString() : null;
      const periodEnd = firstLine?.period?.end ? new Date(firstLine.period.end * 1000).toISOString() : null;

      if (recipientId) {
        const { error } = await supabase.from("payments").insert({
          supporter_id: supporterId,
          supporter_email: supporterEmail,
          stripe_customer_id: stripeCustomerId,
          recipient_id: recipientId,
          amount,
          currency,
          type: "subscription",
          status: "succeeded",
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: invoice.subscription,
          period_start: periodStart,
          period_end: periodEnd,
        });
        if (error) console.error("Supabase insert failed", error);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice: any = event.data.object;
      if (!invoice.subscription) break;

      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      const recipientId = sub.metadata?.recipient_id;
      const supporterId = sub.metadata?.supporter_id || null;

      if (recipientId) {
        const { error } = await supabase.from("payments").insert({
          supporter_id: supporterId,
          recipient_id: recipientId,
          amount: invoice.amount_due,
          currency: invoice.currency,
          type: "subscription",
          status: "failed",
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: invoice.subscription,
        });
        if (error) console.error("Supabase insert failed", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      // Optional: mark local state if you add a subscriptions table later.
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
