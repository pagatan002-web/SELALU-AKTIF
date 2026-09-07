import { useState, useEffect } from 'react';
import type { SupabaseProject, HeartbeatMode } from '../types/sentinel';
import { executeHeartbeat, sanitizeSupabaseUrl } from '../lib/sentinel';
import { X, Sparkles, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<SupabaseProject>) => void;
  initialProject?: SupabaseProject | null;
}

export const AddProjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [targetTable, setTargetTable] = useState('_heartbeat');
  const [targetMode, setTargetMode] = useState<HeartbeatMode>('wal_mutation');
  const [notes, setNotes] = useState('');

  // Live Test State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setUrl(initialProject.url);
      setAnonKey(initialProject.anonKey);
      setServiceRoleKey(initialProject.serviceRoleKey || '');
      setTargetTable(initialProject.targetTable || '_heartbeat');
      setTargetMode(initialProject.targetMode || 'wal_mutation');
      setNotes(initialProject.notes || '');
    } else {
      setName('');
      setUrl('');
      setAnonKey('');
      setServiceRoleKey('');
      setTargetTable('_heartbeat');
      setTargetMode('wal_mutation');
      setNotes('');
    }
    setTestResult(null);
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Harap isi Supabase URL dan Anon Key terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const tempProject: SupabaseProject = {
      id: 'temp-test',
      name: name || 'Test Project',
      url: sanitizeSupabaseUrl(url),
      anonKey: anonKey.trim(),
      serviceRoleKey: serviceRoleKey.trim() || undefined,
      targetTable: targetTable.trim() || '_heartbeat',
      targetMode,
      status: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await executeHeartbeat(tempProject);
    setTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: `Koneksi Berhasil! Latensi: ${res.latencyMs}ms | ${res.details}`,
      });
    } else {
      setTestResult({
        success: false,
        message: `Koneksi Gagal (${res.statusCode || 'Offline'}): ${res.error || res.details}`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !anonKey.trim()) {
      alert('Nama, Supabase URL, dan Anon Key wajib diisi.');
      return;
    }

    onSave({
      name: name.trim(),
      url: sanitizeSupabaseUrl(url),
      anonKey: anonKey.trim(),
      serviceRoleKey: serviceRoleKey.trim() || undefined,
      targetTable: targetTable.trim() || '_heartbeat',
      targetMode,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-brutal-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {initialProject ? 'Edit Konfigurasi Proyek' : 'Tambah Proyek Supabase'}
              </h2>
              <p className="text-xs text-slate-400">
                Pantau dan jaga proyek database agar selalu aktif 24/7
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Proyek <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: KAWAL Main DB / SIMDIK V3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-sans text-sm"
            />
          </div>

          {/* Supabase URL */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Supabase Project URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://xyzabcdefghijklmnop.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono text-sm"
            />
          </div>

          {/* Anon Key */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Anon Public Key <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-slate-400 lowercase">disimpan di browser lokal</span>
            </label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono text-sm"
            />
          </div>

          {/* Service Role Key (Optional) */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Service Role Key (Opsional)</span>
              <span className="text-[10px] text-amber-400 font-sans">khusus tabel terlindungi RLS</span>
            </label>
            <input
              type="password"
              placeholder="Opsional - gunakan jika tabel heartbeat tidak bisa diakses anon"
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono text-sm"
            />
          </div>

          {/* Target Table & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Tabel Heartbeat
              </label>
              <input
                type="text"
                placeholder="_heartbeat"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Metode Transaksi
              </label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as HeartbeatMode)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
              >
                <option value="wal_mutation">⚡ WAL Mutation (Sangat Direkomendasikan)</option>
                <option value="query_count">🔍 Dynamic Count Read</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Catatan Proyek (Opsional)
            </label>
            <input
              type="text"
              placeholder="Keterangan singkat..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans text-sm"
            />
          </div>

          {/* Live Test Feedback Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span className="break-all">{testResult.message}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full sm:w-auto brutal-btn-secondary px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{testing ? 'Menguji...' : 'Uji Koneksi (Test)'}</span>
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
                type="submit"
                className="w-1/2 sm:w-auto brutal-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {initialProject ? 'Simpan Perubahan' : 'Tambah ke Sentinel'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
