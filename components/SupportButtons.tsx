'use client'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)


export function SupportButtons({ recipientId, username }: { recipientId: string, username: string }) {
    const [loading, setLoading] = useState<'one' | 'sub' | null>(null)


    const go = async (type: 'one_time' | 'subscription') => {
        setLoading(type === 'one_time' ? 'one' : 'sub')
        const res = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ recipientId, type }) })
        const { url } = await res.json()
        const stripe = await stripePromise
        if (stripe && url) {
            location.href = url
        } else {
            setLoading(null)
            alert('Unable to start checkout')
        }
    }


    return (
        <div className="flex gap-3">
            <button onClick={() => go('one_time')} disabled={loading !== null} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60">Tip $4</button>
            <button onClick={() => go('subscription')} disabled={loading !== null} className="px-4 py-2 rounded-xl border">$4 / month</button>
        </div>
    )
}