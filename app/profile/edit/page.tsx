import Image from 'next/image'
import { createServerClient } from '@/lib/supabaseRsc'
import { SaveProfileForm } from '@/components/SaveProfileForm'


export default async function EditProfile() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Log in first.</div>
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return (
        <div className="grid gap-6 max-w-xl">
            <h1 className="text-2xl font-semibold">Edit profile</h1>
            {profile?.avatar_url && <Image src={profile.avatar_url} alt="avatar" width={96} height={96} className="rounded-2xl" />}
            <SaveProfileForm profile={profile} />
        </div>
    )
}