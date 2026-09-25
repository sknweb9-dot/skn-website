/**
 * The academy's Instagram feed, for the rail on /events.
 *
 * WHY THE GRAPH API AND NOT AN EMBED
 * ----------------------------------
 * "Start from the latest post" is the requirement, and there is no way to know
 * which post is latest without asking Instagram. The `blockquote.instagram-media`
 * embed and the `/p/<shortcode>/embed` iframe both work without credentials, but
 * both need you to already know the post — they render a post you name, they do
 * not discover one. They are also about 300KB of third-party JavaScript each,
 * which rules out a rail of them regardless.
 *
 * So this reads the Instagram Graph API, which needs:
 *
 *   1. The academy's Instagram converted to a Business or Creator account.
 *   2. That account linked to a Facebook Page.
 *   3. A long-lived access token (60 days, refreshable) for that Page.
 *
 * That is genuinely a chore, and it is the only route to a live feed. Until it is
 * done, `instagramConfigured()` is false and the rail says so rather than
 * inventing anything — see components/InstagramRail.tsx.
 *
 * CONFIGURATION (server-side only; never prefix these with NEXT_PUBLIC_)
 * ---------------------------------------------------------------------
 *   INSTAGRAM_TOKEN    long-lived access token
 *   INSTAGRAM_USER_ID  the IG user id the token is scoped to
 *
 * Called over `fetch` rather than through a Facebook SDK, for the same reasons
 * lib/mail.ts talks to Resend directly: one request, no dependency to keep
 * patched, and it runs unchanged on the Node and edge runtimes.
 *
 * TOKEN EXPIRY
 * ------------
 * Long-lived tokens last 60 days and must be refreshed before then. When one
 * lapses the API returns 190 and this returns an empty list, so the rail falls
 * back to its unconfigured state rather than showing a broken row — quiet
 * degradation on the page, loud in the server log.
 */

const ENDPOINT = 'https://graph.instagram.com';
const TIMEOUT_MS = 6_000;

/** How long a fetched feed is reused. An academy posts a few times a week. */
export const REVALIDATE_SECONDS = 3600;

/** Most recent posts to show. Beyond a couple of dozen the rail stops being read. */
export const POST_LIMIT = 12;

export type InstagramPost = {
  id: string;
  /** Post page on instagram.com */
  permalink: string;
  /** Still image. For a video this is the thumbnail. */
  imageUrl: string;
  /** First line or so of the caption, for the visible label */
  caption: string;
  /** Full caption, used as the image's alt text */
  alt: string;
  /** ISO timestamp */
  postedAt: string;
  kind: 'image' | 'video' | 'album';
};

type GraphMedia = {
  id: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

function token(): string {
  return process.env.INSTAGRAM_TOKEN?.trim() ?? '';
}

function userId(): string {
  return process.env.INSTAGRAM_USER_ID?.trim() ?? '';
}

export function instagramConfigured(): boolean {
  return token().length > 0 && userId().length > 0;
}

/** First sentence or 90 characters, whichever comes first. */
function shorten(caption: string): string {
  const flat = caption.replace(/\s+/g, ' ').trim();
  if (flat.length <= 90) return flat;
  const cut = flat.slice(0, 90);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 50 ? lastSpace : 90)}…`;
}

function kindOf(type: GraphMedia['media_type']): InstagramPost['kind'] {
  if (type === 'VIDEO') return 'video';
  if (type === 'CAROUSEL_ALBUM') return 'album';
  return 'image';
}

/**
 * Newest first, which is the order the API returns and the order the rail wants.
 *
 * Never throws. A feed is decoration on this page; the Udaan copy, the recordings
 * and the globe do not depend on it, so a bad token or a slow response should cost
 * nothing but the rail.
 */
export async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  if (!instagramConfigured()) return [];

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url =
    `${ENDPOINT}/${userId()}/media` +
    `?fields=${fields}&limit=${POST_LIMIT}&access_token=${encodeURIComponent(token())}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Cached by Next rather than re-fetched per request. The token is in the
      // URL, so this must never be a client-side fetch.
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (error) {
    console.warn(
      `[instagram] feed unreachable: ${error instanceof Error ? error.message : 'unknown'}`,
    );
    return [];
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: { message?: string; code?: number } };
      if (body?.error?.message) detail = `${body.error.code ?? response.status}: ${body.error.message}`;
    } catch {
      /* status line is all we have */
    }
    // 190 is an expired or invalidated token — the likeliest failure by far, and
    // the one worth naming in the log so it is obvious what to renew.
    console.warn(`[instagram] feed rejected (${detail}). Check INSTAGRAM_TOKEN has not expired.`);
    return [];
  }

  let data: { data?: GraphMedia[] };
  try {
    data = (await response.json()) as { data?: GraphMedia[] };
  } catch {
    console.warn('[instagram] feed returned unreadable JSON');
    return [];
  }

  return (data.data ?? [])
    .map((media): InstagramPost | null => {
      // A video's own media_url is the MP4; the still we want is thumbnail_url.
      const image = media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url;
      if (!image || !media.permalink) return null;

      const caption = media.caption ?? '';
      return {
        id: media.id,
        permalink: media.permalink,
        imageUrl: image,
        caption: shorten(caption),
        alt: caption
          ? `Instagram post by Shanti Kala Nikketan: ${shorten(caption)}`
          : 'Instagram post by Shanti Kala Nikketan',
        postedAt: media.timestamp ?? '',
        kind: kindOf(media.media_type),
      };
    })
    .filter((post): post is InstagramPost => post !== null);
}
