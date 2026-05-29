"use client";

import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/lib/ai-assistant";
import { HiSparkles } from "react-icons/hi2";
import { IoMdSend } from "react-icons/io";
import { LuX } from "react-icons/lu";
import { AiOutlineLoading } from "react-icons/ai";
import { useUser } from "@/lib/user";

type Msg = { from: "user" | "assistant"; text: string; source?: "ai" | "faq" };

const SUGGESTIONS = [
  "How do I train a cogging model?",
  "What columns does processing map need?",
  "Why is sample run slow on 3D Preform?",
  "How do I export results to PDF?",
];

const EVENT_OPEN = "forgeiq:open-ai-assistant";
const EVENT_TOGGLE = "forgeiq:toggle-ai-assistant";

/** Open the AI assistant from anywhere (e.g. a header button). */
export function openAiAssistant() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT_OPEN));
}
export function toggleAiAssistant() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT_TOGGLE));
}

/**
 * AI assistant — no floating button. Opens as a slide-in side panel
 * triggered by openAiAssistant() (e.g. the "Ask AI" header button).
 */
export function AiAssistant() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "assistant",
      text: "Hi! I can answer quick questions about the platform — Cogging, Processing Map, 3D Preform, samples, bookmarks, and so on. What can I help with?",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleToggle = () => setOpen((o) => !o);
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener(EVENT_OPEN, handleOpen);
    window.addEventListener(EVENT_TOGGLE, handleToggle);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener(EVENT_OPEN, handleOpen);
      window.removeEventListener(EVENT_TOGGLE, handleToggle);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!user?.isSignedIn) return null;

  const send = async (text?: string) => {
    const q = (text ?? draft).trim();
    if (!q || busy) return;
    // Snapshot the conversation BEFORE adding the new user message — that's
    // the "history" the model needs for context (the new question is sent
    // separately as the latest user turn).
    const priorHistory = messages.map((m) => ({ from: m.from, text: m.text }));
    setMessages((m) => [...m, { from: "user", text: q }]);
    setDraft("");
    setBusy(true);
    try {
      const r = await askAssistant({ question: q, history: priorHistory.slice(-8) });
      setMessages((m) => [...m, { from: "assistant", text: r.answer, source: r.source === "ai" ? "ai" : "faq" }]);
    } catch {
      setMessages((m) => [...m, { from: "assistant", text: "Sorry, something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Backdrop — clickable to close, but only on mobile (hidden on lg) */}
      <div
        onClick={() => setOpen(false)}
        className={
          "fixed inset-0 z-30 bg-black/20 transition-opacity lg:hidden " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        aria-hidden="true"
      />

      {/* Slide-in side panel */}
      <aside
        className={
          "fixed top-0 right-0 z-40 h-screen w-[380px] max-w-[100vw] bg-white border-l border-slate-200 shadow-2xl flex flex-col font-public " +
          "transition-transform duration-200 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        aria-hidden={!open}
      >
        <header className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <HiSparkles className="text-sm" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">AI Assistant</div>
              <div className="text-[10px] text-slate-500">Quick help about the platform</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            title="Close (Esc)"
            className="w-8 h-8 rounded-md hover:bg-white/60 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <LuX />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-white">
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-3 py-2 text-xs flex items-center gap-2">
                <AiOutlineLoading className="animate-spin" />Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void send(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-200 p-2.5 bg-white">
          <div className="flex items-end gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
              placeholder="Ask a question..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || busy}
              className="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <IoMdSend />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.from === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
        {msg.text}
        {msg.source === "faq" && (
          <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">offline answer</div>
        )}
      </div>
    </div>
  );
}
