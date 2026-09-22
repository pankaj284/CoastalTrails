import nodemailer from 'nodemailer';

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

function buildBookingEmail({ booking, stayTitle, location, hostName, hostWhatsapp, guestName, guestEmail }) {
  const whatsapp = hostWhatsapp ? `https://wa.me/${String(hostWhatsapp).replace(/\D/g, '')}` : null;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="background:#0F172A;padding:28px 32px;">
      <div style="font-size:18px;font-weight:700;color:#ffffff;">Coastal Trails</div>
      <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Gokarna homestays · cliff trails · ferry guides</div>
    </div>
    <div style="padding:32px;">
      <div style="width:44px;height:44px;border-radius:50%;background:#0D9488;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="color:#fff;font-size:20px;font-weight:700;">✓</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;color:#0F172A;">Payment successful — your stay is booked</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
        Namaskara ${escapeHtml(guestName)},<br>
        Your 20% hold is confirmed. Your booking has been sent to the host for confirmation.
      </p>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Booking summary</div>
        <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:2px;">${escapeHtml(stayTitle)}</div>
        <div style="font-size:13px;color:#64748B;margin-bottom:14px;">${escapeHtml(location)} · host ${escapeHtml(hostName)}</div>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#64748B;">Reference</td><td style="text-align:right;font-weight:700;font-family:monospace;">${escapeHtml(booking.reference_code)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Check-in</td><td style="text-align:right;font-weight:600;">${escapeHtml(fmtDate(booking.check_in))}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Check-out</td><td style="text-align:right;font-weight:600;">${escapeHtml(fmtDate(booking.check_out))}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Guests</td><td style="text-align:right;font-weight:600;">${booking.guests_count} · ${nights(booking)} night${nights(booking) === 1 ? '' : 's'}</td></tr>
        </table>
      </div>

      <div style="background:#F0FDFA;border:1px solid #99F6E4;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0D9488;margin-bottom:12px;">Payment</div>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#334155;">Total stay tariff</td><td style="text-align:right;font-weight:700;">₹${fmtMoney(booking.total_amount)}</td></tr>
          <tr><td style="padding:6px 0;color:#334155;">Advance paid (20%)</td><td style="text-align:right;font-weight:700;color:#0D9488;">₹${fmtMoney(booking.advance_paid)} ✓</td></tr>
          <tr><td style="padding:6px 0;color:#334155;">Balance at property</td><td style="text-align:right;font-weight:700;color:#B45309;">₹${fmtMoney(booking.balance_payable_at_property)}</td></tr>
          <tr><td style="padding:6px 0;color:#334155;">Convenience fee</td><td style="text-align:right;font-weight:700;color:#0D9488;">₹0</td></tr>
        </table>
      </div>

      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px;font-size:13px;line-height:1.6;color:#7C2D12;">
        Pay the remaining balance directly at the property on arrival — no middleman contact needed. Our concierge coordinates your arrival.
      </div>

      <div style="margin-top:24px;">
        <a href="https://coastaltrails.in/bookings" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">View my booking</a>
        ${whatsapp ? `<a href="${whatsapp}" style="display:inline-block;margin-left:8px;border:1px solid #0D9488;color:#0D9488;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">WhatsApp host</a>` : ''}
      </div>

      <p style="margin:24px 0 0;font-size:11px;color:#94A3B8;line-height:1.6;">
        Sent by Coastal Trails, Gokarna · ${escapeHtml(guestEmail)}<br>
        This is a booking confirmation for your records.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPaymentSuccessEmail({ to, booking, stayTitle, location, hostName, hostWhatsapp, guestName }) {
  const transporter = getTransporter();
  if (!transporter || !to) {
    console.log(`[mail] SMTP not configured — skipping payment email for ${booking.reference_code} (to: ${to})`);
    return { skipped: true };
  }
  const html = buildBookingEmail({ booking, stayTitle, location, hostName, hostWhatsapp, guestName, guestEmail: to });
  await transporter.sendMail({
    from: `"Coastal Trails" <${process.env.SMTP_USER}>`,
    to,
    subject: `Payment received · ${booking.reference_code} — ${stayTitle}`,
    html,
  });
  console.log(`[mail] Payment email sent for ${booking.reference_code} → ${to}`);
  return { sent: true };
}
