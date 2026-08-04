"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera, Twitter, Github, Globe } from "lucide-react";
import { Button } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { useIamToken } from "@hanzo/iam/react";
import { useUser } from "@/hooks/useUser";
import { toast } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { MyBuilds } from "@/components/builds/my-builds";
import { gravatarUrl } from "@/lib/avatar";
import { avatarDataUrl } from "@/lib/image";

/** Mirrors `lib/profile`'s AVATAR_LIMIT — the client reduces to fit, the server enforces. */
const AVATAR_LIMIT = 96 * 1024;

/** The editable profile. Empty strings, never undefined, so inputs stay controlled. */
interface Draft {
  displayName: string;
  avatar: string;
  bio: string;
  homepage: string;
  twitter: string;
  github: string;
}

const EMPTY: Draft = { displayName: "", avatar: "", bio: "", homepage: "", twitter: "", github: "" };

export default function ProfilePage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /**
   * Send the session EXPLICITLY, rather than relying on the cookie bridge.
   *
   * `session()` on the server reads an `Authorization: Bearer`, falling back to
   * the `hanzo_iam_access_token` cookie. That cookie does exist here —
   * `IamClientProvider`'s bridge projects the SDK's token onto it and keeps it
   * refresh-current — so a same-origin fetch is usually authenticated already.
   *
   * "Usually" is the reason for this. The bridge is an effect: it runs after
   * mount, and after a refresh it rewrites the cookie only once the new token
   * lands. A fetch that fires in that window carries a stale cookie or none, and
   * the failure reads as being signed out while the page plainly is not. The
   * bearer is the token this component is already holding, so sending it removes
   * the ordering question entirely — and it is what every other authenticated
   * surface here does (`useIamToken()`, e.g. components/usage).
   *
   * The load also waits for the token rather than racing it, for the same reason.
   */
  const { token } = useIamToken();
  const authed = (init: RequestInit = {}): RequestInit => ({
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // The stored profile. Until this lands the page shows the session's claims,
  // which is what the header already renders.
  useEffect(() => {
    if (!user || !token) return;
    let live = true;
    (async () => {
      try {
        const res = await fetch("/v1/me/profile", authed());
        const body = await res.json().catch(() => null);
        if (!live || !res.ok || !body?.ok) return;
        const p: Draft = { ...EMPTY, ...body.profile };
        setSaved(p);
        setDraft(p);
      } catch {
        // Unreadable stored profile is not an error worth interrupting for: the
        // page still renders the session's identity and Save still works.
      }
    })();
    return () => {
      live = false;
    };
  }, [user, token]);

  const pickPhoto = useCallback(async (file: File) => {
    setBusy(true);
    try {
      // Reduce HERE. A 12 MB camera photo would fail the server's cap, and
      // "your photo is too large" is a useless answer when the browser can
      // simply make it the right size.
      const dataUrl = await avatarDataUrl(file, AVATAR_LIMIT);
      set("avatar", dataUrl);
      setImgFailed(false);
      toast.success("Photo ready — press Save Changes to keep it");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That photo could not be used");
    } finally {
      setBusy(false);
      // Clear the input so re-picking the SAME file fires change again.
      if (fileInput.current) fileInput.current.value = "";
    }
  }, []);

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        "/v1/me/profile",
        authed({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }),
      );
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        // Say what the server said. "Profile updated successfully" on a failed
        // write is the bug this page shipped with.
        toast.error(body?.message || `Could not save your profile (${res.status})`);
        return;
      }
      const p: Draft = { ...EMPTY, ...body.profile };
      setSaved(p);
      setDraft(p);
      setIsEditing(false);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reach the server");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setDraft(saved);
    setIsEditing(false);
    setImgFailed(false);
  };

  // Use effect for navigation to avoid calling router.push during render
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // @handle from username (slugified — usernames may contain spaces) or email local-part
  const handle = (user?.username || user?.email?.split('@')[0] || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // The name to show: the stored profile wins, then the session's claims.
  const shownName = (isEditing ? draft.displayName : saved.displayName) || user?.fullname || "";
  const initial = (shownName || user?.email || "U").trim().charAt(0).toUpperCase() || "U";

  /**
   * The photo to render, in priority order — and '' when there is none, which
   * the Avatar reads as "show the monogram" rather than as an image to fetch:
   *   1. the draft (a photo just picked, not yet saved),
   *   2. the stored profile avatar,
   *   3. the session's `picture` claim,
   *   4. this email's gravatar (`d=404`, so no gravatar → onError → monogram).
   */
  const photo =
    draft.avatar ||
    saved.avatar ||
    user?.avatarUrl ||
    (user?.email ? gravatarUrl(user.email, 192) : "");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-medium text-foreground">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancel} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2" disabled={busy}>
                  <Save className="w-4 h-4" />
                  {busy ? "Saving…" : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-t-lg p-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-black">
                  {/* An `<img>` with src="" resolves to the PAGE url, loads HTML,
                      fails to decode, and renders the browser's broken-image
                      icon — which is exactly what this showed, because
                      `useUser` defaults avatarUrl to ''. A src is passed only
                      when there is one, and a load failure (a dead gravatar,
                      d=404) falls through to the monogram. */}
                  {photo && !imgFailed && (
                    <AvatarImage src={photo} alt="" onError={() => setImgFailed(true)} />
                  )}
                  <AvatarFallback className="text-2xl bg-purple-600">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void pickPhoto(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={busy}
                      aria-label="Change profile photo"
                      title="Change profile photo"
                      className="absolute bottom-0 right-0 p-1.5 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-foreground" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    placeholder={user?.fullname || "Your name"}
                    aria-label="Display name"
                    className="text-3xl font-medium bg-transparent text-foreground border-b border-border focus:border-purple-500 outline-none pb-2 mb-2"
                  />
                ) : (
                  <h2 className="text-3xl font-medium text-foreground mb-2">{shownName}</h2>
                )}
                <p className="text-muted-foreground">@{handle}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="bg-card rounded-b-lg border border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.displayName}
                      onChange={(e) => set("displayName", e.target.value)}
                      placeholder={user?.fullname || "Your name"}
                      className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-foreground">{shownName || "\u2014"}</p>
                  )}
                </div>

                {/* Email and username are shown, never edited here. Email is an
                    identity claim that needs a verification round-trip, and the
                    username is the IAM row's own key — offering an input for
                    either would be a control that cannot do what it says. */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <p className="text-foreground break-all">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Username
                  </label>
                  <p className="text-foreground">@{handle}</p>
                </div>
              </div>

              {/* Bio & Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Bio & Links</h3>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={draft.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 resize-none"
                    />
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {saved.bio || "No bio added yet"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Social Links
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      {isEditing ? (
                        <input
                          type="url"
                          value={draft.homepage}
                          onChange={(e) => set("homepage", e.target.value)}
                          placeholder="https://example.com"
                          aria-label="Website"
                          className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-1.5"
                        />
                      ) : saved.homepage ? (
                        <a
                          href={saved.homepage}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-foreground hover:underline break-all"
                        >
                          {saved.homepage}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-muted-foreground shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft.twitter}
                          onChange={(e) => set("twitter", e.target.value)}
                          placeholder="Twitter username"
                          aria-label="Twitter username"
                          className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-1.5"
                        />
                      ) : (
                        <span className="text-foreground">{saved.twitter || <span className="text-muted-foreground">Not set</span>}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-muted-foreground shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft.github}
                          onChange={(e) => set("github", e.target.value)}
                          placeholder="GitHub username"
                          aria-label="GitHub username"
                          className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-1.5"
                        />
                      ) : (
                        <span className="text-foreground">{saved.github || <span className="text-muted-foreground">Not set</span>}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your builds — the sessions behind your projects. This replaced four
                hardcoded counters (12 / 342 / 89 / 2.3k) that were identical for
                every account and true for none. */}
            <MyBuilds />
          </div>
        </div>
      </div>
    </div>
  );
}