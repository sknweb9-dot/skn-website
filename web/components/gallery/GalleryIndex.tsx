'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { indexSections, type GalleryItem } from '@/lib/gallery';
import { useSmoothScroll } from '../SmoothScroll';
import { IconButton } from './Chrome';

/**
 * The index: everything that matches, grouped by album.
 *
 * Each album is a heading with its date and a masonry of its photographs, every
 * one at its own shape. Nothing is cropped (a fixed box was cutting the titles
 * off invitation cards in the old grid), and the columns pack the short ones in
 * under the tall ones, so an album reads as a wall of prints rather than as rows
 * with gaps. Reading order runs down each column, which for a set of photographs
 * is the right trade; the album heading and the date are what give it order.
 *
 * Clicking a photograph opens it large, with previous and next through whatever
 * the current filter leaves, in the order they are on the page.
 */
export default function GalleryIndex({ items, onOpen }: { items: GalleryItem[]; onOpen?: (item: GalleryItem) => void }) {
  const sections = useMemo(() => indexSections(items), [items]);
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const [openId, setOpenId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (item: GalleryItem, trigger: HTMLElement) => {
    if (item.kind === 'video' && item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }
    opener.current = trigger;
    setOpenId(item.id);
    onOpen?.(item);
  };

  if (sections.length === 0) {
    return (
      <p className="py-16 text-center font-sans text-[0.95rem] text-ink-soft">
        Nothing matches that. Try a year, an event name like Udaan, or a batch code like AS1.
      </p>
    );
  }

  return (
    <div className="space-y-16 sm:space-y-20">
      {sections.map((section) => {
        const columns = columnClass(section.items.length);
        return (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="scroll-mt-40">
            <header className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-marigold/30 pb-3">
              <h2 id={`${section.id}-h`} className="font-display text-[clamp(1.3rem,2.4vw,1.8rem)] font-semibold text-teal-deep">
                {section.title}
              </h2>
              {section.detail ? <p className="font-sans text-[0.85rem] text-ink-soft">{section.detail}</p> : null}
              <p className="ml-auto font-sans text-micro text-ink-faint tabular-nums">{section.items.length}</p>
            </header>

            <ul className={`gap-3 sm:gap-4 ${columns}`}>
              {section.items.map((item) => (
                <li key={item.id} className="mb-3 break-inside-avoid sm:mb-4">
                  <Cell item={item} onOpen={open} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {openId ? (
        <Lightbox
          items={flat}
          id={openId}
          onChange={setOpenId}
          onClose={() => {
            setOpenId(null);
            opener.current?.focus?.();
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Columns by how many photographs the album has. A fixed count balances four
 * photographs into two very large columns and leaves the right half of the page
 * empty; here a small album keeps the same plate size as a large one.
 */
function columnClass(count: number): string {
  if (count > 14) return 'columns-2 sm:columns-3 lg:columns-5';
  if (count > 8) return 'columns-2 sm:columns-3 lg:columns-4';
  if (count > 3) return 'columns-2 sm:columns-3 lg:columns-4';
  if (count === 3) return 'columns-2 sm:columns-3 lg:columns-3 lg:max-w-[75%]';
  if (count === 2) return 'columns-2 lg:max-w-[50%]';
  return 'columns-1 max-w-sm';
}

function Cell({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: (item: GalleryItem, trigger: HTMLElement) => void;
}) {
  const isVideo = item.kind === 'video';
  return (
    <button
      type="button"
      onClick={(event) => onOpen(item, event.currentTarget)}
      className="group relative block w-full overflow-hidden rounded-[0.8rem] border border-marigold/20 bg-silk text-left transition-[border-color,box-shadow] duration-300 hover:border-marigold/60 hover:shadow-[0_18px_40px_-24px_rgba(43,30,22,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
      style={{ aspectRatio: `${item.width} / ${item.height}` }}
      aria-label={isVideo ? `${item.title} (opens YouTube)` : `Open photograph: ${item.alt}`}
    >
      <Image
        src={item.src}
        alt=""
        width={item.width}
        height={item.height}
        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 24vw"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-temple group-hover:scale-[1.03]"
      />
      {isVideo ? (
        <>
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1a0504]/70 via-transparent to-transparent" />
          <span aria-hidden className="absolute inset-x-0 top-1/2 mx-auto grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-teal ring-1 ring-marigold/60">
            <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-current" />
          </span>
          <span className="absolute inset-x-2.5 bottom-2 line-clamp-2 font-sans text-[0.74rem] leading-snug font-medium text-cream">
            {item.title}
          </span>
        </>
      ) : null}
    </button>
  );
}

function Lightbox({
  items,
  id,
  onChange,
  onClose,
}: {
  items: GalleryItem[];
  id: string;
  onChange: (id: string) => void;
  onClose: () => void;
}) {
  const scroll = useSmoothScroll();
  const closeRef = useRef<HTMLButtonElement>(null);
  const photos = useMemo(() => items.filter((i) => i.kind === 'photo'), [items]);
  const index = photos.findIndex((p) => p.id === id);
  const item = photos[index];

  const go = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      onChange(photos[(index + delta + photos.length) % photos.length].id);
    },
    [photos, index, onChange],
  );

  useEffect(() => {
    scroll.stop();
    closeRef.current?.focus();
    return () => scroll.start();
  }, [scroll]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Tab') {
        // Two buttons and the image: keep Tab on the controls.
        event.preventDefault();
        closeRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!item) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photograph"
      className="fixed inset-0 z-[80] flex flex-col bg-[#14090a]/94 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-7" onClick={(e) => e.stopPropagation()}>
        <p className="min-w-0 truncate font-sans text-[0.85rem] text-cream/85">
          {item.subtitle}
          <span className="ml-3 text-cream/55 tabular-nums">
            {index + 1} / {photos.length}
          </span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-11 place-items-center rounded-full text-cream/90 ring-1 ring-cream/25 transition-colors hover:bg-cream/10"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
        <Image
          key={item.id}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="100vw"
          priority
          onClick={(e) => e.stopPropagation()}
          className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-2xl"
        />
        <div className="pointer-events-none absolute inset-x-1 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-4" onClick={(e) => e.stopPropagation()}>
          <IconButton onClick={() => go(-1)} label="Previous photograph" className="pointer-events-auto">
            <ChevronLeft className="size-5" />
          </IconButton>
          <IconButton onClick={() => go(1)} label="Next photograph" className="pointer-events-auto">
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
