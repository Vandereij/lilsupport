// app/api/stripe/express-login/route.ts
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.stripe_account_id) {
    return NextResponse.json({ error: "No connected account" }, { status: 400 });
  }

  // ✅ No options object here; just the account id
  const login = await getStripe.arguments.accounts.createLoginLink(profile.stripe_account_id);

  return NextResponse.json({ url: login.url });
}
