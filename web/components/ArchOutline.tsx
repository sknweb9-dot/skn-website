/**
 * The stroked edge of the arch aperture.
 *
 * A CSS ring cannot be used here: the `arch` utility masks the element, and the
 * mask clips the ring along with everything else. Stroking the identical path in
 * an overlaid SVG puts the line exactly on the aperture edge instead.
 *
 * `preserveAspectRatio="none"` matches the mask's own stretch behaviour, and
 * `vectorEffect="non-scaling-stroke"` keeps the hairline a true hairline once
 * the viewBox has been squashed to the element's box.
 *
 * The path is deliberately left open — no closing `Z`. The aperture fades to
 * cream at its foot rather than ending on a hard edge, so a stroked bottom line
 * would draw a rule across nothing.
 */
export default function ArchOutline({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 720 1000"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <path
        d="M0 1000V420C0 196 150 54 360 24c210 30 360 172 360 396v580"
        fill="none"
        stroke="var(--color-marigold)"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
