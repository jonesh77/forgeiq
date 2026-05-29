"use client";

import { postToBackend1, postToBackend2, sampleFormData } from "@/lib/api";

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
  // Which steps to run
  runCorrection: boolean;
  runPassSchedule: boolean;
  runPreform: boolean;
}

export interface WorkflowOutcome {
  steps: StepResult[];
  /** Aggregated metrics for the result dashboard */
  metrics: {
    minVoidClosure?: number;       // % — minimum across passes
    avgVoidClosure?: number;       // % — average
    numPasses?: number;
    feed?: number;
    depthSchedule?: number;
    numberOfRotation?: number;
    correctedRows?: number;        // KB of corrected Excel
    preformVolume?: number;        // mm^3
    preformVolumeChange?: number;  // %
  };
}

const log = (cb: (s: StepResult) => void, s: StepResult) => cb({ ...s });

export async function runWorkflow(
  params: WorkflowParams,
  onStep: (s: StepResult) => void,
): Promise<WorkflowOutcome> {
  const steps: StepResult[] = [];
  const metrics: WorkflowOutcome["metrics"] = {};

  // ----- Step 1: Train Data Correction -----
  if (params.runCorrection) {
    const s: StepResult = { step: "correction", status: "running", title: "Correct training data", startedAt: Date.now() };
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
        s.detail = `BQI recomputed toward ASTM=${params.target_astm} (output ${sizeKb} KB)`;
        if (sizeKb) metrics.correctedRows = sizeKb;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = "Failed: " + r.error;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || "Unknown error";
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
    if (s.status === "error") return { steps, metrics };
  } else {
    const s: StepResult = { step: "correction", status: "skipped", title: "Correct training data", detail: "Skipped by user" };
    steps.push(s); log(onStep, s);
  }

  // ----- Step 2: Pass Schedule -----
  if (params.runPassSchedule) {
    const s: StepResult = { step: "pass_schedule", status: "running", title: "Compute pass schedule", startedAt: Date.now() };
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
        s.detail = `${passes} passes · min void closure ${minV?.toFixed?.(1)}% · avg ${avgV?.toFixed?.(1)}%`;

        metrics.numPasses = passes;
        metrics.minVoidClosure = minV;
        metrics.avgVoidClosure = avgV;
        metrics.feed = r.data?.feed;
        metrics.depthSchedule = r.data?.depth_schedule;
        metrics.numberOfRotation = r.data?.number_of_rotation;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = "Failed: " + r.error;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || "Unknown error";
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
    if (s.status === "error") return { steps, metrics };
  } else {
    const s: StepResult = { step: "pass_schedule", status: "skipped", title: "Compute pass schedule", detail: "Skipped by user" };
    steps.push(s); log(onStep, s);
  }

  // ----- Step 3: 3D Preform -----
  if (params.runPreform) {
    const s: StepResult = { step: "preform", status: "running", title: "Generate 3D preform", startedAt: Date.now() };
    log(onStep, s);

    const fd = sampleFormData();

    try {
      const r = await postToBackend2("/api/threedpreform/get_3d_model", fd, { showToast: false, timeoutMs: 600_000 });
      s.finishedAt = Date.now();
      s.durationMs = s.finishedAt - (s.startedAt || 0);

      if (r.ok) {
        s.status = "done";
        s.data = r.data;
        s.detail = `STL ready · volume ${r.data?.final_volume?.toFixed?.(0)} mm³ · Δ ${r.data?.volume_change_ratio?.toFixed?.(2)}%`;
        metrics.preformVolume = r.data?.final_volume;
        metrics.preformVolumeChange = r.data?.volume_change_ratio;
      } else {
        s.status = "error";
        s.error = r.error;
        s.detail = "Failed: " + r.error;
      }
    } catch (e: any) {
      s.status = "error";
      s.error = e?.message || "Unknown error";
      s.finishedAt = Date.now();
    }
    steps.push(s); log(onStep, s);
  } else {
    const s: StepResult = { step: "preform", status: "skipped", title: "Generate 3D preform", detail: "Skipped by user" };
    steps.push(s); log(onStep, s);
  }

  return { steps, metrics };
}

/** Friendly label for a metric — used in the result panel. */
export const METRIC_LABELS: Record<keyof WorkflowOutcome["metrics"], string> = {
  minVoidClosure: "Min void closure",
  avgVoidClosure: "Avg void closure",
  numPasses: "Number of passes",
  feed: "Feed",
  depthSchedule: "Depth schedule",
  numberOfRotation: "Number of rotations",
  correctedRows: "Corrected dataset size",
  preformVolume: "Preform final volume",
  preformVolumeChange: "Preform volume change",
};
