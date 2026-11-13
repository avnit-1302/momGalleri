import { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Box3,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type SeahorseProps = {
  /** How tall the sculpture should be in museum world units. */
  height?: number;
  /** World-space position at the foot of the sculpture. */
  position?: [number, number, number];
  /** Rotate to choose which side of the sculpture faces the visitor. */
  rotationY?: number;
};

/**
 * Displays the real GLB asset instead of procedurally
 * generating a seahorse.
 *
 * The supplied GLB is a solid model, NOT an open lattice sculpture.
 *
 * The model is oriented sideways (its broad profile is in YZ),
 * so an initial 90-degree turn around Y is necessary.
 */
export function Seahorse({
  height = 4.8,
  position = [0, 0.45, 0],
  rotationY = Math.PI / 2,
}: SeahorseProps) {
  const { scene } = useGLTF('/models/seahorse.glb');
  const { gl } = useThree();

  const prepared = useMemo(() => {
    // Clone the original GLB model.
    const model = scene.clone(true);

    // Determine model dimensions.
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());

    // Automatically scale to desired height.
    const scale = height / Math.max(size.y, 0.001);

    // Center model horizontally.
    // Place its bottom at the pedestal level.
    const offset: [number, number, number] = [-center.x, -bounds.min.y, -center.z];

    const materials: MeshPhysicalMaterial[] = [];

    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      const original = Array.isArray(child.material) ? child.material[0] : child.material;

      // Preserve existing normal-map details if available.
      const normalMap = original instanceof MeshStandardMaterial ? original.normalMap : null;

      // Premium polished silver material.
      const silver = new MeshPhysicalMaterial({
        color: '#d7dfe7',
        metalness: 0.88,
        roughness: 0.2,
        clearcoat: 0.22,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.45,
        normalMap,
        side: DoubleSide,
      });

      child.material = silver;
      child.castShadow = true;
      child.receiveShadow = true;

      materials.push(silver);
    });

    return {
      model,
      scale,
      offset,
      materials,
    };
  }, [scene, height]);

  // Create GPU resources only after commit, before the sculpture's first frame.
  // Strict Mode and Suspense can clean up and restart effects: each setup must
  // generate a fresh reflection target instead of reusing a disposed texture.
  useLayoutEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    let reflections;
    try {
      reflections = generator.fromScene(room);
    } finally {
      room.dispose();
      generator.dispose();
    }
    prepared.materials.forEach((material) => {
      material.envMap = reflections.texture;
      material.needsUpdate = true;
    });

    return () => {
      prepared.materials.forEach((material) => {
        material.envMap = null;
        material.dispose();
      });
      reflections.dispose();
    };
  }, [gl, prepared]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group scale={prepared.scale}>
        <primitive object={prepared.model} position={prepared.offset} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/seahorse.glb');
