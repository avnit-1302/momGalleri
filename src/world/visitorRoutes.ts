export type VisitorStop = { x: number; z: number; lookX: number; lookZ: number; pause: number };
const stop = (x: number, z: number, lookX: number, lookZ: number, pause = 7): VisitorStop => ({
  x,
  z,
  lookX,
  lookZ,
  pause,
});
// A one-way circuit through five rooms prevents head-on encounters in doorways.
// Starts are distributed around the museum; each visitor has a different pause rhythm.
const circuit = [
  stop(-4, -21, 0, -24),
  stop(-7, -21, -10, -21, 0),
  stop(-12, -21, -20, -29, 0),
  stop(-19, -19, -20, -29, 0),
  stop(-19, -25, -20, -29, 9),
  stop(-21, -25, -20, -29, 0),
  stop(-21, -19, -20, -12, 0),
  stop(-21, -10, -25, -7, 0),
  stop(-25, -4, -30, -7, 8),
  stop(-24, 3, -30, 7, 9),
  stop(-16, 3, -10, 0, 0),
  stop(-13, 1, -10, 0, 0),
  stop(-7, 1, 0, 0, 7),
  stop(-6, -6, 0, 0, 0),
  stop(6, -6, 0, 0, 8),
  stop(7, 0, 10, 0, 0),
  stop(13, 0, 20, 0, 0),
  stop(16, 1, 20, 0, 0),
  stop(24, 5, 30, 7, 7),
  stop(25, 2, 30, 0, 0),
  stop(25, -5, 30, -7, 10),
  stop(22, -6, 20, -12, 0),
  stop(20, -10, 20, -12, 0),
  stop(20, -16, 20, -24, 0),
  stop(24, -21, 20, -24, 11),
  stop(24, -27, 30, -30, 0),
  stop(25, -35, 30, -37, 8),
  stop(26, -42, 30, -44, 0),
  stop(24, -44, 24, -48, 10),
  stop(20, -44, 17, -48, 7),
  stop(10, -44, 10, -48, 12),
  stop(0, -44, 3, -48, 7),
  stop(-4, -44, -4, -48, 10),
  stop(-6, -42, -10, -44, 0),
  stop(-5, -35, -10, -37, 7),
  stop(-4, -27, -10, -30, 0),
];
export const visitorRoutes: VisitorStop[][] = [0, 24, 18].map((start, visitor) =>
  [...circuit.slice(start), ...circuit.slice(0, start)].map((point, index) => ({
    ...point,
    pause: point.pause ? Math.min(15, Math.max(5, point.pause + ((visitor + index) % 3) - 1)) : 0,
  })),
);
