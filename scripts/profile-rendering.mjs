import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => {
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__THREE_DEVTOOLS__.addEventListener('observe', ({ detail: renderer }) => {
    if (!renderer.isWebGLRenderer) return;
    window.renderer = renderer;
    const render = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      if (!renderer.getRenderTarget() && scene.getObjectByName('Museum visitor 1')) {
        window.scene = scene;
        window.camera = camera;
      }
      return render(scene, camera);
    };
  });
});
try {
  await page.goto(process.argv[2] || 'http://127.0.0.1:4175');
  await page.getByRole('button', { name: 'Continue to the museum' }).click();
  await page
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .click({ timeout: 120000 });
  const onboarding = page.getByRole('button', { name: 'Start exploring', exact: true });
  if (await onboarding.isVisible()) await onboarding.click();
  const result = await page.evaluate(() => {
    const { scene, renderer } = window;
    let forest;
    scene.traverse((o) => {
      if (o.isInstancedMesh && o.geometry.type === 'IcosahedronGeometry') forest = o.parent;
    });
    const visitors = scene.getObjectByName('Museum visitor 1').parent;
    const details = scene.getObjectByName('Main gallery architectural details');
    const camera = window.camera.clone();
    const results = [];
    for (const [room, position, target] of [
      ['gallery', [10, 2.2, -18.5], [10, 3.5, -44]],
      ['atrium', [0, 1.7, 8.8], [0, 2.2, 0]],
    ]) {
      camera.position.set(...position);
      camera.lookAt(...target);
      camera.updateMatrixWorld(true);
      for (const [label, hidden] of [
        ['all', null],
        ['without forest', forest],
        ['without visitors', visitors],
        ['without trim', details],
      ]) {
        if (hidden) hidden.visible = false;
        const times = [];
        for (let i = 0; i < 12; i++) {
          const start = performance.now();
          renderer.render(scene, camera);
          renderer.getContext().finish();
          if (i > 2) times.push(performance.now() - start);
        }
        times.sort((a, b) => a - b);
        results.push({
          room,
          label,
          medianMs: times[Math.floor(times.length / 2)],
          triangles: renderer.info.render.triangles,
          calls: renderer.info.render.calls,
        });
        if (hidden) hidden.visible = true;
      }
    }
    return results;
  });
  writeFileSync(
    process.argv[3] || 'artifacts/render-profile.json',
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
