import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import {
  BoxGeometry, ExtrudeGeometry, InstancedMesh, MeshStandardMaterial, Object3D,
  Path, PlaneGeometry, Shape, Texture, Vector2, LatheGeometry, DoubleSide,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { museumContent, type Vec3 } from '../content/museumContent';
import { benches, planters, rooms, walls } from './layout';
import { contactTexture, oakTexture, stoneTexture, textTexture } from './materials';
import { Planter } from './Nature';
import { Seahorse } from './Seahorse';

export function Sign({ text, position, width = 8, height = 2, rotation = 0,
  color = '#514b3d', serif = false,
}: {
  text: string; position: Vec3; width?: number; height?: number;
  rotation?: number; color?: string; serif?: boolean;
}) {
  const texture = useMemo(() => textTexture(text, color, undefined, serif, width / height),
    [text, color, serif, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[0, rotation, 0]}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}

type Finish = 'stone' | 'white' | 'wood' | 'bronze' | 'dark';
type Materials = Record<Finish, MeshStandardMaterial>;
function Block({ position, size, material, rounded = false, rotation = 0 }: {
  position: Vec3; size: Vec3; material: MeshStandardMaterial; rounded?: boolean; rotation?: number;
}) {
  const geometry = useMemo(() => rounded
    ? new RoundedBoxGeometry(...size, 3, Math.min(0.06, Math.min(...size) * 0.25))
    : new BoxGeometry(...size), [size[0], size[1], size[2], rounded]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} position={position}
    rotation={[0, rotation, 0]} castShadow receiveShadow />;
}

type Batten = { position: Vec3; size: Vec3; rotation?: number };
function Battens({ items, material }: { items: Batten[]; material: MeshStandardMaterial }) {
  const ref = useRef<InstancedMesh>(null!);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    items.forEach((b, i) => {
      dummy.position.set(...b.position);
      dummy.scale.set(...b.size);
      dummy.rotation.set(0, b.rotation ?? 0, 0);
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[undefined, material, items.length]} castShadow receiveShadow>
    <boxGeometry args={[1, 1, 1]} />
  </instancedMesh>;
}

function Contact({ position, size, texture, opacity = 1 }: {
  position: Vec3; size: [number, number]; texture: Texture; opacity?: number;
}) {
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
  </mesh>;
}

function Floor({ bounds, stone, white }: {
  bounds: [number, number, number, number]; stone: Texture; white: boolean;
}) {
  const [x1, x2, z1, z2] = bounds;
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(x2 - x1, z2 - z1);
    const uv = plane.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i,
      uv.getX(i) * (x2 - x1) / 3.2, uv.getY(i) * (z2 - z1) / 3.2);
    return plane;
  }, [x1, x2, z1, z2]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[(x1 + x2) / 2, -0.035, (z1 + z2) / 2]}
    rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <meshStandardMaterial map={stone} bumpMap={stone} bumpScale={0.018}
      roughness={0.34} metalness={0.06} color={white ? '#fffdf5' : '#e5e8e3'} envMapIntensity={0.5} />
  </mesh>;
}

