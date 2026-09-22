import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const SITE_URL = process.env.SITE_URL || 'https://coastaltrails.in';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../assets/coastal-trails-logo.png');

// Deep Water Cartography — light "Chart Paper" theme (from website/client/DESIGN.md)
const T = {
  paper: '#FCFBF7',
  paper2: '#F6F3EA',
  elevated: '#FDFCF9',
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

function row(label, value, { mono = true, tone = '' } = {}) {
  return `
          <tr>
            <td style="padding:7px 0;color:${T.ink2};font-size:13px;">${label}</td>
            <td style="text-align:right;padding:7px 0;${mono ? `font-family:${FONT_MONO};` : ''}font-weight:600;color:${tone || T.ink};font-size:13px;">${value}</td>
          </tr>`;
}

function overline(icon, label, tone = T.tide) {
  return `
        <div style="font-family:${FONT_MONO};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${tone};margin-bottom:14px;">
          ${icon ? `<span style="font-size:13px;margin-right:6px;">${icon}</span>` : ''}${label}
        </div>`;
}

function well({ icon, label, tone = T.tide, rows }) {
  return `
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:22px 24px;margin-bottom:16px;">
        ${overline(icon, label, tone)}
        <table style="width:100%;border-collapse:collapse;">
${rows}
        </table>
      </div>`;
}

function shell({ icon, iconBg, headline, sub, content, ctaLabel, ctaHref, whatsappHref, guestEmail }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${T.paper};font-family:${FONT_BODY};color:${T.ink};">
  <div style="max-width:580px;margin:32px auto;background:${T.elevated};border-radius:20px;overflow:hidden;border:1px solid ${T.line};">
    <div style="padding:32px 36px 28px;text-align:center;">
      <img src="cid:coastallogo" alt="Coastal Trails" width="190" style="height:auto;display:block;margin:0 auto 14px;">
      <div style="font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${T.ink3};">Gokarna · Coastal Homestays</div>
    </div>
    <div style="height:3px;background:${T.glow};"></div>
    <div style="padding:32px 36px 36px;">
      <div style="width:48px;height:48px;border-radius:14px;background:${iconBg};display:flex;align-items:center;justify-content:center;margin-bottom:18px;">
        <span style="color:#ffffff;font-size:22px;font-weight:600;line-height:1;">${icon}</span>
      </div>
      <h1 style="margin:0 0 10px;font-family:${FONT_DISPLAY};font-size:25px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;color:${T.ink};">${headline}</h1>
      <p style="margin:0 0 26px;font-size:14px;line-height:1.65;color:${T.ink2};">${sub}</p>
      ${content}
      ${ctaLabel || whatsappHref ? `
      <div style="margin-top:28px;">
        ${ctaLabel ? `<a href="${ctaHref}" style="display:inline-block;background:${T.tide};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:12px;">${ctaLabel}</a>` : ''}
        ${whatsappHref ? `<a href="${whatsappHref}" style="display:inline-block;margin-left:10px;border:1.5px solid ${T.tide};color:${T.tide};text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:12px;">WhatsApp host</a>` : ''}
      </div>` : ''}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${T.line};text-align:center;">
        <p style="margin:0 0 6px;font-family:${FONT_MONO};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.ink3};">
          Coastal Trails · Gokarna
        </p>
        ${guestEmail ? `<p style="margin:0;font-family:${FONT_MONO};font-size:10px;color:${T.ink3};">${escapeHtml(guestEmail)}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function send({ to, subject, html, label }) {
  const transporter = getTransporter();
  if (!transporter || !to) {
    console.log(`[mail] SMTP not configured — skipping ${label} (to: ${to})`);
    return { skipped: true };
  }
  await transporter.sendMail({
    from: `"Coastal Trails Bookings" <${process.env.SMTP_USER}>`,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'coastal-trails-logo.png',
        path: LOGO_PATH,
        cid: 'coastallogo',
      },
    ],
  });
  console.log(`[mail] ${label} sent → ${to}`);
  return { sent: true };
}

export async function sendPaymentSuccessEmail({ to, booking, stayTitle, location, hostName, hostWhatsapp, guestName }) {
  const whatsapp = hostWhatsapp ? `https://wa.me/${String(hostWhatsapp).replace(/\D/g, '')}` : null;
  const html = shell({
    icon: '✓',
    iconBg: T.ok,
    headline: 'Payment successful — your stay is booked',
    sub: `Namaskara ${escapeHtml(guestName)},<br>Your 20% hold is confirmed. The host has been notified and will confirm shortly.`,
    content: `
      ${well({
        icon: '🏠',
        label: 'Stay & dates',
        rows:
          row('Homestay', escapeHtml(stayTitle)) +
          row('Location', escapeHtml(location), { mono: false }) +
          row('Host', escapeHtml(hostName), { mono: false }) +
          row('Reference', escapeHtml(booking.reference_code)) +
          row('Check-in', escapeHtml(fmtDate(booking.check_in))) +
          row('Check-out', escapeHtml(fmtDate(booking.check_out))) +
          row('Guests', `${booking.guests_count} · ${nights(booking)} night${nights(booking) === 1 ? '' : 's'}`),
      })}
      ${well({
        icon: '💳',
        label: 'Payment',
        tone: T.tide,
        rows:
          row('Total stay tariff', `₹${fmtMoney(booking.total_amount)}`) +
          row('Advance paid (20%)', `₹${fmtMoney(booking.advance_paid)} ✓`, { tone: T.ok }) +
          row('Balance at property', `₹${fmtMoney(booking.balance_payable_at_property)}`, { tone: T.gold }) +
          row('Convenience fee', '₹0', { tone: T.ok }),
      })}
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:18px 22px;font-size:13px;line-height:1.6;color:${T.ink2};">
        🧭 Pay the remaining balance directly at the property on arrival — no middleman contact needed.
      </div>`,
    ctaLabel: 'View my booking',
    ctaHref: `${SITE_URL}/bookings`,
    whatsappHref: whatsapp,
    guestEmail: to,
  });
  return send({ to, subject: `Payment received · ${booking.reference_code} — ${stayTitle}`, html, label: `payment email for ${booking.reference_code}` });
}

export async function sendHoldCreatedEmail({ to, booking, stayTitle, location, hostName, guestName }) {
  const amountDue = Number(booking.total_amount) * 0.2;
  const html = shell({
    icon: '🔒',
    iconBg: T.gold,
    headline: 'Your dates are held — complete your 20% hold',
    sub: `Namaskara ${escapeHtml(guestName)},<br>Your rooms are reserved for 24 hours. Pay <strong>₹${fmtMoney(amountDue)}</strong> to lock this stay — the rest is paid at the property.`,
    content: `
      ${well({
        icon: '🏠',
        label: 'Stay & dates',
        rows:
          row('Homestay', escapeHtml(stayTitle)) +
          row('Location', escapeHtml(location), { mono: false }) +
          row('Host', escapeHtml(hostName), { mono: false }) +
          row('Reference', escapeHtml(booking.reference_code)) +
          row('Check-in', escapeHtml(fmtDate(booking.check_in))) +
          row('Check-out', escapeHtml(fmtDate(booking.check_out))) +
          row('Guests', `${booking.guests_count} · ${nights(booking)} night${nights(booking) === 1 ? '' : 's'}`),
      })}
      <div style="background:${T.paper2};border:1px solid ${T.line};border-radius:16px;padding:18px 22px;font-size:13px;line-height:1.6;color:${T.warn};">
        ⏳ Hold expires: <strong>${escapeHtml(fmtDate(String(booking.hold_expires_at).slice(0, 10)))}</strong> — if it lapses, the rooms are released automatically.
      </div>`,
    ctaLabel: `Pay ₹${fmtMoney(amountDue)} now`,
    ctaHref: `${SITE_URL}/bookings`,
    guestEmail: to,
  });
  return send({ to, subject: `Hold created · ${booking.reference_code} — complete your payment`, html, label: `hold email for ${booking.reference_code}` });
}

export async function sendBookingStatusEmail({ to, booking, stayTitle, location, hostName, status, guestName }) {
  const meta = {
    confirmed: { icon: '🎉', iconBg: T.ok, headline: 'Booking confirmed — see you soon!', sub: `Namaskara ${escapeHtml(guestName)},<br>Your host has confirmed your stay. Pack light — the coast awaits.`, cta: 'View my booking', ctaHref: `${SITE_URL}/bookings` },
    declined: { icon: '✕', iconBg: T.err, headline: 'Booking declined', sub: `Namaskara ${escapeHtml(guestName)},<br>Unfortunately the host could not accept this booking. Any paid hold is refunded to your original payment method.`, cta: 'Explore other stays', ctaHref: SITE_URL },
    cancelled: { icon: '✕', iconBg: T.ink3, headline: 'Booking cancelled', sub: `Namaskara ${escapeHtml(guestName)},<br>Your booking has been cancelled. Any paid hold is refunded to your original payment method.`, cta: 'Explore other stays', ctaHref: SITE_URL },
  };
  const m = meta[status] || meta.cancelled;
  const html = shell({
    icon: m.icon,
    iconBg: m.iconBg,
    headline: m.headline,
    sub: m.sub,
    content: `
      ${well({
        icon: '🏠',
        label: 'Stay & dates',
        rows:
          row('Homestay', escapeHtml(stayTitle)) +
          row('Location', escapeHtml(location), { mono: false }) +
          row('Host', escapeHtml(hostName), { mono: false }) +
          row('Reference', escapeHtml(booking.reference_code)) +
          row('Check-in', escapeHtml(fmtDate(booking.check_in))) +
          row('Check-out', escapeHtml(fmtDate(booking.check_out))),
      })}
      ${well({
        icon: '💳',
        label: 'Payment',
        tone: T.tide,
        rows:
          row('Total stay tariff', `₹${fmtMoney(booking.total_amount)}`) +
          row('Advance paid (20%)', `₹${fmtMoney(booking.advance_paid)}`, { tone: booking.payment_status === 'paid' ? T.ok : T.ink }) +
          row('Balance at property', `₹${fmtMoney(booking.balance_payable_at_property)}`, { tone: T.gold }),
      })}`,
    ctaLabel: m.cta,
    ctaHref: m.ctaHref,
    guestEmail: to,
  });
  return send({ to, subject: `${m.headline} · ${booking.reference_code}`, html, label: `status email (${status}) for ${booking.reference_code}` });
}

export async function sendAdminNewBookingAlert({ to, booking, stayTitle, location, hostName, guestName }) {
  const html = shell({
    icon: '🔔',
    iconBg: T.ink,
    headline: 'New booking request',
    sub: `${escapeHtml(guestName)} just held <strong>${escapeHtml(stayTitle)}</strong> (${escapeHtml(location)}).`,
    content: `
      ${well({
        icon: '🏠',
        label: 'Booking',
        rows:
          row('Reference', escapeHtml(booking.reference_code)) +
          row('Guest', escapeHtml(guestName), { mono: false }) +
          row('Phone', escapeHtml(booking.user_phone)) +
          row('Check-in', escapeHtml(fmtDate(booking.check_in))) +
          row('Check-out', escapeHtml(fmtDate(booking.check_out))) +
          row('Guests', String(booking.guests_count)) +
          row('Total tariff', `₹${fmtMoney(booking.total_amount)}`, { tone: T.ember }) +
          row('Hold status', booking.payment_status === 'paid' ? 'Paid ✓' : 'Payment pending', { tone: booking.payment_status === 'paid' ? T.ok : T.warn }),
      })}`,
    ctaLabel: 'Review bookings',
    ctaHref: `${SITE_URL}/bookings`,
  });
  return send({ to, subject: `New booking · ${booking.reference_code} — ${guestName}`, html, label: `admin alert for ${booking.reference_code}` });
}
