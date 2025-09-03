import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = { matcher: ['/dashboard', '/profile/edit', '/wallet'] };

export async function middleware(req: NextRequest) {
  const hasSupabase = req.cookies.get('sb-access-token');
  if (!hasSupabase) {
    const url = new URL('/(auth)/sign-in', req.url);
    url.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