/** Solid oak soffits frame a large recessed ribbon skylight in each gallery. */
function GalleryRoof({ bounds, finishes, sanctuary = false }: {
  bounds: [number, number, number, number]; finishes: Materials; sanctuary?: boolean;
}) {
  const [x1, x2, z1, z2] = bounds;
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, width = x2 - x1, depth = z2 - z1;
  const ribbon = sanctuary ? 7 : width * 0.48;
  const edge = (width - ribbon) / 2;
  const battens = useMemo(() => {
    const list: Batten[] = [];
    for (let z = z1 + 0.25; z < z2; z += 0.44) {
      list.push({ position: [x1 + edge / 2, 7.92, z], size: [edge, 0.19, 0.08] });
      list.push({ position: [x2 - edge / 2, 7.92, z], size: [edge, 0.19, 0.08] });
    }
    return list;
  }, [x1, x2, z1, z2, edge]);
  return <group>
    {[-1, 1].map(side => <group key={side}>
      <Block position={[cx + side * (width / 2 - edge / 2), 8.16, cz]}
        size={[edge, 0.32, depth]} material={finishes.wood} />
      <Block position={[cx + side * (ribbon / 2 + 0.09), 8.44, cz]}
        size={[0.18, 0.76, depth]} material={finishes.white} />
      <Block position={[cx + side * (ribbon / 2 + 0.2), 7.96, cz]}
        size={[0.045, 0.025, depth - 0.4]} material={finishes.bronze} />
    </group>)}
    <Battens items={battens} material={finishes.wood} />
    {[z1 + 0.5, z2 - 0.5].map(z => <Block key={z} position={[cx, 8.19, z]}
      size={[ribbon, 0.38, 1]} material={finishes.white} />)}
    <mesh position={[cx, 8.9, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[ribbon, depth]} />
      <meshPhysicalMaterial color="#dce8e9" metalness={0.15} roughness={0.08}
        transparent opacity={0.12} depthWrite={false} side={DoubleSide} />
    </mesh>
    {Array.from({ length: Math.ceil(depth / 4) - 1 }, (_, i) =>
      <Block key={i} position={[cx, 8.82, z1 + (i + 1) * 4]}
        size={[ribbon, 0.14, 0.045]} material={finishes.bronze} />)}
  </group>;
}

function Oculus({ finishes }: { finishes: Materials }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-10, -12); shape.lineTo(10, -12); shape.lineTo(10, 12); shape.lineTo(-10, 12);
    shape.closePath();
    const hole = new Path(); hole.absarc(0, 0, 6.35, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false, curveSegments: 96 });
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const fins = useMemo(() => Array.from({ length: 100 }, (_, i): Batten => {
    const a = i / 100 * Math.PI * 2;
    return { position: [Math.cos(a) * 6.44, 9.66, Math.sin(a) * 6.44],
      size: [0.12, 1.16, 0.15], rotation: -a };
  }), []);
  return <group>
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 9.15, 0]}
      material={finishes.wood} castShadow receiveShadow />
    <Battens items={fins} material={finishes.wood} />
    {[9.12, 10.25].map(y => <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}
      material={finishes.bronze} castShadow>
      <torusGeometry args={[6.42, 0.06, 8, 120]} />
    </mesh>)}
    <mesh position={[0, 10.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[6.5, 96]} />
      <meshPhysicalMaterial color="#cbdde2" transparent opacity={0.09} metalness={0.15}
        roughness={0.08} depthWrite={false} side={DoubleSide} />
    </mesh>
    {[-10, 10].map(x => <Block key={x} position={[x, 8.63, 0]}
      size={[0.36, 1.26, 24]} material={finishes.white} />)}
    {[-12, 12].map(z => <Block key={z} position={[0, 8.63, z]}
      size={[20, 1.26, 0.36]} material={finishes.white} />)}
    {[-6, 0, 6].map(x => <Block key={x} position={[x, 10.31, 0]}
      size={[0.045, 0.12, 2 * Math.sqrt(6.4 ** 2 - x ** 2)]} material={finishes.bronze} />)}
  </group>;
}

function Pool({ low, finishes, stone, contact }: {
  low: boolean; finishes: Materials; stone: Texture; contact: Texture;
}) {
  return <group>
    <Contact position={[0, -0.024, 0]} size={[10.2, 10.2]} texture={contact} />
    <mesh position={[0, 0.1, 0]} receiveShadow castShadow material={finishes.dark}>
      <cylinderGeometry args={[4.1, 4.1, 0.22, 128]} />
    </mesh>
    <mesh position={[0, 0.227, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[3.93, 4.1, 128]} />
      <meshStandardMaterial map={stone} color="#c2beb1" roughness={0.38} />
    </mesh>
    <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.94, 128]} />
      {low ? <meshStandardMaterial color="#243b33" metalness={0.65} roughness={0.2} />
        : <MeshReflectorMaterial resolution={256} blur={[80, 30]} mixBlur={0.65}
          mixStrength={1.7} mirror={0.65} color="#71867c" metalness={0.25} roughness={0.18}
          depthScale={0} minDepthThreshold={0.8} maxDepthThreshold={1} />}
    </mesh>
    <mesh position={[0, 0.35, 0]} receiveShadow castShadow material={finishes.dark}>
      <cylinderGeometry args={[1.76, 1.76, 0.3, 96]} />
    </mesh>
    <mesh position={[0, 0.64, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[1.72, 1.72, 0.42, 96]} />
      <meshStandardMaterial map={stone} bumpMap={stone} bumpScale={0.025}
        color="#ddd9cc" roughness={0.47} />
    </mesh>
    <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} material={finishes.bronze}>
      <ringGeometry args={[1.68, 1.73, 96]} />
    </mesh>
    <Seahorse />
    <spotLight position={[3.5, 8.8, 4]} angle={0.4} penumbra={0.8}
      intensity={160} distance={16} color="#ffe2b5" />
    {!low && <spotLight position={[-3, 8.7, -4]} angle={0.4} penumbra={1}
      intensity={200} distance={16} color="#dfeafb" />}
    {/* Small plaque set into the pool rim, inside its existing collision boundary. */}
    <Block position={[0, 0.45, 3.91]} size={[1.45, 0.4, 0.07]} material={finishes.dark} rounded />
    <Sign text={'THE SEAHORSE\nA sculpture in light and bronze'} position={[0, 0.45, 3.95]}
      width={1.38} height={0.36} color="#d8cbb0" />
  </group>;
}

