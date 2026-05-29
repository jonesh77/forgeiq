"use client";

import { Header } from "@/app/cogging/page";
import { MdOutlineUnfoldMore } from "react-icons/md";
import Link from "next/link";

type Accent = "blue" | "emerald" | "violet" | "slate" | "indigo";

const ACCENT: Record<Accent, { divider: string; title: string; chevron: string; dot: string }> = {
  blue:    { divider: "bg-blue-400/60",    title: "from-blue-700 to-blue-500",          chevron: "text-blue-600",    dot: "bg-blue-500" },
  emerald: { divider: "bg-emerald-400/60", title: "from-emerald-700 to-emerald-500",    chevron: "text-emerald-600", dot: "bg-emerald-500" },
  violet:  { divider: "bg-violet-400/60",  title: "from-violet-700 to-violet-500",      chevron: "text-violet-600",  dot: "bg-violet-500" },
  slate:   { divider: "bg-slate-400/60",   title: "from-slate-800 to-slate-500",        chevron: "text-slate-600",   dot: "bg-slate-500" },
  indigo:  { divider: "bg-indigo-400/60",  title: "from-indigo-700 to-indigo-500",      chevron: "text-indigo-600",  dot: "bg-indigo-500" },
};

/**
 * Top bar shown on every program page. Renders the global Header from
 * /cogging/page.tsx with a program-specific divider, title and chevron
 * picked by accent.
 */
export function ProgramHeader({
  title,
  accent,
  minimize = false,
}: {
  title: string;
  accent: Accent;
  minimize?: boolean;
}) {
  const a = ACCENT[accent];
  return (
    <div className="font-public sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
      <div className="px-6 lg:px-8 py-3">
        <Header
          minimize={minimize}
          first={
            <Link href="/" className="flex items-center leading-tight group">
              <div className="text-lg font-bold text-slate-900 tracking-tight font-montserrat group-hover:opacity-80 transition-opacity">
                Forge<span className="text-indigo-600">IQ</span>
              </div>
              <div className={"h-6 w-px mx-4 " + a.divider}></div>
            </Link>
          }
          second={
            <button type="button" className="flex items-center gap-2 hover:bg-slate-100 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors">
              <span className={"text-base font-semibold font-montserrat text-transparent bg-clip-text bg-gradient-to-r " + a.title}>{title}</span>
              <MdOutlineUnfoldMore className={a.chevron} />
            </button>
          }
        />
      </div>
    </div>
  );
}

/**
 * Compact tab strip — used under ProgramHeader on multi-tab pages.
 * Each accent (blue/emerald/violet/...) gets its own hover gradient + active
 * gradient + glow. Styling lives in globals.css under `.tab-btn` so we can
 * use `:hover` pseudo-classes and CSS variables instead of inline JS.
 */
export function TabStrip({
  tabs,
  active,
  onChange,
  accent = "indigo",
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
  accent?: Accent;
}) {
  // CSS file knows blue / emerald / violet; other accents fall back to blue.
  const css = (["blue", "emerald", "violet"] as const).includes(accent as any) ? accent : "blue";
  return (
    <div className="border-b border-slate-200 bg-white/85 backdrop-blur-sm">
      <div className="px-6 lg:px-8 py-2 flex items-center gap-1.5">
        {tabs.map((label, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className="tab-btn font-public"
              data-accent={css}
              data-active={isActive ? "true" : "false"}
            >
              {label}
              {isActive && <span className="tab-underline" data-accent={css} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
