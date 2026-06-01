"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AiOutlineLoading } from "react-icons/ai";
import { TbBrain } from "react-icons/tb";
import { LuFileInput } from "react-icons/lu";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { recordHistory } from "@/lib/history";
import Info from "./info";
import { useT } from "@/lib/i18n";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Optimal =
  | { found: true; T: number; log_sr: number; strain_rate: number; eta: number; xi: number }
  | { found: false };

type PinnResult = {
  T_axis: number[];
  logSR_axis: number[];
  eta: number[][];
  xi: number[][];
  m: number[][];
  rmse_logsigma: number;
  optimal: Optimal;
  epochs: number;
  strain: number;
  grid_n: number;
};

type State =
  | { status: "steady" }
  | { status: "loading"; epochs: number }
  | { status: "error" }
  | { status: "filled"; data: PinnResult };

/**
 * PINN-based processing-map surrogate.
 * Trains a small MLP that learns the flow-stress surface from sparse
 * compression curves, then derives dense Prasad fields (η, ξ) via autodiff.
 */
export default function PinnForm() {
  const { t } = useT();
  const [state, setState] = useState<State>({ status: "steady" });
  const [epochs, setEpochs] = useState(1000);
  const [strain, setStrain] = useState(0.5);
  const [gridN, setGridN] = useState(50);

  const submitWith = async (fd: FormData) => {
    setState({ status: "loading", epochs });
    fd.append("epochs", String(epochs));
    fd.append("strain", String(strain));
    fd.append("grid_n", String(gridN));
    const r = await postToBackend1<PinnResult & { used_sample?: boolean }>("/api/processingmap/pinn", fd);
    if (r.ok) {
      setState({ status: "filled", data: r.data });
      toast.success(r.data.used_sample ? t("pmap.pinn.toast_sample_ok") : t("pmap.pinn.toast_ok"));
      recordHistory({
        service: "processing_map.pinn",
        title: r.data.used_sample ? t("pmap.pinn.history_sample") : t("pmap.pinn.history"),
        params: { epochs, strain, grid_n: gridN, input_file: (fd.get("file") as File)?.name || "sample" },
        summary: `RMSE(log10 σ)=${r.data.rmse_logsigma.toFixed(4)} · η ∈ [${r.data.eta.flat().reduce((a, b) => Math.min(a, b), Infinity).toFixed(3)}, ${r.data.eta.flat().reduce((a, b) => Math.max(a, b), -Infinity).toFixed(3)}]`,
        used_sample: !!r.data.used_sample,
      });
    } else {
      setState({ status: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitWith(new FormData(e.currentTarget));
  };

  const runSample = () => submitWith(sampleFormData());

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 lg:py-7 flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-0 shadow-sm">
      {/* LEFT — form */}
      <form className="w-full lg:flex-1/3 lg:max-w-sm flex flex-col justify-between relative" onSubmit={handleSubmit}>
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-semibold uppercase tracking-wider mb-2">
            {t("pmap.pinn.badge")}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl text-slate-900 font-semibold tracking-tight">{t("pmap.pinn.title")}</h2>
            <Info />
          </div>
          <h4 className="text-[13px] mt-1 text-slate-500 leading-relaxed">
            {t("pmap.pinn.subtitle")}
          </h4>

          <h5 className="mt-6 font-medium text-xs text-slate-700">{t("pmap.pinn.excel_file")}</h5>
          <Input
            accept=".xlsx"
            type="file"
            name="file"
            className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer h-10 file:mr-3 file:bg-slate-200 file:text-slate-700 file:border-0 file:rounded file:px-2 file:py-1 file:text-xs"
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="font-medium text-xs text-slate-700">{t("pmap.pinn.epochs")}</label>
              <Input
                type="number" min={50} max={5000} step={50}
                value={epochs}
                onChange={(e) => setEpochs(Math.max(50, Math.min(5000, Number(e.target.value) || 1000)))}
                className="bg-slate-50 border-slate-200 mt-1.5 h-10"
              />
              <p className="text-[10px] text-slate-500 mt-1">{t("pmap.pinn.cpu_seconds_pre")}{Math.round(epochs / 60)}{t("pmap.pinn.cpu_seconds_post")}</p>
            </div>
            <div>
              <label className="font-medium text-xs text-slate-700">{t("pmap.pinn.strain")}</label>
              <Input
                type="number" min={0.0} max={1.0} step={0.05}
                value={strain}
                onChange={(e) => setStrain(Math.max(0, Math.min(1, Number(e.target.value) || 0.5)))}
                className="bg-slate-50 border-slate-200 mt-1.5 h-10"
              />
              <p className="text-[10px] text-slate-500 mt-1">{t("pmap.pinn.field_slice")}</p>
            </div>
          </div>

          <div className="mt-3">
            <label className="font-medium text-xs text-slate-700">{t("pmap.pinn.grid_res")}</label>
            <Input
              type="number" min={20} max={80} step={10}
              value={gridN}
              onChange={(e) => setGridN(Math.max(20, Math.min(80, Number(e.target.value) || 50)))}
              className="bg-slate-50 border-slate-200 mt-1.5 h-10 w-24"
            />
          </div>

          <div className="mt-4">
            <SampleButtons
              runSample={runSample}
              disabled={state.status === "loading"}
              downloadUrls={[{ label: t("cog.tm.sample_xlsx"), url: sampleDownloadUrl(1, "processing_map"), filename: "processing_map.xlsx" }]}
            />
          </div>
        </div>
        <Button type="submit" className="cursor-pointer h-11 mt-6 bg-violet-700 hover:bg-violet-800 font-medium" disabled={state.status === "loading"}>
          <TbBrain />{t("pmap.pinn.train_button")}
        </Button>
      </form>

      <div className="hidden lg:block w-px bg-slate-200 mx-8"></div>

      {/* RIGHT — results */}
      <div className="w-full lg:flex-2/3 min-h-[300px] lg:min-h-[460px]">
        {state.status === "steady" && (
          <div className="h-full w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <LuFileInput className="text-3xl mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">{t("pmap.pinn.placeholder_title")}</p>
              <p className="text-xs mt-1">
                {t("pmap.pinn.placeholder_sub")} <span className="text-amber-700 font-medium">{t("sample.try")}</span>{t("pmap.pinn.placeholder_sub_after")}
              </p>
              <p className="text-[10px] mt-3 max-w-[300px] mx-auto leading-relaxed">
                {t("pmap.pinn.placeholder_tip")}
              </p>
            </div>
          </div>
        )}

        {state.status === "loading" && (
          <Skeleton className="h-full w-full rounded-2xl bg-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center text-slate-600">
              <AiOutlineLoading className="animate-spin text-3xl text-violet-700" />
              <p className="mt-5 text-sm font-medium text-slate-800">{t("pmap.pinn.loading_pre")}{state.epochs}{t("pmap.pinn.loading_post")}</p>
              <p className="text-xs mt-2 max-w-[320px] text-center leading-relaxed text-slate-500">
                {t("pmap.pinn.loading_sub_pre")}{Math.round(state.epochs / 60)}{t("pmap.pinn.loading_sub_post")}
              </p>
            </div>
          </Skeleton>
        )}

        {state.status === "error" && (
          <div className="h-full w-full rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <div className="text-center text-rose-700">
              <p className="text-sm font-medium">{t("pmap.pinn.error_title")}</p>
              <p className="text-xs mt-1">{t("pmap.pinn.error_sub")}</p>
            </div>
          </div>
        )}

        {state.status === "filled" && <PinnPlots res={state.data} />}
      </div>
    </div>
  );
}

function PinnPlots({ res }: { res: PinnResult }) {
  const { t } = useT();
  // Heatmaps expect Z[y][x]; backend ships eta/xi indexed [temp_idx][logSR_idx]
  // which is [y][x] when y=T, x=logSR. Use logSR_axis as X, T_axis as Y.
  const xiZ = res.xi;
  const etaZ = res.eta;

  const baseLayout = {
    margin: { l: 50, r: 10, t: 36, b: 40 },
    xaxis: { title: { text: t("pmap.pinn.axis_x") } },
    yaxis: { title: { text: t("pmap.pinn.axis_y") } },
    font: { family: "Public Sans, sans-serif", size: 11 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Metrics strip */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="px-2 py-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 font-mono">
          RMSE log₁₀σ = {res.rmse_logsigma.toFixed(4)}
        </span>
        <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
          {t("pmap.pinn.metric_strain")} {res.strain.toFixed(2)} · {res.epochs} {t("pmap.pinn.metric_epochs")} · {res.grid_n}×{res.grid_n} {t("pmap.pinn.metric_grid")}
        </span>
      </div>

      {/* Auto-detected optimal window — highest η inside the stable (ξ > 0) region */}
      {res.optimal.found ? (
        <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
              {t("pmap.pinn.optimal_title")}
            </div>
            <div className="mt-1 text-sm font-mono text-slate-900 font-medium">
              T = <span className="text-emerald-700">{res.optimal.T.toFixed(0)} °C</span>
              <span className="text-slate-400"> · </span>
              ε̇ = <span className="text-emerald-700">{res.optimal.strain_rate.toExponential(2)} s⁻¹</span>
              <span className="text-slate-400"> · </span>
              η = <span className="text-emerald-700">{res.optimal.eta.toFixed(3)}</span>
              <span className="text-slate-400"> · </span>
              ξ = <span className="text-emerald-700">{res.optimal.xi.toFixed(3)}</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-700/70 max-w-[180px] text-right leading-tight">
            {t("pmap.pinn.optimal_tip")}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {t("pmap.pinn.no_window")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* η heatmap */}
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <Plot
            data={[
              {
                type: "heatmap",
                x: res.logSR_axis,
                y: res.T_axis,
                z: etaZ,
                colorscale: "Viridis",
                colorbar: { title: { text: "η" }, thickness: 12 },
                hovertemplate: "T=%{y:.0f} °C<br>log ε̇=%{x:.2f}<br>η=%{z:.3f}<extra></extra>",
              },
            ]}
            layout={{ ...baseLayout, title: { text: t("pmap.pinn.plot_eta") } }}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>

        {/* ξ heatmap with negative zones highlighted */}
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <Plot
            // zmid (heatmap center color anchor) is a real Plotly option but
            // missing from the react-plotly.js TS bindings — cast to silence it.
            data={[
              {
                type: "heatmap",
                x: res.logSR_axis,
                y: res.T_axis,
                z: xiZ,
                colorscale: [
                  [0.0, "rgb(178, 24, 43)"],
                  [0.45, "rgb(244, 165, 130)"],
                  [0.5, "rgb(247, 247, 247)"],
                  [0.55, "rgb(146, 197, 222)"],
                  [1.0, "rgb(33, 102, 172)"],
                ],
                zmid: 0,
                colorbar: { title: { text: "ξ" }, thickness: 12 },
                hovertemplate: "T=%{y:.0f} °C<br>log ε̇=%{x:.2f}<br>ξ=%{z:.3f}<extra></extra>",
              },
            ] as any}
            layout={{ ...baseLayout, title: { text: t("pmap.pinn.plot_xi") } }}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>
      </div>
    </div>
  );
}
