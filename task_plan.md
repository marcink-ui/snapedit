# SnapEdit Multi-User — Task Plan

Status: PHASE 1 — DISCOVERY

## Phase 1: Blueprint (Vision & Logic)
- [ ] Discovery Questions answered
- [ ] Data Schema confirmed in gemini.md
- [ ] Sprint planning approved

## Phase 2: Link (Connectivity)
- [ ] Verify Node.js + ws dependency
- [ ] Verify file system paths for projects
- [ ] Verify build pipeline (tsc + vite)
- [ ] Verify Nginx config for production

## Phase 3: Architect (Shotgun Spec-Driven Build)
- [ ] Shotgun Research (codebase scan)
- [ ] Write Shotgun Spec (staged PRs)
- [ ] User approval of spec
- [ ] Execute PR 1: server.js rewrite
- [ ] Build check after PR 1
- [ ] Execute PR 2: EditorCore.ts auto-save + sync
- [ ] Build check after PR 2
- [ ] Execute PR 3: Toolbar.ts save indicator + API projects
- [ ] Build check after PR 3

## Phase 4: Stylize (Refinement)
- [ ] Save status indicator look & feel
- [ ] Read-only banner with user name
- [ ] User identity prompt design

## Phase 5: Trigger (Deployment)
- [ ] Full build passes
- [ ] Browser test scenario A (separate projects)
- [ ] Browser test scenario B (same project)
- [ ] Deploy to VPS
- [ ] Update gemini.md + progress.md
