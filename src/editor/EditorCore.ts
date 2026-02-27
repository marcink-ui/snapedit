import { EventBus } from '../utils/EventBus';
import { SelectionManager } from './SelectionManager';
import { InlineEditor } from './InlineEditor';
import { StyleMutator } from './StyleMutator';
import { HistoryManager } from './HistoryManager';
import { DEMO_HTML } from '../demo-content';

export class EditorCore {
    private iframe: HTMLIFrameElement;
    private hoverOverlay: HTMLElement;
    private selectOverlay: HTMLElement;
    private canvasWrapper: HTMLElement;

    public bus: EventBus;
    public selectionManager: SelectionManager;
    public inlineEditor: InlineEditor;
    public styleMutator: StyleMutator;
    public history: HistoryManager;
    private editorEnabled: boolean = true;
    private resizeObserver: MutationObserver | null = null;
    private contentResizeObserver: ResizeObserver | null = null;
    private resizeLocked: boolean = false;

    constructor() {
        this.iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
        this.hoverOverlay = document.getElementById('hover-overlay') as HTMLElement;
        this.selectOverlay = document.getElementById('select-overlay') as HTMLElement;
        this.canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;

        this.bus = new EventBus();
        this.history = new HistoryManager(this.bus);
        this.selectionManager = new SelectionManager(
            this.iframe,
            this.hoverOverlay,
            this.selectOverlay,
            this.canvasWrapper,
            this.bus
        );
        this.inlineEditor = new InlineEditor(this.iframe, this.bus);
        this.styleMutator = new StyleMutator();
    }

    init(): void {
        this.loadContent(DEMO_HTML);
        this.setupKeyboardShortcuts();
    }

