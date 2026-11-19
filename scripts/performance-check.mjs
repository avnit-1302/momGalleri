import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [],
  imageRequests = [],
  modelRequests = new Set();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('request', (request) => {
  if (/\/images\/.*\.jpe?g/i.test(request.url())) imageRequests.push(request.url());
  if (/\/models\/visitors\/.*\.glb/i.test(request.url())) modelRequests.add(request.url());
});
// Observe the renderer through Three's existing devtools hook; no production debug globals.
await page.addInitScript(() => {
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__THREE_DEVTOOLS__.addEventListener('observe', (event) => {
    if (event.detail.isWebGLRenderer) window.renderer = event.detail;
    if (event.detail.isScene) (window.scenes ??= []).push(event.detail);
  });
});
const results = [];
try {
  await page.goto(process.argv[2] || 'http://127.0.0.1:4173');
  await page
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .waitFor({ timeout: 90000 });
  const initial = await page.evaluate(() => {
    const renderer = window.renderer;
    const scene = window.scenes.find((scene) => {
      let found = false;
      scene.traverse((object) => {
        if (object.userData.photoId) found = true;
      });
      return found;
    });
    window.museumScene = scene;
    window.instanceRaycasts = 0;
    window.offscreenRenders = 0;
    const render = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      if (renderer.getRenderTarget()) window.offscreenRenders++;
      return render(...args);
    };
    let photos = 0;
    scene.traverse((object) => {
      if (object.userData.photoId && object.material.map?.image?.width) photos++;
      if (object.isInstancedMesh) {
        const original = object.raycast.bind(object);
        object.raycast = (...args) => {
          window.instanceRaycasts++;
          return original(...args);
        };
      }
    });
    return {
      programs: renderer.info.programs.length,
      photos,
      shadowAutoUpdate: renderer.shadowMap.autoUpdate,
    };
  });
  assert.ok(initial.photos >= 24, 'Every displayed artwork has a prepared texture before entry');
  assert.equal(initial.shadowAutoUpdate, false, 'Static shadows are cached');
  mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/performance-welcome.png' });
  const loadedImages = imageRequests.length;
  await page.getByRole('button', { name: 'Enter the museum', exact: true }).click();
  for (const room of [
    'The Seahorse Hall',
    'Remembering Puja Anand',
    'The Life We Shared',
    'THE ONENESS',
    'Forever Remembered',
  ]) {
    await page.getByRole('button', { name: /^Explore the museum/ }).click();
    await page.getByRole('button', { name: `Go to ${room}`, exact: true }).click();
    const sample = await page.evaluate(async () => {
      const renderer = window.renderer;
      window.offscreenRenders = 0;
      const intervals = [];
      let previous = performance.now();
      const start = previous;
      await new Promise((resolve) => {
        function sample(now) {
          intervals.push(now - previous);
          previous = now;
          if (now - start > 2000) resolve();
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      let spots = 0;
      window.museumScene.traverse((object) => {
        if (object.isSpotLight) spots++;
      });
      intervals.sort((a, b) => a - b);
      return {
        programs: renderer.info.programs.length,
        spots,
        p95FrameMs: intervals[Math.floor(intervals.length * 0.95)],
        triangles: renderer.info.render.triangles,
        drawCalls: renderer.info.render.calls,
        instanceRaycasts: window.instanceRaycasts,
        offscreenRenders: window.offscreenRenders,
      };
    });
    results.push({ room, ...sample });
    console.log(room, sample);
  }
  assert.equal(
    new Set(results.map((result) => result.spots)).size,
    1,
    'Light count stays constant across rooms',
  );
  assert.ok(
    results.every((result) => result.programs === initial.programs),
    'Room entry does not compile additional shaders',
  );
  assert.equal(imageRequests.length, loadedImages, 'Room entry does not request more artwork');
  assert.equal(results.at(-1).instanceRaycasts, 0, 'Artwork targeting skips forest instances');
  assert.ok(
    results.every((result) => result.offscreenRenders === 0),
    'The pool does not render reflections from other rooms',
  );
  assert.ok(results.every((result) => result.triangles < 800000), 'The sampled room views stay below the reduced geometry budget');
  await page.getByRole('button', { name: /^Explore the museum/ }).click();
  await page.getByRole('button', { name: 'Go to The Seahorse Hall', exact: true }).click();
  await page.evaluate(() => { window.offscreenRenders = 0; });
  await page.mouse.move(640, 350);
  await page.mouse.down();
  await page.mouse.move(920, 350, { steps: 20 });
  await page.waitForTimeout(350);
  await page.mouse.move(400, 350, { steps: 20 });
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.offscreenRenders), 0, 'Turning near the pool does not render a second scene');
  const visitorCount = () =>
    page.evaluate(() => {
      let count = 0;
      window.museumScene.traverse((object) => {
        if (object.name.startsWith('Museum visitor ')) count++;
      });
      return count;
    });
  assert.equal(await visitorCount(), 3);
  assert.equal(modelRequests.size, 3, 'Only three character models are downloaded');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByLabel('Visual quality').selectOption('low');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  assert.equal(await visitorCount(), 2, 'Low quality limits the active visitor count');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByLabel('Visual quality').selectOption('high');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(750);
  assert.equal(await visitorCount(), 3);
  const sampleNewVisitors = () =>
    page.evaluate(() =>
      [3].map((i) => {
        const actor = window.museumScene.getObjectByName(`Museum visitor ${i}`);
        return ['upperarm_l', 'thigh_l'].map((name) =>
          actor.getObjectByName(name).quaternion.toArray(),
        );
      }),
    );
  const firstPose = await sampleNewVisitors();
  await page.waitForTimeout(850);
  const nextPose = await sampleNewVisitors();
  assert.notDeepEqual(firstPose[0], nextPose[0], 'Visitor animates after quality remount');
  assert.equal(modelRequests.size, 3, 'Quality changes reuse cached models');
  assert.deepEqual(errors, []);
  mkdirSync('artifacts', { recursive: true });
  writeFileSync(
    'artifacts/performance-results.json',
    JSON.stringify({ initial, loadedImages, results }, null, 2),
  );
  console.log(
    'Performance regression checks passed. Frame timings use software rendering, not a hardware FPS benchmark.',
  );
} finally {
  await browser.close();
}
