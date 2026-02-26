import { EditorCore } from '../editor/EditorCore';

export class SiteSettingsPanel {
    private editor: EditorCore;

    // Site Info
    private titleInput: HTMLInputElement;
    private metaDescInput: HTMLTextAreaElement;
    private faviconInput: HTMLInputElement;
    private langSelect: HTMLSelectElement;

    // Header
    private headerToggle: HTMLInputElement;
    private headerLogo: HTMLInputElement;
    private headerLinks: HTMLInputElement;
    private headerSticky: HTMLInputElement;
    private headerStyle: HTMLSelectElement;
    private headerOptionsPanel: HTMLElement;

    // Footer
    private footerToggle: HTMLInputElement;
    private footerText: HTMLInputElement;
    private footerLinks: HTMLInputElement;
    private footerAlign: HTMLSelectElement;
    private footerOptionsPanel: HTMLElement;

    constructor(editor: EditorCore) {
        this.editor = editor;

        this.titleInput = document.getElementById('site-page-title') as HTMLInputElement;
        this.metaDescInput = document.getElementById('site-meta-desc') as HTMLTextAreaElement;
        this.faviconInput = document.getElementById('site-favicon') as HTMLInputElement;
        this.langSelect = document.getElementById('site-lang') as HTMLSelectElement;

        this.headerToggle = document.getElementById('site-header-toggle') as HTMLInputElement;
        this.headerLogo = document.getElementById('site-header-logo') as HTMLInputElement;
        this.headerLinks = document.getElementById('site-header-links') as HTMLInputElement;
        this.headerSticky = document.getElementById('site-header-sticky') as HTMLInputElement;
        this.headerStyle = document.getElementById('site-header-style') as HTMLSelectElement;
        this.headerOptionsPanel = document.getElementById('site-header-options') as HTMLElement;

        this.footerToggle = document.getElementById('site-footer-toggle') as HTMLInputElement;
        this.footerText = document.getElementById('site-footer-text') as HTMLInputElement;
        this.footerLinks = document.getElementById('site-footer-links') as HTMLInputElement;
        this.footerAlign = document.getElementById('site-footer-align') as HTMLSelectElement;
        this.footerOptionsPanel = document.getElementById('site-footer-options') as HTMLElement;

        this.setupListeners();

        this.editor.bus.on('content:loaded', () => {
            this.syncFromDOM();
        });
    }

    private setupListeners(): void {
        // Site Info Listeners
        this.titleInput.addEventListener('change', () => this.updateSiteInfo());
        this.metaDescInput.addEventListener('change', () => this.updateSiteInfo());
        this.faviconInput.addEventListener('change', () => this.updateSiteInfo());
        this.langSelect.addEventListener('change', () => this.updateSiteInfo());

        // Header Listeners
        this.headerToggle.addEventListener('change', () => this.toggleHeader());
        this.headerLogo.addEventListener('input', () => this.updateHeader());
        this.headerLinks.addEventListener('input', () => this.updateHeader());
        this.headerSticky.addEventListener('change', () => this.updateHeader());
        this.headerStyle.addEventListener('change', () => this.updateHeader());

        // Footer Listeners
        this.footerToggle.addEventListener('change', () => this.toggleFooter());
        this.footerText.addEventListener('input', () => this.updateFooter());
        this.footerLinks.addEventListener('input', () => this.updateFooter());
        this.footerAlign.addEventListener('change', () => this.updateFooter());
    }

    private syncFromDOM(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc) return;

        // Sync Site Info
        const titleEl = doc.querySelector('title');
        this.titleInput.value = titleEl ? titleEl.textContent || '' : '';

        const metaDescEl = doc.querySelector('meta[name="description"]');
        this.metaDescInput.value = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';

        const linkIconEl = doc.querySelector('link[rel="icon"]');
        this.faviconInput.value = linkIconEl ? linkIconEl.getAttribute('href') || '' : '';

        const htmlEl = doc.documentElement;
        this.langSelect.value = htmlEl.getAttribute('lang') || 'en';

        // Sync Header
        const headerEl = doc.querySelector('header[data-se-header="true"]') as HTMLElement;
        this.headerToggle.checked = !!headerEl;
        this.headerOptionsPanel.style.display = headerEl ? 'block' : 'none';

