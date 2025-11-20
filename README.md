# GantengMaksimal Barbershop

Aplikasi booking barbershop modern dengan rekomendasi gaya rambut berbasis AI, admin dashboard, dan integrasi database menggunakan Supabase.

## Ringkasan

- Frontend: `React + Vite + TypeScript`
- Styling: `Tailwind CSS` via PostCSS (tanpa CDN)
- AI: `@google/genai` (Gemini)
- Database: `Supabase` (RLS disarankan aktif)

## Fitur

- Booking flow end-to-end: pilih service, barber, tanggal, dan jam.
- Admin dashboard untuk CRUD `services`, `barbers`, dan `barber_availability`.
- AI Stylist yang memberi rekomendasi gaya rambut kontekstual.
- Validasi slot agar tidak double-booking.

## Struktur Proyek

```
barber-book/
├─ components/
│  ├─ BookingFlow.tsx
│  ├─ AdminDashboard.tsx
│  └─ AIStylist.tsx
├─ services/
│  ├─ storageService.ts
│  ├─ supabaseClient.ts
│  └─ geminiService.ts
├─ MIGRATION.sql
├─ index.html
├─ index.tsx
├─ App.tsx
├─ types.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ index.css
├─ vite.config.ts
└─ package.json
```

## Prasyarat

- Node.js LTS
- Disarankan menggunakan `pnpm` sebagai package manager

## Setup & Menjalankan

1. Instalasi dependencies

```
pnpm install
```

2. Environment variables

Buat file `.env` di root proyek dengan isi:

```
VITE_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Catatan:

- Vite hanya mengekspos variable dengan prefix `VITE_` ke browser.
- Setelah mengubah `.env`, restart development server atau refresh jika sudah berjalan.

3. Inisialisasi database Supabase

- Buat project di Supabase.
- Jalankan isi `MIGRATION.sql` pada SQL Editor Supabase untuk membuat tabel:
  - `services`, `barbers`, `barber_availability`, `bookings`.
- Data contoh dimasukkan oleh `MIGRATION.sql` untuk mempermudah testing.

4. Development

```
pnpm run dev
```

5. Build & Preview

```
pnpm run build
pnpm run preview
```

6. Lint (typecheck)

```
pnpm run lint
```

## Konfigurasi Tailwind

- Tailwind dikonfigurasi via PostCSS, bukan CDN.
- File terkait:
  - `tailwind.config.js` — konfigurasi `content` dan theme (warna `gold`/`dark`, font `Inter` & `Playfair Display`).
  - `postcss.config.js` — plugin `tailwindcss` dan `autoprefixer`.
  - `index.css` — direktif `@tailwind base; @tailwind components; @tailwind utilities;`.
- Entry CSS diimpor di `index.tsx` dengan `import './index.css';`.

## Arsitektur & Referensi Kode

- Entry React: `index.tsx:1–15`.
- Root layout & routing sederhana: `App.tsx:7–115`.
- Booking alur utama: `components/BookingFlow.tsx`.
- Admin dashboard: `components/AdminDashboard.tsx`.
- AI Stylist: `components/AIStylist.tsx`.
- Supabase client: `services/supabaseClient.ts:9–12` menggunakan `import.meta.env`.
- Operasi data: `services/storageService.ts`.
- Integrasi Gemini: `services/geminiService.ts` menggunakan `VITE_API_KEY`.

## Keamanan

- Jangan commit kredensial rahasia. Simpan di `.env` lokal atau di secret manager CI/CD.
- `VITE_SUPABASE_ANON_KEY` aman diekspos di client jika RLS aktif dan aturan akses ketat.
- Hindari `console.log` untuk menampilkan kredensial di production.

## Troubleshooting

- Variabel env `undefined` di browser:

  - Gunakan prefix `VITE_` dan akses via `import.meta.env`.
  - Restart `dev server` setelah mengubah `.env`.

- Peringatan `cdn.tailwindcss.com should not be used in production`:

  - CDN telah dihapus dari `index.html`. Gunakan PostCSS setup yang sudah disediakan.

- Build chunk besar (>500kb):
  - Pertimbangkan `code-splitting` dengan `import()` dinamis.

## Lisensi

Proyek ini untuk keperluan iseng dan belajar. Penyesuaian lebih lanjut dipersilakan sesuai kebutuhan.
