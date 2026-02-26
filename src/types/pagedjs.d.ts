declare module 'pagedjs' {
    export class Previewer {
        constructor(options?: any);
        preview(content: string | Element | Document, stylesheets?: string[], renderTo?: HTMLElement): Promise<any>;
    }
}
