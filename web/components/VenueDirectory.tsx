import Link from 'next/link';
import {
  VENUE_ACCESS,
  formatBatchTime,
  offlineVenuesForCity,
  venuesForCity,
  type Venue,
} from '@/lib/classes';
import { INTRODUCTORY, LEVELS } from '@/lib/curriculum';
import TrialButton from './TrialButton';

/**
 * The venue directory, in two mutually exclusive presentations.
 *
 * All five Chennai venues are apartment complexes, and whether the public may
 * enrol at one changes what we are allowed to claim:
 *
 *   PublicVenues    — venues are places you can join. Batch timings are shown as
 *                     an invitation, open batches get a direct call to action,
 *                     and each venue is named as a location.
 *
 *   ResidentVenues  — venues are communities the academy teaches inside. Timings
 *                     are shown as evidence the programme is real and running,
 *                     but the call to action is "bring SKN to your community"
 *                     rather than "enrol here", because a parent who does not
 *                     live there cannot join. Nothing implies open enrolment.
 *
 * Both are implemented and kept in step. `VENUE_ACCESS` in lib/classes.ts picks
 * one; flipping that constant is the whole switch.
 */

const PROGRAMME_LABEL = new Map(
  [INTRODUCTORY, ...LEVELS].map((p) => [
    p.id,
    // "Introductory Programme — Introduction to the Arts" is redundant and long
    // enough to wrap a batch row onto three lines. The levels need both halves.
    p.id === INTRODUCTORY.id ? p.label : `${p.label} — ${p.name}`,
  ]),
);

function programmeLabel(id: string): string {
  return PROGRAMME_LABEL.get(id) ?? id;
}

function openCount(venue: Venue): number {
  return venue.batches.filter((b) => b.admissionOpen).length;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/**
 * A batch, as two lines: what it is, then when it runs.
 *
 * Deliberately not a single flex row. Programme names vary from "Level 1 —
 * Foundation" to "Level 4 — Repertoire & Expression", and letting the name and
 * the timing compete for one line made rows wrap unpredictably and pushed the
 * admission pill around.
 */
function BatchRow({
  venue,
  showAdmission,
}: {
  venue: Venue;
  showAdmission: boolean;
}) {
  return (
    <ul className="mt-4 divide-y divide-marigold/20 border-t border-marigold/20">
      {venue.batches.map((batch) => (
        <li key={batch.code} className="py-3">
          <div className="flex items-baseline gap-2.5">
            <span className="w-11 shrink-0 font-display text-[0.68rem] tracking-[0.1em] text-marigold-deep">
              {batch.code}
            </span>
            <span className="min-w-0 text-[0.92rem] font-medium text-teal-deep">
              {programmeLabel(batch.programmeId)}
            </span>
            {batch.audience === 'adults' ? (
              <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 font-sans text-[0.58rem] tracking-[0.12em] text-teal uppercase">
                Adults
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-[3.375rem]">
            <span className="font-sans text-xs text-ink-soft">
              {formatBatchTime(batch)}
            </span>
            {batch.provisionalTiming ? (
              <span className="font-sans text-[0.65rem] text-ink-faint">(provisional)</span>
            ) : null}
            {showAdmission && batch.admissionOpen ? (
              <span className="rounded-full bg-kumkum/10 px-2 py-0.5 font-sans text-[0.6rem] font-semibold tracking-[0.08em] text-kumkum uppercase">
                Admission open
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function VenueHeading({ venue, sub }: { venue: Venue; sub?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="font-display text-[1.15rem] leading-snug font-semibold text-teal-deep">
        {venue.name}
        {venue.area ? <span className="font-normal text-ink-faint"> · {venue.area}</span> : null}
      </h3>
      {sub ? (
        <p className="font-sans text-[0.68rem] tracking-[0.14em] text-marigold-deep uppercase">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentation A — open enrolment
// ---------------------------------------------------------------------------

function PublicVenues({ citySlug }: { citySlug: string }) {
  const venues = venuesForCity(citySlug);
  const totalOpen = venues.reduce((sum, v) => sum + openCount(v), 0);

  return (
    <>
      <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
        Classes run in weekly batches, grouped by level rather than by age.
        {totalOpen > 0 ? (
          <>
            {' '}
            <strong className="font-semibold text-kumkum">
              {totalOpen} batches are currently taking admissions.
            </strong>
          </>
        ) : null}
      </p>

      <ul className="mt-10 grid items-start gap-5 lg:grid-cols-2">
        {venues.map((venue) => (
          <li key={venue.id} className="glass grain rounded-[1.5rem] px-6 py-6 sm:px-7">
            <VenueHeading
              venue={venue}
              sub={venue.mode === 'online' ? 'Online' : `${venue.batches.length} batches`}
            />
            {venue.streetAddress ? (
              <p className="mt-2 font-sans text-xs leading-relaxed text-ink-faint">
                {venue.streetAddress}
              </p>
            ) : null}
            <BatchRow venue={venue} showAdmission />
            {openCount(venue) > 0 ? (
              <div className="mt-5">
                <TrialButton source={`venue-${venue.id}`} variant="outline">
                  Enquire about {venue.name}
                </TrialButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------------------
// Presentation B — resident-only communities
// ---------------------------------------------------------------------------

function ResidentVenues({ citySlug }: { citySlug: string }) {
  const venues = venuesForCity(citySlug);
  const offline = offlineVenuesForCity(citySlug);
  const online = venues.filter((v) => v.mode === 'online');

  return (
    <>
      <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
        We teach inside residential communities, bringing the Gurukulam to where
        children already live. Batches at the {offline.length} communities below are
        run for their residents.
        {online.length > 0 ? (
          <> If you live elsewhere in the city, our online batch is open to everyone.</>
        ) : null}
      </p>

      <ul className="mt-10 grid items-start gap-5 lg:grid-cols-2">
        {offline.map((venue) => (
          <li
            key={venue.id}
            className="rounded-[1.5rem] border border-marigold/25 bg-paper/60 px-6 py-6 sm:px-7"
          >
            <VenueHeading venue={venue} sub="Residents" />
            {/* No enrolment CTA and no "Admission open" flag: a reader who does
                not live here cannot act on either. */}
            <BatchRow venue={venue} showAdmission={false} />
          </li>
        ))}
      </ul>

      {online.length > 0 ? (
        <div className="mt-10">
          <h3 className="eyebrow">Open to everyone</h3>
          <ul className="mt-4 grid gap-5 lg:grid-cols-2">
            {online.map((venue) => (
              <li key={venue.id} className="glass grain rounded-[1.5rem] px-6 py-6 sm:px-7">
                <VenueHeading venue={venue} sub="Online" />
                <BatchRow venue={venue} showAdmission />
                <div className="mt-5">
                  <TrialButton source={`venue-${venue.id}`} variant="outline">
                    Join the online batch
                  </TrialButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="glass mt-10 rounded-[1.5rem] px-6 py-7 sm:px-8">
        <h3 className="font-display text-[1.2rem] font-semibold text-teal-deep">
          Bring Shanti Kala Nikketan to your community
        </h3>
        <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-ink-soft">
          We start a new batch where there is a group of interested families. Tell us
          where you live and how many children might join.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TrialButton source="residents-request-batch">Request a batch</TrialButton>
          <Link
            href="/curriculum"
            className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-4 py-2 text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
          >
            The six levels <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

export default function VenueDirectory({ citySlug }: { citySlug: string }) {
  return VENUE_ACCESS === 'public' ? (
    <PublicVenues citySlug={citySlug} />
  ) : (
    <ResidentVenues citySlug={citySlug} />
  );
}
