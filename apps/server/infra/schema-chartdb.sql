-- ============================================
-- Stations + Bikes + Suppliers
-- ============================================

CREATE TYPE bike_status AS ENUM (
  'AVAILABLE',
  'BOOKED',
  'BROKEN',
  'RESERVED',
  'MAINTAINED',
  'UNAVAILABLE'
);

CREATE TYPE supplier_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'TERMINATED'
);

-- Suppliers (bikes belong to suppliers)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone_number TEXT,
  contract_fee DECIMAL,
  status supplier_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Stations (bikes are parked at stations)
CREATE TABLE stations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Bikes (belongs to supplier, parked at station)
CREATE TABLE bikes (
  id UUID PRIMARY KEY,
  chip_id TEXT NOT NULL UNIQUE,
  station_id UUID,
  supplier_id UUID,
  status bike_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_bikes_station FOREIGN KEY (station_id) REFERENCES stations(id),
  CONSTRAINT fk_bikes_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ============================================
-- Users + Auth ENUMs
-- ============================================

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

-- ============================================
-- Users
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identity
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT UNIQUE,
  username TEXT,
  password_hash TEXT NOT NULL,
  
  -- Profile
  avatar TEXT,
  location TEXT,
  nfc_card_uid TEXT,
  
  -- Verification
  email_verify_otp TEXT,
  email_verify_otp_expires TIMESTAMPTZ,
  forgot_password_otp TEXT,
  forgot_password_otp_expires TIMESTAMPTZ,
  
  -- Status
  role user_role NOT NULL DEFAULT 'USER',
  verify user_verify_status NOT NULL DEFAULT 'UNVERIFIED',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_nfc ON users(nfc_card_uid) WHERE nfc_card_uid IS NOT NULL;

-- ============================================
-- Subscriptions ENUMs
-- ============================================

CREATE TYPE subscription_status AS ENUM (
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'CANCELLED'
);

CREATE TYPE subscription_package AS ENUM (
  'basic',
  'premium',
  'unlimited'
);

-- ============================================
-- Subscriptions
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Plan details
  package_name subscription_package NOT NULL,
  max_usages INT,                    -- NULL = unlimited
  usage_count INT NOT NULL DEFAULT 0,
  
  -- Status & validity
  status subscription_status NOT NULL DEFAULT 'PENDING',
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Payment
  price DECIMAL(12,2) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

-- ============================================
-- Fixed Slot Templates ENUMs
-- ============================================

CREATE TYPE fixed_slot_status AS ENUM (
  'ACTIVE',
  'CANCELLED'
);

-- ============================================
-- Fixed Slot Templates
-- ============================================

CREATE TABLE fixed_slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  station_id UUID NOT NULL,
  
  -- Schedule
  slot_start TIME NOT NULL,              -- e.g., '07:00:00'
  
  -- Status
  status fixed_slot_status NOT NULL DEFAULT 'ACTIVE',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_fixed_slot_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_fixed_slot_station FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE INDEX idx_fixed_slot_user ON fixed_slot_templates(user_id);
CREATE INDEX idx_fixed_slot_station ON fixed_slot_templates(station_id);
CREATE INDEX idx_fixed_slot_status ON fixed_slot_templates(status);

-- ============================================
-- Fixed Slot Dates (normalized from selected_dates array)
-- ============================================

CREATE TABLE fixed_slot_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  
  CONSTRAINT fk_fixed_slot_dates_template FOREIGN KEY (template_id) REFERENCES fixed_slot_templates(id) ON DELETE CASCADE,
  CONSTRAINT uq_fixed_slot_date UNIQUE (template_id, slot_date)
);

CREATE INDEX idx_fixed_slot_dates_template ON fixed_slot_dates(template_id);
CREATE INDEX idx_fixed_slot_dates_date ON fixed_slot_dates(slot_date);

-- ============================================
-- Reservations ENUMs
-- ============================================

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

