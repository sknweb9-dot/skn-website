import type { CSSProperties } from 'react';

/**
 * A blank globe that turns on its own, for the gallery's teaser on /events.
 *
 * A teaser should tease. The gallery page is a sphere of photographs; this is the
 * same sphere with nothing on it yet, a wire of meridians and parallels in
 * marigold on a lit silk ball. It says "there is a globe here" and leaves the
 * photographs for the page it links to, and it costs nothing: no WebGL, no
 * script, no images, so it renders at once and under Data Saver.
 *
 * It is real 3D, not an animation of ellipses: six meridian rings stand at
 * thirty-degree turns inside a box that spins about its axis, with five parallels
 * across them, and the whole thing is tilted the way a globe is. The spin and the
 * rest of the CSS are in app/styles/blank-globe.css. Under reduced motion
 * it stands still, tilted, and is still a globe.
 *
 * Decoration for a link that is already on the page in words, so it is hidden from
 * the reading order.
 */
const MERIDIANS = 6;
const PARALLELS = [-60, -30, 0, 30, 60];

export default function BlankGlobe({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`blank-globe relative block aspect-square w-full ${className}`}>
      <span className="blank-globe-ball absolute inset-[7%] rounded-full" />
      <span className="blank-globe-tilt absolute inset-[7%]">
        <span className="blank-globe-spin absolute inset-0">
          {Array.from({ length: MERIDIANS }, (_, i) => (
            <span
              key={`m${i}`}
              className="blank-globe-line absolute inset-0"
              style={{ transform: `rotateY(${(i * 180) / MERIDIANS}deg)` }}
            />
          ))}
          {PARALLELS.map((latitude) => {
            const radians = (latitude * Math.PI) / 180;
            // A ring of radius cos(lat), raised by sin(lat), half the box either way.
            return (
              <span
                key={`p${latitude}`}
                className="blank-globe-line absolute inset-0"
                style={
                  {
                    transform: `translateY(${(-Math.sin(radians) * 50).toFixed(3)}%) rotateX(90deg) scale(${Math.cos(radians).toFixed(4)})`,
                  } as CSSProperties
                }
              />
            );
          })}
        </span>
      </span>
      <span className="absolute inset-[7%] rounded-full border border-marigold/60" />
    </span>
  );
}
