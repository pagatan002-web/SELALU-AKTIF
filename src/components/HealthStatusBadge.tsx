import type { ProjectStatus } from '../types/sentinel';

interface Props {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const HealthStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const config = {
    healthy: {
      label: 'AKTIF & SEHAT',
      bg: 'bg-emerald-500/12',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      shadow: 'shadow-[0_2px_10px_rgba(16,185,129,0.2)]',
      dotBg: 'bg-emerald-400',
      pingBg: 'bg-emerald-400',
    },
    warning: {
      label: 'PERLU PERHATIAN',
      bg: 'bg-amber-500/12',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      shadow: 'shadow-[0_2px_10px_rgba(245,158,11,0.2)]',
      dotBg: 'bg-amber-400',
      pingBg: 'bg-amber-400',
    },
    paused: {
      label: 'TERHENTI / ERROR',
      bg: 'bg-rose-500/12',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      shadow: 'shadow-[0_2px_10px_rgba(244,63,94,0.2)]',
      dotBg: 'bg-rose-400',
      pingBg: 'bg-rose-400',
    },
    unknown: {
      label: 'BELUM DISAPA',
      bg: 'bg-slate-800/40',
      text: 'text-slate-300',
      border: 'border-slate-700/50',
      shadow: 'shadow-[0_2px_8px_rgba(100,116,139,0.1)]',
      dotBg: 'bg-slate-400',
      pingBg: 'bg-slate-400',
    },
  }[status];

  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-0.5 text-[10px] gap-1.5' 
    : 'px-3 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider rounded-full border backdrop-blur-md ${config.bg} ${config.text} ${config.border} ${config.shadow} ${sizeClasses} transition-all`}
    >
      <span className="relative flex h-2 w-2">
        {status !== 'unknown' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingBg}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`} />
      </span>
      <span>{config.label}</span>
    </span>
  );
};
