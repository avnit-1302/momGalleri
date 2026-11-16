import { useEffect, useMemo } from 'react';
import { BoxGeometry, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Vec3 } from '../content/museumContent';
import { galleryPartitions, galleryPiers } from './galleryLayout';

/** Merged static details: deep coffers, limestone pier feet and bronze shadow reveals. */
export function GalleryDetails() {
  const assets = useMemo(() => {
    const boxes: { position: Vec3; size: Vec3; finish: number }[] = [];
    for (const z of [-24, -37.5]) {
      boxes.push({ position: [10, 8.7, z], size: [39, 0.65, 0.8], finish: 0 });
      boxes.push({ position: [10, 8.34, z], size: [38.6, 0.025, 0.045], finish: 2 });
    }
    for (const pier of galleryPiers) {
      const [x, , z] = pier.position,
        [w, , d] = pier.size;
      boxes.push({ position: [x, 0.32, z], size: [w + 0.08, 0.64, d + 0.08], finish: 1 });
      boxes.push({ position: [x, 0.67, z], size: [w + 0.025, 0.035, d + 0.025], finish: 2 });
    }
    for (const wall of galleryPartitions) {
      const [x, , z] = wall.position;
      boxes.push({ position: [x, wall.size[1] + 0.04, z], size: [5.72, 0.08, 0.76], finish: 1 });
      // Recessed limestone back panel gives both faces a considered finish.
      boxes.push({ position: [x, wall.size[1] / 2, z - 0.34], size: [5.1, wall.size[1] - 0.6, 0.04], finish: 1 });
    }
    // Long recessed tracks and warm luminous apertures; no additional real-time lights.
    for (const x of [-5, 25]) {
      boxes.push({ position: [x, 9.12, -30], size: [0.13, 0.025, 34], finish: 2 });
      for (const z of [-19, -27, -35, -43])
        boxes.push({ position: [x, 9.09, z], size: [0.07, 0.02, 0.8], finish: 3 });
    }
    const geometries = [0, 1, 2, 3].map((finish) => {
      const parts = boxes
        .filter((box) => box.finish === finish)
        .map((box) => {
          const geometry = new BoxGeometry(...box.size);
          geometry.translate(...box.position);
          return geometry;
        });
      const result = mergeGeometries(parts)!;
      parts.forEach((part) => part.dispose());
      return result;
    });
    const materials = [
      new MeshStandardMaterial({ color: '#e5dfd1', roughness: 0.86 }),
      new MeshStandardMaterial({ color: '#c8c0ac', roughness: 0.65 }),
      new MeshStandardMaterial({ color: '#514a3c', roughness: 0.48, metalness: 0.55 }),
      new MeshStandardMaterial({ color: '#fff1cf', emissive: '#fff0c7', emissiveIntensity: 1.3 }),
    ];
    return { geometries, materials };
  }, []);
  useEffect(
    () => () => {
      assets.geometries.forEach((g) => g.dispose());
      assets.materials.forEach((m) => m.dispose());
    },
    [assets],
  );
  return (
    <group>
      {assets.geometries.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={assets.materials[i]}
          castShadow={i < 2}
          receiveShadow
        />
      ))}
    </group>
  );
}
