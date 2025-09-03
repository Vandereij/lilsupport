'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function AvatarUpload({ userId }: { userId: string }) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  return (
    <div>
      <input type="file" accept="image/*" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const path = `${userId}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('avatars').upload(path, file);
        if (error) alert(error.message);
        if (data) await supabase.from('profiles').update({ avatar_url: `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}` }).eq('id', userId);
        setUploading(false);
        location.reload();
      }} />
      {uploading && <p className="text-sm text-gray-500">Uploading…</p>}
    </div>
  );
}
