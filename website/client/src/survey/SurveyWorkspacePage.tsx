import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
  FileCode2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react';
import { SurveyPoint, SurveyCategory, TrailAccessibility, TideCondition } from './surveyTypes';
import {
  getSurveyPoints,
  saveSurveyPoints,
  exportToGeoJson,
  exportToJson,
  downloadFile,
  BASELINE_SURVEY_POINTS,
} from './surveyStore';

export const SurveyWorkspacePage: React.FC = () => {
  const [points, setPoints] = useState<SurveyPoint[]>(() => getSurveyPoints());
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSurveyingActive, setIsSurveyingActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for new/edited point
  const [formLat, setFormLat] = useState<number | ''>('');
  const [formLng, setFormLng] = useState<number | ''>('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SurveyCategory>('viewpoint');
  const [formElevation, setFormElevation] = useState<number | ''>('');
  const [formAccessibility, setFormAccessibility] = useState<TrailAccessibility>('moderate_trek');
  const [formTide, setFormTide] = useState<TideCondition>('all_tides_safe');
  const [formNotes, setFormNotes] = useState('');
  const [formSecretTips, setFormSecretTips] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formSurveyor, setFormSurveyor] = useState('Gokarna Explorer');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const activePinMarkerRef = useRef<L.Marker | null>(null);

  // Persist points when updated
  useEffect(() => {
    saveSurveyPoints(points);
  }, [points]);

  // Category Emoji Map
  const categoryMeta: Record<SurveyCategory, { label: string; icon: string; color: string }> = {
    viewpoint: { label: 'Cliff Viewpoint', icon: '🌅', color: '#F59E0B' },
    secret_cove: { label: 'Secret Cove', icon: '🏖️', color: '#06B6D4' },
    rock_trail: { label: 'Trailhead / Path', icon: '🚶', color: '#10B981' },
    shrine: { label: 'Sacred Shrine', icon: '🛕', color: '#8B5CF6' },
    cafe_shack: { label: 'Shack / Cafe', icon: '☕', color: '#EC4899' },
    homestay: { label: 'Heritage Stay', icon: '🏡', color: '#3B82F6' },
    boat_jetty: { label: 'Ferry Landing', icon: '🛥️', color: '#0284C7' },
    freshwater_spring: { label: 'Freshwater Spring', icon: '💧', color: '#065F46' },
    danger_hazard: { label: 'Tidal Hazard / Cliff Drop', icon: '⚠️', color: '#EF4444' },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [14.5215, 74.3185],
      zoom: 14,
      maxZoom: 20,
      minZoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    // Google Satellite Hybrid High-Res Tiles
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      maxNativeZoom: 20,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click when surveying
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isSurveyingActive) return;
      const { lat, lng } = e.latlng;
      setFormLat(parseFloat(lat.toFixed(6)));
      setFormLng(parseFloat(lng.toFixed(6)));
      setIsFormOpen(true);

      if (activePinMarkerRef.current) {
        activePinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          html: `<div class="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold shadow-xl border-2 border-white animate-bounce text-base">📍</div>`,
          className: 'survey-drop-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        activePinMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isSurveyingActive]);

  // Render Survey Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    points.forEach((p) => {
      const isSelected = selectedPointId === p.id;
      const meta = categoryMeta[p.category] || { icon: '📍', color: '#64748B' };

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="w-8 h-8 rounded-full shadow-lg border-2 ${isSelected ? 'border-white ring-4 ring-emerald-400 bg-emerald-600' : 'border-white bg-slate-900'} text-white flex items-center justify-center text-sm">
            ${meta.icon}
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-mono whitespace-nowrap shadow-md pointer-events-none border border-white/20">
            ${p.name.substring(0, 15)}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'survey-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([p.lat, p.lng], { icon });
      marker.on('click', () => {
        setSelectedPointId(p.id);
      });
      marker.addTo(group);
    });
  }, [points, selectedPointId]);

  // Pan to selected point
  useEffect(() => {
    if (!selectedPointId || !mapInstanceRef.current) return;
    const pt = points.find((p) => p.id === selectedPointId);
    if (pt) {
      mapInstanceRef.current.flyTo([pt.lat, pt.lng], 16, { duration: 0.8 });
    }
  }, [selectedPointId]);

  const handleSavePoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (formLat === '' || formLng === '' || !formName.trim()) return;

    const newPt: SurveyPoint = {
      id: `pt-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      lat: Number(formLat),
      lng: Number(formLng),
      elevationMeters: formElevation === '' ? undefined : Number(formElevation),
      accessibility: formAccessibility,
      tideCondition: formTide,
      notes: formNotes.trim(),
      secretTips: formSecretTips.trim() || undefined,
      surveyorName: formSurveyor.trim() || 'Field Surveyor',
      surveyedAt: new Date().toISOString(),
      tags: formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      verified: true,
    };

    setPoints((prev) => [newPt, ...prev]);
    setSelectedPointId(newPt.id);
    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormLat('');
    setFormLng('');
    setFormName('');
    setFormNotes('');
    setFormSecretTips('');
    setFormTags('');
    if (activePinMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(activePinMarkerRef.current);
      activePinMarkerRef.current = null;
    }
  };

  const handleDeletePoint = (id: string) => {
    if (confirm('Delete this surveyed waypoint?')) {
      setPoints((prev) => prev.filter((p) => p.id !== id));
      if (selectedPointId === id) setSelectedPointId(null);
    }
  };

  const handleExportGeoJson = () => {
    const data = exportToGeoJson(points);
    downloadFile(data, `gokarna_survey_${new Date().toISOString().slice(0, 10)}.geojson`, 'application/geo+json');
  };

  const handleExportJson = () => {
    const data = exportToJson(points);
    downloadFile(data, `gokarna_survey_dataset_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
          // Imported GeoJSON
          const imported: SurveyPoint[] = parsed.features.map((f: any, idx: number) => ({
            id: f.properties?.id || `imp-${Date.now()}-${idx}`,
            name: f.properties?.name || 'Surveyed Landmark',
            category: f.properties?.category || 'viewpoint',
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            elevationMeters: f.properties?.elevationMeters,
            accessibility: f.properties?.accessibility || 'moderate_trek',
            tideCondition: f.properties?.tideCondition || 'all_tides_safe',
            notes: f.properties?.notes || '',
            secretTips: f.properties?.secretTips,
            surveyorName: f.properties?.surveyorName || 'Imported',
            surveyedAt: f.properties?.surveyedAt || new Date().toISOString(),
            tags: f.properties?.tags || [],
            verified: true,
          }));
          setPoints((prev) => [...imported, ...prev]);
          alert(`Successfully imported ${imported.length} waypoints from GeoJSON!`);
        } else if (Array.isArray(parsed)) {
          // Imported JSON Array
          setPoints(parsed);
          alert(`Successfully imported ${parsed.length} survey waypoints!`);
        } else {
          alert('Invalid file format. Please upload valid GeoJSON or JSON.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyGps = (lat: number, lng: number, id: string) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPoints = points.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedPoint = points.find((p) => p.id === selectedPointId);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Gokarna Field Survey & GPS Waypoint Studio
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Standalone Module
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Survey coastal cliffs, secret coves, springs & trailheads. Export ready for future integration.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Survey Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsSurveyingActive((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
              isSurveyingActive
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 animate-pulse'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>{isSurveyingActive ? 'Survey Mode Active (Click Map)' : '+ New Waypoint'}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            type="button"
            onClick={handleExportGeoJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Download GeoJSON FeatureCollection"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>GeoJSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Download Raw JSON Dataset"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON</span>
          </button>

          {/* Import Button */}
          <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import</span>
            <input
              type="file"
              accept=".json,.geojson"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Survey Waypoint Registry & Inspector */}
        <div className="lg:col-span-4 xl:col-span-4 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search waypoints, tags, notes..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 rounded-xl text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Categories ({points.length})</option>
                {Object.entries(categoryMeta).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>

              <span className="font-mono text-[11px] text-slate-400">
                {filteredPoints.length} surveyed
              </span>
            </div>
          </div>

          {/* List of Survey Points */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredPoints.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No waypoints match this filter. Click map to log a new spot!
              </div>
            ) : (
              filteredPoints.map((pt) => {
                const isSelected = selectedPointId === pt.id;
                const meta = categoryMeta[pt.category] || { icon: '📍', label: pt.category };

                return (
                  <div
                    key={pt.id}
                    onClick={() => setSelectedPointId(pt.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{meta.icon}</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">
                            {pt.name}
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePoint(pt.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {pt.notes}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>
                        {pt.lat.toFixed(5)}°N, {pt.lng.toFixed(5)}°E
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyGps(pt.lat, pt.lng, pt.id);
                        }}
                        className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                      >
                        {copiedId === pt.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy GPS</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Point Inspector Drawer */}
          {selectedPoint && (
            <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Field Specs</span>
                <span className="font-mono text-[10px] text-slate-500">{selectedPoint.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-mono">Elevation</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedPoint.elevationMeters ? `${selectedPoint.elevationMeters}m` : 'Sea Level'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-mono">Access</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedPoint.accessibility.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {selectedPoint.secretTips && (
                <div className="bg-amber-950/30 border border-amber-900/50 p-2 rounded-xl text-amber-300 text-[11px]">
                  💡 <strong>Secret Tip:</strong> {selectedPoint.secretTips}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: High-Resolution Satellite Survey GIS Canvas */}
        <div className="lg:col-span-8 xl:col-span-8 relative h-full min-h-[500px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Overlay Crosshair Instructions */}
          {isSurveyingActive && (
            <div className="absolute top-4 left-4 z-20 bg-rose-950/90 text-white px-4 py-2 rounded-2xl border border-rose-500 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-pulse">
              <Crosshair className="w-4 h-4 text-rose-400" />
              <span>Click anywhere on coastline satellite to log coordinate</span>
            </div>
          )}

          {/* New Point Modal Form */}
          {isFormOpen && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSavePoint}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl text-slate-200"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <h3 className="font-bold text-sm text-white">Log Field Waypoint</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Waypoint Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Dolphin Ledge Sunset Point"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        {Object.entries(categoryMeta).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.icon} {v.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Elevation (m)
                      </label>
                      <input
                        type="number"
                        value={formElevation}
                        onChange={(e) =>
                          setFormElevation(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="e.g. 42"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Field Notes & Terrain Description
                    </label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Granite ledge, slippery during monsoon, dolphin sighting hub..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Secret Tips / Best Time
                    </label>
                    <input
                      type="text"
                      value={formSecretTips}
                      onChange={(e) => setFormSecretTips(e.target.value)}
                      placeholder="e.g. Visit at low tide before 5 PM"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formLat}
                        onChange={(e) =>
                          setFormLat(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formLng}
                        onChange={(e) =>
                          setFormLng(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all"
                  >
                    Log Waypoint 📌
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
