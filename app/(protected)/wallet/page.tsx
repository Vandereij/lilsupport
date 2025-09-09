'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function Wallet() {
  const [badges, setBadges] = useState<any[]>([])
  const [subs, setSubs] = useState<any[]>([])

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: b } = await s.from('badges').select('*').eq('supporter_id', data.user.id).order('created_at', { ascending: false })
      setBadges(b || [])
      const { data: p } = await s.from('payments').select('*').eq('supporter_id', data.user.id).eq('type', 'subscription')
      setSubs(p || [])
    })
  }, [])

  return (
    <>
      <h1 className="text-3xl font-heading">Your Wallet</h1>

      <section>
        <h2 className="text-xl font-heading mb-4">Active Subscriptions</h2>
        {subs.length === 0 ? (
          <p className="text-brand-dark/70">You don’t have any subscriptions yet.</p>
        ) : (
          <ul className="divide-y divide-brand-muted/40 rounded-xl border border-brand-muted/30 bg-white overflow-hidden">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-brand-dark">@{s.recipient_id}</span>
                <span className="text-brand-primary font-medium">${(s.amount / 100).toFixed(2)}/mo</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-heading mb-4">Your Badges</h2>
        {badges.length === 0 ? (
          <p className="text-brand-dark/70">No badges collected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {badges.map((b) => (
              <img key={b.id} src={b.image_url} alt="badge" className="w-16 h-16 rounded-lg shadow-sm hover:scale-105 transition" />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
