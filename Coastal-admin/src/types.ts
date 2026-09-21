export interface Homestay {
  id: string;
  title: string;
  subtitle: string;
  location: string;
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
  imageCategories?: string[];
  amenities: string[];
  verifiedBadges: string[];
  blockedDates: string[];
  blockedReasons?: string[];
  bookingsCount?: number;
}

export type BookingStatus = 'awaiting_host' | 'confirmed' | 'declined' | 'cancelled';

export interface Booking {
  id: string;
  reference_code: string;
  homestay_id: string;
  homestay_title?: string;
  location_display?: string;
  host_name?: string;
  host_whatsapp?: string;
  subtitle?: string;
  stay_image?: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  user_profile_name?: string;
  channel?: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  advance_paid: number;
  balance_payable_at_property: number;
  status: BookingStatus;
  created_at: string;
  hold_expires_at?: string;
  roomSummary?: { free: number; booked: number; blocked: number; maint: number };
}

export interface OwnerStats {
  stayCount: number;
  bookingCount: number;
  upcoming: number;
  holdsPaid: number;
}

export interface Owner {
  name: string;
  phone: string;
}
