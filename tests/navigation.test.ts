import test from 'node:test';
import assert from 'node:assert/strict';
import { canStand, moveWithCollisions, roomAt, rooms } from '../src/world/layout';
import { photographs } from '../src/content/museumContent';
import { existsSync, readdirSync } from 'node:fs';
import { MAIN_GALLERY } from '../src/world/galleryLayout';

test('Every room has a safe spawn and is correctly identified', () => {
  for (const room of rooms) {
    const [x, , z] = room.spawn;
    assert.ok(canStand(x, z), room.id);
    assert.equal(roomAt(x, z), room.id);
  }
});
test('All six rooms are physically reachable from the entrance', () => {
  const queue: [number, number][] = [[0, 24]],
    visited = new Set(['0,24']),
    reached = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    reached.add(roomAt(x, z));
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        key = `${nx},${nz}`;
      if (visited.has(key) || !canStand(nx, nz)) continue;
      const [mx, mz] = moveWithCollisions(x, z, dx, dz);
      if (Math.abs(mx - nx) > 0.01 || Math.abs(mz - nz) > 0.01) continue;
      visited.add(key);
      queue.push([nx, nz]);
    }
  }
  assert.deepEqual([...reached].sort(), rooms.map((r) => r.id).sort());
});
test('Long movement cannot tunnel through a wall or the reflecting pool', () => {
  const [wallX, wallZ] = moveWithCollisions(0, 24, 30, 0);
  assert.ok(wallX < 9.7);
  assert.ok(canStand(wallX, wallZ));
  const [poolX, poolZ] = moveWithCollisions(0, 8, 0, -16);
  assert.ok(poolZ > 4.3);
  assert.ok(canStand(poolX, poolZ));
});
test('Diagonal movement slides along a wall without crossing it', () => {
  const [x, z] = moveWithCollisions(9.5, 23, 5, -5);
  assert.ok(x < 9.7);
  assert.ok(z < 19);
  assert.ok(canStand(x, z));
});
test('All configured local images exist and identifiers are unique', () => {
  assert.equal(new Set(photographs.map((p) => p.id)).size, photographs.length);
  for (const p of photographs) {
    assert.ok(existsSync(`public/${p.image}`), p.image);
    assert.ok(rooms.some((r) => r.id === p.room));
    assert.ok(p.placement.width > 0 && p.placement.height > 0);
  }
});

test('Every nature image is exhibited exactly once in the main gallery', () => {
  const files = readdirSync('public/images/nature').filter((file) =>
    /\.(jpe?g|png|webp|svg)$/i.test(file),
  );
  const works = photographs.filter((p) => p.image.startsWith('images/nature/'));
  assert.deepEqual(works.map((p) => p.image.slice('images/nature/'.length)).sort(), files.sort());
  assert.ok(works.every((p) => p.room === 'celebration'));
  for (const work of works) {
    const {
      position: [x, , z],
      rotation,
    } = work.placement;
    assert.ok(
      canStand(x + Math.sin(rotation) * 2.5, z + Math.cos(rotation) * 2.5),
      `Visitor can stand in front of ${work.title}`,
    );
  }
});

test('All uploaded JPEGs appear in the collection', () => {
  const files = readdirSync('public/images', { recursive: true })
    .map((file) => String(file).replaceAll('\\', '/'))
    .filter((file) => /\.jpe?g$/i.test(file));
  const configured = new Set(photographs.map((p) => p.image));
  for (const file of files) assert.ok(configured.has(`images/${file}`), file);
});

test('Expanded gallery and sunflower remain walkable through to the new north wall', () => {
  const [x1, x2, z1, z2] = MAIN_GALLERY.bounds;
  assert.ok((x2 - x1) * (z2 - z1) >= 1440);
  const [x, z] = moveWithCollisions(10, -20, 0, -25);
  assert.ok(Math.abs(x - 10) < 0.01 && Math.abs(z + 45) < 0.01);
  assert.equal(roomAt(x, z), 'celebration');
  assert.ok(canStand(MAIN_GALLERY.sunflower[0], MAIN_GALLERY.sunflower[2]));
  const [, beyond] = moveWithCollisions(x, z, 0, -20);
  assert.ok(beyond > z1 && beyond < z1 + 1);
});

test('Main gallery frames do not overlap on the same wall', () => {
  const works = photographs.filter((p) => p.room === 'celebration');
  for (let i = 0; i < works.length; i++)
    for (const b of works.slice(i + 1)) {
      const a = works[i].placement,
        other = b.placement;
      if (a.rotation !== other.rotation) continue;
      const side = Math.abs(Math.sin(a.rotation)) > 0.5;
      const along = side ? 2 : 0,
        across = side ? 0 : 2;
      if (Math.abs(a.position[across] - other.position[across]) > 0.2) continue;
      assert.ok(
        Math.abs(a.position[along] - other.position[along]) > (a.width + other.width) / 2 + 0.52,
        `${works[i].id} overlaps ${b.id}`,
      );
    }
});
