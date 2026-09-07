export const MASTER_HUB_SQL = `-- =======================================================
-- MASTER HUB CENTRAL: Tabel Registry Proyek & Log Sentral
-- Jalankan di: Supabase Master DB -> SQL Editor -> New Query
-- =======================================================

-- 1. Buat tabel registry seluruh proyek Supabase Anda
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

-- 2. Buat tabel riwayat log transaksi terpusat
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

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.sentinel_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_logs ENABLE ROW LEVEL SECURITY;

-- 4. Berikan izin Akses untuk Anon & Service Role
DROP POLICY IF EXISTS "Allow sentinel_registry access" ON public.sentinel_registry;
CREATE POLICY "Allow sentinel_registry access"
ON public.sentinel_registry FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow sentinel_logs access" ON public.sentinel_logs;
CREATE POLICY "Allow sentinel_logs access"
ON public.sentinel_logs FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);
`;

export const TARGET_DB_SQL = `-- =======================================================
-- TARGET DATABASE: Tabel Heartbeat Sentinel Ringan
-- Jalankan di masing-masing Database Supabase Target
-- (KAWAL, SIMDIK, BAKUMPUL, dll.)
-- =======================================================

-- 1. Buat tabel heartbeat ringan jika belum ada
CREATE TABLE IF NOT EXISTS public._heartbeat (
  id TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  heartbeat_source TEXT,
  system_nonce TEXT
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public._heartbeat ENABLE ROW LEVEL SECURITY;

-- 3. Beri izin Anon / Service Role untuk menulis heartbeat
DROP POLICY IF EXISTS "Allow heartbeat write" ON public._heartbeat;
CREATE POLICY "Allow heartbeat write"
ON public._heartbeat FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. Buat baris data awal
INSERT INTO public._heartbeat (id, updated_at, heartbeat_source)
VALUES ('sentinel-heartbeat-pulse', NOW(), 'INIT')
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
`;
