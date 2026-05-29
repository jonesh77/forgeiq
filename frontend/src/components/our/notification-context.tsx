"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getNotificationCounts, NotificationCounts } from "@/lib/notifications";
import { useUser } from "@/lib/user";

const POLL_INTERVAL_MS = 30_000;

const Ctx = createContext<{
  counts: NotificationCounts;
  refresh: () => Promise<void>;
}>({
  counts: { unreadReplies: 0, pendingMessages: 0, isSuper: false },
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [counts, setCounts] = useState<NotificationCounts>({ unreadReplies: 0, pendingMessages: 0, isSuper: false });

  const refresh = async () => {
    if (!user?.isSignedIn) return;
    try {
      const next = await getNotificationCounts();
      setCounts(next);
    } catch {
      /* ignore — db is unreachable; we'll back off naturally */
    }
  };

  useEffect(() => {
    if (!user?.isSignedIn) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await refresh();
    };

    void tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    const onFocus = () => { void tick(); };
    window.addEventListener("focus", onFocus);

    return () => { cancelled = true; clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [user?.isSignedIn]);

  return <Ctx.Provider value={{ counts, refresh }}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  return useContext(Ctx);
}

/** Tiny round badge — pass `count`. Renders nothing when 0. */
export function NotifBadge({ count, className = "" }: { count: number; className?: string }) {
  if (!count || count <= 0) return null;
  return (
    <span className={"inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white " + className}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Single red dot — for compact spots like the avatar. */
export function NotifDot({ show, className = "" }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span className={"absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white " + className}></span>
  );
}
