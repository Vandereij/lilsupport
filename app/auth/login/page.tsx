'use client'
import { createClient } from '@/lib/supabaseClient'
import { useState } from 'react'


export default function Login() {
    const supabase = createClient()
    const [email, setEmail] = useState('')


    const signInWithEmail = async () => {
        await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
        alert('Check your email for the magic link!')
    }


    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
    }


    return (
        <div className="max-w-md mx-auto grid gap-4">
            <h1 className="text-2xl font-semibold">Log in / Sign up</h1>
            <input className="border rounded-xl px-3 py-2" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button onClick={signInWithEmail} className="px-4 py-2 rounded-xl bg-black text-white">Email magic link</button>
            <button onClick={signInWithGoogle} className="px-4 py-2 rounded-xl border">Continue with Google</button>
        </div>
    )
}