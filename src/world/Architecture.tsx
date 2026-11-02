import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';
import { museumContent, type Vec3 } from '../content/museumContent';
import { benches, planters, rooms, walls } from './layout';
import { stoneTexture, textTexture } from './materials';
import { Planter } from './Nature';
import { Seahorse } from './Seahorse';

export function Sign({
  text,
  position,
  width = 8,
  height = 2,
  rotation = 0,
  color = '#715b37',
  serif = false,
}: {
  text: string;
  position: Vec3;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  serif?: boolean;
}) {
  const texture = useMemo(
    () => textTexture(text, color, undefined, serif, width / height),
    [text, color, serif, width, height],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
function Box({
  position,
  size,
  color = '#ddd4c1',
  metalness = 0,
}: {
  position: Vec3;
  size: Vec3;
  color?: string;
  metalness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={metalness ? 0.4 : 0.82}
        metalness={metalness}
      />
    </mesh>
  );
}
function Pool({ low }: { low: boolean }) {
  const water = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    if (water.current)
      (water.current.material as MeshStandardMaterial).roughness =
        0.22 + Math.sin(clock.elapsedTime * 0.55) * 0.035;
  });
  return (
    <group>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[4.1, 4.1, 0.24, 72]} />
        <meshStandardMaterial color="#b2aa96" roughness={0.7} />
      </mesh>
      <mesh ref={water} position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.92, 72]} />
        <meshStandardMaterial color="#648b83" metalness={0.52} roughness={0.23} />
      </mesh>
      {[2.25, 2.8, 3.45].map((r, i) => (
        <mesh key={r} position={[0, 0.27 + i * 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r, r + 0.016, 72]} />
          <meshBasicMaterial color="#afc3b4" transparent opacity={0.24} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.9, 0.74, 64]} />
        <meshStandardMaterial color="#e3d9c3" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.69, 1.76, 64]} />
        <meshStandardMaterial color="#ac8545" metalness={0.7} roughness={0.3} />
      </mesh>
      <Seahorse />
      {!low && (
        <spotLight
          position={[3, 9, 3]}
          angle={0.5}
          penumbra={1}
          intensity={180}
          distance={20}
          color="#fff1d2"
        />
      )}
    </group>
  );
}

