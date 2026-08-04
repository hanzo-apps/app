"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack, H2, H3, Anchor } from '@hanzo/gui';
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Camera, Twitter, Github, Globe } from "lucide-react";
import { Button, Avatar, AvatarFallback, AvatarImage, toast, Input, Label, Textarea } from '@hanzo/ui';
import { useIamToken } from "@hanzo/iam/react";
import { AppShell } from "@/components/app-shell";
import { accent, panel } from "@/lib/chrome";
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

  /**
   * The avatar IS the photo control — one gesture, from anywhere on the page.
   *
   * It used to be inert until you had first pressed "Edit Profile", which made
   * changing your picture a two-step ritual whose first step looked like it had
   * nothing to do with pictures. Editing is now something clicking the photo
   * TURNS ON, not something you have to arrange beforehand.
   *
   * This is why the file input below renders unconditionally rather than inside
   * the `isEditing` branch: `setIsEditing` only schedules a render, so an input
   * mounted by that render does not exist yet on this tick and `ref.current`
   * would still be null. Opening the picker also has to stay inside the user
   * gesture — a browser discards a `.click()` made after an await — so it
   * cannot wait for the state to land either. An always-mounted input satisfies
   * both: the ref is live now, and the picker opens in the same gesture.
   */
  const choosePhoto = useCallback(() => {
    setIsEditing(true);
    fileInput.current?.click();
  }, []);

  const handleSave = async () => {
    setBusy(true);
    try {
      // Send what CHANGED, not the whole draft. `avatar` is why: IAM seeds it
      // with a URL (`https://api.hanzo.ai/v1/avatar/…`), the load puts that URL
      // in the draft, and the server refuses a remote URL on purpose — it stores
      // only self-contained data URIs, so nobody can point their picture at a
      // host that then sees everyone who views them. Posting the whole draft
      // therefore fed back a value the server had just served and could not
      // accept, and "That photo is not an image we can store" was the answer to
      // editing your BIO. A patch of changed keys makes that shape impossible
      // for every field at once: `writeProfile` merges only the keys present.
      const patch = Object.fromEntries(
        (Object.keys(draft) as (keyof Draft)[])
          .filter((k) => draft[k] !== saved[k])
          .map((k) => [k, draft[k]]),
      );
      const res = await fetch(
        "/v1/me/profile",
        authed({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
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
    <AppShell
      currentView="profile"
      title="Profile"
      actions={
        isEditing ? (
          <>
            <Button variant="outline" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
            <Button {...accent} onClick={handleSave} gap="$2" disabled={busy}>
              <Save size={16} />
              {busy ? "Saving…" : "Save Changes"}
            </Button>
          </>
        ) : (
          <Button {...accent} onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )
      }
    >
      {/* ONE panel: identity and fields were two cards faking a single one with
          matching half-radii, so the seam between them showed whenever their
          fills disagreed — and they did, one being transparent. */}
      <YStack {...panel}>
        <YStack padding="$6">
          <XStack alignItems="center" gap="$5">
              <YStack
                position="relative"
                role="button"
                tabIndex={0}
                aria-label="Change profile photo"
                cursor="pointer"
                group
                onClick={choosePhoto}
                onKeyDown={(e: { key: string; preventDefault: () => void }) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choosePhoto();
                  }
                }}
              >
                <Avatar width="$12" height="$12" borderWidth={4} borderColor="$background">
                  {/* An `<img>` with src="" resolves to the PAGE url, loads HTML,
                      fails to decode, and renders the browser's broken-image
                      icon — which is exactly what this showed, because
                      `useUser` defaults avatarUrl to ''. A src is passed only
                      when there is one, and a load failure (a dead gravatar,
                      d=404) falls through to the monogram. */}
                  {photo && !imgFailed && (
                    <AvatarImage src={photo} alt="" onError={() => setImgFailed(true)} />
                  )}
                  <AvatarFallback backgroundColor="$color4">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {/* The whole avatar is the target; this veil says so on
                    hover/focus without stealing the click. */}
                <XStack
                  pointerEvents="none"
                  position="absolute"
                  top={4}
                  right={4}
                  bottom={4}
                  left={4}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="$10"
                  backgroundColor="transparent"
                  opacity={0}
                  $group-hover={{ backgroundColor: "rgba(0,0,0,0.55)", opacity: 1 }}
                  $group-focus={{ backgroundColor: "rgba(0,0,0,0.55)", opacity: 1 }}
                >
                  <Camera size={20} color="#fff" />
                </XStack>
                {/* Visually hidden, still in the a11y tree — the `sr-only`
                    class upstream used came from Tailwind, which this app no
                    longer loads, so the class would leave a bare file input
                    sitting next to the avatar. The avatar is the control; this
                    input is what it opens. */}
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
                {/* A MARKER, not a control. The veil only appears on hover, so
                    at rest something has to say the photo is changeable — but
                    this used to be a real Button, which put a button inside an
                    element that is itself `role="button"`, and gave one action
                    two handlers to keep in step. It is `pointerEvents="none"`,
                    so the click it looks like it takes belongs to the avatar
                    underneath, and there is exactly one control here. */}
                <XStack
                  pointerEvents="none"
                  aria-hidden
                  position="absolute" bottom="$0" right="$0" padding="$1.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderRadius="$10" opacity={busy ? 0.5 : 1} $group-hover={{ backgroundColor: "$color6" }}
                >
                  <Camera size={16} />
                </XStack>
              </YStack>

              <YStack flex={1}>
                {isEditing ? (
                  <Input
                    type="text"
                    value={draft.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    placeholder={user?.fullname || "Your name"}
                    aria-label="Display name"
                    fontSize="$7" fontWeight="500" backgroundColor="transparent" color="$color" borderWidth={0} borderBottomWidth={1} borderColor="$borderColor" outlineWidth={0} paddingBottom="$2" marginBottom="$2" focusStyle={{ borderColor: "$color06" }}
  />
                ) : (
                  /* $7, not $10: at $10 the name outshouted the page's own title
                     and overhung the avatar beside it. */
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$2">{shownName}</H2>
                )}
                <Paragraph color="$color11">@{handle}</Paragraph>
              </YStack>
            </XStack>
          </YStack>

          {/* Fields — divided from the identity above by the panel's own hairline. */}
          <YStack borderTopWidth={1} borderColor="$borderColor" padding="$5">
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
    </AppShell>
  );
}