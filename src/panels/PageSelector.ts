import { PageManager, Page } from '../editor/PageManager';
import { EditorCore } from '../editor/EditorCore';

export class PageSelector {
    private manager: PageManager;
    private editor: EditorCore;
    private selectElement: HTMLSelectElement;
    private addBtn: HTMLButtonElement;

    constructor(manager: PageManager, editor: EditorCore) {
        this.manager = manager;
        this.editor = editor;

        this.selectElement = document.getElementById('page-selector') as HTMLSelectElement;
        this.addBtn = document.getElementById('btn-add-page') as HTMLButtonElement;

        this.setupListeners();
        this.renderOptions();
    }

    private setupListeners(): void {
        this.addBtn.addEventListener('click', () => {
            // Save current page content FIRST
            const currentId = this.manager.getActivePageId();
            if (currentId) {
                this.manager.updateActivePageContent(this.editor.exportHTML());
            }

            const num = this.manager.getPages().length + 1;
            const starterHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Page ${num}</title>
<style>body{font-family:Inter,sans-serif;margin:40px auto;max-width:800px;padding:20px;color:#1a1a2e;}</style>
</head><body>
<h1>Page ${num}</h1>
<p>Start editing this page…</p>
</body></html>`;
            const newPage = this.manager.addPage(`Page ${num}`, starterHtml);
            this.manager.switchPage(newPage.id);
        });

        this.selectElement.addEventListener('change', (e) => {
            const targetId = (e.target as HTMLSelectElement).value;
            const currentId = this.manager.getActivePageId();

            if (currentId && currentId !== targetId) {
                // Save current page state
                this.manager.updateActivePageContent(this.editor.exportHTML());
            }

            this.manager.switchPage(targetId);
        });

        // Re-render dropdown when pages change or when switching pages
        this.editor.bus.on('pages:changed', () => {
            this.renderOptions();
        });
        this.editor.bus.on('page:switched', () => {
            this.renderOptions();
        });
    }

    public renderOptions(): void {
        const pages = this.manager.getPages();
        const activeId = this.manager.getActivePageId();

        this.selectElement.innerHTML = '';

        pages.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            if (p.id === activeId) opt.selected = true;
            this.selectElement.appendChild(opt);
        });
    }
}
