"use client";

import { InfoTriggerCustom } from "@/components/our/info";
import { Section, Steps, Tip } from "@/components/our/info-helpers";
import { PiCompassTool, PiCube } from "react-icons/pi";
import { TbChartArea } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { HiSparkles } from "react-icons/hi2";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function HelpHeader({ trigger }) {
  const { t } = useT();
  return (
    <InfoTriggerCustom
      trigger={trigger}
      title={t("help.title")}
      content={
        <>
          <Section title={t("help.what_title")}>
            {t("help.what_text")}
          </Section>

          <div className="grid grid-cols-3 gap-3 mt-1">
            <div className="border rounded-lg p-3">
              <PiCompassTool className="text-blue-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">{t("help.cog_title")}</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>{t("help.cog_b1")}</li>
                <li>{t("help.cog_b2")}</li>
                <li>{t("help.cog_b3")}</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <TbChartArea className="text-emerald-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">{t("help.pmap_title")}</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>{t("help.pmap_b1")}</li>
                <li>{t("help.pmap_b2")}</li>
                <li>{t("help.pmap_b3")}</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <PiCube className="text-violet-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">{t("help.pre_title")}</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>{t("help.pre_b1")}</li>
                <li>{t("help.pre_b2")}</li>
                <li>{t("help.pre_b3")}</li>
              </ul>
            </div>
          </div>

          <Section title={t("help.workflow_title")}>
            <Steps items={[
              t("help.wf1"),
              t("help.wf2"),
              t("help.wf3"),
              t("help.wf4"),
              t("help.wf5"),
              t("help.wf6"),
            ]} />
          </Section>

          <Section title={t("help.helpers_title")}>
            <ul className="list-disc list-inside space-y-0.5 ml-2 text-sm">
              <li><strong>{t("help.h_sample_b")}</strong> {t("help.h_sample_t")}</li>
              <li><strong>{t("help.h_download_b")}</strong> {t("help.h_download_t")}</li>
              <li><strong>{t("help.h_bookmarks_b")}</strong> {t("help.h_bookmarks_t")}</li>
              <li><strong>{t("help.h_history_b")}</strong> {t("help.h_history_t")}</li>
              <li><strong>{t("help.h_pdf_b")}</strong> {t("help.h_pdf_t")}</li>
              <li><strong>{t("help.h_lang_b")}</strong> {t("help.h_lang_t")}</li>
            </ul>
          </Section>

          <Tip>{t("help.tip")}</Tip>

          <Section title={t("help.need_title")}>
            {t("help.need_pre")} <strong>{t("help.need_btn")}</strong> {t("help.need_post")} <strong>{t("help.need_messages")}</strong> {t("help.need_tail")}
          </Section>

          <div className="pt-2 border-t border-slate-200 mt-2">
            <Link href="/">
              <Button type="button" variant="outline" className="cursor-pointer w-full">
                <HiSparkles className="text-amber-500" />{t("help.open_intro")}
              </Button>
            </Link>
          </div>
        </>
      }
    />
  );
}
