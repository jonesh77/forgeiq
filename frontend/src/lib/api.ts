"use client";

import { toast } from "sonner";

const BACKEND1 = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const BACKEND2 = process.env.NEXT_PUBLIC_BACKEND2_URL || "http://localhost:5001";

export const API = {
  backend1: BACKEND1,
  backend2: BACKEND2,
};

export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * POST FormData to a backend endpoint and parse a uniform JSON response.
 * Backend convention:
 *   success -> { status: "good", ...data }
 *   failure -> { status: "error", error: "..." }
 *
 * Network-level failures are caught and surfaced as a uniform `error`.
 */
export async function postForm<T = any>(
  baseUrl: string,
  path: string,
  formData: FormData,
  opts: { showToast?: boolean; timeoutMs?: number } = {},
): Promise<ApiResult<T>> {
  const { showToast = true, timeoutMs = 600_000 } = opts;
  const url = baseUrl.replace(/\/$/, "") + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: "POST", body: formData, signal: controller.signal });
    clearTimeout(timer);

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      const msg = `Server returned non-JSON response (HTTP ${res.status})`;
      if (showToast) toast.error(msg);
      return { ok: false, error: msg };
    }

    if (!res.ok || json?.status === "error") {
      const msg = json?.error || `Request failed (HTTP ${res.status})`;
      if (showToast) toast.error(msg);
      return { ok: false, error: msg };
    }

    return { ok: true, data: json as T };
  } catch (e: any) {
    clearTimeout(timer);
    let msg: string;
    if (e?.name === "AbortError") {
      msg = "Request timed out. The server may still be processing.";
    } else if (e instanceof TypeError) {
      msg = `Cannot reach backend at ${baseUrl}. Is the server running?`;
    } else {
      msg = e?.message || "Unknown network error";
    }
    if (showToast) toast.error(msg);
    return { ok: false, error: msg };
  }
}

export const postToBackend1 = <T = any>(path: string, fd: FormData, opts?: Parameters<typeof postForm>[3]) =>
  postForm<T>(BACKEND1, path, fd, opts);

export const postToBackend2 = <T = any>(path: string, fd: FormData, opts?: Parameters<typeof postForm>[3]) =>
  postForm<T>(BACKEND2, path, fd, opts);

/** Build a FormData that triggers the sample-data path on the backend. */
export function sampleFormData(extra?: Record<string, string>): FormData {
  const fd = new FormData();
  fd.append("_use_sample", "true");
  if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  return fd;
}

/** URL to download a backend sample file. Pass the logical sample name. */
export const sampleDownloadUrl = (backend: 1 | 2, name: string): string =>
  `${backend === 1 ? BACKEND1 : BACKEND2}/api/samples/${encodeURIComponent(name)}`;
