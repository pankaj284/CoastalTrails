import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const SITE_URL = process.env.SITE_URL || 'https://coastaltrails.in';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../assets/brand-logo.png');
const ICON_DIR = path.resolve(__dirname, '../assets/icons');

const ICON_NAMES = [
  'star', 'leaf', 'map-pin', 'sun', 'calendar', 'clock', 'moon', 'users',
  'smartphone', 'receipt', 'id-card', 'check-circle-2', 'check-circle',
  'calendar-days', 'log-out', 'shield-check', 'credit-card', 'message-circle',
  'bell', 'lock', 'x-circle',
];

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

function fmtDate(iso, opts) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (opts?.long) {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function nights(booking) {
  const a = new Date(`${booking.check_in}T00:00:00`).getTime();
  const b = new Date(`${booking.check_out}T00:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

const icon = (name, size, extra = '') =>
  `<img src="cid:icon-${name}" width="${size}" height="${size}" alt="" style="display:inline-block;vertical-align:middle;border:0;${extra}">`;

function pill(label, color, bg, border) {
  return `<span style="display:inline-block;background-color:${bg};border:1px solid ${border};color:${color};padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">&bull; ${label}</span>`;
}

const PILLS = {
  awaiting: () => pill('Awaiting Host Confirmation', '#b45309', '#fef8ec', '#f6d8a3'),
  confirmed: () => pill('Confirmed &#10003;', '#059669', '#ecfdf5', '#a7f3d0'),
  declined: () => pill('Declined', '#c33b2e', '#fdf2f2', '#f5c6c0'),
  cancelled: () => pill('Cancelled', '#697471', '#f5f6f6', '#d8dcd9'),
  pending: () => pill('Payment Pending', '#b45309', '#fef8ec', '#f6d8a3'),
  failed: () => pill('Payment Failed', '#c33b2e', '#fdf2f2', '#f5c6c0'),
  newrequest: () => pill('New Booking Request', '#0f3d35', '#e4f2ee', '#bfe0d7'),
};

function receiptRows(booking, paymentState) {
  const holdLabel =
    paymentState === 'paid'
      ? '20% hold paid online'
      : paymentState === 'failed'
        ? '20% hold &mdash; payment failed'
        : paymentState === 'refunded'
          ? '20% hold &mdash; refunded'
          : '20% hold due online';
  const holdColor = paymentState === 'paid' ? '#059669' : paymentState === 'failed' ? '#c33b2e' : '#b45309';
  const holdIcon = paymentState === 'paid' ? 'check-circle-2' : 'clock';
  const payableLabel = paymentState === 'paid' ? '80% balance due at stay' : '80% balance at property';
  return `
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:24px;">
          <tr>
            <td style="color:#616e6a;padding:4px 0;">Total stay tariff (${nights(booking)} night${nights(booking) === 1 ? '' : 's'})</td>
            <td align="right" style="font-weight:700;color:#1c2826;padding:4px 0;font-family:'Courier New',monospace;">&#8377;${fmtMoney(booking.total_amount)}</td>
          </tr>
          <tr>
            <td style="color:${holdColor};font-weight:700;padding:4px 0;">
              ${icon(holdIcon, 12, 'margin-right:4px;')}
              ${holdLabel}
            </td>
            <td align="right" style="font-weight:800;color:${holdColor};padding:4px 0;font-family:'Courier New',monospace;">&#8377;${fmtMoney(booking.advance_paid)}</td>
          </tr>
          <tr>
            <td style="color:#616e6a;padding:4px 0;">${payableLabel}</td>
            <td align="right" style="font-weight:700;color:#1c2826;padding:4px 0;font-family:'Courier New',monospace;">&#8377;${fmtMoney(booking.balance_payable_at_property)}</td>
          </tr>
          <tr>
            <td style="color:#616e6a;padding:4px 0;">Platform &amp; Concierge fee</td>
            <td align="right" style="font-weight:600;color:#059669;padding:4px 0;">Waived</td>
          </tr>
          <tr>
            <td style="color:#616e6a;padding:4px 0;">Coastal Tourism &amp; Green Cess</td>
            <td align="right" style="font-weight:600;color:#616e6a;padding:4px 0;">Included</td>
          </tr>
          <tr><td colspan="2" style="padding-top:8px;border-bottom:1px dashed #ded9c8;"></td></tr>
          <tr>
            <td style="font-weight:800;font-size:13px;color:#0f3d35;padding-top:10px;">Payable at Property</td>
            <td align="right" style="font-weight:800;font-size:17px;color:#0f3d35;padding-top:10px;font-family:'Courier New',monospace;">&#8377;${fmtMoney(booking.balance_payable_at_property)}</td>
          </tr>
        </table>`;
}

function voucher({ booking, stay, paymentState, statusPill, cta }) {
  const n = nights(booking);
  const roomLabel = booking.room_number ? `Room ${booking.room_number}` : 'Private Chalet';
  return `
        <table role="presentation" class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background-color:#ffffff;border:1px solid #e3decb;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,61,53,0.07);">

          <tr>
            <td style="padding:18px 24px;background:linear-gradient(to right,#faf9f5,#f5f3ec);border-bottom:1px solid #eae5d4;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="76" valign="middle" style="padding-right:14px;">
                    <img src="cid:coastallogo" alt="Coastal Trails" width="68" height="68" style="display:block;width:68px;height:auto;border:0;background:transparent;">
                  </td>
                  <td valign="middle" class="mobile-stack">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="background-color:#e4f2ee;color:#0f3d35;font-size:10px;font-weight:800;letter-spacing:0.8px;padding:4px 8px;border-radius:5px;text-transform:uppercase;">Digital Pass 2026</span>
                          <span style="font-family:'Courier New',monospace;font-size:15px;font-weight:800;color:#0f3d35;letter-spacing:0.5px;margin-left:8px;">${escapeHtml(booking.reference_code)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:5px;font-size:11px;color:#697471;">
                          Official Stay Voucher &bull; Booked ${escapeHtml(fmtDate(booking.created_at))}
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" class="mobile-stack" style="padding-top:4px;">
                    ${statusPill}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 24px 18px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="125" valign="top" style="padding-right:18px;width:22%;" class="mobile-stack">
                    ${stay.image ? `<img src="${escapeHtml(stay.image)}" alt="${escapeHtml(stay.title)}" width="125" height="92" style="border-radius:10px;display:block;object-fit:cover;border:1px solid #e3decb;">` : ''}
                  </td>
                  <td valign="top" class="mobile-stack">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                      <tr>
                        <td style="background-color:#edf7f3;border:1px solid #c9e8dc;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;color:#059669;">
                          ${icon('leaf', 11, 'margin-right:3px;')}
                          Eco-Certified 2026
                        </td>
                      </tr>
                    </table>
                    <h2 style="margin:0 0 5px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:24px;color:#103831;font-weight:700;">
                      ${escapeHtml(stay.title)}
                    </h2>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right:5px;">${icon('map-pin', 13)}</td>
                        <td valign="middle" style="font-size:12px;color:#586561;">
                          ${escapeHtml(stay.location)} &bull; Gokarna, Karnataka 581326
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:14px;background-color:#f7f6f0;border:1px solid #ebe6d5;border-radius:8px;padding:8px 14px;">
                <tr>
                  <td valign="middle" width="18" style="padding-right:6px;">${icon('sun', 15)}</td>
                  <td valign="middle" style="font-size:11px;color:#586561;">
                    <strong style="color:#1c2826;">Coastal Forecast:</strong> 28&deg;C Clear Skies &bull; Arabian Sea Sunset at 6:18 PM &bull; Gentle Clifftop Breeze
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 22px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#faf9f4;border:1px solid #ebe6d5;border-radius:12px;padding:18px 20px;">
                <tr>
                  <td colspan="3" style="padding-bottom:12px;border-bottom:1px solid #ece7d6;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="middle" style="padding-right:6px;">${icon('calendar', 14)}</td>
                              <td valign="middle" style="font-size:11px;font-weight:800;color:#0f3d35;letter-spacing:0.8px;text-transform:uppercase;">Stay Schedule</td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" style="font-size:11px;color:#76807d;font-weight:600;">${escapeHtml(roomLabel)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="38%" valign="top" class="itinerary-cell" style="padding-top:14px;">
                    <div style="font-size:11px;color:#76807d;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Check-In</div>
                    <div style="font-size:16px;font-weight:800;color:#152422;margin:3px 0;">${escapeHtml(fmtDate(booking.check_in, { long: true }))}</div>
                    <div style="font-size:12px;color:#586561;">${icon('clock', 11, 'margin-right:3px;')} From 12:00 PM onwards</div>
                  </td>
                  <td width="24%" align="center" valign="middle" class="itinerary-mid" style="border-left:1px dashed #dad5c3;border-right:1px dashed #dad5c3;padding:14px 8px 0 8px;">
                    <div style="display:inline-block;background-color:#ffffff;border:1px solid #dcd7c5;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:800;color:#0f3d35;">
                      ${icon('moon', 12, 'margin-right:3px;')} ${n} Night${n > 1 ? 's' : ''}
                    </div>
                    <div style="font-size:11px;color:#76807d;margin-top:6px;white-space:nowrap;">${icon('users', 12, 'margin-right:2px;')} ${booking.guests_count} Guests &bull; ${escapeHtml(roomLabel)}</div>
                  </td>
                  <td width="38%" align="right" valign="top" class="itinerary-cell" style="padding-top:14px;">
                    <div style="font-size:11px;color:#76807d;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Check-Out</div>
                    <div style="font-size:16px;font-weight:800;color:#152422;margin:3px 0;">${escapeHtml(fmtDate(booking.check_out, { long: true }))}</div>
                    <div style="font-size:12px;color:#586561;">Before 11:00 AM ${icon('clock', 11, 'margin-left:3px;')}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:2px dashed #ded9c8;font-size:1px;line-height:1px;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="46%" valign="top" class="mobile-stack mobile-border-bottom" style="padding-right:20px;width:46%;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#faf9f4;border:1px solid #e7e3d4;border-radius:12px;padding:18px 16px;text-align:center;">
                      <tr>
                        <td align="center">
                          <div style="font-size:10px;font-weight:800;color:#0f3d35;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Fast-Track Check-in Pass</div>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #ded9c8;border-radius:10px;padding:10px;margin:0 auto;">
                            <tr>
                              <td align="center">
                                <img src="cid:qrcode" alt="Check-in QR Code ${escapeHtml(booking.reference_code)}" width="140" height="140" style="display:block;">
                              </td>
                            </tr>
                          </table>
                          <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:800;letter-spacing:1px;color:#0f3d35;margin-top:10px;background-color:#e5f2ee;padding:4px 12px;border-radius:6px;display:inline-block;">${escapeHtml(booking.reference_code)}</div>
                          <div style="font-size:10px;color:#76807d;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px;">Encrypted 2026 Pass &bull; Scan on Arrival</div>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:12px;background-color:#ffffff;border:1px solid #ded9c8;border-radius:6px;padding:5px 10px;">
                            <tr>
                              <td valign="middle" style="padding-right:5px;">${icon('smartphone', 13)}</td>
                              <td valign="middle" style="font-size:10px;font-weight:700;color:#0f3d35;">Apple &amp; Google Wallet Ready</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="top" class="mobile-stack">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td valign="middle" style="padding-right:6px;">${icon('receipt', 14)}</td>
                        <td valign="middle" style="font-size:11px;font-weight:800;color:#0f3d35;text-transform:uppercase;letter-spacing:0.8px;">Fare Receipt</td>
                      </tr>
                    </table>
                    ${receiptRows(booking, paymentState)}
                    <div style="margin-top:14px;background-color:#f7f6ef;border-radius:8px;padding:8px 12px;font-size:11px;color:#697471;">
                      Accepted at front desk: UPI (GPay/PhonePe), Card tap, or Cash.
                    </div>
                    ${cta ? `
                    <div style="margin-top:16px;text-align:center;">
                      <a href="${cta.href}" style="display:inline-block;background-color:#0f3d35;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 26px;border-radius:10px;">${cta.label}</a>
                    </div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${''}
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#faf9f5;border:1px solid #ede8d8;border-radius:10px;padding:14px 18px;font-size:11px;color:#5f6c68;line-height:18px;">
                <tr>
                  <td valign="top" width="50%" class="mobile-stack" style="padding-right:10px;">
                    ${icon('id-card', 13, 'margin-right:4px;')}
                    <strong>Digital ID Check:</strong> Government photo ID (Aadhaar / Passport) is requested for all adult guests at registration.
                  </td>
                  <td valign="top" width="50%" class="mobile-stack mobile-spacer">
                    ${icon('leaf', 13, 'margin-right:4px;')}
                    <strong>Eco Coastal Zone:</strong> Clifftop quiet hours begin at 10:30 PM. Comfortable walking footwear is advised for the stone cliff trail.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f6f4ec;border-top:1px solid #ebe6d5;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#43504d;font-weight:600;">Have questions about your booking or need trail directions?</p>
              <p style="margin:0 0 12px 0;font-size:12px;color:#626f6b;">Our 24/7 team is ready to assist at <a href="mailto:support@coastaltrails.in" style="color:#0f3d35;font-weight:800;text-decoration:underline;">support@coastaltrails.in</a></p>
              <p style="margin:0;font-size:10px;color:#8e9794;letter-spacing:0.3px;">&copy; 2026 Coastal Trails Hospitality Network &bull; Gokarna, Karnataka. All rights reserved.</p>
            </td>
          </tr>
        </table>`;
}

function emailShell({ title, inner }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f6f5ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
      .mobile-stack-center { display: block !important; width: 100% !important; text-align: center !important; }
      .mobile-hide { display: none !important; }
      .mobile-spacer { height: 16px !important; }
      .mobile-border-bottom { border-bottom: 1px dashed #ded9c8 !important; padding-bottom: 16px !important; margin-bottom: 16px !important; }
      .itinerary-cell { display: block !important; width: 100% !important; text-align: left !important; padding: 10px 0 !important; }
      .itinerary-mid { display: block !important; width: 100% !important; border-left: none !important; border-right: none !important; border-top: 1px dashed #ded9c8 !important; border-bottom: 1px dashed #ded9c8 !important; padding: 12px 0 !important; margin: 8px 0 !important; text-align: left !important; }
    }
    @media print {
      body { background-color: #ffffff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .email-container { box-shadow: none !important; border: 1px solid #d0ccc0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:28px 0;background-color:#f6f5ef;color:#1c2826;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f6f5ef">
    <tr>
      <td align="center" style="padding:0 14px;">
        ${inner}
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr><td height="28" style="font-size:1px;line-height:1px;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
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
    ? await QRCode.toBuffer(qrText, { width: 280, margin: 1, color: { dark: '#0f3d35', light: '#ffffff' } })
    : null;
  const usedIcons = ICON_NAMES.filter((name) => html.includes(`cid:icon-${name}`));
  await transporter.sendMail({
    from: `"Coastal Trails" <${process.env.SMTP_USER}>`,
    replyTo: process.env.MAIL_REPLY_TO || 'support@coastaltrails.in',
    to,
    subject,
    html,
    attachments: [
      { filename: 'brand-logo.png', path: LOGO_PATH, cid: 'coastallogo' },
      ...usedIcons.map((name) => ({
        filename: `${name}.png`,
        path: path.join(ICON_DIR, `${name}.png`),
        cid: `icon-${name}`,
      })),
      ...(qrBuffer && html.includes('cid:qrcode') ? [{ filename: 'qr.png', content: qrBuffer, cid: 'qrcode' }] : []),
    ],
  });
  console.log(`[mail] ${label} sent → ${to} (${usedIcons.length} icons)`);
  return { sent: true };
}

function qrTextFor(booking) {
  return `${SITE_URL}/pass/${booking.reference_code}`;
}

export async function sendPaymentSuccessEmail({ to, booking, stayTitle, location, hostName, hostWhatsapp, guestName, stayImage }) {
  const stay = { title: stayTitle, location, image: stayImage };
  const statusPill = booking.status === 'confirmed' || booking.status === 'checked_in' || booking.status === 'completed' ? PILLS.confirmed() : PILLS.awaiting();
  const html = emailShell({
    title: `Official Booking Voucher & Pass - ${stayTitle} | Coastal Trails`,
    inner: voucher({ booking, stay, paymentState: 'paid', statusPill }),
  });
  return send({ to, subject: `Payment received · ${booking.reference_code} — ${stayTitle}`, html, label: `payment email for ${booking.reference_code}`, qrText: qrTextFor(booking) });
}

export async function sendPaymentFailedEmail({ to, booking, stayTitle, location, hostName, guestName, stayImage }) {
  const stay = { title: stayTitle, location, image: stayImage };
  const html = emailShell({
    title: `Payment failed - Retry your hold | Coastal Trails`,
    inner: voucher({
      booking,
      stay,
      paymentState: 'failed',
      statusPill: PILLS.failed(),
      cta: { label: 'Retry payment', href: `${SITE_URL}/bookings` },
    }),
  });
  return send({ to, subject: `Payment failed · ${booking.reference_code} — retry your 20% hold`, html, label: `payment failed email for ${booking.reference_code}`, qrText: qrTextFor(booking) });
}

export async function sendHoldCreatedEmail({ to, booking, stayTitle, location, hostName, guestName, stayImage }) {
  const stay = { title: stayTitle, location, image: stayImage };
  const html = emailShell({
    title: `Booking Voucher & Pass - ${stayTitle} | Coastal Trails`,
    inner: voucher({
      booking,
      stay,
      paymentState: 'pending',
      statusPill: PILLS.pending(),
      cta: { label: 'Pay 20% hold now', href: `${SITE_URL}/bookings` },
    }),
  });
  return send({ to, subject: `Hold created · ${booking.reference_code} — complete your payment`, html, label: `hold email for ${booking.reference_code}`, qrText: qrTextFor(booking) });
}

export async function sendBookingStatusEmail({ to, booking, stayTitle, location, hostName, status, guestName, stayImage }) {
  const stay = { title: stayTitle, location, image: stayImage };
  const statusPill =
    status === 'confirmed' || status === 'checked_in' || status === 'completed'
      ? PILLS.confirmed()
      : status === 'declined'
        ? PILLS.declined()
        : PILLS.cancelled();
  const paymentState = booking.payment_status === 'paid' ? 'paid' : booking.payment_status === 'refunded' ? 'refunded' : 'pending';
  const html = emailShell({
    title: `Booking Update - ${stayTitle} | Coastal Trails`,
    inner: voucher({ booking, stay, paymentState, statusPill }),
  });
  return send({ to, subject: `Booking update · ${booking.reference_code} — ${status}`, html, label: `status email (${status}) for ${booking.reference_code}`, qrText: qrTextFor(booking) });
}

export async function sendAdminNewBookingAlert({ to, booking, stayTitle, location, hostName, guestName, stayImage }) {
  const stay = { title: stayTitle, location, image: stayImage };
  const paymentState = booking.payment_status === 'paid' ? 'paid' : 'pending';
  const html = emailShell({
    title: `New Booking - ${booking.reference_code} | Coastal Trails`,
    inner: voucher({ booking, stay, paymentState, statusPill: PILLS.newrequest() }),
  });
  return send({ to, subject: `New booking · ${booking.reference_code} — ${guestName}`, html, label: `admin alert for ${booking.reference_code}`, qrText: qrTextFor(booking) });
}
