import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Phone,
  MapPin,
  Star,
  MessageCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  User as UserIcon,
  CircleAlert,
  CreditCard,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Homestay, Booking, User } from '../types';
import { api } from '../services/api';
import { ColorfulIcon } from '../components/ColorfulIcon';

interface ReservationPageProps {
  homestays: Homestay[];
  currentUser: User | null;
  onAuthSuccess: (user: User) => void;
  onOpenAuthModal?: (mode?: 'signin' | 'register') => void;
}

export const ReservationPage: React.FC<ReservationPageProps> = ({
  homestays,
  currentUser,
  onAuthSuccess,
  onOpenAuthModal,
}) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Find targeted stay or default to first available
  const selectedStayId = id || searchParams.get('stayId') || (homestays.length > 0 ? homestays[0].id : '');
  const [activeStay, setActiveStay] = useState<Homestay | null>(null);
  const [isChangingStay, setIsChangingStay] = useState(false);

  // Booking Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(searchParams.get('checkIn') || todayStr);
  const [checkOut, setCheckOut] = useState<string>(searchParams.get('checkOut') || tomorrowStr);
  const [guestsCount, setGuestsCount] = useState<number>(Number(searchParams.get('guests')) || 2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // In-Page Auth Gate State (for unauthenticated users)
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load target homestay
  useEffect(() => {
    if (selectedStayId) {
      const found = homestays.find((s) => s.id === selectedStayId);
      if (found) {
        setActiveStay(found);
      } else {
        api.getHomestay(selectedStayId)
          .then((data) => setActiveStay(data))
          .catch((err) => console.error('Failed to load stay for reservation:', err));
      }
    } else if (homestays.length > 0) {
      setActiveStay(homestays[0]);
    }
  }, [selectedStayId, homestays]);

  // Calculate Nights
  const calculateNights = (): number => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const pricePerNight = activeStay?.price_per_night || 2400;
  const totalAmount = pricePerNight * nights;
  const advanceDeposit = Math.round(totalAmount * 0.20);
  const balanceAtProperty = totalAmount - advanceDeposit;

  // Handle Quick In-Page Authentication
  const handleInPageAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authIdentifier.trim()) {
      setAuthError('Please enter your WhatsApp mobile number or email.');
      return;
    }
    if (authTab === 'register' && !authName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!authPassword || authPassword.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      const user: User = {
        id: 'usr_' + Date.now().toString(36),
        name: authTab === 'register' ? authName.trim() : (authName.trim() || authIdentifier.split('@')[0] || 'Traveler'),
        phone: authIdentifier.includes('@') ? '+91 98765 43210' : authIdentifier.trim(),
        email: authIdentifier.includes('@') ? authIdentifier.trim() : undefined,
      };
      localStorage.setItem('gokarna_traveler_user', JSON.stringify(user));
      onAuthSuccess(user);
    }, 500);
  };

  // Demo Traveler 1-Click Login
  const handleDemoSignIn = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      const demoUser: User = {
        id: 'usr_punit',
        name: 'Punit Naik',
        phone: '+91 98765 43210',
        email: 'punit@coastaltrails.in',
      };
      localStorage.setItem('gokarna_traveler_user', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
    }, 300);
  };

  // Handle Confirm Booking
  const handleConfirmReservation = async () => {
    if (!currentUser) {
      setAuthError('Please sign in or register to complete your reservation hold.');
      return;
    }
    if (!activeStay) {
      setBookingError('No homestay selected.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const newBooking = await api.createBooking({
        homestay_id: activeStay.id,
        user_name: currentUser.name,
        user_phone: currentUser.phone,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
      });

      // Prepare WhatsApp message for local host
      const hostPhone = activeStay.host_whatsapp ? activeStay.host_whatsapp.replace(/\D/g, '') : '919845123091';
      const messageText = `Namaste ${activeStay.host_name}! I have initiated a 20% hold reservation for ${activeStay.title} via Gokarna Connect. Reference: ${newBooking.reference_code}, Check-in: ${checkIn}, Check-out: ${checkOut}, Guests: ${guestsCount}. Looking forward to my stay!`;
      const waUrl = `https://wa.me/${hostPhone}?text=${encodeURIComponent(messageText)}`;

      // Save recent refCode
      localStorage.setItem('gokarna_recent_ref', newBooking.reference_code);

      // Open WhatsApp in separate window if desired, then navigate to reservation tracking
      window.open(waUrl, '_blank');
      navigate(`/reservation/${newBooking.reference_code}`);
    } catch (err: any) {
      console.error('Reservation failed:', err);
      setBookingError(err.message || 'Failed to complete reservation. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (activeStay ? navigate(`/stay/${activeStay.id}`) : navigate('/'))}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span>Return to {activeStay ? activeStay.title : 'Homestays'}</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
          <ShieldCheck size={14} strokeWidth={2} className="text-emerald-600" />
          <span>Regulated 20% Direct Hold</span>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
          Confirm Your Coastal Sanctuary
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-light mt-1 max-w-2xl">
          Lock your dates with an official 20% regulatory hold. The remaining 80% is payable directly to your verified local host upon check-in via cash or UPI.
        </p>
      </div>

      {/* 2. Main Two-Column Reservation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: Sanctuary Picker, Dates, Guests & Auth Verification */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Selected Homestay Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-mono">
                Selected Sanctuary
              </span>
              <button
                type="button"
                onClick={() => setIsChangingStay((prev) => !prev)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{isChangingStay ? 'Done Choosing' : 'Switch Sanctuary'}</span>
                <ChevronDown size={14} className={`transition-transform ${isChangingStay ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Stay Selector when toggled */}
            {isChangingStay && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-56 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Choose another Karavali homestay:
                </span>
                {homestays.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveStay(s);
                      setIsChangingStay(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between border transition-all ${
                      s.id === activeStay?.id
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold truncate">{s.title}</div>
                      <div className="text-[10px] text-slate-500">{s.location_display} • ₹{s.price_per_night}/night</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 shrink-0">
                      ₹{Math.round(s.price_per_night * 0.2)} hold
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Active Stay Preview Card */}
            {activeStay && (
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={activeStay.imageUrls[0]}
                    alt={activeStay.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={12} className="text-sky-600 shrink-0" />
                    <span className="truncate">{activeStay.location_display}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      <Star size={11} fill="currentColor" />
                      {activeStay.rating}
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
                    {activeStay.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Care of Host: <strong>{activeStay.host_name}</strong>
                  </p>
                  <div className="mt-2 text-xs">
                    <span className="font-bold text-slate-900">₹{activeStay.price_per_night}</span>
                    <span className="text-slate-500 text-[11px]"> / night</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card B: Reservation Details (Dates, Nights, Guests) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Trip Schedule & Guests
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-in Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-600" />
                  <span>Check-In Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-sky-600" />
                  <span>Check-Out Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={checkIn || todayStr}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Stay Duration & Guest Counter Row */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-700 bg-sky-50/70 px-3 py-1.5 rounded-xl border border-sky-200/80">
                <Clock size={13} className="text-sky-600" />
                <span>{nights} {nights === 1 ? 'Night' : 'Nights'} Duration</span>
              </div>

              {/* Guest Controls */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-sky-600" />
                  <span>Guests:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold px-1.5 text-slate-900">{guestsCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestsCount((prev) => Math.min(8, prev + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Special Request / Estimated Arrival */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Arrival Time or Special Requests (Optional)
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Arriving via morning train at Gokarna Road station, requesting late check-in..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Card C: MANDATORY TRAVELER AUTHENTICATION GATE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock size={16} strokeWidth={2} className={currentUser ? 'text-emerald-600' : 'text-amber-600'} />
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Traveler Account Verification
                </h3>
              </div>
              {currentUser ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  <span>Verified & Active</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  Authentication Required
                </span>
              )}
            </div>

            {/* Case 1: USER IS ALREADY LOGGED IN */}
            {currentUser ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center font-serif text-sm shrink-0">
                      {currentUser.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {currentUser.phone} {currentUser.email && `• ${currentUser.email}`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('gokarna_traveler_user');
                      window.location.reload();
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium shrink-0 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>Your verified contact details will be shared directly with {activeStay?.host_name || 'the host'} for WhatsApp arrival dispatch.</span>
                </div>
              </div>
            ) : (
              /* Case 2: USER MUST SIGN IN OR REGISTER TO CONTINUE */
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CircleAlert size={14} className="text-amber-700 shrink-0" />
                    <span>Traveler Login Required to Reserve</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-light leading-relaxed">
                    To safeguard local families and prevent phantom bookings, Gokarna Connect requires all travelers to sign in or register before confirming a reservation.
                  </p>
                </div>

                {/* In-Page Auth Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setAuthTab('signin')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* In-Page Auth Form */}
                <form onSubmit={handleInPageAuth} className="space-y-3">
                  {authTab === 'register' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Aditi Rao"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      WhatsApp Mobile Number or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={authIdentifier}
                      onChange={(e) => setAuthIdentifier(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or traveler@domain.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter at least 4 characters"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {authError}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserIcon size={14} />
                      <span>{isAuthenticating ? 'Verifying...' : authTab === 'signin' ? 'Sign In & Unlock' : 'Register & Unlock'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDemoSignIn}
                      disabled={isAuthenticating}
                      className="px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl border border-sky-200 transition-all cursor-pointer whitespace-nowrap"
                      title="Instant demo sign-in for testing"
                    >
                      1-Click Demo Login
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 20% Regulatory Hold Breakdown & Direct Host Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Reservation Summary
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Transparent 20% Hold • Karavali Direct Tariff
              </p>
            </div>

            {/* Pricing Ledger */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>₹{pricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <span className="font-mono font-bold text-slate-900">₹{totalAmount}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Direct Host Connection Fee</span>
                <span className="text-emerald-700 font-bold">₹0 (Free)</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Platform Commission</span>
                <span className="text-emerald-700 font-bold">₹0 (Direct)</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-sm text-slate-900">
                <span>Total Stay Tariff</span>
                <span className="font-serif text-base">₹{totalAmount}</span>
              </div>
            </div>

            {/* 20% Hold Highlight Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck size={15} strokeWidth={2.5} className="text-emerald-600" />
                  <span>20% Regulatory Advance Hold</span>
                </span>
                <span className="font-serif text-base font-bold text-emerald-900">
                  ₹{advanceDeposit}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-light leading-relaxed">
                Paid today to secure and lock your room directly with the local host.
              </p>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-950">
                <span>80% Balance at Check-in</span>
                <span className="font-mono font-bold">₹{balanceAtProperty}</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                Pay directly to {activeStay?.host_name || 'your host'} upon arrival via Cash or UPI.
              </div>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CircleAlert size={14} className="shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Primary Action Button */}
            {currentUser ? (
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting || !activeStay}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>{isSubmitting ? 'Securing 20% Hold...' : `Confirm 20% Hold • ₹${advanceDeposit}`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) input.focus();
                }}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={16} strokeWidth={2} />
                <span>Sign In Above to Complete Reservation</span>
              </button>
            )}

            {/* Trust & Guarantee Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} strokeWidth={2} className="text-emerald-600 shrink-0" />
                <span>Free cancellation up to 48 hours before check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={13} strokeWidth={2} className="text-emerald-600 shrink-0" />
                <span>Instant confirmation voucher & WhatsApp contact with host</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} strokeWidth={2} className="text-emerald-600 shrink-0" />
                <span>Verified Gokarna local syndicate pricing guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
