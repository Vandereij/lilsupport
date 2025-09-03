import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseClient'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const supabase = supabaseServer()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const amount = (session.amount_total || 0)
      const type = session.mode === 'subscription' ? 'subscription' : 'one_time'
      const recipient_id = session.metadata?.recipient_id || null
      const supporter_id = session.customer ? null : null // You can map Stripe customers to users later.
      await supabase.from('payments').insert({
        supporter_id, recipient_id, amount, type, status: 'succeeded', stripe_id: session.id
      })
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const amount = invoice.amount_paid || 0
      const subId = invoice.subscription as string
      await supabase.from('payments').insert({
        supporter_id: null, recipient_id: null, amount, type: 'subscription', status: 'succeeded', stripe_id: subId
      })
      break
    }
    case 'customer.subscription.deleted': {
      // Mark canceled — for simplicity we don't keep a separate subscriptions table in MVP
      // Could insert a final record or update related rows if you add that later.
      break
    }
    default:
      // Ignore other events
      break
  }

  res.json({ received: true })
}
