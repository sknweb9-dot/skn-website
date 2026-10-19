/**
 * The picture on the Online card until a real photograph is dropped into
 * public/img/locations/online/ (see lib/locationPhotos.ts).
 *
 * It is drawn, not photographed, and says so by being plainly a drawing: a temple
 * arch (the site's structural motif) holding a grid of rounded tiles, one of them
 * lit, which is what a live class looks like on a screen. It uses the site's own
 * tokens, so it sits in the same family as the Chennai and Canada photographs
 * without pretending to be one. Decorative; the card's heading says what it is.
 */
export default function OnlinePlaceholder() {
  const tile = 'var(--color-cream)';
  return (
    <svg
      viewBox="0 0 640 360"
      role="presentation"
      aria-hidden
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="online-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-teal-deep)" />
          <stop offset="1" stopColor="var(--color-midnight)" />
        </linearGradient>
        <radialGradient id="online-glow" cx="0.5" cy="0.62" r="0.55">
          <stop offset="0" stopColor="var(--color-marigold)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--color-marigold)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="360" fill="url(#online-ground)" />
      <rect width="640" height="360" fill="url(#online-glow)" />

      {/* The arch: a doorway of lamplight with a rounded top. */}
      <path
        d="M205 360V170a115 115 0 0 1 230 0v190"
        fill="none"
        stroke="var(--color-marigold)"
        strokeOpacity="0.75"
        strokeWidth="2.5"
      />
      <path
        d="M228 360V172a92 92 0 0 1 184 0v188"
        fill="none"
        stroke="var(--color-marigold)"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />

      {/* Four tiles, the way a group class sits on a screen. */}
      {[
        [250, 128],
        [323, 128],
        [250, 196],
        [323, 196],
      ].map(([x, y], i) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="67"
          height="60"
          rx="10"
          fill={tile}
          fillOpacity={i === 1 ? 0.2 : 0.1}
          stroke={i === 1 ? 'var(--color-marigold)' : tile}
          strokeOpacity={i === 1 ? 1 : 0.28}
          strokeWidth={i === 1 ? 2.5 : 1}
        />
      ))}
      {/* A head and shoulders in each, lit in the speaking tile. */}
      {[
        [283, 148],
        [356, 148],
        [283, 216],
        [356, 216],
      ].map(([cx, cy], i) => (
        <g key={`${cx}-${cy}`} fill={tile} fillOpacity={i === 1 ? 0.95 : 0.5}>
          <circle cx={cx} cy={cy} r="9" />
          <path d={`M${cx - 17} ${cy + 33}a17 17 0 0 1 34 0z`} />
        </g>
      ))}
    </svg>
  );
}
