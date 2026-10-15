import { describe, expect, it } from 'vitest';
import {
  ANY_BATCH,
  bookHref,
  EMPTY_DRAFT,
  findOpenBatch,
  openBatchesFor,
  parentWhatsappDigits,
  parsePrefill,
  stepsFor,
  suggestedProgramme,
  summarize,
  validateStep,
  type BookingDraft,
} from '@/lib/booking';
import { nextOpen } from '@/lib/accordion';
import { FAQS } from '@/lib/site';

const draft = (over: Partial<BookingDraft>): BookingDraft => ({ ...EMPTY_DRAFT, ...over });
const codes = (options: ReturnType<typeof openBatchesFor>) => options.map((o) => o.batch.code);

describe('steps', () => {
  it('asks a community about the community, not about a student or a batch', () => {
    expect(stepsFor('community')).toEqual(['who', 'community', 'contact']);
    expect(stepsFor('child')).toEqual(['who', 'student', 'where', 'contact']);
    expect(stepsFor(null)).toEqual(['who', 'student', 'where', 'contact']);
  });
});

describe('suggestedProgramme', () => {
  it('starts young beginners in the Introductory Programme and older ones at Level 1', () => {
    expect(suggestedProgramme('child', 3.5, 'none')?.id).toBe('introductory');
    expect(suggestedProgramme('child', 6.5, 'none')?.id).toBe('introductory');
    expect(suggestedProgramme('child', 7, 'none')?.id).toBe('level-1');
    expect(suggestedProgramme('adult', null, 'none')?.id).toBe('level-1');
  });

  it('does not guess a level for anyone who has trained before', () => {
    expect(suggestedProgramme('child', 9, 'some')).toBeNull();
    expect(suggestedProgramme('adult', null, 'some')).toBeNull();
  });
});

describe('openBatchesFor', () => {
  const beginner = (audience: 'child' | 'adult', region: 'chennai' | 'online' | 'scarborough', age: number | null) =>
    openBatchesFor({
      audience,
      region,
      experience: 'none',
      programme: suggestedProgramme(audience, age, 'none'),
    });

  it('offers only batches that are taking admissions, for the right programme and audience', () => {
    expect(codes(beginner('child', 'chennai', 5))).toEqual(['AS3']);
    expect(codes(beginner('child', 'chennai', 9))).toEqual(['AS4', 'AD2', 'PC2', 'CG R2', 'CG T1']);
    expect(codes(beginner('child', 'online', 9))).toEqual(['ON1']);
    expect(codes(beginner('child', 'scarborough', 5))).toEqual(['CA3']);
    expect(codes(beginner('adult', 'scarborough', null))).toEqual(['CA2']);
  });

  it('has nothing for an adult beginner in Chennai, where AS5 is closed', () => {
    expect(beginner('adult', 'chennai', null)).toEqual([]);
  });

  it('lists the venue the parent came from first', () => {
    const options = openBatchesFor({
      audience: 'child',
      region: 'chennai',
      experience: 'none',
      programme: suggestedProgramme('child', 9, 'none'),
      preferVenue: 'adroit',
    });
    expect(codes(options)[0]).toBe('AD2');
    expect(options).toHaveLength(5);
  });

  it('never offers beginner batches to experienced students', () => {
    expect(
      openBatchesFor({ audience: 'child', region: 'chennai', experience: 'some', programme: null }),
    ).toEqual([]);
  });

  it('refuses a closed batch', () => {
    expect(findOpenBatch('AS1')).toBeNull();
    expect(findOpenBatch('AD2')?.venue.id).toBe('adroit');
  });
});

describe('validateStep', () => {
  it('requires who the classes are for', () => {
    expect(validateStep('who', draft({})).audience).toBeDefined();
    expect(validateStep('who', draft({ audience: 'adult' }))).toEqual({});
  });

  it('accepts three and a half and rejects ages outside the children range', () => {
    const child = (age: string) => validateStep('student', draft({ audience: 'child', studentName: 'Ananya', age, experience: 'none' }));
    expect(child('3.5')).toEqual({});
    expect(child('2').age).toBeDefined();
    expect(child('18').age).toMatch(/Myself/);
    expect(child('').age).toBeDefined();
  });

  it('does not ask an adult for a name or age in the student step', () => {
    expect(validateStep('student', draft({ audience: 'adult', experience: 'some' }))).toEqual({});
  });

  it('needs a community name, area and size', () => {
    const errors = validateStep('community', draft({ audience: 'community' }));
    expect(Object.keys(errors).sort()).toEqual(['communityArea', 'communityName', 'communitySize']);
  });

  it('needs a reachable phone, and treats email as optional but checked', () => {
    const base = { name: 'Priya', phone: '98840 22306' };
    expect(validateStep('contact', draft(base))).toEqual({});
    expect(validateStep('contact', draft({ ...base, phone: '123' })).phone).toBeDefined();
    expect(validateStep('contact', draft({ ...base, email: 'not-an-email' })).email).toBeDefined();
  });
});

