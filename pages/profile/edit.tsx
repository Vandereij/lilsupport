import Nav from '@/components/Nav'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function EditProfile() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')

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

  const onAvatarChange = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    const s = supabaseBrowser()
    const { data: { user } } = await s.auth.getUser()
    const path = `${user?.id}/avatar-${Date.now()}.png`
    await s.storage.from(process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.SUPABASE_STORAGE_BUCKET as string : 'avatars').upload(path, file, { upsert: true })
    const { data } = s.storage.from(process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.SUPABASE_STORAGE_BUCKET as string : 'avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
  }

  const regenerateQR = async () => {
    const res = await fetch('/api/profile/qr', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) })
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
            <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="yourhandle" />
            <label>Display name</label>
            <input className="input" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Your Name" />
            <label>Bio</label>
            <textarea className="input" value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Short description" />
            <button className="btn" onClick={save}>Save</button>
          </div>
          <div className="card">
            <label>Avatar</label>
            <input type="file" onChange={onAvatarChange} />
            {avatarUrl && <img src={avatarUrl} alt="avatar" style={{width:120, height:120, borderRadius:12, objectFit:'cover'}} />}
            <div style={{marginTop:12}}>
              <button className="btn secondary" onClick={regenerateQR}>Regenerate QR</button>
              {qrUrl && <div><p>QR code:</p><img src={qrUrl} alt="qr" style={{width:160}}/></div>}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
