import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/enquiry/route';
import { enquiryHtml, enquiryText, type Enquiry } from '@/lib/enquiry';
import { findOpenBatch } from '@/lib/booking';

/**
 * The route runs with no RESEND_API_KEY and NODE_ENV=test, which is its
 * development path: validate, log what would have been sent, return ok. That
 * is enough to test every rule without sending mail. Each request uses its own
 * client IP so the in-memory rate limiter never interferes.
 */
let ip = 0;
function post(body: unknown) {
  ip += 1;
  return POST(
    new Request('http://localhost/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}` },
      body: JSON.stringify(body),
    }),
  );
}

const CHILD = {
  audience: 'child',
  studentName: 'Ananya',
  age: '7',
  experience: 'none',
  region: 'chennai',
  batch: 'AD2',
  name: 'Priya',
  phone: '98840 22306',
  whatsapp: true,
};

let logged: string[] = [];
beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  logged = [];
  vi.spyOn(console, 'warn').mockImplementation((msg: string) => {
    logged.push(String(msg));
  });
});
afterEach(() => vi.restoreAllMocks());

describe('POST /api/enquiry', () => {
  it('accepts a complete child enquiry', async () => {
    const res = await post(CHILD);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(logged.join('\n')).toContain('AD2 · Level 1 · Adroit, Sholinganallur');
  });

  it('rejects a missing phone number with 422', async () => {
    const res = await post({ ...CHILD, phone: '' });
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/phone/i);
  });

  it('rejects an unknown audience', async () => {
    const res = await post({ ...CHILD, audience: 'teacher' });
    expect(res.status).toBe(422);
  });

  it('turns a batch the family cannot join into "suggest one" instead of failing', async () => {
    // AS1 is closed, and CA2 is in another country and for adults.
    for (const batch of ['AS1', 'CA2', '<script>']) {
      const res = await post({ ...CHILD, batch });
      expect(res.status).toBe(200);
    }
    expect(logged.join('\n')).toContain('None chosen — suggest one');
    expect(logged.join('\n')).not.toContain('<script>');
  });

  it('accepts a community request without any student fields', async () => {
    const res = await post({
      audience: 'community',
      communityName: 'Casagrand Riviera',
      communityArea: 'Medavakkam, Chennai',
      communitySize: '10 to 19',
      name: 'Priya',
      phone: '+91 98840 22306',
    });
    expect(res.status).toBe(200);
    expect(logged.join('\n')).toContain('NEW COMMUNITY BATCH');
  });

  it('silently accepts and drops a honeypot hit', async () => {
    const res = await post({ ...CHILD, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(logged).toHaveLength(0);
  });

  it('answers malformed JSON with 400', async () => {
    const res = await POST(
      new Request('http://localhost/api/enquiry', {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.9.9.9' },
        body: '{not json',
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('the enquiry email', () => {
  const enquiry: Enquiry = {
    audience: 'child',
    summary: 'A place for <b>Ana</b>, 7.',
    studentName: '<b>Ana</b>',
    age: 7,
    experience: 'none',
    experienceNote: '',
    region: 'chennai',
    batch: findOpenBatch('AD2'),
    days: [],
    community: null,
    name: 'Priya "P"',
    phone: '98840 22306',
    whatsapp: true,
    email: '',
    callTime: 'Evening',
    message: '',
    source: 'venue-adroit',
    receivedAt: new Date('2026-10-13T10:00:00Z'),
  };

  it('escapes everything the parent typed', () => {
    const html = enquiryHtml(enquiry);
    expect(html).not.toContain('<b>Ana</b>');
    expect(html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(html).toContain('Priya &quot;P&quot;');
  });

  it('leads with a WhatsApp button using the number with its country code', () => {
    expect(enquiryHtml(enquiry)).toContain('https://wa.me/919884022306');
    expect(enquiryText(enquiry)).toContain('WhatsApp: https://wa.me/919884022306');
  });

  it('offers a call instead when the number is not on WhatsApp', () => {
    const html = enquiryHtml({ ...enquiry, whatsapp: false });
    expect(html).not.toContain('wa.me');
    expect(html).toContain('Call Priya');
  });
});

describe('abuse protection', () => {
  const send = (init: RequestInit & { headers?: Record<string, string> }, ipAddress: string) =>
    POST(
      new Request('http://localhost/api/enquiry', {
        method: 'POST',
        ...init,
        headers: { 'x-forwarded-for': ipAddress, ...(init.headers ?? {}) },
      }),
    );

  it('refuses a request from another site with 403', async () => {
    const res = await send(
      { body: JSON.stringify(CHILD), headers: { Origin: 'https://evil.example', Host: 'localhost' } },
      '10.8.0.1',
    );
    expect(res.status).toBe(403);
  });

  it('accepts a request from its own origin', async () => {
    const res = await send(
      { body: JSON.stringify(CHILD), headers: { Origin: 'http://localhost', Host: 'localhost' } },
      '10.8.0.2',
    );
    expect(res.status).toBe(200);
  });

  it('refuses a body too large to be an enquiry with 413', async () => {
    const res = await send({ body: JSON.stringify({ ...CHILD, message: 'x'.repeat(20_000) }) }, '10.8.0.3');
    expect(res.status).toBe(413);
  });

  it('rate-limits a client after five requests in a minute', async () => {
    const results: number[] = [];
    for (let i = 0; i < 7; i++) results.push((await send({ body: JSON.stringify(CHILD) }, '10.8.0.4')).status);
    expect(results.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(results.slice(5)).toEqual([429, 429]);
  });

  it('trusts the host-set client address over a header the visitor can send', async () => {
    // Same x-forwarded-for, different x-vercel-forwarded-for: separate buckets.
    for (let i = 0; i < 6; i++) {
      await send({ body: JSON.stringify(CHILD), headers: { 'x-vercel-forwarded-for': '203.0.113.7' } }, '10.8.0.5');
    }
    const other = await send({ body: JSON.stringify(CHILD), headers: { 'x-vercel-forwarded-for': '203.0.113.8' } }, '10.8.0.5');
    expect(other.status).toBe(200);
  });
});
