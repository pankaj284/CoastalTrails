export interface Homestay {
  id: string;
  title: string;
  subtitle: string;
  location: 'kudle' | 'om' | 'mainBeach' | 'halfMoon' | 'paradise' | 'town';
  location_display: string;
  price_per_night: number;
  rating: number;
  reviews_count: number;
  host_name: string;
  host_whatsapp: string;
  is_host_verified: number | boolean;
  walking_minutes_to_beach: number;
  total_rooms: number;
  description: string;
  imageUrls: string[];
  amenities: string[];
  verifiedBadges: string[];
  blockedDates: string[];
  advanceDeposit: number;
  balanceAtCheckIn: number;
  isAvailable?: boolean;
  availableRooms?: number;
}

export interface Booking {
  id: string;
  reference_code: string;
  homestay_id: string;
  homestay_title?: string;
  location_display?: string;
  host_name?: string;
  host_whatsapp?: string;
  user_name: string;
  user_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  advance_paid: number;
  balance_payable_at_property: number;
  status: 'awaiting_host' | 'confirmed' | 'declined' | 'cancelled';
  created_at: string;
  hold_expires_at?: string;
  nights?: number;
  whatsapp_link?: string;
}

export interface TransitRoute {
  id: string;
  start_point: string;
  start_subtext: string;
  destination: string;
  destination_subtext: string;
  distance_km: number;
  walking_mins: number;
  scooter_mins: number;
  car_mins: number;
  bus_mins: number;
  active_mode: string;
}

export interface DatabaseTableInfo {
  name: string;
  count: number;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: boolean;
    dflt_value: any;
    pk: boolean;
  }[];
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface CustomMapLocation {
  id: string;
  name: string;
  category: 'viewpoint' | 'cove' | 'cafe' | 'homestay' | 'jetty' | 'trail' | 'shrine';
  lat: number;
  lng: number;
  description?: string;
  tips?: string;
  createdAt?: string;
  isCustom?: boolean;
}

export interface NavigationTarget {
  id: string;
  name: string;
  category?: string;
  coords: [number, number];
  distanceKm?: number;
}
