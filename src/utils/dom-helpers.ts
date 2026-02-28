/**
 * Get computed style value of an element, parsed for common use.
 */
export function getStyleValue(el: HTMLElement, prop: string): string {
    return getComputedStyle(el).getPropertyValue(prop).trim();
}

/**
 * Parse a CSS px value to a number. Returns 0 if non-numeric.
 */
export function parsePx(value: string): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : Math.round(n);
}

/**
 * Convert an rgb() or rgba() string to hex.
 */
export function rgbToHex(rgb: string): string {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the bounding rect of an element relative to a reference element.
 */
export function getRelativeRect(el: HTMLElement, reference: HTMLElement): DOMRect {
    const elRect = el.getBoundingClientRect();
    const refRect = reference.getBoundingClientRect();
    return new DOMRect(
        elRect.left - refRect.left,
        elRect.top - refRect.top,
        elRect.width,
        elRect.height
    );
}

/**
 * Check if an element is an editable text element.
 */
export function isTextElement(el: HTMLElement): boolean {
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'LABEL', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'BUTTON'];
    if (textTags.includes(el.tagName)) return true;

    // Allow DIV elements that have direct text content (e.g. badges, inline labels)
    if (el.tagName === 'DIV') {
        const hasDirectText = Array.from(el.childNodes).some(
            n => n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim().length > 0
        );
        return hasDirectText;
    }

    return false;
}

/**
 * Create a toast notification.
 */
export function showToast(message: string, duration = 2500): void {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Get a readable tag descriptor for display.
 */
export function getTagDescriptor(el: HTMLElement): string {
    let desc = `<${el.tagName.toLowerCase()}`;
    if (el.id) desc += `#${el.id}`;
    try {
        const classStr = typeof el.className === 'string' ? el.className : el.getAttribute('class') || '';
        if (classStr) {
            const classes = classStr.split(/\s+/).filter(c => c).slice(0, 3);
            if (classes.length) desc += `.${classes.join('.')}`;
        }
    } catch { /* SVG or other exotic elements */ }
    desc += '>';
    return desc;
}
