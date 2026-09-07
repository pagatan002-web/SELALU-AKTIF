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
  Zap
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSqlModal: () => void;
  onOpenMasterHubModal: () => void;
  onOpenAddModal: () => void;
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

export const OnboardingGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenSqlModal,
  onOpenMasterHubModal,
  onOpenAddModal,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

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
        'Buka menu SQL Snippet pada aplikasi ini.',
        'Salin skrip SQL "Master Hub (sentinel_registry)".',
        'Tempelkan ke Supabase SQL Editor database Master Anda lalu klik RUN.',
      ],
      actionLabel: 'Buka SQL Snippet Sekarang',
      actionIcon: <Code className="w-4 h-4" />,
      onAction: () => {
        onClose();
        onOpenSqlModal();
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
        'Klik tombol "Master Hub" di navbar atas.',
        'Masukkan URL Supabase dan Anon Key database Master Anda.',
        'Klik tombol "Uji Koneksi" & "Simpan & Hubungkan".',
      ],
      actionLabel: 'Buka Pengaturan Master Hub',
      actionIcon: <Server className="w-4 h-4" />,
      onAction: () => {
        onClose();
        onOpenMasterHubModal();
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
        'Klik tombol "+ Tambah Proyek Baru".',
        'Isi Nama Proyek, URL Supabase, dan Anon Key.',
        'Gunakan tombol "Uji Koneksi (Test)" sebelum menyimpan.',
        'Pilih metode transaksi (WAL Mutation atau Dynamic Count).',
      ],
      actionLabel: 'Tambah Proyek Pertama',
      actionIcon: <Plus className="w-4 h-4" />,
      onAction: () => {
        onClose();
        onOpenAddModal();
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
        onClose();
      },
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.3 },
        });
      } catch {}
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
            onClick={onClose}
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

          {/* Contextual Action Button (if any) */}
          {current.actionLabel && current.onAction && (
            <div className="pt-1">
              <button
                type="button"
                onClick={current.onAction}
                className="w-full brutal-btn-emerald py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
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
                onClick={() => setCurrentStep(idx)}
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
      </div>
    </div>
  );
};
