"use client";

import { useState } from "react";
import MainGraphGUI from "./main_graph/default";
import PlotValuesAgainstStrainGUI from "./plot_values_against_strain/default";
import CollectValuesForStrain from "./collect_values_for_strain/default";
import PinnForm from "./pinn/default";
import { ProgramHeader, TabStrip } from "@/components/our/program-header";
import { ProgramHero } from "@/components/our/program-hero";
import { useT } from "@/lib/i18n";

const tabs: [string, () => React.ReactNode][] = [
    ["svc.main_graph", () => <MainGraphGUI states={undefined as any} setStates={undefined as any} />],
    ["svc.plot_vs_strain", () => <PlotValuesAgainstStrainGUI />],
    ["svc.collect_for_strain", () => <CollectValuesForStrain />],
    ["svc.pinn_surrogate", () => <PinnForm />],
];

export default function Page() {
    const { t } = useT();
    let [activeTab, setActiveTab] = useState(0);

    return (
        <div className="font-public min-h-screen body-pmap">
            <ProgramHeader title={t("nav.processing_map")} accent="emerald" />
            <ProgramHero variant="pmap" />
            <TabStrip
                tabs={tabs.map(([key]) => t(key as any))}
                active={activeTab}
                onChange={setActiveTab}
                accent="emerald"
            />
            <div className="px-6 lg:px-8 py-6">
                {tabs[activeTab][1]()}
            </div>
        </div>
    );
}
