"use client";

import { useT } from "@/lib/i18n";

/**
 * Animated industrial hero banner for Pass Schedule results.
 * SVG hammer striking a glowing ingot, sparks flying, gear & rivets.
 * Pure CSS animations — no canvas / no extra dependencies.
 */
export function ForgingBanner({ numPasses, minVoid }: { numPasses: number; minVoid: number }) {
  const { t } = useT();
  const meets = minVoid >= 95;
  const accent = meets ? "from-emerald-500 to-teal-500" : minVoid >= 80 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-blue-900/50 shadow-2xl shadow-blue-900/30">
      {/* Blueprint grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="forging-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#forging-grid)" />
      </svg>

      {/* Glowing orange forge in left side */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl animate-glow-pulse"></div>
      <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-400/30 blur-2xl animate-glow-pulse" style={{ animationDelay: "0.5s" }}></div>

      {/* Hammer + ingot SVG illustration */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
        <svg viewBox="0 0 280 200" className="w-72 h-52">
          {/* Anvil base */}
          <g transform="translate(80, 130)">
            <path d="M0 30 L120 30 L130 50 L-10 50 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="20" y="10" width="80" height="20" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M10 0 L110 0 L100 10 L20 10 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* Ingot (glowing red-hot) */}
          <g transform="translate(95, 125)">
            <rect x="0" y="0" width="80" height="12" rx="2" fill="url(#hotMetal)" stroke="#fbbf24" strokeWidth="0.8" />
            <rect x="2" y="2" width="76" height="3" fill="#fef3c7" opacity="0.7" />
          </g>
          <defs>
            <linearGradient id="hotMetal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>

          {/* Hammer (animated swing) */}
          <g className="animate-hammer" style={{ transformOrigin: "200px 30px" }}>
            <line x1="200" y1="30" x2="135" y2="100" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
            <line x1="200" y1="30" x2="135" y2="100" stroke="#a16207" strokeWidth="2.5" />
            <rect x="115" y="80" width="50" height="32" rx="3" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
            <rect x="115" y="80" width="50" height="8" fill="#64748b" />
            <rect x="160" y="78" width="12" height="36" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          </g>

          {/* Sparks (flying off the ingot) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const sx = Math.cos(angle) * 60;
            const sy = Math.sin(angle) * 40 - 30;
            return (
              <circle
                key={i}
                cx="135" cy="130" r="2"
                fill="#fef3c7"
                className="animate-spark"
                style={{ "--sx": sx + "px", "--sy": sy + "px", animationDelay: `${i * 0.15}s` } as React.CSSProperties}
              />
            );
          })}
        </svg>
      </div>

      {/* Text content */}
      <div className="relative px-8 py-10 md:py-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-[10px] font-bold uppercase tracking-widest text-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          {t("cog.banner.eyebrow_pre")} {numPasses} {t("cog.banner.eyebrow_post")}
        </div>

        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight font-montserrat text-white leading-[1.1]">
          {t("cog.banner.title")}{" "}
          <span className={"bg-clip-text text-transparent bg-gradient-to-r " + accent}>
            {meets ? t("cog.banner.state_ok") : minVoid >= 80 ? t("cog.banner.state_close") : t("cog.banner.state_bad")}
          </span>
        </h2>

        <p className="mt-3 text-sm text-slate-400 max-w-md">
          {meets
            ? t("cog.banner.desc_ok")
            : minVoid >= 80
              ? t("cog.banner.desc_close")
              : t("cog.banner.desc_bad")}
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">{t("cog.banner.chip_min")}: <strong className="text-white">{minVoid.toFixed(1)}%</strong></span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">{t("cog.banner.chip_target")}: <strong className="text-white">≥ 95%</strong></span>
        </div>
      </div>
    </div>
  );
}
