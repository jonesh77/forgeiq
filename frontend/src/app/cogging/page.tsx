"use client";

import { PiCompassTool, PiCube } from "react-icons/pi";
import { MdOutlineUnfoldMore } from "react-icons/md";
import { TbChartArea, TbArrowsCross } from "react-icons/tb";
import TrainDataForm from "./train_data/default";
import { useState } from "react";
import PassSchedule from "./pass_schedule/default";
import GradientBoostingForm from "./gradient_boosting/default";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logo from "../../../public/logo.png"
import { FaUserCircle } from "react-icons/fa";
import { IoIosHelp, IoMdHelp } from "react-icons/io";
import { logout } from "../auth/lib/actions";
import HelpHeader from "./help";
import LeaveMessage from "./leavemessage";
import { useUser } from "@/lib/user";
import { useT } from "@/lib/i18n";
import { LangSwitcher } from "@/components/our/lang-switcher";
import { ProgramHeader, TabStrip } from "@/components/our/program-header";
import { ProgramHero } from "@/components/our/program-hero";
import { useNotifications, NotifBadge, NotifDot } from "@/components/our/notification-context";
import { toggleAiAssistant } from "@/components/our/ai-assistant";
import { HiSparkles } from "react-icons/hi2";
import { LuArrowRight } from "react-icons/lu";

const tabs: [string, (states: any, setStates: any) => React.ReactNode][] = [
    ["svc.train_model", (states, setStates) => (<TrainDataForm states={states} setStates={setStates} />)],
    ["svc.gradient_boosting", () => (<GradientBoostingForm />)],
    ["svc.pass_schedule", () => (<PassSchedule />)],
]

const PROGRAM_NAV: { href: string; key: string; icon: React.ReactNode }[] = [
    { href: "/workflow",       key: "nav.auto_pipeline",  icon: <HiSparkles className="text-amber-500" /> },
    { href: "/cogging",        key: "nav.cogging",        icon: <PiCompassTool /> },
    { href: "/processing_map", key: "nav.processing_map", icon: <TbChartArea /> },
    { href: "/3d_preform",     key: "nav.preform_3d",     icon: <PiCube /> },
    { href: "/compare",        key: "nav.compare",        icon: <TbArrowsCross /> },
];

function ProgramNav() {
    const pathname = usePathname() || "";
    const { t } = useT();
    return (
        <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar w-full">
            {PROGRAM_NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={
                            "shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 lg:px-3 h-7 sm:h-8 lg:h-9 rounded-md text-[11px] sm:text-xs lg:text-sm font-medium transition-colors " +
                            (isActive
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent")
                        }
                    >
                        <span className={isActive ? "text-indigo-600" : "text-slate-500"}>{item.icon}</span>
                        <span className="whitespace-nowrap">{t(item.key as any)}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function Header({ minimize = false, first, second }) {
    let user = useUser()
    const { t } = useT();
    const { counts } = useNotifications();
    const totalUnread = counts.unreadReplies + (counts.isSuper ? counts.pendingMessages : 0);

    return (
        <div className="flex flex-col gap-2 lg:gap-0">
        <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 shrink-0">
                <Link href={"/"} className="flex items-center shrink-0">{first}</Link>
                <div className="hidden lg:block min-w-0">
                    <ProgramNav />
                </div>
            </div>
            <div className="flex items-center font-public gap-x-2 shrink-0">
                <LangSwitcher />
                <button
                    type="button"
                    onClick={toggleAiAssistant}
                    title={t("home.nav.ask_ai")}
                    className="cursor-pointer flex items-center gap-1.5 px-2.5 md:px-3 h-9 rounded-md text-sm font-medium transition-all bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 border border-indigo-200/60"
                >
                    <HiSparkles className="text-amber-500" />
                    <span className="hidden md:inline">{t("home.nav.ask_ai")}</span>
                </button>
                {!minimize && (
                    <>
                        <HelpHeader trigger={
                            <button type="button" title={t("nav.help")} className="cursor-pointer flex items-center gap-1.5 text-slate-700 hover:text-slate-900 px-2.5 md:px-3 h-9 rounded-md hover:bg-slate-100 text-sm font-medium transition-colors">
                                <IoMdHelp className="text-base" />
                                <span className="hidden md:inline">{t("nav.help")}</span>
                            </button>
                        } />
                        <LeaveMessage trigger={
                            <button type="button" title={t("nav.leave_message")} className="cursor-pointer hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 h-9 rounded-md text-sm font-medium transition-colors">
                                {t("nav.leave_message")}
                            </button>
                        } />
                    </>
                )}
                {user?.isSignedIn ? (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="ml-1 relative w-9 h-9 cursor-pointer rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity">
                                {(user?.name && user.name.length > 0) ? user.name[0].toUpperCase() : "?"}
                                <NotifDot show={totalUnread > 0} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="font-public mr-2 min-w-[200px]">
                            {user?.name && (
                                <div className="px-2 py-2 border-b mb-1">
                                    <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
                                    {user.email && <div className="text-xs text-slate-500 truncate">{user.email}</div>}
                                </div>
                            )}
                            <Link href={"/history"}><DropdownMenuItem className="cursor-pointer">{t("nav.history")}</DropdownMenuItem></Link>
                            <Link href={counts.isSuper ? "/super/message" : "/message"}>
                                <DropdownMenuItem className="cursor-pointer flex items-center justify-between gap-3">
                                    <span>{t("nav.messages")}</span>
                                    <NotifBadge count={counts.isSuper ? counts.pendingMessages : counts.unreadReplies} />
                                </DropdownMenuItem>
                            </Link>
                            <Link href={"/settings"}><DropdownMenuItem className="cursor-pointer">{t("nav.settings")}</DropdownMenuItem></Link>
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-700"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    try { window.localStorage.removeItem("welcome_modal_seen_v1"); } catch {}
                                    void logout();
                                }}
                            >
                                {t("nav.logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-1.5 ml-1">
                        <Link href="/auth/login" className="hidden sm:inline-flex items-center px-3 h-9 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                            {t("home.nav.sign_in")}
                        </Link>
                        <Link href="/auth/register" className="inline-flex items-center gap-1 px-3 h-9 rounded-md text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white">
                            {t("home.nav.sign_up")} <LuArrowRight />
                        </Link>
                    </div>
                )}
            </div>
        </div>
        <div className="lg:hidden border-t border-slate-200 pt-2 -mx-6 lg:-mx-8 px-6 lg:px-8">
            <ProgramNav />
        </div>
        </div>
    )
}

export default function Page () {
    const { t } = useT();
    let [activeTab, setActiveTab] = useState(0);
    let [states, setStates] = useState({ trainData: { status: "steady", obj: {} }, trainDataCorrection: { status: "steady", obj: {} } });

    return (
        <div className="font-public min-h-screen body-cogging">
            <ProgramHeader title={t("nav.cogging")} accent="blue" />
            <ProgramHero variant="cogging" />
            <TabStrip
                tabs={tabs.map(([key]) => t(key as any))}
                active={activeTab}
                onChange={setActiveTab}
                accent="blue"
            />
            <div className="px-6 lg:px-8 py-6">
                {tabs[activeTab][1](states, setStates)}
            </div>
        </div>
    )
}