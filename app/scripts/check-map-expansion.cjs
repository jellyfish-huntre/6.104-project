const { chromium } = require('playwright');

(async () => {
  const base = process.env.APP_URL ?? 'http://127.0.0.1:8080';
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
  const username = `map_ui_${suffix}`;
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
  const { fair } = await post('/fairs/create', { name: `Expanding hall ${suffix}` });
  await post('/booths/create', { fair, footprint: { x: 1, y: 0, width: 9, height: 10 },
    name: 'East block', description: '', meetingUrl: '' });
  await post('/booths/create', { fair, footprint: { x: 0, y: 1, width: 1, height: 9 },
    name: 'West block', description: '', meetingUrl: '' });
  await post('/booths/create-sized', { fair, size: 'small', name: 'New wing', description: '', meetingUrl: '' });
  const { page: fairPage } = await post('/fairs/page', { fair });
  if (JSON.stringify(fairPage.extent) !== JSON.stringify({ width: 14, height: 14 }))
    throw new Error(`Fair page did not return the expanded hall: ${JSON.stringify(fairPage.extent)}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await page.getByRole('button', { name: 'Close account panel' }).click();
    await page.getByLabel('Fair code').fill(fairPage.code);
    await page.getByRole('button', { name: /Enter the fair/ }).click();
    await page.locator('.minimap-label', { hasText: '14 × 14' }).waitFor();
    if (await page.locator('.minimap-booth').count() !== 3)
      throw new Error('Minimap does not show all three booths.');
    const before = await page.locator('.fair-map').boundingBox();
    if (!before || before.width < 1900 || before.height < 1900)
      throw new Error(`Hall did not render at the expanded size: ${JSON.stringify(before)}`);
    const minimap = page.getByRole('button', { name: 'Pan the map using the minimap' });
    const miniBox = await minimap.boundingBox();
    await page.mouse.click(miniBox.x + miniBox.width * 0.85, miniBox.y + miniBox.height * 0.85);
    await page.waitForFunction(() => document.querySelector('.map-scroll').scrollLeft > 100);
    const viewportLeft = await page.locator('.minimap-window').evaluate((el) => parseFloat(el.style.left));
    if (viewportLeft <= 0) throw new Error('Minimap viewport outline did not follow the camera.');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/expanded-map.png` });
    console.log('Expanded fair page, minimap booths, and click-to-pan passed in the browser.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
