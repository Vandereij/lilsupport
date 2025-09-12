"use client";

import { useEffect, useState } from "react";

export default function PayoutsPanel({ userId }: { userId: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/stripe/account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setStatus(data);
      setLoading(false);
    })().catch((e) => {
      setErr(e.message);
      setLoading(false);
    });
  }, [userId]);

  const startOnboarding = async () => {
    const res = await fetch("/api/stripe/connect-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Could not start onboarding");
    window.location.href = data.url;
  };

  const openExpress = async () => {
    const res = await fetch("/api/stripe/express-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Could not open Stripe dashboard");
    window.location.href = data.url;
  };

  if (loading) return <div className="rounded-xl border p-4">Checking payout status…</div>;
  if (err) return <div className="rounded-xl border p-4 text-red-500">{err}</div>;

  if (!status?.onboarded) {
    return (
      <div className="rounded-xl border p-4 space-y-2">
        <h3 className="font-medium">Enable payouts</h3>
        <p className="text-sm text-neutral-600">
          Connect your Stripe account to receive tips and subscriptions.
        </p>
        <button onClick={startOnboarding} className="rounded-xl bg-black text-white px-4 py-2">
          Start Stripe onboarding
        </button>
        {status?.currentlyDue?.length ? (
          <p className="text-xs text-neutral-500">
            Required info: {status.currentlyDue.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <h3 className="font-medium">Payouts active</h3>
      <p className="text-sm text-neutral-600">Manage bank details and payouts in Stripe.</p>
      <button onClick={openExpress} className="rounded-xl bg-black text-white px-4 py-2">
        Open Stripe dashboard
      </button>
    </div>
  );
}
