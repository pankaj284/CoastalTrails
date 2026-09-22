import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const SITE_URL = process.env.SITE_URL || 'https://coastaltrails.in';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../assets/brand-logo.png');
const ICON_DIR = path.resolve(__dirname, '../assets/icons');

const ICON_NAMES = ['check-circle', 'calendar-days', 'moon', 'log-out', 'shield-check', 'credit-card', 'message-circle', 'bell', 'lock', 'x-circle', 'map-pin'];

// Deep Water Cartography — light "Chart Paper" theme (from website/client/DESIGN.md)
const T = {
  paper: '#FFFFFF',
  paper2: '#F6F3EA',
  elevated: '#FFFFFF',
  ink: '#16222E',
  ink2: '#4C5A68',
  ink3: '#7E8B97',
  line: '#E2DDD1',
  line2: '#C9C2B4',
  tide: '#00756F',
  tide2: '#00635E',
  glow: '#62C5BC',
  ember: '#C4452F',
  gold: '#B8860B',
  ok: '#1B7A4B',
  err: '#C33B2E',
  warn: '#A06A00',
};

const FONT_BODY = "'Instrument Sans', 'Segoe UI', Arial, sans-serif";
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', Consolas, 'Courier New', monospace";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-IN').format(Number(n) || 0);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function nights(booking) {
  const a = new Date(`${booking.check_in}T00:00:00`).getTime();
  const b = new Date(`${booking.check_out}T00:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

function overline(label, tone = T.tide, iconName) {
  return `<span style="font-family:${FONT_MONO};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${tone};">${iconName ? `<img src="cid:icon-${iconName}" width="13" height="13" style="vertical-align:-2px;margin-right:6px;border:0;">` : ''}${label}</span>`;
}

function iconImg(name, size = 14) {
  return `<img src="cid:icon-${name}" width="${size}" height="${size}" style="vertical-align:-2px;border:0;display:inline-block;">`;
}

function statusStamp(status, paymentStatus) {
  const isConfirmed = status === 'confirmed' || status === 'checked_in' || status === 'completed';
  const isDeclined = status === 'declined';
  const cancelled = status === 'cancelled';
  const expired = status === 'expired';
  const label = cancelled ? 'Cancelled' : expired ? 'Expired' : isConfirmed ? 'Confirmed ✓' : isDeclined ? 'Declined' : 'Awaiting host';
  const color = isConfirmed ? T.ok : isDeclined ? T.err : cancelled || expired ? T.ink3 : T.warn;
  const paidTag = paymentStatus === 'paid' && !isConfirmed ? ' · Paid ✓' : '';
  return `<span style="display:inline-block;border:2px solid ${color};color:${color};border-radius:8px;padding:5px 12px;font-family:${FONT_MONO};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${label}${paidTag}</span>`;
}

function itineraryRow(booking) {
  const n = nights(booking);
  const node = (iconName, date, caption, borderColor) => `
    <td align="center" valign="top" style="padding:0 4px;">
      <div style="width:32px;height:32px;border-radius:50%;border:2px solid ${borderColor};background:${T.elevated};display:inline-block;line-height:28px;text-align:center;">${iconImg(iconName, 15)}</div>
      <div style="font-family:${FONT_MONO};font-size:12px;font-weight:600;color:${T.ink};margin-top:8px;">${date}</div>
      <div style="font-size:10px;color:${T.ink3};margin-top:2px;">${caption}</div>
    </td>`;
  const line = `<td style="border-top:1px solid ${T.line};height:1px;padding:0;width:26px;" valign="middle"></td>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
      <tr>
        ${node('calendar-days', escapeHtml(booking.check_in), 'Check-in · after 12:00', T.tide)}
        ${line}
        ${node('moon', `${n} night${n > 1 ? 's' : ''}`, `${booking.guests_count} guest${booking.guests_count > 1 ? 's' : ''} · 1 room`, T.ember)}
        ${line}
        ${node('log-out', escapeHtml(booking.check_out), 'Check-out · before 11:00', T.tide)}
      </tr>
    </table>`;
}

function progressRow(status) {
  const steps = [
    { label: 'Hold secured', done: true, fail: false },
    { label: 'Host review', done: status === 'confirmed' || status === 'checked_in' || status === 'completed' || status === 'declined', fail: status === 'declined' },
    { label: status === 'declined' ? 'Declined' : 'Confirmed', done: status === 'confirmed' || status === 'checked_in' || status === 'completed', fail: status === 'declined' },
  ];
  const cells = steps.map((s, i) => {
    const circleStyle = s.fail
      ? `border:2px solid ${T.err};background:${T.err};color:#fff;`
      : s.done
        ? `border:2px solid ${T.tide};background:${T.tide};color:#fff;`
        : i === 1
          ? `border:2px solid ${T.tide};background:${T.paper2};color:${T.tide};`
          : `border:2px solid ${T.line2};background:${T.paper2};color:${T.ink3};`;
    const inner = s.fail ? '✕' : s.done && i !== 1 ? '✓' : i + 1;
    const circle = `<div style="width:28px;height:28px;border-radius:50%;${circleStyle}display:inline-block;line-height:24px;font-size:12px;font-weight:600;font-family:${FONT_BODY};">${inner}</div>`;
    const label = `<div style="font-family:${FONT_MONO};font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${T.ink3};margin-top:6px;white-space:nowrap;">${s.label}</div>`;
    return `<td align="center" valign="top" style="padding:0 2px;">${circle}${label}</td>`;
  });
  const bar = (done) => `<td style="width:100%;"><div style="height:2px;border-radius:2px;background:${done ? T.tide : T.line};"></div></td>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      <tr>
        ${cells[0]}
        ${bar(true)}
        ${cells[1]}
        ${bar(steps[1].done)}
        ${cells[2]}
      </tr>
    </table>`;
}

function receiptRows(booking) {
  const row = (label, value, opts = {}) => `
      <tr>
        <td style="padding:7px 0;${opts.dash ? `border-bottom:1px dashed ${T.line2};` : ''}font-size:12.5px;color:${opts.muted ? T.ink3 : T.ink2};">${label}</td>
        <td align="right" style="padding:7px 0;${opts.dash ? `border-bottom:1px dashed ${T.line2};` : ''}font-family:${FONT_MONO};font-weight:600;font-size:12.5px;color:${opts.tone || T.ink};">${value}</td>
      </tr>`;
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Total stay tariff', `₹${fmtMoney(booking.total_amount)}`, { dash: true })}
        ${row('20% hold paid online', `₹${fmtMoney(booking.advance_paid)}`, { tone: T.tide, dash: true })}
        ${row('80% balance at property', `₹${fmtMoney(booking.balance_payable_at_property)}`, { dash: true })}
        ${row('Convenience fee', '₹0', { muted: true, tone: T.ok })}
      </table>`;
}

function qrBlock(referenceCode) {
  const bars = [16, 29, 23, 29, 19, 26, 29, 16, 26, 20, 29, 23, 16, 29, 19, 26, 29, 16, 26, 20, 29, 23, 16, 29, 19, 26, 29, 16, 26, 20, 29, 23, 16, 29, 19, 26, 29, 16, 26, 20, 29, 23];
  const barTds = bars
    .map(
      (h) =>
        `<td width="2" style="padding:0;"><div style="width:2px;height:${h}px;background:${T.ink};display:inline-block;"></div></td>`
    )
    .join('');
  return `
    <div style="margin-top:26px;padding-top:24px;border-top:1px dashed ${T.line2};text-align:center;">
      <img src="cid:qrcode" width="112" height="112" style="border:1px solid ${T.line};border-radius:12px;padding:6px;background:#fff;display:inline-block;">
      <div style="font-family:${FONT_MONO};font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:${T.ink3};margin:8px 0 16px;">Scan to verify</div>
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="height:29px;"><tr>${barTds}</tr></table>
      <div style="font-family:${FONT_MONO};font-size:14px;font-weight:600;letter-spacing:0.25em;color:${T.ink};margin-top:6px;">${escapeHtml(referenceCode)}</div>
      <div style="font-family:${FONT_MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${T.ok};margin-top:6px;">Valid for check-in</div>
    </div>`;
}

function voucher({ booking, stayTitle, location, hostName, stayImage }) {
  return `
    <div style="background:${T.elevated};border:1px solid ${T.line};border-radius:24px;overflow:hidden;margin:22px 0;">
      <div style="background:${T.paper2};border-bottom:1px solid ${T.line};padding:16px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle">
              ${overline('E-voucher', T.tide, 'check-circle')}
              <span style="display:inline-block;margin-left:12px;border:1px solid ${T.line};border-radius:8px;background:${T.elevated};padding:5px 10px;font-family:${FONT_MONO};font-size:15px;font-weight:600;color:${T.ink};">${escapeHtml(booking.reference_code)}</span>
            </td>
            <td align="right" valign="middle">
              <span style="font-size:12px;color:${T.ink3};margin-right:14px;">Booked on ${escapeHtml(fmtDate(booking.created_at))}</span>
              ${statusStamp(booking.status, booking.payment_status)}
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" width="62%" style="padding:26px 28px;">
            ${stayImage ? `<img src="${escapeHtml(stayImage)}" alt="" width="100%" style="border-radius:16px;border:1px solid ${T.line};display:block;">` : ''}
            <div style="margin-top:18px;">
              <div style="display:inline-block;background:${T.paper2};border:1px solid ${T.line};border-radius:999px;padding:3px 12px;font-family:${FONT_MONO};font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${T.ink2};">Family stewarded</div>
            </div>
            <h2 style="margin:12px 0 6px;font-family:${FONT_DISPLAY};font-size:24px;font-weight:600;letter-spacing:-0.02em;color:${T.ink};">${escapeHtml(stayTitle)}</h2>
            <p style="margin:0;font-size:12.5px;color:${T.ink2};">${iconImg('map-pin', 13)} ${escapeHtml(location)} · Gokarna, Karnataka</p>

            <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:20px 22px;margin-top:22px;">
              ${overline('Itinerary', T.tide, 'calendar-days')}
              ${itineraryRow(booking)}
            </div>

            <div style="margin-top:22px;">
              ${overline('Reservation progress', T.tide, 'check-circle')}
              ${progressRow(booking.status)}
            </div>

            <div style="margin-top:22px;background:${T.paper2};border:1px solid ${T.line};border-radius:14px;padding:14px 16px;font-size:11.5px;color:${T.ink2};line-height:1.55;">
              ${iconImg('shield-check', 16)} Your dates are locked. Our concierge coordinates your arrival — no middleman contact needed.
            </div>
          </td>

          <td valign="top" width="38%" style="padding:26px 28px;border-left:1px dashed ${T.line2};">
            ${overline('Fare receipt', T.tide, 'credit-card')}
            <div style="margin-top:14px;">${receiptRows(booking)}</div>
          </td>
        </tr>
      </table>

      <div style="padding:0 28px 28px;">
        ${qrBlock(booking.reference_code)}
      </div>
    </div>`;
}

function shell({ banner, content, ctaLabel, ctaHref, whatsappHref, guestEmail }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${T.paper};font-family:${FONT_BODY};color:${T.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.paper};">
    <tr><td style="padding:22px 16px 0;" align="center">
      <img src="cid:coastallogo" alt="Coastal Trails" width="84" height="84" style="display:block;border:1px solid ${T.line};border-radius:20px;background:#fff;">
      <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:${T.ink3};margin-top:10px;">Coastal Trails · Gokarna</div>
      <div style="height:3px;background:${T.glow};margin:14px 0 0;border:0;"></div>
    </td></tr>
    <tr><td style="padding:6px 16px 0;" align="center">
      <img src="cid:coastallogo" width="300" style="opacity:0.06;display:block;border:0;">
    </td></tr>
    <tr><td style="padding:0 12px 16px;" align="center">
      <div style="width:100%;text-align:left;margin-top:-170px;">
        ${banner || ''}
        ${content}
      </div>
    </td></tr>
    <tr><td style="padding:0 12px;" align="center">
      ${ctaLabel || whatsappHref ? `
      <div style="margin:18px 0 8px;text-align:center;">
        ${ctaLabel ? `<a href="${ctaHref}" style="display:inline-block;background:${T.tide};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:12px;">${ctaLabel}</a>` : ''}
        ${whatsappHref ? `<a href="${whatsappHref}" style="display:inline-block;margin-left:10px;border:1.5px solid ${T.tide};color:${T.tide};text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:12px;">${iconImg('message-circle', 14)} WhatsApp host</a>` : ''}
      </div>` : ''}
    </td></tr>
    <tr><td style="padding:14px 24px 24px;" align="center">
      <p style="margin:0 0 6px;font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.ink3};">Coastal Trails · Gokarna</p>
      ${guestEmail ? `<p style="margin:0;font-family:${FONT_MONO};font-size:10px;color:${T.ink3};">${escapeHtml(guestEmail)}</p>` : ''}
    </td></tr>
  </table>
</body>
</html>`;
}

async function send({ to, subject, html, label, qrText }) {
  const transporter = getTransporter();
  if (!transporter || !to) {
    console.log(`[mail] SMTP not configured — skipping ${label} (to: ${to})`);
    return { skipped: true };
  }
  const qrBuffer = qrText
    ? await QRCode.toBuffer(qrText, { width: 236, margin: 1, color: { dark: '#16222E', light: '#FFFFFF' } })
    : null;
  await transporter.sendMail({
    from: `"Coastal Trails Bookings" <${process.env.SMTP_USER}>`,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'brand-logo.png',
        path: LOGO_PATH,
        cid: 'coastallogo',
      },
      ...ICON_NAMES.map((name) => ({
        filename: `${name}.png`,
        path: path.join(ICON_DIR, `${name}.png`),
        cid: `icon-${name}`,
      })),
      ...(qrBuffer
        ? [
            {
              filename: 'qr.png',
              content: qrBuffer,
              cid: 'qrcode',
            },
          ]
        : []),
    ],
  });
  console.log(`[mail] ${label} sent → ${to}`);
  return { sent: true };
}

