import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sky } from '@react-three/drei';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
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

// Adjust only resolution, slowly and after shader warmup; camera motion stays unchanged.
function AdaptiveResolution({ enabled }: { enabled: boolean }) {
  const setDpr = useThree(state => state.setDpr);
  const sample = useRef({ elapsed: 0, frames: 0, age: 0, dpr: Math.min(devicePixelRatio, 1.5) });
  useFrame((_, dt) => {
    if (!enabled || document.hidden) return;
    const s = sample.current;
    s.age += dt;
    if (s.age < 7) return;
    s.elapsed += dt; s.frames++;
    if (s.elapsed < 4) return;
    const fps = s.frames / s.elapsed;
    const next = Math.min(devicePixelRatio, 1.5, Math.max(0.85,
      s.dpr + (fps < 28 ? -0.15 : fps > 53 ? 0.1 : 0)));
    if (next !== s.dpr) { s.dpr = next; setDpr(next); }
    s.elapsed = 0; s.frames = 0;
  });
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
      shadows={low ? false : { type: PCFSoftShadowMap }}
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
        gl.toneMappingExposure = 0.92;
        gl.outputColorSpace = SRGBColorSpace;
        gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
      }}
      fallback={
        <div className="webgl-fallback">This device does not support the 3D experience.</div>
      }
    >
      <color attach="background" args={['#bfcfce']} />
      <Sky distance={450000} sunPosition={[35, 42, 28]} turbidity={3.5} rayleigh={0.8}
        mieCoefficient={0.004} mieDirectionalG={0.8} />
      <fog attach="fog" args={['#bfcac4', 58, 155]} />
      <ambientLight intensity={0.08} />
      <hemisphereLight args={['#dce8f3', '#4b5746', 0.75]} />
      <directionalLight
        position={[35, 42, 28]}
        intensity={3.5}
        color="#fff1d9"
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-far={130}
        shadow-camera-near={1}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-radius={3}
      />
      <Environment resolution={128} frames={1} environmentIntensity={0.65}>
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[0, 10, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[30, 30, 1]}
          color="#e8eff4"
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[15, 4, 5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[20, 10, 1]}
          color="#b8cbb7"
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-15, 6, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[20, 12, 1]}
          color="#e9dabd"
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
      <AdaptiveResolution enabled={quality === 'auto' && !low} />
      <Ready onReady={onReady} />
    </Canvas>
  );
}
