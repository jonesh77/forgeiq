import { listHistory, HistoryEntry } from "@/lib/history";
import HistoryClient from "./compare-client";

export default async function HistoryPage() {
  const entries: HistoryEntry[] = await listHistory(100);

  // Serialize Date to string so it crosses the server/client boundary safely
  const serialized = entries.map((e) => ({
    ...e,
    _id: e._id!,
    createdAt: (e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt)).toISOString(),
  }));

  return <HistoryClient entries={serialized as any} />;
}
