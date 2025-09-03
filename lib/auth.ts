import { supabaseBrowser } from '@/lib/supabaseClient'

export async function signInWithGoogle() {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
  if (error) throw error
  return data
}

export async function signInWithEmail(email: string) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` } })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = supabaseBrowser()
  await supabase.auth.signOut()
}
