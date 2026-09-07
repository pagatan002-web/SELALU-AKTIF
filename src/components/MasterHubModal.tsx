import { useState, useEffect } from 'react';
import type { MasterHubConfig } from '../lib/masterHub';
import { 
  testMasterConnection, 
  saveMasterHub, 
  migrateLocalToMaster 
} from '../lib/masterHub';
import type { SupabaseProject } from '../types/sentinel';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRightLeft, 
  Unplug, 
  Code, 
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: MasterHubConfig | null;
  onConfigChange: (config: MasterHubConfig | null) => void;
  localProjects: SupabaseProject[];
  onOpenSqlModal: () => void;
  fromTour?: boolean;
  onContinueTour?: () => void;
}

export const MasterHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigChange,
  localProjects,
  onOpenSqlModal,
  fromTour = false,
  onContinueTour,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
    tableReady: boolean;
  } | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentConfig) {
      setUrl(currentConfig.url);
      setAnonKey(currentConfig.anonKey);
    } else {
      setUrl('');
      setAnonKey('');
    }
    setTestStatus(null);
    setMigrationMessage(null);
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestStatus({
        success: false,
        message: 'Harap isi URL Supabase dan Anon Key database Master Anda.',
        tableReady: false,
      });
      return;
    }

    setTesting(true);
    setTestStatus(null);
    const result = await testMasterConnection(url, anonKey);
    setTesting(false);
    setTestStatus(result);
  };

  const handleConnect = () => {
    if (!url.trim() || !anonKey.trim()) return;

    const newConfig: MasterHubConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    };

    saveMasterHub(newConfig);
    onConfigChange(newConfig);
    if (fromTour && onContinueTour) {
      onContinueTour();
    } else {
      onClose();
    }
  };

  const handleDisconnect = () => {
    if (confirm('Apakah Anda yakin ingin memutuskan Master Hub dan kembali ke Mode Lokal?')) {
      saveMasterHub(null);
      onConfigChange(null);
      onClose();
    }
  };

  const handleMigrate = async () => {
    if (!currentConfig || localProjects.length === 0) return;
    setMigrating(true);
    try {
      const count = await migrateLocalToMaster(currentConfig, localProjects);
      setMigrationMessage(`Berhasil memigrasikan ${count} proyek lokal ke Master Hub!`);
    } catch (err: any) {
      setMigrationMessage(`Gagal migrasi: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-brutal-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Master Hub Central</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentConfig ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentConfig ? 'TERHUBUNG' : 'MODE LOKAL'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pusat registry database Supabase untuk sinkronisasi otomatis 24/7
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

        {/* Tour Status Banner if opened from onboarding */}
        {fromTour && (
          <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-cyan-950/60 border border-violet-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="text-slate-200">
                <strong className="text-violet-300">Mode Panduan:</strong> Langkah 3 - Hubungkan Dashboard ini ke Database Master Anda.
              </span>
            </div>
            {onContinueTour && (
              <button
                type="button"
                onClick={onContinueTour}
                className="shrink-0 px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <span>Lanjut Panduan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Informative Value Proposition */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 font-mono">
            <HelpCircle className="w-4 h-4" />
            <span>Kelebihan Menggunakan Master Hub:</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Setiap kali Anda menambah/mengubah proyek di UI ini, data langsung tersimpan di tabel <code className="text-cyan-400 font-mono">sentinel_registry</code> pada Supabase Master Anda. 
            <strong> Anda TIDAK PERLU lagi mengutak-atik GitHub Secrets</strong> setiap ada proyek baru!
          </p>
        </div>

        {/* Current Connection Status or Form */}
        {currentConfig ? (
          <div className="mt-5 space-y-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersambung ke Supabase Master</span>
              </div>
              <div className="text-slate-300 truncate">
                <span className="text-slate-500 block text-[10px]">URL MASTER HUB:</span>
                <span className="font-bold">{currentConfig.url}</span>
              </div>
              {currentConfig.connectedAt && (
                <div className="text-slate-400 text-[10px]">
                  Terhubung sejak: {new Date(currentConfig.connectedAt).toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Migration Tool */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Sinkronkan Data Proyek</span>
                <span className="text-slate-500 text-[11px]">{localProjects.length} Proyek Lokal</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Unggah semua proyek yang saat ini ada di browser lokal Anda ke tabel Master Hub di cloud.
              </p>
              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating || localProjects.length === 0}
                className="brutal-btn-primary px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {migrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                <span>{migrating ? 'Memigrasikan...' : 'Unggah Proyek Lokal ke Master Hub'}</span>
              </button>
              {migrationMessage && (
                <p className="text-cyan-400 text-[11px] font-sans mt-1">{migrationMessage}</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-950/40 border border-rose-900/60 transition-colors text-xs"
              >
                <Unplug className="w-4 h-4" />
                <span>Putuskan Master Hub</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="brutal-btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Tutup
                </button>

                {fromTour && onContinueTour && (
                  <button
                    type="button"
                    onClick={onContinueTour}
                    className="brutal-btn-primary px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <span>Lanjut Panduan (Langkah 4)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Master URL input */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Supabase Project URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="https://your-main-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-sm"
              />
            </div>

            {/* Master Anon Key input */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Public Anon Key <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-sm"
              />
            </div>

            {/* Shortcut to SQL Setup */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Belum buat tabel di database Master?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSqlModal();
                }}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Lihat Skrip SQL</span>
              </button>
            </div>

            {/* Test result feedback */}
            {testStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="break-all">{testStatus.message}</p>
                  {!testStatus.tableReady && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSqlModal();
                      }}
                      className="text-cyan-400 underline font-bold inline-block"
                    >
                      Buka SQL Editor &rarr; Jalankan Skrip sentinel_registry
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full sm:w-auto brutal-btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{testing ? 'Menguji...' : 'Uji Koneksi Master Hub'}</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={!url.trim() || !anonKey.trim()}
                  className="w-1/2 sm:w-auto brutal-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 font-bold"
                >
                  <span>{fromTour ? 'Simpan & Lanjut Panduan' : 'Simpan & Hubungkan'}</span>
                  {fromTour && <ArrowRight className="w-3.5 h-3.5 text-black" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