export async function sendPaymentSuccessEmail({ to, booking, stayTitle, location, hostName, hostWhatsapp, guestName, stayImage }) {
  const whatsapp = hostWhatsapp ? `https://wa.me/${String(hostWhatsapp).replace(/\D/g, '')}` : null;
  const html = shell({
    banner: `
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:18px 24px;margin-bottom:16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.ok};margin-bottom:6px;">Payment successful</div>
            <div style="font-family:${FONT_DISPLAY};font-size:21px;font-weight:600;color:${T.ink};">Your stay is booked, ${escapeHtml(guestName.split(' ')[0])}</div>
          </td>
          <td align="right" valign="middle">
            <div style="background:${T.elevated};border:1px solid ${T.ok};border-radius:12px;width:48px;height:48px;line-height:48px;text-align:center;">${iconImg('check-circle', 22)}</div>
          </td>
        </tr></table>
      </div>`,
    content: voucher({ booking, stayTitle, location, hostName, stayImage }),
    ctaLabel: 'View my booking',
    ctaHref: `${SITE_URL}/bookings`,
    whatsappHref: whatsapp,
    guestEmail: to,
  });
  return send({ to, subject: `Payment received · ${booking.reference_code} — ${stayTitle}`, html, label: `payment email for ${booking.reference_code}`, qrText: `${SITE_URL}/reservation/${booking.reference_code}` });
}

