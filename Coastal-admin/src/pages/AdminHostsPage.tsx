import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { api, type HostRow } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Reveal } from '../components/ui/Reveal';
import { useLiveRefresh } from '../lib/live';
import { cn } from '../lib/cn';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function AdminHostsPage() {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HostRow | null>(null);

  useEffect(() => {
    api
      .getHosts()
      .then(setHosts)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useLiveRefresh(() => {
    api
      .getHosts()
      .then((list) => {
        setHosts(list);
        setSelected((prev) => (prev ? list.find((h) => h.host_whatsapp === prev.host_whatsapp) ?? prev : prev));
      })
      .catch((err) => console.error(err));
  }, 20000);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="w-full space-y-8">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-2 transition-colors hover:text-tide"
        >
          <Icon icon="lucide:arrow-left" className="h-4 w-4" />
          Back to all hosts
        </button>

        <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-line bg-elevated p-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-tide to-tide-2 font-display text-2xl font-semibold text-white">
            {selected.host_name[0]}
          </span>
          <div className="min-w-0">
            <p className="overline">Host profile</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{selected.host_name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
              <Icon icon="lucide:phone" className="h-3 w-3 text-tide" />
              {selected.host_whatsapp}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="dot">
              {selected.stay_count} stay{selected.stay_count === 1 ? '' : 's'}
            </Badge>
            <Badge variant="outline">{selected.rooms} rooms</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <p className="overline">Their stays</p>
          {(selected.stays || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-2 bg-paper-2 p-8 text-center text-sm text-ink-2">
              No stays listed under this host yet.
            </div>
          ) : (
            selected.stays!.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-elevated p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line">
                  <img src={s.imageUrls[0]} alt={s.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold text-ink">{s.title}</h3>
                  <p className="truncate text-xs text-ink-2">
                    {s.location_display} · ★ {s.rating} · {s.total_rooms} rooms · {s.walking_minutes_to_beach} min to beach
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="dot">
                      {s.bookingsCount ?? 0} booking{(s.bookingsCount ?? 0) === 1 ? '' : 's'}
                    </Badge>
                    <Badge variant="warm">{s.blockedDates.length} blocked</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/stays/${s.id}/rooms`)}
                    className="gap-1.5"
                  >
                    <Icon icon="lucide:layout-grid" className="h-3.5 w-3.5" />
                    Rooms
                  </Button>
                  <span className="font-mono-data text-sm font-semibold text-ink">₹{s.price_per_night}</span>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/stays/${s.id}/edit`)} className="gap-1.5">
                    <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="overline">Host network</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Hosts</h1>
          <p className="mt-2 text-sm text-ink-2">
            {hosts.length} host{hosts.length === 1 ? '' : 's'} stewarding stays on the network — tap one for their full profile.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Icon icon="lucide:search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Search host or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-line-2 bg-elevated pl-10 pr-4 text-ink placeholder:text-ink-3 transition-colors focus:border-tide focus:outline-none focus:ring-2 focus:ring-tide/30"
          />
        </div>
      </div>

      {(() => {
        const list = query.trim() ? hosts.filter((h) => h.host_name.toLowerCase().includes(query.trim().toLowerCase())) : hosts;
        if (list.length === 0) {
          return (
            <div className="rounded-2xl border border-dashed border-line-2 bg-paper-2 p-12 text-center">
              <Icon icon="lucide:search" className="mx-auto h-6 w-6 text-ink-3" />
              <p className="mt-3 text-sm font-semibold text-ink">No hosts match "{query}"</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((h, i) => {
              const featured = i === 0 && list.length > 1;
              const imgs = (h.stays || []).slice(0, 3).map((s) => s.imageUrls[0]).filter(Boolean);
              return (
                <Reveal key={h.host_whatsapp} delay={i * 0.05} className={cn(featured && 'md:col-span-2')}>
                  <SpotlightCard className="group h-full overflow-hidden rounded-2xl border border-line bg-elevated transition-all duration-300 hover:-translate-y-0.5 hover:border-tide/40 hover:shadow-[0_18px_44px_-18px_rgba(14,165,164,0.4)]">
                    <button
                      type="button"
                      onClick={() => setSelected(h)}
                      className="flex h-full w-full items-center gap-4 p-5 text-left"
                    >
                      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-tide via-tide-glow to-ink font-display text-xl font-semibold text-white ring-2 ring-tide/30 ring-offset-2 ring-offset-elevated">
                        {h.host_name[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn('truncate font-display font-semibold text-ink', featured ? 'text-lg' : 'text-base')}>
                            {h.host_name}
                          </span>
                          {featured && <Badge variant="solid">Top host</Badge>}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                          <Icon icon="lucide:phone" className="h-3 w-3 text-tide" />
                          {h.host_whatsapp}
                        </span>
                        <span className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-mono text-[11px] text-ink-2">
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:waves" className="h-3 w-3 text-tide" />
                            <span className="font-semibold text-ink">{h.stay_count}</span> stay{h.stay_count === 1 ? '' : 's'}
                          </span>
                          <span>
                            <span className="font-semibold text-ink">{h.rooms}</span> rooms
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:calendar-days" className="h-3 w-3 text-ember" />
                            <span className="font-semibold text-ink">{h.upcoming ?? 0}</span> upcoming
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Icon icon="lucide:indian-rupee" className="h-3 w-3 text-ok" />
                            <span className="font-semibold text-ink">{fmt(h.holdsPaid ?? 0)}</span> held
                          </span>
                        </span>
                      </span>
                      {imgs.length > 0 && (
                        <span className="hidden shrink-0 -space-x-3 sm:flex">
                          {imgs.map((u, j) => (
                            <span key={j} className="h-11 w-11 overflow-hidden rounded-xl border-2 border-elevated shadow-md">
                              <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
                            </span>
                          ))}
                        </span>
                      )}
                      <Icon icon="lucide:waves" className="h-4 w-4 shrink-0 text-tide-glow transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
