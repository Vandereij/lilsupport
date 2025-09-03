import Head from 'next/head'
import Nav from '@/components/Nav'
import { useState } from 'react'
import { signInWithGoogle, signInWithEmail } from '@/lib/auth'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string>('')

  return (
    <>
      <Head><title>LilSupport — Support creators in one tap</title></Head>
      <Nav />
      <main className="container">
        <section className="grid grid-2 items-center">
          <div>
            <h1 style={{fontSize:36, lineHeight:1.1, marginBottom:12}}>Support people you ❤️, in one tap.</h1>
            <p className="card">LilSupport lets fans send a one‑time tip or $4/mo subscription. Creators get paid via Stripe Connect.</p>
            <div className="grid" id="auth" style={{marginTop:20}}>
              <button className="btn" onClick={() => signInWithGoogle()}>Continue with Google</button>
              <div className="card">
                <p style={{marginTop:0}}>Or get a magic link:</p>
                <div className="grid" style={{gridTemplateColumns:'1fr auto'}}>
                  <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
                  <button className="btn secondary" onClick={async()=>{ setStatus('Sending…'); await signInWithEmail(email); setStatus('Check your email!') }}>Send</button>
                </div>
                <small>{status}</small>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>How it works</h3>
            <ol>
              <li>Creators sign up and claim a username.</li>
              <li>Share your <code>/u/&lt;username&gt;</code> page or QR code.</li>
              <li>Fans tap <b>Support Me</b> → Stripe Checkout.</li>
              <li>Connect a bank or debit card for payouts.</li>
            </ol>
          </div>
        </section>
      </main>
    </>
  )
}
