import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  DoubleSide,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Vector2,
} from 'three';
import type { BufferGeometry } from 'three';
import type { Vec3 } from '../content/museumContent';
import {
  barkTexture,
  fernGeometry,
  grassGeometry,
  groundTexture,
  leafTexture,
  seededRandom,
  terrainGeometry,
  terrainHeight,
  transformAt,
  treeGeometry,
} from './forestAssets';
import type { TreeSpecies } from './forestAssets';

type Instance = { matrix: Matrix4; color?: Color };
function Instances({
  geometry,
  instances,
  children,
  shadows = false,
}: {
  geometry: BufferGeometry;
  instances: Instance[];
  children: React.ReactNode;
  shadows?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null!);
  useLayoutEffect(() => {
    instances.forEach((instance, i) => {
      ref.current.setMatrixAt(i, instance.matrix);
      if (instance.color) ref.current.setColorAt(i, instance.color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [instances]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, instances.length]}
      castShadow={shadows}
      receiveShadow
    >
      {children}
    </instancedMesh>
  );
}

function TreeStand({
  species,
  instances,
  low,
}: {
  species: TreeSpecies;
  instances: Instance[];
  low: boolean;
}) {
  const assets = useMemo(
    () => ({
      ...treeGeometry(species, low),
      bark: barkTexture(species),
      leaves: leafTexture(species),
    }),
    [species, low],
  );
  useEffect(() => () => Object.values(assets).forEach((asset) => asset.dispose()), [assets]);
  return (
    <group>
      <Instances geometry={assets.wood} instances={instances} shadows={!low}>
        <meshStandardMaterial
          map={assets.bark}
          bumpMap={assets.bark}
          bumpScale={species === 'birch' ? 0.045 : 0.12}
          roughness={0.94}
        />
      </Instances>
      <Instances geometry={assets.foliage} instances={instances} shadows={!low}>
        <meshStandardMaterial
          map={assets.leaves}
          alphaTest={0.48}
          side={DoubleSide}
          roughness={0.91}
        />
      </Instances>
    </group>
  );
}

/** Original botanical geometry and painted textures, shared by instanced woodland stands. */
export function Forest({ low }: { low: boolean }) {
  const layout = useMemo(() => {
    const random = seededRandom(41);
    const stands: Record<TreeSpecies, Instance[]> = { birch: [], oak: [], fir: [] };
    const grass: Instance[] = [],
      ferns: Instance[] = [],
      rocks: Instance[] = [],
      shrubs: Instance[] = [];
    const outside = (x: number, z: number) => !(x > -34 && x < 34 && z > -35 && z < 33);
    for (let i = 0; i < (low ? 138 : 258); i++) {
      let x: number, z: number;
      // Dense, varied woodland edge; taller trees create depth behind it.
      if (i < 76) {
        const side = i % 4,
          distance = 35 + random() * 13;
        x = side < 2 ? (side ? -1 : 1) * distance : (random() - 0.5) * 104;
        z = side > 1 ? (side === 2 ? -1 : 1) * distance : (random() - 0.5) * 99;
      } else {
        do {
          x = (random() - 0.5) * 220;
          z = (random() - 0.5) * 210;
        } while (!outside(x, z));
      }
      const species: TreeSpecies =
        i % 7 === 0 || i % 7 === 1 ? 'fir' : i % 3 === 0 ? 'oak' : 'birch';
      const scale = 0.65 + random() * 0.72,
        tint = new Color().setHSL(0.13, 0.035 + random() * 0.06, 0.7 + random() * 0.24);
      stands[species].push({
        matrix: transformAt(
          x,
          terrainHeight(x, z),
          z,
          scale,
          random() * Math.PI * 2,
          0.9 + random() * 0.25,
        ),
        color: tint,
      });
      if (i < 120) {
        rocks.push({
          matrix: transformAt(
            x + 1.8,
            terrainHeight(x + 1.8, z - 1.3) + 0.22,
            z - 1.3,
            0.3 + random() * 0.85,
            random() * 6,
            0.5 + random() * 0.3,
          ),
          color: new Color().setHSL(0.17, 0.07, 0.24 + random() * 0.16),
        });
        shrubs.push({
          matrix: transformAt(
            x - 1.3,
            terrainHeight(x - 1.3, z + 1.8) - 0.14,
            z + 1.8,
            0.1 + random() * 0.08,
            random() * 6,
            0.7,
          ),
          color: new Color('#81916c'),
        });
      }
    }
    for (let i = 0; i < (low ? 850 : 2100); i++) {
      let x: number, z: number;
      do {
        x = (random() - 0.5) * 142;
        z = (random() - 0.5) * 136;
      } while (!outside(x, z));
      const nearEdge = Math.abs(x) < 51 && Math.abs(z) < 53;
      grass.push({
        matrix: transformAt(x, terrainHeight(x, z), z, 0.7 + random() * 1.8, random() * 6),
      });
      if (i % (low ? 9 : 7) === 0 && nearEdge)
        ferns.push({
          matrix: transformAt(
            x + 0.4,
            terrainHeight(x + 0.4, z),
            z,
            0.6 + random() * 0.9,
            random() * 6,
          ),
          color: new Color().setHSL(0.23, 0.2, 0.23 + random() * 0.14),
        });
    }
    return { stands, grass, ferns, rocks, shrubs };
  }, [low]);
  const assets = useMemo(() => {
    const rock = new IcosahedronGeometry(1, 1),
      pos = rock.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i),
        r = 1 + Math.sin(x * 12 + z * 8 + y * 5) * 0.14;
      pos.setXYZ(i, x * r, y * r, z * r);
    }
    rock.computeVertexNormals();
    return {
      terrain: terrainGeometry(),
      ground: groundTexture(),
      grass: grassGeometry(),
      fern: fernGeometry(),
      rock,
      shrub: treeGeometry('oak', true),
      leaves: leafTexture('oak'),
    };
  }, []);
  useEffect(
    () => () => {
      assets.terrain.dispose();
      assets.ground.dispose();
      assets.grass.dispose();
      assets.fern.dispose();
      assets.rock.dispose();
      assets.shrub.wood.dispose();
      assets.shrub.foliage.dispose();
      assets.leaves.dispose();
    },
    [assets],
  );
  return (
    <group>
      <mesh geometry={assets.terrain} receiveShadow>
        <meshStandardMaterial
          map={assets.ground}
          bumpMap={assets.ground}
          bumpScale={0.13}
          roughness={1}
          color="#a5aa8b"
        />
      </mesh>
      {(['birch', 'oak', 'fir'] as TreeSpecies[]).map((species) => (
        <TreeStand key={species} species={species} instances={layout.stands[species]} low={low} />
      ))}
      <Instances geometry={assets.grass} instances={layout.grass}>
        <meshStandardMaterial vertexColors side={DoubleSide} roughness={1} />
      </Instances>
      <Instances geometry={assets.fern} instances={layout.ferns}>
        <meshStandardMaterial side={DoubleSide} roughness={0.94} />
      </Instances>
      <Instances geometry={assets.rock} instances={layout.rocks} shadows={!low}>
        <meshStandardMaterial
          map={assets.ground}
          bumpMap={assets.ground}
          bumpScale={0.19}
          roughness={0.96}
        />
      </Instances>
      <Instances geometry={assets.shrub.foliage} instances={layout.shrubs}>
        <meshStandardMaterial
          map={assets.leaves}
          alphaTest={0.48}
          side={DoubleSide}
          roughness={0.95}
        />
      </Instances>
    </group>
  );
}

