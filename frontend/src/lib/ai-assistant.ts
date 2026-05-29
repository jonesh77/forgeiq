"use server";

/**
 * AI assistant — answers user questions about the platform.
 *
 * Four modes (checked in order, first non-failing wins):
 *  1. GEMINI_API_KEY set → Google Gemini (gemini-1.5-flash default). Free tier.
 *  2. OPENAI_API_KEY set → OpenAI Chat Completions (gpt-4o-mini default).
 *  3. ANTHROPIC_API_KEY set → Claude.
 *  4. Otherwise → local FAQ keyword matching (offline).
 *
 * All LLM providers receive prior conversation history for context.
 *
 * Public surface:
 *   askAssistant({ question, history? }) -> { ok, answer, source }
 */

export type AssistantTurn = { from: "user" | "assistant"; text: string };
export type AssistantInput = { question: string; history?: AssistantTurn[] };

const FAQ: { keywords: RegExp[]; answer: string }[] = [
  {
    keywords: [/cogging/i, /train.+model/i, /\.h5/i],
    answer:
      "Cogging → Train Model trains a neural network that predicts ENE from your cogging parameters. Upload an Excel with columns Feed, Depth Schedule, Number of Rotation, Pass1…Pass7, ENE. The result is a .h5 file you'll use in Pass Schedule. Click 'Try with sample' to see it in action.",
  },
  {
    keywords: [/pass.+schedule/i, /forging.+ratio/i, /void.+closure/i],
    answer:
      "Pass Schedule needs (a) a trained .h5 model from Train Model and (b) the same cogging Excel. Enter Initial Cross Section, Initial Length, and Cutting Length in mm. The optimizer returns the best 7-pass plan plus forging ratios, length changes, and void closure %. Export the result as a PDF when done.",
  },
  {
    keywords: [/processing.+map/i, /dissipation/i, /instability/i, /prasad/i],
    answer:
      "Processing Map needs an .xlsx with strain1…strain16 and stress1…stress16 columns (16 strain/stress pairs covering 4 temperatures × 4 strain rates). Choose plot type 2D for a single-strain contour, or 'instability'/'dissipation' for 3D stacks. The grey region marks unsafe (ξ ≤ 0) zones to avoid in real processing.",
  },
  {
    keywords: [/3d/i, /preform/i, /stl/i, /u.?net/i],
    answer:
      "3D Preform takes a U-Net .h5 model, a bounding-box CSV, and two DEFORM .dat files (elements + nodes). It returns a smoothed STL mesh. The bundled sample uses a 218 MB model — first call takes ~30s, later calls are cached and finish in ~5s.",
  },
  {
    keywords: [/sample/i, /demo/i, /example/i, /try.+with/i],
    answer:
      "Every form has a yellow 'Try with sample' button — click it to run with bundled example data and see the workflow without uploading your own files. You can also download the sample files using the smaller buttons to learn the expected format.",
  },
  {
    keywords: [/bookmark/i, /save.+parameter/i],
    answer:
      "On Pass Schedule and Train Data Correction you can save the current parameters as a bookmark. Click 'Save as bookmark', name it, and reapply it later from the 'Bookmarks' dropdown. Bookmarks are stored per user.",
  },
  {
    keywords: [/history/i, /past.+run/i, /compare/i],
    answer:
      "Every computation is saved in History (user menu → History). Use the Compare button to pick two entries and see their parameters side-by-side — yellow rows highlight differences.",
  },
  {
    keywords: [/language/i, /uzbek/i, /korean/i, /translat/i],
    answer:
      "Switch the interface language from the top bar (the icon with EN/UZ/KO). The choice is saved in your browser. The platform supports English, O'zbekcha, and 한국어.",
  },
  {
    keywords: [/login|register|password|sign.?(in|up)/i, /account/i],
    answer:
      "Sign up at /auth/register with name, email, and a password of 6+ characters. Passwords are stored hashed with bcrypt. Forgot your password? Ask an admin to delete your row from the users collection in MongoDB and register again.",
  },
  {
    keywords: [/admin|super/i, /reply.+messages/i],
    answer:
      "Admin (super-user) access is granted by setting `super: true` on the user document in MongoDB. Admins see a special Messages dashboard at /super/message where they can reply to user threads. Replies appear in real time on the user's side.",
  },
  {
    keywords: [/error|fail|not.?work|problem|stuck/i],
    answer:
      "Most errors come from one of: (1) backend services not running — check that backend1:5000 and backend2:5001 are up; (2) MongoDB Atlas IP whitelist — add your IP at https://cloud.mongodb.com; (3) wrong Excel format — use 'Download sample' on any form to see the expected layout. Detailed errors appear as red toasts in the bottom-right.",
  },
];

