// components/GetPayoutsButton.tsx
"use client";

import { useState } from "react";

export default function GetPayoutsButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startOnboarding = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/stripe/connect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start onboarding");
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={startOnboarding}
        disabled={loading}
        className="rounded-2xl px-4 py-2 bg-black text-white disabled:opacity-60"
      >
        {loading ? "Redirecting…" : "Enable payouts with Stripe"}
      </button>
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <p className="text-xs text-neutral-500">
        You’ll be redirected to Stripe to verify and connect your account.
      </p>
    </div>
  );
}
