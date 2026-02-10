-- ============================================
-- MeBike PostgreSQL Schema with PostGIS
-- For ChartDB visualization
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
-- UUID v7 for time-ordered UUIDs (PG17+ with pg_uuidv7, or PG18 native)
-- If pg_uuidv7 not available, use gen_random_uuid() as fallback

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE bike_status AS ENUM (
  'AVAILABLE',
  'BOOKED',
  'BROKEN',
  'RESERVED',
  'MAINTAINED',
  'UNAVAILABLE'
);

CREATE TYPE rental_status AS ENUM (
  'RENTING',
  'COMPLETED',
  'CANCELLED',
  'RESERVED'
);

CREATE TYPE reservation_status AS ENUM (
  'PENDING',
  'ACTIVE',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE reservation_option AS ENUM (
  'ONE_TIME',
  'FIXED_SLOT',
  'SUBSCRIPTION'
);

CREATE TYPE report_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'CANNOT_RESOLVE',
  'CANCELLED'
);

CREATE TYPE report_priority AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE user_role AS ENUM (
  'USER',
  'STAFF',
  'ADMIN',
  'SOS'
);

CREATE TYPE user_verify_status AS ENUM (
  'UNVERIFIED',
  'VERIFIED',
  'BANNED'
);

CREATE TYPE supplier_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'TERMINATED'
);

CREATE TYPE subscription_status AS ENUM (
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'CANCELLED'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone_number TEXT,
  username TEXT,
  avatar TEXT,
  location TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  verify user_verify_status NOT NULL DEFAULT 'UNVERIFIED',
  nfc_card_uid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone_number TEXT,
  contract_fee DECIMAL(12, 2),
  status supplier_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stations (PRIMARY FOCUS)
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  -- PostGIS geography column (SRID 4326 = WGS84)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bikes
CREATE TABLE bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id TEXT NOT NULL UNIQUE,
  station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status bike_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  max_usages INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status subscription_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixed Slot Templates
CREATE TABLE fixed_slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rentals
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  bike_id UUID REFERENCES bikes(id),
  start_station_id UUID NOT NULL REFERENCES stations(id),
  end_station_id UUID REFERENCES stations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status rental_status NOT NULL DEFAULT 'RENTING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  bike_id UUID REFERENCES bikes(id),
  station_id UUID NOT NULL REFERENCES stations(id),
  fixed_slot_template_id UUID REFERENCES fixed_slot_templates(id),
  subscription_id UUID REFERENCES subscriptions(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  prepaid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  reservation_option reservation_option NOT NULL DEFAULT 'ONE_TIME',
  status reservation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  bike_id UUID REFERENCES bikes(id),
  station_id UUID REFERENCES stations(id),
  rental_id UUID REFERENCES rentals(id),
  assignee_id UUID REFERENCES users(id),
  location GEOGRAPHY(POINT, 4326),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  priority report_priority NOT NULL DEFAULT 'NORMAL',
  media_urls TEXT[],
  status report_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  rental_id UUID NOT NULL REFERENCES rentals(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rental Audit Logs
CREATE TABLE rental_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  reason TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Spatial indexes
CREATE INDEX idx_stations_location ON stations USING GIST (location);
CREATE INDEX idx_reports_location ON reports USING GIST (location);

-- Station indexes
CREATE INDEX idx_stations_name ON stations(name);

-- Bike indexes
CREATE INDEX idx_bikes_station ON bikes(station_id);
CREATE INDEX idx_bikes_status ON bikes(status);
CREATE INDEX idx_bikes_supplier ON bikes(supplier_id);

-- Rental indexes
CREATE INDEX idx_rentals_user ON rentals(user_id);
CREATE INDEX idx_rentals_bike ON rentals(bike_id);
CREATE INDEX idx_rentals_start_station ON rentals(start_station_id);
CREATE INDEX idx_rentals_end_station ON rentals(end_station_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_time ON rentals(start_time, end_time);

-- Reservation indexes
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Report indexes
CREATE INDEX idx_reports_station ON reports(station_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(type);

-- Rating indexes
CREATE INDEX idx_ratings_rental ON ratings(rental_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
