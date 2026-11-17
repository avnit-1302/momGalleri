// Live positions only: at most three entries, no pathfinding or spatial index.
export const visitorPositions = new Map<number, { x: number; z: number }>();

export function avoidVisitors(
  x: number,
  z: number,
  nextX: number,
  nextZ: number,
): [number, number] {
  const clear = (nx: number, nz: number) =>
    [...visitorPositions.values()].every((p) => {
      const before = Math.hypot(x - p.x, z - p.z),
        after = Math.hypot(nx - p.x, nz - p.z);
      // Preserve personal space, but allow escape if a room teleport placed us inside it.
      return after >= 0.9 || after >= before;
    });
  if (clear(nextX, nextZ)) return [nextX, nextZ];
  if (clear(nextX, z)) return [nextX, z];
  if (clear(x, nextZ)) return [x, nextZ];
  return [x, z];
}
