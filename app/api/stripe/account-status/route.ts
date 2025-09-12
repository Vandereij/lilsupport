import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ onboarded: false, reason: "no_account" });
  }

  const acct = await getStripe.arguments.retrieve(profile.stripe_account_id);

  const transfersActive = acct.capabilities?.transfers === "active";
  const currentlyDue = acct.requirements?.currently_due ?? [];
  const disabledReason = acct.requirements?.disabled_reason || null;

  // For destination charges, 'transfers' being active is the key signal.
  const onboarded = Boolean(transfersActive);

  return NextResponse.json({
    onboarded,
    transfersActive,
    currentlyDue,
    disabledReason,
  });
}
