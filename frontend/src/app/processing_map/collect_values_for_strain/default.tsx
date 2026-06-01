import { base64FileSizeKB } from "@/app/cogging/train_data/default";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { FaFile } from "react-icons/fa6";
import { GoGear } from "react-icons/go";
import { MdOutlineFileDownload } from "react-icons/md";
import { TbCube3dSphere } from "react-icons/tb";
import Info from "./info";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";

export default function CollectValuesForStrain () {
    let [loading, setLoading] = useState(false);
    let [data, setData] = useState<{ xlsx: string; xlsxsize: number } | null>(null);
    let [mode, setMode] = useState<FormMode>("quick");

    const downloadXlsx = () => {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.xlsx}`;
        link.download = "collected.xlsx";
        link.click();
    };
    
    const submitWith = async (fd: FormData) => {
        setData(null);
        setLoading(true);
        const r = await postToBackend1<string>("/api/processingmap/collect_values_for_strain", fd);
        if (r.ok && typeof r.data === "string") {
            setData({ xlsx: r.data, xlsxsize: base64FileSizeKB(r.data) });
            toast.success("Excel file generated");
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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-x-12 p-4 sm:p-5 py-2.5">
            <form className="w-full lg:flex-1 lg:border-r lg:pr-10" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-x-3 flex-wrap gap-y-3">
                    <div className="flex items-center gap-x-3">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Collect Values for Strain</h1>
                        <Info />
                    </div>
                    <ModeToggle mode={mode} setMode={setMode} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? "Just pick a step size — we build the full instability/dissipation Excel table from the built-in dataset." : "Upload your stress-strain Excel to export the full table for your own material."}</p>
                <ModeBanner mode={mode} />
                <div className="flex flex-col items-start gap-x-8 gap-y-4 mt-7">
                {mode === "advanced" && (
                  <div>
                      <h5 className='font-medium text-xs text-slate-700'>Processing map data (.xlsx)</h5>
                      <Input accept=".xlsx" type='file' name='file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                  </div>
                )}
                <div>
                    <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs text-slate-700'>Steps</h5>
                    </div>
                    <Input type='number' step={"any"} defaultValue="0.1" name='steps' className='bg-slate-50 border-slate-200 mt-1.5 w-[260px] h-10 placeholder:text-xs' required />
                </div>
                {mode === "advanced" && (
                  <div className="w-full mt-2">
                    <a href={sampleDownloadUrl(1, "processing_map")} download="processing_map.xlsx" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ Sample .xlsx</a>
                  </div>
                )}
                <Button className="w-[300px] mt-3 h-11 bg-slate-900 hover:bg-slate-800 font-medium" type="submit" disabled={loading}>{
                    loading ? (<><AiOutlineLoading className="animate-spin" />Loading...</>) : (<><TbCube3dSphere />Generate excel</>)
                }</Button>
                </div>
            </form>
            <div className="w-full lg:flex-[5]">
                {data && (
                    <div className="max-w-[380px]">
                        <div className='flex items-center gap-x-3 text-slate-800'><GoGear className='text-base' /><h2 className='text-sm font-medium'>Generated Excel file</h2></div>
                        <div className='flex flex-col items-center justify-center aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 mt-4 rounded-xl border border-slate-200'>
                            <FaFile className='text-4xl text-slate-700' />
                            <p className='mt-3 text-slate-700 font-medium'>collected.xlsx</p>
                            <p className='text-xs mt-0.5 text-slate-500/80 font-medium'>{Math.round(data.xlsxsize)}KB</p>
                        </div>
                        <Button className='cursor-pointer w-full bg-slate-800 hover:bg-slate-900 mt-4' onClick={downloadXlsx}><MdOutlineFileDownload />Download .xlsx</Button>
                    </div>
                )}
            </div>
        </div>
    );
}