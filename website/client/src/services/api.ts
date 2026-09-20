import { Homestay, Booking, TransitRoute, DatabaseTableInfo } from '../types';

const API_BASE = '/api';

export const api = {
  // Homestays
  async getHomestays(params?: { location?: string; search?: string; checkIn?: string; checkOut?: string }): Promise<Homestay[]> {
    const q = new URLSearchParams();
    if (params?.location && params.location !== 'all') q.set('location', params.location);
    if (params?.search) q.set('search', params.search);
    if (params?.checkIn) q.set('checkIn', params.checkIn);
    if (params?.checkOut) q.set('checkOut', params.checkOut);

    const res = await fetch(`${API_BASE}/homestays?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch homestays');
    return res.json();
  },

  async getHomestay(id: string, checkIn?: string, checkOut?: string): Promise<Homestay> {
    const q = new URLSearchParams();
    if (checkIn) q.set('checkIn', checkIn);
    if (checkOut) q.set('checkOut', checkOut);

    const res = await fetch(`${API_BASE}/homestays/${id}?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch homestay details');
    return res.json();
  },

  async getAvailability(from: string, to: string): Promise<Record<string, number>> {
    const q = new URLSearchParams({ from, to });
    const res = await fetch(`${API_BASE}/homestays/availability?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    const data = await res.json();
    return data.dates || {};
  },

  async getHomestayAvailability(id: string, from: string, to: string): Promise<Record<string, number>> {
    const q = new URLSearchParams({ from, to });
    const res = await fetch(`${API_BASE}/homestays/${id}/availability?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch stay availability');
    const data = await res.json();
    return data.dates || {};
  },

  async createHomestay(data: Partial<Homestay>): Promise<Homestay> {
    const res = await fetch(`${API_BASE}/homestays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create homestay');
    }
    return res.json();
  },

  async deleteHomestay(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/homestays/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete homestay');
  },

  // Bookings
  async getBookings(phone?: string): Promise<Booking[]> {
    const q = new URLSearchParams();
    if (phone) q.set('phone', phone);
    const res = await fetch(`${API_BASE}/bookings?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async createBooking(booking: {
    homestay_id: string;
    user_name: string;
    user_phone: string;
    check_in: string;
    check_out: string;
    guests_count: number;
  }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create booking');
    }
    return res.json();
  },

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
  },

  // Routes
  async getRoutes(): Promise<TransitRoute[]> {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  // Database Studio
  async getDbStats(): Promise<{ homestays: number; bookings: number; users: number; blockedDates: number }> {
    const res = await fetch(`${API_BASE}/db/stats`);
    if (!res.ok) throw new Error('Failed to fetch db stats');
    return res.json();
  },

  async getDbTables(): Promise<DatabaseTableInfo[]> {
    const res = await fetch(`${API_BASE}/db/tables`);
    if (!res.ok) throw new Error('Failed to fetch db tables');
    return res.json();
  },

  async getTableRows(name: string): Promise<{ table: string; columns: any[]; rows: any[] }> {
    const res = await fetch(`${API_BASE}/db/table/${name}`);
    if (!res.ok) throw new Error(`Failed to fetch rows for table ${name}`);
    return res.json();
  },

  async runCustomQuery(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/db/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SQL query execution failed');
    return data;
  },

  async resetDatabase(): Promise<void> {
    const res = await fetch(`${API_BASE}/db/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
  }
};
