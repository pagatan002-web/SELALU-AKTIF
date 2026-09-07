import type { PingLog } from '../types/sentinel';
import { Terminal, Trash2, CheckCircle, XCircle, Zap } from 'lucide-react';

interface Props {
  logs: PingLog[];
  onClearLogs: () => void;
}

export const ActivityLogTable: React.FC<Props> = ({ logs, onClearLogs }) => {
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="glass-brutal-panel rounded-3xl p-5 sm:p-6 mt-8">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <span>Aktivitas Sentinel &amp; Riwayat WAL</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-850 text-slate-400 font-mono border border-slate-800">
                {logs.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit log real-time transaksi heartbeat database
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-800/60 bg-slate-900/60 transition-all font-mono cursor-pointer"
            title="Bersihkan seluruh log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        )}
      </div>

      {/* Logs Content */}
      {logs.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-mono text-xs">
          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-25 text-slate-400" />
          <p>Belum ada riwayat heartbeat tersimpan.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Klik tombol &quot;Sapa Sekarang&quot; pada salah satu kartu proyek di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-2.5 font-bold">Waktu</th>
                <th className="pb-2.5 font-bold">Proyek</th>
                <th className="pb-2.5 font-bold">Metode</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 font-bold">Latensi</th>
                <th className="pb-2.5 font-bold hidden sm:table-cell">Detail Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-2.5 text-slate-400 whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="py-2.5 font-bold text-slate-100 whitespace-nowrap">
                    {log.projectName}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300">
                      <Zap className="w-2.5 h-2.5" />
                      {log.mode === 'wal_mutation' ? 'POST (WAL)' : 'GET (COUNT)'}
                    </span>
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        log.success
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {log.success ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      )}
                      <span>{log.statusCode ? `${log.statusCode} ${log.statusText}` : 'Offline'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-cyan-300 font-semibold whitespace-nowrap">
                    {log.latencyMs} ms
                  </td>
                  <td className="py-2.5 text-slate-400 max-w-xs truncate hidden sm:table-cell font-sans text-xs">
                    {log.details || log.error || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
