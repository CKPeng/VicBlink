import React from 'react';
import { TimerRing } from './TimerRing';
import { TimerMode } from '../hooks/useTimer';
import { Play, RotateCcw, Eye, Clock, Coffee, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface TrayPopoverProps {
  mode: TimerMode;
  formattedTime: string;
  progress: number;
  isTestMode: boolean;
  onPauseFor: (secs: number) => void;
  onResume: () => void;
  onReset: () => void;
  onTriggerBreak: () => void;
  onToggleTestMode: (enabled: boolean) => void;
  onPreviewOverlay?: () => void;
}

export const TrayPopover: React.FC<TrayPopoverProps> = ({
  mode,
  formattedTime,
  progress,
  isTestMode,
  onPauseFor,
  onResume,
  onReset,
  onTriggerBreak,
  onToggleTestMode,
  onPreviewOverlay,
}) => {
  const isPaused = mode === 'PAUSED';
  const isBreak = mode === 'BREAK';

  return (
    <div className="w-[340px] h-[480px] bg-slate-900/95 backdrop-blur-2xl text-slate-100 p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
              VicBlink
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                20-20-20
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">极简桌面护眼守卫</p>
          </div>
        </div>

        {/* 状态徽标 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5">
          <span
            className={`w-2 h-2 rounded-full ${
              isBreak
                ? 'bg-amber-400 animate-pulse'
                : isPaused
                ? 'bg-orange-400'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-slate-300 text-[11px]">
            {isBreak ? '远眺休息' : isPaused ? '已暂停' : '专注工作中'}
          </span>
        </div>
      </div>

      {/* 中间核心仪表盘 */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <TimerRing
          progress={progress}
          size={180}
          strokeWidth={8}
          color={isBreak ? '#F59E0B' : isPaused ? '#FB923C' : '#10B981'}
          bgColor="rgba(255, 255, 255, 0.06)"
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light tracking-tight text-white font-mono">
              {formattedTime}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {isBreak ? '剩余休息' : isPaused ? '暂停倒计' : '距下次远眺'}
            </span>
          </div>
        </TimerRing>

        {/* 快速动作入口：立即远眺 */}
        {!isBreak && (
          <button
            onClick={onTriggerBreak}
            className="mt-3 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>现在就去远眺 20s</span>
          </button>
        )}
      </div>

      {/* 快捷操作区：暂停 1h / 2h（防打扰与会议专用） */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <Coffee className="w-3 h-3 text-slate-400" /> 快捷离线 / 会议模式
          </span>
          {isPaused && (
            <button
              onClick={onResume}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
            >
              <Play className="w-3 h-3 fill-current" /> 立即恢复
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => (isPaused ? onResume() : onPauseFor(3600))}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              isPaused
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-emerald-500/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>暂停 1 小时</span>
          </button>

          <button
            onClick={() => onPauseFor(7200)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-emerald-500/40 text-xs font-medium transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>暂停 2 小时</span>
          </button>
        </div>
      </div>

      {/* 底部控制工具栏 */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {/* 测试模式加速开关 */}
          <button
            onClick={() => onToggleTestMode(!isTestMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              isTestMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
            title="开启后：工作 10 秒 + 休息 5 秒，极速体验"
          >
            <Zap className={`w-3 h-3 ${isTestMode ? 'text-amber-400' : ''}`} />
            <span>{isTestMode ? '测试加速: 开' : '加速模式'}</span>
          </button>

          {onPreviewOverlay && (
            <button
              onClick={onPreviewOverlay}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
              title="预览全屏毛玻璃遮罩"
            >
              预览遮罩
            </button>
          )}
        </div>

        {/* 重置 */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          title="重置当前周期"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};