import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const SITE_URL = process.env.SITE_URL || 'https://coastaltrails.in';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../assets/coastal-trails-logo.png');

// Site design tokens (Deep Water Cartography, light theme)
const T = {
  paper: '#F5F2EA',
  elevated: '#FFFFFF',
  line: '#E5E0D3',
  ink: '#16222E',
  ink2: '#4B5563',
  ink3: '#8A93A0',
  tide: '#0F766E',
  tideSoft: '#F0FDFA',
  tideBorder: '#99E6DC',
  gold: '#B7791F',
  goldSoft: '${T.goldSoft}',
  goldBorder: '#F4D9A8',
  ember: '#C4452F',
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

function bookingSummary(booking, stayTitle, location, hostName) {
  return `
      <div style="background:${T.paper};border:1px solid ${T.line};border-radius:14px;padding:20px;margin-bottom:18px;">
        <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.ink3};margin-bottom:12px;">Booking summary</div>
        <div style="font-family:${FONT_DISPLAY};font-size:17px;font-weight:600;color:${T.ink};margin-bottom:2px;">${escapeHtml(stayTitle)}</div>
        <div style="font-size:13px;color:${T.ink2};margin-bottom:14px;">${escapeHtml(location)} · host ${escapeHtml(hostName)}</div>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:${T.ink2};">Reference</td><td style="text-align:right;font-weight:700;font-family:${FONT_MONO};">${escapeHtml(booking.reference_code)}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink2};">Check-in</td><td style="text-align:right;font-weight:600;font-family:${FONT_MONO};">${escapeHtml(fmtDate(booking.check_in))}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink2};">Check-out</td><td style="text-align:right;font-weight:600;font-family:${FONT_MONO};">${escapeHtml(fmtDate(booking.check_out))}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink2};">Guests</td><td style="text-align:right;font-weight:600;font-family:${FONT_MONO};">${booking.guests_count} · ${nights(booking)} night${nights(booking) === 1 ? '' : 's'}</td></tr>
        </table>
      </div>`;
}

function paymentBlock(booking) {
  return `
      <div style="background:${T.tideSoft};border:1px solid ${T.tideBorder};border-radius:14px;padding:20px;margin-bottom:18px;">
        <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.tide};margin-bottom:12px;">Payment</div>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:${T.ink};">Total stay tariff</td><td style="text-align:right;font-weight:700;font-family:${FONT_MONO};">₹${fmtMoney(booking.total_amount)}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink};">Advance paid (20%)</td><td style="text-align:right;font-weight:700;color:${T.tide};font-family:${FONT_MONO};">₹${fmtMoney(booking.advance_paid)} ${booking.payment_status === 'paid' ? '✓' : ''}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink};">Balance at property</td><td style="text-align:right;font-weight:700;color:${T.gold};font-family:${FONT_MONO};">₹${fmtMoney(booking.balance_payable_at_property)}</td></tr>
          <tr><td style="padding:6px 0;color:${T.ink};">Convenience fee</td><td style="text-align:right;font-weight:700;color:${T.tide};font-family:${FONT_MONO};">₹0</td></tr>
        </table>
      </div>`;
}

function shell({ icon, iconBg, headline, sub, content, ctaLabel, ctaHref, whatsappHref, guestName, guestEmail, extraFooter }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${T.paper};font-family:${FONT_BODY};color:${T.ink};">
  <div style="max-width:580px;margin:28px auto;background:${T.elevated};border-radius:18px;overflow:hidden;border:1px solid ${T.line};box-shadow:0 4px 18px rgba(22,34,46,0.05);">
    <div style="padding:30px 36px 26px;text-align:center;">
      <img src="cid:coastallogo" alt="Coastal Trails" width="180" style="height:auto;display:block;margin:0 auto 12px;">
      <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${T.tide};">Gokarna · Coastal Homestays</div>
    </div>
    <div style="height:14px;line-height:0;">
      <svg width="100%" height="14" viewBox="0 0 580 14" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10 Q 60 2 120 10 T 240 10 T 360 10 T 480 10 T 600 10" fill="none" stroke="${T.tide}" stroke-width="2" opacity="0.55"/>
        <path d="M0 7 Q 60 0 120 7 T 240 7 T 360 7 T 480 7 T 600 7" fill="none" stroke="${T.tide}" stroke-width="1.5" opacity="0.25"/>
      </svg>
    </div>
    <div style="padding:28px 36px 32px;">
      <div style="width:46px;height:46px;border-radius:14px;background:${iconBg};display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="color:#fff;font-size:20px;font-weight:700;line-height:1;">${icon}</span>
      </div>
      <h1 style="margin:0 0 10px;font-family:${FONT_DISPLAY};font-size:24px;font-weight:600;letter-spacing:-0.01em;color:${T.ink};">${headline}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:${T.ink2};">${sub}</p>
      ${content}
      ${ctaLabel || whatsappHref ? `
      <div style="margin-top:26px;">
        ${ctaLabel ? `<a href="${ctaHref}" style="display:inline-block;background:${T.tide};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:12px;">${ctaLabel}</a>` : ''}
        ${whatsappHref ? `<a href="${whatsappHref}" style="display:inline-block;margin-left:10px;border:1.5px solid ${T.tide};color:${T.tide};text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px;">WhatsApp host</a>` : ''}
      </div>` : ''}
      ${extraFooter || ''}
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid ${T.line};text-align:center;">
        <p style="margin:0;font-family:${FONT_MONO};font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${T.ink3};">
          Coastal Trails · Gokarna${guestEmail ? ` · ${escapeHtml(guestEmail)}` : ''}
        </p>
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
    iconBg: '#0F766E',
    headline: 'Payment successful — your stay is booked',
    sub: `Namaskara ${escapeHtml(guestName)},<br>Your 20% hold is confirmed and your booking has been sent to the host.`,
    content: bookingSummary(booking, stayTitle, location, hostName) + paymentBlock(booking) + `
      <div style="background:${T.goldSoft};border:1px solid ${T.goldBorder};border-radius:12px;padding:16px;font-size:13px;line-height:1.6;color:${T.gold};">
        Pay the remaining balance directly at the property on arrival — no middleman contact needed.
      </div>`,
    ctaLabel: 'View my booking',
    ctaHref: `${SITE_URL}/bookings`,
    whatsappHref: whatsapp,
    guestName,
    guestEmail: to,
  });
  return send({ to, subject: `Payment received · ${booking.reference_code} — ${stayTitle}`, html, label: `payment email for ${booking.reference_code}` });
}

