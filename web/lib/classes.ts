/**
 * Venues, batches and enrolment — transcribed from the Classes section of
 * `Website Contents.docx`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `site.ts` models Chennai as a single school at the Prestige Courtyard address.
 * The class schedule shows that is not the shape of the thing: Chennai is five
 * venues across three neighbourhoods, plus an online batch, plus individually
 * taught students in four places. So locations are modelled here as
 * City -> Venue -> Batch, and `site.ts` keeps only the city-level record that
 * the JSON-LD and the location routes are built on.
 *
 * ACCESS MODEL
 * ------------
 * All five Chennai venues are apartment complexes. Whether a passer-by can
 * enrol at one, or whether classes are only open to residents of that complex,
 * changes what we are allowed to claim — see `VENUE_ACCESS` and the two
 * presentations in components/VenueDirectory.tsx.
 */

import type { Programme } from './curriculum';
import { INTRODUCTORY, LEVELS } from './curriculum';

/**
 * How the Chennai venues are presented.
 *
 *   'public'    — anyone may enrol; venues are listed as locations with batch
 *                 timings and direct enrolment calls to action.
 *   'residents' — classes run inside residential communities for their
 *                 residents; venues are listed as evidence of reach, and the
 *                 call to action becomes "request a batch in your community"
 *                 rather than "enrol here".
 *
 * Both presentations are implemented. Flip this one constant to switch.
 */
export const VENUE_ACCESS: 'public' | 'residents' = 'public';

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type Batch = {
  /** The academy's own batch code, e.g. "AS1". Used as the enquiry reference. */
  code: string;
  /** id of a Programme in curriculum.ts */
  programmeId: string;
  days: Weekday[];
  /** 24-hour "HH:MM", so it can feed both display and schema. */
  opens: string;
  closes: string;
  /** Batches explicitly flagged "Admission Open" in the docx. */
  admissionOpen: boolean;
  audience: 'children' | 'adults';
  /**
   * True where the timings are provisional rather than transcribed. Canada's
   * were blank in the docx and are placeholders pending confirmation.
   */
  provisionalTiming?: boolean;
};

export type Venue = {
  id: string;
  /** The complex or platform the batches run at */
  name: string;
  /** Neighbourhood, normalised (docx writes "Medavakam") */
  area?: string;
  /** slug of the owning branch in site.ts */
  citySlug: string;
  mode: 'offline' | 'online';
  /**
   * True only where the academy has published a full street address. The other
   * venues are named complexes without one, and we do not invent addresses.
   */
  streetAddress?: string;
  batches: Batch[];
};

const PROGRAMMES: Programme[] = [INTRODUCTORY, ...LEVELS];

