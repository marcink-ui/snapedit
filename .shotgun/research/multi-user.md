# Research: Multi-User Persistence + Sync

Date: 2026-03-01

## Objective
Map all code paths that need to change for multi-user persistence, auto-save, and live sync.

## Files Scanned

| File | Lines | Purpose |
|------|-------|---------|
| `server.js` | 1-108 | WebSocket-only locking server |
| `src/editor/EditorCore.ts` | 1-855 | Core editor: iframe, load, save, drag, WS |
| `src/panels/Toolbar.ts` | 1-543 | Toolbar: undo/redo, load modal, export, project cards |
| `src/main.ts` | 1-187 | Bootstrap: creates EditorCore + all panels |
| `package.json` | 1-26 | Deps: ws, pagedjs, turndown |
| `DOCS.md` | 1-596 | Full technical documentation |

## Key Findings

### Architecture
- **EventBus** decouples everything — panels subscribe to events
- **iframe.src = url** for multi-file projects (Nginx serves files)
- **doc.write(html)** for paste/upload HTML
- **exportHTML()** strips editor artifacts → clean HTML

### Existing Implementations
- `connectWebSocket()` — already handles LOCK_GRANTED / LOCK_DENIED / PROJECT_FREED
- `setReadOnlyMode()` — disables iframe, hides overlays, emits event
- `setupReadOnlyListener()` in Toolbar — banner + disabled buttons
- `getProjects()` / `saveProjects()` — localStorage CRUD

### Dependencies
- `ws` (npm) — WebSocket server, used in server.js
- Node `http` — HTTP server (currently just health check endpoint)
- No database, no file system access in server.js

### State Management
- Editor state: iframe DOM (ephemeral)
- History: in-memory array, max 20 snapshots
- Project list: localStorage key `snapedit-projects`
- Locks: in-memory Maps in server.js

### Styling Patterns
- All CSS in `src/style.css` (~72KB)
- Banner created dynamically in Toolbar.ts (inline styles)
- No CSS modules, no design tokens

## Constraints
- [x] Can introduce new dependencies (user confirmed)
- [x] SQLite for database (user chose headless)
- [x] Must keep loadContent() working (paste/upload flow)
- [x] Must keep loadFromURL() working (multi-file project flow)
- [x] Server as standalone process

## Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| `loadFromURL` flow | iframe.src navigates to server URL — server must serve project files | Add static file serving for `/projects/:slug/` |
| `exportHTML()` called for save | Strips editor artifacts — must be the "clean" version saved | Use same exportHTML() for auto-save payload |
| EventBus listener stacking | `bus.on()` in loadFromURL is called each time → duplicate listeners | Already mitigated by AbortController in drag, but save listener needs same pattern |
| `better-sqlite3` native addon | Requires build tools (python, gcc) | Node 22 on Linux — should work. Fallback: `sql.js` (WASM, no native) |

## Conclusion
3 files change: `server.js` (full rewrite), `EditorCore.ts` (auto-save + sync), `Toolbar.ts` (API projects + status). Clean split into 3 PRs.
