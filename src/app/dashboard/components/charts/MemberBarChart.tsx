"use client";

import React, { useState } from 'react';
import { BarChartItem } from '@/utils/chartStats';
import { Trophy, TrendingUp, Users, Info } from 'lucide-react';

interface MemberBarChartProps {
  items: BarChartItem[];
  metricTitle: string;
  metricUnit?: string;
  averageValue?: number;
  averageLabel?: string;
  isStacked?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  isLowerBetter?: boolean;
  onMemberClick?: (memberId: string) => void;
}

export default function MemberBarChart({
  items,
  metricTitle,
  metricUnit = "",
  averageValue,
  averageLabel = "ค่าเฉลี่ยทีม",
  isStacked = false,
  primaryLabel = "งานหลัก",
  secondaryLabel = "งานช่วย",
  isLowerBetter = false,
  onMemberClick
}: MemberBarChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    if (isLowerBetter) {
      // If lower is better (e.g. turnaround time), 0 or null goes to bottom
      if (a.value <= 0 && b.value > 0) return 1;
      if (b.value <= 0 && a.value > 0) return -1;
      return a.value - b.value;
    }
    return b.value - a.value;
  });

  // Determine maximum value for bar scale calculation
  const maxValue = Math.max(...sortedItems.map(i => i.value), averageValue || 0, 1);

  if (sortedItems.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-slate-100">
        ไม่มีข้อมูลสมาชิกสำหรับเกณฑ์ที่เลือก
      </div>
    );
  }

  const topItem = sortedItems[0];

  return (
    <div className="space-y-4">
      {/* Top Benchmark Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{metricTitle}</span>
          <span className="text-slate-400 font-medium">({sortedItems.length} คน)</span>
        </div>

        <div className="flex items-center gap-3">
          {averageValue !== undefined && averageValue > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>{averageLabel}:</span>
              <span className="font-mono font-bold text-slate-800">
                {metricUnit === "฿" ? `฿${averageValue.toLocaleString()}` : `${averageValue} ${metricUnit}`}
              </span>
            </div>
          )}

          {isStacked && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                {primaryLabel}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                {secondaryLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bar List */}
      <div className="space-y-2.5">
        {sortedItems.map((item, index) => {
          const isHovered = hoveredId === item.id;
          const pct = Math.min(100, Math.max(2, (item.value / maxValue) * 100));
          
          let primaryPct = pct;
          let secondaryPct = 0;
          if (isStacked && item.value > 0 && item.primaryValue !== undefined && item.secondaryValue !== undefined) {
            primaryPct = (item.primaryValue / item.value) * pct;
            secondaryPct = (item.secondaryValue / item.value) * pct;
          }

          const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onMemberClick?.(item.id)}
              className={`p-2 rounded-xl transition-all ${onMemberClick ? 'cursor-pointer' : ''} ${
                isHovered ? 'bg-slate-50 shadow-2xs scale-[1.005]' : 'hover:bg-slate-50/60'
              }`}
            >
              {/* Member Row Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs shrink-0 w-6 text-center font-bold text-slate-400">
                    {rankBadge}
                  </span>
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase bg-slate-100 text-slate-500 shrink-0">
                    {item.unit}
                  </span>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  {isStacked && isHovered && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      (หลัก: {item.primaryValue?.toLocaleString()} / ช่วย: {item.secondaryValue?.toLocaleString()})
                    </span>
                  )}
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {item.formattedValue}
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {isStacked ? (
                  <>
                    <div
                      style={{ width: `${primaryPct}%`, backgroundColor: item.color || "#10b981" }}
                      className="h-full transition-all duration-300"
                      title={`${primaryLabel}: ${item.primaryValue?.toLocaleString()}`}
                    />
                    <div
                      style={{ width: `${secondaryPct}%` }}
                      className="h-full bg-purple-500 transition-all duration-300 opacity-90"
                      title={`${secondaryLabel}: ${item.secondaryValue?.toLocaleString()}`}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color || "#0284c7"
                    }}
                    className="h-full rounded-full transition-all duration-300 relative"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
