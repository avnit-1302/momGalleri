import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { avoidVisitors, visitorPositions } from '../src/world/visitorSpace';

test('Visitors have local textured skins and complete moving idle/walk clips within the asset budget', () => {
  let total = 0;
  for (const name of ['harper', 'jordan', 'maya']) {
    const file = `public/models/visitors/${name}.glb`,
      data = readFileSync(file);
    assert.equal(data.readUInt32LE(0), 0x46546c67);
    const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
    assert.ok(gltf.skins[0].joints.length >= 50);
    assert.deepEqual(gltf.animations.map((a: { name: string }) => a.name).sort(), [
      'Idle_Standing',
      'Walk_Relaxed',
    ]);
    for (const animation of gltf.animations) {
      for (const joint of ['upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r']) {
        const index = gltf.nodes.findIndex((node: { name: string }) => node.name === joint);
        assert.ok(
          animation.channels.some(
            (channel: { target: { node: number; path: string } }) =>
              channel.target.node === index && channel.target.path === 'rotation',
          ),
          `${name} / ${animation.name} / ${joint}`,
        );
      }
    }
    assert.ok(
      gltf.images.every(
        (image: { bufferView?: number; uri?: string }) =>
          image.bufferView !== undefined && !image.uri,
      ),
    );
    assert.ok(
      gltf.nodes.every((node: { name: string }) => !['Briefcase', 'Phone'].includes(node.name)),
    );
    const triangles = gltf.meshes
      .flatMap((mesh: { primitives: { indices: number }[] }) => mesh.primitives)
      .reduce(
        (sum: number, primitive: { indices: number }) =>
          sum + gltf.accessors[primitive.indices].count / 3,
        0,
      );
    assert.ok(triangles < 33000);
    total += statSync(file).size;
  }
  assert.ok(total < 10_000_000);
});

test('Personal space prevents walking through a visitor and permits moving away', () => {
  visitorPositions.set(0, { x: 0, z: 0 });
  try {
    assert.deepEqual(avoidVisitors(0, 1, 0, 0.8), [0, 1]);
    assert.deepEqual(avoidVisitors(0, 0.5, 0, 0.7), [0, 0.7]);
    assert.deepEqual(avoidVisitors(1, 1, 1.1, 0.95), [1.1, 0.95]);
  } finally {
    visitorPositions.clear();
  }
});

test('All bundled nature recordings are actual compact Ogg files', () => {
  let total = 0;
  for (const name of ['birds', 'wind', 'river', 'leaves']) {
    const data = readFileSync(`public/audio/${name}.ogg`);
    assert.equal(data.subarray(0, 4).toString(), 'OggS');
    total += data.length;
  }
  assert.ok(total < 2_500_000);
});

test('The local licensed background music is a compact Ogg stream', () => {
  const data = readFileSync('public/audio/music.ogg');
  assert.equal(data.subarray(0, 4).toString(), 'OggS');
  assert.ok(data.length > 500_000 && data.length < 3_000_000);
  assert.match(
    readFileSync('public/licenses/museum-visitors-and-nature.md', 'utf8'),
    /Lifewave 2k/,
  );
});