function Arch({ x, z, radius, thickness, spring, material }: {
  x: number; z: number; radius: number; thickness: number; spring: number;
  material: MeshStandardMaterial;
}) {
  const geometry = useMemo(() => {
    const inner = radius - thickness;
    const shape = new Shape();
    shape.moveTo(-radius, 0); shape.lineTo(-radius, spring);
    shape.absarc(0, spring, radius, Math.PI, 0, true);
    shape.lineTo(radius, 0); shape.lineTo(inner, 0); shape.lineTo(inner, spring);
    shape.absarc(0, spring, inner, 0, Math.PI, false);
    shape.lineTo(-inner, 0); shape.closePath();
    return new ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true,
      bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015, curveSegments: 64 });
  }, [radius, thickness, spring]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} position={[x, 0.05, z]} castShadow receiveShadow />;
}

function Flowers({ position, finishes }: { position: Vec3; finishes: Materials }) {
  const petals = useRef<InstancedMesh>(null!), stems = useRef<InstancedMesh>(null!);
  const vase = useMemo(() => new LatheGeometry([
    new Vector2(0.16, 0), new Vector2(0.23, 0.08), new Vector2(0.28, 0.5),
    new Vector2(0.19, 0.85), new Vector2(0.15, 0.95), new Vector2(0.18, 0.98),
  ], 32), []);
  useEffect(() => () => vase.dispose(), [vase]);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.399, x = Math.cos(angle) * 0.29, z = Math.sin(angle) * 0.24;
      const y = 1.35 + Math.sin(i * 1.8) * 0.2;
      dummy.position.set(x * 0.5, y * 0.5 + 0.3, z * 0.5);
      dummy.rotation.set(z * 0.5, 0, -x * 0.5); dummy.scale.set(0.008, y - 0.6, 0.008);
      dummy.updateMatrix(); stems.current.setMatrixAt(i, dummy.matrix);
      for (let j = 0; j < 7; j++) {
        const a = j / 7 * Math.PI * 2;
        dummy.position.set(x + Math.cos(a) * 0.08, y + Math.sin(a) * 0.05, z);
        dummy.rotation.set(0.5 + Math.sin(i) * 0.7, Math.cos(i) * 0.5, a);
        dummy.scale.set(0.09, 0.15, 0.026); dummy.updateMatrix();
        petals.current.setMatrixAt(i * 7 + j, dummy.matrix);
      }
    }
    stems.current.instanceMatrix.needsUpdate = petals.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <group position={position}>
    <mesh geometry={vase} material={finishes.white} castShadow receiveShadow />
    <instancedMesh ref={stems} args={[undefined, undefined, 9]} castShadow>
      <cylinderGeometry args={[1, 1, 1, 5]} /><meshStandardMaterial color="#41503a" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={petals} args={[undefined, undefined, 63]} castShadow>
      <sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#f5eee1" roughness={0.68} />
    </instancedMesh>
  </group>;
}

