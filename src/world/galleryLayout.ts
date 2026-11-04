import type { Vec3 } from '../content/museumContent';

/** Shared by the architecture, artwork placement, landscape and collision layout. */
export const MAIN_GALLERY = {
  bounds: [-10, 30, -48, -12] as [number, number, number, number],
  wallHeight: 9.2,
  spawn: [10, 1.7, -18.5] as Vec3,
  sunflower: [10, -0.022, -30] as Vec3,
  portrait: [10, 3.5, -47.63] as Vec3,
};

// Clockwise around the perimeter; all frames have a solid wall behind them.
export const natureSlots: { position: Vec3; rotation: number }[] = [
  ...[-5, 0, 5, 15, 20, 25].map((x) => ({ position: [x, 3.3, -47.72] as Vec3, rotation: 0 })),
  ...[-44, -37, -30, -22].map((z) => ({
    position: [29.72, 3.3, z] as Vec3,
    rotation: -Math.PI / 2,
  })),
  ...[26.5, 13.5, -6.5].map((x) => ({ position: [x, 3.3, -12.28] as Vec3, rotation: Math.PI })),
  ...[-30, -37, -44].map((z) => ({ position: [-9.72, 3.3, z] as Vec3, rotation: Math.PI / 2 })),
];
