import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

export const SoundscapePlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);

  // Web Audio API ambient ocean surf synthesizer (Zero external asset dependencies)
  const startOceanSurf = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Pink noise buffer generator for deep soothing wave crash
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass filter modeling underwater swell
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      // Connect noise -> filter -> master
      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

      // Modulate filter frequency to simulate incoming and receding waves
      let swell = 0;
      intervalRef.current = setInterval(() => {
        if (!ctx || ctx.state === 'closed') return;
        swell += 0.04;
        const freq = 200 + Math.sin(swell) * 160 + Math.sin(swell * 0.4) * 80;
        filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.5);
      }, 200);

      setIsPlaying(true);
    } catch (err) {
      console.warn('Web Audio Soundscape not supported or blocked by user gesture', err);
    }
  };

  const stopOceanSurf = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopOceanSurf();
    } else {
      startOceanSurf();
    }
  };

  useEffect(() => {
    return () => {
      stopOceanSurf();
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      title={isPlaying ? 'Mute coastal soundscape' : 'Play ambient Gokarna Arabian Sea 432Hz surf'}
      className={`relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
        isPlaying
          ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-sm shadow-sky-500/10 ring-2 ring-sky-400/20'
          : 'bg-white/90 backdrop-blur-md text-slate-600 border-slate-200/90 hover:border-sky-300 hover:text-slate-900 hover:bg-white shadow-xs'
      }`}
    >
      {isPlaying ? (
        <>
          <div className="flex items-end gap-[2px] h-3.5 px-0.5">
            <span className="w-[3px] rounded-full bg-sky-600 animate-wave-1"></span>
            <span className="w-[3px] rounded-full bg-teal-500 animate-wave-2"></span>
            <span className="w-[3px] rounded-full bg-sky-500 animate-wave-3"></span>
            <span className="w-[3px] rounded-full bg-blue-600 animate-wave-4"></span>
          </div>
          <span className="text-[11px] font-mono tracking-tight text-sky-900 font-bold">432Hz Waves</span>
          <Volume2 className="w-3.5 h-3.5 text-sky-600" />
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span className="text-[11px] text-slate-500 font-medium">Sea Ambience</span>
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
        </>
      )}
    </button>
  );
};