export async function sendHoldCreatedEmail({ to, booking, stayTitle, location, hostName, guestName, stayImage }) {
  const amountDue = Number(booking.total_amount) * 0.2;
  const html = shell({
    banner: `
      <div style="background:${T.paper2};border:1px solid ${T.warn};border-radius:16px;padding:18px 24px;margin-bottom:16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.warn};margin-bottom:6px;">Hold created</div>
            <div style="font-family:${FONT_DISPLAY};font-size:21px;font-weight:600;color:${T.ink};">Your dates are held, ${escapeHtml(guestName.split(' ')[0])}</div>
            <div style="font-size:12.5px;color:${T.ink2};margin-top:4px;">Pay <strong>₹${fmtMoney(amountDue)}</strong> within 24 hours to lock this stay — the rest is paid at the property.</div>
          </td>
          <td align="right" valign="middle">
            <div style="background:${T.elevated};border:1px solid ${T.gold};border-radius:12px;width:48px;height:48px;line-height:48px;text-align:center;">${iconImg('lock', 22)}</div>
          </td>
        </tr></table>
      </div>`,
    content: voucher({ booking, stayTitle, location, hostName, stayImage }),
    ctaLabel: `Pay ₹${fmtMoney(amountDue)} now`,
    ctaHref: `${SITE_URL}/bookings`,
    guestEmail: to,
  });
  return send({ to, subject: `Hold created · ${booking.reference_code} — complete your payment`, html, label: `hold email for ${booking.reference_code}`, qrText: `${SITE_URL}/reservation/${booking.reference_code}` });
}

