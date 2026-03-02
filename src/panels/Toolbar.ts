import { EditorCore } from '../editor/EditorCore';
import { showToast } from '../utils/dom-helpers';
import TurndownService from 'turndown';

const PROJECTS_STORAGE_KEY = 'snapedit-projects';

interface SavedProject {
    name: string;
    path: string;
    description: string;
    slug?: string;
    lockedBy?: string | null;
    updatedAt?: string;
    createdBy?: string;
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
                banner.textContent = `🔒 Edytuje: ${lockedByName}. Tryb tylko do odczytu.`;
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

        const modalContent = modal.querySelector('.load-modal') as HTMLElement;

        const activateTab = (tab: HTMLElement, panel: HTMLElement) => {
            hideAllTabs();
            tab.classList.add('active');
            panel.style.display = 'flex';
            // Widen modal for browse tab
            if (modalContent) {
                modalContent.classList.toggle('browse-active', tab === tabBrowse);
            }
        };

        tabBrowse.addEventListener('click', () => {
            activateTab(tabBrowse, panelBrowse);
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
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                return data.map((p: any) => ({
                    name: p.name,
                    path: `/projects/${p.slug}/`,
                    description: p.description || '',
                    slug: p.slug,
                    lockedBy: p.lockedBy || null,
                    updatedAt: p.updatedAt || '',
                    createdBy: p.createdBy || '',
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
        container.innerHTML = '';

        const projects = await this.getProjects();

        // ─── Left column: project list ───
        const left = document.createElement('div');
        left.className = 'browse-projects-left';

        // Header
        const header = document.createElement('div');
        header.className = 'browse-projects-header';
        header.innerHTML = `
            <span class="browse-projects-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                Your Projects
            </span>
            <span class="browse-projects-count">${projects.length}</span>
        `;
        left.appendChild(header);

        // Scrollable list
        const scroll = document.createElement('div');
        scroll.className = 'browse-projects-scroll';

        // Search bar (only if there are projects)
        if (projects.length > 0) {
            const searchWrap = document.createElement('div');
            searchWrap.className = 'browse-projects-search';
            searchWrap.innerHTML = `
                <div class="browse-search-wrapper">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search projects..." id="bp-search" />
                </div>
            `;
            left.appendChild(searchWrap);

            // Wire up search
            const searchInput = searchWrap.querySelector('#bp-search') as HTMLInputElement;
            searchInput?.addEventListener('input', () => {
                const q = searchInput.value.toLowerCase();
                scroll.querySelectorAll('.bp-card').forEach(c => {
                    const name = c.querySelector('.bp-card-name')?.textContent?.toLowerCase() || '';
                    const slug = c.querySelector('.bp-card-slug')?.textContent?.toLowerCase() || '';
                    (c as HTMLElement).style.display = (name.includes(q) || slug.includes(q)) ? '' : 'none';
                });
            });
        }

        if (projects.length === 0) {
            scroll.innerHTML = `
                <div class="bp-empty">
                    <div class="bp-empty-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <h4>No projects yet</h4>
                    <p>Create your first project using<br>the panel on the right →</p>
                </div>
            `;
        } else {
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                const card = this._createProjectCard(project, i);
                scroll.appendChild(card);
            }
        }

        left.appendChild(scroll);
        container.appendChild(left);

        // ─── Right column: New Project ───
        const right = this._buildNewProjectPanel();
        container.appendChild(right);
    }

    private _createProjectCard(project: SavedProject, index: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'bp-card';
        card.style.animationDelay = `${index * 0.03}s`;

        // Icon
        const iconEl = document.createElement('div');
        iconEl.className = `bp-card-icon${project.lockedBy ? ' locked' : ''}`;
        iconEl.textContent = project.lockedBy ? '🔒' : '📁';
        card.appendChild(iconEl);

        // Info
        const info = document.createElement('div');
        info.className = 'bp-card-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'bp-card-name';
        nameEl.textContent = project.name;
        info.appendChild(nameEl);

        const meta = document.createElement('div');
        meta.className = 'bp-card-meta';

        if (project.slug) {
            const slugEl = document.createElement('span');
            slugEl.className = 'bp-card-slug';
            slugEl.textContent = `/${project.slug}`;
            meta.appendChild(slugEl);
        }

        if (project.updatedAt) {
            if (project.slug) {
                const dot = document.createElement('span');
                dot.className = 'bp-card-dot';
                meta.appendChild(dot);
            }
            const timeEl = document.createElement('span');
            timeEl.className = 'bp-card-time';
            timeEl.textContent = this._formatRelativeTime(project.updatedAt);
            meta.appendChild(timeEl);
        }

        if (project.lockedBy) {
            const dot2 = document.createElement('span');
            dot2.className = 'bp-card-dot';
            meta.appendChild(dot2);
            const badge = document.createElement('span');
            badge.className = 'bp-card-badge editing';
            badge.textContent = `✏️ ${project.lockedBy}`;
            meta.appendChild(badge);
        }

        info.appendChild(meta);
        card.appendChild(info);

        // Actions (open + delete)
        const actions = document.createElement('div');
        actions.className = 'bp-card-actions';

        const openBtn = document.createElement('button');
        openBtn.className = 'bp-card-btn';
        openBtn.title = 'Open project';
        openBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openProject(project);
        });
        actions.appendChild(openBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'bp-card-btn danger';
        delBtn.title = 'Delete project';
        delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            if (project.slug) {
                try { await fetch(`/api/projects/${project.slug}`, { method: 'DELETE', credentials: 'include' }); } catch { /* ignore */ }
            }
            setTimeout(() => {
                this.renderProjectCards();
                showToast(`"${project.name}" deleted`);
            }, 150);
        });
        actions.appendChild(delBtn);

        card.appendChild(actions);

        // Click whole card to open
        card.addEventListener('click', () => this._openProject(project));

        return card;
    }

