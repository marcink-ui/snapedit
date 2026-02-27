import './style.css';
import { EditorCore } from './editor/EditorCore';
import { StylesPanel } from './panels/StylesPanel';
import { Toolbar } from './panels/Toolbar';
import { LayersPanel } from './panels/LayersPanel';
import { InsertPanel } from './panels/InsertPanel';
import { PanelResizer } from './utils/PanelResizer';
import { BreadcrumbBar } from './panels/BreadcrumbBar';
import { ContextMenu } from './panels/ContextMenu';
import { StyleClipboard } from './utils/StyleClipboard';
import { BreakpointManager } from './editor/BreakpointManager';
import { FlexGridPanel } from './panels/FlexGridPanel';
import { PageManager } from './editor/PageManager';
import { PageSelector } from './panels/PageSelector';
import { PrintPreviewPanel } from './panels/PrintPreviewPanel';
import { SiteSettingsPanel } from './panels/SiteSettingsPanel';
import { SectionsPanel } from './panels/SectionsPanel';
import { GeneralPanel } from './panels/GeneralPanel';

// Initialize SnapEdit
document.addEventListener('DOMContentLoaded', () => {
    const editor = new EditorCore();
    editor.init();

    // Initialize UI panels
    new StylesPanel(editor);
    new Toolbar(editor);
    new LayersPanel(editor);
    const insertPanel = new InsertPanel(editor);
    insertPanel.setupFormBuilder();
    insertPanel.setupEmbedBuilder();
    new BreadcrumbBar(editor);
    new SiteSettingsPanel(editor);
    new SectionsPanel(editor);
    new GeneralPanel(editor);

    // Layout panels
    new BreakpointManager(editor.bus);
    const flexGrid = new FlexGridPanel(editor);
    flexGrid.setupListeners();

    // Multi-page Support
    const pageManager = new PageManager(editor.bus);
    new PageSelector(pageManager, editor);
    editor.bus.on('page:switched', (page: any) => {
        editor.loadContent(page.html);
    });

    // Print Preview
    new PrintPreviewPanel(editor);

    // Shared utilities
    const styleClipboard = new StyleClipboard();
    new ContextMenu(editor, styleClipboard);

    // Keyboard shortcuts for style copy/paste
    const handleStyleShortcuts = (e: KeyboardEvent) => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.altKey && e.key === 'c') {
            e.preventDefault();
            const selected = editor.selectionManager.getSelectedElement();
            if (selected) styleClipboard.copy(selected);
        }
        if (mod && e.altKey && e.key === 'v') {
            e.preventDefault();
            const selected = editor.selectionManager.getSelectedElement();
            if (selected && styleClipboard.paste(selected)) {
                editor.selectionManager.refreshSelectOverlay();
                editor.pushHistory('Paste styles');
            }
        }
    };

    document.addEventListener('keydown', handleStyleShortcuts);
    editor.bus.on('content:loaded', () => {
        const doc = editor.getIframeDocument();
        if (doc) doc.addEventListener('keydown', handleStyleShortcuts);
    });

    // Panel resize handles
    new PanelResizer();

    // ─── Zoom Controls ──────────────────────────────────────
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    const zoomLabel = document.getElementById('zoom-label') as HTMLElement;
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomFitBtn = document.getElementById('zoom-fit-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;

    const applyZoom = (level: number) => {
        const clamped = Math.max(25, Math.min(200, level));
        zoomSlider.value = String(clamped);
        zoomLabel.textContent = clamped + '%';
        canvasWrapper.style.transform = `scale(${clamped / 100})`;
        canvasWrapper.style.transformOrigin = 'top center';
    };

    zoomSlider?.addEventListener('input', () => applyZoom(parseInt(zoomSlider.value)));
    zoomInBtn?.addEventListener('click', () => applyZoom(parseInt(zoomSlider.value) + 10));
    zoomOutBtn?.addEventListener('click', () => applyZoom(parseInt(zoomSlider.value) - 10));
    zoomResetBtn?.addEventListener('click', () => applyZoom(100));
    zoomFitBtn?.addEventListener('click', () => {
        const canvasArea = document.querySelector('.canvas-main-content') as HTMLElement;
        if (canvasArea && canvasWrapper) {
            const areaW = canvasArea.clientWidth - 64;
            const wrapW = canvasWrapper.scrollWidth;
            const fitScale = Math.round((areaW / wrapW) * 100);
            applyZoom(Math.min(fitScale, 100));
        }
    });

    // Collapsible section titles
    document.querySelectorAll<HTMLElement>('.section-title[data-collapsible]').forEach(title => {
        const section = title.closest('.panel-section');
        if (!section) return;
        const key = 'snap_collapse_' + (title.textContent?.trim() || '');
        // Restore collapsed state
        if (localStorage.getItem(key) === '1') {
            section.classList.add('collapsed');
            title.classList.add('collapsed');
        }
        title.addEventListener('click', () => {
            const isCollapsed = section.classList.toggle('collapsed');
            title.classList.toggle('collapsed');
            localStorage.setItem(key, isCollapsed ? '1' : '0');
        });
    });

    // ─── Collapsible Sidebars ───────────────────────────────
    const layersPanel = document.getElementById('layers-panel');
    const layersCollapsed = document.getElementById('layers-collapsed');
    const toggleLayers = document.getElementById('toggle-layers');
    const expandLayers = document.getElementById('expand-layers');
    const resizeLeft = document.getElementById('resize-left');

    const stylesPanel = document.getElementById('styles-panel');
    const stylesCollapsed = document.getElementById('styles-collapsed');
    const toggleStyles = document.getElementById('toggle-styles');
    const expandStyles = document.getElementById('expand-styles');
    const resizeRight = document.getElementById('resize-right');

    const collapseLeft = () => {
        if (layersPanel && layersCollapsed && resizeLeft) {
            layersPanel.style.display = 'none';
            layersCollapsed.style.display = 'flex';
            resizeLeft.style.display = 'none';
            localStorage.setItem('snap_sidebar_layers', 'collapsed');
        }
    };
    const expandLeft = () => {
        if (layersPanel && layersCollapsed && resizeLeft) {
            layersPanel.style.display = 'flex';
            layersCollapsed.style.display = 'none';
            resizeLeft.style.display = '';
            localStorage.setItem('snap_sidebar_layers', 'expanded');
        }
    };
    const collapseRight = () => {
        if (stylesPanel && stylesCollapsed && resizeRight) {
            stylesPanel.style.display = 'none';
            stylesCollapsed.style.display = 'flex';
            resizeRight.style.display = 'none';
            localStorage.setItem('snap_sidebar_styles', 'collapsed');
        }
    };
    const expandRight = () => {
        if (stylesPanel && stylesCollapsed && resizeRight) {
            stylesPanel.style.display = 'flex';
            stylesCollapsed.style.display = 'none';
            resizeRight.style.display = '';
            localStorage.setItem('snap_sidebar_styles', 'expanded');
        }
    };

    toggleLayers?.addEventListener('click', collapseLeft);
    expandLayers?.addEventListener('click', expandLeft);
    toggleStyles?.addEventListener('click', collapseRight);
    expandStyles?.addEventListener('click', expandRight);

    // Restore sidebar states
    if (localStorage.getItem('snap_sidebar_layers') === 'collapsed') collapseLeft();
    if (localStorage.getItem('snap_sidebar_styles') === 'collapsed') collapseRight();
});
