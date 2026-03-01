const { chromium } = require('playwright');
const path = require('path');

(async () => {
    // We launch 1 browser, 2 contexts
    const browser = await chromium.launch({ headless: true });

    // User 1
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    // User 2
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    console.log('Opening SnapEdit for User 1...');
    await page1.goto('http://localhost:5173');
    await page1.waitForLoadState('networkidle');

    console.log('Opening SnapEdit for User 2...');
    await page2.goto('http://localhost:5173');
    await page2.waitForLoadState('networkidle');

    const demoProjectUrl = '/demo/index.html';

    // Wait and observe logic ...
    // Since we don't know the exact UI to load project, we can dispatch the loadFromURL manually 
    // or trigger it using the UI if we know it. We'll inject EditorCore execution for simplicity.

    console.log('User 1 loading project...');
    await page1.evaluate((url) => {
        window.editor.loadFromURL(url);
    }, demoProjectUrl);

    // wait a moment for WS
    await page1.waitForTimeout(1000);

    console.log('User 2 loading same project...');
    await page2.evaluate((url) => {
        window.editor.loadFromURL(url);
    }, demoProjectUrl);

    // Wait for the banner to show up in User 2
    await page2.waitForTimeout(1000);

    const bannerFound = await page2.evaluate(() => {
        const banner = document.getElementById('readonly-banner');
        return banner && banner.style.display !== 'none';
    });

    // Screenshot user 2
    const shotPath = path.join('/root/.gemini/antigravity/brain/', process.env.BRAIN_ID || 'e379e487-682c-4632-aab9-7fd2a1df5962', 'lock_test_user2.png');
    await page2.screenshot({ path: shotPath });

    if (bannerFound) {
        console.log('SUCCESS: User 2 is correctly locked out of editing.');
        console.log(`Screenshot saved to: ${shotPath}`);
    } else {
        console.log('FAILURE: Read-only banner not found on User 2.');
    }

    await browser.close();
    process.exit(0);
})();
