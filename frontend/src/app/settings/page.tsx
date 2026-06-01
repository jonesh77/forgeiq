"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { ProgramHeader } from "@/components/our/program-header";
import { PasswordInput } from "@/components/our/password-input";
import { Button } from "@/components/ui/button";
import { changePassword } from "../auth/lib/actions";
import { AiOutlineLoading } from "react-icons/ai";
import { LuLock } from "react-icons/lu";

export default function SettingsPage() {
    const initialState = { message: "", success: false };
    const [formState, formAction, isPending] = useActionState(changePassword, initialState);
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (formState.success && formRef.current) {
            formRef.current.reset();
        }
    }, [formState]);

    return (
        <div className="min-h-screen bg-slate-50">
            <ProgramHeader title="Settings" accent="slate" />

            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Sozlamalar</h1>
                    <p className="text-sm text-slate-500 mt-1">Hisobingiz xavfsizligini boshqaring.</p>
                </div>

                <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <LuLock className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Parolni o'zgartirish</h2>
                            <p className="text-xs text-slate-500">Yangi parol kamida 6 ta belgi bo'lishi kerak.</p>
                        </div>
                    </div>

                    <form ref={formRef} action={formAction} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Joriy parol</label>
                            <PasswordInput
                                name="currentPassword"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Yangi parol</label>
                            <PasswordInput
                                name="newPassword"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                placeholder="kamida 6 ta belgi"
                                className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Yangi parolni tasdiqlang</label>
                            <PasswordInput
                                name="confirmPassword"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                placeholder="yangi parolni qaytaring"
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

                        <div className="pt-2 flex items-center gap-3">
                            {isPending ? (
                                <Button type="button" disabled className="h-11 bg-slate-900 cursor-not-allowed">
                                    <AiOutlineLoading className="animate-spin" />Saqlanmoqda...
                                </Button>
                            ) : (
                                <Button type="submit" className="h-11 bg-slate-900 hover:bg-slate-800 cursor-pointer text-white font-medium">
                                    Parolni o'zgartirish
                                </Button>
                            )}
                            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
                                Bekor qilish
                            </Link>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
