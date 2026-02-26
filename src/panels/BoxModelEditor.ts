// src/panels/BoxModelEditor.ts

/**
 * Simple visual Box Model editor for margin and padding.
 * It displays a nested rectangle representing margin (orange) and padding (green).
 * Clicking on a side opens a prompt to edit the numeric value (in px).
 * The component emits `onChange` callbacks with the updated values.
 */
export class BoxModelEditor {
    /**
     * @param container HTMLElement where the editor will be rendered.
     * @param initialMargin current margin value (single number for simplicity).
     * @param initialPadding current padding value.
     * @param onChange callback invoked with {margin, padding} when values change.
     */
    constructor(
        private container: HTMLElement,
        private margin: number = 0,
        private padding: number = 0,
        private onChange: (values: { margin: number; padding: number }) => void = () => { }
    ) {
        this.render();
    }

    private render() {
        // Clear container
        this.container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'box-model-wrapper';
        // Outer (margin) rectangle
        const marginDiv = document.createElement('div');
        marginDiv.className = 'box-model-margin';
        marginDiv.title = `Margin: ${this.margin}px (click to edit)`;
        marginDiv.addEventListener('click', () => this.editMargin());
        // Inner (padding) rectangle
        const paddingDiv = document.createElement('div');
        paddingDiv.className = 'box-model-padding';
        paddingDiv.title = `Padding: ${this.padding}px (click to edit)`;
        paddingDiv.addEventListener('click', () => this.editPadding());
        // Content placeholder
        const contentDiv = document.createElement('div');
        contentDiv.className = 'box-model-content';
        contentDiv.textContent = 'Content';
        // Assemble
        paddingDiv.appendChild(contentDiv);
        marginDiv.appendChild(paddingDiv);
        wrapper.appendChild(marginDiv);
        this.container.appendChild(wrapper);
    }

    private editMargin() {
        const val = prompt('Enter margin (px)', String(this.margin));
        if (val !== null) {
            const num = parseInt(val);
            if (!isNaN(num)) {
                this.margin = num;
                this.onChange({ margin: this.margin, padding: this.padding });
                this.render();
            }
        }
    }

    private editPadding() {
        const val = prompt('Enter padding (px)', String(this.padding));
        if (val !== null) {
            const num = parseInt(val);
            if (!isNaN(num)) {
                this.padding = num;
                this.onChange({ margin: this.margin, padding: this.padding });
                this.render();
            }
        }
    }
}
