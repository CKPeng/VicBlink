import React, { useState } from 'react';
import { UserPreferences } from '../hooks/useTimer';
import { AmbientSoundType, StartChimeType, EndChimeType, sound } from '../utils/sound';
import {
  Settings,
  Shield,
  BellOff,
  Music,
  Clock,
  Volume2,
  VolumeX,
  PlayCircle,
  Headphones,
  Bell,
  Eye,
  Sliders,
} from 'lucide-react';

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

  const toggleAmbientPreview = (type: AmbientSoundType) => {
    if (playingPreview === type) {
      sound.stopAmbient(0.3);
      setPlayingPreview('none');
    } else {
      sound.playAmbient(type, 0.4);
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

  const ambientOptions: { id: AmbientSoundType; label: string; desc: string }[] = [
    { id: 'none', label: '静音', desc: '关闭伴奏' },
    { id: 'ocean', label: '海浪微风', desc: '律动潮涌' },
    { id: 'rain', label: '山间晨雨', desc: '舒缓雨滴' },
    { id: 'wind', label: '林间风声', desc: '空灵风吟' },
    { id: 'fire', label: '壁炉柴火', desc: '温暖爆裂' },
  ];

  const startChimeOptions: { id: StartChimeType; label: string; desc: string }[] = [
    { id: 'bowl', label: '西藏颂钵', desc: '悠扬和弦' },
    { id: 'bell', label: '禅意磬音', desc: '空灵微颤' },
    { id: 'gong', label: '和缓铜锣', desc: '深沉回响' },
    { id: 'wood', label: '清心木鱼', desc: '节奏定神' },
    { id: 'none', label: '静音', desc: '无提示音' },
  ];

  const endChimeOptions: { id: EndChimeType; label: string; desc: string }[] = [
    { id: 'marimba', label: '马林巴琴', desc: '清脆双音' },
    { id: 'crystal', label: '水晶水滴', desc: '灵动通透' },
    { id: 'harp', label: '流光竖琴', desc: '拂弦上扬' },
    { id: 'ding', label: '清脆晨钟', desc: '精神振奋' },
    { id: 'none', label: '静音', desc: '无提示音' },
  ];

  return (
    <div className="w-[340px] h-[480px] bg-slate-900/98 backdrop-blur-2xl text-slate-100 p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">护眼与声音偏好设置</h2>
        </div>
        <button
          onClick={handleClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
        >
          完成
        </button>
      </div>

      <div className="space-y-3.5 py-2 flex-1 overflow-y-auto pr-1">
        {/* 1. 时长参数直观微调 */}
        <div className="space-y-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-200 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> 核心时长设定
            </span>
            <span className="text-[10px] text-emerald-400/90 font-mono">标准 20-20-20</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* 专注时长 */}
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> 专注周期
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-mono font-semibold text-white">
                  {prefs.workMinutes20} <span className="text-xs font-normal text-slate-400">分钟</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdatePrefs({ workMinutes20: Math.max(5, prefs.workMinutes20 - 5) })}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onUpdatePrefs({ workMinutes20: Math.min(60, prefs.workMinutes20 + 5) })}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 远眺时长 */}
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" /> 远眺时长
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-mono font-semibold text-emerald-300">
                  {prefs.breakSeconds20} <span className="text-xs font-normal text-slate-400">秒</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdatePrefs({ breakSeconds20: Math.max(10, prefs.breakSeconds20 - 5) })}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onUpdatePrefs({ breakSeconds20: Math.min(60, prefs.breakSeconds20 + 5) })}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 专注期白噪音 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-teal-400" /> 专注工作白噪音伴奏
            </label>
            <span className="text-[10px] text-slate-500">工作时轻声循环</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ambientOptions.map((item) => (
              <div
                key={item.id}
                onClick={() => onUpdatePrefs({ focusAmbient: item.id })}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  prefs.focusAmbient === item.id
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium">{item.label}</div>
                  <div className="text-[9px] opacity-70">{item.desc}</div>
                </div>
                {item.id !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmbientPreview(item.id);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="试听"
                  >
                    {playingPreview === item.id ? (
                      <VolumeX className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. 远眺期白噪音 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" /> 远眺休息白噪音伴奏
            </label>
            <span className="text-[10px] text-slate-500">遮罩时自动淡入</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ambientOptions.map((item) => (
              <div
                key={item.id}
                onClick={() => onUpdatePrefs({ breakAmbient: item.id })}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  prefs.breakAmbient === item.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium">{item.label}</div>
                  <div className="text-[9px] opacity-70">{item.desc}</div>
                </div>
                {item.id !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmbientPreview(item.id);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="试听"
                  >
                    {playingPreview === item.id ? (
                      <VolumeX className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. 开始远眺提示音 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-400" /> 开始远眺提示音
            </label>
            <span className="text-[10px] text-slate-500">休息开始时播放</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {startChimeOptions.map((item) => (
              <div
                key={item.id}
                onClick={() => onUpdatePrefs({ startChime: item.id })}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  prefs.startChime === item.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium">{item.label}</div>
                  <div className="text-[9px] opacity-70">{item.desc}</div>
                </div>
                {item.id !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playStartChime(item.id);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300"
                    title="试听"
                  >
                    <PlayCircle className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5. 结束远眺提示音 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> 结束远眺提示音
            </label>
            <span className="text-[10px] text-slate-500">休息结束时唤醒</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {endChimeOptions.map((item) => (
              <div
                key={item.id}
                onClick={() => onUpdatePrefs({ endChime: item.id })}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  prefs.endChime === item.id
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium">{item.label}</div>
                  <div className="text-[9px] opacity-70">{item.desc}</div>
                </div>
                {item.id !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playEndChime(item.id);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300"
                    title="试听"
                  >
                    <PlayCircle className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 6. 严厉模式与免打扰 */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-200 font-medium">严厉防跳过模式</div>
                <div className="text-[10px] text-slate-400">隐藏跳过按钮，禁止 Esc 退出</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.isStrictMode}
              onChange={(e) => onUpdatePrefs({ isStrictMode: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-200 font-medium">会议防打扰模式</div>
                <div className="text-[10px] text-slate-400">遮罩降级为静默通知</div>
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