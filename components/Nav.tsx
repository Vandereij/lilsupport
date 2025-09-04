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

  const handleSignOut = async () => {
    const s = supabaseBrowser()
    await s.auth.signOut()
    window.location.href = "/" // redirect after signout
  }

  const linkClasses =
    "relative px-2 py-1 text-brand-dark hover:text-brand transition font-medium after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-brand-dark after:to-brand after:rounded-full hover:after:w-full after:transition-all after:duration-300"

  return (
    <nav className="sticky top-0 z-50 bg-brand-light/90 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" width={120} height={30} alt="LilSupport" />
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="/u/demo" className={linkClasses}>
            Demo Profile
          </Link>
          {user ? (
            <>
              <Link href="/wallet" className={linkClasses}>
                Wallet
              </Link>
              <Link href="/dashboard" className={linkClasses}>
                Dashboard
              </Link>
              <Link href="/profile/edit" className={linkClasses}>
                Edit Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full bg-brand-dark text-white font-medium hover:bg-brand transition"
              >
                Sign off
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-full bg-brand-dark text-white font-medium hover:bg-brand transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
