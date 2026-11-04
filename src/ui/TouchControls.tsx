import { useRef, useState, type MutableRefObject } from 'react';
import type { VisitorInput } from '../world/VisitorControls';
export function TouchControls({ input }: { input: MutableRefObject<VisitorInput> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 }),
    pointer = useRef<number | null>(null);
  const reset = () => {
    pointer.current = null;
    input.current.x = input.current.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  return (
    <div className="touch-controls">
      <div
        className="joystick"
        role="group"
        aria-label="Movement joystick"
        onPointerDown={(e) => {
          if (pointer.current !== null) return;
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (pointer.current !== e.pointerId) return;
          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left - rect.width / 2,
            y = e.clientY - rect.top - rect.height / 2;
          const size = Math.max(1, Math.hypot(x, y) / 34);
          x /= size;
          y /= size;
          input.current.x = x / 34;
          input.current.y = y / 34;
          setKnob({ x, y });
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        <span className="joystick-cross">+</span>
        <span
          className="joystick-knob"
          style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}
        />
      </div>
      <span className="touch-look">Drag in the room to look around</span>
    </div>
  );
}
