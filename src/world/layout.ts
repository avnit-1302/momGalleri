import type { RoomId, Vec3 } from '../content/museumContent';

export interface Room {
  id: RoomId;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  bounds: [number, number, number, number];
  spawn: Vec3;
  yaw: number;
}
export const rooms: Room[] = [
  {
    id: 'entrance',
    number: '01',
    name: 'Velkommen hjem',
    subtitle: 'Den store inngangshallen',
    description:
      'Et museum skapt av kjærlighet. Ta deg god tid. Her begynner en feiring av mamma og alle øyeblikkene som betyr noe.',
    bounds: [-10, 10, 12, 28],
    spawn: [0, 1.7, 24],
    yaw: 0,
  },
  {
    id: 'atrium',
    number: '02',
    name: 'Sjøhestens sal',
    subtitle: 'Et stille midtpunkt',
    description:
      'En original sjøhest i bronse, omgitt av vann og lys. Gå hele veien rundt skulpturen, og la blikket vandre opp mot himmelen.',
    bounds: [-10, 10, -12, 12],
    spawn: [0, 1.7, 8.8],
    yaw: 0,
  },
  {
    id: 'childhood',
    number: '03',
    name: 'De første kapitlene',
    subtitle: 'Barndom og tidlige minner',
    description:
      'Her får de første fotografiene og historiene sin plass. Velg et bilde på veggen for å komme nærmere.',
    bounds: [-30, -10, -12, 12],
    spawn: [-19, 1.7, 4],
    yaw: Math.PI / 2,
  },
  {
    id: 'family',
    number: '04',
    name: 'Livet vi deler',
    subtitle: 'Familie, kjærlighet og liv',
    description:
      'De store dagene. De små øyeblikkene. Et varmt rom for fotografier av menneskene og minnene som hører sammen.',
    bounds: [10, 30, -12, 12],
    spawn: [19, 1.7, 4],
    yaw: -Math.PI / 2,
  },
  {
    id: 'sanctuary',
    number: '05',
    name: 'Hjertet i familien',
    subtitle: 'Kjærlighet og takknemlighet',
    description:
      'Et rolig, sikh-inspirert familierom for takknemlighet og refleksjon. Sett deg et øyeblikk, og gi plass til alt du setter pris på.',
    bounds: [-30, -10, -30, -12],
    spawn: [-20, 1.7, -19],
    yaw: 0,
  },
  {
    id: 'celebration',
    number: '06',
    name: 'Til deg, mamma',
    subtitle: 'En feiring av 50 år',
    description:
      'Et nytt kapittel begynner. Gratulerer med dagen, mamma — og takk for alle minnene vi får skape videre, sammen.',
    bounds: [-10, 30, -30, -12],
    spawn: [10, 1.7, -21],
    yaw: 0,
  },
];
export interface Wall {
  position: Vec3;
  size: Vec3;
  glass?: boolean;
}
export type Collider =
  | { kind: 'box'; x: number; z: number; halfX: number; halfZ: number }
  | { kind: 'circle'; x: number; z: number; radius: number };
export const walls: Wall[] = [];
function wall(x: number, z: number, width: number, depth: number, glass = false, height = 8) {
  walls.push({ position: [x, height / 2, z], size: [width, height, depth], glass });
}
// Exterior: a broad museum with a projecting entrance pavilion.
// Stone picture piers alternate with floor-to-ceiling woodland windows.
for (const x of [-30, 30]) {
  const panels: [number, number, boolean][] = [
    [-30, -25, true],
    [-25, -18, false],
    [-18, -9, true],
    [-9, -5, false],
    [-5, -2, true],
    [-2, 2, false],
    [2, 5, true],
    [5, 9, false],
    [9, 12, true],
  ];
  for (const [start, end, glass] of panels) wall(x, (start + end) / 2, 0.35, end - start, glass);
}
wall(0, -30, 60, 0.35);
wall(-20, 12, 20, 0.2, true);
wall(20, 12, 20, 0.2, true);
wall(-10, 20, 0.2, 16, true);
wall(10, 20, 0.2, 16, true);
wall(0, 28, 20, 0.2, true);
// Every partition leaves a six-metre opening, shared by rendering and collisions.
for (const x of [-10, 10]) {
  wall(x, -7.5, 0.35, 9);
  wall(x, 7.5, 0.35, 9);
}
for (const x of [-6.5, 6.5]) wall(x, 12, 7, 0.35);
for (const x of [-26.5, -13.5, -6.5, 6.5, 13.5, 26.5]) wall(x, -12, 7, 0.35);
wall(-10, -27, 0.35, 6);
wall(-10, -15, 0.35, 6);

export const benches: Vec3[] = [
  [-20, 0.45, 7.5],
  [20, 0.45, 7.5],
  [-24.5, 0.45, -23.5],
  [-15.5, 0.45, -23.5],
  [3, 0.45, -17],
  [17, 0.45, -17],
];
export const planters: Vec3[] = [
  [-7.5, 0, 8.5],
  [7.5, 0, 8.5],
  [-7.5, 0, -8.5],
  [7.5, 0, -8.5],
  [-27, 0, 9],
  [27, 0, 9],
  [-27.5, 0, -27.5],
  [-12.5, 0, -27.5],
  [26.5, 0, -27],
  [-6.5, 0, -27],
];
export const colliders: Collider[] = [
  ...walls.map((w) => ({
    kind: 'box' as const,
    x: w.position[0],
    z: w.position[2],
    halfX: w.size[0] / 2,
    halfZ: w.size[2] / 2,
  })),
  { kind: 'circle', x: 0, z: 0, radius: 4.1 },
  ...benches.map((p) => ({ kind: 'box' as const, x: p[0], z: p[2], halfX: 1.8, halfZ: 0.6 })),
  ...planters.map((p) => ({ kind: 'circle' as const, x: p[0], z: p[2], radius: 0.85 })),
];
export const PLAYER_RADIUS = 0.32;
export function canStand(x: number, z: number): boolean {
  // Also prevent falling out through a malformed or accidentally removed wall.
  if (
    !rooms.some((r) => x >= r.bounds[0] && x <= r.bounds[1] && z >= r.bounds[2] && z <= r.bounds[3])
  )
    return false;
  return !colliders.some((c) =>
    c.kind === 'circle'
      ? Math.hypot(x - c.x, z - c.z) < c.radius + PLAYER_RADIUS
      : Math.hypot(
          Math.max(Math.abs(x - c.x) - c.halfX, 0),
          Math.max(Math.abs(z - c.z) - c.halfZ, 0),
        ) < PLAYER_RADIUS,
  );
}
export function moveWithCollisions(x: number, z: number, dx: number, dz: number): [number, number] {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx / steps, z)) x += dx / steps;
    if (canStand(x, z + dz / steps)) z += dz / steps;
  }
  return [x, z];
}
export function roomAt(x: number, z: number): RoomId {
  return (
    rooms.find((r) => x >= r.bounds[0] && x <= r.bounds[1] && z >= r.bounds[2] && z <= r.bounds[3])
      ?.id ?? 'entrance'
  );
}
