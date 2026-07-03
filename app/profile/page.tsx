"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera, Link as LinkIcon, Twitter, Github, Globe } from "lucide-react";
import { Button } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { HanzoLogo } from "@/components/HanzoLogo";

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
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
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-2xl bg-purple-600">
                    {user?.fullname?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-1.5 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={user?.fullname}
                    className="text-3xl font-bold bg-transparent text-white border-b border-neutral-600 focus:border-purple-500 outline-none pb-2 mb-2"
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-white mb-2">{user?.fullname}</h2>
                )}
                <p className="text-gray-400">@{user?.username || user?.email?.split('@')[0]}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="bg-neutral-900 rounded-b-lg border border-neutral-800 p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={user?.fullname}
                      className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-white">{user?.fullname}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-white">{user?.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={user?.username || user?.email?.split('@')[0]}
                      className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="text-white">@{user?.username || user?.email?.split('@')[0]}</p>
                  )}
                </div>
              </div>

              {/* Bio & Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Bio & Links</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 resize-none"
                    />
                  ) : (
                    <p className="text-gray-400">No bio added yet</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Social Links
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="url"
                          placeholder="Website"
                          className="flex-1 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-1.5"
                        />
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Twitter username"
                          className="flex-1 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-1.5"
                        />
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="GitHub username"
                          className="flex-1 bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-1.5"
                        />
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">12</p>
                  <p className="text-sm text-gray-400">Projects</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">342</p>
                  <p className="text-sm text-gray-400">AI Generations</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">89</p>
                  <p className="text-sm text-gray-400">Deployments</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">2.3k</p>
                  <p className="text-sm text-gray-400">Views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}