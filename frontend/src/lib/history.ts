"use server";

import { getCollection, isDbHealthy } from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { ObjectId } from "mongodb";

export type HistoryService =
  | "cogging.train_model"
  | "cogging.gradient_boosting"
  | "cogging.train_correction"
  | "cogging.pass_schedule"
  | "processing_map.main_graph"
  | "processing_map.plot_vs_strain"
  | "processing_map.collect_for_strain"
  | "processing_map.pinn"
  | "preform_3d.generate";

export interface HistoryEntry {
  _id?: string;
  userid: string;
  service: HistoryService;
  title: string;
  params: Record<string, unknown>;
  summary?: string;
  used_sample?: boolean;
  createdAt: Date;
}

/** Save a single run. Silently no-ops if the user is not signed in. */
export async function recordHistory(entry: Omit<HistoryEntry, "userid" | "createdAt" | "_id">) {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return;
    // Skip silently while the DB is in cool-down — saves a network round-trip
    // and avoids the loud TLS error on every form submission.
    if (!isDbHealthy()) return;
    const col = await getCollection("history");
    await col.insertOne({
      userid: new ObjectId(session.userid),
      service: entry.service,
      title: entry.title,
      params: entry.params || {},
      summary: entry.summary || "",
      used_sample: !!entry.used_sample,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("recordHistory failed:", e);
  }
}

/** Return the most-recent N entries for the signed-in user. */
export async function listHistory(limit = 50): Promise<HistoryEntry[]> {
  const session = await getSession();
  if (!session.isSignedIn || !session.userid) return [];
  const col = await getCollection("history");
  const rows = await col
    .find({ userid: new ObjectId(session.userid) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map((r) => ({
    _id: r._id.toString(),
    userid: r.userid.toString(),
    service: r.service,
    title: r.title,
    params: r.params || {},
    summary: r.summary || "",
    used_sample: !!r.used_sample,
    createdAt: r.createdAt,
  }));
}

export async function deleteHistory(entryId: string) {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return { ok: false };
    const col = await getCollection("history");
    const res = await col.deleteOne({
      _id: new ObjectId(entryId),
      userid: new ObjectId(session.userid),
    });
    return { ok: res.deletedCount === 1 };
  } catch {
    return { ok: false };
  }
}
