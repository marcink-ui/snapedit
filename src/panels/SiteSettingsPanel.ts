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
    private headerLinks: HTMLTextAreaElement;
    private headerSticky: HTMLInputElement;
    private headerStyle: HTMLSelectElement;
    private headerFont: HTMLSelectElement;
    private headerFontSize: HTMLInputElement;
    private headerPadding: HTMLInputElement;
    private headerGap: HTMLInputElement;
    private headerOptionsPanel: HTMLElement;

    // Footer
    private footerToggle: HTMLInputElement;
    private footerText: HTMLInputElement;
    private footerLinks: HTMLTextAreaElement;
    private footerAlign: HTMLSelectElement;
    private footerFont: HTMLSelectElement;
    private footerFontSize: HTMLInputElement;
    private footerPadding: HTMLInputElement;
    private footerOptionsPanel: HTMLElement;

    constructor(editor: EditorCore) {
        this.editor = editor;

        this.titleInput = document.getElementById('site-page-title') as HTMLInputElement;
        this.metaDescInput = document.getElementById('site-meta-desc') as HTMLTextAreaElement;
        this.faviconInput = document.getElementById('site-favicon') as HTMLInputElement;
        this.langSelect = document.getElementById('site-lang') as HTMLSelectElement;

        this.headerToggle = document.getElementById('site-header-toggle') as HTMLInputElement;
        this.headerLogo = document.getElementById('site-header-logo') as HTMLInputElement;
        this.headerLinks = document.getElementById('site-header-links') as HTMLTextAreaElement;
        this.headerSticky = document.getElementById('site-header-sticky') as HTMLInputElement;
        this.headerStyle = document.getElementById('site-header-style') as HTMLSelectElement;
        this.headerFont = document.getElementById('site-header-font') as HTMLSelectElement;
        this.headerFontSize = document.getElementById('site-header-fontsize') as HTMLInputElement;
        this.headerPadding = document.getElementById('site-header-padding') as HTMLInputElement;
        this.headerGap = document.getElementById('site-header-gap') as HTMLInputElement;
        this.headerOptionsPanel = document.getElementById('site-header-options') as HTMLElement;

        this.footerToggle = document.getElementById('site-footer-toggle') as HTMLInputElement;
        this.footerText = document.getElementById('site-footer-text') as HTMLInputElement;
        this.footerLinks = document.getElementById('site-footer-links') as HTMLTextAreaElement;
        this.footerAlign = document.getElementById('site-footer-align') as HTMLSelectElement;
        this.footerFont = document.getElementById('site-footer-font') as HTMLSelectElement;
        this.footerFontSize = document.getElementById('site-footer-fontsize') as HTMLInputElement;
        this.footerPadding = document.getElementById('site-footer-padding') as HTMLInputElement;
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
        this.headerFont.addEventListener('change', () => this.updateHeader());
        this.headerFontSize.addEventListener('input', () => this.updateHeader());
        this.headerPadding.addEventListener('input', () => this.updateHeader());
        this.headerGap.addEventListener('input', () => this.updateHeader());

        // Footer Listeners
        this.footerToggle.addEventListener('change', () => this.toggleFooter());
        this.footerText.addEventListener('input', () => this.updateFooter());
        this.footerLinks.addEventListener('input', () => this.updateFooter());
        this.footerAlign.addEventListener('change', () => this.updateFooter());
        this.footerFont.addEventListener('change', () => this.updateFooter());
        this.footerFontSize.addEventListener('input', () => this.updateFooter());
        this.footerPadding.addEventListener('input', () => this.updateFooter());
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

            const linkEls = headerEl.querySelectorAll('.se-nav-links a');
            const links = Array.from(linkEls).map((el: any) => `${el.textContent}=${el.getAttribute('href') || '#'}`).filter(l => !l.startsWith('='));
            this.headerLinks.value = links.join(', ');

            this.headerSticky.checked = headerEl.style.position === 'sticky';
            this.headerStyle.value = headerEl.getAttribute('data-se-style') || 'simple';
            this.headerFont.value = headerEl.style.fontFamily || 'inherit';
            this.headerFontSize.value = headerEl.style.fontSize ? parseInt(headerEl.style.fontSize).toString() : '16';
            this.headerPadding.value = headerEl.style.paddingTop.replace('px', '') || '20';
            const navLinkEls = headerEl.querySelectorAll('.se-nav-links a');
            this.headerGap.value = navLinkEls.length && (navLinkEls[0] as HTMLElement).style.marginLeft ? (navLinkEls[0] as HTMLElement).style.marginLeft.replace('px', '') : '24';
        } else {
            this.headerLogo.value = 'Brand Name';
            this.headerLinks.value = 'Home=/, About=/about, Pricing=/pricing';
            this.headerSticky.checked = false;
            this.headerStyle.value = 'simple';
            this.headerFont.value = 'inherit';
            this.headerFontSize.value = '16';
            this.headerPadding.value = '20';
            this.headerGap.value = '24';
        }

        // Sync Footer
        const footerEl = doc.querySelector('footer[data-se-footer="true"]') as HTMLElement;
        this.footerToggle.checked = !!footerEl;
        this.footerOptionsPanel.style.display = footerEl ? 'block' : 'none';

        if (footerEl) {
            const textEl = footerEl.querySelector('.se-footer-text');
            this.footerText.value = textEl ? textEl.textContent || '' : '';

            const linkEls = footerEl.querySelectorAll('.se-footer-links a');
            const links = Array.from(linkEls).map((el: any) => `${el.textContent}=${el.getAttribute('href') || '#'}`).filter(l => !l.startsWith('='));
            this.footerLinks.value = links.join(', ');

            this.footerAlign.value = footerEl.getAttribute('data-se-align') || 'center';
            this.footerFont.value = footerEl.style.fontFamily || 'inherit';
            this.footerFontSize.value = footerEl.style.fontSize ? parseInt(footerEl.style.fontSize).toString() : '14';
            this.footerPadding.value = footerEl.style.paddingTop.replace('px', '') || '40';
        } else {
            this.footerText.value = '© 2026 My Company';
            this.footerLinks.value = 'Privacy=/privacy, Terms=/terms';
            this.footerAlign.value = 'center';
            this.footerFont.value = 'inherit';
            this.footerFontSize.value = '14';
            this.footerPadding.value = '40';
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

        const linkData = this.headerLinks.value.split(',').map(s => {
            const parts = s.split('=');
            if (parts.length === 2) return { name: parts[0].trim(), url: parts[1].trim() };
            return { name: s.trim(), url: '#' };
        }).filter(l => l.name);

        const font = this.headerFont.value;
        const size = this.headerFontSize.value || '16';
        const pad = this.headerPadding.value || '20';
        const gap = parseInt(this.headerGap.value || '24') / 2; // margin on both sides

        headerEl.setAttribute('data-se-style', style);

        // Base styling
        if (font !== 'inherit') headerEl.style.fontFamily = font;
        headerEl.style.fontSize = `${size}px`;
        headerEl.style.padding = `${pad}px 24px`;
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

        let linksHtml = linkData.map(l => `<a href="${l.url}" style="color:inherit; text-decoration:none; margin:0 ${gap}px; font-weight:500;">${l.name}</a>`).join('');

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
        } else if (style === 'pill') {
            headerEl.style.justifyContent = 'space-between';
            headerEl.style.padding = `${Math.max(10, parseInt(pad) - 10)}px 24px`;
            headerEl.style.margin = '16px auto';
            headerEl.style.width = 'calc(100% - 32px)';
            headerEl.style.borderRadius = '100px';
            headerEl.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            headerEl.style.backdropFilter = 'blur(10px)';
            headerEl.innerHTML = `
                <div class="se-nav-logo" style="font-size:1.2em; font-weight:700;">${logoText}</div>
                <nav class="se-nav-links">${linksHtml}</nav>
            `;
        } else if (style === 'minimal') {
            headerEl.style.justifyContent = 'flex-start';
            headerEl.style.borderBottom = '1px solid currentColor';
            headerEl.style.borderBottomColor = 'rgba(0,0,0,0.1)';
            headerEl.style.backgroundColor = 'transparent';
            headerEl.innerHTML = `
                <div class="se-nav-logo" style="font-size:1.2em; font-weight:700; margin-right:48px;">${logoText}</div>
                <nav class="se-nav-links">${linksHtml}</nav>
            `;
        } else if (style === 'split') {
            headerEl.style.justifyContent = 'space-between';
            const leftLinksHtml = linkData.slice(0, Math.ceil(linkData.length / 2)).map(l => `<a href="${l.url}" style="color:inherit; text-decoration:none; margin-right:${gap * 2}px; font-weight:500;">${l.name}</a>`).join('');
            const rightLinksHtml = linkData.slice(Math.ceil(linkData.length / 2)).map(l => `<a href="${l.url}" style="color:inherit; text-decoration:none; margin-left:${gap * 2}px; font-weight:500;">${l.name}</a>`).join('');
            headerEl.innerHTML = `
                <nav class="se-nav-links" style="flex:1;">${leftLinksHtml}</nav>
                <div class="se-nav-logo" style="font-size:1.2em; font-weight:700; flex:1; text-align:center;">${logoText}</div>
                <nav class="se-nav-links" style="flex:1; text-align:right;">${rightLinksHtml}</nav>
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
        const linkData = this.footerLinks.value.split(',').map(s => {
            const parts = s.split('=');
            if (parts.length === 2) return { name: parts[0].trim(), url: parts[1].trim() };
            return { name: s.trim(), url: '#' };
        }).filter(l => l.name);

        const align = this.footerAlign.value;
        const font = this.footerFont.value;
        const size = this.footerFontSize.value || '14';
        const pad = this.footerPadding.value || '40';

        footerEl.setAttribute('data-se-align', align);
        if (font !== 'inherit') footerEl.style.fontFamily = font;
        footerEl.style.fontSize = `${size}px`;
        footerEl.style.padding = `${pad}px 24px`;
        footerEl.style.boxSizing = 'border-box';
        footerEl.style.width = '100%';
        footerEl.style.marginTop = 'auto'; // good for flex layouts
        footerEl.style.backgroundColor = footerEl.style.backgroundColor || '#f8f9fa';
        footerEl.style.color = footerEl.style.color || '#333333';

        let linksHtml = linkData.map(l => `<a href="${l.url}" style="color:inherit; margin:0 8px; text-decoration:none;">${l.name}</a>`).join('');

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
                <div class="se-footer-text" style="opacity:0.8; margin-bottom: ${linkData.length ? '12px' : '0'};">${text}</div>
                ${linkData.length ? `<div class="se-footer-links">${linksHtml}</div>` : ''}
            `;
        }

        this.editor.bus.emit('dom:changed');
        this.editor.pushHistory('Update footer');
    }
}
