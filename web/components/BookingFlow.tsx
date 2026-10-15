'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2, MessageCircle, Phone } from 'lucide-react';
import { useSmoothScroll } from './SmoothScroll';
import { INTRODUCTORY } from '@/lib/curriculum';
import {
  academyContact,
  ANY_BATCH,
  AUDIENCES,
  batchTimeLabel,
  CALL_TIMES,
  CHILD_AGE,
  COMMUNITY_SIZES,
  EMPTY_DRAFT,
  LIMITS,
  MIN_COMMUNITY_GROUP,
  openBatchesFor,
  parseAge,
  REGION_LABELS,
  REGIONS,
  STEP_LABELS,
  stepsFor,
  suggestedProgramme,
  summarize,
  validateStep,
  venueLabel,
  WEEKDAYS,
  whatsappHref,
  type Audience,
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

const AUDIENCE_COPY: Record<Audience, { title: string; detail: string }> = {
  child: {
    title: 'My child',
    detail: 'From three and a half to seventeen.',
  },
  adult: {
    title: 'Myself',
    detail: 'Whether you are beginning or returning after years away.',
  },
  community: {
    title: 'A batch in my community',
    detail: `We teach inside apartment complexes. ${MIN_COMMUNITY_GROUP} children are enough to begin.`,
  },
};

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

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

function Progress({
  steps,
  current,
  onJump,
}: {
  steps: StepId[];
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Enquiry progress">
      <p className="font-sans text-sm text-ink-soft">
        Step {current + 1} of {steps.length}
      </p>
      <ol className="mt-3 flex gap-2">
        {steps.map((id, i) => {
          const done = i < current;
          const here = i === current;
          const bar = (
            <>
              <span
                aria-hidden="true"
                className={`block h-1 rounded-full transition-colors duration-500 ${
                  done || here ? 'bg-teal' : 'bg-teal/15'
                }`}
              />
              <span
                className={`mt-2 block font-sans text-xs ${here ? 'font-semibold text-teal-deep' : 'text-ink-faint'}`}
              >
                {STEP_LABELS[id]}
              </span>
            </>
          );
          return (
            <li key={id} className="min-w-0 flex-1" aria-current={here ? 'step' : undefined}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="block w-full rounded-sm text-left hover:[&>span:last-child]:text-teal"
                  aria-label={`Back to step ${i + 1}, ${STEP_LABELS[id]}`}
                >
                  {bar}
                </button>
              ) : (
                bar
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

type StepProps = {
  draft: BookingDraft;
  errors: FieldErrors;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  update: <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => void;
};

function StepHeading({
  headingRef,
  children,
  lede,
}: {
  headingRef: StepProps['headingRef'];
  children: React.ReactNode;
  lede?: React.ReactNode;
}) {
  return (
    <div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[clamp(1.45rem,3.4vw,2rem)] leading-tight font-semibold text-teal-deep focus:outline-none"
      >
        {children}
      </h2>
      {lede ? <p className="mt-2.5 max-w-measure text-[0.98rem] leading-relaxed text-ink-soft">{lede}</p> : null}
    </div>
  );
}

function WhoStep({ draft, errors, headingRef, update }: StepProps) {
  return (
    <>
      <StepHeading headingRef={headingRef} lede="A few short questions, so we can suggest the right batch.">
        Who are the classes for?
      </StepHeading>
      <ChoiceGroup legend="Who are the classes for?" hideLegend error={errors.audience} field="audience">
        {AUDIENCES.map((id) => (
          <Choice
            key={id}
            name="audience"
            value={id}
            checked={draft.audience === id}
            onChange={() => update('audience', id)}
            title={AUDIENCE_COPY[id].title}
            detail={AUDIENCE_COPY[id].detail}
          />
        ))}
      </ChoiceGroup>
    </>
  );
}

function StudentStep({
  draft,
  errors,
  headingRef,
  update,
  programmeLabel,
}: StepProps & { programmeLabel: string | null }) {
  const child = draft.audience === 'child';
  const first = draft.studentName.trim().split(/\s+/)[0];
  const subject = child ? first || 'your child' : 'you';
  const age = parseAge(draft.age);

  let placement: string | null = null;
  if (draft.experience === 'some') {
    placement = 'We place students who have trained before after seeing them dance, so we will talk it through with you.';
  } else if (draft.experience === 'none' && programmeLabel && (!child || age !== null)) {
    placement = `${child ? (first || 'Your child') : 'You'} would begin in ${programmeLabel}.`;
  }

  return (
    <>
      <StepHeading headingRef={headingRef}>{child ? 'Tell us about your child' : 'Tell us about you'}</StepHeading>

      {child ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <TextField
            label="Child's name"
            field="studentName"
            value={draft.studentName}
            onChange={(v) => update('studentName', v)}
            error={errors.studentName}
            maxLength={LIMITS.studentName}
            autoComplete="off"
          />
          <TextField
            label="Age"
            field="age"
            value={draft.age}
            onChange={(v) => update('age', v)}
            error={errors.age}
            inputMode="decimal"
            maxLength={4}
            hint="e.g. 3.5"
          />
        </div>
      ) : null}

      <ChoiceGroup
        legend={child ? `Has ${subject} learnt Bharatanatyam before?` : 'Have you learnt Bharatanatyam before?'}
        error={errors.experience}
        field="experience"
        columns={2}
      >
        <Choice
          name="experience"
          value="none"
          checked={draft.experience === 'none'}
          onChange={() => update('experience', 'none')}
          title="Starting fresh"
          detail="No prior experience needed."
        />
        <Choice
          name="experience"
          value="some"
          checked={draft.experience === 'some'}
          onChange={() => update('experience', 'some')}
          title={child ? 'Has learnt before' : 'I have learnt before'}
          detail={child ? 'With us or anywhere else.' : 'Even if it was years ago.'}
        />
      </ChoiceGroup>

      {draft.experience === 'some' ? (
        <div className="mt-5">
          <TextArea
            label="How long, and with whom? (optional)"
            field="experienceNote"
            value={draft.experienceNote}
            onChange={(v) => update('experienceNote', v)}
            maxLength={LIMITS.experienceNote}
            rows={2}
            hint="Years of training, the style or teacher, any pieces learnt."
          />
        </div>
      ) : null}

      {placement ? (
        <p className="mt-6 max-w-measure border-l-2 border-marigold/60 pl-4 text-[0.98rem] leading-relaxed font-medium text-teal-deep">
          {placement}
        </p>
      ) : null}
      {child && age !== null && age >= CHILD_AGE.min && age < CHILD_AGE.introductoryFrom ? (
        <p className="mt-3 max-w-measure text-sm leading-relaxed text-ink-soft">
          Our youngest batches begin at three and a half. Tell us anyway, and we will plan for when{' '}
          {first || 'your child'} is ready.
        </p>
      ) : null}
    </>
  );
}

function WhereStep({
  draft,
  batch,
  errors,
  headingRef,
  update,
  options,
  onSwitchToCommunity,
}: StepProps & {
  batch: string;
  options: ReturnType<typeof openBatchesFor>;
  onSwitchToCommunity: () => void;
}) {
  const experienced = draft.experience === 'some';
  const showDays = draft.region && (experienced || options.length === 0 || batch === ANY_BATCH);

  return (
    <>
      <StepHeading headingRef={headingRef}>Where would classes suit?</StepHeading>

      <ChoiceGroup legend="Where would classes suit?" hideLegend error={errors.region} field="region">
        {REGIONS.map((id) => (
          <Choice
            key={id}
            name="region"
            value={id}
            checked={draft.region === id}
            onChange={() => update('region', id)}
            title={REGION_LABELS[id].title}
            detail={REGION_LABELS[id].detail}
          />
        ))}
      </ChoiceGroup>

      {draft.region && options.length > 0 ? (
        <ChoiceGroup
          legend="Batches taking admissions"
          lede="Pick the one that fits your week."
          error={errors.batch}
          field="batch"
          columns={2}
        >
          {options.map(({ venue, batch: b, programme }) => (
            <Choice
              key={b.code}
              name="batch"
              value={b.code}
              checked={batch === b.code}
              onChange={() => update('batch', b.code)}
              title={venue.mode === 'online' ? 'Online group class' : venueLabel(venue)}
              detail={batchTimeLabel(b)}
              meta={`${b.code} · ${programme.label}${b.audience === 'adults' ? ' · adults' : ''}`}
            />
          ))}
          <Choice
            name="batch"
            value={ANY_BATCH}
            checked={batch === ANY_BATCH}
            onChange={() => update('batch', ANY_BATCH)}
            title="None of these times"
            detail="Tell us which days suit, and we will suggest one."
          />
        </ChoiceGroup>
      ) : null}

      {draft.region && options.length === 0 ? (
        <div className="mt-7 max-w-measure rounded-xl border border-marigold/30 bg-paper/60 px-5 py-4 text-[0.95rem] leading-relaxed text-ink-soft">
          {experienced ? (
            <p>We will suggest a batch at the right level once we have spoken.</p>
          ) : (
            <>
              <p>
                {draft.audience === 'adult' ? 'No adults batch' : 'No batch'} here is taking admissions at
                the moment. Tell us which days suit and we will let you know as soon as one opens.
              </p>
              {draft.region !== 'online' ? (
                <button
                  type="button"
                  onClick={onSwitchToCommunity}
                  className="mt-3 inline-flex min-h-11 items-center font-sans text-sm font-semibold text-teal underline decoration-marigold underline-offset-4 hover:text-kumkum"
                >
                  Or start a batch in your community
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {showDays ? (
        <fieldset className="mt-7" data-field="days">
          <legend className="font-sans text-sm font-semibold text-ink">Which days usually work? (optional)</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const on = draft.days.includes(day);
              return (
                <label
                  key={day}
                  className={`relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-sans text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                    on ? 'border-teal bg-teal text-cream' : 'border-teal/25 bg-paper/75 text-ink-soft hover:border-teal/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() =>
                      update('days', on ? draft.days.filter((d) => d !== day) : WEEKDAYS.filter((d) => d === day || draft.days.includes(d)))
                    }
                  />
                  <span aria-hidden="true">{day.slice(0, 3)}</span>
                  <span className="sr-only">{day}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </>
  );
}

function CommunityStep({ draft, errors, headingRef, update }: StepProps) {
  return (
    <>
      <StepHeading
        headingRef={headingRef}
        lede="We bring the same curriculum and teaching standards into residential communities, so children can learn without a long drive after school."
      >
        Tell us about your community
      </StepHeading>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Community or complex"
          field="communityName"
          value={draft.communityName}
          onChange={(v) => update('communityName', v)}
          error={errors.communityName}
          maxLength={LIMITS.communityName}
          autoComplete="off"
        />
        <TextField
          label="Area and city"
          field="communityArea"
          value={draft.communityArea}
          onChange={(v) => update('communityArea', v)}
          error={errors.communityArea}
          maxLength={LIMITS.communityArea}
          hint="e.g. Perungudi, Chennai"
          autoComplete="address-level2"
        />
      </div>

      <ChoiceGroup legend="Roughly how many children are interested?" error={errors.communitySize} field="communitySize" columns={2}>
        {COMMUNITY_SIZES.map((size) => (
          <Choice
            key={size}
            name="communitySize"
            value={size}
            checked={draft.communitySize === size}
            onChange={() => update('communitySize', size)}
            title={size}
          />
        ))}
      </ChoiceGroup>
      {draft.communitySize === 'Fewer than 5 so far' ? (
        <p className="mt-4 max-w-measure text-sm leading-relaxed text-ink-soft">
          We need at least {MIN_COMMUNITY_GROUP} to begin a batch. Tell us anyway, and we will keep in touch as
          your group grows.
        </p>
      ) : null}

      <div className="mt-6">
        <TextField
          label="Their ages (optional)"
          field="communityAges"
          value={draft.communityAges}
          onChange={(v) => update('communityAges', v)}
          maxLength={LIMITS.communityAges}
          hint="e.g. mostly 5 to 9"
          autoComplete="off"
        />
      </div>
    </>
  );
}

function ContactStep({ draft, errors, headingRef, update }: StepProps) {
  return (
    <>
      <StepHeading headingRef={headingRef} lede="We reply on WhatsApp, usually within one working day.">
        How should we reach you?
      </StepHeading>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your name"
          field="name"
          value={draft.name}
          onChange={(v) => update('name', v)}
          error={errors.name}
          maxLength={LIMITS.name}
          autoComplete="name"
        />
        <div>
          <TextField
            label={draft.whatsapp ? 'WhatsApp number' : 'Phone number'}
            field="phone"
            type="tel"
            value={draft.phone}
            onChange={(v) => update('phone', v)}
            error={errors.phone}
            maxLength={LIMITS.phone}
            autoComplete="tel"
            inputMode="tel"
            hint="Add the country code if you are outside India."
          />
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-sans text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={draft.whatsapp}
              onChange={(event) => update('whatsapp', event.target.checked)}
              className="size-5 shrink-0 accent-teal"
            />
            This number is on WhatsApp
          </label>
        </div>
        <TextField
          label="Email (optional)"
          field="email"
          type="email"
          value={draft.email}
          onChange={(v) => update('email', v)}
          error={errors.email}
          maxLength={LIMITS.email}
          autoComplete="email"
        />
      </div>

      <ChoiceGroup legend="Best time to reach you" field="callTime" columns={4} compact>
        {CALL_TIMES.map((time) => (
          <Choice
            key={time}
            name="callTime"
            value={time}
            checked={draft.callTime === time}
            onChange={() => update('callTime', time)}
            title={time}
            compact
          />
        ))}
      </ChoiceGroup>

      <div className="mt-6">
        <TextArea
          label="Anything else we should know? (optional)"
          field="message"
          value={draft.message}
          onChange={(v) => update('message', v)}
          maxLength={LIMITS.message}
          rows={3}
        />
      </div>

      <p className="mt-5 max-w-measure text-xs leading-relaxed text-ink-faint">
        We use these details only to reply to this enquiry. No payment is taken online.
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sent
// ---------------------------------------------------------------------------

function Sent({
  draft,
  summary,
  headingRef,
}: {
  draft: BookingDraft;
  summary: string | null;
  headingRef: StepProps['headingRef'];
}) {
  const contact = academyContact(draft.region);
  const first = draft.name.trim().split(/\s+/)[0];
  const message = summary ? `Hello! I have just sent an enquiry through your website: ${summary}` : undefined;

  return (
    <div className="page-enter">
      <div className="grid size-14 place-items-center rounded-full border border-teal/30 bg-teal/5">
        <Check className="size-7 text-teal" aria-hidden="true" />
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-[clamp(1.6rem,3.6vw,2.2rem)] leading-tight font-semibold text-teal-deep focus:outline-none"
      >
        Thank you{first ? `, ${first}` : ''}
      </h2>
      <p className="mt-3 max-w-measure text-[1rem] leading-relaxed text-ink-soft">
        {draft.whatsapp
          ? 'We will message you on WhatsApp within one working day.'
          : 'We will call you within one working day.'}
      </p>

      {summary ? (
        <p className="mt-6 max-w-measure border-l-2 border-marigold/60 pl-4 text-[1rem] leading-relaxed font-medium text-teal-deep">
          {summary}
        </p>
      ) : null}

      <div className="mt-8 max-w-measure rounded-xl border border-marigold/30 bg-paper/60 px-5 py-4">
        <h3 className="font-sans text-sm font-semibold text-ink">Want to see a class first?</h3>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
          There is no separate trial class. Once we have spoken, you are welcome to sit in on an ongoing
          session{draft.audience === 'community' ? ' at one of our venues' : ''} — we will let the teacher know.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={whatsappHref(contact.e164, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-teal/30 px-6 font-sans text-sm font-semibold text-teal transition-colors hover:border-teal/60 hover:bg-teal/5"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Message us on WhatsApp
          <span className="sr-only">(opens WhatsApp)</span>
        </a>
        <Link
          href="/locations"
          className="inline-flex min-h-12 items-center rounded-full px-5 font-sans text-sm font-medium text-ink-soft transition-colors hover:text-teal"
        >
          See every batch and venue
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aside
// ---------------------------------------------------------------------------

function Aside({
  summary,
  showSummary,
  contact,
}: {
  summary: string | null;
  showSummary: boolean;
  contact: { display: string; e164: string };
}) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-28" aria-label="About this enquiry">
      {showSummary ? (
        <div className="rounded-[1.5rem] border border-marigold/30 bg-paper/60 px-6 py-6">
          <h2 className="font-sans text-sm font-semibold text-ink">Your enquiry so far</h2>
          <p className="mt-2 text-[0.98rem] leading-relaxed text-teal-deep">
            {summary ?? 'Answer a few questions and your enquiry will take shape here.'}
          </p>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-marigold/30 bg-paper/60 px-6 py-6">
        <h2 className="font-sans text-sm font-semibold text-ink">What happens next</h2>
        <ol className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
          {[
            'We message you on WhatsApp, usually within one working day.',
            'Together we find the right batch and level.',
            'You are welcome to sit in on an ongoing class before you begin.',
          ].map((line, i) => (
            <li key={line} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-teal/10 font-sans text-xs font-semibold text-teal"
              >
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="px-1">
        <p className="font-sans text-sm text-ink-soft">Rather talk now?</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <a
            href={whatsappHref(contact.e164)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-semibold text-teal hover:text-kumkum"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
          <a
            href={`tel:${contact.e164}`}
            className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-semibold text-teal hover:text-kumkum"
          >
            <Phone className="size-4" aria-hidden="true" />
            {contact.display}
          </a>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function ChoiceGroup({
  legend,
  hideLegend = false,
  lede,
  error,
  field,
  columns = 1,
  compact = false,
  children,
}: {
  legend: string;
  hideLegend?: boolean;
  lede?: string;
  error?: string;
  field: string;
  columns?: 1 | 2 | 4;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const errorId = `${field}-error`;
  const grid = columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : '';
  return (
    <fieldset className="mt-7" data-field={field} aria-describedby={error ? errorId : undefined}>
      <legend className={hideLegend ? 'sr-only' : 'font-sans text-sm font-semibold text-ink'}>{legend}</legend>
      {lede ? <p className="mt-1 text-sm text-ink-soft">{lede}</p> : null}
      <div className={`grid gap-3 ${compact ? 'mt-3' : hideLegend ? '' : 'mt-3'} ${grid}`}>{children}</div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
  meta,
  compact = false,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail?: string;
  meta?: string;
  compact?: boolean;
}) {
  return (
    <label
      className={`group relative flex cursor-pointer items-start gap-3.5 rounded-xl border transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
        compact ? 'min-h-11 items-center justify-center px-3 py-2.5 text-center' : 'px-4 py-4'
      } ${checked ? 'border-teal bg-teal/[0.06]' : 'border-teal/20 bg-paper/75 hover:border-teal/45'}`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {compact ? null : (
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            checked ? 'border-teal bg-teal' : 'border-teal/35 bg-paper'
          }`}
        >
          <span className={`size-1.5 rounded-full bg-cream ${checked ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      )}
      <span className="min-w-0">
        <span className={`block font-sans font-semibold ${compact ? 'text-sm' : 'text-[1rem]'} ${checked ? 'text-teal-deep' : 'text-ink'}`}>
          {title}
        </span>
        {detail ? <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{detail}</span> : null}
        {meta ? <span className="mt-1.5 block font-sans text-xs font-semibold text-teal-deep">{meta}</span> : null}
      </span>
    </label>
  );
}

/**
 * `!rounded-lg` because the global :focus-visible rule in globals.css sets
 * border-radius: 2px on whatever has focus, and as an unlayered rule it beats
 * any layered utility. Without the override the field squares off as you type.
 */
const INPUT =
  'mt-2 w-full !rounded-lg border bg-paper/75 px-4 py-3 font-sans text-[1rem] text-ink transition-colors placeholder:text-ink-faint/70 focus:border-teal';

function TextField({
  label,
  field,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  ...rest
}: {
  label: string;
  field: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const id = `f-${field}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${field}-error` : null].filter(Boolean).join(' ');
  return (
    <div data-field={field}>
      <label htmlFor={id} className="font-sans text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={field}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`${INPUT} ${error ? 'border-kumkum' : 'border-ink/15'}`}
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${field}-error`} message={error} />
    </div>
  );
}

function TextArea({
  label,
  field,
  value,
  onChange,
  hint,
  rows = 3,
  maxLength,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = `f-${field}`;
  return (
    <div data-field={field}>
      <label htmlFor={id} className="font-sans text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={field}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${INPUT} resize-y border-ink/15`}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 font-sans text-sm font-medium text-kumkum">
      {message}
    </p>
  );
}
