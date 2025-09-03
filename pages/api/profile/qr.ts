// pages/api/profile/qr.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  try {
    const { username } = req.body as { username: string }
    if (!username) return res.status(400).json({ error: 'username required' })

    const site = process.env.NEXT_PUBLIC_SITE_URL
    if (!site) return res.status(500).json({ error: 'NEXT_PUBLIC_SITE_URL not set' })

    // Generate QR as PNG buffer
    const qrDataUrl = await QRCode.toDataURL(`${site}/u/${username}`)
    const base64Data = qrDataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    const bucket = process.env.SUPABASE_QR_BUCKET || 'qrcodes'
    const path = `${username}/qr-${Date.now()}.png`

    // Upload PNG to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: 'image/png',
      upsert: true
    })
    if (uploadError) return res.status(500).json({ error: uploadError.message })

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (!data.publicUrl) return res.status(500).json({ error: 'Failed to get public URL' })

    // Update profile table (optional, can skip for testing)
    await supabase.from('profiles').update({ qr_code_url: data.publicUrl }).eq('username', username)

    return res.status(200).json({ url: data.publicUrl })
  } catch (err: any) {
    console.error('QR generation error:', err)
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
