import { EditorCore } from '../editor/EditorCore';
import { showToast } from '../utils/dom-helpers';
import TurndownService from 'turndown';

export class Toolbar {
    private editor: EditorCore;
    private undoBtn!: HTMLButtonElement;
    private redoBtn!: HTMLButtonElement;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.setupUndoRedo();
        this.setupLoadButton();
        this.setupExportButton();
        this.setupSiteSettingsDropdown();
    }

    private setupUndoRedo(): void {
        this.undoBtn = document.getElementById('btn-undo') as HTMLButtonElement;
        this.redoBtn = document.getElementById('btn-redo') as HTMLButtonElement;

        this.undoBtn.addEventListener('click', () => this.editor.undo());
        this.redoBtn.addEventListener('click', () => this.editor.redo());

        // Listen for history changes to update button states
        this.editor.bus.on('history:change', (state: { canUndo: boolean; canRedo: boolean }) => {
            this.undoBtn.disabled = !state.canUndo;
            this.redoBtn.disabled = !state.canRedo;
        });
    }

    private setupLoadButton(): void {
        const btn = document.getElementById('btn-load-html')!;
        const modal = document.getElementById('html-modal')!;
        const textarea = document.getElementById('html-input') as HTMLTextAreaElement;
        const loadBtn = document.getElementById('modal-load')!;
        const cancelBtn = document.getElementById('modal-cancel')!;
        const closeBtn = document.getElementById('modal-close')!;
        const fileInput = document.getElementById('html-file-input') as HTMLInputElement;
        const uploadBtn = document.getElementById('modal-upload-file')!;

        btn.addEventListener('click', () => {
            textarea.value = this.editor.exportHTML();
            modal.style.display = 'flex';
            setTimeout(() => textarea.focus(), 100);
        });

        const closeModal = () => { modal.style.display = 'none'; };

        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        loadBtn.addEventListener('click', () => {
            const html = textarea.value.trim();
            if (!html) { showToast('Please paste some HTML content.'); return; }
            this.editor.loadContent(html);
            closeModal();
            showToast('HTML loaded successfully!');
        });

        uploadBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    this.editor.loadContent(content);
                    closeModal();
                    showToast('HTML file loaded successfully!');
                };
                reader.readAsText(file);
            }
            fileInput.value = '';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
        });
    }

    private setupExportButton(): void {
        const printBtn = document.getElementById('btn-print-preview')!;
        const htmlBtn = document.getElementById('btn-export-html')!;
        const mdBtn = document.getElementById('btn-export-md')!;

        // --- Print Preview ---
        printBtn.addEventListener('click', () => {
            const iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                this.editor.selectionManager.clearSelection();
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } else {
                showToast('Unable to print content.');
            }
        });

        // --- Download HTML ---
        htmlBtn.addEventListener('click', () => {
            const html = this.editor.exportHTML();
            if (!html) { showToast('No content to export.'); return; }

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'snapedit-export.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('HTML downloaded!');

            // Hide dropdown
            const menu = document.querySelector('.toolbar-dropdown-menu');
            if (menu) menu.classList.remove('show');
        });

        // --- Download Markdown ---
        mdBtn.addEventListener('click', () => {
            const doc = this.editor.getIframeDocument();
            if (!doc?.body) { showToast('No content to export.'); return; }

            // We use a clone to clean up editor-specific elements before conversion
            const clone = doc.body.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('.se-drag-handle, #se-drag-styles').forEach(el => el.remove());

            try {
                // Initialize turndown service
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    hr: '---',
                    bulletListMarker: '-',
                    codeBlockStyle: 'fenced'
                });

                // Add custom rule for form placeholders or complex elements
                turndownService.addRule('form', {
                    filter: 'form',
                    replacement: function () {
                        return '\n\n> [Contact Form Placeholder]\n\n';
                    }
                });

                // Add rule for video embedded iframes
                turndownService.addRule('iframe', {
                    filter: function (node) {
                        return node.nodeName === 'DIV' && node.querySelector('iframe') !== null;
                    },
                    replacement: function (content, node) {
                        const iframe = (node as HTMLElement).querySelector('iframe');
                        return `\n\n> [Embed: ${iframe?.src || 'Video/Map'}]\n\n`;
                    }
                });

                const markdown = turndownService.turndown(clone.innerHTML);

                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'snapedit-export.md';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showToast('Markdown downloaded!');
            } catch (err) {
                console.error(err);
                showToast('Error converting to Markdown.');
            }

            // Hide dropdown
            const menu = document.querySelector('.toolbar-dropdown-menu');
            if (menu) menu.classList.remove('show');
        });

        // Dropdown toggle logic
        const dropdownBtn = document.getElementById('btn-export-dropdown');
        dropdownBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = dropdownBtn.nextElementSibling;
            if (menu) menu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const exportMenu = document.querySelector('.toolbar-dropdown-menu');
            if (exportMenu && exportMenu.classList.contains('show')) {
                const target = e.target as Node;
                if (!dropdownBtn?.contains(target) && !exportMenu.contains(target)) {
                    exportMenu.classList.remove('show');
                }
            }
        });
    }

    private setupSiteSettingsDropdown(): void {
        const btn = document.getElementById('btn-site-settings');
        const menu = document.getElementById('site-settings-menu');
        const container = document.getElementById('site-settings-dropdown-container');

        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu) menu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (menu && menu.classList.contains('show')) {
                const target = e.target as Node;
                if (container && !container.contains(target)) {
                    menu.classList.remove('show');
                }
            }
        });

        // Prevent clicks inside the menu from bubbling up and closing it
        menu?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}
