import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import type { Vec3 } from '../content/museumContent';

export function Forest({ low }: { low: boolean }) {
  const trunks = useRef<InstancedMesh>(null!),
    crowns = useRef<InstancedMesh>(null!),
    bushes = useRef<InstancedMesh>(null!),
    rocks = useRef<InstancedMesh>(null!),
    moss = useRef<InstancedMesh>(null!);
  const trees = useMemo(() => {
    let seed = 43;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: low ? 140 : 260 }, () => {
      let x = 0,
        z = 0;
      do {
        x = (random() - 0.5) * 170;
        z = (random() - 0.5) * 160;
      } while (x > -34 && x < 34 && z > -35 && z < 33);
      return { x, z, h: 8 + random() * 12, r: 2 + random() * 2.5, color: random() };
    });
  }, [low]);
  useLayoutEffect(() => {
    const d = new Object3D(),
      color = new Color();
    trees.forEach((tree, i) => {
      d.position.set(tree.x, tree.h / 2, tree.z);
      d.scale.set(0.2 + tree.r * 0.06, tree.h, 0.2 + tree.r * 0.06);
      d.rotation.set(0, tree.color * 6, 0.02);
      d.updateMatrix();
      trunks.current.setMatrixAt(i, d.matrix);
      for (let j = 0; j < 3; j++) {
        d.position.set(
          tree.x + Math.sin(j * 2) * tree.r * 0.5,
          tree.h * 0.64 + j * tree.r * 0.4,
          tree.z + Math.cos(j * 2) * tree.r * 0.5,
        );
        d.scale.set(tree.r, tree.r * (1.1 + j * 0.12), tree.r);
        d.updateMatrix();
        crowns.current.setMatrixAt(i * 3 + j, d.matrix);
        crowns.current.setColorAt(
          i * 3 + j,
          color.setHSL(0.23 + tree.color * 0.08, 0.17 + tree.color * 0.1, 0.19 + tree.color * 0.13),
        );
      }
      d.position.set(tree.x + 2, 0.7, tree.z - 1);
      d.scale.set(1.8, 0.9, 1.3);
      d.updateMatrix();
      bushes.current.setMatrixAt(i, d.matrix);
      d.position.set(tree.x - 1.5, 0.25, tree.z + 2);
      d.scale.set(0.6 + tree.color, 0.45 + tree.color * 0.3, 0.8 + tree.color);
      d.updateMatrix();
      rocks.current.setMatrixAt(i, d.matrix);
      d.position.y += 0.25;
      d.scale.y *= 0.65;
      d.scale.x *= 0.92;
      d.updateMatrix();
      moss.current.setMatrixAt(i, d.matrix);
    });
    [trunks, crowns, bushes, rocks, moss].forEach((ref) => {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    });
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;
  }, [trees]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#75816a" roughness={1} />
      </mesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.75, 1, 1, 6]} />
        <meshStandardMaterial color="#706453" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, trees.length * 3]}>
        <icosahedronGeometry args={[1, low ? 1 : 2]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={bushes} args={[undefined, undefined, trees.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#526b46" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, trees.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#777a6e" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={moss} args={[undefined, undefined, trees.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#65734e" roughness={1} />
      </instancedMesh>
    </group>
  );
}

export function Planter({ position }: { position: Vec3 }) {
  const stems = useRef<InstancedMesh>(null!),
    leaves = useRef<InstancedMesh>(null!);
  useLayoutEffect(() => {
    const object = new Object3D(),
      color = new Color();
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4;
      object.position.set(0.12 * Math.cos(angle), 1.42, -0.12 * Math.sin(angle));
      object.rotation.set(0, angle, -0.2 - i * 0.035);
      object.scale.set(1, 1, 1);
      object.updateMatrix();
      stems.current.setMatrixAt(i, object.matrix);
      object.position.set(0.38 * Math.cos(angle), 1.77 + (i % 3) * 0.15, -0.38 * Math.sin(angle));
      object.rotation.set(0, angle + 0.2, 0.6);
      object.scale.set(0.24, 0.75, 0.07);
      object.updateMatrix();
      leaves.current.setMatrixAt(i, object.matrix);
      leaves.current.setColorAt(i, color.set(i % 2 ? '#546b45' : '#78905c'));
    }
    stems.current.instanceMatrix.needsUpdate = true;
    leaves.current.instanceMatrix.needsUpdate = true;
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;
    stems.current.computeBoundingSphere();
    leaves.current.computeBoundingSphere();
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.77, 0.63, 0.8, 20]} />
        <meshStandardMaterial color="#a9a38e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.69, 20]} />
        <meshStandardMaterial color="#4e5140" />
      </mesh>
      <instancedMesh ref={stems} args={[undefined, undefined, 9]}>
        <cylinderGeometry args={[0.015, 0.025, 1.5, 5]} />
        <meshStandardMaterial color="#63724d" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, 9]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
