"use client";

import { NsmLogo } from "@/components/our/nsm-logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requestPasswordReset } from "../lib/actions";
import { useActionState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { LangSwitcher } from "@/components/our/lang-switcher";
import { PiCompassTool, PiCube } from "react-icons/pi";
import { TbChartArea } from "react-icons/tb";

export default function ForgotPasswordPage() {
    const initialState = { message: "", success: false };
    const [formState, formAction, isPending] = useActionState(requestPasswordReset, initialState);

    return (
        <div className="w-screen h-screen flex font-public bg-white">
            <aside className="hidden lg:flex flex-col justify-between flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="relative">
                    <NsmLogo variant="dark" />
                </div>

                <div className="relative">
                    <div className="mb-3 text-xs uppercase tracking-[0.3em] text-indigo-300/70">by NSMLab</div>
                    <h1 className="text-5xl font-montserrat font-bold tracking-tight leading-none">
                        Forge<span className="text-indigo-300">IQ</span>
                    </h1>
                    <p className="mt-5 text-slate-300 text-sm leading-relaxed max-w-md">
                        Parolni tikladingizmi? Hech qisi yo'q — emailingizni kiriting, sizga yangi vaqtinchalik parol yuboramiz.
                    </p>

                    <div className="mt-10 space-y-5 max-w-md">
                        <Feature icon={<PiCompassTool />} title="Cogging Program" desc="Neural-network predictor + 7-pass schedule optimizer." />
                        <Feature icon={<TbChartArea />} title="Processing Map" desc="2D / 3D dissipation & instability maps with FEM overlays." />
                        <Feature icon={<PiCube />} title="3D Preform" desc="U-Net voxel prediction → smoothed STL geometry." />
                    </div>
                </div>

                <div className="relative text-xs text-slate-500">
                    © {new Date().getFullYear()} ForgeIQ · by NSMLab · Sogang University
                </div>
            </aside>

            <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-5 right-6"><LangSwitcher /></div>

                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 flex justify-center">
                        <NsmLogo variant="light" />
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Parolni unutdingizmi?</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Emailingizni kiriting — yangi vaqtinchalik parol jo'natamiz.
                    </p>

                    <form action={formAction} className="mt-8 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Email</label>
                            <Input
                                type="email"
                                name="email"
                                required
                                placeholder="you@example.com"
                                className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                            />
                        </div>

                        {formState.message && (
                            <div
                                className={
                                    "text-xs rounded-md px-3 py-2 border " +
                                    (formState.success
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : "bg-red-50 border-red-200 text-red-700")
                                }
                            >
                                {formState.message}
                            </div>
                        )}

                        {isPending ? (
                            <Button type="button" disabled className="w-full h-11 bg-slate-900 cursor-not-allowed">
                                <AiOutlineLoading className="animate-spin" />Yuborilmoqda...
                            </Button>
                        ) : (
                            <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 cursor-pointer text-white font-medium">
                                Yangi parol yuborish
                            </Button>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm space-x-3">
                        <Link className="font-medium text-indigo-600 hover:text-indigo-700" href="/auth/login">
                            ← Kirish sahifasiga qaytish
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
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
