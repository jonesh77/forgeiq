import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, Tip } from "@/components/our/info-helpers";

export default function Info() {
  return (
    <InfoIcon
      title="3D Preform — How it works"
      content={
        <>
          <Section title="Purpose">
            Predicts the optimal <strong>preform geometry</strong> for closed-die forging using a 3D U-Net neural network. The pipeline converts FEM node/element data into a 128³ voxel grid, runs the U-Net, applies <strong>marching cubes</strong> + <strong>Taubin smoothing</strong>, and returns a printable STL mesh.
          </Section>

          <Section title="Required files">
            <div className="space-y-2 mt-1">
              <FileSpec
                name="U-Net model (.h5)"
                note="Pre-trained 3D U-Net weights (~200 MB). Use the bundled sample model or supply your own."
              />
              <FileSpec
                name="Bounding-box CSV"
                columns={["Axis", "Min Coord", "Max Coord", "Shift Value"]}
                note="One row per axis (X / Y / Z) defining the volume the model expects."
              />
              <FileSpec
                name="Additional Target Element (.dat)"
                note="DEFORM-format element connectivity table (one element per line: ID + node IDs)."
              />
              <FileSpec
                name="Additional Target Node (.dat)"
                note="DEFORM-format node coordinates (one node per line: ID + X Y Z)."
              />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload all four files (or click Try with sample for instant results).",
              "Click Generate model — first call ~15–30s (loads 218 MB model), subsequent calls are cached and run in ~5s.",
              "Interact with the STL viewer on the right (rotate, zoom, pan).",
              "Volume change ratio shown below tells you how much material was added/removed vs. the input mesh.",
            ]} />
          </Section>

          <Section title="What you get">
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li><strong>STL mesh</strong> — smoothed via Taubin filter (50 iterations)</li>
              <li><strong>Final volume</strong> — mm³</li>
              <li><strong>Volume change ratio</strong> — % change vs. raw voxel mesh</li>
            </ul>
          </Section>

          <Tip>The first sample run takes longer because the 218 MB U-Net model has to load into memory. Subsequent runs reuse the cached model.</Tip>
        </>
      }
    />
  );
}
