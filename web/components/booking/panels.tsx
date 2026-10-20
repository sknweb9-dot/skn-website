import Link from 'next/link';
import { Check, MessageCircle, Phone } from 'lucide-react';
import {
  academyContact,
  STEP_LABELS,
  whatsappHref,
  type BookingDraft,
  type StepId,
} from '@/lib/booking';
import type { StepProps } from './steps';

/** The progress bar, the thank-you, and the side panel of the booking flow. */

export function Progress({
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

export function Sent({
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

export function Aside({
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

