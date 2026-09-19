import { NextResponse } from 'next/server';
import { enquiryHtml, enquirySubject, enquiryText, type Enquiry } from '@/lib/enquiry';
import { enquiryRecipient, mailConfigured, sendMail } from '@/lib/mail';
import { SITE } from '@/lib/site';

/**
 * Trial-session enquiry endpoint.
 *
 * DELIVERY
 * --------
 * A validated enquiry is emailed to the academy's web inbox (ENQUIRY_TO, see
 * lib/mail.ts) with Reply-To set to the parent, so replying answers them
 * directly. The send is awaited rather than deferred with `after()`: if the mail
 * does not leave, the parent must be told to phone instead, and that decision
 * has to be made before the response is written.
 *
 * This endpoint never reports success it cannot back. An undelivered enquiry
 * returns 5xx with the academy's number in the message.
 *
 * SECURITY NOTE — read before deploying
 * -------------------------------------
 * This route is public and unauthenticated by design: it is a public contact
 * form. It validates and size-caps input, drops honeypot hits, and rate-limits
 * per IP. That is enough to stop casual abuse, not a determined spammer.
 *
 * Still outstanding:
 *   1. A CAPTCHA (Cloudflare Turnstile) verified server-side here.
 *   2. A durable rate limiter. The in-memory map below is per-instance, so on
 *      serverless it resets on cold start and does not share state.
 */

const MAX = {
  parentName: 120,
  studentName: 120,
  branch: 40,
  stage: 80,
  phone: 32,
  email: 200,
  message: 2000,
  source: 60,
} as const;

type Payload = Record<string, unknown>;

/**
 * Shown when the enquiry could not be delivered. It names the phone number
 * because at that point the form is not a route to the academy and saying
 * "try again" would only lose the parent.
 */
const UNDELIVERED =
  `We could not send that just now. Please call or WhatsApp us on ${SITE.phoneDisplay}, ` +
  `or email ${SITE.email} — we will not have seen this form.`;

const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Redact PII before it reaches a log sink. */
function redact(value: string): string {
  if (!value) return '';
  return `${value.slice(0, 2)}***(${value.length})`;
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (rateLimited(key)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  // Honeypot: hidden to humans, irresistible to bots. Accept and discard so the
  // bot sees success and does not retry.
  if (str(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const enquiry = {
    parentName: str(body.parentName, MAX.parentName),
    studentName: str(body.studentName, MAX.studentName),
    age: Number.parseInt(str(body.age, 4), 10),
    branch: str(body.branch, MAX.branch),
    stage: str(body.stage, MAX.stage),
    phone: str(body.phone, MAX.phone),
    email: str(body.email, MAX.email),
    message: str(body.message, MAX.message),
    source: str(body.source, MAX.source),
  };

  const errors: string[] = [];
  if (enquiry.parentName.length < 2) errors.push('your name');
  if (enquiry.studentName.length < 2) errors.push("the student's name");
  if (!Number.isFinite(enquiry.age) || enquiry.age < 3 || enquiry.age > 99) errors.push('a valid age');
  if (!/^[+\d][\d\s\-()]{6,}$/.test(enquiry.phone)) errors.push('a valid phone number');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiry.email)) errors.push('a valid email address');

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Please provide ${errors.join(', ')}.` },
      { status: 422 },
    );
  }

  const record: Enquiry = { ...enquiry, receivedAt: new Date() };

  // An unconfigured mailer is a deployment fault, not a visitor's. In
  // development, say so loudly and let the form flow so the UI stays workable;
  // in production, refuse rather than swallow an enquiry.
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
    replyTo: record.email,
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
    branch: enquiry.branch,
    stage: enquiry.stage || 'unspecified',
    age: enquiry.age,
    source: enquiry.source,
    parentName: redact(enquiry.parentName),
    phone: redact(enquiry.phone),
    email: redact(enquiry.email),
    messageLength: enquiry.message.length,
  };
}

/**
 * Everything needed to reach the parent by hand, for failure paths only.
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
    parentName: enquiry.parentName,
    studentName: enquiry.studentName,
    age: enquiry.age,
    branch: enquiry.branch,
    stage: enquiry.stage,
    phone: enquiry.phone,
    email: enquiry.email,
    message: enquiry.message,
    source: enquiry.source,
  })}`;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed.' }, { status: 405 });
}
