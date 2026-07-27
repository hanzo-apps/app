/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useUser } from "@/hooks/useUser";
import { usePathname } from "next/navigation";
import { UserContext } from "@/components/contexts/user-context";
import { useBroadcastChannel } from "@/lib/useBroadcastChannel";

export default function AppContext({ children }: { children: React.ReactNode }) {
  const { loginFromCode, user, logout, loading } = useUser();
  const pathname = usePathname();

  const events: any = {};

  useBroadcastChannel("auth", (message) => {
    if (pathname.includes("/auth/callback")) return;

    if (!message.code) return;
    if (message.type === "user-oauth" && message?.code && !events.code) {
      loginFromCode(message.code);
    }
  });

  return (
    <UserContext value={{ user, loading, logout } as any}>
      {children}
    </UserContext>
  );
}
