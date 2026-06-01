"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { LuFileInput, LuDownload } from "react-icons/lu";
import { FaGears } from "react-icons/fa6";
import { MdOutlineFileDownload } from "react-icons/md";
import { Skeleton } from "@/components/ui/skeleton";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { recordHistory } from "@/lib/history";
import Info from "./info";
import { useT } from "@/lib/i18n";

type Metrics = {
  rmse_mean: number; rmse_std: number;
  mae_mean: number;  mae_std: number;
  r2_mean: number;
  pi_width_mean?: number;     // average 80% prediction-interval width
  pi_coverage_pct?: number;   // empirical coverage of the 80% PI on OOF data
};

type State =
  | { status: "steady" }
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "filled";
      image: string;        // base64 PNG (4-panel CV diagnostic)
      model_b64: string;    // base64 joblib .pkl bundle
      metrics: Metrics;
      backend: "xgboost" | "hist_gbr";
    };

/**
 * Gradient-Boosting trainer for cogging ENE — alternative to the MLP path.
 * Reports honest k-fold cross-validated RMSE/MAE/R² and exports a joblib .pkl
 * bundle (model + scaler + selector) for downstream optimization.
 */
export default function GradientBoostingForm() {
  const { t } = useT();
  const [state, setState] = useState<State>({ status: "steady" });
  const [nSplits, setNSplits] = useState(5);

  const submitWith = async (fd: FormData) => {
    setState({ status: "loading" });
    fd.append("n_splits", String(nSplits));
    const r = await postToBackend1("/api/cogging/gradient_boosting", fd);
    if (r.ok) {
      const data = r.data;
      setState({
        status: "filled",
        image: data.image,
        model_b64: data.model_b64,
        metrics: data.metrics,
        backend: data.backend,
      });
      toast.success(data.used_sample ? t("cog.gb.toast_sample_ok") : t("cog.gb.toast_ok"));
      recordHistory({
        service: "cogging.gradient_boosting",
        title: data.used_sample ? t("cog.gb.history_sample") : t("cog.gb.history"),
        params: { n_splits: nSplits, input_file: (fd.get("file") as File)?.name || "sample" },
        summary: `${data.backend} · R²=${data.metrics.r2_mean.toFixed(3)} · RMSE=${data.metrics.rmse_mean.toFixed(3)}`,
        used_sample: !!data.used_sample,
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

  const downloadPkl = () => {
    if (state.status !== "filled") return;
    const link = document.createElement("a");
    link.href = "data:application/octet-stream;base64," + state.model_b64;
    link.download = "gradient_boosting_bundle.pkl";
    link.click();
  };

  const downloadImage = () => {
    if (state.status !== "filled") return;
    const link = document.createElement("a");
    link.href = "data:image/png;base64," + state.image;
    link.download = "gb_diagnostics.png";
    link.click();
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 lg:py-7 flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-0 shadow-sm">
      {/* LEFT — form */}
      <form className="w-full lg:flex-1/3 flex flex-col justify-between relative" onSubmit={handleSubmit}>
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider mb-2">
            {t("cog.gb.badge")}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl text-slate-900 font-semibold tracking-tight">{t("cog.gb.title")}</h2>
            <Info />
          </div>
          <h4 className="text-[13px] mt-1 w-4/5 text-slate-500 leading-relaxed">
            {t("cog.gb.subtitle")}
          </h4>

          <h5 className="mt-6 font-medium text-xs text-slate-700">{t("cog.tm.excel_file")}</h5>
          <Input
            accept=".xlsx"
            type="file"
            name="file"
            className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer h-10 file:mr-3 file:bg-slate-200 file:text-slate-700 file:border-0 file:rounded file:px-2 file:py-1 file:text-xs"
          />

          <h5 className="mt-4 font-medium text-xs text-slate-700">{t("cog.gb.cv_folds")}</h5>
          <Input
            type="number"
            min={2}
            max={10}
            value={nSplits}
            onChange={(e) => setNSplits(Math.max(2, Math.min(10, Number(e.target.value) || 5)))}
            className="bg-slate-50 border-slate-200 mt-1.5 h-10 w-24"
          />

          <div className="mt-3">
            <SampleButtons
              runSample={runSample}
              disabled={state.status === "loading"}
              downloadUrls={[{ label: t("cog.tm.sample_xlsx"), url: sampleDownloadUrl(1, "cogging_data"), filename: "cogging_data.xlsx" }]}
            />
          </div>
        </div>
        <Button type="submit" className="cursor-pointer h-11 mt-6 bg-emerald-700 hover:bg-emerald-800 font-medium" disabled={state.status === "loading"}>
          <FaGears />{t("cog.gb.train_button")}
        </Button>
      </form>

      <div className="hidden lg:block w-px bg-slate-200 mx-8"></div>

      {/* RIGHT — results */}
      <div className="w-full lg:flex-2/3 min-h-[300px] lg:min-h-[400px]">
        {state.status === "steady" && (
          <div className="h-full w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <LuFileInput className="text-3xl mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">{t("cog.gb.no_model_title")}</p>
              <p className="text-xs mt-1">
                {t("cog.tm.placeholder_sub")} <span className="text-amber-700 font-medium">{t("sample.try")}</span> {t("cog.tm.placeholder_sub_after")}
              </p>
            </div>
          </div>
        )}

        {state.status === "loading" && (
          <Skeleton className="h-full w-full rounded-2xl bg-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center text-slate-600">
              <AiOutlineLoading className="animate-spin text-3xl text-emerald-700" />
              <p className="mt-5 text-sm font-medium text-slate-800">{t("cog.gb.loading_title")}</p>
              <p className="text-xs mt-2 max-w-[300px] text-center leading-relaxed text-slate-500">
                {t("cog.gb.loading_sub_pre")} {nSplits} {t("cog.gb.loading_sub_post")}
              </p>
            </div>
          </Skeleton>
        )}

        {state.status === "error" && (
          <div className="h-full w-full rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <div className="text-center text-rose-700">
              <p className="text-sm font-medium">{t("cog.gb.training_failed")}</p>
              <p className="text-xs mt-1">{t("cog.gb.failed_hint")}</p>
            </div>
          </div>
        )}

        {state.status === "filled" && (
          <div className="w-full h-full grid grid-cols-3 gap-x-6">
            {/* 4-panel diagnostic image */}
            <div className="col-span-2 max-h-[460px]">
              <img
                src={`data:image/png;base64,${state.image}`}
                alt="Gradient boosting CV diagnostics"
                className="w-full h-full object-contain rounded-lg border border-slate-200 bg-white"
              />
            </div>

            {/* Metrics card + download buttons */}
            <div className="col-span-1 flex flex-col gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
                  {t("cog.gb.backend_label")} {state.backend === "xgboost" ? t("cog.gb.backend_xgb") : t("cog.gb.backend_hgb")}
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <MetricRow label={t("cog.gb.metric_r2")}   value={state.metrics.r2_mean.toFixed(4)} />
                  <MetricRow label={t("cog.gb.metric_rmse")} value={`${state.metrics.rmse_mean.toFixed(4)} ± ${state.metrics.rmse_std.toFixed(4)}`} />
                  <MetricRow label={t("cog.gb.metric_mae")}  value={`${state.metrics.mae_mean.toFixed(4)} ± ${state.metrics.mae_std.toFixed(4)}`} />
                  {state.metrics.pi_width_mean !== undefined && (
                    <MetricRow label={t("cog.gb.metric_pi_width")}  value={`±${(state.metrics.pi_width_mean / 2).toFixed(4)}`} />
                  )}
                  {state.metrics.pi_coverage_pct !== undefined && (
                    <MetricRow
                      label={t("cog.gb.metric_pi_coverage")}
                      value={`${state.metrics.pi_coverage_pct.toFixed(0)}% ${t("cog.gb.metric_pi_coverage_target")}`}
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                  {t("cog.gb.metric_caption_pre")} {nSplits}{t("cog.gb.metric_caption_post")}
                </p>
              </div>

              <Button onClick={downloadPkl} className="cursor-pointer h-10 bg-slate-900 hover:bg-slate-800">
                <LuDownload />{t("cog.gb.download_pkl")}
              </Button>
              <Button onClick={downloadImage} variant="outline" className="cursor-pointer h-10">
                <MdOutlineFileDownload />{t("cog.gb.download_image")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-slate-600">{label}</span>
      <span className="font-mono text-slate-900 text-xs">{value}</span>
    </div>
  );
}
