import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Mesh, PerspectiveCamera, Texture, WebGLRenderTarget } from 'three';
import { rooms } from './layout';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Upload textures, compile materials and warm each room before enabling entry. */
export function PrepareScene({
  low,
  onReady,
  onFailure,
}: {
  low: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const { gl, scene } = useThree();
  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      // Let the one-frame environment capture finish first.
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      const textures = new Set<Texture>();
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          for (const value of Object.values(material))
            if (value instanceof Texture) textures.add(value);
        }
      });
      let count = 0;
      for (const texture of textures) {
        if (cancelled) return;
        gl.initTexture(texture);
        if (++count % 4 === 0) await nextFrame();
      }
      const camera = new PerspectiveCamera(100, 1, 0.1, 190);
      gl.shadowMap.autoUpdate = false;
      gl.shadowMap.needsUpdate = !low;
      await gl.compileAsync(scene, camera);
      if (cancelled) return;
      const target = new WebGLRenderTarget(64, 64);
      try {
        for (const room of rooms) {
          for (const turn of [0, Math.PI]) {
            if (cancelled) return;
            camera.position.set(...room.spawn);
            camera.rotation.set(0, room.yaw + turn, 0);
            const previous = gl.getRenderTarget();
            try {
              gl.setRenderTarget(target);
              gl.render(scene, camera);
            } finally {
              gl.setRenderTarget(previous);
            }
            await nextFrame();
          }
        }
      } finally {
        target.dispose();
      }
      if (!cancelled) onReady();
    }
    prepare().catch((error) => {
      if (!cancelled) {
        console.error('Museum preparation failed', error);
        onFailure();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, low, onReady, onFailure]);
  return null;
}
