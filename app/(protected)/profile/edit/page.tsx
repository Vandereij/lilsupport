'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import { uploadAvatar } from './actions';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditProfile() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string>('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  setLoading(true);
  setError(null);

  const fd = new FormData();
  fd.append('avatar', file);

  try {
    const s = supabaseBrowser();
    const { data: sess } = await s.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    const result = await res.json();
    if (res.ok && result.ok) {
      setAvatarUrl(result.avatar_url ?? null);
    } else {
      setError(result.error ?? 'Upload failed');
    }
  } catch (err: any) {
    setError(err.message ?? 'Unexpected error');
  } finally {
    setLoading(false);
  }
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
        <>
            <h1 className="text-3xl font-heading mb-10">Edit Profile</h1>

            {/* Profile Info */}
            <section className="space-y-6 border-b border-brand-muted pb-8 mb-10">
                <h2 className="text-xl font-heading">Profile Info</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input className='form-field ring-brand' value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourhandle" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Display name</label>
                        <input className='form-field ring-brand' value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <textarea className='form-field ring-brand' value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short description" />
                    </div>
                    <button className="btn-primary ring-brand" onClick={save}>Save</button>
                </div>
            </section>

            {/* Avatar & QR */}
            <section className="space-y-6">
                <h2 className="text-xl font-heading">Avatar & QR</h2>
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={loading}
                    />
                    {loading && <p>Uploading...</p>}
                    {error && <p className="text-red-600">{error}</p>}
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
                                <img src={avatarUrl ?? undefined} alt="avatar full" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" />
                                <button className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm" onClick={() => setIsModalOpen(false)}>✕</button>
                            </div>
                        </div>
                    )}
                    <div>
                        <button className="btn-primary" onClick={regenerateQR}>Regenerate QR</button>
                        {qrUrl && (
                            <div className="mt-4">
                                <p className="text-sm mb-2">QR code:</p>
                                <div className="sheet p-6">
                                    <div className="bg-white rounded-[12px] p-4 mx-auto w-fit">
                                        <img src={qrUrl} alt="qr" className="w-40" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section >
        </>
    )
}
