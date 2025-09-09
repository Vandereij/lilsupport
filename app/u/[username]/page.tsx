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
            {/* Top grid: Avatar | QR */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Left: Avatar + text + CTA */}
                <div className="flex flex-col gap-6">
                    {profile.avatar_url && (
                        <img
                            src={profile.avatar_url}
                            className="avatar-xl"
                            alt={profile.display_name ?? profile.username ?? 'Profile avatar'}
                        />
                    )}

                    <div>
                        {profile.display_name && <h1>{profile.display_name}</h1>}
                        <div className="lead muted">@{profile.username ?? 'unknown'}</div>
                        {profile.bio && <p className="mt-3">{profile.bio}</p>}
                    </div>

                    <button className="btn-primary ring-brand w-full md:w-auto">
                        Support {profile.display_name ?? profile.username ?? 'User'}
                        <span className="block text-[14px] font-semibold opacity-80"> $4/mo</span>
                    </button>
                </div>

                {/* Right: QR panel + recent support */}
                <div className="sheet p-4 md:p-6 flex flex-col justify-around">
                    <div className="mx-auto">
                        <div className="qr-frame">
                            {/* your QR image/canvas here */}
                            {profile.qr_code_url && (
                                <img src={profile.qr_code_url} alt="Support QR" className="w-56 h-56 object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
