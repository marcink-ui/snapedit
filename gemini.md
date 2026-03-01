# SnapEdit — Project Constitution

## Identity
Visual HTML editor evolving toward SaaS. TypeScript + Vite, iframe canvas, EventBus pub/sub.
Live: https://snapedit.syhi.tech | Repo: git@github.com:marcink-ui/snapedit.git

## Vision (North Star)
SaaS-like application where:
- Multiple users work on their own projects simultaneously
- Projects are persisted (local/cloud) — never lost
- Shareable links — send a URL, recipient can view or edit
- Future: AI-assisted planning and realization (Claude/Gemini integration)

## Data Schemas

### Project (Database)
```
{
  id: string (UUID),
  slug: string (URL-safe),
  name: string,
  description: string,
  createdAt: ISO datetime,
  updatedAt: ISO datetime,
  createdBy: string (user name),
  lockedBy: string | null (connection ID),
  lockedByName: string | null (user name)
}
```

### Project Files (Filesystem)
```
/data/projects/:slug/
├── index.html          # Main page HTML
├── assets/             # Images, CSS, etc.
└── .backups/           # Auto-generated rotated backups
```

### State
- **Editor state:** iframe DOM (in-memory)
- **History:** 20 innerHTML snapshots (HistoryManager, in-memory)
- **Projects DB:** SQLite (better-sqlite3) — metadata, searchable
- **Project files:** filesystem — actual HTML/assets
- **Locks:** in-memory Map on server + DB `lockedBy` field

## Architectural Invariants
- Iframe canvas for style isolation
- EventBus pub/sub for module communication
- `data-se-*` / `.se-*` are editor-internal, stripped on export
- Server = standalone Node.js (own process, own port)
- Database = SQLite (zero-config, file-based, portable)
- This is a **standalone tool** — separate from other projects/servers

## Behavioral Rules
- Single-writer per project (locking)
- Auto-save after edits (debounced), no explicit save button
- Read-only users see banner with editor's name
- Projects persist across server restarts (DB + filesystem)
- Lock auto-released on disconnect
- New npm dependencies are OK when justified
