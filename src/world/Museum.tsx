import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sky } from '@react-three/drei';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, type CanvasTexture } from 'three';
import type { Photograph } from '../content/museumContent';
import { exhibitedPhotographs, prepareArtwork } from './artworkTextures';
import { GalleryLights } from './GalleryLights';
import { PrepareScene } from './PrepareScene';
import { Architecture } from './Architecture';
import { Forest } from './Nature';
import { GalleryFrame } from './GalleryFrame';
import { VisitorControls, type VisitorProps } from './VisitorControls';

export type Quality = 'auto' | 'low' | 'high';
type Props = VisitorProps & { quality: Quality; onReady: () => void; onFailure: () => void };
// Respond to sustained load after preparation; increase resolution more cautiously.
function AdaptiveResolution({ enabled }: { enabled: boolean }) {
  const setDpr = useThree((state) => state.setDpr);
  const sample = useRef({ elapsed: 0, frames: 0, age: 0, dpr: Math.min(devicePixelRatio, 1.5) });
  useFrame((_, dt) => {
    if (!enabled || document.hidden) return;
    const s = sample.current;
    s.age += dt;
    if (s.age < 2) return;
    s.elapsed += dt;
    s.frames++;
    if (s.elapsed < 2) return;
    const fps = s.frames / s.elapsed;
    const next = Math.min(
      devicePixelRatio,
      1.5,
      Math.max(0.7, s.dpr + (fps < 28 ? -0.25 : fps > 55 ? 0.05 : 0)),
    );
    if (next !== s.dpr) {
      s.dpr = next;
      setDpr(next);
    }
    s.elapsed = 0;
    s.frames = 0;
  });
  return null;
}
// UI position updates must not restart the one-frame environment capture.
const StaticWorld = memo(function StaticWorld({ low }: { low: boolean }) {
  return (
    <>
      <color attach="background" args={['#bfcfce']} />
      <Sky
        distance={450000}
        sunPosition={[35, 42, 28]}
        turbidity={3.5}
        rayleigh={0.8}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />
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
      <GalleryLights />
    </>
  );
});
const FramedArtwork = memo(GalleryFrame);

export default function Museum({ quality, onReady, onFailure, ...visitor }: Props) {
  const low = quality === 'low' || (quality === 'auto' && matchMedia('(pointer: coarse)').matches);
  const selectArtwork = useCallback(
    (photo: Photograph) => {
      if (!visitor.input.current.dragged) visitor.onSelect(photo);
    },
    [visitor.input, visitor.onSelect],
  );
  const [textures, setTextures] = useState<Map<string, CanvasTexture>>();
  useEffect(() => {
    let cancelled = false;
    let prepared: Map<string, CanvasTexture> | undefined;
    prepareArtwork(() => cancelled)
      .then((result) => {
        prepared = result;
        if (cancelled) result.forEach((texture) => texture.dispose());
        else setTextures(result);
      })
      .catch(onFailure);
    return () => {
      cancelled = true;
      prepared?.forEach((texture) => texture.dispose());
    };
  }, [onFailure]);
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
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
        gl.toneMappingExposure = 0.92;
        gl.outputColorSpace = SRGBColorSpace;
        gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
      }}
      fallback={
        <div className="webgl-fallback">This device does not support the 3D experience.</div>
      }
    >
      <StaticWorld low={low} />
      {/* The tribute wall displays Ik Onkar; its portrait remains in the photo collection. */}
      {textures &&
        exhibitedPhotographs.map((photo) => (
          <FramedArtwork
            key={photo.id}
            photo={photo}
            texture={textures.get(photo.id)!}
            active={visitor.active}
            onSelect={selectArtwork}
          />
        ))}
      <VisitorControls {...visitor} />
      <AdaptiveResolution enabled={quality === 'auto' && !low && visitor.entered} />
      {textures && <PrepareScene low={low} onReady={onReady} onFailure={onFailure} />}
    </Canvas>
  );
}
