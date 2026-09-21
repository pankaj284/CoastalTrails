import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  Calendar,
  Check,
  Clock,
  Compass,
  Footprints,
  Heart,
  MapPin,
  Minus,
  Moon,
  Plus,
  Share2,
  ShieldCheck,
  Star,
  Waves,
} from 'lucide-react';
import type { Homestay } from '../types';
import { api } from '../services/api';
import { CoastalMapView } from '../components/CoastalMapView';
import { ColorfulIcon } from '../components/ColorfulIcon';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Reveal } from '../components/ui/Reveal';
import { MagneticButton } from '../components/ui/MagneticButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Rating } from '../components/ui/Rating';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { useLiveRefresh } from '../lib/live';
import { cn } from '../lib/cn';

interface StayDetailPageProps {
  homestay?: Homestay | null;
  onBack?: () => void;
  onBook?: (stay?: Homestay) => void;
  onNavigateRoute?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <div className="flex items-center gap-2 text-tide">
        {icon}
        <span className="overline !text-ink-3">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="overline mb-1.5">{index}</p>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
    </div>
  );
}

function GoodToKnow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tide-glow/15 text-tide">{icon}</div>
      <h4 className="mt-3 text-sm font-semibold text-ink">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

export function StayDetailPage({ homestay: propHomestay, onBack, onBook, onNavigateRoute }: StayDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [homestay, setHomestay] = useState<Homestay | null>(propHomestay || null);
  const [loading, setLoading] = useState<boolean>(!propHomestay);
  const [activeImage, setActiveImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [wishlisted, setWishlisted] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (propHomestay) {
      setHomestay(propHomestay);
      setLoading(false);
      return;
    }
    if (id) {
      setLoading(true);
      api
        .getHomestay(id)
        .then(setHomestay)
        .catch((err) => console.error('Failed to fetch homestay details:', err))
        .finally(() => setLoading(false));
    }
  }, [id, propHomestay]);

  useEffect(() => {
    if (!homestay) return;
    try {
      setWishlisted(JSON.parse(localStorage.getItem('coastal_wishlist') || '[]').includes(homestay.id));
      const search = JSON.parse(localStorage.getItem('gokarna_search_dates') || 'null');
      if (search?.checkIn && search?.checkOut) {
        setCheckIn(search.checkIn);
        setCheckOut(search.checkOut);
      }
    } catch {
      setWishlisted(false);
    }
  }, [homestay]);

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
      .then(setHomestay)
      .catch((err) => console.error('Failed to refresh homestay details:', err));
  }, 20000);

  const handleBack = () => {
    if (onBack) onBack();
    navigate('/');
  };

  const handleRoute = () => {
    if (onNavigateRoute) onNavigateRoute();
    navigate('/trails');
  };

  const handleBook = () => {
    if (!homestay) return;
    try {
      localStorage.setItem(
        'gokarna_booking_draft',
        JSON.stringify({ homestay_id: homestay.id, check_in: checkIn, check_out: checkOut, guests }),
      );
    } catch {
      /* storage unavailable */
    }
    if (onBook) onBook(homestay);
  };

  function toggleWishlist() {
    if (!homestay) return;
    setWishlisted((w) => {
      const next = !w;
      try {
        const list: string[] = JSON.parse(localStorage.getItem('coastal_wishlist') || '[]');
        const updated = next ? [...new Set([...list, homestay.id])] : list.filter((x) => x !== homestay.id);
        localStorage.setItem('coastal_wishlist', JSON.stringify(updated));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  async function shareStay() {
    if (!homestay) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: homestay.title, text: `${homestay.title} — ${homestay.location_display}, Gokarna`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* share cancelled */
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[46vh] min-h-[340px] w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <EmptyState
        icon={<Waves className="h-6 w-6" />}
        overline="Not found"
        title="Sanctuary not found"
        description="The stay you are looking for might have been moved or removed."
        action={{ label: 'Return to Homestays', onClick: () => navigate('/') }}
        className="mx-auto max-w-xl"
      />
    );
  }

  const images = homestay.imageUrls && homestay.imageUrls.length > 0 ? homestay.imageUrls : [FALLBACK_IMAGE];
  const EXTRA_GUEST_CHARGE = 400;
  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const extraGuests = Math.max(0, guests - 2);
  const totalAmount = nights > 0 ? (homestay.price_per_night + extraGuests * EXTRA_GUEST_CHARGE) * nights : null;
  const advance = totalAmount ? Math.round(totalAmount * 0.2) : Math.round(homestay.price_per_night * 0.2);
  const ratingRows = [
    { label: 'Location & shoreline', value: Math.min(5, homestay.rating + 0.05) },
    { label: 'Host hospitality', value: Math.min(5, homestay.rating + 0.1) },
    { label: 'Cleanliness & comfort', value: Math.max(4, Math.min(5, homestay.rating - 0.05)) },
  ];

  return (
    <div className="w-full pb-32 lg:pb-12">
      <div className="relative">
        <div className="relative h-[46vh] max-h-[520px] min-h-[340px] overflow-hidden rounded-3xl border border-line">
          <img src={images[activeImage]} alt={homestay.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/15" />

          <button
            onClick={handleBack}
            className="glass absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-ink transition-transform active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          <div className="absolute right-4 top-4 flex items-center gap-2">
            <div className="glass flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-ink">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span>{homestay.rating}</span>
            </div>
            <button
              onClick={shareStay}
              aria-label="Share this stay"
              className="glass flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-ink transition-transform active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{shared ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={toggleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className="glass flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90"
            >
              <Heart className={cn('h-4 w-4', wishlisted ? 'fill-ember text-ember' : 'text-ink')} />
            </button>
          </div>

          {images.length > 1 ? (
            <div className="glass absolute bottom-5 right-4 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold text-ink">
              {activeImage + 1} / {images.length}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <MapPin className="h-3 w-3 text-tide-glow" />
                {homestay.location_display}
              </span>
              {homestay.is_host_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-tide-glow" />
                  Family host
                </span>
              ) : null}
            </div>
            <h1 className="line-clamp-2 font-display text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {homestay.title}
            </h1>
            <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/75">{homestay.subtitle}</p>
          </div>
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                aria-label={`View photo ${idx + 1} of ${images.length}`}
                className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all ${
                  activeImage === idx ? 'border-tide' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Footprints className="h-4 w-4" />} label="Beach walk" value={`${homestay.walking_minutes_to_beach} min`} />
        <StatTile icon={<BedDouble className="h-4 w-4" />} label="Rooms" value={`${homestay.total_rooms || '—'}`} />
        <StatTile icon={<Star className="h-4 w-4" />} label="Rating" value={`${homestay.rating}★`} />
        <StatTile icon={<ShieldCheck className="h-4 w-4" />} label="Reserve hold" value="20%" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-14">
          <Reveal>
            <section>
              <SectionTitle index="01 · About" title="A quiet Karavali retreat" />
              <p className="max-w-prose text-base font-light leading-relaxed text-ink-2">{homestay.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {homestay.verifiedBadges?.map((badge) => (
                  <Badge key={badge} variant="outline">
                    {badge}
                  </Badge>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <SectionTitle index="02 · Amenities" title="What the home offers" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {homestay.amenities?.map((a) => (
                  <SpotlightCard key={a} className="rounded-2xl border border-line bg-elevated">
                    <div className="flex items-center gap-3 p-3.5">
                      <ColorfulIcon type={a} size="xs" className="shrink-0 rounded-lg" />
                      <span className="text-sm font-semibold text-ink">{a}</span>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <SectionTitle index="03 · Rating" title="Travelers love this stay" />
              <div className="rounded-3xl border border-line bg-elevated p-6 sm:p-8">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                  <div className="text-center sm:text-left">
                    <div className="font-display text-6xl font-semibold text-ember">{homestay.rating}</div>
                    <div className="mt-2 flex justify-center gap-0.5 text-gold sm:justify-start" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(homestay.rating) ? 'fill-current' : 'fill-none opacity-40')} />
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
                      {homestay.reviews_count} verified reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-3">
                    {ratingRows.map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                          {row.label}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-tide to-tide-glow"
                            style={{ width: `${(row.value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-xs text-ink">{row.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <SectionTitle index="04 · Location" title="On the shoreline" />
              <p className="mb-4 max-w-prose text-sm text-ink-2">
                {homestay.walking_minutes_to_beach} min cliff-walk to the beach — satellite view below shows the coves and trailheads.
              </p>
              <div className="overflow-hidden rounded-2xl border border-line">
                <CoastalMapView homestays={[homestay]} selectedStayId={homestay.id} showTrailOverlay={true} height="340px" />
              </div>
              <button
                onClick={handleRoute}
                className="group mt-4 flex w-full items-center justify-between rounded-2xl border border-line bg-gradient-to-r from-paper-2 to-elevated p-5 text-left transition-colors hover:border-tide"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tide text-white transition-transform group-hover:scale-105">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Cliff Trail & Transit Guide</h4>
                    <p className="text-xs text-ink-2">Scooter, auto & ferry routes to every beach</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-tide transition-transform group-hover:translate-x-1">
                  <span>View route</span>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <SectionTitle index="05 · Good to know" title="Before you arrive" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <GoodToKnow icon={<Clock className="h-4 w-4" />} title="Check-in" body="12:00 noon onward with flexible host dispatch via WhatsApp." />
                <GoodToKnow icon={<Moon className="h-4 w-4" />} title="House rules" body="Quiet hours after 10 pm. No outside guests without host consent." />
                <GoodToKnow icon={<Check className="h-4 w-4" />} title="Cancellation" body="Free cancellation up to 48 hours before check-in." />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden lg:block">
          <div className="glass sticky top-24 space-y-4 rounded-3xl p-6">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-3xl font-semibold text-ink">
                ₹{homestay.price_per_night}
                <span className="font-sans text-xs font-normal text-ink-2"> / night</span>
              </div>
              <Rating value={homestay.rating} />
            </div>

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

            <div className="flex items-center justify-between rounded-xl border border-line-2 bg-elevated px-3.5 py-2.5">
              <span className="text-sm font-semibold text-ink">Guests</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  aria-label="Fewer guests"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-tide hover:text-tide"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center font-mono text-sm font-semibold text-ink">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(8, g + 1))}
                  aria-label="More guests"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-tide hover:text-tide"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-line bg-paper-2 p-4 text-xs">
              {totalAmount !== null ? (
                <>
                  <div className="flex justify-between text-ink-2">
                    <span>
                      ₹{homestay.price_per_night} × {nights} night{nights > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono-data font-semibold text-ink">₹{homestay.price_per_night * nights}</span>
                  </div>
                  {extraGuests > 0 ? (
                    <div className="flex justify-between text-ink-2">
                      <span>
                        + ₹{EXTRA_GUEST_CHARGE} × {extraGuests} extra guest{extraGuests > 1 ? 's' : ''} × {nights} night
                        {nights > 1 ? 's' : ''}
                      </span>
                      <span className="font-mono-data font-semibold text-ink">
                        ₹{extraGuests * EXTRA_GUEST_CHARGE * nights}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
                    <span>Total</span>
                    <span className="font-mono-data text-sm">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-tide">
                    <span>Commitment hold (20%)</span>
                    <span className="font-mono-data text-sm">₹{advance}</span>
                  </div>
                  <div className="flex justify-between text-ink-2">
                    <span>Due to host on check-in</span>
                    <span className="font-mono-data text-sm">₹{totalAmount - advance}</span>
                  </div>
                </>
              ) : (
                <p className="text-ink-3">Select dates to see the live total</p>
              )}
              <div className="border-t border-line pt-2 text-[10px] font-medium text-tide">
                Free cancellation up to 48 hours before check-in
              </div>
            </div>

            <MagneticButton className="w-full">
              <Button onClick={handleBook} className="w-full py-4 text-sm font-semibold">
                <Calendar className="h-4 w-4" />
                <span>Initiate 20% Reservation</span>
              </Button>
            </MagneticButton>

            <p className="text-center text-[11px] text-ink-2">Instant host confirmation via WhatsApp</p>
          </div>
        </aside>
      </div>

      <div className="glass fixed inset-x-3 bottom-16 z-chrome flex items-center justify-between gap-3 border border-line p-3 lg:hidden">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1 font-display text-lg font-semibold text-ink">
            ₹{homestay.price_per_night}
            <span className="font-sans text-[10px] font-normal text-ink-2">/ night</span>
          </div>
          <span className="block truncate text-[10px] font-semibold text-tide">
            {checkIn && checkOut
              ? `${new Date(checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · 20% hold ₹${advance}`
              : `20% hold: ₹${advance}`}
          </span>
        </div>
        <Button onClick={handleBook} size="sm" className="shrink-0 gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Reserve</span>
        </Button>
      </div>
    </div>
  );
}
