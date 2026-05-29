"use server";

import { headers } from "next/headers";

function dec(v: string | null): string {
  if (!v) return "";
  try { return decodeURIComponent(v); } catch { return v; }
}

export async function getUserServer() {
  "use server";

  const h = await headers();

  return {
    name: dec(h.get("name")),
    id: dec(h.get("userid")),
    email: dec(h.get("email")),
    super: h.get("super") === "true",
  };
}