export function Architecture({ low }: { low: boolean }) {
  const stone = useMemo(stoneTexture, []);
  useEffect(() => () => stone.dispose(), [stone]);
  return (
    <group>
      {rooms.map((room) => {
        const [x1, x2, z1, z2] = room.bounds;
        return (
          <group key={room.id}>
            <mesh
              position={[(x1 + x2) / 2, -0.05, (z1 + z2) / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[x2 - x1, z2 - z1]} />
              <meshStandardMaterial
                map={stone}
                color={room.id === 'sanctuary' ? '#fff8e9' : '#ffffff'}
                roughness={0.4}
                metalness={0.08}
              />
            </mesh>
            {/* Roof strips frame generous open skylights; glass sits above the beams. */}
            <Box position={[(x1 + x2) / 2, 8.15, z1 + 1.4]} size={[x2 - x1, 0.35, 2.8]} />
            <Box position={[(x1 + x2) / 2, 8.15, z2 - 1.4]} size={[x2 - x1, 0.35, 2.8]} />
            {Array.from({ length: Math.ceil((x2 - x1) / 4) }, (_, i) => (
              <Box
                key={i}
                position={[x1 + 2 + i * 4, 8.35, (z1 + z2) / 2]}
                size={[0.16, 0.35, z2 - z1]}
                color="#8c7859"
              />
            ))}
            <mesh position={[(x1 + x2) / 2, 8.6, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[x2 - x1, z2 - z1]} />
              <meshStandardMaterial
                color="#c5dbd5"
                transparent
                opacity={0.08}
                depthWrite={false}
                side={2}
                roughness={0.1}
              />
            </mesh>
          </group>
        );
      })}
      {walls.map((wall, i) => (
        <group key={i}>
          <mesh position={wall.position} receiveShadow castShadow={!wall.glass}>
            <boxGeometry args={wall.size} />
            <meshStandardMaterial
              color={wall.glass ? '#c5d9ce' : '#e5ddcd'}
              roughness={wall.glass ? 0.12 : 0.85}
              transparent={wall.glass}
              opacity={wall.glass ? 0.14 : 1}
              depthWrite={!wall.glass}
            />
          </mesh>
          {wall.glass ? (
            Array.from({ length: Math.ceil(Math.max(wall.size[0], wall.size[2]) / 3) }, (_, j) => {
              const horizontal = wall.size[0] > wall.size[2],
                len = Math.max(wall.size[0], wall.size[2]),
                offset = -len / 2 + j * 3;
              return (
                <Box
                  key={j}
                  position={[
                    wall.position[0] + (horizontal ? offset : 0),
                    4,
                    wall.position[2] + (!horizontal ? offset : 0),
                  ]}
                  size={[0.09, 8, 0.09]}
                  color="#706d59"
                  metalness={0.4}
                />
              );
            })
          ) : (
            <Box
              position={[wall.position[0], 0.16, wall.position[2]]}
              size={[wall.size[0] + 0.03, 0.3, wall.size[2] + 0.03]}
              color="#a6977a"
            />
          )}
        </group>
      ))}
      {/* Tall lintels make every doorway a real architectural opening. */}
      {[
        [-10, 0],
        [10, 0],
        [-10, -21],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} position={[x, 6.9, z]} size={[0.4, 2.2, 6]} />
      ))}
      {[
        [0, 12],
        [0, -12],
        [-20, -12],
        [20, -12],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} position={[x, 6.9, z]} size={[6, 2.2, 0.4]} />
      ))}
      {/* Oak fins and stone pillars give the atrium a warm, human scale. */}
      {[-8.8, 8.8].flatMap((x) =>
        [-10, 10].map((z) => (
          <group key={`${x}${z}`}>
            <mesh position={[x, 4.4, z]} castShadow>
              <cylinderGeometry args={[0.32, 0.4, 8.8, 16]} />
              <meshStandardMaterial color="#c5b798" />
            </mesh>
            <mesh position={[x, 0.15, z]}>
              <cylinderGeometry args={[0.48, 0.48, 0.3, 24]} />
              <meshStandardMaterial color="#ab9268" />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 12 }, (_, i) => (
          <Box
            key={`${side}${i}`}
            position={[side * (4.5 + i * 0.38), 4, 12.26]}
            size={[0.12, 6.9, 0.13]}
            color="#ad8b5e"
          />
        )),
      )}
      <Sign
        text={museumContent.exhibitionTitle}
        position={[0, 6.7, 12.24]}
        width={13}
        height={1.5}
        serif
      />
      <Sign
        text="ETT ETTER ETT BLIR ØYEBLIKKENE ET LIV."
        position={[-9.84, 4.3, 21]}
        rotation={Math.PI / 2}
        width={9}
        height={1.4}
      />
      <Sign
        text="VELKOMMEN TIL DIN EGEN UTSTILLING"
        position={[-9.83, 3.5, 21]}
        rotation={Math.PI / 2}
        width={7}
        height={1}
      />
      <Sign
        text="03   DE FØRSTE KAPITLENE"
        position={[-9.77, 6.6, 0]}
        rotation={Math.PI / 2}
        width={5.5}
        height={1}
      />
      <Sign
        text="04   LIVET VI DELER"
        position={[9.77, 6.6, 0]}
        rotation={-Math.PI / 2}
        width={5.5}
        height={1}
      />
      <Sign text="06   TIL DEG, MAMMA" position={[0, 6.65, -11.76]} width={5.8} height={1} />
      <Sign text="05   HJERTET I FAMILIEN" position={[-20, 6.65, -11.76]} width={5.8} height={1} />
      <Pool low={low} />
      <Sign
        text={'SJØHESTEN\nEn skulptur i lys og bronse'}
        position={[0, 0.65, 4.12]}
        width={2.4}
        height={0.65}
      />
      {benches.map((p, i) => (
        <group key={i} position={p}>
          <Box position={[0, 0, 0]} size={[3.6, 0.18, 1.1]} color="#a88a5e" />
          {[-1.3, 1.3].map((x) => (
            <Box key={x} position={[x, -0.2, 0]} size={[0.22, 0.4, 0.8]} color="#8a806b" />
          ))}
        </group>
      ))}
      {planters.map((p, i) => (
        <Planter key={i} position={p} />
      ))}
      {/* Elevated Ik Onkar, separate from the portrait and walking surfaces. */}
      <Sign text="ੴ" position={[-20, 7.05, -29.72]} width={3} height={2.1} color="#a07d3b" serif />
      <Sign
        text={museumContent.mother.tributeHeading}
        position={[-20, 5.9, -29.7]}
        width={10}
        height={1.25}
        serif
      />
      <Sign
        text="KJÆRLIGHET · TAKKNEMLIGHET · SAMHØRIGHET"
        position={[-20, 0.9, -29.7]}
        width={9}
        height={0.8}
      />
      {[-23, -17].map((x) => (
        <group key={x}>
          <Box
            position={[x, 3.9, -29.5]}
            size={[0.08, 6.4, 0.08]}
            color="#b29359"
            metalness={0.7}
          />
          <mesh position={[x, 0.65, -28]}>
            <cylinderGeometry args={[0.3, 0.22, 1.3, 20]} />
            <meshStandardMaterial color="#d4c8ae" />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh
              key={i}
              position={[
                x + Math.sin(i * 2.4) * 0.25,
                1.45 + (i % 2) * 0.15,
                -28 + Math.cos(i * 2.4) * 0.25,
              ]}
            >
              <icosahedronGeometry args={[0.19, 1]} />
              <meshStandardMaterial color="#f4e8cf" />
            </mesh>
          ))}
        </group>
      ))}
      <Sign
        text={museumContent.celebrationTitle}
        position={[10, 6.8, -29.7]}
        width={17}
        height={2}
        serif
      />
      <Sign
        text="ALLE MINNENE VI ENNÅ SKAL SKAPE"
        position={[10, 5.7, -29.7]}
        width={12}
        height={1}
      />
      {/* Suspended golden discs, like an architectural mobile, in the final room. */}
      {Array.from({ length: 13 }, (_, i) => (
        <group
          key={i}
          position={[-5 + i * 2.4, 6.6 + Math.sin(i) * 0.6, -21 + Math.cos(i * 2) * 3]}
        >
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.6, 4]} />
            <meshStandardMaterial color="#b79d6c" />
          </mesh>
          <mesh rotation={[0.2, i * 0.4, 0.3]}>
            <torusGeometry args={[0.32 + (i % 3) * 0.12, 0.025, 6, 28]} />
            <meshStandardMaterial color="#b59148" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
