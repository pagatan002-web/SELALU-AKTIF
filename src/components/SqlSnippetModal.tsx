import { useState } from 'react';
import { X, Copy, Check, Code, Sparkles, Server, Database, ArrowRight } from 'lucide-react';
import { MASTER_HUB_SQL, TARGET_DB_SQL } from '../lib/sqlScripts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fromTour?: boolean;
  onContinueTour?: () => void;
}

export const SqlSnippetModal: React.FC<Props> = ({ 
  isOpen, 
  onClose,
  fromTour = false,
  onContinueTour,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'master' | 'target'>('master');

  if (!isOpen) return null;

  const masterHubSql = MASTER_HUB_SQL;
  const targetDbSql = TARGET_DB_SQL;

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

        {/* Tour Status Banner if opened from onboarding */}
        {fromTour && (
          <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-200">
                <strong className="text-cyan-300">Mode Panduan:</strong> Salin skrip Master Hub, lalu klik tombol lanjut di bawah untuk kembali ke panduan.
              </span>
            </div>
            {onContinueTour && (
              <button
                type="button"
                onClick={onContinueTour}
                className="shrink-0 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <span>Lanjut Panduan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

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
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {fromTour && onContinueTour ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Tutup & Kembali
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="brutal-btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    onContinueTour();
                  }}
                  className="brutal-btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer font-extrabold"
                >
                  <span>Salin & Lanjut Panduan (Langkah 3)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="brutal-btn-primary px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copied ? 'SQL Berhasil Disalin!' : 'Salin Seluruh Skrip SQL'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
