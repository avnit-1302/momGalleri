import { useCallback, useEffect, useRef, useState } from 'react';
export function useAmbience() {
  const context = useRef<AudioContext | null>(null),
    [enabled, setEnabled] = useState(false);
  const toggle = useCallback(async () => {
    try {
      if (!context.current) {
        const audio = new AudioContext();
        context.current = audio;
        const buffer = audio.createBuffer(1, audio.sampleRate * 4, audio.sampleRate),
          data = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
          data[i] = previous * 3;
        }
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        const gain = audio.createGain();
        gain.gain.value = 0.2;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        source.start();
      }
      if (enabled) {
        await context.current.suspend();
        setEnabled(false);
      } else {
        await context.current.resume();
        setEnabled(true);
      }
    } catch {
      setEnabled(false);
    }
  }, [enabled]);
  useEffect(() => {
    const change = () => {
      if (context.current) {
        if (document.hidden) void context.current.suspend();
        else if (enabled) void context.current.resume();
      }
    };
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, [enabled]);
  useEffect(
    () => () => {
      void context.current?.close();
      context.current = null;
    },
    [],
  );
  return { enabled, toggle };
}
