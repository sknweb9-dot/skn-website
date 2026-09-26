'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { InstagramIcon } from './SocialIcons';
import type { InstagramPost } from '@/lib/instagram';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { SITE } from '@/lib/site';

/**
 * A drifting rail of the academy's latest Instagram posts.
 *
 * ORDER
 * -----
 * Newest first, left to right, because that is what "starting from the latest
 * post" means and it is the order the Graph API returns. The rail begins at rest
 * showing the newest post at the left edge and drifts leftward from there, so the
 * first thing anyone sees is the most recent thing the academy posted.
 *
 * HOW THE LOOP WORKS
 * ------------------
 * The track holds the posts twice and translates by exactly -50%, so the second
 * copy arrives where the first started and the seam is invisible. The duplicate is
 * `aria-hidden` and its links are removed from the tab order — a screen reader
 * should hear each post once, not twice.
 *
 * Duration is derived from the post count rather than fixed, so a busier account
 * gets a longer rail at the same reading speed instead of a faster one.
 *
 * WHY IT CAN BE STOPPED
 * ---------------------
 * WCAG 2.2.2: anything that moves by itself for more than five seconds needs a
 * way to stop it. Same reasoning as the globe's pause control, and the same
 * treatment. It also stops on hover and on keyboard focus, because reading a
 * caption while it slides away is miserable.
 *
 * WHY PLAIN <img>
 * ---------------
 * Instagram serves media from a CDN on signed URLs that expire after a few days.
 * Routing those through next/image would mean whitelisting a third-party CDN in
 * `images.remotePatterns` and filling the optimizer's cache with entries keyed on
 * URLs that are already dead. These are small, lazy, off the critical path, and
 * come pre-sized by Instagram.
 */

/** Seconds a single post takes to cross the rail. */
const SECONDS_PER_POST = 6.5;

export default function InstagramRail({ posts }: { posts: InstagramPost[] }) {
  const reducedMotion = usePrefersReducedMotion();
  /** Set by the pause button. Sticky — hovering away does not undo it. */
  const [userPaused, setUserPaused] = useState(false);
  /** Set by pointer or keyboard entering the rail. Transient. */
  const [engaged, setEngaged] = useState(false);

  // Doubled for the seamless loop. Only worth doing when there is enough to loop.
  const looping = posts.length >= 4 && !reducedMotion;
  const rendered = useMemo(() => (looping ? [...posts, ...posts] : posts), [posts, looping]);

  if (posts.length === 0) return <Unconfigured />;

  const duration = posts.length * SECONDS_PER_POST;
  const running = looping && !userPaused && !engaged;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <a
          href={SITE.socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 font-sans text-[0.85rem] font-medium text-teal transition-colors hover:text-teal-lit"
        >
          <InstagramIcon className="h-4 w-4" />
          @shantikalanikketan
          <ArrowUpRight
            aria-hidden
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>

        {looping ? (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? 'Resume the Instagram rail' : 'Pause the Instagram rail'}
            className="glass grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
          >
            {userPaused ? (
              <Play className="ml-0.5 h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>

      {/*
        Two modes, and they do not share a scroll model.

        Looping: overflow hidden, the track carries the animation permanently, and
        pausing only flips animation-play-state. An earlier version removed the
        animation to pause, which drops the transform back to identity — the rail
        snapped to the start every time the pointer crossed it. It also made the
        container scrollable while paused, so a manual scroll and the transform
        then fought over the same pixels.

        Not looping (too few posts, or motion suppressed): no animation at all,
        and the row is simply scrollable by hand.
      */}
      <div
        className={`mask-x mt-5 ${looping ? 'overflow-hidden' : 'no-scrollbar overflow-x-auto'}`}
        onMouseEnter={() => setEngaged(true)}
        onMouseLeave={() => setEngaged(false)}
        onFocusCapture={() => setEngaged(true)}
        onBlurCapture={() => setEngaged(false)}
      >
        <div
          className="flex w-max gap-4"
          style={
            looping
              ? {
                  animation: `rail-drift ${duration}s linear infinite`,
                  animationPlayState: running ? 'running' : 'paused',
                }
              : undefined
          }
        >
          {rendered.map((post, index) => (
            <Card
              key={`${post.id}-${index}`}
              post={post}
              clone={looping && index >= posts.length}
              newest={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  post,
  clone,
  newest,
}: {
  post: InstagramPost;
  clone: boolean;
  newest: boolean;
}) {
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      className="group relative block w-[13.5rem] shrink-0 overflow-hidden rounded-[1rem] border border-marigold/25 bg-paper/60 transition-colors duration-200 hover:border-teal/50 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-4 sm:w-[15rem]"
    >
      <div className="relative aspect-square overflow-hidden bg-silk">
        {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN
            URLs are signed and expire; see the note at the top of this file. */}
        <img
          src={post.imageUrl}
          alt={post.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
        {newest ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-cream/90 px-2.5 py-1 font-sans text-micro font-semibold tracking-[0.14em] text-nila-700 uppercase">
            Latest
          </span>
        ) : null}
        {post.kind !== 'image' ? (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-cream/90 px-2 py-0.5 font-sans text-micro font-semibold tracking-[0.1em] text-teal uppercase">
            {post.kind === 'video' ? 'Reel' : 'Album'}
          </span>
        ) : null}
      </div>

      <div className="px-3.5 py-3">
        <p className="line-clamp-2 font-sans text-[0.76rem] leading-snug text-ink">
          {post.caption || 'View on Instagram'}
        </p>
        {post.postedAt ? (
          <time
            dateTime={post.postedAt}
            className="mt-1 block font-sans text-micro text-ink-faint"
          >
            {new Date(post.postedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        ) : null}
      </div>
    </a>
  );
}

/**
 * Shown until the Graph API is wired up.
 *
 * Not an error and not a skeleton pretending posts are coming. There is no honest
 * way to show a feed we cannot read, so this says what it is and gives the one
 * thing that does work — a link to the profile. The setup note is visible only
 * outside production, where the person who can fix it will see it.
 */
function Unconfigured() {
  return (
    <div className="rounded-[1.4rem] border border-marigold/25 bg-paper/60 px-6 py-8 text-center">
      <InstagramIcon className="mx-auto h-6 w-6 text-nila-700" />
      <p className="mt-4 font-display text-[1.05rem] font-semibold text-teal-deep">
        Follow the academy on Instagram
      </p>
      <p className="mx-auto mt-2 max-w-md font-sans text-[0.85rem] leading-relaxed text-ink-soft">
        Rehearsals, costume days and stage photographs, posted as they happen.
      </p>
      <a
        href={SITE.socials.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-teal-lit"
      >
        @shantikalanikketan <span aria-hidden>↗</span>
      </a>

      {process.env.NODE_ENV !== 'production' ? (
        <p className="mx-auto mt-6 max-w-lg rounded-xl border border-kumkum/30 bg-kumkum/5 px-4 py-3 font-sans text-[0.72rem] leading-relaxed text-kumkum">
          <strong className="font-semibold">Feed not connected.</strong> Set{' '}
          <code>INSTAGRAM_TOKEN</code> and <code>INSTAGRAM_USER_ID</code> to show the
          live rail — see <code>lib/instagram.ts</code> for what the account needs
          first. Alternatively, send a list of post URLs and this can render them
          as fixed embeds with no credentials at all.
        </p>
      ) : null}
    </div>
  );
}
