import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'


export async function GET(req: NextRequest) {
const { supabase, response } = createServerClient(req)
await supabase.auth.exchangeCodeForSession(req.nextUrl)
return response
}