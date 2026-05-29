import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox";
import { TbCube3dSphere } from "react-icons/tb";
import dynamic from "next/dynamic";
import { AiOutlineLoading } from "react-icons/ai";
import { Skeleton } from "@/components/ui/skeleton";
import Script from "next/script";

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });


export default function MainGraphGUI ({ states, setStates }) {
  const [plotData, setPlotData] = useState(null);
  let [loading, setLoading] = useState(false);
  let [plotKey, setPlotKey] = useState(0);
  let [currentPlotType, setCurrentPlotType] = useState(null);
  let [mode, setMode] = useState<FormMode>("quick");

  let [simufactState, setSimufactState] = useState({
    opened: false,
    files: {
      "t.csv": null,
      "s.csv": null,
      "sr.csv": null
    }
  });

  let [deformState, setDeformState] = useState({
    opened: false,
    files: {
      "t.dat": null,
      "sr.dat": null,
      "s.dat": null
    }
  });

  useEffect(() => {
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  }, [plotKey, loading, plotData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    let fd = new FormData(e.target);
    if (mode === "quick") fd.set("_use_sample", "true");

    let selected_data_arry: string[] = [];

    if (mode === "advanced" && fd.get("simufact")) {
      selected_data_arry.push("Simufact_particles_");
      fd.append("simufact_t", simufactState.files["t.csv"]);
      fd.append("simufact_s", simufactState.files["s.csv"]);
      fd.append("simufact_sr", simufactState.files["sr.csv"]);
    }
    if (mode === "advanced" && fd.get("deform")) {
      selected_data_arry.push("DEFORM_particles_");
      fd.append("deform_t", deformState.files["t.dat"]);
      fd.append("deform_s", deformState.files["s.dat"]);
      fd.append("deform_sr", deformState.files["sr.dat"]);
    }

    fd.append("selected_data", JSON.stringify(selected_data_arry));

    setLoading(true);

    const r = await postToBackend1("/api/processingmap/main_graph", fd);
    if (r.ok && Array.isArray(r.data) && r.data[0]) {
      setPlotData(r.data[0]);
      setPlotKey(plotKey + 1);
      toast.success("Graph generated");
      recordHistory({
        service: "processing_map.main_graph",
        title: "Main Graph",
        params: { plot_type: fd.get("plot_type")?.toString(), steps: fd.get("steps")?.toString() },
      });
    } else {
      setLoading(false);
    }
  }

  const runSample = async () => {
    setLoading(true);
    const fd = sampleFormData({ plot_type: "2D", steps: "0.5", selected_data: "[null]" });
    const r = await postToBackend1("/api/processingmap/main_graph", fd);
    if (r.ok && Array.isArray(r.data) && r.data[0]) {
      setPlotData(r.data[0]);
      setPlotKey(plotKey + 1);
      toast.success("Sample graph generated");
      recordHistory({
        service: "processing_map.main_graph",
        title: "Main Graph (sample)",
        params: { plot_type: "2D", steps: "0.5" },
        used_sample: true,
      });
    } else {
      setLoading(false);
    }
  };

  let submitDisabled = loading || (simufactState.opened && Object.values(simufactState.files).some(v => v === null))

  return (
    <div className="flex gap-x-12 p-5 py-2.5">
      <form className="flex-1 border-r pr-10 relative" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-x-3 flex-wrap gap-y-3">
          <div className="flex items-center gap-x-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Main Graph</h1>
            <Info />
          </div>
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
        <p className="mt-1 text-sm text-slate-500">{mode === "quick" ? "Pick plot type + steps and we render the chart from a built-in stress-strain dataset (AISI 4340)." : "Upload your stress-strain Excel and optionally Simufact/DEFORM particle data."}</p>
        <ModeBanner mode={mode} />
        <div className="flex flex-col items-start gap-x-8 gap-y-4 mt-7">
          {mode === "advanced" && (
            <div>
                <h5 className='font-medium text-xs text-slate-700'>Processing map data (.xlsx)</h5>
                <Input accept=".xlsx" type='file' name='file' className='bg-slate-50 border-slate-200 mt-1.5 h-10 cursor-pointer' required />
            </div>
          )}
          <div>
              <h5 className='font-medium text-xs text-slate-700'>Plot Type</h5>
              <Select name="plot_type" defaultValue="2D" onValueChange={(v) => { setCurrentPlotType(v); }} required>
                <SelectTrigger className="bg-slate-50 border-slate-200 mt-1.5 cursor-pointer w-[250px] h-10">
                  <SelectValue placeholder="Select plot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instability">Instability</SelectItem>
                  <SelectItem value="dissipation">Dissipation</SelectItem>
                  <SelectItem value="2D">2D</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <div>
              <div className="flex gap-x-2 items-center">
                  <h5 className='font-medium text-xs text-slate-700'>{
                    currentPlotType == "2D" ? "Strain No." : "Steps (between 0.1 and 1.0)"
                  }</h5>
              </div>
              <Input type='number' step={"any"} defaultValue="0.5" name='steps' className='bg-slate-50 border-slate-200 mt-1.5 w-[260px] h-10 placeholder:text-xs' required />
          </div>
          {mode === "advanced" && (
            <div>
                <h5 className='font-medium text-xs text-slate-700'>Which particles to include?</h5>
                <div className="flex gap-x-5 mt-3">
                  <div className="flex gap-x-2 items-center text-sm ">
                    <Checkbox name="simufact" checked={simufactState.opened} onClick={() => { setSimufactState({ opened: !simufactState.opened, files: simufactState.files }) }} id="simufact" className="cursor-pointer" />
                    <Label htmlFor="simufact" className="font-normal cursor-pointer text-xs">Simufact particles</Label>
                  </div>
                  <div className="flex gap-x-2 items-center text-sm cursor-pointer">
                    <Checkbox name="deform" checked={deformState.opened} onClick={() => { setDeformState({ opened: !deformState.opened, files: deformState.files }) }} id="deform" className="cursor-pointer" />
                    <Label htmlFor="deform" className="font-normal cursor-pointer text-xs">Deform particles</Label>
                  </div>
                </div>
            </div>
          )}
          {mode === "advanced" && (simufactState.opened || deformState.opened) && (<div className="h-[0.5px] w-full bg-slate-200 mt-2 mb-1"></div>)}
          {mode === "advanced" && simufactState.opened && (
            <div className="w-full">
              <h5 className='font-medium text-xs text-slate-700'>Simufact particles</h5>
              <FileFolder state={simufactState.files} setState={(v) => { setSimufactState({ opened: simufactState.opened, files: v }) }} />
            </div>
          )}
          {mode === "advanced" && deformState.opened && (
            <div className="w-full">
              <h5 className='font-medium text-xs text-slate-700'>Deform particles</h5>
              <FileFolder state={deformState.files} setState={(v) => { setDeformState({ opened: deformState.opened, files: v }) }} />
            </div>
          )}
          {mode === "advanced" && (
            <div className="w-full mt-2">
              <a href={sampleDownloadUrl(1, "processing_map")} download="processing_map.xlsx" className="text-xs px-2.5 h-8 inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer">↓ Sample .xlsx</a>
            </div>
          )}
          <Button className="w-[300px] mt-3 h-11 bg-slate-900 hover:bg-slate-800 font-medium" type="submit" disabled={submitDisabled}>{
            loading ? (<><AiOutlineLoading className="animate-spin" />Loading...</>) : (<><TbCube3dSphere />Generate graph</>)
          }</Button>
      </div>
      </form>
      <div className="flex-[5]">
          {loading && (
            <Skeleton className="w-full aspect-[2] flex gap-x-3 items-center justify-center"><AiOutlineLoading className="animate-spin" /><p>Loading...</p></Skeleton>
          )}
          {plotData && (
            <div className={" w-full " + (loading ? "hidden" : "block")}>
              <ScientificFrame title="Processing map" subtitle="Power dissipation × Flow instability">
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

import { IoIosAddCircleOutline } from "react-icons/io";
import { FaCircleCheck } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa6";
import { FaFileCircleCheck } from "react-icons/fa6";
import { TbReplace } from "react-icons/tb";
import Info from "./info";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { recordHistory } from "@/lib/history";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";
import { themeData, themeLayout, PLOT_CONFIG } from "@/components/our/plotly-theme";
import { ScientificFrame } from "@/components/our/scientific-frame";

function FileFolder ({ state, setState }) {
  let inputRef = useRef<HTMLInputElement | null>(null);
  let currentFileRead = useRef(null);

  const callFor = (file_name: string) => {
    currentFileRead.current = file_name;
    let a = file_name.split(".");
    let file_type = a[a.length - 1];

    if (inputRef.current) {
        inputRef.current.accept = `.${file_type}`;
        inputRef.current?.click();
    }
  }

  const handleFileChange = (event) => {
    if (currentFileRead.current) {
      let a = currentFileRead.current.split(".");
      let file_type = a[a.length - 1];

      const file = event.target.files?.[0];

      if (file) {
        let b = file.name.split(".");
        let uploaded_file_type = b[b.length - 1];
        if (file_type == uploaded_file_type) {
          console.log(file);
          if (Object.keys(state).filter((v) => v != currentFileRead.current).includes(file.name)) {
            setState({ ...state, [file.name]: file });
          } else { 
            setState({ ...state, [currentFileRead.current]: file });
          }
          console.log("check");
        }
      }
      
      currentFileRead.current = null;
    }
  };

  return (
    <div className="flex gap-x-3 mt-2.5">
      <Input ref={inputRef} onChange={handleFileChange} type="file" id="someid" className="hidden" />
      {Object.entries(state).map((v, idx) => {
        if (v[1]) {
          return (
            <div key={idx} onClick={() => { callFor(v[0]) }} className="w-16 relative group aspect-[0.9] bg-slate-700 text-slate-50 rounded-lg flex flex-col items-center justify-center">
                <FaFileCircleCheck className="text-xl transition-all" />
                <p className="text-[10px] mt-0.5">{v[1].name}</p>
                <p className="text-[8px] text-slate-300">{Math.round(v[1].size/1000)}KB</p>
                <TbReplace className="transition-all absolute cursor-pointer -top-1 -right-1 text-lg bg-slate-500 hover:bg-slate-800 text-white rounded-sm p-[3px]" />
            </div>
          )
        } else {
          return (
            <div key={idx} onClick={() => { callFor(v[0]) }} className="w-16 cursor-pointer group aspect-[0.9] bg-slate-100 text-slate-500 rounded-lg flex flex-col items-center justify-center gap-y-1">
                <IoIosAddCircleOutline className="text-xl group-hover:scale-110 transition-all" />
                <p className="text-[10px]">{v[0]}</p>
            </div>
          )
        }
      })}
    </div>
  )
}