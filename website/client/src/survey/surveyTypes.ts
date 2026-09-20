export type SurveyCategory =
  | 'viewpoint'
  | 'secret_cove'
  | 'rock_trail'
  | 'shrine'
  | 'cafe_shack'
  | 'homestay'
  | 'boat_jetty'
  | 'freshwater_spring'
  | 'danger_hazard';

export type TrailAccessibility =
  | 'easy_walk'
  | 'moderate_trek'
  | 'rock_scramble'
  | 'steep_cliffs'
  | 'boat_only';

export type TideCondition =
  | 'all_tides_safe'
  | 'low_tide_only'
  | 'high_tide_submerged'
  | 'monsoon_closed';

export interface SurveyPoint {
  id: string;
  name: string;
  category: SurveyCategory;
  lat: number;
  lng: number;
  elevationMeters?: number;
  accessibility: TrailAccessibility;
  tideCondition: TideCondition;
  notes: string;
  secretTips?: string;
  surveyorName: string;
  surveyedAt: string;
  tags: string[];
  verified: boolean;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] GIS GeoJSON standard
  };
  properties: {
    id: string;
    name: string;
    category: string;
    elevationMeters?: number;
    accessibility: string;
    tideCondition: string;
    notes: string;
    secretTips?: string;
    surveyorName: string;
    surveyedAt: string;
    tags: string[];
    verified: boolean;
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  name: 'Gokarna_Field_Survey_Waypoints';
  features: GeoJsonFeature[];
}
