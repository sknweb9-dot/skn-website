'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { HOME_SECTIONS, TONE_VALUES, restingFrame } from '@/lib/home';
import { FRAME_COUNT, framePath, mudraAtFrame, MUDRAS } from '@/lib/mudras';
import { frameAt, frameToSeconds, metricsFor, railAnchors } from '@/lib/stage';
import ArchFrame from './ArchFrame';
import { createArchVideo } from './archVideo';
import { createHandPlayer } from './handPlayer';

/**
 * THE RAIL (phones and tablets)
 * -----------------------------
 * The page scrolls as an ordinary stacked page, each section in its own colour
 * band. A small arch is pinned at the top, under the masthead, and the hand in it
 * plays as you scroll. The strip behind it takes the colour of whichever section
 * is under it, and beside the arch it names the gesture on screen and the
 * section being read ("2 / 7 · Why SKN").
 *
 * The big arch in the hero is the page's own still, in the hero section. As you
 * scroll, the live arch follows it, shrinking, and docks into the strip.
 *
 * It uses the same footage, shader and glide as the desktop stage
 * (archVideo.ts, handPlayer.ts); only the layout differs. Mounted only when
 * HomeStage decides the rail is on, so nothing here checks for reduced motion
 * or Data Saver: under either, it never mounts and the page stays stacked.
 *
 * The masthead retires on the way down and returns on the way up (Nav), and the
 * strip slides with it: Nav writes html[data-nav-hidden], CSS moves the strip,
 * and the arch reads the strip's real position on every frame of that slide.
 */

const R = 0.7215;
const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

