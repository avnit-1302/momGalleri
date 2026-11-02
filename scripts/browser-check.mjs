import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';

mkdirSync('artifacts', { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const errors = [],
  requests = [];
const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400) requests.push(`${response.status()} ${response.url()}`);
});
const base = process.argv[2] || process.env.MUSEUM_URL || 'http://127.0.0.1:5173';
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Gå inn i museet', exact: true })
    .waitFor({ state: 'visible', timeout: 60000 });
  await page.screenshot({ path: 'artifacts/welcome-desktop.png' });
  await page.getByRole('button', { name: 'Gå inn i museet', exact: true }).click();
  await page.getByRole('heading', { name: 'Velkommen hjem', exact: true }).waitFor();
  await page.keyboard.down('KeyW');
  await page
    .getByRole('heading', { name: 'Sjøhestens sal', exact: true })
    .waitFor({ timeout: 30000 });
  await page.keyboard.up('KeyW');
  await page.screenshot({ path: 'artifacts/atrium.png' });
  const roomNames = [
    'De første kapitlene',
    'Livet vi deler',
    'Hjertet i familien',
    'Til deg, mamma',
  ];
  for (const name of roomNames) {
    await page.getByRole('button', { name: 'Utforsk museet' }).click();
    await page.getByRole('button', { name: `Gå til ${name}`, exact: true }).click();
    await page.getByRole('heading', { name, exact: true }).waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `artifacts/room-${roomNames.indexOf(name) + 3}.png` });
  }
  await page.getByRole('button', { name: 'Utforsk museet' }).click();
  await page.screenshot({ path: 'artifacts/map.png' });
  await page.getByRole('button', { name: 'Gå til Livet vi deler', exact: true }).click();
  const camera = new PerspectiveCamera(65, 1440 / 960, 0.1, 190);
  camera.position.set(19, 1.7, 4);
  camera.rotation.set(0, -Math.PI / 2, 0, 'YXZ');
  camera.updateMatrixWorld();
  const image = new Vector3(29.64, 3.3, 0).project(camera);
  await page.mouse.click((image.x + 1) * 720, (1 - image.y) * 480);
  await page.getByRole('dialog', { name: 'Hverdagslykke' }).waitFor();
  await page.screenshot({ path: 'artifacts/photo.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Slå på naturlyd' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Slå av naturlyd' }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Slå av naturlyd' }).click();
  await page.getByRole('button', { name: 'Fri musebevegelse' }).click();
  await page.waitForFunction(() => Boolean(document.pointerLockElement));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.getByRole('button', { name: 'Meny', exact: true }).click();
  await page.getByRole('button', { name: 'Start omvisning' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Neste rom' }).click();
  await page.getByRole('button', { name: 'Utforsk videre', exact: true }).click();
  await page.getByRole('button', { name: 'Meny', exact: true }).click();
  await page.getByLabel('Bildekvalitet').selectOption('low');
  await page.getByRole('button', { name: 'Tilbake til inngangen' }).click();
  await page.getByRole('heading', { name: 'Velkommen hjem', exact: true }).waitFor();
  // Verify a missing local asset is handled without taking down the museum.
  await page.route('**/images/family/coast.svg', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await page.getByRole('button', { name: 'Meny', exact: true }).click();
  await page.getByRole('button', { name: 'Se alle bildene' }).click();
  await page.getByRole('button', { name: 'Sammen', exact: true }).click();
  await page.getByText('Bildet er ikke tilgjengelig ennå.').waitFor();
  await page.unroute('**/images/family/coast.svg');
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', (error) => errors.push(error.message));
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone
    .getByRole('button', { name: 'Gå inn i museet', exact: true })
    .waitFor({ timeout: 60000 });
  await phone.screenshot({ path: 'artifacts/welcome-mobile.png' });
  await phone.getByRole('button', { name: 'Gå inn i museet', exact: true }).tap();
  await phone.getByRole('group', { name: 'Styrespak for bevegelse' }).waitFor();
  const joystick = phone.locator('.joystick');
  const box = await joystick.boundingBox();
  const touch = await mobile.newCDPSession(phone);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + 52, y: box.y + 52 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: box.x + 52, y: box.y + 18 }],
  });
  await phone
    .getByRole('heading', { name: 'Sjøhestens sal', exact: true })
    .waitFor({ timeout: 30000 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone
    .getByRole('heading', { name: 'Sjøhestens sal', exact: true })
    .waitFor({ timeout: 15000 });
  await phone.screenshot({ path: 'artifacts/mobile-explore.png' });
  await phone.getByRole('button', { name: 'Utforsk museet' }).tap();
  await phone.getByRole('button', { name: 'Gå til Hjertet i familien', exact: true }).tap();
  const mobileCamera = new PerspectiveCamera(65, 390 / 844, 0.1, 190);
  mobileCamera.position.set(-20, 1.7, -19);
  mobileCamera.updateMatrixWorld();
  const portrait = new Vector3(-20, 3.55, -29.55).project(mobileCamera);
  await phone.touchscreen.tap((portrait.x + 1) * 195, (1 - portrait.y) * 422);
  await phone.getByRole('dialog', { name: 'Mamma', exact: true }).waitFor();
  await phone.getByRole('button', { name: 'Lukk', exact: true }).tap();
  await phone.getByRole('button', { name: 'Meny', exact: true }).tap();
  await phone.getByRole('button', { name: 'Se alle bildene' }).tap();
  await phone.getByRole('button', { name: 'Sammen', exact: true }).tap();
  await phone.getByRole('dialog', { name: 'Sammen' }).waitFor();
  await phone.screenshot({ path: 'artifacts/photo-mobile.png' });
  assert.equal(
    await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await mobile.close();
  const fallback = await browser.newContext();
  const fallbackPage = await fallback.newPage();
  await fallbackPage.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  await fallbackPage.goto(base);
  await fallbackPage.getByRole('button', { name: 'Se bildene', exact: true }).click();
  await fallbackPage.getByRole('dialog', { name: 'Alle bilder' }).waitFor();
  await fallback.close();
  assert.deepEqual(errors, []);
  const unexpected = requests.filter((r) => !r.includes('/images/family/coast.svg'));
  assert.deepEqual(unexpected, []);
  writeFileSync(
    'artifacts/browser-results.json',
    JSON.stringify(
      {
        passed: true,
        base,
        errors,
        expectedMissingImageRequests: requests,
        checks: [
          'desktop welcome',
          'WASD entrance to atrium',
          'all map destinations',
          '3D frame click',
          'photo escape',
          'audio toggle',
          'pointer lock and unlock',
          'six guided stops',
          'quality setting',
          'reset entrance',
          'missing image',
          'mobile joystick',
          'mobile 3D frame tap',
          'mobile map and photo',
          'no horizontal overflow',
          'WebGL fallback',
        ],
      },
      null,
      2,
    ),
  );
  console.log('Browser checks passed. Screenshots and results saved in artifacts/.');
} catch (error) {
  await page.screenshot({ path: 'artifacts/failure.png' }).catch(() => {});
  console.error('Page errors:', errors);
  throw error;
} finally {
  await browser.close();
}
