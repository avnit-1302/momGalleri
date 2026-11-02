import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, Mesh, Object3D, SRGBColorSpace, Vector3 } from 'three';
import { assetUrl, type Photograph } from '../content/museumContent';
import { textTexture } from './materials';
import { Sign } from './Architecture';

export function GalleryFrame({
  photo,
  onSelect,
  active,
}: {
  photo: Photograph;
  onSelect: (p: Photograph) => void;
  active: boolean;
}) {
  const { position, rotation, width, height } = photo.placement;
  const [near, setNear] = useState(false),
    [hovered, setHovered] = useState(false),
    [lit, setLit] = useState(false);
  const fallback = useMemo(
    () => textTexture('Et minne venter her', '#7b705b', '#e4ddcb', true),
    [],
  );
  const [texture, setTexture] = useState(fallback);
  const worldPosition = useMemo(() => new Vector3(...position), [position]);
  const imageMesh = useRef<Mesh>(null!);
  const lightTarget = useMemo(() => new Object3D(), []);
  useFrame(({ camera }) => {
    const distance = camera.position.distanceTo(worldPosition);
    if (!near && distance < 31) setNear(true);
    if (lit && distance > 19) setLit(false);
    else if (!lit && distance < 17) setLit(true);
  });
  useEffect(() => {
    if (!near) return;
    let cancelled = false,
      loaded: CanvasTexture | undefined;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(1024 * Math.min(1, width / height));
      canvas.height = Math.round(1024 * Math.min(1, height / width));
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#eee9df';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const fit = Math.min(canvas.width / image.width, canvas.height / image.height),
        w = image.width * fit,
        h = image.height * fit;
      try {
        ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        loaded = new CanvasTexture(canvas);
        loaded.colorSpace = SRGBColorSpace;
        loaded.anisotropy = 4;
        setTexture(loaded);
      } catch {
        setTexture(fallback);
      }
    };
    image.onerror = () => {
      if (!cancelled) setTexture(fallback);
    };
    image.src = assetUrl(photo.image);
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [near, photo.image, width, height, fallback]);
  useEffect(() => () => fallback.dispose(), [fallback]);
  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (active && !document.pointerLockElement) onSelect(photo);
  };
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[width + 0.25, height + 0.25, 0.14]} />
        <meshStandardMaterial
          color={hovered ? '#cfb373' : '#a28550'}
          metalness={0.55}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[width + 0.12, height + 0.12]} />
        <meshStandardMaterial color="#f5f0e5" roughness={1} />
      </mesh>
      <mesh
        ref={imageMesh}
        position={[0, 0, 0.075]}
        userData={{ photoId: photo.id }}
        onClick={select}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (active) setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          emissive="#ffffff"
          emissiveIntensity={0.12}
          emissiveMap={texture}
        />
      </mesh>
      <mesh position={[0, -height / 2 - 0.43, 0.02]}>
        <boxGeometry args={[Math.min(width, 2.6), 0.44, 0.035]} />
        <meshStandardMaterial color="#eae3d4" />
      </mesh>
      <Sign
        text={photo.title + (photo.year ? ` · ${photo.year}` : '')}
        position={[0, -height / 2 - 0.43, 0.045]}
        width={Math.min(width, 2.5)}
        height={0.5}
      />
      <mesh position={[0, height / 2 + 0.5, 0.2]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.09, 0.22, 10]} />
        <meshStandardMaterial color="#504d41" />
      </mesh>
      <mesh position={[0, height / 2 + 0.38, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 10]} />
        <meshBasicMaterial color="#fff2ce" />
      </mesh>
      <primitive object={lightTarget} />
      {lit && (
        <spotLight
          position={[0, height / 2 + 0.5, 1.3]}
          target={lightTarget}
          color="#ffedce"
          intensity={9}
          distance={7}
          angle={0.7}
          penumbra={0.8}
        />
      )}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[width + 0.8, height + 0.8]} />
        <meshBasicMaterial color="#fff0c8" transparent opacity={0.035} depthWrite={false} />
      </mesh>
    </group>
  );
}
