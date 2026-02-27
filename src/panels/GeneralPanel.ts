import { EditorCore } from '../editor/EditorCore';
import { ColorInput } from '../utils/ColorInput';
import { showToast } from '../utils/dom-helpers';

interface ColorPreset {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        text: string;
        bg: string;
    };
}

const GP_STORAGE_KEY = 'snapedit-general-panel-state';

const CHEVRON_SVG = `<svg class="gp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;

const SECTION_ICONS = {
    colors: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><circle cx="8.5" cy="15.5" r="2.5"/></svg>`,
    typography: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    buttons: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`,
    transitions: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
};

export class GeneralPanel {
    private editor: EditorCore;

    private presets: ColorPreset[] = [
        { id: 'p1', name: 'Light Default', colors: { primary: '#4361ee', secondary: '#f72585', text: '#1f2937', bg: '#ffffff' } },
        { id: 'p2', name: 'Dark Mode', colors: { primary: '#3b82f6', secondary: '#8b5cf6', text: '#f3f4f6', bg: '#111827' } },
        { id: 'p3', name: 'Earthy', colors: { primary: '#2d6a4f', secondary: '#d4a373', text: '#3c3633', bg: '#fefae0' } },
        { id: 'p4', name: 'Ocean', colors: { primary: '#03045e', secondary: '#0077b6', text: '#023e8a', bg: '#caf0f8' } },
        { id: 'p5', name: 'Sunset', colors: { primary: '#d90429', secondary: '#ef233c', text: '#2b2d42', bg: '#edf2f4' } },
        { id: 'p6', name: 'Monochrome', colors: { primary: '#4b5563', secondary: '#9ca3af', text: '#111827', bg: '#f9fafb' } }
    ];

    private activePresetId: string = 'p1';

    // Color pickers — lazily created
    private presetPrimaryInput!: ColorInput;
    private presetSecondaryInput!: ColorInput;
    private presetTextInput!: ColorInput;
    private presetBgInput!: ColorInput;
    private typoColorInput!: ColorInput;
    private btnBgInput!: ColorInput;
    private btnTextInput!: ColorInput;
    private btnHoverBgInput!: ColorInput;
    private btnHoverTextInput!: ColorInput;

    // State
    private typoStyles: Record<string, any> = {};
    private sectionOpen: Record<string, boolean> = { colors: true, typography: true, buttons: true, transitions: false };
    private activeTypoTag = 'body';
    private activeBtnVariant = 'primary';
    private activeBodyFont = 'Inter';
    private activeHeadingFont = 'Inter';
    private btnVariants: Record<string, { bg: string; text: string; radius: string; padding: string; hoverBg: string; hoverText: string; hoverOpacity: string }> = {
        primary: { bg: '#4361ee', text: '#ffffff', radius: '8', padding: '10px 20px', hoverBg: '#3451d4', hoverText: '#ffffff', hoverOpacity: '0.9' },
        secondary: { bg: '#f72585', text: '#ffffff', radius: '8', padding: '10px 20px', hoverBg: '#d91f73', hoverText: '#ffffff', hoverOpacity: '0.9' },
        tertiary: { bg: 'transparent', text: '#4361ee', radius: '8', padding: '10px 20px', hoverBg: 'rgba(67,97,238,0.08)', hoverText: '#3451d4', hoverOpacity: '1' }
    };

    private root!: HTMLElement;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.loadState();
        this.loadSavedPresets();

        this.editor.bus.on('content:loaded', () => {
            this.ensureGlobalStyles();
        });

        this.buildUI();
    }

    // ─── State persistence ───────────────────────────────────────
    private loadState() {
        try {
            const s = localStorage.getItem(GP_STORAGE_KEY);
            if (s) {
                const data = JSON.parse(s);
                if (data.sectionOpen) this.sectionOpen = data.sectionOpen;
            }
        } catch { /* ignore */ }
    }

    private saveState() {
        try {
            localStorage.setItem(GP_STORAGE_KEY, JSON.stringify({ sectionOpen: this.sectionOpen }));
        } catch { /* ignore */ }
    }

    // ─── Ensure global styles block in iframe ────────────────────
    private ensureGlobalStyles() {
        const doc = this.editor.getIframeDocument();
        if (!doc) return;
        if (!doc.getElementById('se-general-styles')) {
            const style = doc.createElement('style');
            style.id = 'se-general-styles';
            style.textContent = `
                /* SnapEdit General Styles */
                body { transition: background-color 0.3s, color 0.3s; }
                .btn-primary { background: var(--se-primary, #4361ee); color: #fff; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; }
                .btn-secondary { background: var(--se-secondary, #f72585); color: #fff; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; }
                .btn-tertiary { background: transparent; color: var(--se-primary, #4361ee); padding: 10px 20px; border-radius: 8px; border: 1px solid var(--se-primary, #4361ee); cursor: pointer; }
            `;
            doc.head.appendChild(style);
        }
    }

    // ─── Build the entire General panel UI ────────────────────────
    private buildUI() {
        this.root = document.getElementById('global-panel-root')!;
        if (!this.root) return;
        this.root.innerHTML = '';
        this.root.className = 'gp-root';

        // === Colors Section ===
        this.root.appendChild(this.buildSection('colors', 'Color Presets', '6 presets', SECTION_ICONS.colors, (body) => {
            // Preset grid
            const grid = document.createElement('div');
            grid.className = 'gp-preset-grid';
            grid.id = 'gp-preset-grid';
            body.appendChild(grid);
            this.renderPresetCards(grid);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'gp-preset-actions';
            const editBtn = document.createElement('button');
            editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit`;
            editBtn.addEventListener('click', () => this.showPresetEditor());
            const addBtn = document.createElement('button');
            addBtn.className = 'primary';
            addBtn.textContent = '+ Add';
            addBtn.addEventListener('click', () => this.showPresetEditor(true));
            actions.appendChild(editBtn);
            actions.appendChild(addBtn);
            body.appendChild(actions);

            // Hidden editor
            const editor = this.buildPresetEditor();
            body.appendChild(editor);
        }));

        // === Typography Section ===
        this.root.appendChild(this.buildSection('typography', 'Typography', 'Global tags', SECTION_ICONS.typography, (body) => {
            // Global Font selectors
            const fontGrid = document.createElement('div');
            fontGrid.className = 'style-row-grid two-col';
            fontGrid.style.cssText = 'margin-bottom: 14px; gap: 8px;';

            const fonts = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'Work Sans', 'DM Sans', 'Space Grotesk', 'Outfit', 'Fira Sans'];

            // Body Font
            const bodyFontWrap = document.createElement('div');
            const bodyFontLabel = document.createElement('label');
            bodyFontLabel.textContent = 'Body Font';
            bodyFontLabel.style.cssText = 'display:block; font-size:11px; color:var(--panel-text-dim); margin-bottom:6px; font-weight:500;';
            bodyFontWrap.appendChild(bodyFontLabel);

            const bodyFontSelect = document.createElement('select');
            bodyFontSelect.className = 'gp-font-select';
            bodyFontSelect.id = 'gp-body-font';
            fonts.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                opt.style.fontFamily = f;
                if (f === this.activeBodyFont) opt.selected = true;
                bodyFontSelect.appendChild(opt);
            });
            bodyFontSelect.addEventListener('change', () => {
                this.activeBodyFont = bodyFontSelect.value;
                this.applyGlobalFonts();
            });
            bodyFontWrap.appendChild(bodyFontSelect);
            fontGrid.appendChild(bodyFontWrap);

            // Heading Font
            const headingFontWrap = document.createElement('div');
            const headingFontLabel = document.createElement('label');
            headingFontLabel.textContent = 'Heading Font';
            headingFontLabel.style.cssText = 'display:block; font-size:11px; color:var(--panel-text-dim); margin-bottom:6px; font-weight:500;';
            headingFontWrap.appendChild(headingFontLabel);

            const headingFontSelect = document.createElement('select');
            headingFontSelect.className = 'gp-font-select';
            headingFontSelect.id = 'gp-heading-font';
            fonts.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                opt.style.fontFamily = f;
                if (f === this.activeHeadingFont) opt.selected = true;
                headingFontSelect.appendChild(opt);
            });
            headingFontSelect.addEventListener('change', () => {
                this.activeHeadingFont = headingFontSelect.value;
                this.applyGlobalFonts();
            });
            headingFontWrap.appendChild(headingFontSelect);
            fontGrid.appendChild(headingFontWrap);

            body.appendChild(fontGrid);
            // Tag selector pills
            const tags = document.createElement('div');
            tags.className = 'gp-typo-tags';
            const tagList = [
                { val: 'body', label: 'Body' },
                { val: 'h1', label: 'H1' },
                { val: 'h2', label: 'H2' },
                { val: 'h3', label: 'H3' },
                { val: 'h4', label: 'H4' },
                { val: 'h5', label: 'H5' },
                { val: 'a', label: 'Links' },
            ];
            tagList.forEach(t => {
                const btn = document.createElement('button');
                btn.className = 'gp-typo-tag' + (this.activeTypoTag === t.val ? ' active' : '');
                btn.textContent = t.label;
                btn.addEventListener('click', () => {
                    this.activeTypoTag = t.val;
                    tags.querySelectorAll('.gp-typo-tag').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadTypoFields();
                });
                tags.appendChild(btn);
            });
            body.appendChild(tags);

            // Fields
            const fields = document.createElement('div');
            fields.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

            // Color + Size row
            const row1 = this.createRow();
            const colorField = this.createField('Color');
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-input-hex';
            colorDiv.id = 'gp-typo-color';
            colorField.appendChild(colorDiv);
            row1.appendChild(colorField);

            const sizeField = this.createField('Size');
            const sizeWrap = this.createInputUnit('gp-typo-size', 'px', '16');
            sizeField.appendChild(sizeWrap);
            row1.appendChild(sizeField);
            fields.appendChild(row1);

            // Line Height + Padding row
            const row2 = this.createRow();
            const lhField = this.createField('Line H.');
            const lhWrap = this.createInputUnit('gp-typo-lh', 'px', '');
            lhField.appendChild(lhWrap);
            row2.appendChild(lhField);

            const padField = this.createField('Padding');
            const padInput = document.createElement('input');
            padInput.type = 'text';
            padInput.id = 'gp-typo-padding';
            padInput.placeholder = '0 0 10px 0';
            padInput.style.cssText = 'width:100%; background:var(--panel-surface); border:1px solid var(--panel-border); color:var(--panel-text-bright); border-radius:4px; padding:4px; font-size:11px;';
            padField.appendChild(padInput);
            row2.appendChild(padField);
            fields.appendChild(row2);

            // Letter-spacing + Text-transform row
            const row3 = this.createRow();
            const lsField = this.createField('Letter Spacing');
            const lsWrap = this.createInputUnit('gp-typo-ls', 'px', '0');
            lsField.appendChild(lsWrap);
            row3.appendChild(lsField);

            const ttField = this.createField('Transform');
            const ttSelect = document.createElement('select');
            ttSelect.id = 'gp-typo-tt';
            ttSelect.className = 'gp-font-select';
            ttSelect.style.cssText = 'font-size:11px; padding:4px 6px;';
            ['none', 'uppercase', 'lowercase', 'capitalize'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v.charAt(0).toUpperCase() + v.slice(1);
                ttSelect.appendChild(opt);
            });
            ttField.appendChild(ttSelect);
            row3.appendChild(ttField);
            fields.appendChild(row3);

            // Apply button
            const applyBtn = document.createElement('button');
            applyBtn.className = 'insert-go-btn';
            applyBtn.style.cssText = 'width:100%; margin-top:4px;';
            applyBtn.textContent = '✓ Apply Typography';
            applyBtn.addEventListener('click', () => this.applyTypo());
            fields.appendChild(applyBtn);

            body.appendChild(fields);
        }));

        // === Buttons Section ===
        this.root.appendChild(this.buildSection('buttons', 'Buttons', '3 variants', SECTION_ICONS.buttons, (body) => {
            // Live preview
            const previewWrap = document.createElement('div');
            previewWrap.className = 'gp-btn-preview-wrap';
            const previewBtn = document.createElement('button');
            previewBtn.className = 'gp-btn-live-preview';
            previewBtn.id = 'gp-btn-live-preview';
            previewBtn.textContent = 'Button Preview';
            previewWrap.appendChild(previewBtn);
            body.appendChild(previewWrap);

            // Segmented variant control (Webflow style)
            const segControl = document.createElement('div');
            segControl.className = 'gp-segment-control';
            ['primary', 'secondary', 'tertiary'].forEach(v => {
                const btn = document.createElement('button');
                btn.className = 'gp-segment-btn' + (this.activeBtnVariant === v ? ' active' : '');
                btn.textContent = v.charAt(0).toUpperCase() + v.slice(1);
                btn.addEventListener('click', () => {
                    this.saveBtnFieldsToVariant();
                    this.activeBtnVariant = v;
                    segControl.querySelectorAll('.gp-segment-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadBtnVariantFields();
                });
                segControl.appendChild(btn);
            });
            body.appendChild(segControl);

            // Style preset dropdown
            const presetRow = document.createElement('div');
            presetRow.style.cssText = 'margin-bottom: 12px;';
            const presetLabel = document.createElement('label');
            presetLabel.textContent = 'Style Preset';
            presetLabel.style.cssText = 'display:block; font-size:11px; color:var(--panel-text-dim); margin-bottom:6px; font-weight:500;';
            presetRow.appendChild(presetLabel);
            const presetSelect = document.createElement('select');
            presetSelect.className = 'gp-font-select';
            presetSelect.innerHTML = '<option value="">Custom</option><option value="modern">Modern</option><option value="brutal">Brutal</option><option value="soft">Soft</option>';
            presetSelect.addEventListener('change', () => {
                if (presetSelect.value) this.applyBtnPreset(presetSelect.value);
            });
            presetRow.appendChild(presetSelect);
            body.appendChild(presetRow);

            // Custom fields — compact layout
            const fields = document.createElement('div');
            fields.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

            const row1 = this.createRow();
            const bgField = this.createField('BG');
            const bgDiv = document.createElement('div');
            bgDiv.className = 'color-input-hex';
            bgDiv.id = 'gp-btn-bg';
            bgField.appendChild(bgDiv);
            row1.appendChild(bgField);
            const txtField = this.createField('Text');
            const txtDiv = document.createElement('div');
            txtDiv.className = 'color-input-hex';
            txtDiv.id = 'gp-btn-text';
            txtField.appendChild(txtDiv);
            row1.appendChild(txtField);
            fields.appendChild(row1);

            const row2 = this.createRow();
            const radField = this.createField('Radius');
            const radWrap = this.createInputUnit('gp-btn-radius', 'px', '8');
            radField.appendChild(radWrap);
            row2.appendChild(radField);
            const padField = this.createField('Padding');
            const padInput = document.createElement('input');
            padInput.type = 'text';
            padInput.id = 'gp-btn-padding';
            padInput.placeholder = '10px 20px';
            padInput.style.cssText = 'width:100%; background:var(--panel-surface); border:1px solid var(--panel-border); color:var(--panel-text-bright); border-radius:4px; padding:4px; font-size:11px;';
            padField.appendChild(padInput);
            row2.appendChild(padField);
            fields.appendChild(row2);

            // Hover state controls
            const hoverHeader = document.createElement('div');
            hoverHeader.style.cssText = 'font-size:11px; font-weight:600; color:var(--panel-text-bright); margin-top:8px; margin-bottom:6px; padding-top:8px; border-top:1px solid var(--panel-border);';
            hoverHeader.textContent = 'Hover State';
            fields.appendChild(hoverHeader);

            const row3 = this.createRow();
            const hoverBgField = this.createField('Hover BG');
            const hoverBgDiv = document.createElement('div');
            hoverBgDiv.className = 'color-input-hex';
            hoverBgDiv.id = 'gp-btn-hover-bg';
            hoverBgField.appendChild(hoverBgDiv);
            row3.appendChild(hoverBgField);
            const hoverTxtField = this.createField('Hover Text');
            const hoverTxtDiv = document.createElement('div');
            hoverTxtDiv.className = 'color-input-hex';
            hoverTxtDiv.id = 'gp-btn-hover-text';
            hoverTxtField.appendChild(hoverTxtDiv);
            row3.appendChild(hoverTxtField);
            fields.appendChild(row3);

            const applyBtn = document.createElement('button');
            applyBtn.className = 'insert-go-btn';
            applyBtn.style.cssText = 'width:100%; margin-top:4px;';
            applyBtn.textContent = '✓ Apply to Variant';
            applyBtn.addEventListener('click', () => this.applyBtnVariant());
            fields.appendChild(applyBtn);

            body.appendChild(fields);
        }));

        // Init color inputs after DOM is ready
        requestAnimationFrame(() => {
            this.typoColorInput = new ColorInput('gp-typo-color');
            this.btnBgInput = new ColorInput('gp-btn-bg');
            this.btnTextInput = new ColorInput('gp-btn-text');
            this.btnHoverBgInput = new ColorInput('gp-btn-hover-bg');
            this.btnHoverTextInput = new ColorInput('gp-btn-hover-text');
            // Load initial variant fields
            this.loadBtnVariantFields();
        });

        // === Transitions Section ===
        this.root.appendChild(this.buildSection('transitions', 'Transitions', 'Global animations', SECTION_ICONS.transitions, (body) => {
            const fields = document.createElement('div');
            fields.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

            // Property
            const propField = this.createField('Property');
            const propSelect = document.createElement('select');
            propSelect.id = 'gp-trans-prop';
            propSelect.className = 'gp-font-select';
            ['all', 'opacity', 'transform', 'background', 'color', 'border', 'box-shadow'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v.charAt(0).toUpperCase() + v.slice(1);
                propSelect.appendChild(opt);
            });
            propField.appendChild(propSelect);
            fields.appendChild(propField);

            const row1 = this.createRow();
            // Duration
            const durField = this.createField('Duration');
            const durWrap = this.createInputUnit('gp-trans-dur', 's', '0.3');
            durField.appendChild(durWrap);
            row1.appendChild(durField);
            // Delay
            const delField = this.createField('Delay');
            const delWrap = this.createInputUnit('gp-trans-delay', 's', '0');
            delField.appendChild(delWrap);
            row1.appendChild(delField);
            fields.appendChild(row1);

            // Easing
            const easeField = this.createField('Easing');
            const easeSelect = document.createElement('select');
            easeSelect.id = 'gp-trans-ease';
            easeSelect.className = 'gp-font-select';
            [
                { v: 'ease', l: 'Ease' },
                { v: 'ease-in', l: 'Ease In' },
                { v: 'ease-out', l: 'Ease Out' },
                { v: 'ease-in-out', l: 'Ease In-Out' },
                { v: 'linear', l: 'Linear' },
                { v: 'cubic-bezier(0.4, 0, 0.2, 1)', l: 'Material' },
                { v: 'cubic-bezier(0.22, 1, 0.36, 1)', l: 'Smooth' },
            ].forEach(({ v, l }) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = l;
                easeSelect.appendChild(opt);
            });
            easeField.appendChild(easeSelect);
            fields.appendChild(easeField);

            // Target selector
            const selectorField = this.createField('Target Selector');
            const selectorInput = document.createElement('input');
            selectorInput.type = 'text';
            selectorInput.id = 'gp-trans-selector';
            selectorInput.placeholder = '* (all elements)';
            selectorInput.value = '*';
            selectorInput.style.cssText = 'width:100%; background:var(--panel-surface); border:1px solid var(--panel-border); color:var(--panel-text-bright); border-radius:4px; padding:4px; font-size:11px;';
            selectorField.appendChild(selectorInput);
            fields.appendChild(selectorField);

            const applyBtn = document.createElement('button');
            applyBtn.className = 'insert-go-btn';
            applyBtn.style.cssText = 'width:100%; margin-top:4px;';
            applyBtn.textContent = '✓ Apply Transition';
            applyBtn.addEventListener('click', () => this.applyTransition());
            fields.appendChild(applyBtn);

            body.appendChild(fields);
        }));
    }

    // ─── Section builder ─────────────────────────────────────────
    private buildSection(key: string, title: string, subtitle: string, iconSvg: string, buildBody: (body: HTMLElement) => void): HTMLElement {
        const section = document.createElement('div');
        section.className = 'gp-section' + (this.sectionOpen[key] === false ? ' collapsed' : '');

        const header = document.createElement('div');
        header.className = 'gp-section-header';
        header.innerHTML = `
            <div class="gp-icon">${iconSvg}</div>
            <div class="gp-title">${title}<div class="gp-subtitle">${subtitle}</div></div>
            ${CHEVRON_SVG}
        `;
        header.addEventListener('click', () => {
            const isCollapsed = section.classList.toggle('collapsed');
            this.sectionOpen[key] = !isCollapsed;
            this.saveState();
        });
        section.appendChild(header);

        const body = document.createElement('div');
        body.className = 'gp-section-body';
        buildBody(body);
        section.appendChild(body);

        return section;
    }

    // ─── Color Presets ───────────────────────────────────────────
    private renderPresetCards(grid?: HTMLElement) {
        const g = grid || document.getElementById('gp-preset-grid');
        if (!g) return;
        g.innerHTML = '';
        this.presets.forEach(p => {
            const card = document.createElement('div');
            card.className = 'gp-preset-card' + (p.id === this.activePresetId ? ' active' : '');

            // 4-dot swatch
            const swatch = document.createElement('div');
            swatch.className = 'gp-preset-swatch';
            const colorKeys: (keyof typeof p.colors)[] = ['primary', 'secondary', 'text', 'bg'];
            colorKeys.forEach(key => {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dot.style.background = p.colors[key];
                swatch.appendChild(dot);
            });

            const name = document.createElement('span');
            name.className = 'gp-preset-name';
            name.textContent = p.name;

            card.appendChild(swatch);
            card.appendChild(name);

            // Delete button for custom presets (id starts with 'p' + timestamp)
            if (p.id.length > 3) {
                const delBtn = document.createElement('button');
                delBtn.className = 'gp-delete-btn';
                delBtn.textContent = '×';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.presets = this.presets.filter(pr => pr.id !== p.id);
                    if (this.activePresetId === p.id) this.activePresetId = 'p1';
                    this.persistPresets();
                    this.renderPresetCards();
                    showToast('Preset deleted');
                });
                card.appendChild(delBtn);
            }

            card.addEventListener('click', () => {
                this.activePresetId = p.id;
                this.renderPresetCards();
                this.applyPreset(p);
            });

            g.appendChild(card);
        });
    }

    private applyPreset(preset: ColorPreset) {
        const doc = this.editor.getIframeDocument();
        if (!doc) return;
        this.ensureGlobalStyles();

        const { primary, secondary, text, bg } = preset.colors;

        // CSS custom properties
        doc.documentElement.style.setProperty('--se-primary', primary);
        doc.documentElement.style.setProperty('--se-secondary', secondary);
        doc.documentElement.style.setProperty('--se-text', text);
        doc.documentElement.style.setProperty('--se-bg', bg);

        // Compute a surface color for cards (slightly lighter/darker than bg)
        const isDark = this.isColorDark(bg);
        const surfaceColor = isDark ? this.lightenColor(bg, 12) : this.darkenColor(bg, 3);

        // Full metamorphosis CSS
        const metamorphCSS = `
            html, body { background: ${bg} !important; color: ${text} !important; }
            h1, h2, h3, h4, h5, h6 { color: ${text} !important; }
            h1 { color: ${primary} !important; }
            h2 { border-left-color: ${primary} !important; background: transparent !important; }
            a { color: ${primary} !important; }
            a:hover { color: ${secondary} !important; }
            button, .btn, [class*="btn-"], a.btn { background: ${primary} !important; color: ${bg} !important; border-color: ${primary} !important; }
            button:hover, .btn:hover, [class*="btn-"]:hover { background: ${secondary} !important; border-color: ${secondary} !important; }
            .card, [class*="card"] { background: ${surfaceColor} !important; border: 1px solid ${primary}33 !important; }
            .card h3, [class*="card"] h3 { color: ${primary} !important; }
            .card p, [class*="card"] p { color: ${text} !important; }
            .footer, [class*="footer"] { border-top-color: ${primary}22 !important; color: ${text}99 !important; }
            p { color: ${text} !important; }
            li { color: ${text} !important; }
            ul { color: ${text} !important; }
            section { border-color: ${primary}15 !important; }
            hr { border-color: ${primary}22 !important; }
            input, textarea, select { border-color: ${primary}33 !important; color: ${text} !important; background: ${surfaceColor} !important; }
        `;
        this.updateGlobalCSSRule('color-metamorphosis', metamorphCSS);

        // Directly override body/html inline styles — belt & suspenders
        doc.documentElement.style.setProperty('background', bg, 'important');
        doc.body.style.setProperty('background', bg, 'important');
        doc.body.style.setProperty('color', text, 'important');

        // Also update button variant state to match preset
        this.btnVariants.primary.bg = primary;
        this.btnVariants.primary.text = bg;
        this.btnVariants.secondary.bg = secondary;
        this.btnVariants.secondary.text = bg;
        this.btnVariants.tertiary.bg = 'transparent';
        this.btnVariants.tertiary.text = primary;
        this.loadBtnVariantFields();

        this.editor.pushHistory('Apply Color Preset');
        showToast(`Applied ${preset.name}`);
    }

    private buildPresetEditor(): HTMLElement {
        const wrap = document.createElement('div');
        wrap.id = 'gp-preset-editor';
        wrap.className = 'gp-preset-editor';

        wrap.innerHTML = `
            <div class="gp-pe-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                <span>Preset Editor</span>
                <button id="gp-pe-close" class="gp-pe-close" title="Close">&times;</button>
            </div>
            <div class="gp-pe-field">
                <label>Name</label>
                <input type="text" id="gp-preset-name" placeholder="My Theme" />
            </div>
            <div class="gp-pe-row">
                <div class="gp-pe-field"><label>Primary</label><div class="color-input-hex" id="gp-preset-primary"></div></div>
                <div class="gp-pe-field"><label>Secondary</label><div class="color-input-hex" id="gp-preset-secondary"></div></div>
            </div>
            <div class="gp-pe-row">
                <div class="gp-pe-field"><label>Text</label><div class="color-input-hex" id="gp-preset-text"></div></div>
                <div class="gp-pe-field"><label>Background</label><div class="color-input-hex" id="gp-preset-bg"></div></div>
            </div>
            <button id="gp-preset-save" class="insert-go-btn gp-pe-save">✓ Save Preset</button>
        `;

        requestAnimationFrame(() => {
            this.presetPrimaryInput = new ColorInput('gp-preset-primary');
            this.presetSecondaryInput = new ColorInput('gp-preset-secondary');
            this.presetTextInput = new ColorInput('gp-preset-text');
            this.presetBgInput = new ColorInput('gp-preset-bg');

            document.getElementById('gp-preset-save')?.addEventListener('click', () => this.savePreset());
            document.getElementById('gp-pe-close')?.addEventListener('click', () => {
                const editor = document.getElementById('gp-preset-editor');
                if (editor) editor.style.display = 'none';
            });
        });

        return wrap;
    }

    private showPresetEditor(isNew = false) {
        const editor = document.getElementById('gp-preset-editor');
        if (!editor) return;
        editor.style.display = 'block';

        if (isNew) {
            this.activePresetId = '';
            (document.getElementById('gp-preset-name') as HTMLInputElement).value = 'New Preset';
            // Reset color fields to sensible defaults
            if (this.presetPrimaryInput) this.presetPrimaryInput.value = '#4361ee';
            if (this.presetSecondaryInput) this.presetSecondaryInput.value = '#f72585';
            if (this.presetTextInput) this.presetTextInput.value = '#1f2937';
            if (this.presetBgInput) this.presetBgInput.value = '#ffffff';
        } else {
            const preset = this.presets.find(p => p.id === this.activePresetId);
            if (preset) {
                (document.getElementById('gp-preset-name') as HTMLInputElement).value = preset.name;
                this.presetPrimaryInput.value = preset.colors.primary;
                this.presetSecondaryInput.value = preset.colors.secondary;
                this.presetTextInput.value = preset.colors.text;
                this.presetBgInput.value = preset.colors.bg;
            }
        }
    }

    private savePreset() {
        const name = (document.getElementById('gp-preset-name') as HTMLInputElement).value || 'Custom';
        const colors = {
            primary: this.presetPrimaryInput.value,
            secondary: this.presetSecondaryInput.value,
            text: this.presetTextInput.value,
            bg: this.presetBgInput.value
        };

        if (this.activePresetId) {
            const preset = this.presets.find(p => p.id === this.activePresetId);
            if (preset) {
                preset.name = name;
                preset.colors = colors;
            }
        } else {
            const newId = 'p' + Date.now();
            this.presets.push({ id: newId, name, colors });
            this.activePresetId = newId;
        }
        this.persistPresets();
        this.renderPresetCards();
        this.applyPreset(this.presets.find(p => p.id === this.activePresetId)!);
        document.getElementById('gp-preset-editor')!.style.display = 'none';
    }

    private persistPresets() {
        try {
            const customPresets = this.presets.filter(p => p.id.length > 3);
            localStorage.setItem('snapedit-color-presets', JSON.stringify(customPresets));
        } catch { /* ignore */ }
    }

    private loadSavedPresets() {
        try {
            const saved = localStorage.getItem('snapedit-color-presets');
            if (saved) {
                const customs: ColorPreset[] = JSON.parse(saved);
                customs.forEach(c => {
                    if (!this.presets.find(p => p.id === c.id)) {
                        this.presets.push(c);
                    }
                });
            }
        } catch { /* ignore */ }
    }

    // ─── Typography ──────────────────────────────────────────────
    private loadTypoFields() {
        const style = this.typoStyles[this.activeTypoTag] || {};
        const sizeInput = document.getElementById('gp-typo-size') as HTMLInputElement;
        const lhInput = document.getElementById('gp-typo-lh') as HTMLInputElement;
        const padInput = document.getElementById('gp-typo-padding') as HTMLInputElement;
        const lsInput = document.getElementById('gp-typo-ls') as HTMLInputElement;
        const ttSelect = document.getElementById('gp-typo-tt') as HTMLSelectElement;
        if (sizeInput) sizeInput.value = style.fontSize ? parseInt(style.fontSize).toString() : '';
        if (lhInput) lhInput.value = style.lineHeight ? parseInt(style.lineHeight).toString() : '';
        if (padInput) padInput.value = style.padding || '';
        if (lsInput) lsInput.value = style.letterSpacing ? parseFloat(style.letterSpacing).toString() : '';
        if (ttSelect) ttSelect.value = style.textTransform || 'none';
        if (this.typoColorInput) this.typoColorInput.value = style.color || '';
    }

    private applyTypo() {
        const tag = this.activeTypoTag;
        const sizeInput = document.getElementById('gp-typo-size') as HTMLInputElement;
        const lhInput = document.getElementById('gp-typo-lh') as HTMLInputElement;
        const padInput = document.getElementById('gp-typo-padding') as HTMLInputElement;
        const lsInput = document.getElementById('gp-typo-ls') as HTMLInputElement;
        const ttSelect = document.getElementById('gp-typo-tt') as HTMLSelectElement;

        this.typoStyles[tag] = {
            fontSize: sizeInput?.value ? sizeInput.value + 'px' : '',
            lineHeight: lhInput?.value ? lhInput.value + 'px' : '',
            padding: padInput?.value || '',
            color: this.typoColorInput?.value || '',
            letterSpacing: lsInput?.value ? lsInput.value + 'px' : '',
            textTransform: ttSelect?.value || 'none'
        };

        this.updateGlobalStylesBlock();
        this.editor.pushHistory('Update Global Typography');
        showToast('Typography Updated');
    }

    // ─── Global Font ────────────────────────────────────────────────
    private applyGlobalFonts() {
        const doc = this.editor.getIframeDocument();
        if (!doc) return;

        // Load the Body font
        const bodyFontId = "se-global-body-font-link";
        let bodyLink = doc.getElementById(bodyFontId) as HTMLLinkElement;
        if (!bodyLink) {
            bodyLink = doc.createElement("link");
            bodyLink.id = bodyFontId;
            bodyLink.rel = "stylesheet";
            doc.head.appendChild(bodyLink);
        }
        bodyLink.href = `https://fonts.googleapis.com/css2?family=${this.activeBodyFont.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;

        // Load heading font as well
        const headingFontId = "se-global-heading-font-link";
        let headingLink = doc.getElementById(headingFontId) as HTMLLinkElement;
        if (!headingLink) {
            headingLink = doc.createElement("link");
            headingLink.id = headingFontId;
            headingLink.rel = "stylesheet";
            doc.head.appendChild(headingLink);
        }
        headingLink.href = `https://fonts.googleapis.com/css2?family=${this.activeHeadingFont.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;

        // Apply font to body
        this.updateGlobalCSSRule("global-font", `body { font-family: "${this.activeBodyFont}", sans-serif !important; } h1, h2, h3, h4, h5, h6 { font-family: "${this.activeHeadingFont}", sans-serif !important; }`);
        this.editor.pushHistory(`Set global fonts`);
        showToast(`Fonts updated`);
    }
    // ─── Buttons ─────────────────────────────────────────────────
    private applyBtnPreset(preset: string) {
        let css = '';
        const btnSelector = '.btn-primary, .btn-secondary, .btn-tertiary, button';
        if (preset === 'modern') {
            css = `${btnSelector} { font-family: 'Inter', sans-serif; font-weight: 600; text-transform: none; letter-spacing: 0; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; }
                   ${btnSelector}:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }`;
        } else if (preset === 'brutal') {
            css = `${btnSelector} { font-family: 'Courier New', monospace; font-weight: bold; text-transform: uppercase; border: 2px solid #000 !important; border-radius: 0 !important; box-shadow: 4px 4px 0px #000; transition: all 0.1s; }
                   ${btnSelector}:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px #000; }`;
        } else if (preset === 'soft') {
            css = `${btnSelector} { font-family: 'Quicksand', sans-serif; font-weight: 500; border-radius: 999px !important; box-shadow: none; transition: background 0.3s; }`;
        }
        this.updateGlobalCSSRule('button-preset', css);
        this.editor.pushHistory(`Apply ${preset} button style`);
        showToast('Button style applied');
    }

    private saveBtnFieldsToVariant() {
        const v = this.activeBtnVariant;
        this.btnVariants[v] = {
            bg: this.btnBgInput?.value || this.btnVariants[v].bg,
            text: this.btnTextInput?.value || this.btnVariants[v].text,
            radius: (document.getElementById('gp-btn-radius') as HTMLInputElement)?.value || this.btnVariants[v].radius,
            padding: (document.getElementById('gp-btn-padding') as HTMLInputElement)?.value || this.btnVariants[v].padding,
            hoverBg: this.btnHoverBgInput?.value || this.btnVariants[v].hoverBg,
            hoverText: this.btnHoverTextInput?.value || this.btnVariants[v].hoverText,
            hoverOpacity: this.btnVariants[v].hoverOpacity || '0.9'
        };
    }

    private loadBtnVariantFields() {
        const v = this.btnVariants[this.activeBtnVariant];
        if (!v) return;
        if (this.btnBgInput) this.btnBgInput.value = v.bg;
        if (this.btnTextInput) this.btnTextInput.value = v.text;
        if (this.btnHoverBgInput) this.btnHoverBgInput.value = v.hoverBg || v.bg;
        if (this.btnHoverTextInput) this.btnHoverTextInput.value = v.hoverText || v.text;
        const radInput = document.getElementById('gp-btn-radius') as HTMLInputElement;
        const padInput = document.getElementById('gp-btn-padding') as HTMLInputElement;
        if (radInput) radInput.value = v.radius;
        if (padInput) padInput.value = v.padding;
        this.updateBtnPreview();
    }

    private updateBtnPreview() {
        const preview = document.getElementById('gp-btn-live-preview') as HTMLElement;
        if (!preview) return;
        const v = this.btnVariants[this.activeBtnVariant];
        if (!v) return;
        preview.style.background = v.bg === 'transparent' ? 'transparent' : v.bg;
        preview.style.color = v.text;
        preview.style.borderRadius = v.radius + 'px';
        preview.style.padding = v.padding;
        if (this.activeBtnVariant === 'tertiary') {
            preview.style.border = `1px solid ${v.text}`;
        } else {
            preview.style.border = 'none';
        }
    }

    private applyBtnVariant() {
        this.saveBtnFieldsToVariant();
        const variant = this.activeBtnVariant;
        const v = this.btnVariants[variant];

        this.ensureGlobalStyles();
        const baseSelectors = `.btn-${variant}`;
        const wideSelectors = variant === 'primary'
            ? `${baseSelectors}, button, .btn, a.btn, [class*="btn"]:not(.btn-secondary):not(.btn-tertiary)`
            : baseSelectors;
        let rule = `${wideSelectors} { `;
        rule += `background: ${v.bg} !important; `;
        rule += `color: ${v.text} !important; `;
        if (v.radius) rule += `border-radius: ${v.radius}px !important; `;
        if (v.padding) rule += `padding: ${v.padding} !important; `;
        if (variant === 'tertiary') rule += `border: 1px solid ${v.text} !important; `;
        rule += `transition: all 0.2s ease !important; `;
        rule += '}';

        // Hover state
        let hoverRule = `${wideSelectors}:hover { `;
        if (v.hoverBg) hoverRule += `background: ${v.hoverBg} !important; `;
        if (v.hoverText) hoverRule += `color: ${v.hoverText} !important; `;
        hoverRule += `opacity: ${v.hoverOpacity || '0.9'} !important; `;
        hoverRule += `transform: translateY(-1px) !important; `;
        hoverRule += '}';

        // Active state
        let activeRule = `${wideSelectors}:active { `;
        activeRule += `transform: translateY(0) scale(0.98) !important; `;
        activeRule += `opacity: 1 !important; `;
        activeRule += '}';

        // Focus state
        let focusRule = `${wideSelectors}:focus-visible { `;
        focusRule += `outline: 2px solid ${v.bg !== 'transparent' ? v.bg : v.text} !important; `;
        focusRule += `outline-offset: 2px !important; `;
        focusRule += '}';

        this.updateGlobalCSSRule(`btn-variant-${variant}`, rule + '\n' + hoverRule + '\n' + activeRule + '\n' + focusRule);
        this.updateBtnPreview();
        this.editor.pushHistory(`Update ${variant} button`);
        showToast('Button variant updated');
    }

    // ─── Transitions ────────────────────────────────────────────
    private applyTransition() {
        const prop = (document.getElementById('gp-trans-prop') as HTMLSelectElement)?.value || 'all';
        const dur = (document.getElementById('gp-trans-dur') as HTMLInputElement)?.value || '0.3';
        const ease = (document.getElementById('gp-trans-ease') as HTMLSelectElement)?.value || 'ease';
        const delay = (document.getElementById('gp-trans-delay') as HTMLInputElement)?.value || '0';
        const selector = (document.getElementById('gp-trans-selector') as HTMLInputElement)?.value || '*';

        const rule = `${selector} { transition: ${prop} ${dur}s ${ease} ${delay}s !important; }`;
        this.updateGlobalCSSRule('transition', rule);
        this.editor.pushHistory('Apply global transition');
        showToast(`Transition: ${prop} ${dur}s`);
    }

    // ─── CSS Injection ───────────────────────────────────────────
    private updateGlobalCSSRule(ruleId: string, ruleContent: string) {
        this.ensureGlobalStyles();
        const doc = this.editor.getIframeDocument();
        if (!doc) return;
        const styleTag = doc.getElementById('se-general-styles');
        if (!styleTag) return;

        let css = styleTag.textContent || '';
        const regex = new RegExp(`\\/\\* ${ruleId} \\*\\/[\\s\\S]*?\\/\\* \\/${ruleId} \\*\\/`, 'g');
        const newBlock = `/* ${ruleId} */\n${ruleContent}\n/* /${ruleId} */`;

        if (regex.test(css)) {
            css = css.replace(regex, newBlock);
        } else {
            css += '\n' + newBlock;
        }
        styleTag.textContent = css;
    }

    private updateGlobalStylesBlock() {
        let typoRules = '';
        for (const [tag, style] of Object.entries(this.typoStyles)) {
            let rules = '';
            if (style.fontSize) rules += `font-size: ${style.fontSize}; `;
            if (style.lineHeight) rules += `line-height: ${style.lineHeight}; `;
            if (style.padding) rules += `padding: ${style.padding}; `;
            if (style.color && style.color !== '#000000') rules += `color: ${style.color}; `;
            if (style.letterSpacing) rules += `letter-spacing: ${style.letterSpacing}; `;
            if (style.textTransform && style.textTransform !== 'none') rules += `text-transform: ${style.textTransform}; `;
            if (rules) typoRules += `${tag} { ${rules} }\n`;
        }
        this.updateGlobalCSSRule('typography', typoRules);
    }

    // ─── Helpers ─────────────────────────────────────────────────
    private createRow(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'style-row-grid two-col';
        return row;
    }

    private createField(label: string): HTMLElement {
        const field = document.createElement('div');
        field.className = 'style-field';
        const lbl = document.createElement('label');
        lbl.textContent = label;
        field.appendChild(lbl);
        return field;
    }

    private createInputUnit(id: string, unit: string, defaultVal: string): HTMLElement {
        const wrap = document.createElement('div');
        wrap.className = 'input-with-unit';
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.value = defaultVal;
        input.style.cssText = 'width:100%;';
        const span = document.createElement('span');
        span.className = 'unit';
        span.textContent = unit;
        wrap.appendChild(input);
        wrap.appendChild(span);
        return wrap;
    }

    // ─── Color utility helpers ─────────────────────────────────
    private hexToRgb(hex: string): [number, number, number] {
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    private rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    }

    private isColorDark(hex: string): boolean {
        const [r, g, b] = this.hexToRgb(hex);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
    }

    private lightenColor(hex: string, percent: number): string {
        const [r, g, b] = this.hexToRgb(hex);
        const amt = Math.round(2.55 * percent);
        return this.rgbToHex(r + amt, g + amt, b + amt);
    }

    private darkenColor(hex: string, percent: number): string {
        const [r, g, b] = this.hexToRgb(hex);
        const amt = Math.round(2.55 * percent);
        return this.rgbToHex(r - amt, g - amt, b - amt);
    }
}
