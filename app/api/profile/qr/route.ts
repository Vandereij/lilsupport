// app/api/profile/qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

export const runtime = 'nodejs' // ✅ needed for QRCode.toBuffer (Buffer)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const QR_BUCKET = process.env.SUPABASE_QR_BUCKET || 'qrcodes'
const PUBLIC_SITE = process.env.NEXT_PUBLIC_SITE_URL // e.g. https://lilsupport.com

// Use service role for storage writes (server only)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false },
})

export async function POST(req: NextRequest) {
  try {
    // 1) Validate JSON body
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    const username = typeof body?.username === 'string' ? body.username.trim() : ''
    if (!username) {
      return NextResponse.json({ error: 'Missing "username" in body' }, { status: 400 })
    }

    // 2) Figure out a base URL
    // Prefer NEXT_PUBLIC_SITE_URL in prod; fallback to request origin
    const origin = PUBLIC_SITE || req.headers.get('origin') || ''
    if (!origin) {
      return NextResponse.json({ error: 'Missing site origin (set NEXT_PUBLIC_SITE_URL)' }, { status: 400 })
    }

    // 3) Make QR payload → /u/[username]
    const profileUrl = `${origin.replace(/\/+$/, '')}/u/${encodeURIComponent(username)}`
    const pngBuffer = await QRCode.toBuffer(profileUrl, {
      type: 'png',
      width: 512,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFFFF' },
    })

    // 4) Upload to Storage (ensure bucket exists & is readable)
    if (!SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 400 })
    }

    const path = `qr-${encodeURIComponent(username)}-${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage
      .from(QR_BUCKET)
      .upload(path, pngBuffer, { contentType: 'image/png', upsert: true })

    if (uploadErr) {
      console.error('[QR upload error]', uploadErr)
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 400 })
    }

    const { data: urlData } = supabase.storage.from(QR_BUCKET).getPublicUrl(path)
    const qrUrl = urlData.publicUrl

    // 5) (Optional) Update caller profile if we have a bearer token
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.slice(7)
      const { data: userInfo, error: userErr } = await supabase.auth.getUser(jwt)
      if (!userErr && userInfo?.user?.id) {
        await supabase.from('profiles').update({ qr_code_url: qrUrl }).eq('id', userInfo.user.id)
      }
    }

    return NextResponse.json({ url: qrUrl })
  } catch (e: any) {
    console.error('[QR route fatal]', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
