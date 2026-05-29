"use server";

import { getCollection } from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { ObjectId } from "mongodb";

/**
 * Chat thread model.
 * Each "message" document in MongoDB is a conversation thread containing
 * an array of `entries` (newest at end). Backward-compatible with the
 * legacy schema that had a single `message` + `response`.
 *
 * Document shape:
 *  {
 *    _id, userid, email, status, sentAt,
 *    message?  (legacy first user message),
 *    response? (legacy first admin reply),
 *    entries: [{ from: "user"|"admin", text, at, seenByUserAt?, seenByAdminAt? }]
 *  }
 */
export type ChatEntry = {
  from: "user" | "admin";
  text: string;
  at: string; // ISO
};

export type ChatThread = {
  _id: string;
  userid: string;
  userEmail: string;
  userName?: string;
  status: "pending" | "responded" | "ongoing";
  entries: ChatEntry[];
  startedAt: string;
  lastAt: string;
  unreadForUser: boolean;
  unreadForAdmin: boolean;
};

function normalizeEntries(doc: any): ChatEntry[] {
  // Prefer explicit entries; fall back to legacy {message, response}
  if (Array.isArray(doc.entries) && doc.entries.length > 0) {
    return doc.entries.map((e: any) => ({
      from: e.from,
      text: String(e.text || ""),
      at: (e.at instanceof Date ? e.at : new Date(e.at)).toISOString(),
    }));
  }
  const out: ChatEntry[] = [];
  if (doc.message) {
    out.push({ from: "user", text: doc.message, at: (doc.sentAt instanceof Date ? doc.sentAt : new Date(doc.sentAt || Date.now())).toISOString() });
  }
  if (doc.response) {
    out.push({ from: "admin", text: doc.response, at: (doc.respondedAt instanceof Date ? doc.respondedAt : new Date(doc.respondedAt || doc.sentAt || Date.now())).toISOString() });
  }
  return out;
}

function toThread(doc: any): ChatThread {
  const entries = normalizeEntries(doc);
  const lastAt = entries.length > 0 ? entries[entries.length - 1].at : (doc.sentAt instanceof Date ? doc.sentAt : new Date(doc.sentAt || Date.now())).toISOString();
  return {
    _id: doc._id.toString(),
    userid: doc.userid?.toString() || "",
    userEmail: doc.email || "",
    userName: doc.userName || "",
    status: doc.status || "pending",
    entries,
    startedAt: (doc.sentAt instanceof Date ? doc.sentAt : new Date(doc.sentAt || Date.now())).toISOString(),
    lastAt,
    unreadForUser: !!doc.unreadForUser,
    unreadForAdmin: !!doc.unreadForAdmin,
  };
}

/** Start a new chat thread with the first user message. */
export async function startThread(firstMessage: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return { ok: false, error: "Not signed in" };
    const text = firstMessage.trim();
    if (!text) return { ok: false, error: "Empty message" };

    const col = await getCollection("messages");
    const now = new Date();
    const r = await col.insertOne({
      userid: new ObjectId(session.userid),
      email: session.email,
      userName: session.name,
      status: "pending",
      entries: [{ from: "user", text, at: now }],
      sentAt: now,
      lastAt: now,
      unreadForUser: false,
      unreadForAdmin: true,
    });
    return { ok: true, id: r.insertedId.toString() };
  } catch (e: any) {
    console.error("startThread failed:", e);
    return { ok: false, error: "Server error" };
  }
}

/** Append a message to an existing thread. */
export async function appendMessage(threadId: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return { ok: false, error: "Not signed in" };
    const clean = text.trim();
    if (!clean) return { ok: false, error: "Empty message" };

    const col = await getCollection("messages");
    const tid = new ObjectId(threadId);
    const doc = await col.findOne({ _id: tid });
    if (!doc) return { ok: false, error: "Thread not found" };

    const isAdmin = !!session.super;
    const isOwner = doc.userid?.toString() === session.userid;
    if (!isAdmin && !isOwner) return { ok: false, error: "Forbidden" };

    const from: "user" | "admin" = isAdmin ? "admin" : "user";
    const now = new Date();
    const newStatus = from === "admin" ? "responded" : "ongoing";

    await col.updateOne(
      { _id: tid },
      {
        $push: { entries: { from, text: clean, at: now } } as any,
        $set: {
          status: newStatus,
          lastAt: now,
          unreadForUser: from === "admin",
          unreadForAdmin: from === "user",
        },
      },
    );
    return { ok: true };
  } catch (e: any) {
    console.error("appendMessage failed:", e);
    return { ok: false, error: "Server error" };
  }
}

/** Mark thread as seen by the viewer (clears their unread flag). */
export async function markThreadSeen(threadId: string): Promise<void> {
  try {
    const session = await getSession();
    if (!session.isSignedIn) return;
    const col = await getCollection("messages");
    const isAdmin = !!session.super;
    await col.updateOne(
      { _id: new ObjectId(threadId) },
      { $set: isAdmin ? { unreadForAdmin: false } : { unreadForUser: false, seenByUserAt: new Date() } },
    );
  } catch (e) {
    console.error("markThreadSeen failed:", e);
  }
}

/** All threads owned by the signed-in user (or all threads if admin). */
export async function listMyThreads(): Promise<ChatThread[]> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return [];
    const col = await getCollection("messages");
    const query: Record<string, unknown> = session.super
      ? {}
      : { userid: new ObjectId(session.userid) };
    const rows = await col.find(query).sort({ lastAt: -1, sentAt: -1 }).limit(100).toArray();
    return rows.map(toThread);
  } catch (e) {
    console.error("listMyThreads failed:", e);
    return [];
  }
}

/** Fetch one thread (used by the chat page after polling). */
export async function getThread(threadId: string): Promise<ChatThread | null> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return null;
    const col = await getCollection("messages");
    const doc = await col.findOne({ _id: new ObjectId(threadId) });
    if (!doc) return null;
    const isAdmin = !!session.super;
    const isOwner = doc.userid?.toString() === session.userid;
    if (!isAdmin && !isOwner) return null;
    return toThread(doc);
  } catch (e) {
    console.error("getThread failed:", e);
    return null;
  }
}
