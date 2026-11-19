import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AnimationMixer,
  Frustum,
  Group,
  Matrix4,
  Quaternion,
  Sphere,
  Vector3,
  SkinnedMesh,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { assetUrl } from '../content/museumContent';
import { contactTexture } from './materials';
import { canStand } from './layout';
import { visitorPositions } from './visitorSpace';
import { visitorRoutes, type VisitorStop } from './visitorRoutes';

const models = ['harper', 'jordan', 'maya'];
const up = new Vector3(0, 1, 0);
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

function Visitor({
  index,
  route,
  active,
  neighbours,
}: {
  index: number;
  route: VisitorStop[];
  active: boolean;
  neighbours: Vector3[];
}) {
  const gltf = useGLTF(assetUrl(`models/visitors/${models[index]}.glb`));
  const body = useRef<Group>(null!);
  // Skeletons and mixers belong to an instance; geometry, textures and clips remain cached.
  const actor = useMemo(() => {
    const model = clone(gltf.scene);
    model.traverse((node) => {
      node.castShadow = false;
      if ((node as SkinnedMesh).isSkinnedMesh) node.frustumCulled = false;
    });
    const mixer = new AnimationMixer(model);
    const idle = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Idle_Standing')!);
    const walk = mixer.clipAction(gltf.animations.find((clip) => clip.name === 'Walk_Relaxed')!);
    const head = model.getObjectByName('head');
    return {
      model,
      mixer,
      idle,
      walk,
      head,
      headPose: head?.quaternion.clone(),
      turn: new Quaternion(),
      shadow: contactTexture(),
      frustum: new Frustum(),
      matrix: new Matrix4(),
      bounds: new Sphere(new Vector3(), 1.2),
    };
  }, [gltf, index]);
  const motion = useRef({ next: 1, pause: route[0].pause, speed: 0, elapsed: 0, age: index * 2 });
  useEffect(() => {
    // StrictMode runs setup -> cleanup -> setup. Starting actions in useMemo left
    // them permanently stopped after the first cleanup, showing the default A-pose.
    // Reacquire actions after uncacheRoot; old actions retain invalid binding indices.
    actor.idle = actor.mixer.clipAction(
      gltf.animations.find((clip) => clip.name === 'Idle_Standing')!,
    );
    actor.walk = actor.mixer.clipAction(
      gltf.animations.find((clip) => clip.name === 'Walk_Relaxed')!,
    );
    actor.idle.reset().setEffectiveWeight(1).play();
    actor.idle.time = index * 1.7;
    actor.walk.reset().setEffectiveWeight(0).play();
    actor.mixer.update(0); // A relaxed pose is ready even before entering the museum.
    visitorPositions.set(index, body.current.position);
    return () => {
      visitorPositions.delete(index);
      actor.mixer.stopAllAction();
      actor.mixer.uncacheRoot(actor.model);
      const skeletons = new Set<SkinnedMesh['skeleton']>();
      actor.model.traverse((node) => {
        if ((node as SkinnedMesh).isSkinnedMesh) skeletons.add((node as SkinnedMesh).skeleton);
      });
      skeletons.forEach((skeleton) => skeleton.dispose());
      actor.shadow.dispose();
    };
  }, [actor, gltf, index]);
  useFrame(({ camera }, delta) => {
    if (!active || document.hidden) return;
    const dt = Math.min(delta, 0.05),
      state = motion.current,
      group = body.current;
    // Round through navigation-only points without stopping on each one.
    const waypoint = route[state.next];
    if (
      state.pause <= 0 &&
      waypoint.pause === 0 &&
      Math.hypot(waypoint.x - group.position.x, waypoint.z - group.position.z) < 0.35
    )
      state.next = (state.next + 1) % route.length;
    const next = route[state.next],
      previous = route[(state.next + route.length - 1) % route.length];
    const dx = next.x - group.position.x,
      dz = next.z - group.position.z;
    const distance = Math.hypot(dx, dz);
    const playerDistance = Math.hypot(
      camera.position.x - group.position.x,
      camera.position.z - group.position.z,
    );
    const blocked =
      playerDistance < 1.45 ||
      neighbours.some(
        (p, i) =>
          i !== index &&
          p.distanceToSquared(group.position) < 1.6 &&
          (p.x - group.position.x) * dx + (p.z - group.position.z) * dz > 0,
      );
    const travelling = state.pause <= 0 && distance > 0.025;
    const desired = travelling
      ? Math.atan2(dx, dz)
      : Math.atan2(previous.lookX - group.position.x, previous.lookZ - group.position.z);
    const turn = wrap(desired - group.rotation.y);
    // Turn towards the path before advancing; playback speed follows actual travel.
    group.rotation.y += Math.sign(turn) * Math.min(Math.abs(turn), dt * 0.9);
    // Brake before an artwork/turn instead of overshooting into an abrupt idle pose.
    const cruise = 0.72 + index * 0.025;
    const braking = next.pause > 0 ? Math.sqrt(2 * 0.8 * Math.max(0, distance - 0.015)) : cruise;
    const targetSpeed =
      travelling && !blocked && Math.abs(turn) < 0.3 ? Math.min(cruise, braking) : 0;
    state.speed += Math.max(-dt * 1.8, Math.min(dt * 0.9, targetSpeed - state.speed));
    const step = Math.min(distance, dt * state.speed);
    if (travelling && !blocked && step > 0) {
      // Travel in the facing direction as a corner is rounded, never sideways.
      const x = group.position.x + Math.sin(group.rotation.y) * step,
        z = group.position.z + Math.cos(group.rotation.y) * step;
      if (canStand(x, z)) group.position.set(x, 0, z);
      else state.speed = 0;
    } else if (blocked) state.speed = 0;
    if (state.pause > 0) state.pause = Math.max(0, state.pause - dt);
    else if (distance <= 0.025) {
      state.pause = next.pause;
      state.next = (state.next + 1) % route.length;
    }
    neighbours[index].copy(group.position);
    state.elapsed += dt;
    state.age += dt;
    actor.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    actor.frustum.setFromProjectionMatrix(actor.matrix);
    actor.bounds.center.copy(group.position).y += 0.9;
    const visible = actor.frustum.intersectsSphere(actor.bounds) && playerDistance < 65;
    actor.model.visible = visible;
    const interval = visible ? (playerDistance < 16 ? 0 : 1 / 20) : 0.5;
    if (state.elapsed < interval) return;
    const walkingWeight = Math.min(1, state.speed / 0.28);
    actor.walk.setEffectiveWeight(walkingWeight);
    actor.idle.setEffectiveWeight(1 - walkingWeight);
    // The shortened, baked stride covers 0.78 m/s. Keep a natural cadence and
    // account for the smaller stride while blending to/from standing.
    actor.walk.setEffectiveTimeScale(walkingWeight > 0 ? state.speed / (0.78 * walkingWeight) : 0);
    if (actor.head && actor.headPose) actor.head.quaternion.copy(actor.headPose);
    actor.mixer.update(state.elapsed);
    state.elapsed = 0;
    if (actor.head && actor.headPose) {
      actor.headPose.copy(actor.head.quaternion);
      const look = wrap(
        Math.atan2(previous.lookX - group.position.x, previous.lookZ - group.position.z) -
          group.rotation.y,
      );
      const glance =
        state.pause > 0
          ? Math.max(-0.22, Math.min(0.22, look)) + Math.sin(state.age * 0.45) * 0.055
          : 0;
      actor.head.quaternion.multiply(actor.turn.setFromAxisAngle(up, glance));
    }
  });
  return (
    <group
      ref={body}
      name={`Museum visitor ${index + 1}`}
      position={[route[0].x, 0, route[0].z]}
      rotation={[0, Math.atan2(route[0].lookX - route[0].x, route[0].lookZ - route[0].z), 0]}
    >
      <primitive object={actor.model} dispose={null} />
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.65]} />
        <meshBasicMaterial
          map={actor.shadow}
          color="#25251e"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Visitors({ low, active }: { low: boolean; active: boolean }) {
  const count = low ? 2 : 3;
  const neighbours = useMemo(
    () => visitorRoutes.slice(0, count).map((route) => new Vector3(route[0].x, 0, route[0].z)),
    [count],
  );
  return (
    <group>
      {visitorRoutes.slice(0, count).map((route, index) => (
        <Visitor key={index} index={index} route={route} active={active} neighbours={neighbours} />
      ))}
    </group>
  );
}
