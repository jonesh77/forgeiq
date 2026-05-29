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

export default function Display3DModel () {
    const [stl, setStl] = useState(null);
    const [meta, setMeta] = useState<{ final_volume?: number; volume_change_ratio?: number } | null>(null);
    let [loading, setLoading] = useState(false);
    let [mode, setMode] = useState<FormMode>("quick");

    const submitWith = async (fd: FormData) => {
        setStl(null);
        setLoading(true);
        const r = await postToBackend2("/api/threedpreform/get_3d_model", fd);
        if (r.ok && r.data.stl_file) {
            setStl(r.data.stl_file);
            setMeta({ final_volume: r.data.final_volume, volume_change_ratio: r.data.volume_change_ratio });
            toast.success(r.data.used_sample ? "Sample 3D model generated" : "3D model generated");
            recordHistory({
                service: "preform_3d.generate",
                title: r.data.used_sample ? "3D Preform (sample)" : "3D Preform",
                params: {},
                summary: `volume_change=${r.data.volume_change_ratio?.toFixed?.(2)}%`,
                used_sample: !!r.data.used_sample,
            });
        } else {
            setStl(null);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if (mode === "quick") fd.set("_use_sample", "true");
        await submitWith(fd);
    }



    return (
    <div className="flex gap-x-12 p-5 py-2.5">
        <form className="flex-[2] border-r pr-10" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-x-4 flex-wrap gap-y-3">
                <div className="flex items-center gap-x-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">3D Model</h1>
                    <Info />
                </div>
                <ModeToggle mode={mode} setMode={setMode} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? "One click — generates a smoothed STL preform from a built-in U-Net model and reference geometry." : "Upload your own U-Net model, bounding-box CSV, and DEFORM .dat files."}</p>
            <ModeBanner mode={mode} />
            <div className="flex flex-col items-start gap-x-8 gap-y-4 mt-7">
                {mode === "advanced" && (
                  <>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>.h5 model</h5>
                        <Input accept=".h5" type='file' name='h5_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>Shifted coordinates and bbox (.csv)</h5>
                        <Input accept=".csv" type='file' name='csv_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>Additional Target Element (.dat)</h5>
                        <Input accept=".dat" type='file' name='dat1_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full">
                        <h5 className='font-medium text-xs text-slate-700'>Additional Target Node (.dat)</h5>
                        <Input accept=".dat" type='file' name='dat2_file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                    </div>
                    <div className="w-full mt-2 flex flex-wrap gap-1.5">
                      <a href={sampleDownloadUrl(2, "bbox_csv")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ .csv</a>
                      <a href={sampleDownloadUrl(2, "target_elem")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ elem.dat</a>
                      <a href={sampleDownloadUrl(2, "target_node")} download className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ node.dat</a>
                    </div>
                  </>
                )}
                {mode === "quick" && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-3 w-full">
                    <p className="font-medium text-slate-700">Reference geometry · default U-Net model</p>
                    <p className="text-slate-500 mt-1">First run ~15-30s (model loads), subsequent runs are cached (~5s).</p>
                  </div>
                )}
                <Button className="w-full mt-3 h-11 bg-slate-900 hover:bg-slate-800 font-medium" type="submit" disabled={loading}>{
                    loading ? (<><AiOutlineLoading className="animate-spin" />Generating...</>) : (<><TbCube3dSphere />Generate 3D model</>)
                }</Button>
            </div>
        </form>
        <div className="flex-[6]">
            {loading && (
                <Skeleton className="w-full aspect-[2] flex gap-x-3 items-center justify-center"><AiOutlineLoading className="animate-spin" /><p>Loading...</p></Skeleton>
            )}
            {(!loading && stl) && (
                <HologramFrame
                    metrics={meta ? [
                        { label: "Final volume", value: `${Math.round(meta.final_volume ?? 0).toLocaleString()} mm³` },
                        { label: "Δ vs raw mesh", value: `${(meta.volume_change_ratio ?? 0).toFixed(2)}%` },
                        { label: "Mesh", value: "STL · Taubin smoothed" },
                    ] : undefined}
                >
                    <STLViewer stlBase64={stl} />
                </HologramFrame>
            )}
        </div>
    </div>
    )
}