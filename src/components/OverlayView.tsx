import React, { useEffect } from 'react';
import { TimerRing } from './TimerRing';
import { Eye, X, Compass, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface OverlayViewProps {
  timeRemaining: number;
  totalDuration: number;
  progress: number;
  onSkip: () => void;
}

export const OverlayView: React.FC<OverlayViewProps> = ({
  timeRemaining,
  progress,
  onSkip,
}) => {
  // 监听 Escape 键跳过/退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-3xl text-white select-none overflow-hidden transition-all duration-1000">
      {/* 柔和呼吸微光光晕 */}
      <div className="absolute w-[580px] h-[580px] rounded-full bg-emerald-500/10 blur-3xl animate-breathe pointer-events-none" />

      {/* 右上角跳过按钮（温柔模式逃生通道） */}
      <button
        onClick={onSkip}
        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-200 text-sm group shadow-lg"
        title="按 Esc 键立即跳过"
      >
        <span>跳过本次远眺</span>
        <span className="px-1.5 py-0.5 rounded bg-white/15 text-[11px] font-mono text-slate-300 group-hover:bg-white/25">Esc</span>
        <X className="w-4 h-4 ml-0.5 opacity-70 group-hover:opacity-100" />
      </button>

      {/* 顶部标题区 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-10 shadow-inner"
      >
        <Eye className="w-4 h-4 animate-pulse-subtle" />
        <span>20-20-20 护眼法则生效中</span>
      </motion.div>

      {/* 中央核心：20秒呼吸倒计时 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative my-4"
      >
        <TimerRing
          progress={progress}
          size={320}
          strokeWidth={12}
          color="#10B981"
          bgColor="rgba(255, 255, 255, 0.06)"
        >
          <div className="flex flex-col items-center">
            <span className="text-7xl font-light tracking-tighter text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              {timeRemaining}
            </span>
            <span className="text-xs uppercase tracking-widest text-emerald-400/80 font-medium mt-1">
              SECONDS
            </span>
          </div>
        </TimerRing>
      </motion.div>

      {/* 底部引导文案 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center max-w-lg mt-8 px-6 space-y-3"
      >
        <h2 className="text-2xl font-medium tracking-tight text-slate-100 flex items-center justify-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          看向 6 米（20 英尺）外的窗外或远方
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          眨眨眼，缓缓深呼吸。让长时间紧绷的眼部睫状肌彻底舒展放松，只需 20 秒。
        </p>

        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500/80" /> 舒缓睫状肌
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>促进泪液循环</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>恢复专注心流</span>
        </div>
      </motion.div>
    </div>
  );
};