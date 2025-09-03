import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerService } from '@/lib/supabaseService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature')
    const raw = await req.text()


    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = createServerService()

    switch (event.type) {
        case 'checkout.session.completed': {
            const s = event.data.object as Stripe.Checkout.Session
            const amount = (s.amount_total ?? 0)
            const recipientId = (s.metadata?.recipient_id as string | undefined) || null
            const supporterEmail = s.customer_details?.email || null
            // Map by email -> supporter user (optional). For MVP we store email only in view.
            await supabase.from('payments').insert({
                supporter_id: null,
                recipient_id: recipientId,
                amount,
                type: s.mode === 'subscription' ? 'subscription' : 'one_time',
                status: 'succeeded',
                stripe_id: s.id
            })
            break
        }
        case 'invoice.paid': {
            const inv = event.data.object as Stripe.Invoice
            const sub = inv.subscription as string
            const amount = inv.amount_paid ?? 0
            const recipientId = inv.lines.data[0]?.metadata?.recipient_id || inv.metadata?.recipient_id || null
            await supabase.from('payments').insert({
                supporter_id: null,
                recipient_id: recipientId,
                amount,
                type: 'subscription',
                status: 'succeeded',
                stripe_id: sub
            })
            break
        }
        case 'customer.subscription.deleted': {
            // Optionally mark status or write audit log
            break
        }
    }

    return NextResponse.json({ received: true })
}