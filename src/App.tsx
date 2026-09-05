import React, { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { OverlayView } from './components/OverlayView';
import { TrayPopover } from './components/TrayPopover';
import { SettingsModal } from './components/SettingsModal';
import { AnalyticsHeatmap } from './components/AnalyticsHeatmap';

export const App: React.FC = () => {
  const timer = useTimer();
  const [windowLabel, setWindowLabel] = useState<string>('main');
  const [manualOverlayPreview, setManualOverlayPreview] = useState(false);
  const [previewRemaining, setPreviewRemaining] = useState(20);
  const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'analytics'>('none');

  useEffect(() => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/webviewWindow')
        .then(({ getCurrentWebviewWindow }) => {
          const current = getCurrentWebviewWindow();
          setWindowLabel(current.label);
        })
        .catch(console.error);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'overlay' || window.location.hash === '#overlay') {
        setWindowLabel('overlay_0');
      }
    }
  }, []);

  // 预览遮罩专用 20 秒倒计时，杜绝把工作期千秒大数塞入遮罩
  useEffect(() => {
    if (!manualOverlayPreview) return;
    setPreviewRemaining(20);
    const interval = setInterval(() => {
      setPreviewRemaining((prev) => {
        if (prev <= 1) {
          setManualOverlayPreview(false);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [manualOverlayPreview]);

  // 1. 如果当前是专用的全屏 overlay 窗口
  const isOverlayWindow = windowLabel.startsWith('overlay');

  // 2. 如果在普通浏览器调试模式下触发了远眺或用户手动点击了预览
  const isBrowserPreviewingOverlay =
    !(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) &&
    (timer.mode === 'BREAK' || manualOverlayPreview);

  if (isOverlayWindow || isBrowserPreviewingOverlay) {
    // 强制保证：遮罩里的倒计时如果是常规远眺，必须严格是 20 秒或设定的远眺秒数，绝对不能是工作期剩余时间！
    const breakDuration = timer.prefs.breakSeconds20 || 20;
    const currentRemaining = manualOverlayPreview
      ? previewRemaining
      : timer.mode === 'BREAK'
      ? timer.timeRemaining
      : breakDuration;

    const currentTotal = manualOverlayPreview
      ? 20
      : timer.mode === 'BREAK'
      ? timer.totalDuration
      : breakDuration;

    const currentProgress = currentTotal > 0 ? (currentTotal - currentRemaining) / currentTotal : 0;

    return (
      <OverlayView
        timeRemaining={currentRemaining}
        totalDuration={currentTotal}
        progress={currentProgress}
        isStrictMode={timer.prefs.isStrictMode}
        isMicroBreak={timer.isMicroBreak}
        ambientSound={timer.prefs.breakAmbient}
        onSkip={() => {
          setManualOverlayPreview(false);
          timer.skipBreak();
        }}
      />
    );
  }

  // 3. main 窗口永远只显示控制面板与设置，绝不渲染遮罩
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-slate-950/40 p-2">
      {activeModal === 'settings' ? (
        <SettingsModal
          prefs={timer.prefs}
          onUpdatePrefs={timer.updatePrefs}
          onClose={() => setActiveModal('none')}
        />
      ) : activeModal === 'analytics' ? (
        <AnalyticsHeatmap onClose={() => setActiveModal('none')} />
      ) : (
        <TrayPopover
          mode={timer.mode}
          formattedTime={timer.formattedTime}
          progress={timer.progress}
          isTestMode={timer.isTestMode}
          prefs={timer.prefs}
          onPauseFor={timer.pauseFor}
          onResume={timer.resume}
          onReset={timer.reset}
          onTriggerBreak={timer.triggerBreakNow}
          onToggleTestMode={timer.setTestMode}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenAnalytics={() => setActiveModal('analytics')}
          onPreviewOverlay={() => setManualOverlayPreview(true)}
        />
      )}
    </div>
  );
};

export default App;