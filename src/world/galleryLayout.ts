import type { Vec3 } from '../content/museumContent';

/** Shared by the architecture, artwork placement, landscape and collision layout. */
export const MAIN_GALLERY = {
  bounds: [-10, 30, -48, -12] as [number, number, number, number],
  wallHeight: 9.2,
  spawn: [10, 1.7, -18.5] as Vec3,
  sunflower: [10, -0.022, -30] as Vec3,
  portrait: [10, 3.5, -47.63] as Vec3,
};

// Solid elements are shared with collision detection and artwork targeting.
export const galleryPartitions = [0, 20].map((x) => ({
  position: [x, 2.6, -24] as Vec3,
  size: [5.6, 5.2, 0.65] as Vec3,
}));
export const galleryPiers = [
  ...[3.15, 16.85].flatMap((x) =>
    [-24, -37.5].map((z) => ({
      position: [x, 4.6, z] as Vec3,
      size: [0.65, 9.2, 0.8] as Vec3,
    })),
  ),
  ...[-7.5, -0.5, 6.5, 13.5, 20.5, 27.5].map((x) => ({
    position: [x, 4.6, -47.55] as Vec3,
    size: [0.65, 9.2, 0.9] as Vec3,
  })),
  ...[-9.55, 29.55].flatMap((x) =>
    [-40.5, -33.5, -26.3].map((z) => ({
      position: [x, 4.6, z] as Vec3,
      size: [0.9, 9.2, 0.65] as Vec3,
    })),
  ),
];

// Four works flank the central portrait symmetrically; the remaining ten fill the side walls.
// Clockwise around the perimeter; all frames have a solid wall behind them.
export const natureSlots: { position: Vec3; rotation: number }[] = [
  ...[-4, 3, 17, 24].map((x) => ({ position: [x, 3.3, -47.72] as Vec3, rotation: 0 })),
  ...[-44, -37, -30, -22].map((z) => ({
    position: [29.72, 3.3, z] as Vec3,
    rotation: -Math.PI / 2,
  })),
  { position: [20, 2.6, -23.57], rotation: 0 },
  // The two adjoining wall sections form one uninterrupted surface from x=3 to x=17.
  { position: [10, 3.3, -12.28], rotation: Math.PI },
  { position: [0, 2.6, -23.57], rotation: 0 },
  ...[-30, -37, -44].map((z) => ({ position: [-9.72, 3.3, z] as Vec3, rotation: Math.PI / 2 })),
];
