import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PiComputerTower } from "react-icons/pi";
import { CiCircleInfo } from "react-icons/ci";
import { FaCircleInfo } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import feed_png from "../../../../public/feed.png"
import depth_png from "../../../../public/Depth schedule.png"
import rotation_png from "../../../../public/Number of rotation.png"
import { MdExpandMore } from "react-icons/md";
import { FaCopy } from "react-icons/fa6";
import { CiImageOn } from "react-icons/ci";
import { FaImage } from "react-icons/fa6";
import { FaRegImage } from "react-icons/fa6";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export default function PassSchedule () {
    let [state, setState] = useState({ status: "steady", obj: {} })
    let [mode, setMode] = useState<FormMode>("quick");
    const formRef = useRef<HTMLFormElement | null>(null);

    const getCurrentParams = () => {
        const f = formRef.current;
        if (!f) return {};
        const out: Record<string, string> = {};
        ["initial_cross_section", "initial_length", "cutting_length"].forEach((k) => {
            const el = f.elements.namedItem(k) as HTMLInputElement | null;
            if (el?.value) out[k] = el.value;
        });
        return out;
    };

    const applyParams = (p: Record<string, string>) => {
        const f = formRef.current;
        if (!f) return;
        Object.entries(p).forEach(([k, v]) => {
            const el = f.elements.namedItem(k) as HTMLInputElement | null;
            if (el) el.value = v;
        });
    };

    const submitWith = async (fd: FormData) => {
        setState({ status: "loading", obj: {} });
        const r = await postToBackend1("/api/cogging/passschedule", fd);
        if (r.ok) {
            setState({ status: "filled", obj: r.data });
            toast.success(r.data?.used_sample ? "Sample pass schedule computed" : "Pass schedule computed");
            recordHistory({
                service: "cogging.pass_schedule",
                title: r.data?.used_sample ? "Pass Schedule (sample)" : "Pass Schedule",
                params: {
                    initial_cross_section: fd.get("initial_cross_section")?.toString(),
                    initial_length: fd.get("initial_length")?.toString(),
                    cutting_length: fd.get("cutting_length")?.toString(),
                },
                summary: `feed=${r.data?.feed?.toFixed?.(2)}, passes=${r.data?.pass_schedule?.length}`,
                used_sample: !!r.data?.used_sample,
            });
        } else {
            setState({ status: "error", obj: {} });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if (mode === "quick") fd.set("_use_sample", "true");
        await submitWith(fd);
    }

    return (
        <div className="p-5 py-2.5 relative">
            <form ref={formRef} onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-x-5 flex-wrap gap-y-3">
                    <div className="flex items-center gap-x-3">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pass Schedule Program</h1>
                        <Info />
                    </div>
                    <ModeToggle mode={mode} setMode={setMode} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? "Enter your workpiece dimensions and we compute the optimal 7-pass schedule using a built-in reference model." : "Upload your trained model and dataset for a project-specific schedule."}</p>
                <ModeBanner mode={mode} />
                <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mt-7">
                    {mode === "advanced" && (
                        <>
                            <div>
                                <h5 className='font-medium text-xs text-slate-700'>Excel data</h5>
                                <Input accept=".xlsx" type='file' name='data' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                            </div>
                            <div>
                                <h5 className='font-medium text-xs text-slate-700'>.h5 Model</h5>
                                <Input accept=".h5" type='file' name='model' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                            </div>
                        </>
                    )}
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>Initial Cross Section (mm)</h5>
                            <ParamHelp>Initial diameter (round) or side length (square) of the workpiece before forging, in millimetres. Typical: 80–150 mm.</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 110" name='initial_cross_section' className='bg-white mt-1.5 w-[260px] placeholder:text-xs' required />
                    </div>
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>Initial Length (mm)</h5>
                            <ParamHelp>Length of the workpiece before forging, in millimetres. Typical: 1000–2000 mm.</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 1500" name='initial_length' className='bg-white mt-1.5 w-[260px] placeholder:text-xs' required />
                    </div>
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>Cutting Length (mm)</h5>
                            <ParamHelp>Maximum length per cut piece. If the forged length exceeds this, the program splits the workpiece. Typical: 600–1000 mm.</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 800" name='cutting_length' className='bg-white mt-1.5 w-[320px] placeholder:text-xs' required />
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <BookmarkPanel
                    service="cogging.pass_schedule"
                    getCurrentParams={getCurrentParams}
                    applyParams={applyParams}
                  />
                  {mode === "advanced" && (
                    <>
                      <a href={sampleDownloadUrl(1, "cogging_data")} download="cogging_data.xlsx" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ Sample .xlsx</a>
                      <a href={sampleDownloadUrl(1, "pretrained_cogging_model")} download="pretrained_cogging_model.h5" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ Sample .h5</a>
                    </>
                  )}
                </div>
                <Button type="submit" className="mt-4 w-[220px] h-11 cursor-pointer bg-slate-900 hover:bg-slate-800 font-medium" disabled={state.status == "loading"}>{
                    state.status == "loading" ? (<><AiOutlineLoading className="animate-spin" />Computing...</>)
                    : (<><PiComputerTower />Compute passes</> )
                }</Button>
            </form>
            {state.status == "filled" && (
                <div className="mt-10">
                    <div className="flex items-center justify-end mb-4">
                        <PassSchedulePdfButton
                            result={state.obj}
                            inputs={getCurrentParams()}
                        />
                    </div>
                    <PassScheduleResult data={state.obj} />
                </div>
            )}
        </div>
    )
}

import { MdImageNotSupported } from "react-icons/md";
import Info from "./info";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { ParamHelp } from "@/components/our/param-help";
import { recordHistory } from "@/lib/history";
import { BookmarkPanel } from "@/components/our/bookmark-panel";
import { useRef } from "react";
import { PassSchedulePdfButton } from "@/components/our/pass-schedule-pdf";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";
import { PassScheduleResult } from "@/components/our/pass-schedule-result";

function MechanicalCard ({ label, value, img_src }) {
    let [showImage, setShowImage] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async (textToCopy) => {
        try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset "copied" state after 2 seconds
        } catch (err) {
        console.error('Failed to copy text: ', err);
        // Handle error, e.g., show a message to the user
        }
    };

    return (
        <div className="w-fit max-w-[30%] py-3 px-7 bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg">
            <p className="text-lg tracking-tight font-light">{label}</p>
            <div className="w-full h-px bg-transparent mb-2.5 mt-1 border-b-2 border-dashed border-zinc-200"></div>
            <p className="text-3xl font-bold tracking-tight">{value.toFixed(3)}</p>
            <div className="flex items-center mt-3 gap-x-2">
                <div onClick={() => { setShowImage(!showImage); }} className="flex cursor-pointer gap-x-2 items-center bg-white border text-[9px] text-zinc-800 px-2 py-1 rounded-sm">
                    {showImage ? (
                        <><MdImageNotSupported /><p>Hide image</p></>
                    ) : (
                        <><FaRegImage /><p>See image</p></>
                    )}
                </div>
                <div onClick={() => { handleCopy(value); }} className={"flex cursor-pointer gap-x-2 items-center bg-zinc-900 text-[9px] text-zinc-100 px-1.5 rounded-sm " + (copied ? "py-1" : "py-1.5")}>
                    {copied ? (<p>Copied!</p>) : (<FaCopy />)}
                </div>
            </div>
            {showImage && (
                <div className="mt-5">
                    <Image src={img_src} alt="" />
                </div>
            )}
        </div>
    )
}