"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IoMdHelp } from "react-icons/io";

/** Tiny "?" icon next to a parameter label. Hover/tap to read the hint. */
export function ParamHelp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={"inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-help text-[10px] " + className}>
          <IoMdHelp />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-[12px] leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
