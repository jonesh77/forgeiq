<!--
ForgeIQ — AI Metallurgy Simulation Platform is currently a proprietary project (see LICENSE).
External pull requests are not accepted at this stage. This template is for the maintainer's
internal use. If you have something to contribute, please open an Issue first.
-->

## Summary

<!-- 1–3 bullets — what changes and why -->

## Affected areas

- [ ] Frontend (`/frontend`)
- [ ] Backend 1 — Cogging / Pmap / Pass Schedule (`/backend1`)
- [ ] Backend 2 — 3D Preform (`/backend2`)
- [ ] Docs (README / CAPABILITIES / ROADMAP / CHANGELOG)
- [ ] CI / Docker / Infra (`.config/`)
- [ ] i18n (en / uz / ko)
- [ ] Sample data
- [ ] Other: …

## Verification

- [ ] `pnpm build` passes (frontend)
- [ ] Backend1 / Backend2 health endpoints respond 200
- [ ] Manual smoke: Cogging / Pmap / 3D Preform / Workflow each runs at least once
- [ ] No new console errors / TS errors / Python tracebacks
- [ ] Secrets not committed (`.env*`, real keys)

## Notes for review

<!-- Anything reviewers should pay attention to: trade-offs, known issues, follow-ups -->
