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
    const path = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
    const arrayBuffer = await file.arrayBuffer()
    const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(arrayBuffer), {
      upsert: true,
      contentType: file.type
    })
    if (error) { console.error('Avatar upload failed:', error.message); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = data.publicUrl
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (userId) await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="card space-y-4">
            <div>
              <label className="block font-medium mb-1">Username</label>
              <input className="input w-full" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourhandle" />
            </div>
            <div>
              <label className="block font-medium mb-1">Display name</label>
              <input className="input w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
            </div>
            <div>
              <label className="block font-medium mb-1">Bio</label>
              <textarea className="input w-full" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short description" />
            </div>
            <button className="btn" onClick={save}>Save</button>
          </div>

          {/* Right Column: Avatar & QR */}
          <div className="card space-y-4">
            <div>
              <label className="block font-medium mb-2">Avatar</label>
              <input
                type="file"
                accept="image/*"
                className="mb-4"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = await uploadAvatar(file)
                    if (url) setAvatarUrl(url)
                  }
                }}
              />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="avatar thumbnail"
                  className="w-32 h-32 rounded-xl object-cover cursor-pointer shadow hover:scale-105 transition-transform"
                  onClick={() => setIsModalOpen(true)}
                />
              )}
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                onClick={() => setIsModalOpen(false)}
              >
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-32 h-32 rounded-xl object-cover cursor-pointer shadow hover:scale-105 transition-transform"
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

            {/* QR Code */}
            <div className="space-y-2">
              <button className="btn-secondary" onClick={regenerateQR}>Regenerate QR</button>
              {qrUrl && (
                <div className="mt-2 flex flex-col items-center">
                  <p className="text-gray-700 font-medium">QR code:</p>
                  <img src={qrUrl} alt="qr" className="w-40 h-40" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
