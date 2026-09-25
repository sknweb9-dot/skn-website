'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { GLOBE_FILTERS, type GlobeItem } from '@/lib/events';

/**
 * The gallery index.
 *
 * Lives inside the full-screen overlay, behind the Globe/Index switch — not on
 * the page, where a hundred-odd thumbnails buried everything below it. It is the
 * globe's flat twin rather than a fallback: clicking a thumbnail flies the globe
 * to that plate instead of opening a lightbox, so the two views stay one gallery.
 *
 * It is also what a visitor gets when WebGL is unavailable, and it is where the
 * search lives — lifted from the reference project's directory section, which was
 * the one genuinely useful thing in it. At a hundred plates search is marginal; at
 * the several hundred the academy is about to send, it is the only way to find a
 * particular year.
 *
 * Nothing here is cropped. Cells take their image's own aspect ratio, which is
 * why the layout is columns rather than a grid.
 */
export default function GalleryGrid({
  items,
  onSelect,
  /** Tighter cells and no headings, for use inside the full-screen overlay. */
  compact = false,
}: {
  items: GlobeItem[];
  onSelect?: (item: GlobeItem) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sections = filter
      ? GLOBE_FILTERS.find((f) => f.label === filter)?.sections
      : undefined;

    return items.filter((item) => {
      if (sections && !sections.includes(item.section)) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.subtitle.toLowerCase().includes(needle)
      );
    });
  }, [items, query, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[12rem] sm:max-w-xs">
          <span className="sr-only">Search the gallery</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by event or year"
            className="w-full rounded-full border border-ink/15 bg-paper/75 py-2.5 pr-4 pl-9 font-sans text-[0.85rem] text-ink placeholder:text-ink-faint/70 focus:border-marigold/60 focus:outline-none"
          />
        </label>

        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          <FilterPill active={filter === null} onClick={() => setFilter(null)}>
            All
          </FilterPill>
          {GLOBE_FILTERS.map((f) => (
            <FilterPill
              key={f.label}
              active={filter === f.label}
              onClick={() => setFilter(f.label)}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-3 font-sans text-[0.72rem] text-ink-faint">
        {filtered.length} of {items.length}
      </p>

      {/*
        Columns rather than a grid. Now that every cell keeps its image's own
        aspect ratio, a grid leaves ragged gaps under the short cells in each row;
        columns pack them. The cost is that reading order runs down each column
        instead of across each row, which for a photograph index is an acceptable
        trade — nobody reads a contact sheet in sequence.
      */}
      <ul
        className={`mt-5 gap-3 [column-fill:_balance] ${
          compact
            ? 'columns-2 sm:columns-3 lg:columns-5'
            : 'columns-2 sm:columns-3 lg:columns-4'
        }`}
      >
        {filtered.map((item, index) => (
          <li key={item.id} className="mb-3 break-inside-avoid">
            <Cell
              item={item}
              onSelect={onSelect}
              // The first few are above the fold on most viewports; the rest can
              // wait until scrolled toward.
              priority={index < 4}
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 font-sans text-[0.9rem] text-ink-soft">
          Nothing matches that. Try a year, or an event name like Udaan.
        </p>
      ) : null}
    </div>
  );
}

function Cell({
  item,
  onSelect,
  priority,
}: {
  item: GlobeItem;
  onSelect?: (item: GlobeItem) => void;
  priority: boolean;
}) {
  const isVideo = item.kind === 'video';

  const media = (
    <>
      {/*
        The cell takes the image's own aspect ratio rather than forcing a shape.
        A fixed box plus object-cover was cutting the edges off invitation cards
        and posters, which is where their titles are. The grid comes out as ragged
        rows of differing heights, which is what a wall of real photographs looks
        like.
      */}
      <div
        className="relative overflow-hidden rounded-[0.75rem] border border-marigold/25 bg-silk"
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
          loading={priority ? 'eager' : 'lazy'}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {isVideo ? (
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-2.5 mx-auto grid h-8 w-8 place-items-center rounded-full bg-cream/90 text-teal ring-1 ring-marigold/60"
          >
            <span className="ml-0.5 block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
          </span>
        ) : null}
      </div>
      <div className="px-1 pt-2.5">
        <p className="line-clamp-2 font-sans text-[0.78rem] leading-snug font-medium text-ink">
          {item.title}
        </p>
        <p className="mt-0.5 font-sans text-[0.68rem] text-ink-faint">
          {isVideo ? (item.subtitle.includes('Playlist') ? 'Playlist' : 'Video') : item.subtitle}
        </p>
      </div>
    </>
  );

  // Without a handler this is still a real link to the image or the recording, so
  // the grid works as a document rather than depending on JavaScript.
  if (!onSelect) {
    return (
      <a
        href={item.href ?? item.src}
        {...(item.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="group block rounded-[1rem] focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-4"
      >
        {media}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-4"
    >
      {media}
    </button>
  );
}

function FilterPill({
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
      className={`shrink-0 rounded-full border px-3 py-1.5 font-sans text-[0.72rem] font-medium whitespace-nowrap transition-colors ${
        active
          ? 'border-teal/40 bg-teal text-cream'
          : 'border-marigold/25 bg-paper/60 text-ink-soft hover:border-marigold/50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
