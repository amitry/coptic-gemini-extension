const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Coptic Gemini Extension E2E Suite', () => {
  let browserContext;
  let page;
  let consoleErrors = [];

  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '..');
    
    // Launch Chromium with the unpacked Chrome Extension loaded
    browserContext = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox'
      ]
    });
  });

  test.afterAll(async () => {
    if (browserContext) await browserContext.close();
  });

  test.beforeEach(async () => {
    consoleErrors = [];
    page = await browserContext.newPage();
    
    // Listen for uncaught browser errors
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));
  });

  test('1. Extension loads on test.html and injects Gemini Assist button', async () => {
    const testPagePath = `file://${path.join(__dirname, '..', 'test.html')}`;
    await page.goto(testPagePath);

    // Verify inline Gemini Assist button injection next to textarea
    const geminiBtn = page.locator('.gemini-assist-btn');
    await expect(geminiBtn).toBeVisible({ timeout: 5000 });

    // Verify floating FAB button injection
    const fabBtn = page.locator('#gemini-fab-btn');
    await expect(fabBtn).toBeVisible();

    // Assert zero uncaught JS console errors on load
    expect(consoleErrors).toEqual([]);
  });

  test('2. Floating FAB opens Coptic Assistant Modal', async () => {
    const testPagePath = `file://${path.join(__dirname, '..', 'test.html')}`;
    await page.goto(testPagePath);

    const fabBtn = page.locator('#gemini-fab-btn');
    await fabBtn.click();

    // Modal should be visible
    const modal = page.locator('#gemini-modal');
    await expect(modal).toBeVisible();

    // Modal input textarea and Run button should exist
    await expect(page.locator('#gemini-modal-input')).toBeVisible();
    await expect(page.locator('#gemini-modal-run-btn')).toBeVisible();
    await expect(page.locator('#gemini-smartfill-btn')).toBeVisible();
  });

  test('3. Smart Fill populates target EHR form fields', async () => {
    const testPagePath = `file://${path.join(__dirname, '..', 'test.html')}`;
    await page.goto(testPagePath);

    const fabBtn = page.locator('#gemini-fab-btn');
    await fabBtn.click();

    const inputArea = page.locator('#gemini-modal-input');
    await inputArea.fill('### SUBJECTIVE\nPatient presenting with fever 38.5C.\n### OBJECTIVE\nTemp 38.5C, RDT positive.\n### ASSESSMENT\nUncomplicated Malaria.\n### PLAN\nAL 2 tabs BD x 3 days.\n### ICD10_CODES\nB50.9 Falciparum malaria');

    const smartFillBtn = page.locator('#gemini-smartfill-btn');
    await smartFillBtn.click();

    // Assert target Objective field was populated
    const objField = page.locator('textarea[name="Objective Exam Notes"]');
    await expect(objField).toHaveValue(/Temp 38.5C/);
  });
});
