import { useState } from 'react';
import type { SupabaseProject } from '../types/sentinel';
import { X, Copy, Check, Download, Key, GitBranch, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: SupabaseProject[];
}

export const ExportSecretModal: React.FC<Props> = ({ isOpen, onClose, projects }) => {
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  if (!isOpen) return null;

  // Clean export structure for GitHub Actions & standalone runner
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

  const handleCopy = () => {
    navigator.clipboard.writeText(rawFullConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([rawFullConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selalu-aktif-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/40 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Export GitHub Actions Secret
              </h2>
              <p className="text-xs text-slate-400">
                Gunakan JSON ini untuk mengaktifkan automasi cloud cron 24/7 tanpa laptop menyala
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

        {/* Instructions */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Langkah Aktivasi Otomatis di GitHub:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 font-sans">
            <li>Buka repositori GitHub Anda &rarr; Klik tab <strong className="text-white">Settings</strong>.</li>
            <li>Di bilah samping, pilih <strong className="text-white">Secrets and variables</strong> &rarr; <strong className="text-white">Actions</strong>.</li>
            <li>Klik tombol <strong className="text-white">New repository secret</strong>.</li>
            <li>Isi nama rahasia: <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono font-bold">SENTINEL_PROJECTS</code>.</li>
            <li>Klik tombol <strong className="text-white">&quot;Salin Konfigurasi JSON&quot;</strong> di bawah dan tempelkan isinya ke Value Secret.</li>
          </ol>
        </div>

        {/* JSON Preview Box */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
            <span>JSON Konfigurasi ({projects.length} Proyek)</span>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeys ? 'Sembunyikan Kunci' : 'Lihat Kunci Lengkap'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-56">
            {displayJson}
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto brutal-btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto brutal-btn-primary px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Konfigurasi JSON Lengkap'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
