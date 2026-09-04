import React, { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { OverlayView } from './components/OverlayView';
import { TrayPopover } from './components/TrayPopover';
import { SettingsModal } from './components/SettingsModal';
import { AnalyticsHeatmap } from './components/AnalyticsHeatmap';

export const App: React.FC = () => {
  const timer = useTimer();
  const [isOverlayRoute, setIsOverlayRoute] = useState(false);
  const [manualOverlayPreview, setManualOverlayPreview] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'analytics'>('none');

  useEffect(() => {
    const checkHash = () => {
      const isOverlay =
        window.location.hash === '#overlay' ||
        new URLSearchParams(window.location.search).get('view') === 'overlay';
      setIsOverlayRoute(isOverlay);
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // 判定是否展示全屏遮罩：
  // 1. 如果当前窗口是独立 overlay 窗口
  // 2. 如果非 DND 会议免打扰状态且进入了 BREAK 状态
  // 3. 用户手动点击了“预览遮罩”
  const shouldShowOverlay =
    isOverlayRoute ||
    (!timer.prefs.isDndMode && timer.mode === 'BREAK') ||
    manualOverlayPreview;

  if (shouldShowOverlay) {
    return (
      <OverlayView
        timeRemaining={timer.timeRemaining}
        totalDuration={timer.totalDuration}
        progress={timer.progress}
        isStrictMode={timer.prefs.isStrictMode}
        isMicroBreak={timer.isMicroBreak}
        ambientSound={timer.prefs.ambientSound}
        onSkip={() => {
          setManualOverlayPreview(false);
          timer.skipBreak();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950/40 p-4">
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