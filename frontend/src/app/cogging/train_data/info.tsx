import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, Tip } from "@/components/our/info-helpers";
import Image from "next/image";
import plot from "../../../../public/plot.png";

export default function Info() {
  return (
    <InfoIcon
      title="Train Model — How it works"
      content={
        <>
          <Section title="Purpose">
            Trains a neural-network surrogate model that predicts <strong>ENE (Equivalent Effective Energy)</strong> from cogging process parameters (feed, depth schedule, rotations, and the 7-pass schedule). The trained model is the input for the <em>Pass Schedule</em> optimizer.
          </Section>

          <FileSpec
            name="Cogging dataset (.xlsx)"
            columns={["Feed", "Depth Schedule", "Number of Rotation", "Pass1", "Pass2", "Pass3", "Pass4", "Pass5", "Pass6", "Pass7", "ENE"]}
            note="The first 11 columns are read as features → target. Each row = one measured cogging trial."
          />

          <Section title="How to use">
            <Steps items={[
              "Upload your cogging Excel (or click Try with sample).",
              "Click Generate — training runs for ~10–60 seconds depending on dataset size.",
              "Inspect the 4-panel plot: Actual vs Predicted, MAE curve, Residuals, Feature importance.",
              "Download the model.h5 — you will need it for Pass Schedule.",
            ]} />
          </Section>

          <Section title="What you get">
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>4-panel diagnostic plot</strong> — quality of the trained model</li>
              <li><strong>model.h5</strong> — Keras-format neural network (~10–30 KB)</li>
            </ul>
          </Section>

          <div className="mt-2">
            <div className="text-xs text-slate-500 mb-1">Example output:</div>
            <Image src={plot} alt="Example train model output" className="rounded-md border" />
          </div>

          <Tip>If predictions look noisy, add more training rows or reduce noise in the source measurements.</Tip>
        </>
      }
    />
  );
}
