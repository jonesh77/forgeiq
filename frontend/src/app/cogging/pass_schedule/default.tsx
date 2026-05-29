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

                {/* Equipment-aware feasibility knobs — defaults match a typical heavy-duty press shop */}
                <details className="mt-5 group" open>
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500 group-open:bg-emerald-500"></span>
                    Equipment limits (optional)
                    <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">— flags passes that exceed your press / temperature window</span>
                  </summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>Max press force (tons)</h5>
                        <ParamHelp>Your press's rated capacity. Each pass's estimated force is flagged red if it exceeds this. Typical industrial cogging press: 1000–5000 tons.</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={3000} name='max_press_force_tons' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>Initial temperature (°C)</h5>
                        <ParamHelp>Workpiece temperature out of the furnace, before pass 1. Typical: 1150–1250 °C for low-alloy steel.</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={1200} name='initial_temp_C' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>Temp drop / pass (°C)</h5>
                        <ParamHelp>Heat lost per pass to anvils and air (no inter-pass reheating). Typical worst case: 30–80 °C.</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={50} name='temp_drop_per_pass_C' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>Min hot temp (°C)</h5>
                        <ParamHelp>Below this, the steel is too cold for hot working — flow stress spikes and grain refinement stops. Typical: 850–900 °C.</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={900} name='min_temp_C' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                  </div>
                </details>

                {/* Material — preset selector that fills the void-closure + flow-stress params below */}
                <MaterialPicker formRef={formRef} />
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

/* ============================================================ */
/* MATERIAL PICKER — preset selector + advanced custom inputs    */
/* ============================================================ */

type MaterialPreset = {
  id: string;
  name: string;
  // Void-closure polynomial V(ε) = 1 + B·ε + C·ε² + D·ε³
  void_B: number;
  void_C: number;
  void_D: number;
  // Flow stress σ(T) = base + slope·(1200 − T)   MPa
  flow_stress_base_MPa: number;
  flow_stress_slope: number;
  note: string;
};

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "aisi4340",
    name: "AISI 4340 (low-alloy steel) — default",
    void_B: -1.521351466, void_C: 0.818014592, void_D: -0.145775097,
    flow_stress_base_MPa: 80,  flow_stress_slope: 0.6,
    note: "Original NSMLab calibration. Cr-Ni-Mo low-alloy steel, typical heavy-section forging.",
  },
  {
    id: "aisi1045",
    name: "AISI 1045 (medium-carbon steel)",
    void_B: -1.32, void_C: 0.74, void_D: -0.12,
    flow_stress_base_MPa: 70,  flow_stress_slope: 0.55,
    note: "Plain medium-carbon steel — softer than 4340 at the same temperature.",
  },
  {
    id: "inconel718",
    name: "Inconel 718 (nickel superalloy)",
    void_B: -1.80, void_C: 1.05, void_D: -0.20,
    flow_stress_base_MPa: 220, flow_stress_slope: 0.8,
    note: "Hard, hot-resistant nickel alloy. Requires much larger press force than steel at the same dimensions.",
  },
  {
    id: "custom",
    name: "Custom — enter coefficients yourself",
    void_B: -1.521351466, void_C: 0.818014592, void_D: -0.145775097,
    flow_stress_base_MPa: 80,  flow_stress_slope: 0.6,
    note: "Use this if you have your own fitted void-closure constants and flow-stress model.",
  },
];

function MaterialPicker({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const [selectedId, setSelectedId] = useState<string>("aisi4340");
  const preset = MATERIAL_PRESETS.find((m) => m.id === selectedId) || MATERIAL_PRESETS[0];
  const isCustom = selectedId === "custom";

  // Whenever the preset changes, write its values into the (hidden) form fields
  // so the request payload carries the correct void_B, void_C, etc.
  const writeField = (name: string, val: number) => {
    const f = formRef.current; if (!f) return;
    const el = f.elements.namedItem(name) as HTMLInputElement | null;
    if (el) el.value = String(val);
  };
  const applyPreset = (id: string) => {
    setSelectedId(id);
    const p = MATERIAL_PRESETS.find((m) => m.id === id) || MATERIAL_PRESETS[0];
    writeField("void_B", p.void_B);
    writeField("void_C", p.void_C);
    writeField("void_D", p.void_D);
    writeField("flow_stress_base_MPa", p.flow_stress_base_MPa);
    writeField("flow_stress_slope",    p.flow_stress_slope);
  };

  return (
    <details className="mt-5 group" open>
      <summary className="cursor-pointer text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
        Material model
        <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">— preset constants for void closure & flow stress</span>
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Preset</label>
          <select
            value={selectedId}
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm cursor-pointer"
          >
            {MATERIAL_PRESETS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{preset.note}</p>
        </div>

        {/* Hidden fields submitted with the form. For "custom" we expose number inputs. */}
        <div className={"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 " + (isCustom ? "" : "hidden")}>
          <CoeffInput name="void_B" label="Void B"  defaultValue={preset.void_B}  hint="ε¹ coefficient in V(ε) = 1 + B·ε + C·ε² + D·ε³" />
          <CoeffInput name="void_C" label="Void C"  defaultValue={preset.void_C}  hint="ε² coefficient" />
          <CoeffInput name="void_D" label="Void D"  defaultValue={preset.void_D}  hint="ε³ coefficient" />
          <CoeffInput name="flow_stress_base_MPa" label="σ₀ @ 1200°C (MPa)" defaultValue={preset.flow_stress_base_MPa} hint="Flow stress at the start temperature" />
          <CoeffInput name="flow_stress_slope"    label="σ slope (MPa/°C)"  defaultValue={preset.flow_stress_slope}    hint="Per-°C rise in flow stress as T drops" />
        </div>
        {!isCustom && (
          <>
            {/* Render the preset values as hidden inputs so the form submission picks them up. */}
            <input type="hidden" name="void_B" value={preset.void_B} readOnly />
            <input type="hidden" name="void_C" value={preset.void_C} readOnly />
            <input type="hidden" name="void_D" value={preset.void_D} readOnly />
            <input type="hidden" name="flow_stress_base_MPa" value={preset.flow_stress_base_MPa} readOnly />
            <input type="hidden" name="flow_stress_slope"    value={preset.flow_stress_slope}    readOnly />
          </>
        )}
      </div>
    </details>
  );
}

function CoeffInput({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: number; hint: string }) {
  return (
    <div>
      <div className="flex gap-x-2 items-center">
        <h5 className="font-medium text-xs">{label}</h5>
        <ParamHelp>{hint}</ParamHelp>
      </div>
      <Input type="number" step="any" defaultValue={defaultValue} name={name} className="bg-white mt-1.5 placeholder:text-xs" />
    </div>
  );
}