'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '@/lib/gallery';

/**
 * The small pieces the globe stage is made of: icon buttons, a segmented toggle,
 * the label that follows the pointer, and the panel for a selected plate.
 */

export function IconButton({
  onClick,
  label,
  children,
  className = '',
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`glass glass-lifted grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}

export function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-8 rounded-full px-3 py-1 font-sans text-micro font-medium transition-colors ${
        active ? 'bg-marigold/25 text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Follows the pointer over a plate. On touch there is no pointer to follow; the
 * selected plate's panel carries the same words instead.
 */
export function HoverLabel({
  item,
  screen,
}: {
  item: GalleryItem | null;
  screen: { x: number; y: number } | null;
}) {
  if (!item || !screen) return null;
  const isVideo = item.kind === 'video';
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[140%]"
      style={{ left: screen.x, top: screen.y }}
    >
      <div className="glass glass-lifted grain flex items-center gap-2.5 rounded-full px-4 py-2 shadow-lg">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isVideo ? 'bg-kumkum' : 'bg-marigold'}`} />
        <span className="font-sans text-micro font-semibold tracking-[0.16em] text-nila-700 uppercase">
          {isVideo ? 'Watch' : 'View'}
        </span>
        <span aria-hidden className="text-ink-faint/50">
          ·
        </span>
        <span className="max-w-[16rem] truncate font-sans text-[0.78rem] font-medium text-ink">{item.title}</span>
      </div>
      <div className="mx-auto mt-0.5 h-2 w-px bg-marigold/50" />
    </div>
  );
}

/**
 * Opens inside the globe's window when a plate is selected, to one side so the
 * plate the camera has just travelled to stays in view. Arrow keys step through,
 * and Escape (handled by the stage) puts the globe back in orbit.
 *
 * On a recording this is a facade, not an embed: eleven live iframes would be a
 * megabyte of third-party script and a cookie question on a page about children.
 * The visitor leaves for YouTube on purpose, and the button says so first.
 */
export function PlateDetail({
  item,
  onClose,
  onNext,
  onPrev,
}: {
  item: GalleryItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') onNext();
      else if (event.key === 'ArrowLeft') onPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onNext, onPrev]);

  if (!item) return null;
  const isVideo = item.kind === 'video';

  return (
    <aside
      aria-label="Selected plate"
      className="glass glass-lifted grain animate-rise absolute top-4 right-4 z-10 flex max-h-[calc(100%-2rem)] w-[min(22rem,calc(100%-2rem))] flex-col gap-3.5 overflow-y-auto rounded-[1.4rem] p-4"
    >
      <div className="flex items-start justify-between gap-3 border-b border-marigold/20 pb-3">
        <div>
          <p className="eyebrow">{isVideo ? 'Recording' : 'Photograph'}</p>
          <p className="mt-1 font-sans text-[0.72rem] text-ink-faint">{item.subtitle}</p>
        </div>
        <IconButton onClick={onClose} label="Back to the globe">
          <X className="size-4" />
        </IconButton>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-[0.9rem] border border-marigold/25 bg-silk"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 640px) 90vw, 22rem"
          className="h-full w-full object-contain"
        />
      </div>

      <h2 className="font-display text-[1.05rem] leading-snug font-semibold text-teal-deep">{item.title}</h2>

      {isVideo && item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 py-2.5 font-sans text-sm font-medium text-cream transition-colors hover:bg-teal-lit"
        >
          Watch on YouTube <span aria-hidden>↗</span>
          <span className="sr-only">(opens YouTube)</span>
        </a>
      ) : null}

      <div className="flex items-center justify-between border-t border-marigold/20 pt-3">
        <div className="flex items-center gap-1.5">
          <IconButton onClick={onPrev} label="Previous plate">
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton onClick={onNext} label="Next plate">
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 font-sans text-xs text-ink-faint underline decoration-marigold/40 underline-offset-4 transition-colors hover:text-ink"
        >
          Back to the globe
        </button>
      </div>
    </aside>
  );
}
