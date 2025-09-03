import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function Wallet() {
  const [user, setUser] = useState<any>(null)
  const [badges, setBadges] = useState<any[]>([])
  const [subs, setSubs] = useState<any[]>([])

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (!data.user) return
      const { data: b } = await s.from('badges').select('*').eq('supporter_id', data.user.id).order('created_at', { ascending:false })
      setBadges(b || [])
      const { data: p } = await s.from('payments').select('*').eq('supporter_id', data.user.id).eq('type','subscription')
      setSubs(p || [])
    })
  }, [])

  return (
    <>
      <Nav />
      <main className="container">
        <h1>Wallet</h1>
        <div className="card">
          <h3>Your subscriptions</h3>
          {subs.length === 0 ? <p>None yet.</p> : subs.map(s => <div key={s.id}>Sub to {s.recipient_id} — ${(s.amount/100).toFixed(2)}</div>)}
        </div>
        <div className="card" style={{marginTop:16}}>
          <h3>Badges</h3>
          {badges.length === 0 ? <p>No badges yet.</p> : badges.map(b => <img key={b.id} src={b.image_url} alt="badge" style={{width:64}} />)}
        </div>
      </main>
    </>
  )
}
