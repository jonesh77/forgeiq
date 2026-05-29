import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";
import Image from "next/image";
import bqi from "../../../../public/BQI1.png";

export default function Info() {
  return (
    <InfoIcon
      title="Train Data Correction — How it works"
      content={
        <>
          <Section title="Purpose">
            Improves the quality of your training dataset by recomputing each row's <strong>modified BQI</strong> (Bar Quality Index) so that the optimizer prefers configurations closer to a desired grain size. The output Excel can then be fed back into <em>Train Model</em>.
          </Section>

          <div className="bg-white border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500 mb-2">Formula applied to each row:</div>
            <Image src={bqi} alt="BQI formula" className="mx-auto" />
          </div>

          <FileSpec
            name="Cogging dataset (.xlsx)"
            columns={["Strain", "St.Dev", "ASTM", "ASTM.dev"]}
            note="These 4 columns must be present (they are consumed by the formula and then dropped from the output)."
          />

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Target ASTM" range="typical 5–8" desc="Desired ASTM grain-size number. Higher values mean a finer grain. The optimizer will push the dataset toward this target." />
              <ParamRow name="Weight Factor" range="typical 0.05–0.5" desc="Penalty multiplier on the (Target − Actual)² term. Larger values penalise rows far from the target more aggressively." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload your raw cogging dataset (or use the sample).",
              "Enter Target ASTM and Weight Factor.",
              "Click Generate — finishes in 1–2 seconds.",
              "Download the corrected Excel.",
              "Feed the corrected file back into Train Model for a better predictor.",
            ]} />
          </Section>

          <Tip>Save your favourite Target ASTM / Weight Factor combinations as a Bookmark to re-apply them quickly.</Tip>
        </>
      }
    />
  );
}
