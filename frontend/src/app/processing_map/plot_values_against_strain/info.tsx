import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="Plot values against strain"
      content={
        <>
          <Section title="Purpose">
            Tracks how <strong>power dissipation</strong> or <strong>flow instability</strong> evolves with strain, fixing either the temperature or the log-strain-rate. Useful for picking the best deformation window in a single chart.
          </Section>

          <FileSpec
            name="Raw stress–strain data (.xlsx)"
            columns={["strain1…strain16", "stress1…stress16"]}
            note="Same format as Main Graph — 16 strain/stress column pairs."
          />

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Steps" range="0.05–0.5" desc="Strain increment used to sample the curve." />
              <ParamRow name="Plot By" desc="Hold one axis constant. 'temperature' sweeps strain rates at a fixed °C. 'LOG10SR' sweeps temperatures at a fixed log strain rate." />
              <ParamRow name="Value Type" desc="'instability' = Prasad ξ criterion. 'dissipation' = power dissipation efficiency η." />
              <ParamRow name="Value" desc="The fixed temperature (900/1000/1100/1200) or strain rate (0.01/0.1/1/10) depending on Plot By." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload the raw .xlsx (or use sample).",
              "Set Steps = 0.1 for a smooth curve.",
              "Pick Plot By = temperature, Value Type = instability, Value = 1200.",
              "Click Generate graph — interactive line chart appears.",
              "Hover the curve for exact values at each strain.",
            ]} />
          </Section>

          <Tip>For instability plots, the horizontal line at y=0 marks the safe/unsafe boundary. Curves staying above 0 indicate a stable regime.</Tip>
        </>
      }
    />
  );
}
