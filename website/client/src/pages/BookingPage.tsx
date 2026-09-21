import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
  Waves,
} from 'lucide-react';
import type { Booking, Homestay } from '../types';
import { api } from '../services/api';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { MagneticButton } from '../components/ui/MagneticButton';
import { Input, Field } from '../components/ui/Input';
import { cn } from '../lib/cn';
import { easeOut, springFast } from '../lib/motion';
import { useLiveRefresh } from '../lib/live';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';
const EXTRA_GUEST_CHARGE = 400;

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const dur = 450;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>₹{display.toLocaleString('en-IN')}</span>;
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [homestay, setHomestay] = useState<Homestay | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .getHomestay(id)
      .then((data) => {
        if (!cancelled) setHomestay(data);
      })
      .catch((err) => console.error('Failed to load stay for booking:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem('gokarna_booking_draft') || 'null');
      if (draft && draft.homestay_id === id) {
        if (draft.check_in) setCheckIn(draft.check_in);
        if (draft.check_out) setCheckOut(draft.check_out);
        if (draft.guests) setGuests(draft.guests);
        return;
      }
      const search = JSON.parse(localStorage.getItem('gokarna_search_dates') || 'null');
      if (search?.checkIn && search?.checkOut) {
        setCheckIn(search.checkIn);
        setCheckOut(search.checkOut);
      }
    } catch {
      /* storage unavailable */
    }
  }, [id]);

  const [stayAvailability, setStayAvailability] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!homestay) return;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const from = t.toISOString().split('T')[0];
    const toD = new Date(t);
    toD.setDate(toD.getDate() + 120);
    api
      .getHomestayAvailability(homestay.id, from, toD.toISOString().split('T')[0])
      .then(setStayAvailability)
      .catch((err) => console.error('Failed to load stay availability:', err));
  }, [homestay]);

  useLiveRefresh(() => {
    if (!id) return;
    api
      .getHomestay(id)
      .then((data) => setHomestay(data))
      .catch((err) => console.error('Failed to refresh stay for booking:', err));
  }, 20000);

  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const extraGuests = Math.max(0, guests - 2);
  const roomTotal = nights * (homestay?.price_per_night ?? 0);
  const extraTotal = extraGuests * EXTRA_GUEST_CHARGE * nights;
  const totalAmount = roomTotal + extraTotal;
  const advance = Math.round(totalAmount * 0.2);
  const hasDateConflict = !!homestay?.blockedDates?.some((d) => d >= checkIn && d < checkOut);

  function next() {
    if (step === 0 && (!checkIn || !checkOut)) {
      setError('Pick your check-in and check-out dates.');
      return;
    }
    if (step === 0 && hasDateConflict) {
      setError('Those dates are locked for this stay. Choose alternate dates.');
      return;
    }
    if (step === 1 && (!name.trim() || phone.trim().length < 7)) {
      setError('Add your name and a valid WhatsApp number.');
      return;
    }
    setError(null);
    setDir(1);
    setStep((s) => Math.min(2, s + 1));
  }

  function back() {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    if (!homestay) return;
    setError(null);
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        homestay_id: homestay.id,
        user_name: name.trim(),
        user_phone: phone.trim(),
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
      });
      setConfirmed(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm the hold.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <EmptyState
        icon={<Waves className="h-6 w-6" />}
        overline="Not found"
        title="Stay not found"
        description="We couldn't load this stay for booking."
        action={{ label: 'Back to homestays', onClick: () => navigate('/') }}
        className="mx-auto max-w-xl"
      />
    );
  }

  const images = homestay.imageUrls && homestay.imageUrls.length > 0 ? homestay.imageUrls : [FALLBACK_IMAGE];

  return (
    <div className="mx-auto w-full max-w-5xl pb-16">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink-2 transition-colors hover:text-tide"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <AnimatePresence mode="wait">
        {confirmed ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="mx-auto max-w-lg space-y-6 text-center"
          >
            <div className="mx-auto w-fit">
              <motion.svg viewBox="0 0 52 52" className="h-20 w-20">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="var(--c-ok)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.path
                  d="M14 27 L22 35 L38 17"
                  fill="none"
                  stroke="var(--c-ok)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.55, ease: 'easeOut' }}
                />
              </motion.svg>
            </div>

            <div className="space-y-2">
              <p className="overline">Hold secured</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Your dates are locked</h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mx-auto w-fit rounded-xl border border-line bg-elevated px-4 py-2 font-mono-data text-lg font-semibold text-ink"
              >
                {confirmed.reference_code}
              </motion.div>
              <p className="text-sm text-ink-2">
                {confirmed.check_in} → {confirmed.check_out} · {guests} guest{guests > 1 ? 's' : ''} · {nights} night{nights > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-end justify-center gap-0.5" aria-hidden="true">
              {[8, 14, 20, 26, 20, 14, 8].map((h, i) => (
                <motion.span
                  key={i}
                  initial={{ height: 4, opacity: 0 }}
                  animate={{ height: h, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
                  className="w-1 rounded-full bg-tide-glow"
                />
              ))}
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => navigate(`/reservation/${confirmed.reference_code}`)}>View reservation</Button>
              {confirmed.whatsapp_link ? (
                <a
                  href={confirmed.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ok px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ok/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Coordinate arrival
                </a>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]"
          >
            <div className="min-w-0">
              <div className="relative h-64 overflow-hidden rounded-3xl border border-line sm:h-80">
                <img src={images[0]} alt={homestay.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="dot">{homestay.location_display}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      {homestay.rating}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{homestay.title}</h1>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-line bg-elevated p-5">
                  <p className="overline mb-3">What you're securing</p>
                  <ul className="space-y-2.5 text-sm text-ink-2">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-tide" />
                      Dates locked in the database the moment you pay
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-tide" />
                      Free cancellation up to 48 hours before check-in
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-tide" />
                      ₹0 convenience fee — direct fair-host model
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-tide" />
                      Concierge coordinates your arrival after booking
                    </li>
                  </ul>
                </div>
                <p className="flex items-center gap-2 text-xs text-ink-3">
                  <ShieldCheck className="h-4 w-4 text-tide" />
                  20% online hold · 80% payable at the property on arrival
                </p>
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-line bg-elevated p-6">
              <div className="mb-6 flex items-center justify-between">
                <p className="overline">Secure your stay</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Step {step + 1} of 3
                </span>
              </div>

              <div className="mb-6 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-2">
                    <motion.div
                      className="h-full rounded-full bg-tide"
                      animate={{ width: i < step ? '100%' : i === step ? '60%' : '0%' }}
                      transition={springFast}
                    />
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  {step === 0 ? (
                    <div className="space-y-5">
                      <DateRangePicker
                        checkIn={checkIn}
                        checkOut={checkOut}
                        availability={stayAvailability}
                        fewLeftThreshold={0}
                        onChange={(ci, co) => {
                          setCheckIn(ci);
                          setCheckOut(co);
                        }}
                      />

                      <div className="flex items-center justify-between rounded-xl border border-line-2 bg-paper-2 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <Users className="h-4 w-4 text-tide" />
                          Guests
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            aria-label="Fewer guests"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-tide hover:text-tide active:scale-90"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={guests}
                              initial={{ scale: 1.35, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={springFast}
                              className="w-6 text-center font-mono text-base font-semibold text-ink"
                            >
                              {guests}
                            </motion.span>
                          </AnimatePresence>
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.min(8, g + 1))}
                            aria-label="More guests"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-tide hover:text-tide active:scale-90"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {error ? (
                        <p className="flex items-center gap-2 text-xs font-semibold text-err">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </p>
                      ) : null}
                    </div>
                  ) : step === 1 ? (
                    <div className="space-y-4">
                      <Field label="Guest full name">
                        <Input placeholder="e.g. Maya Varma" value={name} onChange={(e) => setName(e.target.value)} />
                      </Field>
                      <Field label="WhatsApp contact">
                        <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </Field>
                      {error ? (
                        <p className="flex items-center gap-2 text-xs font-semibold text-err">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2 rounded-2xl border border-line bg-paper-2 p-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Dates</span>
                          <span className="font-mono-data font-semibold text-ink">
                            {checkIn} → {checkOut}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Guests</span>
                          <span className="font-mono-data font-semibold text-ink">{guests}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Nights</span>
                          <span className="font-mono-data font-semibold text-ink">{nights}</span>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl border border-line bg-paper-2 p-4 text-xs">
                        <div className="flex justify-between text-ink-2">
                          <span>
                            ₹{homestay.price_per_night} × {nights} night{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-mono-data font-semibold text-ink">₹{roomTotal}</span>
                        </div>
                        {extraGuests > 0 ? (
                          <div className="flex justify-between text-ink-2">
                            <span>
                              + ₹{EXTRA_GUEST_CHARGE} × {extraGuests} extra guest{extraGuests > 1 ? 's' : ''} × {nights}
                            </span>
                            <span className="font-mono-data font-semibold text-ink">₹{extraTotal}</span>
                          </div>
                        ) : null}
                        <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                          <span className="font-semibold text-ink">Total</span>
                          <span className="font-display text-2xl font-semibold text-ink">
                            <CountUp value={totalAmount} />
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold text-tide">
                          <span>20% hold due now</span>
                          <span className="font-mono-data text-sm">
                            <CountUp value={advance} />
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Balance at property</span>
                          <span className="font-mono-data text-sm">₹{totalAmount - advance}</span>
                        </div>
                      </div>

                      {error ? (
                        <p className="flex items-center gap-2 text-xs font-semibold text-err">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {error}
                        </p>
                      ) : null}

                      <MagneticButton className="w-full">
                        <Button onClick={submit} disabled={submitting} className="w-full py-4 text-sm font-semibold">
                          {submitting ? 'Locking your dates…' : `Pay ₹${advance} & lock`}
                        </Button>
                      </MagneticButton>
                      <p className="text-center text-[11px] text-ink-3">Secured hold · free cancellation within 48 h</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {step < 2 ? (
                <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
                      step === 0 ? 'cursor-not-allowed text-ink-3/50' : 'text-ink-2 hover:text-ink',
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <Button onClick={next} size="sm" className="gap-1.5">
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
