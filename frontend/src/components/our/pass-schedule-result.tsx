"use client";

import { useState } from "react";
import Image from "next/image";
import feed_png from "../../../public/feed.png";
import depth_png from "../../../public/Depth schedule.png";
import rotation_png from "../../../public/Number of rotation.png";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { FaCopy } from "react-icons/fa6";
import { LuExpand } from "react-icons/lu";
import { PiCheckBold, PiInfo } from "react-icons/pi";
import { MdTrendingDown, MdSpeed } from "react-icons/md";
import { TbArrowsMaximize, TbCircleDot, TbStack3 } from "react-icons/tb";
import { ForgingBanner } from "@/components/our/forging-banner";
import { useT } from "@/lib/i18n";

export interface PassFeasibility {
  max_press_force_tons: number;
  initial_temp_C: number;
  temp_drop_per_pass_C: number;
  min_temp_C: number;
  force_tons_per_pass: number[];
  temperatures_C: number[];
  force_warnings: boolean[];
  temp_warnings: boolean[];
  any_force_overload: boolean;
  any_temp_too_low: boolean;
  all_passes_feasible: boolean;
}

export interface PassScheduleData {
  feed: number;
  depth_schedule: number;
  number_of_rotation: number;
  pass_schedule: number[];
  forging_ratios: string[];
  length_changes: number[];
  cutting_lengths: string[];
  void_closure: number[];
  /** Equipment-aware feasibility report (added in Faza B №1). */
  feasibility?: PassFeasibility;
}

