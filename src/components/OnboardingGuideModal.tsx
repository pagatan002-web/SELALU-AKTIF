import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Database, 
  Server, 
  GitBranch, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Code, 
  Plus, 
  Zap,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { MASTER_HUB_SQL } from '../lib/sqlScripts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stepIndex?: number;
  onStepChange?: (step: number) => void;
  onOpenSqlModal: (currentStepIndex: number) => void;
  onOpenMasterHubModal: (currentStepIndex: number) => void;
  onOpenAddModal: (currentStepIndex: number) => void;
}

interface StepInfo {
  number: number;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  detailPoints: string[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

export const DONT_SHOW_GUIDE_KEY = 'selalu_aktif_dont_show_guide_again';

export const OnboardingGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stepIndex = 0,
  onStepChange,
  onOpenSqlModal,
  onOpenMasterHubModal,
  onOpenAddModal,
}) => {
  const [internalStep, setInternalStep] = useState(stepIndex);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const currentStep = onStepChange ? stepIndex : internalStep;

  const handleStepChange = (nextStep: number) => {
    if (onStepChange) {
      onStepChange(nextStep);
    } else {
      setInternalStep(nextStep);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const isSaved = localStorage.getItem(DONT_SHOW_GUIDE_KEY) === 'true';
      setDontShowAgain(isSaved);
    }
  }, [isOpen]);

  const handleQuickCopySql = () => {
    navigator.clipboard.writeText(MASTER_HUB_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSavePreferenceAndClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_GUIDE_KEY, 'true');
    } else {
      localStorage.removeItem(DONT_SHOW_GUIDE_KEY);
    }
    onClose();
  };

  if (!isOpen) return null;

  const steps: StepInfo[] = [
    {
      number: 1,
      badge: 'LANGKAH 1 DARI 5',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      title: 'Selamat Datang di SELALU AKTIF! ⚡',
      description: 
        'Aplikasi sentral pemantau keaktifan database Supabase (Free Tier) agar tidak pernah terkena auto-pause 7 hari.',
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      detailPoints: [
        'Supabase mematikan database gratis jika tidak ada aktivitas selama 7 hari berturut-turut.',
        'Ping statis CDN biasa diblokir oleh Supabase.',
        'SELALU AKTIF menjalankan transaksi disk nyata (WAL) organik yang dikenali 100% sebagai aktivitas asli.',
      ],
    },
    {
      number: 2,
      badge: 'LANGKAH 2 DARI 5',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      title: 'Buat Tabel di 1 Supabase Master Anda 📋',
      description:
        'Pilih salah satu proyek Supabase Anda untuk dijadikan Master Hub penyimpan daftar proyek terpusat.',
      icon: <Code className="w-8 h-8 text-emerald-400" />,
      detailPoints: [
        'Klik tombol salin di bawah ini (atau buka halaman SQL Snippet).',
        'Tempelkan ke Supabase SQL Editor database Master Anda lalu klik RUN.',
        'Setelah tabel terbentuk, klik tombol "Lanjut" ke langkah berikutnya.',
      ],
      actionLabel: 'Atau Buka Halaman SQL Snippet Lengkap',
      actionIcon: <ExternalLink className="w-4 h-4" />,
      onAction: () => {
        onOpenSqlModal(1);
      },
    },
    {
      number: 3,
      badge: 'LANGKAH 3 DARI 5',
      badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
      title: 'Hubungkan Web ke Master Hub 🔌',
      description:
        'Sambungkan dashboard ini ke database Master Anda agar seluruh penambahan proyek tersimpan otomatis.',
      icon: <Server className="w-8 h-8 text-violet-400" />,
      detailPoints: [
        'Klik tombol "Buka Pengaturan Master Hub" di bawah.',
        'Masukkan URL Supabase dan Anon Key database Master Anda.',
        'Klik tombol "Uji Koneksi" & "Simpan & Lanjut Panduan".',
      ],
      actionLabel: 'Buka Pengaturan Master Hub',
      actionIcon: <Server className="w-4 h-4" />,
      onAction: () => {
        onOpenMasterHubModal(2);
      },
    },
    {
      number: 4,
      badge: 'LANGKAH 4 DARI 5',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      title: 'Daftarkan Database Target Anda 🎯',
      description:
        'Masukkan proyek Supabase lain yang ingin Anda jaga agar tidak pernah tidur (KAWAL, SIMDIK, BAKUMPUL, dll.).',
      icon: <Database className="w-8 h-8 text-amber-400" />,
      detailPoints: [
        'Klik tombol "Tambah Proyek Pertama" di bawah.',
        'Isi Nama Proyek, URL Supabase, dan Anon Key proyek target.',
        'Gunakan tombol "Uji Koneksi (Test)" sebelum menyimpan.',
        'Data proyek akan otomatis tersinkronisasi ke Master Hub Anda di cloud.',
      ],
      actionLabel: 'Tambah Proyek Pertama',
      actionIcon: <Plus className="w-4 h-4" />,
      onAction: () => {
        onOpenAddModal(3);
      },
    },
    {
      number: 5,
      badge: 'LANGKAH 5 DARI 5',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      title: 'Aktifkan Robot GitHub Actions 24/7 🚀',
      description:
        'Langkah terakhir! Pasang jadwal otomatis di cloud agar laptop Anda bebas dimatikan kapan saja.',
      icon: <GitBranch className="w-8 h-8 text-cyan-400" />,
      detailPoints: [
        'Buka repositori GitHub Anda ➔ Settings ➔ Secrets ➔ Actions.',
        'Tambahkan 2 Secret: MASTER_SUPABASE_URL & MASTER_SUPABASE_KEY.',
        'GitHub Actions otomatis menyapa seluruh database setiap 3 hari sekali.',
        'Anda TIDAK PERLU lagi menyalin secret setiap ada proyek baru!',
      ],
      actionLabel: 'Selesai & Rayakan! 🎉',
      actionIcon: <Sparkles className="w-4 h-4 text-black" />,
      onAction: () => {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.3 },
            colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
          });
        } catch {}
        handleSavePreferenceAndClose();
      },
    },
  ];

  const current = steps[currentStep] || steps[0];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    } else {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.3 },
        });
      } catch {}
      handleSavePreferenceAndClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-brutal-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-5">
          <div 
            className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header Badge & Close Button */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${current.badgeColor}`}>
              {current.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">PANDUAN INTERAKTIF</span>
          </div>

          <button
            onClick={handleSavePreferenceAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Card Content with Animated Micro-interactions */}
        <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-right-3 duration-250 key={currentStep}">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 shadow-brutal flex items-center justify-center shrink-0">
              {current.icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {current.title}
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Checklist Points */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              POIN PENTING TAHAP INI:
            </span>
            <div className="space-y-2 font-sans text-xs">
              {current.detailPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick 1-Click Copy Box for Step 2 (Master Hub SQL) */}
          {currentStep === 1 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-brutal space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Code className="w-4 h-4" />
                  <span>Skrip SQL Master Hub (sentinel_registry)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  1-KLIK SALIN
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Salin langsung dari sini tanpa perlu meninggalkan panduan:
              </p>
              <button
                type="button"
                onClick={handleQuickCopySql}
                className="w-full brutal-btn-emerald py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-extrabold shadow-sm transition-all"
              >
                {copiedSql ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedSql ? '✅ Skrip SQL Master Hub Berhasil Disalin!' : '📋 Salin Skrip SQL Master Hub Sekarang'}</span>
              </button>
              {copiedSql ? (
                <p className="text-[11px] text-emerald-300 font-mono text-center animate-in fade-in py-1">
                  Buka tab Supabase SQL Editor Master &rarr; Tempel (Ctrl+V) &rarr; RUN. Lalu klik <strong>Lanjut &gt;</strong> di bawah!
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 text-center font-mono">
                  Setelah disalin &amp; di-RUN di Supabase Master, klik <strong>Lanjut &gt;</strong>
                </p>
              )}
            </div>
          )}

          {/* Contextual Action Button (if any) */}
          {current.actionLabel && current.onAction && (
            <div className="pt-1">
              <button
                type="button"
                onClick={current.onAction}
                className={`w-full py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  currentStep === 1
                    ? 'brutal-btn-secondary border-slate-700 text-slate-300 hover:text-white'
                    : 'brutal-btn-emerald font-extrabold'
                }`}
              >
                {current.actionIcon}
                <span className="font-extrabold">{current.actionLabel}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleStepChange(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-cyan-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Ke langkah ${idx + 1}`}
              />
            ))}
          </div>

          {/* Back & Next Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="brutal-btn-primary px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Selesai' : 'Lanjut'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </div>

        {/* Checkbox: Jangan tampilkan lagi secara otomatis */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200 select-none font-mono">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-2 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
            />
            <span>Jangan tampilkan panduan ini lagi secara otomatis</span>
          </label>
        </div>
      </div>
    </div>
  );
};
