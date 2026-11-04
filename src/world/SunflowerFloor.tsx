import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D, Shape, ShapeGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAIN_GALLERY } from './galleryLayout';

/** Original stone-and-brass marquetry, flush with the floor and fully walkable. */
export function SunflowerFloor() {
  const seeds = useRef<InstancedMesh>(null!);
  const petals = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 1.28);
    shape.bezierCurveTo(-0.43, 2.1, -0.77, 3.18, -0.29, 4.42);
    shape.quadraticCurveTo(-0.1, 4.94, 0, 5.35);
    shape.bezierCurveTo(0.23, 4.62, 0.72, 3.47, 0.49, 2.67);
    shape.quadraticCurveTo(0.35, 1.84, 0, 1.28);
    const base = new ShapeGeometry(shape, 20);
    const groups = [[], [], []] as ShapeGeometry[][];
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < 24; i++) {
        const part = base.clone();
        const scale = (layer ? 0.83 : 1) * (0.97 + Math.sin(i * 2.4) * 0.03);
        part.scale(scale, scale, 1);
        part.rotateZ((i / 24) * Math.PI * 2 + (layer * Math.PI) / 24);
        part.translate(0, 0, layer * 0.001);
        groups[(i + layer) % 3].push(part);
      }
    }
    const geometries = groups.map((parts) => {
      const merged = mergeGeometries(parts)!;
      parts.forEach((part) => part.dispose());
      return merged;
    });
    base.dispose();
    return geometries;
  }, []);
  useEffect(() => () => petals.forEach((g) => g.dispose()), [petals]);
  useLayoutEffect(() => {
    const dummy = new Object3D(),
      color = new Color();
    for (let i = 0; i < 610; i++) {
      const radius = Math.sqrt((i + 0.5) / 610) * 1.72;
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.005);
      dummy.rotation.set(0, 0, angle + 0.4);
      dummy.scale.set(0.038, 0.065, 1);
      dummy.updateMatrix();
      seeds.current.setMatrixAt(i, dummy.matrix);
      seeds.current.setColorAt(
        i,
        color.setHSL(0.105 + (i % 5) * 0.005, 0.35, 0.27 + (i % 7) * 0.045),
      );
    }
    seeds.current.instanceMatrix.needsUpdate = true;
    seeds.current.instanceColor!.needsUpdate = true;
    seeds.current.computeBoundingSphere();
  }, []);
  return (
    <group position={MAIN_GALLERY.sunflower} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <circleGeometry args={[6.15, 128]} />
        <meshStandardMaterial color="#d8d0bb" roughness={0.58} />
      </mesh>
      {[6.12, 5.78].map((radius) => (
        <mesh key={radius} position={[0, 0, 0.001]} receiveShadow>
          <ringGeometry args={[radius - 0.018, radius, 128]} />
          <meshStandardMaterial color="#a07c3f" metalness={0.62} roughness={0.4} />
        </mesh>
      ))}
      {petals.map((geometry, i) => (
        <mesh key={i} geometry={geometry} position={[0, 0, 0.002]} receiveShadow>
          <meshStandardMaterial
            color={['#cfa23d', '#e1b54c', '#b98428'][i]}
            roughness={0.55}
            metalness={0.12}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.006]} receiveShadow>
        <circleGeometry args={[1.84, 96]} />
        <meshStandardMaterial color="#493621" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.007]} receiveShadow>
        <ringGeometry args={[1.8, 1.84, 96]} />
        <meshStandardMaterial color="#b38b47" metalness={0.55} roughness={0.45} />
      </mesh>
      <instancedMesh
        ref={seeds}
        args={[undefined, undefined, 610]}
        position={[0, 0, 0.005]}
        receiveShadow
      >
        <circleGeometry args={[1, 7]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
    </group>
  );
}
