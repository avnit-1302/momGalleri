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
  imageRequests = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('request', (request) => {
  if (/\/images\/.*\.jpe?g/i.test(request.url())) imageRequests.push(request.url());
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
