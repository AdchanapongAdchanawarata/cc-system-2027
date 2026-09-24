"use client";

import React, { useState } from 'react';
import { 
  Activity, Flame, Gem, Users, AlertTriangle, 
  TrendingUp, ChevronDown, ChevronUp, ShieldAlert, 
  CheckCircle2, Sparkles, UserCheck, Calendar,
  ArrowUpRight, BarChart2, Layers, HelpCircle
} from 'lucide-react';
import { 
  TeamWorkloadInsights, 
  MemberContinuityInsight, 
  TeamPeakSpike 
} from '@/utils/teamAnalytics';

interface WorkloadContinuityInsightsProps {
  insights: TeamWorkloadInsights;
  unitLabel?: string;
  onSelectMember?: (assigneeId: string) => void;
}
import PressureGaugeMeter from '../charts/PressureGaugeMeter';

export default function WorkloadContinuityInsights({
  insights,
  unitLabel = "ทุกยูนิต",
  onSelectMember
}: WorkloadContinuityInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'continuity' | 'value' | 'support' | 'spikes'>('continuity');

  const {
    teamAvgContinuityRate,
    burnoutRiskCount,
    burnoutRiskMembers,
    teamAvgValuePerTask,
    highImpactCount,
    topValueMember,
    teamAvgAssistantRatio,
    topSupportCount,
    topSupportMember,
    peakSpikePeriod,
    topSpikePeriods,
    teamWeeklyAverageTasks,
    currentMonthRangeLabel,
    memberInsights,
    weeklySpikes,
  } = insights;

  // Sorted lists for tabs
  const sortedByContinuity = [...memberInsights].sort((a, b) => {
    if (b.continuityRate !== a.continuityRate) return b.continuityRate - a.continuityRate;
    return b.consecutiveActiveWeeks - a.consecutiveActiveWeeks;
  });

  const sortedByValue = [...memberInsights].sort((a, b) => b.avgValuePerTask - a.avgValuePerTask);

  const sortedBySupport = [...memberInsights].sort((a, b) => b.assistantRatio - a.assistantRatio);

  // Value Gauge calculation (15% to 95%) - 3 ช่วงปกติ: 0-33.33%, 33.33-66.67%, 66.67-100%
  const valueGaugePct = Math.min(95, Math.max(15, Math.round(
    teamAvgValuePerTask <= 30000 
      ? (teamAvgValuePerTask / 30000) * 33.33 
      : teamAvgValuePerTask <= 120000 
      ? 33.33 + ((teamAvgValuePerTask - 30000) / 90000) * 33.34 
      : 66.67 + Math.min(28, ((teamAvgValuePerTask - 120000) / 180000) * 28)
  )));

  // Support Gauge calculation (15% to 95%) - 3 ช่วงปกติ: 0-33.33%, 33.33-66.67%, 66.67-100%
  const supportGaugePct = Math.min(95, Math.max(15, Math.round(
    teamAvgAssistantRatio <= 12 
      ? (teamAvgAssistantRatio / 12) * 33.33 
      : teamAvgAssistantRatio <= 30 
      ? 33.33 + ((teamAvgAssistantRatio - 12) / 18) * 33.34 
      : 66.67 + Math.min(28, ((teamAvgAssistantRatio - 30) / 30) * 28)
  )));

  // Peak Capacity Gauge calculation (15% to 95%) based on spike ratio - 3 ช่วงปกติ
  const peakRatio = peakSpikePeriod?.ratioToAverage || 1;
  const isRealSpike = peakRatio >= 1.4 && (peakSpikePeriod?.concurrentTaskCount || 0) >= 5;
  const isModerateSpike = peakRatio >= 1.2 && (peakSpikePeriod?.concurrentTaskCount || 0) >= 5;

  const peakGaugeValue = Math.min(95, Math.max(15, Math.round(
    peakRatio <= 1.0 
      ? 15 + Math.max(0, (peakRatio - 0.5) * 36)
      : peakRatio <= 1.35 
      ? 33.33 + ((peakRatio - 1.0) / 0.35) * 33.34
      : 66.67 + Math.min(28, ((peakRatio - 1.35) / 0.65) * 28)
  )));

  const peakNeedleColor = isRealSpike ? "#dc2626" : isModerateSpike ? "#d97706" : "#059669";
  const topContinuity = sortedByContinuity[0] || null;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-300/80 shadow-xs overflow-hidden mb-5 transition-all">
      
      {/* 1. Header Strip: พื้นหลังสีเทาเข้ม เรียบง่าย เน้นความสมดุล */}
      <div className="p-4 sm:p-5 bg-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-slate-700/80 text-slate-200 border border-slate-600/80">
              <Activity size={18} />
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 flex-wrap">
              <span>ความสมดุลและภาระงานของทีม</span>
              <span className="text-xs font-medium bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-600">
                {unitLabel}
              </span>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                📅 {currentMonthRangeLabel} (เดือนปัจจุบัน)
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            ติดตามความสมดุลภาระงานเพื่อป้องกันความล้าสะสม ชี้วัดมูลค่างาน การทำงานร่วมกัน และการกระจายตัวของงานในทีม
          </p>
        </div>

        {/* Toggle Expand Matrix Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer self-start md:self-center shadow-xs ${
            isExpanded 
              ? 'bg-white text-slate-900 hover:bg-slate-100' 
              : 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
          }`}
        >
          <span>{isExpanded ? 'ย่อตารางเจาะลึก' : 'ดูการจัดอันดับสมาชิกทุกคน (Ranking Matrix)'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 2. 4 Hero KPI Cards */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 bg-slate-50/50 dark:bg-zinc-950/60">
        
        {/* CARD 1: เกจวัดความดันภาระงาน (Burnout Pressure Gauge) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-2.5 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
                  1. เกจความดันภาระงานสะสม
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <span>Burnout Pressure Gauge</span>
                  <span title="มาตรวัดความดันภาระงาน: สมาชิกมีงานมือไม่ว่างเลยตลอดหลายสัปดาห์จนเสี่ยงหมดไฟหรือไม่?">
                    <HelpCircle size={12} className="text-slate-400 dark:text-zinc-400 cursor-help" />
                  </span>
                </h4>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  เกณฑ์วัด: มีงานต่อเนื่องไม่เว้นวรรค (ป้องกันหมดไฟ)
                </div>
              </div>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                burnoutRiskCount > 0 
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}>
                <Flame size={17} />
              </span>
            </div>

            {/* Pressure Gauge Dial Visual */}
            <PressureGaugeMeter
              value={teamAvgContinuityRate}
              leftLabel="ผ่อนคลาย"
              midLabel="ตึงตัว"
              rightLabel="เสี่ยงหมดไฟ"
              needleColor={burnoutRiskCount > 0 ? "#dc2626" : "#0f172a"}
            />

            {/* Status Callout Box */}
            <div className="mt-1">
              {burnoutRiskCount > 0 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-rose-50 dark:bg-rose-950/50 border border-rose-200/90 dark:border-rose-800/60 text-rose-950 dark:text-rose-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🔴 ระดับ 3: ความดันสูง เสี่ยงหมดไฟ</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>({burnoutRiskCount} คน)</div>
                  </div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>งานต่อเนื่องเกิน 85% ของเวลา ควรเกลี่ยงานออก</span>
                </div>
              ) : teamAvgContinuityRate >= 60 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-amber-50 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟡 ระดับ 2: งานเข้าต่อเนื่อง</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(สม่ำเสมอ)</div>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>ภาระงานหมุนเวียนต่อเนื่อง ยังไม่เกินเกณฑ์</span>
                </div>
              ) : (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟢 ระดับ 1: ผ่อนคลาย</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(งานไม่คั่งค้าง)</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>ไม่มีใครรับงานสะสมเกินเกณฑ์ สมาชิกมีช่วงพักหายใจ</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs">
            {burnoutRiskCount > 0 && topContinuity ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-xl p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="flex items-center gap-1 text-rose-900 dark:text-rose-200 font-bold">
                    <Flame size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>รับงานต่อเนื่องสูงสุด:</span>
                  </span>
                  <span className="font-bold text-rose-800 dark:text-rose-200 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-700 shrink-0">
                    {topContinuity.name}
                  </span>
                </div>
                <div className="text-[10px] text-rose-800 dark:text-zinc-200 bg-white/70 dark:bg-zinc-900/90 border border-slate-200/40 dark:border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-rose-700 dark:text-zinc-400 font-medium">สถานะภาระงาน:</span>
                  <strong className="font-bold text-rose-800 dark:text-rose-300">ทำต่อเนื่อง {topContinuity.consecutiveActiveWeeks} สัปดาห์ (~{topContinuity.weeklyAverageTasks} งาน/สัปดาห์)</strong>
                </div>
              </div>
            ) : topContinuity ? (
              <div className="bg-slate-50 dark:bg-zinc-850/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-800 dark:text-zinc-200 font-bold">
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>จัดสรรภาระงานดีเยี่ยม:</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 shrink-0">
                    {topContinuity.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/90 border border-slate-200/40 dark:border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">ปริมาณงานที่ทำ:</span>
                  <strong className="font-bold text-emerald-700 dark:text-emerald-400">ทำงานเหมาะสม ~{topContinuity.weeklyAverageTasks} ชิ้น/สัปดาห์</strong>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">-</div>
            )}
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 px-0.5">
              {burnoutRiskCount > 0 ? 'มีงานเข้ามือต่อเนื่องเกือบตลอดเวลา เสี่ยงล้าสะสม' : 'สมาชิกกระจายงานได้สมดุล มีปริมาณงานเหมาะสมสม่ำเสมอ'}
            </div>
          </div>
        </div>

        {/* CARD 2: เกจสร้างมูลค่าผลงาน (Average Value per Task) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-2.5 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-500 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
                  2. เกจสร้างมูลค่าผลงาน
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <span>Impact vs Volume Gauge</span>
                  <span title="เปรียบเทียบมูลค่าต่องาน: ทีมเน้นงานไวส่งมอบเร็ว (Volume) หรือเน้นงานยากสร้างมูลค่าสูง (High-Impact)">
                    <HelpCircle size={12} className="text-slate-400 dark:text-zinc-400 cursor-help" />
                  </span>
                </h4>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  เกณฑ์วัด: Save Cost เฉลี่ยต่องาน (งานยาก vs งานไว)
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                <Gem size={17} />
              </span>
            </div>

            {/* Value Gauge Dial Visual */}
            <PressureGaugeMeter
              value={valueGaugePct}
              leftLabel="เน้นงานไว"
              midLabel="สมดุล"
              rightLabel="โปรเจกต์ใหญ่"
              colors={["#0284c7", "#8b5cf6", "#059669"]}
              labelColors={["#0284c7", "#7c3aed", "#059669"]}
              needleColor="#059669"
            />

            {/* Status Callout Box */}
            <div className="mt-1">
              {teamAvgValuePerTask >= 120000 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>💎 สเกลโปรเจกต์ใหญ่</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(High-Impact)</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    เฉลี่ย ฿{teamAvgValuePerTask.toLocaleString()}/งาน เน้นมูลค่าสูงต่อชิ้น
                  </span>
                </div>
              ) : teamAvgValuePerTask >= 30000 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-purple-50 dark:bg-purple-950/50 border border-purple-200/90 dark:border-purple-800/60 text-purple-950 dark:text-purple-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>⚖️ สเกลงานสมดุล</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(Balanced)</div>
                  </div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    เฉลี่ย ฿{teamAvgValuePerTask.toLocaleString()}/งาน ผสมงานไวและงานหลัก
                  </span>
                </div>
              ) : (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-sky-50 dark:bg-sky-950/50 border border-sky-200/90 dark:border-sky-800/60 text-sky-950 dark:text-sky-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🚀 เน้นงานส่งมอบเร็ว</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(High Volume)</div>
                  </div>
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    เฉลี่ย ฿{teamAvgValuePerTask.toLocaleString()}/งาน เน้นรอบงานเร็ว
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs">
            {topValueMember ? (
              <div className="bg-slate-50 dark:bg-zinc-850/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-800 dark:text-zinc-200 font-bold">
                    <Gem size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>มูลค่าเฉลี่ยสูงสุด:</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 shrink-0">
                    {topValueMember.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/90 border border-slate-200/40 dark:border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Save Cost เฉลี่ย:</span>
                  <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-400">฿{Math.round(topValueMember.avgValuePerTask).toLocaleString()}/งาน</strong>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">-</div>
            )}
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 px-0.5">
              มี {highImpactCount} คนเน้นโปรเจกต์สเกลใหญ่สร้างมูลค่าสูง (Save Cost)
            </div>
          </div>
        </div>

        {/* CARD 3: เกจสัดส่วนงานช่วยซัพพอร์ต (Support Ratio) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-2.5 relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-500 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
                  3. เกจสัดส่วนงานช่วยซัพพอร์ต
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <span>Support Ratio Gauge</span>
                  <span title="สัดส่วนงานที่เป็นผู้ช่วยคนอื่นเทียบกับงานทั้งหมด บ่งบอกว่าทีมต้องพึ่งพางานซัพพอร์ตข้ามฝ่ายมากน้อยเพียงใด">
                    <HelpCircle size={12} className="text-slate-400 dark:text-zinc-400 cursor-help" />
                  </span>
                </h4>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  เกณฑ์วัด: สัดส่วนงานช่วยเพื่อน (% งานช่วย vs งานหลัก)
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                <Users size={17} />
              </span>
            </div>

            {/* Support Ratio Gauge Dial Visual */}
            <PressureGaugeMeter
              value={supportGaugePct}
              leftLabel="งานเดี่ยว"
              midLabel="ร่วมมือพอดี"
              rightLabel="ช่วยหนักมาก"
              colors={["#0284c7", "#10b981", "#f59e0b"]}
              labelColors={["#0284c7", "#059669", "#d97706"]}
              needleColor="#d97706"
            />

            {/* Status Callout Box */}
            <div className="mt-1">
              {teamAvgAssistantRatio > 30 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-amber-50 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>👥 พึ่งพางานช่วยสูง</div>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    มีงานที่ต้องระดมทีมช่วยเยอะ ควรระวังไม่ให้ผู้ช่วยรับงานล้นมือ
                  </span>
                </div>
              ) : teamAvgAssistantRatio >= 12 ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🤝 สัดส่วนร่วมมือพอดี</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    งานหลัก {100 - teamAvgAssistantRatio}% • ช่วยซัพพอร์ตกันอย่างสมดุล
                  </span>
                </div>
              ) : (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-sky-50 dark:bg-sky-950/50 border border-sky-200/90 dark:border-sky-800/60 text-sky-950 dark:text-sky-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🎯 เน้นลุยเดี่ยวเป็นหลัก</div>
                  </div>
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    สมาชิกรับผิดชอบงานจบด้วยตัวเอง งานช่วย {teamAvgAssistantRatio}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs">
            {topSupportMember ? (
              <div className="bg-slate-50 dark:bg-zinc-850/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-800 dark:text-zinc-200 font-bold">
                    <Users size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>ช่วยเพื่อนมากสุด:</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 shrink-0">
                    {topSupportMember.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/90 border border-slate-200/40 dark:border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">จำนวนงานที่ช่วยซัพพอร์ต:</span>
                  <strong className="font-bold text-amber-800 dark:text-amber-300">ช่วย {topSupportMember.assistantTaskCount} งาน ({topSupportMember.assistantRatio}%)</strong>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">-</div>
            )}
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 px-0.5">
              มี {topSupportCount} คนเป็นเสาหลักร่วมซัพพอร์ตงานของทีม
            </div>
          </div>
        </div>

        {/* CARD 4: เกจวัดความจุงานช่วงพีคสุด (Team Capacity Peak Spike Gauge) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-2.5 relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-500 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
                  4. เกจความจุงานช่วงพีคสุด
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <span>Peak Capacity Load</span>
                  <span title="สัปดาห์ที่มีจำนวนงานดำเนินอยู่ทับซ้อนกันหนาแน่นที่สุดในรอบปี เพื่อช่วยหัวหน้าทีมวางแผนเกลี่ยกำลังคนหรือพิจารณา Outsource ล่วงหน้า">
                    <HelpCircle size={12} className="text-slate-400 dark:text-zinc-400 cursor-help" />
                  </span>
                </h4>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                  เกณฑ์วัด: งานที่ทำพร้อมกัน เทียบกับค่าเฉลี่ยปกติ
                </div>
              </div>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                isRealSpike 
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
                  : isModerateSpike 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}>
                <TrendingUp size={17} />
              </span>
            </div>

            {/* Pressure Gauge Dial for Team Capacity */}
            <PressureGaugeMeter
              value={peakGaugeValue}
              leftLabel="เบาบาง"
              midLabel="ปกติ"
              rightLabel="ล้นพิกัด!"
              needleColor={peakNeedleColor}
            />

            {/* Peak Load Status Box */}
            <div className="mt-1">
              {isRealSpike ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-rose-50 dark:bg-rose-950/50 border border-rose-200/90 dark:border-rose-800/60 text-rose-950 dark:text-rose-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🔴 ระดับ 3: งานล้นพิกัด</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>({peakSpikePeriod?.concurrentTaskCount || 0} งานพร้อมกัน)</div>
                  </div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    งวด {peakSpikePeriod?.startDateStr} - {peakSpikePeriod?.endDateStr} สูงกว่าปกติ ~{peakRatio} เท่า
                  </span>
                </div>
              ) : isModerateSpike ? (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-amber-50 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟡 ระดับ 2: งานหนาแน่นขึ้น</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>({peakSpikePeriod?.concurrentTaskCount || 0} งานพร้อมกัน)</div>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    งวด {peakSpikePeriod?.startDateStr} - {peakSpikePeriod?.endDateStr} สูงกว่าปกติ ~{peakRatio} เท่า
                  </span>
                </div>
              ) : (
                <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 p-2.5 rounded-xl space-y-0.5">
                  <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟢 ระดับ 1: ปริมาณงานปกติ</div>
                    <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>({peakSpikePeriod?.concurrentTaskCount || 0} งานพร้อมกัน)</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                    งวด {peakSpikePeriod?.startDateStr} - {peakSpikePeriod?.endDateStr} ใกล้เคียงค่าเฉลี่ยปกติ
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs">
            <div className="bg-slate-50 dark:bg-zinc-850/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="flex items-center gap-1 text-slate-800 dark:text-zinc-200 font-bold">
                  <TrendingUp size={13} className={`${isRealSpike ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} shrink-0`} />
                  <span>สัปดาห์งานสูงสุด:</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 shrink-0">
                  งวด {peakSpikePeriod?.weekLabel}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/90 border border-slate-200/40 dark:border-zinc-800 rounded px-2 py-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-400 font-medium">ปริมาณงานทับซ้อน:</span>
                <strong className={`font-mono font-bold ${isRealSpike ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-zinc-200'}`}>
                  {peakSpikePeriod?.concurrentTaskCount || 0} งานพร้อมกัน
                </strong>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 px-0.5">
              เฉลี่ยทั้งทีมปกติ ~{teamWeeklyAverageTasks} งาน/สัปดาห์ {isRealSpike ? '• ควรเกลี่ยกำลังคนล่วงหน้า' : '• อัตรากระจายตัวปกติ'}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Expandable Member Ranking Matrix & Spike Timeline */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-in fade-in duration-200 space-y-4">
          
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('continuity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'continuity' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame size={14} className="text-rose-500" />
                <span>1. ดัชนีความต่อเนื่อง (Burnout Risk)</span>
              </button>

              <button
                onClick={() => setActiveTab('value')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'value' 
                    ? 'bg-white text-emerald-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gem size={14} className="text-emerald-600" />
                <span>2. มูลค่าเฉลี่ยต่องาน (High-Impact)</span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'support' 
                    ? 'bg-white text-amber-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={14} className="text-amber-600" />
                <span>3. สัดส่วนงานช่วย (Support Ratio)</span>
              </button>

              <button
                onClick={() => setActiveTab('spikes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'spikes' 
                    ? 'bg-white text-blue-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 size={14} className="text-blue-600" />
                <span>4. กราฟช่วงสัปดาห์พีคของทีม</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              คลิกที่ชื่อสมาชิกเพื่อเปิดดูรายงานส่วนบุคคล 360°
            </div>
          </div>

          {/* TAB 1: CONTINUITY & BURNOUT */}
          {activeTab === 'continuity' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>จัดอันดับความต่อเนื่องในการมีงานในมือตลอด 16 สัปดาห์ย้อนหลัง (Active Weeks Continuity)</span>
                <span className="font-semibold text-rose-600">🔴 เฝ้าระวังผู้มีงานต่อเนื่อง 90%+ หรือไม่เคยเว้นว่างติดต่อกันเกิน 8 สัปดาห์</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sortedByContinuity.map((m, idx) => {
                  const isCritical = m.burnoutRiskLevel === 'critical';
                  const isWarning = m.burnoutRiskLevel === 'warning';

                  return (
                    <div
                      key={m.assigneeId}
                      onClick={() => onSelectMember && onSelectMember(m.assigneeId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isCritical 
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400' 
                          : isWarning
                          ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-black font-mono text-slate-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800 group-hover:text-indigo-700 truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            ({m.unit})
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isCritical ? 'bg-rose-200 text-rose-900' : isWarning ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.continuityRate}% Active
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${m.continuityRate}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>มีงาน {m.activeWeeksCount} จาก {m.totalWeeksObserved} สัปดาห์</span>
                        <span className="font-mono font-bold text-slate-700">ติดกัน {m.consecutiveActiveWeeks} wk</span>
                      </div>

                      <div className="mt-1.5 text-[10px] truncate text-slate-500 font-medium">
                        {m.burnoutStatusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AVERAGE VALUE PER TASK */}
          {activeTab === 'value' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>จัดอันดับมูลค่าเฉลี่ยต่องาน (Save Cost รวม ÷ จำนวนงานทั้งหมด) เพื่อชี้ชัด High-Impact Specialist vs High Volume</span>
                <span className="font-semibold text-emerald-700">💎 ค่าเฉลี่ยทั้งทีม: ฿{teamAvgValuePerTask.toLocaleString()}/ชิ้น</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sortedByValue.map((m, idx) => {
                  const isHighImpact = m.impactProfile === 'high_impact';
                  const isHighVolume = m.impactProfile === 'high_volume';

                  return (
                    <div
                      key={m.assigneeId}
                      onClick={() => onSelectMember && onSelectMember(m.assigneeId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isHighImpact 
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400' 
                          : isHighVolume
                          ? 'bg-blue-50/30 border-blue-200 hover:border-blue-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-black font-mono text-slate-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700 truncate">
                            {m.name}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-700">
                          ฿{m.avgValuePerTask.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>มูลค่ารวม: <strong>฿{m.totalSaveCost.toLocaleString()}</strong></span>
                        <span>{m.totalTasks} ชิ้นงาน</span>
                      </div>

                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate inline-block">
                        {m.impactBadgeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ASSISTANT / SUPPORT RATIO */}
          {activeTab === 'support' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>จัดอันดับสัดส่วนงานที่เป็นผู้ช่วยซัพพอร์ต (Cross-skill) เทียบกับงานทั้งหมด</span>
                <span className="font-semibold text-amber-700">🤝 เฉลี่ยทีม: {teamAvgAssistantRatio}% งานช่วย</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sortedBySupport.map((m, idx) => {
                  const isTopSupport = m.supportProfile === 'top_supporter';

                  return (
                    <div
                      key={m.assigneeId}
                      onClick={() => onSelectMember && onSelectMember(m.assigneeId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isTopSupport 
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-black font-mono text-slate-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800 group-hover:text-amber-800 truncate">
                            {m.name}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono text-amber-700">
                          ช่วย {m.assistantRatio}%
                        </span>
                      </div>

                      {/* Stacked Workload Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mb-2">
                        <div 
                          className="bg-blue-600 h-full transition-all" 
                          style={{ width: `${100 - m.assistantRatio}%` }} 
                          title={`งานหลัก: ${m.ownerTaskCount} งาน`}
                        />
                        <div 
                          className="bg-amber-500 h-full transition-all" 
                          style={{ width: `${m.assistantRatio}%` }} 
                          title={`งานช่วย: ${m.assistantTaskCount} งาน`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>งานหลัก: <strong>{m.ownerTaskCount}</strong></span>
                        <span>งานช่วย: <strong className="text-amber-700">{m.assistantTaskCount}</strong></span>
                        <span>(รวม {m.totalTasks})</span>
                      </div>

                      <div className="mt-1.5 text-[10px] font-bold text-amber-800 truncate">
                        {m.supportBadgeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TEAM PEAK SPIKE TIMELINE */}
          {activeTab === 'spikes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>ปริมาณงานที่ดำเนินอยู่ทับซ้อนกันในแต่ละสัปดาห์ (Concurrent Active Tasks across Team)</span>
                <span className="font-semibold text-blue-700">⚡ ค่าเฉลี่ยทีม: ~{teamWeeklyAverageTasks} งาน/สัปดาห์</span>
              </div>

              {/* Weekly Spike Chart Bars */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 items-end h-32 pt-6">
                  {weeklySpikes.map((w) => {
                    const maxTasks = Math.max(1, ...weeklySpikes.map((k) => k.concurrentTaskCount));
                    const heightPct = Math.round((w.concurrentTaskCount / maxTasks) * 100);

                    return (
                      <div key={w.weekKey} className="flex flex-col items-center gap-1 h-full justify-end group">
                        <span className="text-[9px] font-mono font-bold text-slate-600 group-hover:text-blue-700">
                          {w.concurrentTaskCount}
                        </span>
                        <div className="w-full bg-slate-200 rounded-t h-20 flex items-end overflow-hidden p-0.5">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t transition-all ${
                              w.isPeak
                                ? 'bg-rose-500 group-hover:bg-rose-600'
                                : w.concurrentTaskCount >= teamWeeklyAverageTasks * 1.2
                                ? 'bg-amber-500 group-hover:bg-amber-600'
                                : 'bg-blue-500 group-hover:bg-blue-600'
                            }`}
                            title={`${w.weekLabel} (${w.startDateStr} - ${w.endDateStr}): ${w.concurrentTaskCount} งานพร้อมกัน`}
                          />
                        </div>
                        <span className="text-[8.5px] text-slate-400 truncate w-full text-center" title={`${w.startDateStr} - ${w.endDateStr}`}>
                          {w.weekLabel === 'สัปดาห์นี้' ? 'W-นี้' : w.weekLabel.replace(' สัปดาห์ก่อน', 'w')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                      <span>สัปดาห์พีคสูงสุด</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span>งานหนาแน่น (&gt;1.2x ค่าเฉลี่ย)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      <span>ระดับปกติ</span>
                    </span>
                  </div>

                  {peakSpikePeriod && (
                    <span className="font-semibold text-rose-700">
                      🚨 สัปดาห์พีค: {peakSpikePeriod.weekLabel} ({peakSpikePeriod.startDateStr} - {peakSpikePeriod.endDateStr}) ชนกัน {peakSpikePeriod.concurrentTaskCount} งาน
                    </span>
                  )}
                </div>
              </div>

              {/* Proactive Manager Advice */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                <span className="p-1 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <TrendingUp size={14} />
                </span>
                <div className="space-y-0.5">
                  <span className="font-bold block">คำแนะนำเชิงบริหารสำหรับหัวหน้าทีม:</span>
                  <p className="text-blue-900 leading-relaxed">
                    ในช่วงที่มีงานทับซ้อนเกิน 1.3 เท่าของค่าเฉลี่ยทีม ควรวางแผนแบ่งสรรงานล่วงหน้า โดยดึงสมาชิกในสังกัดที่มีความต่อเนื่องต่ำกว่า 70% เข้ามาเป็นผู้ช่วย (Assistant) 
                    หรือจัดเตรียมกระบวนการ Outsource สำหรับชิ้นงานที่สเกลไม่ซับซ้อน เพื่อป้องกันสมาชิกหลักเกิดภาวะ Burnout
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
