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
  UserPlus,
} from "lucide-react";
import { Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/overlay";
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
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-foreground">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/** One consistent card row — the shared shell for every access/link row. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
      {children}
    </div>
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
      <DialogContent className="max-w-lg bg-card text-foreground border-border">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-medium">Invite</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Collaborators use credits from the project owner&apos;s workspace ({user?.name || "Your Workspace"}).
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-4">
          {/* Invite by email — one compact input + one matching button (equal height + radius). */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Invite by email</Label>
            <div className="flex items-stretch gap-2">
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleInvite()}
                className="flex-1"
              />
              <Button onClick={handleInvite} className="gap-1.5">
                <UserPlus className="size-3.5" />
                Invite
              </Button>
            </div>
          </div>

          {/* Edit access — collaborators list. */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">Edit access</h3>
            <div className="space-y-1.5">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between gap-3 px-1 py-1">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={collaborator.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {collaborator.name}{collaborator.role === "owner" && " (you)"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{collaborator.email}</p>
                    </div>
                  </div>
                  {collaborator.role === "owner" ? (
                    <span className="text-[11px] text-muted-foreground">Owner</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: string) => updateCollaboratorRole(collaborator.id, value as "editor" | "viewer")}
                      >
                        <SelectTrigger className="w-[104px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeCollaborator(collaborator.id)}
                        aria-label="Remove collaborator"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Project access — visibility. */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">Project access</h3>
            <Row>
              <div className="flex min-w-0 items-center gap-2.5">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[13px]">Visible to your workspace</p>
                  <p className="text-[11px] text-muted-foreground">Anyone in your workspace can view this project</p>
                </div>
              </div>
              <Select value={visibility} onValueChange={(v: string) => setVisibility(v as typeof visibility)}>
                <SelectTrigger className="w-[128px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <span className="flex items-center gap-2"><Globe className="size-3.5" />Public</span>
                  </SelectItem>
                  <SelectItem value="workspace">
                    <span className="flex items-center gap-2"><Users className="size-3.5" />Workspace</span>
                  </SelectItem>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2"><Lock className="size-3.5" />Private</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </div>

          {/* Create invite link. */}
          <Row>
            <div className="flex min-w-0 items-center gap-2.5">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[13px]">Create invite link</p>
                <p className="text-[11px] text-muted-foreground">Anyone with this link can join</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleCopyInviteLink} className="gap-1.5">
              {inviteLinkCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {inviteLinkCopied ? "Copied" : "Create"}
            </Button>
          </Row>

          {/* Share + upgrade — footer actions, consistent buttons. */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-[13px] font-medium">Share project</p>
              <p className="text-[11px] text-muted-foreground">
                {visibility === "public" ? "Anyone with the link can view" : "Restricted to invited members"}
              </p>
            </div>
            <Button onClick={handleCopyLink} className="gap-1.5">
              {linkCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {linkCopied ? "Copied" : "Copy link"}
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-[13px] font-medium">Upgrade to Enterprise</p>
              <p className="text-[11px] text-muted-foreground">Advanced features &amp; enterprise support</p>
            </div>
            <Button variant="outline">Contact us</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
