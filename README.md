# LilSupport (MVP)

Next.js (TS) + Supabase + Stripe (Checkout + Connect Express) deployed on Netlify.

## Quickstart

1. Create Supabase project. Add tables with `db/schema.sql`. Create two Storage buckets:
   - `avatars` (public)
   - `qrcodes` (public)
2. Create a Stripe account. Add a $4/month product/price and set `STRIPE_PRICE_ID_MONTHLY` in `.env`.
3. Copy `.env.example` → `.env.local` and fill values.
4. `npm i` then `npm run dev`.

## Routes
- `/` Landing
- `/u/[username]` Public profile
- `/dashboard` Recipient dashboard
- `/profile/edit` Edit profile
- `/wallet` Supporter wallet

## Webhooks
Configure a Stripe webhook endpoint to `https://YOUR_SITE/api/stripe/webhook` with events:
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.deleted`

## Netlify
- Connect GitHub repository, enable builds.
- Set env vars in Netlify dashboard.
- The `@netlify/plugin-nextjs` handles API routes as serverless functions.
