"use client";

import { ReactNode } from "react";
import { useT } from "@/lib/i18n";

/**
 * Futuristic/holographic frame for the 3D Preform STL viewer.
 *  - Animated glowing border (violet → fuchsia)
 *  - Floating particles around the corners
 *  - Diagonal scan lines moving across (CSS only)
 *  - Holographic corner brackets like a sci-fi HUD
 */
export function HologramFrame({
  children,
  metrics,
  className = "",
}: {
  children: ReactNode;
  metrics?: { label: string; value: string }[];
  className?: string;
}) {
  const { t } = useT();
  return (
    <div className={"relative " + className}>
      {/* Outer animated glow ring */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-purple-500/50 blur-xl animate-border-glow"></div>

      {/* Floating particles around the corners */}
      <Particles />

      {/* Main holographic container */}
      <div className="relative rounded-3xl border-2 border-violet-400/40 overflow-hidden">
        {/* Animated diagonal scan line moving top→bottom */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div
            className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-violet-300/70 to-transparent animate-scan blur-sm"
          ></div>
        </div>

        {/* Corner brackets (HUD style) */}
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />

        {/* HUD top strip */}
        <div className="relative bg-gradient-to-b from-slate-950 to-transparent text-violet-100 px-5 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest border-b border-violet-500/20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t("holo.live")}
          </div>
          <div className="flex items-center gap-3 text-violet-300">
            <span>{t("holo.fov")}</span>
            <span>·</span>
            <span>{t("holo.orbit")}</span>
          </div>
        </div>

        {/* The actual content (STL canvas) */}
        <div className="relative">{children}</div>

        {/* HUD bottom strip with metrics */}
        {metrics && metrics.length > 0 && (
          <div className="relative bg-gradient-to-t from-slate-950 to-transparent border-t border-violet-500/20 px-5 py-3 flex items-center gap-6 text-xs">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-violet-300/70 font-mono">{m.label}</span>
                <span className="font-bold font-montserrat text-fuchsia-300">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const styles = {
    tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
    tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
    bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
    br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
  };
  return <div className={"absolute w-8 h-8 border-fuchsia-400 z-20 " + styles[pos]}></div>;
}

function Particles() {
  // Decorative particles positioned around the frame
  const dots = [
    { left: "-8px", top: "12%", delay: "0s", color: "bg-fuchsia-400" },
    { left: "-12px", top: "55%", delay: "1.1s", color: "bg-violet-400" },
    { left: "-6px", top: "80%", delay: "2.2s", color: "bg-purple-400" },
    { right: "-8px", top: "20%", delay: "0.6s", color: "bg-fuchsia-400" },
    { right: "-12px", top: "50%", delay: "1.7s", color: "bg-violet-400" },
    { right: "-5px", top: "85%", delay: "2.8s", color: "bg-purple-400" },
    { left: "30%", top: "-6px", delay: "0.3s", color: "bg-violet-400" },
    { left: "65%", top: "-10px", delay: "1.4s", color: "bg-fuchsia-400" },
    { left: "20%", bottom: "-8px", delay: "0.9s", color: "bg-purple-400" },
    { left: "75%", bottom: "-6px", delay: "2.1s", color: "bg-violet-400" },
  ];

  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className={"absolute w-1.5 h-1.5 rounded-full animate-particle pointer-events-none " + d.color}
          style={{ ...d, animationDelay: d.delay }}
        />
      ))}
    </>
  );
}
