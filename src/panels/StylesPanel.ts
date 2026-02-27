import { EditorCore } from '../editor/EditorCore';
import { ColorInput } from '../utils/ColorInput';
import { rgbToHex, parsePx, getTagDescriptor, showToast } from '../utils/dom-helpers';

export class StylesPanel {
    private editor: EditorCore;
    private currentElement: HTMLElement | null = null;
    private suppressUpdates = false;

    // Element style controls (HEX color inputs)
    private colorInput!: ColorInput;
    private bgColorInput!: ColorInput;
    private borderColorInput!: ColorInput;

    // Element style controls (standard)
    private fontFamilySelect!: HTMLSelectElement;
    private fontSizeInput!: HTMLInputElement;
    private fontWeightSelect!: HTMLSelectElement;
    private letterSpacingInput!: HTMLInputElement;
    private paddingInput!: HTMLInputElement;
    private marginInput!: HTMLInputElement;
    private borderWidthInput!: HTMLInputElement;
    private borderRadiusInput!: HTMLInputElement;
    private alignButtons!: NodeListOf<HTMLElement>;
    private borderStyleSelect!: HTMLSelectElement;

    // Link controls
    private linkSection!: HTMLElement;
    private linkUrlInput!: HTMLInputElement;
    private linkTargetSelect!: HTMLSelectElement;

    // Image controls
    private imgSelectedSettings!: HTMLElement;
    private imgUrlInput!: HTMLInputElement;
    private imgAltInput!: HTMLInputElement;
    private imgUrlGo!: HTMLElement;
    private imgDropZone!: HTMLElement;
    private imgFileInput!: HTMLInputElement;
    private imgObjectFit!: HTMLSelectElement;
    private imgWidth!: HTMLInputElement;
    private imgHeight!: HTMLInputElement;
    private imgRadius!: HTMLInputElement;
    private imgOpacity!: HTMLInputElement;
    private imgShadow!: HTMLSelectElement;
    private imgBrightness!: HTMLInputElement;
    private imgContrast!: HTMLInputElement;
    private imgGrayscale!: HTMLInputElement;
    private imgBlur!: HTMLInputElement;

    // Global controls (HEX color inputs)
    private globalTextColor!: ColorInput;
    private globalBgColor!: ColorInput;

    // Global controls (standard)
    private globalFontFamily!: HTMLSelectElement;
    private globalFontSize!: HTMLInputElement;
    private globalFontWeight!: HTMLSelectElement;
    private globalLineHeight!: HTMLInputElement;

