import { useState } from 'react';
import { X, Copy, Check, Code, Sparkles, Server, Database } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSnippetModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'master' | 'target'>('master');

  if (!isOpen) return null;

  const masterHubSql = `-- =======================================================
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

  const targetDbSql = `-- =======================================================
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

  const activeScript = activeTab === 'master' ? masterHubSql : targetDbSql;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-brutal-panel w-full max-w-2xl rounded-3xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                SQL Snippet Generator
              </h2>
              <p className="text-xs text-slate-400">
                Skrip SQL PostgreSQL untuk Master Hub dan Target Database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'master'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Master Hub (sentinel_registry)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('target')}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'target'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Target DB (_heartbeat)</span>
          </button>
        </div>

        {/* Description Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 font-sans">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            {activeTab === 'master' ? (
              <p className="text-slate-400 leading-relaxed text-[11px]">
                <strong className="text-white">Jalankan di 1 database master saja.</strong> Skrip ini membuat tabel <code className="text-cyan-400 font-mono">sentinel_registry</code> dan <code className="text-cyan-400 font-mono">sentinel_logs</code> sehingga seluruh penambahan proyek dari web UI otomatis tersimpan di sini.
              </p>
            ) : (
              <p className="text-slate-400 leading-relaxed text-[11px]">
                <strong className="text-white">Jalankan di setiap database target.</strong> Skrip ini membuat tabel <code className="text-emerald-400 font-mono">_heartbeat</code> untuk menerima transaksi WAL berkala agar server PostgreSQL tidak pernah tidur (*sleep*).
              </p>
            )}
          </div>
        </div>

        {/* Code Box */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
            <span>PostgreSQL Query ({activeTab === 'master' ? 'Master Hub' : 'Target Heartbeat'})</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto max-h-72">
            {activeScript}
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="brutal-btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
            <span>{copied ? 'SQL Berhasil Disalin!' : 'Salin Seluruh Skrip SQL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
