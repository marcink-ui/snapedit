import { EditorCore } from '../editor/EditorCore';
import { StyleClipboard } from '../utils/StyleClipboard';
import { showToast } from '../utils/dom-helpers';

const COMPONENTS_KEY = 'snapedit-components';

interface MenuItem {
    label: string;
    icon: string;
    action: () => void;
    dividerAfter?: boolean;
    disabled?: () => boolean;
}

/**
 * ContextMenu — Right-click context menu for element operations.
 * Duplicate, Delete, Move Up/Down, Copy/Paste Styles, Wrap in Container.
 */
export class ContextMenu {
    private editor: EditorCore;
    private menu: HTMLElement;
    private clipboard: StyleClipboard;

    constructor(editor: EditorCore, clipboard: StyleClipboard) {
        this.editor = editor;
        this.clipboard = clipboard;

        // Create menu element
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'context-menu';
        document.body.appendChild(this.menu);

        this.setup();
    }

    private setup(): void {
        // Listen for right-click events from iframe
        this.editor.bus.on('element:contextmenu', (data: { element: HTMLElement; x: number; y: number }) => {
            this.show(data.element, data.x, data.y);
        });

        // Close on click outside (host document)
        document.addEventListener('mousedown', (e) => {
            if (!this.menu.contains(e.target as Node)) {
                this.hide();
            }
        });

        // Close on click inside the iframe canvas
        this.editor.bus.on('content:loaded', () => {
            const doc = this.editor.getIframeDocument();
            if (doc) {
                doc.addEventListener('mousedown', () => {
                    this.hide();
                });
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
    }

    private getItems(element: HTMLElement): MenuItem[] {
        return [
            {
                label: 'Duplicate',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
                action: () => {
                    const clone = element.cloneNode(true) as HTMLElement;
                    element.parentElement?.insertBefore(clone, element.nextSibling);
                    this.editor.selectionManager.selectElement(clone);
                    this.editor.pushHistory('Duplicate element');
                },
            },
            {
                label: 'Delete',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
                action: () => {
                    const parent = element.parentElement;
                    element.remove();
                    this.editor.selectionManager.clearSelection();
                    this.editor.pushHistory('Delete element');
                    if (parent) this.editor.bus.emit('dom:changed');
                },
                dividerAfter: true,
            },
            {
                label: 'Move Up',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
                action: () => {
                    const prev = element.previousElementSibling;
                    if (prev) {
                        element.parentElement?.insertBefore(element, prev);
                        this.editor.selectionManager.refreshSelectOverlay();
                        this.editor.pushHistory('Move up');
                        this.editor.bus.emit('dom:changed');
                    }
                },
                disabled: () => !element.previousElementSibling,
            },
            {
                label: 'Move Down',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
                action: () => {
                    const next = element.nextElementSibling;
                    if (next) {
                        element.parentElement?.insertBefore(next, element);
                        this.editor.selectionManager.refreshSelectOverlay();
                        this.editor.pushHistory('Move down');
                        this.editor.bus.emit('dom:changed');
                    }
                },
                disabled: () => !element.nextElementSibling,
                dividerAfter: true,
            },
            {
                label: 'Copy Styles',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22c-4.97 0-9-2.69-9-6v-.5C3 12.46 7.03 10 12 10s9 2.46 9 5.5v.5c0 3.31-4.03 6-9 6z"/></svg>',
                action: () => {
                    this.clipboard.copy(element);
                },
            },
            {
                label: 'Paste Styles',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
                action: () => {
                    if (this.clipboard.paste(element)) {
                        this.editor.selectionManager.refreshSelectOverlay();
                        this.editor.pushHistory('Paste styles');
                    }
                },
                disabled: () => !this.clipboard.hasData(),
                dividerAfter: true,
            },
            {
                label: 'Wrap in Container',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/></svg>',
                action: () => {
                    const wrapper = element.ownerDocument.createElement('div');
                    wrapper.style.cssText = 'padding: 16px;';
                    element.parentElement?.insertBefore(wrapper, element);
                    wrapper.appendChild(element);
                    this.editor.selectionManager.selectElement(wrapper);
                    this.editor.pushHistory('Wrap in container');
                    this.editor.bus.emit('dom:changed');
                },
            },
            {
                label: 'Unwrap',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
                action: () => {
                    const parent = element.parentElement;
                    if (!parent || parent.tagName === 'BODY') return;
                    const children = Array.from(element.childNodes);
                    children.forEach(child => parent.insertBefore(child, element));
                    element.remove();
                    this.editor.selectionManager.clearSelection();
                    this.editor.pushHistory('Unwrap element');
                    this.editor.bus.emit('dom:changed');
                },
                disabled: () => element.children.length === 0,
                dividerAfter: true,
            },
            {
                label: 'Save as Component',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
                action: () => {
                    const name = prompt('Component name:', element.tagName.toLowerCase() + ' component');
                    if (!name) return;
                    try {
                        // Clone and strip editor artifacts before saving
                        const clone = element.cloneNode(true) as HTMLElement;
                        clone.querySelectorAll('.se-drag-handle').forEach(h => h.remove());
                        clone.classList.remove('se-draggable');
                        clone.removeAttribute('draggable');
                        // Also clean nested elements
                        clone.querySelectorAll('.se-draggable').forEach(el => {
                            el.classList.remove('se-draggable');
                            el.removeAttribute('draggable');
                        });

                        const stored = JSON.parse(localStorage.getItem(COMPONENTS_KEY) || '[]');
                        stored.push({
                            id: 'comp_' + Date.now(),
                            name,
                            tag: element.tagName.toLowerCase(),
                            html: clone.outerHTML,
                            created: Date.now()
                        });
                        localStorage.setItem(COMPONENTS_KEY, JSON.stringify(stored));
                        this.editor.bus.emit('component:saved');
                        showToast(`Component "${name}" saved`);
                    } catch {
                        showToast('Failed to save component');
                    }
                },
            },
        ];
    }

    private show(element: HTMLElement, x: number, y: number): void {
        this.menu.innerHTML = '';
        const items = this.getItems(element);

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'context-menu-item';
            const isDisabled = item.disabled?.() ?? false;
            if (isDisabled) btn.classList.add('disabled');

            btn.innerHTML = `<span class="ctx-icon">${item.icon}</span><span class="ctx-label">${item.label}</span>`;

            if (!isDisabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hide();
                });
            }

            this.menu.appendChild(btn);

            if (item.dividerAfter) {
                const div = document.createElement('div');
                div.className = 'context-menu-divider';
                this.menu.appendChild(div);
            }
        });

        // Position: ensure it stays within viewport
        this.menu.style.display = 'block';
        const rect = this.menu.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 8;
        const maxY = window.innerHeight - rect.height - 8;

        this.menu.style.left = Math.min(x, maxX) + 'px';
        this.menu.style.top = Math.min(y, maxY) + 'px';
    }

    private hide(): void {
        this.menu.style.display = 'none';
    }
}
