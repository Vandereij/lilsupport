import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { recipientId, type } = body as { recipientId: string, type: 'one_time' | 'subscription' }
    const supabase = createServerAdmin()

    const { data: recipient } = await supabase.from('profiles').select('id, username, display_name, stripe_account_id').eq('id', recipientId).single()
    if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })

    const origin = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
        mode: type === 'one_time' ? 'payment' : 'subscription',
        line_items: [
            type === 'one_time'
                ? { price_data: { currency: 'usd', product_data: { name: `Support @${recipient.username}` }, unit_amount: 400 }, quantity: 1 }
                : { price_data: { currency: 'usd', product_data: { name: `Support @${recipient.username} (monthly)` }, recurring: { interval: 'month' }, unit_amount: Number(process.env.SUPPORT_SUB_AMOUNT_CENTS || 400) }, quantity: 1 }
        ],
        success_url: `${origin}/u/${recipient.username}?success=1`,
        cancel_url: `${origin}/u/${recipient.username}?canceled=1`,
        payment_intent_data: recipient.stripe_account_id ? { transfer_data: { destination: recipient.stripe_account_id } } : undefined,
        subscription_data: recipient.stripe_account_id ? { transfer_data: { destination: recipient.stripe_account_id } } as any : undefined,
        metadata: { recipient_id: recipient.id },
    })


    return NextResponse.json({ url: session.url })
}