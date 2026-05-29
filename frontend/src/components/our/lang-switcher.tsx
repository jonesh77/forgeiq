"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useT, LANG_NAMES, Lang } from "@/lib/i18n";
import { IoLanguage } from "react-icons/io5";
import { FaCheck } from "react-icons/fa6";

export function LangSwitcher() {
  const { lang, setLang } = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="cursor-pointer flex items-center gap-1.5 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-slate-100 text-sm"
          title="Language / Til / 언어"
        >
          <IoLanguage />
          <span className="font-medium uppercase">{lang}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-public">
        {(Object.keys(LANG_NAMES) as Lang[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLang(code)}
            className="cursor-pointer flex items-center justify-between gap-3 min-w-[140px]"
          >
            <span>{LANG_NAMES[code]}</span>
            {lang === code && <FaCheck className="text-emerald-600 text-xs" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
