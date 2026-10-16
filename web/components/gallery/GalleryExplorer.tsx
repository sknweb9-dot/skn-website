'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  ALL_ITEMS,
  GLOBE_ITEMS,
  NO_FILTER,
  filterToQuery,
  isFiltered,
  matches,
  queryToFilter,
  type GalleryFilter,
} from '@/lib/gallery';
import GalleryFilters from './GalleryFilters';
import GalleryIndex from './GalleryIndex';
import GalleryStage, { type StageHandle } from './GalleryStage';

/**
 * The gallery page's interactive part: the globe, the filters and the index, all
 * driven by one filter.
 *
 * The filter lives in the address bar (?group=classes&venue=adroit&batch=AD1), so
 * a parent can keep the link or send it to the other parent, and the back button
 * steps through filters. It is read with useSyncExternalStore: the server and the
 * first client render both see an empty query and agree, then the real one
 * arrives, so there is no hydration mismatch and no effect that sets state.
 * The index is ordinary markup in the server-rendered page, so with no script
 * every photograph is still there.
 */

const EVENT = 'gallery:filter';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export default function GalleryExplorer() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => '',
  );
  const filter = useMemo<GalleryFilter>(() => (search ? queryToFilter(search) : NO_FILTER), [search]);

  const setFilter = useCallback((next: GalleryFilter) => {
    const query = filterToQuery(next);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const visible = useMemo(() => ALL_ITEMS.filter((item) => matches(item, filter)), [filter]);
  const active = isFiltered(filter);

  // What lights up on the globe: the matching plates it actually carries.
  const lit = useMemo(() => {
    if (!active) return null;
    const ids = new Set(visible.map((i) => i.id));
    return new Set(GLOBE_ITEMS.filter((i) => ids.has(i.id)).map((i) => i.id));
  }, [active, visible]);

  const stage = useRef<StageHandle>(null);
  useEffect(() => {
    stage.current?.setLit(lit);
  }, [lit]);

  return (
    <>
      <div className="px-4 sm:px-8">
        <div className="mx-auto max-w-[110rem]">
          <GalleryStage ref={stage} litCount={lit ? lit.size : null} />
          <p className="sr-only">
            The globe is a visual view of the photographs and recordings listed below. Everything on it, and more, is in the index.
          </p>
          {lit && lit.size === 0 ? (
            <p className="mt-3 text-center font-sans text-[0.82rem] text-ink-faint">
              None of these are on the globe; the {visible.length} below are all in the index.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <GalleryFilters filter={filter} onChange={setFilter} shown={visible.length} total={ALL_ITEMS.length} />
      </div>

      <div id="index" className="mx-auto max-w-[110rem] scroll-mt-40 px-4 py-12 sm:px-8 sm:py-16">
        <GalleryIndex items={visible} />
      </div>
    </>
  );
}
