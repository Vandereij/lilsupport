import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerAdmin } from '@/lib/supabaseAdmin'


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })


export async function POST(req: NextRequest) {
    const { userId } = await req.json()
    const supabase = createServerAdmin()


    // Ensure the user has (or create) a connected account
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!profile) return NextResponse.json({ error: 'Profile missing' }, { status: 400 })


    let accountId = profile.stripe_account_id
    if (!accountId) {
        const acct = await stripe.accounts.create({ type: 'express', email: profile.email ?? undefined, country: 'US' })
        accountId = acct.id
        await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', userId)
    }


    const origin = process.env.NEXT_PUBLIC_SITE_URL!
    const link = await stripe.accountLinks.create({
        account: accountId!,
        refresh_url: `${origin}/dashboard?onboarding=refresh`,
        return_url: `${origin}/dashboard?onboarding=done`,
        type: 'account_onboarding'
    })


    return NextResponse.json({ url: link.url })
}