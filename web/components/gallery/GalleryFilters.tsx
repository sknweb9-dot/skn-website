'use client';

import { Search, X } from 'lucide-react';
import {
  batchOptions,
  groupOptions,
  isFiltered,
  subOptions,
  type FilterOption,
  type GalleryFilter,
  type GroupId,
} from '@/lib/gallery';

/**
 * The filters, in up to three rows that open as you go in.
 *
 *   Row 1  what kind of photograph: Classes, Udaan, Arangetrams, ...
 *   Row 2  inside it: the venue (Classes) or the event (the rest)
 *   Row 3  Classes only: the batch at that venue, named by its level and days
 *
 * The class path exists so a parent can get to their child in three taps: Classes,
 * the venue, the batch. The link in the address bar follows each choice, so the
 * result can be kept or sent to the other parent.
 *
 * Sticky under the masthead, and it follows the masthead: the masthead retires
 * on the way down, so the bar slides up to the top with it.
 */
export default function GalleryFilters({
  filter,
  onChange,
  shown,
  total,
}: {
  filter: GalleryFilter;
  onChange: (next: GalleryFilter) => void;
  shown: number;
  total: number;
}) {
  const groups = groupOptions();
  const sub = subOptions(filter.group);
  const batches = filter.group === 'classes' ? batchOptions(filter.venue) : [];

  const setGroup = (group: GroupId | null) => onChange({ ...filter, group, album: null, venue: null, batch: null });
  const setSub = (id: string | null) =>
    sub?.kind === 'venue'
      ? onChange({ ...filter, venue: id, batch: null, album: null })
      : onChange({ ...filter, album: id, venue: null, batch: null });
  const setBatch = (id: string | null) => onChange({ ...filter, batch: id });

  return (
    <div className="gallery-filters border-b border-marigold/20 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[110rem] px-4 py-2.5 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Sized to its chips, not stretched: when the count and search do not
              fit beside them they drop to a line of their own, rather than the
              last chip being clipped behind a scrollbar nobody can see. */}
          <Row label="Show" className="max-w-full min-w-0">
            <Chip active={!filter.group} onClick={() => setGroup(null)}>
              Everything
            </Chip>
            {groups.map((g) => (
              <Chip key={g.id} active={filter.group === g.id} onClick={() => setGroup(g.id)}>
                {g.label}
              </Chip>
            ))}
          </Row>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <p aria-live="polite" className="flex shrink-0 items-center gap-2 font-sans text-[0.74rem] text-ink-faint">
              <span className="tabular-nums">{isFiltered(filter) ? `${shown} of ${total}` : `${total} in all`}</span>
              {isFiltered(filter) ? (
                <button
                  type="button"
                  onClick={() => onChange({ group: null, album: null, venue: null, batch: null, query: '' })}
                  className="inline-flex min-h-8 items-center gap-1 font-semibold text-teal-deep underline decoration-marigold/50 underline-offset-4 hover:text-kumkum"
                >
                  <X aria-hidden className="size-3" />
                  Clear
                </button>
              ) : null}
            </p>
            <label className="relative w-full sm:w-44">
              <span className="sr-only">Search the gallery</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-faint"
              />
              <input
                type="search"
                value={filter.query}
                onChange={(event) => onChange({ ...filter, query: event.target.value })}
                placeholder="Search photos"
                className="min-h-10 w-full rounded-full border border-ink/15 bg-paper/75 py-2 pr-4 pl-9 font-sans text-[0.85rem] text-ink placeholder:text-ink-faint/70 focus:border-teal focus:outline-none"
              />
            </label>
          </div>
        </div>

        {sub ? (
          <Row label={sub.kind === 'venue' ? 'Venue' : 'Event'} className="mt-1.5">
            <Chip active={!filter.venue && !filter.album} onClick={() => setSub(null)}>
              {sub.kind === 'venue' ? 'All venues' : 'All'}
            </Chip>
            {sub.options.map((o) => (
              <Chip
                key={o.id}
                active={sub.kind === 'venue' ? filter.venue === o.id : filter.album === o.id}
                onClick={() => setSub(o.id)}
                detail={o.detail}
              >
                {o.label}
              </Chip>
            ))}
          </Row>
        ) : null}

        {batches.length > 0 ? (
          <Row label="Batch" className="mt-1.5">
            <Chip active={!filter.batch} onClick={() => setBatch(null)}>
              All batches
            </Chip>
            {batches.map((o: FilterOption) => (
              <Chip key={o.id} active={filter.batch === o.id} onClick={() => setBatch(o.id)} detail={o.detail}>
                {o.label}
              </Chip>
            ))}
          </Row>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="group" aria-label={label}>
      <span className="hidden w-12 shrink-0 font-sans text-micro font-semibold tracking-[0.16em] text-nila-700 uppercase sm:block">
        {label}
      </span>
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  detail,
  children,
}: {
  active: boolean;
  onClick: () => void;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-[0.78rem] font-medium whitespace-nowrap transition-colors ${
        active
          ? 'border-teal/40 bg-teal text-cream'
          : 'border-marigold/25 bg-paper/60 text-ink-soft hover:border-marigold/50 hover:text-ink'
      }`}
    >
      <span>{children}</span>
      {detail ? <span className={`text-[0.7rem] ${active ? 'text-cream/80' : 'text-ink-faint'}`}>{detail}</span> : null}
    </button>
  );
}

