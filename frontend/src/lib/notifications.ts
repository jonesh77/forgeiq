"use server";

import { getCollection, isDbHealthy } from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { ObjectId } from "mongodb";

export interface NotificationCounts {
  /** Replied admin messages user has not yet acknowledged. */
  unreadReplies: number;
  /** (Super-user only) pending user messages waiting for an answer. */
  pendingMessages: number;
  /** Whether the signed-in viewer is a super-user. */
  isSuper: boolean;
}

/**
 * Single endpoint the client polls (~30s) to refresh badge counts.
 * Cheap MongoDB count queries — no heavy reads.
 */
export async function getNotificationCounts(): Promise<NotificationCounts> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) {
      return { unreadReplies: 0, pendingMessages: 0, isSuper: false };
    }

    // Skip the DB call entirely if we recently saw a connection failure —
    // keeps page loads fast while the cluster is paused / IP not whitelisted.
    if (!isDbHealthy()) {
      return { unreadReplies: 0, pendingMessages: 0, isSuper: !!session.super };
    }

    const messages = await getCollection("messages");
    const uid = new ObjectId(session.userid);

    // New schema uses unreadForUser; fall back to legacy seenByUserAt check.
    const unreadReplies = await messages.countDocuments({
      userid: uid,
      $or: [
        { unreadForUser: true },
        { status: "responded", seenByUserAt: { $exists: false } },
      ],
    });

    let pendingMessages = 0;
    if (session.super) {
      pendingMessages = await messages.countDocuments({
        $or: [{ unreadForAdmin: true }, { status: "pending" }],
      });
    }

    return {
      unreadReplies,
      pendingMessages,
      isSuper: !!session.super,
    };
  } catch (e) {
    console.error("getNotificationCounts failed:", e);
    return { unreadReplies: 0, pendingMessages: 0, isSuper: false };
  }
}

/** Mark all admin replies as seen by the user (called when /message opens). */
export async function markRepliesSeen(): Promise<void> {
  try {
    const session = await getSession();
    if (!session.isSignedIn || !session.userid) return;
    const messages = await getCollection("messages");
    await messages.updateMany(
      { userid: new ObjectId(session.userid), status: "responded", seenByUserAt: { $exists: false } },
      { $set: { seenByUserAt: new Date() } },
    );
  } catch (e) {
    console.error("markRepliesSeen failed:", e);
  }
}