export async function sendBookingStatusEmail({ to, booking, stayTitle, location, hostName, status, guestName, stayImage }) {
  const meta = {
    confirmed: { icon: 'check-circle', bg: T.ok, label: 'Booking confirmed', headline: 'See you soon, ' + escapeHtml(guestName.split(' ')[0]) },
    declined: { icon: 'x-circle', bg: T.err, label: 'Booking declined', headline: 'This stay could not be confirmed' },
    cancelled: { icon: 'x-circle', bg: T.ink3, label: 'Booking cancelled', headline: 'Booking cancelled' },
  };
  const m = meta[status] || meta.cancelled;
  const html = shell({
    banner: `
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:18px 24px;margin-bottom:16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${m.bg};margin-bottom:6px;">${m.label}</div>
            <div style="font-family:${FONT_DISPLAY};font-size:21px;font-weight:600;color:${T.ink};">${m.headline}</div>
          </td>
          <td align="right" valign="middle">
            <div style="background:${T.elevated};border:1px solid ${m.bg};border-radius:12px;width:48px;height:48px;line-height:48px;text-align:center;">${iconImg(m.icon, 22)}</div>
          </td>
        </tr></table>
      </div>`,
    content: voucher({ booking, stayTitle, location, hostName, stayImage }),
    ctaLabel: status === 'confirmed' ? 'View my booking' : 'Explore other stays',
    ctaHref: status === 'confirmed' ? `${SITE_URL}/bookings` : SITE_URL,
    guestEmail: to,
  });
  return send({ to, subject: `${m.label} · ${booking.reference_code}`, html, label: `status email (${status}) for ${booking.reference_code}`, qrText: `${SITE_URL}/reservation/${booking.reference_code}` });
}

export async function sendAdminNewBookingAlert({ to, booking, stayTitle, location, hostName, guestName, stayImage }) {
  const html = shell({
    banner: `
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:18px 24px;margin-bottom:16px;">
        <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.ink3};margin-bottom:6px;">New booking request</div>
        <div style="font-family:${FONT_DISPLAY};font-size:21px;font-weight:600;color:${T.ink};">${escapeHtml(guestName)} just held ${escapeHtml(stayTitle)}</div>
        <div style="font-size:12.5px;color:${T.ink2};margin-top:4px;">${escapeHtml(location)} · ${escapeHtml(fmtDate(booking.check_in))} → ${escapeHtml(fmtDate(booking.check_out))} · ${booking.guests_count} guest${booking.guests_count > 1 ? 's' : ''}</div>
      </div>`,
    content: voucher({ booking, stayTitle, location, hostName, stayImage }),
    ctaLabel: 'Review bookings',
    ctaHref: `${SITE_URL}/bookings`,
  });
  return send({ to, subject: `New booking · ${booking.reference_code} — ${guestName}`, html, label: `admin alert for ${booking.reference_code}`, qrText: `${SITE_URL}/reservation/${booking.reference_code}` });
}
