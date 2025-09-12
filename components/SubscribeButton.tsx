"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function SubscribeButton({
  username,
  label = "Subscribe $4/mo",
}: {
  username: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setErr(null);
    try {
      // Try to get the signed-in viewer; ok if null (guests)
      let supporterId: string | null = null;
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getUser();
        supporterId = data.user?.id ?? null;
      } catch {
        supporterId = null;
      }

      const res = await fetch("/api/checkout/subscription", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipientUsername: username, supporterId: null }),
});

const ct = res.headers.get("content-type") || "";
let data: any = null;
if (ct.includes("application/json")) {
  data = await res.json();
} else {
  const text = await res.text();
  throw new Error(`Unexpected non-JSON response (${res.status}): ${text.slice(0, 200)}`);
}

if (!res.ok || !data?.url) {
  throw new Error(data?.error || "Failed to start subscription");
}

window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-2xl bg-black text-white px-4 py-3 disabled:opacity-60"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <p className="text-xs text-neutral-500 text-center">
        No app needed • Secure checkout by Stripe
      </p>
    </div>
  );
}
