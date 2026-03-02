# SnapEdit Multi-User — Findings

## Architecture Discovery (2026-03-01)

### Current State
- **Server:** `server.js` — 108 lines, WebSocket-only locking (ws library)
- **Frontend:** Fully browser-side. EditorCore.ts manages iframe canvas.
- **Persistence:** NONE. Edits live only in iframe DOM.
- **Project list:** browser localStorage (`snapedit-projects` key)
- **Load mechanism:** `loadFromURL(url)` sets `iframe.src` to Nginx-served path, `loadContent(html)` writes via `doc.write()`

### Multi-User Analysis
- Separate projects: ✅ Locking works, but no persistence
- Same project: ⚠️ Lock works, but:
  - No save-back → closing tab loses all work
  - Read-only user sees stale content
  - Race condition on PROJECT_FREED (mitigated: Node WS is single-threaded)

### Key Code Paths
| Flow | Files |
|------|-------|
| Load from URL | `Toolbar.ts:283-289` → `EditorCore.ts:52-148` (loadFromURL) |
| WebSocket lock | `EditorCore.ts:150-197` (connectWebSocket) |
| Read-only mode | `EditorCore.ts:199-217` (setReadOnlyMode) |
| Save/export | `EditorCore.ts:365-388` (exportHTML) — download only |
| History push | `EditorCore.ts:318-321` (pushHistory) → auto-save hook point |
| Project CRUD | `Toolbar.ts:201-396` — all localStorage |

### Constraints
- Zero new npm dependencies allowed (gemini.md rule)
- Server must remain lightweight Node.js (no Express)
- Must maintain backward compatibility with loadContent() flow
