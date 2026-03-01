import { EditorCore } from '../editor/EditorCore';
import { showToast } from '../utils/dom-helpers';
import TurndownService from 'turndown';

const PROJECTS_STORAGE_KEY = 'snapedit-projects';
const OWNER_ID_KEY = 'snapedit-owner-id';

/** Get or create a unique owner ID for this browser (tenant isolation) */
function getOwnerId(): string {
    let id = localStorage.getItem(OWNER_ID_KEY);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(OWNER_ID_KEY, id);
    }
    return id;
}

interface SavedProject {
    name: string;
    path: string;
    description: string;
}

export class Toolbar {
    private editor: EditorCore;
    private undoBtn!: HTMLButtonElement;
    private redoBtn!: HTMLButtonElement;

    constructor(editor: EditorCore) {
        this.editor = editor;
        this.setupUndoRedo();
        this.setupLoadButton();
        this.setupExportButton();
        this.setupSiteSettingsDropdown();
        this.setupReadOnlyListener();
        this.setupSaveStatusIndicator();
    }

    private setupUndoRedo(): void {
        this.undoBtn = document.getElementById('btn-undo') as HTMLButtonElement;
        this.redoBtn = document.getElementById('btn-redo') as HTMLButtonElement;

        this.undoBtn.addEventListener('click', () => this.editor.undo());
        this.redoBtn.addEventListener('click', () => this.editor.redo());

        // Listen for history changes to update button states
        this.editor.bus.on('history:change', (state: { canUndo: boolean; canRedo: boolean }) => {
            this.undoBtn.disabled = !state.canUndo || this.editor.isReadOnly;
            this.redoBtn.disabled = !state.canRedo || this.editor.isReadOnly;
        });
    }