export function Architecture({ low }: { low: boolean }) {
  const stone = useMemo(stoneTexture, []), wood = useMemo(oakTexture, []), contact = useMemo(contactTexture, []);
  const finishes = useMemo<Materials>(() => ({
    stone: new MeshStandardMaterial({ color: '#d7d4c9', map: stone, bumpMap: stone, bumpScale: 0.025, roughness: 0.72 }),
    white: new MeshStandardMaterial({ color: '#e4e2d8', roughness: 0.74, bumpMap: stone, bumpScale: 0.012 }),
    wood: new MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 0.014, roughness: 0.5 }),
    bronze: new MeshStandardMaterial({ color: '#64543d', metalness: 0.72, roughness: 0.34 }),
    dark: new MeshStandardMaterial({ color: '#323d37', metalness: 0.18, roughness: 0.56 }),
  }), [stone, wood]);
  useEffect(() => () => {
    stone.dispose(); wood.dispose(); contact.dispose(); Object.values(finishes).forEach(m => m.dispose());
  }, [stone, wood, contact, finishes]);
  const wallFins = useMemo(() => {
    const list: Batten[] = [];
    for (const side of [-1, 1]) for (let x = 3.35; x < 9.8; x += 0.22)
      list.push({ position: [x * side, 2.85, 12.23], size: [0.095, 5.65, 0.16] });
    for (const x of [-24.5, -15.5]) for (let offset = -1.2; offset <= 1.2; offset += 0.19)
      list.push({ position: [x + offset, 3.95, -29.68], size: [0.08, 7.7, 0.11] });
    return list;
  }, []);
  const windowFrames = useMemo(() => {
    const list: Batten[] = [];
    for (const w of walls.filter(w => w.glass)) {
      const horizontal = w.size[0] > w.size[2], len = Math.max(w.size[0], w.size[2]);
      const panels = Math.ceil(len / 3.5);
      for (let i = 0; i <= panels; i++) {
        const offset = -len / 2 + i * len / panels;
        list.push({ position: [w.position[0] + (horizontal ? offset : 0), 4,
          w.position[2] + (horizontal ? 0 : offset)], size: [0.055, 8, 0.055] });
      }
      for (const y of [0.08, 6.4, 7.97]) list.push({ position: [w.position[0], y, w.position[2]],
        size: horizontal ? [len, 0.045, 0.075] : [0.075, 0.045, len] });
    }
    return list;
  }, []);
  return <group>
    {rooms.map(room => <group key={room.id}>
      <Floor bounds={room.bounds} stone={stone} white={room.id === 'sanctuary'} />
      {room.id === 'atrium' ? <Oculus finishes={finishes} />
        : <GalleryRoof bounds={room.bounds} finishes={finishes} sanctuary={room.id === 'sanctuary'} />}
    </group>)}
    {walls.map((wall, i) => <group key={i}>
      <mesh position={wall.position} receiveShadow castShadow={!wall.glass}>
        <boxGeometry args={wall.size} />
        {wall.glass ? <meshPhysicalMaterial color="#cadcda" roughness={0.07} metalness={0.08}
          transparent opacity={0.09} depthWrite={false} envMapIntensity={0.65} />
          : <primitive object={finishes.white} attach="material" />}
      </mesh>
      {!wall.glass && <>
        <Block position={[wall.position[0], 0.06, wall.position[2]]}
          size={[wall.size[0] + 0.012, 0.11, wall.size[2] + 0.012]} material={finishes.dark} />
        <Block position={[wall.position[0], 7.82, wall.position[2]]}
          size={[wall.size[0] + 0.025, 0.1, wall.size[2] + 0.025]} material={finishes.stone} />
      </>}
    </group>)}
    <Battens items={windowFrames} material={finishes.bronze} />
    <Battens items={wallFins} material={finishes.wood} />
    {/* Deep reveals surround the existing six-metre passages without narrowing them. */}
    {[[0, 12, 0], [0, -12, 0], [-20, -12, 0], [20, -12, 0],
      [-10, 0, Math.PI / 2], [10, 0, Math.PI / 2], [-10, -21, Math.PI / 2]].map(([x, z, r]) =>
      <group key={`${x}-${z}`} position={[x, 0, z]} rotation={[0, r, 0]}>
        <Block position={[0, 6.9, 0]} size={[6, 2.2, 0.52]} material={finishes.white} />
        <Block position={[0, 5.82, 0]} size={[6, 0.065, 0.6]} material={finishes.wood} />
        {[-3.07, 3.07].map(offset => <Block key={offset} position={[offset, 2.9, 0]}
          size={[0.12, 5.8, 0.52]} material={finishes.stone} />)}
      </group>)}
    {/* A continuous, unbroken fascia gives the entrance title a clear field. */}
    <Block position={[0, 6.88, 12.25]} size={[19.5, 2.12, 0.12]} material={finishes.white} />
    <Sign text={museumContent.exhibitionTitle} position={[0, 6.93, 12.322]} width={11.3} height={1.25} serif />
    <Sign text="A LIFE REMEMBERED, ONE MOMENT AT A TIME." position={[-9.82, 4.05, 21]}
      rotation={Math.PI / 2} width={8.7} height={0.65} />
    <Sign text="IN LOVING MEMORY OF PUJA ANAND" position={[-9.81, 3.55, 21]}
      rotation={Math.PI / 2} width={6.7} height={0.45} />
    {/* Entry-side wall panels support the welcome signs and portrait against the glazing. */}
    {[-1, 1].map(side => <Block key={side} position={[side * 9.94, 3.9, 21]}
      size={[0.12, 7.8, side < 0 ? 10 : 4.2]} material={finishes.stone} />)}
    <Sign text="03   THE FIRST CHAPTERS" position={[-9.72, 6.5, 0]}
      rotation={Math.PI / 2} width={5.4} height={0.65} />
    <Sign text="04   THE LIFE WE SHARED" position={[9.72, 6.5, 0]}
      rotation={-Math.PI / 2} width={5.4} height={0.65} />
    <Sign text="06   FOREVER REMEMBERED" position={[0, 6.5, -11.72]} width={5.4} height={0.65} />
    <Sign text="05   THE HEART OF OUR FAMILY" position={[-20, 6.5, -11.72]} width={5.4} height={0.65} />
    <Pool low={low} finishes={finishes} stone={stone} contact={contact} />
    {benches.map((p, i) => <group key={i} position={p}>
      <Contact position={[0, -0.47, 0]} size={[4.4, 2.1]} texture={contact} />
      <Block position={[0, -0.065, 0]} size={[3.45, 0.1, 0.88]} material={finishes.dark} rounded />
      {Array.from({ length: 6 }, (_, j) => <Block key={j} position={[0, 0.025, -0.435 + j * 0.174]}
        size={[3.55, 0.13, 0.15]} material={finishes.wood} rounded />)}
      {[-1.23, 1.23].map(x => <Block key={x} position={[x, -0.27, 0]}
        size={[0.25, 0.4, 0.88]} material={finishes.stone} rounded />)}
    </group>)}
    {planters.map((p, i) => <group key={i}>
      <Contact position={[p[0], -0.02, p[2]]} size={[2.7, 2.7]} texture={contact} />
      <Planter position={p} />
    </group>)}
    {/* The portrait remains central. The sacred symbol has its own elevated space. */}
    <Arch x={-20} z={-29.62} radius={3.42} thickness={0.38} spring={4.45} material={finishes.stone} />
    <Arch x={-20} z={-29.58} radius={3.01} thickness={0.035} spring={4.45} material={finishes.bronze} />
    <Sign text="ੴ" position={[-20, 6.97, -29.53]} width={1.7} height={1.2} color="#9c7d43" />
    <Sign text={museumContent.mother.tributeHeading} position={[-20, 5.94, -29.53]}
      width={5.6} height={0.85} serif />
    <Sign text="LOVE · GRATITUDE · REMEMBRANCE" position={[-20, 0.9, -29.52]}
      width={4.8} height={0.38} />
    {[-23.85, -16.15].map(x => <Flowers key={x} position={[x, 0, -29.55]} finishes={finishes} />)}
    <Sign text={museumContent.celebrationTitle} position={[10, 6.55, -29.7]} width={12} height={1.4} serif />
    <Sign text="THE MEMORIES WE HOLD FOREVER" position={[10, 5.65, -29.7]} width={7.3} height={0.5} />
    {/* A single delicate sculptural pendant keeps the final gallery calm. */}
    {[3.8, 5.2].map((radius, i) => <group key={radius} position={[10, 6.8 + i * 0.45, -21]}>
      <mesh rotation={[Math.PI / 2 + 0.04, 0.03, 0]} material={finishes.bronze}>
        <torusGeometry args={[radius, 0.024, 8, 96]} />
      </mesh>
      {[0, 2.1, 4.2].map(a => <Block key={a} position={[Math.sin(a) * radius, 0.6, Math.cos(a) * radius]}
        size={[0.008, 1.2, 0.008]} material={finishes.bronze} />)}
    </group>)}
  </group>;
}
