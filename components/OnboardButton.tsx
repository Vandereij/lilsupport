'use client'


export function OnboardButton({ stripeAccountId }: { stripeAccountId?: string | null }) {
    const click = async () => {
        const res = await fetch('/api/stripe/connect', { method: 'POST', body: JSON.stringify({ userId: (window as any).supabaseUserId }) })
        const { url } = await res.json()
        location.href = url
    }
    return (
        <button onClick={click} className="px-4 py-2 rounded-xl bg-black text-white">
            {stripeAccountId ? 'Manage payouts' : 'Set up payouts'}
        </button>
    )
}