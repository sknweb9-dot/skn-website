'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useSmoothScroll } from './SmoothScroll';
import { Aside, Progress, Sent } from './booking/panels';
import { CommunityStep, ContactStep, StudentStep, WhereStep, WhoStep } from './booking/steps';
import { INTRODUCTORY } from '@/lib/curriculum';
import {
  academyContact,
  ANY_BATCH,
  EMPTY_DRAFT,
  openBatchesFor,
  parseAge,
  stepsFor,
  suggestedProgramme,
  summarize,
  validateStep,
  type BookingDraft,
  type BookPrefill,
  type FieldErrors,
  type StepId,
} from '@/lib/booking';

/**
 * The admissions enquiry, one question at a time.
 *
 * Rules, vocabulary and the summary sentence live in lib/booking.ts, shared with
 * the server. This component owns only the order of the questions and how they
 * look. See the header of lib/booking.ts for why it is a flow at all.
 *
 * The questions are in booking/steps.tsx, the progress bar, the thank-you and the
 * side panel in booking/panels.tsx, and the form controls in booking/fields.tsx.
 *
 * Accessibility, in the order a keyboard or screen-reader user meets it:
 *   - Every choice is a real radio or checkbox inside a fieldset with a legend.
 *     The cards are styling on the label; the input is visually hidden but
 *     focusable, and the card shows the focus ring.
 *   - Moving between steps sends focus to the new step's heading, so the step
 *     is announced and Tab continues from the top of it.
 *   - Errors appear under their field, are tied to it with aria-describedby,
 *     and focus moves to the first invalid field. Fields re-validate as they
 *     change once a step has been attempted, not before — nobody is told off
 *     for a field they have not reached.
 */

type Status = 'editing' | 'sending' | 'sent' | 'failed';

function initialDraft(prefill: BookPrefill): BookingDraft {
  return {
    ...EMPTY_DRAFT,
    audience: prefill.audience ?? null,
    region: prefill.region ?? null,
  };
}

/** Batches this draft could join, with the venue the parent came from listed first. */
function batchOptions(draft: BookingDraft, preferVenue?: string) {
  return openBatchesFor({
    audience: draft.audience,
    region: draft.region,
    experience: draft.experience,
    programme: suggestedProgramme(draft.audience, parseAge(draft.age), draft.experience),
    preferVenue,
  });
}

/**
 * The chosen batch, if it still fits. A choice can stop fitting when an earlier
 * answer changes — a child's age moves them from Introductory to Level 1 — and
 * is then treated as unchosen rather than sent.
 */
function fittingBatch(draft: BookingDraft, options: ReturnType<typeof openBatchesFor>): string {
  if (draft.batch === ANY_BATCH) return ANY_BATCH;
  return options.some((o) => o.batch.code === draft.batch) ? draft.batch : '';
}

