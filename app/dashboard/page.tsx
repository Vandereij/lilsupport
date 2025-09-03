import { createServerSupabase } from '@/lib/supabaseServer';
import Link from 'next/link';

export default async function Dashboard() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: prof }, { data: tx }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('payments').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false })
  ]);

  return (
    <section className="grid gap-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {!prof?.username && (
        <form className="grid gap-2" action="/profile/edit">
          <p className="text-sm">Finish your profile to start receiving support.</p>
          <button className="px-3 py-2 bg-black text-white rounded">Complete profile</button>
        </form>
      )}

      <div className="flex gap-3">
        <form action="/api/create-onboarding-link" method="POST">
          <button className="px-3 py-2 border rounded">Set up payouts</button>
        </form>
        {prof?.username && (
          <Link href={`/u/${prof.username}`} className="px-3 py-2 border rounded">View public profile</Link>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-2">Recent payments</h2>
        <ul className="divide-y">
          {(tx || []).map((p) => (
            <li key={p.id} className="py-2 text-sm flex justify-between">
              <span>{p.type} — ${(p.amount/100).toFixed(2)}</span>
              <span className={p.status === 'succeeded' ? 'text-green-600' : p.status === 'failed' ? 'text-red-600' : 'text-gray-500'}>{p.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