    private setupReadOnlyListener(): void {
        this.editor.bus.on('editor:readonlyStatus', (payload: { readOnly: boolean; lockedByName: string }) => {
            const isReadOnly = payload.readOnly;
            const lockedByName = payload.lockedByName || 'Someone';

            const printBtn = document.getElementById('btn-print-preview') as HTMLButtonElement | null;
            const htmlBtn = document.getElementById('btn-export-html') as HTMLButtonElement | null;
            const mdBtn = document.getElementById('btn-export-md') as HTMLButtonElement | null;

            if (printBtn) printBtn.disabled = isReadOnly;
            if (htmlBtn) htmlBtn.disabled = isReadOnly;
            if (mdBtn) mdBtn.disabled = isReadOnly;
            this.undoBtn.disabled = isReadOnly || !this.editor.history.canUndo;
            this.redoBtn.disabled = isReadOnly || !this.editor.history.canRedo;

            let banner = document.getElementById('readonly-banner');
            if (isReadOnly) {
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'readonly-banner';
                    banner.style.position = 'fixed';
                    banner.style.top = '0';
                    banner.style.left = '0';
                    banner.style.width = '100%';
                    banner.style.background = '#ffeb3b';
                    banner.style.color = '#333';
                    banner.style.textAlign = 'center';
                    banner.style.padding = '8px';
                    banner.style.zIndex = '9999';
                    banner.style.fontWeight = 'bold';
                    banner.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    document.body.appendChild(banner);
                }
                banner.innerHTML = `🔒 Edytuje: <strong>${lockedByName}</strong>. Tryb tylko do odczytu.`;
                banner.style.display = 'block';
            } else {
                if (banner) banner.style.display = 'none';
            }
        });
    }

    /** Save-status indicator ("Saving..." / "✓ Saved" / "⚠ Error") */
    private setupSaveStatusIndicator(): void {
        // Create indicator element next to toolbar
        const indicator = document.createElement('div');
        indicator.id = 'save-status';
        indicator.style.cssText = 'position:fixed;top:8px;right:16px;z-index:9000;font-size:12px;padding:4px 12px;border-radius:12px;background:rgba(0,0,0,0.6);color:#aaa;display:none;transition:all 0.3s;';
        document.body.appendChild(indicator);

        this.editor.bus.on('editor:saveStatus', (status: string) => {
            indicator.style.display = 'block';
            switch (status) {
                case 'saving':
                    indicator.innerHTML = '💾 Saving...';
                    indicator.style.color = '#ffd54f';
                    break;
                case 'saved':
                    indicator.innerHTML = '✓ Saved';
                    indicator.style.color = '#81c784';
                    // Hide after 3 seconds
                    setTimeout(() => { indicator.style.display = 'none'; }, 3000);
                    break;
                case 'error':
                    indicator.innerHTML = '⚠ Save Error';
                    indicator.style.color = '#ef5350';
                    break;
            }
        });
    }

    private setupLoadButton(): void {
        const btn = document.getElementById('btn-load-html')!;
        const modal = document.getElementById('html-modal')!;
        const textarea = document.getElementById('html-input') as HTMLTextAreaElement;
        const loadBtn = document.getElementById('modal-load')!;
        const cancelBtn = document.getElementById('modal-cancel')!;
        const closeBtn = document.getElementById('modal-close')!;
        const fileInput = document.getElementById('html-file-input') as HTMLInputElement;
        const uploadBtn = document.getElementById('modal-upload-file')!;

        // Tab switching
        const tabBrowse = document.getElementById('tab-browse')!;
        const tabPaste = document.getElementById('tab-paste')!;
        const tabUpload = document.getElementById('tab-upload')!;

        const panelBrowse = document.getElementById('panel-browse')!;
        const panelPaste = document.getElementById('panel-paste')!;
        const panelUpload = document.getElementById('panel-upload')!;

        const hideAllTabs = () => {
            [tabBrowse, tabPaste, tabUpload].forEach(t => t.classList.remove('active'));
            [panelBrowse, panelPaste, panelUpload].forEach(p => p.style.display = 'none');
        };

        const activateTab = (tab: HTMLElement, panel: HTMLElement) => {
            hideAllTabs();
            tab.classList.add('active');
            panel.style.display = 'flex';
        };

        tabBrowse.addEventListener('click', () => {
            activateTab(tabBrowse, panelBrowse);
            // Ensure display: block for the grid, as display: flex messes up previously defined grid
            // Wait, .load-panel has display: flex flex-col globally now. We need it to just be normal wrapper
            // Actually, we replaced it to flex col, which is fine, but child grid takes over
        });

        tabPaste.addEventListener('click', () => {
            activateTab(tabPaste, panelPaste);
            textarea.value = this.editor.exportHTML();
            setTimeout(() => textarea.focus(), 100);
        });

        tabUpload.addEventListener('click', () => activateTab(tabUpload, panelUpload));

        btn.addEventListener('click', () => {
            modal.style.display = 'flex';
            // Default to browse tab
            activateTab(tabBrowse, panelBrowse);
            this.renderProjectCards();
        });

        const closeModal = () => { modal.style.display = 'none'; };

        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        loadBtn.addEventListener('click', () => {
            const html = textarea.value.trim();
            if (!html) { showToast('Please paste some HTML content.'); return; }
            this.editor.loadContent(html);
            closeModal();
            showToast('HTML loaded successfully!');
        });

        const browseFilesBtn = document.getElementById('modal-browse-files')!;
        browseFilesBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        const dropzone = document.getElementById('upload-dropzone');
        if (dropzone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(this: HTMLElement, e: Event) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-active'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-active'), false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt?.files;
                if (files && files.length > 0) {
                    fileInput.files = files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            }, false);
        }

        fileInput?.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    this.editor.loadContent(content);
                    closeModal();
                    showToast('HTML file loaded successfully!');
                };
                reader.readAsText(file);
            }
            fileInput.value = '';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
        });
    }

    // ─── Project Card Management ────────────────────────────────

    private async getProjects(): Promise<SavedProject[]> {
        try {
            const res = await fetch('/api/projects', {
                headers: { 'X-Owner-Id': getOwnerId() },
            });
            if (res.ok) {
                const data = await res.json();
                return data.map((p: any) => ({
                    name: p.name,
                    path: `/projects/${p.slug}/`,
                    description: p.description || '',
                    slug: p.slug,
                    lockedBy: p.lockedBy || null,
                }));
            }
        } catch { /* API offline */ }
        // Fallback to localStorage
        try {
            return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]');
        } catch { return []; }
    }

    private async renderProjectCards(): Promise<void> {
        const container = document.getElementById('project-cards');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Loading projects...</div>';

        const projects = await this.getProjects();
        container.innerHTML = '';

        // Section header
        const header = document.createElement('div');
        header.className = 'project-cards-header';
        header.innerHTML = `
            <span class="project-cards-label">📂 YOUR PROJECTS</span>
            <span class="project-cards-count">${projects.length} project${projects.length !== 1 ? 's' : ''}</span>
        `;
        container.appendChild(header);

        // Cards grid
        const grid = document.createElement('div');
        grid.className = 'project-cards-list';

        // Render each saved project card
        for (const project of projects) {
            const card = document.createElement('div');
            card.className = 'project-card';

            // Left: icon (locked or open)
            const iconEl = document.createElement('div');
            iconEl.className = 'project-card-icon';
            iconEl.textContent = (project as any).lockedBy ? '🔒' : '📁';
            card.appendChild(iconEl);

            // Center: info
            const info = document.createElement('div');
            info.className = 'project-card-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'project-card-name';
            nameEl.textContent = project.name;
            info.appendChild(nameEl);

            const descEl = document.createElement('div');
            descEl.className = 'project-card-desc';
            const lockInfo = (project as any).lockedBy ? ` (edytuje: ${(project as any).lockedBy})` : '';
            descEl.textContent = (project.description || (project as any).slug || project.path) + lockInfo;
            info.appendChild(descEl);

            card.appendChild(info);

            // Right: open arrow
            const arrow = document.createElement('span');
            arrow.className = 'project-card-arrow';
            arrow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
            card.appendChild(arrow);

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'project-card-delete';
            delBtn.innerHTML = '×';
            delBtn.title = 'Remove project';
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const slug = (project as any).slug;
                card.style.transform = 'scale(0.95)';
                card.style.opacity = '0';
                if (slug) {
                    try { await fetch(`/api/projects/${slug}`, { method: 'DELETE', headers: { 'X-Owner-Id': getOwnerId() } }); } catch { /* ignore */ }
                }
                setTimeout(() => {
                    this.renderProjectCards();
                    showToast(`"${project.name}" removed`);
                }, 150);
            });
            card.appendChild(delBtn);

            // Click → load project
            card.addEventListener('click', () => {
                this.editor.loadFromURL(project.path);
                const modal = document.getElementById('html-modal');
                if (modal) modal.style.display = 'none';
                showToast(`Loading project: ${project.name}`);
            });

            grid.appendChild(card);
        }

        // "+ Add Project" button
        const addBtn = document.createElement('button');
        addBtn.className = 'project-card-add';
        addBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add Project</span>`;
        addBtn.addEventListener('click', () => {
            this.showAddProjectForm(grid);
        });
        grid.appendChild(addBtn);

        container.appendChild(grid);
    }

    private showAddProjectForm(grid: HTMLElement): void {
        // Remove any existing form
        grid.querySelector('.project-add-form')?.remove();
        // Remove add button temporarily
        grid.querySelector('.project-card-add')?.remove();

        const form = document.createElement('div');
        form.className = 'project-add-form';

        const formTitle = document.createElement('div');
        formTitle.className = 'project-form-title';
        formTitle.textContent = '➕ Add new project';
        form.appendChild(formTitle);

        const fieldsRow = document.createElement('div');
        fieldsRow.className = 'project-form-fields';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Name  (e.g. Ciarko)';
        nameInput.autocomplete = 'off';

        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description  (optional)';
        descInput.autocomplete = 'off';

        fieldsRow.appendChild(nameInput);
        fieldsRow.appendChild(descInput);
        form.appendChild(fieldsRow);

        const actions = document.createElement('div');
        actions.className = 'project-add-form-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.renderProjectCards());

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-save';
        saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Create Project`;

        const doSave = async () => {
            const name = nameInput.value.trim();
            const description = descInput.value.trim();

            if (!name) { nameInput.focus(); showToast('Please enter a project name.'); return; }

            // Auto-generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 63);
            if (!slug) { nameInput.focus(); showToast('Invalid name for URL slug.'); return; }

            saveBtn.textContent = 'Creating...';
            saveBtn.setAttribute('disabled', 'true');

            try {
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Owner-Id': getOwnerId() },
                    body: JSON.stringify({ name, slug, description, createdBy: this.editor.userName }),
                });
                const data = await res.json();

                if (res.ok) {
                    this.renderProjectCards();
                    showToast(`"${name}" created!`);
                } else {
                    showToast(data.error || 'Failed to create project');
                    saveBtn.textContent = 'Create Project';
                    saveBtn.removeAttribute('disabled');
                }
            } catch {
                showToast('Server offline — could not create project.');
                saveBtn.textContent = 'Create Project';
                saveBtn.removeAttribute('disabled');
            }
        };

        saveBtn.addEventListener('click', doSave);

        // Enter key submits, Escape cancels
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); doSave(); }
            if (e.key === 'Escape') { e.preventDefault(); this.renderProjectCards(); }
        };
        nameInput.addEventListener('keydown', handleKey);
        descInput.addEventListener('keydown', handleKey);

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        form.appendChild(actions);

        grid.appendChild(form);
        nameInput.focus();
    }

    private setupExportButton(): void {
        const printBtn = document.getElementById('btn-print-preview')!;
        const htmlBtn = document.getElementById('btn-export-html')!;
        const mdBtn = document.getElementById('btn-export-md')!;

        // --- Print Preview ---
        printBtn.addEventListener('click', () => {
            const iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                this.editor.selectionManager.clearSelection();
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } else {
                showToast('Unable to print content.');
            }
        });

        // --- Download HTML ---
        htmlBtn.addEventListener('click', () => {
            const html = this.editor.exportHTML();
            if (!html) { showToast('No content to export.'); return; }

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'snapedit-export.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('HTML downloaded!');

            // Hide dropdown
            const menu = document.querySelector('.toolbar-dropdown-menu');
            if (menu) menu.classList.remove('show');
        });

        // --- Download Markdown ---
        mdBtn.addEventListener('click', () => {
            const doc = this.editor.getIframeDocument();
            if (!doc?.body) { showToast('No content to export.'); return; }

            // We use a clone to clean up editor-specific elements before conversion
            const clone = doc.body.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('.se-drag-handle, #se-drag-styles').forEach(el => el.remove());

            try {
                // Initialize turndown service
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    hr: '---',
                    bulletListMarker: '-',
                    codeBlockStyle: 'fenced'
                });

                // Add custom rule for form placeholders or complex elements
                turndownService.addRule('form', {
                    filter: 'form',
                    replacement: function () {
                        return '\n\n> [Contact Form Placeholder]\n\n';
                    }
                });

                // Add rule for video embedded iframes
                turndownService.addRule('iframe', {
                    filter: function (node) {
                        return node.nodeName === 'DIV' && node.querySelector('iframe') !== null;
                    },
                    replacement: function (content, node) {
                        const iframe = (node as HTMLElement).querySelector('iframe');
                        return `\n\n> [Embed: ${iframe?.src || 'Video/Map'}]\n\n`;
                    }
                });

                const markdown = turndownService.turndown(clone.innerHTML);

                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'snapedit-export.md';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showToast('Markdown downloaded!');
            } catch (err) {
                console.error(err);
                showToast('Error converting to Markdown.');
            }

            // Hide dropdown
            const menu = document.querySelector('.toolbar-dropdown-menu');
            if (menu) menu.classList.remove('show');
        });

        // Dropdown toggle logic
        const dropdownBtn = document.getElementById('btn-export-dropdown');
        dropdownBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = dropdownBtn.nextElementSibling;
            if (menu) menu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const exportMenu = document.querySelector('.toolbar-dropdown-menu');
            if (exportMenu && exportMenu.classList.contains('show')) {
                const target = e.target as Node;
                if (!dropdownBtn?.contains(target) && !exportMenu.contains(target)) {
                    exportMenu.classList.remove('show');
                }
            }
        });
    }

    private setupSiteSettingsDropdown(): void {
        const btn = document.getElementById('btn-site-settings');
        const menu = document.getElementById('site-settings-menu');
        const container = document.getElementById('site-settings-dropdown-container');

        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu) menu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (menu && menu.classList.contains('show')) {
                const target = e.target as Node;
                if (container && !container.contains(target)) {
                    menu.classList.remove('show');
                }
            }
        });

        // Prevent clicks inside the menu from bubbling up and closing it
        menu?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}
