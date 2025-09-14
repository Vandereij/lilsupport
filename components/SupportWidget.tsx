// components/SupportWidget.tsx
"use client";

import { useState } from "react";

export default function SupportWidget({
  username,
  supporterId,
}: {
  username: string;
  supporterId?: string | null;
}) {
  const [preset, setPreset] = useState<"3" | "5" | "10" | null>(null);
  const [custom, setCustom] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setErr(null);
    try {
      const payload: any = {
        recipientUsername: username,
        supporterId: supporterId ?? null,
        message,
      };

      if (preset) {
        payload.preset = preset;
      } else if (custom) {
        const val = Math.round(parseFloat(custom) * 100);
        if (!Number.isFinite(val) || val < 100) throw new Error("Enter a valid amount");
        payload.amountPence = val; // minor units
      } else {
        throw new Error("Choose an amount");
      }

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        throw new Error(data?.error || "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border p-4 shadow-sm space-y-4">
      <div className="flex gap-2">
        {(["3", "5", "10"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setPreset(v);
              setCustom("");
            }}
            className={`flex-1 rounded-xl border px-3 py-2 ${preset === v ? "bg-black text-white" : "bg-white"
              }`}
          >
            ${v}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">or custom</span>
        <input
          inputMode="decimal"
          placeholder="e.g. 7.50"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setPreset(null);
          }}
          className="flex-1 rounded-xl border px-3 py-2"
        />
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={140}
        placeholder="Say thanks (optional)"
        className="w-full rounded-xl border px-3 py-2"
      />

      <button
        onClick={startCheckout}
        disabled={loading}
        className="w-full rounded-2xl bg-black text-white px-4 py-3 disabled:opacity-60"
      >
        {loading ? "Opening secure checkout…" : `Support @${username}`}
      </button>

      {err && <p className="text-red-500 text-sm">{err}</p>}
      <p className="text-xs text-neutral-500 text-center">
        No app needed • Secure checkout by Stripe
      </p>
    </div>
  );
}
