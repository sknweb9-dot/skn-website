import { NextResponse } from 'next/server';
import { enquiryHtml, enquirySubject, enquiryText, type Enquiry } from '@/lib/enquiry';
import { enquiryRecipient, mailConfigured, sendMail } from '@/lib/mail';
import {
  ANY_BATCH,
  EMPTY_DRAFT,
  findOpenBatch,
  isAudience,
  isCallTime,
  isCommunitySize,
  isExperience,
  isRegion,
  isWeekday,
  LIMITS,
  parseAge,
  stepsFor,
  summarize,
  validateStep,
  venueInRegion,
  type BookingDraft,
} from '@/lib/booking';
import { SITE } from '@/lib/site';

/**
 * Admissions enquiry endpoint, posted to by components/BookingFlow.tsx.
 *
 * DELIVERY
 * --------
 * A validated enquiry is emailed to the academy's web inbox (ENQUIRY_TO, see
 * lib/mail.ts). Reply-To is the parent when they gave an email; the academy
 * mostly answers on WhatsApp, which the mail's primary button opens. The send
 * is awaited rather than deferred with `after()`: if the mail does not leave,
 * the parent must be told to message instead, and that decision has to be made
 * before the response is written.
 *
 * This endpoint never reports success it cannot back. An undelivered enquiry
 * returns 5xx with the academy's number in the message.
 *
 * VALIDATION
 * ----------
 * The same per-step rules the browser applies (lib/booking.ts), run over every
 * step the audience has. Every enumerated answer is checked against its list,
 * and a batch survives only if it is real, taking admissions, in the region the
 * parent chose, and for their audience — anything else becomes "suggest one"
 * rather than being echoed into the academy's inbox.
 *
 * ABUSE PROTECTION
 * ------------------
 * This route is public and unauthenticated by design: it is a public contact
 * form. It size-caps the body, rejects a cross-site Origin, validates and caps
 * every field, drops honeypot hits, and rate-limits per client address.
 *
 * What that does not do. The limiter below is per instance, so on Vercel it only
 * slows a burst that happens to land on one warm function and resets on a cold
 * start. For a limit that holds, add a Vercel Firewall rate-limit rule for
 * POST /api/enquiry (Project > Firewall), and for a determined spammer a CAPTCHA
 * (Cloudflare Turnstile) verified here. Both are deployment-side and need
 * accounts, which is why neither is in the code.
 */

type Payload = Record<string, unknown>;

/**
 * Shown when the enquiry could not be delivered. It names the number because at
 * that point the form is not a route to the academy, and saying "try again"
 * would only lose the parent.
 */
const UNDELIVERED =
  `We could not send that just now. Please WhatsApp or call us on ${SITE.phoneDisplay}, ` +
  `or email ${SITE.email} — we will not have seen this form.`;

const RATE_LIMIT = { windowMs: 60_000, max: 5 };
/** Most distinct clients remembered at once; beyond it, expired entries go first. */
const MAX_TRACKED = 5_000;
/** An enquiry is a few hundred bytes of JSON. Anything near this is not one. */
const MAX_BODY_BYTES = 16 * 1024;
const hits = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  if (hits.size >= MAX_TRACKED) prune(now);
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

/**
 * `x-vercel-forwarded-for` is set by Vercel's edge and replaces anything the
 * visitor sent, so it is the one to trust there. The others cover local runs and
 * other hosts.
 */
function clientKey(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** A browser always sends Origin on a POST; a different site's page sends its own. */
function crossSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== (request.headers.get('host') ?? new URL(request.url).host);
  } catch {
    return true;
  }
}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Redact PII before it reaches a log sink. */
function redact(value: string): string {
  if (!value) return '';
  return `${value.slice(0, 2)}***(${value.length})`;
}

