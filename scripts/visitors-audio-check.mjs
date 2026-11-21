import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

console.log('Launching Chrome');
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  timeout: 30000,
  args: ['--enable-unsafe-swiftshader'],
});
console.log('Chrome ready');
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [],
  audioRequests = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || /PropertyBinding/.test(m.text())) errors.push(m.text());
});
page.on('request', (r) => {
  if (/\/audio\/.*ogg/.test(r.url())) audioRequests.push(r.url());
});
await page.addInitScript(() => {
  window.birdTimers = [];
  const schedule = window.setTimeout.bind(window);
  window.setTimeout = (callback, delay, ...args) => {
    const id = schedule(callback, delay, ...args);
    if (delay >= 35000 && delay <= 95000) window.birdTimers.push({ callback, delay, id });
    return id;
  };
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
  const OriginalAudioContext = window.AudioContext;
  window.audioContexts = [];
  window.AudioContext = class extends OriginalAudioContext {
    constructor(...args) {
      super(...args);
      window.audioContexts.push(this);
      this.testSources = [];
      this.testGains = [];
      this.testPanners = [];
      this.testMedia = [];
    }
    createBufferSource() {
      const node = super.createBufferSource();
      const start = node.start.bind(node);
      node.start = (...args) => {
        node.testStart = args;
        return start(...args);
      };
      this.testSources.push(node);
      return node;
    }
    createGain() {
      const node = super.createGain();
      this.testGains.push(node);
      return node;
    }
    createPanner() {
      const node = super.createPanner();
      this.testPanners.push(node);
      return node;
    }
    createDynamicsCompressor() {
      const node = super.createDynamicsCompressor();
      this.testLimiter = node;
      return node;
    }
    createMediaElementSource(element) {
      this.testMedia.push(element);
      return super.createMediaElementSource(element);
    }
  };
});
mkdirSync('artifacts', { recursive: true });
async function sample() {
  return page.evaluate(() =>
    [1, 2, 3].map((i) => {
      const actor = window.scene.getObjectByName(`Museum visitor ${i}`);
      if (!actor) return null;
      const bones = [
        'upperarm_l',
        'upperarm_r',
        'thigh_l',
        'thigh_r',
        'calf_l',
        'calf_r',
        'hand_l',
        'head',
      ];
      let skinned = 0;
      actor.traverse((node) => {
        if (node.isSkinnedMesh) skinned++;
      });
      return {
        position: actor.position.toArray(),
        skinned,
        bones: Object.fromEntries(
          bones.map((name) => [name, actor.getObjectByName(name)?.quaternion.toArray()]),
        ),
      };
    }),
  );
}
async function portraits(label, side = false) {
  for (let i = 1; i <= 3; i++) {
    const png = await page.evaluate(
      ({ i, side }) => {
        const actor = window.scene.getObjectByName(`Museum visitor ${i}`),
          model = actor.children[0];
        const wasVisible = model.visible;
        model.visible = true;
        const camera = window.camera.clone();
        actor.updateMatrixWorld(true);
        camera.position.copy(
          actor.localToWorld(actor.position.clone().set(side ? 2.8 : 0.1, 1.35, side ? 0.2 : 2.8)),
        );
        camera.lookAt(actor.localToWorld(actor.position.clone().set(0, 1, 0)));
        camera.updateMatrixWorld(true);
        window.renderer.render(window.scene, camera);
        const image = window.renderer.domElement.toDataURL('image/png');
        model.visible = wasVisible;
        return image.split(',')[1];
      },
      { i, side },
    );
    writeFileSync(`artifacts/${label}-${i}.png`, Buffer.from(png, 'base64'));
  }
}
try {
  await page.goto(process.argv[2] || 'http://127.0.0.1:5175');
  await page.getByRole('button', { name: 'Continue to the museum' }).click();
  console.log('Page loaded; waiting for museum preparation');
  await page
    .getByRole('button', { name: 'Enter the museum', exact: true })
    .click({ timeout: 120000 });
  console.log('Entered museum');
  assert.equal(audioRequests.length, 0, 'Audio stays unloaded until explicitly enabled');
  assert.equal(await page.evaluate(() => window.audioContexts.length), 0);
  await page.getByRole('button', { name: /^Explore the museum/ }).click();
  await page.getByRole('button', { name: 'Go to Forever Remembered', exact: true }).click();
  const idle1 = await sample();
  await portraits('visitor-idle');
  await page.waitForTimeout(650);
  const idle2 = await sample();
  for (let i = 0; i < 3; i++) {
    assert.ok(idle1[i].skinned > 0);
    assert.notDeepEqual(
      idle1[i].bones,
      idle2[i].bones,
      `Visitor ${i + 1} idle animation moves joints`,
    );
  }
  await page.waitForTimeout(14500);
  const walking1 = await sample();
  await portraits('visitor-walk-a');
  await page.waitForTimeout(850);
  const walking2 = await sample();
  await portraits('visitor-walk-b');
  await portraits('visitor-side', true);
  for (let i = 0; i < 3; i++) {
    assert.ok(
      Math.hypot(...[0, 2].map((axis) => walking2[i].position[axis] - idle1[i].position[axis])) >
        0.2,
    );
    for (const joint of ['upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r']) {
      assert.ok(walking1[i].bones[joint], `${joint} exists`);
      assert.notDeepEqual(
        walking1[i].bones[joint],
        walking2[i].bones[joint],
        `Visitor ${i + 1}: ${joint} moves while walking`,
      );
    }
  }
  const stoppedAt = await page.evaluate(() => {
    const p = window.scene.getObjectByName('Museum visitor 1').position;
    window.camera.position.set(p.x, 1.7, p.z + 1);
    return p.toArray();
  });
  await page.waitForTimeout(900);
  const yielded = (await sample())[0].position;
  assert.ok(
    Math.hypot(yielded[0] - stoppedAt[0], yielded[2] - stoppedAt[2]) < 0.03,
    'Visitor yields to the player',
  );
  await page.evaluate(() => window.camera.position.set(10, 1.7, -18.5));
  await page.getByRole('button', { name: 'Turn on museum audio', exact: true }).click();
  await page.waitForFunction(
    () => window.audioContexts[0]?.testSources.length >= 3 && window.birdTimers.length > 0,
    {
      timeout: 30000,
    },
  );
  const audio = await page.evaluate(() => {
    const a = window.audioContexts[0];
    return {
      state: a.state,
      durations: a.testSources.map((s) => s.buffer.duration),
      panners: a.testPanners.length,
      music: {
        paused: a.testMedia[0].paused,
        loop: a.testMedia[0].loop,
        duration: a.testMedia[0].duration,
      },
    };
  });
  assert.equal(audio.state, 'running');
  assert.equal(audio.panners, 2);
  assert.equal(audio.durations.length, 3, 'Only wind and two water sources loop continuously');
  assert.equal(audio.music.paused, false);
  assert.equal(audio.music.loop, true);
  assert.ok(audio.music.duration > 180);
  assert.ok(audio.durations.every((d) => d > 50));
  const audible = await page.evaluate(async () => {
    const a = window.audioContexts[0],
      analyser = a.createAnalyser();
    a.testGains[0].connect(analyser);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, n) => sum + n * n, 0) / samples.length);
    a.testGains[0].disconnect(analyser);
    analyser.disconnect();
    return rms;
  });
  assert.ok(audible > 0.00001, 'Actual recording signal reaches the master output');
  const birds = await page.evaluate(() => {
    const first = window.birdTimers.at(-1);
    clearTimeout(first.id);
    first.callback();
    const a = window.audioContexts[0],
      burst = a.testSources.at(-1);
    return {
      firstDelay: first.delay,
      nextDelay: window.birdTimers.at(-1).delay,
      loop: burst.loop,
      duration: burst.testStart[2],
    };
  });
  assert.ok(birds.firstDelay >= 35000 && birds.firstDelay <= 60000);
  assert.ok(birds.nextDelay >= 65000 && birds.nextDelay <= 95000);
  assert.equal(birds.loop, false, 'Birdsong never loops continuously');
  assert.ok(birds.duration >= 4 && birds.duration <= 6, 'Birdsong is a short passage');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.audioContexts[0].state), 'suspended');
  assert.equal(await page.evaluate(() => window.audioContexts[0].testMedia[0].paused), true);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.audioContexts[0].state), 'running');
  assert.equal(await page.evaluate(() => window.audioContexts[0].testMedia[0].paused), false);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByLabel('Sound volume').fill('100');
  const maximum = await page.evaluate(async () => {
    const a = window.audioContexts[0],
      analyser = a.createAnalyser();
    a.testLimiter.connect(analyser);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const samples = new Float32Array(analyser.fftSize);
    let sum = 0,
      count = 0,
      peak = 0;
    for (let frame = 0; frame < 30; frame++) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      analyser.getFloatTimeDomainData(samples);
      for (const value of samples) {
        sum += value * value;
        peak = Math.max(peak, Math.abs(value));
        count++;
      }
    }
    a.testLimiter.disconnect(analyser);
    analyser.disconnect();
    return { rms: Math.sqrt(sum / count), peak };
  });
  assert.ok(maximum.rms > 0.008, `Maximum volume must be audible, RMS ${maximum.rms}`);
  assert.ok(maximum.peak < 0.95, `Maximum volume has headroom, peak ${maximum.peak}`);
  await page.getByLabel('Sound volume').fill('20');
  await page.waitForTimeout(800);
  const gain = await page.evaluate(() => window.audioContexts[0].testGains[0].gain.value);
  assert.ok(Math.abs(gain - 0.2) < 0.015);
  await page.getByLabel('Visual quality').selectOption('low');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  assert.equal((await sample()).filter(Boolean).length, 2);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByLabel('Visual quality').selectOption('high');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(750);
  const remount1 = await sample();
  await page.waitForTimeout(750);
  const remount2 = await sample();
  assert.notDeepEqual(remount1[2].bones, remount2[2].bones, 'Remounted visitor retains animation');
  await page.getByRole('button', { name: 'Turn off museum audio', exact: true }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.audioContexts[0].state), 'suspended');
  assert.equal(await page.evaluate(() => window.audioContexts[0].testMedia[0].paused), true);
  assert.equal(
    new Set(audioRequests).size,
    4,
    'Three nature recordings plus one streamed music file',
  );
  assert.ok(audioRequests.every((url) => !url.includes('leaves.ogg')));
  assert.deepEqual(errors, []);
  writeFileSync(
    'artifacts/visitors-audio-report.json',
    JSON.stringify({ idle1, idle2, walking1, walking2, audio, birds, maximum, errors }, null, 2),
  );
  console.log(
    'PASS: animated visitors, opt-in streamed music, sparse birdsong, spatial water, volume, mute and background suspension.',
  );
} catch (error) {
  await page.screenshot({ path: 'artifacts/visitors-check-failure.png' });
  console.error(errors);
  throw error;
} finally {
  await browser.close();
}
