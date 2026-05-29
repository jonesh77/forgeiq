"use client";

import Image from "next/image";
import logo from "../../../public/logo.png";

/**
 * NSMLab brand mark — renders the actual NSMLAB logo PNG.
 *
 * The PNG is the full lockup (6-dot mark + caption + NSMLAB wordmark) at
 * 2172×724 ≈ 3:1 ratio. We expose four size presets and wrap in a white
 * card on dark backgrounds so the navy ink stays readable.
 */

type Variant = "light" | "dark" | "compact-light" | "compact-dark";

const SIZE: Record<Variant, { width: number; height: number; wrap: string }> = {
  light:          { width: 180, height: 60, wrap: "" },
  dark:           { width: 180, height: 60, wrap: "bg-white rounded-lg px-3 py-2 shadow-md shadow-black/20" },
  "compact-light":{ width: 110, height: 37, wrap: "" },
  "compact-dark": { width: 110, height: 37, wrap: "bg-white rounded-md px-2 py-1.5 shadow-sm" },
};

export function NsmLogo({ variant = "light", className = "" }: { variant?: Variant; className?: string }) {
  const s = SIZE[variant];

  return (
    <span className={"inline-flex items-center " + s.wrap + " " + className}>
      <Image
        src={logo}
        alt="NSMLAB · Net Shape Manufacturing Laboratory"
        width={s.width}
        height={s.height}
        className="block"
        style={{ width: s.width, height: "auto", maxHeight: s.height }}
        priority
      />
    </span>
  );
}
