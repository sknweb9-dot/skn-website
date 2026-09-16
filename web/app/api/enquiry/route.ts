import { NextResponse } from 'next/server';

/**
 * Trial-session enquiry endpoint.
 *
 * SECURITY NOTE — read before deploying
 * -------------------------------------
 * This route is public and unauthenticated by design: it is a public contact
 * form. It validates and size-caps input, drops honeypot hits, and rate-limits
 * per IP. That is enough to stop casual abuse, not a determined spammer.
 *
 * Before going live, add:
 *   1. A CAPTCHA (Cloudflare Turnstile) verified server-side here.
 *   2. A durable rate limiter. The in-memory map below is per-instance, so on
 *      serverless it resets on cold start and does not share state.
 *   3. A real destination — email, Google Form, or a database. Right now a
 *      successful submission is only logged, so enquiries are NOT delivered.
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

  // TODO: deliver the enquiry. Until then it is only recorded in the server log
  // with identifying fields redacted.
  console.info('[enquiry]', {
    receivedAt: new Date().toISOString(),
    branch: enquiry.branch,
    stage: enquiry.stage || 'unspecified',
    age: enquiry.age,
    source: enquiry.source,
    parentName: redact(enquiry.parentName),
    phone: redact(enquiry.phone),
    email: redact(enquiry.email),
    messageLength: enquiry.message.length,
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed.' }, { status: 405 });
}
