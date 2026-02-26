export class StyleMutator {
    /**
     * Apply a CSS property to the given element.
     */
    apply(el: HTMLElement, property: string, value: string): void {
        (el.style as any)[property] = value;
    }

    /**
     * Apply multiple CSS properties at once.
     */
    applyMultiple(el: HTMLElement, styles: Record<string, string>): void {
        for (const [prop, val] of Object.entries(styles)) {
            (el.style as any)[prop] = val;
        }
    }

    /**
     * Get a computed style property value.
     */
    getComputed(el: HTMLElement, property: string): string {
        return getComputedStyle(el).getPropertyValue(property).trim();
    }

    /**
     * Apply global styles to the iframe body.
     */
    applyGlobal(doc: Document, property: string, value: string): void {
        if (doc.body) {
            (doc.body.style as any)[property] = value;
        }
    }

    /**
     * Apply primary color globally to headings, links, and buttons.
     */
    applyPrimaryColor(doc: Document, color: string): void {
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => {
            (h as HTMLElement).style.color = color;
        });

        const links = doc.querySelectorAll('a');
        links.forEach(a => {
            (a as HTMLElement).style.color = color;
        });

        const buttons = doc.querySelectorAll('button, .btn');
        buttons.forEach(btn => {
            (btn as HTMLElement).style.backgroundColor = color;
        });
    }

    /**
     * Apply secondary color to elements with .secondary, .badge, blockquote borders, etc.
     */
    applySecondaryColor(doc: Document, color: string): void {
        const secondary = doc.querySelectorAll('.secondary, .badge, .tag, .accent');
        secondary.forEach(el => {
            (el as HTMLElement).style.color = color;
        });

        const blockquotes = doc.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            (bq as HTMLElement).style.borderLeftColor = color;
        });
    }

    /**
     * Apply heading color globally.
     */
    applyHeadingColor(doc: Document, color: string): void {
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => {
            (h as HTMLElement).style.color = color;
        });
    }

    /**
     * Apply link color globally.
     */
    applyLinkColor(doc: Document, color: string): void {
        const links = doc.querySelectorAll('a');
        links.forEach(a => {
            (a as HTMLElement).style.color = color;
        });
    }

    /**
     * Apply paragraph spacing globally to p, li, blockquote.
     */
    applyParagraphSpacing(doc: Document, spacing: string): void {
        const elements = doc.querySelectorAll('p, li, blockquote');
        elements.forEach(el => {
            (el as HTMLElement).style.marginBottom = spacing;
        });
    }
}
