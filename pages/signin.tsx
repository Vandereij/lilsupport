import Head from 'next/head'
import Nav from '@/components/Nav'
import { useState } from 'react'
import { signInWithGoogle, signInWithEmail } from '@/lib/auth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string>('')

  const handleMagicLink = async () => {
    if (!email) return
    setStatus('Sending…')
    await signInWithEmail(email)
    setStatus('Check your email!')
  }

  return (
    <>
      <Head><title>Sign In | LilSupport</title></Head>
      <Nav />
      <main className="max-w-md mx-auto px-6 py-16 space-y-8">
        <h1 className="text-3xl font-extrabold text-brand-dark">Sign In</h1>

        <button
          className="w-full px-4 py-3 rounded-lg bg-brand-dark text-white font-medium hover:bg-brand transition"
          onClick={() => signInWithGoogle()}
        >
          Continue with Google
        </button>

        <div className="text-center text-brand-dark/70">or</div>

        <div className="space-y-2">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            className="w-full px-4 py-3 rounded-lg bg-brand-dark text-white font-medium hover:bg-brand transition"
            onClick={handleMagicLink}
          >
            Send Magic Link
          </button>
          {status && <p className="text-center text-brand-dark/70">{status}</p>}
        </div>
      </main>
    </>
  )
}
