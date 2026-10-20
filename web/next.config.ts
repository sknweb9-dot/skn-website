import type { NextConfig } from 'next';

/**
 * Headers every response carries. None of these can break the site as built:
 * the CSP lists only the directives that do not touch scripts or styles (the
 * site uses inline scripts for the stage flag and the structured data, which a
 * script-src policy would need nonces for), and nothing on the site is framed by
 * anyone else or posts a form off-site.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  {
    key: 'Content-Security-Policy',
    value: "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'",
  },
];

/**
 * Photographs, plates and hand frames are not content-hashed, so they cannot be
 * cached "forever". A day fresh plus a week of stale-while-revalidate means a
 * returning visitor does not re-ask for each one, and a replaced photograph is
 * live within a day.
 */
const ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    // The Instagram rail's pictures. Instagram serves them from its CDN on signed
    // URLs; routing them through the optimizer turns 1290px originals into the
    // ~480px the rail shows.
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
    ],
  },

  headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: ASSET_CACHE }] },
      { source: '/frames/:path*', headers: [{ key: 'Cache-Control', value: ASSET_CACHE }] },
      // The footage the home arch plays. Range requests (which the browser needs
      // to seek) are served by the static handler as they are.
      { source: '/video/:path*', headers: [{ key: 'Cache-Control', value: ASSET_CACHE }] },
    ];
  },

  redirects() {
    return [
      // /performances folded into /events, and /photos (the old Wix album page)
      // lands there too. 308, because neither is coming back.
      { source: '/performances', destination: '/events', permanent: true },
      { source: '/photos', destination: '/events', permanent: true },
    ];
  },
};

export default nextConfig;
