'use server'
import { createServerClient } from '@/lib/supabaseRsc'
import { createServerService } from '@/lib/supabaseService'
import QRCode from 'qrcode'


export async function saveProfile(input: { username: string; display_name?: string; bio?: string }) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    await supabase.from('profiles').upsert({ id: user.id, username: input.username, display_name: input.display_name, bio: input.bio })
}


export async function regenerateQR() {
    const supabase = createServerClient()
    const svc = createServerService()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    const origin = process.env.NEXT_PUBLIC_SITE_URL!
    const { data: { username } } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    const url = `${origin}/u/${username}`
    const png = await QRCode.toBuffer(url, { type: 'png', width: 512, margin: 1 })
    const path = `qr/${user.id}.png`
    const { data, error } = await svc.storage.from('public').upload(path, png, { contentType: 'image/png', upsert: true })
    if (error) throw error
    const { data: pub } = svc.storage.from('public').getPublicUrl(path)
    await svc.from('profiles').update({ qr_code_url: pub.publicUrl }).eq('id', user.id)
}