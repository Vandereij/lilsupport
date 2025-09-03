import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServerAdmin } from '@/lib/supabaseAdmin'
import { SupportButtons } from '@/components/SupportButtons'


export default async function Profile({ params }: { params: { username: string } }) {
    const supabase = createServerAdmin()
    const { data: profile } = await supabase.from('profiles').select('*').eq('username', params.username).single()
    if (!profile) return notFound()


    return (
        <div className="mx-auto max-w-2xl grid gap-6">
            <div className="flex items-center gap-4">
                {profile.avatar_url && (
                    <Image src={profile.avatar_url} alt={profile.display_name} width={96} height={96} className="rounded-2xl" />
                )}
                <div>
                    <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                    <p className="text-neutral-600">@{profile.username}</p>
                </div>
            </div>
            {profile.bio && <p className="text-lg">{profile.bio}</p>}
            <SupportButtons recipientId={profile.id} username={profile.username} />
            {profile.qr_code_url && (
                <div>
                    <p className="text-sm text-neutral-500 mb-2">Scan to open this profile</p>
                    <Image src={profile.qr_code_url} alt="QR code" width={160} height={160} />
                </div>
            )}
        </div>
    )
}