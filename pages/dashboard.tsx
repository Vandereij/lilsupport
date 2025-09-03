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
      const { data: pays } = await s.from('payments').select('*').eq('recipient_id', data.user.id).order('created_at', { ascending:false })
      setPayments(pays || [])
    })
  }, [])

  const setupPayouts = async () => {
    const res = await fetch('/api/stripe/connect', { method:'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <>
      <Nav />
      <main className="container">
        <h1>Dashboard</h1>
        {profile && (
          <div className="card">
            <p><b>Username:</b> @{profile.username}</p>
            <p><b>Stripe:</b> {profile.stripe_account_id ? 'Connected' : 'Not connected'}</p>
            <button className="btn" onClick={setupPayouts}>{profile.stripe_account_id ? 'Edit Stripe payout settings' : 'Set up payouts'}</button>
          </div>
        )}

        <div className="card" style={{marginTop:16}}>
          <h3>Earnings</h3>
          {payments.length === 0 ? <p>No payments yet.</p> : (
            <table style={{width:'100%'}}>
              <thead><tr><th align="left">Type</th><th align="left">Amount</th><th align="left">Status</th><th align="left">Date</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.type}</td>
                    <td>${(p.amount/100).toFixed(2)}</td>
                    <td>{p.status}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  )
}
