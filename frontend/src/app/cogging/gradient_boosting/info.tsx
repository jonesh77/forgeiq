import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="Train Model (Gradient Boosting) — What is it and how it works"
      content={
        <>
          <Section title="What is Gradient Boosting?">
            <strong>Gradient Boosting</strong> is a tree-based machine-learning method that builds many small decision trees in sequence — each new tree corrects the errors of the previous ones. The result is a strong predictor that is often <em>more accurate than a neural network</em> on small tabular datasets like ours.
            <p className="mt-2 text-xs text-slate-500 italic">
              Under the hood we use <strong>XGBoost</strong> (the industry-standard gradient-boosting library); if it isn&apos;t installed on the server we automatically fall back to <code>sklearn</code>&apos;s HistGradientBoosting. Either way, you get an honest k-fold cross-validated RMSE / MAE / R² report — no train/test leakage.
            </p>
          </Section>

          <Section title="When to use it (vs the MLP / Train Model path)">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>MLP (Train Model)</strong> — a small neural network. Good when you have a lot of data and complex non-linear interactions. Slower to train, harder to interpret.</li>
              <li><strong>Gradient Boosting</strong> — faster to train (seconds vs minutes), naturally handles categorical and missing values, and is usually more accurate on small forging datasets (50–500 rows). Use this as your default unless you have a specific reason to use the MLP.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500 italic">
              Open the <strong>Model Comparison</strong> page to run both side-by-side on the same dataset and pick the winner.
            </p>
          </Section>

          <Section title="Required file">
            <FileSpec
              name="Cogging dataset (.xlsx)"
              columns={["Feed", "Depth Schedule", "Number of Rotation", "Pass1…Pass7", "ENE"]}
              note="Same format as Train Model. Each row is one experimental run with the inputs and the resulting ENE."
            />
          </Section>

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Cross-validation folds" range="3–10 (default 5)" desc="How many ways to split the data for honest accuracy estimation. 5 is the standard. Use 3 for very small datasets (faster, more variance) or 10 for a tighter estimate." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload your cogging Excel (or click \"Try with sample\" to test).",
              "Pick the number of CV folds (5 is fine for most cases).",
              "Click Train with Gradient Boosting — takes ~5–30 seconds.",
              "Inspect the 4-panel diagnostic image and the RMSE / MAE / R² metrics.",
              "Download the .pkl model bundle if you want to use it offline.",
            ]} />
          </Section>

          <Section title="Output explained">
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
              <li><strong>RMSE / MAE</strong> — average prediction error in the same units as ENE (lower is better).</li>
              <li><strong>R²</strong> — fraction of ENE variance explained by the model. 1.0 = perfect, 0.0 = no better than predicting the mean. Above ~0.85 is a usable model.</li>
              <li><strong>PI width / coverage (UQ)</strong> — average 80% prediction-interval width and how often the true value actually fell inside. Coverage close to 80% means the model knows when it&apos;s uncertain — useful for risk-aware optimisation.</li>
              <li><strong>4-panel diagnostic</strong> — actual-vs-predicted (with error bars), residuals, feature importance, and fold-by-fold RMSE.</li>
            </ul>
          </Section>

          <Tip>If your R² is low (&lt; 0.7) or RMSE is very high, the dataset may be too small or too noisy. Try collecting a few more experiments or removing outliers before re-training.</Tip>
        </>
      }
    />
  );
}
