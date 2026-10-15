/**
 * Presentation of an admissions enquiry, as the email the academy reads.
 *
 * The route validates (with the shared rules in ./booking.ts); this module turns
 * a validated enquiry into mail. Kept separate from the transport in ./mail.ts
 * so the formatting can be exercised without sending anything.
 *
 * The email is built for Gmail on a phone, because that is where it will be
 * opened. Hence table layout with inline styles rather than the site's Tailwind
 * classes, no external images, no web fonts, and a plain-text alternative that
 * carries every field. Colours are the site tokens from app/globals.css so the
 * mail reads as the academy's own.
 *
 * WhatsApp is how the academy follows up, so when the parent says their number
 * is on WhatsApp the primary button opens a chat with them, not a call.
 */

import { SITE } from './site';
import { formatDays, type Weekday } from './classes';
import {
  batchTimeLabel,
  parentWhatsappDigits,
  REGION_LABELS,
  venueLabel,
  type Audience,
  type BatchOption,
  type CallTime,
  type CommunitySize,
  type Experience,
  type Region,
} from './booking';

export type Enquiry = {
  audience: Audience;
  /** The flow's one-sentence summary, recomputed on the server. */
  summary: string;
  studentName: string;
  /** Child's age; null for adults and communities. */
  age: number | null;
  experience: Experience | null;
  experienceNote: string;
  region: Region | null;
  /** The batch they picked, resolved and confirmed open. Null for "suggest one". */
  batch: BatchOption | null;
  days: Weekday[];
  community: { name: string; area: string; size: CommunitySize; ages: string } | null;
  name: string;
  phone: string;
  whatsapp: boolean;
  email: string;
  callTime: CallTime | '';
  message: string;
  /** Which button brought them to /book, e.g. 'nav', 'venue-adroit' */
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
  // Mirrors --color-ink-faint: 6.3:1 on white, 5.4:1 on silk.
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

function waHref(enquiry: Enquiry): string {
  return `https://wa.me/${parentWhatsappDigits(enquiry.phone, enquiry.region)}`;
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

/** Which button brought them here, tidied for reading. Deliberately light-touch. */
function sourceLabel(source: string): string {
  const cleaned = source.replace(/[-_]+/g, ' ').trim();
  if (!cleaned || cleaned === 'site') return 'Unspecified';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const AUDIENCE_LABEL: Record<Audience, string> = {
  child: 'Admission — child',
  adult: 'Admission — adult',
  community: 'New community batch',
};

function experienceLabel(enquiry: Enquiry): string {
  if (enquiry.experience === 'none') return 'Beginner';
  if (enquiry.experience === 'some') {
    return enquiry.experienceNote ? `Has trained before — ${enquiry.experienceNote}` : 'Has trained before';
  }
  return 'Not stated';
}

function batchLabel(enquiry: Enquiry): string {
  if (!enquiry.batch) return 'None chosen — suggest one';
  const { venue, batch, programme } = enquiry.batch;
  return `${batch.code} · ${programme.label} · ${venueLabel(venue)} · ${batchTimeLabel(batch)}`;
}

/** Label/value pairs, in reading order, shared by the HTML and text bodies. */
function fields(enquiry: Enquiry): [string, string][] {
  const rows: [string, string][] = [
    [enquiry.audience === 'child' ? 'Parent / guardian' : 'Name', enquiry.name],
    ['Phone', `${enquiry.phone}${enquiry.whatsapp ? ' (WhatsApp)' : ' (not on WhatsApp — call)'}`],
  ];
  if (enquiry.email) rows.push(['Email', enquiry.email]);
  rows.push(['Best time to reach', enquiry.callTime || 'Any time']);

  if (enquiry.community) {
    rows.push(
      ['Community', enquiry.community.name],
      ['Area', enquiry.community.area],
      ['Children interested', enquiry.community.size],
    );
    if (enquiry.community.ages) rows.push(['Their ages', enquiry.community.ages]);
    return rows;
  }

  if (enquiry.audience === 'child') {
    rows.push(['Student', `${enquiry.studentName}, age ${enquiry.age ?? '?'}`]);
  }
  rows.push(['Experience', experienceLabel(enquiry)]);
  if (enquiry.region) rows.push(['Where', REGION_LABELS[enquiry.region].title]);
  rows.push(['Preferred batch', batchLabel(enquiry)]);
  if (enquiry.days.length) rows.push(['Days that suit', formatDays(enquiry.days)]);
  return rows;
}

// --- subject ---------------------------------------------------------------

/**
 * Front-loaded so it is readable in a phone notification, where roughly the
 * first forty characters survive.
 */
export function enquirySubject(enquiry: Enquiry): string {
  if (enquiry.community) return `Community batch · ${enquiry.community.name} · ${enquiry.community.size}`;
  const who = enquiry.audience === 'child' ? `${enquiry.studentName} (${enquiry.age ?? '?'})` : `${enquiry.name} (adult)`;
  const where = enquiry.batch
    ? enquiry.batch.batch.code
    : enquiry.region
      ? REGION_LABELS[enquiry.region].title
      : 'No batch chosen';
  return `Admission enquiry · ${who} · ${where}`;
}

// --- HTML ------------------------------------------------------------------

function row(label: string, valueHtml: string, first: boolean): string {
  const border = first ? 'none' : `1px solid ${C.silk}`;
  return `
          <tr>
            <th align="left" valign="top" style="width:34%;padding:12px 16px 12px 0;border-top:${border};font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.inkFaint};">${esc(label)}</th>
            <td valign="top" style="padding:12px 0;border-top:${border};font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:${C.ink};">${valueHtml}</td>
          </tr>`;
}

function button(href: string, text: string, solid: boolean): string {
  const style = solid
    ? `background:${C.kumkum};color:${C.cream};`
    : `background:#FFFFFF;color:${C.teal};border:1px solid ${C.teal};`;
  return `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:13px 24px;${style}font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">${text}</a>`;
}

export function enquiryHtml(enquiry: Enquiry): string {
  const name = esc(enquiry.name);
  const phoneUri = esc(telHref(enquiry.phone));
  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${C.teal};text-decoration:none;border-bottom:1px solid ${C.marigold};">${text}</a>`;

  const rows = fields(enquiry)
    .map(([label, value], i) => {
      let html = esc(value);
      if (label === 'Phone') html = link(`tel:${phoneUri}`, esc(value));
      if (label === 'Email') html = link(`mailto:${esc(value)}`, esc(value));
      return row(label, html, i === 0);
    })
    .join('');

  const messageBlock = enquiry.message
    ? `
      <tr>
        <td style="padding:0 28px 28px;">
          <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.inkFaint};">What they told us</p>
          <div style="padding:16px 18px;background:${C.silk};border-left:3px solid ${C.marigold};font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.ink};white-space:pre-wrap;">${esc(enquiry.message)}</div>
        </td>
      </tr>`
    : '';

  const actions = enquiry.whatsapp
    ? button(esc(waHref(enquiry)), `WhatsApp ${name}`, true) + button(`tel:${phoneUri}`, 'Call', false)
    : button(`tel:${phoneUri}`, `Call ${name}`, true);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(enquirySubject(enquiry))}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
  <!-- Preheader: the grey line Gmail shows next to the subject. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(enquiry.summary)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid ${C.silk};">

          <tr>
            <td style="padding:26px 28px 22px;background:${C.tealDeep};border-bottom:3px solid ${C.marigold};">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.marigold};">${esc(AUDIENCE_LABEL[enquiry.audience])}</p>
              <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;line-height:1.3;color:${C.cream};">${esc(enquiry.summary)}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:6px 28px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${rows}
              </table>
            </td>
          </tr>

          ${messageBlock}

          <tr>
            <td style="padding:0 28px 28px;">
              ${actions}
              <p style="margin:6px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;color:${C.inkSoft};">The site tells them to expect a message within one working day, and that they may sit in on an ongoing class once it is arranged.${enquiry.email ? ` Replying to this email answers ${name} directly.` : ''}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px;background:${C.cream};border-top:1px solid ${C.silk};">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:${C.inkFaint};">
                Received ${esc(formatReceived(enquiry.receivedAt))}<br>
                Button: ${esc(sourceLabel(enquiry.source))} · <a href="${SITE.url}" style="color:${C.inkFaint};">${esc(SITE.url.replace(/^https?:\/\//, ''))}</a>
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
  const heading = AUDIENCE_LABEL[enquiry.audience].toUpperCase();
  const width = Math.max(...fields(enquiry).map(([label]) => label.length)) + 2;
  const lines = [
    heading,
    '='.repeat(heading.length),
    '',
    enquiry.summary,
    '',
    ...fields(enquiry).map(([label, value]) => `${label.padEnd(width)}${value}`),
  ];

  if (enquiry.whatsapp) lines.push('', `WhatsApp: ${waHref(enquiry)}`);
  if (enquiry.message) lines.push('', 'What they told us', '-----------------', enquiry.message);

  lines.push(
    '',
    '---',
    `Received ${formatReceived(enquiry.receivedAt)}`,
    `Button   ${sourceLabel(enquiry.source)} · ${SITE.url}`,
  );

  return lines.join('\n');
}
