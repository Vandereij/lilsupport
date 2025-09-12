"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

// Small inline helpers
const MAX_BIO = 240;
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
function normalizeHandle(v: string) {
  return v.replace(/^@/, "").trim().toLowerCase();
}

type InitialSnapshot = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  qr_code_url: string;
};

export default function EditProfilePolished() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  // Shared modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  function openModal(src?: string | null, alt = "") {
    if (!src) return;
    setModalSrc(src);
    setModalAlt(alt);
    setModalOpen(true);
  }

  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep an initial snapshot to compute diffs
  const initialRef = useRef<InitialSnapshot>({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: null,
    qr_code_url: "",
  });

  // Load or create profile row
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = supabaseBrowser();
      const { data } = await s.auth.getUser();
      if (!data.user) return;
      const uid = data.user.id;

      const { data: p, error: perr } = await s
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      let profile = p;
      if (!perr && !profile) {
        // First-time: create minimal row
        const { data: inserted, error: insErr } = await s
          .from("profiles")
          .insert({ id: uid })
          .select("*")
          .maybeSingle();
        if (insErr) return;
        profile = inserted ?? null;
      }

      if (!cancelled && profile) {
        setUsername(profile.username || "");
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url ?? null); // <- keep nulls as null
        setQrUrl(profile.qr_code_url || "");

        initialRef.current = {
          username: profile.username || "",
          display_name: profile.display_name || "",
          bio: profile.bio || "",
          avatar_url: profile.avatar_url ?? null,
          qr_code_url: profile.qr_code_url || "",
        };
        setDirty(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived UI state
  const normalizedHandle = useMemo(() => normalizeHandle(username), [username]);

  const usernameError = useMemo(() => {
    const v = normalizedHandle;
    if (!v) return null;
    if (!/^[a-z0-9_.]{3,20}$/i.test(v)) return "3–20 chars, letters/numbers/._ only";
    return null;
  }, [normalizedHandle]);

  const bioCount = `${bio.length}/${MAX_BIO}`;

  const save = async () => {
    try {
      setSaving(true);
      const s = supabaseBrowser();

      // Must be logged in
      const { data: u } = await s.auth.getUser();
      if (!u.user) {
        toast.error("Please sign in");
        return;
      }
      const uid = u.user.id;

      // Validate handle
      if (!normalizedHandle) {
        toast.error("Username is required");
        return;
      }
      if (usernameError) {
        toast.error(usernameError);
        return;
      }

      // Compute minimal changes
      const changes: Record<string, any> = {};
      if (normalizedHandle !== initialRef.current.username)
        changes.username = normalizedHandle;
      if (displayName !== initialRef.current.display_name)
        changes.display_name = displayName;
      if (bio !== initialRef.current.bio) changes.bio = bio;

      // normalize avatar: empty string → null
      const normalizedAvatar = avatarUrl ?? null;
      if (normalizedAvatar !== initialRef.current.avatar_url)
        changes.avatar_url = normalizedAvatar;

      if (Object.keys(changes).length === 0) {
        toast.warn("No changes to save");
        return;
      }

      // Ensure username is unique (case-insensitive), excluding me
      if ("username" in changes) {
        const { data: dup } = await s
          .from("profiles")
          .select("id")
          .ilike("username", normalizedHandle) // exact ILIKE match
          .neq("id", uid)
          .limit(1);
        if (dup && dup.length > 0) {
          toast.error("That username is already taken");
          return;
        }
      }

      // Try UPDATE first (RLS-friendly)
      const { data: updRow, error: updErr } = await s
        .from("profiles")
        .update(changes)
        .eq("id", uid)
        .select("id")
        .maybeSingle();

      if (updErr) {
        toast.error(updErr.message || "Save failed");
        return;
      }

      // If nothing updated (row missing), INSERT
      let wrote = Boolean(updRow);
      if (!wrote) {
        const { data: insRow, error: insErr } = await s
          .from("profiles")
          .insert({ id: uid, ...changes })
          .select("id")
          .maybeSingle();

        if (insErr) {
          toast.error(insErr.message || "Save failed");
          return;
        }
        wrote = Boolean(insRow);
      }

      if (wrote) {
        // refresh snapshot
        initialRef.current = {
          username: "username" in changes ? normalizedHandle : initialRef.current.username,
          display_name:
            "display_name" in changes ? displayName : initialRef.current.display_name,
          bio: "bio" in changes ? bio : initialRef.current.bio,
          avatar_url:
            "avatar_url" in changes ? normalizedAvatar : initialRef.current.avatar_url,
          qr_code_url: initialRef.current.qr_code_url,
        };
        setDirty(false);
        toast.success("Saved");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  async function handleUpload(file?: File) {
    if (!file) return;
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("avatar", file);

    try {
      const s = supabaseBrowser();
      const { data: sess } = await s.auth.getSession();
      const token = sess?.session?.access_token;

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      const result = await res.json();
      if (res.ok && result.ok) {
        setAvatarUrl(result.avatar_url ?? null); // keep nulls as null
        setDirty(true);
        toast.success("Avatar updated");
      } else {
        const msg = result.error ?? "Upload failed";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.message ?? "Unexpected error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const regenerateQR = async () => {
    const handle = normalizedHandle;
    if (!handle) {
      toast.warn("Set your username first");
      return;
    }

    const s = supabaseBrowser();
    const { data: sess } = await s.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch("/api/profile/qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ username: handle }),
    });

    const payload = await res.json();
    if (!res.ok) {
      toast.error(payload.error || "QR generation failed");
      return;
    }

    setQrUrl(payload.url);
    toast.success("QR regenerated");
  };

  // Track dirtiness
  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  return (
    <div className="mx-auto max-w-1xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading tracking-tight">Edit Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update your public info, avatar and profile QR.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Unsaved changes
            </span>
          )}
          <button
            className={cn(
              "btn-primary",
              "px-5 py-2 rounded-xl",
              saving && "opacity-50 cursor-not-allowed"
            )}
            onClick={save}
            disabled={saving || !!usernameError}
            aria-disabled={saving || !!usernameError}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: profile form */}
        <section className="md:col-span-2 rounded-2xl border border-brand-muted/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-heading mb-4">Profile Info</h2>

          <div className="grid gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <div className="relative">
                <input
                  className={cn(
                    "form-field ring-brand w-full pr-10",
                    usernameError && "ring-red-300 focus:ring-red-400"
                  )}
                  value={username}
                  onChange={(e) => markDirty(setUsername)(e.target.value)}
                  placeholder="yourhandle"
                  inputMode="text"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {usernameError && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-600">
                    {usernameError}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your public profile will be available at{" "}
                <code>@{normalizedHandle || "yourhandle"}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display name</label>
              <input
                className="form-field ring-brand w-full"
                value={displayName}
                onChange={(e) => markDirty(setDisplayName)(e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1">Bio</label>
                <span className={cn("text-xs", bio.length > MAX_BIO && "text-red-600")}>
                  {bioCount}
                </span>
              </div>
              <textarea
                className="form-field ring-brand w-full min-h-[96px]"
                value={bio}
                onChange={(e) => markDirty(setBio)(e.target.value.slice(0, MAX_BIO))}
                placeholder="Short description"
              />
            </div>
          </div>
        </section>

        {/* Right column: avatar + QR */}
        <aside className="rounded-2xl border border-brand-muted/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-heading mb-4">Avatar & QR</h2>

          {/* Avatar uploader */}
          <div className="space-y-3">
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragEnter={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "rounded-2xl border p-5 transition bg-white/70",
                dragOver ? "ring-2 ring-brand/40 border-brand" : "border-brand-muted/70",
                loading && "opacity-60"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Big avatar with overlay */}
                <div className="relative h-32 w-32 md:h-40 md:w-40 shrink-0">
                  <img
                    src={avatarUrl || "/placeholder-avatar.svg"}
                    alt="Avatar"
                    className="h-full w-full rounded-2xl object-cover border border-brand-muted shadow-sm"
                  />

                  {/* Hover overlay for change */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl grid place-items-center bg-black/0 hover:bg-black/40 text-white text-sm opacity-0 hover:opacity-100 transition"
                    aria-label="Change avatar"
                  >
                    Change
                  </button>

                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 rounded-2xl grid place-items-center bg-white/60">
                      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Drag & drop an image anywhere in this card, or
                    <button
                      type="button"
                      className="ml-1 underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      choose a file
                    </button>
                    . Recommended 512×512.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg border bg-white hover:bg-muted"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      {loading ? "Uploading…" : "Upload new"}
                    </button>
                    {avatarUrl && (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-muted"
                          onClick={() => openModal(avatarUrl, "Avatar")}
                        >
                          View large
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-muted"
                          onClick={() => navigator.clipboard.writeText(avatarUrl!)}
                        >
                          Copy URL
                        </button>
                      </>
                    )}
                  </div>

                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
                disabled={loading}
              />
            </div>

            {/* Modal */}
            {modalOpen && (
              <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                onClick={() => setModalOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={modalSrc ?? undefined}
                    alt={modalAlt || "image"}
                    className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-sm shadow"
                    onClick={() => setModalOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR */}
          <div className="mt-6 space-y-3">
            {qrUrl && (
              <div className="mt-2">
                <p className="text-sm mb-2">Create or regenerate your QR code</p>
                <div className="p-4 rounded-xl bg-white border shadow-sm w-fit mx-auto">
                  <img
                    src={qrUrl}
                    alt="QR code"
                    className="w-40 cursor-pointer"
                    onClick={() => openModal(qrUrl, "QR code")}
                  />
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => openModal(qrUrl, "QR code")}
                  >
                    Open full size
                  </button>
                  <button
                    className="text-sm underline"
                    onClick={() => navigator.clipboard.writeText(qrUrl)}
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            )}
            <button className="btn-primary w-full" onClick={regenerateQR}>
              Regenerate QR
            </button>
          </div>
        </aside>
      </div>

      <ToastViewport />
    </div>
  );
}

/* ---------- Minimalistic toast system (no external deps) ---------- */
const listeners: ((v: Toast) => void)[] = [];
interface Toast {
  type: "success" | "error" | "warn";
  message: string;
  id: string;
}
const toast = {
  success: (m: string) => emit({ type: "success", message: m, id: crypto.randomUUID() }),
  error: (m: string) => emit({ type: "error", message: m, id: crypto.randomUUID() }),
  warn: (m: string) => emit({ type: "warn", message: m, id: crypto.randomUUID() }),
};
function emit(t: Toast) {
  listeners.forEach((l) => l(t));
}
function ToastViewport() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast) => {
      setItems((cur) => [...cur, t]);
      const id = t.id;
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), 2800);
    };
    listeners.push(l);
    return () => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-4 py-2 rounded-lg shadow text-sm border backdrop-blur bg-white/95",
            t.type === "success" && "border-emerald-200",
            t.type === "error" && "border-red-200",
            t.type === "warn" && "border-amber-200"
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
