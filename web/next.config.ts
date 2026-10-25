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
    // AVIF is ~20% smaller than WebP but about 50% slower to encode, and offering
    // both doubles the distinct outputs (one per browser Accept header). On a
    // photo-heavy site running on the Hobby allowance, WebP-only is the cheaper
    // trade; the bytes saved by AVIF are not worth the extra transformations.
    formats: ['image/webp'],
    // Local images are keyed by content hash, so replacing a file busts its own
    // cache — a long TTL cannot serve a stale photograph. 31 days is the maximum
    // Vercel keeps a local image cached, and it is what stops a 197-image gallery
    // from being re-transformed every time the 1-day source Cache-Control goes
    // stale. See the ASSET_CACHE comment below.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // The widths this design actually asks for. The defaults (828/1200/2048/3840
    // and 32/48/64) are four extra widths the layout never selects, and every
    // width is a separate transformation per image.
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [96, 128, 256, 384],
    // Only these paths may reach the optimizer. /api/instagram is the stable
    // proxy the rail points at (app/api/instagram/[id]/route.ts); Instagram's
    // signed CDN URLs rotate on every API call, so they cannot be cache keys.
    localPatterns: [
      { pathname: '/img/**' },
      { pathname: '/frames/**' },
      { pathname: '/api/instagram/**' },
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