    private _openProject(project: SavedProject): void {
        this.editor.loadFromURL(project.path);
        const modal = document.getElementById('html-modal');
        if (modal) modal.style.display = 'none';
        showToast(`Loading: ${project.name
            }`);
    }

    private _formatRelativeTime(isoDate: string): string {
        try {
            const diff = Date.now() - new Date(isoDate).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'just now';
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            if (days < 7) return `${days}d ago`;
            return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch { return ''; }
    }

    private _buildNewProjectPanel(): HTMLElement {
        const right = document.createElement('div');
        right.className = 'browse-projects-right';

        // Title
        const title = document.createElement('div');
        title.className = 'bp-new-title';
        title.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Project`;
        right.appendChild(title);

        // Fields
        const fields = document.createElement('div');
        fields.className = 'bp-new-fields';

        const nameField = document.createElement('div');
        nameField.className = 'bp-new-field';
        nameField.innerHTML = `<label>Project Name</label>`;
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'My Website';
        nameInput.autocomplete = 'off';
        nameField.appendChild(nameInput);
        fields.appendChild(nameField);

        const descField = document.createElement('div');
        descField.className = 'bp-new-field';
        descField.innerHTML = `<label>Description</label>`;
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Optional...';
        descInput.autocomplete = 'off';
        descField.appendChild(descInput);
        fields.appendChild(descField);

        right.appendChild(fields);

        // Template label
        const tplLabel = document.createElement('div');
        tplLabel.className = 'bp-template-label';
        tplLabel.textContent = 'Template';
        right.appendChild(tplLabel);

        // Template grid
        const tplGrid = document.createElement('div');
        tplGrid.className = 'bp-template-grid';

        let selectedTemplate = 'blank';

        const templates = [
            { id: 'blank', name: 'Blank', icon: '📄', bg: 'rgba(129,140,248,0.12)' },
            { id: 'landing', name: 'Landing', icon: '🚀', bg: 'rgba(56,189,248,0.12)' },
            { id: 'portfolio', name: 'Portfolio', icon: '🎨', bg: 'rgba(168,85,247,0.12)' },
            { id: 'blog', name: 'Blog', icon: '✍️', bg: 'rgba(34,197,94,0.12)' },
            { id: 'docs', name: 'Docs', icon: '📘', bg: 'rgba(251,191,36,0.12)' },
            { id: 'resume', name: 'Resume', icon: '📋', bg: 'rgba(244,114,182,0.12)' },
        ];

        templates.forEach(t => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `bp-template-card${t.id === 'blank' ? ' selected' : ''}`;
            card.innerHTML = `<span class="bp-template-icon" style="background:${t.bg}">${t.icon}</span>${t.name}`;
            card.addEventListener('click', () => {
                selectedTemplate = t.id;
                tplGrid.querySelectorAll('.bp-template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
            tplGrid.appendChild(card);
        });

        right.appendChild(tplGrid);

        // Create button
        const createBtn = document.createElement('button');
        createBtn.className = 'bp-create-btn';
        createBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Create Project
        `;
        createBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            const description = descInput.value.trim();

            if (!name) { nameInput.focus(); showToast('Enter a project name.'); return; }

            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 63);
            if (!slug) { nameInput.focus(); showToast('Invalid name for URL slug.'); return; }

            createBtn.textContent = 'Creating...';
            createBtn.setAttribute('disabled', 'true');

            try {
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, slug, description, template: selectedTemplate, createdBy: this.editor.userName }),
                });
                const data = await res.json();

                if (res.ok) {
                    this.renderProjectCards();
                    showToast(`"${name}" created!`);
                } else {
                    showToast(data.error || 'Failed to create project');
                    createBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Create Project`;
                    createBtn.removeAttribute('disabled');
                }
            } catch {
                showToast('Connection error. Try again.');
                createBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Create Project`;
                createBtn.removeAttribute('disabled');
            }
        });

        // Enter key on name input triggers create
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') createBtn.click();
        });

        right.appendChild(createBtn);
        return right;
    }

    private showAddProjectForm(_grid: HTMLElement): void {
        this.renderProjectCards();
    }

    private _triggerDownload(content: string, filename: string, mime: string): void {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        // Delay cleanup so the download actually starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);

        // Hide dropdown
        const menu = document.querySelector('.toolbar-dropdown-menu');
        if (menu) menu.classList.remove('show');
    }

    private setupExportButton(): void {
        const printBtn = document.getElementById('btn-print-preview');
        const htmlBtn = document.getElementById('btn-export-html');
        const mdBtn = document.getElementById('btn-export-md');

        if (!printBtn || !htmlBtn || !mdBtn) {
            console.error('[Export] Missing button elements — printBtn:', !!printBtn, 'htmlBtn:', !!htmlBtn, 'mdBtn:', !!mdBtn);
            return;
        }

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
        htmlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const html = this.editor.exportHTML();
            if (!html) { showToast('No content to export.'); return; }
            this._triggerDownload(html, 'snapedit-export.html', 'text/html');
            showToast('HTML downloaded!');
        });

        // --- Download Markdown ---
        mdBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const doc = this.editor.getIframeDocument();
            if (!doc?.body) { showToast('No content to export.'); return; }

            // Clone to clean up editor-specific elements before conversion
            const clone = doc.body.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('.se-drag-handle, #se-drag-styles').forEach(el => el.remove());

            try {
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    hr: '---',
                    bulletListMarker: '-',
                    codeBlockStyle: 'fenced'
                });

                turndownService.addRule('form', {
                    filter: 'form',
                    replacement: function () {
                        return '\n\n> [Contact Form Placeholder]\n\n';
                    }
                });

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
                this._triggerDownload(markdown, 'snapedit-export.md', 'text/markdown');
                showToast('Markdown downloaded!');
            } catch (err) {
                console.error(err);
                showToast('Error converting to Markdown.');
            }
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
