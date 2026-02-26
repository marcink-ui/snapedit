import { EditorCore } from './EditorCore';
import { EventBus } from '../utils/EventBus';

export interface Breakpoint {
    id: string;
    label: string;
    icon: string;
    maxWidth: number;   // 0 = no limit (desktop)
    canvasWidth: string; // CSS width for the canvas wrapper
}

const BREAKPOINTS: Breakpoint[] = [
    {
        id: 'desktop', label: 'Desktop',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        maxWidth: 0, canvasWidth: '100%'
    },
    {
        id: 'laptop', label: 'Laptop',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>',
        maxWidth: 1024, canvasWidth: '1024px'
    },
    {
        id: 'tablet', label: 'Tablet',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg>',
        maxWidth: 768, canvasWidth: '768px'
    },
    {
        id: 'mobile', label: 'Mobile',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg>',
        maxWidth: 480, canvasWidth: '375px'
    },
];

/**
 * BreakpointManager — handles responsive preview breakpoints.
 * Resizes the canvas to simulate different screen sizes.
 */
export class BreakpointManager {
    private currentBP: Breakpoint;
    private canvasWrapper: HTMLElement;
    private bus: EventBus;
    private buttons: Map<string, HTMLElement> = new Map();
    private widthLabel: HTMLElement | null = null;

    constructor(bus: EventBus) {
        this.bus = bus;
        this.currentBP = BREAKPOINTS[0];
        this.canvasWrapper = document.getElementById('canvas-wrapper')!;
        this.setupToolbarButtons();
    }

    private setupToolbarButtons(): void {
        const container = document.getElementById('breakpoint-controls');
        if (!container) return;

        BREAKPOINTS.forEach(bp => {
            const btn = document.createElement('button');
            btn.className = 'bp-btn' + (bp.id === 'desktop' ? ' active' : '');
            btn.title = bp.maxWidth ? `${bp.label} (≤${bp.maxWidth}px)` : bp.label;
            btn.innerHTML = bp.icon;
            btn.dataset.bp = bp.id;

            btn.addEventListener('click', () => this.switchTo(bp.id));
            container.appendChild(btn);
            this.buttons.set(bp.id, btn);
        });

        // Width label
        this.widthLabel = document.createElement('span');
        this.widthLabel.className = 'bp-width-label';
        this.widthLabel.textContent = '100%';
        container.appendChild(this.widthLabel);
    }

    switchTo(bpId: string): void {
        const bp = BREAKPOINTS.find(b => b.id === bpId);
        if (!bp) return;

        this.currentBP = bp;

        // Update button active states
        this.buttons.forEach((btn, id) => {
            btn.classList.toggle('active', id === bpId);
        });

        // Resize canvas wrapper
        this.canvasWrapper.style.maxWidth = bp.canvasWidth;
        this.canvasWrapper.style.transition = 'max-width 0.3s ease';

        // Update width label
        if (this.widthLabel) {
            this.widthLabel.textContent = bp.maxWidth ? `${bp.maxWidth}px` : '100%';
        }

        this.bus.emit('breakpoint:change', bp);
    }

    getCurrentBreakpoint(): Breakpoint {
        return this.currentBP;
    }

    getBreakpoints(): Breakpoint[] {
        return BREAKPOINTS;
    }
}
