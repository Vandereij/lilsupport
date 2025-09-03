import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabaseServer';
import { appUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const username = String(form.get('username'));
  const type = String(form.get('type')) as 'one_time' | 'subscription';
  const amount = form.get('amount') ? Number(form.get('amount')) : undefined;
  const priceId = form.get('priceId')?.toString();

  const supabase = createServerSupabase();
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id, stripe_account_id, username')
    .eq('username', username)
    .single();

  if (!recipient?.stripe_account_id) {
    return NextResponse.redirect(`${appUrl()}/dashboard?error=no_stripe`, { status: 302 });
  }

  const { data: { user: supporter } } = await supabase.auth.getUser();

  const success_url = `${appUrl()}/u/${username}?success=1`;
  const cancel_url = `${appUrl()}/u/${username}?canceled=1`;

  let session;
  if (type === 'one_time') {
    if (!amount || amount < 100) return NextResponse.json({ error: 'amount too low' }, { status: 400 });
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: `Support @${username}` }, unit_amount: amount }, quantity: 1 }],
      success_url,
      cancel_url,
      payment_intent_data: {
        transfer_data: { destination: recipient.stripe_account_id },
        application_fee_amount: Math.floor(amount * 0.05)
      },
      metadata: { recipient_id: recipient.id, supporter_id: supporter?.id ?? '' }
    });
  } else {
    if (!priceId) return NextResponse.json({ error: 'missing priceId' }, { status: 400 });
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      subscription_data: {
        transfer_data: { destination: recipient.stripe_account_id },
        application_fee_percent: 5
      },
      metadata: { recipient_id: recipient.id, supporter_id: supporter?.id ?? '' }
    });
  }

  return NextResponse.redirect(session.url!, { status: 303 });
}
