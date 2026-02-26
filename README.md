# SnapEdit — Visual HTML Editor

**Live:** [https://snapedit.syhi.tech](https://snapedit.syhi.tech)

SnapEdit is a browser-based visual HTML editor that lets you select, style, rearrange, and insert elements on any page — then export clean HTML. Built with **TypeScript + Vite**, zero runtime dependencies.

---

## Features

### 🎨 Visual Editing
- **Click to select** any element — see properties in the right panel
- **Double-click** to edit text inline
- **Drag & drop** elements up/down with grab handles
- **Hover highlighting** with element tag label

### 🧩 Insert Elements
| Element | Description |
|---------|-------------|
| **Heading** | `<h2>` with default styling |
| **Paragraph** | `<p>` with readable line-height |
| **Button** | Styled `<button>` with shadow & hover |
| **Divider** | `<hr>` separator |
| **Spacer** | Empty `<div>` with configurable height |
| **Container** | Dashed box for grouping elements |
| **Embed** | Responsive iframe (YouTube, Maps, etc.) |
| **Video** | HTML5 `<video>` or YouTube/Vimeo embed |
| **Form** | Contact form builder with configurable fields |

### 📐 Layout Power
- **Responsive breakpoints**: Desktop / Tablet (768px) / Mobile (375px)
- **Flexbox/Grid editor**: Direction, justify, align, wrap, gap
- **Display modes**: Block, Flex, Grid, Inline, None

### 🎯 Styling Panel
- Colors (text, background) with HEX picker
- Typography (font family, size, weight, spacing, alignment)
- Spacing (padding, margin)
- Border (width, radius, color)

### 🖼️ Images
- Insert from URL or upload/drag-drop
- Object fit, width/height, radius, opacity, shadow controls

### 📋 Right-Click Context Menu
- Duplicate / Delete / Move Up / Move Down
- Copy Styles / Paste Styles
- Wrap in Container / Unwrap

### 🧭 Navigation
- **Layers panel** (left sidebar): DOM tree with drag reorder & rename
- **Breadcrumb bar** (bottom): Click ancestor path
- **Global tab**: Page-wide colors & fonts

### 📬 Contact Form Builder
1. Click **Form** in the Insert panel
2. Set the target email address
3. Toggle fields: Name, Email, Phone, Company, Subject, Message
4. Customize the submit button text
5. Click **Insert Form** — a styled, functional form is added

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl+Alt+C` | Copy styles |
| `Ctrl+Alt+V` | Paste styles |

---

## Architecture

```
src/
├── main.ts                  # App initialization
├── demo-content.ts          # Default demo page HTML
├── style.css                # All editor styles
├── editor/
│   ├── EditorCore.ts        # Canvas iframe, history, drag-drop
│   ├── SelectionManager.ts  # Click/hover selection overlays
│   ├── InlineEditor.ts      # Double-click text editing
│   ├── HistoryManager.ts    # Undo/Redo stack (20 entries)
│   ├── StyleMutator.ts      # Apply CSS changes to elements
│   └── BreakpointManager.ts # Desktop/Tablet/Mobile toggles
├── panels/
│   ├── StylesPanel.ts       # Right panel: Element styles
│   ├── InsertPanel.ts       # Right panel: Insert tab (images + elements + form)
│   ├── LayersPanel.ts       # Left panel: DOM tree
│   ├── FlexGridPanel.ts     # Layout controls (flex/grid)
│   ├── BreadcrumbBar.ts     # Bottom breadcrumb navigation
│   ├── ContextMenu.ts       # Right-click menu
│   └── Toolbar.ts           # Top toolbar (undo/redo, load/export)
└── utils/
    ├── EventBus.ts          # Pub/sub event system
    ├── ColorInput.ts        # HEX color picker widget
    ├── PanelResizer.ts      # Draggable panel resizer
    ├── StyleClipboard.ts    # Copy/paste styles utility
    └── dom-helpers.ts       # Shared DOM utilities
```

### Key Design Decisions
- **Iframe canvas**: All user content lives inside an `<iframe>` to isolate styles from the editor UI
- **EventBus**: Decoupled communication between panels via publish/subscribe
- **No runtime deps**: Pure TypeScript + Vite. Zero npm dependencies at runtime
- **History stack**: Stores full `innerHTML` snapshots for reliable undo/redo

---

## Development

```bash
# Install
npm install

# Dev server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Stack**: TypeScript, Vite 6, vanilla CSS. No React/Vue/Svelte.

---

## Deployment

SnapEdit is a static site (SPA). The `dist/` folder is served by nginx.

```bash
# Build and deploy
npm run build
cp -r dist/* /var/www/snapedit.syhi.tech/

# Reload nginx
systemctl reload nginx
```

**Nginx config** at `/etc/nginx/sites-available/snapedit.syhi.tech`:
- SPA fallback (`try_files $uri $uri/ /index.html`)
- Static asset caching (30 days)
- Gzip compression
- Security headers

**SSL** via Let's Encrypt/Certbot:
```bash
certbot --nginx -d snapedit.syhi.tech --non-interactive --agree-tos --redirect
```

---

## License
Private project — all rights reserved.
