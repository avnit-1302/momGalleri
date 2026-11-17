import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { SoundPose } from '../ui/NatureAudio';

export function SoundListener({ onPose }: { onPose: SoundPose }) {
  const direction = useRef(new Vector3()),
    elapsed = useRef(0);
  useFrame(({ camera }, dt) => {
    elapsed.current += dt;
    if (elapsed.current < 0.1) return;
    elapsed.current = 0;
    camera.getWorldDirection(direction.current);
    const p = camera.position,
      d = direction.current;
    onPose(p.x, p.y, p.z, d.x, d.y, d.z);
  });
  return null;
}
