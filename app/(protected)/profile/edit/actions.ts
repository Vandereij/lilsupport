// app/profile/edit/actions.ts
'use server';

import { randomUUID } from 'crypto';
import { getSupabaseServer } from '@/lib/supabaseServer';

function urlToPath(url?: string | null) {
    if (!url) return null;
    const marker = '/object/public/';
    const i = url.indexOf(marker);
    return i < 0 ? null : url.slice(i + marker.length);
}

export async function uploadAvatar(formData: FormData) {
    const file = formData.get('avatar') as File | null;
    if (!file || file.size === 0) return { ok: false, error: 'No file provided' };

    const supabase = await getSupabaseServer(); // <-- no await

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return { ok: false, error: 'Not signed in' };

    const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('avatar_url, avatar_path')
        .eq('id', user.id)
        .single();
    if (profErr) return { ok: false, error: profErr.message };

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
    if (upErr) return { ok: false, error: upErr.message };

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(relNewPath);
    const avatar_url = pub?.publicUrl ?? null;

    const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url, avatar_path: newPath })
        .eq('id', user.id);
    if (updErr) {
        await supabase.storage.from('avatars').remove([relNewPath]).catch(() => { });
        return { ok: false, error: updErr.message };
    }

    if (oldPath && oldPath !== newPath) {
        const relOld = oldPath.replace(/^avatars\//, '');
        await supabase.storage.from('avatars').remove([relOld]).catch(() => { });
    }

    return { ok: true, avatar_url };
}
