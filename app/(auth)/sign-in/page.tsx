'use client';
import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignIn() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const router = useRouter();
  const redirect = useSearchParams().get('redirect') || '/dashboard';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess) router.replace(redirect);
    });
    return () => subscription.unsubscribe();
  }, [router, redirect, supabase]);

  return (
    <div className="max-w-md mx-auto grid gap-4">
      <h2 className="text-2xl font-semibold">Sign in / Sign up</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
          alert('Check your email for the magic link');
        }}
        className="grid gap-3"
      >
        <input className="border p-2 rounded" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="bg-black text-white rounded p-2">Send magic link</button>
      </form>
      <button
        className="border p-2 rounded"
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + redirect } })}
      >Continue with Google</button>
    </div>
  );
}
