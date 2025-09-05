'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditProfile() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string>('')
    const [qrUrl, setQrUrl] = useState<string>('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const s = supabaseBrowser()
        s.auth.getUser().then(async ({ data }) => {
            if (!data.user) return
            const { data: p } = await s.from('profiles').select('*').eq('id', data.user.id).single()
            if (p) {
                setUsername(p.username || '')
                setDisplayName(p.display_name || '')
                setBio(p.bio || '')
                setAvatarUrl(p.avatar_url || '')
                setQrUrl(p.qr_code_url || '')
            }
        })
    }, [])

    const save = async () => {
        const s = supabaseBrowser()
        const { data: u } = await s.auth.getUser()
        if (!u.user) return
        await s.from('profiles').upsert({ id: u.user.id, username, display_name: displayName, bio, avatar_url: avatarUrl })
        alert('Saved!')
    }

    async function uploadAvatar(file: File) {
        if (!file) return
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'avatars'
        const path = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
        const arrayBuffer = await file.arrayBuffer()
        const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(arrayBuffer), {
            upsert: true, contentType: file.type
        })
        if (error) { console.error('Avatar upload failed:', error.message); return }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        const publicUrl = data.publicUrl
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (userId) await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
        setAvatarUrl(publicUrl)
    }

    const regenerateQR = async () => {
        const handle = (username || '').trim().replace(/^@/, '')
        if (!handle) {
            alert('Please set your username first, then regenerate the QR.')
            return
        }

        const s = supabaseBrowser()
        const { data: sess } = await s.auth.getSession()
        const token = sess?.session?.access_token

        const res = await fetch('/api/profile/qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ username: handle }),
        })

        const payload = await res.json()
        if (!res.ok) {
            console.error('QR error:', payload.error)
            alert('QR generation failed: ' + payload.error)
            return
        }

        setQrUrl(payload.url)
    }



    return (
        <main className="max-w-3xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-heading mb-10">Edit Profile</h1>

            {/* Profile Info */}
            <section className="space-y-6 border-b border-brand-muted pb-8 mb-10">
                <h2 className="text-xl font-heading">Profile Info</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourhandle" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Display name</label>
                        <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short description" />
                    </div>
                    <button className="btn" onClick={save}>Save</button>
                </div>
            </section>

            {/* Avatar & QR */}
            <section className="space-y-6">
                <h2 className="text-xl font-heading">Avatar & QR</h2>
                <div className="space-y-4">
                    <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) await uploadAvatar(file)
                    }} />

                    {avatarUrl && (
                        <img
                            src={avatarUrl}
                            alt="avatar thumbnail"
                            className="w-28 h-28 rounded-lg object-cover cursor-pointer border border-brand-muted"
                            onClick={() => setIsModalOpen(true)}
                        />
                    )}

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
                            <div className="relative">
                                <img src={avatarUrl} alt="avatar full" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" />
                                <button className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm" onClick={() => setIsModalOpen(false)}>✕</button>
                            </div>
                        </div>
                    )}

                    <div>
                        <button className="btn-secondary" onClick={regenerateQR}>Regenerate QR</button>
                        {qrUrl && (
                            <div className="mt-4">
                                <p className="text-sm mb-2">QR code:</p>
                                <img src={qrUrl} alt="qr" className="w-40" />
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
