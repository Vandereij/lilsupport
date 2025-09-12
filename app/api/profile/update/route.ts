import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const supabase = await getSupabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const update: Record<string, any> = {};
  if (typeof body.username === "string") update.username = body.username.trim();
  if (typeof body.bio === "string") update.bio = body.bio;
  if (typeof body.avatar_url === "string") update.avatar_url = body.avatar_url;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
