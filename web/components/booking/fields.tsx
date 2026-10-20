/**
 * The form controls of the booking flow: choice cards (a real radio inside a
 * fieldset, the card being styling on its label), text fields and their errors.
 */

export function ChoiceGroup({
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

export function Choice({
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
  'mt-2 w-full !rounded-lg border bg-paper/75 px-4 py-3 font-sans text-[1rem] text-ink transition-colors placeholder:text-ink-faint focus:border-teal';

export function TextField({
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

export function TextArea({
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
