"use client";

import Image from "next/image"
import logo from "../../../../public/logo.png"
import { NsmLogo } from "@/components/our/nsm-logo"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/our/password-input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { login } from "../lib/actions"
import { useActionState, useEffect, useState } from "react"
import { AiOutlineLoading } from "react-icons/ai"
import { useT } from "@/lib/i18n"
import { LangSwitcher } from "@/components/our/lang-switcher"
import { PiCompassTool, PiCube } from "react-icons/pi"
import { TbChartArea } from "react-icons/tb"

export default function LoginPage() {
    const initialState = { message: "" }
    const { t } = useT();

    let [formState, formAction, isPending] = useActionState(login, initialState);
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
                    <div className="mb-3 text-xs uppercase tracking-[0.3em] text-indigo-300/70">{t("auth.brand.by_nsmlab")}</div>
                    <h1 className="text-5xl font-montserrat font-bold tracking-tight leading-none">
                        Forge<span className="text-indigo-300">IQ</span>
                    </h1>
                    <p className="mt-5 text-slate-300 text-sm leading-relaxed max-w-md">
                        {t("auth.brand.tagline")}
                    </p>

                    <div className="mt-10 space-y-5 max-w-md">
                        <Feature
                            icon={<PiCompassTool />}
                            title={t("auth.brand.feat_cogging_title")}
                            desc={t("auth.brand.feat_cogging_desc")}
                        />
                        <Feature
                            icon={<TbChartArea />}
                            title={t("auth.brand.feat_pmap_title")}
                            desc={t("auth.brand.feat_pmap_desc")}
                        />
                        <Feature
                            icon={<PiCube />}
                            title={t("auth.brand.feat_preform_title")}
                            desc={t("auth.brand.feat_preform_desc")}
                        />
                    </div>
                </div>

                <div className="relative text-xs text-slate-500">
                    © {new Date().getFullYear()} {t("auth.brand.footer_suffix")}
                </div>
            </aside>

            {/* RIGHT — Form */}
            <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-5 right-6"><LangSwitcher /></div>

                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 flex justify-center">
                        <NsmLogo variant="light" />
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{t("common.login_creds")}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t("auth.login.subtitle")}</p>

                    <form action={formAction} className="mt-8 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">{t("common.email")}</label>
                            <Input type="email" name="email" required placeholder="you@example.com" className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">{t("common.password")}</label>
                            <PasswordInput name="password" required placeholder="••••••••" className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100" />
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
                                {t("common.login")}
                            </Button>
                        )}
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <Link className="font-medium text-indigo-600 hover:text-indigo-700" href="/auth/forgot-password">
                            {t("common.forgot_password")}
                        </Link>
                    </div>

                    <div className="mt-3 text-center text-sm">
                        <span className="text-slate-500">{t("common.dont_have_account")}? </span>
                        <Link className="font-medium text-indigo-600 hover:text-indigo-700" href="/auth/register">{t("common.register")}</Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-indigo-300 text-lg">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
