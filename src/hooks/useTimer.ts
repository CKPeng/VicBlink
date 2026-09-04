import { useState, useEffect, useCallback, useRef } from 'react';
import { sound, AmbientSoundType } from '../utils/sound';

export type TimerMode = 'WORKING' | 'BREAK' | 'PAUSED' | 'IDLE';
export type WorkMethod = 'MODE_20_20_20' | 'MODE_POMODORO';

export interface DailyStatItem {
  date: string; // YYYY-MM-DD
  count: number;
  pomodoroCount: number;
  totalBreakSeconds: number;
}

export interface UserPreferences {
  workMethod: WorkMethod;
  workMinutes20: number; // 默认 20
  breakSeconds20: number; // 默认 20
  pomodoroWorkMinutes: number; // 默认 50
  pomodoroBreakMinutes: number; // 默认 10
  nestedMicroBreak: boolean; // 番茄钟是否内嵌 20 秒微远眺
  isStrictMode: boolean; // 严厉模式
  isDndMode: boolean; // 会议免打扰
  ambientSound: AmbientSoundType; // 休息时白噪音
  idleThresholdMinutes: number; // 闲置挂起阈值，默认 3
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
  ambientSound: 'ocean',
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
  const [isMicroBreak, setIsMicroBreak] = useState(false); // 是否是番茄钟内嵌的 20 秒微远眺

  const lastActiveRef = useRef<number>(Date.now());
  const prevModeRef = useRef<TimerMode>('WORKING');
  const elapsedWorkSecondsRef = useRef<number>(0);

  // 保存偏好
  const updatePrefs = useCallback((newPrefs: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...newPrefs };
      try {
        localStorage.setItem('vicblink_prefs', JSON.stringify(merged));
      } catch (_) {}
      return merged;
    });
  }, []);

  // 闲置监听 (Idle Detection - 核心护城河)
  useEffect(() => {
    const onUserActivity = () => {
      lastActiveRef.current = Date.now();
      // 如果当前因为长时间离开被置为 IDLE，重返键盘/鼠标时自动恢复
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

  // 音效与白噪音生命周期控制
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      if (mode === 'BREAK') {
        sound.playBreakStart();
        if (prefs.ambientSound !== 'none') {
          sound.playAmbient(prefs.ambientSound, 1.5);
        }
      } else if (prevModeRef.current === 'BREAK' && mode === 'WORKING') {
        sound.stopAmbient(1.0);
        sound.playBreakEnd();
      } else {
        sound.stopAmbient(0.5);
      }
      prevModeRef.current = mode;
    }
  }, [mode, prefs.ambientSound]);

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
      // 闲置检测判断：若超过闲置阈值（如3分钟），自动暂停挂起进入 IDLE
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

          // 番茄钟双轨嵌套 20 秒微远眺：在专注第 20 分钟和 40 分钟时轻量打断
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

          // 专注倒计时归零 -> 进入正常休息
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

          // 休息结束 -> 统计打卡并回到 WORKING
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
  }, [mode, prefs, isTestMode, isMicroBreak, getCycleDurations]);

  // 控制动作
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

  const skipBreak = useCallback(() => {
    // 严厉模式下若开启，外部应拦截；若调用则执行
    const { work } = getCycleDurations();
    setMode('WORKING');
    setTimeRemaining(work);
    setTotalDuration(work);
    setIsMicroBreak(false);
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

  const triggerBreakNow = useCallback(() => {
    const breakSec = prefs.workMethod === 'MODE_POMODORO' ? prefs.pomodoroBreakMinutes * 60 : prefs.breakSeconds20;
    setIsMicroBreak(false);
    setMode('BREAK');
    setTimeRemaining(breakSec);
    setTotalDuration(breakSec);
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