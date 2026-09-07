import type { ProjectStatus } from '../types/sentinel';

interface Props {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const HealthStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const config = {
    healthy: {
      label: 'AKTIF & SEHAT',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/50',
      shadow: 'shadow-[2px_2px_0px_#10b981]',
      dotBg: 'bg-emerald-400',
      pingBg: 'bg-emerald-400',
    },
    warning: {
      label: 'PERLU PERHATIAN',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/50',
      shadow: 'shadow-[2px_2px_0px_#f59e0b]',
      dotBg: 'bg-amber-400',
      pingBg: 'bg-amber-400',
    },
    paused: {
      label: 'TERHENTI / ERROR',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/50',
      shadow: 'shadow-[2px_2px_0px_#f43f5e]',
      dotBg: 'bg-rose-500',
      pingBg: 'bg-rose-400',
    },
    unknown: {
      label: 'BELUM DISAPA',
      bg: 'bg-slate-700/20',
      text: 'text-slate-400',
      border: 'border-slate-600/50',
      shadow: 'shadow-[2px_2px_0px_#64748b]',
      dotBg: 'bg-slate-400',
      pingBg: 'bg-slate-400',
    },
  }[status];

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px] gap-1.5' 
    : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider rounded-md border ${config.bg} ${config.text} ${config.border} ${config.shadow} ${sizeClasses}`}
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
