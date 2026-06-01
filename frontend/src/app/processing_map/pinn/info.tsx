import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="PINN Surrogate — What is it and how it works"
      content={
        <>
          <Section title="What is PINN?">
            <strong>PINN</strong> stands for <strong>Physics-Informed Neural Network</strong>. It is a small machine-learning model that learns the material&apos;s flow-stress surface <em>σ(T, ε̇, ε)</em> from a handful of compression test curves and then derives the Prasad processing-map fields (η — power dissipation efficiency, ξ — instability) <em>analytically</em> via automatic differentiation.
            <p className="mt-2 text-xs text-slate-500 italic">
              In plain words: instead of plotting an experimental processing map from sparse measured points (which gives jagged contours), PINN fills in the gaps with physically-consistent predictions so you get a smooth, dense (T, ε̇) map and an exact safe-window optimum.
            </p>
          </Section>

          <Section title="When to use it (vs the classical map)">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Classical Prasad map</strong> — needs a dense 4×4 (or finer) grid of stress-strain experiments. Fast, well-understood, but limited by interpolation between experimental points.</li>
              <li><strong>PINN surrogate</strong> — works from the same 4×4 input, but trains a neural surrogate (~10–60 s) that gives smooth fields, an honest optimum, and lets you re-query any strain without re-running experiments.</li>
            </ul>
          </Section>

          <Section title="Required file">
            <FileSpec
              name="Stress-strain dataset (.xlsx)"
              columns={["strain1…strain16", "stress1…stress16"]}
              note="Same format as the classical Processing Map — 16 strain/stress pairs covering 4 temperatures × 4 strain rates."
            />
          </Section>

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Epochs" range="500–3000 (default 1000)" desc="How many training iterations. More = smoother surface but longer wait. 1000 is a sane default for one click; bump to 2000+ if the RMSE on the result panel looks too high." />
              <ParamRow name="Strain (ε)" range="0.1–1.2 (default 0.5)" desc="At which strain level to render the processing map. ε=0.5 is typical for hot working. You can re-query different strains without retraining — they share the same surrogate." />
              <ParamRow name="Grid resolution" range="20–80 (default 50)" desc="Output map size. 50×50 is enough to read off the safe-window. Higher values look smoother but are heavier on the browser." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload your .xlsx (or click \"Try with sample\" to test).",
              "Pick epochs / strain / grid resolution (defaults are fine for a first run).",
              "Click Train PINN — training takes ~10–60 seconds depending on epochs.",
              "Inspect the η, ξ, and m fields plus the auto-detected safe-window optimum (green star).",
              "Adjust strain or epochs if the RMSE looks high, then re-train.",
            ]} />
          </Section>

          <Section title="Output explained">
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
              <li><strong>η (eta)</strong> — power-dissipation efficiency. Higher = more energy spent on microstructure evolution (good).</li>
              <li><strong>ξ (xi)</strong> — instability parameter. ξ &lt; 0 marks unsafe zones (flow localisation, cracking). Aim for ξ &gt; 0 with high η.</li>
              <li><strong>m</strong> — strain-rate sensitivity exponent. Auxiliary field; helps interpret η.</li>
              <li><strong>RMSE log-σ</strong> — training fit error. Below ~0.05 is good; above ~0.15 means you need more epochs or cleaner data.</li>
              <li><strong>Optimal (T, ε̇)</strong> — green star marker. The (temperature, log strain-rate) point with the best η under ξ&gt;0 constraint. Use this as your starting operating window.</li>
            </ul>
          </Section>

          <Tip>If RMSE is high after 1000 epochs, double the epochs (2000) — neural-network convergence on noisy stress data sometimes needs the extra iterations. If it&apos;s still high, your dataset may have inconsistent measurements.</Tip>
        </>
      }
    />
  );
}
