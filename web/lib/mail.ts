/**
 * Outbound mail transport.
 *
 * PROVIDER
 * --------
 * Resend, called over its REST API rather than through the `resend` npm
 * package. One `fetch` and no dependency to keep patched, and it runs unchanged
 * on the Node and edge runtimes. Swapping to SES, Postmark or Brevo means
 * rewriting `deliver()` and nothing else — the callers only see `sendMail`.
 *
 * CONFIGURATION (all server-side; never prefix these with NEXT_PUBLIC_)
 * --------------------------------------------------------------------
 *   RESEND_API_KEY  required. Without it nothing is sent — see the
 *                   `unconfigured` result and how the enquiry route treats it.
 *   ENQUIRY_TO      where enquiries land. Defaults to the academy's web inbox.
 *   ENQUIRY_FROM    the envelope sender. Must be an address on a domain
 *                   verified in the Resend dashboard once you are live.
 *
 * ON THE DEFAULT SENDER
 * ---------------------
 * `onboarding@resend.dev` is Resend's shared test sender. It works with only an
 * API key, but it will *only* deliver to the address that owns the Resend
 * account. That is deliberate: it lets the form be proved end-to-end before DNS
 * is touched. Before launch, verify shantikalanikketan.com in Resend and set
 * ENQUIRY_FROM to an address on it — otherwise enquiries from the live site will
 * be rejected.
 */

const ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;

/** The academy's web inbox. Overridable so staging can point elsewhere. */
const DEFAULT_TO = 'sknweb9@gmail.com';
const DEFAULT_FROM = 'Shanti Kala Nikketan <onboarding@resend.dev>';

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Reply-To, so hitting reply in Gmail answers the enquirer directly. */
  replyTo?: string;
};

export type MailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'unconfigured' | 'rejected' | 'network'; detail: string };

/**
 * Read at call time, not module scope. On serverless the module may be
 * evaluated in a build context where the runtime secret is not yet present.
 */
function apiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? '';
}

export function mailConfigured(): boolean {
  return apiKey().length > 0;
}

export function enquiryRecipient(): string {
  return process.env.ENQUIRY_TO?.trim() || DEFAULT_TO;
}

function sender(): string {
  return process.env.ENQUIRY_FROM?.trim() || DEFAULT_FROM;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const key = apiKey();
  if (!key) {
    return { ok: false, reason: 'unconfigured', detail: 'RESEND_API_KEY is not set.' };
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender(),
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // A transactional send must never be served from a cache.
      cache: 'no-store',
    });
  } catch (error) {
    return {
      ok: false,
      reason: 'network',
      detail: error instanceof Error ? error.message : 'Unknown network failure.',
    };
  }

  if (!response.ok) {
    // Resend returns a JSON body with `message`; fall back to the status text.
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string; name?: string };
      if (body?.message) detail = `${response.status} ${body.name ?? 'error'}: ${body.message}`;
    } catch {
      /* body was not JSON — the status line is all we have */
    }
    return { ok: false, reason: 'rejected', detail };
  }

  let id: string | null = null;
  try {
    const body = (await response.json()) as { id?: string };
    id = body?.id ?? null;
  } catch {
    /* a 200 with an unreadable body still means it was accepted */
  }

  return { ok: true, id };
}