export default function RailEngine({ onFail }: { onFail: () => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const literalRef = useRef<HTMLSpanElement>(null);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  });

  useEffect(() => {
    const bar = barRef.current;
    const arch = archRef.current;
    const caption = captionRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const heroBox = document.querySelector<HTMLElement>('[data-home-section="hero"] .home-stacked-arch > div');
    const heroCaption = document.querySelector<HTMLElement>('[data-home-section="hero"] .home-stacked-arch > figcaption');
    const sectionEls = HOME_SECTIONS.map((s) => document.querySelector<HTMLElement>(`[data-home-section="${s.id}"]`));
    if (!bar || !arch || !caption || !canvas || !video || !heroBox || sectionEls.some((el) => !el)) return;
    const sections = sectionEls as HTMLElement[];

    const root = document.documentElement;
    const av = createArchVideo(canvas, video);
    if (!av.ok) arch.dataset.gl = 'off';

    const frames = HOME_SECTIONS.map(restingFrame);
    let disposed = false;
    let ready = false;
    let current = -1;
    let captioned = -1;
    let anchors = railAnchors(
      sections.map(() => ({ top: 0, bottom: 1 })),
      1,
      0,
      frames,
    );
    let vh = window.innerHeight;
    let dockH = 140;
    let dockW = dockH * R;
    let barH = 160;
    const dockLeft = 20;
    let heroH = 1;

    const player = createHandPlayer(video, av, (frame) => {
      const mudra = mudraAtFrame(frame);
      if (mudra.order !== captioned) {
        captioned = mudra.order;
        if (nameRef.current) nameRef.current.textContent = mudra.name;
        if (literalRef.current) literalRef.current.textContent = mudra.literal;
      }
    });

    // ---- geometry ----------------------------------------------------------
    const measure = () => {
      vh = window.innerHeight;
      dockH = Math.round(Math.min(168, Math.max(132, 0.2 * vh)));
      dockW = dockH * R;
      barH = dockH + 28;
      const header = document.querySelector('header');
      const navH = header ? header.getBoundingClientRect().height : 76;
      root.style.setProperty('--rail-nav-h', `${navH}px`);
      root.style.setProperty('--rail-bar-h', `${barH}px`);

      const y = window.scrollY;
      heroH = heroBox.getBoundingClientRect().height || 1;

      const big = Math.max(heroH, dockH);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(big * R * dpr);
      const ch = Math.round(big * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      av.draw(true);

      anchors = railAnchors(
        sections.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top + y, bottom: r.bottom + y };
        }),
        vh,
        navH + barH,
        frames,
      );
    };

    // ---- tone ----------------------------------------------------------------
    const skin = (i: number) => {
      const tone = TONE_VALUES[HOME_SECTIONS[i].tone];
      bar.style.setProperty('--rail-tone', tone.value);
      arch.style.setProperty('--niche', tone.niche ?? 'var(--color-lamp)');
      arch.style.setProperty('--glow-opacity', tone.dark ? '1' : '0');
      av.setRaw(tone.dark ? 0 : 1);
      arch.dataset.dark = String(tone.dark);
      caption.dataset.dark = String(tone.dark);
      if (kickerRef.current) {
        kickerRef.current.textContent = `${i + 1} / ${HOME_SECTIONS.length} · ${HOME_SECTIONS[i].label}`;
      }
      player.kick();
    };
    skin(0);
    av.setRaw(1, true);

    // ---- the scroll --------------------------------------------------------
    const update = () => {
      const y = window.scrollY;
      const barRect = bar.getBoundingClientRect();
      const hero = heroBox.getBoundingClientRect();

      // Hero pose -> strip pose. The hero's own still scrolls with the page, so
      // the arch follows it and shrinks into the strip over the first stretch.
      const e = smooth(y / (heroH * 0.7));
      const lerp = (a: number, b: number) => a + (b - a) * e;
      arch.style.left = `${lerp(hero.left, dockLeft)}px`;
      arch.style.top = `${lerp(hero.top, barRect.top + 14)}px`;
      arch.style.width = `${lerp(hero.width, dockW)}px`;
      arch.style.height = `${lerp(hero.height, dockH)}px`;

      // When the footer rises into the strip, the strip leaves with the page it
      // belongs to rather than sitting over the footer.
      const lastBottom = sections[sections.length - 1].getBoundingClientRect().bottom;
      const leave = smooth((lastBottom - barRect.top - 8) / barH);
      arch.style.opacity = String(leave);

      bar.style.opacity = String(smooth((e - 0.5) / 0.5) * leave);
      caption.style.opacity = String(smooth((e - 0.8) / 0.2) * leave);
      // The hero's own caption belongs to the hero pose; it goes as the arch leaves.
      if (heroCaption) heroCaption.style.opacity = String(1 - smooth(e * 3));
      caption.style.top = `${barRect.top + 14}px`;
      caption.style.height = `${dockH}px`;
      caption.style.left = `${dockLeft + dockW + 16}px`;

      // The section under the strip's lower edge.
      const probe = barRect.top + barH + 12;
      let i = 0;
      sections.forEach((el, k) => {
        if (el.getBoundingClientRect().top <= probe) i = k;
      });
      if (i !== current) {
        current = i;
        skin(i);
      }

      player.setTarget(
        frameToSeconds(frameAt(y, anchors, metricsFor(vh), FRAME_COUNT - frames[frames.length - 1], 1)),
      );
    };

    // The strip slides when the masthead comes and goes, with no scroll event to
    // drive the arch along with it, so follow it for the length of the slide.
    let follow = 0;
    const followStrip = () => {
      const until = performance.now() + 650;
      const tick = () => {
        update();
        if (!disposed && performance.now() < until) follow = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(follow);
      follow = requestAnimationFrame(tick);
    };
    const mo = new MutationObserver(followStrip);
    mo.observe(root, { attributes: true, attributeFilter: ['data-nav-hidden'] });

    // ---- the footage ----------------------------------------------------------
    const become = () => {
      if (ready || disposed) return;
      ready = true;
      arch.dataset.ready = '';
      player.reset(Math.max(0.05, player.target()));
      root.dataset.stageLive = '1';
    };
    const progress = () => {
      if (video.readyState >= 3) become();
    };
    // iOS Safari will not buffer a video it has not been asked to play, even when
    // it is muted and inline. Play it for a moment and stop; the glide takes over.
    const prime = () => {
      const p = video.play();
      if (p) p.then(() => video.pause()).catch(() => {});
    };
    const onSeeked = () => {
      av.draw(true);
      player.kick();
    };
    const onError = () => onFailRef.current();
    video.addEventListener('loadedmetadata', prime, { once: true });
    video.addEventListener('canplay', progress);
    video.addEventListener('loadeddata', progress);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    const lastSource = video.querySelector('source:last-of-type');
    lastSource?.addEventListener('error', onError);
    const giveUp = window.setTimeout(become, 9000);
    video.load();

    // ---- go --------------------------------------------------------------------
    const onScroll = () => requestAnimationFrame(update);
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    let fontsDone = false;
    document.fonts?.ready.then(() => {
      if (!fontsDone && !disposed) onResize();
    });

    return () => {
      disposed = true;
      fontsDone = true;
      cancelAnimationFrame(follow);
      window.clearTimeout(giveUp);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      video.removeEventListener('loadedmetadata', prime);
      video.removeEventListener('canplay', progress);
      video.removeEventListener('loadeddata', progress);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      lastSource?.removeEventListener('error', onError);
      player.dispose();
      av.dispose();
      root.style.removeProperty('--rail-nav-h');
      root.style.removeProperty('--rail-bar-h');
      if (heroCaption) heroCaption.style.opacity = '';
    };
  }, []);

  return (
    <>
      <div ref={barRef} aria-hidden className="home-rail-bar" />

      <div ref={archRef} className="home-rail-arch group" data-dark="false">
        <div className="home-arch-box">
          <div className="home-arch-shape arch">
            {/* The first gesture as a still, under the canvas, until the footage
                can play. Hidden once it can (the canvas is transparent around
                the keyed hand, and the still would show through). */}
            <Image
              src={framePath(Math.round(restingFrame(HOME_SECTIONS[0])))}
              alt=""
              fill
              unoptimized
              sizes="12rem"
              className="home-rail-still object-cover object-[50%_18%]"
            />
            <canvas
              ref={canvasRef}
              className="home-arch-canvas"
              role="img"
              aria-label="A dancer's hand forming the asamyuta hastas of Bharatanatyam, one gesture flowing into the next"
            />
            <video ref={videoRef} muted playsInline preload="auto" aria-hidden tabIndex={-1} className="home-arch-video">
              <source src="/video/hastas.webm" type="video/webm" />
              <source src="/video/hastas.mp4" type="video/mp4" />
            </video>
          </div>
          <ArchFrame />
        </div>
      </div>

      {/* Beside the arch in the strip. Decorative: the section's own heading is
          what a reader gets, and a caption that changes every few frames would
          be noise for a screen reader. */}
      <div ref={captionRef} aria-hidden className="home-rail-caption" data-dark="false">
        <p ref={kickerRef} className="eyebrow">
          1 / {HOME_SECTIONS.length} · {HOME_SECTIONS[0].label}
        </p>
        <span ref={nameRef} className="home-rail-name">
          {MUDRAS[0].name}
        </span>
        <span ref={literalRef} className="home-rail-literal">
          {MUDRAS[0].literal}
        </span>
      </div>
    </>
  );
}
