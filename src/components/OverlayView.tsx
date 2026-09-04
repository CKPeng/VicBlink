import React, { useEffect } from 'react';
import { TimerRing } from './TimerRing';
import { Eye, X, Compass, Sparkles, Shield, Waves, CloudRain, Wind, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { AmbientSoundType } from '../utils/sound';

interface OverlayViewProps {
  timeRemaining: number;
  totalDuration: number;
  progress: number;
  isStrictMode: boolean;
  isMicroBreak?: boolean;
  ambientSound?: AmbientSoundType;
  onSkip: () => void;
}

export const OverlayView: React.FC<OverlayViewProps> = ({
  timeRemaining,
  progress,
  isStrictMode,
  isMicroBreak = false,
  ambientSound = 'none',
  onSkip,
}) => {
  // 监听按键：严厉模式下禁用 Esc 逃生
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isStrictMode) {
          onSkip();
        } else {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStrictMode, onSkip]);

  const getAmbientIcon = () => {
    switch (ambientSound) {
      case 'ocean':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'wind':
        return <Wind className="w-3.5 h-3.5 text-teal-400" />;
      case 'fire':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return null;
    }
  };

  const ambientLabels: Record<AmbientSoundType, string> = {
    none: '',
    ocean: '海浪微风',
    rain: '山间晨雨',
    wind: '林间风声',
    fire: '壁炉柴火',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-3xl text-white select-none overflow-hidden transition-all duration-1000">
      {/* 柔和呼吸微光光晕 */}
      <div className="absolute w-[620px] h-[620px] rounded-full bg-emerald-500/10 blur-3xl animate-breathe pointer-events-none" />

      {/* 右上角跳过按钮（严厉模式下完全隐藏） */}
      {!isStrictMode ? (
        <button
          onClick={onSkip}
          className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-200 text-sm group shadow-lg"
          title="按 Esc 键立即跳过"
        >
          <span>跳过本次远眺</span>
          <span className="px-1.5 py-0.5 rounded bg-white/15 text-[11px] font-mono text-slate-300 group-hover:bg-white/25">
            Esc
          </span>
          <X className="w-4 h-4 ml-0.5 opacity-70 group-hover:opacity-100" />
        </button>
      ) : (
        <div className="absolute top-8 right-8 flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs shadow-lg backdrop-blur-md">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>严厉护眼模式（请耐心休息满 20 秒）</span>
        </div>
      )}

      {/* 顶部指示胶囊 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium shadow-inner">
          <Eye className="w-4 h-4 animate-pulse-subtle" />
          <span>{isMicroBreak ? '番茄微休息：20 秒眨眼远眺' : '20-20-20 护眼法则生效中'}</span>
        </div>

        {ambientSound !== 'none' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 backdrop-blur-sm">
            {getAmbientIcon()}
            <span>伴奏: {ambientLabels[ambientSound]}</span>
          </div>
        )}
      </motion.div>

      {/* 中央核心：20秒呼吸倒计时 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative my-4"
      >
        <TimerRing
          progress={progress}
          size={320}
          strokeWidth={12}
          color={isStrictMode ? '#F59E0B' : '#10B981'}
          bgColor="rgba(255, 255, 255, 0.06)"
        >
          <div className="flex flex-col items-center">
            <span className="text-7xl font-light tracking-tighter text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] font-mono">
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
          眨眨眼，缓缓深呼吸。让长时间紧绷的睫状肌自然延展，只需 20 秒即可重焕双眼神采。
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