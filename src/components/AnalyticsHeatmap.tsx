import React, { useMemo } from 'react';
import { DailyStatItem } from '../hooks/useTimer';
import { Award, Flame, Calendar, TrendingUp } from 'lucide-react';

interface AnalyticsHeatmapProps {
  onClose: () => void;
}

export const AnalyticsHeatmap: React.FC<AnalyticsHeatmapProps> = ({ onClose }) => {
  const statsMap = useMemo<Record<string, DailyStatItem>>(() => {
    try {
      const raw = localStorage.getItem('vicblink_stats');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // 生成近 35 天（5周）的日期序列
  const days = useMemo(() => {
    const list: { dateStr: string; dayOfMonth: number; count: number; level: number }[] = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const item = statsMap[dateStr];
      const count = (item?.count || 0) + (item?.pomodoroCount || 0);

      // 计算绿点浓度等级 0 ~ 4
      let level = 0;
      if (count >= 12) level = 4;
      else if (count >= 8) level = 3;
      else if (count >= 4) level = 2;
      else if (count >= 1) level = 1;

      list.push({
        dateStr,
        dayOfMonth: d.getDate(),
        count,
        level,
      });
    }
    return list;
  }, [statsMap]);

  // 汇总统计数据
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = (statsMap[todayStr]?.count || 0) + (statsMap[todayStr]?.pomodoroCount || 0);
  const totalSeconds = Object.values(statsMap).reduce((acc, curr) => acc + (curr.totalBreakSeconds || 0), 0);
  const totalBreaks = Object.values(statsMap).reduce((acc, curr) => acc + (curr.count || 0) + (curr.pomodoroCount || 0), 0);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-400 shadow-sm shadow-emerald-400/50';
      case 3:
        return 'bg-emerald-500';
      case 2:
        return 'bg-emerald-700';
      case 1:
        return 'bg-emerald-900/80 border border-emerald-700/30';
      default:
        return 'bg-white/5 border border-white/5';
    }
  };

  return (
    <div className="w-[340px] h-[480px] bg-slate-900/98 backdrop-blur-2xl text-slate-100 p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">护眼成就与数据统计</h2>
            <p className="text-[11px] text-slate-400">每日 20-20-20 绿点打卡</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
        >
          返回
        </button>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-2 gap-2 my-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> 今日远眺次数
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-white">{todayCount}</span>
            <span className="text-xs text-emerald-400 font-medium">次</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> 累计护眼时长
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-white">{Math.round(totalSeconds / 60)}</span>
            <span className="text-xs text-slate-400">分钟</span>
          </div>
        </div>
      </div>

      {/* GitHub 风格打卡方块热力图 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-300 font-medium">近 35 天打卡活跃图</span>
          <span className="text-[10px] text-slate-500 font-mono">累计 {totalBreaks} 次</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
          {days.map((d) => (
            <div
              key={d.dateStr}
              title={`${d.dateStr}: 远眺 ${d.count} 次`}
              className={`w-6 h-6 rounded-md transition-all flex items-center justify-center text-[9px] font-mono ${getLevelColor(
                d.level
              )} ${d.dateStr === todayStr ? 'ring-1 ring-emerald-400' : ''}`}
            >
              {d.count > 0 ? d.count : ''}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 pt-1 border-t border-white/5">
          <span>少</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900/80" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          </div>
          <span>多</span>
        </div>
      </div>

      {/* 护眼段位徽章 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="text-xs font-medium text-white flex items-center gap-1.5">
            {totalBreaks >= 50 ? '👑 远眺宗师' : totalBreaks >= 20 ? '🛡️ 睫状肌守卫' : '🌟 护眼新秀'}
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-mono">
              Lv.{Math.min(Math.floor(totalBreaks / 10) + 1, 10)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalBreaks >= 50
              ? '已养成卓越的视力健康习惯！'
              : `再完成 ${10 - (totalBreaks % 10)} 次远眺即可晋升下一级`}
          </p>
        </div>
      </div>
    </div>
  );
};