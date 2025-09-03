import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')
  const { username, mode } = req.body as { username: string, mode: 'payment' | 'subscription' }

  const s = supabaseServer()
  const { data: profile } = await s.from('profiles').select('*').eq('username', username).single()
  if (!profile) return res.status(404).json({ error: 'Profile not found' })

  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY as string
  const site = process.env.NEXT_PUBLIC_SITE_URL as string

  const application_fee_percent = Number(process.env.STRIPE_CONNECT_APPLICATION_FEE_PERCENT || 0)
  const application_fee_amount = application_fee_percent > 0 ? undefined : undefined // placeholder if you later use PaymentIntents fees

  const session = await stripe.checkout.sessions.create({
    mode,
    success_url: `${site}/u/${username}?status=success`,
    cancel_url: `${site}/u/${username}?status=cancelled`,
    payment_intent_data: profile.stripe_account_id ? { transfer_data: { destination: profile.stripe_account_id } } : undefined,
    subscription_data: profile.stripe_account_id ? { transfer_data: { destination: profile.stripe_account_id } } : undefined,
    line_items: mode === 'payment'
      ? [{ price_data: { currency: 'usd', product_data: { name: `Support @${username}` }, unit_amount: 500 }, quantity: 1 }]
      : [{ price: priceId, quantity: 1 }],
    metadata: { username, recipient_id: profile.id, type: mode === 'payment' ? 'one_time' : 'subscription' }
  })

  return res.status(200).json({ url: session.url })
}
