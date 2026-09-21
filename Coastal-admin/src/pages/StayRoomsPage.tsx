import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@iconify/react';
import {
  api,
  type RoomDay,
  type RoomRow,
  type RoomSegment,
  type RoomStatusResponse,
} from '../services/api';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { Dialog } from '../components/ui/Dialog';
import { useLiveRefresh } from '../lib/live';
import { cn } from '../lib/cn';

const ROOM_W = 240;
const COL_W = 64;

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000);
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

const HK_META: Record<RoomRow['housekeeping'], { label: string; icon: string; cls: string }> = {
  clean: { label: 'Clean', icon: 'lucide:sparkles', cls: 'bg-ok/10 text-ok border-ok/30' },
  dirty: { label: 'Dirty', icon: 'lucide:brush', cls: 'bg-ember/10 text-ember border-ember/30' },
  inspecting: { label: 'Inspecting', icon: 'lucide:eye', cls: 'bg-warn/10 text-warn border-warn/30' },
};

const NEXT_HK: Record<RoomRow['housekeeping'], RoomRow['housekeeping']> = {
  clean: 'dirty',
  dirty: 'inspecting',
  inspecting: 'clean',
};

const BLOCK_REASONS = ['Maintenance', 'Private use', 'Channel sync'];

interface DragSel {
  room: number;
  start: string;
  end: string;
}

function Gauge({ pct, live }: { pct: number; live: boolean }) {
  const C = 2 * Math.PI * 40;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
        <circle cx="48" cy="48" r="40" fill="none" stroke="var(--c-line)" strokeWidth="9" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="url(#pmsGauge)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${C * Math.min(pct, 1)} ${C}`}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="pmsGauge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--c-tide)" />
            <stop offset="100%" stopColor="var(--c-gold)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-data text-xl font-semibold text-ink">{Math.round(pct * 100)}%</span>
        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-ink-3">
          <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'animate-pulse bg-ok' : 'bg-ink-3')} />
          {live ? 'live synced' : 'offline'}
        </span>
      </div>
    </div>
  );
}

