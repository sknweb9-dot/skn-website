import { fetchInstagramPosts } from '@/lib/instagram';

/**
 * Stable image URL for the Instagram rail.
 *
 * The Graph API re-signs `media_url` on every call: two calls seconds apart
 * differ in the `oh` parameter even though the picture is the same. Passing
 * those URLs to `next/image` makes every hourly feed rebuild a new optimizer
 * cache key, so a 12-post rail re-transforms itself every hour and
 * `minimumCacheTTL` cannot help.
 *
 * This route gives the optimizer one stable URL per post and resolves the
 * current signed URL server-side. The optimizer transforms once and keeps the
 * 240px copy; the rail stays small and the signature churn stops mattering.
 *
 * The id is checked against the same posts the page renders, so this cannot be
 * used to proxy arbitrary Instagram URLs.
 */

const TIMEOUT_MS = 10_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Graph media ids are decimal; reject anything else before reading the feed.
  if (!/^\d+$/.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const posts = await fetchInstagramPosts();
  const post = posts.find((candidate) => candidate.id === id);
  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(post.imageUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // The signed URL is already short-lived; the optimizer is the cache that
      // matters here, so do not keep a second copy in Next's data cache.
      cache: 'no-store',
    });
  } catch {
    return new Response('Upstream unavailable', { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
      // A post's picture is immutable. This also lets the optimizer keep the
      // transformed copy for the maximum TTL.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
