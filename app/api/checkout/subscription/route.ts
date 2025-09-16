import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const FEE_BPS = parseInt(process.env.PLATFORM_FEE_BPS ?? "500", 10);

export async function POST(req: NextRequest) {
  try {
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaSrv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.SITE_URL;
    if (!supaUrl || !supaSrv) throw new Error("Supabase env missing (URL/Service key)");
    if (!siteUrl) throw new Error("SITE_URL env missing");
    if (!process.env.STRIPE_PRICE_ID_MONTHLY) {
      throw new Error("Missing STRIPE_PRICE_ID_MONTHLY env");
    }

    const { supporterId, recipientUsername, message } =
      (await req.json()) as { supporterId?: string | null; recipientUsername?: string; message?: string };

    if (!recipientUsername) {
      return NextResponse.json({ error: "Missing recipientUsername" }, { status: 400 });
    }

    const supabase = createClient(supaUrl, supaSrv);
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, username, stripe_account_id, is_pro")
      .eq("username", recipientUsername)
      .maybeSingle();

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }
    if (!recipient.stripe_account_id) {
      return NextResponse.json(
        { error: "Recipient not onboarded to payouts (stripe_account_id missing)" },
        { status: 400 }
      );
    }

    const feePercent = recipient.is_pro ? 0 : FEE_BPS / 100; // e.g. 5

    const successUrl =
      (process.env.STRIPE_SUCCESS_URL || `${siteUrl}/u/{USERNAME}?status=success`)
        .replace("{USERNAME}", recipient.username);
    const cancelUrl =
      (process.env.STRIPE_CANCEL_URL || `${siteUrl}/u/{USERNAME}?status=cancel`)
        .replace("{USERNAME}", recipient.username);

    const cleanSupporterId =
      supporterId && supporterId !== recipient.id ? supporterId : null;

    const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

    const msg = message ? String(message).slice(0, 140) : "";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID_MONTHLY!, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        application_fee_percent: feePercent,
        transfer_data: { destination: recipient.stripe_account_id },
        metadata: {
          kind: "subscription",
          recipient_id: recipient.id,
          recipient_username: recipient.username,
          supporter_id: cleanSupporterId ?? "",

        },
      },
      metadata: {
        kind: "subscription",
        recipient_id: recipient.id,
        recipient_username: recipient.username,
        supporter_id: cleanSupporterId ?? "",
      },
      ...(taxEnabled ? { automatic_tax: { enabled: true } } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("checkout/subscription error:", e);
    const msg = e?.raw?.message || e?.message || "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
