"use client";

import { HiSparkles } from "react-icons/hi2";
import { LuUpload } from "react-icons/lu";
import { useT } from "@/lib/i18n";

export type FormMode = "quick" | "advanced";

/**
 * Two-pill toggle that switches a form between:
 *  - "quick"    — just enter the numbers; bundled sample data is used behind the scenes
 *  - "advanced" — upload your own data files
 *
 * Designed to sit at the top of every service form so even users without
 * any input files can still get real results.
 */
export function ModeToggle({
  mode,
  setMode,
  className = "",
}: {
  mode: FormMode;
  setMode: (m: FormMode) => void;
  className?: string;
}) {
  const { t } = useT();
  return (
    <div className={"inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 " + className}>
      <button
        type="button"
        onClick={() => setMode("quick")}
        className={
          "flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-all cursor-pointer " +
          (mode === "quick"
            ? "bg-white text-amber-700 shadow-sm border border-amber-200"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        <HiSparkles className={mode === "quick" ? "text-amber-500" : "text-slate-400"} />
        {t("mode.quick")}
      </button>
      <button
        type="button"
        onClick={() => setMode("advanced")}
        className={
          "flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-all cursor-pointer " +
          (mode === "advanced"
            ? "bg-white text-slate-900 shadow-sm border border-slate-300"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        <LuUpload className={mode === "advanced" ? "text-slate-700" : "text-slate-400"} />
        {t("mode.advanced")}
      </button>
    </div>
  );
}

/** Small helper banner shown above forms describing the active mode. */
export function ModeBanner({ mode }: { mode: FormMode }) {
  const { t } = useT();
  if (mode === "quick") {
    return (
      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-3">
        <strong>{t("mode.quick_label")}</strong> {t("mode.quick_banner")}
      </div>
    );
  }
  return (
    <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mt-3">
      <strong>{t("mode.advanced_label")}</strong> {t("mode.advanced_banner")}
    </div>
  );
}
