export type VisitorStop = { x: number; z: number; lookX: number; lookZ: number; pause: number };
const stop = (x: number, z: number, lookX: number, lookZ: number, pause = 7): VisitorStop => ({
  x,
  z,
  lookX,
  lookZ,
  pause,
});
export const visitorRoutes: VisitorStop[][] = [
  [
    stop(-4, -21, 0, -24),
    stop(-4, -27, -10, -30, 0),
    stop(-5, -35, -10, -37),
    stop(-6, -42, -10, -44, 0),
    stop(-4, -44, -4, -48, 10),
    stop(0, -44, 3, -48),
    stop(0, -35, 10, -30, 0),
    stop(-4, -27, 0, -24, 0),
  ],
  [
    stop(24, -21, 20, -24, 11),
    stop(24, -27, 30, -30, 0),
    stop(25, -35, 30, -37),
    stop(26, -42, 30, -44, 0),
    stop(24, -44, 24, -48, 10),
    stop(20, -44, 17, -48),
    stop(20, -35, 10, -30, 0),
    stop(24, -27, 20, -24, 0),
  ],
  [
    stop(24, 5, 30, 7),
    stop(25, 2, 30, 0, 0),
    stop(25, -5, 30, -7, 10),
    stop(22, -6, 20, -12, 0),
    stop(16, -6, 13, -12, 7),
    stop(16, 1, 20, 0, 0),
  ],
];
