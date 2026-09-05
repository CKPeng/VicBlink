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
  const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'analytics'>('none');

  useEffect(() => {
    // 检查是否在 Tauri 环境中并获取当前窗口标签
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/webviewWindow')
        .then(({ getCurrentWebviewWindow }) => {
          const current = getCurrentWebviewWindow();
          setWindowLabel(current.label);
        })
        .catch(console.error);
    } else {
      // 浏览器环境：根据 url search 参数判断
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'overlay' || window.location.hash === '#overlay') {
        setWindowLabel('overlay_0');
      }
    }
  }, []);

  // 1. 如果当前是专用的全屏 overlay 窗口，100% 独占全屏渲染 OverlayView
  const isOverlayWindow = windowLabel.startsWith('overlay');

  // 2. 如果在普通浏览器预览模式下且用户进入了远眺或点击了预览
  const isBrowserPreviewingOverlay =
    !(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) &&
    (timer.mode === 'BREAK' || manualOverlayPreview);

  if (isOverlayWindow || isBrowserPreviewingOverlay) {
    return (
      <OverlayView
        timeRemaining={timer.timeRemaining}
        totalDuration={timer.totalDuration}
        progress={timer.progress}
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

  // 3. main 窗口（340x480）永远只渲染控制面板，绝不渲染遮罩
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