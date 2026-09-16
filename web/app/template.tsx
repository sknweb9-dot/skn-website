export default function Template({ children }: { children: React.ReactNode }) {
  /**
   * React remounts a `template` on every navigation, which is exactly the hook a
   * route transition needs — unlike `layout`, which persists.
   *
   * The animation is opacity-only and lives in CSS (see `page-enter` in
   * globals.css) rather than in JS, so it costs nothing at runtime and the global
   * `prefers-reduced-motion` rule already collapses it to 0.01ms without any
   * extra handling here.
   *
   * The wrapper is otherwise unstyled on purpose. Anything that established a
   * containing block would break the fixed masthead and the home page's sticky
   * stage.
   */
  return <div className="page-enter">{children}</div>;
}
