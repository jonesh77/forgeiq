"use server";

import { getCollection } from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { ObjectId } from "mongodb";

export type BookmarkService =
  | "cogging.train_correction"
  | "cogging.pass_schedule"
  | "processing_map.main_graph"
  | "processing_map.plot_vs_strain";

export interface Bookmark {
  _id?: string;
  userid: string;
  service: BookmarkService;
  name: string;
  params: Record<string, string>;
  createdAt: Date;
}

export async function saveBookmark(input: {
  service: BookmarkService;
  name: string;
  params: Record<string, string>;
}) {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return { ok: false, error: "Not signed in" };
    if (!input.name?.trim()) return { ok: false, error: "Name required" };

    const col = await getCollection("bookmarks");
    const res = await col.insertOne({
      userid: new ObjectId(session.userid),
      service: input.service,
      name: input.name.trim(),
      params: input.params,
      createdAt: new Date(),
    });
    return { ok: true, id: res.insertedId.toString() };
  } catch (e) {
    console.error("saveBookmark failed:", e);
    return { ok: false, error: "Server error" };
  }
}

export async function listBookmarks(service?: BookmarkService): Promise<Bookmark[]> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return [];
    const col = await getCollection("bookmarks");
    const query: Record<string, unknown> = { userid: new ObjectId(session.userid) };
    if (service) query.service = service;
    const rows = await col.find(query).sort({ createdAt: -1 }).toArray();
    return rows.map((r) => ({
      _id: r._id.toString(),
      userid: r.userid.toString(),
      service: r.service,
      name: r.name,
      params: r.params || {},
      createdAt: r.createdAt,
    }));
  } catch (e) {
    console.error("listBookmarks failed:", e);
    return [];
  }
}

export async function deleteBookmark(id: string) {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return { ok: false };
    const col = await getCollection("bookmarks");
    const r = await col.deleteOne({ _id: new ObjectId(id), userid: new ObjectId(session.userid) });
    return { ok: r.deletedCount === 1 };
  } catch {
    return { ok: false };
  }
}
