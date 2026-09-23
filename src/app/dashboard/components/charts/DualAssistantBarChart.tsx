"use client";

import React, { useState, useMemo } from 'react';
import { Users, Coins, ArrowUpDown, Award, Sparkles, TrendingUp } from 'lucide-react';
import { MemberStats } from '@/utils/stats';

interface DualAssistantBarChartProps {
  members: MemberStats[];
  onMemberClick?: (memberId: string) => void;
  title?: string;
  subtitle?: string;
}

export default function DualAssistantBarChart({
  members,
  onMemberClick,
  title = "กราฟเปรียบเทียบผลงานช่วยรายบุคคล (Assistant Workload & Value: 2 แท่งเปรียบเทียบ)",
  subtitle = "เปรียบเทียบ 2 แท่งอย่างเป็นรูปธรรม: แท่งสีส้มสะท้อน 'ปริมาณงานที่ช่วย (งาน)' และแท่งสีเขียวมรกตสะท้อน 'จำนวนเงินที่ได้จากการช่วย (บาท)'"
}: DualAssistantBarChartProps) {
  const [sortMode, setSortMode] = useState<'tasks' | 'cost' | 'name'>('tasks');

  // Compute maximum values for scaling the 2 bars
  const maxAssistTasks = useMemo(() => {
    return Math.max(...members.map((m) => m.assistantTaskCount), 1);
  }, [members]);

  const maxAssistCost = useMemo(() => {
    return Math.max(...members.map((m) => m.assistantSaveCost), 1);
  }, [members]);

  // Aggregate totals
  const totalAssistTasks = useMemo(() => {
    return members.reduce((sum, m) => sum + m.assistantTaskCount, 0);
  }, [members]);

  const totalAssistCost = useMemo(() => {
    return members.reduce((sum, m) => sum + m.assistantSaveCost, 0);
  }, [members]);

  // Sort members
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (sortMode === 'tasks') {
        if (b.assistantTaskCount !== a.assistantTaskCount) {
          return b.assistantTaskCount - a.assistantTaskCount;
        }
        return b.assistantSaveCost - a.assistantSaveCost;
      }
      if (sortMode === 'cost') {
        if (b.assistantSaveCost !== a.assistantSaveCost) {
          return b.assistantSaveCost - a.assistantSaveCost;
        }
        return b.assistantTaskCount - a.assistantTaskCount;
      }
      return a.name.localeCompare(b.name, 'th');
    });
  }, [members, sortMode]);

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-slate-200/90 shadow-xs overflow-hidden transition-all mb-4 print:border print:border-slate-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs shrink-0">
              <Users size={16} />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Controls: Sorting Buttons & Summary */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner text-xs">
            <button
              type="button"
              onClick={() => setSortMode('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                sortMode === 'tasks'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>เรียงตามปริมาณงานที่ช่วย</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('cost')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                sortMode === 'cost'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>เรียงตามจำนวนเงินที่ได้</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50/80 border-b border-slate-100 text-xs">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">งานช่วยรวมทั้งทีม</span>
          <div className="mt-0.5 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-black text-amber-800">{totalAssistTasks}</span>
            <span className="text-slate-500 text-xs">งาน</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Save Cost จากงานช่วยรวม</span>
          <div className="mt-0.5 flex items-baseline gap-1 font-mono">
            <span className="text-lg font-black text-emerald-700">฿{totalAssistCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">เฉลี่ยมูลค่างานช่วย</span>
          <div className="mt-0.5 flex items-baseline gap-1 font-mono">
            <span className="text-lg font-black text-blue-700">
              ฿{totalAssistTasks > 0 ? Math.round(totalAssistCost / totalAssistTasks).toLocaleString() : 0}
            </span>
            <span className="text-slate-500 text-xs">/งาน</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Legend คำอธิบาย 2 แท่ง</span>
          <div className="mt-1 flex flex-col gap-1 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span>แท่ง 1: ปริมาณงานที่ช่วย</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" />
              <span>แท่ง 2: จำนวนเงินที่ได้จากการช่วย</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Bar Comparison List for Each Member */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {sortedMembers.map((member, index) => {
          const taskPct = Math.min(100, Math.max(2, (member.assistantTaskCount / maxAssistTasks) * 100));
          const costPct = Math.min(100, Math.max(2, (member.assistantSaveCost / maxAssistCost) * 100));
          const avgPerAssistTask = member.assistantTaskCount > 0 ? Math.round(member.assistantSaveCost / member.assistantTaskCount) : 0;
          const assistRatio = (member.ownerTaskCount + member.assistantTaskCount) > 0
            ? Math.round((member.assistantTaskCount / (member.ownerTaskCount + member.assistantTaskCount)) * 100)
            : 0;

          return (
            <div
              key={member.assignee_id}
              onClick={() => onMemberClick?.(member.assignee_id)}
              className={`p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 hover:border-amber-300 hover:bg-slate-50/70 transition-all ${
                onMemberClick ? 'cursor-pointer' : ''
              } shadow-2xs space-y-2`}
            >
              {/* Member Row Title */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    index === 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : index === 1
                      ? 'bg-slate-200 text-slate-700'
                      : index === 2
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {member.name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {member.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">
                    สัดส่วนงานช่วย: <strong className="text-amber-800">{assistRatio}%</strong>
                  </span>
                  {avgPerAssistTask > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10.5px] font-bold">
                      เฉลี่ย ฿{avgPerAssistTask.toLocaleString()}/งาน
                    </span>
                  )}
                </div>
              </div>

              {/* DUAL BARS (2 แท่ง) */}
              <div className="space-y-1.5 pt-1">
                {/* แท่งที่ 1: ปริมาณงานที่ช่วย */}
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="flex items-center gap-1.5 font-bold text-amber-800">
                      <span className="w-2 h-2 rounded-xs bg-amber-500 shrink-0" />
                      <span>แท่งที่ 1: ปริมาณงานที่ช่วย</span>
                    </span>
                    <span className="font-mono font-black text-amber-900">
                      {member.assistantTaskCount} งาน
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                    <div
                      style={{ width: `${taskPct}%` }}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                      title={`ปริมาณงานที่ช่วย: ${member.assistantTaskCount} งาน (${taskPct.toFixed(0)}% ของสูงสุด)`}
                    />
                  </div>
                </div>

                {/* แท่งที่ 2: จำนวนเงินที่ได้จากการช่วย */}
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <span className="w-2 h-2 rounded-xs bg-emerald-600 shrink-0" />
                      <span>แท่งที่ 2: จำนวนเงินที่ได้จากการช่วย (Save Cost)</span>
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      ฿{member.assistantSaveCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                    <div
                      style={{ width: `${costPct}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                      title={`จำนวนเงินที่ได้จากการช่วย: ฿${member.assistantSaveCost.toLocaleString()} (${costPct.toFixed(0)}% ของสูงสุด)`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
