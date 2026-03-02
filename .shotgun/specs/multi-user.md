# Spec: Multi-User Persistence + Sync

Created: 2026-03-01
Status: DRAFT

## Problem

SnapEdit edits live only in browser RAM. No save-back mechanism. Closing tab = losing all work. Multiple users on same project see stale content. Project list is browser-local (localStorage).

**Goal:** Persist project edits on server, auto-save, live sync to read-only users, server-managed project list with shareable links.

## Research Summary

→ See `.shotgun/research/multi-user.md` for detailed codebase scan.

- server.js: 108 lines, WebSocket-only, needs full rewrite to add HTTP API + static serving + DB
- EditorCore.ts: `pushHistory()` is the hook point for auto-save, `connectWebSocket()` needs SAVE_CONTENT + CONTENT_UPDATED handlers
- Toolbar.ts: project CRUD needs to switch from localStorage to API calls

## Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `server.js` | MODIFY (rewrite) | Add: HTTP API (projects CRUD, save), static file serving (SPA + projects), SQLite DB, WebSocket SAVE_CONTENT/CONTENT_UPDATED/IDENTIFY |
| `src/editor/EditorCore.ts` | MODIFY | Add: `autoSave()` debounced method, `SAVE_CONTENT` WS msg in pushHistory, `CONTENT_UPDATED` handler (reload iframe), `IDENTIFY` on connect, `beforeunload` warning, WS auto-reconnect |
| `src/panels/Toolbar.ts` | MODIFY | Change: `getProjects()` → fetch API, `saveProjects()` → POST API, add save-status indicator, add user name prompt, enhance read-only banner with editor name |
| `package.json` | MODIFY | Add dep: `better-sqlite3` (or `sql.js`) |
| `data/snapedit.db` | NEW | SQLite database file (auto-created by server) |
| `data/projects/` | NEW (dir) | Project files directory (already created) |

## Staged PRs

### PR 1: Backend — server.js rewrite + SQLite (3 files)

- [ ] `package.json` — add `better-sqlite3` dependency
- [ ] `server.js` — full rewrite:
  - HTTP server with routing (no Express, raw `http`)
  - `GET /` → serve `dist/index.html`
  - `GET /assets/*` → serve `dist/assets/*`
  - `GET /api/projects` → list all projects from SQLite
  - `POST /api/projects` → create project (name, slug) → mkdir + empty index.html
  - `DELETE /api/projects/:slug` → delete project + files
  - `POST /api/projects/:slug/save` — save HTML to filesystem + backup
  - `GET /projects/:slug/*` → serve project files from `data/projects/`
  - SQLite init: create `projects` table if not exists
  - WebSocket: keep existing locking + add `IDENTIFY`, `SAVE_CONTENT`, `CONTENT_UPDATED`
  - `IDENTIFY {userName}` → store per-connection
  - `SAVE_CONTENT {projectUrl, html}` → write to disk, broadcast `CONTENT_UPDATED` to others
  - `LOCK_GRANTED` / `LOCK_DENIED` now include `lockedByName`
- [ ] `data/snapedit.db` — auto-created on first server start

### PR 2: Frontend Core — auto-save + sync (1 file)

- [ ] `src/editor/EditorCore.ts`:
  - New field: `private autoSaveTimer`, `private saveQueue`, `private userName`
  - `autoSave()` — debounced 2s, sends `SAVE_CONTENT` via WS with `exportHTML()` payload
  - Hook into `pushHistory()` → trigger `autoSave()`
  - `CONTENT_UPDATED` handler → `this.iframe.contentWindow.location.reload()` for read-only users
  - On `LOCK_GRANTED` after `PROJECT_FREED` → reload iframe first, then enable editing
  - `IDENTIFY` message sent on WS open with `userName` from localStorage
  - `beforeunload` — warn if unsaved changes
  - WS auto-reconnect with exponential backoff (1s → 2s → 4s → max 30s)
  - New event: `editor:saveStatus` — `'saving' | 'saved' | 'error'`
  - `LOCK_DENIED` / `PROJECT_LOCKED` now carries `lockedByName` → emitted in event

### PR 3: Frontend UI — project list + indicators (1 file)

- [ ] `src/panels/Toolbar.ts`:
  - `getProjects()` → `fetch('/api/projects')` with localStorage fallback
  - `saveProjects()` → `POST /api/projects` API call
  - Delete project → `DELETE /api/projects/:slug`
  - Save status indicator: small chip in toolbar "💾 Saving..." / "✓ Saved" / "⚠ Error"
  - User name: on first visit prompt "Podaj swoje imię" → save to `localStorage('snapedit-username')`
  - Read-only banner: "🔒 Edytuje: **{name}**. Tryb read-only."

## Verification

- [ ] `npm install` succeeds (better-sqlite3 builds)
- [ ] `npm run build` passes (TypeScript + Vite)
- [ ] `node server.js` starts, creates DB, serves SPA at `http://localhost:8081`
- [ ] `curl /api/projects` returns `[]`
- [ ] Create project via API → folder created, DB entry exists
- [ ] Browser: open project → edit → "✓ Saved" → close tab → reopen → changes persisted
- [ ] Browser: 2 tabs, same project → tab 2 gets read-only banner with name → sees live updates
- [ ] Browser: tab 1 closes → tab 2 gets lock → sees latest content

## Notes

- `better-sqlite3` is synchronous (no async needed) — perfect for single-threaded Node
- If native build fails: fallback to `sql.js` (WASM, zero native deps, slightly slower)
- Backups: max 10 per project, oldest deleted (FIFO)
- Future PRs: user auth, AI integration, cloud storage
