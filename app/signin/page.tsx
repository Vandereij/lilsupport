'use client'

import Nav from '@/components/Nav'
import { useState } from 'react'
import { signInWithGoogle, signInWithEmail } from '@/lib/auth'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const handleMagic = async () => {
    if (!email) return
    setStatus('Sending…')
    await signInWithEmail(email)
    setStatus('Check your email!')
  }

  return (
    <>
      <Nav />
      <main className="max-w-md mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-heading">Sign in</h1>
        <button className="btn w-full" onClick={() => signInWithGoogle()}>
          Continue with Google
        </button>
        <div className="text-center text-brand-dark/60">or</div>
        <div className="space-y-2">
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button className="btn w-full" onClick={handleMagic}>Send magic link</button>
          {status && <p className="text-center text-brand-dark/70">{status}</p>}
        </div>
      </main>
    </>
  )
}
