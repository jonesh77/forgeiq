import { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 text-[13px] uppercase tracking-wider mb-1.5">{title}</h3>
      <div className="text-slate-700 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function FileSpec({ name, columns, note }: { name: string; columns?: string[]; note?: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Required file</div>
      <div className="font-mono text-sm font-semibold text-slate-900">{name}</div>
      {columns && columns.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-slate-500 mb-1">Required columns:</div>
          <div className="flex flex-wrap gap-1">
            {columns.map((c) => (
              <code key={c} className="text-[11px] bg-white border border-slate-300 px-1.5 py-0.5 rounded font-mono">{c}</code>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-xs text-slate-500 mt-2 italic">{note}</p>}
    </div>
  );
}

export function ParamRow({ name, desc, range }: { name: string; desc: string; range?: string }) {
  return (
    <div className="border-l-2 border-slate-300 pl-3 py-1">
      <div className="flex items-baseline justify-between gap-3">
        <code className="text-[12px] font-mono font-semibold text-slate-900">{name}</code>
        {range && <span className="text-[10px] text-slate-500 italic">{range}</span>}
      </div>
      <div className="text-xs text-slate-600 mt-0.5">{desc}</div>
    </div>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 marker:text-slate-400 marker:font-semibold">
      {items.map((s, i) => <li key={i}>{s}</li>)}
    </ol>
  );
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 px-3 py-2 text-xs text-amber-900">
      <strong className="font-semibold">Tip:</strong> {children}
    </div>
  );
}
