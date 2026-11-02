const { chromium } = require('playwright');

(async () => {
  const base = process.env.APP_URL ?? 'http://127.0.0.1:8080';
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
  const username = `walk_ui_${suffix}`;
  const password = 'testpass123';
  const moveDelayMs = Number(process.env.MOVE_DELAY_MS ?? 200);
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
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await post('/auth/register', { username, password });
  const { fair } = await post('/fairs/create', { name: `Free walking UI ${suffix}` });
  const { page: fairPage } = await post('/fairs/page', { fair });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // Reproduce a realistic deployed round trip. A 200 ms position sample alone
    // can miss the short pauses this latency used to cause.
    await page.route('**/api/fairs/move-free', async route => {
      await new Promise(resolve => setTimeout(resolve, moveDelayMs));
      await route.continue();
    });
    await page.goto(base);
    await page.getByRole('button', { name: 'Create a fair' }).click();
    await page.getByRole('button', { name: /Already have an account/ }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await page.getByRole('button', { name: 'Close account panel' }).click();
    await page.getByLabel('Fair code').fill(fairPage.code);
    await page.getByRole('button', { name: /Enter the fair/ }).click();
    const avatar = page.locator('.map-avatar.own');
    await avatar.waitFor();
    const mapBox = await page.locator('.fair-map').boundingBox();
    assert(mapBox && Math.abs(mapBox.width - mapBox.height) < 2, 'Map cells are not square.');
    assert(await page.locator('.fair-screen.map-style-kenney').count() === 1, 'The Kenney hall is not active.');
    assert(await page.getByRole('button', { name: 'Pixel Fair' }).count() === 0, 'The retired map style is still selectable.');
    assert(await page.getByRole('button', { name: 'Hitboxes' }).count() === 0, 'The Hitboxes option is still visible.');
    assert(await page.locator('.collision-outline').count() === 0, 'Collision outlines are still drawn.');
    assert(await page.locator('.walker-collision-outline').count() === 0, 'The blue avatar collider should not be drawn.');
    const positionX = async () => Number((await avatar.getAttribute('aria-label')).match(/at \(([^,]+),/)[1]);
    await page.evaluate(() => {
      window.walkSamples = [];
      window.captureWalk = true;
      const start = performance.now();
      function sample(now) {
        if (!window.captureWalk) return;
        const label = document.querySelector('.map-avatar.own')?.getAttribute('aria-label');
        const x = Number(label?.match(/at \(([^,]+),/)?.[1]);
        if (Number.isFinite(x)) window.walkSamples.push({ ms: now - start, x });
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.keyboard.down('ArrowRight');
    const samples = [];
    for (let index = 0; index < 10; index++) {
      await page.waitForTimeout(200);
      samples.push(await positionX());
    }
    await page.keyboard.up('ArrowRight');
    const frameSamples = await page.evaluate(() => {
      window.captureWalk = false;
      return window.walkSamples;
    });
    const progressTimes = frameSamples.filter(sample => sample.ms >= 300 && sample.ms <= 1800)
      .filter((sample, index, all) => index === 0 || sample.x > all[index - 1].x + 0.001)
      .map(sample => sample.ms);
    const maxPause = Math.max(...progressTimes.slice(1).map((time, index) => time - progressTimes[index]));
    assert(progressTimes.length > 40 && maxPause < 110,
      `Walking paused for ${Math.round(maxPause)} ms with ${moveDelayMs} ms request latency.`);
    await page.waitForTimeout(1200);
    const final = await positionX();
    assert(samples[0] > 0 && samples.some((value, index) => index > 0 && value > samples[index - 1] + 0.1) &&
      samples.every((value, index) => index === 0 || value >= samples[index - 1] - 0.02) &&
      final >= samples.at(-1) - 0.02 && final > 2.5 && final < 6,
      `Walking did not progress smoothly: ${[...samples, final].join(', ')}`);
    const presence = (await post('/fairs/presence', { fair })).presence.people;
    const saved = presence.find((person) => person.person === username)?.position;
    assert(saved && Math.abs(saved.x - final) < 0.1, `Browser and server positions differ: ${JSON.stringify(saved)}, ${final}`);
    for (let index = 0; index < 6; index++) {
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(35);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(350);
    assert(await page.getByText('Movement was blocked. Try another direction.').count() === 0,
      'A quick movement correction appeared as a red error.');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/free-walking.png` });
    assert(await page.locator('.walker-collision-outline').count() === 0, 'Hitbox toggle did not hide the walker outline.');
    console.log('Smooth browser walking, square map, no hitbox controls, and server position sync passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
