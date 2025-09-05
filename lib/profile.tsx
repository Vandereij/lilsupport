// lib/profile.ts
import { supabaseBrowser } from '@/lib/supabaseClient'

export async function getMyProfile() {
  const s = supabaseBrowser()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data } = await s
    .from('profiles')
    .select('id, username, email')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile: data }
}
