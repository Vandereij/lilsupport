import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import fetch from 'node-fetch';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

async function insertPayment(row: any) {
  const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    },
    body: JSON.stringify(row)
  });
  if (!resp.ok) throw new Error(await resp.text());
}

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] as string;
  const body = event.body as string;

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const s = evt.data.object as Stripe.Checkout.Session;
        const mode = s.mode;
        const amount = s.amount_total ?? 0;
        await insertPayment({
          supporter_id: s.metadata?.supporter_id || null,
          recipient_id: s.metadata?.recipient_id || null,
          amount: amount,
          type: mode === 'subscription' ? 'subscription' : 'one_time',
          status: 'succeeded',
          stripe_id: s.id
        });
        break;
      }
      case 'invoice.paid': {
        const inv = evt.data.object as Stripe.Invoice;
        await insertPayment({
          supporter_id: inv.customer as string | null,
          recipient_id: inv.metadata?.recipient_id || null,
          amount: inv.amount_paid,
          type: 'subscription',
          status: 'succeeded',
          stripe_id: inv.subscription as string
        });
        break;
      }
      case 'customer.subscription.deleted': {
        break;
      }
    }
  } catch (e: any) {
    return { statusCode: 500, body: e.message };
  }

  return { statusCode: 200, body: 'ok' };
};
