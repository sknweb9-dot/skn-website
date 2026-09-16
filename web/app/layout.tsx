import type { Metadata, Viewport } from 'next';
import { Cinzel, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/site';
import SmoothScroll from '@/components/SmoothScroll';
import { BookingProvider } from '@/components/BookingProvider';
import { AmbientProvider } from '@/components/AmbientProvider';

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
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
    <html lang="en" className={`${cinzel.variable} ${jakarta.variable}`}>
      <body className="bg-cream text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-kumkum focus:px-5 focus:py-2.5 focus:font-sans focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        <BookingProvider>
          <AmbientProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </AmbientProvider>
        </BookingProvider>
      </body>
    </html>
  );
}
