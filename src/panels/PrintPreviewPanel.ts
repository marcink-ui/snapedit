import { EditorCore } from '../editor/EditorCore';

export class PrintPreviewPanel {
    private editor: EditorCore;
    private panel: HTMLElement;
    private closeBtn: HTMLElement;
    private toggleBtn: HTMLElement;
    private iframe: HTMLIFrameElement;
    private resizeHandle: HTMLElement;
    private a4Container: HTMLElement;

    private isOpen = false;
    private updateTimeout: number | null = null;

    // 794px is expected A4 width at 96dpi
    private readonly A4_WIDTH = 794;
    private readonly A4_HEIGHT = 1123;

    constructor(editor: EditorCore) {
        this.editor = editor;

        this.panel = document.getElementById('print-preview-panel') as HTMLElement;
        this.closeBtn = document.getElementById('btn-close-preview') as HTMLElement;
        this.toggleBtn = document.getElementById('btn-print-preview') as HTMLElement;
        this.iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        this.resizeHandle = document.getElementById('resize-preview') as HTMLElement;
        this.a4Container = this.panel.querySelector('.a4-page-container') as HTMLElement;

        const printBtn = document.getElementById('btn-confirm-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                if (this.iframe.contentWindow) {
                    this.iframe.contentWindow.print();
                }
            });
        }

        this.closeBtn.addEventListener('click', () => this.closePanel());
        this.toggleBtn.addEventListener('click', () => this.togglePanel());

        // We need to know when the editor changes so we can update the preview
        window.addEventListener('editorChange', () => this.queueUpdate());

        // Handle resize events to rescale the preview wrapper
        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this.scalePreview();
            }
        });
    }

    public togglePanel(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.classList.add('preview-open');
            this.resizeHandle.style.display = 'block';
            this.toggleBtn.classList.add('active');
            this.updatePreview();
        } else {
            this.closePanel();
        }
    }

    public closePanel(): void {
        this.isOpen = false;
        this.panel.classList.remove('preview-open');
        this.resizeHandle.style.display = 'none';
        this.toggleBtn.classList.remove('active');
    }

    private queueUpdate(): void {
        if (!this.isOpen) return;

        if (this.updateTimeout) {
            window.clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = window.setTimeout(() => {
            this.updatePreview();
        }, 500); // 500ms debounce
    }

    private async updatePreview(): Promise<void> {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        // Extract editor HTML (no tagging needed — we'll fix everything via CSS)
        const cleanHtml = this.editor.exportHTML();

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(cleanHtml, 'text/html');

        // Clear the iframe document first, but preserve the HTML structure
        doc.open();
        doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
        doc.close();

        // ── FIX 1: Inject <base> tag so relative image/asset paths resolve correctly ──
        // The editor iframe loads content from e.g. '/projects/snapedit-demo/'
        // so images with src="assets/hero.png" need that base URL to resolve.
        const editorIframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
        const projectUrl = this.editor.getProjectUrl();
        if (projectUrl) {
            const base = doc.createElement('base');
            // Ensure trailing slash for directory-style URLs
            base.href = projectUrl.endsWith('/') ? projectUrl : projectUrl + '/';
            doc.head.appendChild(base);
        } else if (editorIframe?.src && editorIframe.src !== 'about:blank') {
            // Fallback: use the editor iframe's actual src
            const base = doc.createElement('base');
            base.href = editorIframe.src;
            doc.head.appendChild(base);
        }

        // Copy styles and links from the parsed document
        if (doc.head && parsedDoc.head) {
            Array.from(parsedDoc.head.querySelectorAll('style, link, meta')).forEach(el => {
                doc.head.appendChild(doc.importNode(el, true));
            });
        }

        // ── Copy body content so we can pre-process DOM BEFORE paged.js ──
        if (parsedDoc.body) {
            // Import the parsed body's content into the iframe document
            Array.from(parsedDoc.body.childNodes).forEach(node => {
                doc.body.appendChild(doc.importNode(node, true));
            });
        }

        // Inject aggressive print-normalization CSS AFTER the document's own styles
        // so our rules win via specificity + !important
        const printStyle = doc.createElement('style');
        printStyle.textContent = `
            /* === PAGE DEFINITION === */
            @page {
                size: A4;
                margin: 15mm 12mm;
            }

            /* === BODY NORMALIZATION FOR PAGED.JS === */
            body {
                width: 794px !important;
                max-width: 794px !important;
                margin: 0 !important;
                padding: 0 !important;
                background: transparent !important;
                overflow: hidden !important;
                font-size: 10.5pt;
                line-height: 1.5;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            /* === SECTION BREAKS === */
            .page-break {
                page-break-before: always !important;
                break-before: page !important;
            }

            /* === COVER PAGE: Remove forced min-height === */
            .cover {
                min-height: auto !important;
                height: auto !important;
                padding-bottom: 2rem;
            }

            /* === CONTAINER: Remove max-width constraint for print === */
            .container {
                max-width: 100% !important;
                padding: 0 !important;
            }

            /* === HEADINGS: Avoid orphaned headings at bottom of page === */
            h1, h2, h3, h4, h5, h6 {
                break-after: avoid !important;
                page-break-after: avoid !important;
            }

            /* Reduce heading sizes for A4 fit */
            h1 { font-size: 2.2rem !important; margin-bottom: 1rem !important; }
            h2 { font-size: 1.6rem !important; margin-top: 1.75rem !important; margin-bottom: 0.75rem !important; }
            h3 { font-size: 1.25rem !important; margin-top: 1.25rem !important; margin-bottom: 0.5rem !important; }
            h4 { font-size: 1.1rem !important; margin-top: 1rem !important; margin-bottom: 0.25rem !important; }

            /* === BLOCK COMPONENTS: Keep together === */
            .alert,
            .timeline-item,
            .slider-grid,
            .flow-container,
            blockquote,
            .question-box,
            .verdict-box,
            .workshop-quote,
            .card,
            .kpi,
            .meta-item {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            /* === TABLES === */
            table {
                page-break-inside: auto !important;
                break-inside: auto !important;
            }
            tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }

            /* === IMAGES === */
            img, svg, video, canvas, picture {
                max-width: 100% !important;
                height: auto !important;
            }

            /* === NEUTRALIZE VIEWPORT UNITS === */
            [style*="vh"], [style*="svh"], [style*="dvh"] {
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
            }
            [style*="vw"], [style*="svw"] {
                width: auto !important;
                max-width: 100% !important;
            }

            /* === KILL MAX-HEIGHT ON ALL ELEMENTS === */
            body *, body *::before, body *::after {
                max-height: none !important;
            }

            /* Compact alert padding for print */
            .alert {
                padding: 0.75rem !important;
                margin-bottom: 0.75rem !important;
            }

            /* Compact table cells for print */
            td, th {
                padding: 6px 8px !important;
            }

            /* === PAGED.JS VISUAL STYLING === */
            .pagedjs_page {
                background: white;
                margin: 0 auto 24px auto !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            }

            @media print {
                body { background: white !important; padding: 0 !important; }
                .pagedjs_page { box-shadow: none; margin: 0 !important; }
            }

            /* Hide editor overlays */
            .se-drag-handle, #se-drag-styles { display: none !important; }
        `;
        doc.head.appendChild(printStyle);

        try {
            // Force iframe attributes to enforce width
            this.iframe.setAttribute('width', '794');
            this.iframe.style.width = '794px';
            this.iframe.style.minWidth = '794px';
            this.iframe.style.transform = 'none';

            this.a4Container.style.width = '794px';
            this.a4Container.style.minWidth = '794px';
            this.a4Container.style.height = 'auto';

            // Force synchronous browser reflow so Paged.js reads innerWidth as 794
            void this.iframe.offsetWidth;
            void this.a4Container.offsetWidth;

            // ── FIX 2: DOM PRE-PROCESSING on the actual body content ──
            // Walk all elements INSIDE the iframe and normalize layouts that break Paged.js.
            // This runs on the REAL DOM (not the raw HTML string), so changes persist.
            const iframeWin = this.iframe.contentWindow;
            if (doc.body && iframeWin) {
                doc.body.querySelectorAll('*').forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    const cs = iframeWin.getComputedStyle(node);

                    // Convert flex & grid to block so Paged.js can fragment content
                    if (cs.display === 'flex' || cs.display === 'inline-flex' ||
                        cs.display === 'grid' || cs.display === 'inline-grid') {
                        node.style.setProperty('display', 'block', 'important');
                    }

                    // Kill viewport-relative heights
                    const h = node.style.height || '';
                    const mh = node.style.minHeight || '';
                    if (h.includes('vh') || h.includes('svh') || h.includes('dvh')) {
                        node.style.setProperty('height', 'auto', 'important');
                    }
                    if (mh.includes('vh') || mh.includes('svh') || mh.includes('dvh')) {
                        node.style.setProperty('min-height', '0', 'important');
                    }

                    // Neutralize fixed/sticky positioning
                    if (cs.position === 'fixed' || cs.position === 'sticky') {
                        node.style.setProperty('position', 'relative', 'important');
                    }
                });
            }

            // ── FIX 3: Wait for images to load before paged.js pagination ──
            const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
            if (images.length > 0) {
                await Promise.all(images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise<void>(resolve => {
                        img.onload = () => resolve();
                        img.onerror = () => resolve(); // Don't block on broken images
                        // Timeout fallback (5s per image max)
                        setTimeout(() => resolve(), 5000);
                    });
                }));
            }

            // ── Now pass the pre-processed body content to Paged.js ──
            // We pass doc.body.innerHTML so paged.js receives the NORMALIZED content
            // (flex→block, vh→auto, fixed→relative) instead of the raw HTML.
            const processedContent = doc.body.innerHTML;
            const { Previewer } = await import('pagedjs');
            const previewer = new Previewer();

            await previewer.preview(processedContent, [], doc.body);

            this.scalePreview();
        } catch (error) {
            console.error('[PrintPreview] Failed to render with pagedjs:', error);
        }
    }

    private scalePreview(): void {
        const doc = this.iframe.contentDocument;
        if (!doc) return;

        const container = this.panel.querySelector('.preview-content') as HTMLElement;
        const availableWidth = Math.max(100, container.clientWidth - 40);
        const scale = availableWidth / this.A4_WIDTH;

        if (doc.body) {
            const pagedjsPages = doc.body.querySelector('.pagedjs_pages') as HTMLElement;
            if (pagedjsPages) {
                // Un-scale the inner container that Paged.js injects
                pagedjsPages.style.transform = 'none';
                pagedjsPages.style.width = `${this.A4_WIDTH}px`;
                pagedjsPages.style.margin = '0 auto';

                // Calculate total height needed for the body based on pages
                const pagesCount = pagedjsPages.querySelectorAll('.pagedjs_page').length;
                const totalRawHeight = (this.A4_HEIGHT * pagesCount) + (24 * pagesCount); // include gaps

                // Allow the iframe bounds to encompass the full unscaled height
                this.iframe.style.width = `${this.A4_WIDTH}px`;
                this.iframe.style.height = `${totalRawHeight}px`;

                // Scale the iframe element itself with CSS
                this.iframe.style.transformOrigin = 'top left';
                this.iframe.style.transform = `scale(${scale})`;

                // The container matches the scaled dimensions for the outer scrollbar
                this.a4Container.style.width = `${this.A4_WIDTH * scale}px`;
                this.a4Container.style.height = `${(totalRawHeight) * scale + 48}px`; // + padding
                this.a4Container.style.margin = '0 auto';
                this.a4Container.style.overflow = 'hidden'; // clip iframe visual bounds
            }
        }
    }
}
