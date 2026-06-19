# Changelog

All notable changes to **ForgeIQ — AI Metallurgy Simulation Platform** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **Docs — backend2 framework corrected.** The README listed `backend2` as
  using **PyTorch**, but the 3D Attention-U-Net pipeline runs on
  **TensorFlow / Keras** (no `torch` import exists anywhere in the codebase).
  Corrected both the architecture table and the Tech Stack list, and aligned
  the dependency lists with `backend2/requirements.txt`
  (numpy-stl · scikit-image · pymeshlab · trimesh · pyvista). CAPABILITIES.md
  and CHANGELOG were already correct.

### Added

- **Backend test suite (`tests/`, 75 tests).** Automated correctness tests that
  run the real backend modules against the real `sample_data/`:
  processing-map physics (Prasad η / ξ), train-data correction formula, the full
  cogging training pipeline, the pass-schedule optimizer, the 3D-preform geometry
  pipeline (parsing → voxelisation → STL → quality grading), the custom 3D
  losses, the Attention-U-Net I/O contract, and API contract checks for both
  Flask services. Plus `pytest.ini`, `requirements-dev.txt`, and a GitHub Actions
  workflow (`.github/workflows/backend-tests.yml`).

---

## [v0.1.0-beta] — 2026-06-02

> **Initial public beta.** First publicly tagged release of ForgeIQ — AI Metallurgy Simulation Platform.
> Live at <https://forgeiq.dev>.

### Added — Programs (4)

- **Cogging** — MLP + Gradient Boosting surrogate for void closure in open-die forging
  - Quick mode (ASTM grain size + weight factor) and Advanced mode (`.xlsx` upload + training)
  - Train Data Correction module (input clean-up + sanity checks)
  - Quantile-regression UQ (q=0.1 / q=0.9 HistGradientBoosting → prediction-interval width + coverage %)
- **Processing Map** — Prasad-criterion `η` (power dissipation) and `ξ` (instability) over (T, ε̇)
  - 2D / 3D contour maps, strain-sweep plots, strain-table CSV/Excel export
  - **PINN surrogate** with auto-detected safe operating window (recommended `T`, `ε̇`, `η`, `ξ`)
- **Pass Schedule** — Equipment-aware optimizer
  - Slab-method force estimate `F = σ·(1+W/(4·30))·30·W / 9806.65`
  - Per-pass force / temperature feasibility (green / amber / red chips)
  - 4 material presets — AISI 4340 (default), AISI 1045, Inconel 718, Custom
- **3D Preform** — Voxel → STL pipeline via Attention-U-Net
  - Mesh quality grading A–D (watertight, manifold, genus, bbox, wall thickness)
  - Async job queue (`/submit` + `/status/{id}` polling, 30-min TTL sweeper)

### Added — Pipelines

- **Auto Pipeline (Workflow)** — one-click closed loop:
  PINN → Train Data Correction → Pass Schedule → 3D Preform, with iteration history and target-driven re-runs
- **Compare page** — side-by-side: Cogging MLP vs GB, Pmap Prasad baseline vs PINN, baseline U-Net vs Attention U-Net

### Added — Platform

- **Auth** — register / login / forgot-password / settings page with bcrypt + iron-session
- **i18n** — full translation across **English / Uzbek / Korean** (~1100 keys × 3 languages)
- **AI Assistant** — chat panel with Gemini fallback chain (`gemini-2.5-flash` → `2.0-flash` → `flash-latest`), offline FAQ fallback
- **History / Bookmarks / Messages** — per-user run history, bookmark panel, contact-the-author messages with admin reply
- **Email** — welcome, password-reset, admin-notification via nodemailer + Gmail SMTP

### Added — Infrastructure

- **Deployment** — Vercel (frontend, `main` auto-deploy) + Hetzner Cloud CPX22 (backends, Caddy + Let's Encrypt)
- **Domain** — [forgeiq.dev](https://forgeiq.dev) (Cloudflare Registrar, HSTS-preloaded TLD)
- **DB** — MongoDB Atlas (M0, Seoul region)
- **Memory tuning** — 4 GB swap on backend host (TF inference virtual mem ~7 GB; OOM kills resolved)
- **Sample data** — 5 example inputs under `sample_data/` for every program
- **Docker Compose** — single-file local stack at `.config/docker-compose.yml`
- **Windows launchers** — `run.exe` (warm start) + `run_first_time.exe` (cold install)

### Added — Documentation

- README with brand tagline, badges, demo links, screenshots, sample I/O, architecture, license clarity
- [CAPABILITIES.md](./CAPABILITIES.md) — full formula reference + honest list of limitations
- [ROADMAP.md](./ROADMAP.md) — v0.2 / v0.3 / v0.4 / v1.0 plan
- [CITATION.cff](./CITATION.cff) — machine-readable academic citation
- [.github/ISSUE_TEMPLATE/](./.github/ISSUE_TEMPLATE/) — bug report + feature request forms
- [LICENSE](./LICENSE) — proprietary, all rights reserved
- Uzbek user / technical guides — `USER_GUIDE.md`, `TECHNICAL_GUIDE_UZ.md`

### Known limitations

- 3D Preform first run takes 30–60 s (TensorFlow + 218 MB U-Net cold load); cached runs 5–15 s
- `unet_model.h5` (~218 MB) and voxel `.npy` arrays (~168 MB × 3) are **not** in git — request separately
- AI Assistant Gemini fallback chain falls back to offline FAQ if all upstream models fail
- Backend CORS currently allows all origins (planned tightening in v0.2)
- Single-user run history; multi-tenancy & sharing planned for v0.2

---

## Unreleased

See [ROADMAP.md](./ROADMAP.md) for what is planned next.

[v0.1.0-beta]: https://github.com/jonesh77/forgeiq/releases/tag/v0.1.0-beta
