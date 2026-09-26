import type { Metadata, Viewport } from 'next';
import { Cinzel, Mukta } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/site';
import SmoothScroll from '@/components/SmoothScroll';
import HashScroll from '@/components/HashScroll';
import CurtainObserver from '@/components/CurtainObserver';
import { BookingProvider } from '@/components/BookingProvider';
import { AmbientProvider } from '@/components/AmbientProvider';

const cinzel = Cinzel({
  variable: '--font-cinzel',
  /**
   * `latin-ext` is not optional here.
   *
   * lib/mudras.ts carries 1,123 characters outside the basic latin range — the
   * IAST diacritics on the gesture names, their shlokas and their word-by-word
   * glosses: ā ī ō ū ś Ś ḍ ṃ ṅ ṇ ṛ ṣ ṭ. Every one of those codepoints sits in
   * U+0100–02AF or U+1E00–1E9F, which is exactly what `latin-ext` covers.
   *
   * With `latin` alone the browser resolves them through the fallback stack
   * MID-WORD, so `Mṛgaśīrṣa` renders in two different faces. That lands hardest
   * on /hastas, which is the most distinctive content on the site.
   */
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/**
 * Body face: Mukta, by Ek Type (Mumbai).
 *
 * Replaced Plus Jakarta Sans, which is among the dozen most-used faces on
 * Google Fonts and the one the impeccable detector names as a generated-UI
 * default. Jakarta is a geometric sans; nothing about it belonged to this
 * academy.
 *
 * Mukta was chosen over the other finalist, Alegreya Sans, after both were set
 * on the real pages:
 *   - It comes from an Indian type foundry and was drawn alongside Devanagari,
 *     so its Latin was designed for exactly this job: transliterated Sanskrit
 *     next to English. Every IAST diacritic the site uses is present (checked
 *     against the font's cmap; Hind, a similar candidate, lacks all eight
 *     dot-below letters and was dropped).
 *   - It reads at small sizes on a phone. Alegreya Sans has more calligraphic
 *     voice but a markedly smaller x-height, and every hard-coded size on the
 *     site would have needed bumping to match.
 *   - Humanist rather than geometric, so it sits naturally under Cinzel's
 *     inscriptional capitals instead of fighting them.
 *
 * Static, not variable, so the weights must be listed. These four are the ones
 * the markup uses (400, 500, 600, plus 700 for <strong>); 300 was loaded for
 * Jakarta and never used.
 *
 * `devanagari` is available in this family and deliberately NOT requested yet:
 * nothing on the site sets Devanagari today, and a preloaded subset nobody
 * reads is dead weight. Add it here the day the shlokas are shown in script.
 */
const body = Mukta({
  variable: '--font-body',
  // Same reason as Cinzel above: the gesture names and glosses are set in the
  // body face throughout /hastas and in the live caption under the arch.
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const TITLE = 'Bharatanatyam Dance Academy in Chennai | Shanti Kala Nikketan';
const DESCRIPTION =
  'Kalakshetra-style Bharatanatyam taught the Gurukulam way at five venues across Chennai — Thiruvanmiyur, Sholinganallur and Medavakkam — since 2009. An introductory programme from age 3.5, six graded levels to Arangetram, adults batches, and a branch in Scarborough, Canada. Book a trial session.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: `%s | ${SITE.name}`,
  },
  description: DESCRIPTION,
  applicationName: SITE.name,
  generator: 'Next.js',
  keywords: [
    'dance academy in Chennai',
    'classical dance classes in Chennai',
    'Bharatanatyam classes in Chennai',
    'Bharatanatyam dance academy Sholinganallur',
    'Kalakshetra style Bharatanatyam Chennai',
    'dance classes OMR Chennai',
    'Bharatanatyam classes for kids Chennai',
    'Bharatanatyam classes Perungudi',
    'Bharatanatyam classes Thoraipakkam',
    'Bharatanatyam classes Velachery',
    'Arangetram training Chennai',
    'Gurukulam dance school Chennai',
    'Bharatanatyam classes Scarborough',
    'Indian classical dance Toronto',
    'Bharatanatyam classes Thiruvanmiyur',
    'Bharatanatyam classes Medavakkam',
    'Bharatanatyam classes for adults Chennai',
    'online Bharatanatyam classes',
    'Shanti Kala Nikketan',
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.legalName,
  alternates: {
    canonical: '/',
  },
  category: 'Performing arts education',
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE.url,
    locale: 'en_IN',
    images: [
      {
        url: SITE.ogImage,
        width: 2000,
        height: 1335,
        alt: 'Students of Shanti Kala Nikketan performing Bharatanatyam',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/img/logo-full.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/img/logo-mark.png' }],
  },
  other: {
    'geo.region': 'IN-TN',
    'geo.placename': 'Sholinganallur, Chennai',
    'geo.position': '12.901;80.2279',
    ICBM: '12.901, 80.2279',
  },
};

export const viewport: Viewport = {
  themeColor: '#FBF8F1',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${body.variable}`}>
      <body className="bg-cream text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-kumkum focus:px-5 focus:py-2.5 focus:font-sans focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        <BookingProvider>
          <AmbientProvider>
            <SmoothScroll>
              <HashScroll />
              <CurtainObserver />
              {children}
            </SmoothScroll>
          </AmbientProvider>
        </BookingProvider>
      </body>
    </html>
  );
}
