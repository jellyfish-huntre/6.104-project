const { chromium } = require('playwright');

(async () => {
  const base = process.env.APP_URL ?? 'http://127.0.0.1:8080';
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
  const username = `booth_ui_${suffix}`;
  const password = 'testpass123';
  let cookie = '';
  async function post(path, body) {
    const response = await fetch(base + '/api' + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    });
    const issued = response.headers.get('set-cookie');
    if (issued) cookie = issued.split(';')[0];
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(`${path}: ${response.status} ${JSON.stringify(result)}`);
    return result;
  }

  await post('/auth/register', { username, password });
  const { fair } = await post('/fairs/create', { name: `Booth UI ${suffix}` });
  const { page: initialPage } = await post('/fairs/page', { fair });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await page.getByRole('button', { name: 'Close account panel' }).click();
    await page.getByLabel('Fair code').fill(initialPage.code);
    await page.getByRole('button', { name: /Enter the fair/ }).click();
    await page.getByRole('button', { name: 'Open booth directory' }).click();
    await page.locator('.management-card summary').click();
    const management = page.locator('.management-card');
    await management.getByLabel('Booth name').fill('Sized UI booth');
    await management.getByRole('radio', { name: /Large/ }).check();
    await management.getByRole('button', { name: 'Add booth' }).click();
    const card = page.locator('.directory-card article').filter({ has: page.getByRole('heading', { name: 'Sized UI booth' }) });
    await card.getByRole('heading', { name: 'Sized UI booth' }).waitFor();
    if (await card.locator('.booth-entry').getAttribute('open') !== null) throw new Error('New booth row should start collapsed.');
    await card.locator('.booth-entry > summary').click();
    await card.getByText('Location (5, 1)').waitFor();
    await management.getByLabel('Booth name').fill('Second UI booth');
    await management.getByRole('radio', { name: /Medium/ }).check();
    await management.getByRole('button', { name: 'Add booth' }).click();
    const secondCard = page.locator('.directory-card article').filter({ has: page.getByRole('heading', { name: 'Second UI booth' }) });
    await secondCard.getByRole('heading', { name: 'Second UI booth' }).waitFor();
    if (await secondCard.locator('.booth-entry').getAttribute('open') !== null) throw new Error('Second booth row should start collapsed.');
    if (await card.locator('.booth-entry').getAttribute('open') === null)
      await card.locator('.booth-entry > summary').click();
    await card.locator('.booth-manage > summary').click();
    await card.getByLabel(/Column \(0–\d+\)/).fill('5');
    await card.getByLabel(/Row \(0–\d+\)/).fill('5');
    await card.getByRole('button', { name: 'Save location' }).click();
    await card.getByText('Location (5, 5)').waitFor();
    const moveStatus = page.locator('[role="status"]').filter({ hasText: 'Booth location updated.' });
    await moveStatus.waitFor();
    if (await moveStatus.evaluate((element) => getComputedStyle(element).color) !== 'rgb(25, 96, 68)')
      throw new Error('A successful move is styled as an error.');
    const variantCount = () => page.locator('.booth-area').evaluateAll((areas) =>
      new Set(areas.map((area) => [...area.classList].find((name) => name.startsWith('booth-variant-')))).size);
    for (let attempt = 0; attempt < 5 && await variantCount() < 2; attempt++) {
      const name = `Variant UI booth ${attempt + 1}`;
      await management.getByLabel('Booth name').fill(name);
      await management.getByRole('radio', { name: /Small/ }).check();
      await management.getByRole('button', { name: 'Add booth' }).click();
      await page.locator('.directory-card').getByRole('heading', { name }).waitFor();
    }
    if (await variantCount() < 2) throw new Error('Created booths did not display varied layouts.');
    if (process.env.SCREENSHOT_DIR) {
      await card.locator('.booth-entry > summary').click();
      await management.locator('summary').click();
      await page.locator('.directory-drawer').screenshot({ path: `${process.env.SCREENSHOT_DIR}/booth-directory.png` });
      await page.locator('.directory-drawer .drawer-close').click();
      await page.locator('.fair-map').screenshot({ path: `${process.env.SCREENSHOT_DIR}/booth-variants.png` });
      await page.getByRole('button', { name: 'Open booth directory' }).click();
    }
    await secondCard.locator('.booth-entry > summary').click();
    await secondCard.locator('.booth-manage > summary').click();
    await secondCard.getByRole('button', { name: 'Delete booth' }).click();
    await secondCard.getByText('Delete Second UI booth? Its call and invitations will end.').waitFor();
    await secondCard.getByRole('button', { name: 'Confirm delete' }).click();
    await secondCard.waitFor({ state: 'detached' });
    await page.locator('[role="status"]').filter({ hasText: 'Booth deleted.' }).waitFor();
    console.log('Collapsed directory rows, organizer location edit, and confirmed booth deletion passed in the browser.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
