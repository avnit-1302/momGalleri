import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.addInitScript(() => {
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail: renderer }) => {
    if (!renderer.isWebGLRenderer) return;
    window.renderer = renderer;
    const render = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      if (renderer.getRenderTarget() === null && scene.getObjectByName('Indoor ficus collection')) {
        window.scene = scene;
        window.camera = camera;
      }
      return render(scene, camera);
    };
  });
});
mkdirSync('artifacts', { recursive: true });
try {
  await page.goto(process.argv[2] || 'http://127.0.0.1:4175');
  await page
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .click({ timeout: 90000 });
  await page.getByRole('button', { name: /^Explore the museum/ }).click();
  await page.getByRole('button', { name: 'Go to Forever Remembered', exact: true }).click();
  await page.screenshot({ path: 'artifacts/gallery-arrival.png' });
  const before = await page.evaluate(() =>
    window.scene.children.flatMap(function collect(object) {
      return object.name.startsWith('Museum visitor ')
        ? [{ name: object.name, position: object.position.toArray() }]
        : object.children.flatMap(collect);
    }),
  );
  assert.equal(before.length, 3);
  await page.waitForTimeout(15000);
  const moved = await page.evaluate(
    (before) =>
      before.map((bot) => {
        const object = window.scene.getObjectByName(bot.name);
        let castsShadow = false;
        object.traverse((child) => {
          if (child.castShadow) castsShadow = true;
        });
        return {
          distance: Math.hypot(
            object.position.x - bot.position[0],
            object.position.z - bot.position[2],
          ),
          castsShadow,
        };
      }),
    before,
  );
  assert.ok(
    moved.every((bot) => bot.distance > 0.2 && !bot.castsShadow),
    'Visitors walk after their viewing pause without dynamic shadows',
  );
  // Capture architectural views directly from the renderer, without changing navigation state.
  for (const [name, position, target] of [
    ['gallery-overview', [10, 2.4, -17], [10, 4.5, -42]],
    ['gallery-side', [9, 2.2, -32], [24, 3.2, -25]],
    ['indoor-plant', [24, 2, -42], [27, 1.8, -45.5]],
    ['visitor-detail', [-7, 1.6, -22], [-4, 1, -24]],
  ]) {
    const png = await page.evaluate(
      ({ position, target }) => {
        const camera = window.camera.clone();
        camera.position.set(...position);
        camera.lookAt(...target);
        camera.updateMatrixWorld();
        window.renderer.render(window.scene, camera);
        return window.renderer.domElement.toDataURL('image/png').split(',')[1];
      },
      { position, target },
    );
    writeFileSync(`artifacts/${name}.png`, Buffer.from(png, 'base64'));
  }
  // Step back to bring both new display walls into the entrance field of view.
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.camera.position.z > -13, { timeout: 10000 });
  await page.keyboard.up('KeyS');
  await page.waitForTimeout(350);
  // Click both relocated works using their projected positions from the actual visitor camera.
  for (const [title, position] of [
    ['Clouds in Motion', [20, 2.6, -23.495]],
    ['Autumn Light', [0, 2.6, -23.495]],
  ]) {
    const point = await page.evaluate((position) => {
      const point = window.camera.position
        .clone()
        .set(...position)
        .project(window.camera);
      return [((point.x + 1) * innerWidth) / 2, ((1 - point.y) * innerHeight) / 2];
    }, position);
    assert.ok(point[0] > 0 && point[0] < 1440, `${title} is in the field of view`);
    await page.mouse.click(...point);
    await page.getByRole('dialog', { name: title, exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  }
  assert.deepEqual(errors, []);
  console.log('Gallery checks passed:', JSON.stringify({ visitors: moved, errors }));
} finally {
  await browser.close();
}
