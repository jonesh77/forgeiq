"use client";

import { Button } from "@/components/ui/button";
import { HiSparkles } from "react-icons/hi2";
import { MdOutlineFileDownload } from "react-icons/md";
import { AiOutlineLoading } from "react-icons/ai";
import { useState } from "react";
import { useT } from "@/lib/i18n";

type SampleAction = () => Promise<void> | void;

/**
 * Compact "Try sample" + "Download sample(s)" button group rendered next to
 * a form. The runSample callback should perform the sample submission and
 * usually toggle the parent's loading state.
 */
export function SampleButtons({
  runSample,
  downloadUrls,
  disabled = false,
  className = "",
}: {
  runSample: SampleAction;
  downloadUrls?: { label: string; url: string; filename?: string }[];
  disabled?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const { t } = useT();

  const onTry = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await runSample();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      <Button
        type="button"
        onClick={onTry}
        disabled={busy || disabled}
        variant="secondary"
        className="cursor-pointer h-8 px-3 text-xs bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-900 border border-amber-300"
        title="Run this form with built-in sample data"
      >
        {busy ? (
          <><AiOutlineLoading className="animate-spin" />{t("sample.loading")}</>
        ) : (
          <><HiSparkles />{t("sample.try")}</>
        )}
      </Button>

      {downloadUrls && downloadUrls.length > 0 && (
        <div className="flex items-center gap-1">
          {downloadUrls.map((d, i) => (
            <a
              key={i}
              href={d.url}
              download={d.filename || true}
              className="cursor-pointer h-8 px-2.5 text-xs inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              title={`Download ${d.label}`}
            >
              <MdOutlineFileDownload />{d.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
