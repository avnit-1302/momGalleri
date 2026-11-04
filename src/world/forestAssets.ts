import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAIN_GALLERY } from './galleryLayout';

export type TreeSpecies = 'birch' | 'oak' | 'fir';
export function seededRandom(initial: number) {
  let seed = initial;
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function canvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d')!);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Original painted branch atlas; gaps between the individual leaves stay transparent. */
export function leafTexture(species: TreeSpecies) {
  const random = seededRandom(species === 'fir' ? 191 : 327);
  return canvasTexture(512, 512, (ctx) => {
    const branch = (x: number, y: number, angle: number, length: number, depth: number) => {
      const endX = x + Math.sin(angle) * length,
        endY = y - Math.cos(angle) * length;
      ctx.strokeStyle = species === 'fir' ? '#635a35' : '#716142';
      ctx.lineWidth = depth ? 3 : 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      const count = species === 'fir' ? 22 : 8;
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1),
          bx = x + (endX - x) * t,
          by = y + (endY - y) * t;
        for (const side of [-1, 1]) {
          const a = angle + side * (0.65 + random() * 0.45);
          const size = species === 'fir' ? 12 + random() * 14 : 10 + random() * 12;
          const lx = bx + Math.sin(a) * size * 0.63,
            ly = by - Math.cos(a) * size * 0.63;
          const light = 29 + random() * 19;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(a);
          ctx.fillStyle = `hsl(${species === 'fir' ? 113 : 81 + random() * 23}, ${species === 'fir' ? 22 : 29}%, ${light}%)`;
          ctx.beginPath();
          if (species === 'fir') ctx.ellipse(0, -size * 0.3, 1.6, size * 0.7, 0, 0, Math.PI * 2);
          else {
            ctx.moveTo(0, -size);
            ctx.bezierCurveTo(size * 0.65, -size * 0.45, size * 0.42, size * 0.25, 0, size * 0.5);
            ctx.bezierCurveTo(-size * 0.48, size * 0.1, -size * 0.64, -size * 0.45, 0, -size);
          }
          ctx.fill();
          ctx.strokeStyle = 'rgba(218,222,148,.26)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, size * 0.38);
          ctx.lineTo(0, -size * 0.8);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (depth)
        for (let i = 1; i <= 4; i++) {
          const t = i / 5;
          for (const side of [-1, 1])
            branch(
              x + (endX - x) * t,
              y + (endY - y) * t,
              angle + side * (0.5 + random() * 0.45),
              length * (0.51 - t * 0.17),
              depth - 1,
            );
        }
    };
    branch(256, 495, -0.02, 335, 1);
    branch(245, 420, -0.48, 220, 1);
    branch(265, 398, 0.49, 210, 1);
  });
}

export function barkTexture(species: TreeSpecies) {
  const random = seededRandom(91);
  const texture = canvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = species === 'birch' ? '#bbb9a5' : '#665e4e';
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 3800; i++) {
      const light = random();
      ctx.fillStyle =
        species === 'birch'
          ? `rgba(${light > 0.5 ? '244,240,217' : '52,52,43'},${random() * 0.32})`
          : `rgba(${light > 0.5 ? '180,163,128' : '32,34,28'},${random() * 0.44})`;
      const x = random() * 256,
        y = random() * 512;
      ctx.fillRect(
        x,
        y,
        species === 'birch' ? random() * 32 : 1 + random() * 4,
        species === 'birch' ? 1 + random() * 4 : 4 + random() * 60,
      );
    }
    if (species === 'birch')
      for (let i = 0; i < 32; i++) {
        ctx.fillStyle = 'rgba(38,42,36,.64)';
        ctx.beginPath();
        ctx.ellipse(
          random() * 256,
          random() * 512,
          3 + random() * 24,
          1 + random() * 4,
          random() * 0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
  });
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}

