import { useEffect, useMemo } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix4,
  MeshStandardMaterial,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { wallDecor } from './wallDecorLayout';

/** Six distinct arrangements share five static batches and the existing museum finishes. */
export function WallDecor({
  stone,
  wood,
  bronze,
  dark,
}: {
  stone: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  bronze: MeshStandardMaterial;
  dark: MeshStandardMaterial;
}) {
  const assets = useMemo(() => {
    const batches: BufferGeometry[][] = Array.from({ length: 5 }, () => []);
    for (const { position, rotation, kind } of wallDecor) {
      const transform = new Matrix4().makeRotationY(rotation).setPosition(...position);
      const add = (
        geometry: BufferGeometry,
        finish: number,
        x: number,
        y: number,
        z: number,
        angle = 0,
      ) => {
        geometry.rotateZ(angle).translate(x, y, z).applyMatrix4(transform);
        const flat = geometry.index ? geometry.toNonIndexed() : geometry;
        if (flat !== geometry) geometry.dispose();
        batches[finish].push(flat);
      };
      const box = (
        finish: number,
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
      ) => add(new BoxGeometry(w, h, d), finish, x, y, z);
      const curve = (points: number[][], radius = 0.018, finish = 2) =>
        add(
          new TubeGeometry(
            new CatmullRomCurve3(
              points.map((p) => new Vector3(...(p as [number, number, number]))),
            ),
            24,
            radius,
            6,
            false,
          ),
          finish,
          0,
          0,
          0,
        );
      const ring = (x: number, y: number, z: number, radius: number, tube = 0.025, finish = 2) =>
        add(new TorusGeometry(radius, tube, 8, 48), finish, x, y, z);
      const vase = (x: number, y: number, scale = 1, finish = 4) => {
        const points = [
          [0.13, 0],
          [0.21, 0.04],
          [0.24, 0.3],
          [0.2, 0.48],
          [0.095, 0.64],
          [0.09, 0.74],
          [0.065, 0.74],
          [0.065, 0.67],
        ];
        add(
          new LatheGeometry(
            points.map(([r, h]) => new Vector2(r * scale, h * scale)),
            24,
          ),
          finish,
          x,
          y,
          0.38,
        );
      };
      const bowl = (x: number, y: number, scale = 1, finish = 4) => {
        const points = [
          [0.12, 0],
          [0.19, 0.035],
          [0.3, 0.18],
          [0.31, 0.23],
          [0.285, 0.23],
          [0.26, 0.17],
          [0.1, 0.035],
        ];
        add(
          new LatheGeometry(
            points.map(([r, h]) => new Vector2(r * scale, h * scale)),
            24,
          ),
          finish,
          x,
          y,
          0.38,
        );
      };
      const plinth = (x: number, height: number, width: number) => {
        box(0, x, height / 2, 0.38, width, height, 0.68);
        box(3, x, 0.035, 0.38, width - 0.08, 0.07, 0.6);
      };
      if (kind === 'botanical') {
        // One botanical relief remains, with its own slim console.
        box(3, 0, 3.5, 0.018, 2.7, 2.9, 0.035);
        box(2, 0, 3.5, 0.045, 2.62, 2.82, 0.035);
        box(0, 0, 3.5, 0.074, 2.55, 2.75, 0.04);
        const stem = new CatmullRomCurve3([
          new Vector3(-0.13, 2.38, 0.14),
          new Vector3(0.08, 3.3, 0.14),
          new Vector3(-0.03, 3.95, 0.14),
          new Vector3(0.18, 4.56, 0.14),
        ]);
        add(new TubeGeometry(stem, 18, 0.016, 5, false), 2, 0, 0, 0);
        for (let tier = 0; tier < 6; tier++) {
          const origin = stem.getPoint(0.1 + tier * 0.145),
            length = 0.44 - tier * 0.016;
          for (const side of [-1, 1]) {
            const leaf = new Shape();
            leaf.moveTo(0, 0);
            leaf.bezierCurveTo(-0.14, length * 0.3, -0.09, length * 0.75, 0, length);
            leaf.bezierCurveTo(0.09, length * 0.75, 0.14, length * 0.3, 0, 0);
            add(
              new ExtrudeGeometry(leaf, { depth: 0.022, bevelEnabled: false, curveSegments: 6 }),
              2,
              origin.x,
              origin.y,
              origin.z,
              side * (0.85 + tier * 0.035),
            );
          }
        }
        box(1, 0, 1.08, 0.38, 3.4, 0.12, 0.72);
        box(3, 0, 0.995, 0.38, 3.16, 0.05, 0.59);
        for (const x of [-1.35, 1.35]) box(0, x, 0.49, 0.38, 0.16, 0.98, 0.6);
        vase(-0.9, 1.14);
        bowl(0.85, 1.14);
      } else if (kind === 'orbits') {
        // Open circular wall sculpture, with a single sculptural object on a pedestal.
        ring(-0.5, 3.45, 0.13, 0.78, 0.035);
        ring(0.45, 3.9, 0.19, 0.64, 0.03);
        ring(0.46, 2.95, 0.12, 0.44, 0.023);
        plinth(0, 1.05, 0.9);
        box(2, 0, 1.08, 0.38, 0.55, 0.06, 0.42);
        const sculpture = new TorusGeometry(0.3, 0.075, 10, 40);
        sculpture.scale(0.8, 1.35, 1).rotateY(0.3);
        add(sculpture, 2, 0, 1.58, 0.38, -0.25);
      } else if (kind === 'ceramics') {
        // Asymmetric floating shelves and a collection of differently sized vessels.
        box(0, 0, 2.8, 0.045, 2.8, 3.8, 0.065);
        box(1, -0.5, 1.62, 0.38, 2.1, 0.1, 0.6);
        box(1, 0.5, 3.02, 0.38, 2.1, 0.1, 0.6);
        vase(-1.02, 1.67, 0.85);
        bowl(-0.12, 1.67, 0.85, 2);
        vase(0.12, 3.07, 1.1);
        vase(0.95, 3.07, 0.65, 2);
      } else if (kind === 'waves') {
        // Wide horizontal landscape relief and an unadorned low oak bench.
        box(3, 0, 3.5, 0.025, 3.5, 1.95, 0.045);
        box(0, 0, 3.5, 0.068, 3.4, 1.85, 0.065);
        for (let row = 0; row < 4; row++) {
          const y = 2.91 + row * 0.34;
          curve(
            [
              [-1.48, y, 0.14],
              [-0.8, y + 0.13, 0.17],
              [0, y - 0.07, 0.14],
              [0.8, y + 0.13, 0.17],
              [1.48, y + 0.04, 0.14],
            ],
            0.024,
          );
        }
        box(1, 0, 0.49, 0.38, 3.4, 0.14, 0.72);
        for (const x of [-1.23, 1.23]) box(0, x, 0.21, 0.38, 0.22, 0.42, 0.62);
      } else if (kind === 'sunburst') {
        // Round sun motif, paired with two staggered stone display blocks.
        const disc = new CylinderGeometry(0.65, 0.65, 0.06, 48);
        disc.rotateX(Math.PI / 2);
        add(disc, 0, 0, 3.6, 0.1);
        ring(0, 3.6, 0.14, 0.7, 0.025);
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2,
            length = i % 2 ? 0.24 : 0.42;
          add(
            new BoxGeometry(0.025, length, 0.025),
            2,
            Math.sin(a) * (0.82 + length / 2),
            3.6 + Math.cos(a) * (0.82 + length / 2),
            0.13,
            -a,
          );
        }
        plinth(-0.62, 0.95, 0.8);
        plinth(0.62, 0.58, 0.8);
        bowl(-0.62, 0.95, 1.05);
        bowl(0.62, 0.58, 0.8, 2);
      } else {
        // A tall reed sculpture against oak fins, rooted in a stone trough.
        for (let i = 0; i < 11; i++) {
          const h = 3.7 + Math.sin(i * 0.45) * 0.4;
          box(1, (i - 5) * 0.23, h / 2 + 0.35, 0.065, 0.075, h, 0.1);
        }
        box(0, 0, 0.34, 0.38, 2.3, 0.68, 0.72);
        box(3, 0, 0.685, 0.38, 2.1, 0.025, 0.53);
        for (let i = 0; i < 7; i++) {
          const x = (i - 3) * 0.25,
            h = 2.05 + (i % 3) * 0.37,
            bend = Math.sin(i * 1.7) * 0.22;
          curve(
            [
              [x, 0.69, 0.38],
              [x + bend * 0.3, h * 0.65, 0.4],
              [x + bend, h, 0.38],
            ],
            0.018,
          );
          add(
            new LatheGeometry(
              [
                new Vector2(0.012, 0),
                new Vector2(0.065, 0.08),
                new Vector2(0.055, 0.34),
                new Vector2(0.005, 0.4),
              ],
              12,
            ),
            2,
            x + bend,
            h,
            0.38,
          );
        }
      }
    }
    const geometries = batches.map((parts) => {
      const merged = mergeGeometries(parts)!;
      parts.forEach((geometry) => geometry.dispose());
      return merged;
    });
    return { geometries, ceramic: new MeshStandardMaterial({ color: '#e9dfcc', roughness: 0.62 }) };
  }, []);
  useEffect(
    () => () => {
      assets.geometries.forEach((g) => g.dispose());
      assets.ceramic.dispose();
    },
    [assets],
  );
  const materials = [stone, wood, bronze, dark, assets.ceramic];
  return (
    <group name="Gallery wall decor">
      {assets.geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={materials[i]} castShadow receiveShadow />
      ))}
    </group>
  );
}
