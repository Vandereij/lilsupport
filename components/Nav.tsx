import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function Nav() {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = s.auth.onAuthStateChange((_e, sess) => setUser(sess?.user ?? null))
    return () => { sub?.subscription.unsubscribe() }
  }, [])

  return (
    <nav className="w-full flex items-center justify-between p-4 border-b">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" width={120} height={30} alt="LilSupport" />
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/u/demo" className="underline">Demo Profile</Link>
        <Link href="/wallet" className="underline">Wallet</Link>
        {user ? (
          <>
            <Link href="/dashboard" className="underline">Dashboard</Link>
            <Link href="/profile/edit" className="underline">Edit Profile</Link>
          </>
        ) : (
          <Link href="/#auth" className="px-3 py-1 rounded bg-black text-white">Sign in</Link>
        )}
      </div>
    </nav>
  )
}
