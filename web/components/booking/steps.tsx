import {
  ANY_BATCH,
  AUDIENCES,
  batchTimeLabel,
  CALL_TIMES,
  CHILD_AGE,
  COMMUNITY_SIZES,
  LIMITS,
  MIN_COMMUNITY_GROUP,
  openBatchesFor,
  parseAge,
  REGION_LABELS,
  REGIONS,
  venueLabel,
  WEEKDAYS,
  type Audience,
  type BookingDraft,
  type FieldErrors,
} from '@/lib/booking';
import { Choice, ChoiceGroup, TextArea, TextField } from './fields';

/** The five questions, one component each. State and navigation live in ../BookingFlow.tsx. */

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

export type StepProps = {
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

export function WhoStep({ draft, errors, headingRef, update }: StepProps) {
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

export function StudentStep({
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

export function WhereStep({
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

export function CommunityStep({ draft, errors, headingRef, update }: StepProps) {
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

export function ContactStep({ draft, errors, headingRef, update }: StepProps) {
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

