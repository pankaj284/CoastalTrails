import type { Booking, BookingStatus, Homestay } from '../types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return res.json();
}

export interface TrendPoint {
  date: string;
  count: number;
  amount: number;
}

export interface TopStay {
  id: string;
  title: string;
  location: string;
  total_rooms: number;
  price: number;
  bookedTonight: number;
  upcomingBlocks: number;
  totalBookings: number;
}

export interface AdminStats {
  stayCount: number;
  bookingCount: number;
  hostCount: number;
  holdsPaid: number;
  upcoming: number;
  statusBreakdown: Record<string, number>;
  arrivalsToday: number;
  departuresToday: number;
  trend: TrendPoint[];
  topStays: TopStay[];
  enclaves: { label: string; c: number }[];
}

export interface HostRow {
  host_name: string;
  host_whatsapp: string;
  stay_count: number;
  rooms: number;
  stays?: Homestay[];
  holdsPaid?: number;
  upcoming?: number;
  awaiting?: number;
  verified?: boolean;
  rating?: number;
}

export interface Enclave {
  id: string;
  label: string;
  sort_order: number;
}

export interface RoomDay {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
  source: 'system' | 'booking' | 'stay' | 'admin';
  stayReason: string | null;
}

export interface RoomSegment {
  type: 'booking' | 'blocked' | 'maintenance';
  start: string;
  end: string;
  reason?: string;
  id?: string;
  guest?: string;
  phone?: string;
  channel?: string;
  ref?: string;
  guests?: number;
  amount?: number;
  advance?: number;
  status?: string;
}

export interface RoomRow {
  number: number;
  name: string;
  bed_type: string;
  capacity: number;
  housekeeping: 'clean' | 'dirty' | 'inspecting';
  photo: string | null;
  segments: RoomSegment[];
  days: RoomDay[];
}

export interface StaySettings {
  min_stay: number;
  price_override: number | null;
}

export interface RoomStatusResponse {
  stay: {
    id: string;
    title: string;
    total_rooms: number;
    host_name: string;
    price_per_night: number;
    location_display: string;
  };
  settings: StaySettings;
  start: string;
  days: number;
  rooms: RoomRow[];
}

export const api = {
  getEnclaves(): Promise<Enclave[]> {
    return request('/enclaves');
  },
  createEnclave(label: string): Promise<Enclave> {
    return request('/enclaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
  },
  uploadPhoto(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('photo', file);
    return request('/upload', { method: 'POST', body: form });
  },
  getStats(): Promise<AdminStats> {
    return request('/admin/stats');
  },
  getAllStays(): Promise<Homestay[]> {
    return request('/admin/homestays');
  },
  getAllBookings(): Promise<Booking[]> {
    return request('/admin/bookings');
  },
  getHosts(): Promise<HostRow[]> {
    return request('/admin/hosts');
  },
  createStay(
    data: Partial<Homestay> & { images?: ({ url: string; category: string } | string)[]; badges?: string[] },
  ): Promise<Homestay> {
    return request('/homestays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  updateStay(id: string, data: Partial<Homestay> & { badges?: string[] }): Promise<Homestay> {
    return request(`/homestays/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  deleteStay(id: string): Promise<{ success: boolean }> {
    return request(`/homestays/${id}`, { method: 'DELETE' });
  },
  setBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    return request(`/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },
  blockDate(id: string, date: string): Promise<{ success: boolean }> {
    return request(`/homestays/${id}/block-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
  },
  unblockDate(id: string, date: string): Promise<{ success: boolean }> {
    return request(`/homestays/${id}/block-date`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
  },
  getRoomStatus(id: string, start: string, days: number): Promise<RoomStatusResponse> {
    return request(`/admin/stays/${id}/room-status?start=${start}&days=${days}`);
  },
  setRoomStatus(payload: {
    homestay_id: string;
    room_number: number;
    date: string;
    status: 'available' | 'maintenance' | 'blocked';
    reason?: string;
  }): Promise<{ success: boolean }> {
    return request('/admin/room-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  setRoomState(payload: {
    homestay_id: string;
    room_number: number;
    name?: string;
    bed_type?: string;
    capacity?: number;
    housekeeping?: 'clean' | 'dirty' | 'inspecting';
    photo?: string | null;
  }): Promise<{ success: boolean }> {
    return request('/admin/room-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  setStaySettings(payload: {
    homestay_id: string;
    min_stay?: number;
    price_override?: number | null;
  }): Promise<{ success: boolean }> {
    return request('/admin/stay-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  extendBooking(id: string, check_out: string): Promise<{ success: boolean }> {
    return request(`/admin/bookings/${id}/extend`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ check_out }),
    });
  },
};
