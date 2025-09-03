import Link from 'next/link'
import { createServerClient } from '@/lib/supabaseRsc'
import { OnboardButton } from '@/components/OnboardButton'


export default async function Dashboard() {
    const supabase = createServerClient()
    const {
        data: { user }
    } = await supabase.auth.getUser()
    if (!user) return (<div>Please <Link href="/auth/login">log in</Link>.</div>)


    const [{ data: profile }, { data: payments }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('payments_view').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false })
    ])


    const total = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0


    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border"><div className="text-sm">Total earnings</div><div className="text-3xl font-bold">${(total / 100).toFixed(2)}</div></div>
                <div className="p-4 rounded-2xl border"><div className="text-sm">Stripe</div><OnboardButton stripeAccountId={profile?.stripe_account_id} /></div>
                <div className="p-4 rounded-2xl border"><div className="text-sm">Public URL</div><a className="text-blue-600 underline" href={`/u/${profile?.username}`}>/u/{profile?.username}</a></div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-3">Supporters</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-left"><th className="py-2">Date</th><th>Supporter</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                            {payments?.map(p => (
                                <tr key={p.id} className="border-t">
                                    <td className="py-2">{new Date(p.created_at).toLocaleString()}</td>
                                    <td>{p.supporter_email ?? '—'}</td>
                                    <td>{p.type}</td>
                                    <td>${(p.amount / 100).toFixed(2)}</td>
                                    <td>{p.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}