'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Phone, X } from 'lucide-react';
import { useBooking } from './BookingProvider';
import { useSmoothScroll } from './SmoothScroll';
import { BRANCHES, GOOGLE_FORM_URL, SITE } from '@/lib/site';
import { ARANGETRAM, INTRODUCTORY, TEACHING_PROGRAMMES } from '@/lib/curriculum';
import { venuesForCity } from '@/lib/classes';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BookingModal() {
  const { isOpen, close, source, prefill } = useBooking();

  /**
   * Branch and venue are controlled so the button that opened the form can
   * pre-select them. "Enquire about Appswamy Springs" used to open on the
   * generic Chennai default and drop the venue the parent had just chosen.
   * Re-seeded every time the form opens, from whatever that button passed.
   */
  const [branch, setBranch] = useState<string>(BRANCHES[0].slug);
  const [venue, setVenue] = useState<string>('');
  const [seededFor, setSeededFor] = useState<typeof prefill | null>(null);
  if (isOpen && seededFor !== prefill) {
    setSeededFor(prefill);
    setBranch(prefill.branch ?? BRANCHES[0].slug);
    setVenue(prefill.venue ?? '');
  }
  const branchVenues = branch === 'online' ? [] : venuesForCity(branch);
  const scroll = useSmoothScroll();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Lock the page behind the modal and restore focus on close.
  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    scroll.stop();

    const raf = requestAnimationFrame(() => firstFieldRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      scroll.start();
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, scroll]);

  // Reset back to a blank form a beat after closing, so the success tick is
  // still visible while the modal animates away.
  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => {
      setStatus('idle');
      setError(null);
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: data.get('parentName'),
          studentName: data.get('studentName'),
          age: data.get('age'),
          branch: data.get('branch'),
          venue: data.get('venue'),
          stage: data.get('stage'),
          phone: data.get('phone'),
          email: data.get('email'),
          message: data.get('message'),
          // Honeypot: bots fill hidden fields, humans never see this one.
          website: data.get('website'),
          source,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'We could not send that. Please try again.');
      }

      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      onKeyDown={onKeyDown}
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close booking form"
        onClick={close}
        className="fixed inset-0 cursor-default bg-teal-deep/25 backdrop-blur-md"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        aria-describedby="booking-blurb"
        className="animate-rise relative z-10 w-full max-w-2xl border border-marigold/20 bg-cream shadow-2xl shadow-teal-deep/20 sm:rounded-sm"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-ink-soft transition hover:bg-teal/5 hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {status === 'success' ? (
          <div className="px-7 py-16 text-center sm:px-12">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-marigold/40 bg-marigold/10">
              <Check className="size-8 text-teal" aria-hidden="true" />
            </div>
            <h2 id="booking-title" className="mt-7 font-display text-3xl text-ink">
              Your request has reached us
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
              We will call you within one working day to confirm a trial slot. If it is urgent, reach
              us directly.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`tel:${SITE.phoneE164}`}
                className="inline-flex items-center gap-2 border border-marigold/40 px-6 py-3 font-sans text-sm font-medium text-nila-700 transition hover:bg-marigold/10"
              >
                <Phone className="size-4" aria-hidden="true" />
                {SITE.phoneDisplay}
              </a>
              <button
                type="button"
                onClick={close}
                className="px-6 py-3 font-sans text-sm text-ink-soft transition hover:text-ink"
              >
                Back to the site
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-7 py-9 sm:px-10 sm:py-11" noValidate>
            {/* Not "Free trial session" — the academy has never published a
                price for the trial, and the Offer markup deliberately omits one.
                The copy must not assert what the schema refuses to. */}
            <p className="eyebrow">Trial session</p>
            <h2 id="booking-title" className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
              Come and watch a class
            </h2>
            <p id="booking-blurb" className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">
              No costume, no ghungroo, no prior experience. Comfortable clothes are all your child
              needs.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Your name" name="parentName" required inputRef={firstFieldRef} autoComplete="name" />
              <Field label="Student's name" name="studentName" required autoComplete="off" />
              <Field label="Student's age" name="age" type="number" min={3} max={99} required />
              <Select
                label="Nearest branch"
                name="branch"
                required
                value={branch}
                onChange={(event) => {
                  setBranch(event.target.value);
                  setVenue('');
                }}
              >
                {BRANCHES.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.label}
                  </option>
                ))}
                <option value="online">Online / elsewhere</option>
              </Select>
              {branchVenues.length > 1 ? (
                <div className="sm:col-span-2">
                <Select
                  label="Venue"
                  name="venue"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                >
                  <option value="">Any — suggest the nearest</option>
                  {branchVenues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.area ? ` · ${v.area}` : ''}
                    </option>
                  ))}
                </Select>
                </div>
              ) : (
                <input type="hidden" name="venue" value={branchVenues[0]?.id ?? ''} />
              )}
              <Field label="Phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
              <Field label="Email" name="email" type="email" required autoComplete="email" />
              <div className="sm:col-span-2">
                <Select label="Where would they start?" name="stage" defaultValue="">
                  <option value="">Not sure — please advise</option>
                  {TEACHING_PROGRAMMES.map((p) =>
                    // The introductory option used to read "Introductory
                    // Programme · Introduction to the Arts · Ages 3.5 – 6 years":
                    // the same idea twice. Levels keep both halves because
                    // the name is what distinguishes them.
                    p.id === INTRODUCTORY.id ? (
                      <option key={p.id} value={p.label}>
                        {p.label}
                        {p.ages ? ` · ${p.ages}` : ''}
                      </option>
                    ) : (
                      <option key={p.id} value={`${p.label} — ${p.name}`}>
                        {p.label} · {p.name}
                      </option>
                    ),
                  )}
                  {/* After Level 6, for students who have already completed the
                      levels elsewhere. Named as a programme, not "Level 7": the
                      curriculum is explicit that it is not a teaching level, and
                      a seventh level would contradict "Six levels" on /curriculum.
                      The 2026-27 brochure says "Level 7"; this was kept on purpose. */}
                  <option value={ARANGETRAM.label}>{ARANGETRAM.label} · after Level 6</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="eyebrow block">
                  Anything we should know
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="mt-2 w-full resize-y border border-ink/15 bg-paper/75 px-4 py-3 font-sans text-[0.95rem] text-ink placeholder:text-ink-faint/70 focus:border-teal focus:outline-none"
                  placeholder="Preferred days, previous training, questions…"
                />
              </div>
            </div>

            {/* Honeypot — visually and programmatically hidden from humans. */}
            <div aria-hidden="true" className="absolute left-[-9999px] size-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div aria-live="polite" className="min-h-6">
              {status === 'error' && error ? (
                <p className="mt-5 border-l-2 border-kumkum bg-kumkum/10 px-4 py-3 text-sm text-ink">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full bg-kumkum px-8 py-4 font-sans text-sm font-semibold tracking-wide whitespace-nowrap text-cream transition hover:bg-kumkum-hover active:bg-kumkum-active disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  'Request my trial slot'
                )}
              </button>
              <p className="max-w-measure text-xs leading-relaxed text-ink-soft">
                We use your details only to arrange the trial.
                {GOOGLE_FORM_URL ? null : ' No payment is taken online.'}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Field({
  label,
  name,
  type = 'text',
  required,
  inputRef,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'required'>) {
  return (
    <div>
      <label htmlFor={name} className="eyebrow block">
        {label}
        {required ? <span className="ml-1 text-kumkum">*</span> : null}
      </label>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full border border-ink/15 bg-paper/75 px-4 py-3 font-sans text-[0.95rem] text-ink placeholder:text-ink-faint/70 focus:border-teal focus:outline-none"
        {...rest}
      />
    </div>
  );
}

function Select({
  label,
  name,
  required,
  children,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'required'>) {
  return (
    <div>
      <label htmlFor={name} className="eyebrow block">
        {label}
        {required ? <span className="ml-1 text-kumkum">*</span> : null}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        className="mt-2 w-full appearance-none border border-ink/15 bg-paper/75 px-4 py-3 font-sans text-[0.95rem] text-ink focus:border-teal focus:outline-none"
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
