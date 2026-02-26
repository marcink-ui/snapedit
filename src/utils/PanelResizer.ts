/**
 * PanelResizer — Adds drag-to-resize handles for left/right sidebars.
 */
export class PanelResizer {
    private leftPanel: HTMLElement;
    private rightPanel: HTMLElement;
    private leftHandle: HTMLElement;
    private rightHandle: HTMLElement;

    private minWidth = 160;
    private maxWidth = 500;

    constructor() {
        this.leftPanel = document.getElementById('layers-panel')!;
        this.rightPanel = document.getElementById('styles-panel')!;
        this.leftHandle = document.getElementById('resize-left')!;
        this.rightHandle = document.getElementById('resize-right')!;

        this.setupResize(this.leftHandle, this.leftPanel, 'left');
        this.setupResize(this.rightHandle, this.rightPanel, 'right');
    }

    private setupResize(handle: HTMLElement, panel: HTMLElement, side: 'left' | 'right'): void {
        let startX = 0;
        let startW = 0;
        let isResizing = false;

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            e.preventDefault();

            const delta = e.clientX - startX;
            let newWidth: number;

            if (side === 'left') {
                newWidth = startW + delta;
            } else {
                newWidth = startW - delta;
            }

            newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
            panel.style.width = `${newWidth}px`;
        };

        const onMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Remove overlay that prevents iframe from stealing mouse events
            const blocker = document.getElementById('resize-blocker');
            if (blocker) blocker.remove();
        };

        handle.addEventListener('mousedown', (e: MouseEvent) => {
            e.preventDefault();
            isResizing = true;
            startX = e.clientX;
            startW = panel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            // Add an invisible overlay to prevent iframe from intercepting mouse events
            const blocker = document.createElement('div');
            blocker.id = 'resize-blocker';
            blocker.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;';
            document.body.appendChild(blocker);
        });
    }
}
