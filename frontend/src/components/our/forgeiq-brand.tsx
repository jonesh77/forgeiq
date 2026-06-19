"use client";

/**
 * ForgeIQ brand lockup — F emblem (icon.svg) + "ForgeIQ" wordmark.
 * Used on auth pages (login/register/forgot-password) where NSMLab
 * branding used to live.
 */

type Variant = "light" | "dark";

const STYLE: Record<Variant, { emblem: string; text: string; iq: string; size: string }> = {
  light: { emblem: "h-8 w-8", text: "text-slate-900", iq: "text-indigo-600", size: "text-xl" },
  dark:  { emblem: "h-9 w-9", text: "text-white",     iq: "text-indigo-300", size: "text-2xl" },
};

export function ForgeIqBrand({ variant = "light", className = "" }: { variant?: Variant; className?: string }) {
  const s = STYLE[variant];
  return (
    <span className={"inline-flex items-center gap-2.5 " + className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="ForgeIQ" className={s.emblem + " rounded-lg block"} />
      <span className={s.size + " font-extrabold font-montserrat tracking-tight " + s.text}>
        Forge<span className={s.iq}>IQ</span>
      </span>
    </span>
  );
}
