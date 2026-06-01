"use client";

import { postToBackend1, postToBackend2, sampleFormData } from "@/lib/api";

type Tfn = (key: string) => string;

/**
 * Auto-pipeline orchestration:
 *   1. Train Data Correction (sample data + user's target ASTM / weight)
 *   2. Pass Schedule (sample model + user's workpiece dimensions)
 *   3. 3D Preform (sample geometry)
 *
 * Each step pushes a structured log entry the UI can render live.
 *
 * NOTE: we can't truly chain outputs through the backend (each endpoint
 * is independent and uses bundled samples). The "chain" is conceptual —
 * each step runs sequentially with the user's parameters so the result
 * panel shows a unified view of one design pass.
 */

export type WorkflowStep =
  | "processing_map"   // PINN surrogate → auto-detect safe (T, ε̇)
  | "correction"
  | "pass_schedule"
  | "preform";

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface StepResult {
  step: WorkflowStep;
  status: StepStatus;
  title: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  detail?: string;
  data?: any;
  error?: string;
}

export interface WorkflowParams {
  // Cogging dims
  initial_cross_section: number;
  initial_length: number;
  cutting_length: number;
  // Correction
  target_astm: number;
  weight_factor: number;
  // PINN
  pmap_strain: number;       // strain slice for the η/ξ field (typical 0.5)
  pmap_epochs: number;       // PINN epochs (500 = quick estimate, ~10–20 s)
  // Which steps to run
  runProcessingMap: boolean;
  runCorrection: boolean;
  runPassSchedule: boolean;
  runPreform: boolean;
}

export interface WorkflowOutcome {
  steps: StepResult[];
  /** Aggregated metrics for the result dashboard */
  metrics: {
    // PINN
    optimalT?: number;             // °C
    optimalStrainRate?: number;    // s⁻¹
    optimalEta?: number;           // power dissipation
    optimalXi?: number;            // instability margin (positive = safe)
    pinnRmse?: number;             // RMSE on log10(σ) — sanity of the surrogate
    // Cogging
    minVoidClosure?: number;       // % — minimum across passes
    avgVoidClosure?: number;       // % — average
    numPasses?: number;
    feed?: number;
    depthSchedule?: number;
    numberOfRotation?: number;
    correctedRows?: number;        // KB of corrected Excel
    // 3D Preform
    preformVolume?: number;        // mm³
    preformVolumeChange?: number;  // %
    preformGrade?: "A" | "B" | "C" | "D";
    preformScore?: number;         // 0..1
  };
}

const log = (cb: (s: StepResult) => void, s: StepResult) => cb({ ...s });

