import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Homestay, CustomMapLocation, NavigationTarget } from '../types';
import {
  Layers,
  MapPin,
  Compass,
  ShieldCheck,
  Waves,
  Star,
  MessageCircle,
  Maximize2,
  Minimize2,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Locate,
  Footprints,
  Anchor,
  Plus,
  X,
  ArrowUpRight,
  Trash2,
  Crosshair,
  Check,
} from 'lucide-react';

interface CoastalMapViewProps {
  homestays?: Homestay[];
  selectedStayId?: string;
  onSelectStay?: (stay: Homestay) => void;
  onBookStay?: (stay: Homestay) => void;
  showTrailOverlay?: boolean;
  activeCheckpoint?: number;
  onSelectCheckpoint?: (idx: number) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  initialTrackingMode?: 'trekker' | 'ferry';
  customLocations?: CustomMapLocation[];
  onAddCustomLocation?: (loc: CustomMapLocation) => void;
  onDeleteCustomLocation?: (id: string) => void;
  activeNavigation?: NavigationTarget | null;
  onStartNavigation?: (target: NavigationTarget) => void;
  onEndNavigation?: () => void;
  enablePinDrop?: boolean;
}

// Gokarna Beaches & Key GPS Landmarks
export const GOKARNA_COASTAL_NODES = [
  { id: 'main', name: 'Gokarna Main Beach', coords: [14.5450, 74.3155] as [number, number], type: 'beach', desc: 'Pilgrim shore & sacred Mahabaleshwar temple bay' },
  { id: 'kudle', name: 'Kudle Beach', coords: [14.5285, 74.3165] as [number, number], type: 'beach', desc: 'Wide golden sand cove with clifftop sunset trails' },
  { id: 'middle', name: 'Middle Beach Headland', coords: [14.5215, 74.3172] as [number, number], type: 'trail', desc: 'Elevated cliff vantage point with panoramic sea eagle perches' },
  { id: 'om', name: 'Om Beach ॐ', coords: [14.5175, 74.3190] as [number, number], type: 'beach', desc: 'Iconic ॐ shaped twin crescent bay & boat ferry jetty' },
  { id: 'halfmoon', name: 'Half Moon Beach', coords: [14.5097, 74.3245] as [number, number], type: 'beach', desc: 'Remote seclusion accessible only by foot trek or boat' },
  { id: 'paradise', name: 'Paradise Beach', coords: [14.5038, 74.3283] as [number, number], type: 'beach', desc: 'Pristine southern cove bordered by rugged granite headlands' },
];

// High-Resolution Cliffhead Trek Path
const CLIFF_TREK_PATH: [number, number][] = [
  [14.5285, 74.3165],
  [14.5270, 74.3167],
  [14.5255, 74.3172],
  [14.5235, 74.3174],
  [14.5215, 74.3172],
  [14.5195, 74.3178],
  [14.5175, 74.3190],
  [14.5150, 74.3205],
  [14.5125, 74.3225],
  [14.5097, 74.3245],
  [14.5065, 74.3265],
  [14.5038, 74.3283],
];

// Marine Boat Ferry Route across Arabian Sea
const BOAT_FERRY_PATH: [number, number][] = [
  [14.5175, 74.3190],
  [14.5155, 74.3205],
  [14.5130, 74.3225],
  [14.5097, 74.3245],
  [14.5065, 74.3265],
  [14.5038, 74.3283],
];

// Homestay GPS Coordinates
const HOMESTAY_COORDINATES: { [id: string]: [number, number] } = {
  'gokarna-1': [14.5292, 74.3170],
  'gokarna-2': [14.5180, 74.3195],
  'gokarna-3': [14.5100, 74.3240],
  'gokarna-4': [14.5270, 74.3155],
  'gokarna-5': [14.5042, 74.3288],
};

