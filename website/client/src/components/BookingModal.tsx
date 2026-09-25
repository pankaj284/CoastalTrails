import React, { useState } from 'react';
import { X, Calendar, User, Phone, CheckCircle, MessageCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Homestay, Booking } from '../types';
import { api } from '../services/api';

interface BookingModalProps {
  homestay: Homestay;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ homestay, onClose, onSuccess }) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const nights = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 1;

  const totalAmount = homestay.price_per_night * nights;
  const advanceDeposit = Math.round(totalAmount * 0.20);
  const balanceAtCheckIn = totalAmount - advanceDeposit;

  const hasDateConflict = homestay.blockedDates?.some(d => d >= checkIn && d < checkOut);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) {
      setError('Please provide your name and WhatsApp contact number.');
      return;
    }
    if (diffTime <= 0) {
      setError('Check-out date must follow check-in date.');
      return;
    }
    if (hasDateConflict) {
      setError('Selected dates are locked in the database. Please pick alternate dates.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const booking = await api.createBooking({
        homestay_id: homestay.id,
        user_name: userName,
        user_phone: userPhone,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
      });

      setConfirmedBooking(booking);
      onSuccess(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm reservation hold');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Coastal Trails Reservation</span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white">{homestay.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Success View */
          <div className="p-5 sm:p-6 text-center space-y-4 overflow-y-auto flex-1">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto border border-teal-200">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h4 className="font-serif text-2xl font-bold text-coastal-navy">Dates Committed & Locked</h4>
            <p className="text-xs text-coastal-slate">
              Booking Ref: <span className="font-mono font-bold text-coastal-navy bg-coastal-sand px-2 py-0.5 rounded border border-coastal-stone">{confirmedBooking.reference_code}</span>
            </p>

            <div className="p-4 bg-coastal-sand rounded-2xl text-left text-xs space-y-2 border border-coastal-stone/60">
              <div className="flex justify-between">
                <span className="text-coastal-slate">Host</span>
                <span className="font-semibold text-coastal-navy">{homestay.host_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-slate">Dates</span>
                <span className="font-semibold text-coastal-navy">{confirmedBooking.check_in} → {confirmedBooking.check_out} ({nights} nights)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coastal-slate">20% Online Hold Paid</span>
                <span className="font-bold text-coastal-teal">₹{confirmedBooking.advance_paid}</span>
              </div>
              <div className="flex justify-between border-t border-coastal-stone/60 pt-2 font-bold">
                <span className="text-coastal-navy">80% Payable at Property</span>
                <span className="font-serif text-sm text-coastal-navy">₹{confirmedBooking.balance_payable_at_property}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Your dates are secured. Your host has been notified via WhatsApp for arrival coordination.</span>
            </div>

            {confirmedBooking.whatsapp_link && (
              <a
                href={confirmedBooking.whatsapp_link}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#20bd5a] transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Notify Host on WhatsApp</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-coastal-slate hover:text-coastal-navy"
            >
              Close / Return to Stays
            </button>
          </div>
        ) : (
          /* Reservation Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-coastal-navy mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-coastal-terracotta" />
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-coastal-stone focus:outline-none focus:border-coastal-navy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coastal-navy mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-coastal-terracotta" />
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-coastal-stone focus:outline-none focus:border-coastal-navy"
                  required
                />
              </div>
            </div>

            {hasDateConflict && (
              <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ⚠️ Dates selected are unavailable for this homestay in the database.
              </p>
            )}

            {/* Guest Details */}
            <div>
              <label className="block text-xs font-bold text-coastal-navy mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-coastal-terracotta" />
                Guest Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Maya Varma / Angela"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-coastal-stone focus:outline-none focus:border-coastal-navy"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-coastal-navy mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-coastal-terracotta" />
                  WhatsApp Contact
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-coastal-stone focus:outline-none focus:border-coastal-navy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coastal-navy mb-1">Guests</label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-coastal-stone focus:outline-none focus:border-coastal-navy"
                >
                  <option value={1}>1 Traveler</option>
                  <option value={2}>2 Travelers</option>
                  <option value={3}>3 Travelers</option>
                  <option value={4}>4 Travelers</option>
                </select>
              </div>
            </div>

            {/* Tariff Breakdown */}
            <div className="p-4 bg-coastal-sand rounded-2xl border border-coastal-stone/80 text-xs space-y-2">
              <div className="flex justify-between text-coastal-slate">
                <span>₹{homestay.price_per_night} × {nights} night(s)</span>
                <span className="font-semibold text-coastal-navy">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-coastal-teal font-semibold">
                <span>20% Online Commitment Hold</span>
                <span className="font-serif font-bold text-sm">₹{advanceDeposit}</span>
              </div>
              <div className="flex justify-between text-coastal-slate text-[11px] pt-1.5 border-t border-coastal-stone/60">
                <span>80% Balance payable to host on arrival</span>
                <span>₹{balanceAtCheckIn}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading || hasDateConflict}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all ${
                loading || hasDateConflict
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-coastal-terracotta hover:bg-coastal-terracottaHover shadow-coastal-terracotta/20 active:scale-[0.99]'
              }`}
            >
              {loading ? 'Locking in Database...' : `Pay ₹${advanceDeposit} & Lock Sanctuary`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
