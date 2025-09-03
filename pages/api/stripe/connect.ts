import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')

  // In a real app, read the user from your session/cookies. Here we accept a header for simplicity.
  // On Netlify/Next you could use Supabase Auth helpers for SSR.
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let accountId = profile?.stripe_account_id
  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express', email: user.email || undefined })
    accountId = account.id
    await supabase.from('profiles').upsert({ id: user.id, stripe_account_id: accountId })
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL as string
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${site}/dashboard`,
    return_url: `${site}/dashboard`,
    type: 'account_onboarding'
  })

  return res.status(200).json({ url: accountLink.url })
}
