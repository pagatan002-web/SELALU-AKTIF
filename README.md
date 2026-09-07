# ⚡ SELALU AKTIF — Centralized Supabase & Backend Heartbeat Sentinel

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Free%20Tier%20Defender-3ECF8E?logo=supabase&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-Brutalism%20Glasses-38B2AC?logo=tailwindcss&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-24%2F7%20Cloud%20Cron-2088FF?logo=github-actions&logoColor=white)

**Aplikasi sentral untuk memantau dan menjaga seluruh database Supabase (Free Tier) Anda tetap aktif 24/7, bebas dari risiko *auto-pause* 7 hari.**

[Fitur Utama](#-fitur-utama) • [Cara Kerja](#-cara-kerja-the-stealth-organic-heartbeat-trick) • [Panduan Cepat](#-panduan-penggunaan-cepat) • [Master Hub Central](#-arsitektur-master-hub-central) • [Keamanan](#-keamanan--privasi)

</div>

---

## 📌 Masalah: Auto-Pause 7 Hari Supabase Free Tier
Di paket gratis (*Free / Hobby Plan*), Supabase menerapkan kebijakan penghematan sumber daya:
* Database PostgreSQL yang **tidak menerima aktivitas selama 7 hari berturut-turut** akan otomatis dihentikan sementara (*paused*).
* **Mengapa ping HTTP GET biasa (seperti UptimeRobot/Cron-job) tidak mempan lagi?**
  * Supabase memblokir ping statis CDN. Panggilan HTTP GET sederhana hanya menyentuh lapisan *Cloudflare Edge Cache / Memory PostgREST* tanpa pernah menyentuh engine PostgreSQL.
  * Supabase mendeteksi **aktivitas nyata di engine database** (adanya penulisan/pembacaan disk melalui *Write-Ahead Log* / WAL).

---

## 🔑 Solusi: "The Stealth Organic Heartbeat Trick"
Aplikasi **SELALU AKTIF** menggunakan teknik transaksi organik:
1. **Real PostgreSQL WAL Generation:** Mengeksekusi mutasi `POST` / `UPSERT` ringan pada tabel `_heartbeat`. PostgreSQL dipaksa menulis transaksi ke disk (WAL), sehingga Supabase menganggapnya 100% sebagai aktivitas aplikasi sungguhan.
2. **Dynamic Engine Fallback:** Jika tabel belum dibuat, sistem otomatis beralih ke kueri hitung PostgREST (`count=exact`) untuk memaksa engine PostgreSQL membaca data dari disk.
3. **User-Agent Masquerading:** Rotasi otomatis User-Agent browser asli (Chrome 128+, Safari 17+, Edge 128+) untuk menyamarkan lalu lintas otomatis.
4. **Jitter Timing Delay:** Jeda acak (jitter) antar permintaan agar pola lalu lintas tidak tampak seperti robot bot kaku.

---

## 🎨 Tampilan "Brutalism Glasses"
Antarmuka visual modern yang menggabungkan:
* **Frosted Glassmorphism:** Panel transparan dengan efek `backdrop-filter: blur(16px)` dan kedalaman futuristik.
* **Neo-Brutalist Tactile Controls:** Border solid 2px yang tegas, bayangan offset taktis (`4px 4px 0px #000`), dan respon tekan (*button press translation*).
* **Radar Pulse Badges:** Indikator status berdenyut (🟢 Hijau = Sehat, 🟡 Kuning = Perlu Perhatian, 🔴 Merah = Terhenti).

---

## 🏗️ Arsitektur "Master Hub Central"

```mermaid
graph TD
    subgraph Dashboard Pengguna (Web / HP)
        UI["Web Dashboard SELALU AKTIF"]
        UI -->|Tambah / Edit / Hapus Proyek| MasterDB["Supabase Master DB<br/>(Tabel: sentinel_registry)"]
        UI -->|Audit Log Realtime| MasterLogs["Tabel: sentinel_logs"]
    end

    subgraph Otomasi Cloud (GitHub Actions 24/7)
        Cron["GitHub Actions Runner<br/>(Jalan Setiap 3 Hari Sekali)"] -->|1. Baca Daftar Proyek| MasterDB
        Secrets["GitHub Secrets: MASTER_SUPABASE_URL & KEY<br/>(Disetel 1x Saja)"] --> Cron
        Cron -->|2. Kirim Transaksi WAL Organik| TargetDB1["Supabase Proyek 1 (KAWAL)"]
        Cron -->|2. Kirim Transaksi WAL Organik| TargetDB2["Supabase Proyek 2 (SIMDIK)"]
        Cron -->|2. Kirim Transaksi WAL Organik| TargetDB3["Supabase Proyek N (Lainnya)"]
        Cron -->|3. Perbarui Status & Latensi| MasterDB
        Cron -->|4. Catat Riwayat Transaksi| MasterLogs
    end
```

### Keunggulan Master Hub:
* **Setel Sekali di GitHub Secrets (1x Seumur Hidup):** Cukup pasang `MASTER_SUPABASE_URL` dan `MASTER_SUPABASE_KEY` sekali saja di GitHub.
* **Otomatis Tanpa Repot:** Tambah/edit proyek di Web UI langsung tersimpan di Supabase Master dan otomatis dibaca oleh GitHub Actions saat jadwal cron berikutnya berjalan.
* **Master DB Ikut Bebas Pause:** Karena dibaca dan ditulis setiap 3 hari, Master DB Anda otomatis **tidak akan pernah auto-pause**!

---

## 🚀 Panduan Penggunaan Cepat

### 1. Jalankan Secara Lokal
```bash
# Clone repository
git clone https://github.com/username/selalu-aktif.git
cd selalu-aktif

# Install dependencies
npm install

# Salin template env
cp .env.example .env.local

# Jalankan server
npm run dev
```
Buka browser di `http://localhost:5173/`.

### 2. Setup Tabel di Database Supabase Master Anda
1. Buka dashboard Supabase Master Anda &rarr; **SQL Editor** &rarr; **New Query**.
2. Salin skrip SQL berikut dan klik **Run**:

```sql
-- Buat tabel registry seluruh proyek Supabase
CREATE TABLE IF NOT EXISTS public.sentinel_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  service_role_key TEXT,
  target_table TEXT DEFAULT '_heartbeat',
  target_mode TEXT DEFAULT 'wal_mutation',
  status TEXT DEFAULT 'healthy',
  last_ping_at TIMESTAMPTZ,
  last_latency_ms INTEGER,
  last_status_code INTEGER,
  last_status_text TEXT,
  last_error TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat tabel riwayat audit log
CREATE TABLE IF NOT EXISTS public.sentinel_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT,
  success BOOLEAN DEFAULT TRUE,
  status_code INTEGER,
  latency_ms INTEGER,
  mode TEXT,
  details TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses
ALTER TABLE public.sentinel_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow sentinel_registry access" ON public.sentinel_registry;
CREATE POLICY "Allow sentinel_registry access" ON public.sentinel_registry FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow sentinel_logs access" ON public.sentinel_logs;
CREATE POLICY "Allow sentinel_logs access" ON public.sentinel_logs FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
```

### 3. Aktifkan Otomasi GitHub Actions 24/7
1. Di repositori GitHub Anda, buka: **Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **New repository secret**.
2. Masukkan 2 rahasia:
   * `MASTER_SUPABASE_URL`: URL Supabase Master Anda.
   * `MASTER_SUPABASE_KEY`: Anon Key atau Service Role Key Supabase Master Anda.
3. Push kode ini ke GitHub. Selesai! Robot GitHub Actions akan otomatis berjalan setiap 3 hari sekali.

---

## 🔒 Keamanan & Privasi
* **Zero-Knowledge Architecture:** Tidak ada server pihak ketiga perantara.
* **Aman untuk Open Source / Public Repository:** File kredensial [`.env.local`](.env.local) otomatis diabaikan oleh Git via `.gitignore`.
* **Kunci Rahasia di Enkripsi Militer:** Kunci eksekusi latar belakang disimpan secara aman di GitHub Secrets.

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Bebas digunakan untuk kebutuhan pribadi maupun komersial.

<div align="center">
⭐ <b>Suka dengan proyek ini? Berikan Bintang (Star) di GitHub!</b> ⭐
</div>
