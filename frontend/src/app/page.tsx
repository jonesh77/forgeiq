"use client";

import Link from "next/link";
import { useUser } from "@/lib/user";
import { LangSwitcher } from "@/components/our/lang-switcher";
import { useT } from "@/lib/i18n";
import { logout } from "./auth/lib/actions";
import { toggleAiAssistant } from "@/components/our/ai-assistant";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PiBrain, PiFlask, PiGitBranch } from "react-icons/pi";
import { HiSparkles } from "react-icons/hi2";
import { LuArrowRight, LuLifeBuoy, LuLinkedin, LuGraduationCap } from "react-icons/lu";
import { FaGithub } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { useInView } from "@/lib/use-in-view";

/**
 * Robotis-style ecosystem landing page — main site landing.
 * Promoted from /robotis on 2026-06-19.
 */
export default function LandingPage() {
  const user = useUser();
  const { t } = useT();

  // Hero photo slideshow (3 photos cross-fade every 6s)
  const HERO_PHOTOS = [
    "https://images.unsplash.com/photo-1571590946238-a0ba990d12a9?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1572277603731-6941cdb65597?auto=format&fit=crop&w=1600&q=80",
    "/redesign-v3/assets/bg-forge.jpg",
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_PHOTOS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-public min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* TOP BAR — dark, lang + support */}
      <div className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-9 flex items-center justify-end gap-5 text-xs">
          <a href="#footer" className="text-white/60 hover:text-white inline-flex items-center gap-1.5">
            <LuLifeBuoy /> {t("home.nav.try_demo")}
          </a>
          <LangSwitcher />
        </div>
      </div>

      {/* NAV — sticky, dark navy bg (so the indigo-gradient F emblem keeps its
          original colours, and the bar reads as one piece with the top utility strip) */}
      <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[76px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Original gradient emblem (indigo→violet F + accent dot) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded-lg" />
            <span className="text-2xl font-extrabold font-montserrat tracking-tight">
              Forge<span className="text-indigo-400">IQ</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <a href="#programs" className="hidden md:inline-flex font-semibold text-[13.5px] tracking-wider uppercase text-white/70 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/5">{t("home.nav.programs")}</a>
            <a href="#ecosystem" className="hidden md:inline-flex font-semibold text-[13.5px] tracking-wider uppercase text-white/70 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/5">Ecosystem</a>
            <a href="#pipeline" className="hidden lg:inline-flex font-semibold text-[13.5px] tracking-wider uppercase text-white/70 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/5">Pipeline</a>
            <a href="#footer" className="hidden lg:inline-flex font-semibold text-[13.5px] tracking-wider uppercase text-white/70 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/5">{t("home.nav.team")}</a>
            <button onClick={toggleAiAssistant} className="hidden md:inline-flex items-center gap-1.5 cursor-pointer px-3 h-9 rounded-md text-sm font-medium bg-white/10 hover:bg-white/15 text-indigo-200 border border-white/15">
              <HiSparkles className="text-amber-400" />{t("home.nav.ask_ai")}
            </button>
            {user?.isSignedIn ? (
              <UserMenu name={user.name} email={user.email} />
            ) : (
              <Link href="/auth/login" className="ml-1 inline-flex items-center gap-2 h-[42px] px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13.5px] font-semibold tracking-wider uppercase transition-all hover:-translate-y-px">
                {t("home.nav.sign_in")} <LuArrowRight />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative bg-slate-950 text-white overflow-hidden">
        {/* Photo slideshow */}
        <div className="absolute inset-0 z-0">
          {HERO_PHOTOS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              referrerPolicy="no-referrer"
              className={
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] " +
                (i === slide ? "opacity-40" : "opacity-0")
              }
              style={{ filter: "grayscale(0.15) contrast(1.04)", animation: "kenburns 24s ease-in-out infinite alternate" }}
            />
          ))}
          {/* Drifting glows */}
          <div className="absolute -top-44 -left-28 w-[620px] h-[620px] rounded-full bg-indigo-600/30 blur-[100px] animate-drift" />
          <div className="absolute -bottom-52 -right-24 w-[560px] h-[560px] rounded-full bg-violet-600/20 blur-[100px] animate-drift" style={{ animationDelay: "6s" }} />
          {/* Diagonal text overlay */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-slate-950 from-34% via-slate-950/60 via-70% to-slate-950/35" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-32 lg:py-40 max-w-3xl">
          <div className="font-semibold text-sm tracking-[0.18em] uppercase text-indigo-400">
            AI Metallurgy Ecosystem · <span className="text-indigo-300">NSMLab</span>
          </div>
          <h1 className="font-montserrat font-extrabold tracking-tight leading-[1.02] mt-6 mb-8 text-5xl md:text-6xl lg:text-[6rem]">
            {t("home.hero.title1")}<br />
            <span className="text-white/50">{t("home.hero.title2")}</span>
          </h1>
          <p className="max-w-2xl text-lg lg:text-[19px] leading-relaxed text-white/70">
            <strong className="text-white font-semibold">ForgeIQ — DYNAMIXEL of metallurgy.</strong> {t("home.hero.desc")}
          </p>
          <div className="flex flex-wrap gap-3.5 mt-10">
            <Link href="/workflow" className="inline-flex items-center gap-2.5 h-14 px-7 rounded-lg bg-white text-slate-900 font-bold text-[15px] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(255,255,255,0.35)] transition-all">
              {t("home.hero.cta_primary")} <LuArrowRight />
            </Link>
            <a href="#programs" className="inline-flex items-center gap-2.5 h-14 px-6 rounded-lg border border-white/25 text-white font-semibold text-[15px] hover:bg-white/8 hover:border-white/50 transition-all">
              Explore programs
            </a>
          </div>
        </div>

        {/* Stat strip — 4 metrics */}
        <div className="relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4">
            <Stat v="≤60" unit="s" l={t("home.hero.stat1_l")} />
            <Stat v="96.1" unit="%" l={t("home.hero.stat2_l")} />
            <Stat v="4" l={t("home.hero.stat3_l")} />
            <Stat v="−14" unit="d" l="Cut per iteration" />
          </div>
        </div>
      </header>

      {/* INTRO — big single statement */}
      <section className="py-24 text-center border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="font-montserrat font-bold text-2xl md:text-4xl lg:text-[2.8rem] leading-tight tracking-tight max-w-4xl mx-auto">
            <strong className="text-indigo-600">ForgeIQ</strong> is the answer you&apos;ve been looking for. Designed with a deep understanding of the precision and process data demanded by modern forging — for engineers who refuse to wait weeks per iteration.
          </p>
        </div>
      </section>

      {/* PROGRAMS — 4 alternating series */}
      <div id="programs">
        <ProgramSeries
          num="01"
          accent="blue"
          tag="Cogging"
          title={t("home.programs.cog.title")}
          subtitle="Void closure, predicted per pass."
          desc="MLP and gradient-boosting surrogates estimate final void volume from grain size, weight factor and your per-pass schedule — then check every pass against your press, in seconds."
          specs={[{ v: "<3s", l: "Per prediction" }, { v: "±1.4%", l: "Mean error" }]}
          href="/cogging"
          openLabel={t("home.programs.open")}
          viz={<CoggingViz />}
          figLabel="FIG.01 · void closure"
        />
        <ProgramSeries
          flip
          num="02"
          accent="emerald"
          tag="Processing Map"
          title={t("home.programs.pmap.title")}
          subtitle="Find the safe forging window."
          desc="Prasad-criterion power-dissipation (η) and instability (ξ) heatmaps over temperature and strain rate. The PINN surrogate reveals exactly where the material flows safely."
          specs={[{ v: "0.42", l: "Peak η" }, { v: "PINN", l: "Surrogate" }]}
          href="/processing_map"
          openLabel={t("home.programs.open")}
          viz={<PmapViz />}
          figLabel="FIG.02 · η / ξ map"
        />
        <ProgramSeries
          num="03"
          accent="violet"
          tag="3D Preform"
          title={t("home.programs.pre.title")}
          subtitle="From voxels to a graded STL."
          desc="An attention U-Net turns a target shape into a watertight preform mesh — returning a manufacturability grade from A to D based on genus, wall thickness and bounding box."
          specs={[{ v: "A", l: "Grade" }, { v: "48k", l: "Faces" }]}
          href="/3d_preform"
          openLabel={t("home.programs.open")}
          viz={<PreformViz />}
          figLabel="FIG.03 · preform mesh"
        />
        <ProgramSeries
          flip
          num="04"
          accent="indigo"
          tag="Auto Pipeline"
          title={t("home.pipeline.badge")}
          subtitle="One click, a finished preform."
          desc="Chain all four surrogates into a single target-driven closed loop — re-running toward your spec until the preform grades out, with full iteration history."
          specs={[{ v: "~8s", l: "Full loop" }, { v: "4", l: "Stages" }]}
          href="/workflow"
          openLabel={t("home.pipeline.cta")}
          viz={<PipelineViz />}
          figLabel="FIG.04 · pipeline"
        />
      </div>

      {/* ECOSYSTEM */}
      <section id="ecosystem" className="py-24 text-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col items-center">
            <span className="font-bold text-[13px] tracking-[0.16em] uppercase text-indigo-600">The Ecosystem</span>
            <h2 className="font-montserrat font-extrabold text-3xl md:text-5xl mt-4 tracking-tight">Built for engineers, by a lab.</h2>
            <p className="text-lg text-slate-600 mt-5 max-w-2xl leading-relaxed">{t("home.why.desc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-14 text-left">
            <EcoCard
              gradient="from-indigo-600 to-violet-600"
              icon={<PiBrain />}
              title={t("home.why.b1_title")}
              text={t("home.why.b1_text")}
            />
            <EcoCard
              gradient="from-blue-600 to-indigo-600"
              icon={<PiGitBranch />}
              title={t("home.why.b2_title")}
              text={t("home.why.b2_text")}
            />
            <EcoCard
              gradient="from-emerald-600 to-teal-600"
              icon={<PiFlask />}
              title={t("home.why.b3_title")}
              text={t("home.why.b3_text")}
            />
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section id="pipeline" className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute -top-40 -left-20 w-[520px] h-[520px] rounded-full bg-indigo-500/40 blur-[90px]" />
        <div className="absolute -bottom-52 -right-16 w-[520px] h-[520px] rounded-full bg-violet-600/32 blur-[90px]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-28 text-center">
          <h2 className="font-montserrat font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight">
            {t("home.cta.title1")} <span className="text-indigo-300">{t("home.cta.title2")}</span>
          </h2>
          <p className="text-lg text-white/70 mt-6 mb-9">{t("home.cta.desc")}</p>
          <div className="flex flex-wrap gap-3.5 justify-center">
            <Link href="/workflow" className="inline-flex items-center gap-2.5 h-14 px-7 rounded-lg bg-white text-slate-900 font-bold text-[15px] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(255,255,255,0.35)] transition-all">
              {t("home.hero.cta_primary")} <LuArrowRight />
            </Link>
            <a href="#footer" className="inline-flex items-center gap-2.5 h-14 px-6 rounded-lg border border-white/25 text-white font-semibold text-[15px] hover:bg-white/8 transition-all">
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" className="bg-slate-900 text-white/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 py-16 border-b border-white/10">
            <div>
              <Link href="/" className="text-white text-[22px] font-extrabold font-montserrat">
                Forge<span className="text-indigo-400">IQ</span>
              </Link>
              <p className="text-[13.5px] leading-relaxed mt-4 max-w-xs">
                AI Metallurgy Simulation Platform. A closed-loop, AI-driven process-design workbench for hot-forging and cogging — built by Y. Alibek with research support from NSMLab, Sogang University.
              </p>
              <div className="flex items-center gap-2.5 mt-5">
                {/* ForgeIQ emblem — original indigo→violet gradient mark (icon.svg) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="ForgeIQ" className="h-12 w-12 block" />
                {/* NSMLab supporting lab lockup — kept in white pill since the source PNG has white background */}
                <span className="inline-flex bg-white rounded-lg p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/redesign-v3/assets/nsmlab-logo.png" alt="NSMLAB" className="h-7 block" />
                </span>
              </div>
            </div>
            <FootCol heading={t("home.nav.programs")} links={[
              ["/cogging", t("home.programs.cog.title")],
              ["/processing_map", t("home.programs.pmap.title")],
              ["/3d_preform", t("home.programs.pre.title")],
              ["/workflow", t("home.pipeline.badge")],
            ]} />
            <FootCol heading="Resources" links={[
              ["#", "Documentation"],
              ["#", t("home.nav.capabilities")],
              ["#", "Changelog"],
              ["https://github.com/jonesh77/forgeiq", "GitHub"],
            ]} />
            <div>
              <h5 className="text-white font-bold text-xs tracking-[0.12em] uppercase mb-4">Lab</h5>
              <a href="https://sites.google.com/u.sogang.ac.kr/nsmlab" target="_blank" rel="noopener noreferrer" className="block text-sm py-1.5 hover:text-white">About NSMLab</a>
              <a href="https://www.mdpi.com/3939500" target="_blank" rel="noopener noreferrer" className="block text-sm py-1.5 hover:text-white">Research</a>
              <a href="mailto:alibek.yuldoshev96@gmail.com" className="block text-sm py-1.5 hover:text-white">Contact</a>
              <div className="flex gap-3 mt-5">
                <a href="https://github.com/jonesh77/forgeiq" target="_blank" rel="noopener noreferrer" title="GitHub" className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all"><FaGithub /></a>
                <a href="https://www.linkedin.com/in/alibek-yuldoshev-a980b5413" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all"><LuLinkedin /></a>
                <a href="https://sciprofiles.com/profile/Alibek-Yuldoshev" target="_blank" rel="noopener noreferrer" title="SciProfiles" className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all"><LuGraduationCap /></a>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-[12.5px]">
            <span>© {new Date().getFullYear()} ForgeIQ — Developed by Y. Alibek · Supported by NSMLab, Sogang University. All rights reserved.</span>
            <span className="flex gap-5">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Cookies</a>
              <Link href="/classic" className="hover:text-white">Classic version</Link>
            </span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes kenburns {
          from { transform: scale(1.06); }
          to { transform: scale(1.16) translate(-2%, -2%); }
        }
      `}</style>
    </div>
  );
}

/* ---------- helpers ---------- */

function Stat({ v, unit, l }: { v: string; unit?: string; l: string }) {
  return (
    <div className="py-6 border-r last:border-r-0 border-white/10">
      <div className="font-montserrat font-extrabold text-3xl text-white tracking-tight">
        {v}{unit && <span className="text-indigo-300">{unit}</span>}
      </div>
      <div className="text-[12.5px] text-white/55 mt-1.5">{l}</div>
    </div>
  );
}

const ACCENT_STYLE: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600" },
};

function ProgramSeries({
  num, accent, tag, subtitle, desc, specs, href, openLabel, viz, figLabel, flip,
}: {
  num: string; accent: keyof typeof ACCENT_STYLE; tag: string; title: string;
  subtitle: string; desc: string; specs: { v: string; l: string }[];
  href: string; openLabel: string; viz: React.ReactNode; figLabel: string; flip?: boolean;
}) {
  const a = ACCENT_STYLE[accent];
  // Two refs — text and visual reveal independently, sliding in from opposite
  // sides (text from text-side, visual from visual-side) with a soft pop-up.
  const [txtRef, txtSeen] = useInView<HTMLDivElement>(0.18);
  const [vizRef, vizSeen] = useInView<HTMLDivElement>(0.18);
  const txtFromLeft = !flip;
  const txtTransform = txtSeen ? "translate3d(0,0,0)" : `translate3d(${txtFromLeft ? "-80px" : "80px"}, 28px, 0)`;
  const vizTransform = vizSeen ? "translate3d(0,0,0)" : `translate3d(${txtFromLeft ? "80px" : "-80px"}, 28px, 0)`;
  const ease = "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s ease";
  return (
    <section className={"border-b border-slate-200 overflow-hidden " + (flip ? "bg-slate-50" : "bg-white")}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div
          ref={txtRef}
          className={flip ? "lg:order-2" : ""}
          style={{ transform: txtTransform, opacity: txtSeen ? 1 : 0, transition: ease, willChange: "transform, opacity" }}
        >
          <span className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase " + a.bg + " " + a.text}>
            {num} · {tag}
          </span>
          <h2 className="font-montserrat font-extrabold text-3xl md:text-5xl mt-5 mb-4 tracking-tight leading-tight">
            {subtitle.split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
          </h2>
          <p className="text-[17px] text-slate-600 leading-relaxed max-w-lg">{desc}</p>
          <div className="flex gap-8 my-7">
            {specs.map((s, i) => (
              <div key={i}>
                <div className={"font-montserrat font-extrabold text-2xl tracking-tight " + (i === 0 ? a.text : "text-slate-900")}>{s.v}</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
          <Link href={href} className="inline-flex items-center gap-3.5 font-bold text-base text-slate-900 hover:text-indigo-600 group">
            {openLabel}
            <span className={"w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 group-hover:translate-x-1 transition-all"}>
              <LuArrowRight />
            </span>
          </Link>
        </div>
        <div
          ref={vizRef}
          className={"relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[4/3] shadow-2xl shadow-slate-900/40 " + (flip ? "lg:order-1" : "")}
          style={{ transform: vizTransform, opacity: vizSeen ? 1 : 0, transition: ease, willChange: "transform, opacity" }}
        >
          <span className="absolute top-4 left-5 font-mono text-xs text-white bg-slate-950/60 px-2.5 py-1 rounded backdrop-blur-sm z-10">
            {figLabel}
          </span>
          {viz}
        </div>
      </div>
    </section>
  );
}

function EcoCard({ gradient, icon, title, text }: { gradient: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(10,13,20,0.3)] hover:border-indigo-200">
      <div className={"w-12 h-12 rounded-xl bg-gradient-to-br text-white text-xl flex items-center justify-center " + gradient}>
        {icon}
      </div>
      <h3 className="font-montserrat font-bold text-lg mt-5 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function FootCol({ heading, links }: { heading: string; links: [string, string][] }) {
  return (
    <div>
      <h5 className="text-white font-bold text-xs tracking-[0.12em] uppercase mb-4">{heading}</h5>
      {links.map(([href, label]) => (
        <Link key={href + label} href={href} className="block text-sm py-1.5 hover:text-white">{label}</Link>
      ))}
    </div>
  );
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const { t } = useT();
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
        <Link href="/history"><DropdownMenuItem className="cursor-pointer">{t("nav.history")}</DropdownMenuItem></Link>
        <Link href="/message"><DropdownMenuItem className="cursor-pointer">{t("nav.messages")}</DropdownMenuItem></Link>
        <Link href="/settings"><DropdownMenuItem className="cursor-pointer">{t("nav.settings")}</DropdownMenuItem></Link>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-700"
          onSelect={(e) => { e.preventDefault(); void logout(); }}
        >
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- visualisations ---------- */

function CoggingViz() {
  const bl = 230, sx = 44, st = 46, bw = 30;
  const bars = [155, 122, 93, 70, 50, 32, 18];
  const pcts = ["100%","79%","60%","45%","32%","21%","12%"];
  return (
    <svg viewBox="0 0 400 270" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd"/><stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85"/>
        </linearGradient>
        <linearGradient id="cfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
        </linearGradient>
        <filter id="cgl"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="270" fill="#080c14"/>
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
        {[80,120,160,200].map(y=><line key={y} x1="36" y1={y} x2="382" y2={y}/>)}
      </g>
      <line x1="36" y1={bl} x2="382" y2={bl} stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      {bars.map((h,i)=>{
        const cx=sx+i*st+bw/2;
        return (
          <g key={i}>
            <rect x={sx+i*st} y={bl-h} width={bw} height={h} rx="4" fill="url(#cg)"/>
            <rect x={sx+i*st+5} y={bl-h+4} width={bw-10} height={Math.min(10,h-8)} rx="2" fill="rgba(255,255,255,0.1)"/>
            <text x={cx} y={bl-h-6} textAnchor="middle" fill="rgba(147,197,253,0.9)" fontFamily="monospace" fontSize="9">{pcts[i]}</text>
            <text x={cx} y={bl+15} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="monospace" fontSize="9">{`P${i+1}`}</text>
          </g>
        );
      })}
      <polygon points={[...bars.map((h,i)=>`${sx+i*st+bw/2},${bl-h}`),`${sx+6*st+bw/2},${bl}`,`${sx+bw/2},${bl}`].join(" ")} fill="url(#cfill)"/>
      <polyline points={bars.map((h,i)=>`${sx+i*st+bw/2},${bl-h}`).join(" ")} fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={sx+bw/2} cy={bl-bars[0]} r="4.5" fill="#c7d2fe" filter="url(#cgl)"/>
      <circle cx={sx+6*st+bw/2} cy={bl-bars[6]} r="4.5" fill="#c7d2fe" filter="url(#cgl)"/>
      <text x="14" y={bl-60} fill="rgba(255,255,255,0.3)" fontFamily="monospace" fontSize="9" textAnchor="middle" transform={`rotate(-90,14,${bl-60})`}>void%</text>
    </svg>
  );
}

function PmapViz() {
  return (
    <svg viewBox="0 0 400 275" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <filter id="hblur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="22"/>
        </filter>
        <clipPath id="mclip"><rect x="44" y="18" width="318" height="218"/></clipPath>
        <filter id="swglow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="275" fill="#080c14"/>
      <rect x="44" y="18" width="318" height="218" fill="#7f1d1d"/>
      <g clipPath="url(#mclip)" filter="url(#hblur)">
        <ellipse cx="275" cy="115" rx="155" ry="115" fill="#059669"/>
        <ellipse cx="325" cy="85" rx="85" ry="72" fill="#34d399"/>
        <ellipse cx="210" cy="95" rx="95" ry="82" fill="#10b981" opacity="0.7"/>
        <ellipse cx="145" cy="158" rx="72" ry="62" fill="#d97706"/>
        <ellipse cx="78" cy="178" rx="62" ry="55" fill="#dc2626"/>
        <ellipse cx="98" cy="90" rx="55" ry="48" fill="#b91c1c"/>
        <ellipse cx="58" cy="135" rx="38" ry="42" fill="#991b1b"/>
      </g>
      <g stroke="rgba(0,0,0,0.22)" strokeWidth="1">
        {[98,152,206,260,314].map(x=><line key={x} x1={x} y1="18" x2={x} y2="236"/>)}
        {[60,102,144,186].map(y=><line key={y} x1="44" y1={y} x2="362" y2={y}/>)}
      </g>
      <rect x="44" y="18" width="318" height="218" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
      <rect x="232" y="52" width="114" height="106" rx="5" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="2" strokeDasharray="7 4" filter="url(#swglow)"/>
      <text x="289" y="74" textAnchor="middle" fill="white" fontFamily="monospace" fontSize="10" fontWeight="700">SAFE</text>
      <text x="289" y="89" textAnchor="middle" fill="white" fontFamily="monospace" fontSize="10" fontWeight="700">WINDOW</text>
      <text x="80" y="42" textAnchor="middle" fill="rgba(252,165,165,0.85)" fontFamily="monospace" fontSize="9">ξ &lt; 0</text>
      <text x="44" y="254" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="10">900°C</text>
      <text x="362" y="254" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="10" textAnchor="end">1250°C</text>
      <text x="20" y="127" fill="rgba(255,255,255,0.45)" fontFamily="monospace" fontSize="10" textAnchor="middle" transform="rotate(-90,20,127)">ε̇ (s⁻¹)</text>
    </svg>
  );
}

function PreformViz() {
  const cw = 38, ch = 22, cols = 8, rows = 6, ox = 28, oy = 52;
  return (
    <svg viewBox="0 0 400 290" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <linearGradient id="meshfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.06"/>
        </linearGradient>
        <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0"/>
          <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0"/>
        </linearGradient>
        <filter id="pglow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="meshclip"><rect x={ox} y={oy} width={cols*cw} height={rows*ch}/></clipPath>
      </defs>
      <rect width="400" height="290" fill="#080c14"/>
      <rect x={ox} y={oy} width={cols*cw} height={rows*ch} fill="url(#meshfill)"/>
      {Array.from({length:rows+1},(_,r)=>(
        <line key={`r${r}`} x1={ox} y1={oy+r*ch} x2={ox+cols*cw} y2={oy+r*ch} stroke="rgba(139,92,246,0.35)" strokeWidth="1"/>
      ))}
      {Array.from({length:cols+1},(_,c)=>(
        <line key={`c${c}`} x1={ox+c*cw} y1={oy} x2={ox+c*cw} y2={oy+rows*ch} stroke="rgba(139,92,246,0.35)" strokeWidth="1"/>
      ))}
      {[[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[2,3],[3,3],[4,3],[5,3],[3,4],[4,4]].map(([c,r])=>(
        <rect key={`${c},${r}`} x={ox+c*cw} y={oy+r*ch} width={cw} height={ch} fill="#7c3aed" opacity={0.1+(rows-r)*0.04}/>
      ))}
      <g clipPath="url(#meshclip)">
        <rect x={ox} y={oy} width={cols*cw} height={ch*0.8} fill="url(#scan)" opacity="0.7">
          <animateTransform attributeName="transform" type="translate" from="0,0" to={`0,${rows*ch}`} dur="3s" repeatCount="indefinite"/>
        </rect>
      </g>
      <rect x={ox} y={oy} width={cols*cw} height={rows*ch} fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5"/>
      <g opacity="0.7">
        <line x1={ox+cols*cw/2} y1={oy-28} x2={ox+cols*cw/2} y2={oy-4} stroke="#a78bfa" strokeWidth="2.5"/>
        <polygon points={`${ox+cols*cw/2-7},${oy-6} ${ox+cols*cw/2+7},${oy-6} ${ox+cols*cw/2},${oy+4}`} fill="#a78bfa"/>
      </g>
      <text x={ox+cols*cw/2} y={oy-34} textAnchor="middle" fill="rgba(167,139,250,0.65)" fontFamily="monospace" fontSize="9">PRESS FORCE</text>
      <text x={ox+cols*cw/2} y={oy+rows*ch+20} textAnchor="middle" fill="rgba(139,92,246,0.45)" fontFamily="monospace" fontSize="9">CROSS-SECTION · GRAIN MESH</text>
      <g fill="none" stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="3 4">
        {[1,2,3,4,5].map(r=>(
          <path key={r} d={`M${ox} ${oy+r*ch} Q${ox+cols*cw/2} ${oy+r*ch-8} ${ox+cols*cw} ${oy+r*ch}`}/>
        ))}
      </g>
    </svg>
  );
}

function PipelineViz() {
  const nodes=[
    {x:118,y:88,n:"1",label:"map",c:"#4f46e5"},
    {x:282,y:88,n:"2",label:"correct",c:"#0891b2"},
    {x:282,y:212,n:"3",label:"schedule",c:"#059669"},
    {x:118,y:212,n:"4",label:"preform",c:"#7c3aed"},
  ];
  const r=28;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
      <defs>
        <radialGradient id="rbg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#312e81" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#312e81" stopOpacity="0"/>
        </radialGradient>
        <filter id="nglow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,1 L9,5 L0,9 z" fill="#6366f1"/>
        </marker>
      </defs>
      <rect width="400" height="300" fill="#080c14"/>
      <rect width="400" height="300" fill="url(#rbg)"/>
      <g fill="none" stroke="#4f46e5" strokeWidth="2" strokeOpacity="0.75" markerEnd="url(#arr)">
        <line x1={118+r} y1="88" x2={282-r-10} y2="88"/>
        <line x1="282" y1={88+r} x2="282" y2={212-r-10}/>
        <line x1={282-r} y1="212" x2={118+r+10} y2="212"/>
        <line x1="118" y1={212-r} x2="118" y2={88+r+10}/>
      </g>
      <text x="200" y="145" textAnchor="middle" fill="#6366f1" fontFamily="monospace" fontSize="11" fontWeight="700" opacity="0.75">CLOSED</text>
      <text x="200" y="160" textAnchor="middle" fill="#6366f1" fontFamily="monospace" fontSize="11" fontWeight="700" opacity="0.75">LOOP</text>
      {nodes.map(({x,y,n,label,c})=>(
        <g key={n}>
          <circle cx={x} cy={y} r={r+6} fill={c} opacity="0.18" filter="url(#nglow)"/>
          <circle cx={x} cy={y} r={r} fill={c} opacity="0.92"/>
          <circle cx={x} cy={y} r={r-1} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
          <circle cx={x-7} cy={y-8} r={r*0.35} fill="rgba(255,255,255,0.07)"/>
          <text x={x} y={y+5} textAnchor="middle" fill="white" fontFamily="monospace" fontSize="14" fontWeight="700">{n}</text>
          <text x={x} y={y+r+17} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontFamily="monospace" fontSize="10">{label}</text>
        </g>
      ))}
    </svg>
  );
}