/** Throws at module load if a batch points at a programme that does not exist. */
function programmeOf(id: string): Programme {
  const found = PROGRAMMES.find((p) => p.id === id);
  if (!found) throw new Error(`Batch references unknown programme: ${id}`);
  return found;
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export const VENUES: Venue[] = [
  {
    id: 'appswamy-springs',
    name: 'Appswamy Springs',
    area: 'Thiruvanmiyur',
    citySlug: 'chennai',
    mode: 'offline',
    batches: [
      { code: 'AS1', programmeId: 'level-3', days: ['Monday', 'Friday'], opens: '17:00', closes: '18:00', admissionOpen: false, audience: 'children' },
      { code: 'AS2', programmeId: 'level-2', days: ['Monday', 'Friday'], opens: '18:00', closes: '19:00', admissionOpen: false, audience: 'children' },
      { code: 'AS3', programmeId: 'introductory', days: ['Monday', 'Friday'], opens: '17:00', closes: '18:00', admissionOpen: true, audience: 'children' },
      { code: 'AS4', programmeId: 'level-1', days: ['Monday', 'Friday'], opens: '18:00', closes: '19:00', admissionOpen: true, audience: 'children' },
      { code: 'AS5', programmeId: 'level-2', days: ['Monday'], opens: '19:00', closes: '20:00', admissionOpen: false, audience: 'adults' },
    ],
  },
  {
    id: 'adroit',
    name: 'Adroit',
    area: 'Sholinganallur',
    citySlug: 'chennai',
    mode: 'offline',
    batches: [
      { code: 'AD1', programmeId: 'level-2', days: ['Tuesday', 'Thursday'], opens: '18:00', closes: '19:00', admissionOpen: false, audience: 'children' },
      { code: 'AD2', programmeId: 'level-1', days: ['Tuesday', 'Thursday'], opens: '17:00', closes: '18:00', admissionOpen: true, audience: 'children' },
    ],
  },
  {
    id: 'prestige-courtyards',
    name: 'Prestige Courtyards',
    area: 'Sholinganallur',
    citySlug: 'chennai',
    mode: 'offline',
    // The one venue with a published street address — it is the academy's
    // registered address in site.ts.
    streetAddress:
      '11018, Ground Floor, Tower 11, Prestige Courtyard, Model School Extension Road, Sholinganallur',
    batches: [
      { code: 'PC1', programmeId: 'level-2', days: ['Tuesday', 'Thursday'], opens: '18:15', closes: '19:15', admissionOpen: false, audience: 'children' },
      { code: 'PC2', programmeId: 'level-1', days: ['Tuesday', 'Thursday'], opens: '19:15', closes: '20:15', admissionOpen: true, audience: 'children' },
    ],
  },
  {
    id: 'casagrand-riviera',
    name: 'Casagrand Riviera',
    area: 'Medavakkam',
    citySlug: 'chennai',
    mode: 'offline',
    batches: [
      { code: 'CG R1', programmeId: 'level-4', days: ['Monday', 'Wednesday'], opens: '18:00', closes: '19:00', admissionOpen: false, audience: 'children' },
      { code: 'CG R2', programmeId: 'level-1', days: ['Monday', 'Wednesday'], opens: '17:00', closes: '18:00', admissionOpen: true, audience: 'children' },
    ],
  },
  {
    id: 'casagrand-tranquil',
    name: 'Casagrand Tranquil',
    area: 'Medavakkam',
    citySlug: 'chennai',
    mode: 'offline',
    batches: [
      { code: 'CG T1', programmeId: 'level-1', days: ['Tuesday', 'Thursday'], opens: '17:30', closes: '18:30', admissionOpen: true, audience: 'children' },
    ],
  },
  {
    id: 'online-group',
    name: 'Online group class',
    citySlug: 'chennai',
    mode: 'online',
    batches: [
      { code: 'ON1', programmeId: 'level-1', days: ['Wednesday', 'Saturday'], opens: '17:00', closes: '18:00', admissionOpen: true, audience: 'children' },
    ],
  },
  {
    id: 'scarborough',
    name: 'Scarborough',
    area: 'Morningside & Finch',
    citySlug: 'scarborough',
    mode: 'offline',
    batches: [
      // PROVISIONAL: the docx left Canada's timings blank. Weekend mornings are
      // a placeholder to be confirmed with the branch.
      { code: 'CA1', programmeId: 'level-1', days: ['Saturday'], opens: '10:00', closes: '11:00', admissionOpen: true, audience: 'children', provisionalTiming: true },
      { code: 'CA2', programmeId: 'level-1', days: ['Saturday'], opens: '11:15', closes: '12:15', admissionOpen: true, audience: 'adults', provisionalTiming: true },
      { code: 'CA3', programmeId: 'introductory', days: ['Sunday'], opens: '10:00', closes: '11:00', admissionOpen: true, audience: 'children', provisionalTiming: true },
    ],
  },
];

// Fail loudly rather than rendering a batch with no programme behind it.
VENUES.forEach((v) => v.batches.forEach((b) => programmeOf(b.programmeId)));

// ---------------------------------------------------------------------------
// Individually taught students
// ---------------------------------------------------------------------------

/**
 * One-to-one teaching, by place. Counts only — no student is named.
 * "Odissa" in the docx is normalised to Odisha; its mode is unstated.
 */
export const INDIVIDUAL_TEACHING = [
  { place: 'Chennai', students: 8, mode: 'offline' as const },
  { place: 'Bangalore', students: 1, mode: 'online' as const },
  { place: 'Odisha', students: 1, mode: undefined },
  { place: 'USA', students: 2, mode: 'online' as const },
] as const;

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export function venuesForCity(citySlug: string): Venue[] {
  return VENUES.filter((v) => v.citySlug === citySlug);
}

export function offlineVenuesForCity(citySlug: string): Venue[] {
  return venuesForCity(citySlug).filter((v) => v.mode === 'offline');
}

/** Every batch, flattened, with its venue and programme resolved. */
export function allBatches(): { venue: Venue; batch: Batch; programme: Programme }[] {
  return VENUES.flatMap((venue) =>
    venue.batches.map((batch) => ({ venue, batch, programme: programmeOf(batch.programmeId) })),
  );
}

/** Batches taking enrolments. The academy's own "Admission Open" flag. */
export function openBatches() {
  return allBatches().filter(({ batch }) => batch.admissionOpen);
}

/** Batches taught to adults — a distinct audience the old copy ignored. */
export function adultBatches() {
  return allBatches().filter(({ batch }) => batch.audience === 'adults');
}

/** Distinct neighbourhoods with a physical venue, for local-search copy. */
export function areasTaught(citySlug: string): string[] {
  const areas = offlineVenuesForCity(citySlug)
    .map((v) => v.area)
    .filter((a): a is string => Boolean(a));
  return [...new Set(areas)];
}

/** Total number of group batches running. */
export function batchCount(): number {
  return VENUES.reduce((sum, v) => sum + v.batches.length, 0);
}

/** Total individually taught students. */
export function individualStudentCount(): number {
  return INDIVIDUAL_TEACHING.reduce((sum, p) => sum + p.students, 0);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const SHORT_DAY: Record<Weekday, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export function formatDays(days: Weekday[]): string {
  return days.map((d) => SHORT_DAY[d]).join(' & ');
}

/** "17:00" -> "5.00 pm", matching how the academy writes its own timings. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}.${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatBatchTime(batch: Batch): string {
  return `${formatDays(batch.days)} · ${formatTime(batch.opens)} – ${formatTime(batch.closes)}`;
}
