import express from 'express';
import { all, get, run } from '../db/index.js';
import { expireStaleHolds, getRoomsLeftMap, eachNight, localTodayISO, localDateTime } from '../db/availability.js';

const router = express.Router();

const HOLD_HOURS = 24;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function prettyDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return m >= 1 && m <= 12 ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
}

// Helper to generate readable Gokarna booking reference like GK-839201
function generateRefCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `GK-${num}`;
}

// GET /api/bookings - List all bookings
router.get('/', async (req, res) => {
  try {
    await expireStaleHolds();
    const { phone } = req.query;
    let query = `
      SELECT b.*, h.title as homestay_title, h.location_display, h.host_name, h.host_whatsapp
      FROM bookings b
      LEFT JOIN homestays h ON b.homestay_id = h.id
    `;
    const params = [];

    if (phone) {
      query += ' WHERE b.user_phone = ?';
      params.push(phone);
    }

    query += ' ORDER BY b.created_at DESC';

    const bookings = await all(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await get(`
      SELECT b.*, h.title as homestay_title, h.location_display, h.host_name, h.host_whatsapp
      FROM bookings b
      LEFT JOIN homestays h ON b.homestay_id = h.id
      WHERE b.id = ? OR b.reference_code = ?
    `, [req.params.id, req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings - Create new booking with 20% advance calculation
router.post('/', async (req, res) => {
  try {
    const {
      homestay_id,
      user_name,
      user_phone,
      check_in,
      check_out,
      guests_count = 1,
    } = req.body;

    if (!homestay_id || !user_name || !user_phone || !check_in || !check_out) {
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    // Reject malformed or past dates — today is the earliest possible check-in
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoPattern.test(check_in) || !isoPattern.test(check_out)) {
      return res.status(400).json({ error: 'Dates must use the YYYY-MM-DD format' });
    }
    const today = localTodayISO();
    if (check_in < today) {
      return res.status(400).json({ error: 'Check-in cannot be in the past. Pick today or a future date.' });
    }
    if (check_out <= check_in) {
      return res.status(400).json({ error: 'Check-out must be after check-in (minimum one night).' });
    }

    const homestay = await get('SELECT * FROM homestays WHERE id = ?', [homestay_id]);
    if (!homestay) {
      return res.status(404).json({ error: 'Homestay does not exist' });
    }

    if (!homestay.availability_listed) {
      return res.status(409).json({
        error: "This stay isn't accepting bookings yet — the host hasn't published room availability.",
      });
    }

    // Live availability: stale holds expire first, then count rooms left per night
    await expireStaleHolds();
    const availability = await getRoomsLeftMap(homestay_id, check_in, check_out);
    const soldOutDates = eachNight(check_in, check_out).filter((d) => (availability.dates[d] ?? 0) <= 0);

    if (soldOutDates.length > 0) {
      return res.status(409).json({
        error: `No rooms left on ${soldOutDates.map(prettyDate).join(', ')}. Please select other dates.`,
        conflicts: soldOutDates,
      });
    }

    // Calculate nights
    const start = new Date(check_in);
    const end = new Date(check_out);
    const diffTime = Math.abs(end - start);
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Tariff calculation: 20% online advance, 80% direct to host
    // Base rate covers 2 guests; each extra guest adds 400/night
    const extraGuests = Math.max(0, (guests_count || 2) - 2);
    const total_amount = (homestay.price_per_night + extraGuests * 400) * nights;
    const advance_paid = Math.round(total_amount * 0.20);
    const balance_payable_at_property = total_amount - advance_paid;

    const id = `bk-${Date.now()}`;
    const reference_code = generateRefCode();
    // Unconfirmed holds release the rooms automatically after 24 hours
    const hold_expires_at = localDateTime(Date.now() + HOLD_HOURS * 60 * 60 * 1000);

    await run(
      `INSERT INTO bookings 
        (id, reference_code, homestay_id, user_name, user_phone, check_in, check_out, guests_count, total_amount, advance_paid, balance_payable_at_property, status, hold_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_host', ?)`,
      [
        id,
        reference_code,
        homestay_id,
        user_name,
        user_phone,
        check_in,
        check_out,
        guests_count,
        total_amount,
        advance_paid,
        balance_payable_at_property,
        hold_expires_at
      ]
    );

    // Availability is computed live from active bookings, so no static date rows are written.

    // Generate pre-filled WhatsApp link for direct host pinging
    const hostWhatsAppDigits = homestay.host_whatsapp.replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Namaskara ${homestay.host_name}! New stay request from Coastal Trails:\n` +
      `• Ref: ${reference_code}\n` +
      `• Guest: ${user_name} (${user_phone})\n` +
      `• Dates: ${check_in} to ${check_out} (${nights} night(s))\n` +
      `• Advance Paid: ₹${advance_paid} (20% hold)\n` +
      `• Balance Due on Arrival: ₹${balance_payable_at_property}\n` +
      `Please reply 1 to CONFIRM or 2 to DECLINE.`
    );
    const whatsappLink = `https://wa.me/${hostWhatsAppDigits}?text=${waText}`;

    const created = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json({
      ...created,
      nights,
      homestay_title: homestay.title,
      host_name: homestay.host_name,
      host_whatsapp: homestay.host_whatsapp,
      whatsapp_link: whatsappLink
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['awaiting_host', 'confirmed', 'declined', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
    }

    await run('UPDATE bookings SET status = ? WHERE id = ? OR reference_code = ?', [status, req.params.id, req.params.id]);

    const updated = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [req.params.id, req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
