import { EditorCore } from '../editor/EditorCore';
import { showToast } from '../utils/dom-helpers';

type EditorMode = 'edit' | 'view' | 'comment';

interface Comment {
    id: string;
    x: number;
    y: number;
    text: string;
    author: string;
    timestamp: number;
    resolved: boolean;
}

/**
 * FloatingToolbar — Miro/Figma-style bottom bar with edit/view modes and comments.
 */
export class FloatingToolbar {
    private editor: EditorCore;
    private bar!: HTMLDivElement;
    private currentMode: EditorMode = 'edit';
    private comments: Comment[] = [];
    private commentOverlay: HTMLDivElement | null = null;
    private commentPins: Map<string, HTMLElement> = new Map();

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.createBar();
        this.loadComments();
    }

    private createBar(): void {
        this.bar = document.createElement('div');
        this.bar.id = 'floating-toolbar';
        this.bar.innerHTML = `
            <div class="ft-group ft-modes">
                <button class="ft-btn ft-active" data-mode="edit" title="Edit Mode — click elements to edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span>Edit</span>
                </button>
                <button class="ft-btn" data-mode="view" title="View Mode — browse without editing">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>View</span>
                </button>
                <button class="ft-btn" data-mode="comment" title="Comment Mode — leave annotations">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span>Comment</span>
                    <span class="ft-badge" id="ft-comment-count" style="display:none">0</span>
                </button>
            </div>
            <div class="ft-divider"></div>
            <div class="ft-group ft-zoom">
                <button class="ft-btn ft-icon-only" id="ft-zoom-out" title="Zoom Out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>
                <span class="ft-zoom-label" id="ft-zoom-value">100%</span>
                <button class="ft-btn ft-icon-only" id="ft-zoom-in" title="Zoom In">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>
            </div>
            <div class="ft-divider"></div>
            <div class="ft-group">
                <button class="ft-btn ft-icon-only" id="ft-undo" title="Undo (Ctrl+Z)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1014.85-3.36L3.51 15A9 9 0 003.51 15"/>
                    </svg>
                </button>
                <button class="ft-btn ft-icon-only" id="ft-redo" title="Redo (Ctrl+Shift+Z)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-14.85-3.36L20.49 15"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(this.bar);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Mode buttons
        this.bar.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = (btn as HTMLElement).dataset.mode as EditorMode;
                this.setMode(mode);
            });
        });

        // Zoom buttons
        document.getElementById('ft-zoom-in')?.addEventListener('click', () => this.zoom(10));
        document.getElementById('ft-zoom-out')?.addEventListener('click', () => this.zoom(-10));

        // Undo / Redo
        document.getElementById('ft-undo')?.addEventListener('click', () => this.editor.undo());
        document.getElementById('ft-redo')?.addEventListener('click', () => this.editor.redo());

        // Sync zoom display with existing breakpoint/zoom slider
        this.editor.bus.on('zoom:change', (data: { zoom: number }) => {
            const label = document.getElementById('ft-zoom-value');
            if (label) label.textContent = `${Math.round(data.zoom)}%`;
        });

        // Update undo/redo state
        this.editor.bus.on('history:change', (state: { canUndo: boolean; canRedo: boolean }) => {
            const undo = document.getElementById('ft-undo') as HTMLButtonElement;
            const redo = document.getElementById('ft-redo') as HTMLButtonElement;
            if (undo) undo.disabled = !state.canUndo;
            if (redo) redo.disabled = !state.canRedo;
        });
    }

    private setMode(mode: EditorMode): void {
        this.currentMode = mode;

        // Update active button
        this.bar.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.toggle('ft-active', (btn as HTMLElement).dataset.mode === mode);
        });

        if (mode === 'edit') {
            this.enableEditMode();
        } else if (mode === 'view') {
            this.enableViewMode();
        } else if (mode === 'comment') {
            this.enableCommentMode();
        }
    }

    private enableEditMode(): void {
        // Re-enable all editing
        this.editor.setReadOnlyMode(false);
        this.removeCommentOverlay();
        showToast('✏️ Edit mode — click elements to modify');

        // Update cursor in iframe
        const doc = this.editor.getIframeDocument();
        if (doc) doc.body.style.cursor = '';
    }

    private enableViewMode(): void {
        // Disable editing — click-through mode
        this.editor.setReadOnlyMode(true);
        this.editor.selectionManager.clearSelection();
        this.removeCommentOverlay();
        showToast('👁️ View mode — browse without editing');

        const doc = this.editor.getIframeDocument();
        if (doc) doc.body.style.cursor = 'default';
    }

    private enableCommentMode(): void {
        this.editor.setReadOnlyMode(true);
        this.editor.selectionManager.clearSelection();
        showToast('💬 Comment mode — click to leave a note');
        this.createCommentOverlay();

        const doc = this.editor.getIframeDocument();
        if (doc) doc.body.style.cursor = 'crosshair';
    }

    private createCommentOverlay(): void {
        this.removeCommentOverlay();

        const canvasArea = document.getElementById('canvas-area');
        if (!canvasArea) return;

        this.commentOverlay = document.createElement('div');
        this.commentOverlay.id = 'comment-overlay';
        this.commentOverlay.style.cssText = 'position:absolute;inset:0;z-index:50;cursor:crosshair;pointer-events:auto;';
        canvasArea.style.position = 'relative';
        canvasArea.appendChild(this.commentOverlay);

        // Render existing comment pins
        this.renderCommentPins();

        // Click to add new comment
        this.commentOverlay.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.comment-pin')) return;
            const rect = this.commentOverlay!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.showCommentInput(x, y);
        });
    }

    private removeCommentOverlay(): void {
        if (this.commentOverlay) {
            this.commentOverlay.remove();
            this.commentOverlay = null;
        }
        this.commentPins.clear();
    }

    private renderCommentPins(): void {
        if (!this.commentOverlay) return;
        // Clear existing pins
        this.commentPins.forEach(pin => pin.remove());
        this.commentPins.clear();

        this.comments.filter(c => !c.resolved).forEach((comment, idx) => {
            const pin = document.createElement('div');
            pin.className = 'comment-pin';
            pin.style.cssText = `position:absolute;left:${comment.x}px;top:${comment.y}px;width:28px;height:28px;background:#818cf8;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:51;transition:transform .15s;font-size:12px;font-weight:700;color:#fff;`;
            pin.innerHTML = `<span style="transform:rotate(45deg)">${idx + 1}</span>`;
            pin.title = comment.text;

            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCommentPopup(comment, pin);
            });

            this.commentOverlay!.appendChild(pin);
            this.commentPins.set(comment.id, pin);
        });

        // Update badge
        const badge = document.getElementById('ft-comment-count');
        const unresolvedCount = this.comments.filter(c => !c.resolved).length;
        if (badge) {
            badge.textContent = String(unresolvedCount);
            badge.style.display = unresolvedCount > 0 ? 'inline-flex' : 'none';
        }
    }

    private showCommentInput(x: number, y: number): void {
        // Remove existing input if any
        document.querySelector('.comment-input-popup')?.remove();

        const popup = document.createElement('div');
        popup.className = 'comment-input-popup';
        popup.style.cssText = `position:absolute;left:${x + 16}px;top:${y - 8}px;background:#1e1e2e;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;width:240px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:52;font-family:Inter,sans-serif;`;

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Add a comment...';
        textarea.style.cssText = 'width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;color:#fff;font-size:13px;resize:none;height:60px;font-family:Inter,sans-serif;outline:none;';

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:8px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding:4px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.6);font-size:12px;cursor:pointer;';
        cancelBtn.addEventListener('click', () => popup.remove());

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Add';
        saveBtn.style.cssText = 'padding:4px 16px;border-radius:6px;border:none;background:#818cf8;color:#fff;font-size:12px;font-weight:600;cursor:pointer;';
        saveBtn.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (!text) return;

            const comment: Comment = {
                id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
                x,
                y,
                text,
                author: this.editor.userName || 'Anonymous',
                timestamp: Date.now(),
                resolved: false,
            };
            this.comments.push(comment);
            this.saveComments();
            this.renderCommentPins();
            popup.remove();
            showToast('💬 Comment added');
        });

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        popup.appendChild(textarea);
        popup.appendChild(actions);
        this.commentOverlay?.appendChild(popup);

        requestAnimationFrame(() => textarea.focus());

        // ESC to cancel
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') popup.remove();
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveBtn.click(); }
        });
    }

    private showCommentPopup(comment: Comment, anchor: HTMLElement): void {
        document.querySelector('.comment-view-popup')?.remove();

        const rect = anchor.getBoundingClientRect();
        const overlayRect = this.commentOverlay?.getBoundingClientRect() || { left: 0, top: 0 };

        const popup = document.createElement('div');
        popup.className = 'comment-view-popup';
        popup.style.cssText = `position:absolute;left:${comment.x + 36}px;top:${comment.y - 8}px;background:#1e1e2e;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:52;font-family:Inter,sans-serif;`;

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
        header.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px">
                <div style="width:24px;height:24px;border-radius:50%;background:#818cf8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">${(comment.author || 'A')[0].toUpperCase()}</div>
                <div>
                    <div style="font-size:13px;font-weight:600;color:#fff">${comment.author}</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.4)">${new Date(comment.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `;

        const text = document.createElement('p');
        text.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.8);line-height:1.5;margin:0 0 10px;';
        text.textContent = comment.text;

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;';

        const resolveBtn = document.createElement('button');
        resolveBtn.textContent = '✓ Resolve';
        resolveBtn.style.cssText = 'padding:4px 12px;border-radius:6px;border:none;background:rgba(34,197,94,0.15);color:#22c55e;font-size:11px;font-weight:600;cursor:pointer;';
        resolveBtn.addEventListener('click', () => {
            comment.resolved = true;
            this.saveComments();
            this.renderCommentPins();
            popup.remove();
            showToast('Comment resolved ✓');
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑 Delete';
        deleteBtn.style.cssText = 'padding:4px 12px;border-radius:6px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;font-size:11px;font-weight:600;cursor:pointer;';
        deleteBtn.addEventListener('click', () => {
            this.comments = this.comments.filter(c => c.id !== comment.id);
            this.saveComments();
            this.renderCommentPins();
            popup.remove();
            showToast('Comment deleted');
        });

        actions.appendChild(resolveBtn);
        actions.appendChild(deleteBtn);
        popup.appendChild(header);
        popup.appendChild(text);
        popup.appendChild(actions);
        this.commentOverlay?.appendChild(popup);

        // Close on outside click
        const closeHandler = (e: MouseEvent) => {
            if (!popup.contains(e.target as Node) && e.target !== anchor) {
                popup.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);
    }

    private zoom(delta: number): void {
        // Trigger zoom change via the existing breakpoint manager slider
        const slider = document.getElementById('zoom-slider') as HTMLInputElement;
        if (slider) {
            const current = parseInt(slider.value, 10) || 100;
            slider.value = String(Math.max(25, Math.min(200, current + delta)));
            slider.dispatchEvent(new Event('input'));
        }
    }

    private saveComments(): void {
        const key = `snapedit-comments-${window.location.pathname}`;
        localStorage.setItem(key, JSON.stringify(this.comments));
    }

    private loadComments(): void {
        const key = `snapedit-comments-${window.location.pathname}`;
        try {
            const stored = localStorage.getItem(key);
            if (stored) this.comments = JSON.parse(stored);
        } catch { /* ignore */ }
    }
}
