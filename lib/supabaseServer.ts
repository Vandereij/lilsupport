import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSupabaseClient } from '@supabase/ssr'


export function createServerClient(req: NextRequest) {
    const res = NextResponse.next({ request: { headers: req.headers } })
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name) => req.cookies.get(name)?.value,
                set: (name, value, options) => {
                    res.cookies.set({ name, value, ...options })
                },
                remove: (name, options) => {
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )
    return { supabase, response: res }
}