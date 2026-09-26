'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Grid2x2,
  Maximize2,
  Minimize2,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import type { GlobeItem } from '@/lib/events';
import { GLOBE_FILTERS } from '@/lib/events';
import type { GlobeShape } from '@/lib/globe';

/**
 * Chrome for the full-screen gallery.
 *
 * PROVENANCE
 * ----------
 * Adapted from the HUD, header, hover label and detail panel in
 * `globefolio-3d-image-animation/src/components/` (Apache-2.0). The structure is
 * theirs; everything visible is not.
 *
 * WHAT WAS KEPT AND WHY
 * ---------------------
 * The pause control is not decoration — WCAG 2.2.2 requires a way to stop
 * content that moves automatically for more than five seconds, and the globe
 * auto-rotates. The filter pills became genuinely useful once they mapped to the
 * academy's own sections rather than invented categories. The hover label is
 * load-bearing: a plate that zooms and a plate that leaves for YouTube must
 * announce which it is before the click, not after.
 *
 * WHAT WAS DROPPED
 * ----------------
 * The spiral layout, whose turn count was tuned for exactly 120 items and
 * becomes an unreadable corkscrew at three hundred. The Copenhagen studio clock,
 * replaced by Chennai and Scarborough, which the academy actually teaches across
 * and which a parent in Toronto has a real reason to read. The "007 GLOBEFOLIO /
 * PROTOTYPE" branding. The Fibonacci-algorithm explainer, whose audience here
 * would be a parent choosing a dance school. The Web Audio blips — the button
 * remains, and a recorded ghungroo may eventually sit behind it, but an
 * oscillator sweep is the wrong texture for this site and unsolicited audio on a
 * children's page is a liability.
 */

// ---------------------------------------------------------------------------
// Hover label
// ---------------------------------------------------------------------------

/**
 * Follows the pointer on a plate.
 *
 * On touch there is no pointer to follow, so the same information is pinned
 * below the sphere instead — see `FocusCaption`. Both read from one item so they
 * can never disagree.
 */
