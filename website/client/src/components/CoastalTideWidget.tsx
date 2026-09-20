import React from 'react';
import { Waves, Sunset, Sparkles, Compass, Wind, Moon } from 'lucide-react';

export const CoastalTideWidget: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-6 text-white shadow-2xl space-y-4">
      {/* Glow highlight */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/90 font-bold">
            Live Shoreline Telemetry
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
          Gokarna 14.54° N
        </span>
      </div>

      {/* Grid of Coastal Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Tide Radar */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-200">
            <Waves className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Arabian Tide</span>
          </div>
          <div className="text-sm sm:text-base font-serif font-bold text-white">Low Tide in 1h 40m</div>
          <div className="text-[10px] text-white/60">Ideal for Kudle rock pooling</div>
        </div>

        {/* Sunset Countdown */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sunset className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Golden Hour</span>
          </div>
          <div className="text-sm sm:text-base font-serif font-bold text-white">18:24 Sunset</div>
          <div className="text-[10px] text-white/60">Best at Kudle Sunset Point</div>
        </div>

        {/* Swell & Temp */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Wind className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Water State</span>
          </div>
          <div className="text-sm sm:text-base font-serif font-bold text-white">28°C • 0.6m Swell</div>
          <div className="text-[10px] text-white/60">Gentle turquoise swim</div>
        </div>

        {/* Bioluminescence Index */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Night Glow</span>
          </div>
          <div className="text-sm sm:text-base font-serif font-bold text-white">88% Probability</div>
          <div className="text-[10px] text-white/60">Half Moon & Paradise Coves</div>
        </div>
      </div>
    </div>
  );
};
