'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import Nav from '@/components/Nav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/signin?next=' + encodeURIComponent(pathname))
      setReady(true)
    })
    const { data: sub } = s.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) router.replace('/signin?next=' + encodeURIComponent(pathname))
    })
    return () => { sub?.subscription?.unsubscribe() }
  }, [router, pathname])

  if (!ready) return null
  return (
    <>
      <Nav />
      {children}
    </>
  )
}
