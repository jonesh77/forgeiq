"use client";

import { useState } from "react";
import { ProgramHeader } from "@/components/our/program-header";
import { runWorkflow, WorkflowParams, StepResult, WorkflowOutcome, METRIC_LABELS } from "@/lib/workflow";
import { MATERIAL_PRESETS, findPreset } from "@/lib/materials";
import { ParamHelp } from "@/components/our/param-help";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AiOutlineLoading } from "react-icons/ai";
import { LuPlay, LuRefreshCw, LuCheck, LuX, LuMinus } from "react-icons/lu";
import { HiSparkles } from "react-icons/hi2";
import { PiArrowsClockwise, PiTarget } from "react-icons/pi";
import { toast } from "sonner";
import { recordHistory } from "@/lib/history";
import { useT } from "@/lib/i18n";

const DEFAULTS: WorkflowParams = {
  initial_cross_section: 110,
  initial_length: 1500,
  cutting_length: 800,
  target_astm: 6,
  weight_factor: 0.1,
  materialId: "aisi4340",
  pmap_strain: 0.5,
  pmap_epochs: 500,
  runProcessingMap: true,
  runCorrection: true,
  runPassSchedule: true,
  runPreform: true,
};

type Iteration = {
  id: number;
  params: WorkflowParams;
  outcome: WorkflowOutcome;
  finishedAt: number;
};

