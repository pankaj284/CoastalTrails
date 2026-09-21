import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { all, get, run } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const ADVANCE_RATE = 0.2;

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function canAccess(req, booking) {
  return booking.user_id === req.user.id || req.user.role === 'admin';
}

function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

// POST /api/payments/:bookingId/initiate
// Creates a Razorpay Order for the 20% advance hold.
router.post('/:bookingId/initiate', requireAuth, async (req, res) => {
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [
      req.params.bookingId,
      req.params.bookingId,
    ]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccess(req, booking)) return res.status(403).json({ error: 'You can only pay for your own booking.' });
    if (booking.payment_status === 'paid') return res.status(409).json({ error: 'This booking is already paid.' });
    if (!['pending_payment', 'awaiting_host'].includes(booking.status)) {
      return res.status(409).json({ error: `This booking cannot be paid (status: ${booking.status}).` });
    }

    const amount = Math.round(Number(booking.total_amount) * ADVANCE_RATE);
    const amountPaise = amount * 100;

    let payment = await get(
      "SELECT * FROM payments WHERE booking_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [booking.id]
    );

    // Reuse an existing Razorpay order if one is still unpaid
    let orderId = payment?.provider_ref ?? null;
    if (!payment || !orderId) {
      const order = await rzp.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: booking.reference_code,
        notes: {
          booking_id: booking.id,
          homestay_id: booking.homestay_id,
          guest: booking.user_name,
        },
      });
      orderId = order.id;
    }

    if (!payment) {
      const paymentId = `pay-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await run(
        `INSERT INTO payments (id, booking_id, amount, method, status, provider, provider_ref)
         VALUES (?, ?, ?, 'razorpay', 'pending', 'razorpay', ?)`,
        [paymentId, booking.id, amount, orderId]
      );
      payment = await get('SELECT * FROM payments WHERE id = ?', [paymentId]);
    } else if (Number(payment.amount) !== amount) {
      await run('UPDATE payments SET amount = ? WHERE id = ?', [amount, payment.id]);
      payment = await get('SELECT * FROM payments WHERE id = ?', [payment.id]);
    }

    res.status(201).json({
      ...payment,
      order_id: orderId,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount_paise: amountPaise,
      booking_reference: booking.reference_code,
      customer: { name: booking.user_name, phone: booking.user_phone },
    });
  } catch (err) {
    console.error('Razorpay initiate error:', err?.error?.description || err.message);
    res.status(500).json({ error: 'Could not start the payment. Please try again.' });
  }
});

// POST /api/payments/:bookingId/confirm
// Verifies the Razorpay signature AND the captured payment server-side
// before marking anything paid.
router.post('/:bookingId/confirm', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification fields.' });
    }

    const booking = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [
      req.params.bookingId,
      req.params.bookingId,
    ]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccess(req, booking)) return res.status(403).json({ error: 'You can only pay for your own booking.' });
    if (booking.payment_status === 'paid') return res.status(409).json({ error: 'This booking is already paid.' });

    const payment = await get(
      "SELECT * FROM payments WHERE booking_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [booking.id]
    );
    if (!payment) return res.status(409).json({ error: 'Please start the payment before confirming it.' });

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      await run("UPDATE payments SET status = 'failed' WHERE id = ?", [payment.id]);
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // Independent double-check against Razorpay — never trust the browser alone
    const rzpPayment = await rzp.payments.fetch(razorpay_payment_id);
    if (rzpPayment.status !== 'captured') {
      return res.status(400).json({ error: `Payment is not captured (status: ${rzpPayment.status}).` });
    }
    if (Number(rzpPayment.amount) !== Math.round(Number(payment.amount) * 100)) {
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    await run("UPDATE payments SET status = 'paid', provider_ref = ?, paid_at = NOW() WHERE id = ?", [
      razorpay_payment_id,
      payment.id,
    ]);
    await run(
      `UPDATE bookings
       SET payment_status = 'paid', payment_id = ?, paid_at = NOW(),
           advance_paid = ?, balance_payable_at_property = ?,
           status = CASE WHEN status = 'pending_payment' THEN 'awaiting_host' ELSE status END
       WHERE id = ?`,
      [razorpay_payment_id, payment.amount, Number(booking.total_amount) - Number(payment.amount), booking.id]
    );

    const updated = await get('SELECT * FROM bookings WHERE id = ?', [booking.id]);
    res.json({ booking: updated, payment: { ...payment, status: 'paid', provider_ref: razorpay_payment_id } });
  } catch (err) {
    console.error('Razorpay confirm error:', err?.error?.description || err.message);
    res.status(500).json({ error: 'Could not verify the payment. Please try again.' });
  }
});

// POST /api/payments/:bookingId/fail
// Traveler dismissed the checkout or the gateway declined.
router.post('/:bookingId/fail', requireAuth, async (req, res) => {
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ? OR reference_code = ?', [
      req.params.bookingId,
      req.params.bookingId,
    ]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccess(req, booking)) return res.status(403).json({ error: 'You can only manage your own booking.' });

    await run("UPDATE payments SET status = 'failed' WHERE booking_id = ? AND status = 'pending'", [booking.id]);
    await run("UPDATE bookings SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'", [booking.id]);

    const updated = await get('SELECT * FROM bookings WHERE id = ?', [booking.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Could not update the payment right now.' });
  }
});

// GET /api/payments/:bookingId - payment history for a booking (owner or admin)
router.get('/:bookingId', requireAuth, async (req, res) => {
  try {
    const booking = await get('SELECT id, user_id FROM bookings WHERE id = ? OR reference_code = ?', [
      req.params.bookingId,
      req.params.bookingId,
    ]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!canAccess(req, booking)) return res.status(403).json({ error: 'You can only view your own payments.' });

    const payments = await all('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC', [booking.id]);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
