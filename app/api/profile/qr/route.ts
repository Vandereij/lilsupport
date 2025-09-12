// app/api/profile/qr/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

function urlToPath(url?: string | null) {
  if (!url) return null;
  const marker = '/object/public/';
  const i = url.indexOf(marker);
  return i < 0 ? null : url.slice(i + marker.length); // e.g. "qrcodes/<uid>/<file>.png"
}

export async function POST(req: Request) {
  // Auth like your avatar route: trust the user's bearer token
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, error: 'No token' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Who's calling?
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  // Read body (you send { username } from the client)
  const body = await req.json().catch(() => ({}));
  const username: string | undefined = body?.username;

  // What the QR encodes — adjust to your canonical URL scheme
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || '';
  const payload = username
    ? `${origin}/@${username}`
    : `${origin}/u/${user.id}`;

  // Load current QR fields (so we can delete the old one later)
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('qr_code_url, qr_code_path')
    .eq('id', user.id)
    .single();

  if (profErr) {
    return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 });
  }

  const oldPath = profile?.qr_code_path ?? urlToPath(profile?.qr_code_url);

  // Generate a PNG QR
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 0,
    scale: 12,
  });
  const base64 = dataUrl.split(',')[1]!;
  const bytes = Buffer.from(base64, 'base64');

  // Upload new file to qrcodes bucket (path must be relative to bucket root)
  const newPath = `qrcodes/${user.id}/${randomUUID()}.png`;
  const relNewPath = newPath.replace(/^qrcodes\//, '');

  const { error: upErr } = await supabase.storage
    .from('qrcodes')
    .upload(relNewPath, bytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png',
    });

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });
  }

  // Public URL
  const { data: pub } = supabase.storage.from('qrcodes').getPublicUrl(relNewPath);
  const qr_code_url = pub?.publicUrl ?? null;

  // Update DB to point to the new QR
  const { error: updErr } = await supabase
    .from('profiles')
    .update({ qr_code_url, qr_code_path: newPath })
    .eq('id', user.id);

  if (updErr) {
    // Roll back the upload so we don't leave orphans
    await supabase.storage.from('qrcodes').remove([relNewPath]).catch(() => { });
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });
  }

  // Best-effort delete of the previous QR file
  if (oldPath && oldPath !== newPath) {
    const relOld = oldPath.replace(/^qrcodes\//, '');
    await supabase.storage.from('qrcodes').remove([relOld]).catch(() => { });
  }

  return NextResponse.json({ ok: true, url: qr_code_url });
}