export function PassScheduleResult({ data }: { data: PassScheduleData }) {
  const { t } = useT();
  const minVoid = Math.min(...data.void_closure);
  const avgVoid = data.void_closure.reduce((a, b) => a + b, 0) / data.void_closure.length;
  const finalLength = data.length_changes[data.length_changes.length - 1];
  const initialLength = data.length_changes[0];

  return (
    <div className="space-y-8 stagger">
      {/* Animated industrial banner */}
      <ForgingBanner numPasses={data.pass_schedule.length} minVoid={minVoid} />

      {/* Quick metrics strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4 shadow-sm">
        <Metric icon={<TbStack3 />} label={t("cog.res.total_passes")} value={data.pass_schedule.length} />
        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
        <Metric icon={<MdTrendingDown />} label={t("cog.res.min_void")} value={`${minVoid.toFixed(1)}%`} />
        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
        <Metric icon={<MdSpeed />} label={t("cog.res.avg_void")} value={`${avgVoid.toFixed(1)}%`} />
      </div>

      {/* Equipment-aware feasibility report */}
      {data.feasibility && <FeasibilityPanel f={data.feasibility} />}

      {/* 3 mechanical KPI cards (large) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MechanicalCard label={t("cog.res.feed_label")} value={data.feed} unit={t("cog.res.unit_mm")} img={feed_png} accent="blue" icon={<TbArrowsMaximize />} />
        <MechanicalCard label={t("cog.res.depth_label")} value={data.depth_schedule} unit={t("cog.res.unit_ratio")} img={depth_png} accent="indigo" icon={<TbCircleDot />} />
        <MechanicalCard label={t("cog.res.rotation_label")} value={data.number_of_rotation} unit={t("cog.res.unit_turns")} img={rotation_png} accent="violet" icon={<PiInfo />} />
      </div>

      {/* Per-pass detailed cards (one big horizontal row of pass cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t("cog.res.per_pass_title")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t("cog.res.per_pass_sub_pre")} {initialLength} {t("cog.res.per_pass_sub_mid")} {finalLength} {t("cog.res.per_pass_sub_post")}</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {data.pass_schedule.map((v, i) => (
            <PassCard
              key={i}
              n={i + 1}
              passValue={v}
              forging={data.forging_ratios[i]}
              length={data.length_changes[i]}
              cutting={data.cutting_lengths[i]}
              voidClosure={data.void_closure[i]}
            />
          ))}
        </div>
      </div>

      {/* Void closure progress strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t("cog.res.void_prog_title")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t("cog.res.void_prog_sub")}</p>
          </div>
          <div className="text-xs flex items-center gap-3">
            <LegendDot color="bg-red-500" label={t("cog.res.legend_low")} />
            <LegendDot color="bg-amber-500" label={t("cog.res.legend_mid")} />
            <LegendDot color="bg-emerald-500" label={t("cog.res.legend_high")} />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {data.void_closure.map((v, i) => (
            <VoidBar key={i} pass={i + 1} value={v} />
          ))}
        </div>
      </div>

      {/* Workpiece visualisation (cross-sections through passes) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{t("cog.res.cross_title")}</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-5">{t("cog.res.cross_sub")}</p>
        <div className="flex items-end gap-3 h-32">
          {data.length_changes.map((_, i) => {
            const max = Math.max(...data.length_changes);
            // Visualise the *cross-section* metaphor: as length grows the
            // cross-section shrinks (volume conservation), so smaller bars =
            // later passes. Compute heights as explicit pixels — using % on
            // an undeclared-height parent rendered 0px.
            const factor = data.length_changes[i] / (max || 1);     // 0..1
            const heightPx = Math.max(10, 30 + (1 - factor) * 70);  // 30–100 px
            const widthPx = Math.max(14, 20 + (1 - factor) * 50);   // 20–70 px
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="rounded-sm bg-gradient-to-b from-slate-300 to-slate-500 shadow-sm"
                  style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
                />
                <div className="text-[10px] text-slate-500 font-medium">P{i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- pieces --------------------------------- */

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 flex items-center justify-center text-lg">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</div>
        <div className="font-bold text-lg text-slate-900 font-montserrat">{value}</div>
      </div>
    </div>
  );
}

const ACCENT_BG: Record<string, string> = {
  blue: "from-blue-50 to-blue-100 border-blue-200",
  indigo: "from-indigo-50 to-indigo-100 border-indigo-200",
  violet: "from-violet-50 to-violet-100 border-violet-200",
};
const ACCENT_TXT: Record<string, string> = {
  blue: "text-blue-700",
  indigo: "text-indigo-700",
  violet: "text-violet-700",
};

function MechanicalCard({ label, value, unit, img, accent, icon }: {
  label: string; value: number; unit: string; img: any; accent: "blue" | "indigo" | "violet"; icon: React.ReactNode;
}) {
  const { t } = useT();
  const [showImage, setShowImage] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.toFixed(3));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={"relative rounded-2xl border bg-gradient-to-br p-5 shadow-sm overflow-hidden " + ACCENT_BG[accent]}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className={"w-7 h-7 rounded-md bg-white flex items-center justify-center " + ACCENT_TXT[accent]}>{icon}</div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-600">{label}</div>
            </div>
          </div>
        </div>
        <button onClick={copy} className="cursor-pointer p-1.5 rounded-md hover:bg-white/60" title={t("cog.res.copy_value")}>
          {copied ? <PiCheckBold className="text-emerald-600 text-sm" /> : <FaCopy className="text-slate-500 text-xs" />}
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <div className={"text-4xl font-bold font-montserrat tracking-tight " + ACCENT_TXT[accent]}>{value.toFixed(3)}</div>
        <div className="text-xs text-slate-500 font-medium">{unit}</div>
      </div>

      <div className="mt-3">
        <Dialog>
          <DialogTrigger asChild>
            <button className="cursor-pointer text-[10px] flex items-center gap-1 text-slate-600 hover:text-slate-900 underline underline-offset-2">
              <LuExpand />{t("cog.res.see_diagram")}
            </button>
          </DialogTrigger>
          <DialogContent className="!max-w-2xl">
            <DialogTitle>{label}</DialogTitle>
            <Image src={img} alt={label} className="w-full mt-3" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function PassCard({ n, passValue, forging, length, cutting, voidClosure }: {
  n: number; passValue: number; forging: string; length: number; cutting: string; voidClosure: number;
}) {
  const { t } = useT();
  const meet = voidClosure >= 95;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("cog.res.pass")} {n}</span>
        <span className={"w-2 h-2 rounded-full " + (meet ? "bg-emerald-500" : voidClosure >= 80 ? "bg-amber-500" : "bg-red-500")} />
      </div>
      <div className="text-lg font-bold font-montserrat text-slate-900 leading-none">{passValue.toFixed(3)}</div>
      <div className="text-[9px] text-slate-400 uppercase tracking-widest">{t("cog.res.reduction")}</div>

      <div className="border-t border-slate-100 pt-1.5 mt-0.5 space-y-1">
        <Row label={t("cog.res.row_forge")} value={forging} />
        <Row label={t("cog.res.row_length")} value={`${length} mm`} />
        <Row label={t("cog.res.row_cut")} value={cutting} />
        <Row label={t("cog.res.row_void")} value={`${Math.floor(voidClosure)}%`} accent={meet ? "emerald" : voidClosure >= 80 ? "amber" : "red"} />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" | "red" }) {
  const color = accent === "emerald" ? "text-emerald-700"
             : accent === "amber" ? "text-amber-700"
             : accent === "red" ? "text-red-700"
             : "text-slate-700";
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-slate-400">{label}</span>
      <span className={"font-semibold " + color}>{value}</span>
    </div>
  );
}

