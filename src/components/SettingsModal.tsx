import React, { useState } from 'react';
import { UserPreferences } from '../hooks/useTimer';
import { AmbientSoundType, sound } from '../utils/sound';
import { Settings, Shield, BellOff, Music, Clock, Volume2, VolumeX } from 'lucide-react';

interface SettingsModalProps {
  prefs: UserPreferences;
  onUpdatePrefs: (prefs: Partial<UserPreferences>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  prefs,
  onUpdatePrefs,
  onClose,
}) => {
  const [playingPreview, setPlayingPreview] = useState<AmbientSoundType>('none');

  const togglePreview = (type: AmbientSoundType) => {
    if (playingPreview === type) {
      sound.stopAmbient(0.3);
      setPlayingPreview('none');
    } else {
      sound.playAmbient(type, 0.5);
      setPlayingPreview(type);
    }
  };

  const handleClose = () => {
    if (playingPreview !== 'none') {
      sound.stopAmbient(0.3);
      setPlayingPreview('none');
    }
    onClose();
  };

  return (
    <div className="w-[340px] h-[480px] bg-slate-900/98 backdrop-blur-2xl text-slate-100 p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between select-none overflow-y-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">护眼与工作偏好设置</h2>
        </div>
        <button
          onClick={handleClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
        >
          完成
        </button>
      </div>

      <div className="space-y-4 py-3 flex-1 overflow-y-auto pr-1">
        {/* 1. 工作法选择 */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> 计时模式
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdatePrefs({ workMethod: 'MODE_20_20_20' })}
              className={`p-2 rounded-xl text-left border transition-all ${
                prefs.workMethod === 'MODE_20_20_20'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className="text-xs font-semibold">20-20-20 法则</div>
              <div className="text-[10px] opacity-75 mt-0.5">20m专注 + 20s远眺</div>
            </button>

            <button
              onClick={() => onUpdatePrefs({ workMethod: 'MODE_POMODORO' })}
              className={`p-2 rounded-xl text-left border transition-all ${
                prefs.workMethod === 'MODE_POMODORO'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className="text-xs font-semibold">番茄工作法</div>
              <div className="text-[10px] opacity-75 mt-0.5">50m工作 + 10m大休息</div>
            </button>
          </div>

          {/* 番茄钟嵌套微远眺选项 */}
          {prefs.workMethod === 'MODE_POMODORO' && (
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={prefs.nestedMicroBreak}
                onChange={(e) => onUpdatePrefs({ nestedMicroBreak: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px] text-slate-300">
                双轨嵌套：50分钟内每20分钟轻量远眺 20 秒
              </span>
            </label>
          )}
        </div>

        {/* 2. 严厉模式控制 */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> 遮罩严格程度
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs text-slate-200 font-medium">严厉防跳过模式</div>
              <div className="text-[10px] text-slate-400">隐藏跳过按钮，禁止 Esc 退出，必须满 20 秒</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.isStrictMode}
              onChange={(e) => onUpdatePrefs({ isStrictMode: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. 场景化白噪音伴奏 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" /> 远眺白噪音伴奏
            </label>
            <span className="text-[10px] text-slate-500">遮罩时自动淡入</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'none', label: '静音', desc: '仅提示音' },
              { id: 'ocean', label: '海浪微风', desc: '潮涌律动' },
              { id: 'rain', label: '山间晨雨', desc: '轻柔雨滴' },
              { id: 'wind', label: '林间风声', desc: '空灵风吟' },
              { id: 'fire', label: '壁炉柴火', desc: '温暖爆裂' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => onUpdatePrefs({ ambientSound: item.id as AmbientSoundType })}
                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  prefs.ambientSound === item.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] opacity-70">{item.desc}</div>
                </div>
                {item.id !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview(item.id as AmbientSoundType);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
                    title="试听"
                  >
                    {playingPreview === item.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. 会议免打扰与闲置检测 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-200 font-medium">会议防打扰模式</div>
                <div className="text-[10px] text-slate-400">强遮罩降级为静默通知</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.isDndMode}
              onChange={(e) => onUpdatePrefs({ isDndMode: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};