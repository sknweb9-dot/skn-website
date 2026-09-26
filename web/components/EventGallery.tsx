'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { gsap } from 'gsap';
import { Orbit } from 'lucide-react';
import { GLOBE_FILTERS, GLOBE_ITEMS, type GlobeItem } from '@/lib/events';
import type { GlobeHandle } from './GlobeCanvas';
import type { GlobeShape } from '@/lib/globe';
import { useSmoothScroll } from './SmoothScroll';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import ArchOutline from './ArchOutline';
import GalleryGrid from './GalleryGrid';
import {
  FocusCaption,
  GalleryDetail,
  GalleryDock,
  GalleryHeader,
  HoverLabel,
} from './GalleryChrome';

/**
 * The gallery section, and the full-screen globe it opens into.
 *
 * WHY THE CANVAS IS BEHIND A BUTTON
 * ---------------------------------
 * three.js is the largest dependency in this project. Loading it on every visit
 * to /events to render a decorative window would be indefensible, so it is a
 * dynamic import that resolves only when the section nears the viewport, and the
 * remaining plates load only once the gallery is opened. The page's own content —
 * the Udaan copy, the recordings, the photograph grid — is ordinary markup that
 * neither waits for nor depends on any of it.
 *
 * WHY A BUTTON AND NOT A DOUBLE TAP
 * ---------------------------------
 * Double-tap is the browser's pinch-zoom shortcut on mobile AND the activate
 * gesture in VoiceOver and TalkBack, so a screen reader user cannot perform it
 * without triggering activation first. Desktop double-click is undiscoverable,
 * and keyboard users have no equivalent. A real <button> works on tap, click,
 * Enter and Space, and announces itself. The ceremony lives in the press instead:
 * the sphere leans toward you on hover and blooms on activation.
 *
 * WHERE THE INDEX LIVES
 * ---------------------
 * Inside the overlay only, reachable from the Globe/Index switch. It began life
 * inline on the page, which was the right instinct for crawlability and the wrong
 * one for reading: a hundred-odd thumbnails pushed everything after the gallery
 * several screens down. See the note further down for what that trade costs and
 * why it is small.
 *
 * WHY THE OVERLAY IS A PORTAL
 * ---------------------------
 * Reveal wraps most section content and animates `y` with GSAP without clearing
 * props, so its wrapper keeps a `transform` after the tween finishes. A
 * transformed ancestor becomes the containing block for `position: fixed`
 * descendants, which would quietly anchor this overlay to a div halfway down the
 * page instead of to the viewport. Portalling to document.body sidesteps the
 * whole class of problem, which is also why globals.css keeps the route
 * transition on opacity alone.
 *
 * WHY TWO CANVAS INSTANCES RATHER THAN ONE
 * ----------------------------------------
 * The teaser instance unmounts as the overlay's mounts, so the scene is rebuilt
 * rather than promoted. That was not the first plan — carrying one renderer
 * across both states is tidier on paper — but it cannot be done through a portal
 * without the canvas changing position in the tree, and the rebuild turns out to
 * be invisible: the plate images are already in the HTTP cache, and the two-second
 * reveal sweep is playing over the top of it. Freeing the teaser's WebGL context
 * is a small bonus, since browsers cap how many a page may hold at once.
 */

/**
 * Loaded on demand, never server-rendered. WebGLRenderer touches `window` in its
 * constructor, and there is nothing worth prerendering — the crawlable gallery is
 * GalleryGrid, below.
 */
const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), {
  ssr: false,
  loading: () => null,
});

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** How close the section has to get before three.js is fetched. */
const PREPARE_MARGIN = '500px';

/**
 * Stands in for the globe where motion is suppressed. The academy's own ensemble
 * photograph rather than a graphic, so the aperture still shows the thing the
 * gallery is about.
 */
const STILL = {
  src: '/img/ensemble.jpg',
  width: 1600,
  height: 1067,
  alt: 'The full ensemble of Shanti Kala Nikketan dancers in Bharatanatyam costume',
} as const;

