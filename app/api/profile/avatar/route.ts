// app/api/profile/avatar/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

function urlToPath(url?: string | null) {
  if (!url) return null;
  const marker = '/object/public/';
  const i = url.indexOf(marker);
  return i < 0 ? null : url.slice(i + marker.length);
}

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, error: 'No token' }, { status: 401 });

  // Create a server Supabase client that trusts the bearer token from the user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('avatar') as File | null;
  if (!file || file.size === 0) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('avatar_url, avatar_path')
    .eq('id', user.id)
    .single();
  if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 });

  const oldPath = profile?.avatar_path ?? urlToPath(profile?.avatar_url);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const newPath = `avatars/${user.id}/${randomUUID()}.${ext}`;
  const relNewPath = newPath.replace(/^avatars\//, '');

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(relNewPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(relNewPath);
  const avatar_url = pub?.publicUrl ?? null;

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ avatar_url, avatar_path: newPath })
    .eq('id', user.id);
  if (updErr) {
    await supabase.storage.from('avatars').remove([relNewPath]).catch(() => {});
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 });
  }

  if (oldPath && oldPath !== newPath) {
    const relOld = oldPath.replace(/^avatars\//, '');
    await supabase.storage.from('avatars').remove([relOld]).catch(() => {});
  }

  return NextResponse.json({ ok: true, avatar_url });
}
