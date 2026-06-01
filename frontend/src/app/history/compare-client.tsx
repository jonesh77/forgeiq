"use client";

import { useState } from "react";
import { HiSparkles } from "react-icons/hi2";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { LuGitCompareArrows, LuHistory, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FaCheck } from "react-icons/fa6";
import { ProgramHeader } from "@/components/our/program-header";

type Entry = {
  _id: string;
  service: string;
  title: string;
  params: Record<string, unknown>;
  summary?: string;
  used_sample?: boolean;
  createdAt: string;
};

const SERVICE_LABEL: Record<string, { nameKey: string; href: string; color: string }> = {
  "cogging.train_model":              { nameKey: "svc.train_model",        href: "/cogging",        color: "bg-blue-100 text-blue-800" },
  "cogging.train_correction":         { nameKey: "svc.train_correction",   href: "/cogging",        color: "bg-blue-100 text-blue-800" },
  "cogging.pass_schedule":            { nameKey: "svc.pass_schedule",      href: "/cogging",        color: "bg-blue-100 text-blue-800" },
  "processing_map.main_graph":        { nameKey: "svc.main_graph",         href: "/processing_map", color: "bg-emerald-100 text-emerald-800" },
  "processing_map.plot_vs_strain":    { nameKey: "svc.plot_vs_strain",     href: "/processing_map", color: "bg-emerald-100 text-emerald-800" },
  "processing_map.collect_for_strain":{ nameKey: "svc.collect_for_strain", href: "/processing_map", color: "bg-emerald-100 text-emerald-800" },
  "preform_3d.generate":              { nameKey: "svc.preform_3d",         href: "/3d_preform",     color: "bg-violet-100 text-violet-800" },
};

function formatWhen(d: string): string {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryClient({ entries }: { entries: Entry[] }) {
  const { t } = useT();
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<Entry[]>([]);

  const togglePick = (e: Entry) => {
    if (picked.find((p) => p._id === e._id)) {
      setPicked(picked.filter((p) => p._id !== e._id));
    } else if (picked.length < 2) {
      const next = [...picked, e];
      setPicked(next);
    }
  };

  const cancelCompare = () => { setCompareMode(false); setPicked([]); };
  const compareReady = picked.length === 2;

  return (
    <div className="min-h-screen bg-slate-50/40">
      <ProgramHeader title={t("nav.history")} accent="indigo" minimize />
      <div className="container max-w-4xl mx-auto pt-10 pb-20 px-6 font-public">
        <div className="flex items-center gap-3">
          <LuHistory className="text-2xl text-indigo-600" />
          <h1 className="text-2xl font-montserrat font-semibold">{t("history.title")}</h1>
        </div>
        <div className="w-full h-px bg-gray-100 mt-4 mb-6"></div>

        {entries.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl py-16 text-center bg-slate-50">
            <LuHistory className="text-4xl text-slate-400 mx-auto" />
            <p className="mt-4 text-slate-700 font-medium">{t("history.empty")}</p>
            <p className="text-sm text-slate-500 mt-1">{t("history.empty_sub")}</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link href="/cogging" className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">{t("history.open_cogging")}</Link>
              <Link href="/processing_map" className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{t("history.open_pmap")}</Link>
              <Link href="/3d_preform" className="px-3 py-1.5 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-700">{t("history.open_preform")}</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 text-sm">{t("history.subtitle")}</p>
              <div className="flex items-center gap-2">
                {compareMode ? (
                  <>
                    <span className="text-xs text-slate-500">
                      {picked.length}/2 {picked.length < 2 ? t("history.compare_select") : ""}
                    </span>
                    <Button variant="ghost" size="sm" onClick={cancelCompare} className="cursor-pointer h-8">
                      <LuX />{t("history.compare_cancel")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setCompareMode(true)} className="cursor-pointer h-8">
                    <LuGitCompareArrows />{t("history.compare")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {entries.map((e) => {
                const meta = SERVICE_LABEL[e.service];
                const name = meta ? t(meta.nameKey as any) : e.service;
                const href = meta?.href || "/";
                const color = meta?.color || "bg-slate-100 text-slate-800";
                const paramList = Object.entries(e.params || {}).filter(([, v]) => v !== undefined && v !== "");
                const isPicked = !!picked.find((p) => p._id === e._id);
                const Wrapper: any = compareMode ? "button" : Link;
                const wrapperProps: any = compareMode
                  ? { onClick: () => togglePick(e), type: "button" }
                  : { href };

                return (
                  <Wrapper
                    {...wrapperProps}
                    key={e._id}
                    className={
                      "block w-full text-left border rounded-lg px-4 py-3 transition-colors " +
                      (compareMode
                        ? (isPicked ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50 cursor-pointer")
                        : "border-slate-200 hover:bg-slate-50")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {compareMode && (
                          <span className={"w-4 h-4 rounded border flex items-center justify-center " + (isPicked ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300")}>
                            {isPicked && <FaCheck className="text-[10px]" />}
                          </span>
                        )}
                        <span className={"text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded " + color}>{name}</span>
                        {e.used_sample && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <HiSparkles className="text-amber-600" />sample
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{formatWhen(e.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-900">{e.title}</div>
                    {(paramList.length > 0 || e.summary) && (
                      <div className="mt-1 text-xs text-slate-600">
                        {paramList.map(([k, v], i) => (
                          <span key={i} className="mr-3"><span className="text-slate-500">{k}:</span> {String(v)}</span>
                        ))}
                        {e.summary && <span className="text-slate-500">— {e.summary}</span>}
                      </div>
                    )}
                  </Wrapper>
                );
              })}
            </div>

            <Dialog open={compareMode && compareReady} onOpenChange={(o) => { if (!o) cancelCompare(); }}>
              <DialogContent className="!max-w-3xl font-public">
                <DialogTitle className="flex items-center gap-2">
                  <LuGitCompareArrows />{t("history.compare")}
                </DialogTitle>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {picked.map((p) => {
                    const meta = SERVICE_LABEL[p.service];
                    const name = meta ? t(meta.nameKey as any) : p.service;
                    const color = meta?.color || "";
                    return (
                      <div key={p._id} className="border rounded-lg p-3">
                        <div className={"text-[10px] uppercase font-medium px-2 py-0.5 rounded inline-block " + color}>{name}</div>
                        <div className="text-sm font-semibold mt-1">{p.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatWhen(p.createdAt)}</div>
                        <div className="mt-3 space-y-1">
                          {Object.entries(p.params || {}).map(([k, v], i) => {
                            const other = picked[(picked.findIndex((x) => x._id === p._id) === 0) ? 1 : 0];
                            const otherVal = (other.params || {})[k];
                            const diff = String(otherVal) !== String(v);
                            return (
                              <div key={i} className={"text-xs flex justify-between gap-3 py-0.5 px-2 rounded " + (diff ? "bg-yellow-50" : "")}>
                                <span className="text-slate-500">{k}</span>
                                <span className={diff ? "font-semibold text-slate-900" : "text-slate-700"}>{String(v)}</span>
                              </div>
                            );
                          })}
                          {p.summary && <div className="text-xs text-slate-600 italic mt-2">{p.summary}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {t("history.diff_legend")}
                </p>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
