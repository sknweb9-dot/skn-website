/**
 * A temple doorway rather than a hairline: a solid marigold border on the
 * aperture's own edge, and a fine second line just outside it. Closed at the
 * foot, because the arch sits against every ground on the page and needs a firm
 * edge on each. Same path as the `arch` mask in app/styles/shapes.css, scaled to the box.
 *
 * Shared by the live arch (HomeStage) and the still one each section carries in
 * the stacked layout, so the two cannot drift apart.
 */
export default function ArchFrame() {
  const path = 'M0 1000V420C0 196 150 54 360 24c210 30 360 172 360 396v580Z';
  return (
    <>
      <svg aria-hidden viewBox="0 0 720 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={path} fill="none" stroke="var(--color-marigold)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 720 1000"
        preserveAspectRatio="none"
        className="absolute -top-[7px] -left-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)]"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--color-marigold)"
          strokeOpacity="0.6"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}
