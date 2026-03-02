import { EventBus } from '../utils/EventBus';
import { isTextElement } from '../utils/dom-helpers';

export class InlineEditor {
    private iframe: HTMLIFrameElement;
    private bus: EventBus;
    private editingElement: HTMLElement | null = null;
    private originalOutline: string = '';
    private originalCursor: string = '';

    constructor(iframe: HTMLIFrameElement, bus: EventBus) {
        this.iframe = iframe;
        this.bus = bus;
    }

    init(): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        doc.addEventListener('dblclick', this.onDoubleClick.bind(this));
        doc.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    isEditing(): boolean {
        return this.editingElement !== null;
    }

    stopEditing(): void {
        if (!this.editingElement) return;
        this.editingElement.contentEditable = 'false';
        this.editingElement.style.outline = this.originalOutline;
        this.editingElement.style.cursor = this.originalCursor;
        this.editingElement.blur();

        // Remove selection
        const doc = this.iframe.contentDocument;
        if (doc) {
            const sel = doc.getSelection();
            sel?.removeAllRanges();
        }

        this.bus.emit('inline:stop', this.editingElement);
        this.editingElement = null;
    }

    /** Public method to start editing a given element. Called by re-click or dblclick. */
    startEditing(el: HTMLElement): void {
        if (!el || !isTextElement(el)) return;

        // Stop any existing editing
        if (this.editingElement) {
            this.stopEditing();
        }

        this.editingElement = el;
        this.originalOutline = el.style.outline;
        this.originalCursor = el.style.cursor;

        el.contentEditable = 'true';
        el.style.outline = '2px solid #4361ee';
        el.style.cursor = 'text';

        el.focus();

        // Select all text in the element
        const doc = this.iframe.contentDocument;
        if (doc) {
            const range = doc.createRange();
            range.selectNodeContents(el);
            const sel = doc.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

        this.bus.emit('inline:start', el);
    }

    private onDoubleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target || !isTextElement(target)) return;

        e.preventDefault();
        e.stopPropagation();

        this.startEditing(target);
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (!this.editingElement) return;

        if (e.key === 'Escape') {
            this.stopEditing();
        }
    }
}
