import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, SpotLight, Vector3 } from 'three';
import { exhibitedPhotographs } from './artworkTextures';

/** A fixed light budget avoids recompiling every material as rooms are entered. */
export function GalleryLights() {
  const fixtures = useMemo(
    () =>
      exhibitedPhotographs.map((photo) => {
        const { position, rotation, height } = photo.placement;
        return {
          target: new Vector3(...position),
          position: new Vector3(
            position[0] + Math.sin(rotation) * 0.7,
            position[1] + height / 2 + 0.48,
            position[2] + Math.cos(rotation) * 0.7,
          ),
          distance: 0,
        };
      }),
    [],
  );
  const lights = useMemo(
    () =>
      Array.from({ length: 4 }, () => {
        const light = new SpotLight('#fff1dc', 13, 7, 0.86, 0.9);
        light.target = new Object3D();
        return light;
      }),
    [],
  );
  useFrame(({ camera }) => {
    for (const fixture of fixtures)
      fixture.distance = fixture.target.distanceToSquared(camera.position);
    fixtures.sort((a, b) => a.distance - b.distance);
    lights.forEach((light, i) => {
      light.position.copy(fixtures[i].position);
      light.target.position.copy(fixtures[i].target);
      light.target.updateMatrixWorld();
    });
  });
  return (
    <group>
      {lights.map((light, i) => (
        <group key={i}>
          <primitive object={light} />
          <primitive object={light.target} />
        </group>
      ))}
    </group>
  );
}
