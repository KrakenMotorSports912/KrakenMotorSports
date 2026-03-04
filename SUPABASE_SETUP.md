# Supabase Database Setup for Kraken Motorsports

## Quick Setup Instructions

1. **Create Supabase Account**: Go to https://supabase.com and create a free account
2. **Create New Project**: Click "New Project" and choose a name
3. **Get Your Keys**: Go to Project Settings → API to find your keys
4. **Run SQL Below**: Copy the SQL schema below and run it in the Supabase SQL Editor

> **✨ NEW**: This setup includes automatic profile creation! When users sign up, a profile record is automatically created in the database via a trigger on `auth.users`.

---

## Database Schema

Run this SQL in your Supabase SQL Editor (Database → SQL Editor → New Query):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- LEADERBOARD ENTRIES
-- ============================================
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('assetto_corsa', 'assetto_corsa_competizione', 'f1_2025', 'forza_motorsport', 'forza_horizon', 'other')),
  track TEXT NOT NULL,
  car TEXT NOT NULL,
  lap_time_ms INTEGER NOT NULL, -- time in milliseconds
  lap_time_display TEXT NOT NULL, -- formatted time like "1:23.456"
  screenshot_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leaderboard_game ON leaderboard_entries(game);
CREATE INDEX idx_leaderboard_track ON leaderboard_entries(track);
CREATE INDEX idx_leaderboard_status ON leaderboard_entries(status);
CREATE INDEX idx_leaderboard_lap_time ON leaderboard_entries(lap_time_ms);

-- RLS Policies
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved entries" 
  ON leaderboard_entries FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Users can view own entries" 
  ON leaderboard_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" 
  ON leaderboard_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all entries" 
  ON leaderboard_entries FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('race', 'tournament', 'time_trial', 'special', 'maintenance')),
  game TEXT NOT NULL,
  track TEXT NOT NULL,
  car_class TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize TEXT,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  banner_image_url TEXT,
  images TEXT[], -- Array of image URLs for event carousel
  rules TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events" 
  ON events FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage events" 
  ON events FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- DISCOUNTS
-- ============================================
CREATE TABLE discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT[] DEFAULT ARRAY['session', 'founders_pass', 'merchandise'],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts" 
  ON discounts FOR SELECT 
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage discounts" 
  ON discounts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- FOUNDERS PASS
-- ============================================
CREATE TABLE founders_passes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pass_number INTEGER UNIQUE NOT NULL CHECK (pass_number BETWEEN 1 AND 50),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'venmo', 'stripe', 'other')),
  payment_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  discount_code TEXT,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'paid', 'active', 'cancelled')),
  plaque_name TEXT NOT NULL, -- name to appear on the rig
  merch_size TEXT CHECK (merch_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  shipping_address TEXT,
  notes TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE founders_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pass" 
  ON founders_passes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert pass reservation" 
  ON founders_passes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can manage all passes" 
  ON founders_passes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- TRACKS & CARS (Reference Data)
-- ============================================
CREATE TABLE tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  length_km DECIMAL(10,3),
  turns INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE cars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  class TEXT,
  manufacturer TEXT,
  is_active BOOLEAN DEFAULT true
);

-- RLS Policies
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tracks" ON tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view cars" ON cars FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founders_passes_updated_at BEFORE UPDATE ON founders_passes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA (sample tracks and cars)
-- ============================================

-- Sample tracks
INSERT INTO tracks (name, game, length_km, turns) VALUES
  ('Nürburgring Nordschleife', 'assetto_corsa', 20.8, 73),
  ('Spa-Francorchamps', 'assetto_corsa', 7.0, 19),
  ('Monza', 'assetto_corsa', 5.8, 11),
  ('Silverstone', 'f1_2025', 5.9, 18),
  ('Suzuka', 'f1_2025', 5.8, 18);

-- Sample cars
INSERT INTO cars (name, game, class, manufacturer) VALUES
  ('Porsche 919 Hybrid Evo', 'assetto_corsa', 'LMP1', 'Porsche'),
  ('Mercedes AMG GT3', 'assetto_corsa_competizione', 'GT3', 'Mercedes'),
  ('Ferrari 488 GT3', 'assetto_corsa_competizione', 'GT3', 'Ferrari'),
  ('Red Bull RB19', 'f1_2025', 'F1', 'Red Bull Racing'),
  ('Porsche 911 GT3 RS', 'forza_motorsport', 'GT', 'Porsche');

```

---

## Setting Up Your Admin Account

After running the SQL above:

1. **Sign up** on your site to create your account
   - A profile will be automatically created via the database trigger
2. **Find your user ID** in Supabase Dashboard → Authentication → Users
3. **Run this SQL** to make yourself admin (replace YOUR_USER_ID):

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'YOUR_USER_ID';
```

4. Refresh the page and you'll have admin access!

---

## Storage Buckets

Create these storage buckets in Supabase Storage:

1. **leaderboard-screenshots** - For lap time verification
   - Set to public
   - Allowed file types: jpg, png, webp
   - Max file size: 10MB

2. **event-banners** - For event images
   - Set to public
   - Allowed file types: jpg, png, webp
   - Max file size: 5MB

---

## Database Migration (if already deployed)

If you've already run the initial setup and need to add the images field to events:

```sql
-- Add images array field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS images TEXT[];

COMMENT ON COLUMN events.images IS 'Array of image URLs for event carousel display';
```

---

## Real-time Setup

Enable real-time for live leaderboard updates:

1. Go to Database → Replication
2. Enable replication for `leaderboard_entries` table
3. Enable replication for `events` table

---

## Next Steps

1. Copy your Supabase URL and keys to `.env.local`
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development server
4. Sign up to create your admin account
5. Make yourself admin using the SQL above

---

Your database is now ready! 🦑
