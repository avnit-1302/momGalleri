import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, Mesh, Object3D, Path, Shape, SRGBColorSpace, Vector3 } from 'three';
import { assetUrl, type Photograph } from '../content/museumContent';
import { textTexture } from './materials';
import { Sign } from './Architecture';

/** A continuous, mitred frame; the small bevel catches the gallery light. */
function frameProfile(width: number, height: number, border: number) {
  const shape = new Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const hole = new Path();
  hole.moveTo(-width / 2 + border, -height / 2 + border);
  hole.lineTo(-width / 2 + border, height / 2 - border);
  hole.lineTo(width / 2 - border, height / 2 - border);
  hole.lineTo(width / 2 - border, -height / 2 + border);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

function frameShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#000000';
  ctx.fillRect(22, 22, 212, 212);
  return new CanvasTexture(canvas);
}

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
    () => textTexture('A place for a memory', '#7b705b', '#e4ddcb', true),
    [],
  );
  const [texture, setTexture] = useState(fallback);
  const worldPosition = useMemo(() => new Vector3(...position), [position]);
  const imageMesh = useRef<Mesh>(null!);
  const lightTarget = useMemo(() => new Object3D(), []);
  const frame = useMemo(() => frameProfile(width + 0.52, height + 0.52, 0.115), [width, height]);
  const bead = useMemo(() => frameProfile(width + 0.3, height + 0.3, 0.018), [width, height]);
  const shadow = useMemo(frameShadow, []);
  const plaqueWidth = Math.min(width, 2.1);
  const plaqueX = (plaqueWidth - width) / 2;
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
  useEffect(() => () => shadow.dispose(), [shadow]);
  useEffect(() => {
    if (!active) setHovered(false);
  }, [active]);
  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (active && !document.pointerLockElement) onSelect(photo);
  };
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.015, -0.067]} raycast={() => null}>
        <planeGeometry args={[width + 0.86, height + 0.86]} />
        <meshBasicMaterial
          map={shadow}
          color="#211b14"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.048]} castShadow receiveShadow>
        <extrudeGeometry
          args={[
            frame,
            {
              depth: 0.17,
              bevelEnabled: true,
              bevelSegments: 2,
              bevelSize: 0.009,
              bevelThickness: 0.009,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial color="#493a29" metalness={0.06} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0, 0.11]} castShadow>
        <extrudeGeometry
          args={[
            bead,
            {
              depth: 0.012,
              bevelEnabled: true,
              bevelSegments: 1,
              bevelSize: 0.003,
              bevelThickness: 0.003,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial
          color={hovered ? '#d0b775' : '#a28a57'}
          metalness={0.78}
          roughness={0.29}
        />
      </mesh>
      <mesh position={[0, 0, 0.047]} receiveShadow>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.035]} />
        <meshStandardMaterial color="#e8e4d9" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[width + 0.018, height + 0.018]} />
        <meshStandardMaterial color="#817b6b" roughness={0.92} />
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
          roughness={0.9}
          envMapIntensity={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.055}
          emissiveMap={texture}
        />
      </mesh>
      <mesh position={[plaqueX, -height / 2 - 0.54, -0.037]} receiveShadow>
        <boxGeometry args={[plaqueWidth, 0.3, 0.024]} />
        <meshStandardMaterial color="#ddd9ce" roughness={0.77} />
      </mesh>
      <Sign
        text={photo.title + (photo.year ? ` · ${photo.year}` : '')}
        position={[plaqueX, -height / 2 - 0.54, -0.023]}
        width={plaqueWidth - 0.16}
        height={0.23}
        color="#454438"
      />
      <mesh position={[0, height / 2 + 0.72, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.07, 16]} />
        <meshStandardMaterial color="#655c48" metalness={0.72} roughness={0.34} />
      </mesh>
      <mesh position={[0, height / 2 + 0.72, 0.37]}>
        <boxGeometry args={[0.035, 0.04, 0.68]} />
        <meshStandardMaterial color="#655c48" metalness={0.72} roughness={0.34} />
      </mesh>
      <group position={[0, height / 2 + 0.6, 0.7]} rotation={[0.38, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.085, 0.085, 0.23, 16]} />
          <meshStandardMaterial color="#514a3b" metalness={0.65} roughness={0.32} />
        </mesh>
        <mesh position={[0, -0.117, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.058, 16]} />
          <meshBasicMaterial color="#fff0ce" toneMapped={false} />
        </mesh>
      </group>
      <primitive object={lightTarget} />
      {lit && (
        <spotLight
          position={[0, height / 2 + 0.48, 0.7]}
          target={lightTarget}
          color="#fff1dc"
          intensity={13}
          distance={7}
          angle={0.86}
          penumbra={0.9}
        />
      )}
    </group>
  );
}
