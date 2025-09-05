'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import type { Profile } from '@/types/database'
import Nav from '@/components/Nav'

export default function PublicProfile() {
    const params = useParams<{ username: string }>()
    // Ensure we have a clean string (and not null/undefined)
    const raw = params?.username ?? ''
    const username = raw ? decodeURIComponent(raw) : ''

    const [profile, setProfile] = useState<Profile | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!username) return

        const s = supabaseBrowser()
            ; (async () => {
                // 1) (Dev) check how many rows match — helpful diagnostics
                if (process.env.NODE_ENV !== 'production') {
                    const { count, error: countErr } = await s
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .eq('username', username)
                    if (!countErr && (count ?? 0) !== 1) {
                        console.warn(`profiles matches for "${username}":`, count)
                    }
                }

                // 2) Fetch exactly one row without throwing if more/less exist
                const { data, error } = await s
                    .from('profiles')
                    .select('id, username, display_name, bio, avatar_url, qr_code_url, stripe_account_id')
                    .eq('username', username)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle<Profile>() // null if none, no throw if multiple

                if (error) {
                    console.error('Profile fetch error:', error.message)
                    setErrorMsg(error.message)
                    setProfile(null)
                    return
                }

                if (!data) {
                    setErrorMsg(null)
                    setProfile(null)
                    return
                }

                setErrorMsg(null)
                setProfile(data)
            })()
    }, [username])

    if (errorMsg) {
        return <main className="max-w-3xl mx-auto px-6 py-12">Error: {errorMsg}</main>
    }
    if (!profile) {
        return <main className="max-w-3xl mx-auto px-6 py-12">Profile not found.</main>
    }

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
                <div className="flex items-center gap-4">
                    {profile.avatar_url && (
                        <img
                            src={profile.avatar_url}
                            className="w-20 h-20 rounded-xl object-cover border border-brand-muted"
                            alt={profile.display_name ?? profile.username ?? 'Profile avatar'}
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-heading">@{profile.username ?? 'unknown'}</h1>
                        {profile.display_name && <p className="text-brand-dark/80">{profile.display_name}</p>}
                    </div>
                </div>

                {profile.bio && <p className="text-brand-dark/80">{profile.bio}</p>}

                {/* Your CTAs */}
                {/* ... */}
            </main>
        </>
    )
}
