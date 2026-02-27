import { EditorCore } from '../editor/EditorCore';

interface TreeNode {
    element: HTMLElement;
    tagName: string;
    textPreview: string;
    customName: string;
    children: TreeNode[];
    expanded: boolean;
    depth: number;
}

const TAG_ICONS: Record<string, string> = {
    H1: '𝐇₁', H2: '𝐇₂', H3: '𝐇₃', H4: '𝐇₄', H5: '𝐇₅', H6: '𝐇₆',
    P: '¶', DIV: '◻', SPAN: '◦', A: '🔗', IMG: '🖼', UL: '•',
    OL: '1.', LI: '▸', BUTTON: '⬡', SECTION: '§', HEADER: '⬆',
    FOOTER: '⬇', NAV: '☰', TABLE: '▦', FORM: '📝', INPUT: '▭',
    HR: '—', BLOCKQUOTE: '❝', PRE: '⌨', CODE: '</>',
};

/**
 * LayersPanel — Left sidebar showing the DOM tree of the iframe content.
 * Supports click-to-select, drag-and-drop reordering, collapsible nodes,
 * and double-click to rename elements.
 */
export class LayersPanel {
    private editor: EditorCore;
    private container: HTMLElement;
    private treeContainer: HTMLElement;
    private selectedNodeEl: HTMLElement | null = null;
    private draggedNode: TreeNode | null = null;
    private observer: MutationObserver | null = null;

    /** Custom names keyed by data-se-label attribute */
    private customNames: Map<HTMLElement, string> = new Map();

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.container = document.getElementById('layers-panel') as HTMLElement;
        this.treeContainer = document.getElementById('layers-tree') as HTMLElement;

