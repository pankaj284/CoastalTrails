import React, { useState } from 'react';
import { Compass, Phone, User, ShieldCheck, Navigation, Sparkles } from 'lucide-react';
import { CoastalMapView } from '../components/CoastalMapView';
import { ColorfulIcon } from '../components/ColorfulIcon';

export const RouteNavigatorPage: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'walk' | 'scooter' | 'car' | 'bus'>('walk');
  const [showDriverModal, setShowDriverModal] = useState(false);

  const modes = [
    {
      id: 'walk',
      label: 'Cliff Trek',
      time: '120 min',
      iconType: 'trail',
      desc: 'Scenic cliffside coastal dirt path',
      trackingType: 'trekker' as const,
    },
    {
      id: 'scooter',
      label: 'Coastal Scooter',
      time: '60 min',
      iconType: 'scooter',
      desc: 'Paved coastal road through village',
      trackingType: 'trekker' as const,
    },
    {
      id: 'car',
      label: 'Local Auto / Cab',
      time: '45 min',
      iconType: 'auto',
      desc: 'Direct drop at Om Beach entry gate',
      trackingType: 'trekker' as const,
    },
    {
      id: 'bus',
      label: 'Boat Ferry',
      time: '35 min',
      iconType: 'ferry',
      desc: 'Scenic sea transit across Arabian coves',
      trackingType: 'ferry' as const,
    },
  ];

  const currentTrackingMode = selectedMode === 'bus' ? 'ferry' : 'trekker';

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8">
      {/* 1. Top Header Card */}
      <div className="relative overflow-hidden bg-white text-slate-900 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-200/80 w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-mono font-bold border border-sky-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real Satellite GPS Trail & Ferry Navigator</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Kudle to Om Trail & Sea Transit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-light leading-relaxed">
              Real high-resolution satellite imagery tracking the iconic clifftop trek, granite headlands, beach nodes, and regulated boat ferry lines across Gokarna.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ColorfulIcon type="cliff" size="md" className="rounded-xl shadow-xs" />
            <ColorfulIcon type="ferry" size="md" className="rounded-xl shadow-xs" />
          </div>
        </div>
      </div>

      {/* 2. Responsive 2-Column Showcase (Left: Transit Card, Right: Expansive Sophisticated Satellite Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full">
        {/* LEFT SIDE: Transit Options Rail */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Transit Options & Verified Timings
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Fixed regulated rates
              </p>
            </div>

            {/* Vertical Stack of Transit Modes */}
            <div className="space-y-2">
              {modes.map((m) => {
                const isActive = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id as any)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/15 scale-[1.01]'
                        : 'bg-slate-50/70 text-slate-900 border-slate-200/80 hover:border-sky-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ColorfulIcon type={m.iconType} size="xs" className="rounded-md shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{m.label}</div>
                        <div className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {m.desc}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`font-mono text-xs font-bold ${isActive ? 'text-amber-300' : 'text-sky-700'}`}>
                        {m.time}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setShowDriverModal(true)}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all active:scale-98 flex items-center justify-center gap-1.5 text-center cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Contact Local Transport Dispatch</span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Expansive Sophisticated Satellite Map Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Live High-Definition Satellite Tracking Engine
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Google Satellite Hybrid • 20x Zoom
            </span>
          </div>

          <CoastalMapView
            showTrailOverlay={true}
            initialTrackingMode={currentTrackingMode}
            enablePinDrop={false}
            height="650px"
          />
        </div>
      </div>

      {/* Driver Contact Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Regulated Gokarna Auto Dispatch</h3>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Standard official fares are regulated by local transport syndicates. Pay directly in cash or UPI to your driver.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Manjunath Gowda</div>
                    <div className="text-[11px] text-slate-500">Auto Stand #04 • Om Beach Route</div>
                  </div>
                </div>
                <a
                  href="tel:+919845012345"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  Call
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Narayana Naik</div>
                    <div className="text-[11px] text-slate-500">Kudle Clifftop Taxi Association</div>
                  </div>
                </div>
                <a
                  href="tel:+919845067890"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  Call
                </a>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-sky-50/50 p-3 rounded-2xl border border-sky-100/80 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Fair pricing monitored by Gokarna Panchayat & Police Station.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowDriverModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
