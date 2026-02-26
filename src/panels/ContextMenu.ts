import { EditorCore } from '../editor/EditorCore';
import { StyleClipboard } from '../utils/StyleClipboard';

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

        // Close on click outside
        document.addEventListener('mousedown', (e) => {
            if (!this.menu.contains(e.target as Node)) {
                this.hide();
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
                icon: '⧉',
                action: () => {
                    const clone = element.cloneNode(true) as HTMLElement;
                    element.parentElement?.insertBefore(clone, element.nextSibling);
                    this.editor.selectionManager.selectElement(clone);
                    this.editor.pushHistory('Duplicate element');
                },
            },
            {
                label: 'Delete',
                icon: '🗑',
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
                icon: '↑',
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
                icon: '↓',
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
                icon: '🎨',
                action: () => {
                    this.clipboard.copy(element);
                },
            },
            {
                label: 'Paste Styles',
                icon: '📋',
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
                icon: '☐',
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
                icon: '⊡',
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
