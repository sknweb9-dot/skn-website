/**
 * Shape and presentation of a trial-session enquiry.
 *
 * The route validates; this module turns a validated enquiry into the mail the
 * academy actually reads. Kept separate from the transport in ./mail.ts so the
 * formatting can be exercised without sending anything.
 *
 * The email is built for Gmail on a phone, because that is where it will be
 * opened. Hence table layout with inline styles rather than the site's Tailwind
 * classes, no external images, no web fonts, and a plain-text alternative that
 * carries every field. Colours are the site tokens from app/globals.css so the
 * mail reads as the academy's own.
 */

import { branchBySlug, SITE } from './site';

export type Enquiry = {
  parentName: string;
  studentName: string;
  age: number;
  /** Branch slug, or 'online' */
  branch: string;
  /** Programme label chosen in the form. Empty when the parent asked us to advise. */
  stage: string;
  phone: string;
  email: string;
  message: string;
  /** Which CTA opened the modal, e.g. 'floating-cta', 'act-3', 'site' */
  source: string;
  receivedAt: Date;
};

// --- tokens, mirroring app/globals.css -------------------------------------

const C = {
  cream: '#FBF8F1',
  silk: '#F4EBD9',
  teal: '#0F4C5C',
  tealDeep: '#143642',
  kumkum: '#A8201A',
  marigold: '#EC9A29',
  ink: '#2B1E16',
  inkSoft: '#5C4A3D',
  // Mirrors --color-ink-faint. Was #8A7565 (4.11:1 on cream, failing AA) and
  // was left behind when the site token moved; these labels sit on white and
  // on silk, where #6F5B4D measures 6.3:1 and 5.4:1.
  inkFaint: '#6F5B4D',
} as const;

// --- helpers ---------------------------------------------------------------

/**
 * Escape for HTML text and double-quoted attributes alike. Every value below
 * originates from an untrusted public form, so nothing reaches the template
 * without passing through here.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Keep only characters that are legal in a tel: URI. */
function telHref(phone: string): string {
  return phone.replace(/[^+\d]/g, '');
}

/** Human branch name. The form posts slugs; the academy thinks in place names. */
export function branchLabel(slug: string): string {
  if (slug === 'online') return 'Online / elsewhere';
  const branch = branchBySlug(slug);
  if (!branch) return slug || 'Not specified';
  return branch.locality ? `${branch.label} — ${branch.locality}` : branch.label;
}

/** The academy runs on IST, so the timestamp is stated in IST and labelled. */
export function formatReceived(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return `${formatted} IST`;
}

/**
 * Which CTA opened the modal, tidied for reading. The form posts slugs like
 * 'curriculum-hero' or 'floating', so this is deliberately a light touch: the
 * academy should see roughly which button was pressed, not a guessed sentence.
 */
function sourceLabel(source: string): string {
  const cleaned = source.replace(/[-_]+/g, ' ').trim();
  if (!cleaned || cleaned === 'site') return 'Unspecified';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// --- subject ---------------------------------------------------------------

/**
 * Front-loaded so it is readable in a phone notification, where roughly the
 * first forty characters survive.
 */
export function enquirySubject(enquiry: Enquiry): string {
  const branch = enquiry.branch === 'online' ? 'Online' : (branchBySlug(enquiry.branch)?.label ?? 'Enquiry');
  return `Trial enquiry · ${enquiry.studentName} (${enquiry.age}) · ${branch}`;
}

// --- HTML ------------------------------------------------------------------

function row(label: string, valueHtml: string, opts: { first?: boolean } = {}): string {
  const border = opts.first ? 'none' : `1px solid ${C.silk}`;
  return `
          <tr>
            <th align="left" valign="top" style="width:34%;padding:12px 16px 12px 0;border-top:${border};font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.inkFaint};">${label}</th>
            <td valign="top" style="padding:12px 0;border-top:${border};font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:${C.ink};">${valueHtml}</td>
          </tr>`;
}

export function enquiryHtml(enquiry: Enquiry): string {
  const parent = esc(enquiry.parentName);
  const student = esc(enquiry.studentName);
  const branch = esc(branchLabel(enquiry.branch));
  const stage = enquiry.stage ? esc(enquiry.stage) : 'Not sure — asked us to advise';
  const phone = esc(enquiry.phone);
  const phoneUri = esc(telHref(enquiry.phone));
  const email = esc(enquiry.email);
  const received = esc(formatReceived(enquiry.receivedAt));
  const source = esc(sourceLabel(enquiry.source));

  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${C.teal};text-decoration:none;border-bottom:1px solid ${C.marigold};">${text}</a>`;

  const messageBlock = enquiry.message
    ? `
      <tr>
        <td style="padding:0 28px 28px;">
          <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.inkFaint};">What they told us</p>
          <div style="padding:16px 18px;background:${C.silk};border-left:3px solid ${C.marigold};font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};white-space:pre-wrap;">${esc(enquiry.message)}</div>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(enquirySubject(enquiry))}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
  <!-- Preheader: the grey line Gmail shows next to the subject. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${student}, age ${enquiry.age}, for ${branch}. Call ${phone}.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid ${C.silk};">

          <tr>
            <td style="padding:26px 28px 22px;background:${C.tealDeep};border-bottom:3px solid ${C.marigold};">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.marigold};">Trial session request</p>
              <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;line-height:1.25;color:${C.cream};">${student}, age ${enquiry.age}</h1>
              <p style="margin:6px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:rgba(251,248,241,.75);">for ${branch}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:6px 28px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('Parent / guardian', parent, { first: true })}
                ${row('Phone', link(`tel:${phoneUri}`, phone))}
                ${row('Email', link(`mailto:${email}`, email))}
                ${row('Student', `${student} · age ${enquiry.age}`)}
                ${row('Nearest branch', branch)}
                ${row('Would start at', stage)}
              </table>
            </td>
          </tr>

          ${messageBlock}

          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${C.kumkum};">
                    <a href="tel:${phoneUri}" style="display:inline-block;padding:13px 26px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:${C.cream};text-decoration:none;">Call ${parent}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;color:${C.inkSoft};">Replying to this email answers ${parent} directly. The site promises a call within one working day.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px;background:${C.cream};border-top:1px solid ${C.silk};">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:${C.inkFaint};">
                Received ${received}<br>
                Button: ${source} · <a href="${SITE.url}" style="color:${C.inkFaint};">${esc(SITE.url.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- plain text ------------------------------------------------------------

export function enquiryText(enquiry: Enquiry): string {
  const lines = [
    'TRIAL SESSION REQUEST',
    '=====================',
    '',
    `Student        ${enquiry.studentName}, age ${enquiry.age}`,
    `Branch         ${branchLabel(enquiry.branch)}`,
    `Would start at ${enquiry.stage || 'Not sure — asked us to advise'}`,
    '',
    `Parent         ${enquiry.parentName}`,
    `Phone          ${enquiry.phone}`,
    `Email          ${enquiry.email}`,
  ];

  if (enquiry.message) {
    lines.push('', 'What they told us', '-----------------', enquiry.message);
  }

  lines.push(
    '',
    '---',
    `Received ${formatReceived(enquiry.receivedAt)}`,
    `Button   ${sourceLabel(enquiry.source)} · ${SITE.url}`,
    'Reply to this email to answer the parent directly.',
  );

  return lines.join('\n');
}