export function HoverLabel({
  item,
  screen,
}: {
  item: GlobeItem | null;
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
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isVideo ? 'bg-kumkum' : 'bg-marigold'}`}
        />
        <span className="font-sans text-micro font-semibold tracking-[0.16em] text-nila-700 uppercase">
          {isVideo ? 'Watch' : 'View'}
        </span>
        <span aria-hidden className="text-ink-faint/50">
          ·
        </span>
        <span className="max-w-[16rem] truncate font-sans text-[0.78rem] font-medium text-ink">
          {item.title}
        </span>
      </div>
      <div className="mx-auto mt-0.5 h-2 w-px bg-marigold/50" />
    </div>
  );
}

/**
 * Touch equivalent of the hover label: names whatever plate is frontmost, pinned
 * where a thumb will not cover it.
 */
export function FocusCaption({ item }: { item: GlobeItem | null }) {
  if (!item) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-5 sm:hidden">
      <div className="glass glass-lifted max-w-full rounded-full px-4 py-2">
        <p className="truncate font-sans text-[0.78rem] text-ink">
          <span className="text-nila-700">
            {item.kind === 'video' ? 'Video' : 'Photograph'}
          </span>
          {' — '}
          {item.title}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header strip
// ---------------------------------------------------------------------------

/** Kept in step with the scheduleTimezone values in lib/classes.ts. */
const CLOCKS = [
  { label: 'Chennai', zone: 'Asia/Kolkata' },
  { label: 'Scarborough', zone: 'America/Toronto' },
] as const;

function useClocks(active: boolean) {
  const [times, setTimes] = useState<string[] | null>(null);

  useEffect(() => {
    if (!active) return;

    const tick = () => {
      setTimes(
        CLOCKS.map((clock) => {
          try {
            return new Intl.DateTimeFormat('en-GB', {
              timeZone: clock.zone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(new Date());
          } catch {
            return '--:--';
          }
        }),
      );
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [active]);

  // Null until the first client tick, so the server and the browser never render
  // two different times and trip a hydration mismatch.
  return times;
}

export function GalleryHeader({
  view,
  onView,
  onClose,
  count,
  videoCount,
}: {
  view: 'globe' | 'grid';
  onView: (view: 'globe' | 'grid') => void;
  onClose: () => void;
  count: number;
  videoCount: number;
}) {
  const times = useClocks(true);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex items-start justify-between gap-3 px-4 py-4 sm:px-7 sm:py-5">
      {/* Identity and the two teaching time zones */}
      <div className="pointer-events-auto flex min-w-0 items-center gap-3">
        <span className="arch grid h-9 w-7 shrink-0 place-items-center bg-teal-deep">
          <Circle className="h-2 w-2 fill-marigold text-marigold" />
        </span>
        {/* Hidden below sm: at 390px the plate count and two clocks wrap into
            three lines and collide with the view switcher. The same numbers are
            in the index view, which is where someone on a phone will read them. */}
        <div className="hidden min-w-0 sm:block">
          <p className="eyebrow leading-none">The record</p>
          <p className="mt-1 truncate font-sans text-micro text-ink-faint">
            {count} plates · {videoCount} to watch
            {times ? (
              <span>
                {'  ·  '}
                {CLOCKS.map((clock, i) => `${clock.label} ${times[i]}`).join('  ·  ')}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Globe / grid */}
      <div className="glass glass-lifted pointer-events-auto flex items-center gap-1 rounded-full p-1">
        <ViewTab active={view === 'globe'} onClick={() => onView('globe')} icon={<Orbit className="h-3.5 w-3.5" />}>
          Globe
        </ViewTab>
        <ViewTab active={view === 'grid'} onClick={() => onView('grid')} icon={<Grid2x2 className="h-3.5 w-3.5" />}>
          Index
        </ViewTab>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <IconButton
          onClick={toggleFullscreen}
          label={isFull ? 'Leave fullscreen' : 'Fill the screen'}
          className="hidden sm:inline-flex"
        >
          {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </IconButton>
        <IconButton onClick={onClose} label="Close the gallery">
          <X className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
        active ? 'bg-teal text-cream' : 'text-ink-soft hover:bg-marigold/10 hover:text-ink'
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function IconButton({
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
      className={`glass glass-lifted grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Control dock
// ---------------------------------------------------------------------------

export function GalleryDock({
  activeFilter,
  onFilter,
  shape,
  onShape,
  spinning,
  onSpin,
  onReset,
  showHint,
}: {
  /** null is "All" */
  activeFilter: string | null;
  onFilter: (label: string | null) => void;
  shape: GlobeShape;
  onShape: (shape: GlobeShape) => void;
  spinning: boolean;
  onSpin: (on: boolean) => void;
  onReset: () => void;
  showHint: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[65] flex flex-col items-center gap-2.5 px-3 pb-4 sm:pb-6">
      {/* Discoverability, not furniture: drag-to-orbit is not a guessable
          interaction. Fades out once the visitor has done it. The wheel half is
          dropped on touch, where there is no wheel. */}
      {showHint ? (
        <p className="glass glass-lifted pointer-events-auto rounded-full px-4 py-1.5 text-center font-sans text-micro tracking-[0.12em] text-ink-faint uppercase">
          Drag to turn<span className="hidden sm:inline"> · scroll to draw closer</span> · tap a
          plate
        </p>
      ) : null}

      <div className="glass glass-lifted grain pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 rounded-[1.4rem] p-2 sm:flex-nowrap sm:gap-4 sm:rounded-full sm:p-2.5">
        {/* Sections. These are the old site's own headings, not invented tags. */}
        <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto py-0.5">
          <Pill active={activeFilter === null} onClick={() => onFilter(null)}>
            All
          </Pill>
          {GLOBE_FILTERS.map((filter) => (
            <Pill
              key={filter.label}
              active={activeFilter === filter.label}
              onClick={() => onFilter(filter.label)}
            >
              {filter.label}
            </Pill>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-marigold/25 bg-paper/60 p-0.5">
            <Segment active={shape === 'sphere'} onClick={() => onShape('sphere')}>
              Sphere
            </Segment>
            <Segment active={shape === 'ring'} onClick={() => onShape('ring')}>
              Ring
            </Segment>
          </div>

          {/* WCAG 2.2.2 — not optional. */}
          <IconButton
            onClick={() => onSpin(!spinning)}
            label={spinning ? 'Pause the rotation' : 'Resume the rotation'}
          >
            {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </IconButton>

          <IconButton onClick={onReset} label="Reset the view">
            <RotateCcw className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function Pill({
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
      className={`shrink-0 rounded-full px-3 py-1.5 font-sans text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-teal text-cream'
          : 'text-ink-soft hover:bg-marigold/10 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Segment({
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
      className={`rounded-full px-2.5 py-1 font-sans text-micro font-medium transition-colors ${
        active ? 'bg-marigold/25 text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

/**
 * Opens when a plate is selected.
 *
 * A side panel rather than a centred modal: the globe has just travelled to put
 * this plate in front of the camera, and covering it with the panel would throw
 * that away. Arrow keys step through, Escape returns to orbit — the same
 * shortcuts the reference used, which were the right ones.
 *
 * On a video this is a facade, not an embed. Eleven live iframes would be
 * roughly a megabyte of third-party JavaScript and a cookie-consent problem on a
 * page about children; the visitor leaves for YouTube deliberately, and the
 * label says so before they commit.
 */
export function GalleryDetail({
  item,
  onClose,
  onNext,
  onPrev,
}: {
  item: GlobeItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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
      ref={panelRef}
      aria-label="Selected item"
      className="glass glass-lifted grain animate-rise fixed top-[4.75rem] right-3 z-[68] flex max-h-[calc(100dvh-6.5rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-4 overflow-y-auto rounded-[1.4rem] p-5 sm:right-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-marigold/20 pb-3">
        <div>
          <p className="eyebrow">{isVideo ? 'Recording' : 'Photograph'}</p>
          <p className="mt-1 font-sans text-[0.72rem] text-ink-faint">{item.subtitle}</p>
        </div>
        <IconButton onClick={onClose} label="Back to the globe">
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Whole image, its own shape. Nothing is cropped in the detail view — this
          is the one place someone has explicitly asked to see the thing. */}
      <div
        className="relative w-full overflow-hidden rounded-[0.9rem] border border-marigold/25 bg-silk"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 640px) 90vw, 24rem"
          className="h-full w-full object-contain"
        />
      </div>

      <h2 className="font-display text-[1.15rem] leading-snug font-semibold text-teal-deep">
        {item.title}
      </h2>

      {item.placeholder ? (
        <p className="rounded-xl border border-kumkum/30 bg-kumkum/5 px-3 py-2 font-sans text-[0.7rem] leading-relaxed text-kumkum">
          Prototype caption. The photograph is the academy&rsquo;s own; the album and
          date shown here are placeholders awaiting the real ones.
        </p>
      ) : null}

      {isVideo && item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-5 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-teal-lit"
        >
          Watch on YouTube <span aria-hidden>↗</span>
        </a>
      ) : null}

      <div className="flex items-center justify-between border-t border-marigold/20 pt-3">
        <div className="flex items-center gap-1.5">
          <IconButton onClick={onPrev} label="Previous plate">
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onNext} label="Next plate">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-xs text-ink-faint underline decoration-marigold/40 underline-offset-4 transition-colors hover:text-ink"
        >
          Back to the globe
        </button>
      </div>
    </aside>
  );
}
