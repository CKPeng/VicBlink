import React, { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { OverlayView } from './components/OverlayView';
import { TrayPopover } from './components/TrayPopover';

export const App: React.FC = () => {
  const timer = useTimer();
  const [isOverlayRoute, setIsOverlayRoute] = useState(false);
  const [manualOverlayPreview, setManualOverlayPreview] = useState(false);

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
  // 1. 如果是原生多屏弹出的单独 overlay 窗口，直接展示 OverlayView
  // 2. 如果是 Web 调试模式，且当前计时器流转进入了 BREAK 状态，或用户手动点击了“预览遮罩”
  const shouldShowOverlay = isOverlayRoute || timer.mode === 'BREAK' || manualOverlayPreview;

  if (shouldShowOverlay) {
    return (
      <OverlayView
        timeRemaining={timer.time_remaining}
        totalDuration={timer.total_duration}
        progress={timer.progress}
        onSkip={() => {
          setManualOverlayPreview(false);
          timer.skipBreak();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950/40 p-4">
      <TrayPopover
        mode={timer.mode}
        formattedTime={timer.formatted_time}
        progress={timer.progress}
        isTestMode={timer.is_test_mode}
        onPauseFor={timer.pauseFor}
        onResume={timer.resume}
        onReset={timer.reset}
        onTriggerBreak={timer.triggerBreakNow}
        onToggleTestMode={timer.setTestMode}
        onPreviewOverlay={() => setManualOverlayPreview(true)}
      />
    </div>
  );
};

export default App;