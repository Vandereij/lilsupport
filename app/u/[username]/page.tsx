'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (!username) return
    const s = supabaseBrowser()
    s.from('profiles').select('*').eq('username', username).single().then(({ data }) => setProfile(data))
  }, [username])

  if (!profile) return null

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-4">
        {profile.avatar_url && <img src={profile.avatar_url} className="w-20 h-20 rounded-xl object-cover border border-brand-muted" alt={profile.display_name} />}
        <div>
          <h1 className="text-3xl font-heading">@{profile.username}</h1>
          <p className="text-brand-dark/80">{profile.display_name}</p>
        </div>
      </div>

      {profile.bio && <p className="text-brand-dark/80">{profile.bio}</p>}

      <div className="flex gap-3">
        <Link href={`/api/stripe/checkout?type=one_time&recipient=${profile.id}`} className="btn">Tip once</Link>
        <Link href={`/api/stripe/checkout?type=subscription&recipient=${profile.id}`} className="btn-secondary">Subscribe $4/mo</Link>
      </div>
    </main>
  )
}