        if (headerEl) {
            const logoEl = headerEl.querySelector('.se-nav-logo');
            this.headerLogo.value = logoEl ? logoEl.textContent || '' : 'Brand Name';

            // Reconstruct links simple array
            const linkEls = headerEl.querySelectorAll('.se-nav-links a');
            const links = Array.from(linkEls).map(el => el.textContent).filter(Boolean);
            this.headerLinks.value = links.join(', ');

            this.headerSticky.checked = headerEl.style.position === 'sticky';
            this.headerStyle.value = headerEl.getAttribute('data-se-style') || 'simple';
        } else {
            this.headerLogo.value = 'Brand Name';
            this.headerLinks.value = 'Home, About, Contact';
            this.headerSticky.checked = false;
            this.headerStyle.value = 'simple';
        }

        // Sync Footer
        const footerEl = doc.querySelector('footer[data-se-footer="true"]') as HTMLElement;
        this.footerToggle.checked = !!footerEl;
        this.footerOptionsPanel.style.display = footerEl ? 'block' : 'none';

        if (footerEl) {
            const textEl = footerEl.querySelector('.se-footer-text');
            this.footerText.value = textEl ? textEl.textContent || '' : '';

            const linkEls = footerEl.querySelectorAll('.se-footer-links a');
            const links = Array.from(linkEls).map(el => el.textContent).filter(Boolean);
            this.footerLinks.value = links.join(', ');

            this.footerAlign.value = footerEl.style.textAlign || 'center';
            if (footerEl.style.display === 'flex' && footerEl.style.justifyContent === 'space-between') {
                this.footerAlign.value = 'space-between';
            }
        } else {
            this.footerText.value = '© 2026 My Company';
            this.footerLinks.value = 'Privacy, Terms, Contact';
            this.footerAlign.value = 'center';
        }
    }

    private updateSiteInfo(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc) return;

        // Title
        let titleEl = doc.querySelector('title');
        if (!titleEl) {
            titleEl = doc.createElement('title');
            doc.head.appendChild(titleEl);
        }
        titleEl.textContent = this.titleInput.value || 'Untitled Page';

        // Meta Description
        let metaDescEl = doc.querySelector('meta[name="description"]');
        if (!metaDescEl) {
            metaDescEl = doc.createElement('meta');
            metaDescEl.setAttribute('name', 'description');
            doc.head.appendChild(metaDescEl);
        }
        metaDescEl.setAttribute('content', this.metaDescInput.value);

        // Favicon
        let linkIconEl = doc.querySelector('link[rel="icon"]');
        if (!linkIconEl) {
            linkIconEl = doc.createElement('link');
            linkIconEl.setAttribute('rel', 'icon');
            doc.head.appendChild(linkIconEl);
        }
        linkIconEl.setAttribute('href', this.faviconInput.value || 'data:,'); // Blank default

        // HTML Lang
        doc.documentElement.setAttribute('lang', this.langSelect.value);

        this.editor.bus.emit('dom:changed');
        this.editor.pushHistory('Update site info');
    }

    private toggleHeader(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        let headerEl = doc.querySelector('header[data-se-header="true"]');

        if (this.headerToggle.checked) {
            if (!headerEl) {
                headerEl = doc.createElement('header');
                headerEl.setAttribute('data-se-header', 'true');
                doc.body.insertBefore(headerEl, doc.body.firstChild);
            }
            this.headerOptionsPanel.style.display = 'block';
            this.updateHeader();
        } else {
            if (headerEl) {
                headerEl.remove();
            }
            this.headerOptionsPanel.style.display = 'none';
            this.editor.bus.emit('dom:changed');
            this.editor.pushHistory('Remove header');
        }
    }

    private updateHeader(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        const headerEl = doc.querySelector('header[data-se-header="true"]') as HTMLElement;
        if (!headerEl) return;

        const style = this.headerStyle.value;
        const isSticky = this.headerSticky.checked;
        const logoText = this.headerLogo.value || 'Logo';
        const linkNames = this.headerLinks.value.split(',').map(s => s.trim()).filter(Boolean);

        headerEl.setAttribute('data-se-style', style);

        // Base styling
        headerEl.style.padding = '16px 24px';
        headerEl.style.display = 'flex';
        headerEl.style.alignItems = 'center';
        headerEl.style.boxSizing = 'border-box';
        headerEl.style.width = '100%';
        headerEl.style.backgroundColor = headerEl.style.backgroundColor || '#ffffff';
        headerEl.style.color = headerEl.style.color || '#000000';
        headerEl.style.borderBottom = '1px solid currentColor'; // fallback nice touch
        headerEl.style.borderBottomColor = 'rgba(0,0,0,0.1)';

        if (isSticky) {
            headerEl.style.position = 'sticky';
            headerEl.style.top = '0';
            headerEl.style.zIndex = '1000';
        } else {
            headerEl.style.position = 'static';
        }

        let linksHtml = linkNames.map(name => `<a href="#" style="color:inherit; text-decoration:none; margin:0 12px; font-weight:500;">${name}</a>`).join('');

        if (style === 'simple') {
            headerEl.style.justifyContent = 'space-between';
            headerEl.innerHTML = `
                <div class="se-nav-logo" style="font-size:1.2em; font-weight:700;">${logoText}</div>
                <nav class="se-nav-links">${linksHtml}</nav>
            `;
        } else if (style === 'centered') {
            headerEl.style.justifyContent = 'center';
            headerEl.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div class="se-nav-logo" style="font-size:1.5em; font-weight:800; margin-bottom:12px;">${logoText}</div>
                    <nav class="se-nav-links">${linksHtml}</nav>
                </div>
            `;
        } else if (style === 'split') {
            headerEl.style.justifyContent = 'space-between';
            headerEl.innerHTML = `
                <nav class="se-nav-links" style="flex:1;">${linkNames.slice(0, Math.ceil(linkNames.length / 2)).map(name => `<a href="#" style="color:inherit; text-decoration:none; margin-right:24px; font-weight:500;">${name}</a>`).join('')}</nav>
                <div class="se-nav-logo" style="font-size:1.2em; font-weight:700; flex:1; text-align:center;">${logoText}</div>
                <nav class="se-nav-links" style="flex:1; text-align:right;">${linkNames.slice(Math.ceil(linkNames.length / 2)).map(name => `<a href="#" style="color:inherit; text-decoration:none; margin-left:24px; font-weight:500;">${name}</a>`).join('')}</nav>
            `;
        }

        this.editor.bus.emit('dom:changed');
        this.editor.pushHistory('Update header');
    }

    private toggleFooter(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        let footerEl = doc.querySelector('footer[data-se-footer="true"]');

        if (this.footerToggle.checked) {
            if (!footerEl) {
                footerEl = doc.createElement('footer');
                footerEl.setAttribute('data-se-footer', 'true');
                doc.body.appendChild(footerEl);
            }
            this.footerOptionsPanel.style.display = 'block';
            this.updateFooter();
        } else {
            if (footerEl) {
                footerEl.remove();
            }
            this.footerOptionsPanel.style.display = 'none';
            this.editor.bus.emit('dom:changed');
            this.editor.pushHistory('Remove footer');
        }
    }

    private updateFooter(): void {
        const doc = this.editor.getIframeDocument();
        if (!doc?.body) return;

        const footerEl = doc.querySelector('footer[data-se-footer="true"]') as HTMLElement;
        if (!footerEl) return;

        const text = this.footerText.value || '©';
        const linkNames = this.footerLinks.value.split(',').map(s => s.trim()).filter(Boolean);
        const align = this.footerAlign.value;

        footerEl.style.padding = '32px 24px';
        footerEl.style.boxSizing = 'border-box';
        footerEl.style.width = '100%';
        footerEl.style.marginTop = 'auto'; // good for flex layouts
        footerEl.style.backgroundColor = footerEl.style.backgroundColor || '#f8f9fa';
        footerEl.style.color = footerEl.style.color || '#333333';

        let linksHtml = linkNames.map(name => `<a href="#" style="color:inherit; margin:0 8px;">${name}</a>`).join('');

        if (align === 'space-between') {
            footerEl.style.display = 'flex';
            footerEl.style.justifyContent = 'space-between';
            footerEl.style.alignItems = 'center';
            footerEl.style.textAlign = 'left';
            footerEl.innerHTML = `
                <div class="se-footer-text">${text}</div>
                <div class="se-footer-links">${linksHtml}</div>
            `;
        } else {
            footerEl.style.display = 'block';
            footerEl.style.textAlign = align;
            footerEl.innerHTML = `
                <div class="se-footer-text" style="opacity:0.8; margin-bottom: ${linkNames.length ? '12px' : '0'};">${text}</div>
                ${linkNames.length ? `<div class="se-footer-links">${linksHtml}</div>` : ''}
            `;
        }

        this.editor.bus.emit('dom:changed');
        this.editor.pushHistory('Update footer');
    }
}
