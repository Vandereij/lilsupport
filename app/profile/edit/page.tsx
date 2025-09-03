import { createServerSupabase } from '@/lib/supabaseServer';
import AvatarUpload from '@/components/AvatarUpload';
import QRCode from 'qrcode';

export default async function EditProfile() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  async function generateQR() {
    'use server';
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const url = `${process.env.APP_URL}/u/${profile.username}`;
    const svg = await QRCode.toString(url, { type: 'svg' });
    const path = `${user.id}/qr.svg`;
    await supabase.storage.from('qrs').upload(path, new Blob([svg], { type: 'image/svg+xml' }), { upsert: true });
    const publicUrl = supabase.storage.from('qrs').getPublicUrl(path).data.publicUrl;
    await supabase.from('profiles').update({ qr_code_url: publicUrl }).eq('id', user.id);
  }

  async function save(formData: FormData) {
    'use server';
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      username: String(formData.get('username') || '').replace(/^@/, ''),
      display_name: String(formData.get('display_name') || ''),
      bio: String(formData.get('bio') || '')
    });
  }

  return (
    <section className="grid gap-4 p-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Edit profile</h1>
      <form action={save} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Username</span>
          <input name="username" defaultValue={prof?.username ?? ''} className="border p-2 rounded" placeholder="yourname" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Display name</span>
          <input name="display_name" defaultValue={prof?.display_name ?? ''} className="border p-2 rounded" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Bio</span>
          <textarea name="bio" defaultValue={prof?.bio ?? ''} className="border p-2 rounded" />
        </label>
        <button className="bg-black text-white rounded p-2 w-fit">Save</button>
      </form>

      <div className="grid gap-2">
        <h2 className="font-semibold">Avatar</h2>
        <AvatarUpload userId={user.id} />
      </div>

      <div className="grid gap-2">
        <h2 className="font-semibold">QR Code</h2>
        <form action={generateQR}>
          <button className="border rounded p-2">Regenerate QR</button>
        </form>
        {prof?.qr_code_url && <img src={prof.qr_code_url} alt="qr" className="w-40 h-40" />}
      </div>
    </section>
  );
}
