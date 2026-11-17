import { useCallback, useEffect, useRef, useState } from 'react';
import { NatureAudio, type SoundPose } from './NatureAudio';

export function useAmbience() {
  const engine = useRef<NatureAudio | null>(null),
    wanted = useRef(false),
    version = useRef(0);
  const [enabled, setEnabled] = useState(false),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(''),
    [volume, setVolumeState] = useState(0.35);
  const volumeRef = useRef(volume);
  const toggle = useCallback(async () => {
    const request = ++version.current;
    wanted.current = !wanted.current;
    setEnabled(wanted.current);
    setError('');
    setLoading(wanted.current);
    try {
      engine.current ??= new NatureAudio();
      engine.current.setVolume(volumeRef.current);
      await engine.current.enable(wanted.current);
    } catch {
      if (version.current === request) {
        wanted.current = false;
        setEnabled(false);
        setError('Museum audio could not load. Select sound to try again.');
        engine.current?.dispose();
        engine.current = null;
      }
    } finally {
      if (version.current === request) setLoading(false);
    }
  }, []);
  const setVolume = useCallback((value: number) => {
    volumeRef.current = value;
    setVolumeState(value);
    engine.current?.setVolume(value);
  }, []);
  const updateListener = useCallback<SoundPose>(
    (...pose) => engine.current?.updateListener(...pose),
    [],
  );
  useEffect(() => {
    const change = () => engine.current?.visibility();
    document.addEventListener('visibilitychange', change);
    return () => {
      document.removeEventListener('visibilitychange', change);
      version.current++;
      wanted.current = false;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  return { enabled, loading, error, volume, setVolume, toggle, updateListener };
}
