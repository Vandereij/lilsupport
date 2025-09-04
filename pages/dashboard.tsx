import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/'; return }
      setUser(data.user)
      const { data: p } = await s.from('profiles').select('*').eq('id', data.user.id).single()
      setProfile(p)
      const { data: pays } = await s.from('payments')
        .select('*')
        .eq('recipient_id', data.user.id)
        .order('created_at', { ascending: false })
      setPayments(pays || [])
    })
  }, [])

  const setupPayouts = async () => {
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Profile Card */}
        {profile && (
          <div className="card space-y-4">
            <p>
              <span className="font-semibold">Username:</span> @{profile.username}
            </p>
            <p>
              <span className="font-semibold">Stripe:</span> {profile.stripe_account_id ? 'Connected' : 'Not connected'}
            </p>
            <button className="btn" onClick={setupPayouts}>
              {profile.stripe_account_id ? 'Edit Stripe payout settings' : 'Set up payouts'}
            </button>
          </div>
        )}

        {/* Earnings Card */}
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Earnings</h3>
          {payments.length === 0 ? (
            <p className="text-gray-600">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Type</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Amount</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">{p.type}</td>
                      <td className="px-4 py-2">${(p.amount / 100).toFixed(2)}</td>
                      <td className="px-4 py-2 capitalize">{p.status}</td>
                      <td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
