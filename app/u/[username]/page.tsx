import { createServerSupabase } from '@/lib/supabaseServer';
import QRCard from '@/components/QRCard';
import Link from 'next/link';

export default async function PublicProfile({ params }: { params: { username: string } }) {
  const supabase = createServerSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, qr_code_url, stripe_account_id')
    .eq('username', params.username)
    .single();

  if (!profile) return <div className="p-6">Profile not found.</div>;

  const subPriceId = process.env.STRIPE_PRICE_MONTHLY!;

  return (
    <section className="grid gap-6 p-6">
      <div className="flex items-center gap-4">
        {profile.avatar_url && <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover" />}
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name || '@' + profile.username}</h1>
          <p className="text-gray-600">{profile.bio}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <form action={`/api/create-checkout-session`} method="POST">
          <input type="hidden" name="username" value={profile.username} />
          <input type="hidden" name="type" value="one_time" />
          <input type="hidden" name="amount" value="500" />
          <button className="px-4 py-2 rounded bg-black text-white">Tip $5</button>
        </form>
        <form action={`/api/create-checkout-session`} method="POST">
          <input type="hidden" name="username" value={profile.username} />
          <input type="hidden" name="type" value="subscription" />
          <input type="hidden" name="priceId" value={subPriceId} />
          <button className="px-4 py-2 rounded border">Subscribe $4/mo</button>
        </form>
      </div>

      <QRCard url={`${process.env.APP_URL}/u/${profile.username}`} imgUrl={profile.qr_code_url} />

      <Link className="text-sm text-gray-500" href="/">← Back</Link>
    </section>
  );
}
