import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('Navigating to local dev server...');
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('Adding content designed to wrap and test headings/tables...');
    // We simulate a long text, then an h2 and a table that would break across a page.
    await page.evaluate(() => {
        const iframe = document.getElementById('canvas-iframe') as HTMLIFrameElement;
        const doc = iframe.contentDocument;
        if (!doc) return;

        let longText = '';
        for (let i = 0; i < 30; i++) {
            longText += '<p>This is a paragraph of a very long text to push the heading down to the bottom of the A4 page. We want the heading to land around pixel 1100 so it naturally falls on the first page, but the table falls on the second. The script should pull the heading down with the table.</p>';
        }

        doc.body.innerHTML = `
        ${longText}
        <h2>This is a Heading That Should Stick To The Table</h2>
        <table border="1" style="width: 100%; height: 300px;">
           <tr><th>Header 1</th><th>Header 2</th></tr>
           <tr><td>Data 1</td><td>Data 2</td></tr>
           <tr><td>Data 3</td><td>Data 4</td></tr>
        </table>
     `;

        // Trigger change event so the editor picks it up
        iframe.contentWindow?.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Give debounce time
    await page.waitForTimeout(1000);

    console.log('Opening Print Preview panel...');
    await page.click('#btn-print-preview');

    // Wait for the panel to open and pages to render
    await page.waitForTimeout(2000);

    const simPagesCount = await page.evaluate(() => {
        const previewIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (!previewIframe || !previewIframe.contentDocument) return 0;
        return previewIframe.contentDocument.querySelectorAll('.pagedjs_page').length;
    });
    console.log(`Generated ${simPagesCount} A4 pages in the preview iframe.`);

    const htmlDump = await page.evaluate(() => {
        const previewIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (!previewIframe || !previewIframe.contentDocument) return '';
        return previewIframe.contentDocument.documentElement.outerHTML;
    });
    fs.writeFileSync('/root/.gemini/antigravity/scratch/snapedit/pagedjs_local_dump.html', htmlDump);
    console.log('Dumped to pagedjs_local_dump.html');

    await page.screenshot({ path: '/root/.gemini/antigravity/brain/f8920c40-e9ba-4735-9404-749aa927d9d5/pagination_test.png' });
    console.log('Screenshot saved to pagination_test.png');

    await browser.close();
})();
