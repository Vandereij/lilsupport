import Link from 'next/link'

export default function Page() {
    return (
        <main className="grid gap-8 place-items-center py-24">
            <h1 className="text-5xl font-bold">LilSupport</h1>
            <p className="text-lg text-neutral-600">Tiny tips that make a big difference.</p>
            <div className="flex gap-3">
                <Link href="/auth/login" className="px-4 py-2 rounded-xl bg-black text-white">Get Started</Link>
                <Link href="/u/demo" className="px-4 py-2 rounded-xl border">See a profile</Link>
            </div>
        </main>
    )
}