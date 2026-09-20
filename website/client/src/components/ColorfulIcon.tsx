import React from 'react';
import {
  Waves,
  Sun,
  Compass,
  Zap,
  Wifi,
  Utensils,
  Coffee,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Footprints,
  Navigation,
  Car,
  Anchor,
  MapPin,
  Trees,
  CheckCircle,
  Clock,
  Star,
  MessageCircle,
} from 'lucide-react';

export type IconType =
  | 'waves'
  | 'sunset'
  | 'cliff'
  | 'wifi'
  | 'eco'
  | 'thali'
  | 'cafe'
  | 'whatsapp'
  | 'hold'
  | 'trail'
  | 'scooter'
  | 'auto'
  | 'ferry'
  | 'star'
  | 'verified'
  | 'pin';

interface ColorfulIconProps {
  type: IconType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ColorfulIcon: React.FC<ColorfulIconProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const normalized = type.toLowerCase();

  // Scaled down, refined 2027 icon dimensions
  const sizeClasses = {
    xs: 'w-4 h-4 rounded-md',
    sm: 'w-5 h-5 rounded-lg',
    md: 'w-6 h-6 rounded-lg',
    lg: 'w-8 h-8 rounded-xl',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  // 1. Waves / Arabian Shoreline / Surf
  if (normalized.includes('wave') || normalized.includes('beach') || normalized.includes('surf') || normalized.includes('ocean')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-2xs shadow-sky-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Waves className={iconSizes} />
      </div>
    );
  }

  // 2. Sunset / Clifftop
  if (normalized.includes('sunset') || normalized.includes('sun') || normalized.includes('cliff')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white shadow-2xs shadow-orange-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Sun className={iconSizes} />
      </div>
    );
  }

  // 3. WiFi / Remote Work Fiber
  if (normalized.includes('wifi') || normalized.includes('internet') || normalized.includes('fiber') || normalized.includes('work')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-500 text-white shadow-2xs shadow-indigo-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Wifi className={iconSizes} />
      </div>
    );
  }

  // 4. Karavali Kitchen / Thali / Food
  if (normalized.includes('thali') || normalized.includes('kitchen') || normalized.includes('food') || normalized.includes('meal') || normalized.includes('utensils')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white shadow-2xs shadow-amber-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Utensils className={iconSizes} />
      </div>
    );
  }

  // 5. Cafe / Breakfast
  if (normalized.includes('cafe') || normalized.includes('coffee') || normalized.includes('breakfast')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-yellow-500 via-amber-600 to-amber-700 text-white shadow-2xs shadow-amber-600/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Coffee className={iconSizes} />
      </div>
    );
  }

  // 6. Eco / Solar / Nature / Forest
  if (normalized.includes('eco') || normalized.includes('solar') || normalized.includes('green') || normalized.includes('nature') || normalized.includes('tree')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-emerald-400 via-teal-500 to-green-600 text-white shadow-2xs shadow-emerald-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Trees className={iconSizes} />
      </div>
    );
  }

  // 7. Direct WhatsApp Host
  if (normalized.includes('whatsapp') || normalized.includes('chat') || normalized.includes('host')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-green-600 text-white shadow-2xs shadow-emerald-600/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <MessageCircle className={iconSizes} />
      </div>
    );
  }

  // 8. 20% Offline Hold / Security
  if (normalized.includes('hold') || normalized.includes('shield') || normalized.includes('secure') || normalized.includes('verified')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-teal-500 via-emerald-600 to-cyan-700 text-white shadow-2xs shadow-teal-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <ShieldCheck className={iconSizes} />
      </div>
    );
  }

  // 9. Trail Trek (Footprints)
  if (normalized.includes('trail') || normalized.includes('trek') || normalized.includes('walk')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-amber-600 via-orange-600 to-stone-700 text-white shadow-2xs shadow-orange-600/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Footprints className={iconSizes} />
      </div>
    );
  }

  // 10. Scooter
  if (normalized.includes('scooter') || normalized.includes('bike')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-700 text-white shadow-2xs shadow-sky-600/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Navigation className={iconSizes} />
      </div>
    );
  }

  // 11. Auto / Cab
  if (normalized.includes('auto') || normalized.includes('car') || normalized.includes('cab')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-500 text-slate-900 shadow-2xs shadow-yellow-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Car className={iconSizes} />
      </div>
    );
  }

  // 12. Boat Ferry
  if (normalized.includes('ferry') || normalized.includes('boat') || normalized.includes('anchor')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-800 text-white shadow-2xs shadow-sky-600/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Anchor className={iconSizes} />
      </div>
    );
  }

  // 13. Rating / Star
  if (normalized.includes('star') || normalized.includes('rating')) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-2xs shadow-amber-500/20 shrink-0 ${sizeClasses} ${className}`}
      >
        <Star className={iconSizes} fill="currentColor" />
      </div>
    );
  }

  // Default Coastal Compass
  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-tr from-sky-500 to-teal-600 text-white shadow-2xs shrink-0 ${sizeClasses} ${className}`}
    >
      <Compass className={iconSizes} />
    </div>
  );
};
