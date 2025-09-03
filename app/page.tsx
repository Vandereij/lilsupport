import Link from 'next/link';

export default function Landing() {
  return (
    <section className="grid gap-6 p-6">
      <h1 className="text-4xl font-bold">LilSupport</h1>
      <p className="text-lg max-w-2xl">Let fans support recipients with one‑time tips or a $4/mo sub. Payouts via Stripe to bank or eligible debit card. We never touch banking details.</p>
      <div className="flex gap-4">
        <Link className="px-4 py-2 bg-black text-white rounded" href="/(auth)/sign-in">Get started</Link>
        <a className="px-4 py-2 border rounded" href="https://stripe.com/connect">How payouts work</a>
      </div>
    </section>
  );
}
