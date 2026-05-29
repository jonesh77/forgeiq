import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="Processing Map — Main Graph"
      content={
        <>
          <Section title="Purpose">
            Plots <strong>power-dissipation</strong> and <strong>instability</strong> fields over the temperature × strain-rate domain, optionally overlaying <strong>Simufact</strong> or <strong>DEFORM</strong> particle trajectories. Helps locate safe hot-working windows for your alloy.
          </Section>

          <FileSpec
            name="Raw stress–strain data (.xlsx)"
            columns={["strain1…strain16", "stress1…stress16"]}
            note="16 strain/stress column pairs covering 4 temperatures × 4 strain rates (900/1000/1100/1200 °C × 0.01/0.1/1/10 s⁻¹)."
          />

          <Section title="Plot types">
            <div className="space-y-2 mt-1">
              <ParamRow name="2D" desc="2D contour map at a single strain. Dissipation contours + grey-shaded instability region." />
              <ParamRow name="instability" desc="3D surface stack — flat planes coloured red where the Prasad criterion ξ ≤ 0 (unsafe)." />
              <ParamRow name="dissipation" desc="3D surface stack — flat planes coloured by power dissipation η ∈ [0.3, 0.5]." />
            </div>
          </Section>

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Steps" range="0.05–0.5" desc="For 3D plots: strain step between stacked planes (smaller = denser). For 2D: the single strain value to plot." />
              <ParamRow name="Simufact / DEFORM" desc="Optional — overlay particle trajectories from a separate simulation. Requires t, s, sr files (CSV for Simufact, .dat for DEFORM)." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload your processing-map Excel (or click Try with sample).",
              "Choose Plot Type (start with 2D to get familiar).",
              "Enter Steps (try 0.5 for 2D, 0.1 for 3D).",
              "Optionally tick Simufact / DEFORM and upload their files.",
              "Click Generate graph — interactive Plotly chart appears on the right.",
            ]} />
          </Section>

          <Tip>Grey regions in 2D plots = flow-instability zones. Avoid these temperature/strain-rate combinations during processing.</Tip>
        </>
      }
    />
  );
}
