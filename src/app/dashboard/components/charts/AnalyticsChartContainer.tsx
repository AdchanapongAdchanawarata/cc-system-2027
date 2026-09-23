"use client";

import React, { useState } from 'react';
import { BarChart3, TrendingUp, ChevronDown, ChevronUp, Sparkles, Layers } from 'lucide-react';

export interface MetricOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnalyticsChartContainerProps {
  title?: string;
  subtitle?: string;
  barChart?: React.ReactNode;
  timelineChart: React.ReactNode;
  metricOptions: MetricOption[];
  activeMetric: string;
  onMetricChange: (metric: string) => void;
  defaultMode?: 'bar' | 'timeline';
}

export default function AnalyticsChartContainer({
  title = "เปรียบเทียบภาระงานกับระยะเวลา (Workload vs Time Analysis)",
  subtitle = "เปรียบเทียบปริมาณงานที่ทำกับช่วงเวลาเพื่อดูว่าใครรับโหลดงานหนักตลอดเวลา หรือสลับดูมูลค่างานเพื่อดูว่าใครทำงานที่มีมูลค่าสูงบ่อยๆ",
  timelineChart,
  metricOptions,
  activeMetric,
  onMetricChange,
}: AnalyticsChartContainerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-slate-200/90 shadow-xs overflow-hidden transition-all mb-4 print:break-inside-avoid print:rounded-xl print:border print:border-slate-300 print:mb-3 print:overflow-visible">
      {/* Container Header */}
      <div className="p-4 sm:p-5 print:p-3 print:pb-2 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-2 print:p-1.5 rounded-xl bg-[#E03131] text-white shadow-2xs shrink-0">
              <TrendingUp size={18} />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 print:mt-0.5 print:text-[10px] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls: Single Organized Row */}
        <div className="flex items-center gap-2 shrink-0 self-start xl:self-center print:hidden">
          {/* Metric Selector Pills */}
          {metricOptions.length > 1 && (
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner gap-1">
              {metricOptions.map((opt) => {
                const isActive = activeMetric === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onMetricChange(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer shrink-0"
            title={isExpanded ? "ย่อกราฟ" : "ขยายกราฟ"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Container Body */}
      {isExpanded && (
        <div className="p-4 sm:p-6 print:p-3 print:pt-2 animate-in fade-in duration-200">
          {timelineChart}
        </div>
      )}
    </div>
  );
}
