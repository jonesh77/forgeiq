import { InfoIcon } from "@/components/our/info";
import { FileSpec, Section, Steps, ParamRow, Tip } from "@/components/our/info-helpers";
import Image from "next/image";
import feed from "../../../../public/feed.png";
import depth from "../../../../public/Depth schedule.png";
import rotation from "../../../../public/Number of rotation.png";

export default function Info() {
  return (
    <InfoIcon
      title="Pass Schedule — How it works"
      content={
        <>
          <Section title="Purpose">
            Uses your trained model + cogging dataset to compute the <strong>optimal 7-pass schedule</strong> that minimises ENE under the workpiece-size constraint. Returns recommended feed, depth schedule, rotations, per-pass reductions, forging ratios, length changes, cutting plan, and void closure.
          </Section>

          <Section title="Required files">
            <div className="space-y-2 mt-1">
              <FileSpec
                name="Trained model (.h5)"
                note="Get this from the Train Model tab. Must be a full Keras model (not just weights)."
              />
              <FileSpec
                name="Cogging dataset (.xlsx)"
                columns={["Feed", "Depth Schedule", "Number of Rotation", "Pass1…Pass7", "ENE"]}
                note="Same dataset used to train the model — needed to re-fit the scaler and feature selector."
              />
            </div>
          </Section>

          <Section title="Parameters">
            <div className="space-y-2 mt-1">
              <ParamRow name="Initial Cross Section (mm)" range="typical 80–150" desc="Diameter (round) or side length (square) of the workpiece before forging." />
              <ParamRow name="Initial Length (mm)" range="typical 1000–2000" desc="Workpiece length before forging." />
              <ParamRow name="Cutting Length (mm)" range="typical 600–1000" desc="Maximum length per cut piece. If the forged length exceeds this, the program splits the workpiece into 2/4/8/… pieces." />
            </div>
          </Section>

          <Section title="How to use">
            <Steps items={[
              "Upload the trained .h5 model (or use sample).",
              "Upload the same cogging Excel used during training.",
              "Enter Initial Cross Section, Initial Length, and Cutting Length in mm.",
              "Click Compute passes — runs the trust-region optimizer (~3–10 seconds).",
              "Inspect the result table and Export PDF if needed.",
            ]} />
          </Section>

          <Section title="Output explained">
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="text-center">
                <Image src={feed} alt="Feed" className="rounded-md border" />
                <p className="text-xs mt-1 text-slate-600"><strong>Feed</strong> — bite size per pass</p>
              </div>
              <div className="text-center">
                <Image src={depth} alt="Depth" className="rounded-md border" />
                <p className="text-xs mt-1 text-slate-600"><strong>Depth</strong> — reduction depth</p>
              </div>
              <div className="text-center">
                <Image src={rotation} alt="Rotation" className="rounded-md border" />
                <p className="text-xs mt-1 text-slate-600"><strong>Rotations</strong> — turns between passes</p>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-0.5 mt-3 text-xs">
              <li><strong>Pass Schedule</strong> — per-pass thickness reduction ratio</li>
              <li><strong>Forging Ratio</strong> — N×N section after each pass</li>
              <li><strong>Length Change</strong> — workpiece length after each pass</li>
              <li><strong>Cutting Length</strong> — "{`{len}`} ({`{qty}`})" — pieces after splitting</li>
              <li><strong>Void Closure</strong> — % defect closure (target: ≥ 95%)</li>
            </ul>
          </Section>

          <Tip>Use Bookmarks to save standard product dimensions (e.g. "Bar 110×1500") and reload them with one click.</Tip>
        </>
      }
    />
  );
}