/** Rebuild a draft from untrusted JSON, keeping only values that type-check. */
function draftFrom(body: Payload): BookingDraft {
  const audience = isAudience(body.audience) ? body.audience : null;
  const experience = isExperience(body.experience) ? body.experience : null;
  const days = Array.isArray(body.days) ? [...new Set(body.days.filter(isWeekday))] : [];

  return {
    ...EMPTY_DRAFT,
    audience,
    studentName: str(body.studentName, LIMITS.studentName),
    age: str(body.age, 5),
    experience,
    experienceNote: experience === 'some' ? str(body.experienceNote, LIMITS.experienceNote) : '',
    region: isRegion(body.region) ? body.region : null,
    batch: str(body.batch, 12),
    days,
    communityName: str(body.communityName, LIMITS.communityName),
    communityArea: str(body.communityArea, LIMITS.communityArea),
    communitySize: isCommunitySize(body.communitySize) ? body.communitySize : '',
    communityAges: str(body.communityAges, LIMITS.communityAges),
    name: str(body.name, LIMITS.name),
    phone: str(body.phone, LIMITS.phone),
    whatsapp: body.whatsapp !== false,
    email: str(body.email, LIMITS.email),
    callTime: isCallTime(body.callTime) ? body.callTime : '',
    message: str(body.message, LIMITS.message),
  };
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (rateLimited(key)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  if (crossSite(request)) {
    return NextResponse.json({ ok: false, error: 'Not allowed.' }, { status: 403 });
  }

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'That is too large to be an enquiry.' }, { status: 413 });
  }

  let body: Payload;
  try {
    // Read as text so the size is checked on what actually arrived, not only on
    // what the header claimed.
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'That is too large to be an enquiry.' }, { status: 413 });
    }
    body = JSON.parse(text) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  // Honeypot: hidden to humans, irresistible to bots. Accept and discard so the
  // bot sees success and does not retry.
  if (str(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const draft = draftFrom(body);

  const errors = stepsFor(draft.audience).flatMap((step) => Object.values(validateStep(step, draft)));
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: errors.join(' ') }, { status: 422 });
  }

  // The batch must be one this family could actually join; otherwise "suggest one".
  const chosen = draft.batch && draft.batch !== ANY_BATCH ? findOpenBatch(draft.batch) : null;
  const batch =
    chosen &&
    draft.region &&
    venueInRegion(chosen.venue, draft.region) &&
    chosen.batch.audience === (draft.audience === 'adult' ? 'adults' : 'children')
      ? chosen
      : null;
  const settled: BookingDraft = { ...draft, batch: batch ? batch.batch.code : ANY_BATCH };

  // isAudience passed inside validateStep('who'), so this narrows safely.
  const audience = settled.audience!;
  const community = audience === 'community';

  const record: Enquiry = {
    audience,
    summary: summarize(settled) ?? 'Admissions enquiry',
    studentName: audience === 'child' ? settled.studentName : '',
    age: audience === 'child' ? parseAge(settled.age) : null,
    experience: community ? null : settled.experience,
    experienceNote: settled.experienceNote,
    region: community ? null : settled.region,
    batch: community ? null : batch,
    days: community || batch ? [] : settled.days,
    community: community
      ? {
          name: settled.communityName,
          area: settled.communityArea,
          // validateStep('community') guarantees a size.
          size: settled.communitySize as Exclude<BookingDraft['communitySize'], ''>,
          ages: settled.communityAges,
        }
      : null,
    name: settled.name,
    phone: settled.phone,
    whatsapp: settled.whatsapp,
    email: settled.email,
    callTime: settled.callTime,
    message: settled.message,
    source: str(body.source, LIMITS.source),
    receivedAt: new Date(),
  };

  // An unconfigured mailer is a deployment fault, not a visitor's. In
  // development, say so loudly and let the flow complete so the UI stays
  // workable; in production, refuse rather than swallow an enquiry.
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[enquiry] RESEND_API_KEY is not set — enquiry NOT delivered. ${recoveryLine(record)}`);
      return NextResponse.json({ ok: false, error: UNDELIVERED }, { status: 503 });
    }
    console.warn(`[enquiry] No RESEND_API_KEY — would have sent:\n${enquiryText(record)}`);
    return NextResponse.json({ ok: true, delivered: false, dev: true });
  }

  const sent = await sendMail({
    to: enquiryRecipient(),
    subject: enquirySubject(record),
    html: enquiryHtml(record),
    text: enquiryText(record),
    // Reply goes to the parent, not back to the academy's own inbox.
    ...(record.email ? { replyTo: record.email } : {}),
  });

  if (!sent.ok) {
    console.error(
      `[enquiry] delivery failed (${sent.reason}: ${sent.detail}) — enquiry NOT delivered. ${recoveryLine(record)}`,
    );
    return NextResponse.json({ ok: false, error: UNDELIVERED }, { status: 502 });
  }

  console.info(`[enquiry] delivered id=${sent.id ?? 'unknown'} ${JSON.stringify(summary(record))}`);
  return NextResponse.json({ ok: true });
}

/** Non-identifying fields, safe for the routine success log. */
function summary(enquiry: Enquiry) {
  return {
    receivedAt: enquiry.receivedAt.toISOString(),
    audience: enquiry.audience,
    region: enquiry.region ?? 'n/a',
    batch: enquiry.batch?.batch.code ?? 'any',
    age: enquiry.age,
    source: enquiry.source,
    name: redact(enquiry.name),
    phone: redact(enquiry.phone),
    email: redact(enquiry.email),
    messageLength: enquiry.message.length,
  };
}

/**
 * Everything needed to reach the family by hand, for failure paths only.
 *
 * Serialised into the message string rather than passed as a second console
 * argument: some log pipelines (including `next dev`'s own file logger) drop
 * structured arguments, and this is the only surviving copy of a lost enquiry.
 *
 * This is the one place PII is logged unredacted. A dropped enquiry is a lost
 * student, and recovering it by hand beats protecting it into oblivion —
 * restrict and rotate log access accordingly.
 */
function recoveryLine(enquiry: Enquiry): string {
  return `RECOVER: ${JSON.stringify({
    receivedAt: enquiry.receivedAt.toISOString(),
    summary: enquiry.summary,
    name: enquiry.name,
    phone: enquiry.phone,
    whatsapp: enquiry.whatsapp,
    email: enquiry.email,
    studentName: enquiry.studentName,
    age: enquiry.age,
    batch: enquiry.batch?.batch.code ?? null,
    community: enquiry.community,
    message: enquiry.message,
    source: enquiry.source,
  })}`;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed.' }, { status: 405 });
}
