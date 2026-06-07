"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import logo from "../../public/logo.png";
import { useUser } from "@/lib/user";
import { NsmLogo } from "@/components/our/nsm-logo";
import { LangSwitcher } from "@/components/our/lang-switcher";
import { useT } from "@/lib/i18n";
import { logout } from "./auth/lib/actions";
import { toggleAiAssistant } from "@/components/our/ai-assistant";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PiCompassTool, PiCube, PiBrain, PiLightning, PiGlobeStand, PiBookOpenText, PiBookmarkSimple, PiClockCounterClockwise, PiFlask, PiArrowsClockwise } from "react-icons/pi";
import { TbChartArea, TbAtom2 } from "react-icons/tb";
import { HiSparkles } from "react-icons/hi2";
import { LuArrowRight, LuMessagesSquare, LuPlay, LuX, LuMaximize2, LuExternalLink } from "react-icons/lu";
import { FaGithub } from "react-icons/fa6";
import { useCountUp, parseStatString } from "@/lib/use-count-up";
import { useInView } from "@/lib/use-in-view";
import { Reveal } from "@/components/our/reveal";

export default function LandingPage() {
  const user = useUser();
  const { t } = useT();

  return (
    <div className="font-public min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* TOP BAR */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center leading-tight">
            <div className="flex flex-col">
              <div className="text-xl font-bold text-slate-900 tracking-tight font-montserrat">
                Forge<span className="text-indigo-600">IQ</span>
                <span className="hidden md:inline text-[10px] text-slate-500 ml-2 font-normal align-middle">{t("home.nav.by_nsmlab")}</span>
              </div>
              <div className="hidden md:block text-[10px] text-indigo-600/80 font-semibold tracking-wider uppercase mt-0.5">{t("home.nav.tagline")}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#programs" className="hidden md:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">{t("home.nav.programs")}</a>
            <a href="#demo" className="hidden md:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">{t("home.nav.try_demo")}</a>
            <a href="#capabilities" className="hidden lg:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">{t("home.nav.capabilities")}</a>
            <a href="#team" className="hidden lg:inline text-sm text-slate-600 hover:text-slate-900 px-3 h-9 leading-9">{t("home.nav.team")}</a>
            <LangSwitcher />
            <button onClick={toggleAiAssistant} className="hidden md:flex items-center gap-1.5 cursor-pointer px-3 h-9 rounded-md text-sm font-medium bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 border border-indigo-200/60">
              <HiSparkles className="text-amber-500" />{t("home.nav.ask_ai")}
            </button>
            {user?.isSignedIn ? (
              <UserMenu name={user.name} email={user.email} />
            ) : (
              <Link href="/auth/login" className="inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white">
                {t("home.nav.sign_in")} <LuArrowRight />
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
              {t("home.hero.badge")}
            </div>
            <div
              className="mb-4 inline-block text-xs uppercase tracking-[0.3em] text-indigo-200/70"
              dangerouslySetInnerHTML={{ __html: t("home.hero.kicker") }}
            />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-montserrat leading-[1.05]">
              {t("home.hero.title1")}<br />
              <span className="text-shimmer">{t("home.hero.title2")}</span><br />
              <span className="text-slate-300">{t("home.hero.title3")}</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t("home.hero.desc")} <strong className="text-white">{t("home.hero.desc_strong")}</strong>
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href="#programs" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-all hover:scale-105">
                {t("home.hero.cta_primary")} <LuArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#demo" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-indigo-500/30">
                <LuPlay />{t("home.hero.cta_demo")} <LuArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <button onClick={toggleAiAssistant} className="cursor-pointer inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-sm transition-all">
                <HiSparkles className="text-amber-400" />{t("home.hero.cta_ai")}
              </button>
            </div>

            <HeroStats
              stats={[
                { raw: t("home.hero.stat1_v"), label: t("home.hero.stat1_l") },
                { raw: t("home.hero.stat2_v"), label: t("home.hero.stat2_l") },
                { raw: t("home.hero.stat3_v"), label: t("home.hero.stat3_l") },
              ]}
            />
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-24 px-6 lg:px-10 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">{t("home.why.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900 leading-tight">
              {t("home.why.title1")}<br />{t("home.why.title2")} <em className="text-indigo-600 not-italic">{t("home.why.title3")}</em>.
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              {t("home.why.desc")}
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Reveal delay={0}>
              <BenefitCard
                icon={<PiBrain className="text-2xl" />}
                title={t("home.why.b1_title")}
                text={t("home.why.b1_text")}
              />
            </Reveal>
            <Reveal delay={90}>
              <BenefitCard
                icon={<PiLightning className="text-2xl" />}
                title={t("home.why.b2_title")}
                text={t("home.why.b2_text")}
              />
            </Reveal>
            <Reveal delay={180}>
              <BenefitCard
                icon={<PiFlask className="text-2xl" />}
                title={t("home.why.b3_title")}
                text={t("home.why.b3_text")}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROGRAMS — the 3 main service cards */}
      <section id="programs" className="py-24 px-6 lg:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">{t("home.programs.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              {t("home.programs.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {t("home.programs.desc")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Reveal delay={0}>
              <ProgramCard
                href="/cogging"
                accent="blue"
                order="01"
                icon={<PiCompassTool />}
                title={t("home.programs.cog.title")}
                tag={t("home.programs.cog.tag")}
                desc={t("home.programs.cog.desc")}
                features={[t("home.programs.cog.f1"), t("home.programs.cog.f2"), t("home.programs.cog.f3")]}
                openLabel={t("home.programs.open")}
              />
            </Reveal>
            <Reveal delay={110}>
              <ProgramCard
                href="/processing_map"
                accent="emerald"
                order="02"
                icon={<TbChartArea />}
                title={t("home.programs.pmap.title")}
                tag={t("home.programs.pmap.tag")}
                desc={t("home.programs.pmap.desc")}
                features={[t("home.programs.pmap.f1"), t("home.programs.pmap.f2"), t("home.programs.pmap.f3")]}
                openLabel={t("home.programs.open")}
              />
            </Reveal>
            <Reveal delay={220}>
              <ProgramCard
                href="/3d_preform"
                accent="violet"
                order="03"
                icon={<PiCube />}
                title={t("home.programs.pre.title")}
                tag={t("home.programs.pre.tag")}
                desc={t("home.programs.pre.desc")}
                features={[t("home.programs.pre.f1"), t("home.programs.pre.f2"), t("home.programs.pre.f3")]}
                openLabel={t("home.programs.open")}
              />
            </Reveal>
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
                <HiSparkles className="text-amber-500" />{t("home.pipeline.badge")}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900 leading-[1.05]">
                {t("home.pipeline.title1")}<br />
                <span className="text-indigo-600">{t("home.pipeline.title2")}</span><br />
                <span className="text-slate-500">{t("home.pipeline.title3")}</span>
              </h2>
              <p
                className="mt-5 text-lg text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t("home.pipeline.desc") }}
              />
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <PipelineStep n="1" title={t("home.pipeline.s1_t")} desc={t("home.pipeline.s1_d")} />
                <PipelineStep n="2" title={t("home.pipeline.s2_t")} desc={t("home.pipeline.s2_d")} />
                <PipelineStep n="3" title={t("home.pipeline.s3_t")} desc={t("home.pipeline.s3_d")} />
                <PipelineStep n="4" title={t("home.pipeline.s4_t")} desc={t("home.pipeline.s4_d")} />
                <PipelineStep n="5" title={t("home.pipeline.s5_t")} desc={t("home.pipeline.s5_d")} />
              </ul>

              <div className="mt-8">
                <Link href="/workflow" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all hover:scale-105">
                  <LuPlay />{t("home.pipeline.cta")} <LuArrowRight className="group-hover:translate-x-1 transition-transform" />
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
                <FakeLog when="13:24:01" status="done" color="emerald" text={t("home.pipeline.log1")} detail={t("home.pipeline.log1_d")} />
                <FakeLog when="13:24:03" status="done" color="emerald" text={t("home.pipeline.log2")} detail={t("home.pipeline.log2_d")} />
                <FakeLog when="13:24:08" status="done" color="emerald" text={t("home.pipeline.log3")} detail={t("home.pipeline.log3_d")} />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Kpi v="96.1%" l={t("home.pipeline.k1")} />
                  <Kpi v="7" l={t("home.pipeline.k2")} />
                  <Kpi v="✓" l={t("home.pipeline.k3")} emerald />
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{t("home.pipeline.iter")}</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1"><PiArrowsClockwise />{t("home.pipeline.rerun")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section id="demo" className="py-24 px-6 lg:px-10 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">{t("home.screens.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              {t("home.screens.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {t("home.screens.desc")}
            </p>
          </div>

          <ScreenshotsGallery />
        </div>
      </section>

      {/* DEMO VIDEO */}
      <section className="py-24 px-6 lg:px-10 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">{t("home.demo.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              {t("home.demo.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {t("home.demo.desc")}
            </p>
          </div>

          {/* Bundled ForgeIQ explainer — runtime-unpacked React/Babel HTML in /public */}
          <div className="relative aspect-video w-full rounded-3xl border border-slate-200 bg-slate-950 shadow-2xl shadow-indigo-500/10 overflow-hidden">
            <iframe
              src="/video/index.html"
              title="ForgeIQ explainer"
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              loading="lazy"
            />
            <a
              href="/video/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-medium transition-colors"
              title={t("home.demo.cta_try")}
            >
              <LuExternalLink />
            </a>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link href="/workflow" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all">
              <LuPlay />{t("home.demo.cta_workflow")}
            </Link>
            <a href="#programs" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm transition-all">
              {t("home.demo.cta_try")} <LuArrowRight />
            </a>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="py-24 px-6 lg:px-10 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">{t("home.cap.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-white">
              {t("home.cap.title1")}<br />{t("home.cap.title2")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Feat icon={<HiSparkles />} title={t("home.cap.f1_t")} text={t("home.cap.f1_d")} />
            <Feat icon={<PiClockCounterClockwise />} title={t("home.cap.f2_t")} text={t("home.cap.f2_d")} />
            <Feat icon={<PiBookmarkSimple />} title={t("home.cap.f3_t")} text={t("home.cap.f3_d")} />
            <Feat icon={<PiBookOpenText />} title={t("home.cap.f4_t")} text={t("home.cap.f4_d")} />
            <Feat icon={<LuMessagesSquare />} title={t("home.cap.f5_t")} text={t("home.cap.f5_d")} />
            <Feat icon={<PiBrain />} title={t("home.cap.f6_t")} text={t("home.cap.f6_d")} />
            <Feat icon={<PiGlobeStand />} title={t("home.cap.f7_t")} text={t("home.cap.f7_d")} />
            <Feat icon={<TbAtom2 />} title={t("home.cap.f8_t")} text={t("home.cap.f8_d")} />
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="py-24 px-6 lg:px-10 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">{t("home.team.eyebrow")}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight font-montserrat text-slate-900">
              {t("home.team.title")} <span className="text-indigo-600">— Developed by Y. Alibek</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t("home.team.desc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <CreditCard
              role={t("home.team.role1")}
              org={t("home.team.org1")}
              note={t("home.team.note1")}
            />
            <CreditCard
              role={t("home.team.role2")}
              org={t("home.team.org2")}
              note={t("home.team.note2")}
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 lg:px-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-montserrat">
            {t("home.cta.title1")}<br />
            <span className="text-indigo-200">{t("home.cta.title2")}</span>
          </h2>
          <p className="mt-6 text-indigo-100 text-lg">
            {t("home.cta.desc")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/cogging" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-all hover:scale-105">
              <PiCompassTool />{t("home.cta.start_cogging")}
            </Link>
            <Link href="/processing_map" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-medium text-sm">
              <TbChartArea />{t("nav.processing_map")}
            </Link>
            <Link href="/3d_preform" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-medium text-sm">
              <PiCube />{t("nav.preform_3d")}
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
                <span className="text-[10px] text-indigo-300 ml-2 font-normal align-middle">— {t("home.nav.tagline")}</span>
              </div>
              <div className="text-[11px] mt-0.5">© {new Date().getFullYear()} · Developed by Y. Alibek</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="#programs" className="hover:text-white">{t("home.nav.programs")}</a>
            <a href="#capabilities" className="hover:text-white">{t("home.nav.capabilities")}</a>
            <a href="#team" className="hover:text-white">{t("home.nav.team")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

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

function HeroStats({ stats }: { stats: { raw: string; label: string }[] }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
      {stats.map((s, i) => (
        <Stat key={i} raw={s.raw} label={s.label} start={seen} />
      ))}
    </div>
  );
}

function Stat({ raw, label, start }: { raw: string; label: string; start: boolean }) {
  const parsed = parseStatString(raw);
  const n = useCountUp(parsed.num, { decimals: parsed.decimals, start, duration: 1300 });
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold font-montserrat text-white tabular-nums">
        {parsed.prefix}{n}{parsed.suffix}
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}

type ScreenshotItem = {
  src: string;
  titleKey: string;
  descKey: string;
  href: string;
  hrefKey: string;
};

const SCREENSHOTS: ScreenshotItem[] = [
  { src: "/screenshots/01_architecture.png",         titleKey: "home.screens.s1_title", descKey: "home.screens.s1_desc", href: "/workflow",       hrefKey: "home.screens.open_workflow" },
  { src: "/screenshots/02_workflow_pipeline.png",    titleKey: "home.screens.s2_title", descKey: "home.screens.s2_desc", href: "/workflow",       hrefKey: "home.screens.open_workflow" },
  { src: "/screenshots/03_before_after.png",         titleKey: "home.screens.s3_title", descKey: "home.screens.s3_desc", href: "/workflow",       hrefKey: "home.screens.open_workflow" },
  { src: "/screenshots/05_mesh_quality_grades.png",  titleKey: "home.screens.s4_title", descKey: "home.screens.s4_desc", href: "/3d_preform",     hrefKey: "home.screens.open_preform" },
  { src: "/screenshots/07_unet_architecture.png",    titleKey: "home.screens.s5_title", descKey: "home.screens.s5_desc", href: "/3d_preform",     hrefKey: "home.screens.open_preform" },
  { src: "/screenshots/09_performance_comparison.png", titleKey: "home.screens.s6_title", descKey: "home.screens.s6_desc", href: "/compare",      hrefKey: "home.screens.open_compare" },
];

function ScreenshotsGallery() {
  const { t } = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenIdx(null); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIdx]);

  const active = openIdx === null ? null : SCREENSHOTS[openIdx];

  return (
    <>
      <p className="text-center text-xs text-slate-500 mb-6 -mt-8">
        {t("home.screens.zoom_hint")}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SCREENSHOTS.map((s, i) => (
          <Shot
            key={s.src}
            src={s.src}
            title={t(s.titleKey as any)}
            desc={t(s.descKey as any)}
            onClick={() => setOpenIdx(i)}
          />
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-up"
          onClick={() => setOpenIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenIdx(null); }}
            title={t("home.screens.close")}
            className="absolute top-4 right-4 cursor-pointer w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors"
          >
            <LuX className="text-xl" />
          </button>

          <div
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.src}
                alt={t(active.titleKey as any)}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-white">
              <div>
                <h3 className="text-base font-semibold font-montserrat">{t(active.titleKey as any)}</h3>
                <p className="text-sm text-slate-300 mt-0.5">{t(active.descKey as any)}</p>
              </div>
              <Link
                href={active.href}
                onClick={() => setOpenIdx(null)}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-all hover:scale-105"
              >
                {t(active.hrefKey as any)} <LuArrowRight />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Shot({ src, title, desc, onClick }: { src: string; title: string; desc: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-zoom-in"
    >
      <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/70 backdrop-blur-sm text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <LuMaximize2 className="text-[11px]" /> Zoom
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-900 font-montserrat">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
    </button>
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
  blue: { bg: "from-blue-600 to-indigo-600", chip: "bg-blue-100 text-blue-800", glow: "glow-blue" },
  emerald: { bg: "from-emerald-600 to-teal-600", chip: "bg-emerald-100 text-emerald-800", glow: "glow-emerald" },
  violet: { bg: "from-violet-600 to-fuchsia-600", chip: "bg-violet-100 text-violet-800", glow: "glow-violet" },
};

function ProgramCard({
  href, accent, order, icon, title, tag, desc, features, openLabel,
}: {
  href: string; accent: keyof typeof PROGRAM_ACCENT; order: string;
  icon: React.ReactNode; title: string; tag: string; desc: string; features: string[]; openLabel: string;
}) {
  const a = PROGRAM_ACCENT[accent];
  return (
    <Link
      href={href}
      className={
        "group relative block rounded-2xl border border-slate-200 bg-white p-7 overflow-hidden " + a.glow
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
        {openLabel} <LuArrowRight className="text-slate-700 group-hover:translate-x-1 transition-transform" />
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
