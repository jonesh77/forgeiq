"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { GoGraph } from "react-icons/go";
import { LuDownload, LuFileInput } from "react-icons/lu";
import { IoIosInformation, IoMdHelp, IoMdSettings } from "react-icons/io";
import { FaGears, FaInfo } from "react-icons/fa6";
import { Skeleton } from '@/components/ui/skeleton';
import { AiOutlineLoading } from 'react-icons/ai';
import { GoGear } from "react-icons/go";
import plot_img from "../../../../public/plot.png"
import Image from 'next/image';
import { FiDownload } from "react-icons/fi";
import { MdDownload, MdFullscreen, MdHelp } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";
import { CiFileOn } from "react-icons/ci";
import { FaFile } from "react-icons/fa6";
import { AiFillFile } from "react-icons/ai";
import { FaFileAlt } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import bqi_formula from "../../../../public/BQI1.png"
import { IoInformationSharp } from "react-icons/io5";
import { postToBackend1, sampleFormData, sampleDownloadUrl } from "@/lib/api";
import { toast } from "sonner";
import { SampleButtons } from "@/components/our/sample-button";
import { ParamHelp } from "@/components/our/param-help";
import { recordHistory } from "@/lib/history";
import { BookmarkPanel } from "@/components/our/bookmark-panel";
import { useRef } from "react";
import { ModeToggle, ModeBanner, FormMode } from "@/components/our/mode-toggle";

export default function TF ({ states, setStates }) {
  return (
    <div className='w-full p-3 space-y-12'>
      <TrainDataCorrection state={states.trainDataCorrection} setState={(d) => { setStates({ ...states, trainDataCorrection: d }) }} />
      <details className="bg-white border border-slate-200 rounded-2xl">
        <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-2xl flex items-center justify-between">
          <span>Advanced — train your own model from raw cogging data</span>
          <span className="text-xs text-slate-400">(optional)</span>
        </summary>
        <div className="border-t border-slate-200 p-6">
          <ModelTrainer state={states.trainData} setState={(d) => { setStates({ ...states, trainData: d }) }} />
        </div>
      </details>
    </div>
  )
}

export function base64FileSizeKB(base64String) {
  // Remove the data URL prefix if it exists
  let b64 = base64String.split(',').pop();

  // Count padding
  let padding = (b64.endsWith('==')) ? 2 : (b64.endsWith('=')) ? 1 : 0;

  // Calculate bytes
  let sizeInBytes = (b64.length * 3) / 4 - padding;

  // Convert to KB
  return sizeInBytes / 1024;
}