function VoidBar({ pass, value }: { pass: number; value: number }) {
  const { t } = useT();
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 95 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-red-500";
  const txtColor = pct >= 95 ? "text-emerald-700" : pct >= 80 ? "text-amber-700" : "text-red-700";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-medium text-slate-500">{t("cog.res.pass")} {pass}</span>
        <span className={"text-sm font-bold " + txtColor}>{Math.floor(value)}%</span>
      </div>
      <div className="relative h-24 w-full bg-slate-100 rounded-md overflow-hidden">
        <div className={"absolute bottom-0 left-0 right-0 transition-all duration-700 " + color} style={{ height: `${pct}%` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent"></div>
        </div>
        {/* Target line at 95% */}
        <div className="absolute left-0 right-0 border-t border-dashed border-slate-400/60" style={{ bottom: "95%" }}>
          <span className="absolute -top-2.5 right-0 text-[8px] text-slate-400">95%</span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={"w-2 h-2 rounded-full " + color}></span>
      <span className="text-slate-600">{label}</span>
    </div>
  );
}

/* ----------------------- Equipment-aware feasibility ----------------------- */
function FeasibilityPanel({ f }: { f: PassFeasibility }) {
  const { t } = useT();
  const ok = f.all_passes_feasible;
  const borderColor = ok ? "border-emerald-200" : "border-amber-300";
  const bgColor = ok ? "from-emerald-50 to-teal-50" : "from-amber-50 to-rose-50";
  const headerIcon = ok ? "✓" : "⚠";
  const headerLabel = ok ? t("cog.res.feas_ok_label") : t("cog.res.feas_bad_label");

  return (
    <div className={"rounded-2xl border bg-gradient-to-r p-5 shadow-sm " + borderColor + " " + bgColor}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-700">
            {t("cog.res.feas_eyebrow")}
          </div>
          <h3 className={"text-lg font-semibold mt-0.5 " + (ok ? "text-emerald-800" : "text-amber-900")}>
            {headerIcon} {headerLabel}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {t("cog.res.feas_limits_pre")} <strong>{f.max_press_force_tons.toLocaleString()} {t("cog.res.feas_limits_t")}</strong>{" "}
            <strong>{f.initial_temp_C.toFixed(0)} {t("cog.res.feas_limits_dropping")}</strong>
            <strong> {f.temp_drop_per_pass_C.toFixed(0)} {t("cog.res.feas_limits_per_pass")}</strong>
            <strong> {f.min_temp_C.toFixed(0)} °C</strong>
          </p>
        </div>
        <div className="text-xs flex items-center gap-2">
          <LegendDot color="bg-emerald-500" label={t("cog.res.feas_legend_ok")} />
          <LegendDot color="bg-amber-500" label={t("cog.res.feas_legend_near")} />
          <LegendDot color="bg-red-500" label={t("cog.res.feas_legend_over")} />
        </div>
      </div>

      {/* Per-pass force & temperature row */}
      <div className="mt-4 grid grid-cols-7 gap-2">
        {f.force_tons_per_pass.map((force, i) => {
          const temp = f.temperatures_C[i];
          const forceFlag = f.force_warnings[i];
          const tempFlag = f.temp_warnings[i];
          const ratio = force / f.max_press_force_tons;
          // amber if within 15 % of limit, red if over
          const forceTone = forceFlag ? "text-red-700 bg-red-100 border-red-300"
            : ratio > 0.85 ? "text-amber-800 bg-amber-100 border-amber-300"
            : "text-emerald-800 bg-emerald-100 border-emerald-300";
          const tempTone = tempFlag ? "text-red-700 bg-red-100 border-red-300"
            : temp - f.min_temp_C < 50 ? "text-amber-800 bg-amber-100 border-amber-300"
            : "text-emerald-800 bg-emerald-100 border-emerald-300";
          return (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{t("cog.res.pass")} {i + 1}</div>
              <div className={"mt-1.5 rounded border px-1.5 py-0.5 text-[11px] font-mono font-semibold " + forceTone}>
                {force.toFixed(0)} t
              </div>
              <div className={"mt-1 rounded border px-1.5 py-0.5 text-[11px] font-mono font-semibold " + tempTone}>
                {temp.toFixed(0)} °C
              </div>
            </div>
          );
        })}
      </div>

      {!ok && (
        <div className="mt-4 text-xs text-amber-900 bg-amber-100 border border-amber-300 rounded-md px-3 py-2 leading-relaxed">
          <strong>{t("cog.res.feas_rec_label")}</strong>{" "}
          {f.any_force_overload && t("cog.res.feas_rec_force") + " "}
          {f.any_temp_too_low && t("cog.res.feas_rec_temp")}
        </div>
      )}
    </div>
  );
}
