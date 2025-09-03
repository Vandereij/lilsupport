import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Nav from '@/components/Nav'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseClient'

type Props = {
  profile: any | null
}

export default function PublicProfile({ profile }: Props) {
  if (!profile) return (
    <>
      <Nav />
      <div className="container"><div className="card">Profile not found.</div></div>
    </>
  )

  const onetime = async () => {
    const res = await fetch('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: profile.username, mode:'payment' }) })
    const { url } = await res.json()
    window.location.href = url
  }

  const monthly = async () => {
    const res = await fetch('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: profile.username, mode:'subscription' }) })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <>
      <Head><title>{profile.display_name} — LilSupport</title></Head>
      <Nav />
      <main className="container">
        <div className="card" style={{display:'flex', gap:20, alignItems:'center'}}>
          <Image src={profile.avatar_url || '/logo.svg'} width={96} height={96} alt="avatar" style={{borderRadius:12}} />
          <div>
            <h2 style={{margin:'4px 0'}}>{profile.display_name || profile.username}</h2>
            <p>@{profile.username}</p>
            <p>{profile.bio}</p>
            <div className="grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))', maxWidth:420}}>
              <button className="btn" onClick={onetime}>Tip once</button>
              <button className="btn secondary" onClick={monthly}>$4/mo</button>
            </div>
          </div>
        </div>
        <p>Are you {profile.display_name || profile.username}? <Link href="/dashboard">Go to your dashboard</Link></p>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const username = ctx.params?.username as string
  const s = supabaseServer()
  const { data: profile } = await s.from('profiles').select('*').eq('username', username).single()
  return { props: { profile: profile ?? null } }
}
