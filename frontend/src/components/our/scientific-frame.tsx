"use client";

import { ReactNode } from "react";
import { useT } from "@/lib/i18n";

/**
 * Scientific lab-style frame for Processing Map plots.
 * Decorative SVG corners (target reticles), animated topographic isolines,
 * subtle glow border. Keeps the chart itself prominent.
 */
export function ScientificFrame({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useT();
  return (
    <div className={"relative " + className}>
      {/* Outer glow (animated emerald to teal) */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-300/40 via-teal-300/40 to-cyan-300/40 blur-xl opacity-60"></div>

      {/* Animated topographic isolines decoration (top-right corner) */}
      <svg className="absolute -top-4 -right-4 w-40 h-40 opacity-50 pointer-events-none" viewBox="0 0 160 160">
        {[20, 35, 55, 80, 110].map((r, i) => (
          <circle
            key={i}
            cx="120" cy="40" r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            className="animate-iso"
            style={{ animationDelay: `${i * 0.2}s`, strokeDasharray: 2 * Math.PI * r, strokeDashoffset: 2 * Math.PI * r }}
          />
        ))}
      </svg>

      {/* Animated isolines bottom-left */}
      <svg className="absolute -bottom-4 -left-4 w-40 h-40 opacity-30 pointer-events-none rotate-180" viewBox="0 0 160 160">
        {[20, 38, 60, 90].map((r, i) => (
          <circle
            key={i}
            cx="40" cy="120" r={r}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="1"
            className="animate-iso"
            style={{ animationDelay: `${0.6 + i * 0.2}s`, strokeDasharray: 2 * Math.PI * r, strokeDashoffset: 2 * Math.PI * r }}
          />
        ))}
      </svg>

      {/* Main card */}
      <div className="relative bg-white rounded-3xl border border-emerald-200/60 shadow-xl shadow-emerald-500/10 overflow-hidden">
        {/* Top accent strip */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        {/* Header (if title given) */}
        {(title || subtitle) && (
          <div className="px-6 pt-5 pb-3 border-b border-emerald-100/60 bg-gradient-to-b from-emerald-50/40 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div>
                {title && (
                  <h3 className="text-base font-semibold text-slate-900 font-montserrat flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {title}
                  </h3>
                )}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>

              {/* Corner reticles (target markers) */}
              <Reticle />
            </div>
          </div>
        )}

        {/* Chart content */}
        <div className="p-4">{children}</div>

        {/* Axis legend strip */}
        <div className="px-6 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            {t("pmap.common.live_plot")}
          </span>
          <span className="font-mono normal-case">⌖ {t("pmap.common.scientific_render")}</span>
        </div>
      </div>
    </div>
  );
}

function Reticle() {
  return (
    <div className="relative w-9 h-9">
      <svg viewBox="0 0 32 32" className="w-9 h-9 text-emerald-600">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        <line x1="16" y1="0" x2="16" y2="6" stroke="currentColor" strokeWidth="0.8" />
        <line x1="16" y1="26" x2="16" y2="32" stroke="currentColor" strokeWidth="0.8" />
        <line x1="0" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="0.8" />
        <line x1="26" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-pulse-ring"></div>
    </div>
  );
}
