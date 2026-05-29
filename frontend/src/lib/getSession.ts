"use server";

import { SessionData } from "@/middleware";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

const sessionPassword = process.env.SESSION_PASSWORD;
if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error(
    "Missing or weak SESSION_PASSWORD environment variable (must be at least 32 characters). See .env.example.",
  );
}

const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: process.env.SESSION_COOKIE_NAME || "forgeiq_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isSignedIn) {
    session.isSignedIn = false;
    session.email = "";
    session.name = "";
    session.userid = "";
    session.super = false;
  }

  return session;
}
