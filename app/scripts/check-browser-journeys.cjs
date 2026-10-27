const { chromium } = require('playwright');
const { MongoClient } = require('mongodb');
(async () => {
const base = process.env.APP_URL ?? 'http://127.0.0.1:8080';
const mongoUrl = process.env.MONGODB_URL ?? 'mongodb://dev:dev@127.0.0.1:27017/myapp?authSource=admin';
const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
const username = `qa_${suffix}`;
const password = 'testpass123';
let cookie = '';
async function post(path, body) {
  const response = await fetch(base + '/api' + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(`${path}: ${response.status} ${JSON.stringify(result)}`);
  return result;
}
function assert(condition, message) { if (!condition) throw new Error(message); }
async function walk(page, key, durationMs) {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
  await page.waitForTimeout(260);
}
const browser = await chromium.launch({ headless: true });
try {
  await post('/auth/register', { username, password });
  const { fair } = await post('/fairs/create', { name: `Journey test ${suffix}` });
  const { booth } = await post('/booths/create', { fair, name: 'Robotics', description: 'Explore projects', meetingUrl: 'https://meet.example/group', footprint: { x: 0, y: 1, width: 1, height: 1 } });
  const { page: fairPage } = await post('/fairs/page', { fair });
  const code = fairPage.code;
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await guestContext.route('https://meet.example/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Video meeting opened</h1>' }));
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  await host.goto(base);
  await host.getByRole('button', { name: 'Create a fair' }).click();
  await host.getByRole('button', { name: /Already have an account/ }).click();
  await host.getByLabel('Username').fill(username);
  await host.getByLabel('Password').fill(password);
  await host.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await host.getByRole('button', { name: 'Close account panel' }).click();
  await host.getByLabel('Fair code').fill(code);
  await host.getByRole('button', { name: /Enter the fair/ }).click();
  await host.locator('.map-avatar.own[aria-label*="(0, 0)"]').waitFor();
  await host.getByRole('button', { name: 'Select Robotics booth' }).click();
  await walk(host, 'ArrowDown', 430);
  await host.getByRole('button', { name: 'Open group call here' }).waitFor();
  await host.getByRole('button', { name: 'Open group call here' }).click();
  await host.getByRole('button', { name: 'Close call', exact: true }).waitFor();
  console.log('Host opened group call from the booth.');

  await guest.goto(base);
  await guest.getByLabel('Fair code').fill('00000000');
  await guest.getByRole('button', { name: /Enter the fair/ }).click();
  await guest.getByRole('alert').getByText('No fair has that code. Check it with the organizer.').waitFor();
  await guest.getByLabel('Fair code').fill(code);
  await guest.getByRole('button', { name: /Enter the fair/ }).click();
  await guest.locator('.map-avatar.own[aria-label*="(0, 0)"]').waitFor();
  await guest.getByRole('button', { name: 'Select Robotics booth' }).click();
  await walk(guest, 'ArrowDown', 430);
  await guest.getByRole('button', { name: 'Open video call' }).waitFor();
  if (process.env.SCREENSHOT_DIR) await guest.screenshot({ path: `${process.env.SCREENSHOT_DIR}/open-group.png` });
  const groupPopupPromise = guest.waitForEvent('popup');
  await guest.getByRole('button', { name: 'Open video call' }).click();
  const groupPopup = await groupPopupPromise;
  await groupPopup.waitForURL('https://meet.example/group', { timeout: 10000 });
  assert(groupPopup.url() === 'https://meet.example/group', `Group call URL: ${groupPopup.url()}`);
  await groupPopup.close();
  console.log('Visitor entered the fair, moved into the booth, and opened the group video call.');

  await host.getByRole('button', { name: 'Close call', exact: true }).click();
  await host.getByLabel('Conversation mode').selectOption('INVITE_ONLY');
  await host.getByLabel('Video meeting link').fill('https://meet.example/private');
  await host.getByRole('button', { name: 'Open invite-only call and queue' }).click();
  await guest.getByRole('button', { name: 'Request a turn' }).waitFor({ timeout: 12000 });
  await guest.getByRole('button', { name: 'Request a turn' }).click();
  await guest.getByText('You are waiting. You can explore other booths.').waitFor();
  await walk(guest, 'ArrowUp', 430);
  assert(await guest.getByRole('region', { name: 'Your waiting requests' }).count() === 1, 'Waiting request disappeared while exploring');
  await host.getByRole('button', { name: 'Stop new requests' }).click();
  await guest.getByText('You are waiting. You can explore other booths.').waitFor();
  const outsiderContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const outsider = await outsiderContext.newPage();
  await outsider.goto(base);
  await outsider.getByLabel('Fair code').fill(code);
  await outsider.getByRole('button', { name: /Enter the fair/ }).click();
  await outsider.getByRole('button', { name: 'Select Robotics booth' }).click();
  await outsider.getByText('This booth is not taking new requests.').waitFor({ timeout: 12000 });
  assert(await outsider.getByRole('button', { name: 'Request a turn' }).count() === 0, 'Closed queue still allows a new request');
  await host.getByRole('button', { name: 'Send invitation' }).waitFor({ timeout: 12000 });
  await host.getByRole('button', { name: 'Send invitation' }).click();
  await guest.getByText(/Invitation expires in/).first().waitFor({ timeout: 12000 });
  await guest.reload();
  await guest.getByText(/Invitation expires in/).first().waitFor({ timeout: 12000 });
  if (process.env.SCREENSHOT_DIR) await guest.screenshot({ path: `${process.env.SCREENSHOT_DIR}/invite-only.png` });
  const privatePopupPromise = guest.waitForEvent('popup');
  await guest.getByRole('button', { name: 'Open video call' }).first().click();
  const privatePopup = await privatePopupPromise;
  await privatePopup.waitForURL('https://meet.example/private', { timeout: 10000 });
  assert(privatePopup.url() === 'https://meet.example/private', `Private call URL: ${privatePopup.url()}`);
  await privatePopup.close();
  console.log('Visitor requested a turn, kept exploring, received an invitation, and opened the private video call.');
  const page = (await post('/fairs/page', { fair })).page;
  assert(page.booths[0].queues[0].waiting === 0, 'Stored queue still shows a waiting visitor');
  const mongo = new MongoClient(mongoUrl);
  try {
    await mongo.connect();
    const db = mongo.db();
    const savedCall = await db.collection('calling.calls').findOne({ place: booth });
    const savedQueue = await db.collection('queueing.queues').findOne({ _id: booth });
    const requests = await db.collection('queueing.requests').find({ target: booth }).toArray();
    assert(savedCall?.mode === 'INVITE_ONLY' && savedCall.joinUrl === 'https://meet.example/private', 'Invite-only call was not stored');
    assert(savedQueue?.accepting === false, 'Closed-to-new-requests queue state was not stored');
    assert(requests.length === 1 && requests[0].invitedUntil, 'Invited request was not stored');
  } finally {
    await mongo.close();
  }
  await guest.getByRole('button', { name: 'Open booth directory' }).click();
  await guest.locator('.directory-card .booth-entry > summary').first().click();
  await guest.getByRole('button', { name: 'Show on map' }).click();
  const desktopPanel = await guest.locator('.booth-detail').boundingBox();
  assert(desktopPanel && desktopPanel.y >= 64 && desktopPanel.y + desktopPanel.height <= 900, 'Desktop booth panel is clipped');
  await guest.evaluate(() => {
    const currentTime = Date.now();
    Date.now = () => currentTime + 121_000;
  });
  await guest.getByText('Your invitation expired.').waitFor({ timeout: 5000 });
  assert(await guest.getByRole('button', { name: 'Open video call' }).last().isDisabled(), 'Expired invitation can still be opened');
  console.log('Expired invitation is labeled and cannot be opened in the browser.');
  await host.setViewportSize({ width: 390, height: 844 });
  const mobilePanel = await host.locator('.booth-detail').boundingBox();
  assert(mobilePanel && mobilePanel.y >= 64 && mobilePanel.y + mobilePanel.height <= 844, 'Mobile booth panel is clipped');
  await host.getByRole('button', { name: 'Send invitation' }).scrollIntoViewIfNeeded();
  assert(await host.getByRole('button', { name: 'Send invitation' }).isVisible(), 'Mobile invitation controls are unreachable');
  if (process.env.SCREENSHOT_DIR) await host.screenshot({ path: `${process.env.SCREENSHOT_DIR}/mobile-host.png` });
  console.log('Reloaded UI and MongoDB records confirm the invite-only call and invited visitor.', { fair, booth, code });
  await hostContext.close();
  await guestContext.close();
  await outsiderContext.close();
} finally {
  await browser.close();
}
})().catch((error) => { console.error(error); process.exitCode = 1; });
