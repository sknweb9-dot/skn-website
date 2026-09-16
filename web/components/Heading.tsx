import type { ReactNode } from 'react';

/**
 * Renders h1..h6 from a numeric level.
 *
 * Exists because the act panels are structurally identical but the first act
 * must be the page's h1 while the rest are h2s. Branching on the tag in JSX
 * would mean duplicating the whole heading — className, clamp sizes and all.
 */
export default function Heading({
  level,
  className,
  children,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: ReactNode;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Tag className={className}>{children}</Tag>;
}
