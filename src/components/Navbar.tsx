import type { SentinelStats } from '../types/sentinel';
import type { MasterHubConfig } from '../lib/masterHub';
import { Activity, Plus, Zap, GitBranch, Code, Server, HelpCircle } from 'lucide-react';

interface Props {
  stats: SentinelStats;
  isPingingAll: boolean;
  masterConfig: MasterHubConfig | null;
  onWakeUpAll: () => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenSqlModal: () => void;
  onOpenMasterHubModal: () => void;
  onOpenOnboardingModal: () => void;
}

export const Navbar: React.FC<Props> = ({
  stats,
  isPingingAll,
  masterConfig,
  onWakeUpAll,
  onOpenAddModal,
  onOpenExportModal,
  onOpenSqlModal,
  onOpenMasterHubModal,
  onOpenOnboardingModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/70 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Sentinel Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 shadow-[0_2px_14px_rgba(6,182,212,0.22)]">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-100 flex items-center gap-1.5">
                  SELALU <span className="text-cyan-400 bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">AKTIF</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/90 text-cyan-300 border border-cyan-500/25">
                  SENTINEL v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide">
                Centralized Supabase Heartbeat &amp; Anti Auto-Pause
              </p>
            </div>
          </div>

          {/* Mobile Fast Action */}
          <div className="md:hidden">
            <button
              onClick={onOpenAddModal}
              className="p-2 rounded-xl brutal-btn-primary text-xs"
              title="Tambah Proyek"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Health Overview Pills (Compact, No Scroll, No Wrap) */}
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 py-0.5">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 shadow-xs whitespace-nowrap">
            <span className="text-slate-400 text-[10px]">TOTAL:</span>
            <span className="font-bold text-slate-100">{stats.total}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 shadow-[0_2px_8px_rgba(16,185,129,0.15)] flex items-center gap-2 whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300 font-bold">{stats.healthy} Aktif</span>
          </div>

          {stats.warning > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30 shadow-[0_2px_8px_rgba(245,158,11,0.15)] flex items-center gap-1.5 text-amber-300 font-bold whitespace-nowrap">
              <span>⚠️</span>
              <span>{stats.warning} Perlu Ping</span>
            </div>
          )}

          {stats.pausedOrError > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 shadow-[0_2px_8px_rgba(244,63,94,0.15)] flex items-center gap-1.5 text-rose-300 font-bold whitespace-nowrap">
              <span>🛑</span>
              <span>{stats.pausedOrError} Error</span>
            </div>
          )}

          {stats.averageLatencyMs > 0 && (
            <div 
              className="hidden sm:flex px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 items-center gap-1.5 whitespace-nowrap shadow-xs"
              title="Rata-rata Latensi Respon Database"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-cyan-300 font-bold">{stats.averageLatencyMs} ms</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          {/* Master Hub Connection Badge */}
          {masterConfig ? (
            <button
              onClick={onOpenMasterHubModal}
              className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-[0_2px_12px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:brightness-110 transition-all whitespace-nowrap"
              title="Kelola Master Hub Central"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="hidden xl:inline">Master Hub:</span>
              <span className="max-w-[100px] truncate">{masterConfig.url.replace(/^https?:\/\//, '')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenMasterHubModal}
              className="brutal-btn-secondary px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer text-amber-300 border-amber-500/30 hover:border-amber-400 whitespace-nowrap"
              title="Hubungkan ke Master Hub Supabase"
            >
              <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Master Hub</span>
            </button>
          )}

          <button
            onClick={onOpenOnboardingModal}
            className="brutal-btn-secondary px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer text-cyan-300 border-cyan-500/30 hover:border-cyan-400 shadow-[0_2px_10px_rgba(6,182,212,0.12)] whitespace-nowrap"
            title="Buka Panduan Langkah Penggunaan"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          <button
            onClick={onOpenSqlModal}
            className="brutal-btn-secondary px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:border-emerald-500/40 whitespace-nowrap"
            title="Lihat SQL Heartbeat Table"
          >
            <Code className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">SQL Snippet</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="brutal-btn-secondary px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:border-cyan-500/40 whitespace-nowrap"
            title="Export Konfigurasi GitHub Actions"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">GitHub Secret</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="hidden sm:flex brutal-btn-secondary px-3.5 py-2 rounded-xl text-xs items-center gap-1.5 cursor-pointer hover:border-slate-500 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span>Tambah</span>
          </button>

          <button
            onClick={onWakeUpAll}
            disabled={isPingingAll || stats.total === 0}
            className="brutal-btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Zap className={`w-4 h-4 shrink-0 ${isPingingAll ? 'animate-spin' : ''}`} />
            <span className="font-extrabold">{isPingingAll ? 'Menyapa Semua...' : 'Wake-Up Semua'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
