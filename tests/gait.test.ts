import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { Object3D, Vector3 } from 'three';

test('Baked gallery walks have planted feet, modest clearance and bounce, and a seamless loop', async () => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  for (const name of ['harper', 'jordan', 'maya']) {
    const doc = await io.read(`public/models/visitors/${name}.glb`);
    const nodes = new Map(
      doc
        .getRoot()
        .listNodes()
        .map((node) => {
          const object = new Object3D();
          object.name = node.getName();
          object.position.fromArray(node.getTranslation());
          object.quaternion.fromArray(node.getRotation());
          object.scale.fromArray(node.getScale());
          return [node, object] as const;
        }),
    );
    for (const [node, object] of nodes)
      for (const child of node.listChildren()) object.add(nodes.get(child)!);
    const root = new Object3D();
    doc
      .getRoot()
      .listScenes()[0]
      .listChildren()
      .forEach((node) => root.add(nodes.get(node)!));
    const animation = doc
      .getRoot()
      .listAnimations()
      .find((a) => a.getName() === 'Walk_Relaxed')!;
    assert.equal(animation.getExtras().metresPerSecond, 0.78);
    const world = (bone: string) => root.getObjectByName(bone)!.getWorldPosition(new Vector3());
    const frames = [];
    for (let frame = 0; frame <= 120; frame++) {
      const time = frame / 60;
      for (const channel of animation.listChannels()) {
        const sampler = channel.getSampler()!;
        assert.ok(sampler, `${name}: valid animation sampler`);
        assert.equal(sampler.getInterpolation(), 'LINEAR');
        const times = sampler.getInput()!.getArray()!,
          output = sampler.getOutput()!;
        let a = 0;
        while (a < times.length - 2 && times[a + 1] < time) a++;
        const b = Math.min(a + 1, times.length - 1);
        const u = a === b ? 0 : Math.max(0, Math.min(1, (time - times[a]) / (times[b] - times[a])));
        const from = output.getElement(a, []),
          to = output.getElement(b, []);
        const object = nodes.get(channel.getTargetNode()!)!;
        const value = from.map((v, i) => v + (to[i] - v) * u);
        if (channel.getTargetPath() === 'rotation') object.quaternion.fromArray(value).normalize();
        else
          object[channel.getTargetPath() === 'translation' ? 'position' : 'scale'].fromArray(value);
      }
      root.updateMatrixWorld(true);
      frames.push({ pelvis: world('pelvis'), left: world('foot_l'), right: world('foot_r') });
    }
    for (const side of ['left', 'right'] as const) {
      const floor = Math.min(...frames.map((f) => f[side].y));
      assert.ok(
        Math.max(...frames.map((f) => f[side].y)) - floor < 0.05,
        `${name}: small foot lift`,
      );
      for (let i = 1; i < 120; i++) {
        const phase = (i / 60 + (side === 'left' ? 0.5 : 0)) % 1;
        if (phase > 0.03 && phase < 0.48) {
          assert.ok(
            Math.abs(frames[i][side].y - floor) < 0.001,
            `${name}: planted foot stays on floor`,
          );
          const drift = frames[i][side].z - frames[i - 1][side].z + 0.78 / 60;
          assert.ok(Math.abs(drift) < 0.001, `${name}: planted foot cancels forward travel`);
        }
      }
      assert.ok(frames[0][side].distanceTo(frames[120][side]) < 0.0001, `${name}: seamless feet`);
    }
    const bounce =
      Math.max(...frames.map((f) => f.pelvis.y)) - Math.min(...frames.map((f) => f.pelvis.y));
    assert.ok(bounce < 0.035, `${name}: body bounce ${bounce}`);
    assert.ok(
      frames.every((f) => Math.abs(f.left.z - f.right.z) < 0.43),
      `${name}: shorter step length`,
    );
  }
});