export function Planter({ position }: { position: Vec3 }) {
  const assets = useMemo(
    () => ({
      ...treeGeometry('birch', true),
      leaves: leafTexture('birch'),
      pot: new LatheGeometry(
        [
          new Vector2(0.51, 0),
          new Vector2(0.55, 0.05),
          new Vector2(0.59, 0.16),
          new Vector2(0.69, 0.87),
          new Vector2(0.69, 0.95),
          new Vector2(0.63, 0.97),
          new Vector2(0.61, 0.87),
          new Vector2(0.51, 0.12),
        ],
        40,
      ),
    }),
    [],
  );
  useEffect(() => () => Object.values(assets).forEach((asset) => asset.dispose()), [assets]);
  return (
    <group position={position}>
      <mesh geometry={assets.pot} castShadow receiveShadow>
        <meshStandardMaterial color="#a7a28f" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.925, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.61, 32]} />
        <meshStandardMaterial color="#393b2c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.68, 0.012, 6, 40]} />
        <meshStandardMaterial color="#91815d" roughness={0.32} metalness={0.7} />
      </mesh>
      <group
        position={[0, 0.89, 0]}
        scale={[0.18, 0.18, 0.18]}
        rotation={[0, position[0] * 0.3, 0]}
      >
        <mesh geometry={assets.wood} castShadow receiveShadow>
          <meshStandardMaterial color="#6f6851" roughness={0.92} />
        </mesh>
        <mesh geometry={assets.foliage} castShadow receiveShadow>
          <meshStandardMaterial
            map={assets.leaves}
            color="#b7bda2"
            alphaTest={0.48}
            side={DoubleSide}
            roughness={0.84}
          />
        </mesh>
      </group>
    </group>
  );
}
