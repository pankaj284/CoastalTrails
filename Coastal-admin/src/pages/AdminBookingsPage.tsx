import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { api } from '../services/api';
import type { Booking } from '../types';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { SearchField } from '../components/ui/Input';
import { useLiveRefresh } from '../lib/live';

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .getAllBookings()
      .then(setBookings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useLiveRefresh(() => {
    api
      .getAllBookings()
      .then(setBookings)
      .catch((err) => console.error(err));
  }, 15000);

  const stays = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = b.homestay_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries()).map(([id, list]) => ({
      id,
      title: list[0].homestay_title ?? 'Stay',
      location: list[0].location_display ?? '',
      host: list[0].host_name ?? '',
      image: list[0].stay_image ?? '',
      count: list.length,
      awaiting: list.filter((b) => b.status === 'awaiting_host').length,
      holds: list.reduce((a, b) => a + b.advance_paid, 0),
    }));
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stays;
    return stays.filter((s) => [s.title, s.location, s.host].join(' ').toLowerCase().includes(q));
  }, [stays, query]);

  const summary = useMemo(
    () => ({
      total: bookings.length,
      awaiting: bookings.filter((b) => b.status === 'awaiting_host').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      holds: bookings.reduce((a, b) => a + b.advance_paid, 0),
    }),
    [bookings],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="overline">Network bookings</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">All bookings</h1>
          <p className="mt-2 text-sm text-ink-2">Pick a homestay to open its dedicated bookings page.</p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:items-end">
          <SearchField
            placeholder="Search stay, location, host…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Total', value: String(summary.total) },
              { label: 'Awaiting', value: String(summary.awaiting) },
              { label: 'Confirmed', value: String(summary.confirmed) },
              { label: 'Holds', value: `₹${fmtMoney(summary.holds)}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-elevated px-3.5 py-2 text-center">
                <p className="font-mono-data text-lg font-semibold leading-5 text-ink">{s.value}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-ink-3">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Icon icon="lucide:book-open" className="h-6 w-6" />}
          overline="Quiet for now"
          title="No bookings yet"
          description="Guest holds will appear here as travelers reserve stays."
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-2 bg-paper-2 p-12 text-center">
          <Icon icon="lucide:search" className="mx-auto h-6 w-6 text-ink-3" />
          <p className="mt-3 text-sm font-semibold text-ink">No homestays match "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/bookings/${s.id}`)}
              className="group overflow-hidden rounded-2xl border border-line bg-elevated text-left transition-all hover:-translate-y-0.5 hover:border-tide/50 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-paper-2">
                {s.image ? (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon icon="lucide:waves" className="h-8 w-8 text-ink-3" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 flex items-center gap-1.5 rounded-full bg-elevated/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-ink backdrop-blur">
                  <Icon icon="lucide:book-open" className="h-3 w-3 text-tide" />
                  {s.count} booking{s.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2.5 p-4">
                <div>
                  <h2 className="truncate font-display text-lg font-semibold text-ink group-hover:text-tide">{s.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                    <Icon icon="lucide:map-pin" className="h-3 w-3" />
                    {s.location} · host {s.host}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-2">
                    {s.awaiting > 0 && <Badge variant="solid">{s.awaiting} awaiting</Badge>}
                    <span className="font-mono-data text-sm font-semibold text-gold">₹{fmtMoney(s.holds)}</span>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-ink-3 transition-colors group-hover:text-tide">
                    view bookings
                    <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
