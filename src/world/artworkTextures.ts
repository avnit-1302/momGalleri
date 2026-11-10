import { CanvasTexture, SRGBColorSpace } from 'three';
import { assetUrl, photographs } from '../content/museumContent';

export const exhibitedPhotographs = photographs.filter((photo) => photo.id !== 'tribute-portrait');

/** Decode and resize before entry, with bounded concurrency to keep the welcome UI responsive. */
export async function prepareArtwork(cancelled: () => boolean) {
  const textures = new Map<string, CanvasTexture>();
  let next = 0;
  async function worker() {
    while (!cancelled() && next < exhibitedPhotographs.length) {
      const photo = exhibitedPhotographs[next++];
      const image = new Image();
      image.crossOrigin = 'anonymous';
      const loaded = await new Promise<boolean>((resolve) => {
        const timer = window.setTimeout(() => finish(false), 15000);
        function finish(ok: boolean) {
          clearTimeout(timer);
          image.onload = image.onerror = null;
          resolve(ok);
        }
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = assetUrl(photo.image);
      });
      if (cancelled()) break;
      const { width, height } = photo.placement;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(1024 * Math.min(1, width / height));
      canvas.height = Math.round(1024 * Math.min(1, height / width));
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#eee9df';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (loaded) {
        const fit = Math.min(canvas.width / image.width, canvas.height / image.height);
        const w = image.width * fit,
          h = image.height * fit;
        ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } else {
        ctx.fillStyle = '#7b705b';
        ctx.font = `${Math.round(canvas.width / 24)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Image unavailable', canvas.width / 2, canvas.height / 2);
      }
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      textures.set(photo.id, texture);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return textures;
}