    loadContent(html: string): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        // Disconnect old observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.contentResizeObserver) {
            this.contentResizeObserver.disconnect();
            this.contentResizeObserver = null;
        }

        doc.open();
        doc.write(html);
        doc.close();

        // Inject editor-specific CSS constraints to prevent inner scrolling and force full height expansion
        const editorStyle = doc.createElement('style');
        editorStyle.id = 'se-editor-overrides';
        editorStyle.textContent = `
            html, body {
                height: auto !important;
                overflow: visible !important;
            }
            body > div {
                height: auto !important;
                overflow: visible !important;
            }
        `;
        doc.head.appendChild(editorStyle);

        // Wait for content to render
        setTimeout(() => {
            this.autoResizeIframe();
            this.setupDragAndDrop();
            this.selectionManager.init();
            this.inlineEditor.init();

            // Save initial history state
            this.history.saveInitial(this.getContentHTML());

            // Re-apply drag/drop handlers when DOM changes
            this.bus.on('dom:changed', () => {
                this.setupDragAndDrop();
                this.requestResize();
            });

            // Click on body clears selection
            doc.addEventListener('click', (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target === doc.body || target === doc.documentElement) {
                    this.selectionManager.clearSelection();
                }
            });

            // Stop inline editing when clicking outside the editing element
            doc.addEventListener('mousedown', (e: MouseEvent) => {
                if (this.inlineEditor.isEditing()) {
                    const target = e.target as HTMLElement;
                    const selected = this.selectionManager.getSelectedElement();
                    if (target !== selected && !selected?.contains(target)) {
                        this.inlineEditor.stopEditing();
                    }
                }
            });

            // Prevent selection overlay from overlapping with inline edit outline
            this.bus.on('inline:start', () => {
                this.selectionManager.setEnabled(false);
            });
            this.bus.on('inline:stop', (el: HTMLElement) => {
                this.selectionManager.setEnabled(true);
                this.selectionManager.selectElement(el);
            });


            // Right-click context menu forwarding
            doc.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                const target = e.target as HTMLElement;
                if (target === doc.body || target === doc.documentElement) return;
                // Select the element first
                this.selectionManager.selectElement(target);
                // Convert iframe coords to host page coords
                const iframeRect = this.iframe.getBoundingClientRect();
                const scrollY = this.canvasWrapper.closest('#canvas-area')?.scrollTop || 0;
                this.bus.emit('element:contextmenu', {
                    element: target,
                    x: e.clientX + iframeRect.left,
                    y: e.clientY + iframeRect.top - scrollY,
                });
            });

            this.bus.emit('content:loaded');
        }, 100);
    }

    /** Push current state to history (call after any user change) */
    pushHistory(label: string = 'Style change'): void {
        this.history.push(this.getContentHTML(), label);
    }

    /** Undo last change */
    undo(): void {
        const html = this.history.undo();
        if (html) {
            this.restoreContent(html);
            this.history.finishRestore();
        }
    }

    /** Redo last undone change */
    redo(): void {
        const html = this.history.redo();
        if (html) {
            this.restoreContent(html);
            this.history.finishRestore();
        }
    }

    getIframeDocument(): Document | null {
        return this.iframe.contentDocument;
    }

    toggleEditor(): void {
        this.editorEnabled = !this.editorEnabled;
        this.selectionManager.setEnabled(this.editorEnabled);

        const canvasArea = document.getElementById('canvas-area');
        if (canvasArea) {
            canvasArea.classList.toggle('editor-disabled', !this.editorEnabled);
        }

        if (this.inlineEditor.isEditing()) {
            this.inlineEditor.stopEditing();
        }

        this.bus.emit('editor:toggle', this.editorEnabled);
    }

    isEditorEnabled(): boolean {
        return this.editorEnabled;
    }

    exportHTML(): string {
        const doc = this.iframe.contentDocument;
        if (!doc) return '';

        // Stop any inline editing first
        if (this.inlineEditor.isEditing()) {
            this.inlineEditor.stopEditing();
        }

        // Remove drag handles before export
        doc.querySelectorAll('.se-drag-handle').forEach(h => h.remove());

        const overrides = doc.getElementById('se-editor-overrides');
        if (overrides) overrides.remove();

        const html = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;

        if (overrides) doc.head.appendChild(overrides);

        // Re-add drag handles
        this.setupDragAndDrop();

        return html;
    }

    /**
     * Insert an image into the iframe at the currently selected element or at the end.
     */
    insertImage(src: string, alt: string = 'Image'): void {
        const doc = this.iframe.contentDocument;
        if (!doc?.body) return;

        const img = doc.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 16px 0; border-radius: 8px;';

        const selected = this.selectionManager.getSelectedElement();
        if (selected && selected !== doc.body && selected !== doc.documentElement) {
            selected.parentNode?.insertBefore(img, selected.nextSibling);
        } else {
            doc.body.appendChild(img);
        }

        this.selectionManager.clearSelection();
        this.bus.emit('selection:change', img);
        this.requestResize();
        this.pushHistory('Insert image');
    }

    /**
     * Insert raw HTML string into the editor, either inside the selected element or at the end of the body.
     */
    insertHTML(htmlString: string): void {
        const doc = this.iframe.contentDocument;
        if (!doc?.body) return;

        const range = doc.createRange();
        const frag = range.createContextualFragment(htmlString);

        const selected = this.selectionManager.getSelectedElement();
        if (selected && selected !== doc.body && selected !== doc.documentElement) {
            // If they selected a layout wrapper, insert inside it. Otherwise, insert after it.
            if (selected.tagName === 'SECTION' || selected.tagName === 'DIV' || selected.tagName === 'HEADER' || selected.tagName === 'FOOTER') {
                selected.appendChild(frag);
            } else {
                selected.parentNode?.insertBefore(frag, selected.nextSibling);
            }
        } else {
            doc.body.appendChild(frag);
        }

        this.requestResize();
        this.pushHistory('Insert structural block');
    }

    /** Manually trigger an iframe resize */
    requestResize(): void {
        this.doResize();
    }

    /** Get the inner HTML content (for history snapshots) */
    private getContentHTML(): string {
        const doc = this.iframe.contentDocument;
        if (!doc) return '';
        // Remove drag handles before snapshotting
        const handles = doc.querySelectorAll('.se-drag-handle, #se-drag-styles');
        handles.forEach(h => (h as HTMLElement).style.display = 'none');

        const overrides = doc.getElementById('se-editor-overrides');
        if (overrides) overrides.remove();

        const html = doc.documentElement.outerHTML;

        if (overrides) doc.head.appendChild(overrides);
        handles.forEach(h => (h as HTMLElement).style.display = '');
        return html;
    }

    /** Restore content from a history snapshot without creating a new history entry */
    private restoreContent(html: string): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.contentResizeObserver) {
            this.contentResizeObserver.disconnect();
            this.contentResizeObserver = null;
        }

        doc.open();
        doc.write(`<!DOCTYPE html>\n${html}`);
        doc.close();

        // Re-inject editor-specific CSS constraints if they were lost
        if (!doc.getElementById('se-editor-overrides')) {
            const editorStyle = doc.createElement('style');
            editorStyle.id = 'se-editor-overrides';
            editorStyle.textContent = `
                html, body {
                    height: auto !important;
                    overflow: visible !important;
                }
                body > div {
                    height: auto !important;
                    overflow: visible !important;
                }
            `;
            doc.head.appendChild(editorStyle);
        }

        setTimeout(() => {
            this.autoResizeIframe();
            this.setupDragAndDrop();
            this.selectionManager.init();
            this.selectionManager.clearSelection();
            this.inlineEditor.init();
            this.bus.emit('content:loaded');
        }, 50);
    }

    private autoResizeIframe(): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.contentResizeObserver) {
            this.contentResizeObserver.disconnect();
            this.contentResizeObserver = null;
        }

        // Observe DOM mutations to trigger resize
        this.resizeObserver = new MutationObserver(() => this.doResize());
        this.resizeObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, characterData: true });

        // Observe layout resizes
        this.contentResizeObserver = new ResizeObserver(() => {
            if (!this.resizeLocked) this.doResize();
        });
        this.contentResizeObserver.observe(doc.body);

        this.doResize();
    }

    private doResize(): void {
        if (this.resizeLocked) return;
        const doc = this.iframe.contentDocument;
        if (!doc?.documentElement) return;

        this.resizeLocked = true;

        const contentHeight = doc.documentElement.offsetHeight;
        const newHeight = Math.max(800, contentHeight + 40);

        if (this.iframe.style.height !== newHeight + "px") {
            this.iframe.style.height = newHeight + "px";
            this.bus.emit('canvas:resized');
        }

        requestAnimationFrame(() => {
            this.resizeLocked = false;
        });
    }

    private setupDragAndDrop(): void {
        const doc = this.iframe.contentDocument;
        if (!doc?.body) return;

        let styleEl = doc.getElementById('se-drag-styles');
        if (!styleEl) {
            styleEl = doc.createElement('style');
            styleEl.id = 'se-drag-styles';
            styleEl.textContent = `
                .se-drag-handle {
                    position: absolute;
                    left: -28px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    cursor: grab;
                    opacity: 0;
                    transition: opacity 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(67, 97, 238, 0.1);
                    border-radius: 4px;
                    z-index: 100;
                    pointer-events: auto;
                }
                .se-drag-handle svg {
                    width: 14px;
                    height: 14px;
                    fill: #4361ee;
                }
                .se-draggable {
                    position: relative;
                }
                .se-draggable:hover > .se-drag-handle {
                    opacity: 1;
                }
                .se-drag-over {
                    border-top: 3px solid #4361ee !important;
                }
                .se-drag-over-bottom {
                    border-bottom: 3px solid #4361ee !important;
                }
                .se-dragging {
                    opacity: 0.4;
                }
            `;
            doc.head.appendChild(styleEl);
        }

        const children = Array.from(doc.body.children).filter(
            el => !el.classList.contains('se-drag-handle') && el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT'
        );

        children.forEach(child => {
            const el = child as HTMLElement;

            if (el.classList.contains('se-draggable')) return;

            el.classList.add('se-draggable');
            el.draggable = true;

            const handle = doc.createElement('div');
            handle.className = 'se-drag-handle';
            handle.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
            handle.draggable = true;
            el.insertBefore(handle, el.firstChild);

            el.addEventListener('dragstart', (e: DragEvent) => {
                if (!this.editorEnabled) return;
                e.dataTransfer?.setData('text/plain', '');
                el.classList.add('se-dragging');
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('se-dragging');
                doc.querySelectorAll('.se-drag-over, .se-drag-over-bottom').forEach(d => {
                    d.classList.remove('se-drag-over');
                    d.classList.remove('se-drag-over-bottom');
                });
                this.requestResize();
            });

            el.addEventListener('dragover', (e: DragEvent) => {
                if (!this.editorEnabled) return;
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
                doc.querySelectorAll('.se-drag-over, .se-drag-over-bottom').forEach(d => {
                    d.classList.remove('se-drag-over');
                    d.classList.remove('se-drag-over-bottom');
                });
                // Determine if cursor is in the top or bottom half
                const rect = el.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY < mid) {
                    el.classList.add('se-drag-over');
                } else {
                    el.classList.add('se-drag-over-bottom');
                }
            });

            el.addEventListener('dragleave', () => {
                el.classList.remove('se-drag-over');
                el.classList.remove('se-drag-over-bottom');
            });

            el.addEventListener('drop', (e: DragEvent) => {
                if (!this.editorEnabled) return;
                e.preventDefault();
                const isBottom = el.classList.contains('se-drag-over-bottom');
                el.classList.remove('se-drag-over');
                el.classList.remove('se-drag-over-bottom');

                const dragging = doc.querySelector('.se-dragging') as HTMLElement;
                if (dragging && dragging !== el) {
                    if (isBottom) {
                        // Insert after the target element
                        el.parentNode?.insertBefore(dragging, el.nextSibling);
                    } else {
                        // Insert before the target element
                        el.parentNode?.insertBefore(dragging, el);
                    }
                    dragging.classList.remove('se-dragging');
                    this.requestResize();
                    this.pushHistory('Reorder elements');
                    this.bus.emit('dom:changed');
                }
            });
        });
    }

    private setupKeyboardShortcuts(): void {
        const handleShortcuts = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key === 'e') {
                e.preventDefault();
                this.toggleEditor();
            }
            if (mod && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if (mod && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            }
            if (mod && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }

            // Delete selected element
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.inlineEditor.isEditing()) return;
                const selected = this.selectionManager.getSelectedElement();
                if (selected && selected.tagName !== 'BODY') {
                    e.preventDefault();
                    selected.remove();
                    this.selectionManager.clearSelection();
                    this.pushHistory('Delete element');
                    this.bus.emit('dom:changed');
                }
            }
        };

        document.addEventListener('keydown', handleShortcuts);

        this.bus.on('content:loaded', () => {
            const doc = this.iframe.contentDocument;
            if (doc) {
                doc.addEventListener('keydown', handleShortcuts);
            }
        });
    }
}
