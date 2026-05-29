import { ProgramHeader } from "@/components/our/program-header";
import { listHistory, HistoryEntry } from "@/lib/history";
import { LuHistory } from "react-icons/lu";
import Link from "next/link";
import HistoryClient from "./compare-client";

export default async function HistoryPage() {
  const entries: HistoryEntry[] = await listHistory(100);

  // Serialize Date to string so it crosses the server/client boundary safely
  const serialized = entries.map((e) => ({
    ...e,
    _id: e._id!,
    createdAt: (e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt)).toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50/40">
      <ProgramHeader title="History" accent="indigo" minimize />
      <div className="container max-w-4xl mx-auto pt-10 pb-20 px-6 font-public">
        <div className="flex items-center gap-3">
          <LuHistory className="text-2xl text-indigo-600" />
          <h1 className="text-2xl font-montserrat font-semibold">Computation history</h1>
        </div>
        <div className="w-full h-px bg-gray-100 mt-4 mb-6"></div>

        {entries.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl py-16 text-center bg-slate-50">
            <LuHistory className="text-4xl text-slate-400 mx-auto" />
            <p className="mt-4 text-slate-700 font-medium">No computations yet</p>
            <p className="text-sm text-slate-500 mt-1">Run a service and it will appear here.</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link href="/cogging" className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Open Cogging</Link>
              <Link href="/processing_map" className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Open Processing Map</Link>
              <Link href="/3d_preform" className="px-3 py-1.5 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-700">Open 3D Preform</Link>
            </div>
          </div>
        ) : (
          <HistoryClient entries={serialized as any} />
        )}
      </div>
    </div>
  );
}
