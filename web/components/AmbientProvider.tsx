'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ambient nattuvangam / mridangam loop.
 *
 * No audio file ships with the project yet. Drop a loop into
 * `public/audio/ambient-nattuvangam.mp3`, set AMBIENT_SRC to its path, and the
 * toggle activates itself. While it is null, `available` stays false and every
 * control bound to this provider renders disabled rather than lying to the user.
 *
 * This is a constant rather than a runtime existence check on purpose: probing
 * for a file that is not there logs a 404 to the console on every page load.
 */
const AMBIENT_SRC: string | null = null;
const TARGET_VOLUME = 0.32;

type AmbientContextValue = {
  available: boolean;
  playing: boolean;
  toggle: () => void;
};

const AmbientContext = createContext<AmbientContextValue>({
  available: false,
  playing: false,
  toggle: () => {},
});

export function useAmbient(): AmbientContextValue {
  return useContext(AmbientContext);
}

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [available, setAvailable] = useState(AMBIENT_SRC !== null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (fadeRef.current) window.clearInterval(fadeRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) window.clearInterval(fadeRef.current);

    fadeRef.current = window.setInterval(() => {
      const delta = target - audio.volume;
      if (Math.abs(delta) < 0.02) {
        audio.volume = target;
        if (fadeRef.current) window.clearInterval(fadeRef.current);
        fadeRef.current = null;
        onDone?.();
        return;
      }
      audio.volume = Math.min(1, Math.max(0, audio.volume + delta * 0.18));
    }, 32);
  }, []);

  const toggle = useCallback(() => {
    if (!available || AMBIENT_SRC === null) return;

    if (!audioRef.current) {
      const audio = new Audio(AMBIENT_SRC);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'none';
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (playing) {
      fadeTo(0, () => audio.pause());
      setPlaying(false);
      return;
    }

    // Playback is inside a click handler, so autoplay policy is satisfied.
    void audio
      .play()
      .then(() => {
        setPlaying(true);
        fadeTo(TARGET_VOLUME);
      })
      .catch(() => {
        setAvailable(false);
      });
  }, [available, playing, fadeTo]);

  // Pause when the tab is hidden — an unattended loop is a bad neighbour.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && playing) {
        audioRef.current?.pause();
        setPlaying(false);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [playing]);

  const value = useMemo(() => ({ available, playing, toggle }), [available, playing, toggle]);

  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
}
