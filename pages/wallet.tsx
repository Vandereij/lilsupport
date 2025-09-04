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
      const { data: b } = await s.from('badges')
        .select('*')
        .eq('supporter_id', data.user.id)
        .order('created_at', { ascending: false })
      setBadges(b || [])

      const { data: p } = await s.from('payments')
        .select('*')
        .eq('supporter_id', data.user.id)
        .eq('type', 'subscription')
      setSubs(p || [])
    })
  }, [])

  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="text-3xl font-bold">Wallet</h1>

        {/* Subscriptions Card */}
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Your subscriptions</h3>
          {subs.length === 0 ? (
            <p className="text-gray-600">None yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subs.map(s => (
                <div key={s.id} className="bg-gray-50 p-4 rounded-lg shadow flex justify-between items-center">
                  <span>Recipient: <strong>{s.recipient_id}</strong></span>
                  <span className="font-semibold">${(s.amount / 100).toFixed(2)}/mo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges Card */}
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Badges</h3>
          {badges.length === 0 ? (
            <p className="text-gray-600">No badges yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {badges.map(b => (
                <div key={b.id} className="flex justify-center">
                  <img
                    src={b.image_url}
                    alt={`Badge Gen ${b.generation}`}
                    className="w-16 h-16 rounded-lg shadow hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
