import { useEffect, useMemo } from 'react';
import { CircleGeometry, Quaternion, Vector3, type ShaderMaterial } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/** Render only when the pool is in view, nearby, and the viewpoint has changed. */
export function PoolReflection() {
  const reflector = useMemo(() => {
    const surface = new Reflector(new CircleGeometry(3.94, 96), {
      textureWidth: 256,
      textureHeight: 256,
      color: '#71867c',
      multisample: 0,
    });
    // Soften the small reflection texture in the surface shader, without extra render passes.
    const material = surface.material as ShaderMaterial;
    material.fragmentShader = material.fragmentShader.replace(
      'vec4 base = texture2DProj( tDiffuse, vUv );',
      `vec2 uv = vUv.xy / vUv.w;
          vec2 offset = vec2(2.0 / 256.0);
          vec4 base = texture2D(tDiffuse, uv) * 4.0;
          base += texture2D(tDiffuse, uv + offset);
          base += texture2D(tDiffuse, uv - offset);
          base += texture2D(tDiffuse, uv + vec2(offset.x, -offset.y));
          base += texture2D(tDiffuse, uv + vec2(-offset.x, offset.y));
          base /= 8.0;`,
    );
    surface.position.set(0, 0.222, 0);
    surface.rotation.x = -Math.PI / 2;
    const renderReflection = surface.onBeforeRender.bind(surface);
    const position = new Vector3(Infinity, Infinity, Infinity);
    const rotation = new Quaternion();
    let lastUpdate = -Infinity;
    surface.onBeforeRender = (...args) => {
      const camera = args[2];
      const now = performance.now();
      if (Math.abs(camera.position.x) > 10 || Math.abs(camera.position.z) > 16) return;
      if (now - lastUpdate < 50) return;
      if (
        position.distanceToSquared(camera.position) < 0.0001 &&
        rotation.angleTo(camera.quaternion) < 0.001
      )
        return;
      renderReflection(...args);
      lastUpdate = now;
      position.copy(camera.position);
      rotation.copy(camera.quaternion);
    };
    return surface;
  }, []);
  useEffect(
    () => () => {
      reflector.dispose();
      reflector.geometry.dispose();
    },
    [reflector],
  );
  return <primitive object={reflector} />;
}
