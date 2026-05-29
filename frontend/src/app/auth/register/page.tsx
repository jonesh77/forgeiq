"use client";

import Image from "next/image"
import logo from "../../../../public/logo.png"
import { NsmLogo } from "@/components/our/nsm-logo"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/our/password-input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { register } from "../lib/actions"
import { useActionState, useEffect, useState } from "react"
import { AiOutlineLoading } from "react-icons/ai"
import { useT } from "@/lib/i18n"
import { LangSwitcher } from "@/components/our/lang-switcher"
import { HiSparkles } from "react-icons/hi2"
import { FaCheck } from "react-icons/fa6"

export default function RegisterPage() {
    const initialState = { message: "" }
    const { t } = useT();

    let [formState, formAction, isPending] = useActionState(register, initialState);
    let [showMessage, setShowMessage] = useState(true);

    useEffect(() => { setShowMessage(true); }, [formState]);

    return (
        <div className="w-screen h-screen flex font-public bg-white">
            {/* LEFT — Brand panel */}
            <aside className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="relative">
                    <NsmLogo variant="dark" />
                </div>

                <div className="relative">
                    <div className="mb-3 text-xs uppercase tracking-[0.3em] text-indigo-300/70">Join ForgeIQ</div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs text-indigo-200 mb-4">
                        <HiSparkles /> Free for researchers
                    </div>
                    <h1 className="text-4xl font-montserrat font-bold tracking-tight leading-tight">
                        Get started in<br />
                        <span className="text-indigo-300">under a minute</span>
                    </h1>
                    <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-md">
                        Create an account to save your computation history, bookmark parameter sets, and access all three programs of the ForgeIQ workbench.
                    </p>

                    <ul className="mt-10 space-y-3 max-w-md">
                        <Perk text="Try every service with built-in sample data" />
                        <Perk text="Save bookmarks of your favourite parameter sets" />
                        <Perk text="Full history of every run — re-open or compare any time" />
                        <Perk text="Export Pass Schedule results to PDF" />
                        <Perk text="Multi-language: English, O'zbekcha, 한국어" />
                    </ul>
                </div>

                <div className="relative text-xs text-slate-500">
                    © {new Date().getFullYear()} ForgeIQ · Developed by Y. Alibek · NSMLab · Sogang University
                </div>
            </aside>

            {/* RIGHT — Form */}
            <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-5 right-6"><LangSwitcher /></div>

                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 flex justify-center">
                        <NsmLogo variant="light" />
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{t("common.create_account")}</h2>
                    <p className="text-sm text-slate-500 mt-1">It takes less than 30 seconds.</p>

                    <form action={formAction} className="mt-8 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">{t("common.name")}</label>
                            <Input type="text" name="name" required placeholder="Jane Doe" className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">{t("common.email")}</label>
                            <Input type="email" name="email" required placeholder="you@example.com" className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">{t("common.password")}</label>
                            <PasswordInput name="password" required placeholder="At least 6 characters" className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100" />
                        </div>

                        {(formState.message != "" && showMessage) && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
                                {formState.message}
                            </div>
                        )}

                        {isPending ? (
                            <Button type="button" disabled className="w-full h-11 bg-slate-900 cursor-not-allowed">
                                <AiOutlineLoading className="animate-spin" />{t("common.loading")}
                            </Button>
                        ) : (
                            <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 cursor-pointer text-white font-medium">
                                {t("common.register")}
                            </Button>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">{t("common.have_account")}? </span>
                        <Link className="font-medium text-indigo-600 hover:text-indigo-700" href="/auth/login">{t("common.login")}</Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Perk({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3 text-sm text-slate-200">
            <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mt-0.5">
                <FaCheck className="text-[9px]" />
            </span>
            <span className="leading-relaxed">{text}</span>
        </li>
    );
}
