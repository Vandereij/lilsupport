'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'
import PayoutsPanel from '@/components/PayoutsPanel'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: p } = await s.from('profiles').select('*').eq('id', data.user.id).single()
      setProfile(p)
      const { data: pays } = await s
        .from('payments')
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
      <h1 className="text-3xl font-heading">Dashboard</h1>

      {profile && (
        <section className="section">
          <h2 className="text-xl font-heading mb-4">Account</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Username:</span> @{profile.username}</p>
            <p><span className="font-medium">Stripe:</span> {profile.stripe_account_id ? 'Connected' : 'Not connected'}</p>
          </div>
          <button className="btn mt-4" onClick={setupPayouts}>
            {profile.stripe_account_id ? 'Edit Stripe payout settings' : 'Set up payouts'}
          </button>
          <PayoutsPanel userId={profile.id} />
        </section>
      )}

      <section>
        <h2 className="text-xl font-heading mb-4">Earnings</h2>
        {payments.length === 0 ? (
          <p className="text-brand-dark/70">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-muted/30 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-light text-brand-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/30">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-light/40 transition">
                    <td className="px-4 py-3 capitalize">{p.type}</td>
                    <td className="px-4 py-3 font-medium text-brand-primary">${(p.amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
