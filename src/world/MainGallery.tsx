import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAIN_GALLERY } from './galleryLayout';
import { SunflowerFloor } from './SunflowerFloor';

function floorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  let seed = 119;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let column = 0; column < 8; column++) {
    for (let row = -1; row < 5; row++) {
      const x = column * 64,
        y = row * 256 + (column % 3) * 85;
      ctx.fillStyle = `hsl(33, 31%, ${50 + random() * 9}%)`;
      ctx.fillRect(x, y, 64, 256);
      for (let grain = 0; grain < 85; grain++) {
        const gx = x + random() * 64;
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(gx + 3, y + 75, gx - 3, y + 160, gx + 1, y + 256);
        ctx.strokeStyle = `rgba(${grain % 3 ? '68,42,22' : '245,225,180'},${0.015 + random() * 0.09})`;
        ctx.lineWidth = 0.3 + random();
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(48,36,25,.32)';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(x + 0.5, y + 0.5, 63, 255);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** A twelve-metre-high barrel skylight and oak floor for the expanded main gallery. */
export function MainGallery() {
  const [x1, x2, z1, z2] = MAIN_GALLERY.bounds;
  const cx = (x1 + x2) / 2,
    cz = (z1 + z2) / 2,
    depth = z2 - z1;
  const spring = MAIN_GALLERY.wallHeight,
    radius = 7,
    rise = 3;
  const assets = useMemo(() => {
    const floor = new PlaneGeometry(x2 - x1, depth);
    const uv = floor.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 14, uv.getY(i) * 5);
    const points = Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI;
      return new Vector3(cx + Math.cos(a) * radius, spring + Math.sin(a) * rise, 0);
    });
    const ribs: TubeGeometry[] = [];
    for (let z = z1; z <= z2; z += 4.5) {
      const rib = new TubeGeometry(new CatmullRomCurve3(points), 64, 0.065, 6, false);
      rib.translate(0, 0, z);
      ribs.push(rib);
    }
    const ribGeometry = mergeGeometries(ribs)!;
    ribs.forEach((rib) => rib.dispose());
    const glass = new BufferGeometry();
    const positions: number[] = [],
      indices: number[] = [];
    points.forEach((p) => positions.push(p.x, p.y + 0.06, z1, p.x, p.y + 0.06, z2));
    for (let i = 0; i < points.length - 1; i++) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
    glass.setAttribute('position', new Float32BufferAttribute(positions, 3));
    glass.setIndex(indices);
    glass.computeVertexNormals();
    const end = new Shape();
    end.moveTo(-radius, 0);
    end.lineTo(radius, 0);
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI;
      end.lineTo(Math.cos(a) * radius, Math.sin(a) * rise);
    }
    end.closePath();
    return {
      floor,
      ribs: ribGeometry,
      glass,
      gable: new ShapeGeometry(end),
      texture: floorTexture(),
    };
  }, [x1, x2, z1, z2, cx, depth, spring]);
  // A restrained baked indirect-light fill keeps the deep soffits readable without extra lights.
  const plaster = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#e9e4d9',
        roughness: 0.78,
        emissive: '#c5b9a3',
        emissiveIntensity: 0.25,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(assets).forEach((asset) => asset.dispose());
      plaster.dispose();
    },
    [assets, plaster],
  );
  return (
    <group>
      <mesh
        geometry={assets.floor}
        position={[cx, -0.035, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={assets.texture}
          bumpMap={assets.texture}
          bumpScale={0.012}
          roughness={0.42}
          envMapIntensity={0.45}
        />
      </mesh>
      <SunflowerFloor />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[cx + side * 13.5, spring + 0.13, cz]}
            material={plaster}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[13, 0.38, depth]} />
          </mesh>
          <mesh position={[cx + side * 7.13, spring - 0.24, cz]} material={plaster} castShadow>
            <boxGeometry args={[0.26, 0.65, depth]} />
          </mesh>
          <mesh position={[cx + side * 7.32, spring - 0.07, cz]}>
            <boxGeometry args={[0.045, 0.045, depth - 0.4]} />
            <meshStandardMaterial color="#bc9b5d" emissive="#dfbc75" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      <mesh geometry={assets.ribs} material={plaster} castShadow />
      <mesh geometry={assets.glass}>
        <meshPhysicalMaterial
          color="#dfebef"
          roughness={0.12}
          transparent
          opacity={0.15}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {[z1, z2].map((z) => (
        <mesh
          key={z}
          geometry={assets.gable}
          material={plaster}
          position={[cx, spring, z]}
          castShadow
          receiveShadow
        />
      ))}
      {/* Solid clerestory fascia closes the gap above the retained southern partitions. */}
      <mesh position={[cx, (8 + spring) / 2, z2]} material={plaster} castShadow>
        <boxGeometry args={[40, spring - 8, 0.35]} />
      </mesh>
      <mesh position={[-10, (8 + spring) / 2, -21]} material={plaster} castShadow>
        <boxGeometry args={[0.35, spring - 8, 6]} />
      </mesh>
    </group>
  );
}
