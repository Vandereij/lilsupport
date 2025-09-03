import { createServerSupabase } from '@/lib/supabaseServer';

export default async function Wallet() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: payments } = await supabase.from('payments').select('*').eq('supporter_id', user.id).order('created_at', { ascending: false });

  return (
    <section className="p-6 grid gap-4">
      <h1 className="text-2xl font-semibold">Wallet</h1>
      <ul className="divide-y">
        {(payments || []).map(p => (
          <li key={p.id} className="py-2 text-sm flex justify-between">
            <span>{p.type} ${(p.amount/100).toFixed(2)}</span>
            <span className="text-gray-600">{new Date(p.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
