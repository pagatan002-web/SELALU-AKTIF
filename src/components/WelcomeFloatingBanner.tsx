import { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { DONT_SHOW_GUIDE_KEY } from './OnboardingGuideModal';

interface Props {
  onStartTour: () => void;
}

export const WelcomeFloatingBanner: React.FC<Props> = ({ onStartTour }) => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user chose to never show again
    const isPermanentlyDismissed = localStorage.getItem(DONT_SHOW_GUIDE_KEY) === 'true';
    if (!isPermanentlyDismissed) {
      // Delay entrance slightly for natural feel
      const timer = setTimeout(() => {
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_GUIDE_KEY, 'true');
    }
    setVisible(false);
  };

  const handleStart = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_GUIDE_KEY, 'true');
    }
    setVisible(false);
    onStartTour();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="glass-brutal-panel rounded-3xl p-5 border-2 border-cyan-500/50 shadow-brutal-cyan relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>PANDUAN PENGGUNA</span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <span>Panduan Memulai Cepat</span>
            <span className="text-xs">👋</span>
          </h4>
          <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
            Ikuti 5 tahap mudah untuk menyiapkan Master Hub dan menjaga seluruh database Supabase Anda tetap aktif 24/7.
          </p>
        </div>

        {/* Checkbox: Jangan tampilkan lagi */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300 font-mono select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
            />
            <span>Jangan tampilkan lagi secara otomatis</span>
          </label>
        </div>

        <div className="mt-3 pt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="brutal-btn-primary px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buka Panduan</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
