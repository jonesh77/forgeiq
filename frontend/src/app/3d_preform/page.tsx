"use client";

import { useState } from "react";
import Display3DModel from "./display_3d_model/default";
import { ProgramHeader, TabStrip } from "@/components/our/program-header";
import { ProgramHero } from "@/components/our/program-hero";
import { useT } from "@/lib/i18n";

const tabs: [string, () => React.ReactNode][] = [
    ["svc.display_3d", () => <Display3DModel />],
];

export default function Page() {
    const { t } = useT();
    let [activeTab, setActiveTab] = useState(0);

    return (
        <div className="font-public min-h-screen body-preform">
            <ProgramHeader title={t("nav.preform_3d")} accent="violet" />
            <ProgramHero variant="preform" />
            <TabStrip
                tabs={tabs.map(([key]) => t(key as any))}
                active={activeTab}
                onChange={setActiveTab}
                accent="violet"
            />
            <div className="px-6 lg:px-8 py-6">
                {tabs[activeTab][1]()}
            </div>
        </div>
    );
}