export function groundTexture() {
  const random = seededRandom(527);
  const texture = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#555e43';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26000; i++) {
      const brown = random() > 0.75;
      ctx.fillStyle = `hsla(${brown ? 34 : 70 + random() * 30},${brown ? 22 : 18}%,${23 + random() * 23}%,.5)`;
      ctx.beginPath();
      ctx.ellipse(
        random() * 512,
        random() * 512,
        1 + random() * 8,
        0.5 + random() * 3,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(45, 45);
  return texture;
}

/** Irregular cross-section swept along a curved, tapering branch. */
function branchGeometry(points: Vector3[], radius: number, segments = 6) {
  const curve = new CatmullRomCurve3(points),
    frames = curve.computeFrenetFrames(segments, false);
  const vertices: number[] = [],
    uvs: number[] = [],
    indices: number[] = [],
    radial = 7;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      center = curve.getPointAt(t),
      r = radius * (1 - t * 0.91);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2,
        uneven = 1 + Math.sin(j * 3.7 + t * 2) * 0.08;
      const p = center
        .clone()
        .addScaledVector(frames.normals[i], Math.cos(a) * r * uneven)
        .addScaledVector(frames.binormals[i], Math.sin(a) * r * uneven);
      vertices.push(p.x, p.y, p.z);
      uvs.push(j / radial, t);
      if (i < segments && j < radial) {
        const n = i * (radial + 1) + j;
        indices.push(n, n + radial + 1, n + 1, n + 1, n + radial + 1, n + radial + 2);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mergeAndDispose(parts: BufferGeometry[]) {
  const geometry = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return geometry;
}

export function treeGeometry(species: TreeSpecies, sparse = false) {
  const random = seededRandom(species === 'fir' ? 321 : species === 'birch' ? 79 : 97);
  const branches: BufferGeometry[] = [],
    leaves: BufferGeometry[] = [];
  const height = species === 'fir' ? 17 : species === 'birch' ? 13.5 : 12;
  const radius = species === 'fir' ? 0.31 : species === 'birch' ? 0.2 : 0.44;
  branches.push(
    branchGeometry(
      [
        new Vector3(),
        new Vector3(0.12, height * 0.33, -0.13),
        new Vector3(-0.17, height * 0.7, 0.21),
        new Vector3(0.3, height, 0),
      ],
      radius,
      12,
    ),
  );
  const card = (point: Vector3, size: number, angle: number, lean: number) => {
    const geometry = new PlaneGeometry(size, size * 1.05);
    geometry.rotateX(lean);
    geometry.rotateY(angle);
    geometry.rotateZ((random() - 0.5) * 0.9);
    geometry.translate(point.x, point.y, point.z);
    leaves.push(geometry);
  };
  if (species === 'fir') {
    for (let level = 0; level < 10; level++) {
      const y = 3.6 + level * 1.18,
        spread = (1 - level / 11) * 3.5;
      for (let j = 0; j < (sparse ? 4 : 6); j++) {
        const angle = j * 2.399 + level * 1.72,
          dx = Math.cos(angle),
          dz = Math.sin(angle);
        const end = new Vector3(dx * spread, y - 0.6, dz * spread);
        branches.push(
          branchGeometry(
            [
              new Vector3(0, y, 0),
              new Vector3(dx * spread * 0.48, y - 0.35, dz * spread * 0.48),
              end,
            ],
            0.055 * (1 - level / 12),
            3,
          ),
        );
        for (let k = 0; k < 3; k++)
          card(
            new Vector3(
              dx * spread * (0.38 + k * 0.23),
              y - 0.15 - k * 0.1,
              dz * spread * (0.38 + k * 0.23),
            ),
            1.9 - level * 0.095,
            angle + Math.PI / 2,
            -0.85,
          );
      }
    }
    card(new Vector3(0.3, 16.2, 0), 1.8, 0, 0);
    card(new Vector3(0.3, 16.2, 0), 1.8, Math.PI / 2, 0);
  } else {
    const count = species === 'birch' ? 13 : 16;
    for (let j = 0; j < count; j++) {
      const t = j / count,
        y = height * (0.35 + t * 0.57),
        a = j * 2.399,
        reach = (species === 'birch' ? 2.7 : 4.8) * (0.45 + Math.sin(t * Math.PI) * 0.55);
      const start = new Vector3(Math.sin(t * 8) * 0.13, y, 0);
      const end = new Vector3(Math.cos(a) * reach, y + 1 + random(), Math.sin(a) * reach);
      const middle = start.clone().lerp(end, 0.6);
      middle.y -= 0.35;
      branches.push(branchGeometry([start, middle, end], radius * 0.36 * (1 - t * 0.6), 5));
      for (let k = 0; k < (sparse ? 2 : 3); k++) {
        const fork = middle.clone().lerp(end, k * 0.3),
          side = a + (k % 2 ? -0.65 : 0.65);
        const twigEnd = fork
          .clone()
          .add(new Vector3(Math.cos(side) * 0.85, 0.5 + random() * 0.7, Math.sin(side) * 0.85));
        branches.push(branchGeometry([fork, fork.clone().lerp(twigEnd, 0.55), twigEnd], 0.025, 3));
        const cluster = twigEnd.clone().add(new Vector3(0, 0.15, 0));
        for (let c = 0; c < (sparse ? 2 : 3); c++) {
          const point = cluster
            .clone()
            .add(
              new Vector3((random() - 0.5) * 0.8, (random() - 0.5) * 0.65, (random() - 0.5) * 0.8),
            );
          card(
            point,
            species === 'birch' ? 2.1 : 2.6,
            side + (c * Math.PI) / 3,
            (random() - 0.5) * 1.9,
          );
        }
      }
    }
    for (let j = 0; j < 5; j++)
      card(
        new Vector3(
          Math.sin(j * 2.4) * 0.7,
          height - 0.15 + random() * 0.9,
          Math.cos(j * 2.4) * 0.7,
        ),
        2.2,
        j * 2.4,
        0.2,
      );
  }
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    branches.push(
      branchGeometry(
        [
          new Vector3(0, 0.5, 0),
          new Vector3(Math.cos(a) * radius * 1.6, 0.1, Math.sin(a) * radius * 1.6),
          new Vector3(Math.cos(a) * radius * 3.3, -0.05, Math.sin(a) * radius * 3.3),
        ],
        radius * 0.32,
        3,
      ),
    );
  }
  return { wood: mergeAndDispose(branches), foliage: mergeAndDispose(leaves) };
}

export function grassGeometry() {
  const random = seededRandom(692),
    vertices: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const color = new Color();
  for (let i = 0; i < 13; i++) {
    const a = random() * Math.PI * 2,
      h = 0.18 + random() * 0.48,
      x = (random() - 0.5) * 0.36,
      z = (random() - 0.5) * 0.36,
      w = 0.018 + random() * 0.02;
    const dx = Math.cos(a),
      dz = Math.sin(a),
      bend = 0.14 + random() * 0.18,
      offset = vertices.length / 3;
    vertices.push(
      x - dx * w,
      0,
      z - dz * w,
      x + dx * w,
      0,
      z + dz * w,
      x + dz * bend + dx * w * 0.45,
      h * 0.6,
      z + dx * bend + dz * w * 0.45,
      x + dz * bend - dx * w * 0.45,
      h * 0.6,
      z + dx * bend - dz * w * 0.45,
      x + dz * bend * 1.6,
      h,
      z + dx * bend * 1.6,
    );
    for (let j = 0; j < 5; j++) {
      color.setHSL(0.2 + random() * 0.03, 0.26, j < 2 ? 0.16 : 0.28 + random() * 0.12);
      colors.push(color.r, color.g, color.b);
    }
    indices.push(
      offset,
      offset + 1,
      offset + 2,
      offset,
      offset + 2,
      offset + 3,
      offset + 3,
      offset + 2,
      offset + 4,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function fernGeometry() {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399;
    for (let j = 1; j <= 10; j++) {
      const t = j / 11,
        length = Math.sin(t * Math.PI) * 0.22,
        center = new Vector3(
          Math.cos(a) * t * 0.8,
          Math.sin(t * Math.PI * 0.85) * 0.65 + 0.05,
          Math.sin(a) * t * 0.8,
        );
      for (const side of [-1, 1]) {
        const leaf = new PlaneGeometry(length * 2, 0.055 * (1 - t * 0.5));
        leaf.rotateX(-Math.PI / 2);
        leaf.rotateY(-a + side * 0.55);
        leaf.translate(
          center.x + Math.sin(a) * length * side,
          center.y,
          center.z - Math.cos(a) * length * side,
        );
        parts.push(leaf);
      }
    }
  }
  return mergeAndDispose(parts);
}

export function terrainHeight(x: number, z: number) {
  // Keep terrain below the extended gallery as well as the original building.
  const [x1, x2, z1, z2] = MAIN_GALLERY.bounds;
  const distance = Math.min(
    Math.max(Math.abs(x) - 34, Math.abs(z + 1) - 34, 0),
    Math.max(x1 - 4 - x, x - x2 - 4, z1 - 4 - z, z - z2 - 4, 0),
  );
  const amplitude = Math.min(distance / 14, 1);
  return (
    -0.15 +
    amplitude *
      (0.3 + Math.sin(x * 0.085) * Math.cos(z * 0.12) * 0.48 + Math.sin(z * 0.27 + x * 0.11) * 0.18)
  );
}

export function terrainGeometry() {
  const geometry = new PlaneGeometry(360, 360, 100, 100);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    positions.setY(i, terrainHeight(x, z));
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function transformAt(
  x: number,
  y: number,
  z: number,
  scale: number,
  yaw: number,
  heightScale = 1,
) {
  return new Matrix4().compose(
    new Vector3(x, y, z),
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw),
    new Vector3(scale, scale * heightScale, scale),
  );
}
