import { EditorCore } from '../editor/EditorCore';
import { showToast } from '../utils/dom-helpers';

interface Command {
    id: string;
    label: string;
    icon: string;
    category: string;
    action: () => void;
    keywords?: string;
}

export class CommandPalette {
    private editor: EditorCore;
    private overlay: HTMLDivElement | null = null;
    private commands: Command[] = [];

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.registerDefaultCommands();
        this.setupShortcut();
    }

    private setupShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    private registerDefaultCommands() {
        this.commands = [
            // ── File ──────────────────────────────────────
            {
                id: 'new-project', label: 'New Project', icon: '📄', category: 'File', action: () => {
                    (document.querySelector('#btn-load') as HTMLElement)?.click();
                }, keywords: 'create add project'
            },
            {
                id: 'save', label: 'Save Project', icon: '💾', category: 'File', action: () => {
                    this.editor.triggerAutoSave();
                    showToast('Saving...');
                }, keywords: 'save export'
            },
            {
                id: 'export-html', label: 'Export as HTML', icon: '📦', category: 'File', action: () => {
                    const btn = document.querySelector('#btn-export') as HTMLElement;
                    btn?.click();
                }, keywords: 'download export code'
            },
            {
                id: 'publish', label: 'Publish Site', icon: '🌐', category: 'File', action: () => {
                    this.publishProject();
                }, keywords: 'deploy share public'
            },

            // ── Edit ──────────────────────────────────────
            { id: 'undo', label: 'Undo', icon: '↩️', category: 'Edit', action: () => this.editor.undo(), keywords: 'undo back' },
            { id: 'redo', label: 'Redo', icon: '↪️', category: 'Edit', action: () => this.editor.redo(), keywords: 'redo forward' },

            // ── View ──────────────────────────────────────
            { id: 'toggle-editor', label: 'Toggle Editor Mode', icon: '✏️', category: 'View', action: () => this.editor.toggleEditor(), keywords: 'edit preview mode' },
            {
                id: 'toggle-layers', label: 'Toggle Layers Panel', icon: '📂', category: 'View', action: () => {
                    const tab = document.querySelector('[data-panel="layers"]') as HTMLElement;
                    tab?.click();
                }, keywords: 'layers tree structure'
            },
            {
                id: 'toggle-styles', label: 'Toggle Styles Panel', icon: '🎨', category: 'View', action: () => {
                    const tab = document.querySelector('[data-panel="styles"]') as HTMLElement;
                    tab?.click();
                }, keywords: 'styles css properties'
            },
            {
                id: 'toggle-insert', label: 'Toggle Insert Panel', icon: '➕', category: 'View', action: () => {
                    const tab = document.querySelector('[data-panel="insert"]') as HTMLElement;
                    tab?.click();
                }, keywords: 'blocks components elements insert add'
            },

            // ── Help ──────────────────────────────────────
            { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', category: 'Help', action: () => this.showShortcuts(), keywords: 'keyboard shortcut key bindings help' },
        ];
    }

    public async publishProject() {
        // Get current project URL from the editor
        const iframe = document.querySelector('.canvas-iframe') as HTMLIFrameElement;
        if (!iframe?.src) { showToast('No project loaded to publish.'); return; }

        const match = iframe.src.match(/\/projects\/([a-z0-9_-]+)\//);
        if (!match) { showToast('Load a project first to publish.'); return; }

        const slug = match[1];
        try {
            const res = await fetch(`/api/projects/${slug}/publish`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                const url = data.fullUrl || data.url;
                showToast(`Published! ${url}`);
                // Copy to clipboard
                try { await navigator.clipboard.writeText(url); showToast(`Link copied: ${url}`); } catch { /* ignore */ }
            } else {
                showToast(data.error || 'Failed to publish');
            }
        } catch {
            showToast('Server offline — could not publish');
        }
    }

    private showShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/⌘ + K', desc: 'Command Palette' },
            { key: 'Ctrl/⌘ + Z', desc: 'Undo' },
            { key: 'Ctrl/⌘ + Shift + Z', desc: 'Redo' },
            { key: 'Ctrl/⌘ + S', desc: 'Save' },
            { key: 'Ctrl/⌘ + C', desc: 'Copy styles' },
            { key: 'Ctrl/⌘ + V', desc: 'Paste styles' },
            { key: 'Delete / Backspace', desc: 'Delete element' },
            { key: 'Escape', desc: 'Deselect element' },
            { key: 'Double-click', desc: 'Edit text inline' },
        ];

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#1e1e2e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 32px;max-width:420px;width:90%;color:#fff;font-family:Inter,sans-serif;';

        const title = document.createElement('h3');
        title.style.cssText = 'margin:0 0 20px;font-size:18px;font-weight:700;';
        title.textContent = '⌨️ Keyboard Shortcuts';
        modal.appendChild(title);

        shortcuts.forEach(s => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
            row.innerHTML = `<span style="color:rgba(255,255,255,0.7);font-size:14px">${s.desc}</span><kbd style="background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:5px;font-size:12px;color:rgba(255,255,255,0.5);font-family:monospace">${s.key}</kbd>`;
            modal.appendChild(row);
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', close); }
        };
        document.addEventListener('keydown', close);
    }

    toggle() {
        if (this.overlay) {
            this.close();
            return;
        }
        this.open();
    }

    private open() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:flex-start;justify-content:center;padding-top:20vh;backdrop-filter:blur(4px);';
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });

        const palette = document.createElement('div');
        palette.style.cssText = 'background:#1e1e2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;width:520px;max-width:90vw;box-shadow:0 24px 64px rgba(0,0,0,0.5);overflow:hidden;font-family:Inter,sans-serif;';

        // Search input
        const inputWrap = document.createElement('div');
        inputWrap.style.cssText = 'padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:10px;';
        inputWrap.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type a command...';
        input.style.cssText = 'flex:1;background:none;border:none;outline:none;color:#fff;font-size:15px;font-family:Inter,sans-serif;';
        inputWrap.appendChild(input);

        const kbdHint = document.createElement('kbd');
        kbdHint.style.cssText = 'background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;font-size:11px;color:rgba(255,255,255,0.3);font-family:monospace;';
        kbdHint.textContent = 'ESC';
        inputWrap.appendChild(kbdHint);

        palette.appendChild(inputWrap);

        // Results container
        const results = document.createElement('div');
        results.style.cssText = 'max-height:300px;overflow-y:auto;padding:8px;';
        palette.appendChild(results);

        this.overlay.appendChild(palette);
        document.body.appendChild(this.overlay);

        // Render initial results
        this.renderResults(results, '');

        // Focus
        requestAnimationFrame(() => input.focus());

        // Search
        input.addEventListener('input', () => {
            this.renderResults(results, input.value);
        });

        // Keyboard nav
        let selectedIdx = 0;
        input.addEventListener('keydown', (e) => {
            const items = results.querySelectorAll('[data-cmd]');
            if (e.key === 'Escape') { e.preventDefault(); this.close(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); this.highlightItem(items, selectedIdx); }
            if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); this.highlightItem(items, selectedIdx); }
            if (e.key === 'Enter') {
                e.preventDefault();
                const item = items[selectedIdx] as HTMLElement;
                if (item) item.click();
            }
        });
    }

    private renderResults(container: HTMLElement, query: string) {
        container.innerHTML = '';
        const q = query.toLowerCase().trim();
        let currentCategory = '';
        let idx = 0;

        const filtered = this.commands.filter(cmd => {
            if (!q) return true;
            const searchable = `${cmd.label} ${cmd.category} ${cmd.keywords || ''}`.toLowerCase();
            return searchable.includes(q);
        });

        filtered.forEach(cmd => {
            if (cmd.category !== currentCategory) {
                currentCategory = cmd.category;
                const cat = document.createElement('div');
                cat.style.cssText = 'padding:6px 12px 4px;font-size:10px;font-weight:600;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1.5px;';
                cat.textContent = currentCategory;
                container.appendChild(cat);
            }

            const item = document.createElement('div');
            item.setAttribute('data-cmd', cmd.id);
            item.style.cssText = `padding:8px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.8);font-size:14px;transition:background .1s;${idx === 0 ? 'background:rgba(129,140,248,0.1);' : ''}`;
            item.innerHTML = `<span style="font-size:16px;width:22px;text-align:center">${cmd.icon}</span><span>${cmd.label}</span>`;

            item.addEventListener('mouseenter', () => { item.style.background = 'rgba(129,140,248,0.1)'; });
            item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });

            item.addEventListener('click', () => {
                this.close();
                setTimeout(() => cmd.action(), 50);
            });

            container.appendChild(item);
            idx++;
        });

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:20px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px;';
            empty.textContent = 'No commands found';
            container.appendChild(empty);
        }
    }

    private highlightItem(items: NodeListOf<Element>, idx: number) {
        items.forEach((item, i) => {
            (item as HTMLElement).style.background = i === idx ? 'rgba(129,140,248,0.1)' : 'transparent';
        });
        (items[idx] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    }

    private close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}
