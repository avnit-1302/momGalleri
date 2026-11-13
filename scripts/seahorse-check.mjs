import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:5175';
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.addInitScript(() => {
  window.reflectionTargets = new Map();
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__THREE_DEVTOOLS__.addEventListener('observe', (event) => {
    const object = event.detail;
    if (object.isScene) (window.scenes ??= []).push(object);
    if (!object.isWebGLRenderer) return;
    window.renderer = object;
    const setTarget = object.setRenderTarget.bind(object);
    object.setRenderTarget = (target, ...args) => {
      if (target && !window.reflectionTargets.has(target.texture.uuid)) {
        const record = { target, disposed: false };
        window.reflectionTargets.set(target.texture.uuid, record);
        target.addEventListener('dispose', () => {
          record.disposed = true;
        });
      }
      return setTarget(target, ...args);
    };
    const render = object.render.bind(object);
    object.render = (scene, camera) => {
      const toCanvas = object.getRenderTarget() === null;
      render(scene, camera);
      if (!toCanvas || window.firstSilverFrame) return;
      const materials = [];
      scene.traverse((mesh) => {
        const material = mesh.material;
        if (material?.isMeshPhysicalMaterial && material.envMapIntensity === 1.45) {
          materials.push({
            hasEnvironment: !!material.envMap,
            environmentDisposed:
              window.reflectionTargets.get(material.envMap?.uuid)?.disposed ?? null,
          });
        }
      });
      if (materials.length) window.firstSilverFrame = materials;
    };
  });
});
mkdirSync('artifacts', { recursive: true });
const results = [];
try {
  // A fresh browser context has no cached model. Delay it to exercise Suspense startup.
  await page.route('**/models/seahorse.glb', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  for (const load of ['cold', 'reload']) {
    if (load === 'cold') await page.goto(base);
    else {
      await page.unroute('**/models/seahorse.glb');
      await page.reload();
    }
    await page
      .getByRole('button', { name: 'Enter the museum', exact: true })
      .waitFor({ timeout: 90000 });
    const silver = await page.evaluate(() => {
      const materials = new Map();
      for (const scene of window.scenes)
        scene.traverse((object) => {
          const material = object.material;
          if (material?.isMeshPhysicalMaterial && material.envMapIntensity === 1.45) {
            const target = window.reflectionTargets.get(material.envMap?.uuid);
            materials.set(material.uuid, {
              color: material.color.getHexString(),
              metalness: material.metalness,
              hasEnvironment: !!material.envMap,
              environmentDisposed: target?.disposed ?? null,
            });
          }
        });
      return [...materials.values()];
    });
    await page.screenshot({ path: `artifacts/seahorse-${load}.png` });
    results.push({ load, silver });
    console.log(load, JSON.stringify(silver));
    const firstFrame = await page.evaluate(() => window.firstSilverFrame);
    assert.ok(
      firstFrame?.length > 0 &&
        firstFrame.every(
          (material) => material.hasEnvironment && material.environmentDisposed === false,
        ),
      'The first visible sculpture frame already has a live silver environment',
    );
    assert.ok(silver.length > 0, 'The sculpture is mounted before entry');
    assert.ok(
      silver.every((material) => material.color === 'd7dfe7' && material.hasEnvironment),
      'Silver material has its reflection environment',
    );
    assert.ok(
      silver.every((material) => material.environmentDisposed === false),
      'The silver reflection texture remains alive after startup',
    );
  }
  assert.deepEqual(errors, []);
  writeFileSync('artifacts/seahorse-results.json', JSON.stringify({ base, results }, null, 2));
  console.log('Seahorse cold-load and reload checks passed.');
} finally {
  await browser.close();
}
