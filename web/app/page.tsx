import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import HomeStage from '@/components/home/HomeStage';
import {
  HomeBegin,
  HomeEvents,
  HomeHero,
  HomeHonours,
  HomeStory,
  HomeVoices,
  HomeWhy,
} from '@/components/home/HomeSections';
import { homeGraph } from '@/lib/schema';
import { RAIL_QUERY, STAGE_QUERY } from '@/lib/stage';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * Re-render once a day, so the events section moves an event from "coming up"
 * to "recent" on its own once its date has passed. Time-based revalidation as
 * documented in node_modules/next/dist/docs/01-app/02-guides/
 * incremental-static-regeneration.md; this project does not enable Cache
 * Components, so the segment config applies.
 */
export const revalidate = 86400;

/**
 * Sets the stage layout before first paint, from the same media query
 * HomeStage uses, so a desktop visitor's first frame is already the stage and
 * does not jump from a stacked page. With script off this never runs and the
 * page is the stacked layout. HomeStage keeps the attribute honest afterwards.
 */
const STAGE_FLAG = `var d=document.documentElement,c=navigator.connection,s=c&&(c.saveData||c.effectiveType==='slow-2g'||c.effectiveType==='2g');if(matchMedia(${JSON.stringify(STAGE_QUERY)}).matches)d.dataset.stage='on';else if(!s&&matchMedia(${JSON.stringify(RAIL_QUERY)}).matches)d.dataset.stage='rail'`;

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Nav />
      {/* With JavaScript off the loading screen would never clear. Hide it
          outright and let the page be read. */}
      <noscript>
        <style>{'[data-preloader]{display:none!important}'}</style>
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: STAGE_FLAG }} />
      <main id="main" className="relative">
        <HomeStage>
          <HomeHero />
          <HomeWhy />
          <HomeStory />
          <HomeHonours />
          <HomeEvents now={new Date()} />
          <HomeVoices />
          <HomeBegin />
        </HomeStage>
      </main>
      <Footer />
    </>
  );
}
