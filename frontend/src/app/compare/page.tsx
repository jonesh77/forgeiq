"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ProgramHeader } from "@/components/our/program-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiOutlineLoading } from "react-icons/ai";
import { TbScale } from "react-icons/tb";
import { LuPlay, LuMinus, LuUpload, LuX } from "react-icons/lu";
import { postToBackend1 } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

/* ============================================================ */
/* PAGE                                                         */
/* ============================================================ */

export default function ComparePage() {
  const { t } = useT();
  return (
    <div className="font-public min-h-screen bg-slate-50/40">
      <ProgramHeader title={t("nav.compare")} accent="indigo" />
      <CompareHero />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        <CoggingCompare />
        <PmapCompare />
        <PreformInfo />
      </div>
    </div>
  );
}

function CompareHero() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-900 text-white">
      <div className="absolute inset-0 bg-grid opacity-25"></div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-3">
          <TbScale /> {t("cmp.hero.badge")}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-montserrat tracking-tight leading-[1.05] max-w-3xl">
          {t("cmp.hero.title")}
        </h1>
        <p className="mt-2 text-sm text-indigo-100/80 max-w-2xl">
          {t("cmp.hero.desc")}
        </p>
      </div>
    </section>
  );
}

/* ============================================================ */
/* 1) COGGING — MLP baseline vs Gradient Boosting               */
/* ============================================================ */

type CoggingMetrics = {
  rmse_mean: number; rmse_std: number;
  mae_mean: number;  mae_std: number;
  r2_mean: number;
};

function CoggingCompare() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mlp, setMlp] = useState<{ image?: string; loaded: boolean } | null>(null);
  const [gb, setGb] = useState<{ image: string; metrics: CoggingMetrics; backend: string } | null>(null);

  // Build a fresh FormData for each request. Critical: a File can only be
  // consumed once, so we attach a fresh file reference to each FormData.
  const buildFd = (extra?: Record<string, string>) => {
    const fd = new FormData();
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("_use_sample", "true");
    }
    if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return fd;
  };

  const run = async () => {
    setBusy(true);
    setMlp(null); setGb(null);
    try {
      // Fire both concurrently against the SAME input (either user's file or sample).
      const [rMlp, rGb] = await Promise.all([
        postToBackend1("/api/cogging/fourimages1h5",    buildFd(),                       { showToast: false, timeoutMs: 600_000 }),
        postToBackend1("/api/cogging/gradient_boosting", buildFd({ n_splits: "5" }),     { showToast: false, timeoutMs: 600_000 }),
      ]);
      if (rMlp.ok) setMlp({ image: rMlp.data?.images?.[0], loaded: true });
      else toast.error(t("cmp.cog.toast_mlp_failed") + " " + rMlp.error);
      if (rGb.ok) setGb({ image: rGb.data.image, metrics: rGb.data.metrics, backend: rGb.data.backend });
      else toast.error(t("cmp.cog.toast_gb_failed") + " " + rGb.error);
      if (rMlp.ok && rGb.ok) toast.success(t("cmp.cog.toast_ok"));
    } finally {
      setBusy(false);
    }
  };

  // Improvement % only if GB has metrics; we can't directly compute MLP CV
  // metrics from the legacy endpoint (which returns one PNG only), so we
  // surface GB's honest CV numbers and the user reads MLP from its PNG.
  const m = gb?.metrics;

  return (
    <SectionCard
      title={t("cmp.cog.title")}
      subtitle={t("cmp.cog.subtitle")}
      onRun={run}
      busy={busy}
      runLabel={file ? `${t("cmp.cog.run_with_pre")}${file.name}${t("cmp.cog.run_with_post")}` : t("cmp.cog.run_sample")}
      controls={
        <FilePicker
          file={file}
          setFile={setFile}
          accept=".xlsx"
          hint={t("cmp.cog.fp_hint")}
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title={t("cmp.cog.col_mlp")} accent="rose">
          {!mlp && !busy && <Placeholder text={t("cmp.cog.placeholder_mlp")} />}
          {busy && !mlp && <BusyBox text={t("cmp.cog.busy_mlp")} />}
          {mlp?.image && (
            <img src={`data:image/png;base64,${mlp.image}`} alt="MLP diagnostics" className="w-full h-auto rounded-lg border border-slate-200 bg-white" />
          )}
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            {t("cmp.cog.mlp_desc")}
          </p>
        </ModelColumn>

        <ModelColumn title={t("cmp.cog.col_gb")} accent="emerald">
          {!gb && !busy && <Placeholder text={t("cmp.cog.placeholder_gb")} />}
          {busy && !gb && <BusyBox text={t("cmp.cog.busy_gb")} />}
          {gb && (
            <>
              <img src={`data:image/png;base64,${gb.image}`} alt="GB diagnostics" className="w-full h-auto rounded-lg border border-slate-200 bg-white" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Metric label={t("cmp.cog.gb_metric_r2")} value={m!.r2_mean.toFixed(3)} highlight />
                <Metric label={t("cmp.cog.gb_metric_rmse")} value={`${m!.rmse_mean.toFixed(3)} ± ${m!.rmse_std.toFixed(3)}`} />
                <Metric label={t("cmp.cog.gb_metric_mae")} value={`${m!.mae_mean.toFixed(3)} ± ${m!.mae_std.toFixed(3)}`} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                {t("cmp.cog.gb_backend_pre")} <span className="font-mono">{gb.backend}</span> · {t("cmp.cog.gb_desc")}
              </p>
            </>
          )}
        </ModelColumn>
      </div>
    </SectionCard>
  );
}

