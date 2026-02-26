import { EditorCore } from '../editor/EditorCore';

/**
 * FlexGridPanel — Visual flex/grid layout controls.
 * Renders in the Element tab when a container element is selected.
 */
export class FlexGridPanel {
    private editor: EditorCore;
    private container: HTMLElement;
    private currentElement: HTMLElement | null = null;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.container = document.getElementById('layout-section')!;

        this.editor.bus.on('selection:change', (el: HTMLElement) => {
            this.currentElement = el;
            this.update();
        });
        this.editor.bus.on('selection:clear', () => {
            this.currentElement = null;
            this.container.style.display = 'none';
        });
    }

    private update(): void {
        if (!this.currentElement) {
            this.container.style.display = 'none';
            return;
        }

        const computed = window.getComputedStyle(this.currentElement);
        const display = computed.display;

        // Show layout controls for all elements (can switch to flex/grid)
        this.container.style.display = '';
        this.updateControls(computed);
    }

    private updateControls(computed: CSSStyleDeclaration): void {
        const display = this.currentElement!.style.display || computed.display;

        // Display toggle
        const displaySelect = document.getElementById('layout-display') as HTMLSelectElement;
        if (displaySelect) displaySelect.value = this.normalizeDisplay(display);

        const isFlex = display === 'flex' || display === 'inline-flex';
        const isGrid = display === 'grid' || display === 'inline-grid';

        // Show/hide flex/grid specific controls
        const flexControls = document.getElementById('flex-controls')!;
        const gridControls = document.getElementById('grid-controls')!;

        flexControls.style.display = isFlex ? '' : 'none';
        gridControls.style.display = isGrid ? '' : 'none';

        if (isFlex) {
            this.updateFlexControls(computed);
        } else if (isGrid) {
            this.updateGridControls(computed);
        }
    }

    private normalizeDisplay(d: string): string {
        if (['flex', 'inline-flex', 'grid', 'inline-grid', 'block', 'inline-block', 'inline', 'none'].includes(d)) return d;
        return 'block';
    }

    private updateFlexControls(computed: CSSStyleDeclaration): void {
        const el = this.currentElement!;

        // Direction buttons
        this.setActiveBtn('flex-dir', el.style.flexDirection || computed.flexDirection || 'row');

        // Justify buttons
        this.setActiveBtn('flex-justify', el.style.justifyContent || computed.justifyContent || 'flex-start');

        // Align buttons
        this.setActiveBtn('flex-align', el.style.alignItems || computed.alignItems || 'stretch');

        // Wrap
        const wrapBtn = document.getElementById('flex-wrap-toggle') as HTMLButtonElement;
        const isWrapped = (el.style.flexWrap || computed.flexWrap) === 'wrap';
        if (wrapBtn) wrapBtn.classList.toggle('active', isWrapped);

        // Gap
        const gapInput = document.getElementById('flex-gap') as HTMLInputElement;
        if (gapInput) gapInput.value = parseInt(el.style.gap || computed.gap || '0') + '';
    }

    private updateGridControls(computed: CSSStyleDeclaration): void {
        const el = this.currentElement!;
        const colsInput = document.getElementById('grid-cols') as HTMLInputElement;
        const rowsInput = document.getElementById('grid-rows') as HTMLInputElement;
        const gapInput = document.getElementById('grid-gap') as HTMLInputElement;

        if (colsInput) colsInput.value = el.style.gridTemplateColumns || computed.gridTemplateColumns || '';
        if (rowsInput) rowsInput.value = el.style.gridTemplateRows || computed.gridTemplateRows || '';
        if (gapInput) gapInput.value = parseInt(el.style.gap || computed.gap || '0') + '';
    }

    private setActiveBtn(groupId: string, value: string): void {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.layout-btn').forEach(btn => {
            const el = btn as HTMLElement;
            el.classList.toggle('active', el.dataset.value === value);
        });
    }

    /** Setup all event listeners — called once after DOM ready */
    setupListeners(): void {
        // Display select
        const displaySelect = document.getElementById('layout-display') as HTMLSelectElement;
        displaySelect?.addEventListener('change', () => {
            this.applyStyle('display', displaySelect.value);
            this.update(); // Refresh to show/hide flex/grid controls
        });

        // Flex direction buttons
        this.setupBtnGroup('flex-dir', 'flexDirection');

        // Justify content buttons
        this.setupBtnGroup('flex-justify', 'justifyContent');

        // Align items buttons
        this.setupBtnGroup('flex-align', 'alignItems');

        // Wrap toggle
        document.getElementById('flex-wrap-toggle')?.addEventListener('click', () => {
            if (!this.currentElement) return;
            const current = this.currentElement.style.flexWrap;
            this.applyStyle('flexWrap', current === 'wrap' ? 'nowrap' : 'wrap');
            this.update();
        });

        // Gap input
        document.getElementById('flex-gap')?.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.applyStyle('gap', val ? val + 'px' : '0');
        });

        // Grid controls
        document.getElementById('grid-cols')?.addEventListener('change', (e) => {
            this.applyStyle('gridTemplateColumns', (e.target as HTMLInputElement).value);
        });
        document.getElementById('grid-rows')?.addEventListener('change', (e) => {
            this.applyStyle('gridTemplateRows', (e.target as HTMLInputElement).value);
        });
        document.getElementById('grid-gap')?.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.applyStyle('gap', val ? val + 'px' : '0');
        });
    }

    private setupBtnGroup(groupId: string, cssProp: string): void {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = (btn as HTMLElement).dataset.value || '';
                this.applyStyle(cssProp, value);
                this.update();
            });
        });
    }

    private applyStyle(prop: string, value: string): void {
        if (!this.currentElement) return;
        this.editor.styleMutator.apply(this.currentElement, prop, value);
        this.editor.selectionManager.refreshSelectOverlay();
        this.editor.pushHistory(`Layout: ${prop}`);
    }
}
