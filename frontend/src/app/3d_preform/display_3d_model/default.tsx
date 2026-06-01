import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { TbCube3dSphere } from "react-icons/tb";
import STLViewer from "./stlViewer";
import Info from "./info";
import { postToBackend2, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { recordHistory } from "@/lib/history";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";
import { HologramFrame } from "@/components/our/hologram-frame";
import { useT } from "@/lib/i18n";

type MeshQuality = {
    watertight: boolean;
    winding_consistent: boolean;
    euler_number: number;
    genus: number | null;
    vertex_count: number;
    face_count: number;
    volume_mm3: number;
    surface_area_mm2: number;
    bbox_mm: [number, number, number];
    aspect_ratio: number | null;
    min_wall_thickness_mm: number | null;
    flags: Record<string, boolean>;
    score: number;
    grade: "A" | "B" | "C" | "D";
};

export default function Display3DModel () {
    const { t } = useT();
    const [stl, setStl] = useState(null);
    const [meta, setMeta] = useState<{ final_volume?: number; volume_change_ratio?: number; quality?: MeshQuality } | null>(null);
    let [loading, setLoading] = useState(false);
    const [elapsed, setElapsed] = useState(0);    // seconds since job started — drives the progress UI
    let [mode, setMode] = useState<FormMode>("quick");

    // Async submission path: POST /submit → poll /status until done.
    // Falls back to the legacy synchronous /get_3d_model only if submit 404s
    // (older backend builds), so existing deployments don't break.
    const submitWith = async (fd: FormData) => {
        setStl(null);
        setLoading(true);
        setElapsed(0);

        const submit = await postToBackend2("/api/threedpreform/submit", fd, { showToast: false });
        if (!submit.ok || !submit.data?.job_id) {
            // Legacy path or hard error — surface the error and stop.
            if (!submit.ok) toast.error(submit.error);
            setLoading(false);
            return;
        }
        const jobId: string = submit.data.job_id;

        // Tick the elapsed counter for the progress label (no extra request).
        const tickId = window.setInterval(() => setElapsed((s) => s + 1), 1000);

        // Poll every 1.5 s — small enough to feel snappy, big enough to spare CPU.
        const POLL_MS = 1500;
        const MAX_WAIT_MS = 10 * 60 * 1000;
        const t0 = Date.now();
        const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

        // GET helper not present in lib/api — call status endpoint via fetch directly.
        const statusUrl = `${process.env.NEXT_PUBLIC_BACKEND2_URL || "http://localhost:5001"}/api/threedpreform/status/${jobId}`;

        try {
            while (true) {
                await wait(POLL_MS);
                const res = await fetch(statusUrl);
                const data = await res.json();
                if (data.status === "error" || data.error) {
                    toast.error(data.error || t("pre.toast_failed"));
                    return;
                }
                if (data.status === "done" && data.result?.stl_file) {
                    const result = data.result;
                    setStl(result.stl_file);
                    setMeta({
                        final_volume: result.final_volume,
                        volume_change_ratio: result.volume_change_ratio,
                        quality: result.quality,
                    });
                    toast.success(result.used_sample ? t("pre.toast_sample_ok") : t("pre.toast_ok"));
                    recordHistory({
                        service: "preform_3d.generate",
                        title: result.used_sample ? t("pre.history_sample") : t("pre.history"),
                        params: {},
                        summary: result.quality
                            ? `Grade ${result.quality.grade} · vol=${result.quality.volume_mm3.toFixed(0)} mm³ · faces=${result.quality.face_count}`
                            : `volume_change=${result.volume_change_ratio?.toFixed?.(2)}%`,
                        used_sample: !!result.used_sample,
                    });
                    return;
                }
                if (Date.now() - t0 > MAX_WAIT_MS) {
                    toast.error(t("pre.toast_timeout"));
                    return;
                }
            }
        } finally {
            window.clearInterval(tickId);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if (mode === "quick") fd.set("_use_sample", "true");
        await submitWith(fd);
    }



    return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-x-12 p-4 sm:p-5 py-2.5">
        <form className="w-full lg:flex-[2] lg:border-r lg:pr-10" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-x-4 flex-wrap gap-y-3">
                <div className="flex items-center gap-x-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("pre.title")}</h1>
                    <Info />
                </div>
                <ModeToggle mode={mode} setMode={setMode} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? t("pre.subtitle_quick") : t("pre.subtitle_adv")}</p>
            <ModeBanner mode={mode} />
            <div className="flex flex-col items-start gap-x-8 gap-y-4 mt-7">
                {mode === "advanced" && (
                  <>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>{t("pre.h5_model")}</h5>
                        <Input accept=".h5" type='file' name='h5_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>{t("pre.csv_file")}</h5>
                        <Input accept=".csv" type='file' name='csv_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>{t("pre.dat1_file")}</h5>
                        <Input accept=".dat" type='file' name='dat1_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>{t("pre.dat2_file")}</h5>
                        <Input accept=".dat" type='file' name='dat2_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full mt-2 flex flex-wrap gap-1.5">
                      <a href={sampleDownloadUrl(2, "bbox_csv")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("pre.sample_csv")}</a>
                      <a href={sampleDownloadUrl(2, "target_elem")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("pre.sample_elem")}</a>
                      <a href={sampleDownloadUrl(2, "target_node")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("pre.sample_node")}</a>
                    </div>
                  </>
                )}
                {mode === "quick" && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-3 w-full">
                    <p className="font-medium text-slate-700">{t("pre.quick_box_title")}</p>
                    <p className="text-slate-500 mt-1">{t("pre.quick_box_text")}</p>
                  </div>
                )}
                <Button className="w-full mt-3 h-11 bg-slate-900 hover:bg-slate-800 font-medium" type="submit" disabled={loading}>{
                    loading ? (<><AiOutlineLoading className="animate-spin" />{t("pre.generating")}</>) : (<><TbCube3dSphere />{t("pre.gen_button")}</>)
                }</Button>
            </div>
        </form>
        <div className="w-full lg:flex-[6]">
            {loading && (
                <Skeleton className="w-full aspect-[2] flex flex-col gap-2 items-center justify-center text-slate-700">
                  <div className="flex items-center gap-3">
                    <AiOutlineLoading className="animate-spin text-2xl text-violet-600" />
                    <p className="font-medium">{t("pre.loading_title")}</p>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {t("pre.loading_elapsed_pre")} {elapsed}{t("pre.loading_elapsed_post")}
                  </p>
                </Skeleton>
            )}
            {(!loading && stl) && (
                <>
                <HologramFrame
                    metrics={meta ? [
                        { label: t("pre.metric_final_volume"), value: `${Math.round(meta.final_volume ?? 0).toLocaleString()} mm³` },
                        { label: t("pre.metric_volume_delta"), value: `${(meta.volume_change_ratio ?? 0).toFixed(2)}%` },
                        { label: t("pre.metric_mesh"), value: t("pre.metric_mesh_value") },
                    ] : undefined}
                >
                    <STLViewer stlBase64={stl} />
                </HologramFrame>
                {meta?.quality && <QualityReport q={meta.quality} />}
                </>
            )}
        </div>
    </div>
    )
}

