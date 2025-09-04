import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditProfile() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const s = supabaseBrowser()
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/'; return }
      setUser(data.user)
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
    await s.from('profiles').upsert({ id: user.id, username, display_name: displayName, bio, avatar_url: avatarUrl })
    alert('Saved!')
  }

  async function uploadAvatar(file: File) {
    if (!file) return

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'avatars'
    const path = `${Date.now()}-${file.name.replace(/\s/g, '-')}` // remove spaces

    // Convert File → ArrayBuffer → Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(arrayBuffer), {
      upsert: true,
      contentType: file.type
    })

    if (error) {
      console.error('Avatar upload failed:', error.message)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = data.publicUrl

    // Save URL to profile
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (userId) {
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    }

    return publicUrl
  }

  const regenerateQR = async () => {
    const res = await fetch('/api/profile/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) })
    const { url } = await res.json()
    setQrUrl(url)
  }

  return (
    <>
      <Nav />
      <main className="container">
        <h1>Edit Profile</h1>
        <div className="grid grid-2">
          <div className="card">
            <label>Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourhandle" />
            <label>Display name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
            <label>Bio</label>
            <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short description" />
            <button className="btn" onClick={save}>Save</button>
          </div>
          <div className="card">
            <label>Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const url = await uploadAvatar(file)
                  if (url) {
                    setAvatarUrl(url) // update state so UI refreshes
                  }
                }
              }}
            />

            {avatarUrl && (
              <img
                src={`${avatarUrl}?width=200&height=200&resize=cover`}
                alt="avatar thumbnail"
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(true)}
              />
            )}
            {isModalOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                onClick={() => setIsModalOpen(false)} // close when clicking backdrop
              >
                <div className="relative">
                  <img
                    src={avatarUrl} // full-size original
                    alt="avatar full"
                    className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={regenerateQR}>Regenerate QR</button>
              {qrUrl && <div><p>QR code:</p><img src={qrUrl} alt="qr" style={{ width: 160 }} /></div>}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
