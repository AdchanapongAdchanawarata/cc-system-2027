"use client";

import React, { useState, useMemo } from 'react';
import { 
  Building2, Flame, CheckCircle2, Clock, 
  AlertTriangle, ChevronRight, TrendingUp, Sparkles,
  Zap, Award, BarChart2, ShieldAlert, ArrowUpRight,
  Filter, Layers, Info
} from 'lucide-react';
import { 
  BriefTaskLike, 
  getBriefSaveCost 
} from '@/utils/stats';
import { 
  getBriefClientTeam, 
  getBriefCategory, 
  isTaskOverdue 
} from '@/utils/teamAnalytics';

interface TeamDemandOverviewProps {
  briefs: BriefTaskLike[];
  unitLabel?: string;
  onTeamClick?: (teamKey: string) => void;
  onCategoryClick?: (category: string) => void;
}

export default function TeamDemandOverview({
  briefs = [],
  unitLabel = "ทุกยูนิต",
  onTeamClick,
  onCategoryClick
}: TeamDemandOverviewProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'urgent' | 'overdue' | 'categories'>('ranking');
  const [showAllTeams, setShowAllTeams] = useState(false);

  // Helper to determine if a task is urgent/rush
  const isTaskUrgent = (b: BriefTaskLike): boolean => {
    const rawAny = b as Record<string, any>;
    const p = String(rawAny.priority || b.details?.priority || '').toLowerCase();
    if (p === 'urgent' || p === 'high' || b.details?.is_urgent === true) return true;
    if (b.deadline && (b.created_at || b.in_progress_at)) {
      const start = new Date(b.created_at || b.in_progress_at || '').getTime();
      const end = new Date(b.deadline).getTime();
      const diffDays = (end - start) / (1000 * 3600 * 24);
      if (diffDays >= 0 && diffDays <= 3) return true;
    }
    return false;
  };

  // 1. Compute Analytics across briefs
  const analytics = useMemo(() => {
    const validBriefs = briefs.filter(b => b.status !== 'cancelled');
    const totalValid = validBriefs.length;

    const teamMap: Record<string, {
      teamKey: string;
      teamName: string;
      totalTasks: number;
      totalSaveCost: number;
      completedTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
      urgentTasks: number;
      overdueTasks: number;
    }> = {};

    const categoryMap: Record<string, {
      category: string;
      totalTasks: number;
      totalSaveCost: number;
      completedTasks: number;
      urgentTasks: number;
      overdueTasks: number;
      totalDurationDays: number;
      completedWithTime: number;
      onTimeCompleted: number;
    }> = {};

    let totalUrgentCount = 0;
    let totalOverdueCount = 0;

    validBriefs.forEach(b => {
      const client = getBriefClientTeam(b);
      const cat = getBriefCategory(b);
      const cost = getBriefSaveCost(b);
      const urgent = isTaskUrgent(b);
      const overdue = isTaskOverdue(b);

      if (urgent) totalUrgentCount++;
      if (overdue) totalOverdueCount++;

      // By Team
      if (!teamMap[client.key]) {
        teamMap[client.key] = {
          teamKey: client.key,
          teamName: client.name,
          totalTasks: 0,
          totalSaveCost: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          urgentTasks: 0,
          overdueTasks: 0
        };
      }
      teamMap[client.key].totalTasks++;
      teamMap[client.key].totalSaveCost += cost;
      if (b.status === 'completed') teamMap[client.key].completedTasks++;
      else if (b.status === 'in_progress') teamMap[client.key].inProgressTasks++;
      else if (b.status === 'pending') teamMap[client.key].pendingTasks++;
      if (urgent) teamMap[client.key].urgentTasks++;
      if (overdue) teamMap[client.key].overdueTasks++;

      // By Category
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          totalTasks: 0,
          totalSaveCost: 0,
          completedTasks: 0,
          urgentTasks: 0,
          overdueTasks: 0,
          totalDurationDays: 0,
          completedWithTime: 0,
          onTimeCompleted: 0
        };
      }
      categoryMap[cat].totalTasks++;
      categoryMap[cat].totalSaveCost += cost;
      if (b.status === 'completed') categoryMap[cat].completedTasks++;
      if (urgent) categoryMap[cat].urgentTasks++;
      if (overdue) categoryMap[cat].overdueTasks++;

      if (b.status === 'completed' && b.completed_at) {
        const sTime = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
        const eTime = new Date(b.completed_at).getTime();
        const duration = Math.max(0.2, Number(((eTime - sTime) / (1000 * 3600 * 24)).toFixed(1)));
        categoryMap[cat].totalDurationDays += duration;
        categoryMap[cat].completedWithTime++;

        const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
        if (dStr) {
          const dTime = new Date(dStr).getTime() + 86400000;
          if (eTime <= dTime) categoryMap[cat].onTimeCompleted++;
        } else {
          categoryMap[cat].onTimeCompleted++;
        }
      }
    });

    // Ranking teams by total volume
    const rankedTeams = Object.values(teamMap).map(t => {
      const sharePct = totalValid > 0 ? Math.round((t.totalTasks / totalValid) * 100) : 0;
      // Score calculation: volume share (max 60 pts) + completion efficiency (max 40 pts)
      const compRate = t.totalTasks > 0 ? t.completedTasks / t.totalTasks : 0;
      const score = Math.min(100, Math.round((sharePct * 1.5) + (compRate * 40)));
      return {
        ...t,
        sharePct,
        score
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks || b.totalSaveCost - a.totalSaveCost);

    // Urgent teams ranking
    const urgentTeams = Object.values(teamMap)
      .filter(t => t.urgentTasks > 0)
      .map(t => ({
        ...t,
        urgentRate: Math.round((t.urgentTasks / t.totalTasks) * 100)
      }))
      .sort((a, b) => b.urgentTasks - a.urgentTasks || b.urgentRate - a.urgentRate);

    // Urgent categories ranking
    const urgentCategories = Object.values(categoryMap)
      .filter(c => c.urgentTasks > 0)
      .map(c => ({
        ...c,
        urgentRate: Math.round((c.urgentTasks / c.totalTasks) * 100)
      }))
      .sort((a, b) => b.urgentTasks - a.urgentTasks || b.urgentRate - a.urgentRate);

    // Overdue teams ranking
    const overdueTeams = Object.values(teamMap)
      .filter(t => t.overdueTasks > 0)
      .map(t => ({
        ...t,
        overdueRate: Math.round((t.overdueTasks / t.totalTasks) * 100)
      }))
      .sort((a, b) => b.overdueTasks - a.overdueTasks || b.overdueRate - a.overdueRate);

    // Categories list
    const popularCategories = Object.values(categoryMap).map(c => {
      const avgDays = c.completedWithTime > 0 ? Number((c.totalDurationDays / c.completedWithTime).toFixed(1)) : 0;
      const onTimeRate = c.completedWithTime > 0 ? Math.round((c.onTimeCompleted / c.completedWithTime) * 100) : 100;
      const sharePct = totalValid > 0 ? Math.round((c.totalTasks / totalValid) * 100) : 0;
      return {
        ...c,
        avgDays,
        onTimeRate,
        sharePct
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks || b.totalSaveCost - a.totalSaveCost);

    return {
      totalValid,
      totalUrgentCount,
      totalOverdueCount,
      rankedTeams,
      urgentTeams,
      urgentCategories,
      overdueTeams,
      popularCategories
    };
  }, [briefs]);

  const displayedRankedTeams = showAllTeams ? analytics.rankedTeams : analytics.rankedTeams.slice(0, 5);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      
      {/* 1. Header & Section Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-slate-900 text-white shadow-2xs">
              <Building2 size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              สถิติความต้องการและการสั่งงาน (Team Demand & Order Intelligence)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            เจาะลึกทีมที่สั่งงานเยอะที่สุด, ความถี่งานด่วน, งานเกินกำหนด และประเภทงานยอดนิยม ({unitLabel})
          </p>
        </div>

        {/* 4 Summary Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            <span>ทั้งหมด:</span> <strong className="text-slate-900">{analytics.totalValid} งาน</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
            <Zap size={12} className="text-amber-600" />
            <span>งานด่วน:</span> <strong>{analytics.totalUrgentCount} งาน</strong>
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono border ${
            analytics.totalOverdueCount > 0 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <AlertTriangle size={12} className={analytics.totalOverdueCount > 0 ? "text-rose-600" : "text-emerald-600"} />
            <span>เกินกำหนด:</span> <strong>{analytics.totalOverdueCount} งาน</strong>
          </span>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher: 4 Views (Fit without scrollbar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
            activeTab === 'ranking' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award size={14} className="text-amber-500 shrink-0" />
          <span className="truncate">1. อันดับทีมสั่งงาน</span>
        </button>

        <button
          onClick={() => setActiveTab('urgent')}
          className={`px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
            activeTab === 'urgent' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap size={14} className="text-amber-600 shrink-0" />
          <span className="truncate">2. สถิติงานด่วน</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
            activeTab === 'overdue' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
          <span className="truncate">3. งานเกินกำหนด</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
            activeTab === 'categories' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} className="text-indigo-600 shrink-0" />
          <span className="truncate">4. สัดส่วนประเภทงาน</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: RANK & SCORE - ทีมไหนสั่งงานเยอะสุด */}
      {activeTab === 'ranking' && (
        <div className="space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>จัดอันดับตามปริมาณงานและมูลค่า Save Cost รวม</span>
            <span className="font-mono">พบ {analytics.rankedTeams.length} ทีม</span>
          </div>

          <div className="space-y-2">
            {displayedRankedTeams.map((team, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={team.teamKey}
                  onClick={() => onTeamClick?.(team.teamKey)}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ${
                        isTop ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300' :
                        idx === 1 ? 'bg-slate-300 text-slate-900' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {team.teamName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span>เสร็จ {team.completedTasks}</span>
                          <span>•</span>
                          <span>กำลังทำ {team.inProgressTasks}</span>
                          <span>•</span>
                          <span>รอเริ่ม {team.pendingTasks}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                          {team.totalTasks} งาน
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ฿{team.totalSaveCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Demand Score: <strong className="font-bold text-indigo-700">{team.score}/100</strong> (แชร์ {team.sharePct}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.max(4, team.sharePct)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop ? 'bg-amber-500' : idx === 1 ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {analytics.rankedTeams.length > 5 && (
            <button
              onClick={() => setShowAllTeams(!showAllTeams)}
              className="w-full text-center text-xs font-bold text-slate-700 hover:text-slate-900 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              {showAllTeams ? "ย่อเหลือ Top 5" : `ดูครบทุกทีม (ทั้งหมด ${analytics.rankedTeams.length} ทีม)`}
            </button>
          )}
        </div>
      )}

      {/* TAB 2: URGENT ORDERS - ทีม & ประเภทงานที่สั่งงานด่วนบ่อยสุด */}
      {activeTab === 'urgent' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-100">
          
          {/* Left: ทีมที่สั่งงานด่วนบ่อยสุด */}
          <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-600" />
                ทีมที่สั่งงานด่วนบ่อยที่สุด (Top Urgent Teams)
              </span>
              <span className="text-[10px] font-mono text-amber-700">
                รวม {analytics.totalUrgentCount} งานด่วน
              </span>
            </div>

            {analytics.urgentTeams.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ไม่มีประวัติงานด่วนในระบบ
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.urgentTeams.slice(0, 5).map((t, idx) => (
                  <div key={t.teamKey} className="p-2.5 bg-white rounded-lg border border-amber-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md font-mono">
                          #{idx + 1}
                        </span>
                        <span>{t.teamName}</span>
                      </span>
                      <span className="font-mono font-bold text-amber-900">
                        {t.urgentTasks} งานด่วน <span className="text-slate-400 font-normal">({t.urgentRate}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, t.urgentRate))}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: ประเภทงานที่สั่งด่วนบ่อยที่สุด */}
          <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-200/70 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/60">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Flame size={14} className="text-rose-600" />
                ประเภทงานที่ถูกสั่งด่วนบ่อยที่สุด (Top Urgent Categories)
              </span>
              <span className="text-[10px] font-mono text-rose-700">
                {analytics.urgentCategories.length} หมวดงานด่วน
              </span>
            </div>

            {analytics.urgentCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ไม่มีข้อมูลหมวดงานด่วน
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.urgentCategories.slice(0, 5).map((c, idx) => (
                  <div
                    key={c.category}
                    onClick={() => onCategoryClick?.(c.category)}
                    className="p-2.5 bg-white rounded-lg border border-rose-200/60 space-y-1 hover:border-rose-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md font-mono">
                          #{idx + 1}
                        </span>
                        <span className="truncate max-w-[200px]">{c.category}</span>
                      </span>
                      <span className="font-mono font-bold text-rose-800">
                        {c.urgentTasks} ชิ้นด่วน <span className="text-slate-400 font-normal">({c.urgentRate}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, c.urgentRate))}%` }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: OVERDUE TASKS - ทีมไหนงานเกินระยะเวลามากสุด */}
      {activeTab === 'overdue' && (
        <div className="space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>จัดอันดับทีมที่มีงานเกินระยะเวลากำหนดส่งมอบ (Overdue Tasks)</span>
            <span className="font-mono text-rose-700 font-bold">รวม {analytics.totalOverdueCount} งานเกินกำหนด</span>
          </div>

          {analytics.overdueTeams.length === 0 ? (
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
              🎉 ยอดเยี่ยมมาก! ขณะนี้ไม่มีทีมใดมีงานเกินระยะเวลากำหนดในระบบ
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.overdueTeams.map((team, idx) => (
                <div
                  key={team.teamKey}
                  className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-900 text-xs font-black flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {team.teamName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs sm:text-sm text-rose-700">
                        ⚠️ เกินกำหนด {team.overdueTasks} งาน
                      </span>
                      <div className="text-[10px] text-slate-500">
                        (คิดเป็น {team.overdueRate}% ของงานที่ทีมนี้สั่ง)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-rose-100">
                    <span>สถานะงานที่ค้าง: กำลังทำ {team.inProgressTasks} งาน / รอเริ่ม {team.pendingTasks} งาน</span>
                    <span className="text-rose-700 font-semibold">แนะนำ: นัดตรวจเช็กฟีดแบ็กหรือประสานงานด่วน</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES BREAKDOWN - สัดส่วนประเภทงาน */}
      {activeTab === 'categories' && (
        <div className="space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>ประเภทงานที่มีการสั่งผลิตทั้งหมด จัดเรียงตามความถี่</span>
            <span className="font-mono">ทั้งหมด {analytics.popularCategories.length} หมวดงาน</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {analytics.popularCategories.map((cat, idx) => (
              <div
                key={cat.category}
                onClick={() => onCategoryClick?.(cat.category)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-900">{cat.totalTasks} ชิ้น</span>
                    <span className="text-[10px] text-emerald-700 font-mono block font-bold">฿{cat.totalSaveCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>สัดส่วน: <strong className="text-slate-800">{cat.sharePct}%</strong></span>
                  <span>เวลาเฉลี่ย: <strong className="text-slate-800">{cat.avgDays > 0 ? `${cat.avgDays} วัน` : "-"}</strong></span>
                  <span className={cat.onTimeRate >= 80 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                    ตรงเวลา {cat.onTimeRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