export default function StayRoomsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<RoomStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [start, setStart] = useState(toISO(new Date()));
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<DragSel | null>(null);
  const [dragModal, setDragModal] = useState<DragSel | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [inspect, setInspect] = useState<RoomSegment | null>(null);
  const [inspectRoom, setInspectRoom] = useState<RoomRow | null>(null);
  const [extendFor, setExtendFor] = useState<RoomSegment | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSel | null>(null);
  const stateRef = useRef({ start, days, data });
  stateRef.current = { start, days, data };

  const today = toISO(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setData(await api.getRoomStatus(id, start, days));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room status');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, start, days]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useLiveRefresh(() => load(true), 15000);

  const tonight = useMemo(() => {
    const s = { free: 0, booked: 0, blocked: 0, maint: 0 };
    data?.rooms.forEach((r) => {
      const st = r.days.find((d) => d.date === today)?.status ?? 'available';
      if (st === 'available') s.free += 1;
      else if (st === 'booked') s.booked += 1;
      else if (st === 'blocked') s.blocked += 1;
      else s.maint += 1;
    });
    return s;
  }, [data, today]);

  const hk = useMemo(() => {
    const s = { clean: 0, dirty: 0, inspecting: 0 };
    data?.rooms.forEach((r) => {
      s[r.housekeeping] += 1;
    });
    return s;
  }, [data]);

  function colFromX(x: number): string | null {
    const el = gridRef.current;
    const { start: st, days: d, data: dt } = stateRef.current;
    if (!el || !dt) return null;
    const rect = el.getBoundingClientRect();
    const idx = Math.floor((x - rect.left - ROOM_W) / COL_W);
    if (idx < 0 || idx >= d) return null;
    return addDays(st, idx);
  }

  function onTrackMouseDown(e: React.MouseEvent, room: RoomRow) {
    const date = colFromX(e.clientX);
    if (!date) return;
    const d = { room: room.number, start: date, end: date };
    dragRef.current = d;
    setDrag(d);
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const date = colFromX(e.clientX);
      if (!date) return;
      dragRef.current = { ...dragRef.current, end: date };
      setDrag({ ...dragRef.current });
    }
    function onUp() {
      if (!dragRef.current) return;
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      const [a, b] = [d.start, d.end].sort();
      setDragModal({ room: d.room, start: a, end: b });
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  async function applyRangeAll(range: DragSel, status: 'available' | 'maintenance' | 'blocked', reason?: string) {
    setBusy(true);
    try {
      const dates: string[] = [];
      let d = range.start;
      while (d <= range.end) {
        dates.push(d);
        const next = addDays(d, 1);
        if (next === d) break;
        d = next;
      }
      await Promise.all(
        dates.map((date) => api.setRoomStatus({ homestay_id: id, room_number: range.room, date, status, reason })),
      );
      await load(true);
    } finally {
      setBusy(false);
      setDragModal(null);
    }
  }

  async function cycleHousekeeping(room: RoomRow) {
    setBusy(true);
    try {
      await api.setRoomState({ homestay_id: id, room_number: room.number, housekeeping: NEXT_HK[room.housekeeping] });
      await load(true);
    } finally {
      setBusy(false);
    }
  }

  async function bookingAction(seg: RoomSegment, action: 'confirm' | 'cancel') {
    if (!seg.id) return;
    setBusy(true);
    try {
      await api.setBookingStatus(seg.id, action === 'confirm' ? 'confirmed' : 'cancelled');
      await load(true);
      setInspect(null);
    } finally {
      setBusy(false);
    }
  }

  async function doExtend(seg: RoomSegment, newCheckOut: string) {
    if (!seg.id) return;
    setBusy(true);
    try {
      await api.extendBooking(seg.id, newCheckOut);
      await load(true);
      setInspect(null);
      setExtendFor(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 bg-paper-2 p-12 text-center">
        <p className="text-sm font-semibold text-err">{error || 'Stay not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/hosts')} variant="secondary">
          Back to hosts
        </Button>
      </div>
    );
  }

  const dateHeaders = data.rooms[0].days;
  const total = data.rooms.length;
  const occupancy = total ? tonight.booked / total : 0;
  const gridWidth = ROOM_W + days * COL_W;
  const todayIdx = diffDays(start, today);
  const turnovers = new Map<number, Set<string>>();
  data.rooms.forEach((r) => {
    const set = new Set<string>();
    r.segments.forEach((s) => {
      const ending = s.end;
      if (r.segments.some((o) => o !== s && o.start === ending)) set.add(ending);
    });
    turnovers.set(r.number, set);
  });

  function segBox(seg: RoomSegment) {
    const winEnd = addDays(start, days);
    const s0 = seg.start < start ? start : seg.start;
    const e0 = seg.end > winEnd ? winEnd : seg.end;
    const left = Math.max(0, diffDays(start, s0));
    const len = Math.max(0, diffDays(s0, e0));
    return { left, len };
  }

  return (
    <div className="w-full space-y-4">
      <button
        onClick={() => navigate('/hosts')}
        className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 transition-colors hover:text-tide"
      >
        <Icon icon="lucide:arrow-left" className="h-3.5 w-3.5" />
        Hosts <span className="text-ink-3">/</span> {data.stay.host_name}
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="overline">Room control center</p>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {data.stay.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setRulesOpen(true)} className="gap-1.5">
            <Icon icon="lucide:settings-2" className="h-3.5 w-3.5" />
            Stay rules
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDragModal({ room: 1, start: today, end: today })} className="gap-1.5">
            <Icon icon="lucide:calendar-x-2" className="h-3.5 w-3.5" />
            Block dates
          </Button>
        </div>
      </div>

      <SpotlightCard className="overflow-hidden rounded-2xl border border-line bg-elevated">
        <div className="flex flex-wrap items-center gap-5 p-4 sm:p-5">
          <Gauge pct={occupancy} live />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:circle-check" className="h-3.5 w-3.5 text-ok" />
                {tonight.free} free
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:calendar-check" className="h-3.5 w-3.5 text-tide" />
                {tonight.booked} booked
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:ban" className="h-3.5 w-3.5 text-err" />
                {tonight.blocked} blocked
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:wrench" className="h-3.5 w-3.5 text-ember" />
                {tonight.maint} maint
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-gold">
                <Icon icon="lucide:indian-rupee" className="h-3.5 w-3.5" />
                ≈ ₹{fmtMoney(tonight.booked * data.stay.price_per_night)} tonight
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ok via-tide to-gold transition-all duration-700"
                style={{ width: `${occupancy * 100}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {(['clean', 'dirty', 'inspecting'] as const).map((k) => (
                <span
                  key={k}
                  className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold', HK_META[k].cls)}
                >
                  <Icon icon={HK_META[k].icon} className="h-3 w-3" />
                  {HK_META[k].label}
                  <span className="font-mono-data">{hk[k]}</span>
                </span>
              ))}
              <span className="font-mono text-[10px] text-ink-3">
                min-stay {data.settings.min_stay} night{data.settings.min_stay === 1 ? '' : 's'}
                {data.settings.price_override ? ` · festival ₹${fmtMoney(data.settings.price_override)}` : ''}
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-elevated p-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="icon" aria-label="Previous window" onClick={() => setStart(addDays(start, -days))}>
            <Icon icon="lucide:chevron-left" className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="icon" aria-label="Next window" onClick={() => setStart(addDays(start, days))}>
            <Icon icon="lucide:chevron-right" className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-paper-2 p-0.5">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              onClick={() => {
                setDays(n);
                setStart(today);
              }}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors',
                days === n ? 'bg-tide text-white shadow' : 'text-ink-2 hover:text-ink',
              )}
            >
              {n}d
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setStart(today)}>
          Today
        </Button>
        <span className="hidden px-2 font-mono text-[11px] text-ink-3 sm:inline">
          {fmtDate(start)} – {fmtDate(addDays(start, days - 1))}
        </span>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-ink-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-5 rounded bg-tide" />
            booked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-5 rounded border border-err/40 bg-[repeating-linear-gradient(45deg,var(--c-err)_0_2px,transparent_2px_5px)]" />
            blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-5 rounded border border-ember/40 bg-[repeating-linear-gradient(45deg,var(--c-ember)_0_2px,transparent_2px_5px)]" />
            maint
          </span>
          <span className="hidden lg:inline">drag across days to bulk edit</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-elevated">
        <div className="overflow-x-auto">
          <div ref={gridRef} className="relative" style={{ width: gridWidth }}>
            <div className="grid border-b border-line bg-paper-2" style={{ gridTemplateColumns: `${ROOM_W}px repeat(${days}, ${COL_W}px)` }}>
              <div className="sticky left-0 z-20 flex items-center gap-2 border-r border-line bg-paper-2 px-4 py-2.5 text-xs font-semibold text-ink">
                <Icon icon="lucide:bed-double" className="h-3.5 w-3.5 text-tide" />
                Rooms
              </div>
              {dateHeaders.map((d) => {
                const date = new Date(`${d.date}T00:00:00`);
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = d.date === today;
                return (
                  <div
                    key={d.date}
                    className={cn(
                      'flex flex-col items-center justify-center border-l border-line/60 py-1.5',
                      weekend && 'bg-paper-2/70',
                      isToday && 'bg-tide/10',
                    )}
                  >
                    <span className={cn('font-mono text-[9px] uppercase tracking-wider', isToday ? 'text-tide' : 'text-ink-3')}>
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full font-mono-data text-[11px] font-semibold',
                        isToday ? 'bg-tide text-white' : 'text-ink',
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {data.rooms.map((room, rowIdx) => (
              <div
                key={room.number}
                className={cn('relative grid', rowIdx > 0 && 'border-t border-line')}
                style={{ gridTemplateColumns: `${ROOM_W}px repeat(${days}, ${COL_W}px)` }}
              >
                <div className="sticky left-0 z-20 flex items-center gap-3 border-r border-line bg-elevated px-3.5 py-2.5">
                  {room.photo ? (
                    <img src={room.photo} alt={room.name} className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-tide to-tide-2 text-white shadow-sm">
                      <Icon icon="lucide:bed-double" className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-ink">{room.name}</p>
                    <p className="truncate font-mono text-[9px] text-ink-3">
                      {room.bed_type} · max {room.capacity}
                    </p>
                    <button
                      type="button"
                      onClick={() => cycleHousekeeping(room)}
                      disabled={busy}
                      title="Tap to change housekeeping status"
                      className={cn(
                        'mt-1 flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider transition-colors',
                        HK_META[room.housekeeping].cls,
                      )}
                    >
                      <Icon icon={HK_META[room.housekeeping].icon} className="h-2.5 w-2.5" />
                      {HK_META[room.housekeeping].label}
                    </button>
                  </div>
                </div>

                {dateHeaders.map((d) => {
                  const date = new Date(`${d.date}T00:00:00`);
                  const weekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={d.date}
                      onMouseDown={(e) => onTrackMouseDown(e, room)}
                      className={cn(
                        'group relative h-16 cursor-crosshair border-l border-line/60 transition-colors hover:bg-tide/5',
                        weekend && 'bg-paper-2/60',
                      )}
                    >
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-tide opacity-0 transition-opacity group-hover:opacity-60">
                        +
                      </span>
                    </div>
                  );
                })}

                <div className="pointer-events-none absolute inset-y-0 z-0" style={{ left: ROOM_W, width: days * COL_W }}>
                  {todayIdx >= 0 && todayIdx < days && (
                    <div className="absolute inset-y-0 z-10 w-px bg-err/50" style={{ left: todayIdx * COL_W + COL_W / 2 }} />
                  )}
                  {room.segments.map((seg, si) => {
                    const { left, len } = segBox(seg);
                    if (len <= 0) return null;
                    const isBooking = seg.type === 'booking';
                    const turn = turnovers.get(room.number)?.has(seg.end);
                    return (
                      <button
                        key={`${seg.type}-${seg.start}-${si}`}
                        type="button"
                        onClick={() => {
                          if (isBooking) {
                            setInspect(seg);
                            setInspectRoom(room);
                          }
                        }}
                        title={
                          isBooking
                            ? `${seg.guest} · ${seg.channel} · ${fmtDate(seg.start)} → ${fmtDate(seg.end)}`
                            : `${seg.reason ?? seg.type} · ${fmtDate(seg.start)} → ${fmtDate(seg.end)}`
                        }
                        style={{ left: left * COL_W, width: Math.max(len * COL_W - 3, 10) }}
                        className={cn(
                          'pointer-events-auto absolute top-1.5 z-20 flex h-11 items-center gap-1.5 overflow-hidden rounded-lg px-2 text-left shadow-sm transition-transform hover:scale-[1.02]',
                          isBooking
                            ? 'cursor-pointer bg-tide text-white'
                            : seg.type === 'blocked'
                              ? 'cursor-default border border-err/40 bg-err/10 text-err'
                              : 'cursor-default border border-ember/40 bg-ember/10 text-ember',
                          !isBooking &&
                            'bg-[repeating-linear-gradient(45deg,var(--c-paper-2)_0_4px,transparent_4px_8px)]',
                        )}
                      >
                        {isBooking ? (
                          <>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 font-display text-xs font-semibold">
                              {(seg.guest ?? '?')[0]}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[11px] font-semibold leading-tight">{seg.guest}</span>
                              <span className="block truncate text-[9px] leading-tight opacity-80">{seg.channel}</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <Icon icon={seg.type === 'maintenance' ? 'lucide:wrench' : 'lucide:lock'} className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide leading-tight">
                                {seg.type === 'maintenance' ? 'Maint' : 'Blocked'}
                              </span>
                              <span className="block truncate text-[9px] leading-tight opacity-80">{seg.reason}</span>
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                  {turnovers.get(room.number) &&
                    Array.from(turnovers.get(room.number)!).map((d) => {
                      const idx = diffDays(start, d);
                      if (idx < 0 || idx >= days) return null;
                      return (
                        <div
                          key={`split-${d}`}
                          className="pointer-events-none absolute top-1.5 z-10 flex h-11 items-center justify-center rounded-lg"
                          style={{
                            left: idx * COL_W,
                            width: COL_W - 3,
                            background:
                              'linear-gradient(135deg, var(--c-tide) 0 48%, color-mix(in oklab, var(--c-tide-glow) 50%, var(--c-ink)) 52% 100%)',
                          }}
                        >
                          <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-white/90">in/out</span>
                        </div>
                      );
                    })}
                  {drag && drag.room === room.number && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-30 rounded-none border-2 border-tide bg-tide/15"
                      style={{
                        left: Math.min(diffDays(start, drag.start), diffDays(start, drag.end)) * COL_W,
                        width: (Math.abs(diffDays(start, drag.start) - diffDays(start, drag.end)) + 1) * COL_W,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 font-mono text-[10px] text-ink-3">
          <span>Click a booking bar for the guest file</span>
          <span>·</span>
          <span>Drag across empty days to bulk block</span>
          <span>·</span>
          <span>Tap the housekeeping chip to change state</span>
        </div>
      </div>

      <Dialog open={!!dragModal} onClose={() => setDragModal(null)} title={dragModal ? `Room ${dragModal.room} · ${fmtDate(dragModal.start)} → ${fmtDate(dragModal.end)}` : ''}>
        {dragModal && (
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-ink-3">
              {diffDays(dragModal.start, dragModal.end) + 1} night{diffDays(dragModal.start, dragModal.end) > 0 ? 's' : ''} selected
            </p>
            <div className="space-y-2">
              {BLOCK_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  disabled={busy}
                  onClick={() => applyRangeAll(dragModal, 'blocked', reason)}
                  className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:border-err/40 hover:bg-err/5"
                >
                  <Icon icon="lucide:lock" className="h-4 w-4 text-err" />
                  Block — {reason}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => applyRangeAll(dragModal, 'maintenance', 'Maintenance')}
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:border-ember/40 hover:bg-ember/5"
              >
                <Icon icon="lucide:wrench" className="h-4 w-4 text-ember" />
                Mark maintenance
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => applyRangeAll(dragModal, 'available')}
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:border-ok/40 hover:bg-ok/5"
              >
                <Icon icon="lucide:circle-check" className="h-4 w-4 text-ok" />
                Free the dates
              </button>
              <a
                href={`http://127.0.0.1:4173/stay/${data.stay.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:border-tide/40 hover:bg-tide/5"
              >
                <Icon icon="lucide:user-plus" className="h-4 w-4 text-tide" />
                Direct booking (walk-in) →
              </a>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title="Stay rules"
      >
        <RulesForm
          stayId={data.stay.id}
          minStay={data.settings.min_stay}
          priceOverride={data.settings.price_override}
          basePrice={data.stay.price_per_night}
          onDone={() => {
            setRulesOpen(false);
            load(true);
          }}
        />
      </Dialog>

      <Dialog open={!!extendFor} onClose={() => setExtendFor(null)} title="Extend stay">
        {extendFor && (
          <ExtendStayDialog
            seg={extendFor}
            room={inspectRoom}
            price={data.settings.price_override ?? data.stay.price_per_night}
            busy={busy}
            onClose={() => setExtendFor(null)}
            onConfirm={(date) => doExtend(extendFor, date)}
          />
        )}
      </Dialog>

      {createPortal(
        <AnimatePresence>
          {inspect && (
            <>
              <motion.button
                type="button"
                aria-label="Close inspection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setInspect(null)}
                className="fixed inset-0 z-40 cursor-default bg-ink/40 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-line bg-paper shadow-2xl"
              >
                <div className="sticky top-0 z-10 border-b border-line bg-paper/90 p-5 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="overline">Guest file</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">{inspect.ref}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setInspect(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-elevated text-ink-2 transition-colors hover:text-ink"
                    >
                      <Icon icon="lucide:x" className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tide to-tide-2 font-display text-lg font-semibold text-white">
                      {(inspect.guest ?? '?')[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-semibold text-ink">{inspect.guest}</p>
                      <p className="font-mono text-[10px] text-ink-3">{inspect.phone}</p>
                    </div>
                    <a
                      href={`https://wa.me/${(inspect.phone ?? '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-ok/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-ok transition-colors hover:bg-ok/20"
                    >
                      <Icon icon="lucide:message-circle" className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </div>

                  <section>
                    <p className="overline">Reservation</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between rounded-xl border border-line bg-paper-2/60 px-3 py-2.5">
                        <span className="flex items-center gap-2 font-mono text-[10px] text-ink-3">
                          <Icon icon="lucide:calendar-days" className="h-3.5 w-3.5 text-tide" />
                          {fmtDate(inspect.start)} → {fmtDate(inspect.end)} · {diffDays(inspect.start, inspect.end)} night{diffDays(inspect.start, inspect.end) === 1 ? '' : 's'}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-2">
                          <Icon icon="lucide:users" className="h-3.5 w-3.5 text-tide" />
                          {inspect.guests} guest{(inspect.guests ?? 1) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-line bg-paper-2/60 px-3 py-2.5">
                        <span className="flex items-center gap-2 font-mono text-[10px] text-ink-3">
                          <Icon icon="lucide:globe" className="h-3.5 w-3.5 text-tide" />
                          Source
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-ink">{inspect.channel}</span>
                      </div>
                      <div className="rounded-xl border border-line bg-paper-2/60 px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-ink-3">Paid advance</span>
                          <span className="font-mono-data text-sm font-semibold text-ok">₹{fmtMoney(inspect.advance ?? 0)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-ink-3">Balance at property</span>
                          <span className="font-mono-data text-sm font-semibold text-ember">₹{fmtMoney((inspect.amount ?? 0) - (inspect.advance ?? 0))}</span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-ok to-tide"
                            style={{ width: `${(inspect.amount ?? 0) ? Math.min(100, ((inspect.advance ?? 0) / (inspect.amount ?? 1)) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <p className="overline">Quick actions</p>
                    {inspect.status === 'awaiting_host' ? (
                      <Button className="w-full gap-1.5" disabled={busy} onClick={() => bookingAction(inspect, 'confirm')}>
                        <Icon icon="lucide:check" className="h-4 w-4" />
                        Confirm / Check in
                      </Button>
                    ) : (
                      <p className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-2 bg-paper-2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                        <Icon icon="lucide:badge-check" className="h-3.5 w-3.5 text-ok" />
                        Confirmed
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => setExtendFor(inspect)} className="gap-1.5">
                        <Icon icon="lucide:calendar-plus" className="h-3.5 w-3.5" />
                        Extend stay
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => window.print()} className="gap-1.5">
                        <Icon icon="lucide:printer" className="h-3.5 w-3.5" />
                        Print bill
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => bookingAction(inspect, 'cancel')}
                        className="col-span-2 gap-1.5 text-err hover:bg-err/10"
                      >
                        <Icon icon="lucide:ban" className="h-3.5 w-3.5" />
                        Cancel booking
                      </Button>
                    </div>
                  </section>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function ExtendStayDialog({
  seg,
  room,
  price,
  busy,
  onClose,
  onConfirm,
}: {
  seg: RoomSegment;
  room: RoomRow | null;
  price: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const [month, setMonth] = useState<Date>(() => {
    const d = new Date(`${seg.end}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState('');
  const today = toISO(new Date());

  const occupied = useMemo(() => {
    const out: string[] = [];
    room?.segments.forEach((s) => {
      if (s.id === seg.id) return;
      let d = s.start;
      while (d < s.end) {
        out.push(d);
        const next = addDays(d, 1);
        if (next === d) break;
        d = next;
      }
    });
    return new Set(out);
  }, [room, seg.id]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list: (string | null)[] = [];
    for (let i = 0; i < offset; i += 1) list.push(null);
    for (let d = 1; d <= count; d += 1) list.push(toISO(new Date(month.getFullYear(), month.getMonth(), d)));
    return list;
  }, [month]);

  const extraNights = picked ? diffDays(seg.end, picked) : 0;
  const extraCost = extraNights * price;
  const capDate = addDays(seg.end, 60);

  function canPick(iso: string): { ok: boolean; why: string } {
    if (iso <= seg.end) return { ok: false, why: 'Before current check-out' };
    if (iso < today) return { ok: false, why: 'Past date' };
    if (iso > capDate) return { ok: false, why: 'Beyond 60 nights' };
    if (occupied.has(iso)) return { ok: false, why: 'Room occupied' };
    return { ok: true, why: '' };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
          aria-label="Previous month"
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4" />
        </button>
        <span className="font-display text-base font-semibold text-ink">
          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
          aria-label="Next month"
        >
          <Icon icon="lucide:chevron-right" className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {d}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`blank-${i}`} />;
          const { ok, why } = canPick(iso);
          const isCheckOut = iso === seg.end;
          const isPicked = iso === picked;
          return (
            <button
              key={iso}
              type="button"
              disabled={!ok}
              onClick={() => setPicked(iso)}
              title={ok ? undefined : why}
              className={cn(
                'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full font-mono-data text-sm transition-all duration-micro',
                !ok && 'cursor-not-allowed text-ink-3/30 line-through',
                ok && !isPicked && 'text-ink hover:bg-paper-2',
                isCheckOut && 'ring-1 ring-inset ring-tide',
                isPicked && 'bg-tide font-semibold text-white shadow-sm',
              )}
            >
              {Number(iso.slice(8))}
              {ok && occupied.has(iso) && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-err" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper-2/60 px-3.5 py-2.5">
        <div className="font-mono text-[10px] leading-5 text-ink-2">
          <p>
            Current check-out: <span className="font-semibold text-ink">{fmtDate(seg.end)}</span>
          </p>
          <p>
            {picked ? (
              <>
                New check-out: <span className="font-semibold text-tide">{fmtDate(picked)}</span> ·{' '}
                <span className="font-semibold text-ink">
                  +{extraNights} night{extraNights === 1 ? '' : 's'} · ≈ ₹{fmtMoney(extraCost)}
                </span>
              </>
            ) : (
              <span className="text-ink-3">Pick a new check-out date</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1 gap-1.5" disabled={!picked || busy} onClick={() => onConfirm(picked)}>
          <Icon icon="lucide:calendar-check" className="h-4 w-4" />
          Extend
        </Button>
      </div>
    </div>
  );
}

function RulesForm({
  stayId,
  minStay,
  priceOverride,
  basePrice,
  onDone,
}: {
  stayId: string;
  minStay: number;
  priceOverride: number | null;
  basePrice: number;
  onDone: () => void;
}) {
  const [min, setMin] = useState(String(minStay));
  const [override, setOverride] = useState(priceOverride ? String(priceOverride) : '');
  const [base, setBase] = useState(String(basePrice));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const minN = parseInt(min, 10);
      if (Number.isFinite(minN) && minN >= 1) {
        await api.setStaySettings({ homestay_id: stayId, min_stay: minN });
      }
      const overrideN = override ? parseFloat(override) : null;
      if (overrideN === null || Number.isFinite(overrideN)) {
        await api.setStaySettings({ homestay_id: stayId, price_override: overrideN });
      }
      const baseN = parseFloat(base);
      if (Number.isFinite(baseN) && baseN > 0) {
        await api.updateStay(stayId, { price_per_night: baseN });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border border-line-2 bg-elevated px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-tide focus:outline-none focus:ring-2 focus:ring-tide/30';

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Base price / night (₹)</label>
        <input type="number" min={1} value={base} onChange={(e) => setBase(e.target.value)} className={field} />
      </div>
      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Min-stay rule (nights)</label>
        <input type="number" min={1} max={30} value={min} onChange={(e) => setMin(e.target.value)} className={field} />
      </div>
      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Festival price override (₹, optional)</label>
        <input type="number" min={0} value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. 2500" className={field} />
      </div>
      <Button className="w-full" disabled={busy} onClick={save}>
        Save rules
      </Button>
    </div>
  );
}
