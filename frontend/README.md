# Frontend — ForgeIQ Platform

Next.js 15 + React 19 UI. Talks to two Flask backends.

## Setup

1. Copy `.env.example` to `.env.local` and fill values:
   ```bash
   cp .env.example .env.local
   ```
2. Install:
   ```bash
   pnpm install        # or npm install
   ```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Hot-reload dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint check |

## Required environment

See `.env.example`. The app **will not start** if `DB_URI` or `SESSION_PASSWORD` are missing.

## Project layout

```
src/
├── app/                        # Next.js App Router
│   ├── auth/                   # /auth/login, /auth/register
│   ├── cogging/                # /cogging — Train Model + Pass Schedule
│   ├── processing_map/         # /processing_map — Main Graph, etc.
│   ├── 3d_preform/             # /3d_preform — STL viewer
│   ├── message/                # /message — user messages
│   ├── super/message/          # /super/message — admin reply (super-user only)
│   ├── layout.tsx              # Root layout (Toaster, fonts, ProvideUser)
│   └── globals.css
├── components/
│   ├── our/                    # Custom components
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── api.ts                  # postToBackend1 / postToBackend2 (uniform errors + toasts)
│   ├── db.ts                   # MongoDB connection (cached)
│   ├── getSession.ts           # iron-session
│   ├── user.tsx                # ProvideUser / useUser client context
│   └── userserver.ts           # Server-side user from headers
└── middleware.ts               # Auth gate + header injection
```

## Auth flow

1. `/auth/register` — name + email + password (hashed with bcrypt before insert)
2. `/auth/login` — verifies bcrypt hash; legacy plaintext users are auto-upgraded
3. `iron-session` writes encrypted cookie
4. `middleware.ts` injects user data into request headers, gates `/super/*` for admins
5. `layout.tsx` reads headers and provides `useUser()` to client components

## Calling backends

Use the helpers in `src/lib/api.ts`:

```tsx
import { postToBackend1 } from "@/lib/api";
import { toast } from "sonner";

const r = await postToBackend1("/api/cogging/passschedule", formData);
if (r.ok) {
  // r.data is the JSON response
} else {
  // toast.error already shown; r.error has the message
}
```

The helper:
- Auto-handles network errors / timeouts (10 min default)
- Surfaces backend `{status:"error", error:"..."}` as failed
- Shows a `toast.error()` by default — pass `{ showToast: false }` to suppress
