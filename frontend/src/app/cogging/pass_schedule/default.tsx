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
import { MATERIAL_PRESETS } from "@/lib/materials";


export default function PassSchedule () {
    const { t } = useT();
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
            toast.success(r.data?.used_sample ? t("cog.ps.toast_sample_ok") : t("cog.ps.toast_ok"));
            recordHistory({
                service: "cogging.pass_schedule",
                title: r.data?.used_sample ? t("cog.ps.history_sample") : t("cog.ps.history"),
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
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("cog.ps.title")}</h1>
                        <Info />
                    </div>
                    <ModeToggle mode={mode} setMode={setMode} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? t("cog.ps.subtitle_quick") : t("cog.ps.subtitle_adv")}</p>
                <ModeBanner mode={mode} />
                <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mt-7">
                    {mode === "advanced" && (
                        <>
                            <div>
                                <h5 className='font-medium text-xs text-slate-700'>{t("cog.ps.excel_data")}</h5>
                                <Input accept=".xlsx" type='file' name='data' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                            </div>
                            <div>
                                <h5 className='font-medium text-xs text-slate-700'>{t("cog.ps.h5_model")}</h5>
                                <Input accept=".h5" type='file' name='model' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                            </div>
                        </>
                    )}
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>{t("cog.ps.cross_section")}</h5>
                            <ParamHelp>{t("cog.ps.cross_section_hint")}</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 110" name='initial_cross_section' className='bg-white mt-1.5 w-[260px] placeholder:text-xs' required />
                    </div>
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>{t("cog.ps.length")}</h5>
                            <ParamHelp>{t("cog.ps.length_hint")}</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 1500" name='initial_length' className='bg-white mt-1.5 w-[260px] placeholder:text-xs' required />
                    </div>
                    <div>
                        <div className="flex gap-x-2 items-center">
                            <h5 className='font-medium text-xs'>{t("cog.ps.cutting")}</h5>
                            <ParamHelp>{t("cog.ps.cutting_hint")}</ParamHelp>
                        </div>
                        <Input type='number' placeholder="e.g. 800" name='cutting_length' className='bg-white mt-1.5 w-[320px] placeholder:text-xs' required />
                    </div>
                </div>

                {/* Equipment-aware feasibility knobs — defaults match a typical heavy-duty press shop */}
                <details className="mt-5 group" open>
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500 group-open:bg-emerald-500"></span>
                    {t("cog.ps.equip_title")}
                    <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">{t("cog.ps.equip_subtitle")}</span>
                  </summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>{t("cog.ps.max_press")}</h5>
                        <ParamHelp>{t("cog.ps.max_press_hint")}</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={3000} name='max_press_force_tons' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>{t("cog.ps.init_temp")}</h5>
                        <ParamHelp>{t("cog.ps.init_temp_hint")}</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={1200} name='initial_temp_C' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>{t("cog.ps.temp_drop")}</h5>
                        <ParamHelp>{t("cog.ps.temp_drop_hint")}</ParamHelp>
                      </div>
                      <Input type='number' defaultValue={50} name='temp_drop_per_pass_C' className='bg-white mt-1.5 placeholder:text-xs' />
                    </div>
                    <div>
                      <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs'>{t("cog.ps.min_temp")}</h5>
                        <ParamHelp>{t("cog.ps.min_temp_hint")}</ParamHelp>
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
                      <a href={sampleDownloadUrl(1, "cogging_data")} download="cogging_data.xlsx" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("cog.ps.sample_xlsx")}</a>
                      <a href={sampleDownloadUrl(1, "pretrained_cogging_model")} download="pretrained_cogging_model.h5" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("cog.ps.sample_h5")}</a>
                    </>
                  )}
                </div>
                <Button type="submit" className="mt-4 w-[220px] h-11 cursor-pointer bg-slate-900 hover:bg-slate-800 font-medium" disabled={state.status == "loading"}>{
                    state.status == "loading" ? (<><AiOutlineLoading className="animate-spin" />{t("cog.ps.computing")}</>)
                    : (<><PiComputerTower />{t("cog.ps.compute_button")}</> )
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
import { useT } from "@/lib/i18n";

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

function MaterialPicker({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const { t } = useT();
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
        {t("cog.mat.title")}
        <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">{t("cog.mat.subtitle")}</span>
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">{t("cog.mat.preset")}</label>
          <select
            value={selectedId}
            onChange={(e) => applyPreset(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm cursor-pointer"
          >
            {MATERIAL_PRESETS.map((m) => (
              <option key={m.id} value={m.id}>{t(m.nameKey as any)}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{t(preset.noteKey as any)}</p>
        </div>

        {/* Hidden fields submitted with the form. For "custom" we expose number inputs. */}
        <div className={"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 " + (isCustom ? "" : "hidden")}>
          <CoeffInput name="void_B" label="Void B"  defaultValue={preset.void_B}  hint={t("cog.mat.void_b_hint")} />
          <CoeffInput name="void_C" label="Void C"  defaultValue={preset.void_C}  hint={t("cog.mat.void_c_hint")} />
          <CoeffInput name="void_D" label="Void D"  defaultValue={preset.void_D}  hint={t("cog.mat.void_d_hint")} />
          <CoeffInput name="flow_stress_base_MPa" label="σ₀ @ 1200°C (MPa)" defaultValue={preset.flow_stress_base_MPa} hint={t("cog.mat.flow_base_hint")} />
          <CoeffInput name="flow_stress_slope"    label="σ slope (MPa/°C)"  defaultValue={preset.flow_stress_slope}    hint={t("cog.mat.flow_slope_hint")} />
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