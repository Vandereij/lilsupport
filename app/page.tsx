import Nav from '@/components/Nav'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-heading leading-tight">
            Support people you <span className="text-red-500">❤️</span>, in one tap.
          </h1>
          <p className="text-lg text-brand-dark/80">
            Send a one-time tip or subscribe for $4/mo. Creators get paid via Stripe Connect.
          </p>
          <Link href="/signin" className="btn">Sign in / Get started</Link>
        </div>
        <div className="section space-y-3">
          <h3 className="text-xl font-heading">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-brand-dark/80">
            <li>Creators claim a username.</li>
            <li>Share your <code className="bg-brand-muted/40 px-1 rounded">/u/&lt;username&gt;</code> or QR.</li>
            <li>Fans tap <b>Support Me</b> → Stripe Checkout.</li>
            <li>Connect bank or debit card for payouts.</li>
          </ol>
        </div>
      </main>
    </>
  )
}
