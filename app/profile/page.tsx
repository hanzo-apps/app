"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack, H1, H2, H3, Anchor } from '@hanzo/gui';
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera, Twitter, Github, Globe } from "lucide-react";
import { Button, Avatar, AvatarFallback, AvatarImage, toast, Input, Label, Textarea } from '@hanzo/ui';
import { useIamToken } from "@hanzo/iam/react";
import { useUser } from "@/hooks/useUser";
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
      <LoadingScreen>Loading profile...</LoadingScreen>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <LoadingScreen>Redirecting to login...</LoadingScreen>
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
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$5" paddingVertical="$4">
        <XStack maxWidth={896} alignSelf="center" alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              gap="$2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <H1 fontSize="$8" fontWeight="500" color="$color">Profile</H1>
          </XStack>
          <XStack alignItems="center" gap="$2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancel} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleSave} gap="$2" disabled={busy}>
                  <Save size={16} />
                  {busy ? "Saving…" : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </XStack>
        </XStack>
      </YStack>

      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
        <YStack maxWidth={896} alignSelf="center">
          {/* Profile Header */}
          <YStack borderTopLeftRadius="$5" borderTopRightRadius="$5" padding="$6">
            <XStack alignItems="center" gap="$5">
              <YStack position="relative">
                <Avatar width="$12" height="$12" borderWidth={4} borderColor="black">
                  {/* An `<img>` with src="" resolves to the PAGE url, loads HTML,
                      fails to decode, and renders the browser's broken-image
                      icon — which is exactly what this showed, because
                      `useUser` defaults avatarUrl to ''. A src is passed only
                      when there is one, and a load failure (a dead gravatar,
                      d=404) falls through to the monogram. */}
                  {photo && !imgFailed && (
                    <AvatarImage src={photo} alt="" onError={() => setImgFailed(true)} />
                  )}
                  <AvatarFallback backgroundColor="$purple10">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    {/* Visually hidden, still in the a11y tree — the `sr-only`
                        class upstream used came from Tailwind, which this app no
                        longer loads, so the class would leave a bare file input
                        sitting next to the avatar. The camera button is the
                        pointer affordance; this input is what it clicks. */}
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        padding: 0,
                        margin: -1,
                        overflow: "hidden",
                        clip: "rect(0,0,0,0)",
                        whiteSpace: "nowrap",
                        border: 0,
                      }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void pickPhoto(f);
                      }}
                    />
                    <Button
                      onClick={() => fileInput.current?.click()}
                      disabled={busy}
                      aria-label="Change profile photo"
                      title="Change profile photo"
                      position="absolute" bottom="$0" right="$0" padding="$1.5" backgroundColor="$purple9" borderRadius="$10" hoverStyle={{ backgroundColor: "$purple10" }} disabledStyle={{ opacity: 0.5 }}
                    >
                      <Camera size={16} />
                    </Button>
                  </>
                )}
              </YStack>

              <YStack flex={1}>
                {isEditing ? (
                  <Input
                    type="text"
                    value={draft.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    placeholder={user?.fullname || "Your name"}
                    aria-label="Display name"
                    fontSize="$10" fontWeight="500" backgroundColor="transparent" color="$color" borderBottomWidth={1} borderColor="$borderColor" outlineWidth={0} paddingBottom="$2" marginBottom="$2" focusStyle={{ borderColor: "$purple9" }}
  />
                ) : (
                  <H2 fontSize="$10" fontWeight="500" color="$color" marginBottom="$2">{shownName}</H2>
                )}
                <Paragraph color="$color11">@{handle}</Paragraph>
              </YStack>
            </XStack>
          </YStack>

          {/* Profile Content */}
          <YStack backgroundColor="$background" borderBottomLeftRadius="$5" borderBottomRightRadius="$5" borderWidth={1} borderColor="$borderColor" padding="$5">
            <YStack gap="$5">
              {/* Basic Info */}
              <YStack rowGap="$4">
                <H3 fontSize="$6" fontWeight="500" color="$color" marginBottom="$4">Basic Information</H3>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={draft.displayName}
                      onChange={(e) => set("displayName", e.target.value)}
                      placeholder={user?.fullname || "Your name"}
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2"
  />
                  ) : (
                    <Paragraph color="$color">{shownName || "\u2014"}</Paragraph>
                  )}
                </div>

                {/* Email and username are shown, never edited here. Email is an
                    identity claim that needs a verification round-trip, and the
                    username is the IAM row's own key — offering an input for
                    either would be a control that cannot do what it says. */}
                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Email
                  </Label>
                  <Paragraph color="$color">{user?.email}</Paragraph>
                </div>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Username
                  </Label>
                  <Paragraph color="$color">@{handle}</Paragraph>
                </div>
              </YStack>

              {/* Bio & Links */}
              <YStack rowGap="$4">
                <H3 fontSize="$6" fontWeight="500" color="$color" marginBottom="$4">Bio & Links</H3>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Bio
                  </Label>
                  {isEditing ? (
                    <Textarea
                      rows={4}
                      value={draft.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2"
  />
                  ) : (
                    <Paragraph color="$color11" whiteSpace="pre-wrap">
                      {saved.bio || "No bio added yet"}
                    </Paragraph>
                  )}
                </div>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
                    Social Links
                  </Label>
                  <YStack rowGap="$2">
                    <XStack alignItems="center" gap="$2">
                      <Globe size={16} />
                      {isEditing ? (
                        <Input
                          type="url"
                          value={draft.homepage}
                          onChange={(e) => set("homepage", e.target.value)}
                          placeholder="https://example.com"
                          aria-label="Website"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : saved.homepage ? (
                        <Anchor
                          href={saved.homepage}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          color="$color" hoverStyle={{ textDecorationLine: "underline" }}
                        >
                          {saved.homepage}
                        </Anchor>
                      ) : (
                        <SizableText color="$color11">Not set</SizableText>
                      )}
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <Twitter size={16} />
                      {isEditing ? (
                        <Input
                          type="text"
                          value={draft.twitter}
                          onChange={(e) => set("twitter", e.target.value)}
                          placeholder="Twitter username"
                          aria-label="Twitter username"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : (
                        <SizableText color="$color">{saved.twitter || <SizableText color="$color11">Not set</SizableText>}</SizableText>
                      )}
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <Github size={16} />
                      {isEditing ? (
                        <Input
                          type="text"
                          value={draft.github}
                          onChange={(e) => set("github", e.target.value)}
                          placeholder="GitHub username"
                          aria-label="GitHub username"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : (
                        <SizableText color="$color">{saved.github || <SizableText color="$color11">Not set</SizableText>}</SizableText>
                      )}
                    </XStack>
                  </YStack>
                </div>
              </YStack>
            </YStack>

            {/* Your builds — the sessions behind your projects. This replaced four
                hardcoded counters (12 / 342 / 89 / 2.3k) that were identical for
                every account and true for none. */}
            <MyBuilds />
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}