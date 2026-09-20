import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, MapPin } from 'lucide-react';

const ACTIVITIES = [
  { traveler: 'Maya V.', stay: 'Kudle Clifftop Wooden Cottage', action: 'placed 20% hold', time: '3m ago' },
  { traveler: 'Angela S.', stay: 'Om Beach Nirvana Palm Shack', action: 'dates locked by host', time: '14m ago' },
  { traveler: 'Dev K.', stay: 'Half Moon Secluded Rock Cottage', action: 'reserved off-grid stay', time: '28m ago' },
  { traveler: 'Punit S.', stay: 'Main Beach Heritage Estate', action: 'host WhatsApp confirmed', time: '42m ago' },
];

export const LiveActivityTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = ACTIVITIES[index];

  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-coastal-stone/70 shadow-sm text-xs transition-all duration-500 animate-fade-in">
      <span className="w-2 h-2 rounded-full bg-coastal-teal animate-pulse"></span>
      <span className="text-[11px] font-medium text-coastal-navy">
        <span className="font-bold text-coastal-navy">{current.traveler}</span>{' '}
        <span className="text-coastal-slate">{current.action} at</span>{' '}
        <span className="font-semibold text-coastal-terracotta">{current.stay}</span>
      </span>
      <span className="text-[10px] text-coastal-slate/60 font-mono hidden sm:inline">
        {current.time}
      </span>
    </div>
  );
};
