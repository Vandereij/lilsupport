'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'


export function Providers() {
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            ; (window as any).supabaseUserId = data.user?.id
        })
    }, [])
    return null
}