describe('summarize', () => {
  it('reads back a child with a chosen batch', () => {
    const text = summarize(
      draft({ audience: 'child', studentName: 'Ananya', age: '7', experience: 'none', region: 'chennai', batch: 'AD2' }),
    );
    expect(text).toBe('A place for Ananya, 7, starting at Level 1 — Adroit, Sholinganallur, Tue & Thu · 5 pm – 6 pm.');
  });

  it('reads back preferred days when no batch was chosen', () => {
    const text = summarize(
      draft({ audience: 'adult', experience: 'some', region: 'chennai', batch: ANY_BATCH, days: ['Monday', 'Saturday'] }),
    );
    expect(text).toBe('Classes for you, placed after a conversation — Chennai, ideally Mon & Sat.');
  });

  it('reads back a community request', () => {
    const text = summarize(
      draft({ audience: 'community', communityName: 'Casagrand Riviera', communityArea: 'Medavakkam', communitySize: '10 to 19' }),
    );
    expect(text).toBe('A new batch at Casagrand Riviera, Medavakkam for 10 to 19 children.');
  });

  it('says nothing before the first answer', () => {
    expect(summarize(EMPTY_DRAFT)).toBeNull();
  });

  it('does not state provisional Canada timings as fact', () => {
    const text = summarize(draft({ audience: 'adult', experience: 'none', region: 'scarborough', batch: 'CA2' }));
    expect(text).toContain('timings to be confirmed');
  });
});

describe('the /book URL', () => {
  it('round-trips a prefill, with a venue implying its region', () => {
    const href = bookHref({ audience: 'child', venue: 'adroit', source: 'venue-adroit' });
    expect(href).toBe('/book?for=child&venue=adroit&from=venue-adroit');
    const params = new URL(href, 'https://example.test').searchParams;
    expect(parsePrefill((k) => params.get(k))).toEqual({
      audience: 'child',
      venue: 'adroit',
      region: 'chennai',
      source: 'venue-adroit',
    });
  });

  it('maps the online venue to the online region', () => {
    const params = new URLSearchParams('venue=online-group');
    expect(parsePrefill((k) => params.get(k)).region).toBe('online');
  });

  it('drops anything it does not recognise', () => {
    const params = new URLSearchParams('for=martian&region=delhi&venue=nowhere');
    expect(parsePrefill((k) => params.get(k))).toEqual({});
  });

  it('leaves the default source off the link', () => {
    expect(bookHref({ source: 'site' })).toBe('/book');
  });
});

describe('parentWhatsappDigits', () => {
  it('adds the country code a ten-digit number implies', () => {
    expect(parentWhatsappDigits('98840 22306', 'chennai')).toBe('919884022306');
    expect(parentWhatsappDigits('416 892 4427', 'scarborough')).toBe('14168924427');
    expect(parentWhatsappDigits('098840 22306', 'chennai')).toBe('919884022306');
    expect(parentWhatsappDigits('+1 416 892 4427', 'chennai')).toBe('14168924427');
  });
});

describe('FAQ', () => {
  it('carries the ten chosen questions, none of them about a trial', () => {
    expect(FAQS).toHaveLength(10);
    expect(FAQS.some((f) => /trial/i.test(f.q + f.a))).toBe(false);
  });

  it('keeps at most two answers open, closing the first-opened', () => {
    let open: number[] = [];
    open = nextOpen(open, 0, 2);
    open = nextOpen(open, 3, 2);
    expect(open).toEqual([0, 3]);
    open = nextOpen(open, 5, 2);
    expect(open).toEqual([3, 5]);
    open = nextOpen(open, 3, 2);
    expect(open).toEqual([5]);
  });
});
