-- ==========================================
-- 1. RESET (HAPUS SEMUA TABEL LAMA & BERSIHKAN)
-- ==========================================
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS barber_availability;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS barbers;

-- ==========================================
-- 2. BUAT TABEL MASTER (SERVICES & BARBERS)
-- ==========================================

-- Tabel Services
CREATE TABLE services (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_minutes integer NOT NULL,
  description text
);

-- Tabel Barbers
CREATE TABLE barbers (
  id text PRIMARY KEY,
  name text NOT NULL,
  specialty text NOT NULL,
  image text NOT NULL,
  experience integer NOT NULL,
  rating numeric NOT NULL
);

-- ==========================================
-- 3. BUAT TABEL TRANSAKSI & RELASI
-- ==========================================

-- Tabel Availability (Jadwal Libur Barber)
CREATE TABLE barber_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  barber_id text REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
  unavailable_date date NOT NULL,
  reason text
);

-- Tabel Bookings (Transaksi User)
CREATE TABLE bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  service_id text REFERENCES services(id) ON DELETE SET NULL,
  barber_id text REFERENCES barbers(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  style_notes text
);

-- ==========================================
-- 4. SETUP KEAMANAN (ROW LEVEL SECURITY)
-- Agar aplikasi frontend bisa baca/tulis tanpa login email (Public/Anon)
-- ==========================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy Services (Full Access)
CREATE POLICY "Public Access Services" ON services FOR ALL USING (true) WITH CHECK (true);

-- Policy Barbers (Full Access)
CREATE POLICY "Public Access Barbers" ON barbers FOR ALL USING (true) WITH CHECK (true);

-- Policy Availability (Full Access)
CREATE POLICY "Public Access Availability" ON barber_availability FOR ALL USING (true) WITH CHECK (true);

-- Policy Bookings (Full Access)
CREATE POLICY "Public Access Bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 5. SEEDING DATA (DATA AWAL)
-- ==========================================

-- Masukkan Services Default
INSERT INTO services (id, name, price, duration_minutes, description) VALUES
('s1', 'Gentleman''s Cut', 60000, 45, 'Potong rambut presisi, keramas, dan styling pomade.'),
('s2', 'Beard Sculpting', 35000, 30, 'Merapikan jenggot dan kumis dengan hot towel treatment.'),
('s3', 'Full Service Package', 90000, 75, 'Paket lengkap potong rambut, cukur jenggot, dan pijat kepala relaksasi.'),
('s4', 'Hair Tattoo / Design', 80000, 60, 'Desain artistik pada potongan rambut.');

-- Masukkan Barbers Default
INSERT INTO barbers (id, name, specialty, image, experience, rating) VALUES
('b1', 'Budi "The Blade"', 'Classic Fade', 'https://picsum.photos/200/200?random=1', 8, 4.9),
('b2', 'Reza Styles', 'Modern Mullet & Crop', 'https://picsum.photos/200/200?random=2', 5, 4.7),
('b3', 'Pak Harto', 'Traditional & Shaving', 'https://picsum.photos/200/200?random=3', 15, 5.0);
