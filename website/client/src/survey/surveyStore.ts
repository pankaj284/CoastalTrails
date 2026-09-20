import { SurveyPoint, GeoJsonFeatureCollection, GeoJsonFeature } from './surveyTypes';

const STORAGE_KEY = 'gokarna_field_survey_v1';

export const BASELINE_SURVEY_POINTS: SurveyPoint[] = [
  {
    id: 'pt-dolphin-rock',
    name: 'Dolphin Sunset Rock',
    category: 'viewpoint',
    lat: 14.5232,
    lng: 74.3174,
    elevationMeters: 48,
    accessibility: 'moderate_trek',
    tideCondition: 'all_tides_safe',
    notes: 'High laterite cliff ledge between Kudle and Om. Exceptional vantage point for spotting playful humpback dolphins in the late afternoon.',
    secretTips: 'Reach before 5:15 PM for prime golden-hour lighting; carry a headlamp for descent.',
    surveyorName: 'Field Scout',
    surveyedAt: '2026-09-18T16:45:00Z',
    tags: ['dolphins', 'sunset', 'cliff-ledge'],
    verified: true,
  },
  {
    id: 'pt-shiva-spring',
    name: 'Om Beach Shiva Freshwater Spring Cave',
    category: 'freshwater_spring',
    lat: 14.5142,
    lng: 74.3212,
    elevationMeters: 12,
    accessibility: 'rock_scramble',
    tideCondition: 'low_tide_only',
    notes: 'Natural freshwater seepage emerging beneath huge granite monoliths near southern Om Beach crescent.',
    secretTips: 'Accessible only during mid to low tide. Rocks can be slippery with sea moss.',
    surveyorName: 'Field Scout',
    surveyedAt: '2026-09-18T17:15:00Z',
    tags: ['freshwater', 'cave', 'shrine'],
    verified: true,
  },
  {
    id: 'pt-half-moon-cliff',
    name: 'Half Moon Clifftop Cave & Perch',
    category: 'secret_cove',
    lat: 14.5097,
    lng: 74.3248,
    elevationMeters: 36,
    accessibility: 'moderate_trek',
    tideCondition: 'all_tides_safe',
    notes: 'Elevated viewpoint looking directly down onto Half Moon cove crystal waters and fishing dhows.',
    secretTips: 'Steep gravel footing along narrow ridge; good hiking footwear required.',
    surveyorName: 'Field Scout',
    surveyedAt: '2026-09-19T08:30:00Z',
    tags: ['coastal-trail', 'half-moon', 'viewpoint'],
    verified: true,
  },
  {
    id: 'pt-belekan-jetty',
    name: 'Belekan Fishing Creek Jetty',
    category: 'boat_jetty',
    lat: 14.5018,
    lng: 74.3315,
    elevationMeters: 4,
    accessibility: 'easy_walk',
    tideCondition: 'all_tides_safe',
    notes: 'Southern terminus trailhead for the 5-beach trek. Local motorized boat operators anchor here for return transit to Om Beach.',
    secretTips: 'Negotiate ferry rides before boarding or ask local fisherman cooperative stall.',
    surveyorName: 'Field Scout',
    surveyedAt: '2026-09-19T09:10:00Z',
    tags: ['jetty', 'ferry', 'trailhead', 'southern-terminus'],
    verified: true,
  },
];

export function getSurveyPoints(): SurveyPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BASELINE_SURVEY_POINTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BASELINE_SURVEY_POINTS;
  } catch (e) {
    console.error('Error loading survey points from localStorage:', e);
    return BASELINE_SURVEY_POINTS;
  }
}

export function saveSurveyPoints(points: SurveyPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch (e) {
    console.error('Error saving survey points to localStorage:', e);
  }
}

export function exportToGeoJson(points: SurveyPoint[]): string {
  const collection: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    name: 'Gokarna_Field_Survey_Waypoints',
    features: points.map((p): GeoJsonFeature => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat], // GeoJSON standard is [longitude, latitude]
      },
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        elevationMeters: p.elevationMeters,
        accessibility: p.accessibility,
        tideCondition: p.tideCondition,
        notes: p.notes,
        secretTips: p.secretTips,
        surveyorName: p.surveyorName,
        surveyedAt: p.surveyedAt,
        tags: p.tags,
        verified: p.verified,
      },
    })),
  };
  return JSON.stringify(collection, null, 2);
}

export function exportToJson(points: SurveyPoint[]): string {
  return JSON.stringify(points, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
