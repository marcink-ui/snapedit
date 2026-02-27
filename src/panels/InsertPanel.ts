import { EditorCore } from '../editor/EditorCore';
import { showToast, parsePx } from '../utils/dom-helpers';

const COMPONENTS_KEY = 'snapedit-components';

/**
 * InsertPanel — Handles the 'Insert' tab in the right sidebar:
 * - Image insertion via URL or file upload
 * - Image settings (fit, width, height, radius, opacity, shadow)
 * - Quick element insertion (heading, paragraph, button, divider, spacer, container)
 */
export class InsertPanel {
    private editor: EditorCore;
    private currentElement: HTMLElement | null = null;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.setupElementInsert();
        this.setupEmbedBuilder();
        this.setupComponents();
        this.setupEventBus();
    }

    private setupEventBus(): void {
        this.editor.bus.on('selection:change', (el: HTMLElement) => {
            this.currentElement = el;
        });

        this.editor.bus.on('selection:clear', () => {
            this.currentElement = null;
        });

        this.editor.bus.on('component:saved', () => {
            this.renderComponents();
        });
    }



    // ─── Quick Element Insertion ─────────────────────────────────
    private setupElementInsert(): void {
        const buttons = document.querySelectorAll('.insert-element-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = (btn as HTMLElement).dataset.element;
                if (!type) return;

                // Form has a special flow — show form builder panel
                if (type === 'form') {
                    this.showFormBuilder();
                    return;
                }

                const doc = this.editor.getIframeDocument();
                if (!doc?.body) return;

                let el: HTMLElement | null = null;

                switch (type) {
                    case 'heading':
                        el = doc.createElement('h2');
                        el.textContent = 'New Heading';
                        el.style.cssText = 'margin: 16px 0; font-size: 24px; font-weight: 600;';
                        break;
                    case 'paragraph':
                        el = doc.createElement('p');
                        el.textContent = 'New paragraph. Double-click to edit this text.';
                        el.style.cssText = 'margin: 12px 0; font-size: 16px; line-height: 1.6;';
                        break;
                    case 'button':
                        el = doc.createElement('button');
                        el.textContent = 'Button';
                        el.style.cssText = 'padding: 10px 24px; background: #4361ee; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 12px 0; box-shadow: 0 4px 6px rgba(67, 97, 238, 0.2); transition: all 0.2s;';
                        break;
                    case 'divider':
                        el = doc.createElement('hr');
                        el.style.cssText = 'border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;';
                        break;
                    case 'spacer':
                        el = doc.createElement('div');
                        el.style.cssText = 'height: 48px; width: 100%;';
                        el.setAttribute('data-se-label', 'Spacer');
                        break;
                    case 'container':
                        el = doc.createElement('div');
                        el.style.cssText = 'padding: 24px; border: 2px dashed #e0e0e0; border-radius: 8px; margin: 16px 0; min-height: 60px;';
                        el.setAttribute('data-se-label', 'Container');
                        break;
                    case 'image':
                        el = doc.createElement('img');
                        (el as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:%23f3f4f6"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af">Image Placeholder</text></svg>';
                        el.style.cssText = 'width: 100%; max-width: 600px; border-radius: 8px; margin: 16px 0; display: block; object-fit: cover;';
                        el.setAttribute('data-se-label', 'Image');
                        break;
                    case 'page-break':
                        el = doc.createElement('div');
                        el.style.cssText = 'page-break-after: always; break-after: page; width: 100%; margin: 24px 0; padding: 12px 0; border: none; position: relative; text-align: center;';
                        el.setAttribute('data-se-label', 'Page Break');
                        // Visual marker (only visible on screen, hidden in print)
                        el.innerHTML = '<div style="border-top: 2px dashed #9ca3af; width: 100%;"></div><span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 2px 12px; font-size: 11px; color: #9ca3af; font-family: Inter, system-ui, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">✂ Page Break</span>';
                        break;
                    case 'icon':
                        el = doc.createElement('div');
                        const iconUrl = prompt("Enter an SVG snippet or click OK for a default icon:");
                        if (iconUrl === null) return;
                        el.innerHTML = iconUrl && iconUrl.trim().startsWith('<svg') ? iconUrl : '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                        el.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; font-size: 32px; color: #4361ee; margin: 8px; line-height: 1;';
                        el.setAttribute('data-se-label', 'Icon (SVG)');
                        break;
                    case 'embed': {
                        // Show embed panel instead of prompt
                        this.showEmbedBuilder();
                        return;
                    }
                    case 'custom-code':
                        el = doc.createElement('div');
                        el.innerHTML = '<style>\n  /* Custom CSS */\n  .custom-box { padding: 20px; background: #f3f4f6; border: 1px dashed #9ca3af; text-align: center; }\n</style>\n<div class="custom-box">Double-click to edit custom HTML/CSS</div>';
                        el.setAttribute('data-se-label', 'Custom Code');
                        break;
                    case 'video': {
                        const videoUrl = prompt('Enter video URL (.mp4, .webm, or YouTube embed):', 'https://www.w3schools.com/html/mov_bbb.mp4');
                        if (!videoUrl) return;
                        // Check if it's a direct video file or a YouTube-style embed
                        if (videoUrl.includes('youtube.com/embed') || videoUrl.includes('vimeo.com')) {
                            const wrapper = doc.createElement('div');
                            wrapper.style.cssText = 'position: relative; width: 100%; padding-bottom: 56.25%; margin: 16px 0; border-radius: 8px; overflow: hidden; background: #000;';
                            wrapper.setAttribute('data-se-label', 'Video Embed');
                            const iframe = doc.createElement('iframe');
                            iframe.src = videoUrl;
                            iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;';
                            iframe.setAttribute('allowfullscreen', '');
                            wrapper.appendChild(iframe);
                            el = wrapper;
                        } else {
                            const video = doc.createElement('video');
                            video.src = videoUrl;
                            video.controls = true;
                            video.style.cssText = 'width: 100%; max-width: 640px; border-radius: 8px; margin: 16px 0; display: block;';
                            el = video;
                        }
                        break;
                    }
                }

                if (el) {
                    // Insert after selected element, or at end of body
                    if (this.currentElement && this.currentElement.parentNode) {
                        this.currentElement.parentNode.insertBefore(el, this.currentElement.nextSibling);
                    } else {
                        doc.body.appendChild(el);
                    }

                    this.editor.bus.emit('dom:changed');
                    this.editor.pushHistory(`Insert ${type}`);
                    this.editor.selectionManager.selectElement(el);
                    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} inserted!`);
                }
            });
        });
    }

    // ─── Form Builder ──────────────────────────────────────────────
    private showFormBuilder(): void {
        const section = document.getElementById('form-builder-section');
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
    }

    // ─── Embed Builder ─────────────────────────────────────────────
    private showEmbedBuilder(): void {
        const section = document.getElementById('embed-insert-section');
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
    }

    setupEmbedBuilder(): void {
        const insertBtn = document.getElementById('embed-insert-btn');
        const urlInput = document.getElementById('embed-url-input') as HTMLInputElement;
        if (!insertBtn || !urlInput) return;

        insertBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url) { showToast('Enter an embed URL'); return; }

            const doc = this.editor.getIframeDocument();
            if (!doc?.body) return;

            const wrapper = doc.createElement('div');
            wrapper.style.cssText = 'position: relative; width: 100%; padding-bottom: 56.25%; margin: 16px 0; border-radius: 8px; overflow: hidden; background: #000;';
            wrapper.setAttribute('data-se-label', 'Embed');
            const iframe = doc.createElement('iframe');
            iframe.src = url;
            iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;';
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            wrapper.appendChild(iframe);

            if (this.currentElement && this.currentElement.parentNode) {
                this.currentElement.parentNode.insertBefore(wrapper, this.currentElement.nextSibling);
            } else {
                doc.body.appendChild(wrapper);
            }

            this.editor.bus.emit('dom:changed');
            this.editor.pushHistory('Insert embed');
            this.editor.selectionManager.selectElement(wrapper);
            showToast('Embed inserted!');

            urlInput.value = '';
            const section = document.getElementById('embed-insert-section');
            if (section) section.style.display = 'none';
        });
    }

    setupFormBuilder(): void {
        const insertBtn = document.getElementById('form-insert-btn');
        if (!insertBtn) return;

        insertBtn.addEventListener('click', () => {
            const doc = this.editor.getIframeDocument();
            if (!doc?.body) return;

            const email = (document.getElementById('form-target-email') as HTMLInputElement).value.trim();
            const title = (document.getElementById('form-title') as HTMLInputElement).value.trim() || 'Contact Us';
            const submitText = (document.getElementById('form-submit-text') as HTMLInputElement).value.trim() || 'Send Message';

            // Get selected fields
            const fieldCheckboxes = document.querySelectorAll('#form-fields-list input[type="checkbox"]');
            const selectedFields: string[] = [];
            fieldCheckboxes.forEach(cb => {
                if ((cb as HTMLInputElement).checked) {
                    selectedFields.push((cb as HTMLInputElement).dataset.field || '');
                }
            });

            if (selectedFields.length === 0) {
                showToast('Select at least one field');
                return;
            }

            // Build the form element
            const form = doc.createElement('form');
            // Use formspree.io if email provided, otherwise mailto fallback
            if (email) {
                form.setAttribute('action', `https://formspree.io/f/xform`);
                form.setAttribute('method', 'POST');
                // Add hidden field with target email for reference
                const hiddenEmail = doc.createElement('input');
                hiddenEmail.type = 'hidden';
                hiddenEmail.name = '_replyto';
                hiddenEmail.value = email;
                form.appendChild(hiddenEmail);
            }
            form.style.cssText = 'max-width: 480px; margin: 24px 0; padding: 28px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0; font-family: Inter, system-ui, sans-serif;';
            form.setAttribute('data-se-label', 'Contact Form');

            // Title
            const h3 = doc.createElement('h3');
            h3.textContent = title;
            h3.style.cssText = 'margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #1a1a2e;';
            form.appendChild(h3);

            // Field definitions
            const fieldDefs: Record<string, { label: string; type: string; tag: string; placeholder: string }> = {
                name: { label: 'Your Name', type: 'text', tag: 'input', placeholder: 'John Doe' },
                email: { label: 'Email Address', type: 'email', tag: 'input', placeholder: 'john@example.com' },
                phone: { label: 'Phone Number', type: 'tel', tag: 'input', placeholder: '+1 (555) 000-0000' },
                company: { label: 'Company', type: 'text', tag: 'input', placeholder: 'Company Inc.' },
                subject: { label: 'Subject', type: 'text', tag: 'input', placeholder: 'How can we help?' },
                message: { label: 'Message', type: '', tag: 'textarea', placeholder: 'Your message here...' },
            };

            selectedFields.forEach(fieldKey => {
                const def = fieldDefs[fieldKey];
                if (!def) return;

                const wrapper = doc.createElement('div');
                wrapper.style.cssText = 'margin-bottom: 16px;';

                const label = doc.createElement('label');
                label.textContent = def.label;
                label.style.cssText = 'display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #374151;';
                wrapper.appendChild(label);

                let input: HTMLElement;
                if (def.tag === 'textarea') {
                    input = doc.createElement('textarea');
                    (input as HTMLTextAreaElement).rows = 4;
                    (input as HTMLTextAreaElement).placeholder = def.placeholder;
                    input.style.cssText = 'width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; box-sizing: border-box; background: #fff;';
                } else {
                    input = doc.createElement('input');
                    (input as HTMLInputElement).type = def.type;
                    (input as HTMLInputElement).placeholder = def.placeholder;
                    input.style.cssText = 'width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; background: #fff;';
                }
                (input as HTMLInputElement | HTMLTextAreaElement).name = fieldKey;
                (input as HTMLInputElement | HTMLTextAreaElement).required = fieldKey === 'email' || fieldKey === 'name';
                wrapper.appendChild(input);
                form.appendChild(wrapper);
            });

            // Submit button
            const submitBtn = doc.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.textContent = submitText;
            submitBtn.style.cssText = 'width: 100%; padding: 12px 24px; background: #4361ee; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(67, 97, 238, 0.2); transition: all 0.2s;';
            form.appendChild(submitBtn);

            // Note about email
            if (email) {
                const note = doc.createElement('p');
                note.textContent = `📧 Submissions go to ${email}`;
                note.style.cssText = 'margin: 12px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;';
                form.appendChild(note);
            }

            // Insert
            if (this.currentElement && this.currentElement.parentNode) {
                this.currentElement.parentNode.insertBefore(form, this.currentElement.nextSibling);
            } else {
                doc.body.appendChild(form);
            }

            this.editor.bus.emit('dom:changed');
            this.editor.pushHistory('Insert contact form');
            this.editor.selectionManager.selectElement(form);
            showToast('Contact form inserted!');

            // Hide form builder
            const section = document.getElementById('form-builder-section');
            if (section) section.style.display = 'none';
        });
    }

    // ─── Components ──────────────────────────────────────────────
    private setupComponents(): void {
        this.renderComponents();
    }

    private renderComponents(): void {
        const list = document.getElementById('components-list');
        if (!list) return;

        let components: { id: string; name: string; tag: string; html: string; created: number }[] = [];
        try {
            components = JSON.parse(localStorage.getItem(COMPONENTS_KEY) || '[]');
        } catch { /* ignore */ }

        if (components.length === 0) {
            list.innerHTML = '<p class="panel-empty-hint" style="text-align:center; font-size:11px; color:var(--color-gray-400); padding:12px 0;">No components saved yet.<br>Right-click an element → Save as Component</p>';
            return;
        }

        list.innerHTML = '';
        components.forEach(comp => {
            const card = document.createElement('div');
            card.className = 'component-card';
            card.title = `Click to insert "${comp.name}"`;

            card.innerHTML = `
                <div class="component-card-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
                <div class="component-card-info">
                    <div class="component-card-name">${comp.name}</div>
                    <div class="component-card-tag">&lt;${comp.tag}&gt;</div>
                </div>
            `;

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'component-card-delete';
            delBtn.innerHTML = '×';
            delBtn.title = 'Delete component';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                try {
                    const stored = JSON.parse(localStorage.getItem(COMPONENTS_KEY) || '[]');
                    const updated = stored.filter((c: any) => c.id !== comp.id);
                    localStorage.setItem(COMPONENTS_KEY, JSON.stringify(updated));
                    this.renderComponents();
                    showToast('Component deleted');
                } catch { /* ignore */ }
            });
            card.appendChild(delBtn);

            // Click to insert
            card.addEventListener('click', () => {
                const doc = this.editor.getIframeDocument();
                if (!doc?.body) return;

                // Parse HTML and insert using a robust approach
                const temp = doc.createElement('div');
                temp.innerHTML = comp.html.trim();

                // Get all children to insert (component might be multi-element)
                const children = Array.from(temp.children) as HTMLElement[];
                if (children.length === 0) {
                    showToast('Component HTML is empty');
                    return;
                }

                const insertionPoint = this.currentElement && this.currentElement.parentNode
                    ? this.currentElement : null;

                children.forEach(child => {
                    if (insertionPoint && insertionPoint.parentNode) {
                        insertionPoint.parentNode.insertBefore(child, insertionPoint.nextSibling);
                    } else {
                        doc.body.appendChild(child);
                    }
                });

                this.editor.requestResize();
                this.editor.bus.emit('dom:changed');
                this.editor.pushHistory(`Insert component: ${comp.name}`);
                if (children[0]) this.editor.selectionManager.selectElement(children[0]);
                showToast(`Inserted "${comp.name}"`);
            });

            list.appendChild(card);
        });
    }
}
