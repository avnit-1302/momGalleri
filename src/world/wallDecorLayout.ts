import type { Vec3 } from '../content/museumContent';

// Gallery-facing walls beside the atrium doors, plus the two bare nature-gallery end panels.
export type DecorKind = 'botanical' | 'orbits' | 'ceramics' | 'waves' | 'sunburst' | 'reeds';
export const wallDecor: {
  position: Vec3;
  rotation: number;
  kind: DecorKind;
  width: number;
  depth: number;
}[] = [
  { position: [10.2, 0, -7.5], rotation: Math.PI / 2, kind: 'botanical', width: 3.4, depth: 0.72 },
  { position: [-10.2, 0, -7.5], rotation: -Math.PI / 2, kind: 'orbits', width: 0.95, depth: 0.72 },
  { position: [10.2, 0, 7.5], rotation: Math.PI / 2, kind: 'ceramics', width: 3.1, depth: 0.6 },
  { position: [-10.2, 0, 7.5], rotation: -Math.PI / 2, kind: 'waves', width: 3.4, depth: 0.72 },
  { position: [-6.5, 0, -12.2], rotation: Math.PI, kind: 'sunburst', width: 2.3, depth: 0.72 },
  { position: [26.5, 0, -12.2], rotation: Math.PI, kind: 'reeds', width: 2.3, depth: 0.72 },
];

// Same footprint as the shallow consoles in WallDecor; keep the six-metre doors clear.
export const decorFootprints = wallDecor.map(({ position: [x, , z], rotation, width, depth }) => {
  const side = Math.abs(Math.sin(rotation)) > 0.5;
  return {
    kind: 'box' as const,
    x: x + Math.sin(rotation) * 0.38,
    z: z + Math.cos(rotation) * 0.38,
    halfX: side ? depth / 2 : width / 2,
    halfZ: side ? width / 2 : depth / 2,
  };
});
