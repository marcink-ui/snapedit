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

    private onDoubleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target || !isTextElement(target)) return;

        e.preventDefault();
        e.stopPropagation();

        // Stop any existing editing
        if (this.editingElement) {
            this.stopEditing();
        }

        this.editingElement = target;
        this.originalOutline = target.style.outline;
        this.originalCursor = target.style.cursor;

        target.contentEditable = 'true';
        target.style.outline = '2px solid #4361ee';
        target.style.cursor = 'text';

        target.focus();

        // Select all text in the element
        const doc = this.iframe.contentDocument;
        if (doc) {
            const range = doc.createRange();
            range.selectNodeContents(target);
            const sel = doc.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

        this.bus.emit('inline:start', target);
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (!this.editingElement) return;

        if (e.key === 'Escape') {
            this.stopEditing();
        }
    }
}
