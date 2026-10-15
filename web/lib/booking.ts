/**
 * The admissions enquiry: what can be asked, what counts as a valid answer, and
 * which batches a given family can actually join.
 *
 * Shared by the browser (components/BookingFlow.tsx) and the server
 * (app/api/enquiry/route.ts), so both sides agree on the rules. Nothing here
 * touches the DOM or the network.
 *
 * WHY A FLOW, NOT A FORM
 * ----------------------
 * The old modal asked every parent the same eleven questions, including a
 * "nearest branch" select and a programme dropdown that most parents could not
 * answer. The answers decide each other: a five-year-old beginner can only
 * join an Introductory batch, an adult in Chennai has no batch taking
 * admissions right now, and a community request needs a complex name rather
 * than a venue. So the questions are asked in order, and each step shows only
 * what the earlier answers leave open.
 *
 * THERE IS NO TRIAL CLASS
 * -----------------------
 * The academy does not run a separate trial session. Families who want to see a
 * class first may sit in on an ongoing session of their batch, arranged by
 * contacting the academy. Copy across the site must not promise a trial.
 */

import { INTRODUCTORY, LEVELS, type Programme } from './curriculum';
import { VENUES, formatBatchTime, formatDays, type Batch, type Venue, type Weekday } from './classes';
import { BRANCHES, SITE } from './site';

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** Who the enquiry is for. Decides which steps exist. */
export const AUDIENCES = ['child', 'adult', 'community'] as const;
export type Audience = (typeof AUDIENCES)[number];

/**
 * Where classes would happen. Not a branch slug: "online" is a mode that is
 * open from anywhere, and Chennai's five venues are one choice here.
 */
export const REGIONS = ['chennai', 'online', 'scarborough'] as const;
export type Region = (typeof REGIONS)[number];

export const EXPERIENCE = ['none', 'some'] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const CALL_TIMES = ['Morning', 'Afternoon', 'Evening', 'Any time'] as const;
export type CallTime = (typeof CALL_TIMES)[number];

/**
 * Rough size of a community group. The academy needs at least five to start a
 * batch (docx FAQ 12), but a smaller group is still worth hearing from, so it
 * is an option rather than a validation error.
 */
export const COMMUNITY_SIZES = ['5 to 9', '10 to 19', '20 or more', 'Fewer than 5 so far'] as const;
export type CommunitySize = (typeof COMMUNITY_SIZES)[number];

export const MIN_COMMUNITY_GROUP = 5;

export const WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Explicit "none of these, suggest one" choice in the batch step. */
export const ANY_BATCH = 'any';

/**
 * The one name for the booking action, used by every button on the site.
 *
 * It said "Book trial". The academy does not run trial sessions, so that label
 * promised something a parent would not get. "Book a session" leads to the
 * enquiry flow, which says plainly that there is no separate trial and that
 * families may sit in on an ongoing class once they have been in touch.
 */
export const BOOK_LABEL = 'Book a session';

/** The route the flow lives on. */
export const BOOK_PATH = '/book';

/** What a button can tell the flow before the parent answers anything. */
export type BookPrefill = {
  audience?: Audience;
  region?: Region;
  /** Venue id from lib/classes.ts. Implies the region, and is listed first. */
  venue?: string;
  source?: string;
};

/** Query-string keys, kept short because they appear in shared links. */
const Q = { audience: 'for', region: 'region', venue: 'venue', source: 'from' } as const;

export function bookHref(prefill: BookPrefill = {}): string {
  const params = new URLSearchParams();
  if (prefill.audience) params.set(Q.audience, prefill.audience);
  if (prefill.region) params.set(Q.region, prefill.region);
  if (prefill.venue) params.set(Q.venue, prefill.venue);
  if (prefill.source && prefill.source !== 'site') params.set(Q.source, prefill.source);
  const query = params.toString();
  return query ? `${BOOK_PATH}?${query}` : BOOK_PATH;
}

