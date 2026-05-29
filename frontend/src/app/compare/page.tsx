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

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

/* ============================================================ */
/* PAGE                                                         */
/* ============================================================ */

export default function ComparePage() {
  return (
    <div className="font-public min-h-screen bg-slate-50/40">
      <ProgramHeader title="Model Comparison" accent="indigo" />
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
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-900 text-white">
      <div className="absolute inset-0 bg-grid opacity-25"></div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-3">
          <TbScale /> Side-by-side · baseline vs modern
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-montserrat tracking-tight leading-[1.05] max-w-3xl">
          Compare each predictor before you trust it.
        </h1>
        <p className="mt-2 text-sm text-indigo-100/80 max-w-2xl">
          Run the legacy baseline and the modern upgrade on the same input data, then judge by
          honest cross-validated metrics — not screenshots.
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
      else toast.error("MLP run failed: " + rMlp.error);
      if (rGb.ok) setGb({ image: rGb.data.image, metrics: rGb.data.metrics, backend: rGb.data.backend });
      else toast.error("GB run failed: " + rGb.error);
      if (rMlp.ok && rGb.ok) toast.success("Cogging comparison ready");
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
      title="Cogging ENE predictor"
      subtitle="MLP (legacy) vs Gradient Boosting (modern). Upload ONE Excel and both models train on it — fair side-by-side. Leave the file picker empty to use the bundled sample (48-row NSMLab dataset)."
      onRun={run}
      busy={busy}
      runLabel={file ? `Run both on “${file.name}”` : "Run both on sample data"}
      controls={
        <FilePicker
          file={file}
          setFile={setFile}
          accept=".xlsx"
          hint="Cogging Excel (.xlsx) — same columns as the Train Model form."
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title="MLP baseline" accent="rose">
          {!mlp && !busy && <Placeholder text="MLP results will appear here" />}
          {busy && !mlp && <BusyBox text="Training MLP (Keras, ~10s)…" />}
          {mlp?.image && (
            <img src={`data:image/png;base64,${mlp.image}`} alt="MLP diagnostics" className="w-full h-auto rounded-lg border border-slate-200 bg-white" />
          )}
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            Single 80/20 train/test split with data-augmented training. Metrics live inside the
            generated image (Actual vs Predicted scatter, MAE curve).
          </p>
        </ModelColumn>

        <ModelColumn title="Gradient Boosting (modern)" accent="emerald">
          {!gb && !busy && <Placeholder text="GB results will appear here" />}
          {busy && !gb && <BusyBox text="Cross-validating GB (5 folds, ~3s)…" />}
          {gb && (
            <>
              <img src={`data:image/png;base64,${gb.image}`} alt="GB diagnostics" className="w-full h-auto rounded-lg border border-slate-200 bg-white" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Metric label="R² (CV)" value={m!.r2_mean.toFixed(3)} highlight />
                <Metric label="RMSE" value={`${m!.rmse_mean.toFixed(3)} ± ${m!.rmse_std.toFixed(3)}`} />
                <Metric label="MAE" value={`${m!.mae_mean.toFixed(3)} ± ${m!.mae_std.toFixed(3)}`} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Backend: <span className="font-mono">{gb.backend}</span> · 5-fold CV with out-of-fold predictions.
                Negative R² on the bundled tiny dataset (~48 rows) is normal — the test highlights that the
                legacy single-split metric is optimistic.
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
      } else if (!rB.ok) toast.error("Baseline failed: " + rB.error);
      if (rP.ok) setPinn(rP.data as PinnResult);
      else toast.error("PINN failed: " + rP.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="Processing map"
      subtitle="Legacy: Prasad on the sparse 4×4 grid, interpolated by cubic griddata. Modern: a PINN learns the flow-stress surface from the same 16 curves and derives a smooth 50×50 η/ξ field via autodiff. Upload one Excel and both run on it — otherwise the bundled AISI 4340 sample is used."
      onRun={run}
      busy={busy}
      runLabel={file ? `Run both on “${file.name}”` : "Run both at strain ε = 0.5"}
      controls={
        <FilePicker
          file={file}
          setFile={setFile}
          accept=".xlsx"
          hint="Excel with 16 strain/stress columns (strain1..strain16, stress1..stress16)."
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title="Baseline · Prasad + griddata" accent="slate">
          {!baseline && !busy && <Placeholder text="Baseline plot will appear here" />}
          {busy && !baseline && <BusyBox text="Computing baseline (≈1 s)…" />}
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
            Discrete (T, ε̇) values interpolated globally. Reasonable inside the 4×4 grid but
            extrapolation/contours can be noisy.
          </p>
        </ModelColumn>

        <ModelColumn title="PINN surrogate (modern)" accent="violet">
          {!pinn && !busy && <Placeholder text="PINN plot will appear here" />}
          {busy && !pinn && <BusyBox text="Training PINN (500 epochs, ~15 s)…" />}
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
                    layout={{ title: { text: "η (dissipation)" }, margin: { l: 40, r: 5, t: 26, b: 35 }, font: { size: 9 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }}
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
                    layout={{ title: { text: "ξ (instability)" }, margin: { l: 40, r: 5, t: 26, b: 35 }, font: { size: 9 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }}
                    useResizeHandler
                    style={{ width: "100%", height: 200 }}
                    config={{ displayModeBar: false, responsive: true }}
                  />
                </div>
              </div>
              {pinn.optimal.found && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-mono">
                  ✓ Optimum: T={pinn.optimal.T!.toFixed(0)} °C · ε̇={pinn.optimal.strain_rate!.toExponential(2)} · η={pinn.optimal.eta!.toFixed(3)}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Smooth 50×50 field from a 3-input MLP with physics prior (m ≥ 0). Fit RMSE on
                log₁₀σ = {pinn.rmse_logsigma.toFixed(3)}. Auto-detects the safe (T, ε̇) optimum.
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
  return (
    <SectionCard
      title="3D Preform U-Net"
      subtitle="Live inference comparison requires a trained Attention U-Net .h5 (offline, GPU). Until that's available, the comparison below is an architecture & capability summary."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModelColumn title="Baseline U-Net" accent="slate">
          <ArchStats
            params="~366 K"
            io="128³ · single channel · sigmoid"
            loss="weighted_folding_loss + dice"
            extras={[
              "Standard encoder/decoder + skip concat",
              "Loaded by giveStlModelBase64._load_or_cache_model",
              "First inference 20–30 s, cached ~5 s",
            ]}
          />
        </ModelColumn>
        <ModelColumn title="Attention U-Net (modern)" accent="violet">
          <ArchStats
            params="~371 K"
            io="128³ · single channel · sigmoid"
            loss="weighted_folding_loss + dice"
            extras={[
              "Attention gates on every skip connection (Oktay 2018)",
              "Suppresses background voxels, focuses on preform shape",
              "Drop-in compatible: same custom_objects, same I/O signature",
              "Train offline (GPU/Colab) → drop the .h5 into sample_data/, no code change needed",
            ]}
          />
        </ModelColumn>
      </div>
      <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 leading-relaxed">
        <strong>How to train:</strong> on a GPU machine, run
        <span className="font-mono"> python -m threedlogic.attention_unet --inputs X/ --targets Y/ --out preform_attention.h5</span>,
        then replace <span className="font-mono">sample_data/unet_model.h5</span> with the new file.
        The web container will pick it up automatically.
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
            {busy ? <><AiOutlineLoading className="animate-spin" />Running…</> : <><LuPlay />{runLabel ?? "Run"}</>}
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
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
      <label className="flex items-center gap-2 px-3 h-9 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
        <LuUpload className="text-slate-500" />
        Choose file
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
            No file selected — <span className="font-medium text-amber-700">bundled sample</span> will be used.
          </span>
        )}
        <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>
      </div>
      {file && (
        <button
          type="button"
          onClick={() => setFile(null)}
          title="Clear and revert to sample"
          className="px-2 h-8 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs cursor-pointer flex items-center gap-1 border border-rose-200"
        >
          <LuX /> Clear
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
  return (
    <div className="text-xs space-y-2">
      <Row k="Trainable params" v={params} />
      <Row k="Input/Output" v={io} />
      <Row k="Loss / metric" v={loss} mono />
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
