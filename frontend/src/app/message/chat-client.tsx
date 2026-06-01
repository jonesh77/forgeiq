"use client";

import { useEffect, useRef, useState } from "react";
import { appendMessage, getThread, listMyThreads, markThreadSeen, startThread, ChatThread, ChatEntry } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiOutlineLoading } from "react-icons/ai";
import { IoMdSend } from "react-icons/io";
import { LuMessageSquarePlus } from "react-icons/lu";
import { toast } from "sonner";
import { useNotifications } from "@/components/our/notification-context";
import { useT } from "@/lib/i18n";
import { ProgramHeader } from "@/components/our/program-header";

type Props = {
  initialThreads: ChatThread[];
  initialActiveId?: string;
  isSuper: boolean;
};

const POLL_MS = 4_000;

export default function ChatClient({ initialThreads, initialActiveId, isSuper }: Props) {
  const { t } = useT();
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | undefined>(initialActiveId || initialThreads[0]?._id);
  const [active, setActive] = useState<ChatThread | undefined>(
    initialThreads.find((t) => t._id === (initialActiveId || initialThreads[0]?._id)),
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { refresh: refreshNotif } = useNotifications();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  // Poll the active thread + thread list
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    const tick = async () => {
      const [list, thread] = await Promise.all([listMyThreads(), getThread(activeId)]);
      if (cancelled) return;
      setThreads(list);
      if (thread) setActive(thread);
    };

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeId]);

  // Mark seen + scroll when active thread changes or grows
  useEffect(() => {
    if (!active) return;
    void markThreadSeen(active._id).then(() => refreshNotif());
    scrollToBottom();
  }, [active?._id, active?.entries.length]);

  const send = async () => {
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    const r = await appendMessage(activeId, draft);
    setSending(false);
    if (r.ok) {
      setDraft("");
      // Immediately refresh
      const th = await getThread(activeId);
      if (th) setActive(th);
    } else {
      toast.error(r.error || t("msg.failed_send"));
    }
  };

  const createThread = async () => {
    if (!newText.trim()) return;
    setSending(true);
    const r = await startThread(newText);
    setSending(false);
    if (r.ok) {
      setNewText("");
      setNewOpen(false);
      const list = await listMyThreads();
      setThreads(list);
      setActiveId(r.id);
      const th = await getThread(r.id);
      if (th) setActive(th);
      toast.success(t("msg.started"));
    } else {
      toast.error(r.error || t("msg.failed_start"));
    }
  };

  return (
    <div className="font-public min-h-screen bg-slate-50/40 flex flex-col">
      <ProgramHeader title={isSuper ? t("msg.title_admin") : t("msg.title_user")} accent="slate" minimize />
      <div className="flex h-[calc(100vh-72px)] bg-white">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t("msg.conversations")}</h2>
            {!isSuper && (
              <Button size="sm" onClick={() => setNewOpen(true)} className="cursor-pointer h-8">
                <LuMessageSquarePlus />{t("msg.new")}
              </Button>
            )}
          </div>

          {newOpen && !isSuper && (
            <div className="p-3 border-b border-slate-200 bg-white">
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={t("msg.new_placeholder")}
                className="text-sm h-24 resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => { setNewOpen(false); setNewText(""); }} className="cursor-pointer">{t("msg.cancel")}</Button>
                <Button size="sm" onClick={createThread} disabled={!newText.trim() || sending} className="cursor-pointer">{t("msg.start")}</Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {isSuper ? t("msg.no_threads_admin") : t("msg.no_threads_user")}
              </div>
            ) : (
              threads.map((th) => {
                const isActive = th._id === activeId;
                const lastEntry = th.entries[th.entries.length - 1];
                const unread = isSuper ? th.unreadForAdmin : th.unreadForUser;
                return (
                  <button
                    key={th._id}
                    type="button"
                    onClick={() => setActiveId(th._id)}
                    className={
                      "w-full text-left px-4 py-3 border-b border-slate-100 transition-colors " +
                      (isActive ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-white")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isSuper && <span className="text-xs font-medium text-slate-900 truncate">{th.userName || th.userEmail || t("msg.unknown")}</span>}
                          {!isSuper && <span className="text-xs font-medium text-slate-900">{t("msg.support")}</span>}
                          {unread && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {lastEntry ? (lastEntry.from === "admin" ? t("msg.team_prefix") : t("msg.you_prefix")) + lastEntry.text : t("msg.empty_thread")}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatRel(th.lastAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <main className="flex-1 flex flex-col bg-white">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              {t("msg.select_thread")}
            </div>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-slate-200 bg-white">
                <div className="text-sm font-semibold text-slate-900">
                  {isSuper ? (active.userName || active.userEmail || t("msg.unknown_user")) : t("msg.support_team")}
                </div>
                <div className="text-xs text-slate-500">{isSuper ? active.userEmail : t("msg.usual_reply")}</div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-slate-50/30">
                {active.entries.length === 0 && <p className="text-center text-xs text-slate-400 italic">{t("msg.no_messages")}</p>}
                {active.entries.map((e, i) => (
                  <Bubble key={i} entry={e} viewerIsAdmin={isSuper} />
                ))}
              </div>

              <div className="border-t border-slate-200 p-3 bg-white">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder={t("msg.draft_placeholder")}
                    className="flex-1 resize-none min-h-[44px] max-h-32 text-sm"
                  />
                  <Button onClick={send} disabled={!draft.trim() || sending} className="cursor-pointer h-[44px]">
                    {sending ? <AiOutlineLoading className="animate-spin" /> : <IoMdSend />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Bubble({ entry, viewerIsAdmin }: { entry: ChatEntry; viewerIsAdmin: boolean }) {
  const isFromViewer =
    (viewerIsAdmin && entry.from === "admin") ||
    (!viewerIsAdmin && entry.from === "user");

  return (
    <div className={"flex " + (isFromViewer ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm " +
          (isFromViewer
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm")
        }
      >
        <p className="whitespace-pre-wrap break-words">{entry.text}</p>
        <div className={"text-[10px] mt-1 " + (isFromViewer ? "text-indigo-200" : "text-slate-400")}>
          {formatTime(entry.at)}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatRel(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const days = Math.floor(h / 24);
  if (days < 7) return days + "d";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
