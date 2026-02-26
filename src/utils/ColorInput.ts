/**
 * ColorInput — Reusable compound color picker with HEX text input.
 * Creates: color swatch (native picker) + HEX text field, bidirectionally synced.
 */
export class ColorInput {
    private container: HTMLElement;
    private swatch: HTMLInputElement;
    private hexField: HTMLInputElement;
    private callback: ((hex: string) => void) | null = null;
    private _value: string = '#000000';

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        if (!this.container) {
            throw new Error(`ColorInput: container #${containerId} not found`);
        }

        // Create swatch
        this.swatch = document.createElement('input');
        this.swatch.type = 'color';
        this.swatch.className = 'hex-swatch';
        this.swatch.value = '#000000';

        // Create HEX text field
        this.hexField = document.createElement('input');
        this.hexField.type = 'text';
        this.hexField.className = 'hex-text';
        this.hexField.value = '#000000';
        this.hexField.maxLength = 7;
        this.hexField.spellcheck = false;
        this.hexField.placeholder = '#000000';

        // Mount
        this.container.innerHTML = '';
        this.container.appendChild(this.swatch);
        this.container.appendChild(this.hexField);

        // Event: swatch changes → update text
        this.swatch.addEventListener('input', () => {
            this._value = this.swatch.value;
            this.hexField.value = this.swatch.value;
            this.callback?.(this._value);
        });

        // Event: text input → update swatch
        this.hexField.addEventListener('input', () => {
            let v = this.hexField.value.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                this._value = v;
                this.swatch.value = v;
                this.callback?.(this._value);
            }
        });

        // Auto-correct on blur
        this.hexField.addEventListener('blur', () => {
            let v = this.hexField.value.trim();
            if (!v.startsWith('#')) v = '#' + v;

            // Expand 3-char hex (#abc → #aabbcc)
            if (/^#[0-9a-fA-F]{3}$/.test(v)) {
                v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
            }

            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                this._value = v.toLowerCase();
                this.swatch.value = this._value;
                this.hexField.value = this._value;
            } else {
                // Revert to last valid
                this.hexField.value = this._value;
            }
        });
    }

    /** Get current HEX value */
    get value(): string {
        return this._value;
    }

    /** Set value programmatically */
    set value(hex: string) {
        if (!hex || hex === 'transparent') hex = '#000000';
        // Normalize
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) hex = '#000000';

        this._value = hex.toLowerCase();
        this.swatch.value = this._value;
        this.hexField.value = this._value;
    }

    /** Register a change callback */
    onChange(cb: (hex: string) => void): void {
        this.callback = cb;
    }
}
