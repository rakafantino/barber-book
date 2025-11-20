import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial dari environment variable jika tersedia, atau menggunakan fallback value
// Kunci publik ini aman untuk diekspos di sisi klien (browser) asalkan Row Level Security (RLS) diaktifkan di database.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sbdqarmoqhblyscpxcxy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZHFhcm1vcWhibHlzY3B4Y3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQzODAsImV4cCI6MjA3OTIxMDM4MH0.jvm6IR8X3aBy0ZOpGqi_oGq0cwAzQzIlnFMZmlH9RDE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);