export default function BookingFlow({ prefill = {} }: { prefill?: BookPrefill }) {
  const [draft, setDraft] = useState<BookingDraft>(() => initialDraft(prefill));
  // Arriving from a button that already says who it is for skips the first question.
  const [stepIndex, setStepIndex] = useState(prefill.audience ? 1 : 0);
  const [errors, setErrors] = useState<FieldErrors>({});
  /** Steps the parent has tried to leave. Only these re-validate as they type. */
  const [attempted, setAttempted] = useState<Set<StepId>>(() => new Set());
  const [status, setStatus] = useState<Status>('editing');
  const [failure, setFailure] = useState<string | null>(null);

  const steps = stepsFor(draft.audience);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;

  const age = parseAge(draft.age);
  const programme = suggestedProgramme(draft.audience, age, draft.experience);
  const options = useMemo(() => batchOptions(draft, prefill.venue), [draft, prefill.venue]);
  const batch = fittingBatch(draft, options);

  const summary = summarize({ ...draft, batch });
  const contact = academyContact(draft.region);

  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);
  const scroll = useSmoothScroll();

  // After a step change, put focus on the new heading and bring the card into
  // view if the parent had scrolled past its top. Not on first render: landing
  // on the page should not steal focus from the skip link. Not on a failed
  // send either: the alert announces itself and focus belongs on the button.
  const sent = status === 'sent';
  useEffect(() => {
    if (!movedRef.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 80) scroll.scrollTo(card, { offset: -110 });
  }, [stepIndex, sent, scroll]);

  function update<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (attempted.has(step)) setErrors(errorsFor(step, next));
  }

  function errorsFor(id: StepId, d: BookingDraft): FieldErrors {
    const found = validateStep(id, d);
    // Choosing a batch is a browser-side nicety: the server treats a missing
    // one as "suggest one", so it is not part of the shared rules.
    if (id === 'where' && d.region && !fittingBatch(d, batchOptions(d, prefill.venue))) {
      if (batchOptions(d, prefill.venue).length > 0) found.batch = 'Choose a batch, or ask us to suggest one.';
    }
    return found;
  }

  function focusFirstInvalid(found: FieldErrors) {
    const first = Object.keys(found)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el =
        document.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea`) ??
        document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.focus();
    });
  }

  function goTo(index: number) {
    movedRef.current = true;
    setErrors({});
    setStepIndex(index);
  }

  function next() {
    const found = errorsFor(step, draft);
    setAttempted((prev) => new Set(prev).add(step));
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found);
      return;
    }
    // Arriving at "where" from a venue's own button: pre-pick that venue's batch.
    if (steps[stepIndex + 1] === 'where' && !batch && prefill.venue) {
      const atVenue = batchOptions(draft, prefill.venue).filter((o) => o.venue.id === prefill.venue);
      if (atVenue.length === 1) setDraft({ ...draft, batch: atVenue[0].batch.code });
    }
    goTo(stepIndex + 1);
  }

  async function submit() {
    // Re-check every step, not just this one: the parent may have gone back
    // and changed an answer that a later step depended on.
    for (const [i, id] of steps.entries()) {
      const found = errorsFor(id, draft);
      if (Object.keys(found).length > 0) {
        setAttempted((prev) => new Set(prev).add(id));
        if (i !== stepIndex) goTo(i);
        setErrors(found);
        focusFirstInvalid(found);
        return;
      }
    }

    setStatus('sending');
    setFailure(null);
    const form = cardRef.current?.querySelector('form');
    const honeypot = form ? new FormData(form).get('website') : '';

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, batch: batch || ANY_BATCH, source: prefill.source ?? 'site', website: honeypot }),
      });
      // A platform error page is HTML, not JSON. Fall back to the message that
      // gives the parent a phone number, rather than showing a parser error.
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ??
            `We could not send that just now. Please WhatsApp or call us on ${contact.display}.`,
        );
      }
      movedRef.current = true;
      setStatus('sent');
    } catch (err) {
      setStatus('failed');
      setFailure(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
      <div ref={cardRef} className="glass grain rounded-[1.75rem] px-5 py-7 sm:px-9 sm:py-9">
        {status === 'sent' ? (
          <Sent draft={{ ...draft, batch }} summary={summary} headingRef={headingRef} />
        ) : (
          <>
            <Progress steps={steps} current={stepIndex} onJump={goTo} />

            <form
              noValidate
              className="mt-8"
              onSubmit={(event) => {
                event.preventDefault();
                if (isLast) void submit();
                else next();
              }}
            >
              <div key={step} className="page-enter">
                {step === 'who' ? (
                  <WhoStep draft={draft} errors={errors} headingRef={headingRef} update={update} />
                ) : null}
                {step === 'student' ? (
                  <StudentStep
                    draft={draft}
                    errors={errors}
                    headingRef={headingRef}
                    update={update}
                    programmeLabel={
                      programme
                        ? programme.id === INTRODUCTORY.id
                          ? `the ${INTRODUCTORY.label} (${INTRODUCTORY.ages?.replace(/^Ages\s*/, 'ages ')})`
                          : `${programme.label} — ${programme.name}`
                        : null
                    }
                  />
                ) : null}
                {step === 'where' ? (
                  <WhereStep
                    draft={draft}
                    batch={batch}
                    errors={errors}
                    headingRef={headingRef}
                    update={update}
                    options={options}
                    onSwitchToCommunity={() => {
                      update('audience', 'community');
                      goTo(1);
                    }}
                  />
                ) : null}
                {step === 'community' ? (
                  <CommunityStep draft={draft} errors={errors} headingRef={headingRef} update={update} />
                ) : null}
                {step === 'contact' ? (
                  <ContactStep draft={draft} errors={errors} headingRef={headingRef} update={update} />
                ) : null}
              </div>

              {/* Honeypot — visually and programmatically hidden from humans. */}
              <div aria-hidden="true" className="absolute left-[-9999px] size-px overflow-hidden">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div role="alert" className="empty:hidden">
                {status === 'failed' && failure ? (
                  <p className="mt-6 rounded-lg border-l-2 border-kumkum bg-kumkum/10 px-4 py-3 text-sm leading-relaxed text-ink">
                    {failure}
                  </p>
                ) : null}
              </div>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-marigold/25 pt-6">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(stepIndex - 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-sans text-sm font-medium text-teal transition-colors hover:bg-teal/5"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-kumkum px-8 font-sans text-sm font-semibold tracking-wide text-cream shadow-[0_10px_30px_-12px_rgba(168,32,26,0.55)] transition-colors hover:bg-kumkum-hover active:bg-kumkum-active disabled:cursor-wait disabled:opacity-70"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : isLast ? (
                    'Send enquiry'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <Aside summary={summary} showSummary={status !== 'sent'} contact={contact} />
    </div>
  );
}
