"use client";

import { PiCompassTool, PiCube } from "react-icons/pi";
import { TbChartArea } from "react-icons/tb";
import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { useT } from "@/lib/i18n";

/**
 * Each program has a distinctive "hero strip" with its own visual language:
 *  - Cogging  → industrial blue, blueprint grid, sharp lines
 *  - Pmap     → emerald, scientific contour topography, data lines
 *  - Preform  → violet futuristic, holographic wireframe vibe
 *
 * Collapsible — users can shrink it after they've seen it once (state per program).
 */

type Variant = "cogging" | "pmap" | "preform";

const STORAGE_PREFIX = "program_hero_open:";

export function ProgramHero({ variant }: { variant: Variant }) {
  const { t } = useT();
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(STORAGE_PREFIX + variant);
    return v === null ? true : v === "1";
  });

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try { localStorage.setItem(STORAGE_PREFIX + variant, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  return (
    <div className="relative">
      {variant === "cogging"  && <CoggingHero open={open} />}
      {variant === "pmap"     && <PmapHero open={open} />}
      {variant === "preform"  && <PreformHero open={open} />}

      <button
        type="button"
        onClick={toggle}
        className="absolute top-3 right-4 z-10 flex items-center gap-1 px-2 h-7 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white/90 text-[11px] cursor-pointer"
        title={open ? "Collapse hero" : "Expand hero"}
      >
        {open ? <><LuChevronUp />{t("hero.hide")}</> : <><LuChevronDown />{t("hero.show")}</>}
      </button>
    </div>
  );
}

/* ----------------------- COGGING — industrial blue ----------------------- */
function CoggingHero({ open }: { open: boolean }) {
  const { t } = useT();
  if (!open) {
    return <CompactHero color="from-blue-900 to-slate-900" icon={<PiCompassTool />} title={t("nav.cogging")} />;
  }
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white">
      {/* Engineering blueprint grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cogging-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <pattern id="cogging-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cogging-grid)" />
        <rect width="100%" height="100%" fill="url(#cogging-grid-major)" />
      </svg>

      {/* Diagonal industrial accent */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rotate-12 bg-blue-500/15 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 -rotate-12 bg-cyan-500/10 blur-3xl"></div>

      {/* Iron-rod stripes (decorative) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 hidden lg:block">
        <svg viewBox="0 0 300 400" className="w-full h-full">
          {[40, 80, 120, 160, 200, 240].map((y, i) => (
            <g key={i}>
              <line x1="20" y1={y} x2="280" y2={y} stroke="#60a5fa" strokeWidth="3" />
              <circle cx="20" cy={y} r="6" fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="280" cy={y} r="6" fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-12 animate-fade-up">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-[10px] font-bold uppercase tracking-widest text-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            {t("hero.cogging.badge")}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-montserrat tracking-tight leading-[1.05]">
          {t("hero.cogging.title1")} <br />
          <span className="text-blue-300">{t("hero.cogging.title2")}</span>
        </h1>
        <p
          className="mt-4 text-blue-100/80 max-w-2xl text-sm md:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t("hero.cogging.desc") }}
        />

        <div className="mt-7 grid grid-cols-3 gap-4 max-w-2xl">
          <Kpi value={t("hero.cogging.kpi1_v")} label={t("hero.cogging.kpi1_l")} />
          <Kpi value={t("hero.cogging.kpi2_v")} label={t("hero.cogging.kpi2_l")} />
          <Kpi value={t("hero.cogging.kpi3_v")} label={t("hero.cogging.kpi3_l")} />
        </div>

        <CoggingStrip />
      </div>
    </section>
  );
}

/* Cogging process strip — glowing forge billet slides through 7 pass markers */
function CoggingStrip() {
  return (
    <div className="relative mt-10 h-24 overflow-hidden rounded-lg border border-blue-400/20 bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-blue-950/60">
      {/* Track / anvil line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />

      {/* 7 pass markers */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="block w-0.5 h-6 bg-blue-300/60 hero-marker-pulse"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
            <span className="text-[9px] text-blue-200/60 font-mono tracking-wider">P{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Glowing hot billet — slides across */}
      <div className="absolute inset-y-0 left-0 w-1/6 flex items-center hero-slide-x pointer-events-none">
        <div className="relative w-full h-5 mx-2">
          <div className="absolute inset-0 rounded-sm bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 hero-glow-shift text-amber-400" />
          {/* heat trail */}
          <div className="absolute inset-y-0 -left-8 w-8 bg-gradient-to-l from-amber-400/60 to-transparent rounded-l-full blur-sm" />
        </div>
      </div>

      {/* Sparks scattered around the track (decorative, fixed positions, staggered) */}
      <div className="absolute inset-0 pointer-events-none">
        {[15, 28, 42, 55, 68, 82].map((leftPct, i) => (
          <span
            key={i}
            className="absolute top-1/2 w-1 h-1 rounded-full bg-amber-300 hero-spark"
            style={{ left: `${leftPct}%`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------- PROCESSING MAP — emerald scientific ----------------- */
function PmapHero({ open }: { open: boolean }) {
  const { t } = useT();
  if (!open) {
    return <CompactHero color="from-emerald-900 to-slate-900" icon={<TbChartArea />} title={t("nav.processing_map")} />;
  }
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900 text-white">
      {/* Contour topography lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="pmap-grad" cx="70%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[60, 90, 130, 180, 240, 310, 390].map((r, i) => (
          <circle
            key={i}
            cx="80%" cy="50%" r={r}
            fill="none"
            stroke="#34d399"
            strokeWidth={i % 2 === 0 ? "1" : "0.5"}
            strokeDasharray={i % 3 === 0 ? "0" : "4 4"}
          />
        ))}
        <circle cx="80%" cy="50%" r="450" fill="url(#pmap-grad)" />
      </svg>

      {/* Particle dots */}
      <div className="absolute inset-0 bg-dots opacity-40"></div>

      {/* Data plot lines (decorative) */}
      <div className="absolute right-10 bottom-10 opacity-40 hidden lg:block">
        <svg viewBox="0 0 240 120" className="w-60 h-32">
          <polyline points="0,80 30,60 60,75 90,40 120,55 150,30 180,45 210,20 240,35"
                    fill="none" stroke="#6ee7b7" strokeWidth="2" />
          <polyline points="0,100 30,90 60,95 90,80 120,85 150,70 180,75 210,60 240,65"
                    fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-12 animate-fade-up">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t("hero.pmap.badge")}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-montserrat tracking-tight leading-[1.05]">
          {t("hero.pmap.title1")} <br />
          <span className="text-emerald-300">{t("hero.pmap.title2")}</span>
        </h1>
        <p
          className="mt-4 text-emerald-100/80 max-w-2xl text-sm md:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t("hero.pmap.desc") }}
        />

        <div className="mt-7 grid grid-cols-3 gap-4 max-w-2xl">
          <Kpi value={t("hero.pmap.kpi1_v")} label={t("hero.pmap.kpi1_l")} accent="emerald" />
          <Kpi value={t("hero.pmap.kpi2_v")} label={t("hero.pmap.kpi2_l")} accent="emerald" />
          <Kpi value={t("hero.pmap.kpi3_v")} label={t("hero.pmap.kpi3_l")} accent="emerald" />
        </div>

        <PmapStrip />
      </div>
    </section>
  );
}

/* Processing-map strip — data-point grid with a sweeping scan line */
function PmapStrip() {
  // Deterministic grid of heat-map points (4 rows × 12 cols). Each pulses
  // as the scan line passes — we offset animation delay by column index.
  const rows = 4, cols = 12;
  return (
    <div className="relative mt-10 h-24 overflow-hidden rounded-lg border border-emerald-400/20 bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-teal-950/60">
      {/* Data-point grid */}
      <div className="absolute inset-0 px-6 py-3 grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          // simulate heatmap intensity — middle rows hotter
          const intensity = 1 - Math.abs(row - (rows - 1) / 2) / rows;
          return (
            <span
              key={i}
              className="m-auto rounded-full hero-marker-pulse"
              style={{
                width: 4 + intensity * 5,
                height: 4 + intensity * 5,
                background: `rgba(${Math.round(110 + intensity * 120)}, ${Math.round(231 - intensity * 60)}, ${Math.round(183 - intensity * 60)}, ${0.35 + intensity * 0.5})`,
                animationDelay: `${col * 0.12}s`,
              }}
            />
          );
        })}
      </div>

      {/* Sweeping scan line */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-emerald-300 to-transparent shadow-[0_0_18px_rgba(52,211,153,0.9)] hero-scan-line" />

      {/* Axis labels */}
      <div className="absolute left-2 top-1 text-[9px] text-emerald-200/60 font-mono tracking-wide">T → ε̇</div>
      <div className="absolute right-2 bottom-1 text-[9px] text-emerald-200/60 font-mono tracking-wide">η · ξ</div>
    </div>
  );
}

/* ------------------ 3D PREFORM — violet futuristic ------------------ */
function PreformHero({ open }: { open: boolean }) {
  const { t } = useT();
  if (!open) {
    return <CompactHero color="from-violet-900 to-slate-900" icon={<PiCube />} title={t("nav.preform_3d")} />;
  }
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-950 to-fuchsia-950 text-white">
      {/* Hologram grid floor */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-25 pointer-events-none"
           style={{
             backgroundImage: `linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)`,
             backgroundSize: "40px 40px",
             maskImage: "linear-gradient(to top, black, transparent)",
             WebkitMaskImage: "linear-gradient(to top, black, transparent)",
             transform: "perspective(800px) rotateX(60deg)",
             transformOrigin: "center bottom",
           }}>
      </div>

      {/* Floating wireframe cube */}
      <div className="absolute right-10 top-10 opacity-50 hidden lg:block animate-float">
        <svg viewBox="0 0 200 200" className="w-44 h-44">
          {/* Front face */}
          <rect x="40" y="60" width="100" height="100" fill="none" stroke="#c084fc" strokeWidth="1.5" />
          {/* Back face */}
          <rect x="70" y="30" width="100" height="100" fill="none" stroke="#a855f7" strokeWidth="1.5" />
          {/* Connecting edges */}
          <line x1="40" y1="60" x2="70" y2="30" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="140" y1="60" x2="170" y2="30" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="40" y1="160" x2="70" y2="130" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="140" y1="160" x2="170" y2="130" stroke="#c084fc" strokeWidth="1.5" />
          {/* Vertex dots */}
          {[
            [40,60],[140,60],[40,160],[140,160],
            [70,30],[170,30],[70,130],[170,130],
          ].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#e9d5ff" />
          ))}
        </svg>
      </div>

      {/* Glowing blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-fuchsia-600/30 blur-3xl animate-drift"></div>
      <div className="absolute -bottom-32 right-1/3 w-96 h-96 rounded-full bg-violet-600/30 blur-3xl animate-drift" style={{ animationDelay: "3s" }}></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-12 animate-fade-up">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/20 border border-violet-400/30 text-[10px] font-bold uppercase tracking-widest text-violet-200">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            {t("hero.preform.badge")}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-montserrat tracking-tight leading-[1.05]">
          {t("hero.preform.title1")} <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-fuchsia-300">{t("hero.preform.title2")}</span>
        </h1>
        <p
          className="mt-4 text-violet-100/80 max-w-2xl text-sm md:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t("hero.preform.desc") }}
        />

        <div className="mt-7 grid grid-cols-3 gap-4 max-w-2xl">
          <Kpi value={t("hero.preform.kpi1_v")} label={t("hero.preform.kpi1_l")} accent="violet" />
          <Kpi value={t("hero.preform.kpi2_v")} label={t("hero.preform.kpi2_l")} accent="violet" />
          <Kpi value={t("hero.preform.kpi3_v")} label={t("hero.preform.kpi3_l")} accent="violet" />
        </div>

        <PreformStrip />
      </div>
    </section>
  );
}

/* 3D Preform strip — drifting voxel cubes + holographic scan line */
function PreformStrip() {
  // Spread voxels across the strip with varied sizes, vertical offsets, delays
  const voxels = [
    { size: 12, top: 30, delay: 0,   duration: 6.5 },
    { size: 8,  top: 65, delay: 0.8, duration: 5.5 },
    { size: 14, top: 20, delay: 1.6, duration: 7.5 },
    { size: 10, top: 55, delay: 2.4, duration: 6 },
    { size: 9,  top: 40, delay: 3.2, duration: 5.8 },
    { size: 13, top: 70, delay: 4.0, duration: 7 },
    { size: 7,  top: 25, delay: 4.8, duration: 5.2 },
  ];
  return (
    <div className="relative mt-10 h-24 overflow-hidden rounded-lg border border-violet-400/20 bg-gradient-to-r from-violet-950/60 via-purple-950/60 to-fuchsia-950/60">
      {/* Perspective grid floor */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom, transparent, black 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 60%)",
        }}
      />

      {/* Drifting voxel cubes */}
      {voxels.map((v, i) => (
        <div
          key={i}
          className="absolute left-0 hero-voxel-drift pointer-events-none"
          style={{
            top: `${v.top}%`,
            width: v.size,
            height: v.size,
            animationDelay: `${v.delay}s`,
            animationDuration: `${v.duration}s`,
          }}
        >
          <div
            className="w-full h-full rounded-[2px] border border-violet-300/70 bg-violet-500/20"
            style={{ boxShadow: "0 0 10px rgba(192,132,252,0.6)" }}
          />
        </div>
      ))}

      {/* Holographic scan line */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-fuchsia-300 to-transparent shadow-[0_0_18px_rgba(232,121,249,0.9)] hero-scan-line" />

      {/* Coordinates label */}
      <div className="absolute left-2 top-1 text-[9px] text-violet-200/60 font-mono tracking-wide">128³</div>
      <div className="absolute right-2 bottom-1 text-[9px] text-violet-200/60 font-mono tracking-wide">STL ✓</div>
    </div>
  );
}

function CompactHero({ color, icon, title }: { color: string; icon: React.ReactNode; title: string }) {
  return (
    <div className={"relative bg-gradient-to-r " + color + " text-white"}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-semibold tracking-tight">{title}</span>
      </div>
    </div>
  );
}

const KPI_ACCENT = {
  blue: { value: "text-blue-200", label: "text-blue-300/70" },
  emerald: { value: "text-emerald-200", label: "text-emerald-300/70" },
  violet: { value: "text-violet-200", label: "text-violet-300/70" },
};

function Kpi({ value, label, accent = "blue" }: { value: string; label: string; accent?: keyof typeof KPI_ACCENT }) {
  const a = KPI_ACCENT[accent];
  return (
    <div className="border-l-2 border-white/20 pl-4">
      <div className={"text-2xl md:text-3xl font-bold font-montserrat " + a.value}>{value}</div>
      <div className={"text-[10px] uppercase tracking-widest mt-1 " + a.label}>{label}</div>
    </div>
  );
}
