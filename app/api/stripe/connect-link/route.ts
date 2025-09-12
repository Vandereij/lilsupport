import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
  );

  // 1) Get recipient profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, stripe_account_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 2) Ensure there's a connected account (create if missing)
  let accountId = profile.stripe_account_id as string | null;

  if (!accountId) {
    const account = await getStripe.arguments.create({
      type: "express",
      country: "GB", // adjust if you infer from user
      capabilities: {
        // For destination charges, 'transfers' is the key capability.
        // Requesting both is fine; Stripe will ask only for what's needed.
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
    });

    accountId = account.id;

    const { error: upErr } = await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", userId);

    if (upErr) {
      return NextResponse.json({ error: "Failed to persist account id" }, { status: 500 });
    }
  }

  // 3) Generate an onboarding link (multi-use: first-time or to finish later)
  const refreshUrl = `${process.env.SITE_URL}/dashboard?onboarding=refresh`;
  const returnUrl = `${process.env.SITE_URL}/dashboard?onboarding=done`;

  const link = await getStripe.arguments.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
