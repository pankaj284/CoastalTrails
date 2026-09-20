import express from 'express';
import { all, get, run } from '../db/index.js';

const router = express.Router();

// Helper to generate readable Gokarna booking reference like GK-839201
function generateRefCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `GK-${num}`;
}

// GET /api/bookings - List all bookings
router.get('/', async (req, res) => {
  try {
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

    const homestay = await get('SELECT * FROM homestays WHERE id = ?', [homestay_id]);
    if (!homestay) {
      return res.status(404).json({ error: 'Homestay does not exist' });
    }

    // Check date availability
    const blockedDates = await all(
      'SELECT blocked_date FROM room_unavailability WHERE homestay_id = ? AND blocked_date >= ? AND blocked_date < ?',
      [homestay_id, check_in, check_out]
    );

    if (blockedDates.length > 0) {
      return res.status(409).json({
        error: 'Property is not available for the selected dates',
        conflicts: blockedDates.map(b => b.blocked_date)
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
    const hold_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins hold

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

    // Block the dates in room_unavailability
    const cur = new Date(start);
    while (cur < end) {
      const dateStr = cur.toISOString().split('T')[0];
      await run('INSERT OR IGNORE INTO room_unavailability (homestay_id, blocked_date, reason) VALUES (?, ?, ?)', [
        homestay_id,
        dateStr,
        `booking:${reference_code}`
      ]);
      cur.setDate(cur.getDate() + 1);
    }

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

    // If declined or cancelled, release blocked dates
    if (status === 'declined' || status === 'cancelled') {
      const booking = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [req.params.id, req.params.id]);
      if (booking) {
        await run('DELETE FROM room_unavailability WHERE homestay_id = ? AND reason = ?', [
          booking.homestay_id,
          `booking:${booking.reference_code}`
        ]);
      }
    }

    const updated = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [req.params.id, req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
