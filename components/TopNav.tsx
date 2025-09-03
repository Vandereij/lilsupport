'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function TopNav() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)); }, [supabase]);
  return (
    <nav className="w-full border-b">
      <div className="max-w-5xl mx-auto p-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">LilSupport</Link>
        <div className="flex gap-3 items-center">
          <Link href="/wallet" className="text-sm">Wallet</Link>
          <Link href="/dashboard" className="text-sm">Dashboard</Link>
          {email ? (
            <button className="text-sm" onClick={() => supabase.auth.signOut()}>Sign out</button>
          ) : (
            <Link href="/(auth)/sign-in" className="text-sm">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
