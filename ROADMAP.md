# ForgeIQ — Roadmap

This file is the living plan for **ForgeIQ — AI Metallurgy Simulation Platform**.
It is not a contract — priorities shift as feedback comes in. If something on this
list matters to you, please [open an issue](https://github.com/jonesh77/forgeiq/issues/new/choose)
or use the contact form on <https://forgeiq.dev>.

Legend: ✅ done · 🔄 in progress · 📌 planned · 💡 idea / unscheduled

---

## ✅ v0.1.0-beta — shipped 2026-06-02

Initial public beta. See [CHANGELOG.md](./CHANGELOG.md) for the full list.

---

## 🔄 v0.2 — Quality & sharing (Q3 2026 target)

Theme: **make ForgeIQ trustworthy for second users.**

- 📌 Tighten backend CORS to `forgeiq.dev` only (currently `CORS(app)` permissive)
- 📌 Hetzner cloud firewall — drop 5000/5001 from public, keep behind Caddy
- 📌 Shareable run links — public read-only URL for a single saved run (workflow / cogging / pmap / preform)
- 📌 Saved material presets — user-defined (B, C, D, σ_base, σ_slope) alongside AISI 4340 / 1045 / Inconel 718
- 📌 Run-history search — by program, by date, by material
- 📌 Footer version chip — displays current `vX.Y.Z` from package.json so bug reports cite the right build
- 📌 Caddy access logs + upstream timeouts; minimal Prometheus/`/metrics` endpoint on both backends
- 📌 Move `.config/docker-compose.server.yml` + `Caddyfile` into the repo so server rebuilds are self-contained
- 💡 In-app changelog viewer (modal that shows `CHANGELOG.md` highlights for the running version)

---

## 📌 v0.3 — Materials & training UX (Q4 2026 target)

Theme: **own your material.**

- 📌 Custom material training UI — upload your own (T, ε̇, σ) data → fit `σ_base`, `σ_slope`, calibrate void params B/C/D
- 📌 Extended material library — AISI 304, AISI 316, Ti-6Al-4V, Cu-OFHC
- 📌 Per-material PINN re-train pipeline (admin-only)
- 📌 Project workspaces — group runs by job, name them, attach notes
- 📌 Export run as PDF report (one-page summary with input params, plots, recommended next steps)

---

## 📌 v0.4 — Headless / batch (Q1 2027 target)

Theme: **scale beyond the browser.**

- 📌 REST API tokens — per-user, scoped (read-history / run-pmap / run-preform)
- 📌 Batch inference endpoints — submit N parameter sweeps, retrieve results as a tarball
- 📌 CLI client (`forgeiq` Python package on PyPI) wrapping the REST API
- 📌 Webhook on async-job completion for 3D Preform
- 📌 Rate-limiting + per-tenant quotas

---

## 📌 v1.0 — Production SLA (2027)

Theme: **paid tier ready.**

- 📌 Multi-tenancy + organisation accounts (admin / member / viewer roles)
- 📌 Audit log per run (who ran what, with what inputs, when)
- 📌 Observability — structured logs, error tracking, latency histograms
- 📌 Status page at `status.forgeiq.dev`
- 📌 Tiered billing — Free / Lab / Enterprise
- 📌 SOC-2-style security review
- 📌 99.5% monthly uptime target

---

## 💡 Research-track ideas (unscheduled)

- 💡 Replace baseline U-Net entirely with the Attention U-Net (currently kept side-by-side for Compare page)
- 💡 Transformer-based pass-schedule policy (RL over the equipment-aware feasibility checker)
- 💡 Coupled thermal-mechanical FEM ground-truth dataset to extend the surrogate's validity range
- 💡 Mobile-native viewer (React Native + three.js bridge) for shop-floor STL preview
- 💡 ONNX export of MLP + GB + PINN so they can run client-side for offline preview
- 💡 Collaborative editing of pass schedules (multi-cursor, Linear-style)

---

## How priorities are set

Three signals, in this order:

1. **Bug reports + safety / data-loss issues** — fix first, always.
2. **Feature requests with concrete use cases** — prioritised by how many real users it unblocks.
3. **Research / nice-to-haves** — pulled in when they don't compete with (1) and (2).

The above roadmap is the author's current best guess; it is **not a commitment**.
