import { useState, useEffect, useCallback, useRef } from 'react';
import { sound, AmbientSoundType, StartChimeType, EndChimeType } from '../utils/sound';

export type TimerMode = 'WORKING' | 'BREAK' | 'PAUSED' | 'IDLE';
export type WorkMethod = 'MODE_20_20_20' | 'MODE_POMODORO';

export interface DailyStatItem {
  date: string;
  count: number;
  pomodoroCount: number;
  totalBreakSeconds: number;
}

export interface UserPreferences {
  workMethod: WorkMethod;
  workMinutes20: number;
  breakSeconds20: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  nestedMicroBreak: boolean;
  isStrictMode: boolean;
  isDndMode: boolean;
  focusAmbient: AmbientSoundType; // 专注时白噪音伴奏
  breakAmbient: AmbientSoundType; // 远眺时白噪音伴奏
  startChime: StartChimeType;     // 开始远眺提示音
  endChime: EndChimeType;         // 结束远眺提示音
  idleThresholdMinutes: number;
}

const DEFAULT_PREFS: UserPreferences = {
  workMethod: 'MODE_20_20_20',
  workMinutes20: 20,
  breakSeconds20: 20,
  pomodoroWorkMinutes: 50,
  pomodoroBreakMinutes: 10,
  nestedMicroBreak: true,
  isStrictMode: false,
  isDndMode: false,
  focusAmbient: 'none',
  breakAmbient: 'ocean',
  startChime: 'bowl',
  endChime: 'marimba',
  idleThresholdMinutes: 3,
};

const getInitialPrefs = (): UserPreferences => {
  try {
    const saved = localStorage.getItem('vicblink_prefs');
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch (_) {}
  return DEFAULT_PREFS;
};

const recordCompletedBreak = (isPomodoroBreak: boolean, breakDuration: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem('vicblink_stats');
    const stats: Record<string, DailyStatItem> = raw ? JSON.parse(raw) : {};
    const current = stats[today] || {
      date: today,
      count: 0,
      pomodoroCount: 0,
      totalBreakSeconds: 0,
    };

    if (isPomodoroBreak) {
      current.pomodoroCount += 1;
    } else {
      current.count += 1;
    }
    current.totalBreakSeconds += breakDuration;
    stats[today] = current;
    localStorage.setItem('vicblink_stats', JSON.stringify(stats));
  } catch (e) {
    console.error('Record stats error:', e);
  }
};

