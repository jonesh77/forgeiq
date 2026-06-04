"use client";

import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  { duration = 1100, decimals = 0, start = true }: { duration?: number; decimals?: number; start?: boolean } = {},
): string {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / duration);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
}

/** Parse i18n strings like "≤60s", "96.1%", "4" → numeric pieces for counting up. */
export function parseStatString(raw: string): { prefix: string; num: number; suffix: string; decimals: number } {
  const m = raw.match(/^([^\d.\-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: 0, suffix: raw, decimals: 0 };
  const numStr = m[2];
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { prefix: m[1], num: parseFloat(numStr), suffix: m[3], decimals };
}
