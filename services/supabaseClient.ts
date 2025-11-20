import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial dari environment variable jika tersedia, atau menggunakan fallback value
// Kunci publik ini aman untuk diekspos di sisi klien (browser) asalkan Row Level Security (RLS) diaktifkan di database.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
