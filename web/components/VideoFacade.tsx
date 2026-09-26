'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Play, X } from 'lucide-react';
import {
  type EventVideo,
  videoPoster,
  youtubeEmbed,
  youtubeHref,
} from '@/lib/events';
import { useSmoothScroll } from './SmoothScroll';

/**
 * A recording, shown as a poster until someone asks for it.
 *
 * WHY NOT AN IFRAME PER VIDEO
 * ---------------------------
 * There are eleven recordings on this page. Eleven live YouTube embeds is on the
 * order of a megabyte of third-party JavaScript before anybody has pressed play,
 * and it sets tracking cookies on a page about children's dance classes. The
 * poster is a local image; the iframe is created on click, pointed at
 * youtube-nocookie.com, and destroyed on close.
 *
 * WHY THE TITLES CARRY A CAVEAT
 * -----------------------------
 * Eight of the eleven are unlisted on YouTube, which means oEmbed refused them
 * and their titles were read from og:title instead. They are almost certainly
 * right, but they are scraped rather than supplied, and `titleSource` on each
 * record says which. Nothing is asserted here that lib/events.ts cannot source.
 */
export default function VideoFacade({ video }: { video: EventVideo }) {
  const [playing, setPlaying] = useState(false);
  const poster = videoPoster(video);
  const href = youtubeHref(video);
  /**
   * Embedding is switched off on YouTube for most of these uploads, and an
   * iframe for them shows only "Video unavailable". Those cards go straight to
   * YouTube in a new tab instead of opening a lightbox that cannot play.
   */
  const inline = video.embeddable !== false;

  const posterBody = (
    <div className="relative aspect-[4/3] overflow-hidden bg-teal-deep">
      <Image
        src={poster.src}
        alt={poster.alt}
        width={poster.width}
        height={poster.height}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="h-full w-full object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center bg-teal-deep/10 transition-colors duration-200 group-hover:bg-teal-deep/20"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-cream/90 text-teal ring-1 ring-marigold/60 transition-transform duration-200 ease-temple group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </span>
      {video.kind === 'playlist' ? (
        <span className="absolute top-3 left-3 rounded-full bg-cream/90 px-2.5 py-1 font-sans text-micro font-semibold tracking-[0.12em] text-teal uppercase">
          Playlist
        </span>
      ) : null}
    </div>
  );

  const frame =
    'group relative block w-full overflow-hidden rounded-[1.25rem] border border-marigold/25 bg-paper/60 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-4';

  return (
    <>
      <figure id={`video-${video.id}`} className="scroll-mt-28">
        {inline ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${video.title}`}
            className={frame}
          >
            {posterBody}
          </button>
        ) : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch on YouTube (opens in a new tab): ${video.title}`}
            className={frame}
          >
            {posterBody}
          </a>
        )}

        <figcaption className="px-1 pt-3.5">
          <h3 className="font-display text-[1rem] leading-snug font-semibold text-teal-deep">
            {video.title}
          </h3>
          {video.note ? (
            <p className="max-w-measure mt-1.5 font-sans text-[0.8rem] leading-relaxed text-ink-soft">
              {video.note}
            </p>
          ) : null}
          <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-micro text-ink-faint">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline decoration-marigold/40 underline-offset-4 transition-colors hover:text-ink"
            >
              Open on YouTube <ExternalLink aria-hidden className="h-3 w-3" />
            </a>
            {video.pairingUnconfirmed ? (
              <span title="The poster paired with this recording on the old site may not belong to it.">
                · poster pairing unconfirmed
              </span>
            ) : null}
          </p>
        </figcaption>
      </figure>

      {playing ? <Lightbox video={video} onClose={() => setPlaying(false)} /> : null}
    </>
  );
}

/**
 * Follows the dialog pattern already established by BookingModal and MobileMenu:
 * stop Lenis, move focus in, restore it on close, Escape to dismiss.
 */
function Lightbox({ video, onClose }: { video: EventVideo; onClose: () => void }) {
  const scroll = useSmoothScroll();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    scroll.stop();
    const raf = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      scroll.start();
      returnFocusRef.current?.focus?.();
    };
  }, [scroll]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[80] grid place-items-center bg-teal-deep/80 px-4 py-6 backdrop-blur-sm"
    >
      {/* Click-away. A button rather than a div so it is reachable by keyboard
          even though Escape is the expected route out. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close the video"
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4 pb-3">
          <h2 className="font-display text-[0.95rem] leading-snug font-semibold text-cream sm:text-[1.05rem]">
            {video.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close the video"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/15 text-cream transition-colors hover:bg-cream/25"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-[1.25rem] border border-marigold/30 bg-black">
          <iframe
            src={`${youtubeEmbed(video)}&autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        </div>

        <p className="pt-3 font-sans text-[0.7rem] text-cream/60">
          Played from youtube-nocookie.com.{' '}
          <a
            href={youtubeHref(video)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-marigold/50 underline-offset-4 hover:text-cream"
          >
            Open on YouTube
          </a>
        </p>
      </div>
    </div>
  );
}