/**
 * Read a prefill back out of a URL. Anything unrecognised is dropped, so a
 * hand-edited link degrades to a blank flow rather than a broken one. A venue
 * wins over an explicit region, because it is the more specific of the two.
 */
export function parsePrefill(get: (key: string) => string | null): BookPrefill {
  const audience = get(Q.audience);
  const venue = venueById(get(Q.venue));
  const region = get(Q.region);
  const source = get(Q.source)?.slice(0, 60) ?? undefined;
  return {
    ...(isAudience(audience) ? { audience } : {}),
    ...(venue ? { venue: venue.id, region: regionOfVenue(venue) } : isRegion(region) ? { region } : {}),
    ...(source ? { source } : {}),
  };
}

/** Children's ages the flow accepts. 18 and over enquire as adults. */
export const CHILD_AGE = { min: 3, max: 17, introductoryFrom: 3.5, introductoryUntil: 7 } as const;

export function isAudience(value: unknown): value is Audience {
  return typeof value === 'string' && (AUDIENCES as readonly string[]).includes(value);
}
export function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value);
}
export function isExperience(value: unknown): value is Experience {
  return typeof value === 'string' && (EXPERIENCE as readonly string[]).includes(value);
}
export function isCallTime(value: unknown): value is CallTime {
  return typeof value === 'string' && (CALL_TIMES as readonly string[]).includes(value);
}
export function isCommunitySize(value: unknown): value is CommunitySize {
  return typeof value === 'string' && (COMMUNITY_SIZES as readonly string[]).includes(value);
}
export function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'string' && (WEEKDAYS as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export type StepId = 'who' | 'student' | 'community' | 'where' | 'contact';

/** The steps for an audience, in order. Before step one is answered, assume a child. */
export function stepsFor(audience: Audience | null): StepId[] {
  if (audience === 'community') return ['who', 'community', 'contact'];
  return ['who', 'student', 'where', 'contact'];
}

export const STEP_LABELS: Record<StepId, string> = {
  who: 'Who',
  student: 'About',
  community: 'Community',
  where: 'Where',
  contact: 'Contact',
};

// ---------------------------------------------------------------------------
// Programmes and batches
// ---------------------------------------------------------------------------

/**
 * Where a beginner starts. Experienced students are placed by the academy after
 * a conversation, so they get null rather than a guess.
 */
export function suggestedProgramme(
  audience: Audience | null,
  age: number | null,
  experience: Experience | null,
): Programme | null {
  if (audience === 'community' || experience !== 'none') return null;
  if (audience === 'child' && age !== null && age < CHILD_AGE.introductoryUntil) return INTRODUCTORY;
  return LEVELS[0];
}

export type BatchOption = { venue: Venue; batch: Batch; programme: Programme };

const PROGRAMMES = [INTRODUCTORY, ...LEVELS];

function programmeById(id: string): Programme {
  // classes.ts already throws at load for an unknown id, so this cannot miss.
  return PROGRAMMES.find((p) => p.id === id) ?? LEVELS[0];
}

export function venueInRegion(venue: Venue, region: Region): boolean {
  if (region === 'online') return venue.mode === 'online';
  return venue.mode === 'offline' && venue.citySlug === region;
}

/**
 * Batches a family could join: taking admissions, in their region, for their
 * audience, and at the suggested programme when there is one. Experienced
 * students are never offered beginner batches — the academy places them.
 */
export function openBatchesFor({
  audience,
  region,
  experience,
  programme,
  preferVenue,
}: {
  audience: Audience | null;
  region: Region | null;
  experience: Experience | null;
  programme: Programme | null;
  preferVenue?: string | null;
}): BatchOption[] {
  if (!region || audience === 'community' || experience !== 'none' || !programme) return [];
  const wanted = audience === 'adult' ? 'adults' : 'children';

  const options = VENUES.filter((venue) => venueInRegion(venue, region)).flatMap((venue) =>
    venue.batches
      .filter((b) => b.admissionOpen && b.audience === wanted && b.programmeId === programme.id)
      .map((batch) => ({ venue, batch, programme: programmeById(batch.programmeId) })),
  );

  if (!preferVenue) return options;
  // The venue the parent arrived from goes first; order is otherwise the docx's.
  return [
    ...options.filter((o) => o.venue.id === preferVenue),
    ...options.filter((o) => o.venue.id !== preferVenue),
  ];
}

/** Every batch taking admissions, by code. Used to validate a posted choice. */
export function findOpenBatch(code: string): BatchOption | null {
  for (const venue of VENUES) {
    const batch = venue.batches.find((b) => b.code === code && b.admissionOpen);
    if (batch) return { venue, batch, programme: programmeById(batch.programmeId) };
  }
  return null;
}

export function venueById(id: string | null | undefined): Venue | null {
  if (!id) return null;
  return VENUES.find((v) => v.id === id) ?? null;
}

/** The region a venue belongs to, for prefilling from a venue's own button. */
export function regionOfVenue(venue: Venue): Region {
  if (venue.mode === 'online') return 'online';
  return venue.citySlug === 'scarborough' ? 'scarborough' : 'chennai';
}

export function venueLabel(venue: Venue): string {
  return venue.area ? `${venue.name}, ${venue.area}` : venue.name;
}

/** Canada's timings are placeholders (see classes.ts), so they are not stated as fact. */
export function batchTimeLabel(batch: Batch): string {
  return batch.provisionalTiming ? `${formatDays(batch.days)} · timings to be confirmed` : formatBatchTime(batch);
}

export const REGION_LABELS: Record<Region, { title: string; detail: string }> = {
  chennai: {
    title: 'Chennai',
    detail: 'Five venues across Thiruvanmiyur, Sholinganallur and Medavakkam',
  },
  online: { title: 'Online', detail: 'Live group classes, from anywhere' },
  scarborough: { title: 'Scarborough, Canada', detail: 'Our branch at Morningside & Finch' },
};

// ---------------------------------------------------------------------------
// The request
// ---------------------------------------------------------------------------

/** Everything the flow collects. Strings are as typed; the server re-checks all of it. */
export type BookingDraft = {
  audience: Audience | null;
  studentName: string;
  /** Kept as typed so a half-entered "3." does not fight the input. */
  age: string;
  experience: Experience | null;
  experienceNote: string;
  region: Region | null;
  /** Batch code, ANY_BATCH, or '' before a choice. */
  batch: string;
  days: Weekday[];
  communityName: string;
  communityArea: string;
  communitySize: CommunitySize | '';
  communityAges: string;
  name: string;
  phone: string;
  whatsapp: boolean;
  email: string;
  callTime: CallTime | '';
  message: string;
};

export const EMPTY_DRAFT: BookingDraft = {
  audience: null,
  studentName: '',
  age: '',
  experience: null,
  experienceNote: '',
  region: null,
  batch: '',
  days: [],
  communityName: '',
  communityArea: '',
  communitySize: '',
  communityAges: '',
  name: '',
  phone: '',
  whatsapp: true,
  email: '',
  callTime: '',
  message: '',
};

export const LIMITS = {
  studentName: 120,
  experienceNote: 300,
  communityName: 120,
  communityArea: 120,
  communityAges: 120,
  name: 120,
  phone: 32,
  email: 200,
  message: 1500,
  source: 60,
} as const;

/** Parsed age, or null when blank or not a number. Accepts 3.5. */
export function parseAge(value: string): number | null {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const PHONE = /^\+?[\d\s\-()]{7,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldErrors = Partial<Record<keyof BookingDraft, string>>;

/**
 * Errors for one step. The server runs every step through this too, so a
 * request that skipped the browser is held to the same rules.
 */
export function validateStep(step: StepId, draft: BookingDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 'who') {
    if (!draft.audience) errors.audience = 'Choose who the classes are for.';
  }

  if (step === 'student') {
    if (draft.audience === 'child') {
      if (draft.studentName.trim().length < 2) errors.studentName = "Add your child's name.";
      const age = parseAge(draft.age);
      if (age === null) errors.age = "Add your child's age.";
      else if (age < CHILD_AGE.min) errors.age = 'Our youngest classes begin at three and a half.';
      else if (age > CHILD_AGE.max) errors.age = 'For 18 and over, choose “Myself” in the first step.';
    }
    if (!draft.experience) errors.experience = 'Let us know whether they have learnt before.';
  }

  if (step === 'where') {
    if (!draft.region) errors.region = 'Choose where classes would suit.';
  }

  if (step === 'community') {
    if (draft.communityName.trim().length < 2) errors.communityName = 'Add the name of your community or complex.';
    if (draft.communityArea.trim().length < 2) errors.communityArea = 'Add the area and city.';
    if (!draft.communitySize) errors.communitySize = 'Give us a rough number.';
  }

  if (step === 'contact') {
    if (draft.name.trim().length < 2) errors.name = 'Add your name.';
    if (!PHONE.test(draft.phone.trim())) errors.phone = 'Add a phone number we can reach you on.';
    if (draft.email.trim() && !EMAIL.test(draft.email.trim())) errors.email = 'That email address does not look right.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

function joinDays(days: Weekday[]): string {
  const short = days.map((d) => d.slice(0, 3));
  if (short.length <= 1) return short.join('');
  return `${short.slice(0, -1).join(', ')} & ${short[short.length - 1]}`;
}

/**
 * The enquiry so far, in one plain sentence. Shown beside the flow as it fills
 * in, on the confirmation screen, and as the email's preheader, so the parent
 * and the academy read the same summary.
 */
export function summarize(draft: BookingDraft): string | null {
  if (!draft.audience) return null;

  if (draft.audience === 'community') {
    const where = [draft.communityName.trim(), draft.communityArea.trim()].filter(Boolean).join(', ');
    const size = draft.communitySize && draft.communitySize !== 'Fewer than 5 so far'
      ? ` for ${draft.communitySize.toLowerCase()} children`
      : draft.communitySize
        ? ' for a small group, still growing'
        : '';
    return `A new batch${where ? ` at ${where}` : ' in your community'}${size}.`;
  }

  const age = parseAge(draft.age);
  const who =
    draft.audience === 'adult'
      ? 'Classes for you'
      : draft.studentName.trim()
        ? `A place for ${draft.studentName.trim()}${age !== null ? `, ${age}` : ''}`
        : 'A place for your child';

  const programme = suggestedProgramme(draft.audience, age, draft.experience);
  const level =
    draft.experience === 'some'
      ? ', placed after a conversation'
      : programme
        ? `, starting at ${programme.id === INTRODUCTORY.id ? 'the Introductory Programme' : programme.label}`
        : '';

  const chosen = draft.batch && draft.batch !== ANY_BATCH ? findOpenBatch(draft.batch) : null;
  let where = '';
  if (chosen) where = ` — ${venueLabel(chosen.venue)}, ${batchTimeLabel(chosen.batch)}`;
  else if (draft.region) where = ` — ${REGION_LABELS[draft.region].title}`;

  const days = !chosen && draft.days.length ? `, ideally ${joinDays(draft.days)}` : '';

  return `${who}${level}${where}${days}.`;
}

/** The academy number a family should message, by where they are. */
export function academyContact(region: Region | null): { display: string; e164: string } {
  if (region === 'scarborough') {
    const canada = BRANCHES.find((b) => b.slug === 'scarborough')?.contact;
    if (canada) return { display: canada.phoneDisplay, e164: canada.phoneE164 };
  }
  return { display: SITE.phoneDisplay, e164: SITE.phoneE164 };
}

/** wa.me wants digits only, with the country code and no plus. */
export function whatsappHref(e164: string, text?: string): string {
  const digits = e164.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * A parent's number as wa.me needs it. Ten-digit numbers typed without a
 * country code are assumed local to the region they chose: +91, or +1 for
 * Scarborough. Anything else is passed through as typed.
 */
export function parentWhatsappDigits(phone: string, region: Region | null): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return digits;
  if (digits.length === 10) return `${region === 'scarborough' ? '1' : '91'}${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}
