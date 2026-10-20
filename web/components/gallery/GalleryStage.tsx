'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Maximize2, Minimize2, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { GLOBE_ITEMS, type GalleryItem } from '@/lib/gallery';
import type { GlobeShape } from '@/lib/globe';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import type { GlobeHandle } from './GlobeCanvas';
import { HoverLabel, IconButton, PlateDetail, Segment } from './Chrome';

/**
 * The globe, in a window on the page.
 *
 * It used to open into a full-screen overlay from a button on /events. On its
 * own page it is simply the first thing you see, so there is no overlay, no
 * Globe/Index switch (the index is the rest of the page) and no history entry to
 * manage. three.js is still the largest dependency in the project, so the canvas
 * is a dynamic import that resolves only when the window nears the viewport.
 *
 * The wheel and a vertical drag belong to the page, not the globe: this is a
 * window in a long page, and a wheel that stops scrolling the moment the pointer
 * crosses it is a trap. The globe turns on a mouse drag or a horizontal swipe
 * and zooms on the buttons.
 */
const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), { ssr: false, loading: () => null });

const PREPARE_MARGIN = '400px';

export type StageHandle = {
  /** The ids that stay lit; null lights everything. */
  setLit: (ids: ReadonlySet<string> | null) => void;
  /** Fly to a plate and show it. */
  show: (id: string) => void;
};

const GalleryStage = forwardRef<StageHandle, { litCount: number | null }>(function GalleryStage({ litCount }, ref) {
  const globeRef = useRef<GlobeHandle>(null);
  const stageRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [prepared, setPrepared] = useState(false);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<GalleryItem | null>(null);
  const [screen, setScreen] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [shape, setShape] = useState<GlobeShape>('sphere');
  // Starts paused where motion is suppressed, as the old overlay did. Derived
  // rather than copied into state: the preference is read after hydration, so a
  // copy taken at first render always saw "motion allowed" and the globe span for
  // visitors who had asked it not to. The button sets an override on top.
  const [spinOverride, setSpinOverride] = useState<boolean | null>(null);
  const spinning = spinOverride ?? !reducedMotion;
  const [full, setFull] = useState(false);
  const [hint, setHint] = useState(true);
  const litRef = useRef<ReadonlySet<string> | null>(null);

  useImperativeHandle(ref, () => ({
    setLit(ids) {
      litRef.current = ids;
      globeRef.current?.setFilter(ids);
    },
    show(id) {
      const item = GLOBE_ITEMS.find((i) => i.id === id);
      if (!item) return;
      setSelected(item);
      globeRef.current?.focusItem(id);
      stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    },
  }));

  // Fetch three.js when the window comes within reach.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || prepared) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPrepared(true);
          observer.disconnect();
        }
      },
      { rootMargin: PREPARE_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prepared]);

  useEffect(() => {
    globeRef.current?.setShape(shape);
  }, [shape, ready]);

  useEffect(() => {
    globeRef.current?.setAutoRotate(spinning);
  }, [spinning, ready]);

  useEffect(() => {
    if (ready) globeRef.current?.setFilter(litRef.current);
  }, [ready]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    globeRef.current?.releaseFocus();
  }, []);

  // The Reset button: also puts the sphere back on the front view it opened on.
  const resetView = useCallback(() => {
    setSelected(null);
    globeRef.current?.resetView();
  }, []);

  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') clearSelection();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, clearSelection]);

  const step = useCallback(
    (delta: number) => {
      if (!selected) return;
      const index = GLOBE_ITEMS.findIndex((i) => i.id === selected.id);
      if (index < 0) return;
      const next = GLOBE_ITEMS[(index + delta + GLOBE_ITEMS.length) % GLOBE_ITEMS.length];
      setSelected(next);
      globeRef.current?.focusItem(next.id);
    },
    [selected],
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void stageRef.current?.requestFullscreen().catch(() => {});
  };

  return (
    <section
      ref={stageRef}
      aria-label="The gallery as a globe"
      className="grain relative h-[min(82svh,56rem)] min-h-[32rem] w-full overflow-hidden rounded-[1.6rem] border border-marigold/25 sm:rounded-[2.2rem]"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 45%, var(--color-cream) 0%, var(--color-silk) 58%, var(--color-silk-deep) 100%)',
      }}
    >
      {prepared ? (
        <GlobeCanvas
          ref={globeRef}
          items={GLOBE_ITEMS}
          mode="full"
          embedded
          onHover={(item, at) => {
            setHovered(item);
            setScreen(at ?? null);
            if (item) setHint(false);
          }}
          onSelect={(item) => {
            setSelected(item);
            setHovered(null);
          }}
          onReady={() => setReady(true)}
        />
      ) : null}

      <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-3 sm:top-5 sm:left-6">
        <div>
          <p className="eyebrow leading-none">The record</p>
          <p className="mt-1.5 font-sans text-micro text-ink-faint">
            {GLOBE_ITEMS.length} plates
            {litCount !== null ? ` · ${litCount} match` : ''}
          </p>
        </div>
      </div>

      {/* Controls. Stacked down the right edge so the plate's panel, which opens
          to the same side, can sit beside them rather than over them. */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 sm:bottom-5 sm:left-6">
        <div className="glass glass-lifted flex items-center gap-0.5 rounded-full p-1">
          <Segment active={shape === 'sphere'} onClick={() => setShape('sphere')}>
            Sphere
          </Segment>
          <Segment active={shape === 'ring'} onClick={() => setShape('ring')}>
            Ring
          </Segment>
        </div>
        {/* WCAG 2.2.2: a turning globe has a pause. */}
        <IconButton onClick={() => setSpinOverride(!spinning)} label={spinning ? 'Pause the rotation' : 'Resume the rotation'}>
          {spinning ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
        </IconButton>
        <IconButton onClick={() => globeRef.current?.zoom(-1)} label="Draw closer">
          <Plus className="size-4" />
        </IconButton>
        <IconButton onClick={() => globeRef.current?.zoom(1)} label="Draw back">
          <Minus className="size-4" />
        </IconButton>
        <IconButton onClick={resetView} label="Reset the view">
          <RotateCcw className="size-3.5" />
        </IconButton>
        <IconButton onClick={toggleFullscreen} label={full ? 'Leave fullscreen' : 'Fill the screen'} className="hidden sm:grid">
          {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </IconButton>
      </div>

      {hint && !selected && ready ? (
        <p className="glass glass-lifted pointer-events-none absolute right-4 bottom-4 hidden rounded-full px-4 py-1.5 font-sans text-micro tracking-[0.12em] text-ink-faint uppercase sm:block sm:right-6 sm:bottom-5">
          Drag to turn · tap a plate
        </p>
      ) : null}

      {!ready ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center font-sans text-[0.82rem] text-ink-faint">
          {prepared ? 'Preparing the gallery…' : ''}
        </p>
      ) : null}

      <HoverLabel item={hovered} screen={screen} />
      <PlateDetail item={selected} onClose={clearSelection} onNext={() => step(1)} onPrev={() => step(-1)} />
    </section>
  );
});

export default GalleryStage;
