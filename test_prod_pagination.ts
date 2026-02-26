import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('Navigating to production server...');
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // Add bypass for cache
    await page.route('**', route => {
        const headers = route.request().headers();
        delete headers['if-modified-since'];
        delete headers['if-none-match'];
        headers['Cache-Control'] = 'no-cache';
        route.continue({ headers });
    });

    await page.goto('https://snapedit.syhi.tech', { waitUntil: 'load' });

    // Evaluate to wait for the editor to initialize
    await page.waitForTimeout(2000);

    console.log('Adding content...');
    await page.evaluate(() => {
        const iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
        const doc = iframe.contentDocument;
        if (!doc) return;

        let longText = '';
        for (let i = 0; i < 30; i++) {
            longText += '<p>This is a paragraph of a very long text to push the heading down to the bottom of the A4 page.</p>';
        }

        doc.body.innerHTML = `
        ${longText}
        <h2>This is a Heading</h2>
        <table border="1" style="width: 100%; height: 300px;">
           <tr><th>Header 1</th></tr>
           <tr><td>Data 1</td></tr>
        </table>
        `;

        iframe.contentWindow?.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await page.waitForTimeout(1000);

    console.log('Opening Print Preview panel...');
    await page.click('#btn-print-preview');

    // Wait for the panel to open and pages to render
    await page.waitForTimeout(5000); // give pagedjs plenty of time

    const simPagesCount = await page.evaluate(() => {
        const previewIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (!previewIframe || !previewIframe.contentDocument) return -1;
        return previewIframe.contentDocument.querySelectorAll('.pagedjs_page').length;
    });
    console.log(`Generated ${simPagesCount} A4 pages in the preview iframe.`);

    const htmlDump = await page.evaluate(() => {
        const previewIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (!previewIframe || !previewIframe.contentDocument) return '';
        // return body HTML to see what classes were generated
        return previewIframe.contentDocument.documentElement.outerHTML;
    });
    fs.writeFileSync('/root/.gemini/antigravity/scratch/snapedit/pagedjs_dump.html', htmlDump);
    console.log('HTML dumped to pagedjs_dump.html');

    await page.screenshot({ path: '/root/.gemini/antigravity/brain/f8920c40-e9ba-4735-9404-749aa927d9d5/prod_pagination_test.png' });
    console.log('Screenshot saved to prod_pagination_test.png');

    await browser.close();
})();
