import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The footage the home arch plays. Not content-hashed, so a day rather than a
   * year: long enough that a returning visitor does not re-fetch two megabytes,
   * short enough that a re-cut shows up the next day. Range requests (which the
   * browser needs to seek) are served by Next's static handler as it is.
   */
  headers() {
    return [
      {
        source: '/video/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
  /**
   * /performances folded into /events.
   *
   * The two pages had come to say the same things — the Udaan hero copy, the
   * gallery, the Arangetram block — and two near-identical pages compete with
   * each other in search rather than adding up. /events won the URL because it
   * is what the academy itself calls the page, and because it matches the path
   * on the old Wix site, so existing inbound links and bookmarks still land.
   *
   * 308 rather than 307: this is not coming back, and a permanent redirect lets
   * Google transfer the old path's standing instead of holding both.
   */
  redirects() {
    return [
      {
        source: '/performances',
        destination: '/events',
        permanent: true,
      },
      /**
       * The old Wix site had /photos as a separate album page. Its albums were
       * served from Wix's pro-gallery API and were never captured (see
       * _research/STATUS.txt), but the path may still be linked from elsewhere,
       * and /events#gallery is now where photographs live.
       */
      {
        source: '/photos',
        destination: '/events',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