export async function sendHoldCreatedEmail({ to, booking, stayTitle, location, hostName, guestName }) {
  const amountDue = Number(booking.total_amount) * 0.2;
  const html = shell({
    icon: '🔒',
    iconBg: '#F59E0B',
    headline: 'Your dates are held — complete your 20% hold',
    sub: `Namaskara ${escapeHtml(guestName)},<br>Your rooms are reserved for 24 hours. Pay the 20% hold (₹${fmtMoney(amountDue)}) to lock this stay — the rest is paid at the property.`,
    content: bookingSummary(booking, stayTitle, location, hostName) + `
      <div style="background:${T.goldSoft};border:1px solid ${T.goldBorder};border-radius:12px;padding:16px;font-size:13px;line-height:1.6;color:${T.gold};">
        Hold expires: <strong>${escapeHtml(fmtDate(String(booking.hold_expires_at).slice(0, 10)))}</strong>. If the hold lapses, the rooms are released automatically.
      </div>`,
    ctaLabel: 'Pay ₹' + fmtMoney(amountDue) + ' now',
    ctaHref: `${SITE_URL}/bookings`,
    guestName,
    guestEmail: to,
  });
  return send({ to, subject: `Hold created · ${booking.reference_code} — complete your payment`, html, label: `hold email for ${booking.reference_code}` });
}

export async function sendBookingStatusEmail({ to, booking, stayTitle, location, hostName, status, guestName }) {
  const meta = {
    confirmed: { icon: '🎉', iconBg: '#0F766E', headline: 'Booking confirmed — see you soon!', sub: `Namaskara ${escapeHtml(guestName)},<br>Your host has confirmed your stay. Pack light — the coast awaits.` },
    declined: { icon: '✕', iconBg: '#E11D48', headline: 'Booking declined', sub: `Namaskara ${escapeHtml(guestName)},<br>Unfortunately the host could not accept this booking. Any paid hold is refunded to your original payment method.` },
    cancelled: { icon: '✕', iconBg: '#64748B', headline: 'Booking cancelled', sub: `Namaskara ${escapeHtml(guestName)},<br>Your booking has been cancelled. Any paid hold is refunded to your original payment method.` },
  };
  const m = meta[status] || meta.cancelled;
  const html = shell({
    icon: m.icon,
    iconBg: m.iconBg,
    headline: m.headline,
    sub: m.sub,
    content: bookingSummary(booking, stayTitle, location, hostName) + paymentBlock(booking),
    ctaLabel: status === 'confirmed' ? 'View my booking' : 'Explore other stays',
    ctaHref: status === 'confirmed' ? `${SITE_URL}/bookings` : SITE_URL,
    guestName,
    guestEmail: to,
  });
  return send({ to, subject: `${m.headline} · ${booking.reference_code}`, html, label: `status email (${status}) for ${booking.reference_code}` });
}

export async function sendAdminNewBookingAlert({ to, booking, stayTitle, location, hostName, guestName }) {
  const html = shell({
    icon: '🔔',
    iconBg: '${T.ink}',
    headline: 'New booking request',
    sub: `${escapeHtml(guestName)} just held <strong>${escapeHtml(stayTitle)}</strong> (${escapeHtml(location)}).`,
    content: bookingSummary(booking, stayTitle, location, hostName),
    ctaLabel: 'Review bookings',
    ctaHref: `${SITE_URL}/bookings`,
    extraFooter: `
      <div style="background:${T.tideSoft};border:1px solid ${T.tideBorder};border-radius:12px;padding:14px;font-size:12px;color:${T.ink};">
        Ref <strong>${escapeHtml(booking.reference_code)}</strong> · ${escapeHtml(fmtDate(booking.check_in))} → ${escapeHtml(fmtDate(booking.check_out))} · ${booking.guests_count} guest${booking.guests_count === 1 ? '' : 's'}
      </div>`,
  });
  return send({ to, subject: `New booking · ${booking.reference_code} — ${guestName}`, html, label: `admin alert for ${booking.reference_code}` });
}
