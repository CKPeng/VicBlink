import React, { useEffect } from 'react';
import { TimerRing } from './TimerRing';
import { TimerMode, UserPreferences } from '../hooks/useTimer';
import {
  Play,
  RotateCcw,
  Eye,
  Clock,
  Coffee,
  Zap,
  ShieldAlert,
  Sparkles,
  Settings,
  TrendingUp,
  Shield,
  BellOff,
  Activity,
} from 'lucide-react';

interface TrayPopoverProps {
  mode: TimerMode;
  formattedTime: string;
  progress: number;
  isTestMode: boolean;
  prefs: UserPreferences;
  onPauseFor: (secs: number) => void;
  onResume: () => void;
  onReset: () => void;
  onTriggerBreak: () => void;
  onToggleTestMode: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onOpenAnalytics: () => void;
  onPreviewOverlay?: () => void;
}

export const TrayPopover: React.FC<TrayPopoverProps> = ({
  mode,
  formattedTime,
  progress,
  isTestMode,
  prefs,
  onPauseFor,
  onResume,
  onReset,
  onTriggerBreak,
  onToggleTestMode,
  onOpenSettings,
  onOpenAnalytics,
  onPreviewOverlay,
}) => {
  const isPaused = mode === 'PAUSED';
  const isBreak = mode === 'BREAK';
  const isIdle = mode === 'IDLE';

  // 快捷键支持：Alt + P 暂停/恢复；Alt + B 立即远眺
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyP') {
        e.preventDefault();
        if (isPaused) onResume();
        else onPauseFor(3600);
      } else if (e.altKey && e.code === 'KeyB') {
        e.preventDefault();
        onTriggerBreak();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, onPauseFor, onResume, onTriggerBreak]);

  return (
    <div className="w-[340px] h-[480px] bg-slate-900/98 backdrop-blur-2xl text-slate-100 p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* 顶部标题与功能入口 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
              VicBlink
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {prefs.workMethod === 'MODE_POMODORO' ? '番茄钟' : '20-20-20'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">极简桌面护眼守卫</p>
          </div>
        </div>

        {/* 顶部操作区：统计图表 & 设置面板 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAnalytics}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-emerald-300 transition-colors"
            title="护眼数据与成就统计"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="偏好设置 (时长/白噪音/提示音)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 状态徽标栏 */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5">
          <span
            className={`w-2 h-2 rounded-full ${
              isBreak
                ? 'bg-amber-400 animate-pulse'
                : isPaused
                ? 'bg-orange-400'
                : isIdle
                ? 'bg-blue-400'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-slate-300 text-[11px]">
            {isBreak
              ? '远眺休息中'
              : isPaused
              ? '已暂停'
              : isIdle
              ? '闲置已暂停'
              : '专注工作中'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          {prefs.isStrictMode && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Shield className="w-3 h-3" /> 严厉
            </span>
          )}
          {prefs.isDndMode && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <BellOff className="w-3 h-3" /> 免打扰
            </span>
          )}
        </div>
      </div>

      {/* 中间核心仪表盘 */}
      <div className="flex flex-col items-center justify-center py-1 relative">
        <TimerRing
          progress={progress}
          size={170}
          strokeWidth={8}
          color={isBreak ? '#F59E0B' : isPaused ? '#FB923C' : isIdle ? '#60A5FA' : '#10B981'}
          bgColor="rgba(255, 255, 255, 0.06)"
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light tracking-tight text-white font-mono">
              {formattedTime}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {isIdle ? (
                <>
                  <Activity className="w-3 h-3 text-blue-400" />
                  敲击键盘恢复
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-slate-400" />
                  {isBreak ? '远眺倒计 (秒)' : isPaused ? '离线倒计' : '距下次远眺 (分:秒)'}
                </>
              )}
            </span>
          </div>
        </TimerRing>

        {/* 快捷远眺入口 */}
        {!isBreak && !isIdle && (
          <button
            onClick={onTriggerBreak}
            className="mt-2 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>现在就去远眺 20s</span>
          </button>
        )}
      </div>

      {/* 快捷操作区：暂停 1h / 2h */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <Coffee className="w-3 h-3 text-slate-400" /> 快捷离线 (Alt+P)
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
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-emerald-500/40 text-xs font-medium transition-all"
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
          {/* 测试加速模式开关 */}
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
            <span>{isTestMode ? '加速: 开' : '加速模式'}</span>
          </button>

          {onPreviewOverlay && (
            <button
              onClick={onPreviewOverlay}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
              title="预览 20 秒全屏毛玻璃遮罩"
            >
              预览遮罩 (20s)
            </button>
          )}
        </div>

        {/* 重置当前周期 */}
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