import type { Metadata } from 'next';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import ScrollStage from '@/components/ScrollStage';
import StageProgress from '@/components/StageProgress';
import Testimonials from '@/components/Testimonials';
import { homeGraph } from '@/lib/schema';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <Nav />
      {/* Sibling of the masthead on purpose — see the note in StageProgress. */}
      <StageProgress />
      <main id="main">
        {/* Six acts, one continuous gesture sequence. */}
        <ScrollStage />
        <Testimonials />
      </main>
      <Footer />
      <BookingModal />
    </>
  );
}
