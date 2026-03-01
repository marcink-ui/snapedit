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
    public isReadOnly: boolean = false;
    private ws: WebSocket | null = null;
    private currentProjectUrl: string | null = null;
    private resizeObserver: MutationObserver | null = null;
    private contentResizeObserver: ResizeObserver | null = null;
    private resizeLocked: boolean = false;
    private dragAbortController: AbortController | null = null;

    // ── Auto-Save & Multi-User ──────────────────────────────
    private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
    private isDirty: boolean = false;
    private reconnectAttempts: number = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    public userName: string = '';
    public currentProjectSlug: string | null = null;

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

        // Resolve user identity
        this.userName = this.getUserName();

        // Warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty && !this.isReadOnly) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes.';
            }
        });
    }

    /** Get or prompt for user name */
    getUserName(): string {
        let name = localStorage.getItem('snapedit-username');
        if (!name) {
            name = prompt('Podaj swoje imię (dla identyfikacji w trybie multi-user):') || 'Anonymous';
            localStorage.setItem('snapedit-username', name);
        }
        return name;
    }

    /** Load a multi-file project by URL (served externally) */
    loadFromURL(url: string): void {
        this.currentProjectUrl = url;
        // Extract slug from URL like '/projects/my-project/' → 'my-project'
        const slugMatch = url.match(/\/projects\/([a-z0-9_-]+)/);
        this.currentProjectSlug = slugMatch ? slugMatch[1] : null;
        this.isDirty = false;
        this.connectWebSocket(url);

        // Disconnect old observers
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.contentResizeObserver) {
            this.contentResizeObserver.disconnect();
            this.contentResizeObserver = null;
        }

        this.iframe.src = url;
        this.iframe.onload = () => {
            const doc = this.iframe.contentDocument;
            if (!doc) return;

            // Inject editor-specific CSS constraints
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
                    this.selectionManager.selectElement(target);
                    const iframeRect = this.iframe.getBoundingClientRect();
                    const scrollY = this.canvasWrapper.closest('#canvas-area')?.scrollTop || 0;
                    this.bus.emit('element:contextmenu', {
                        element: target,
                        x: e.clientX + iframeRect.left,
                        y: e.clientY + iframeRect.top - scrollY,
                    });
                });

                this.bus.emit('content:loaded');
            }, 200);
        };
    }

    private connectWebSocket(url: string): void {
        if (this.ws) {
            this.ws.close();
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Connect to the WebSocket server
        // In production: wss://host/ws (via Nginx proxy)
        // In development: ws://localhost:8081 (direct, same server)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = window.location.hostname === 'localhost'
            ? `ws://${window.location.hostname}:8081`
            : `${protocol}//${window.location.host}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[WS] Connected');
            this.reconnectAttempts = 0;

            // Identify ourselves
            this.ws?.send(JSON.stringify({ type: 'IDENTIFY', userName: this.userName }));

            // Request lock for the project
            this.ws?.send(JSON.stringify({ type: 'REQUEST_LOCK', projectUrl: url }));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'LOCK_DENIED':
                    case 'PROJECT_LOCKED':
                        this.setReadOnlyMode(true, data.lockedByName || 'Someone');
                        break;

                    case 'LOCK_GRANTED':
                        // If we were read-only, reload from server to get latest content
                        if (this.isReadOnly && this.currentProjectUrl) {
                            this.iframe.contentWindow?.location.reload();
                        }
                        this.setReadOnlyMode(false);
                        break;

                    case 'PROJECT_FREED':
                        // Someone released the lock — try to claim it
                        this.ws?.send(JSON.stringify({ type: 'REQUEST_LOCK', projectUrl: url }));
                        break;

                    case 'SAVE_OK':
                        this.isDirty = false;
                        this.bus.emit('editor:saveStatus', 'saved');
                        break;

                    case 'SAVE_ERROR':
                        this.bus.emit('editor:saveStatus', 'error');
                        console.error('[WS] Save error:', data.error);
                        break;

                    case 'CONTENT_UPDATED':
                        // Another user saved — reload iframe to see their changes
                        if (this.isReadOnly) {
                            this.iframe.contentWindow?.location.reload();
                        }
                        break;
                }
            } catch (e) {
                console.error('[WS] Error parsing message', e);
            }
        };

        this.ws.onclose = () => {
            console.log('[WS] Disconnected');
            // Auto-reconnect with exponential backoff
            if (this.currentProjectUrl) {
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                this.reconnectAttempts++;
                console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
                this.reconnectTimer = setTimeout(() => {
                    if (this.currentProjectUrl) {
                        this.connectWebSocket(this.currentProjectUrl);
                    }
                }, delay);
            }
        };

        this.ws.onerror = (err) => {
            console.error('[WS] Error:', err);
        };
    }

    public setReadOnlyMode(readOnly: boolean, lockedByName?: string): void {
        this.isReadOnly = readOnly;
        this.bus.emit('editor:readonlyStatus', { readOnly, lockedByName: lockedByName || '' });

        if (readOnly) {
            this.selectionManager.setEnabled(false);
            if (this.inlineEditor.isEditing()) {
                this.inlineEditor.stopEditing();
            }
            this.iframe.style.pointerEvents = 'none'; // Prevent any interactions in iframe
            this.hoverOverlay.style.display = 'none';
            this.selectOverlay.style.display = 'none';
        } else {
            this.selectionManager.setEnabled(true);
            this.iframe.style.pointerEvents = 'auto';
            this.hoverOverlay.style.display = 'block';
            this.selectOverlay.style.display = 'block';
        }
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
        this.triggerAutoSave();
    }

    /** Trigger debounced auto-save (2 seconds after last change) */
    public triggerAutoSave(): void {
        if (this.isReadOnly || !this.currentProjectUrl) return;

        this.isDirty = true;
        this.bus.emit('editor:saveStatus', 'saving');

        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, 2000);
    }

    /** Save current content to server via WebSocket */
    private autoSave(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.bus.emit('editor:saveStatus', 'error');
            return;
        }
        if (!this.currentProjectUrl) return;

        const html = this.exportHTML();
        this.ws.send(JSON.stringify({
            type: 'SAVE_CONTENT',
            projectUrl: this.currentProjectUrl,
            html: html,
        }));
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

        setTimeout(() => {
            const rect = img.getBoundingClientRect();
            const scrollArea = document.getElementById('canvas-area');
            if (scrollArea) {
                scrollArea.scrollTo({
                    top: scrollArea.scrollTop + rect.top - (scrollArea.clientHeight / 2) + (rect.height / 2),
                    behavior: 'smooth'
                });
            }
        }, 100);

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

        // Grab a reference to the top-level element we are inserting
        const newEl = frag.firstElementChild as HTMLElement;

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

        if (newEl) {
            setTimeout(() => {
                const rect = newEl.getBoundingClientRect();
                const scrollArea = document.getElementById('canvas-area');
                if (scrollArea) {
                    scrollArea.scrollTo({
                        top: scrollArea.scrollTop + rect.top - (scrollArea.clientHeight / 2) + (rect.height / 2),
                        behavior: 'smooth'
                    });
                }
            }, 100);
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

        // Fully remove drag artifacts before snapshotting
        const handles = Array.from(doc.querySelectorAll('.se-drag-handle'));
        const dragStyles = doc.getElementById('se-drag-styles');
        const overrides = doc.getElementById('se-editor-overrides');
        const draggables = Array.from(doc.querySelectorAll('.se-draggable'));

        handles.forEach(h => h.remove());
        if (dragStyles) dragStyles.remove();
        if (overrides) overrides.remove();
        draggables.forEach(el => {
            el.classList.remove('se-draggable');
            (el as HTMLElement).removeAttribute('draggable');
        });

        const html = doc.documentElement.outerHTML;

        // Restore editor artifacts
        if (overrides) doc.head.appendChild(overrides);
        if (dragStyles) doc.head.appendChild(dragStyles);
        draggables.forEach(el => {
            el.classList.add('se-draggable');
            (el as HTMLElement).draggable = true;
        });
        handles.forEach((h, i) => {
            if (draggables[i]) draggables[i].insertBefore(h, draggables[i].firstChild);
        });

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

        // ── Abort previous listeners to prevent stacking ──────────────
        if (this.dragAbortController) {
            this.dragAbortController.abort();
        }
        this.dragAbortController = new AbortController();
        const signal = this.dragAbortController.signal;

        // ── Clean up stale DOM artifacts (handles, classes) ──────────
        doc.querySelectorAll('.se-drag-handle').forEach(h => h.remove());
        doc.querySelectorAll('.se-draggable').forEach(el => {
            el.classList.remove('se-draggable');
            (el as HTMLElement).removeAttribute('draggable');
            // Remove inline position we may have added
            if ((el as HTMLElement).style.position === 'relative' &&
                (el as HTMLElement).dataset.sePositioned) {
                (el as HTMLElement).style.position = '';
                delete (el as HTMLElement).dataset.sePositioned;
            }
        });

        // ── Inject drag styles (once) ────────────────────────────────
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
                .se-draggable:hover > .se-drag-handle {
                    opacity: 1;
                }
                .se-drag-over {
                    outline: 2px solid #4361ee !important;
                    outline-offset: -2px;
                }
                .se-drag-over-bottom {
                    outline: 2px solid #4361ee !important;
                    outline-offset: -2px;
                }
                .se-drag-over::before {
                    content: '';
                    position: absolute;
                    left: 0; right: 0; top: 0;
                    height: 3px;
                    background: #4361ee;
                    z-index: 999;
                    pointer-events: none;
                }
                .se-drag-over-bottom::after {
                    content: '';
                    position: absolute;
                    left: 0; right: 0; bottom: 0;
                    height: 3px;
                    background: #4361ee;
                    z-index: 999;
                    pointer-events: none;
                }
                .se-dragging {
                    opacity: 0.4;
                    pointer-events: none;
                }
            `;
            doc.head.appendChild(styleEl);
        }

        // ── Configuration ─────────────────────────────────────────────
        const containerTags = new Set(['BODY', 'SECTION', 'DIV', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'NAV', 'UL', 'OL', 'FORM']);
        const skipTags = new Set(['STYLE', 'SCRIPT', 'LINK', 'META', 'BR', 'HR']);

        // Track the currently-dragged element (avoids fragile querySelector)
        let draggingEl: HTMLElement | null = null;

        // ── Recursive setup ──────────────────────────────────────────
        const makeDraggable = (container: HTMLElement) => {
            const children = Array.from(container.children).filter(
                el => !el.classList.contains('se-drag-handle') && !skipTags.has(el.tagName)
            );
            if (children.length === 0) return;

            children.forEach(child => {
                const el = child as HTMLElement;

                el.classList.add('se-draggable');
                el.draggable = true;

                // Only add position:relative if the element isn't already positioned
                const pos = el.style.position || '';
                if (!pos || pos === 'static') {
                    el.style.position = 'relative';
                    el.dataset.sePositioned = '1';
                }
                // Ensure overflow visible for the handle
                el.style.overflow = 'visible';

                // Insert drag handle
                const handle = doc!.createElement('div');
                handle.className = 'se-drag-handle';
                handle.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
                handle.draggable = true;
                el.insertBefore(handle, el.firstChild);

                // ── Drag events (all use AbortController signal) ──
                el.addEventListener('dragstart', (e: DragEvent) => {
                    if (!this.editorEnabled) return;
                    e.stopPropagation();
                    e.dataTransfer?.setData('text/plain', '');
                    e.dataTransfer!.effectAllowed = 'move';
                    draggingEl = el;
                    // Defer the class add so the browser captures the original look
                    requestAnimationFrame(() => el.classList.add('se-dragging'));
                }, { signal });

                el.addEventListener('dragend', () => {
                    el.classList.remove('se-dragging');
                    draggingEl = null;
                    doc!.querySelectorAll('.se-drag-over, .se-drag-over-bottom').forEach(d => {
                        d.classList.remove('se-drag-over', 'se-drag-over-bottom');
                    });
                    this.requestResize();
                }, { signal });

                el.addEventListener('dragover', (e: DragEvent) => {
                    if (!this.editorEnabled || !draggingEl) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer!.dropEffect = 'move';

                    // Prevent dropping on self or inside self
                    if (draggingEl === el || draggingEl.contains(el)) return;

                    // Clear other indicators
                    doc!.querySelectorAll('.se-drag-over, .se-drag-over-bottom').forEach(d => {
                        if (d !== el) d.classList.remove('se-drag-over', 'se-drag-over-bottom');
                    });

                    const rect = el.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    if (e.clientY < mid) {
                        el.classList.add('se-drag-over');
                        el.classList.remove('se-drag-over-bottom');
                    } else {
                        el.classList.add('se-drag-over-bottom');
                        el.classList.remove('se-drag-over');
                    }
                }, { signal });

                el.addEventListener('dragleave', () => {
                    el.classList.remove('se-drag-over', 'se-drag-over-bottom');
                }, { signal });

                el.addEventListener('drop', (e: DragEvent) => {
                    if (!this.editorEnabled) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const isBottom = el.classList.contains('se-drag-over-bottom');
                    el.classList.remove('se-drag-over', 'se-drag-over-bottom');

                    // Allow cross-section moves — only prevent drop on self or inside self
                    if (draggingEl && draggingEl !== el && !draggingEl.contains(el)) {
                        if (isBottom) {
                            el.parentNode?.insertBefore(draggingEl, el.nextSibling);
                        } else {
                            el.parentNode?.insertBefore(draggingEl, el);
                        }
                        draggingEl.classList.remove('se-dragging');
                        draggingEl = null;
                        this.requestResize();
                        this.pushHistory('Move element');
                        this.bus.emit('dom:changed');
                    }
                }, { signal });

                // Recursively set up drag on children if this is a container
                if (containerTags.has(el.tagName) && el.children.length > 1) {
                    makeDraggable(el);
                }
            });
        };

        makeDraggable(doc.body);
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
                // Don't delete elements when a sidebar input/select/textarea has focus
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return;
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
