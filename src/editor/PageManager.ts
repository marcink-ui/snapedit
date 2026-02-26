import { EventBus } from '../utils/EventBus';

export interface Page {
    id: string;
    name: string;
    html: string;
}

export class PageManager {
    private pages: Page[] = [];
    private activePageId: string | null = null;
    private bus: EventBus;

    constructor(bus: EventBus) {
        this.bus = bus;
        this.addPage('Page 1');
    }

    public getPages(): Page[] {
        return this.pages;
    }

    public getActivePage(): Page | undefined {
        return this.pages.find(p => p.id === this.activePageId);
    }

    public getActivePageId(): string | null {
        return this.activePageId;
    }

    public addPage(name: string, initialHtml: string = ''): Page {
        const id = 'page_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const newPage: Page = { id, name, html: initialHtml };
        this.pages.push(newPage);

        if (!this.activePageId) {
            this.activePageId = id;
        }

        this.bus.emit('pages:changed', this.pages);
        return newPage;
    }

    public updateActivePageContent(html: string): void {
        const active = this.getActivePage();
        if (active) {
            active.html = html;
        }
    }

    public switchPage(id: string): boolean {
        if (this.activePageId === id) return false;

        const page = this.pages.find(p => p.id === id);
        if (page) {
            this.activePageId = id;
            this.bus.emit('page:switched', page);
            return true;
        }
        return false;
    }

    public renamePage(id: string, newName: string): void {
        const page = this.pages.find(p => p.id === id);
        if (page) {
            page.name = newName;
            this.bus.emit('pages:changed', this.pages);
        }
    }

    public deletePage(id: string): boolean {
        if (this.pages.length <= 1) return false; // Don't delete last page

        const index = this.pages.findIndex(p => p.id === id);
        if (index > -1) {
            this.pages.splice(index, 1);
            if (this.activePageId === id) {
                // Switch to previous or next available page
                const nextIndex = Math.max(0, index - 1);
                this.switchPage(this.pages[nextIndex].id);
            } else {
                this.bus.emit('pages:changed', this.pages);
            }
            return true;
        }
        return false;
    }
}