function ModelTrainer ({ state, setState }) {
  const downloadH5 = () => {
    const link = document.createElement('a');
    link.href = 'data:application/octet-stream;base64,' + state.obj.h5;
    link.download = 'model.h5';
    link.click();
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${state.obj.image}`;
    link.download = 'graph.png';
    link.click();
  }

  const submitWith = async (fd: FormData) => {
    setState({ status: "loading", obj: {} });
    const r = await postToBackend1("/api/cogging/fourimages1h5", fd);
    if (r.ok) {
        const data = r.data;
        setState({ status: "filled", obj: { image: data.images[0], h5: data.h5, h5size: base64FileSizeKB(data.h5) } });
        toast.success(data.used_sample ? "Sample model generated" : "Model generated successfully");
        recordHistory({
            service: "cogging.train_model",
            title: data.used_sample ? "Train Model (sample data)" : "Train Model",
            params: { input_file: (fd.get("file") as File)?.name || "sample" },
            summary: `h5 model: ${Math.round(base64FileSizeKB(data.h5))} KB`,
            used_sample: !!data.used_sample,
        });
    } else {
        setState({ status: "error", obj: { } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitWith(new FormData(e.target));
  }

  const runSample = () => submitWith(sampleFormData());

  return (
    <div className='w-full bg-white border border-slate-200 rounded-2xl p-8 py-7 flex items-stretch shadow-sm'>
      <form className='flex-1/3 flex flex-col justify-between relative' onSubmit={handleSubmit}>
        <div>
          <div className='inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold uppercase tracking-wider mb-2'>Step 1</div>
          <div className="flex items-center gap-2">
            <h2 className='text-2xl text-slate-900 font-semibold tracking-tight'>Train Model</h2>
            <Info />
          </div>
          <h4 className='text-[13px] mt-1 w-4/5 text-slate-500 leading-relaxed'>Upload a cogging Excel file and we will train a neural-network ENE predictor (.h5).</h4>

          <h5 className='mt-6 font-medium text-xs text-slate-700'>Excel file</h5>
          <Input accept=".xlsx" type='file' name='file' className='bg-slate-50 border-slate-200 mt-1.5 cursor-pointer h-10 file:mr-3 file:bg-slate-200 file:text-slate-700 file:border-0 file:rounded file:px-2 file:py-1 file:text-xs' />
          <div className="mt-3">
            <SampleButtons
              runSample={runSample}
              disabled={state.status === "loading"}
              downloadUrls={[{ label: "Sample .xlsx", url: sampleDownloadUrl(1, "cogging_data"), filename: "cogging_data.xlsx" }]}
            />
          </div>
        </div>
        <Button type="submit" className='cursor-pointer h-11 mt-6 bg-slate-900 hover:bg-slate-800 font-medium' disabled={state.status === "loading"}>
          <FaGears />Generate model
        </Button>
      </form>
      <div className='w-px bg-slate-200 mx-8'></div>
      <div className='flex-2/3 min-h-[400px]'>
        {state.status == "steady" ? (
          <div className="h-full w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
            <div className='text-center text-slate-500'>
              <LuFileInput className="text-3xl mx-auto text-slate-400" />
              <p className='mt-3 text-sm font-medium text-slate-700'>No model generated yet</p>
              <p className='text-xs mt-1'>Upload an Excel file or click <span className="text-amber-700 font-medium">Try with sample</span> on the left.</p>
            </div>
          </div>
        ) : state.status == "loading" ? (
          <Skeleton className="h-full w-full rounded-2xl bg-slate-100 flex items-center justify-center">
            <div className='flex flex-col items-center text-slate-600'>
              <AiOutlineLoading className='animate-spin text-3xl text-indigo-600' />
              <p className='mt-5 text-sm font-medium text-slate-800'>Generating a .h5 model</p>
              <p className='text-xs mt-2 max-w-[280px] text-center leading-relaxed text-slate-500'>Training a neural network is computationally demanding — this can take a minute on first run.</p>
            </div>
          </Skeleton>
        ) : state.status == "filled" ? (
          <div className='w-full h-full grid grid-cols-3 gap-x-6 0'>
            <div className='col-span-2 max-h-[400px]'>
              <div className='flex items-center gap-x-3 h-[4%]'>
                <GoGraph className='text-base' />
                <h2 className='text-sm font-medium'>Generated Plot</h2>
              </div>
              <div className='h-[92.5%] flex items-center justify-center mt-4 bg-white rounded-2xl p-4 pl-3 border relative group'>
                <div className='absolute top-4 right-4 flex gap-x-3'>
                  <Button size={"icon"} onClick={downloadImage} className='opacity-60 group-hover:opacity-30 hover:opacity-90 cursor-pointer w-8 h-8' variant={"default"}><IoMdDownload /></Button>
                  <Dialog>
                    <DialogTrigger asChild><Button size={"icon"} className='opacity-60 group-hover:opacity-30 hover:opacity-90 cursor-pointer w-8 h-8' variant={"default"}><MdFullscreen /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogTitle></DialogTitle>
                      <img
                        src={`data:image/png;base64,${state.obj.image}`}
                        alt="Generated Plot"
                        className=''
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className='h-full flex items-center justify-center overflow-hidden'>
                  <img
                    src={`data:image/png;base64,${state.obj.image}`}
                    alt="Generated Plot"
                    className='max-h-full'
                  />
                </div>
              </div>
            </div>
            <div className='col-span-1 flex flex-col gap-y-4'>
              <div className='flex-grow'>
                <div className='flex items-center gap-x-3 text-slate-800'><GoGear className='text-base' /><h2 className='text-sm font-medium'>Generated .h5 model</h2></div>
                <div className='flex flex-col items-center justify-center aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200 mt-4 rounded-xl border border-slate-200'>
                  <FaFile className='text-4xl text-slate-700' />
                  <p className='mt-3 text-slate-700 font-medium'>model.h5</p>
                  <p className='text-xs mt-0.5 text-slate-500/80 font-medium'>{Math.round(state.obj.h5size)}KB</p>
                </div>
              </div>
              <Button className='cursor-pointer bg-slate-800 hover:bg-slate-900' onClick={downloadH5}><MdOutlineFileDownload />Download .h5 model</Button>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

import { RiFormula } from "react-icons/ri";
import Info from './info';
import Info2 from './info2';

function TrainDataCorrection ({ state, setState }) {
  const formRef2 = useRef<HTMLFormElement | null>(null);
  const [mode, setMode] = useState<FormMode>("quick");
  const getParams = () => {
    const f = formRef2.current; if (!f) return {};
    const out: Record<string, string> = {};
    ["target_astm", "weight_factor"].forEach((k) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el?.value) out[k] = el.value;
    });
    return out;
  };
  const applyP = (p: Record<string, string>) => {
    const f = formRef2.current; if (!f) return;
    Object.entries(p).forEach(([k, v]) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el) el.value = v;
    });
  };

  const downloadXlsx = () => {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${state.obj.xlsx}`;
    link.download = "corrected_data.xlsx";
    link.click();
  };

  const submitWith = async (fd: FormData) => {
    setState({ status: "loading", obj: {} });
    const r = await postToBackend1("/api/cogging/traindatacorrection", fd);
    if (r.ok) {
        const data = r.data;
        setState({ status: "filled", obj: { xlsx: data.file, xlsxsize: base64FileSizeKB(data.file) } });
        toast.success(data.used_sample ? "Sample data corrected" : "Train data corrected");
        recordHistory({
            service: "cogging.train_correction",
            title: data.used_sample ? "Train Data Correction (sample)" : "Train Data Correction",
            params: {
                target_astm: fd.get("target_astm")?.toString() || "(sample default)",
                weight_factor: fd.get("weight_factor")?.toString() || "(sample default)",
            },
            summary: `Excel: ${Math.round(base64FileSizeKB(data.file))} KB`,
            used_sample: !!data.used_sample,
        });
    } else {
        setState({ status: "error", obj: { } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (mode === "quick") fd.set("_use_sample", "true");
    await submitWith(fd);
  }

  return (
    <div className='w-full bg-white border border-slate-200 rounded-2xl p-8 py-7 flex items-stretch shadow-sm'>
      <form ref={formRef2} className='flex-1/3 flex flex-col justify-between relative' onSubmit={handleSubmit}>
        <div className='pb-6'>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className='inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold uppercase tracking-wider'>Cogging</div>
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className='text-2xl text-slate-900 font-semibold tracking-tight'>Train Data Correction</h2>
            <Info2 />
          </div>
          <h4 className='text-[13px] mt-1 w-4/5 text-slate-500 leading-relaxed'>{mode === "quick" ? "Just set your Target ASTM and Weight Factor — we apply the BQI formula to a built-in reference dataset and return the corrected Excel." : "Upload your raw cogging data; we apply the BQI formula and return the corrected Excel."}</h4>
          <ModeBanner mode={mode} />

          {mode === "advanced" && (
            <>
              <h5 className='mt-5 font-medium text-xs text-slate-700'>Excel file</h5>
              <Input accept=".xlsx" type='file' name='file' className='bg-slate-50 border-slate-200 mt-1.5 cursor-pointer h-10 file:mr-3 file:bg-slate-200 file:text-slate-700 file:border-0 file:rounded file:px-2 file:py-1 file:text-xs' required />
            </>
          )}

          <div className='flex items-center gap-x-2 mt-5'>
            <h5 className='font-medium text-xs text-slate-700'>Target ASTM grain size No.</h5>
            <ParamHelp>Desired ASTM grain-size number (higher = finer grain). Typical: 5–8 for forged steel.</ParamHelp>
          </div>
          <Input type='number' defaultValue="6" name='target_astm' className='bg-slate-50 border-slate-200 mt-1.5 h-10 placeholder:text-sm' />

          <div className='flex items-center gap-x-2 mt-5'>
            <h5 className='font-medium text-xs text-slate-700'>Weight Factor</h5>
            <ParamHelp>Penalty multiplier on the (Target − Actual ASTM)² term. Higher values push the optimizer harder toward the target grain size. Typical: 0.05–0.5.</ParamHelp>
          </div>
          <Input type='number' step="0.01" defaultValue="0.1" name='weight_factor' className='bg-slate-50 border-slate-200 mt-1.5 h-10 placeholder:text-sm' />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BookmarkPanel
              service="cogging.train_correction"
              getCurrentParams={getParams}
              applyParams={applyP}
            />
          </div>
        </div>
        <Button type="submit" className='cursor-pointer h-11 mt-6 bg-slate-900 hover:bg-slate-800 font-medium' disabled={state.status === "loading"}>Generate</Button>
      </form>
      <div className='w-px bg-slate-200 mx-8'></div>
      <div className='flex-2/3 min-h-[400px]'>
        {state.status == "steady" ? (
          <div className="h-full w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
            <div className='flex items-center gap-x-3 text-slate-500 text-sm'><LuFileInput /><p>Fill in the parameters and press Generate</p></div>
          </div>
        ) : state.status == "loading" ? (
          <Skeleton className="h-full w-full rounded-3xl bg-slate-100 flex items-center justify-center">
            <div className='flex flex-col items-center'>
              <AiOutlineLoading className='animate-spin text-4xl' />
              <p className='mt-6'>Generating trained data correction</p>
            </div>
          </Skeleton>
        ) : state.status == "filled" ? (
          <div className='w-full h-full grid grid-cols-5 gap-x-6 0'>
            <div className='col-span-2 flex flex-col gap-y-4'>
              <div className='flex-grow'>
                <div className='flex items-center gap-x-3 text-slate-800'><GoGear className='text-base' /><h2 className='text-sm font-medium'>Generated Excel file</h2></div>
                <div className='flex flex-col items-center justify-center aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 mt-4 rounded-xl border border-slate-200'>
                  <FaFile className='text-4xl text-slate-700' />
                  <p className='mt-3 text-slate-700 font-medium'>corrected.xlsx</p>
                  <p className='text-xs mt-0.5 text-slate-500/80 font-medium'>{Math.round(state.obj.xlsxsize)}KB</p>
                </div>
              </div>
              <Button className='cursor-pointer bg-slate-800 hover:bg-slate-900' onClick={downloadXlsx}><MdOutlineFileDownload />Download .xlsx</Button>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}
