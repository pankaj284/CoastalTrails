import React, { useState, useEffect } from 'react';
import { CalendarCheck, Phone, CheckCircle, RefreshCw, XCircle, Clock, ShieldCheck, Waves } from 'lucide-react';
import { Booking } from '../types';
import { api } from '../services/api';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateBookingStatus(id, status);
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-coastal-terracotta uppercase tracking-wider">Live Reservations Feed</span>
          <h1 className="font-serif text-3xl font-bold text-coastal-navy mt-1">Coastal Trails Reservations</h1>
          <p className="text-xs text-coastal-slate mt-1">
            Real-time guest reservations and arrival coordination
          </p>
        </div>
        <button
          onClick={loadBookings}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-white text-coastal-navy border border-coastal-stone hover:bg-coastal-sand rounded-xl text-xs font-semibold transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reservations</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-coastal-slate text-xs">Querying reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-coastal-stone shadow-sm space-y-3">
          <CalendarCheck className="w-12 h-12 text-coastal-slate/40 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-coastal-navy">No reservations recorded yet</h3>
          <p className="text-xs text-coastal-slate">Head to Curated Stays and place a 20% hold reservation to see it reflected here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-coastal-stone/80 shadow-sm hover:shadow-md transition-all space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-coastal-stone/60">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-coastal-sand text-coastal-navy px-2.5 py-1 rounded-lg border border-coastal-stone">
                      {b.reference_code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
                        b.status === 'confirmed'
                          ? 'bg-coastal-tealLight text-coastal-teal'
                          : b.status === 'declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status === 'confirmed'
                        ? 'Confirmed & Locked'
                        : b.status === 'declined'
                        ? 'Declined by Host'
                        : 'Awaiting Host WhatsApp Approval'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-coastal-navy mt-2">{b.homestay_title}</h3>
                  <p className="text-xs text-coastal-slate">{b.location_display} • Host: {b.host_name}</p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-serif text-2xl font-bold text-coastal-navy">₹{b.total_amount}</div>
                  <div className="text-xs text-coastal-teal font-medium">20% Hold Paid: ₹{b.advance_paid}</div>
                  <div className="text-[11px] text-coastal-slate">80% on arrival: ₹{b.balance_payable_at_property}</div>
                </div>
              </div>

              {/* Guest & Dates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-coastal-sand p-4 rounded-2xl border border-coastal-stone/60">
                <div>
                  <span className="text-coastal-slate block text-[10px] uppercase font-bold tracking-wider">Primary Guest</span>
                  <span className="font-semibold text-coastal-navy">{b.user_name}</span>
                </div>
                <div>
                  <span className="text-coastal-slate block text-[10px] uppercase font-bold tracking-wider">Mobile</span>
                  <span className="font-mono text-coastal-navy">{b.user_phone}</span>
                </div>
                <div>
                  <span className="text-coastal-slate block text-[10px] uppercase font-bold tracking-wider">Stay Dates</span>
                  <span className="font-mono text-coastal-navy">{b.check_in} → {b.check_out}</span>
                </div>
              </div>

              {/* Action Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-coastal-slate flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Booked on {new Date(b.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {b.status !== 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-coastal-tealLight hover:bg-coastal-teal hover:text-white text-coastal-teal font-bold text-xs rounded-xl transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm Stay</span>
                    </button>
                  )}
                  {b.status !== 'declined' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'declined')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
