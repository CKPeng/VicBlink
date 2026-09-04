import { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../utils/sound';

export type TimerMode = 'WORKING' | 'BREAK' | 'PAUSED' | 'IDLE';

export interface TimerSnapshot {
  mode: TimerMode;
  time_remaining: number;
  total_duration: number;
  progress: number;
  is_test_mode: boolean;
  formatted_time: string;
}

const isTauriEnv = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export function useTimer() {
  const [state, setState] = useState<TimerSnapshot>({
    mode: 'WORKING',
    time_remaining: 1200,
    total_duration: 1200,
    progress: 0,
    is_test_mode: false,
    formatted_time: '20:00',
  });

  const prevModeRef = useRef<TimerMode>('WORKING');

  // 音效触发响应
  useEffect(() => {
    if (prevModeRef.current !== state.mode) {
      if (state.mode === 'BREAK') {
        sound.playBreakStart();
      } else if (prevModeRef.current === 'BREAK' && state.mode === 'WORKING') {
        sound.playBreakEnd();
      }
      prevModeRef.current = state.mode;
    }
  }, [state.mode]);

  // Tauri 环境事件订阅
  useEffect(() => {
    if (!isTauriEnv()) return;

    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<TimerSnapshot>('timer_tick', (event) => {
        setState(event.payload);
      }).then((un) => {
        unlisten = un;
      });
    });

    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke<TimerSnapshot>('get_timer_state').then((res) => {
        setState(res);
      }).catch(console.error);
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 非 Tauri (Web 模式下纯前端高精度状态模拟)
  useEffect(() => {
    if (isTauriEnv()) return;

    const interval = setInterval(() => {
      setState((prev) => {
        let { mode, time_remaining, total_duration, is_test_mode } = prev;
        const workSecs = is_test_mode ? 10 : 1200;
        const breakSecs = is_test_mode ? 5 : 20;

        if (mode === 'WORKING') {
          if (time_remaining > 0) {
            time_remaining -= 1;
          }
          if (time_remaining === 0) {
            return {
              mode: 'BREAK',
              time_remaining: breakSecs,
              total_duration: breakSecs,
              progress: 0,
              is_test_mode,
              formatted_time: `${breakSecs}s`,
            };
          }
        } else if (mode === 'BREAK') {
          if (time_remaining > 0) {
            time_remaining -= 1;
          }
          if (time_remaining === 0) {
            return {
              mode: 'WORKING',
              time_remaining: workSecs,
              total_duration: workSecs,
              progress: 0,
              is_test_mode,
              formatted_time: is_test_mode ? '00:10' : '20:00',
            };
          }
        } else if (mode === 'PAUSED') {
          if (time_remaining > 0) {
            time_remaining -= 1;
          }
          if (time_remaining === 0) {
            return {
              mode: 'WORKING',
              time_remaining: workSecs,
              total_duration: workSecs,
              progress: 0,
              is_test_mode,
              formatted_time: is_test_mode ? '00:10' : '20:00',
            };
          }
        }

        const progress = total_duration > 0 ? (total_duration - time_remaining) / total_duration : 0;
        const mins = Math.floor(time_remaining / 60);
        const secs = time_remaining % 60;
        const formatted_time =
          mode === 'BREAK'
            ? `${time_remaining}s`
            : mins >= 60
            ? `${Math.floor(mins / 60)}h ${mins % 60}m`
            : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        return {
          ...prev,
          time_remaining,
          progress,
          formatted_time,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pauseFor = useCallback(async (seconds: number) => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('pause_timer', { durationSecs: seconds });
      setState(snap);
    } else {
      setState((prev) => ({
        ...prev,
        mode: 'PAUSED',
        time_remaining: seconds,
        total_duration: seconds,
        progress: 0,
        formatted_time: `${Math.floor(seconds / 3600)}h 00m`,
      }));
    }
  }, []);

  const resume = useCallback(async () => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('resume_timer');
      setState(snap);
    } else {
      const workSecs = state.is_test_mode ? 10 : 1200;
      setState((prev) => ({
        ...prev,
        mode: 'WORKING',
        time_remaining: workSecs,
        total_duration: workSecs,
        progress: 0,
        formatted_time: state.is_test_mode ? '00:10' : '20:00',
      }));
    }
  }, [state.is_test_mode]);

  const skipBreak = useCallback(async () => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('skip_break');
      setState(snap);
    } else {
      const workSecs = state.is_test_mode ? 10 : 1200;
      setState((prev) => ({
        ...prev,
        mode: 'WORKING',
        time_remaining: workSecs,
        total_duration: workSecs,
        progress: 0,
        formatted_time: state.is_test_mode ? '00:10' : '20:00',
      }));
    }
  }, [state.is_test_mode]);

  const reset = useCallback(async () => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('reset_timer');
      setState(snap);
    } else {
      const workSecs = state.is_test_mode ? 10 : 1200;
      setState((prev) => ({
        ...prev,
        mode: 'WORKING',
        time_remaining: workSecs,
        total_duration: workSecs,
        progress: 0,
        formatted_time: state.is_test_mode ? '00:10' : '20:00',
      }));
    }
  }, [state.is_test_mode]);

  const setTestMode = useCallback(async (enabled: boolean) => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('set_test_mode', { enabled });
      setState(snap);
    } else {
      const workSecs = enabled ? 10 : 1200;
      setState((prev) => ({
        ...prev,
        is_test_mode: enabled,
        mode: 'WORKING',
        time_remaining: workSecs,
        total_duration: workSecs,
        progress: 0,
        formatted_time: enabled ? '00:10' : '20:00',
      }));
    }
  }, []);

  const triggerBreakNow = useCallback(async () => {
    if (isTauriEnv()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const snap = await invoke<TimerSnapshot>('trigger_break_now');
      setState(snap);
    } else {
      const breakSecs = state.is_test_mode ? 5 : 20;
      setState((prev) => ({
        ...prev,
        mode: 'BREAK',
        time_remaining: breakSecs,
        total_duration: breakSecs,
        progress: 0,
        formatted_time: `${breakSecs}s`,
      }));
    }
  }, [state.is_test_mode]);

  return {
    ...state,
    pauseFor,
    resume,
    skipBreak,
    reset,
    setTestMode,
    triggerBreakNow,
  };
}