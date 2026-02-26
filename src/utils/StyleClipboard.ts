import { showToast } from './dom-helpers';

/**
 * StyleClipboard — Copy/paste computed styles between elements.
 * Captures relevant visual properties for transfer.
 */

const STYLE_PROPS = [
    'color', 'backgroundColor', 'backgroundImage',
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration',
    'textAlign', 'lineHeight', 'letterSpacing',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
    'boxShadow', 'opacity',
    'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'flexWrap',
];

export class StyleClipboard {
    private clipboard: Record<string, string> | null = null;

    /** Copy relevant inline + computed styles from element */
    copy(element: HTMLElement): void {
        const computed = window.getComputedStyle(element);
        this.clipboard = {};

        for (const prop of STYLE_PROPS) {
            const value = element.style.getPropertyValue(this.camelToKebab(prop))
                || computed.getPropertyValue(this.camelToKebab(prop));
            if (value && value !== '' && value !== 'initial' && value !== 'normal') {
                this.clipboard[prop] = value;
            }
        }

        showToast('Styles copied ✂️');
    }

    /** Paste stored styles onto the target element */
    paste(element: HTMLElement): boolean {
        if (!this.clipboard) {
            showToast('No styles to paste');
            return false;
        }

        for (const [prop, value] of Object.entries(this.clipboard)) {
            (element.style as any)[prop] = value;
        }

        showToast('Styles pasted 📋');
        return true;
    }

    /** Check if clipboard has data */
    hasData(): boolean {
        return this.clipboard !== null;
    }

    private camelToKebab(str: string): string {
        return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    }
}
