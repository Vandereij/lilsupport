'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function Nav() {
  const [signedIn, setSignedIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  // Track sign-in/out (boolean only)
  useEffect(() => {
    const s = supabaseBrowser()

      ; (async () => {
        const { data: { user } } = await s.auth.getUser()
        setSignedIn(!!user)
      })()

    const { data: { subscription } } = s.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user)
    })

    return () => {
      try { subscription.unsubscribe() } catch { }
    }
  }, [])

  // When signed in, fetch username (deferred; won’t block first paint)
  useEffect(() => {
    if (!signedIn) { setUsername(null); return }

    let alive = true
    const s = supabaseBrowser()

      ; (async () => {
        try {
          const { data: { user } } = await s.auth.getUser()
          if (!alive || !user) { setUsername(null); return }

          const { data, error } = await s
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle()

          if (!alive) return
          if (error) {
            console.warn('profiles username fetch:', error.message)
            setUsername(null)
          } else {
            setUsername(data?.username ?? null)
          }
        } catch (err) {
          console.warn('username fetch failed:', err)
          setUsername(null)
        }
      })()

    return () => { alive = false }
  }, [signedIn])

  const handleSignOut = async () => {
    try {
      setBusy(true)
      const s = supabaseBrowser()
      await s.auth.signOut({ scope: 'global' })
    } catch (err) {
      console.error('signOut error:', err)
    } finally {
      window.location.replace('/') // force clean state + redirect
    }
  }

  const linkClasses =
    "relative px-2 py-1 text-brand-dark hover:text-brand transition font-medium after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-brand-dark after:to-brand after:rounded-full hover:after:w-full after:transition-all after:duration-300"

  return (
    <nav className="sticky top-0 z-50 bg-brand-light/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between md:px8 px-6 py-3">

        {/* Links */}
        <div className="flex items-center gap-6">
          {/* Signed-out → Demo; Signed-in with username → My page */}
          {signedIn && username ? (
            <Link href={`/u/${encodeURIComponent(username)}`} className={linkClasses}>
              My page
            </Link>
          ) : (
            !signedIn && (
              <Link href="/u/demo" className={linkClasses}>
                Demo Profile
              </Link>
            )
          )}

          {signedIn ? (
            <>
              <Link href="/wallet" className={linkClasses}>Wallet</Link>
              <Link href="/dashboard" className={linkClasses}>Dashboard</Link>
              <Link href="/profile/edit" className={linkClasses}>Edit Profile</Link>
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="px-4 py-2 rounded-full bg-brand-dark text-white font-medium hover:bg-brand transition disabled:opacity-60"
              >
                {busy ? 'Signing out…' : 'Sign off'}
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
