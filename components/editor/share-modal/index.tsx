"use client";

import { useState } from "react";
import {
  Users,
  Link2,
  Copy,
  Check,
  X,
  Globe,
  Lock,
  ChevronDown,
  UserPlus
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@hanzo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  avatar?: string;
}

export function ShareModal({ isOpen, onClose, projectId, projectName = "Untitled Project" }: ShareModalProps) {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [visibility, setVisibility] = useState<"public" | "workspace" | "private">("public");
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: user?.id || "1",
      name: user?.name || "You",
      email: user?.id ? `${user.id}@zeekay.ai` : "z@zeekay.ai",
      role: "owner",
      avatar: user?.avatarUrl,
    }
  ]);

  const handleInvite = () => {
    if (email && email.includes("@")) {
      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        name: email.split("@")[0],
        email: email,
        role: "editor",
      };
      setCollaborators([...collaborators, newCollaborator]);
      setEmail("");
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `https://hanzo.app/projects/${projectId || "new"}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `https://hanzo.app/invite/${projectId || "new"}?token=${Date.now()}`;
    navigator.clipboard.writeText(inviteUrl);
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const updateCollaboratorRole = (id: string, role: "editor" | "viewer") => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === id && c.role !== "owner" ? { ...c, role } : c))
    );
  };

  const removeCollaborator = (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id && c.role !== "owner"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-neutral-900 text-white border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Invite</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Collaborators will use credits from the project owner's workspace ({user?.name || "Your Workspace"})
          </DialogDescription>
        </DialogHeader>

        {/* Invite by Email */}
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-sm text-neutral-400 mb-2">Invite by email</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleInvite()}
                  className="bg-neutral-800 border-neutral-700 text-white pl-10"
                />
                <UserPlus className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              </div>
              <Button onClick={handleInvite} className="bg-purple-600 hover:bg-purple-700">
                Invite
              </Button>
            </div>
          </div>

          {/* Edit Access */}
          <div>
            <h3 className="text-sm font-medium mb-3">Edit access</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {collaborators[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{projectName}</p>
                    <p className="text-xs text-neutral-400">{collaborators.length} member{collaborators.length !== 1 && "s"}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </div>

              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{collaborator.name} {collaborator.role === "owner" && "(you)"}</p>
                      <p className="text-xs text-neutral-400">{collaborator.email}</p>
                    </div>
                  </div>
                  {collaborator.role === "owner" ? (
                    <span className="text-xs text-neutral-400">Owner</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: string) => updateCollaboratorRole(collaborator.id, value as "editor" | "viewer")}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs bg-neutral-800 border-neutral-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(collaborator.id)}
                        className="p-1 hover:bg-neutral-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project Access */}
          <div>
            <h3 className="text-sm font-medium mb-3">Project access</h3>
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm">Visible to your workspace</p>
                  <p className="text-xs text-neutral-400">Anyone in your workspace can view this project</p>
                </div>
              </div>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-32 bg-neutral-700 border-neutral-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="public">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  </SelectItem>
                  <SelectItem value="workspace">
                    <span className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      Workspace
                    </span>
                  </SelectItem>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Create Invite Link */}
          <div>
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Link2 className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm">Create invite link</p>
                  <p className="text-xs text-neutral-400">Anyone with this link can join</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyInviteLink}
                className="bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
              >
                {inviteLinkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Link */}
          <div className="pt-4 border-t border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Share project</p>
                <p className="text-xs text-neutral-400">
                  {visibility === "public" ? "Anyone with the link can view" : "Restricted to invited members"}
                </p>
              </div>
              <Button
                onClick={handleCopyLink}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Upgrade to Enterprise */}
          <div className="pt-4 border-t border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Upgrade to Enterprise</p>
                <p className="text-xs text-neutral-400">Advanced features & enterprise support</p>
              </div>
              <Button variant="outline" className="border-neutral-600 hover:bg-neutral-800">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}