import { useState } from 'react';
import type { SupabaseProject } from '../types/sentinel';
import type { MasterHubConfig } from '../lib/masterHub';
import { X, Copy, Check, Download, GitBranch, Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles, Server } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: SupabaseProject[];
  masterConfig?: MasterHubConfig | null;
}

export const ExportSecretModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  projects,
  masterConfig 
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [activeTab, setActiveTab] = useState<'master' | 'backup'>(masterConfig ? 'master' : 'backup');

  if (!isOpen) return null;

  // Clean export structure for backup
  const cleanConfig = projects.map((p) => ({
    name: p.name,
    url: p.url,
    anonKey: showKeys ? p.anonKey : (p.anonKey ? '••••••••••••••••••••' : ''),
    serviceRoleKey: p.serviceRoleKey
      ? (showKeys ? p.serviceRoleKey : '••••••••••••••••••••')
      : undefined,
    targetTable: p.targetTable || '_heartbeat',
    targetMode: p.targetMode || 'wal_mutation',
  }));

  const rawFullConfig = JSON.stringify(
    projects.map((p) => ({
      name: p.name,
      url: p.url,
      anonKey: p.anonKey,
      serviceRoleKey: p.serviceRoleKey || undefined,
      targetTable: p.targetTable || '_heartbeat',
      targetMode: p.targetMode || 'wal_mutation',
    })),
    null,
    2
  );

  const displayJson = JSON.stringify(cleanConfig, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawFullConfig);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleCopyUrl = () => {
    if (!masterConfig) return;
    navigator.clipboard.writeText(masterConfig.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyKey = () => {
    if (!masterConfig) return;
    navigator.clipboard.writeText(masterConfig.anonKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawFullConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selalu-aktif-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-brutal-panel w-full max-w-2xl rounded-3xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-xs">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                <span>Konfigurasi GitHub Secrets</span>
                {masterConfig && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    MASTER HUB AKTIF
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Otomatisasi pemantauan cloud 24/7 tanpa perlu menyalakan laptop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher if Master Hub is configured */}
        {masterConfig && (
          <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('master')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'master'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>1. Cloud Master Hub (Otomatis 24/7)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-slate-800 text-slate-100 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>2. Cadangan / JSON Manual</span>
            </button>
          </div>
        )}

        {/* TAB 1: MASTER HUB SECRETS (RECOMMENDED & ACTIVE) */}
        {activeTab === 'master' && masterConfig && (
          <div className="mt-5 space-y-4 font-sans text-xs">
            {/* Relieving Success Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Anda Menggunakan Master Hub: Tidak Perlu Salin JSON Setiap Saat!</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Seluruh proyek baru yang Anda tambahkan di aplikasi ini <strong>otomatis tersimpan di tabel <code className="text-cyan-400 font-mono">sentinel_registry</code> database Master Anda</strong>. 
                GitHub Actions membaca data langsung dari cloud.
              </p>
            </div>

            {/* Instruction List for Master Hub Secrets */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Cukup Pasang 2 Secret Ini di GitHub (1x Saja Seumur Hidup):</span>
              </div>

              {/* Secret 1: MASTER_SUPABASE_URL */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-bold">1. MASTER_SUPABASE_URL</span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate select-all">
                  {masterConfig.url}
                </div>
              </div>

              {/* Secret 2: MASTER_SUPABASE_KEY */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-bold">2. MASTER_SUPABASE_KEY</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Tersalin!' : 'Salin Kunci'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate select-all">
                  {showKeys ? masterConfig.anonKey : '••••••••••••••••••••••••••••••••••••••••'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showKeys ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}</span>
                </button>
              </div>

              {/* Steps guide */}
              <div className="text-[11px] text-slate-400 font-sans space-y-1 pt-1">
                <p>📍 Cara pasang di GitHub:</p>
                <p>Buka Repositori GitHub &rarr; <strong>Settings</strong> &rarr; <strong>Secrets and variables</strong> &rarr; <strong>Actions</strong> &rarr; Klik <strong>New repository secret</strong> &rarr; Masukkan kedua nama &amp; nilai di atas.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="brutal-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Tutup &amp; Selesai
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: BACKUP / MANUAL JSON (LEGACY OR OFFLINE MODE) */}
        {(activeTab === 'backup' || !masterConfig) && (
          <div className="mt-4 space-y-4">
            {/* Notice for Backup */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 font-bold text-amber-300 font-mono">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Mode Cadangan (Backup JSON):</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {masterConfig 
                  ? 'Bagian ini hanya sebagai file cadangan (backup) jika Anda ingin mengunduh daftar seluruh database Anda ke file .json di laptop.'
                  : 'Jika belum memakai Master Hub, salin JSON ini ke GitHub Secrets dengan nama SENTINEL_PROJECTS.'}
              </p>
            </div>

            {/* JSON Preview Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
                <span>Daftar Proyek JSON ({projects.length} Proyek)</span>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeys ? 'Sembunyikan Kunci' : 'Lihat Kunci Lengkap'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-52">
                {displayJson}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto brutal-btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Backup .json</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="w-full sm:w-auto brutal-btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-extrabold"
              >
                {copiedJson ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedJson ? 'Tersalin ke Clipboard!' : 'Salin JSON Proyek'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
