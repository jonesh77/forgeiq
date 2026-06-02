"use client";

import { Header } from "@/app/cogging/page";
import { MdOutlineUnfoldMore } from "react-icons/md";
import Link from "next/link";
import { useUser } from "@/lib/user";
import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { LuX, LuArrowRight } from "react-icons/lu";
import { HiSparkles } from "react-icons/hi2";

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
      <DemoBanner />
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

const DEMO_BANNER_DISMISS_KEY = "demo_banner_dismissed_v1";

function DemoBanner() {
  const user = useUser();
  const { t } = useT();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (user?.isSignedIn) { setDismissed(true); return; }
    try {
      const v = window.localStorage.getItem(DEMO_BANNER_DISMISS_KEY);
      setDismissed(v === "1");
    } catch { setDismissed(false); }
  }, [user?.isSignedIn]);

  if (user?.isSignedIn || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { window.localStorage.setItem(DEMO_BANNER_DISMISS_KEY, "1"); } catch {}
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-200">
      <div className="px-6 lg:px-8 py-2 flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
          <HiSparkles className="text-amber-600" />{t("demo.banner.chip")}
        </span>
        <p className="flex-1 text-xs sm:text-sm text-amber-900 leading-tight">
          {t("demo.banner.text")}
        </p>
        <Link href="/auth/register" className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] sm:text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors">
          {t("demo.banner.cta")} <LuArrowRight />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          title={t("demo.banner.dismiss")}
          className="shrink-0 w-6 h-6 rounded-md text-amber-700 hover:bg-amber-200/70 flex items-center justify-center cursor-pointer transition-colors"
        >
          <LuX className="text-sm" />
        </button>
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