    // Display elements
    private noSelectionMsg!: HTMLElement;
    private elementStyles!: HTMLElement;
    private selectedTagEl!: HTMLElement;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.bindElements();
        this.setupTabs();
        this.setupListeners();
        this.setupLinkListeners();
        this.setupImageListeners();
        this.setupEventBus();
        this.initFontPicker();
    }

    private bindElements(): void {
        // Element color inputs — now using ColorInput with HEX
        this.colorInput = new ColorInput('style-color');
        this.bgColorInput = new ColorInput('style-bg-color');
        this.borderColorInput = new ColorInput('style-border-color');

        // Element styles (standard inputs)
        this.fontFamilySelect = document.getElementById('style-font-family') as HTMLSelectElement;
        this.borderStyleSelect = document.getElementById('style-border-style') as HTMLSelectElement;
        this.fontSizeInput = document.getElementById('style-font-size') as HTMLInputElement;
        this.fontWeightSelect = document.getElementById('style-font-weight') as HTMLSelectElement;
        this.letterSpacingInput = document.getElementById('style-letter-spacing') as HTMLInputElement;
        this.paddingInput = document.getElementById('style-padding') as HTMLInputElement;
        this.marginInput = document.getElementById('style-margin') as HTMLInputElement;
        this.borderWidthInput = document.getElementById('style-border-width') as HTMLInputElement;
        this.borderRadiusInput = document.getElementById('style-border-radius') as HTMLInputElement;
        this.alignButtons = document.querySelectorAll('.align-btn') as NodeListOf<HTMLElement>;

        // Link
        this.linkSection = document.getElementById('link-section') as HTMLElement;
        this.linkUrlInput = document.getElementById('link-url-input') as HTMLInputElement;
        this.linkTargetSelect = document.getElementById('link-target-select') as HTMLSelectElement;

        // Image
        this.imgSelectedSettings = document.getElementById('img-selected-settings') as HTMLElement;
        this.imgUrlInput = document.getElementById('img-url-input') as HTMLInputElement;
        this.imgAltInput = document.getElementById('img-alt-input') as HTMLInputElement;
        this.imgUrlGo = document.getElementById('img-url-go') as HTMLElement;
        this.imgDropZone = document.getElementById('img-drop-zone') as HTMLElement;
        this.imgFileInput = document.getElementById('img-file-input') as HTMLInputElement;
        this.imgObjectFit = document.getElementById('img-object-fit') as HTMLSelectElement;
        this.imgWidth = document.getElementById('img-width') as HTMLInputElement;
        this.imgHeight = document.getElementById('img-height') as HTMLInputElement;
        this.imgRadius = document.getElementById('img-radius') as HTMLInputElement;
        this.imgOpacity = document.getElementById('img-opacity') as HTMLInputElement;
        this.imgShadow = document.getElementById('img-shadow') as HTMLSelectElement;
        this.imgBrightness = document.getElementById('img-brightness') as HTMLInputElement;
        this.imgContrast = document.getElementById('img-contrast') as HTMLInputElement;
        this.imgGrayscale = document.getElementById('img-grayscale') as HTMLInputElement;
        this.imgBlur = document.getElementById('img-blur') as HTMLInputElement;

        // Global color inputs — now using ColorInput with HEX
        this.globalTextColor = new ColorInput('global-text-color');
        this.globalBgColor = new ColorInput('global-bg-color');

        // Global styles (standard inputs)
        this.globalFontFamily = document.getElementById('global-font-family') as HTMLSelectElement;
        this.globalFontSize = document.getElementById('global-font-size') as HTMLInputElement;
        this.globalFontWeight = document.getElementById('global-font-weight') as HTMLSelectElement;
        this.globalLineHeight = document.getElementById('global-line-height') as HTMLInputElement;

        // Display
        this.noSelectionMsg = document.getElementById('no-selection-msg') as HTMLElement;
        this.elementStyles = document.getElementById('element-styles') as HTMLElement;
        this.selectedTagEl = document.getElementById('selected-element-tag') as HTMLElement;
    }

    // Initialize custom font picker
    private initFontPicker(): void {
        const FONTS = [
            { label: 'Inter', value: 'Inter, sans-serif' },
            { label: 'Roboto', value: 'Roboto, sans-serif' },
            { label: 'Poppins', value: 'Poppins, sans-serif' },
            { label: 'Montserrat', value: 'Montserrat, sans-serif' },
            { label: 'Open Sans', value: '"Open Sans", sans-serif' },
            { label: 'Lato', value: 'Lato, sans-serif' },
            { label: 'Raleway', value: 'Raleway, sans-serif' },
            { label: 'Nunito', value: 'Nunito, sans-serif' },
            { label: 'Playfair Display', value: '"Playfair Display", serif' },
            { label: 'Merriweather', value: 'Merriweather, serif' },
            { label: 'Work Sans', value: '"Work Sans", sans-serif' },
            { label: 'DM Sans', value: '"DM Sans", sans-serif' },
            { label: 'Space Grotesk', value: '"Space Grotesk", sans-serif' },
            { label: 'Outfit', value: 'Outfit, sans-serif' },
            { label: 'Fira Sans', value: '"Fira Sans", sans-serif' },
            { label: 'Helvetica', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
            { label: 'Georgia', value: 'Georgia, serif' },
            { label: 'System', value: 'system-ui, sans-serif' }
        ];

        const wrapper = this.fontFamilySelect.parentElement!;
        wrapper.style.position = 'relative';
        // Hide native select
        this.fontFamilySelect.style.display = 'none';

        // Create trigger button
        const trigger = document.createElement('div');
        trigger.className = 'font-picker-trigger';
        trigger.id = 'font-picker-trigger';
        trigger.innerHTML = '<span class="font-picker-label">Inter</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
        wrapper.appendChild(trigger);

        // Create dropdown (appended to body so it's not clipped by overflow)
        const dropdown = document.createElement('div');
        dropdown.className = 'font-picker-dropdown';
        dropdown.id = 'font-picker-dropdown';

        // Search input
        const searchWrap = document.createElement('div');
        searchWrap.className = 'font-picker-search-wrap';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search fonts…';
        searchInput.className = 'font-picker-search';
        searchWrap.appendChild(searchInput);
        dropdown.appendChild(searchWrap);

        // Items container (scrollable)
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'font-picker-items';

        FONTS.forEach(f => {
            const item = document.createElement('div');
            item.className = 'font-picker-item';
            item.dataset.value = f.value;
            item.textContent = f.label;
            item.style.fontFamily = f.value;
            item.addEventListener('click', () => {
                this.fontFamilySelect.value = f.value;
                this.fontFamilySelect.dispatchEvent(new Event('change'));
                trigger.querySelector('.font-picker-label')!.textContent = f.label;
                (trigger.querySelector('.font-picker-label') as HTMLElement).style.fontFamily = f.value;
                dropdown.classList.remove('open');
                trigger.classList.remove('open');
            });
            itemsContainer.appendChild(item);
        });
        dropdown.appendChild(itemsContainer);

        // Append to document body to avoid sidebar overflow clipping
        document.body.appendChild(dropdown);

        // Search filter
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            itemsContainer.querySelectorAll('.font-picker-item').forEach((item) => {
                const el = item as HTMLElement;
                el.style.display = el.textContent!.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // Prevent clicks inside dropdown from bubbling to document close handler
        dropdown.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        // Position and toggle dropdown
        const positionDropdown = () => {
            const rect = trigger.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.top = (rect.bottom + 4) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.width = rect.width + 'px';
        };

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            if (!isOpen) {
                positionDropdown();
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
            dropdown.classList.toggle('open', !isOpen);
            trigger.classList.toggle('open', !isOpen);
            if (!isOpen) {
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        // Close on outside click
        document.addEventListener('mousedown', (e) => {
            if (!dropdown.contains(e.target as Node) && !trigger.contains(e.target as Node)) {
                dropdown.classList.remove('open');
                trigger.classList.remove('open');
            }
        });

        // Store reference for updating
        (this as any)._fontPickerTrigger = trigger;
        (this as any)._fontPickerDropdown = dropdown;
        (this as any)._fontPickerFonts = FONTS;
    }

    private setupTabs(): void {
        const tabs = document.querySelectorAll('.panel-tab');
        const elementContent = document.getElementById('panel-content-element')!;
        const insertContent = document.getElementById('panel-content-insert')!;
        const sectionsContent = document.getElementById('panel-content-sections')!;
        const generalContent = document.getElementById('panel-content-global-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = (tab as HTMLElement).dataset.tab;
                elementContent.classList.toggle('active', tabName === 'element');
                insertContent.classList.toggle('active', tabName === 'insert');
                if (sectionsContent) {
                    sectionsContent.classList.toggle('active', tabName === 'sections');
                }
                if (generalContent) {
                    generalContent.classList.toggle('active', tabName === 'global');
                }
            });
        });
    }

    private setupListeners(): void {
        // Helper: apply element style and push to history
        const applyStyle = (prop: string, value: string) => {
            if (this.suppressUpdates || !this.currentElement) return;
            this.editor.styleMutator.apply(this.currentElement, prop, value);
            this.editor.selectionManager.refreshSelectOverlay();
            this.editor.pushHistory(`Change ${prop}`);
        };

        // ─── Element Colors (HEX) ──────────────────────────────
        this.colorInput.onChange((hex) => applyStyle('color', hex));
        this.bgColorInput.onChange((hex) => applyStyle('backgroundColor', hex));
        this.borderColorInput.onChange((hex) => {
            if (!this.currentElement) return;
            applyStyle('borderColor', hex);
            if (!this.currentElement.style.borderStyle) {
                applyStyle('borderStyle', 'solid');
            }
        });

        // ─── Element Typography ─────────────────────────────────
        this.fontFamilySelect.addEventListener('change', () => applyStyle('fontFamily', this.fontFamilySelect.value));
        this.fontSizeInput.addEventListener('input', () => applyStyle('fontSize', this.fontSizeInput.value + 'px'));
        this.fontWeightSelect.addEventListener('change', () => applyStyle('fontWeight', this.fontWeightSelect.value));
        this.letterSpacingInput.addEventListener('input', () => applyStyle('letterSpacing', this.letterSpacingInput.value + 'px'));

        // Line height (per-element)
        const lineHeightInput = document.getElementById('style-line-height') as HTMLInputElement;
        if (lineHeightInput) {
            lineHeightInput.addEventListener('input', () => applyStyle('lineHeight', lineHeightInput.value));
        }

        // Text transform
        const textTransformSelect = document.getElementById('style-text-transform') as HTMLSelectElement;
        if (textTransformSelect) {
            textTransformSelect.addEventListener('change', () => applyStyle('textTransform', textTransformSelect.value));
        }

        // Typography toggle buttons (italic, underline, strikethrough)
        document.querySelectorAll<HTMLButtonElement>('.typo-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.currentElement) return;
                const prop = btn.dataset.prop || '';
                const onVal = btn.dataset.on || '';
                const offVal = btn.dataset.off || '';
                const cs = window.getComputedStyle(this.currentElement);
                const currentVal = (cs as any)[prop] || '';
                const isOn = currentVal.includes(onVal);
                btn.classList.toggle('active', !isOn);
                applyStyle(prop, isOn ? offVal : onVal);
            });
        });

        // ─── Element Spacing ────────────────────────────────────
        this.paddingInput.addEventListener('input', () => {
            applyStyle('padding', `${parseInt(this.paddingInput.value) || 0}px`);
        });
        this.marginInput.addEventListener('input', () => {
            applyStyle('margin', `${parseInt(this.marginInput.value) || 0}px`);
        });

        // ─── Element Border ─────────────────────────────────────
        this.borderWidthInput.addEventListener('input', () => {
            applyStyle('borderWidth', this.borderWidthInput.value + 'px');
            // Auto-set border-style to solid if width > 0 and style is none
            if (this.currentElement && parseInt(this.borderWidthInput.value) > 0) {
                const cs = window.getComputedStyle(this.currentElement);
                if (!cs.borderStyle || cs.borderStyle === 'none') {
                    applyStyle('borderStyle', 'solid');
                    this.borderStyleSelect.value = 'solid';
                }
            }
        });
        this.borderRadiusInput.addEventListener('input', () => applyStyle('borderRadius', this.borderRadiusInput.value + 'px'));
        // Border style
        if (this.borderStyleSelect) {
            this.borderStyleSelect.addEventListener('change', () => applyStyle('borderStyle', this.borderStyleSelect.value));
        }

        // Align buttons
        this.alignButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const align = btn.dataset.align || 'left';
                applyStyle('textAlign', align);
                this.updateAlignButtons(align);
            });
        });

        // ─── Global Colors (HEX) ───────────────────────────────
        this.globalTextColor.onChange((hex) => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'color', hex); this.editor.pushHistory('Global text color'); }
        });

        this.globalBgColor.onChange((hex) => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'backgroundColor', hex); this.editor.pushHistory('Global bg color'); }
        });

        // ─── Global Typography ──────────────────────────────────
        this.globalFontFamily.addEventListener('change', () => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'fontFamily', this.globalFontFamily.value); this.editor.pushHistory('Font family'); }
        });

        this.globalFontSize.addEventListener('input', () => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'fontSize', this.globalFontSize.value + 'px'); this.editor.pushHistory('Font size'); }
        });

        this.globalFontWeight.addEventListener('change', () => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'fontWeight', this.globalFontWeight.value); this.editor.pushHistory('Font weight'); }
        });

        // ─── Global Spacing ─────────────────────────────────────
        this.globalLineHeight.addEventListener('input', () => {
            const doc = this.editor.getIframeDocument();
            if (doc) { this.editor.styleMutator.applyGlobal(doc, 'lineHeight', this.globalLineHeight.value); this.editor.pushHistory('Line height'); }
        });
    }

    private setupLinkListeners(): void {
        const applyBtn = document.getElementById('link-apply-btn');
        const removeBtn = document.getElementById('link-remove-btn');

        applyBtn?.addEventListener('click', () => {
            if (!this.currentElement) return;
            const url = this.linkUrlInput.value.trim();
            if (!url) return;
            const target = this.linkTargetSelect.value;
            const doc = this.editor.getIframeDocument();
            if (!doc) return;

            // If element is already an <a>, update it
            if (this.currentElement.tagName === 'A') {
                (this.currentElement as HTMLAnchorElement).href = url;
                (this.currentElement as HTMLAnchorElement).target = target;
                this.editor.pushHistory('Update link');
                return;
            }

            // If parent is already an <a>, update it
            const parentA = this.currentElement.closest('a');
            if (parentA) {
                parentA.href = url;
                parentA.target = target;
                this.editor.pushHistory('Update link');
                return;
            }

            // Wrap in <a>
            const a = doc.createElement('a');
            a.href = url;
            a.target = target;
            a.style.cssText = 'text-decoration: none; color: inherit; display: inline-block;';
            this.currentElement.parentNode?.insertBefore(a, this.currentElement);
            a.appendChild(this.currentElement);
            this.editor.bus.emit('dom:changed');
            this.editor.pushHistory('Wrap in link');
            this.editor.selectionManager.selectElement(a);
        });

        removeBtn?.addEventListener('click', () => {
            if (!this.currentElement) return;
            const doc = this.editor.getIframeDocument();
            if (!doc) return;

            let anchor: HTMLAnchorElement | null = null;
            if (this.currentElement.tagName === 'A') {
                anchor = this.currentElement as HTMLAnchorElement;
            } else {
                anchor = this.currentElement.closest('a');
            }

            if (anchor && anchor.parentNode) {
                // Unwrap: move children out, remove <a>
                while (anchor.firstChild) {
                    anchor.parentNode.insertBefore(anchor.firstChild, anchor);
                }
                const nextEl = anchor.previousElementSibling as HTMLElement || anchor.nextElementSibling as HTMLElement;
                anchor.parentNode.removeChild(anchor);
                this.editor.bus.emit('dom:changed');
                this.editor.pushHistory('Remove link');
                if (nextEl) {
                    this.editor.selectionManager.selectElement(nextEl);
                } else {
                    this.editor.selectionManager.clearSelection();
                }
                this.linkUrlInput.value = '';
            }
        });
    }

    private setupImageListeners(): void {
        if (!this.imgSelectedSettings) return;

        // Insert from URL
        this.imgUrlGo.addEventListener('click', () => {
            const url = this.imgUrlInput.value.trim();
            if (!url) { showToast('Enter an image URL'); return; }
            if (this.currentElement && this.currentElement.tagName === 'IMG') {
                (this.currentElement as HTMLImageElement).src = url;
                (this.currentElement as HTMLImageElement).alt = this.imgAltInput.value || 'Image';
                this.editor.pushHistory('Update image source');
                showToast('Image updated!');
            }
        });

        this.imgUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.imgUrlGo.click();
        });

        // Alt Text change
        this.imgAltInput.addEventListener('change', () => {
            if (this.currentElement && this.currentElement.tagName === 'IMG') {
                (this.currentElement as HTMLImageElement).alt = this.imgAltInput.value || 'Image';
                this.editor.pushHistory('Update image alt');
            }
        });

        // Click to browse
        this.imgDropZone.addEventListener('click', () => this.imgFileInput.click());

        this.imgFileInput.addEventListener('change', () => {
            const file = this.imgFileInput.files?.[0];
            if (file) {
                this.insertFileAsImage(file, this.imgAltInput.value || 'Image');
            }
            this.imgFileInput.value = '';
        });

        // Drag & drop
        this.imgDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imgDropZone.classList.add('drag-over');
        });

        this.imgDropZone.addEventListener('dragleave', () => {
            this.imgDropZone.classList.remove('drag-over');
        });

        this.imgDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imgDropZone.classList.remove('drag-over');
            const file = e.dataTransfer?.files?.[0];
            if (file && file.type.startsWith('image/')) {
                this.insertFileAsImage(file, this.imgAltInput.value || 'Image');
            } else {
                showToast('Please drop an image file.');
            }
        });

        // Styling
        const applyImgStyle = (prop: string, value: string) => {
            if (!this.currentElement || this.currentElement.tagName !== 'IMG') return;
            this.editor.styleMutator.apply(this.currentElement, prop, value);
            this.editor.selectionManager.refreshSelectOverlay();
            this.editor.pushHistory(`Image ${prop}`);
        };

        this.imgObjectFit.addEventListener('change', () => applyImgStyle('objectFit', this.imgObjectFit.value));
        this.imgWidth.addEventListener('input', () => {
            const val = this.imgWidth.value;
            applyImgStyle('width', val ? val + 'px' : 'auto');
        });
        this.imgHeight.addEventListener('input', () => {
            const val = this.imgHeight.value;
            applyImgStyle('height', val ? val + 'px' : 'auto');
        });
        this.imgRadius.addEventListener('input', () => applyImgStyle('borderRadius', this.imgRadius.value + 'px'));
        this.imgOpacity.addEventListener('input', () => applyImgStyle('opacity', String(Number(this.imgOpacity.value) / 100)));
        this.imgShadow.addEventListener('change', () => applyImgStyle('boxShadow', this.imgShadow.value));

        // Filters — compose combined filter string
        const applyImgFilter = () => {
            if (!this.currentElement || this.currentElement.tagName !== 'IMG') return;
            const b = this.imgBrightness?.value || '100';
            const c = this.imgContrast?.value || '100';
            const g = this.imgGrayscale?.value || '0';
            const bl = this.imgBlur?.value || '0';
            const filter = `brightness(${b}%) contrast(${c}%) grayscale(${g}%) blur(${bl}px)`;
            this.editor.styleMutator.apply(this.currentElement, 'filter', filter);
            this.editor.selectionManager.refreshSelectOverlay();
            this.editor.pushHistory('Image filter');
        };
        this.imgBrightness?.addEventListener('input', applyImgFilter);
        this.imgContrast?.addEventListener('input', applyImgFilter);
        this.imgGrayscale?.addEventListener('input', applyImgFilter);
        this.imgBlur?.addEventListener('input', applyImgFilter);
    }

    private insertFileAsImage(file: File, alt: string): void {
        const reader = new FileReader();
        reader.onload = () => {
            if (this.currentElement && this.currentElement.tagName === 'IMG') {
                (this.currentElement as HTMLImageElement).src = reader.result as string;
                (this.currentElement as HTMLImageElement).alt = alt;
                this.editor.pushHistory('Update image file');
                showToast('Image updated!');
            }
        };
        reader.readAsDataURL(file);
    }

    private setupEventBus(): void {
        this.editor.bus.on('selection:change', (el: HTMLElement) => {
            this.currentElement = el;
            this.showElementStyles(el);
        });

        this.editor.bus.on('selection:clear', () => {
            this.currentElement = null;
            this.showNoSelection();
        });

        this.editor.bus.on('content:loaded', () => {
            this.loadGlobalStyles();
        });
    }

    private showNoSelection(): void {
        this.noSelectionMsg.style.display = 'flex';
        this.elementStyles.style.display = 'none';
    }

    private showElementStyles(el: HTMLElement): void {
        this.noSelectionMsg.style.display = 'none';
        this.elementStyles.style.display = 'flex';
        this.selectedTagEl.textContent = getTagDescriptor(el);
        this.populateStyles(el);
        this.populateLink(el);
        this.populateImage(el);
    }

    private populateStyles(el: HTMLElement): void {
        this.suppressUpdates = true;
        const computed = getComputedStyle(el);

        // Colors (HEX)
        this.colorInput.value = rgbToHex(computed.color);
        this.bgColorInput.value = rgbToHex(computed.backgroundColor);

        // Typography
        const fontFamily = computed.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        this.selectClosestOption(this.fontFamilySelect, fontFamily);
        this.fontSizeInput.value = String(parsePx(computed.fontSize));
        this.selectClosestWeight(computed.fontWeight);
        this.letterSpacingInput.value = String(parsePx(computed.letterSpacing));

        // Line height (per-element)
        const lineHeightInput = document.getElementById('style-line-height') as HTMLInputElement;
        if (lineHeightInput) {
            const lh = computed.lineHeight;
            if (lh === 'normal') {
                lineHeightInput.value = '1.5';
            } else {
                const fs = parseFloat(computed.fontSize) || 16;
                lineHeightInput.value = (parseFloat(lh) / fs).toFixed(1);
            }
        }

        // Text transform
        const textTransformSelect = document.getElementById('style-text-transform') as HTMLSelectElement;
        if (textTransformSelect) {
            this.selectClosestOption(textTransformSelect, computed.textTransform || 'none');
        }

        // Typography toggles
        const italicBtn = document.getElementById('style-italic-toggle');
        if (italicBtn) italicBtn.classList.toggle('active', computed.fontStyle === 'italic');
        const underlineBtn = document.getElementById('style-underline-toggle');
        if (underlineBtn) underlineBtn.classList.toggle('active', computed.textDecoration.includes('underline'));
        const linethroughBtn = document.getElementById('style-linethrough-toggle');
        if (linethroughBtn) linethroughBtn.classList.toggle('active', computed.textDecoration.includes('line-through'));

        // Alignment
        this.updateAlignButtons(computed.textAlign);

        // Spacing
        this.paddingInput.value = String(parsePx(computed.padding));
        this.marginInput.value = String(parsePx(computed.margin));

        // Border
        this.borderWidthInput.value = String(parsePx(computed.borderWidth));
        this.borderRadiusInput.value = String(parsePx(computed.borderRadius));
        this.borderColorInput.value = rgbToHex(computed.borderColor);
        if (this.borderStyleSelect) {
            const bs = computed.borderStyle || 'none';
            // borderStyle can return "solid solid solid solid" — take first word
            this.borderStyleSelect.value = bs.split(' ')[0];
        }

        // Update font picker trigger label
        const fontPickerTrigger = (this as any)._fontPickerTrigger as HTMLElement;
        const fontPickerFonts = (this as any)._fontPickerFonts as Array<{ label: string, value: string }>;
        if (fontPickerTrigger && fontPickerFonts) {
            const fontFamily = computed.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
            const match = fontPickerFonts.find((f: any) => f.value.toLowerCase().includes(fontFamily.toLowerCase()) || f.label.toLowerCase() === fontFamily.toLowerCase());
            const lbl = fontPickerTrigger.querySelector('.font-picker-label') as HTMLElement;
            if (lbl) {
                lbl.textContent = match ? match.label : fontFamily;
                lbl.style.fontFamily = match ? match.value : fontFamily;
            }
        }

        this.suppressUpdates = false;
    }

    private populateLink(el: HTMLElement): void {
        if (!this.linkSection) return;
        this.linkSection.style.display = 'block';

        // Check if element is <a> or wrapped in <a>
        let anchor: HTMLAnchorElement | null = null;
        if (el.tagName === 'A') {
            anchor = el as HTMLAnchorElement;
        } else {
            anchor = el.closest('a');
        }

        if (anchor) {
            this.linkUrlInput.value = anchor.href || '';
            this.linkTargetSelect.value = anchor.target || '_self';
        } else {
            this.linkUrlInput.value = '';
            this.linkTargetSelect.value = '_self';
        }
    }

    private populateImage(el: HTMLElement): void {
        if (!this.imgSelectedSettings) return;

        if (el.tagName !== 'IMG') {
            this.imgSelectedSettings.style.display = 'none';
            return;
        }

        this.imgSelectedSettings.style.display = 'block';
        const img = el as HTMLImageElement;

        // Setup values
        this.imgUrlInput.value = img.src.startsWith('data:') ? '' : img.src;
        this.imgAltInput.value = img.alt || 'Image';

        const computed = getComputedStyle(el);

        this.imgObjectFit.value = img.style.objectFit || 'cover';
        this.imgWidth.value = String(parsePx(computed.width));
        this.imgHeight.value = String(parsePx(computed.height));
        this.imgRadius.value = String(parsePx(computed.borderRadius));

        const opacity = parseFloat(computed.opacity) * 100;
        this.imgOpacity.value = String(Math.round(opacity));

        const shadow = computed.boxShadow;
        if (shadow === 'none' || !shadow) {
            this.imgShadow.value = 'none';
        } else {
            // keep current value
        }

        // Parse filter values
        const filter = computed.filter || '';
        const bMatch = filter.match(/brightness\(([\d.]+)%?\)/);
        const cMatch = filter.match(/contrast\(([\d.]+)%?\)/);
        const gMatch = filter.match(/grayscale\(([\d.]+)%?\)/);
        const blMatch = filter.match(/blur\(([\d.]+)px\)/);
        if (this.imgBrightness) this.imgBrightness.value = bMatch ? String(Math.round(Number(bMatch[1]))) : '100';
        if (this.imgContrast) this.imgContrast.value = cMatch ? String(Math.round(Number(cMatch[1]))) : '100';
        if (this.imgGrayscale) this.imgGrayscale.value = gMatch ? String(Math.round(Number(gMatch[1]))) : '0';
        if (this.imgBlur) this.imgBlur.value = blMatch ? String(Math.round(Number(blMatch[1]))) : '0';
    }

    private selectClosestOption(select: HTMLSelectElement, value: string): void {
        const lower = value.toLowerCase();
        for (const opt of Array.from(select.options)) {
            if (opt.value.toLowerCase().includes(lower) || opt.text.toLowerCase().includes(lower)) {
                select.value = opt.value;
                return;
            }
        }
    }

    private selectClosestWeight(weight: string): void {
        const numWeight = parseInt(weight) || 400;
        const options = Array.from(this.fontWeightSelect.options);
        let closest = options[0];
        let closestDiff = Infinity;
        for (const opt of options) {
            const diff = Math.abs(parseInt(opt.value) - numWeight);
            if (diff < closestDiff) {
                closestDiff = diff;
                closest = opt;
            }
        }
        this.fontWeightSelect.value = closest.value;
    }

    private updateAlignButtons(align: string): void {
        if (align === 'start') align = 'left';
        if (align === 'end') align = 'right';

        this.alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === align);
        });
    }

    private loadGlobalStyles(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        const computed = getComputedStyle(doc.body);

        // Colors (HEX)
        this.globalTextColor.value = rgbToHex(computed.color);
        this.globalBgColor.value = rgbToHex(computed.backgroundColor);

        // Typography
        const fontFamily = computed.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        this.selectClosestOption(this.globalFontFamily, fontFamily);
        this.globalFontSize.value = String(parsePx(computed.fontSize));

        // Weight
        const numWeight = parseInt(computed.fontWeight) || 400;
        const weightOptions = Array.from(this.globalFontWeight.options);
        let closestWeight = weightOptions[2];
        let closestDiff = Infinity;
        for (const opt of weightOptions) {
            const diff = Math.abs(parseInt(opt.value) - numWeight);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestWeight = opt;
            }
        }
        this.globalFontWeight.value = closestWeight.value;

        // Spacing
        const lineHeight = parseFloat(computed.lineHeight) / parseFloat(computed.fontSize);
        this.globalLineHeight.value = String(isNaN(lineHeight) ? 1.6 : Math.round(lineHeight * 10) / 10);

        // Paragraph spacing from first <p>
        const firstP = doc.querySelector('p');
        // Removed globalParagraphSpacing binding since it's no longer in the UI
    }
}