/* ------------------ Mesh-quality report ------------------ */
const GRADE_STYLE: Record<"A"|"B"|"C"|"D", string> = {
    A: "bg-emerald-100 text-emerald-800 border-emerald-300",
    B: "bg-blue-100 text-blue-800 border-blue-300",
    C: "bg-amber-100 text-amber-800 border-amber-300",
    D: "bg-rose-100 text-rose-800 border-rose-300",
};

function QualityReport({ q }: { q: MeshQuality }) {
    const { t } = useT();
    const fmtMm = (v: number | null | undefined) => v == null ? "—" : `${v.toFixed(2)} mm`;
    return (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">{t("pre.quality.title")}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t("pre.quality.subtitle")}</p>
                </div>
                <div className={"px-3 py-1.5 rounded-lg border text-sm font-bold font-mono " + GRADE_STYLE[q.grade]}>
                    {t("pre.quality.grade")} {q.grade}
                    <span className="ml-2 text-xs opacity-70">{(q.score * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* Pass/fail flags */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <Flag ok={q.flags.watertight} label={t("pre.quality.flag_watertight")} hint={t("pre.quality.flag_watertight_hint")} />
                <Flag ok={q.flags.winding_consistent} label={t("pre.quality.flag_manifold")} hint={t("pre.quality.flag_manifold_hint")} />
                <Flag ok={q.flags.manifold_genus_ok} label={`${t("pre.quality.flag_topology_pre")} ${q.genus ?? "?"}`} hint={t("pre.quality.flag_topology_hint")} />
                <Flag ok={q.flags.aspect_ok} label={`${t("pre.quality.flag_aspect_pre")} ${q.aspect_ratio?.toFixed(2) ?? "?"}${t("pre.quality.flag_aspect_post")}`} hint={t("pre.quality.flag_aspect_hint")} />
                <Flag ok={q.flags.thickness_ok} label={`${t("pre.quality.flag_wall_pre")} ${fmtMm(q.min_wall_thickness_mm)}`} hint={t("pre.quality.flag_wall_hint")} />
            </div>

            {/* Detailed metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Metric label={t("pre.quality.metric_volume")}  value={`${q.volume_mm3.toFixed(1)} mm³`} />
                <Metric label={t("pre.quality.metric_surface")} value={`${q.surface_area_mm2.toFixed(1)} mm²`} />
                <Metric label={t("pre.quality.metric_bbox")}    value={`${q.bbox_mm[0].toFixed(1)} × ${q.bbox_mm[1].toFixed(1)} × ${q.bbox_mm[2].toFixed(1)} mm`} />
                <Metric label={t("pre.quality.metric_detail")}  value={`${q.vertex_count.toLocaleString()} v / ${q.face_count.toLocaleString()} f`} />
            </div>

            {!q.flags.watertight && (
                <div className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    {t("pre.quality.holes_warning")} <span className="font-mono">taubin_smoothed</span> {t("pre.quality.holes_warning_post")}
                </div>
            )}
        </div>
    );
}

function Flag({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
    return (
        <div
            title={hint}
            className={
                "rounded-lg border px-3 py-2 text-xs " +
                (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800")
            }
        >
            <span className="font-medium">{ok ? "✓" : "✕"} {label}</span>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
            <div className="font-mono text-slate-900 text-xs mt-0.5">{value}</div>
        </div>
    );
}