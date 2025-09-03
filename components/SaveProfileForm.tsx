'use client'
import { useState, useTransition } from 'react'
import { regenerateQR, saveProfile } from '@/lib/serverActions'


export function SaveProfileForm({ profile }: { profile: any }) {
    const [form, setForm] = useState({
        username: profile?.username || '',
        display_name: profile?.display_name || '',
        bio: profile?.bio || ''
    })
    const [pending, start] = useTransition()


    return (
        <form action={() => start(async () => { await saveProfile(form); await regenerateQR() })()} className="grid gap-3">
            <label className="grid gap-1">
                <span className="text-sm">Handle (unique)</span>
                <input className="border rounded-xl px-3 py-2" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </label>
            <label className="grid gap-1">
                <span className="text-sm">Display name</span>
                <input className="border rounded-xl px-3 py-2" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </label>
            <label className="grid gap-1">
                <span className="text-sm">Bio</span>
                <textarea className="border rounded-xl px-3 py-2" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </label>
            <button disabled={pending} className="px-4 py-2 rounded-xl bg-black text-white">Save & Regenerate QR</button>
        </form>
    )
}