/* ============================================================ */
/* 2) PROCESSING MAP — Baseline (Prasad, sparse) vs PINN        */
/* ============================================================ */

type PinnResult = {
  T_axis: number[]; logSR_axis: number[];
  eta: number[][]; xi: number[][];
  rmse_logsigma: number;
  optimal: { found: boolean; T?: number; strain_rate?: number; eta?: number; xi?: number };
};

function PmapCompare() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [baseline, setBaseline] = useState<{ data: any; layout: any } | null>(null);
  const [pinn, setPinn] = useState<PinnResult | null>(null);
  const STRAIN = 0.5;

  // Both calls must consume the SAME input but separate FormData objects
  // (File can only be uploaded once per FormData).
  const buildFd = (extra?: Record<string, string>) => {
    const fd = new FormData();
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("_use_sample", "true");
    }
    if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    return fd;
  };

  const run = async () => {
    setBusy(true);
    setBaseline(null); setPinn(null);
    try {
      const fdB = buildFd({
        plot_type: "2D",
        selected_data: JSON.stringify([STRAIN]),
        steps: "0.1",
      });
      const fdP = buildFd({ epochs: "500", strain: String(STRAIN), grid_n: "50" });
      const [rB, rP] = await Promise.all([
        postToBackend1("/api/processingmap/main_graph", fdB, { showToast: false, timeoutMs: 600_000 }),
        postToBackend1("/api/processingmap/pinn",       fdP, { showToast: false, timeoutMs: 600_000 }),
      ]);
      // Baseline response shape: an array of Plotly figures `{data, layout}` —
      // we render the first.
      if (rB.ok && Array.isArray(rB.data) && rB.data[0]?.data) {
        setBaseline({ data: rB.data[0].data, layout: rB.data[0].layout });
      } else if (!rB.ok) toast.error(t("cmp.pmap.toast_baseline_failed") + " " + rB.error);
      if (rP.ok) setPinn(rP.data as PinnResult);
      else toast.error(t("cmp.pmap.toast_pinn_failed") + " " + rP.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title={t("cmp.pmap.title")}
      subtitle={t("cmp.pmap.subtitle")}
      onRun={run}
      busy={busy}
      runLabel={file ? `${t("cmp.cog.run_with_pre")}${file.name}${t("cmp.cog.run_with_post")}` : t("cmp.pmap.run_sample")}
      controls={
        <FilePicker
          file={file}
          setFile={setFile}
          accept=".xlsx"
          hint={t("cmp.pmap.fp_hint")}
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title={t("cmp.pmap.col_baseline")} accent="slate">
          {!baseline && !busy && <Placeholder text={t("cmp.pmap.placeholder_baseline")} />}
          {busy && !baseline && <BusyBox text={t("cmp.pmap.busy_baseline")} />}
          {baseline && (
            <div className="rounded-lg border border-slate-200 bg-white p-1">
              <Plot
                data={baseline.data}
                layout={{
                  ...baseline.layout,
                  margin: { l: 50, r: 5, t: 30, b: 40 },
                  font: { size: 10 },
                  paper_bgcolor: "transparent",
                  plot_bgcolor: "transparent",
                  autosize: true,
                }}
                useResizeHandler
                style={{ width: "100%", height: 420 }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </div>
          )}
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            {t("cmp.pmap.baseline_desc")}
          </p>
        </ModelColumn>

        <ModelColumn title={t("cmp.pmap.col_pinn")} accent="violet">
          {!pinn && !busy && <Placeholder text={t("cmp.pmap.placeholder_pinn")} />}
          {busy && !pinn && <BusyBox text={t("cmp.pmap.busy_pinn")} />}
          {pinn && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-200 bg-white p-1">
                  <Plot
                    data={[
                      {
                        type: "heatmap",
                        x: pinn.logSR_axis, y: pinn.T_axis, z: pinn.eta,
                        colorscale: "Viridis",
                        colorbar: { title: { text: "η" }, thickness: 8 },
                      },
                    ] as any}
                    layout={{ title: { text: t("cmp.pmap.plot_eta") }, margin: { l: 40, r: 5, t: 26, b: 35 }, font: { size: 9 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }}
                    useResizeHandler
                    style={{ width: "100%", height: 200 }}
                    config={{ displayModeBar: false, responsive: true }}
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-1">
                  <Plot
                    data={[
                      {
                        type: "heatmap",
                        x: pinn.logSR_axis, y: pinn.T_axis, z: pinn.xi,
                        colorscale: [[0.0,"rgb(178,24,43)"],[0.45,"rgb(244,165,130)"],[0.5,"rgb(247,247,247)"],[0.55,"rgb(146,197,222)"],[1.0,"rgb(33,102,172)"]],
                        zmid: 0,
                        colorbar: { title: { text: "ξ" }, thickness: 8 },
                      },
                    ] as any}
                    layout={{ title: { text: t("cmp.pmap.plot_xi") }, margin: { l: 40, r: 5, t: 26, b: 35 }, font: { size: 9 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }}
                    useResizeHandler
                    style={{ width: "100%", height: 200 }}
                    config={{ displayModeBar: false, responsive: true }}
                  />
                </div>
              </div>
              {pinn.optimal.found && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-mono">
                  {t("cmp.pmap.optimum_pre")}{pinn.optimal.T!.toFixed(0)} °C · ε̇={pinn.optimal.strain_rate!.toExponential(2)} · η={pinn.optimal.eta!.toFixed(3)}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                {t("cmp.pmap.pinn_desc_pre")} {pinn.rmse_logsigma.toFixed(3)}{t("cmp.pmap.pinn_desc_post")}
              </p>
            </>
          )}
        </ModelColumn>
      </div>
    </SectionCard>
  );
}

/* ============================================================ */
/* 3) 3D PREFORM — Baseline U-Net vs Attention U-Net (info)     */
/* ============================================================ */

function PreformInfo() {
  const { t } = useT();
  return (
    <SectionCard
      title={t("cmp.pre.title")}
      subtitle={t("cmp.pre.subtitle")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title={t("cmp.pre.col_base")} accent="slate">
          <ArchStats
            params="~366 K"
            io="128³ · single channel · sigmoid"
            loss="weighted_folding_loss + dice"
            extras={[
              t("cmp.pre.base_e1"),
              t("cmp.pre.base_e2"),
              t("cmp.pre.base_e3"),
            ]}
          />
        </ModelColumn>
        <ModelColumn title={t("cmp.pre.col_att")} accent="violet">
          <ArchStats
            params="~371 K"
            io="128³ · single channel · sigmoid"
            loss="weighted_folding_loss + dice"
            extras={[
              t("cmp.pre.att_e1"),
              t("cmp.pre.att_e2"),
              t("cmp.pre.att_e3"),
              t("cmp.pre.att_e4"),
            ]}
          />
        </ModelColumn>
      </div>
      <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 leading-relaxed">
        <strong>{t("cmp.pre.howto_label")}</strong> {t("cmp.pre.howto_pre")}
        <span className="font-mono"> python -m threedlogic.attention_unet --inputs X/ --targets Y/ --out preform_attention.h5</span>{t("cmp.pre.howto_post")}
        <span className="font-mono"> sample_data/unet_model.h5</span> {t("cmp.pre.howto_tail")}
      </div>
    </SectionCard>
  );
}

/* ============================================================ */
/* SHARED UI BITS                                                */
/* ============================================================ */

function SectionCard({
  title, subtitle, onRun, busy, runLabel, controls, children,
}: {
  title: string; subtitle: string; onRun?: () => void; busy?: boolean;
  runLabel?: string; controls?: React.ReactNode; children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
        </div>
        {onRun && (
          <Button
            onClick={onRun}
            disabled={busy}
            className="cursor-pointer h-10 bg-indigo-700 hover:bg-indigo-800 font-medium shrink-0"
          >
            {busy ? <><AiOutlineLoading className="animate-spin" />{t("cmp.running")}</> : <><LuPlay />{runLabel ?? t("cmp.run")}</>}
          </Button>
        )}
      </div>
      {controls && <div className="mb-5">{controls}</div>}
      {children}
    </div>
  );
}

/** Single-file picker with a clear/reset button. Empty = use bundled sample. */
function FilePicker({
  file, setFile, accept, hint,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  accept: string;
  hint: string;
}) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
      <label className="flex items-center gap-2 px-3 h-9 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
        <LuUpload className="text-slate-500" />
        {t("cmp.fp.choose")}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex-1 text-xs">
        {file ? (
          <span className="text-slate-800 font-mono">
            {file.name}
            <span className="text-slate-400 ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
          </span>
        ) : (
          <span className="text-slate-500">
            {t("cmp.fp.no_file_pre")} <span className="font-medium text-amber-700">{t("cmp.fp.no_file_mid")}</span> {t("cmp.fp.no_file_post")}
          </span>
        )}
        <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>
      </div>
      {file && (
        <button
          type="button"
          onClick={() => setFile(null)}
          title={t("cmp.fp.clear_title")}
          className="px-2 h-8 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs cursor-pointer flex items-center gap-1 border border-rose-200"
        >
          <LuX /> {t("cmp.fp.clear_btn")}
        </button>
      )}
    </div>
  );
}

const ACCENT_BORDER: Record<string, string> = {
  emerald: "border-emerald-200",
  rose:    "border-rose-200",
  violet:  "border-violet-200",
  slate:   "border-slate-200",
};
const ACCENT_BADGE: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rose:    "bg-rose-50 text-rose-800 border-rose-200",
  violet:  "bg-violet-50 text-violet-800 border-violet-200",
  slate:   "bg-slate-100 text-slate-800 border-slate-300",
};

function ModelColumn({
  title, accent, children,
}: {
  title: string; accent: "emerald"|"rose"|"violet"|"slate"; children: React.ReactNode;
}) {
  return (
    <div className={"rounded-xl border-2 " + ACCENT_BORDER[accent] + " bg-white p-4"}>
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest " + ACCENT_BADGE[accent]}>
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="aspect-[4/3] rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500">
      <LuMinus className="mr-2" />{text}
    </div>
  );
}

function BusyBox({ text }: { text: string }) {
  return (
    <Skeleton className="aspect-[4/3] rounded-lg bg-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <AiOutlineLoading className="animate-spin" />{text}
      </div>
    </Skeleton>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={"rounded-lg border px-2.5 py-2 " + (highlight ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono text-[11px] mt-0.5 text-slate-900 font-semibold">{value}</div>
    </div>
  );
}

function ArchStats({ params, io, loss, extras }: { params: string; io: string; loss: string; extras: string[] }) {
  const { t } = useT();
  return (
    <div className="text-xs space-y-2">
      <Row k={t("cmp.pre.row_params")} v={params} />
      <Row k={t("cmp.pre.row_io")} v={io} />
      <Row k={t("cmp.pre.row_loss")} v={loss} mono />
      <ul className="text-[11px] text-slate-600 list-disc pl-4 space-y-1 mt-2 leading-relaxed">
        {extras.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{k}</span>
      <span className={"text-slate-900 font-semibold " + (mono ? "font-mono text-[11px]" : "text-xs")}>{v}</span>
    </div>
  );
}