function localAnswer(question: string): string {
  const q = question.trim();
  if (!q) return "Please type a question.";

  // Score each FAQ by keyword hits
  let best: { score: number; answer: string } | null = null;
  for (const f of FAQ) {
    const score = f.keywords.reduce((acc, re) => acc + (re.test(q) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: f.answer };
  }
  if (best) return best.answer;

  return (
    "I'm not sure about that. Try these:\n\n" +
    "• Open the Help button (top-right) for a full guide.\n" +
    "• Click the (i) icon next to a form title for service-specific instructions.\n" +
    "• Click 'Leave message' to ask the human team — replies appear live in Messages."
  );
}

const SYSTEM_PROMPT = `You are the in-app assistant for ForgeIQ (by NSMLab) — a web workbench for forging-process design with three programs:

1. Cogging Program — neural-network ENE predictor (Train Model), data correction, and 7-pass schedule optimizer.
2. Processing Map — 2D/3D power-dissipation and instability maps from raw stress-strain data; optional Simufact/DEFORM particle overlays.
3. 3D Preform — voxel pipeline using a U-Net model → smoothed STL.

Every form has a "Try with sample" button so users can run things without files. History, Bookmarks, PDF export and multilingual UI (en/uz/ko) are available. Backend1 runs on :5000, backend2 on :5001.

Answer concisely (1-4 sentences). If unsure, suggest opening the form's (i) icon, the Help menu, or "Leave message" to contact the human team. Never make up file formats; if asked about exact columns, refer them to the (i) icon for that service.`;

function normalizeHistory(history?: AssistantTurn[]): AssistantTurn[] {
  if (!history?.length) return [];
  // Trim to the last 8 turns and drop empty entries
  return history
    .filter((m) => m && typeof m.text === "string" && m.text.trim().length > 0)
    .slice(-8);
}

async function callGeminiOnce(model: string, q: string, history: AssistantTurn[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        // Gemini uses role "model" for assistant turns
        ...history.map((m) => ({
          role: m.from === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: q }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err: any = new Error(`Gemini API ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

async function callGemini(q: string, history: AssistantTurn[]): Promise<string> {
  // Try the user's preferred model first, then fall back to less-popular
  // siblings on transient errors (503 overloaded, 429 rate-limited, 502/504).
  // Keeps the assistant working when one model is busy.
  const preferred = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbacks = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-pro"];
  const tried = new Set<string>();
  const order = [preferred, ...fallbacks].filter((m) => {
    if (tried.has(m)) return false;
    tried.add(m);
    return true;
  });

  let lastErr: any;
  for (const model of order) {
    try {
      return await callGeminiOnce(model, q, history);
    } catch (e: any) {
      lastErr = e;
      const transient = [429, 500, 502, 503, 504].includes(e?.status);
      if (!transient) throw e; // permanent error (bad key, model not found, etc.)
      console.warn(`Gemini ${model} returned ${e.status}; trying next model...`);
    }
  }
  throw lastErr || new Error("All Gemini models exhausted");
}

async function callOpenAI(q: string, history: AssistantTurn[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({
          role: m.from === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: q },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

async function callAnthropic(q: string, history: AssistantTurn[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((m) => ({
          role: m.from === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: q },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = (data?.content?.[0]?.text || "").trim();
  if (!text) throw new Error("Empty Anthropic response");
  return text;
}

export async function askAssistant(
  input: AssistantInput | string,
): Promise<{ ok: boolean; answer: string; source: "ai" | "faq" | "error" }> {
  // Accept both string (legacy) and { question, history } (preferred)
  const { question, history } = typeof input === "string"
    ? { question: input, history: [] as AssistantTurn[] }
    : input;

  const q = (question || "").trim();
  if (!q) return { ok: false, answer: "Please type a question.", source: "error" };

  const hist = normalizeHistory(history);

  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(q, hist);
      return { ok: true, answer: text, source: "ai" };
    } catch (e) {
      console.error("Gemini failed, trying next provider:", e);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await callOpenAI(q, hist);
      return { ok: true, answer: text, source: "ai" };
    } catch (e) {
      console.error("OpenAI failed, trying next provider:", e);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await callAnthropic(q, hist);
      return { ok: true, answer: text, source: "ai" };
    } catch (e) {
      console.error("Anthropic failed, falling back to FAQ:", e);
    }
  }

  return { ok: true, answer: localAnswer(q), source: "faq" };
}
