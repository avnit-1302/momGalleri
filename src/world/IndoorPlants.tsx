import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { planters } from './layout';

function leafSurface() {
  const geometry = new BufferGeometry(),
    vertices: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= 8; row++)
    for (let col = 0; col <= 4; col++) {
      const t = row / 8,
        across = col / 2 - 1;
      vertices.push(
        across * Math.sin(Math.PI * t) * 0.24,
        t * 0.8,
        Math.sin(t * Math.PI) * 0.09 - across * across * Math.sin(t * Math.PI) * 0.07,
      );
      uv.push(col / 4, t);
      if (row < 8 && col < 4) {
        const a = row * 5 + col;
        indices.push(a, a + 1, a + 5, a + 1, a + 6, a + 5);
      }
    }
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#263d1e');
  gradient.addColorStop(0.48, '#667b39');
  gradient.addColorStop(0.52, '#425e28');
  gradient.addColorStop(1, '#233c20');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#91a35d';
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.stroke();
  for (let y = 12; y < 250; y += 19)
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(128, y);
      ctx.quadraticCurveTo(128 + side * 45, y - 10, 128 + side * 120, y - 60);
      ctx.stroke();
    }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** All ten ficus plants share four draw calls and a single 256px leaf texture. */
export function IndoorPlants() {
  const leaves = useRef<InstancedMesh>(null!),
    pots = useRef<InstancedMesh>(null!),
    soil = useRef<InstancedMesh>(null!);
  const assets = useMemo(() => {
    const matrices: Matrix4[] = [],
      colors: Color[] = [],
      branches: CylinderGeometry[] = [];
    const dummy = new Object3D(),
      up = new Vector3(0, 1, 0);
    const branch = (a: Vector3, b: Vector3, radius: number) => {
      const direction = b.clone().sub(a);
      const g = new CylinderGeometry(radius * 0.5, radius, direction.length(), 5);
      dummy.position.copy(a).add(b).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(up, direction.normalize());
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      g.applyMatrix4(dummy.matrix);
      branches.push(g);
    };
    planters.forEach(([x, , z], p) => {
      for (let stem = 0; stem < 3; stem++) {
        const angle = stem * 2.1 + p,
          height = 2.35 + stem * 0.17;
        const base = new Vector3(x, 0.78, z),
          top = new Vector3(x + Math.cos(angle) * 0.22, height, z + Math.sin(angle) * 0.22);
        branch(base, top, 0.025);
        for (let tier = 0; tier < 7; tier++) {
          const a = angle + tier * 2.4,
            y = 1.15 + tier * 0.18;
          const start = base.clone().lerp(top, (y - 0.78) / (height - 0.78));
          const tip = start.clone().add(new Vector3(Math.cos(a) * 0.36, 0.16, Math.sin(a) * 0.36));
          branch(start, tip, 0.008);
          for (let leaf = 0; leaf < 3; leaf++) {
            dummy.position
              .copy(tip)
              .add(new Vector3(Math.cos(a + leaf) * 0.06, leaf * 0.05, Math.sin(a + leaf) * 0.06));
            dummy.rotation.set(0.5 + leaf * 0.38, a + leaf * 1.7, 0.2 * Math.sin(tier));
            dummy.scale.setScalar(0.7 + ((tier * 3 + leaf + p) % 6) * 0.065);
            dummy.updateMatrix();
            matrices.push(dummy.matrix.clone());
            colors.push(new Color().setHSL(0.24, 0.14, 0.65 + (tier % 3) * 0.08));
          }
        }
      }
    });
    const stems = mergeGeometries(branches)!;
    branches.forEach((g) => g.dispose());
    const texture = leafTexture();
    return {
      matrices,
      colors,
      stems,
      leaf: leafSurface(),
      texture,
      pot: new LatheGeometry(
        [
          new Vector2(0.39, 0),
          new Vector2(0.43, 0.06),
          new Vector2(0.53, 0.8),
          new Vector2(0.53, 0.86),
          new Vector2(0.48, 0.86),
          new Vector2(0.47, 0.78),
          new Vector2(0.38, 0.1),
        ],
        24,
      ),
      soil: new CylinderGeometry(0.47, 0.47, 0.025, 24),
      foliage: new MeshStandardMaterial({ map: texture, roughness: 0.49, side: DoubleSide }),
      ceramic: new MeshStandardMaterial({ color: '#c8c1af', roughness: 0.77 }),
      bark: new MeshStandardMaterial({ color: '#75674d', roughness: 0.95 }),
      earth: new MeshStandardMaterial({ color: '#343027', roughness: 1 }),
    };
  }, []);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    assets.matrices.forEach((matrix, i) => {
      leaves.current.setMatrixAt(i, matrix);
      leaves.current.setColorAt(i, assets.colors[i]);
    });
    planters.forEach(([x, , z], i) => {
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      pots.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.79;
      dummy.updateMatrix();
      soil.current.setMatrixAt(i, dummy.matrix);
    });
    for (const mesh of [leaves.current, pots.current, soil.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    leaves.current.instanceColor!.needsUpdate = true;
  }, [assets]);
  useEffect(
    () => () => {
      assets.stems.dispose();
      assets.leaf.dispose();
      assets.texture.dispose();
      assets.pot.dispose();
      assets.soil.dispose();
      assets.foliage.dispose();
      assets.ceramic.dispose();
      assets.bark.dispose();
      assets.earth.dispose();
    },
    [assets],
  );
  return (
    <group name="Indoor ficus collection">
      <instancedMesh
        ref={leaves}
        args={[assets.leaf, assets.foliage, assets.matrices.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={pots}
        args={[assets.pot, assets.ceramic, planters.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh ref={soil} args={[assets.soil, assets.earth, planters.length]} />
      <mesh geometry={assets.stems} material={assets.bark} castShadow />
    </group>
  );
}