-- ============================================
-- Reservations
-- ============================================

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bike_id UUID,                          -- Optional: may be null until bike assigned
  station_id UUID NOT NULL,
  
  -- Reservation option
  reservation_option reservation_option NOT NULL,
  
  -- Links based on reservation_option
  fixed_slot_template_id UUID,           -- Required if FIXED_SLOT
  subscription_id UUID,                  -- Required if SUBSCRIPTION
  
  -- Reservation window
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,                  -- Auto-calculated for ONE_TIME (+1 hour)
  
  -- Payment
  prepaid DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Status
  status reservation_status NOT NULL DEFAULT 'PENDING',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reservations_bike FOREIGN KEY (bike_id) REFERENCES bikes(id),
  CONSTRAINT fk_reservations_station FOREIGN KEY (station_id) REFERENCES stations(id),
  CONSTRAINT fk_reservations_fixed_slot FOREIGN KEY (fixed_slot_template_id) REFERENCES fixed_slot_templates(id),
  CONSTRAINT fk_reservations_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  
  -- Validate fixed_slot_template_id required for FIXED_SLOT
  CONSTRAINT chk_fixed_slot_required CHECK (
    reservation_option != 'FIXED_SLOT' OR fixed_slot_template_id IS NOT NULL
  ),
  -- Validate subscription_id required for SUBSCRIPTION
  CONSTRAINT chk_subscription_required CHECK (
    reservation_option != 'SUBSCRIPTION' OR subscription_id IS NOT NULL
  )
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_bike ON reservations(bike_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Prevent double-booking: one active reservation per bike
CREATE UNIQUE INDEX idx_reservations_active_bike 
  ON reservations(bike_id) 
  WHERE status IN ('PENDING', 'ACTIVE') AND bike_id IS NOT NULL;

-- ============================================
-- Rentals ENUMs
-- ============================================

CREATE TYPE rental_status AS ENUM (
  'RENTED',
  'COMPLETED',
  'CANCELLED',
  'RESERVED'
);

-- ============================================
-- Rentals
-- ============================================

CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bike_id UUID,                          -- Optional in legacy (null for reserved rentals)
  
  -- Stations
  start_station UUID NOT NULL,
  end_station UUID,                      -- NULL until rental ends
  
  -- Time tracking
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,                  -- NULL until rental ends
  duration INT,                          -- Minutes
  
  -- Pricing
  total_price DECIMAL(12,2),
  
  -- Subscription linkage (optional)
  subscription_id UUID,
  
  -- Status
  status rental_status NOT NULL DEFAULT 'RENTED',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_rentals_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_rentals_bike FOREIGN KEY (bike_id) REFERENCES bikes(id),
  CONSTRAINT fk_rentals_start_station FOREIGN KEY (start_station) REFERENCES stations(id),
  CONSTRAINT fk_rentals_end_station FOREIGN KEY (end_station) REFERENCES stations(id),
  CONSTRAINT fk_rentals_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- Performance indexes
CREATE INDEX idx_rentals_user ON rentals(user_id);
CREATE INDEX idx_rentals_bike ON rentals(bike_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_start_time ON rentals(start_time);
CREATE INDEX idx_rentals_start_station ON rentals(start_station);

-- Composite for "my active rentals"
CREATE INDEX idx_rentals_user_active ON rentals(user_id, status) WHERE status = 'RENTED';

-- Prevent concurrent active rentals for same bike
CREATE UNIQUE INDEX idx_rentals_active_bike 
  ON rentals(bike_id) 
  WHERE status = 'RENTED' AND bike_id IS NOT NULL;

-- ============================================
-- Rating Reasons ENUMs
-- ============================================

CREATE TYPE rating_reason_type AS ENUM (
  'ISSUE',
  'COMPLIMENT'
);

CREATE TYPE applies_to_enum AS ENUM (
  'bike',
  'station',
  'app'
);

-- ============================================
-- Rating Reasons
-- ============================================

CREATE TABLE rating_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  type rating_reason_type NOT NULL,
  applies_to applies_to_enum NOT NULL,
  messages TEXT NOT NULL
);

-- ============================================
-- Ratings
-- ============================================

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rental_id UUID NOT NULL UNIQUE,        -- One rating per rental
  
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ratings_rental FOREIGN KEY (rental_id) REFERENCES rentals(id)
);

CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_rental ON ratings(rental_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- ============================================
-- Rating Reason Links (normalized from reason_ids array)
-- ============================================

CREATE TABLE rating_reason_links (
  rating_id UUID NOT NULL,
  reason_id UUID NOT NULL,
  
  PRIMARY KEY (rating_id, reason_id),
  CONSTRAINT fk_rating_reason_link_rating FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE CASCADE,
  CONSTRAINT fk_rating_reason_link_reason FOREIGN KEY (reason_id) REFERENCES rating_reasons(id) ON DELETE CASCADE
);

CREATE INDEX idx_rating_reason_links_rating ON rating_reason_links(rating_id);
CREATE INDEX idx_rating_reason_links_reason ON rating_reason_links(reason_id);

-- ============================================
-- Bike Rating Stats (Materialized View)
-- NOTE: Commented out for ChartDB compatibility
-- Uncomment when applying to actual PostgreSQL database
-- ============================================

-- CREATE MATERIALIZED VIEW bike_rating_stats AS
-- SELECT 
--   b.id AS bike_id,
--   COALESCE(AVG(r.rating), 0) AS average_rating,
--   COUNT(r.id) AS total_ratings
-- FROM bikes b
-- LEFT JOIN rentals ren ON ren.bike_id = b.id AND ren.status = 'COMPLETED'
-- LEFT JOIN ratings r ON r.rental_id = ren.id
-- GROUP BY b.id;

-- CREATE UNIQUE INDEX idx_bike_rating_stats_bike ON bike_rating_stats(bike_id);
