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
      boxes.push({
        position: [x, wall.size[1] / 2, z - 0.34],
        size: [5.1, wall.size[1] - 0.6, 0.04],
        finish: 1,
      });
    }
    // Layered ceiling coffers flank the open barrel skylight. All trim stays in
    // the existing four static batches; luminous edges are materials, not lights.
    for (const x of [-3.4, 23.4]) {
      for (const z of [-18.1, -30, -41.9]) {
        for (const side of [-1, 1]) {
          boxes.push({ position: [x + side * 5.8, 8.94, z], size: [0.22, 0.36, 11.4], finish: 0 });
          boxes.push({ position: [x, 8.94, z + side * 5.6], size: [11.8, 0.36, 0.22], finish: 0 });
          boxes.push({
            position: [x + side * 5.58, 9.02, z],
            size: [0.045, 0.05, 10.9],
            finish: 2,
          });
          boxes.push({
            position: [x, 9.02, z + side * 5.38],
            size: [11.15, 0.05, 0.045],
            finish: 2,
          });
          boxes.push({
            position: [x, 9.08, z + side * 5.25],
            size: [10.7, 0.025, 0.035],
            finish: 3,
          });
        }
      }
    }
    // A quiet limestone portrait bay with narrow fluted sides, below the memorial title.
    boxes.push({ position: [10, 3.3, -47.78], size: [5.2, 4.9, 0.08], finish: 1 });
    for (const x of [7.2, 12.8]) {
      boxes.push({ position: [x, 3.1, -47.64], size: [0.62, 4.6, 0.26], finish: 0 });
      for (let i = -2; i <= 2; i++)
        boxes.push({ position: [x + i * 0.1, 3.1, -47.49], size: [0.034, 4.35, 0.035], finish: 2 });
    }
    boxes.push({ position: [10, 0.8, -47.64], size: [6.25, 0.12, 0.3], finish: 1 });
    boxes.push({ position: [10, 5.42, -47.64], size: [6.25, 0.1, 0.3], finish: 0 });
    // Low wall panelling adds depth beneath the art without competing with it.
    for (const x of [-4, 3, 17, 24]) {
      boxes.push({ position: [x, 0.6, -47.77], size: [5.8, 0.95, 0.08], finish: 1 });
      boxes.push({ position: [x, 1.1, -47.7], size: [5.8, 0.035, 0.025], finish: 2 });
    }
    for (const x of [-9.76, 29.76]) {
      const zs = x < 0 ? [-33.5, -40.5, -45.7] : [-22, -30, -37, -44];
      for (const z of zs) {
        boxes.push({ position: [x, 0.6, z], size: [0.08, 0.95, 3.5], finish: 1 });
        boxes.push({
          position: [x + (x < 0 ? 0.05 : -0.05), 1.1, z],
          size: [0.025, 0.035, 3.5],
          finish: 2,
        });
      }
    }
    // Flush stone borders and slim brass inlays frame the oak and sunflower.
    for (const x of [-9.25, 29.25]) {
      boxes.push({ position: [x, -0.03, -30], size: [1, 0.008, 35.1], finish: 1 });
      boxes.push({
        position: [x + (x < 0 ? 0.51 : -0.51), -0.024, -30],
        size: [0.018, 0.004, 35.1],
        finish: 2,
      });
    }
    boxes.push({ position: [10, -0.03, -47.2], size: [38, 0.008, 1], finish: 1 });
    boxes.push({ position: [10, -0.024, -46.68], size: [37, 0.004, 0.018], finish: 2 });
    for (const x of [3.65, 16.35])
      boxes.push({ position: [x, -0.026, -32], size: [0.025, 0.004, 27], finish: 2 });
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
      new MeshStandardMaterial({ color: '#8a7350', roughness: 0.4, metalness: 0.6 }),
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
    <group name="Main gallery architectural details">
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
