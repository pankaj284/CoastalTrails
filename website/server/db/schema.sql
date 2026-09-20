-- Gokarna Connect Shared Database Schema
-- Shared between Flutter Mobile APK and Web Portal

PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'traveler', -- 'traveler', 'host', 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Homestays Master Table
CREATE TABLE IF NOT EXISTS homestays (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    location TEXT NOT NULL, -- 'kudle', 'om', 'mainBeach', 'halfMoon', 'paradise', 'town'
    location_display TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    rating REAL DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    host_name TEXT NOT NULL,
    host_whatsapp TEXT NOT NULL,
    is_host_verified INTEGER DEFAULT 1,
    walking_minutes_to_beach INTEGER DEFAULT 3,
    total_rooms INTEGER DEFAULT 3,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Homestay Images
CREATE TABLE IF NOT EXISTS homestay_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homestay_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

-- 4. Homestay Amenities
CREATE TABLE IF NOT EXISTS homestay_amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homestay_id TEXT NOT NULL,
    amenity TEXT NOT NULL,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

-- 5. Homestay Verified Badges
CREATE TABLE IF NOT EXISTS homestay_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homestay_id TEXT NOT NULL,
    badge TEXT NOT NULL,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

-- 6. Room Unavailability (Booked / Host-Blocked dates)
CREATE TABLE IF NOT EXISTS room_unavailability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homestay_id TEXT NOT NULL,
    blocked_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    reason TEXT DEFAULT 'booking', -- 'booking', 'maintenance', 'host_hold'
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE,
    UNIQUE(homestay_id, blocked_date)
);

-- 6b. Per-Room Status Overrides (admin control center)
CREATE TABLE IF NOT EXISTS room_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homestay_id TEXT NOT NULL,
    room_number INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'maintenance', 'blocked'
    reason TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE,
    UNIQUE(homestay_id, room_number, date)
);

-- 6c. Per-Room State (housekeeping, bed setup, capacity, photo)
CREATE TABLE IF NOT EXISTS room_state (
    homestay_id TEXT NOT NULL,
    room_number INTEGER NOT NULL,
    name TEXT,
    bed_type TEXT DEFAULT 'King Bed',
    capacity INTEGER DEFAULT 2,
    housekeeping TEXT DEFAULT 'clean', -- 'clean', 'dirty', 'inspecting'
    photo TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (homestay_id, room_number),
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

-- 6d. Stay-Level Settings (min stay, festival price override)
CREATE TABLE IF NOT EXISTS stay_settings (
    homestay_id TEXT PRIMARY KEY,
    min_stay INTEGER DEFAULT 1,
    price_override REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE
);

-- 7. Bookings Table (Shared with 20% Advance / 80% Check-in Model)
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    reference_code TEXT UNIQUE NOT NULL,
    homestay_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    check_in TEXT NOT NULL, -- YYYY-MM-DD
    check_out TEXT NOT NULL, -- YYYY-MM-DD
    guests_count INTEGER DEFAULT 1,
    total_amount REAL NOT NULL,
    advance_paid REAL NOT NULL,
    balance_payable_at_property REAL NOT NULL,
    status TEXT DEFAULT 'awaiting_host', -- 'awaiting_host', 'confirmed', 'declined', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    hold_expires_at DATETIME,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id)
);

-- 8. Transit Routes (For Figma Screen 3 Navigator)
CREATE TABLE IF NOT EXISTS transit_routes (    id TEXT PRIMARY KEY,
    start_point TEXT NOT NULL,
    start_subtext TEXT NOT NULL,
    destination TEXT NOT NULL,
    destination_subtext TEXT NOT NULL,
    distance_km REAL NOT NULL,
    walking_mins INTEGER NOT NULL,
    scooter_mins INTEGER NOT NULL,
    car_mins INTEGER NOT NULL,
    bus_mins INTEGER NOT NULL,
    active_mode TEXT DEFAULT 'scooter'
);

CREATE TABLE IF NOT EXISTS enclaves (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);
