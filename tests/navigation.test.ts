import test from 'node:test';
import assert from 'node:assert/strict';
import { canStand, moveWithCollisions, roomAt, rooms } from '../src/world/layout';
import { photographs } from '../src/content/museumContent';
import { existsSync } from 'node:fs';

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
test('All configured local example images exist and identifiers are unique', () => {
  assert.equal(new Set(photographs.map((p) => p.id)).size, photographs.length);
  for (const p of photographs) {
    assert.ok(existsSync(`public/${p.image}`), p.image);
    assert.ok(rooms.some((r) => r.id === p.room));
    assert.ok(p.placement.width > 0 && p.placement.height > 0);
  }
});
