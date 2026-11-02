import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

export function stoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#d7cdbb';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 71;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 20000; i++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? '255,255,245' : '85,78,60'},${random() * 0.08})`;
    ctx.fillRect(random() * 512, random() * 512, random() * 4 + 1, 1);
  }
  ctx.strokeStyle = '#b9b2a2';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(0, 0, 512, 512);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function textTexture(
  text: string,
  color = '#715b37',
  background?: string,
  serif = false,
  aspect = 4,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.min(1024, Math.round(1024 / aspect));
  const ctx = canvas.getContext('2d')!;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const lines = text.split('\n');
  const family = text.includes('ੴ') ? '"Noto Sans Gurmukhi"' : serif ? 'Georgia' : 'Arial';
  let size = canvas.height * (lines.length > 1 ? 0.25 : 0.5);
  ctx.font = `${size}px ${family}, sans-serif`;
  const measured = Math.max(...lines.map((line) => ctx.measureText(line).width));
  size *= Math.min(1, (canvas.width * 0.9) / measured);
  ctx.font = `${size}px ${family}, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) =>
    ctx.fillText(
      line,
      canvas.width / 2,
      canvas.height / 2 + (index - (lines.length - 1) / 2) * size * 1.6,
    ),
  );
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
