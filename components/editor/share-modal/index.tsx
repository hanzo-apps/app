"use client";

import { SizableText, XStack, YStack, H3, Paragraph } from '@hanzo/ui';
import { useState } from "react";
import {
  Users,
  Link2,
  Copy,
  Check,
  X,
  Globe,
  Lock,
  UserPlus,
} from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
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

/** One neutral, monochrome avatar — a single soft-rounded initial chip. No hue. */
function Avatar({ name }: { name: string }) {
  return (
    <XStack width={28} height={28} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$10" backgroundColor="$color3">
      <SizableText fontSize="$1" fontWeight="500" color="$color">{name.charAt(0).toUpperCase()}</SizableText>
    </XStack>
  );
}

/** One consistent card row — the shared shell for every access/link row. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2">
      {children}
    </XStack>
  );
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
      <DialogContent maxWidth={512} backgroundColor="$background" borderColor="$borderColor">
        <DialogHeader rowGap="$1">
          <DialogTitle fontSize="$4" fontWeight="500">Invite</DialogTitle>
          <DialogDescription fontSize="$1" color="$color11">
            Collaborators use credits from the project owner&apos;s workspace ({user?.name || "Your Workspace"}).
          </DialogDescription>
        </DialogHeader>

        <YStack marginTop="$1" rowGap="$4">
          {/* Invite by email — one compact input + one matching button (equal height + radius). */}
          <YStack rowGap="$1.5">
            <Label fontSize="$1" color="$color11">Invite by email</Label>
            <XStack alignItems="stretch" gap="$2">
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChangeText={(v: string) => setEmail(v)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleInvite()}
                flex={1}
  />
              <Button onClick={handleInvite} gap="$1.5">
                <UserPlus size={14} />
                Invite
              </Button>
            </XStack>
          </YStack>

          {/* Edit access — collaborators list. */}
          <YStack rowGap="$1.5">
            <H3 fontSize="$1" fontWeight="500" color="$color11">Edit access</H3>
            <YStack rowGap="$1.5">
              {collaborators.map((collaborator) => (
                <XStack key={collaborator.id} alignItems="center" justifyContent="space-between" gap="$3" paddingHorizontal="$1" paddingVertical="$1">
                  <XStack minWidth={0} alignItems="center" gap="$2.5">
                    <Avatar name={collaborator.name} />
                    <YStack minWidth={0}>
                      <Paragraph numberOfLines={1} fontSize="$2" fontWeight="500">
                        {collaborator.name}{collaborator.role === "owner" && " (you)"}
                      </Paragraph>
                      <Paragraph numberOfLines={1} fontSize="$1" color="$color11">{collaborator.email}</Paragraph>
                    </YStack>
                  </XStack>
                  {collaborator.role === "owner" ? (
                    <SizableText fontSize="$1" color="$color11">Owner</SizableText>
                  ) : (
                    <XStack alignItems="center" gap="$1.5">
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: string) => updateCollaboratorRole(collaborator.id, value as "editor" | "viewer")}
                      >
                        <SelectTrigger width={104}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCollaborator(collaborator.id)}
                        aria-label="Remove collaborator"
                      >
                        <X size={14} />
                      </Button>
                    </XStack>
                  )}
                </XStack>
              ))}
            </YStack>
          </YStack>

          {/* Project access — visibility. */}
          <YStack rowGap="$1.5">
            <H3 fontSize="$1" fontWeight="500" color="$color11">Project access</H3>
            <Row>
              <XStack minWidth={0} alignItems="center" gap="$2.5">
                <Users size={16} />
                <YStack minWidth={0}>
                  <Paragraph fontSize="$2">Visible to your workspace</Paragraph>
                  <Paragraph fontSize="$1" color="$color11">Anyone in your workspace can view this project</Paragraph>
                </YStack>
              </XStack>
              <Select value={visibility} onValueChange={(v: string) => setVisibility(v as typeof visibility)}>
                <SelectTrigger width={128}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <XStack alignItems="center" gap="$2"><Globe size={14} /><SizableText>Public</SizableText></XStack>
                  </SelectItem>
                  <SelectItem value="workspace">
                    <XStack alignItems="center" gap="$2"><Users size={14} /><SizableText>Workspace</SizableText></XStack>
                  </SelectItem>
                  <SelectItem value="private">
                    <XStack alignItems="center" gap="$2"><Lock size={14} /><SizableText>Private</SizableText></XStack>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </YStack>

          {/* Create invite link. */}
          <Row>
            <XStack minWidth={0} alignItems="center" gap="$2.5">
              <Link2 size={16} />
              <YStack minWidth={0}>
                <Paragraph fontSize="$2">Create invite link</Paragraph>
                <Paragraph fontSize="$1" color="$color11">Anyone with this link can join</Paragraph>
              </YStack>
            </XStack>
            <Button variant="outline" onClick={handleCopyInviteLink} gap="$1.5">
              {inviteLinkCopied ? <Check size={14} /> : <Copy size={14} />}
              {inviteLinkCopied ? "Copied" : "Create"}
            </Button>
          </Row>

          {/* Share + upgrade — footer actions, consistent buttons. */}
          <XStack alignItems="center" justifyContent="space-between" borderTopWidth={1} borderColor="$borderColor" paddingTop="$3">
            <div>
              <Paragraph fontSize="$2" fontWeight="500">Share project</Paragraph>
              <Paragraph fontSize="$1" color="$color11">
                {visibility === "public" ? "Anyone with the link can view" : "Restricted to invited members"}
              </Paragraph>
            </div>
            <Button onClick={handleCopyLink} gap="$1.5">
              {linkCopied ? <Check size={14} /> : <Copy size={14} />}
              {linkCopied ? "Copied" : "Copy link"}
            </Button>
          </XStack>

          <XStack alignItems="center" justifyContent="space-between" borderTopWidth={1} borderColor="$borderColor" paddingTop="$3">
            <div>
              <Paragraph fontSize="$2" fontWeight="500">Upgrade to Enterprise</Paragraph>
              <Paragraph fontSize="$1" color="$color11">Advanced features &amp; enterprise support</Paragraph>
            </div>
            <Button variant="outline">Contact us</Button>
          </XStack>
        </YStack>
      </DialogContent>
    </Dialog>
  );
}
