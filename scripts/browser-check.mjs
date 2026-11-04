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
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .waitFor({ state: 'visible', timeout: 60000 });
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.title(), 'Puja Anand · In Loving Memory');
  assert.match(
    await page.locator('.welcome-description').innerText(),
    /what would have been her 50th birthday/,
  );
  await page.screenshot({ path: 'artifacts/welcome-desktop.png' });
  await page.getByRole('button', { name: 'Enter the museum', exact: true }).click();
  await page.getByRole('heading', { name: 'A Place to Remember', exact: true }).waitFor();
  await page.keyboard.down('KeyW');
  await page
    .getByRole('heading', { name: 'The Seahorse Hall', exact: true })
    .waitFor({ timeout: 30000 });
  await page.keyboard.up('KeyW');
  await page.screenshot({ path: 'artifacts/atrium.png' });
  const roomNames = [
    'Remembering Puja Anand',
    'The Life We Shared',
    'THE ONENESS',
    'Forever Remembered',
  ];
  for (const name of roomNames) {
    await page.getByRole('button', { name: /^Explore the museum/ }).click();
    await page.getByRole('button', { name: `Go to ${name}`, exact: true }).click();
    await page.getByRole('heading', { name, exact: true }).waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `artifacts/room-${roomNames.indexOf(name) + 3}.png` });
  }
  await page.getByRole('button', { name: /^Explore the museum/ }).click();
  await page.screenshot({ path: 'artifacts/map.png' });
  await page.getByRole('button', { name: 'Go to The Life We Shared', exact: true }).click();
  const camera = new PerspectiveCamera(65, 1440 / 960, 0.1, 190);
  camera.position.set(19, 1.7, 4);
  camera.rotation.set(0, -Math.PI / 2, 0, 'YXZ');
  camera.updateMatrixWorld();
  const image = new Vector3(29.64, 3.3, 0).project(camera);
  await page.mouse.click((image.x + 1) * 720, (1 - image.y) * 480);
  await page.getByRole('dialog', { name: 'Everyday Joy' }).waitFor();
  await page.screenshot({ path: 'artifacts/photo.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Turn on nature sounds' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Turn off nature sounds' }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Turn off nature sounds' }).click();
  await page.getByRole('button', { name: 'Free mouse look' }).click();
  await page.waitForFunction(() => Boolean(document.pointerLockElement));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Start a guided tour' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Next room' }).click();
  await page.getByRole('button', { name: 'Keep exploring', exact: true }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByLabel('Visual quality').selectOption('low');
  await page.getByRole('button', { name: 'Return to the entrance' }).click();
  await page.getByRole('heading', { name: 'A Place to Remember', exact: true }).waitFor();
  // Verify a missing local asset is handled without taking down the museum.
  await page.route('**/images/family/family.jpeg', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'View all photographs' }).click();
  await page.getByRole('button', { name: 'Together', exact: true }).click();
  await page.getByText('This photograph is not available yet.').waitFor();
  await page.unroute('**/images/family/family.jpeg');
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
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .waitFor({ timeout: 60000 });
  await phone.screenshot({ path: 'artifacts/welcome-mobile.png' });
  await phone.getByRole('button', { name: 'Enter the museum', exact: true }).tap();
  await phone.getByRole('group', { name: 'Movement joystick' }).waitFor();
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
    .getByRole('heading', { name: 'The Seahorse Hall', exact: true })
    .waitFor({ timeout: 30000 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone
    .getByRole('heading', { name: 'The Seahorse Hall', exact: true })
    .waitFor({ timeout: 15000 });
  await phone.screenshot({ path: 'artifacts/mobile-explore.png' });
  await phone.getByRole('button', { name: /^Explore the museum/ }).tap();
  await phone.getByRole('button', { name: 'Go to THE ONENESS', exact: true }).tap();
  await phone.screenshot({ path: 'artifacts/tribute-symbol-mobile.png' });
  // The tribute wall now holds Ik Onkar; verify photo tapping on the final gallery portrait.
  await phone.getByRole('button', { name: /^Explore the museum/ }).tap();
  await phone.getByRole('button', { name: 'Go to Forever Remembered', exact: true }).tap();
  const mobileCamera = new PerspectiveCamera(65, 390 / 844, 0.1, 190);
  mobileCamera.position.set(10, 1.7, -18.5);
  mobileCamera.updateMatrixWorld();
  const portrait = new Vector3(10, 3.5, -47.55).project(mobileCamera);
  await phone.touchscreen.tap((portrait.x + 1) * 195, (1 - portrait.y) * 422);
  await phone.getByRole('dialog', { name: 'Puja Anand', exact: true }).waitFor();
  await phone.getByRole('button', { name: 'Close', exact: true }).tap();
  await phone.getByRole('button', { name: 'Menu', exact: true }).tap();
  await phone.getByRole('button', { name: 'View all photographs' }).tap();
  await phone.getByRole('button', { name: 'Together', exact: true }).tap();
  await phone.getByRole('dialog', { name: 'Together' }).waitFor();
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
  await fallbackPage.getByRole('button', { name: 'View photographs', exact: true }).click();
  await fallbackPage.getByRole('dialog', { name: 'All photographs' }).waitFor();
  await fallback.close();
  assert.deepEqual(errors, []);
  const unexpected = requests.filter((r) => !r.includes('/images/family/family.jpeg'));
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
