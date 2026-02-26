import { EventBus } from '../utils/EventBus';

interface HistoryEntry {
    html: string;
    label: string;
    timestamp: number;
}

/**
 * HistoryManager — Manages undo/redo snapshots of iframe content.
 * Keeps up to 20 entries with debounced snapshot capture.
 */
export class HistoryManager {
    private stack: HistoryEntry[] = [];
    private pointer: number = -1;
    private maxEntries: number = 20;
    private bus: EventBus;
    private debounceTimer: number | null = null;
    private debounceMs: number = 300;
    private isRestoring: boolean = false;

    constructor(bus: EventBus) {
        this.bus = bus;
    }

    /** Save the initial state */
    saveInitial(html: string): void {
        this.stack = [{ html, label: 'Initial', timestamp: Date.now() }];
        this.pointer = 0;
        this.emitChange();
    }

    /** Push a new snapshot (debounced to batch rapid changes) */
    push(html: string, label: string = 'Change'): void {
        if (this.isRestoring) return;

        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            this.doPush(html, label);
            this.debounceTimer = null;
        }, this.debounceMs);
    }

    /** Push immediately without debounce */
    pushImmediate(html: string, label: string = 'Change'): void {
        if (this.isRestoring) return;
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.doPush(html, label);
    }

    private doPush(html: string, label: string): void {
        // If same as current, skip
        if (this.pointer >= 0 && this.stack[this.pointer].html === html) return;

        // Discard any redo entries
        this.stack = this.stack.slice(0, this.pointer + 1);

        // Push new entry
        this.stack.push({ html, label, timestamp: Date.now() });

        // Trim to max
        if (this.stack.length > this.maxEntries) {
            this.stack.shift();
        }

        this.pointer = this.stack.length - 1;
        this.emitChange();
    }

    /** Undo — returns the HTML to restore, or null if at start */
    undo(): string | null {
        if (!this.canUndo) return null;
        this.pointer--;
        this.isRestoring = true;
        this.emitChange();
        return this.stack[this.pointer].html;
    }

    /** Redo — returns the HTML to restore, or null if at end */
    redo(): string | null {
        if (!this.canRedo) return null;
        this.pointer++;
        this.isRestoring = true;
        this.emitChange();
        return this.stack[this.pointer].html;
    }

    /** Call after restoring content to unlock push */
    finishRestore(): void {
        this.isRestoring = false;
    }

    get canUndo(): boolean {
        return this.pointer > 0;
    }

    get canRedo(): boolean {
        return this.pointer < this.stack.length - 1;
    }

    get currentIndex(): number {
        return this.pointer;
    }

    get totalEntries(): number {
        return this.stack.length;
    }

    /** Get list of entries for display */
    getEntries(): { label: string; timestamp: number; active: boolean }[] {
        return this.stack.map((entry, i) => ({
            label: entry.label,
            timestamp: entry.timestamp,
            active: i === this.pointer,
        }));
    }

    private emitChange(): void {
        this.bus.emit('history:change', {
            canUndo: this.canUndo,
            canRedo: this.canRedo,
            index: this.pointer,
            total: this.stack.length,
        });
    }
}
