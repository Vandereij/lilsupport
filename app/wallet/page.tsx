import { createServerClient } from '@/lib/supabaseRsc'


export default async function Wallet() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Please log in.</div>
    const { data: rows } = await supabase.from('payments_view').select('*').eq('supporter_id', user.id).order('created_at', { ascending: false })
    return (
        <div className="grid gap-4">
            <h1 className="text-2xl font-semibold">My wallet</h1>
            <ul className="grid gap-2">
                {rows?.map(r => (
                    <li key={r.id} className="p-3 rounded-xl border flex justify-between">
                        <span>@{r.recipient_username}</span>
                        <span>{r.type} • ${(r.amount / 100).toFixed(2)} • {new Date(r.created_at).toLocaleDateString()}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}