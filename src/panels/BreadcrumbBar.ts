import { EditorCore } from '../editor/EditorCore';

/**
 * BreadcrumbBar — shows clickable ancestor path of the selected element.
 * Renders at the bottom of the canvas: body > div.container > section.hero > h1
 */
export class BreadcrumbBar {
    private bar: HTMLElement;
    private editor: EditorCore;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.bar = document.getElementById('breadcrumb-bar')!;

        // Listen for selection changes
        this.editor.bus.on('selection:change', (el: HTMLElement) => this.update(el));
        this.editor.bus.on('selection:clear', () => this.clear());
    }

    private update(el: HTMLElement): void {
        this.bar.innerHTML = '';

        // Walk up the DOM tree collecting ancestors
        const chain: HTMLElement[] = [];
        let current: HTMLElement | null = el;
        const iframeDoc = this.editor.getIframeDocument();
        if (!iframeDoc) return;

        while (current && current !== iframeDoc.documentElement) {
            chain.unshift(current);
            current = current.parentElement;
        }

        chain.forEach((node, index) => {
            // Separator
            if (index > 0) {
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-sep';
                sep.textContent = '›';
                this.bar.appendChild(sep);
            }

            const crumb = document.createElement('button');
            crumb.className = 'breadcrumb-item';
            if (node === el) crumb.classList.add('active');

            // Build label: tag + first relevant class
            const tag = node.tagName.toLowerCase();
            const customName = node.getAttribute('data-se-label');
            const className = Array.from(node.classList)
                .filter(c => !c.startsWith('se-'))
                .slice(0, 1)
                .join('');

            let label = tag;
            if (customName) {
                label = `${tag} "${customName}"`;
            } else if (className) {
                label = `${tag}.${className}`;
            } else if (node.id && !node.id.startsWith('se-')) {
                label = `${tag}#${node.id}`;
            }

            crumb.textContent = label;
            crumb.title = label;

            // Click selects this ancestor
            crumb.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editor.selectionManager.selectElement(node);
            });

            this.bar.appendChild(crumb);
        });

        // Auto-scroll to end (active element)
        this.bar.scrollLeft = this.bar.scrollWidth;
    }

    private clear(): void {
        this.bar.innerHTML = '<span class="breadcrumb-empty">No element selected</span>';
    }
}
