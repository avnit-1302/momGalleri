import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Original seamless honed limestone. UV scale is set in metres by the architecture. */
export function stoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(71);
  ctx.fillStyle = '#c4c1b7';
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 75000; i++) {
    const v = random() > 0.5 ? '255,253,241' : '77,76,68';
    ctx.fillStyle = `rgba(${v},${random() * 0.07})`;
    ctx.fillRect(random() * 1024, random() * 1024, 1 + random() * 6, 0.5 + random() * 2);
  }
  // Fine sedimentary veins, not a conspicuous marble pattern.
  for (let j = 0; j < 85; j++) {
    const y = random() * 1024;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    for (let x = 0; x <= 1030; x += 16)
      ctx.lineTo(x, y + Math.sin(x * 0.006 + j) * 15 + Math.sin(x * 0.023 + j) * 2);
    ctx.strokeStyle = `rgba(98,93,80,${0.018 + random() * 0.035})`;
    ctx.lineWidth = random() * 2 + 0.4;
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(80,77,67,.23)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 1024, 1024);
  ctx.strokeStyle = 'rgba(255,255,245,.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 2, 1020, 1020);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function oakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(299);
  ctx.fillStyle = '#94704c';
  ctx.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 1400; i++) {
    const x = random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 1024; y += 16)
      ctx.lineTo(x + Math.sin(y * 0.009 + i) * 1.6 + Math.sin(y * 0.002 + i) * 2, y);
    ctx.strokeStyle = `rgba(${i % 3 ? '48,29,15' : '246,207,150'},${0.02 + random() * 0.11})`;
    ctx.lineWidth = random() * 1.8 + 0.25;
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Baked radial contact occlusion: one cheap transparent quad per furniture group. */
export function contactTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(19,23,18,.48)');
  gradient.addColorStop(0.4, 'rgba(19,23,18,.24)');
  gradient.addColorStop(0.75, 'rgba(19,23,18,.07)');
  gradient.addColorStop(1, 'rgba(19,23,18,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

export function textTexture(
  text: string,
  color = '#514b3d',
  background?: string,
  serif = false,
  aspect = 4,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = Math.min(2048, Math.max(128, Math.round(2048 / aspect)));
  const ctx = canvas.getContext('2d')!;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const lines = text.split('\n');
  const family = text.includes('ੴ')
    ? '"Noto Sans Gurmukhi"'
    : serif ? '"Cormorant Garamond", Georgia' : '"DM Sans", Arial';
  // Fit both axes, including the full ascender/descender of the Gurmukhi glyph.
  let size = Math.min(canvas.height * 0.58, canvas.height * 0.72 / (lines.length * 1.35));
  ctx.font = `400 ${size}px ${family}`;
  const measured = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));
  size *= Math.min(1, (canvas.width * 0.88) / measured);
  ctx.font = `400 ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, index) => {
    const metrics = ctx.measureText(line);
    const correction = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(line, canvas.width / 2,
      canvas.height / 2 + correction + (index - (lines.length - 1) / 2) * size * 1.35);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
