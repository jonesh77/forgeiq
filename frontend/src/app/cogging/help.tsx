"use client";

import { InfoTriggerCustom } from "@/components/our/info";
import { Section, Steps, Tip } from "@/components/our/info-helpers";
import { PiCompassTool, PiCube } from "react-icons/pi";
import { TbChartArea } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { HiSparkles } from "react-icons/hi2";
import Link from "next/link";

export default function HelpHeader({ trigger }) {
  return (
    <InfoTriggerCustom
      trigger={trigger}
      title="ForgeIQ — User Guide"
      content={
        <>
          <Section title="What ForgeIQ does">
            ForgeIQ is an end-to-end workbench for forging-process design. It links three independent programs that together cover model training, processing-window analysis, and 3D preform prediction.
          </Section>

          <div className="grid grid-cols-3 gap-3 mt-1">
            <div className="border rounded-lg p-3">
              <PiCompassTool className="text-blue-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">Cogging Program</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>Train ENE predictor</li>
                <li>Correct training data</li>
                <li>Optimize 7-pass schedule</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <TbChartArea className="text-emerald-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">Processing Map</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>2D / 3D power-dissipation maps</li>
                <li>Instability detection (Prasad)</li>
                <li>Simufact / DEFORM particle overlay</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <PiCube className="text-violet-600 text-2xl" />
              <h4 className="font-semibold text-slate-900 mt-2 text-sm">3D Preform</h4>
              <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc list-inside">
                <li>U-Net voxel prediction</li>
                <li>Marching cubes → STL</li>
                <li>Taubin smoothing</li>
              </ul>
            </div>
          </div>

          <Section title="Typical workflow">
            <Steps items={[
              "Open Cogging → Train Model and upload your cogging dataset (.xlsx).",
              "Optionally improve the dataset via Train Data Correction (set Target ASTM).",
              "Download the trained model.h5.",
              "Open Pass Schedule → upload the model and the same dataset, set workpiece dimensions, get the optimal schedule.",
              "Switch to Processing Map → upload raw stress–strain data and explore the dissipation/instability fields.",
              "If you do closed-die forging, open 3D Preform → upload the U-Net + bbox + DEFORM data to get the STL preform.",
            ]} />
          </Section>

          <Section title="Built-in helpers">
            <ul className="list-disc list-inside space-y-0.5 ml-2 text-sm">
              <li><strong>Try with sample</strong> — every form has a yellow button that runs with bundled example data. Click first if unsure.</li>
              <li><strong>Download sample</strong> — grab the bundled file to learn the expected format.</li>
              <li><strong>Bookmarks</strong> — save frequently-used parameter sets per form.</li>
              <li><strong>History</strong> — all your runs are saved (user menu → History). Use Compare to spot differences between two runs.</li>
              <li><strong>PDF export</strong> — Pass Schedule results can be exported as a one-page PDF.</li>
              <li><strong>Language</strong> — switch between English, O'zbekcha, and 한국어 in the top bar.</li>
            </ul>
          </Section>

          <Tip>The "?" icon next to every parameter shows what it does and gives a typical value range. Hover or tap it.</Tip>

          <Section title="Need help?">
            Click <strong>Leave message</strong> in the top bar to chat with the team — replies appear in real time inside <strong>Messages</strong> (user menu).
          </Section>

          <div className="pt-2 border-t border-slate-200 mt-2">
            <Link href="/">
              <Button type="button" variant="outline" className="cursor-pointer w-full">
                <HiSparkles className="text-amber-500" />Open the full intro page
              </Button>
            </Link>
          </div>
        </>
      }
    />
  );
}