export default function EventGallery() {
  const globeRef = useRef<GlobeHandle>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const scroll = useSmoothScroll();
  const reducedMotion = usePrefersReducedMotion();

  /** Mount the teaser canvas at all. Flipped by the observer below. */
  const [prepared, setPrepared] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'globe' | 'grid'>('globe');

  const [hovered, setHovered] = useState<GlobeItem | null>(null);
  const [screen, setScreen] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<GlobeItem | null>(null);

  const [filter, setFilter] = useState<string | null>(null);
  const [shape, setShape] = useState<GlobeShape>('sphere');
  /**
   * Starts paused where motion is suppressed. Honouring that preference means
   * the sphere should not begin turning on its own; the pause control in the dock
   * becomes a play control, and the visitor can start it if they want to.
   */
  const [spinning, setSpinning] = useState(!reducedMotion);
  const [hintShown, setHintShown] = useState(true);

  // -------------------------------------------------------------------------
  // Fetch three.js when the section comes within reach, not on page load.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || prepared) return;

    // No teaser canvas under reduced motion: a sphere that turns by itself is
    // precisely what that preference asks us not to build. The gallery is still
    // fully available — it is the grid, and the globe can still be opened
    // deliberately, where it will honour the preference and skip the reveal.
    if (reducedMotion) return;

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
  }, [prepared, reducedMotion]);

  // -------------------------------------------------------------------------
  // Opening and closing
  // -------------------------------------------------------------------------
  const closeGallery = useCallback(() => {
    setOpen(false);
    setSelected(null);
    setHovered(null);
    setView('globe');
  }, []);

  const openGallery = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    setHintShown(true);
    setSelected(null);
    // A history entry, so the Android back button leaves the gallery rather than
    // the page. popstate below is the only path that consumes it.
    window.history.pushState({ gallery: true }, '');
  }, []);

  /** Single exit, so Escape, the close button and back all behave identically. */
  const requestClose = useCallback(() => {
    if (window.history.state?.gallery) window.history.back();
    else closeGallery();
  }, [closeGallery]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      // Escape backs out one level: a selected plate first, then the gallery.
      if (selected) {
        setSelected(null);
        globeRef.current?.resetView();
      } else {
        requestClose();
      }
    }

    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', closeGallery);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', closeGallery);
    };
  }, [open, selected, closeGallery, requestClose]);

  // Scroll lock and focus, following BookingModal and MobileMenu.
  useEffect(() => {
    if (!open) return;

    // Captured now: by the time this cleanup runs the ref may already have been
    // detached, and losing it would drop focus to the top of the document.
    const fallbackFocus = openButtonRef.current;

    scroll.stop();
    const raf = requestAnimationFrame(() => {
      layerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      scroll.start();
      // Back to the button that opened it, not the top of the document.
      (returnFocusRef.current ?? fallbackFocus)?.focus?.();
    };
  }, [open, scroll]);

  // Keep Tab inside the overlay.
  const onLayerKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const nodes = layerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;

    const list = Array.from(nodes);
    const first = list[0];
    const last = list[list.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  /**
   * The bloom. Runs on the wrapper layer rather than on the canvas, so the
   * renderer is never resized mid-tween — resizing a WebGL canvas reallocates its
   * buffers, and doing that on every frame of a transition is how you get the
   * white-flash repaint bugs this repo has already had to fix once.
   */
  useEffect(() => {
    const layer = layerRef.current;
    if (!open || !layer || reducedMotion) return;

    const tween = gsap.fromTo(
      layer,
      { opacity: 0, scale: 1.04 },
      { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out', clearProps: 'scale,opacity' },
    );
    return () => {
      tween.kill();
    };
  }, [open, reducedMotion]);

  // -------------------------------------------------------------------------
  // Control wiring. Each runs against whichever canvas instance is current.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const sections = filter
      ? (GLOBE_FILTERS.find((f) => f.label === filter)?.sections ?? null)
      : null;
    globeRef.current?.setFilter(sections);
  }, [filter, open]);

  useEffect(() => {
    globeRef.current?.setShape(shape);
  }, [shape, open]);

  useEffect(() => {
    globeRef.current?.setAutoRotate(spinning);
  }, [spinning, open]);

  const handleHover = useCallback((item: GlobeItem | null, at?: { x: number; y: number }) => {
    setHovered(item);
    setScreen(at ?? null);
    if (item) setHintShown(false);
  }, []);

  const handleSelect = useCallback((item: GlobeItem | null) => {
    setSelected(item);
    setHovered(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    globeRef.current?.resetView();
  }, []);

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

  const selectFromGrid = useCallback((item: GlobeItem) => {
    setView('globe');
    setSelected(item);
    // The canvas has to be interactive again before it can be told to travel.
    requestAnimationFrame(() => globeRef.current?.focusItem(item.id));
  }, []);

  const videoCount = GLOBE_ITEMS.filter((i) => i.kind === 'video').length;

  const overlay = (
    <div
      ref={layerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery"
      onKeyDown={onLayerKeyDown}
      className="fixed inset-0 z-[60] h-[100dvh] w-screen overflow-hidden bg-cream"
    >
      {/* Warm vignette, so the plates sit in a lit room rather than on a flat
          sheet of cream. */}
      <div
        aria-hidden
        className="grain absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, var(--color-cream) 0%, var(--color-silk) 58%, var(--color-silk-deep) 100%)',
        }}
      />

      <div className={`absolute inset-0 ${view === 'grid' ? 'opacity-20' : ''}`}>
        <GlobeCanvas
          ref={globeRef}
          items={GLOBE_ITEMS}
          mode="full"
          onHover={handleHover}
          onSelect={handleSelect}
          onReady={() => setReady(true)}
        />
      </div>

      {view === 'grid' ? (
        <div className="absolute inset-0 overflow-y-auto px-4 pt-24 pb-28 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <GalleryGrid items={GLOBE_ITEMS} onSelect={selectFromGrid} compact />
          </div>
        </div>
      ) : null}

      <GalleryHeader
        view={view}
        onView={setView}
        onClose={requestClose}
        count={GLOBE_ITEMS.length}
        videoCount={videoCount}
      />

      {view === 'globe' ? (
        <>
          <GalleryDock
            activeFilter={filter}
            onFilter={setFilter}
            shape={shape}
            onShape={setShape}
            spinning={spinning}
            onSpin={setSpinning}
            onReset={clearSelection}
            showHint={hintShown && !selected}
          />
          <HoverLabel item={hovered} screen={screen} />
          <FocusCaption item={selected} />
        </>
      ) : null}

      <GalleryDetail
        item={selected}
        onClose={clearSelection}
        onNext={() => step(1)}
        onPrev={() => step(-1)}
      />
    </div>
  );

  return (
    <div ref={sectionRef} id="gallery" className="scroll-mt-28">
      {/* ---------------------------------------------------------------
          The teaser. Its box holds space whether or not the canvas has
          arrived, so nothing shifts when three.js lands.
      --------------------------------------------------------------- */}
      <div className="mx-auto w-full max-w-[22rem] sm:max-w-[26rem]">
        <div className="relative aspect-[0.78] w-full">
          <div className="arch absolute inset-0 overflow-hidden bg-gradient-to-b from-silk to-silk-deep">
            {prepared && !open ? (
              <GlobeCanvas
                ref={globeRef}
                items={GLOBE_ITEMS}
                mode="teaser"
                onReady={() => setReady(true)}
              />
            ) : null}
            {/*
              Reduced motion gets a still plate rather than an empty aperture.
              Suppressing the turning globe is right — that preference is exactly
              about self-animating content — but leaving a blank silk panel behind
              a button reads as something that failed to load. The gallery is
              still entirely available; it opens on request and stays still until
              asked to turn.
            */}
            {reducedMotion ? (
              <Image
                src={STILL.src}
                alt={STILL.alt}
                width={STILL.width}
                height={STILL.height}
                sizes="(max-width: 640px) 90vw, 26rem"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <ArchOutline />

          {/* The affordance covers the whole aperture, because the aperture is
              what it looks like you should press. */}
          <button
            ref={openButtonRef}
            type="button"
            onClick={openGallery}
            className="group absolute inset-0 grid place-items-end justify-items-center pb-7 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-4"
          >
            <span className="glass glass-lifted grain flex items-center gap-2.5 rounded-full px-5 py-3 transition-transform duration-200 ease-temple group-hover:-translate-y-0.5">
              <Orbit aria-hidden className="h-4 w-4 text-nila-700" />
              <span className="font-sans text-[0.82rem] font-medium text-ink">
                Enter the gallery
              </span>
              <span className="font-sans text-[0.7rem] text-ink-faint">
                {GLOBE_ITEMS.length} plates
              </span>
            </span>
          </button>
        </div>

        <p className="mt-4 text-center font-sans text-[0.78rem] text-ink-faint">
          {ready || reducedMotion || !prepared
            ? 'Photographs and recordings from the academy’s own stages.'
            : 'Preparing the gallery…'}
        </p>
      </div>

      {/* ---------------------------------------------------------------
          The index used to sit here, inline. It does not any more.

          At 107 records — and several hundred once the real albums arrive — it
          turned the page into a scroll marathon: everything below the gallery,
          which includes the Arangetrams, the performances and both calls to
          action, sat underneath a wall of thumbnails nobody asked for. The index
          now lives inside the overlay, one press away, where it is the thing the
          visitor came for rather than an obstacle.

          What that costs, honestly: the thumbnails are no longer in the page's
          own markup for a crawler to follow. It costs less than it sounds like.
          The eleven recordings are still here as real figures with posters,
          captions and outbound links, in their editorial sections. The
          Schema.org graph still carries all twenty-two real items with their
          contentUrls. And the eighty-five padded records have invented captions
          and are excluded from that graph anyway, so they had no search value to
          lose. If a crawlable thumbnail wall is wanted later, the right shape for
          it is its own route — /events/gallery — not four extra screens bolted to
          the foot of this page.
      --------------------------------------------------------------- */}

      {/* The overlay is portalled to the body — see the note at the top of this
          file about transformed ancestors capturing `position: fixed`. `open`
          only ever becomes true from a click handler, so the document is
          certainly available by the time this runs. */}
      {open ? createPortal(overlay, document.body) : null}
    </div>
  );
}
