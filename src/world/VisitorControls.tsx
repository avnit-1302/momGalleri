import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Raycaster, Vector2, Vector3 } from 'three';
import { photographs, type Photograph, type RoomId } from '../content/museumContent';
import { moveWithCollisions, roomAt, rooms } from './layout';

export interface VisitorInput {
  x: number;
  y: number;
  dragged: boolean;
}
export interface Destination {
  room: RoomId;
  key: number;
}
export interface VisitorProps {
  entered: boolean;
  active: boolean;
  input: MutableRefObject<VisitorInput>;
  destination: Destination;
  onRoom: (room: RoomId) => void;
  onPosition: (position: [number, number]) => void;
  onSelect: (photo: Photograph) => void;
  onTarget: (title: string) => void;
  onLock: (locked: boolean) => void;
}
export function VisitorControls({
  entered,
  active,
  input,
  destination,
  onRoom,
  onPosition,
  onSelect,
  onTarget,
  onLock,
}: VisitorProps) {
  const { camera, gl, scene, size } = useThree();
  const keys = useRef(new Set<string>()),
    angles = useRef({ yaw: 0, pitch: 0 }),
    velocity = useRef(new Vector2());
  const lastRoom = useRef<RoomId>('entrance'),
    timer = useRef(0),
    target = useRef<Photograph | undefined>(undefined);
  const lastPosition = useRef(new Vector2(Infinity, Infinity));
  const ray = useMemo(() => {
      const raycaster = new Raycaster();
      // Only artwork and architectural blockers; never raycast forest instances.
      raycaster.layers.set(1);
      return raycaster;
    }, []),
    euler = useMemo(() => new Euler(0, 0, 0, 'YXZ'), []);
  useEffect(() => {
    if (!entered) return;
    const room = rooms.find((r) => r.id === destination.room)!;
    camera.position.set(...room.spawn);
    angles.current = { yaw: room.yaw, pitch: 0 };
    camera.rotation.set(0, room.yaw, 0, 'YXZ');
    velocity.current.set(0, 0);
    lastRoom.current = room.id;
    onRoom(room.id);
    onPosition([room.spawn[0], room.spawn[2]]);
  }, [entered, destination, camera, onRoom, onPosition]);
  useEffect(() => {
    if (!entered) {
      if (size.width < 700) {
        camera.position.set(9, 4.2, -11);
        camera.lookAt(0, 1.7, 0);
      } else {
        camera.position.set(8, 3.5, -7.8);
        camera.lookAt(4, 2.6, 5);
      }
    }
  }, [entered, camera, size.width]);
  useEffect(() => {
    if (!active) {
      keys.current.clear();
      velocity.current.set(0, 0);
      input.current.x = input.current.y = 0;
      target.current = undefined;
      onTarget('');
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [active, input, onTarget]);
  useEffect(() => {
    const canvas = gl.domElement;
    const drag = { down: false, x: 0, y: 0, distance: 0, pointer: 0 };
    const inspect = () => {
      if (active && target.current) onSelect(target.current);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && document.pointerLockElement === canvas) {
        document.exitPointerLock();
        return;
      }
      if (!active || event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'ShiftLeft',
          'ShiftRight',
        ].includes(event.code)
      ) {
        event.preventDefault();
        keys.current.add(event.code);
      }
      if (event.code === 'KeyE' && !event.repeat) inspect();
    };
    const keyUp = (event: KeyboardEvent) => keys.current.delete(event.code);
    const reset = () => {
      keys.current.clear();
      drag.down = false;
      input.current.x = input.current.y = 0;
    };
    const lockChange = () => onLock(document.pointerLockElement === canvas);
    const pointerDown = (event: PointerEvent) => {
      if (!active || event.button !== 0) return;
      if (document.pointerLockElement === canvas) {
        inspect();
        return;
      }
      drag.down = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.distance = 0;
      drag.pointer = event.pointerId;
      input.current.dragged = false;
    };
    const pointerMove = (event: PointerEvent) => {
      if (!active) return;
      let dx = 0,
        dy = 0;
      if (document.pointerLockElement === canvas) {
        dx = event.movementX;
        dy = event.movementY;
      } else if (drag.down && event.pointerId === drag.pointer) {
        dx = event.clientX - drag.x;
        dy = event.clientY - drag.y;
        drag.x = event.clientX;
        drag.y = event.clientY;
        drag.distance += Math.abs(dx) + Math.abs(dy);
        input.current.dragged = drag.distance > 8;
      }
      const speed = event.pointerType === 'touch' ? 0.004 : 0.0022;
      angles.current.yaw -= dx * speed;
      angles.current.pitch = Math.max(-1.15, Math.min(1.15, angles.current.pitch - dy * speed));
    };
    const pointerUp = () => {
      drag.down = false;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    document.addEventListener('pointerlockchange', lockChange);
    canvas.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', reset);
    return () => {
      reset();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      document.removeEventListener('pointerlockchange', lockChange);
      canvas.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', reset);
    };
  }, [active, gl, input, onLock, onSelect]);
  useFrame((_, delta) => {
    if (!entered || !active) return;
    const dt = Math.min(delta, 0.05),
      k = keys.current;
    let x =
      Number(k.has('KeyD') || k.has('ArrowRight')) -
      Number(k.has('KeyA') || k.has('ArrowLeft')) +
      input.current.x;
    let z =
      Number(k.has('KeyS') || k.has('ArrowDown')) -
      Number(k.has('KeyW') || k.has('ArrowUp')) +
      input.current.y;
    const length = Math.max(1, Math.hypot(x, z));
    x /= length;
    z /= length;
    const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? 5 : 2.7;
    velocity.current.lerp(new Vector2(x * speed, z * speed), 1 - Math.exp(-dt * 12));
    const { yaw, pitch } = angles.current,
      vx = velocity.current.x,
      vz = velocity.current.y;
    const [nx, nz] = moveWithCollisions(
      camera.position.x,
      camera.position.z,
      (vx * Math.cos(yaw) + vz * Math.sin(yaw)) * dt,
      (-vx * Math.sin(yaw) + vz * Math.cos(yaw)) * dt,
    );
    camera.position.set(nx, 1.7, nz);
    euler.set(pitch, yaw, 0);
    camera.quaternion.setFromEuler(euler);
    timer.current += dt;
    if (timer.current > 0.22) {
      timer.current = 0;
      const room = roomAt(nx, nz);
      if (room !== lastRoom.current) {
        lastRoom.current = room;
        onRoom(room);
      }
      if (Math.hypot(nx - lastPosition.current.x, nz - lastPosition.current.y) > 0.02) {
        lastPosition.current.set(nx, nz);
        onPosition([nx, nz]);
      }
      ray.setFromCamera(new Vector2(0, 0), camera);
      ray.far = 9;
      const hits = ray.intersectObjects(scene.children, true).filter((hit) => {
        const obj = hit.object;
        return (
          obj.userData.photoId ||
          ('material' in obj &&
            !((obj as import('three').Mesh).material as import('three').Material).transparent)
        );
      });
      const photo = photographs.find((p) => p.id === hits[0]?.object.userData.photoId);
      if (target.current?.id !== photo?.id) {
        target.current = photo;
        onTarget(photo?.id ?? '');
      }
    }
  });
  return null;
}