export function useTimer() {
  const [prefs, setPrefs] = useState<UserPreferences>(getInitialPrefs);
  const [mode, setMode] = useState<TimerMode>('WORKING');
  const [timeRemaining, setTimeRemaining] = useState<number>(prefs.workMinutes20 * 60);
  const [totalDuration, setTotalDuration] = useState<number>(prefs.workMinutes20 * 60);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isMicroBreak, setIsMicroBreak] = useState(false);

  const lastActiveRef = useRef<number>(Date.now());
  const prevModeRef = useRef<TimerMode>('WORKING');
  const elapsedWorkSecondsRef = useRef<number>(0);

  const updatePrefs = useCallback((newPrefs: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...newPrefs };
      try {
        localStorage.setItem('vicblink_prefs', JSON.stringify(merged));
      } catch (_) {}
      return merged;
    });
  }, []);

  // 闲置监听 (Idle Detection)
  useEffect(() => {
    const onUserActivity = () => {
      lastActiveRef.current = Date.now();
      setMode((currentMode) => {
        if (currentMode === 'IDLE') {
          return 'WORKING';
        }
        return currentMode;
      });
    };

    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('mousedown', onUserActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('mousedown', onUserActivity);
    };
  }, []);

  // 专注期与远眺期双轨声音控制
  useEffect(() => {
    if (mode === 'WORKING') {
      if (prevModeRef.current === 'BREAK') {
        sound.playEndChime(prefs.endChime);
      }
      if (prefs.focusAmbient !== 'none') {
        sound.playAmbient(prefs.focusAmbient, 1.5);
      } else {
        sound.stopAmbient(1.0);
      }
    } else if (mode === 'BREAK') {
      sound.playStartChime(prefs.startChime);
      if (prefs.breakAmbient !== 'none') {
        sound.playAmbient(prefs.breakAmbient, 1.5);
      } else {
        sound.stopAmbient(0.8);
      }
    } else if (mode === 'PAUSED' || mode === 'IDLE') {
      sound.stopAmbient(0.8);
    }
    prevModeRef.current = mode;
  }, [mode, prefs.focusAmbient, prefs.breakAmbient, prefs.startChime, prefs.endChime]);

  // 获取当前配置下的工作与休息时长
  const getCycleDurations = useCallback(() => {
    if (isTestMode) {
      return { work: 10, breakSec: 5, isPomo: false };
    }
    if (prefs.workMethod === 'MODE_POMODORO') {
      return {
        work: prefs.pomodoroWorkMinutes * 60,
        breakSec: prefs.pomodoroBreakMinutes * 60,
        isPomo: true,
      };
    }
    return {
      work: prefs.workMinutes20 * 60,
      breakSec: prefs.breakSeconds20,
      isPomo: false,
    };
  }, [isTestMode, prefs]);

  // 主计时与状态流转循环
  useEffect(() => {
    const timer = setInterval(() => {
      const idleLimitMs = (isTestMode ? 15 : prefs.idleThresholdMinutes * 60) * 1000;
      const isIdleNow = Date.now() - lastActiveRef.current > idleLimitMs;

      setMode((currentMode) => {
        if (currentMode === 'WORKING' && isIdleNow) {
          return 'IDLE';
        }
        return currentMode;
      });

      setTimeRemaining((prevTime) => {
        if (mode === 'IDLE' || mode === 'PAUSED') {
          return prevTime;
        }

        if (mode === 'WORKING') {
          elapsedWorkSecondsRef.current += 1;
          const { breakSec, isPomo } = getCycleDurations();

          if (isPomo && prefs.nestedMicroBreak && !isTestMode) {
            const elapsedMins = Math.floor(elapsedWorkSecondsRef.current / 60);
            if ((elapsedMins === 20 || elapsedMins === 40) && elapsedWorkSecondsRef.current % 60 === 0) {
              setIsMicroBreak(true);
              setTotalDuration(20);
              setMode('BREAK');
              return 20;
            }
          }

          if (prevTime > 1) {
            return prevTime - 1;
          }

          elapsedWorkSecondsRef.current = 0;
          setIsMicroBreak(false);
          setTotalDuration(breakSec);
          setMode('BREAK');
          return breakSec;
        }

        if (mode === 'BREAK') {
          if (prevTime > 1) {
            return prevTime - 1;
          }

          const isPomoBreak = prefs.workMethod === 'MODE_POMODORO' && !isMicroBreak;
          recordCompletedBreak(isPomoBreak, totalDuration);

          const { work } = getCycleDurations();
          setTotalDuration(work);
          setMode('WORKING');
          setIsMicroBreak(false);
          return work;
        }

        return prevTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, prefs, isTestMode, isMicroBreak, getCycleDurations, totalDuration]);

  const pauseFor = useCallback((seconds: number) => {
    setMode('PAUSED');
    setTimeRemaining(seconds);
    setTotalDuration(seconds);
  }, []);

  const resume = useCallback(() => {
    const { work } = getCycleDurations();
    setMode('WORKING');
    setTimeRemaining(work);
    setTotalDuration(work);
    elapsedWorkSecondsRef.current = 0;
  }, [getCycleDurations]);

  const skipBreak = useCallback(async () => {
    const { work } = getCycleDurations();
    setMode('WORKING');
    setTimeRemaining(work);
    setTotalDuration(work);
    setIsMicroBreak(false);

    // 如果在 Tauri 环境中，通知后端隐藏所有 overlay 窗口
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('skip_break');
      } catch (_) {}
    }
  }, [getCycleDurations]);

  const reset = useCallback(() => {
    const { work } = getCycleDurations();
    setMode('WORKING');
    setTimeRemaining(work);
    setTotalDuration(work);
    elapsedWorkSecondsRef.current = 0;
    setIsMicroBreak(false);
  }, [getCycleDurations]);

  const setTestMode = useCallback((enabled: boolean) => {
    setIsTestMode(enabled);
    const work = enabled ? 10 : prefs.workMethod === 'MODE_POMODORO' ? prefs.pomodoroWorkMinutes * 60 : prefs.workMinutes20 * 60;
    setMode('WORKING');
    setTimeRemaining(work);
    setTotalDuration(work);
    elapsedWorkSecondsRef.current = 0;
    setIsMicroBreak(false);
  }, [prefs]);

  const triggerBreakNow = useCallback(async () => {
    const breakSec = prefs.workMethod === 'MODE_POMODORO' ? prefs.pomodoroBreakMinutes * 60 : prefs.breakSeconds20;
    setIsMicroBreak(false);
    setMode('BREAK');
    setTimeRemaining(breakSec);
    setTotalDuration(breakSec);

    // 在 Tauri 环境中通知后端触发多屏幕全屏置顶遮罩
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('trigger_break_now');
      } catch (_) {}
    }
  }, [prefs]);

  const progress = totalDuration > 0 ? (totalDuration - timeRemaining) / totalDuration : 0;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const formattedTime =
    mode === 'BREAK'
      ? `${timeRemaining}s`
      : mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    mode,
    timeRemaining,
    totalDuration,
    progress,
    formattedTime,
    isTestMode,
    isMicroBreak,
    prefs,
    updatePrefs,
    pauseFor,
    resume,
    skipBreak,
    reset,
    setTestMode,
    triggerBreakNow,
  };
}