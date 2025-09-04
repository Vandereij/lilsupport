import Head from 'next/head'
import Nav from '@/components/Nav'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string>('')

  return (
    <>
      <Head>
        <title>LilSupport — Support creators in one tap</title>
      </Head>
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Hero + Auth */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Support people you <span className="text-red-500">❤️</span>, in one tap.
            </h1>
            <p className="text-gray-700 text-lg bg-white p-6 rounded-xl shadow">
              LilSupport lets fans send a one‑time tip or $4/mo subscription. Creators get paid via Stripe Connect.
            </p>
          </div>

          {/* Right Column: How it works */}
          <div className="bg-white p-8 rounded-xl shadow space-y-4">
            <h3 className="text-2xl font-semibold">How it works</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Creators sign up and claim a username.</li>
              <li>Share your <code className="bg-gray-100 px-1 rounded">/u/&lt;username&gt;</code> page or QR code.</li>
              <li>Fans tap <strong>Support Me</strong> → Stripe Checkout.</li>
              <li>Connect a bank or debit card for payouts.</li>
            </ol>
          </div>
        </section>
      </main>
    </>
  )
}