export default function WorkflowPage() {
  const { t } = useT();
  const [params, setParams] = useState<WorkflowParams>(DEFAULTS);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [currentOutcome, setCurrentOutcome] = useState<WorkflowOutcome | null>(null);

  const set = <K extends keyof WorkflowParams>(k: K, v: WorkflowParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const runPipeline = async () => {
    if (running) return;
    setRunning(true);
    setSteps([]);
    setCurrentOutcome(null);

    const liveSteps: StepResult[] = [];
    const update = (s: StepResult) => {
      const idx = liveSteps.findIndex((x) => x.step === s.step);
      if (idx >= 0) liveSteps[idx] = s; else liveSteps.push(s);
      setSteps([...liveSteps]);
    };

    try {
      const outcome = await runWorkflow(params, update, t as any);
      setCurrentOutcome(outcome);
      const it: Iteration = { id: Date.now(), params: { ...params }, outcome, finishedAt: Date.now() };
      setIterations((prev) => [it, ...prev]);
      const errors = outcome.steps.filter((s) => s.status === "error");
      if (errors.length === 0) {
        toast.success(t("wf.toast.completed"));
        recordHistory({
          service: "cogging.pass_schedule",
          title: t("wf.history_title"),
          params: {
            cross_section: String(params.initial_cross_section),
            length: String(params.initial_length),
            target_astm: String(params.target_astm),
            material: params.materialId,
          },
          summary: `min void closure ${outcome.metrics.minVoidClosure?.toFixed?.(1)}%, passes ${outcome.metrics.numPasses}, material ${params.materialId}`,
          used_sample: true,
        });
      } else {
        toast.error(`${errors.length} ${t("wf.toast.failed_post")}`);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="font-public min-h-screen bg-slate-50/40">
      <ProgramHeader title={t("nav.auto_pipeline")} accent="indigo" />
      <WorkflowHero />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — Input panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card title={t("wf.card.workpiece_title")} subtitle={t("wf.card.workpiece_sub")} icon={<span className="text-blue-600">📐</span>}>
            <Row label={t("wf.row.cross_section")} help={t("wf.row.cross_section_help")}>
              <Input type="number" value={params.initial_cross_section} onChange={(e) => set("initial_cross_section", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
            <Row label={t("wf.row.length")} help={t("wf.row.length_help")}>
              <Input type="number" value={params.initial_length} onChange={(e) => set("initial_length", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
            <Row label={t("wf.row.cutting")} help={t("wf.row.cutting_help")}>
              <Input type="number" value={params.cutting_length} onChange={(e) => set("cutting_length", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
          </Card>

          <Card title={t("wf.card.target_title")} subtitle={t("wf.card.target_sub")} icon={<PiTarget className="text-emerald-600" />}>
            <Row label={t("wf.row.target_astm")} help={t("wf.row.target_astm_help")}>
              <Input type="number" value={params.target_astm} onChange={(e) => set("target_astm", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
            <Row label={t("wf.row.weight_factor")} help={t("wf.row.weight_factor_help")}>
              <Input type="number" step={0.01} value={params.weight_factor} onChange={(e) => set("weight_factor", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
          </Card>

          <Card title={t("wf.card.material_title")} subtitle={t("wf.card.material_sub")} icon={<span className="text-amber-600">⚒️</span>}>
            <Row label={t("wf.row.material_preset")} help={t("wf.row.material_help")}>
              <select
                value={params.materialId}
                onChange={(e) => set("materialId", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md h-10 px-3 text-sm cursor-pointer"
              >
                {MATERIAL_PRESETS.map((m) => (
                  <option key={m.id} value={m.id}>{t(m.nameKey as any)}</option>
                ))}
              </select>
            </Row>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {t(findPreset(params.materialId).noteKey as any)}
            </p>
          </Card>

          <Card title={t("wf.card.pmap_title")} subtitle={t("wf.card.pmap_sub")} icon={<span className="text-violet-600">🧠</span>}>
            <Row label={t("wf.row.strain_slice")} help={t("wf.row.strain_slice_help")}>
              <Input type="number" step={0.05} min={0} max={1} value={params.pmap_strain} onChange={(e) => set("pmap_strain", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
            <Row label={t("wf.row.pinn_epochs")} help={t("wf.row.pinn_epochs_help")}>
              <Input type="number" step={50} min={50} max={5000} value={params.pmap_epochs} onChange={(e) => set("pmap_epochs", +e.target.value)} className="h-10 bg-slate-50" />
            </Row>
          </Card>

          <Card title={t("wf.card.stages_title")} subtitle={t("wf.card.stages_sub")} icon={<PiArrowsClockwise className="text-indigo-600" />}>
            <StageToggle id="r0" label={t("wf.stage.pmap")} checked={params.runProcessingMap} onChange={(v) => set("runProcessingMap", v)} note={t("wf.stage.pmap_note")} />
            <StageToggle id="r1" label={t("wf.stage.correction")} checked={params.runCorrection} onChange={(v) => set("runCorrection", v)} />
            <StageToggle id="r2" label={t("wf.stage.pass_schedule")} checked={params.runPassSchedule} onChange={(v) => set("runPassSchedule", v)} />
            <StageToggle id="r3" label={t("wf.stage.preform")} checked={params.runPreform} onChange={(v) => set("runPreform", v)} note={t("wf.stage.preform_note")} />
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={runPipeline}
              disabled={running || (!params.runProcessingMap && !params.runCorrection && !params.runPassSchedule && !params.runPreform)}
              className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 cursor-pointer text-sm font-semibold"
            >
              {running ? (<><AiOutlineLoading className="animate-spin" />{t("wf.running")}</>) : (<><LuPlay />{t("wf.run")}</>)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setParams(DEFAULTS)}
              disabled={running}
              className="h-12 cursor-pointer"
              title={t("wf.reset_title")}
            >
              <LuRefreshCw />
            </Button>
          </div>
        </div>

        {/* RIGHT — Log + Results */}
        <div className="lg:col-span-8 space-y-4">
          <StepLog steps={steps} />
          {currentOutcome && <ResultsPanel outcome={currentOutcome} params={params} />}
          {iterations.length > 1 && <IterationHistory iterations={iterations} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

function WorkflowHero() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-900 text-white">
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl animate-drift"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-3">
          <HiSparkles className="text-amber-400" />
          {t("wf.hero.eyebrow")}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-montserrat tracking-tight leading-[1.05] max-w-3xl">
          {t("wf.hero.title1")}<br />
          <span className="text-indigo-300">{t("wf.hero.title2")}</span>
        </h1>
        <p
          className="mt-3 text-sm md:text-base text-indigo-100/80 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: t("wf.hero.desc") }}
        />
      </div>
    </section>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {icon && <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">{icon}</div>}
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        {help && <ParamHelp>{help}</ParamHelp>}
      </div>
      {children}
    </div>
  );
}

function StageToggle({ id, label, checked, onChange, note }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; note?: string }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} className="cursor-pointer mt-0.5" />
      <div className="flex-1">
        <Label htmlFor={id} className="font-medium text-sm text-slate-800 cursor-pointer">{label}</Label>
        {note && <p className="text-[10px] text-slate-500 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

function StepLog({ steps }: { steps: StepResult[] }) {
  const { t } = useT();
  return (
    <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <span className="ml-3 text-xs text-slate-400 font-mono">pipeline.log</span>
      </div>
      <div className="p-4 font-mono text-xs min-h-[200px] max-h-[400px] overflow-y-auto space-y-1.5">
        {steps.length === 0 && (
          <div className="text-slate-500 italic">{t("wf.log.empty_pre")} <span className="text-emerald-400">{t("wf.log.empty_btn")}</span>{t("wf.log.empty_post")}</div>
        )}
        {steps.map((s, i) => <LogLine key={i} step={s} />)}
      </div>
    </div>
  );
}

function LogLine({ step }: { step: StepResult }) {
  const time = step.startedAt ? new Date(step.startedAt).toLocaleTimeString() : "--:--:--";
  const Icon = step.status === "done" ? LuCheck
    : step.status === "error" ? LuX
    : step.status === "skipped" ? LuMinus
    : step.status === "running" ? AiOutlineLoading : LuMinus;

  const color = step.status === "done" ? "text-emerald-400"
    : step.status === "error" ? "text-red-400"
    : step.status === "skipped" ? "text-slate-500"
    : step.status === "running" ? "text-amber-400"
    : "text-slate-400";

  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-500 shrink-0">[{time}]</span>
      <Icon className={color + " mt-0.5 shrink-0 " + (step.status === "running" ? "animate-spin" : "")} />
      <div className="flex-1">
        <span className={"font-semibold uppercase text-[10px] tracking-wider " + color}>{step.status}</span>
        <span className="ml-2 text-slate-200">{step.title}</span>
        {step.durationMs !== undefined && <span className="text-slate-500 ml-2">({(step.durationMs / 1000).toFixed(1)}s)</span>}
        {step.detail && <div className="text-slate-400 mt-0.5 pl-1 border-l border-slate-700 ml-1">{step.detail}</div>}
      </div>
    </div>
  );
}

function ResultsPanel({ outcome, params }: { outcome: WorkflowOutcome; params: WorkflowParams }) {
  const { t } = useT();
  const m = outcome.metrics;
  const passData = outcome.steps.find((s) => s.step === "pass_schedule")?.data;
  const preformData = outcome.steps.find((s) => s.step === "preform")?.data;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("wf.result.title")}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t("wf.result.target_label")}{params.target_astm} · {t("wf.result.cross_label")} {params.initial_cross_section}×{params.initial_cross_section} mm · {t("wf.result.length_label")} {params.initial_length} mm</p>
        </div>
        {m.minVoidClosure !== undefined && (
          <TargetBadge value={m.minVoidClosure} />
        )}
      </div>

      {/* PINN auto-detected safe operating window — the "closed loop" insight */}
      {m.optimalT !== undefined && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">
              {t("wf.result.optimal_window_pre")}{params.pmap_strain.toFixed(2)}{t("wf.result.optimal_window_post")}
            </div>
            <div className="mt-1 text-sm font-mono text-slate-900 font-medium">
              T = <span className="text-emerald-700">{m.optimalT.toFixed(0)} °C</span>
              <span className="text-slate-400"> · </span>
              ε̇ = <span className="text-emerald-700">{m.optimalStrainRate?.toExponential(2)} s⁻¹</span>
              <span className="text-slate-400"> · </span>
              η = <span className="text-emerald-700">{m.optimalEta?.toFixed(3)}</span>
              <span className="text-slate-400"> · </span>
              ξ = <span className="text-emerald-700">{m.optimalXi?.toFixed(3)}</span>
            </div>
          </div>
          {m.pinnRmse !== undefined && (
            <div className="text-[10px] text-emerald-700/70 max-w-[200px] text-right leading-tight">
              {t("wf.result.surrogate_fit")} {m.pinnRmse.toFixed(3)}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
        {m.minVoidClosure !== undefined && <MetricChip label={t(METRIC_LABELS.minVoidClosure as any)} value={`${m.minVoidClosure.toFixed(1)}%`} accent={m.minVoidClosure >= 95 ? "emerald" : m.minVoidClosure >= 80 ? "amber" : "red"} />}
        {m.avgVoidClosure !== undefined && <MetricChip label={t(METRIC_LABELS.avgVoidClosure as any)} value={`${m.avgVoidClosure.toFixed(1)}%`} />}
        {m.numPasses !== undefined && <MetricChip label={t(METRIC_LABELS.numPasses as any)} value={String(m.numPasses)} />}
        {m.feed !== undefined && <MetricChip label={t(METRIC_LABELS.feed as any)} value={m.feed.toFixed(2)} />}
        {m.depthSchedule !== undefined && <MetricChip label={t(METRIC_LABELS.depthSchedule as any)} value={m.depthSchedule.toFixed(2)} />}
        {m.numberOfRotation !== undefined && <MetricChip label={t(METRIC_LABELS.numberOfRotation as any)} value={m.numberOfRotation.toFixed(2)} />}
        {m.preformVolume !== undefined && <MetricChip label={t(METRIC_LABELS.preformVolume as any)} value={`${Math.round(m.preformVolume)} mm³`} accent="violet" />}
        {m.preformVolumeChange !== undefined && <MetricChip label={t(METRIC_LABELS.preformVolumeChange as any)} value={`${m.preformVolumeChange.toFixed(2)}%`} accent="violet" />}
        {m.preformGrade !== undefined && (
          <MetricChip
            label={t(METRIC_LABELS.preformGrade as any)}
            value={`${m.preformGrade}${m.preformScore !== undefined ? `  (${(m.preformScore * 100).toFixed(0)}%)` : ""}`}
            accent={m.preformGrade === "A" ? "emerald" : m.preformGrade === "B" ? "default" : m.preformGrade === "C" ? "amber" : "red"}
          />
        )}
      </div>

      {passData?.pass_schedule && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t("wf.result.per_pass_title")}</h3>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {passData.pass_schedule.map((v: number, i: number) => (
              <div key={i} className="border border-slate-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500 uppercase">{t("wf.result.pass_label")} {i + 1}</div>
                <div className="text-sm font-semibold text-slate-900 mt-1">{v.toFixed(3)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{passData.forging_ratios?.[i]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {preformData?.stl_file && (
        <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="text-2xl">🧊</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">{t("wf.result.preform_ready")}</div>
            <div className="text-xs text-slate-600 mt-0.5">{t("wf.result.preform_volume_pre")} {Math.round(preformData.final_volume)} mm³ {t("wf.result.preform_volume_delta_pre")} {preformData.volume_change_ratio?.toFixed(2)}{t("wf.result.preform_volume_delta_post")}</div>
          </div>
          <a
            href={`data:application/octet-stream;base64,${preformData.stl_file}`}
            download={`preform_${Date.now()}.stl`}
            className="px-3 h-9 inline-flex items-center gap-1 text-xs font-medium rounded-md bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
          >
            {t("wf.result.download_stl")}
          </a>
        </div>
      )}
    </div>
  );
}

function TargetBadge({ value }: { value: number }) {
  const { t } = useT();
  const meets = value >= 95;
  return (
    <div className={
      "inline-flex items-center gap-2 px-3 h-9 rounded-full text-xs font-semibold border " +
      (meets ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")
    }>
      {meets ? <LuCheck /> : <LuRefreshCw />}
      {meets ? t("wf.result.target_met") : t("wf.result.target_no")}
    </div>
  );
}

const CHIP_ACCENT: Record<string, string> = {
  default: "bg-slate-50 border-slate-200 text-slate-900",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  amber:   "bg-amber-50 border-amber-200 text-amber-900",
  red:     "bg-red-50 border-red-200 text-red-900",
  violet:  "bg-violet-50 border-violet-200 text-violet-900",
};

function MetricChip({ label, value, accent = "default" }: { label: string; value: string; accent?: keyof typeof CHIP_ACCENT }) {
  return (
    <div className={"rounded-xl border p-3 " + CHIP_ACCENT[accent]}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-lg font-bold font-montserrat mt-1">{value}</div>
    </div>
  );
}

function IterationHistory({ iterations }: { iterations: Iteration[] }) {
  const { t } = useT();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{t("wf.iter.title")}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{t("wf.iter.subtitle")}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_n")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_when")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_cross_len")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_target")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_optt")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_minvoid")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_passes")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_dvol")}</th>
              <th className="py-2 pr-3 font-medium">{t("wf.iter.col_grade")}</th>
            </tr>
          </thead>
          <tbody>
            {iterations.map((it, i) => {
              const m = it.outcome.metrics;
              const meets = (m.minVoidClosure ?? 0) >= 95;
              return (
                <tr key={it.id} className="border-b border-slate-100 last:border-0 text-slate-700">
                  <td className="py-2.5 pr-3 font-semibold">{iterations.length - i}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{new Date(it.finishedAt).toLocaleTimeString()}</td>
                  <td className="py-2.5 pr-3">{it.params.initial_cross_section} / {it.params.initial_length}</td>
                  <td className="py-2.5 pr-3">{it.params.target_astm}</td>
                  <td className="py-2.5 pr-3 font-mono text-emerald-700">
                    {m.optimalT !== undefined ? `${m.optimalT.toFixed(0)} °C` : "—"}
                  </td>
                  <td className={"py-2.5 pr-3 font-semibold " + (meets ? "text-emerald-700" : "text-amber-700")}>
                    {m.minVoidClosure !== undefined ? `${m.minVoidClosure.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2.5 pr-3">{m.numPasses ?? "—"}</td>
                  <td className="py-2.5 pr-3">{m.preformVolumeChange !== undefined ? `${m.preformVolumeChange.toFixed(2)}%` : "—"}</td>
                  <td className="py-2.5 pr-3 font-mono font-semibold">{m.preformGrade ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
