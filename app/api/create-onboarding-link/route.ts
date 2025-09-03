import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabaseServer';
import { appUrl } from '@/lib/utils';

export async function POST(_req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/(auth)/sign-in`, { status: 302 });

  const { data: profile } = await supabase.from('profiles').select('id, stripe_account_id').eq('id', user.id).single();
  let accountId = profile?.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express', email: user.email ?? undefined });
    accountId = account.id;
    await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/dashboard?onboarding=refresh`,
    return_url: `${appUrl()}/dashboard?onboarding=done`,
    type: 'account_onboarding'
  });

  return NextResponse.redirect(link.url, { status: 302 });
}
