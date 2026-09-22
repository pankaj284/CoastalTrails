// WhatsApp booking confirmations.
//
// Two layers:
//  1. Always available: a wa.me deep link with the full booking details
//     pre-filled, addressed to the guest's own number (one tap to send).
//  2. Automatic delivery: when a provider is configured in .env
//     (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM),
//     sendWhatsApp() delivers the message server-side without user action.

function toWaNumber(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `91${digits}`; // local Indian number → +91
  if (digits.startsWith('0') && digits.length === 11) digits = `91${digits.slice(1)}`;
  return digits;
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function prettyDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return m >= 1 && m <= 12 ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
}

export function bookingWhatsAppText(booking, homestay) {
  const nights = Math.max(
    1,
    Math.round((new Date(`${booking.check_out}T00:00:00`) - new Date(`${booking.check_in}T00:00:00`)) / 86400000)
  );
  const paid = Number(booking.advance_paid || 0);
  const balance = Number(booking.balance_payable_at_property || 0);
  const statusLabel =
    booking.status === 'confirmed'
      ? 'Confirmed by the host'
      : booking.status === 'awaiting_host'
        ? 'Awaiting host confirmation'
        : booking.status === 'checked_in'
          ? 'Checked in'
          : booking.status === 'completed'
            ? 'Stay completed'
            : booking.status === 'pending_payment'
              ? 'Payment pending'
              : booking.status;

  const lines = [
    '🏖️ *Coastal Trails — booking confirmed*',
    '',
    `*Ref:* ${booking.reference_code}`,
    `*Stay:* ${homestay?.title || 'Coastal stay'}${homestay?.location_display ? ` (${homestay.location_display})` : ''}`,
    homestay?.host_name ? `*Host:* ${homestay.host_name}${homestay.host_whatsapp ? ` · ${homestay.host_whatsapp}` : ''}` : null,
    '',
    `*Check-in:* ${booking.check_in} (after 12:00)`,
    `*Check-out:* ${booking.check_out} (before 11:00)`,
    `*Guests:* ${booking.guests_count} · ${nights} night${nights > 1 ? 's' : ''}`,
    booking.room_number ? `*Room:* ${booking.room_number}` : null,
    '',
    `*Total:* ${money(booking.total_amount)}`,
    paid > 0 ? `*Paid online (20% hold):* ${money(paid)}${booking.payment_id ? ` · ref ${booking.payment_id}` : ''}` : '*Paid online:* pending',
    `*Balance at property:* ${money(balance)}`,
    `*Status:* ${statusLabel}`,
    '',
    'Free cancellation up to 48 hours before check-in.',
    'Manage your booking on Coastal Trails → /bookings',
  ];

  return lines.filter((l) => l !== null).join('\n');
}

export function guestWhatsAppLink(booking, homestay) {
  const to = toWaNumber(booking.user_phone);
  const text = bookingWhatsAppText(booking, homestay);
  return to ? `https://wa.me/${to}?text=${encodeURIComponent(text)}` : null;
}

export function hostWhatsAppLink(booking, homestay) {
  const to = toWaNumber(homestay?.host_whatsapp);
  if (!to) return null;
  const nights = Math.max(
    1,
    Math.round((new Date(`${booking.check_out}T00:00:00`) - new Date(`${booking.check_in}T00:00:00`)) / 86400000)
  );
  const text = [
    `Namaskara ${homestay?.host_name || 'host'}! New stay request from Coastal Trails:`,
    `• Ref: ${booking.reference_code}`,
    `• Guest: ${booking.user_name} (${booking.user_phone})`,
    `• Dates: ${booking.check_in} to ${booking.check_out} (${nights} night(s))`,
    `• Room: ${booking.room_number || 'auto'}`,
    `• Guests: ${booking.guests_count}`,
    `• Advance paid: ${money(booking.advance_paid)} · Balance on arrival: ${money(booking.balance_payable_at_property)}`,
    'Please reply 1 to CONFIRM or 2 to DECLINE.',
  ].join('\n');
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export function whatsAppProviderConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM
  );
}

export function metaWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

// Meta WhatsApp Cloud API template delivery.
export async function sendWhatsAppTemplate(toPhone, templateName, bodyParams = []) {
  if (!metaWhatsAppConfigured()) {
    return { sent: false, provider: 'meta', reason: 'meta provider not configured' };
  }
  const to = toWaNumber(toPhone);
  if (!to) return { sent: false, provider: 'meta', reason: 'invalid phone' };

  const version = process.env.WHATSAPP_API_VERSION || 'v22.0';
  const language = process.env.WHATSAPP_TEMPLATE_LANG || 'en';
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: bodyParams.length
        ? [
            {
              type: 'body',
              parameters: bodyParams.map((text) => ({ type: 'text', text: String(text ?? '') })),
            },
          ]
        : undefined,
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        sent: false,
        provider: 'meta',
        reason: data?.error?.message || `provider error ${res.status}`,
      };
    }
    return { sent: true, provider: 'meta', message_id: data?.messages?.[0]?.id };
  } catch (err) {
    return { sent: false, provider: 'meta', reason: err.message };
  }
}

// Preferred provider: Meta Cloud API template, falling back to Twilio free text.
export async function sendBookingWhatsApp(booking, homestay) {
  if (metaWhatsAppConfigured()) {
    const templateName = process.env.WHATSAPP_BOOKING_TEMPLATE || 'booking_confirmed';
    return sendWhatsAppTemplate(booking.user_phone, templateName, [
      booking.user_name,
      booking.reference_code,
      homestay?.title || 'Coastal stay',
      prettyDate(booking.check_in),
      prettyDate(booking.check_out),
    ]);
  }
  if (whatsAppProviderConfigured()) {
    const result = await sendWhatsApp(booking.user_phone, bookingWhatsAppText(booking, homestay));
    return { ...result, provider: 'twilio' };
  }
  return { sent: false, provider: null, reason: 'provider not configured' };
}

export async function sendPaymentWhatsApp(booking) {
  if (!metaWhatsAppConfigured()) {
    return { sent: false, provider: null, reason: 'provider not configured' };
  }
  const templateName = process.env.WHATSAPP_PAYMENT_TEMPLATE || 'payment_received';
  return sendWhatsAppTemplate(booking.user_phone, templateName, [
    booking.user_name,
    booking.reference_code,
    Number(booking.advance_paid || 0).toLocaleString('en-IN'),
    Number(booking.balance_payable_at_property || 0).toLocaleString('en-IN'),
  ]);
}

export async function sendSignupWhatsApp(user) {
  if (!metaWhatsAppConfigured()) {
    return { sent: false, provider: null, reason: 'provider not configured' };
  }
  const templateName = process.env.WHATSAPP_SIGNUP_TEMPLATE || 'signup_welcome';
  return sendWhatsAppTemplate(user.phone, templateName, [user.name]);
}

// Server-side delivery (Twilio WhatsApp). Returns { sent, reason, sid }.
export async function sendWhatsApp(toPhone, text) {
  if (!whatsAppProviderConfigured()) {
    return { sent: false, reason: 'provider not configured' };
  }
  const to = toWaNumber(toPhone);
  if (!to) return { sent: false, reason: 'invalid phone' };

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const from = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
    ? process.env.TWILIO_WHATSAPP_FROM
    : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: `whatsapp:+${to}`, Body: text }).toString(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { sent: false, reason: data?.message || `provider error ${res.status}` };
    }
    return { sent: true, sid: data?.sid };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}
