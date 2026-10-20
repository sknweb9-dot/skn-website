import type { Metadata, Viewport } from 'next';
import { Cinzel, Mukta } from 'next/font/google';
import './globals.css';
import { HOME_SEO } from '@/lib/seo';
import { SITE } from '@/lib/site';
import SmoothScroll from '@/components/SmoothScroll';
import HashScroll from '@/components/HashScroll';
import CurtainObserver from '@/components/CurtainObserver';
import TextMotion from '@/components/TextMotion';

/**
 * Display face: Cinzel, a variable font, so one file per subset covers every
 * weight listed.
 *
 * `latin-ext` is required, not optional. The gesture names, shlokas and glosses
 * (lib/mudras.ts, set on /hastas and in the live caption under the home arch)
 * carry IAST diacritics, which sit in U+0100-02AF and U+1E00-1E9F. With `latin`
 * alone the browser resolves them through the fallback stack mid-word, so one
 * word renders in two faces.
 */
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/**
 * Body face: Mukta, by Ek Type (Mumbai). A humanist sans drawn alongside
 * Devanagari, so its Latin suits transliterated Sanskrit next to English, it has
 * every IAST diacritic the site uses, and it holds up at small sizes on a phone.
 * It sits under Cinzel's inscriptional capitals instead of fighting them.
 *
 * Static, so the weights are listed: 400, 500, 600, and 700 for <strong>.
 * `devanagari` is available and deliberately not requested; nothing on the site
 * is set in Devanagari today. Add it the day the shlokas are shown in script.
 */
const body = Mukta({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: HOME_SEO.title,
    template: `%s | ${SITE.name}`,
  },
  description: HOME_SEO.description,
  applicationName: SITE.name,
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
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    url: SITE.url,
    locale: 'en_IN',
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: 'The academy’s Udaan 2025 class on stage, each holding a certificate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_SEO.title,
    description: HOME_SEO.description,
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
    icon: [{ url: '/img/logo-emblem.png', type: 'image/png' }],
    // Apple icons render transparency as black, so this one sits on cream.
    apple: [{ url: '/img/logo-emblem-apple.png' }],
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
        <SmoothScroll>
          <HashScroll />
          <CurtainObserver />
          <TextMotion />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
