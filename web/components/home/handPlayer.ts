import type { ArchVideo } from './archVideo';

/**
 * The glide: the scroll position sets a target moment in the footage and the
 * playhead eases toward it, so the hand chases the scroll instead of stepping
 * with it. Shared by the desktop stage and the phone rail.
 *
 * The loop runs only while something is moving (the playhead, a seek in flight,
 * or the keyed/raw fade) and stops itself when everything has settled, so a page
 * the visitor is just reading costs nothing.
 *
 * `onFrame` is called each tick with the live frame number (1-based), for the
 * caption under the arch.
 */
export type HandPlayer = {
  /** Ask the hand to be at this many seconds into the footage. */
  setTarget: (seconds: number) => void;
  /** Where the hand is being asked to be. */
  target: () => number;
  /** Jump there without easing (first paint). */
  reset: (seconds: number) => void;
  /** Wake the loop (a seek landed, the fade changed). */
  kick: () => void;
  dispose: () => void;
};

export function createHandPlayer(video: HTMLVideoElement, av: ArchVideo, onFrame: (frame: number) => void): HandPlayer {
  let target = 0;
  let playhead = 0;
  let running = false;
  let disposed = false;
  let last = 0;
  let raf = 0;

  const loop = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    playhead += (target - playhead) * (1 - Math.exp(-dt * 6.5));
    if (Math.abs(target - playhead) < 0.004) playhead = target;
    if (video.readyState >= 1 && !video.seeking && Math.abs(video.currentTime - playhead) > 0.009) {
      video.currentTime = Math.max(0, Math.min(video.duration || 54, playhead));
    }
    av.draw();
    const fading = av.step(dt);
    onFrame(playhead * 6 + 1);

    running = playhead !== target || video.seeking || fading;
    if (running) raf = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (running || disposed) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };

  return {
    setTarget(seconds) {
      target = seconds;
      kick();
    },
    target: () => target,
    reset(seconds) {
      target = seconds;
      playhead = seconds;
      video.currentTime = seconds;
      av.draw(true);
      kick();
    },
    kick,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
    },
  };
}
