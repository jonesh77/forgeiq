import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { TbCube3dSphere } from "react-icons/tb";
import Info from "./info";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";
import { themeData, themeLayout, PLOT_CONFIG } from "@/components/our/plotly-theme";
import { ScientificFrame } from "@/components/our/scientific-frame";
import { useT } from "@/lib/i18n";
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function PlotValuesAgainstStrainGUI () {
    const { t } = useT();
    const [plotData, setPlotData] = useState(null);
    let [loading, setLoading] = useState(false);
    let [plotKey, setPlotKey] = useState(0);
    let [currentPlotBy, setCurrentPlotBy] = useState<string | null>("temperature");
    let [mode, setMode] = useState<FormMode>("quick");

    const handleSubmit = async (e) => {
        e.preventDefault();

        let fd = new FormData(e.target);
        if (mode === "quick") fd.set("_use_sample", "true");

        setLoading(true);

        const r = await postToBackend1("/api/processingmap/plot_values_against_strain", fd);
        if (r.ok && Array.isArray(r.data) && r.data[0]) {
            setPlotData(r.data[0]);
            setPlotKey(plotKey + 1);
            toast.success(t("pmap.common.toast_graph"));
        } else {
            setLoading(false);
        }
    }

    const runSample = async () => {
        setLoading(true);
        const fd = sampleFormData({ plot_by: "temperature", value_type: "instability", steps: "0.1", value: "1200" });
        const r = await postToBackend1("/api/processingmap/plot_values_against_strain", fd);
        if (r.ok && Array.isArray(r.data) && r.data[0]) {
            setPlotData(r.data[0]);
            setPlotKey(plotKey + 1);
            toast.success(t("pmap.common.toast_sample_graph"));
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-x-12 p-4 sm:p-5 py-2.5">
            <form className="w-full lg:flex-[2] lg:border-r lg:pr-10" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-x-3 flex-wrap gap-y-3">
                    <div className="flex items-center gap-x-3">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("pmap.plot.title")}</h1>
                        <Info />
                    </div>
                    <ModeToggle mode={mode} setMode={setMode} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? t("pmap.plot.subtitle_quick") : t("pmap.plot.subtitle_adv")}</p>
                <ModeBanner mode={mode} />
                <div className="flex flex-col items-start gap-x-8 gap-y-4 mt-7">
                {mode === "advanced" && (
                  <div>
                      <h5 className='font-medium text-xs text-slate-700'>{t("pmap.common.pmap_data")}</h5>
                      <Input accept=".xlsx" type='file' name='file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
                  </div>
                )}
                <div>
                    <div className="flex gap-x-2 items-center">
                        <h5 className='font-medium text-xs text-slate-700'>{t("pmap.common.steps")}</h5>
                    </div>
                    <Input type='number' step={"any"} defaultValue="0.1" name='steps' className='bg-slate-50 border-slate-200 mt-1.5 w-[260px] h-10 placeholder:text-xs' required />
                </div>
                <div>
                    <h5 className='font-medium text-xs text-slate-700'>{t("pmap.plot.plot_by")}</h5>
                    <Select name="plot_by" defaultValue="temperature" onValueChange={(v) => setCurrentPlotBy(v)} required>
                        <SelectTrigger className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer w-[250px] h-10">
                            <SelectValue placeholder={t("pmap.plot.plot_by_ph")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="temperature">{t("pmap.plot.temperature")}</SelectItem>
                            <SelectItem value="LOG10SR">{t("pmap.plot.log10sr")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <h5 className='font-medium text-xs text-slate-700'>{t("pmap.plot.value_type")}</h5>
                    <Select name="value_type" defaultValue="instability" required>
                        <SelectTrigger className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer w-[250px] h-10">
                            <SelectValue placeholder={t("pmap.plot.value_type_ph")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="instability">{t("pmap.main.opt_instability")}</SelectItem>
                            <SelectItem value="dissipation">{t("pmap.main.opt_dissipation")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {currentPlotBy && (
                    <div>
                        <h5 className='font-medium text-xs text-slate-700'>{currentPlotBy === "temperature" ? t("pmap.plot.value_label_temperature") : t("pmap.plot.value_label_log10sr")}</h5>
                        <Select name="value" defaultValue={currentPlotBy === "temperature" ? "1200" : "1"} required>
                            <SelectTrigger className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer w-[250px] h-10">
                                <SelectValue placeholder={t("pmap.plot.value_ph")} />
                            </SelectTrigger>
                            <SelectContent>
                                {currentPlotBy == "temperature" ? (
                                    <>
                                    <SelectItem value="900">900C</SelectItem>
                                    <SelectItem value="1000">1000C</SelectItem>
                                    <SelectItem value="1100">1100C</SelectItem>
                                    <SelectItem value="1200">1200C</SelectItem>
                                    </>
                                ) : (
                                    <>
                                    <SelectItem value="0.01">log10(0.01)</SelectItem>
                                    <SelectItem value="0.1">log10(0.1)</SelectItem>
                                    <SelectItem value="1">log10(1)</SelectItem>
                                    <SelectItem value="10">log10(10)</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {mode === "advanced" && (
                  <div className="w-full mt-2">
                    <a href={sampleDownloadUrl(1, "processing_map")} download="processing_map.xlsx" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">{t("pmap.common.sample_xlsx")}</a>
                  </div>
                )}
                <Button className="w-[300px] mt-3 h-11 bg-slate-900 hover:bg-slate-800 font-medium" type="submit" disabled={loading}>{
                    loading ? (<><AiOutlineLoading className="animate-spin" />{t("pmap.common.loading")}</>) : (<><TbCube3dSphere />{t("pmap.common.gen_graph")}</>)
                }</Button>
            </div>
            </form>
            <div className="w-full lg:flex-[7]">
                {loading && (
                    <Skeleton className="w-full aspect-[2] flex gap-x-3 items-center justify-center"><AiOutlineLoading className="animate-spin" /><p>{t("pmap.common.loading")}</p></Skeleton>
                )}
                {plotData && (
                    <div className={" w-full " + (loading ? "hidden" : "block")}>
                      <ScientificFrame title={t("pmap.plot.frame_title")} subtitle={t("pmap.plot.frame_sub")}>
                        <div className="aspect-[1.8]">
                          <Plot key={plotKey} onInitialized={() => { setLoading(false); }} className="w-full h-full p-0" useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                            config={PLOT_CONFIG}
                            data={themeData(plotData.data)}
                            layout={themeLayout(plotData.layout)}
                          />
                        </div>
                      </ScientificFrame>
                    </div>
                )}
            </div>
            </div>
    )
}