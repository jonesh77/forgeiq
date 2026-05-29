"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";
import { useUser } from "@/lib/user";
import { NsmLogo } from "@/components/our/nsm-logo";
import { LangSwitcher } from "@/components/our/lang-switcher";
import { logout } from "./auth/lib/actions";
import { toggleAiAssistant } from "@/components/our/ai-assistant";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PiCompassTool, PiCube, PiBrain, PiLightning, PiGlobeStand, PiBookOpenText, PiBookmarkSimple, PiClockCounterClockwise, PiFlask, PiArrowsClockwise } from "react-icons/pi";
import { TbChartArea, TbAtom2 } from "react-icons/tb";
import { HiSparkles } from "react-icons/hi2";
import { LuArrowRight, LuMessagesSquare, LuPlay } from "react-icons/lu";
import { FaGithub } from "react-icons/fa6";

export default function LandingPage() {
  const user = useUser();

  return (
    <div className="font-public min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* TOP BAR */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center leading-tight">
            <div className="text-xl font-bold text-slate-900 tracking-tight font-montserrat">
              Forge<span className="text-indigo-600">IQ</span>
            </div>
            <div className="hidden md:block text-[10px] text-slate-500 ml-2 mt-1">by NSMLab</div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#programs" className="hidden md:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">Programs</a>
            <a href="#capabilities" className="hidden md:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">Capabilities</a>
            <a href="#team" className="hidden md:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">Team</a>
            <LangSwitcher />
            <button onClick={toggleAiAssistant} className="hidden md:flex items-center gap-1.5 cursor-pointer px-3 h-9 rounded-md text-sm font-medium bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 border border-indigo-200/60">
              <HiSparkles className="text-amber-500" />Ask AI
            </button>
            {user?.isSignedIn ? (
              <UserMenu name={user.name} email={user.email} />
            ) : (
              <Link href="/auth/login" className="inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white">
                Sign in <LuArrowRight />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative isolate min-h-[100vh] flex items-center pt-24 pb-16 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden">
        {/* Background grid + blobs */}
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl animate-drift"></div>
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-3xl animate-drift" style={{ animationDelay: "4s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/10 blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <div className="text-center max-w-4xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-indigo-200 mb-6">
              <HiSparkles className="text-amber-400" />
              Built at NSMLab · Sogang University
            </div>
            <div className="mb-4 inline-block text-xs uppercase tracking-[0.3em] text-indigo-200/70">
              ForgeIQ <span className="text-indigo-300/50">·</span> by NSMLab
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-montserrat leading-[1.05]">
              The forging<br />
              <span className="text-shimmer">workbench</span><br />
              <span className="text-slate-300">re-imagined.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Three intelligent programs in one workbench — predict cogging energy,
              map processing windows, and generate optimal 3D preforms in minutes
              instead of weeks. <strong className="text-white">No data required to get started.</strong>
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href="#programs" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-all hover:scale-105">
                Explore programs <LuArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <button onClick={toggleAiAssistant} className="cursor-pointer inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-sm transition-all">
                <HiSparkles className="text-amber-400" />Ask the AI assistant
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <Stat value="3" label="Programs" />
              <Stat value="< 1 min" label="Time to first result" />
              <Stat value="218 MB" label="Built-in U-Net model" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-24 px-6 lg:px-10 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Why this exists</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900 leading-tight">
              Designing forging schedules<br />used to take <em className="text-indigo-600 not-italic">weeks</em>.
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Manual calculation of pass schedules, hand-built processing maps, and trial-and-error preform design
              consume thousands of engineer-hours every year. This platform compresses the loop into seconds.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<PiBrain className="text-2xl" />}
              title="ML-driven"
              text="Pre-trained neural networks predict process outputs (ENE, preform geometry) from your design parameters. No fitting required."
            />
            <BenefitCard
              icon={<PiLightning className="text-2xl" />}
              title="Quick mode"
              text="Don't have your own dataset? Every program runs with built-in reference data — enter parameters, get results."
            />
            <BenefitCard
              icon={<PiFlask className="text-2xl" />}
              title="Lab-grade physics"
              text="Backed by validated models from the Net Shape Manufacturing Lab — published methods, real-world validated."
            />
          </div>
        </div>
      </section>

      {/* PROGRAMS — the 3 main service cards */}
      <section id="programs" className="py-24 px-6 lg:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Three programs · one workbench</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              Pick your tool, run in seconds
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Each program is a self-contained workflow. Try one with sample data, or upload your own.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ProgramCard
              href="/cogging"
              accent="blue"
              order="01"
              icon={<PiCompassTool />}
              title="Cogging Program"
              tag="Process predictor"
              desc="Train an ENE predictor on your cogging data, correct training rows toward a target grain size, and compute the optimal 7-pass schedule."
              features={["7-pass optimizer", "Void closure %", "PDF export"]}
            />
            <ProgramCard
              href="/processing_map"
              accent="emerald"
              order="02"
              icon={<TbChartArea />}
              title="Processing Map"
              tag="Hot-working window"
              desc="2D and 3D power-dissipation and instability surfaces for any stress-strain dataset. Overlay Simufact / DEFORM particle trajectories."
              features={["2D / 3D plots", "Prasad instability", "FEM overlays"]}
            />
            <ProgramCard
              href="/3d_preform"
              accent="violet"
              order="03"
              icon={<PiCube />}
              title="3D Preform"
              tag="Voxel → STL"
              desc="A U-Net predicts the optimal pre-forging geometry from your DEFORM input. Marching cubes + Taubin smoothing → printable STL."
              features={["U-Net inference", "Smoothed mesh", "Volume report"]}
            />
          </div>
        </div>
      </section>

      {/* AUTO PIPELINE — featured block */}
      <section className="py-24 px-6 lg:px-10 bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-50 border-y border-slate-200 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-300/30 blur-3xl animate-drift"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-300/30 blur-3xl animate-drift" style={{ animationDelay: "5s" }}></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-4">
                <HiSparkles className="text-amber-500" />New · Auto Pipeline
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900 leading-[1.05]">
                Define your target.<br />
                <span className="text-indigo-600">Press play.</span><br />
                <span className="text-slate-500">Get a full design pass.</span>
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                Instead of running each program separately, the <strong>Auto Pipeline</strong> chains
                training-data correction, pass-schedule optimisation, and 3D-preform generation in one
                run — surfacing a single result page you can iterate on like a feedback loop.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <PipelineStep n="1" title="Workpiece" desc="You enter the cross-section, length and cut limit." />
                <PipelineStep n="2" title="Target" desc="You set the grain-size goal and weight." />
                <PipelineStep n="3" title="Auto-run" desc="Correction → Pass Schedule → 3D Preform (sequential)." />
                <PipelineStep n="4" title="Evaluate" desc="Aggregated KPIs: void closure %, passes, preform Δvolume." />
                <PipelineStep n="5" title="Iterate" desc="Tweak dimensions or target, re-run; previous iterations stay in the table." />
              </ul>

              <div className="mt-8">
                <Link href="/workflow" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all hover:scale-105">
                  <LuPlay />Open the pipeline <LuArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Pipeline visual */}
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-500/10 p-6 flex flex-col gap-3 overflow-hidden">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>pipeline.log</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </span>
                </div>
                <FakeLog when="13:24:01" status="done" color="emerald" text="Correct training data" detail="BQI recomputed → ASTM=6 · 12 KB" />
                <FakeLog when="13:24:03" status="done" color="emerald" text="Compute pass schedule" detail="7 passes · min void closure 96.1%" />
                <FakeLog when="13:24:08" status="done" color="emerald" text="Generate 3D preform" detail="STL ready · Δvolume −1.03%" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Kpi v="96.1%" l="void min" />
                  <Kpi v="7" l="passes" />
                  <Kpi v="✓" l="target" emerald />
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Iteration #1 · 7.4 s total</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1"><PiArrowsClockwise />Re-run with new target</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="py-24 px-6 lg:px-10 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">What's inside</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-white">
              A workbench that respects<br />your time
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Feat icon={<HiSparkles />} title="Quick mode" text="Run any program with bundled reference data." />
            <Feat icon={<PiClockCounterClockwise />} title="History" text="Every run saved. Compare any two side-by-side." />
            <Feat icon={<PiBookmarkSimple />} title="Bookmarks" text="Save parameter sets and reapply with one click." />
            <Feat icon={<PiBookOpenText />} title="PDF export" text="One-page report for Pass Schedule results." />
            <Feat icon={<LuMessagesSquare />} title="Live support" text="Chat directly with the team — real-time replies." />
            <Feat icon={<PiBrain />} title="AI assistant" text="Quick answers about every feature, in-app." />
            <Feat icon={<PiGlobeStand />} title="Trilingual" text="English · O'zbekcha · 한국어 interface." />
            <Feat icon={<TbAtom2 />} title="Model caching" text="Heavy U-Net loaded once, reused across requests." />
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="py-24 px-6 lg:px-10 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Who built this</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              NSMLab · Sogang University
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The Net Shape Manufacturing Laboratory researches data-driven forging and forming processes.
              This workbench is the operational front-end for years of published research on cogging optimization,
              processing-map analysis, and preform prediction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <CreditCard
              role="Research lead"
              org="Net Shape Manufacturing Laboratory"
              note="Sogang University · Republic of Korea"
            />
            <CreditCard
              role="Engineering & deployment"
              org="Platform team"
              note="Full-stack web + ML infrastructure"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 lg:px-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-montserrat">
            Open a program. See a result.<br />
            <span className="text-indigo-200">It really is that fast.</span>
          </h2>
          <p className="mt-6 text-indigo-100 text-lg">
            Sample data is bundled with every program — there's nothing to download before your first run.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/cogging" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-all hover:scale-105">
              <PiCompassTool />Start with Cogging
            </Link>
            <Link href="/processing_map" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-medium text-sm">
              <TbChartArea />Processing Map
            </Link>
            <Link href="/3d_preform" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-medium text-sm">
              <PiCube />3D Preform
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 lg:px-10 bg-slate-950 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <NsmLogo variant="dark" />
            <div className="h-10 w-px bg-slate-700"></div>
            <div>
              <div className="text-white font-semibold text-sm font-montserrat">
                Forge<span className="text-indigo-400">IQ</span>
              </div>
              <div className="text-[11px] mt-0.5">© {new Date().getFullYear()} · Developed by <span className="text-indigo-300">Y. Alibek</span> · NSMLab · Sogang University</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="#programs" className="hover:text-white">Programs</a>
            <a href="#capabilities" className="hover:text-white">Capabilities</a>
            <a href="#team" className="hover:text-white">Team</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="ml-1 w-9 h-9 cursor-pointer rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-sm font-semibold hover:opacity-90">
          {(name && name.length > 0) ? name[0].toUpperCase() : "?"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-public mr-2 min-w-[200px]">
        {name && (
          <div className="px-2 py-2 border-b mb-1">
            <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
            {email && <div className="text-xs text-slate-500 truncate">{email}</div>}
          </div>
        )}
        <Link href="/history"><DropdownMenuItem className="cursor-pointer">History</DropdownMenuItem></Link>
        <Link href="/message"><DropdownMenuItem className="cursor-pointer">Messages</DropdownMenuItem></Link>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-700"
          onSelect={(e) => { e.preventDefault(); void logout(); }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold font-montserrat text-white">{value}</div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function BenefitCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

const PROGRAM_ACCENT = {
  blue: { bg: "from-blue-600 to-indigo-600", chip: "bg-blue-100 text-blue-800", glow: "shadow-blue-500/20" },
  emerald: { bg: "from-emerald-600 to-teal-600", chip: "bg-emerald-100 text-emerald-800", glow: "shadow-emerald-500/20" },
  violet: { bg: "from-violet-600 to-fuchsia-600", chip: "bg-violet-100 text-violet-800", glow: "shadow-violet-500/20" },
};

function ProgramCard({
  href, accent, order, icon, title, tag, desc, features,
}: {
  href: string; accent: keyof typeof PROGRAM_ACCENT; order: string;
  icon: React.ReactNode; title: string; tag: string; desc: string; features: string[];
}) {
  const a = PROGRAM_ACCENT[accent];
  return (
    <Link
      href={href}
      className={
        "group relative block rounded-2xl border border-slate-200 bg-white p-7 overflow-hidden " +
        "transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl " + a.glow
      }
    >
      <div className="absolute top-0 right-0 text-[140px] font-bold font-montserrat text-slate-100 leading-none -mr-4 -mt-6 select-none pointer-events-none">
        {order}
      </div>

      <div className={"relative w-12 h-12 rounded-xl bg-gradient-to-br " + a.bg + " text-white flex items-center justify-center text-xl"}>
        {icon}
      </div>

      <div className={"relative inline-block mt-5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider " + a.chip}>
        {tag}
      </div>
      <h3 className="relative mt-3 text-2xl font-bold tracking-tight text-slate-900 font-montserrat">{title}</h3>
      <p className="relative mt-3 text-sm text-slate-600 leading-relaxed">{desc}</p>

      <div className="relative mt-5 flex flex-wrap gap-1.5">
        {features.map((f) => (
          <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{f}</span>
        ))}
      </div>

      <div className={"relative mt-7 inline-flex items-center gap-2 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r " + a.bg + " group-hover:gap-3 transition-all"}>
        Open program <LuArrowRight className="text-slate-700 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function Feat({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-200 flex items-center justify-center text-lg">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}

function PipelineStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center">{n}</div>
      <div>
        <span className="font-semibold text-slate-900">{title}</span>
        <span className="text-slate-600"> — {desc}</span>
      </div>
    </li>
  );
}

function FakeLog({ when, status, color, text, detail }: { when: string; status: string; color: string; text: string; detail: string }) {
  return (
    <div className="text-[11px] font-mono leading-snug">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">[{when}]</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-${color}-100 text-${color}-700`}>{status}</span>
        <span className="text-slate-700">{text}</span>
      </div>
      <div className="text-slate-500 ml-12 mt-0.5">{detail}</div>
    </div>
  );
}

function Kpi({ v, l, emerald }: { v: string; l: string; emerald?: boolean }) {
  return (
    <div className={"rounded-lg border p-2 text-center " + (emerald ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
      <div className={"text-base font-bold font-montserrat " + (emerald ? "text-emerald-700" : "text-slate-900")}>{v}</div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{l}</div>
    </div>
  );
}

function CreditCard({ role, org, note }: { role: string; org: string; note: string }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{role}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{org}</h3>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
    </div>
  );
}
