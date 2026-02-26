import { EventBus } from '../utils/EventBus';

export class SelectionManager {
    private iframe: HTMLIFrameElement;
    private hoverOverlay: HTMLElement;
    private selectOverlay: HTMLElement;
    private canvasWrapper: HTMLElement;
    private bus: EventBus;
    private selectedElement: HTMLElement | null = null;
    private hoveredElement: HTMLElement | null = null;
    private enabled: boolean = true;

    constructor(
        iframe: HTMLIFrameElement,
        hoverOverlay: HTMLElement,
        selectOverlay: HTMLElement,
        canvasWrapper: HTMLElement,
        bus: EventBus
    ) {
        this.iframe = iframe;
        this.hoverOverlay = hoverOverlay;
        this.selectOverlay = selectOverlay;
        this.canvasWrapper = canvasWrapper;
        this.bus = bus;
    }

    init(): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        doc.addEventListener('mousemove', this.onMouseMove.bind(this));
        doc.addEventListener('mouseout', this.onMouseOut.bind(this));
        doc.addEventListener('click', this.onClick.bind(this));

        // Update overlays on iframe scroll
        const iframeWin = this.iframe.contentWindow;
        if (iframeWin) {
            iframeWin.addEventListener('scroll', () => {
                this.updateOverlays();
            });
        }

        // Also observe resizes
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => this.updateOverlays());
            ro.observe(this.iframe);
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.hoverOverlay.style.display = 'none';
            this.selectOverlay.style.display = 'none';
        } else if (this.selectedElement) {
            this.updateSelectOverlay();
        }
    }

    getSelectedElement(): HTMLElement | null {
        return this.selectedElement;
    }

    /** Programmatically select an element (used by LayersPanel) */
    selectElement(el: HTMLElement): void {
        this.selectedElement = el;
        this.hoveredElement = null;
        this.hoverOverlay.style.display = 'none';
        this.updateSelectOverlay();
        this.bus.emit('selection:change', el);
    }

    clearSelection(): void {
        this.selectedElement = null;
        this.selectOverlay.style.display = 'none';
        this.bus.emit('selection:clear');
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.enabled) return;
        const target = e.target as HTMLElement;
        if (!target || target === this.iframe.contentDocument?.body || target === this.iframe.contentDocument?.documentElement) {
            this.hoverOverlay.style.display = 'none';
            this.hoveredElement = null;
            return;
        }

        if (target === this.hoveredElement) return;
        if (target === this.selectedElement) {
            this.hoverOverlay.style.display = 'none';
            return;
        }

        this.hoveredElement = target;
        this.updateHoverOverlay();
    }

    private onMouseOut(): void {
        this.hoverOverlay.style.display = 'none';
        this.hoveredElement = null;
    }

    private onClick(e: MouseEvent): void {
        if (!this.enabled) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (!target || target === this.iframe.contentDocument?.body || target === this.iframe.contentDocument?.documentElement) {
            this.clearSelection();
            return;
        }

        this.selectedElement = target;
        this.hoveredElement = null;
        this.hoverOverlay.style.display = 'none';
        this.updateSelectOverlay();
        this.bus.emit('selection:change', target);
    }

    private updateOverlays(): void {
        if (this.hoveredElement && this.hoveredElement !== this.selectedElement) {
            this.updateHoverOverlay();
        }
        if (this.selectedElement) {
            this.updateSelectOverlay();
        }
    }

    private updateHoverOverlay(): void {
        if (!this.hoveredElement || !this.enabled) return;
        const rect = this.getRelativeRect(this.hoveredElement);
        if (!rect) return;
        this.positionOverlay(this.hoverOverlay, rect);
        this.hoverOverlay.style.display = 'block';
    }

    private updateSelectOverlay(): void {
        if (!this.selectedElement || !this.enabled) return;
        const rect = this.getRelativeRect(this.selectedElement);
        if (!rect) return;
        this.positionOverlay(this.selectOverlay, rect);
        this.selectOverlay.style.display = 'block';
    }

    refreshSelectOverlay(): void {
        if (this.selectedElement) {
            this.updateSelectOverlay();
        }
    }

    private getRelativeRect(el: HTMLElement): DOMRect | null {
        const iframeDoc = this.iframe.contentDocument;
        if (!iframeDoc) return null;

        const elRect = el.getBoundingClientRect();
        const iframeRect = this.iframe.getBoundingClientRect();
        const wrapperRect = this.canvasWrapper.getBoundingClientRect();

        return new DOMRect(
            elRect.left + iframeRect.left - wrapperRect.left,
            elRect.top + iframeRect.top - wrapperRect.top,
            elRect.width,
            elRect.height
        );
    }

    private positionOverlay(overlay: HTMLElement, rect: DOMRect): void {
        overlay.style.left = `${rect.x}px`;
        overlay.style.top = `${rect.y}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
    }
}
