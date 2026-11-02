import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { photographs } from '../content/museumContent';
import { Architecture } from './Architecture';
import { Forest } from './Nature';
import { GalleryFrame } from './GalleryFrame';
import { VisitorControls, type VisitorProps } from './VisitorControls';

export type Quality = 'auto' | 'low' | 'high';
type Props = VisitorProps & { quality: Quality; onReady: () => void; onFailure: () => void };
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onReady, 120);
    return () => clearTimeout(timer);
  }, [onReady]);
  return null;
}
export default function Museum({ quality, onReady, onFailure, ...visitor }: Props) {
  const low = quality === 'low' || (quality === 'auto' && matchMedia('(pointer: coarse)').matches);
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return (
    <Canvas
      shadows={!low}
      dpr={low ? 1 : [1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      camera={{ position: [8.5, 4.1, 18], fov: 65, near: 0.1, far: 190 }}
      gl={{
        antialias: !low,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.1;
        gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
      }}
      fallback={<div className="webgl-fallback">Denne enheten støtter ikke 3D-visningen.</div>}
    >
      <color attach="background" args={['#dde1d5']} />
      <fog attach="fog" args={['#dce0d4', 40, 140]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#fff6e6', '#8d9175', 1.25]} />
      <directionalLight
        position={[18, 28, 20]}
        intensity={2.5}
        color="#fff2d9"
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-far={95}
        shadow-bias={-0.0005}
        shadow-normalBias={0.045}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer
          form="rect"
          intensity={2}
          position={[0, 10, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[30, 30, 1]}
          color="#fff3da"
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[15, 4, 5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[20, 10, 1]}
          color="#d8e5da"
        />
        <Lightformer
          form="rect"
          intensity={1}
          position={[-15, 6, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[20, 12, 1]}
          color="#e5d1a7"
        />
      </Environment>
      <Forest low={low} />
      <Architecture low={low} />
      {photographs.map((photo) => (
        <GalleryFrame
          key={photo.id}
          photo={photo}
          active={visitor.active}
          onSelect={(p) => {
            if (!visitor.input.current.dragged) visitor.onSelect(p);
          }}
        />
      ))}
      <VisitorControls {...visitor} />
      <Ready onReady={onReady} />
    </Canvas>
  );
}
