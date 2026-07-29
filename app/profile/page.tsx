"use client";

import { XStack, SizableText, Paragraph, YStack, H1, H2, H3 } from '@hanzo/gui';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera, Twitter, Github, Globe } from "lucide-react";
import { Button, Avatar, AvatarFallback, AvatarImage, toast, Input, Label, Textarea } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { HanzoLogo } from "@/components/HanzoLogo";
import { MyBuilds } from "@/components/builds/my-builds";

export default function ProfilePage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    toast.success("Profile updated successfully");
    setIsEditing(false);
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
      <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <Paragraph color="$color11">Loading profile...</Paragraph>
        </SizableText>
      </XStack>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <Paragraph color="$color11">Redirecting to login...</Paragraph>
        </SizableText>
      </XStack>
    );
  }

  // @handle from username (slugified — usernames may contain spaces) or email local-part
  const handle = (user?.username || user?.email?.split('@')[0] || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} gap="$2">
                  <Save size={16} />
                  Save Changes
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
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback fontSize="$8" backgroundColor="$purple10">
                    {user?.fullname?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button position="absolute" bottom="$0" right="$0" padding="$1.5" backgroundColor="$purple9" borderRadius="$10" hoverStyle={{ backgroundColor: "$purple10" }}>
                    <Camera size={16} color="$color" />
                  </Button>
                )}
              </YStack>

              <YStack flex={1}>
                {isEditing ? (
                  <Input
                    type="text"
                    defaultValue={user?.fullname}
                    fontSize="$10" fontWeight="500" backgroundColor="transparent" color="$color" borderBottomWidth={1} borderColor="$borderColor" outlineWidth={0} paddingBottom="$2" marginBottom="$2" focusStyle={{ borderColor: "$purple9" }}
  />
                ) : (
                  <H2 fontSize="$10" fontWeight="500" color="$color" marginBottom="$2">{user?.fullname}</H2>
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
                      defaultValue={user?.fullname}
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2"
  />
                  ) : (
                    <Paragraph color="$color">{user?.fullname}</Paragraph>
                  )}
                </div>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      defaultValue={user?.email}
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2"
  />
                  ) : (
                    <Paragraph color="$color" wordBreak="break-all">{user?.email}</Paragraph>
                  )}
                </div>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$1">
                    Username
                  </Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      defaultValue={handle}
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2"
  />
                  ) : (
                    <Paragraph color="$color">@{handle}</Paragraph>
                  )}
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
                      placeholder="Tell us about yourself..."
                      width="100%" backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2" resize="none"
  />
                  ) : (
                    <Paragraph color="$color11">No bio added yet</Paragraph>
                  )}
                </div>

                <div>
                  <Label fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
                    Social Links
                  </Label>
                  <YStack rowGap="$2">
                    <XStack alignItems="center" gap="$2">
                      <Globe size={16} color="$color11" />
                      {isEditing ? (
                        <Input
                          type="url"
                          placeholder="Website"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : (
                        <SizableText color="$color11">Not set</SizableText>
                      )}
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <Twitter size={16} color="$color11" />
                      {isEditing ? (
                        <Input
                          type="text"
                          placeholder="Twitter username"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : (
                        <SizableText color="$color11">Not set</SizableText>
                      )}
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <Github size={16} color="$color11" />
                      {isEditing ? (
                        <Input
                          type="text"
                          placeholder="GitHub username"
                          flex={1} backgroundColor="$color3" color="$color" borderWidth={1} borderColor="$borderColor" borderRadius="$5" paddingHorizontal="$3" paddingVertical="$1.5"
  />
                      ) : (
                        <SizableText color="$color11">Not set</SizableText>
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