        this.setupEventBus();
    }

    private setupEventBus(): void {
        this.editor.bus.on('content:loaded', () => {
            this.loadCustomNames();
            this.refresh();
            this.observeContent();
        });

        this.editor.bus.on('selection:change', (el: HTMLElement) => {
            this.highlightElement(el);
        });

        this.editor.bus.on('selection:clear', () => {
            if (this.selectedNodeEl) {
                this.selectedNodeEl.classList.remove('layer-active');
                this.selectedNodeEl = null;
            }
        });
    }

    /** Load existing custom names from data-se-label attributes */
    private loadCustomNames(): void {
        this.customNames.clear();
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        doc.querySelectorAll('[data-se-label]').forEach(el => {
            const label = (el as HTMLElement).getAttribute('data-se-label');
            if (label) {
                this.customNames.set(el as HTMLElement, label);
            }
        });
    }

    private observeContent(): void {
        if (this.observer) this.observer.disconnect();

        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        let debounceTimer: number | null = null;
        this.observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => {
                this.refresh();
            }, 150);
        });

        this.observer.observe(doc.body, {
            childList: true,
            subtree: true,
        });
    }

    refresh(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        const tree = this.buildTree(doc.body, 0);
        this.renderTree(tree.children);
    }

    private buildTree(element: HTMLElement, depth: number): TreeNode {
        const children: TreeNode[] = [];

        Array.from(element.children).forEach(child => {
            const el = child as HTMLElement;
            // Skip internal elements
            if (el.id === 'se-drag-styles' || el.classList.contains('se-drag-handle')) return;
            if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;

            children.push(this.buildTree(el, depth + 1));
        });

        // Get text preview
        let textPreview = '';
        const firstText = element.childNodes[0];
        if (firstText && firstText.nodeType === 3) {
            textPreview = (firstText.textContent || '').trim().substring(0, 24);
            if ((firstText.textContent || '').trim().length > 24) textPreview += '…';
        } else if (element.childNodes.length > 0) {
            const allText = element.textContent?.trim() || '';
            if (allText && children.length === 0) {
                textPreview = allText.substring(0, 24);
                if (allText.length > 24) textPreview += '…';
            }
        }

        // Check for custom name
        const customName = this.customNames.get(element)
            || element.getAttribute('data-se-label')
            || '';

        return {
            element,
            tagName: element.tagName,
            textPreview,
            customName,
            children,
            expanded: depth < 2,
            depth,
        };
    }

    private renderTree(nodes: TreeNode[]): void {
        this.treeContainer.innerHTML = '';
        nodes.forEach(node => {
            this.renderNode(node, this.treeContainer);
        });
    }

    private renderNode(node: TreeNode, parent: HTMLElement): void {
        const row = document.createElement('div');
        row.className = 'layer-row';
        row.style.paddingLeft = `${node.depth * 14 + 8}px`;
        row.draggable = true;

        // Toggle arrow (if has children)
        const arrow = document.createElement('span');
        arrow.className = 'layer-arrow';
        if (node.children.length > 0) {
            arrow.textContent = node.expanded ? '▾' : '▸';
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                node.expanded = !node.expanded;
                arrow.textContent = node.expanded ? '▾' : '▸';
                childContainer.style.display = node.expanded ? 'block' : 'none';
            });
        } else {
            arrow.textContent = ' ';
            arrow.style.opacity = '0.2';
        }
        row.appendChild(arrow);

        // Tag icon with element type color
        const icon = document.createElement('span');
        icon.className = 'layer-icon';
        icon.textContent = TAG_ICONS[node.tagName] || '◇';
        // Element type color coding
        const typeColor = this.getElementTypeColor(node.tagName);
        icon.style.color = typeColor;
        row.appendChild(icon);

        // Smart element name
        const nameEl = document.createElement('span');
        nameEl.className = 'layer-name';

        if (node.customName) {
            nameEl.textContent = node.customName;
            nameEl.classList.add('has-name');
        } else {
            // Smart auto-label: ID > meaningful class > tag + preview
            const el = node.element;
            const elId = el.id && !el.id.startsWith('se-') ? `#${el.id}` : '';
            const meaningfulClass = el.className
                ?.split(' ')
                .filter(c => !c.startsWith('se-') && c.length > 0)
                .slice(0, 2)
                .join('.');

            if (elId) {
                nameEl.textContent = elId;
                nameEl.style.color = 'var(--panel-accent)';
            } else if (meaningfulClass) {
                nameEl.textContent = '.' + meaningfulClass;
            } else {
                // Friendly tag name
                nameEl.textContent = this.getFriendlyTagName(node.tagName);
                nameEl.style.color = 'var(--panel-text-dim)';
            }
        }
        row.appendChild(nameEl);

        // Text preview (if short and no custom name)
        if (!node.customName && node.textPreview) {
            const preview = document.createElement('span');
            preview.className = 'layer-preview';
            preview.textContent = node.textPreview;
            row.appendChild(preview);
        }

        // Children count badge
        if (node.children.length > 0) {
            const badge = document.createElement('span');
            badge.className = 'layer-badge';
            badge.textContent = String(node.children.length);
            row.appendChild(badge);
        }

        // Visibility toggle (eye icon)
        const eyeBtn = document.createElement('span');
        eyeBtn.className = 'layer-eye';
        eyeBtn.title = 'Toggle visibility';
        const isHidden = node.element.style.display === 'none' || node.element.style.visibility === 'hidden';
        eyeBtn.innerHTML = isHidden
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        if (isHidden) eyeBtn.classList.add('hidden-el');
        eyeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (node.element.style.display === 'none') {
                node.element.style.display = '';
                eyeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
                eyeBtn.classList.remove('hidden-el');
            } else {
                node.element.style.display = 'none';
                eyeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
                eyeBtn.classList.add('hidden-el');
            }
            this.editor.pushHistory('Toggle visibility');
            this.editor.requestResize();
        });
        row.appendChild(eyeBtn);

        // Store reference
        (row as any).__treeNode = node;

        // Click to select
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(row, node);
        });

        // Double-click to rename
        row.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startRename(row, node, nameEl);
        });

        // Drag events for reordering
        row.addEventListener('dragstart', (e) => {
            this.draggedNode = node;
            row.classList.add('layer-dragging');
            e.dataTransfer?.setData('text/plain', '');
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('layer-dragging');
            this.treeContainer.querySelectorAll('.layer-drop-target').forEach(
                el => el.classList.remove('layer-drop-target')
            );
            this.draggedNode = null;
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
            this.treeContainer.querySelectorAll('.layer-drop-target').forEach(
                el => el.classList.remove('layer-drop-target')
            );
            row.classList.add('layer-drop-target');
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('layer-drop-target');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('layer-drop-target');

            if (this.draggedNode && this.draggedNode !== node) {
                const dragged = this.draggedNode.element;
                const target = node.element;

                if (!dragged.contains(target)) {
                    target.parentNode?.insertBefore(dragged, target);
                    this.editor.pushHistory('Reorder elements');
                }
            }
        });

        parent.appendChild(row);

        // Children container
        const childContainer = document.createElement('div');
        childContainer.className = 'layer-children';
        childContainer.style.display = node.expanded ? 'block' : 'none';
        node.children.forEach(child => {
            this.renderNode(child, childContainer);
        });
        parent.appendChild(childContainer);
    }

    private getElementTypeColor(tag: string): string {
        // Layout elements
        if (['DIV', 'SECTION', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ARTICLE', 'ASIDE'].includes(tag))
            return '#60a5fa'; // blue
        // Text elements
        if (['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE'].includes(tag))
            return '#c084fc'; // purple
        // Media
        if (['IMG', 'VIDEO', 'AUDIO', 'CANVAS', 'SVG', 'FIGURE'].includes(tag))
            return '#4ade80'; // green
        // Interactive
        if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FORM', 'A'].includes(tag))
            return '#fbbf24'; // amber
        // Lists
        if (['UL', 'OL', 'LI'].includes(tag))
            return '#38bdf8'; // sky
        return '#94a3b8'; // slate default
    }

    private getFriendlyTagName(tag: string): string {
        const names: Record<string, string> = {
            DIV: 'Container', SECTION: 'Section', HEADER: 'Header', FOOTER: 'Footer',
            NAV: 'Navigation', MAIN: 'Main', ARTICLE: 'Article', ASIDE: 'Sidebar',
            P: 'Paragraph', SPAN: 'Text', H1: 'Heading 1', H2: 'Heading 2',
            H3: 'Heading 3', H4: 'Heading 4', H5: 'Heading 5', H6: 'Heading 6',
            IMG: 'Image', VIDEO: 'Video', A: 'Link', BUTTON: 'Button',
            UL: 'Unordered List', OL: 'Ordered List', LI: 'List Item',
            INPUT: 'Input', TEXTAREA: 'Text Area', SELECT: 'Select', FORM: 'Form',
            TABLE: 'Table', HR: 'Divider', BLOCKQUOTE: 'Quote', PRE: 'Code Block',
        };
        return names[tag] || tag.toLowerCase();
    }

    /** Start inline renaming of an element in the layers panel */
    private startRename(row: HTMLElement, node: TreeNode, nameEl: HTMLElement): void {
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'layer-rename-input';
        input.value = node.customName || '';
        input.placeholder = node.tagName.toLowerCase();

        // Stop click propagation so the input stays focused
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('mousedown', (e) => e.stopPropagation());

        // Replace name element with input
        nameEl.style.display = 'none';
        row.insertBefore(input, nameEl.nextSibling);

        // Use requestAnimationFrame for reliable focus
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });

        const commit = () => {
            const newName = input.value.trim();
            input.remove();
            nameEl.style.display = '';

            const previousName = node.customName || '';

            if (newName) {
                node.customName = newName;
                node.element.setAttribute('data-se-label', newName);
                this.customNames.set(node.element, newName);
                nameEl.textContent = newName;
                nameEl.classList.add('has-name');
            } else {
                node.customName = '';
                node.element.removeAttribute('data-se-label');
                this.customNames.delete(node.element);
                // Restore class name display
                const className = node.element.className
                    ?.split(' ')
                    .filter(c => !c.startsWith('se-'))
                    .join('.');
                nameEl.textContent = className ? '.' + className : '';
                nameEl.classList.remove('has-name');
            }

            if (newName !== previousName) {
                this.editor.bus.emit('dom:changed');
                this.editor.pushHistory('Rename layer');
            }
        };

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (e) => {
            e.stopPropagation(); // Prevent editor shortcuts from firing
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
            if (e.key === 'Escape') {
                input.value = node.customName || '';
                input.blur();
            }
        });
    }

    private selectNode(rowEl: HTMLElement, node: TreeNode): void {
        if (this.selectedNodeEl) {
            this.selectedNodeEl.classList.remove('layer-active');
        }
        this.selectedNodeEl = rowEl;
        rowEl.classList.add('layer-active');

        this.editor.selectionManager.selectElement(node.element);
    }

    private highlightElement(el: HTMLElement): void {
        if (this.selectedNodeEl) {
            this.selectedNodeEl.classList.remove('layer-active');
        }

        const rows = this.treeContainer.querySelectorAll('.layer-row');
        for (const row of Array.from(rows)) {
            const treeNode = (row as any).__treeNode as TreeNode;
            if (treeNode && treeNode.element === el) {
                // Auto-expand all collapsed parent containers
                let parentEl = (row as HTMLElement).parentElement;
                while (parentEl && parentEl !== this.treeContainer) {
                    if (parentEl.classList.contains('layer-children') && parentEl.style.display === 'none') {
                        parentEl.style.display = 'block';
                        // Also update the arrow in the sibling row
                        const prevRow = parentEl.previousElementSibling;
                        if (prevRow) {
                            const arrow = prevRow.querySelector('.layer-arrow');
                            if (arrow) arrow.textContent = '▾';
                            const treeNodeParent = (prevRow as any).__treeNode as TreeNode;
                            if (treeNodeParent) treeNodeParent.expanded = true;
                        }
                    }
                    parentEl = parentEl.parentElement;
                }

                (row as HTMLElement).classList.add('layer-active');
                this.selectedNodeEl = row as HTMLElement;

                // Pulse animation for visual feedback
                (row as HTMLElement).classList.add('layer-pulse');
                setTimeout(() => (row as HTMLElement).classList.remove('layer-pulse'), 600);

                row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                break;
            }
        }
    }
}
