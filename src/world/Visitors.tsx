import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
} from 'three';
import { contactTexture } from './materials';
import { visitorRoutes, type VisitorStop } from './visitorRoutes';

function Visitor({
  index,
  route,
  active,
}: {
  index: number;
  route: VisitorStop[];
  active: boolean;
}) {
  const body = useRef<Group>(null!),
    legs = useRef<Group[]>([]),
    arms = useRef<Group[]>([]),
    head = useRef<Group>(null!);
  const motion = useRef({ next: 1, pause: route[0].pause, phase: index * 2, stride: 0 });
  const assets = useMemo(
    () => ({
      limb: new CapsuleGeometry(1, 2, 3, 8),
      jacket: new LatheGeometry(
        [
          new Vector2(0, -0.28),
          new Vector2(0.2, -0.28),
          new Vector2(0.18, -0.05),
          new Vector2(0.225, 0.19),
          new Vector2(0.19, 0.25),
          new Vector2(0.075, 0.3),
        ],
        12,
      ),
      trouserLeg: new CylinderGeometry(0.083, 0.064, 0.72, 10),
      sleeve: new CylinderGeometry(0.077, 0.049, 0.5, 10),
      head: new SphereGeometry(1, 12, 8),
      shadow: contactTexture(),
      coat: new MeshStandardMaterial({
        color: ['#716c5a', '#546365', '#85725f'][index],
        roughness: 0.95,
      }),
      trousers: new MeshStandardMaterial({ color: '#393d3b', roughness: 0.95 }),
      skin: new MeshStandardMaterial({
        color: ['#b68c70', '#d2ad91', '#90664d'][index],
        roughness: 0.85,
      }),
      hair: new MeshStandardMaterial({
        color: ['#443b32', '#52463d', '#302c28'][index],
        roughness: 1,
      }),
      shoes: new MeshStandardMaterial({ color: '#292b29', roughness: 0.8 }),
    }),
    [index],
  );
  useEffect(() => () => Object.values(assets).forEach((asset) => asset.dispose()), [assets]);
  useFrame(({ camera }, delta) => {
    if (!active || document.hidden) return;
    const dt = Math.min(delta, 0.05),
      state = motion.current,
      group = body.current;
    const next = route[state.next],
      previous = route[(state.next + route.length - 1) % route.length];
    const dx = next.x - group.position.x,
      dz = next.z - group.position.z,
      distance = Math.hypot(dx, dz);
    const nearVisitor =
      Math.hypot(camera.position.x - group.position.x, camera.position.z - group.position.z) < 1.4;
    const walking = state.pause <= 0 && !nearVisitor && distance > 0.04;
    const desiredAngle = walking
      ? Math.atan2(dx, dz)
      : Math.atan2(previous.lookX - group.position.x, previous.lookZ - group.position.z);
    const angleDelta = Math.atan2(
      Math.sin(desiredAngle - group.rotation.y),
      Math.cos(desiredAngle - group.rotation.y),
    );
    group.rotation.y += angleDelta * Math.min(1, dt * 2.2);
    if (walking) {
      const step = Math.min(distance, dt * (0.48 + index * 0.035));
      group.position.x += (dx / distance) * step;
      group.position.z += (dz / distance) * step;
    } else if (state.pause > 0) state.pause -= dt;
    else if (distance <= 0.04) {
      state.pause = next.pause;
      state.next = (state.next + 1) % route.length;
    }
    state.stride += ((walking ? 0.23 : 0) - state.stride) * Math.min(1, dt * 5);
    state.phase += dt * 3.3;
    for (let side = 0; side < 2; side++) {
      legs.current[side].rotation.x = Math.sin(state.phase + side * Math.PI) * state.stride;
      arms.current[side].rotation.x = -Math.sin(state.phase + side * Math.PI) * state.stride * 0.55;
    }
    head.current.rotation.y = walking ? 0 : Math.sin(state.phase * 0.27) * 0.12;
  });
  return (
    <group
      ref={body}
      name={`Museum visitor ${index + 1}`}
      position={[route[0].x, 0, route[0].z]}
      rotation={[0, Math.atan2(route[0].lookX - route[0].x, route[0].lookZ - route[0].z), 0]}
    >
      {/* Moving people use contact shadows, never invalidate the static shadow map. */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.7]} />
        <meshBasicMaterial
          map={assets.shadow}
          color="#25251e"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={assets.jacket}
        material={assets.coat}
        position={[0, 1.12, 0]}
        scale={[1, 1, 0.62]}
      />
      <mesh
        geometry={assets.limb}
        material={assets.trousers}
        position={[0, 0.82, 0]}
        scale={[0.18, 0.07, 0.13]}
      />
      {[0, 1].map((side) => (
        <group key={side}>
          <group
            ref={(node) => {
              if (node) legs.current[side] = node;
            }}
            position={[(side ? 1 : -1) * 0.105, 0.84, 0]}
          >
            <mesh
              geometry={assets.trouserLeg}
              material={assets.trousers}
              position={[0, -0.36, 0]}
            />
            <mesh
              geometry={assets.head}
              material={assets.shoes}
              position={[0, -0.77, 0.045]}
              scale={[0.078, 0.052, 0.135]}
            />
          </group>
          <group
            ref={(node) => {
              if (node) arms.current[side] = node;
            }}
            position={[(side ? 1 : -1) * 0.23, 1.33, 0]}
            rotation={[0, 0, (side ? 1 : -1) * 0.07]}
          >
            <mesh geometry={assets.sleeve} material={assets.coat} position={[0, -0.24, 0]} />
            <mesh
              geometry={assets.head}
              material={assets.skin}
              position={[0, -0.52, 0]}
              scale={[0.048, 0.075, 0.045]}
            />
          </group>
        </group>
      ))}
      <group ref={head} position={[0, 1.57, 0]}>
        <mesh
          geometry={assets.limb}
          material={assets.skin}
          position={[0, -0.12, 0]}
          scale={[0.065, 0.04, 0.065]}
        />
        <mesh geometry={assets.head} material={assets.skin} scale={[0.095, 0.125, 0.1]} />
        <mesh
          geometry={assets.head}
          material={assets.hair}
          position={[0, 0.055, -0.035]}
          scale={[0.1, 0.085, 0.09]}
        />
        <mesh
          geometry={assets.head}
          material={assets.skin}
          position={[0, 0.005, 0.095]}
          scale={[0.024, 0.033, 0.035]}
        />
      </group>
    </group>
  );
}

export function Visitors({ low, active }: { low: boolean; active: boolean }) {
  return (
    <group>
      {visitorRoutes.slice(0, low ? 2 : 3).map((route, i) => (
        <Visitor key={i} index={i} route={route} active={active} />
      ))}
    </group>
  );
}
