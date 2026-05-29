"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi2";
import { PiCompassTool, PiCube } from "react-icons/pi";
import { TbChartArea } from "react-icons/tb";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useUser } from "@/lib/user";

const STORAGE_PREFIX = "welcome_seen:";

/** Global trigger — any component can call this to re-open the welcome modal. */
const EVENT_OPEN = "forgeiq:open-welcome";

export function openWelcomeModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_OPEN));
  }
}

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const user = useUser();

  // Per-user storage key — so a different login on the same machine sees it again
  const storageKey = user?.id ? STORAGE_PREFIX + user.id : null;

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (!localStorage.getItem(storageKey)) setOpen(true);
  }, [storageKey]);

  // Allow other components to re-open the modal (e.g. Help menu)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(EVENT_OPEN, handler);
    return () => window.removeEventListener(EVENT_OPEN, handler);
  }, []);

  const close = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="!max-w-xl font-public">
        <DialogTitle className="flex items-center gap-2 text-xl">
          <HiSparkles className="text-amber-500" />
          {t("welcome.title")}
        </DialogTitle>
        <p className="text-sm text-slate-600 mt-1">{t("welcome.subtitle")}</p>

        <div className="mt-4 space-y-3">
          <Card href="/cogging" icon={<PiCompassTool className="text-blue-600 text-xl" />} title={t("nav.cogging")} desc={t("welcome.cogging_desc")} onClose={close} />
          <Card href="/processing_map" icon={<TbChartArea className="text-emerald-600 text-xl" />} title={t("nav.processing_map")} desc={t("welcome.pmap_desc")} onClose={close} />
          <Card href="/3d_preform" icon={<PiCube className="text-violet-600 text-xl" />} title={t("nav.preform_3d")} desc={t("welcome.preform_desc")} onClose={close} />
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900">
          {t("welcome.tip")}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={close} className="cursor-pointer">{t("welcome.skip")}</Button>
          <Button onClick={close} className="cursor-pointer">{t("welcome.got_it")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Card({ href, icon, title, desc, onClose }: {
  href: string; icon: React.ReactNode; title: string; desc: string; onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose} className="block border rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <div className="font-semibold text-slate-900">{title}</div>
      </div>
      <p className="text-xs text-slate-600 mt-1 ml-7 leading-relaxed">{desc}</p>
    </Link>
  );
}
