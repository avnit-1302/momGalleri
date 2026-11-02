import { useMemo } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Vector3,
  DoubleSide,
} from 'three';

function taperedTube(points: Vector3[], radius: (t: number) => number, segments = 100) {
  const curve = new CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(segments, false);
  const vertices: number[] = [],
    indices: number[] = [],
    sides = 12;
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(i / segments),
      r = radius(i / segments);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const v = p
        .clone()
        .addScaledVector(frames.normals[i], Math.cos(a) * r)
        .addScaledVector(frames.binormals[i], Math.sin(a) * r);
      vertices.push(v.x, v.y, v.z);
      if (i < segments && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Original parametric sculpture: a curled, tapered tail, rounded torso, arched
// neck, equine head, tubular snout, crown, dorsal fin and sculpted body rings.
export function Seahorse() {
  const { tail, neck, fin } = useMemo(() => {
    const tailPoints: Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48,
        a = t * Math.PI * 2.05 + 0.5,
        r = 0.05 + 0.87 * t;
      tailPoints.push(new Vector3(-0.45 + Math.cos(a) * r, 1.05 + Math.sin(a) * r, 0));
    }
    tailPoints.push(new Vector3(0.45, 1.85, 0), new Vector3(0.15, 2.35, 0));
    const fin = new BufferGeometry();
    fin.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -0.48, 2.5, 0, -1.3, 2.9, 0, -0.7, 3.2, 0, -1.4, 3.6, 0, -0.65, 3.9, 0, -1.12, 4.15, 0,
          -0.38, 4.28, 0,
        ],
        3,
      ),
    );
    fin.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6]);
    fin.computeVertexNormals();
    return {
      tail: taperedTube(tailPoints, (t) => 0.035 + 0.23 * t ** 1.5),
      neck: taperedTube(
        [
          new Vector3(0.18, 3.4, 0),
          new Vector3(-0.1, 4.15, 0),
          new Vector3(0.05, 4.7, 0),
          new Vector3(0.43, 5, 0),
          new Vector3(0.8, 4.88, 0),
        ],
        (t) => 0.36 - 0.13 * t,
        45,
      ),
      fin,
    };
  }, []);
  const bronze = <meshStandardMaterial color="#9b6d36" metalness={0.78} roughness={0.32} />;
  return (
    <group position={[0, 0.45, 0]} rotation={[0, -0.4, 0]}>
      <mesh geometry={tail} castShadow>
        {bronze}
      </mesh>
      <mesh position={[0.1, 3, 0]} scale={[0.65, 1.16, 0.48]} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        {bronze}
      </mesh>
      <mesh geometry={neck} castShadow>
        {bronze}
      </mesh>
      <mesh
        position={[0.58, 4.94, 0]}
        scale={[0.51, 0.32, 0.3]}
        rotation={[0, 0, -0.25]}
        castShadow
      >
        <sphereGeometry args={[1, 24, 16]} />
        {bronze}
      </mesh>
      <mesh position={[1.07, 4.75, 0]} rotation={[0, 0, -Math.PI / 2 - 0.22]} castShadow>
        <cylinderGeometry args={[0.115, 0.2, 0.82, 20]} />
        {bronze}
      </mesh>
      <mesh position={[1.47, 4.66, 0]} rotation={[0, Math.PI / 2, 0.22]}>
        <torusGeometry args={[0.12, 0.035, 8, 20]} />
        {bronze}
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0.54, 5.04, 0.265 * side]}>
            <sphereGeometry args={[0.066, 16, 10]} />
            <meshStandardMaterial color="#261d14" metalness={0.6} roughness={0.22} />
          </mesh>
          <mesh position={[0.54, 5.04, 0.272 * side]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <torusGeometry args={[0.076, 0.02, 6, 16]} />
            {bronze}
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[0.14 + i * 0.13, 5.12 + Math.sin(i * 0.8) * 0.12, 0]}
          rotation={[0, 0, 0.55 - i * 0.22]}
          castShadow
        >
          <coneGeometry args={[0.12, 0.42, 5]} />
          {bronze}
        </mesh>
      ))}
      <mesh geometry={fin}>
        <meshStandardMaterial color="#a57b49" side={DoubleSide} metalness={0.7} roughness={0.42} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const y = 2.12 + i * 0.18,
          r = Math.sqrt(Math.max(0.08, 1 - ((y - 3) / 1.16) ** 2));
        return (
          <mesh
            key={i}
            position={[0.1, y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.65 * r, 0.48 * r, 1]}
          >
            <torusGeometry args={[1, 0.025, 6, 40]} />
            <meshStandardMaterial color="#bf9352" metalness={0.75} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}
