"use client";

import Link from "next/link";
import { useUser } from "@/lib/user";
import { useT } from "@/lib/i18n";
import { LuLock, LuArrowRight, LuUpload } from "react-icons/lu";

/**
 * Wraps any file-upload UI. If the viewer is signed in, renders `children`
 * unchanged. Otherwise renders a lock card that explains demo restrictions
 * and links to /auth/register.
 *
 * Pair with `<ModeToggle>` (which already disables Advanced for anon users)
 * for ModeToggle-based forms; use this directly for forms that expose a raw
 * file <input> without a mode switch (gradient_boosting, pinn, compare).
 */
export function UploadGate({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  const user = useUser();
  const { t } = useT();

  if (user?.isSignedIn) return <>{children}</>;

  return (
    <div
      className={
        "relative rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 " +
        (compact ? "p-4" : "p-6")
      }
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-200/70 text-amber-800 flex items-center justify-center">
          <LuLock className="text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <LuUpload className="text-amber-700 text-sm" />
            <h4 className="text-sm font-semibold text-amber-900">
              {t("upload.locked.title")}
            </h4>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {t("upload.locked.desc")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              {t("upload.locked.cta_signup")} <LuArrowRight />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            >
              {t("upload.locked.cta_signin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
