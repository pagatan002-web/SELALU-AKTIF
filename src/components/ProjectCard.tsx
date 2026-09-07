import { useState } from 'react';
import type { SupabaseProject } from '../types/sentinel';
import { HealthStatusBadge } from './HealthStatusBadge';
import { 
  Zap, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Clock, 
  Activity, 
  Database, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface Props {
  project: SupabaseProject;
  isPinging: boolean;
  onPing: (project: SupabaseProject) => void;
  onEdit: (project: SupabaseProject) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectCard: React.FC<Props> = ({
  project,
  isPinging,
  onPing,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Belum pernah disapa';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  return (
    <div className="glass-brutal-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group">
      {/* Decorative top corner accent glow */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 transition-opacity duration-300 opacity-20 group-hover:opacity-40 pointer-events-none ${
          project.status === 'healthy' ? 'bg-emerald-500' :
          project.status === 'warning' ? 'bg-amber-500' :
          project.status === 'paused' ? 'bg-rose-500' : 'bg-cyan-500'
        }`} 
      />

      <div>
        {/* Header: Project Name & Health Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] sm:max-w-[260px]">
                {project.url.replace(/^https?:\/\//, '')}
              </span>
              <button
                onClick={handleCopyUrl}
                title="Salin Supabase URL"
                className="text-slate-500 hover:text-cyan-400 p-1 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-cyan-400 p-1 rounded transition-colors"
                title="Buka Supabase URL"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <HealthStatusBadge status={project.status} size="sm" />
        </div>

        {/* Badges / Metadata Tags */}
        <div className="flex flex-wrap items-center gap-2 my-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Tabel:</span>
            <span className="font-bold text-slate-200">{project.targetTable || '_heartbeat'}</span>
          </div>

          <div 
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-mono font-semibold ${
              project.targetMode === 'wal_mutation'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
            }`}
          >
            {project.targetMode === 'wal_mutation' ? '⚡ WAL Mutation' : '🔍 Dynamic Count'}
          </div>
        </div>

        {/* Stats Strip: Last Ping & Latency */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 mb-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block leading-tight">TERAKHIR DISAPA</span>
              <span className="text-slate-200 font-semibold">{getRelativeTime(project.lastPingAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800/80 pl-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block leading-tight">LATENSI / KODE</span>
              <span className="text-slate-200 font-semibold">
                {project.lastLatencyMs ? `${project.lastLatencyMs} ms` : '-'}
                {project.lastStatusCode ? ` (${project.lastStatusCode})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Details Drawer */}
        {expanded && (
          <div className="p-3 mb-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-slate-400">
              <span>Status HTTP:</span>
              <span className={project.lastStatusCode === 200 || project.lastStatusCode === 201 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {project.lastStatusCode ? `${project.lastStatusCode} ${project.lastStatusText || ''}` : 'Belum ada'}
              </span>
            </div>
            {project.lastError && (
              <div className="text-rose-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="break-all">{project.lastError}</span>
              </div>
            )}
            {project.notes && (
              <div className="text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">CATATAN:</span>
                <p className="text-slate-300 font-sans">{project.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-800/60"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{expanded ? 'Tutup' : 'Detail'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(project)}
            title="Edit Proyek"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all hover:scale-105 active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(project.id)}
            title="Hapus Proyek"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/60 transition-all hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onPing(project)}
            disabled={isPinging}
            className={`brutal-btn-emerald py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Menyapa...' : 'Sapa Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