export async function runWorkflow(
  params: WorkflowParams,
  onStep: (s: StepResult) => void,
  t: Tfn,
): Promise<WorkflowOutcome> {
  const steps: StepResult[] = [];
  const metrics: WorkflowOutcome["metrics"] = {};

  // ----- Step 0: Processing-map PINN surrogate (auto-detect safe optimum) -----
  if (params.runProcessingMap) {
    const s: StepResult = {
      step: "processing_map",
      status: "running",
      title: t("wf.step.pmap_title"),
      startedAt: Date.now(),
    };
    log(onStep, s);

    const fd = sampleFormData({
      epochs: String(params.pmap_epochs),
      strain: String(params.pmap_strain),
      grid_n: "50",
    });

    try {
      const r = await postToBackend1("/api/processingmap/pinn", fd, { showToast: false, timeoutMs: 600_000 });
      s.finishedAt = Date.now();
      s.durationMs = s.finishedAt - (s.startedAt || 0);

      if (r.ok) {
        s.status = "done";
        s.data = r.data;
        const opt = r.data?.optimal;
        if (opt?.found) {
          metrics.optimalT = opt.T;
          metrics.optimalStrainRate = opt.strain_rate;
          metrics.optimalEta = opt.eta;
          metrics.optimalXi = opt.xi;
          s.detail = `${t("wf.step.pmap_optimal_pre")}${opt.T.toFixed(0)} °C, ε̇=${opt.strain_rate.toExponential(2)} s⁻¹, η=${opt.eta.toFixed(3)}`;
        } else {
          s.detail = t("wf.step.pmap_no_window");
        }
        metrics.pinnRmse = r.data?.rmse_logsigma;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = `${t("wf.step.failed_pre")} ${r.error}`;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || t("wf.step.unknown_error");
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
    if (s.status === "error") return { steps, metrics };
  } else {
    const s: StepResult = { step: "processing_map", status: "skipped", title: t("wf.step.pmap_title"), detail: t("wf.step.skipped") };
    steps.push(s); log(onStep, s);
  }

  // ----- Step 1: Train Data Correction -----
  if (params.runCorrection) {
    const s: StepResult = { step: "correction", status: "running", title: t("wf.step.correction_title"), startedAt: Date.now() };
    log(onStep, s);

    const fd = sampleFormData({
      target_astm: String(params.target_astm),
      weight_factor: String(params.weight_factor),
    });

    try {
      const r = await postToBackend1("/api/cogging/traindatacorrection", fd, { showToast: false });
      s.finishedAt = Date.now();
      s.durationMs = s.finishedAt - (s.startedAt || 0);

      if (r.ok) {
        s.status = "done";
        s.data = r.data;
        const sizeKb = r.data?.file ? Math.round((r.data.file.length * 3) / 4 / 1024) : undefined;
        s.detail = `${t("wf.step.corr_pre")}${params.target_astm} ${t("wf.step.corr_kb_pre")} ${sizeKb} ${t("wf.step.corr_kb_post")}`;
        if (sizeKb) metrics.correctedRows = sizeKb;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = `${t("wf.step.failed_pre")} ${r.error}`;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || t("wf.step.unknown_error");
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
    if (s.status === "error") return { steps, metrics };
  } else {
    const s: StepResult = { step: "correction", status: "skipped", title: t("wf.step.correction_title"), detail: t("wf.step.skipped") };
    steps.push(s); log(onStep, s);
  }

  // ----- Step 2: Pass Schedule -----
  if (params.runPassSchedule) {
    const s: StepResult = { step: "pass_schedule", status: "running", title: t("wf.step.pass_schedule_title"), startedAt: Date.now() };
    log(onStep, s);

    const fd = sampleFormData({
      initial_cross_section: String(params.initial_cross_section),
      initial_length: String(params.initial_length),
      cutting_length: String(params.cutting_length),
    });

    try {
      const r = await postToBackend1("/api/cogging/passschedule", fd, { showToast: false });
      s.finishedAt = Date.now();
      s.durationMs = s.finishedAt - (s.startedAt || 0);

      if (r.ok) {
        s.status = "done";
        s.data = r.data;
        const passes = r.data?.pass_schedule?.length || 0;
        const voids: number[] = r.data?.void_closure || [];
        const minV = voids.length ? Math.min(...voids) : undefined;
        const avgV = voids.length ? voids.reduce((a, b) => a + b, 0) / voids.length : undefined;
        s.detail = `${passes} ${t("wf.step.pass_passes")} · ${t("wf.step.pass_min")} ${minV?.toFixed?.(1)}% · ${t("wf.step.pass_avg")} ${avgV?.toFixed?.(1)}%`;

        metrics.numPasses = passes;
        metrics.minVoidClosure = minV;
        metrics.avgVoidClosure = avgV;
        metrics.feed = r.data?.feed;
        metrics.depthSchedule = r.data?.depth_schedule;
        metrics.numberOfRotation = r.data?.number_of_rotation;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = `${t("wf.step.failed_pre")} ${r.error}`;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || t("wf.step.unknown_error");
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
    if (s.status === "error") return { steps, metrics };
  } else {
    const s: StepResult = { step: "pass_schedule", status: "skipped", title: t("wf.step.pass_schedule_title"), detail: t("wf.step.skipped") };
    steps.push(s); log(onStep, s);
  }

  // ----- Step 3: 3D Preform -----
  if (params.runPreform) {
    const s: StepResult = { step: "preform", status: "running", title: t("wf.step.preform_title"), startedAt: Date.now() };
    log(onStep, s);

    const fd = sampleFormData();

    try {
      const r = await postToBackend2("/api/threedpreform/get_3d_model", fd, { showToast: false, timeoutMs: 600_000 });
      s.finishedAt = Date.now();
      s.durationMs = s.finishedAt - (s.startedAt || 0);

      if (r.ok) {
        s.status = "done";
        s.data = r.data;
        const q = r.data?.quality;
        const gradePart = q?.grade ? ` · ${t("wf.step.preform_grade")} ${q.grade}` : "";
        s.detail = `${t("wf.step.preform_ready_pre")} ${r.data?.final_volume?.toFixed?.(0)} mm³ · ${t("wf.step.preform_delta")} ${r.data?.volume_change_ratio?.toFixed?.(2)}%${gradePart}`;
        metrics.preformVolume = r.data?.final_volume;
        metrics.preformVolumeChange = r.data?.volume_change_ratio;
        if (q?.grade) metrics.preformGrade = q.grade;
        if (typeof q?.score === "number") metrics.preformScore = q.score;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = `${t("wf.step.failed_pre")} ${r.error}`;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || t("wf.step.unknown_error");
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
  } else {
    const s: StepResult = { step: "preform", status: "skipped", title: t("wf.step.preform_title"), detail: t("wf.step.skipped") };
    steps.push(s); log(onStep, s);
  }

  return { steps, metrics };
}

/** i18n key for each metric — caller looks up via t(METRIC_LABELS[k]). */
export const METRIC_LABELS: Record<keyof WorkflowOutcome["metrics"], string> = {
  optimalT:            "wf.metric.optimalT",
  optimalStrainRate:   "wf.metric.optimalStrainRate",
  optimalEta:          "wf.metric.optimalEta",
  optimalXi:           "wf.metric.optimalXi",
  pinnRmse:            "wf.metric.pinnRmse",
  minVoidClosure:      "wf.metric.minVoidClosure",
  avgVoidClosure:      "wf.metric.avgVoidClosure",
  numPasses:           "wf.metric.numPasses",
  feed:                "wf.metric.feed",
  depthSchedule:       "wf.metric.depthSchedule",
  numberOfRotation:    "wf.metric.numberOfRotation",
  correctedRows:       "wf.metric.correctedRows",
  preformVolume:       "wf.metric.preformVolume",
  preformVolumeChange: "wf.metric.preformVolumeChange",
  preformGrade:        "wf.metric.preformGrade",
  preformScore:        "wf.metric.preformScore",
};