function getDistanceKm(c1: [number, number], c2: [number, number]): number {
  const R = 6371;
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(start: [number, number], dest: [number, number]): { deg: number; cardinal: string } {
  const y = Math.sin(((dest[1] - start[1]) * Math.PI) / 180) * Math.cos((dest[0] * Math.PI) / 180);
  const x =
    Math.cos((start[0] * Math.PI) / 180) * Math.sin((dest[0] * Math.PI) / 180) -
    Math.sin((start[0] * Math.PI) / 180) *
      Math.cos((dest[0] * Math.PI) / 180) *
      Math.cos(((dest[1] - start[1]) * Math.PI) / 180);
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinal = cardinals[Math.round(deg / 45) % 8];
  return { deg: Math.round(deg), cardinal };
}

export const CoastalMapView: React.FC<CoastalMapViewProps> = ({
  homestays = [],
  selectedStayId,
  onSelectStay,
  onBookStay,
  showTrailOverlay = true,
  activeCheckpoint,
  onSelectCheckpoint,
  height = '540px',
  center = [14.5215, 74.3185],
  zoom = 14,
  initialTrackingMode = 'trekker',
  customLocations = [],
  onAddCustomLocation,
  onDeleteCustomLocation,
  activeNavigation: propNavigation,
  onStartNavigation,
  onEndNavigation,
  enablePinDrop = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const trailGroupRef = useRef<L.LayerGroup | null>(null);
  const customLocationsGroupRef = useRef<L.LayerGroup | null>(null);
  const navigationRouteGroupRef = useRef<L.LayerGroup | null>(null);
  const trackingMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.CircleMarker | null>(null);
  const tempDropPinMarkerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<'satellite' | 'coastal' | 'topo'>('satellite');
  const [activeStayPreview, setActiveStayPreview] = useState<Homestay | null>(null);
  const [activeCustomLocationPreview, setActiveCustomLocationPreview] = useState<CustomMapLocation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Movement Tracking State
  const [isTrackingPlaying, setIsTrackingPlaying] = useState<boolean>(true);
  const [trackingMode, setTrackingMode] = useState<'trekker' | 'ferry'>(initialTrackingMode);
  const [autoFollow, setAutoFollow] = useState<boolean>(false);
  const [trackerIndex, setTrackerIndex] = useState<number>(0);
  const [currentWaypointName, setCurrentWaypointName] = useState<string>('Kudle Clifftop Trailhead');
  const [speedTelemetry, setSpeedTelemetry] = useState<string>('4.2 km/h');

  // Custom Pin Drop Mode State
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [droppedCoords, setDroppedCoords] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationCategory, setLocationCategory] = useState<CustomMapLocation['category']>('viewpoint');
  const [locationDesc, setLocationDesc] = useState('');

  // Internal Navigation Target state if not controlled from prop
  const [internalNavigation, setInternalNavigation] = useState<NavigationTarget | null>(null);
  const currentNavTarget = propNavigation !== undefined ? propNavigation : internalNavigation;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      maxZoom: 20,
      minZoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    tileLayerGroupRef.current = L.layerGroup().addTo(map);
    trailGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    customLocationsGroupRef.current = L.layerGroup().addTo(map);
    navigationRouteGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Pin Drop Map Click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isPinDropMode) return;
      const { lat, lng } = e.latlng;
      setDroppedCoords([lat, lng]);

      if (tempDropPinMarkerRef.current) {
        tempDropPinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const iconHtml = `
          <div class="relative flex items-center justify-center animate-bounce">
            <div class="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl border-2 border-white text-base">
              📍
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html: iconHtml,
          className: 'temp-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        tempDropPinMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPinDropMode]);

  // High-Resolution Satellite & Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const tileGroup = tileLayerGroupRef.current;
    if (!map || !tileGroup) return;

    tileGroup.clearLayers();

    if (activeLayer === 'satellite') {
      const googleSatellite = L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          subdomains: ['0', '1', '2', '3'],
          maxNativeZoom: 20,
          maxZoom: 20,
          detectRetina: true,
          attribution: 'Google Satellite',
        }
      );
      tileGroup.addLayer(googleSatellite);
    } else if (activeLayer === 'coastal') {
      const cartoVoyager = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxNativeZoom: 19,
          maxZoom: 20,
          detectRetina: true,
          attribution: '© CartoDB Voyager',
        }
      );
      tileGroup.addLayer(cartoVoyager);
    } else {
      const topoMap = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          maxNativeZoom: 17,
          maxZoom: 20,
          attribution: '© OpenTopoMap',
        }
      );
      tileGroup.addLayer(topoMap);
    }
  }, [activeLayer]);

  // Trail Lines and Static Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trailGroup = trailGroupRef.current;
    if (!map || !trailGroup) return;

    trailGroup.clearLayers();

    if (showTrailOverlay) {
      const trekGlow = L.polyline(CLIFF_TREK_PATH, {
        color: '#F59E0B',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
      });
      const trekLine = L.polyline(CLIFF_TREK_PATH, {
        color: '#FBBF24',
        weight: 3.5,
        dashArray: '5, 6',
        lineCap: 'round',
      });
      trailGroup.addLayer(trekGlow);
      trailGroup.addLayer(trekLine);

      const ferryGlow = L.polyline(BOAT_FERRY_PATH, {
        color: '#06B6D4',
        weight: 6,
        opacity: 0.35,
        lineCap: 'round',
      });
      const ferryLine = L.polyline(BOAT_FERRY_PATH, {
        color: '#0284C7',
        weight: 3,
        dashArray: '4, 8',
        lineCap: 'round',
      });
      trailGroup.addLayer(ferryGlow);
      trailGroup.addLayer(ferryLine);

      GOKARNA_COASTAL_NODES.forEach((node, idx) => {
        const isCheckpointActive = activeCheckpoint !== undefined && activeCheckpoint === idx;
        const iconHtml = `
          <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110">
            <div class="w-6 h-6 rounded-full ${
              node.type === 'beach' ? 'bg-sky-500' : 'bg-amber-500'
            } text-white font-bold text-[10px] flex items-center justify-center shadow-md border-2 border-white ring-2 ${
          isCheckpointActive ? 'ring-amber-300 scale-125' : 'ring-black/20'
        }">
              ${node.type === 'beach' ? '🏖️' : '🚶'}
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20 shadow-sm pointer-events-none">
              ${node.name}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-coastal-node',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(node.coords, { icon });
        marker.on('click', () => {
          if (onSelectCheckpoint) onSelectCheckpoint(idx);
          map.flyTo(node.coords, 16, { duration: 0.8 });
        });

        trailGroup.addLayer(marker);
      });
    }
  }, [showTrailOverlay, activeCheckpoint, onSelectCheckpoint]);

  // LIVE MOVEMENT TRACKING SIMULATOR
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const path = trackingMode === 'trekker' ? CLIFF_TREK_PATH : BOAT_FERRY_PATH;

    if (!trackingMarkerRef.current) {
      const initialCoord = path[0];
      const isBoat = trackingMode === 'ferry';
      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-9 h-9 rounded-full ${isBoat ? 'bg-cyan-400/40' : 'bg-amber-400/40'} animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full ${
            isBoat ? 'bg-gradient-to-tr from-cyan-600 to-blue-700' : 'bg-gradient-to-tr from-amber-500 to-rose-600'
          } text-white shadow-xl border-2 border-white flex items-center justify-center text-sm shadow-black/40">
            ${isBoat ? '🛥️' : '🚶'}
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: 'live-tracker-beacon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      trackingMarkerRef.current = L.marker(initialCoord, { icon: markerIcon, zIndexOffset: 1000 }).addTo(map);
    }

    if (!isTrackingPlaying) return;

    const interval = setInterval(() => {
      setTrackerIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % path.length;
        const currentCoord = path[nextIdx];

        if (trackingMarkerRef.current) {
          trackingMarkerRef.current.setLatLng(currentCoord);
        }

        if (autoFollow && map) {
          map.panTo(currentCoord, { animate: true, duration: 0.8 });
        }

        if (trackingMode === 'trekker') {
          if (nextIdx < 3) setCurrentWaypointName('Kudle Clifftop Steps (42m)');
          else if (nextIdx < 6) setCurrentWaypointName('Middle Beach Headland (18m)');
          else if (nextIdx < 8) setCurrentWaypointName('Om Beach ॐ (4m)');
          else if (nextIdx < 10) setCurrentWaypointName('Half Moon Cove Trail');
          else setCurrentWaypointName('Paradise Beach Southern Point');
          setSpeedTelemetry(`${(3.8 + Math.random() * 0.8).toFixed(1)} km/h`);
        } else {
          if (nextIdx < 2) setCurrentWaypointName('Om Beach Ferry Jetty');
          else if (nextIdx < 4) setCurrentWaypointName('Arabian Sea Bay Waters');
          else setCurrentWaypointName('Half Moon / Paradise Marine Approach');
          setSpeedTelemetry(`${(14.0 + Math.random() * 2.0).toFixed(1)} km/h`);
        }

        return nextIdx;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isTrackingPlaying, trackingMode, autoFollow]);

  // RENDER CUSTOM MAP LOCATIONS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const customGroup = customLocationsGroupRef.current;
    if (!map || !customGroup) return;

    customGroup.clearLayers();

    const categoryIcons: { [k: string]: string } = {
      viewpoint: '🌅',
      cove: '🏖️',
      cafe: '☕',
      homestay: '🏡',
      jetty: '🛥️',
      trail: '🚶',
      shrine: '🛕',
    };

    customLocations.forEach((loc) => {
      const iconEmoji = categoryIcons[loc.category] || '📍';
      const isNavTarget = currentNavTarget?.id === loc.id;

      const markerHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-115 -translate-y-3">
          <div class="w-8 h-8 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl border-2 border-white flex items-center justify-center text-sm ring-2 ${
            isNavTarget ? 'ring-emerald-400 ring-4 scale-125 animate-pulse' : 'ring-black/20'
          }">
            ${iconEmoji}
          </div>
          <div class="mt-1 whitespace-nowrap bg-slate-900/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20 shadow-md">
            ${loc.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-poi-marker',
        iconSize: [40, 48],
        iconAnchor: [20, 48],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveCustomLocationPreview(loc);
        map.flyTo([loc.lat, loc.lng], 16, { duration: 0.8 });
      });

      customGroup.addLayer(marker);
    });
  }, [customLocations, currentNavTarget]);

  // RENDER LIVE NAVIGATION ROUTE OVERLAY
  useEffect(() => {
    const map = mapInstanceRef.current;
    const navGroup = navigationRouteGroupRef.current;
    if (!map || !navGroup) return;

    navGroup.clearLayers();

    if (!currentNavTarget) return;

    // Start coordinate: traveler position or Kudle trailhead
    const startCoord: [number, number] = [14.5285, 74.3165];
    const destCoord: [number, number] = currentNavTarget.coords;

    // Route points: start -> mid waypoints -> destination
    const routePoints: [number, number][] = [startCoord];

    // Check intermediate path points along coastline
    CLIFF_TREK_PATH.forEach((pt) => {
      const dStart = getDistanceKm(startCoord, pt);
      const dDest = getDistanceKm(pt, destCoord);
      const direct = getDistanceKm(startCoord, destCoord);
      if (dStart + dDest < direct * 1.35) {
        routePoints.push(pt);
      }
    });

    routePoints.push(destCoord);

    // 1. Outer glowing halo
    const glowLine = L.polyline(routePoints, {
      color: '#10B981',
      weight: 9,
      opacity: 0.45,
      lineCap: 'round',
    });

    // 2. Core navigation pulse line
    const coreLine = L.polyline(routePoints, {
      color: '#06B6D4',
      weight: 4,
      dashArray: '8, 8',
      lineCap: 'round',
    });

    // 3. Target Destination Flag
    const destIconHtml = `
      <div class="relative flex items-center justify-center animate-bounce">
        <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-2xl border-2 border-white text-base">
          🎯
        </div>
      </div>
    `;
    const destIcon = L.divIcon({
      html: destIconHtml,
      className: 'nav-dest-flag',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
    const destMarker = L.marker(destCoord, { icon: destIcon });

    navGroup.addLayer(glowLine);
    navGroup.addLayer(coreLine);
    navGroup.addLayer(destMarker);

    // Fit map bounds to encompass the route
    const bounds = L.latLngBounds(routePoints);
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
  }, [currentNavTarget]);

  // Start Navigation Handler
  const handleStartNav = (target: NavigationTarget) => {
    if (onStartNavigation) {
      onStartNavigation(target);
    } else {
      setInternalNavigation(target);
    }
    setActiveCustomLocationPreview(null);
    setActiveStayPreview(null);
  };

  // End Navigation Handler
  const handleEndNav = () => {
    if (onEndNavigation) {
      onEndNavigation();
    } else {
      setInternalNavigation(null);
    }
  };

  // Save Dropped Pin Location
  const handleSaveDroppedPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!droppedCoords || !locationName.trim()) return;

    const newLoc: CustomMapLocation = {
      id: `custom-loc-${Date.now()}`,
      name: locationName.trim(),
      category: locationCategory,
      lat: droppedCoords[0],
      lng: droppedCoords[1],
      description: locationDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    if (onAddCustomLocation) onAddCustomLocation(newLoc);

    // Clean up temporary marker
    if (tempDropPinMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempDropPinMarkerRef.current);
      tempDropPinMarkerRef.current = null;
    }

    setIsPinDropMode(false);
    setDroppedCoords(null);
    setLocationName('');
    setLocationDesc('');
  };

  const handleCancelDroppedPin = () => {
    if (tempDropPinMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tempDropPinMarkerRef.current);
      tempDropPinMarkerRef.current = null;
    }
    setIsPinDropMode(false);
    setDroppedCoords(null);
  };

  // Navigation Telemetry Calculations
  const startCoordForTelemetry: [number, number] = [14.5285, 74.3165];
  const navDistanceKm = currentNavTarget ? getDistanceKm(startCoordForTelemetry, currentNavTarget.coords) : 0;
  const navBearing = currentNavTarget ? getBearing(startCoordForTelemetry, currentNavTarget.coords) : { deg: 0, cardinal: 'N' };
  const navWalkMins = Math.max(1, Math.round((navDistanceKm / 4.0) * 60));

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      } ${isPinDropMode ? 'cursor-crosshair' : ''}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      <style>{`
        .leaflet-tile-pane {
          filter: contrast(1.08) saturate(1.15) brightness(1.02);
        }
      `}</style>

      {/* 1. Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* 2. Top-Left Floating Controls: Layer Switcher & Tracking HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-auto">
        {/* Layer Switcher Capsule */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl text-white">
          <button
            type="button"
            onClick={() => setActiveLayer('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLayer === 'satellite'
                ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🛰️ Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('coastal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLayer === 'coastal'
                ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🌊 Coastal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('topo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLayer === 'topo'
                ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>⛰️ Topo</span>
          </button>
        </div>

        {/* Real-Time Movement Tracking Capsule */}
        {showTrailOverlay && !currentNavTarget && (
          <div className="flex flex-col bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 shadow-2xl text-white space-y-2 max-w-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-emerald-300">
                  Live GPS Tracker
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded-md">
                {speedTelemetry}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-100 truncate">
              📍 {currentWaypointName}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTrackingPlaying((prev) => !prev)}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                  title={isTrackingPlaying ? 'Pause Tracking' : 'Resume Tracking'}
                >
                  {isTrackingPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const path = trackingMode === 'trekker' ? CLIFF_TREK_PATH : BOAT_FERRY_PATH;
                    setTrackerIndex(0);
                    if (trackingMarkerRef.current) trackingMarkerRef.current.setLatLng(path[0]);
                  }}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                  title="Restart Track"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setAutoFollow((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    autoFollow ? 'bg-sky-500 text-white' : 'bg-white/15 text-slate-300 hover:bg-white/25'
                  }`}
                  title="Toggle Auto-Follow Camera"
                >
                  Follow
                </button>
              </div>

              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setTrackingMode('trekker')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    trackingMode === 'trekker' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚶 Trek
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingMode('ferry')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    trackingMode === 'ferry' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🛥️ Ferry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Top-Right Floating Controls: Pin Drop, Fullscreen, Locate */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Drop Pin Mode Trigger (Only enabled when survey/pin-drop mode is explicitly enabled) */}
        {enablePinDrop && (
          <button
            type="button"
            onClick={() => {
              if (isPinDropMode) {
                handleCancelDroppedPin();
              } else {
                setIsPinDropMode(true);
              }
            }}
            className={`px-3 py-2 rounded-xl backdrop-blur-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-xl cursor-pointer border ${
              isPinDropMode
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300 animate-pulse'
                : 'bg-slate-900/90 text-white border-white/20 hover:bg-slate-800'
            }`}
            title="Click to drop a custom pin anywhere on satellite imagery"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isPinDropMode ? 'Click Map to Drop' : '+ Drop Pin'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const map = mapInstanceRef.current;
            if (!map || !navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                if (userGpsMarkerRef.current) {
                  userGpsMarkerRef.current.setLatLng([latitude, longitude]);
                } else {
                  userGpsMarkerRef.current = L.circleMarker([latitude, longitude], {
                    radius: 8,
                    fillColor: '#3B82F6',
                    color: '#FFFFFF',
                    weight: 3,
                    fillOpacity: 0.9,
                  }).addTo(map);
                }
                map.flyTo([latitude, longitude], 16, { duration: 1 });
              },
              (err) => {
                console.warn('Geolocation disabled:', err);
                map.flyTo([14.5285, 74.3165], 16, { duration: 1 });
              }
            );
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white border border-white/20 hover:bg-slate-800 transition-all shadow-xl cursor-pointer"
          title="Locate My Position"
        >
          <Locate className="w-4 h-4 text-sky-300" />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white border border-white/20 hover:bg-slate-800 transition-all shadow-xl cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* 4. ACTIVE TURN-BY-TURN NAVIGATION COCKPIT HUD */}
      {currentNavTarget && (
        <div className="absolute top-4 inset-x-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[420px] max-w-lg z-40 bg-slate-900/95 backdrop-blur-xl text-white p-3 sm:p-3.5 rounded-2xl border border-emerald-400/40 shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Animated Compass Heading */}
              <div
                className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 font-bold transition-transform duration-500 shrink-0"
                style={{ transform: `rotate(${navBearing.deg}deg)` }}
                title={`Bearing: ${navBearing.deg}° ${navBearing.cardinal}`}
              >
                <Navigation className="w-5 h-5 fill-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Navigating Live
                  </span>
                </div>
                <h4 className="font-serif text-sm font-bold text-white truncate">
                  {currentNavTarget.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono mt-0.5">
                  <span className="font-bold text-white">
                    {navDistanceKm < 1 ? `${Math.round(navDistanceKm * 1000)}m` : `${navDistanceKm.toFixed(1)} km`}
                  </span>
                  <span>•</span>
                  <span>~{navWalkMins} min walk</span>
                  <span>•</span>
                  <span>{navBearing.cardinal} ({navBearing.deg}°)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEndNav}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              End Nav
            </button>
          </div>
        </div>
      )}

      {/* 5. DROP PIN FORM MODAL */}
      {droppedCoords && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveDroppedPin}
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-slate-900 pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <h3 className="font-serif text-base font-bold text-slate-900">Add Map Location</h3>
              </div>
              <button
                type="button"
                onClick={handleCancelDroppedPin}
                className="text-slate-400 hover:text-slate-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Sunset Dolphin Point, Secret Cave"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={locationCategory}
                  onChange={(e) => setLocationCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-medium bg-white"
                >
                  <option value="viewpoint">🌅 Viewpoint / Sunset</option>
                  <option value="cove">🏖️ Secret Cove / Beach</option>
                  <option value="cafe">☕ Cafe / Food Shack</option>
                  <option value="homestay">🏡 Homestay / Cottage</option>
                  <option value="jetty">🛥️ Boat Jetty / Ferry</option>
                  <option value="trail">🚶 Trailhead / Steps</option>
                  <option value="shrine">🛕 Sacred Shrine / Temple</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Notes & Tips (Optional)
                </label>
                <textarea
                  rows={2}
                  value={locationDesc}
                  onChange={(e) => setLocationDesc(e.target.value)}
                  placeholder="e.g. Best sunset spot, rocky descent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                GPS: {droppedCoords[0].toFixed(5)}° N, {droppedCoords[1].toFixed(5)}° E
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelDroppedPin}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
              >
                Save Pin 📍
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Custom Location Preview Popup */}
      {activeCustomLocationPreview && (
        <div className="absolute bottom-4 left-4 sm:left-auto sm:right-4 z-30 max-w-sm w-full p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 animate-in fade-in slide-in-from-bottom-3 pointer-events-auto text-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {activeCustomLocationPreview.category === 'viewpoint' && '🌅'}
                {activeCustomLocationPreview.category === 'cove' && '🏖️'}
                {activeCustomLocationPreview.category === 'cafe' && '☕'}
                {activeCustomLocationPreview.category === 'homestay' && '🏡'}
                {activeCustomLocationPreview.category === 'jetty' && '🛥️'}
                {activeCustomLocationPreview.category === 'trail' && '🚶'}
                {activeCustomLocationPreview.category === 'shrine' && '🛕'}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                  {activeCustomLocationPreview.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  {activeCustomLocationPreview.name}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveCustomLocationPreview(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {activeCustomLocationPreview.description && (
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {activeCustomLocationPreview.description}
            </p>
          )}

          <div className="text-[10px] font-mono text-slate-400 mt-2">
            GPS: {activeCustomLocationPreview.lat.toFixed(4)}° N, {activeCustomLocationPreview.lng.toFixed(4)}° E
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() =>
                handleStartNav({
                  id: activeCustomLocationPreview.id,
                  name: activeCustomLocationPreview.name,
                  category: activeCustomLocationPreview.category,
                  coords: [activeCustomLocationPreview.lat, activeCustomLocationPreview.lng],
                })
              }
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate Here 🧭</span>
            </button>

            {activeCustomLocationPreview.isCustom && onDeleteCustomLocation && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomLocation(activeCustomLocationPreview.id);
                  setActiveCustomLocationPreview(null);
                }}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200"
                title="Delete custom location"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Floating Homestay Preview Card */}
      {activeStayPreview && (
        <div className="absolute bottom-4 right-4 z-30 max-w-sm w-full p-3.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 animate-in fade-in slide-in-from-bottom-3 pointer-events-auto">
          <div className="flex gap-3">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
              <img
                src={activeStayPreview.imageUrls[0]}
                alt={activeStayPreview.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                20% HOLD
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {activeStayPreview.location_display}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStayPreview(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold leading-none p-1"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 font-serif">
                {activeStayPreview.title}
              </h4>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Direct Host: {activeStayPreview.host_name}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    ₹{activeStayPreview.price_per_night}
                  </span>
                  <span className="text-[10px] text-slate-500"> / night</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const coords = HOMESTAY_COORDINATES[activeStayPreview.id] || [14.5240, 74.3180];
                      handleStartNav({
                        id: activeStayPreview.id,
                        name: activeStayPreview.title,
                        category: 'homestay',
                        coords,
                      });
                    }}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all border border-sky-200"
                    title="Navigate to Homestay"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                  {onBookStay && (
                    <button
                      type="button"
                      onClick={() => onBookStay(activeStayPreview)}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
                    >
                      Book 📅
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
