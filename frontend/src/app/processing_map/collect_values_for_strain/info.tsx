import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="Collect values for strain"
      content={
        <>
          <Section title="Purpose">
            Exports the complete <strong>power dissipation</strong> and <strong>flow instability</strong> tables across the temperature × strain-rate grid for every strain step, packed into a two-sheet Excel file. Use this for offline analysis, reporting, or comparison with other materials.
          </Section>

          <FileSpec
            name="Raw stress–strain data (.xlsx)"
            columns={["strain1…strain16", "stress1…stress16"]}
            note="Same format as Main Graph."
          />

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Steps" range="0.05–0.5" desc="Strain increment between rows. Smaller = more rows, longer to compute." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload the raw .xlsx (or use sample).",
              "Enter Steps (try 0.1 for ~10 rows).",
              "Click Generate — runs in 2–10 seconds.",
              "Download the .xlsx and open it in Excel/LibreOffice.",
            ]} />
          </Section>

          <Section title="Output structure">
            Two sheets, each with strain as the row index and 16 columns named like <code className="text-xs bg-slate-100 px-1 rounded">1200-1.0</code> (temperature-LogStrainRate):
            <ul className="list-disc list-inside mt-1 ml-2 text-xs">
              <li><strong>Instability</strong> — Prasad criterion ξ values</li>
              <li><strong>Dissipation</strong> — power dissipation efficiency η</li>
            </ul>
          </Section>

          <Tip>Use this when you need raw numbers for an external pipeline. For visual exploration, use Main Graph or Plot Values Against Strain instead.</Tip>
        </>
      }
    />
  );
}
