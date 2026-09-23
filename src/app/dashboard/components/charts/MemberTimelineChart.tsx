"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MonthPoint, 
  MemberMonthlyData, 
  TimelineMetricKey, 
  formatMetricValue,
  generateCustomTimelinePoints,
  computeFlexibleMemberTimeline,
  TimelineGranularity,
  AssigneeInfo
} from '@/utils/chartStats';
import { BriefTaskLike } from '@/utils/stats';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  TrendingUp, Users, Calendar, ArrowUpRight, 
  Sparkles, Clock, SlidersHorizontal, ChevronRight, Activity
} from 'lucide-react';

export type StockTimeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL' | 'CUSTOM';
export type { TimelineGranularity };

interface MemberTimelineChartProps {
  briefs?: BriefTaskLike[];
  assignees?: AssigneeInfo[];
  // Backwards compatibility props
  months?: MonthPoint[];
  series?: MemberMonthlyData[];
  teamAverageByMonth?: Record<string, number>;
  metric: TimelineMetricKey;
  metricTitle: string;
  externalTimeframe?: StockTimeframe;
  onTimeframeChange?: (tf: StockTimeframe) => void;
  externalStartDate?: string;
  externalEndDate?: string;
  onDateChange?: (type: 'start' | 'end', val: string) => void;
  externalGranularity?: TimelineGranularity;
  onGranularityChange?: (g: TimelineGranularity) => void;
  hideTimeControls?: boolean;
}

export default function MemberTimelineChart({
  briefs,
  assignees,
  months: fallbackMonths = [],
  series: fallbackSeries = [],
  teamAverageByMonth: fallbackAverage = {},
  metric,
  metricTitle,
  externalTimeframe,
  onTimeframeChange,
  externalStartDate,
  externalEndDate,
  onDateChange,
  externalGranularity,
  onGranularityChange,
  hideTimeControls = false
}: MemberTimelineChartProps) {
  // 1. Stock timeframe presets & custom dates (Default to 1M)
  const [internalTimeframe, setInternalTimeframe] = useState<StockTimeframe>('1M');
  const [internalGranularity, setInternalGranularity] = useState<TimelineGranularity>('auto');

  const timeframe = externalTimeframe !== undefined ? externalTimeframe : internalTimeframe;
  const granularity = externalGranularity !== undefined ? externalGranularity : internalGranularity;

  // Compute default start/end dates (Default: 1 Month)
  const today = useMemo(() => new Date(), []);
  
  const defaultDates = useMemo(() => {
    const end = new Date(today);
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1); // 1 Month default
    
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    };
  }, [today]);

  const [internalStartDate, setInternalStartDate] = useState<string>(defaultDates.startDate);
  const [internalEndDate, setInternalEndDate] = useState<string>(defaultDates.endDate);

  const startDate = externalStartDate !== undefined ? externalStartDate : internalStartDate;
  const endDate = externalEndDate !== undefined ? externalEndDate : internalEndDate;

  const parseDateSafe = (str: string) => {
    if (!str) return null;
    try {
      const parts = str.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const parsedStartDate = useMemo(() => parseDateSafe(startDate), [startDate]);
  const parsedEndDate = useMemo(() => parseDateSafe(endDate), [endDate]);

  // Find earliest brief date for 'ALL'
  const earliestDate = useMemo(() => {
    if (!briefs || briefs.length === 0) return null;
    let minTime = Infinity;
    briefs.forEach(b => {
      const dStr = b.completed_at || b.created_at || b.in_progress_at || b.deadline;
      if (dStr) {
        const t = new Date(dStr).getTime();
        if (!isNaN(t) && t < minTime) minTime = t;
      }
    });
    return minTime !== Infinity ? new Date(minTime) : null;
  }, [briefs]);

  // Handle Preset Clicks (คล้ายกราฟหุ้น TradingView / Robinhood)
  const handleTimeframeChange = (tf: StockTimeframe) => {
    if (onTimeframeChange) onTimeframeChange(tf);
    setInternalTimeframe(tf);
    const end = new Date();
    let start = new Date();

    const formatDate = (d: Date) => {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
      } catch {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    };

    switch (tf) {
      case '1D':
        start = new Date(end);
        break;
      case '1W': {
        const day = end.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        start.setDate(start.getDate() + diffToMonday);
        break;
      }
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'YTD':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case 'ALL':
        if (earliestDate) {
          start = new Date(earliestDate);
        } else {
          start.setFullYear(start.getFullYear() - 2);
        }
        break;
      case 'CUSTOM':
        return;
    }

    const sVal = formatDate(start);
    const eVal = formatDate(end);
    setInternalStartDate(sVal);
    setInternalEndDate(eVal);
    if (onDateChange) {
      onDateChange('start', sVal);
      onDateChange('end', eVal);
    }
  };

  // When user manually picks start or end date
  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    if (onTimeframeChange) onTimeframeChange('CUSTOM');
    setInternalTimeframe('CUSTOM');
    if (type === 'start') {
      setInternalStartDate(val);
    } else {
      setInternalEndDate(val);
    }
    if (onDateChange) onDateChange(type, val);
  };

  const handleGranularityChange = (g: TimelineGranularity) => {
    if (onGranularityChange) onGranularityChange(g);
    setInternalGranularity(g);
  };

  // Compute dynamic timeline points
  const activePoints = useMemo(() => {
    if (briefs && assignees) {
      try {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          return generateCustomTimelinePoints(s, e, granularity);
        }
      } catch (err) {
        console.error("Error generating timeline points:", err);
      }
    }
    return fallbackMonths;
  }, [briefs, assignees, startDate, endDate, granularity, fallbackMonths]);

  // Compute dynamic timeline series
  const timelineResult = useMemo(() => {
    if (briefs && assignees && activePoints.length > 0) {
      return computeFlexibleMemberTimeline({
        briefs,
        assignees,
        metric,
        points: activePoints as any
      });
    }

    return {
      points: fallbackMonths,
      series: fallbackSeries,
      teamAverageByMonth: fallbackAverage,
      maxPointValue: 10,
      totalPeriodValue: fallbackSeries.reduce((s, m) => s + m.totalValue, 0),
      topMember: fallbackSeries[0] || null
    };
  }, [briefs, assignees, activePoints, metric, fallbackMonths, fallbackSeries, fallbackAverage]);

  const months = timelineResult.points;
  const series = timelineResult.series;
  const teamAverageByMonth = timelineResult.teamAverageByMonth;

  // Filter mode: 'top3' | 'all' | 'custom'
  const [viewFilter, setViewFilter] = useState<'top3' | 'all' | 'custom'>('top3');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAverage, setShowAverage] = useState(true);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selectedIds with series and viewFilter
  useEffect(() => {
    if (series.length === 0) {
      setSelectedIds(new Set());
      return;
    }
    if (viewFilter === 'all') {
      setSelectedIds(new Set(series.map(s => s.memberId)));
    } else if (viewFilter === 'top3') {
      const sorted = [...series].sort((a, b) => b.totalValue - a.totalValue);
      setSelectedIds(new Set(sorted.slice(0, Math.min(3, series.length)).map(s => s.memberId)));
    }
  }, [series, viewFilter]);

  // SVG dimensions
  const width = 880;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Filter visible series
  const visibleSeries = useMemo(() => {
    return series.filter(s => selectedIds.has(s.memberId));
  }, [series, selectedIds]);

  // Compute maximum value among visible series and team average
  const maxValue = useMemo(() => {
    let max = 1;
    visibleSeries.forEach(s => {
      months.forEach(m => {
        const v = s.valuesByMonth[m.key] || 0;
        if (v > max) max = v;
      });
    });

    if (showAverage) {
      months.forEach(m => {
        const avg = teamAverageByMonth[m.key] || 0;
        if (avg > max) max = avg;
      });
    }

    if (max <= 10) return 10;
    if (max <= 50) return Math.ceil(max / 10) * 10;
    if (max <= 100) return Math.ceil(max / 20) * 20;
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    if (max <= 10000) return Math.ceil(max / 1000) * 1000;
    if (max <= 100000) return Math.ceil(max / 10000) * 10000;
    return Math.ceil(max / 50000) * 50000;
  }, [visibleSeries, months, showAverage, teamAverageByMonth]);

  const safeMax = Math.max(1, maxValue);

  // Coordinate helpers
  const getX = (index: number) => {
    if (months.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (months.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, safeMax));
    return paddingTop + chartHeight - (clamped / safeMax) * chartHeight;
  };

  // Toggle member selection
  const toggleMember = (id: string) => {
    setViewFilter('custom');
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setViewFilter('all');
    setSelectedIds(new Set(series.map(s => s.memberId)));
  };

  const selectTop3 = () => {
    setViewFilter('top3');
    const sorted = [...series].sort((a, b) => b.totalValue - a.totalValue);
    setSelectedIds(new Set(sorted.slice(0, Math.min(3, series.length)).map(s => s.memberId)));
  };

  // Build SVG smooth line path string
  const buildLinePath = (values: number[]) => {
    if (values.length === 0) return "";
    return values.reduce((acc, val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      if (idx === 0) return `M ${x} ${y}`;
      const prevX = getX(idx - 1);
      const prevY = getY(values[idx - 1]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }, "");
  };

  // Build SVG smooth area path string (Stock-chart gradient under curve)
  const buildAreaPath = (values: number[]) => {
    if (values.length === 0) return "";
    const linePath = buildLinePath(values);
    const lastIdx = values.length - 1;
    const lastX = getX(lastIdx);
    const firstX = getX(0);
    const bottomY = paddingTop + chartHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Y-axis grid ticks (4 levels)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(r * safeMax));
  const hoveredMonth = hoveredMonthIndex !== null ? months[hoveredMonthIndex] : null;

  // Format date range text in Thai
  const thaiRangeLabel = useMemo(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const sStr = s.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
      const eStr = e.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
      return `${sStr} – ${eStr}`;
    } catch {
      return `${startDate} – ${endDate}`;
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-4 print:space-y-2">
      
      {/* 1. PRINT-SPECIFIC COMPACT SUMMARY BANNER */}
      <div className="hidden print:flex items-center justify-between text-xs text-slate-800 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
            <Activity size={13} />
          </span>
          <span className="font-bold text-slate-900">{metricTitle}</span>
          <span className="text-slate-500 font-mono text-[11px]">({thaiRangeLabel} • {months.length} จุดแสดงผล)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {timelineResult.topMember && (
            <span>
              ผู้นำผลงาน: <strong className="text-slate-900">{timelineResult.topMember.memberName}</strong>
              <span className="text-orange-600 font-bold ml-1 font-mono">({formatMetricValue(timelineResult.topMember.totalValue, metric)})</span>
            </span>
          )}
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono">
            ยอดรวม: {formatMetricValue(timelineResult.totalPeriodValue, metric)}
          </span>
        </div>
      </div>

      {/* 1. STOCK CHART TOOLBAR & DATE RANGE PICKER (แถบเครื่องมือกราฟหุ้น - Dieter Rams Light Style) */}
      <div className="bg-slate-50/80 text-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          
          {/* Left: Metric Title & Timeframe Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="p-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200/80">
                <Activity size={14} />
              </span>
              <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
                {metricTitle}
              </span>
            </div>

            {/* Stock Presets: 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL */}
            {!hideTimeControls && (
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as StockTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf)}
                    title={tf === '1D' ? 'วันนี้' : tf === '1W' ? 'สัปดาห์นี้' : undefined}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      timeframe === tf
                        ? "bg-slate-900 text-white font-bold shadow-xs"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}

            {/* Granularity Toggle (วัน / สัปดาห์ / เดือน) */}
            {!hideTimeControls && (
              <div className="hidden sm:flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] shadow-2xs">
                <button
                  onClick={() => handleGranularityChange('auto')}
                  className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                    granularity === 'auto' ? "bg-slate-900 text-white font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                  title="เลือกความละเอียดอัตโนมัติตามช่วงเวลา"
                >
                  อัตโนมัติ
                </button>
                <button
                  onClick={() => handleGranularityChange('day')}
                  className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                    granularity === 'day' ? "bg-slate-900 text-white font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  รายวัน
                </button>
                <button
                  onClick={() => handleGranularityChange('week')}
                  className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                    granularity === 'week' ? "bg-slate-900 text-white font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  รายสัปดาห์
                </button>
                <button
                  onClick={() => handleGranularityChange('month')}
                  className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                    granularity === 'month' ? "bg-slate-900 text-white font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  รายเดือน
                </button>
              </div>
            )}
          </div>

          {/* Right: Date Range Selector (มีหน้าต่างเลือกวันแบบ Popover Calendar) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {!hideTimeControls && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Calendar size={13} className="text-orange-500 shrink-0" />
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="text-slate-500 font-sans">เริ่ม:</span>
                  <DatePicker
                    selected={parsedStartDate}
                    onChange={(d: Date | null) => {
                      if (d) {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        handleCustomDateChange('start', `${y}-${m}-${day}`);
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="วันเริ่มต้น"
                    popperClassName="z-[9999]"
                    className="w-[96px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-[11px] font-mono transition-colors"
                  />
                  <span className="text-slate-400 font-sans mx-0.5">ถึง</span>
                  <DatePicker
                    selected={parsedEndDate}
                    onChange={(d: Date | null) => {
                      if (d) {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        handleCustomDateChange('end', `${y}-${m}-${day}`);
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="วันสิ้นสุด"
                    popperClassName="z-[9999]"
                    className="w-[96px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-[11px] font-mono transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Quick Filter: Top 3 & Show All */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={selectTop3}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  viewFilter === 'top3'
                    ? "bg-orange-500 text-white font-black shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs"
                }`}
              >
                Top 3
              </button>
              <button
                onClick={selectAll}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  viewFilter === 'all'
                    ? "bg-orange-500 text-white font-black shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs"
                }`}
              >
                ทุกคน ({series.length})
              </button>
              <button
                onClick={() => setShowAverage(!showAverage)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  showAverage
                    ? "bg-amber-500 text-white font-black shadow-xs"
                    : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs"
                }`}
              >
                <span className="w-2 h-0.5 border-t border-dashed border-current" />
                <span>เฉลี่ยทีม</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stock Info Ribbon: ช่วงวันที่ที่เลือก & ผลรวมในช่วงนี้ & ผู้มีผลงานสูงสุด */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500 flex items-center gap-1">
              <span>ช่วงเวลาที่วิเคราะห์:</span>
              <strong className="text-slate-800 font-mono font-bold">{thaiRangeLabel}</strong>
              <span className="text-[10px] text-slate-400">({months.length} จุดแสดงผล)</span>
            </span>
            {timelineResult.topMember && (
              <span className="text-slate-500 flex items-center gap-1">
                <span>ผู้นำผลงานช่วงนี้:</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: timelineResult.topMember.color }} />
                <strong className="text-slate-800">{timelineResult.topMember.memberName}</strong>
                <span className="text-orange-600 font-mono font-bold">
                  ({formatMetricValue(timelineResult.topMember.totalValue, metric)})
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">ยอดรวมในช่วงที่เลือก:</span>
            <span className="font-mono font-bold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 shadow-2xs">
              {formatMetricValue(timelineResult.totalPeriodValue, metric)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Member Chips Selector (คลิกเพื่อเปิด/ปิดทีละคน) */}
      <div className="flex flex-wrap gap-1.5 pt-0.5 print:hidden">
        {series.map(s => {
          const isSelected = selectedIds.has(s.memberId);
          return (
            <button
              key={s.memberId}
              onClick={() => toggleMember(s.memberId)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isSelected ? s.color : "#94a3b8",
                }}
              />
              <span className={isSelected ? "text-white font-medium" : "text-slate-500 font-medium"}>
                {s.memberName}
              </span>
              {isSelected && (
                <span className="text-[11px] font-mono text-white/90 pl-0.5 font-bold">
                  {formatMetricValue(s.totalValue, metric)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. STOCK CHART SVG CANVAS WITH GRADIENTS & CROSSHAIR */}
      <div className="relative bg-white rounded-2xl border border-slate-100 p-2 sm:p-4 overflow-hidden shadow-2xs print:p-1.5 print:border-slate-200 print:shadow-none print:rounded-xl">
        {series.length === 0 || months.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            ไม่พบข้อมูลสถิติในช่วงวันที่ {thaiRangeLabel}
          </div>
        ) : (
          <div className="w-full overflow-x-auto print:overflow-visible custom-scrollbar">
            <div className="min-w-[700px] print:min-w-0 print:w-full relative" ref={containerRef}>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto overflow-visible select-none print:max-h-[220px]"
              >
                <defs>
                  {/* Stock-Chart Area Gradients for visible lines */}
                  {visibleSeries.map(s => (
                    <linearGradient
                      key={`grad-${s.memberId}`}
                      id={`grad-${s.memberId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                      <stop offset="70%" stopColor={s.color} stopOpacity="0.05" />
                      <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                    </linearGradient>
                  ))}
                  <linearGradient id="grad-avg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {yTicks.map(t => {
                  const y = getY(t);
                  return (
                    <g key={t}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={width - paddingRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray={t === 0 ? "0" : "3 3"}
                      />
                      <text
                        x={paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono font-semibold"
                      >
                        {metric === 'save_cost' || metric === 'okr_save_cost'
                          ? `฿${t >= 1000000 ? `${(t/1000000).toFixed(1)}M` : t >= 1000 ? `${(t/1000).toFixed(0)}k` : t}`
                          : t}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Month / Date Labels */}
                {months.map((m, idx) => {
                  // If too many points, skip some labels for clarity
                  const skipInterval = months.length > 25 ? Math.ceil(months.length / 15) : 1;
                  const isVisibleLabel = idx % skipInterval === 0 || idx === months.length - 1;
                  if (!isVisibleLabel) return null;

                  const x = getX(idx);
                  const isHovered = hoveredMonthIndex === idx;

                  return (
                    <g key={m.key}>
                      <line
                        x1={x}
                        y1={paddingTop + chartHeight}
                        x2={x}
                        y2={paddingTop + chartHeight + 5}
                        stroke={isHovered ? "#0f172a" : "#cbd5e1"}
                        strokeWidth={isHovered ? "2" : "1"}
                      />
                      <text
                        x={x}
                        y={height - 14}
                        textAnchor="middle"
                        className={`text-[10px] font-semibold transition-colors ${
                          isHovered ? "fill-slate-900 font-black" : "fill-slate-400"
                        }`}
                      >
                        {m.label}
                      </text>
                    </g>
                  );
                })}

                {/* Hover Vertical Guide Line (Stock Crosshair) */}
                {hoveredMonthIndex !== null && (
                  <g>
                    <line
                      x1={getX(hoveredMonthIndex)}
                      y1={paddingTop}
                      x2={getX(hoveredMonthIndex)}
                      y2={paddingTop + chartHeight}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <circle
                      cx={getX(hoveredMonthIndex)}
                      y={paddingTop + chartHeight}
                      r={3}
                      fill="#0f172a"
                    />
                  </g>
                )}

                {/* Area Gradient Fills under Lines (Stock Look) */}
                {visibleSeries.map(s => {
                  const vals = months.map(m => s.valuesByMonth[m.key] || 0);
                  const areaData = buildAreaPath(vals);
                  return (
                    <path
                      key={`area-${s.memberId}`}
                      d={areaData}
                      fill={`url(#grad-${s.memberId})`}
                      className="transition-all duration-300 pointer-events-none"
                    />
                  );
                })}

                {/* Team Average Line (Dashed) */}
                {showAverage && (
                  <g className="team-average-group">
                    <path
                      d={buildLinePath(months.map(m => teamAverageByMonth[m.key] || 0))}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all"
                    />
                    {months.map((m, idx) => {
                      const avg = teamAverageByMonth[m.key] || 0;
                      if (avg <= 0) return null;
                      return (
                        <circle
                          key={`avg-${m.key}`}
                          cx={getX(idx)}
                          cy={getY(avg)}
                          r={hoveredMonthIndex === idx ? 5 : 3}
                          fill="#fef3c7"
                          stroke="#d97706"
                          strokeWidth="2"
                          className="transition-all"
                        />
                      );
                    })}
                  </g>
                )}

                {/* Member Smooth Lines */}
                {visibleSeries.map(s => {
                  const vals = months.map(m => s.valuesByMonth[m.key] || 0);
                  const pathData = buildLinePath(vals);

                  return (
                    <g key={s.memberId}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-200 hover:stroke-[3.5]"
                      />

                      {/* Dots on points */}
                      {vals.map((v, idx) => {
                        const isHoveredPoint = hoveredMonthIndex === idx;
                        return (
                          <circle
                            key={idx}
                            cx={getX(idx)}
                            cy={getY(v)}
                            r={isHoveredPoint ? 5.5 : 3}
                            fill="#ffffff"
                            stroke={s.color}
                            strokeWidth={isHoveredPoint ? 3.5 : 2}
                            className="transition-all duration-150"
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Transparent overlay column hit areas for smooth hover interaction */}
                {months.map((m, idx) => {
                  const xCenter = getX(idx);
                  const colWidth = chartWidth / (months.length - 1 || 1);
                  const xStart = xCenter - colWidth / 2;

                  return (
                    <rect
                      key={m.key}
                      x={xStart}
                      y={paddingTop}
                      width={colWidth}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredMonthIndex(idx)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Hover Tooltip Card (Stock Glassmorphism) */}
              {hoveredMonth && (
                <div 
                  className="absolute z-30 pointer-events-none bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 min-w-[220px] text-xs transition-all animate-in fade-in duration-100"
                  style={{
                    top: '12px',
                    left: `${Math.min(chartWidth - 120, Math.max(70, getX(hoveredMonthIndex || 0) - 100))}px`
                  }}
                >
                  <div className="font-bold border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Calendar size={12} />
                      {hoveredMonth.label}
                    </span>
                    {showAverage && (
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                        เฉลี่ยทีม: {formatMetricValue(teamAverageByMonth[hoveredMonth.key] || 0, metric)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {visibleSeries
                      .map(s => ({
                        name: s.memberName,
                        val: s.valuesByMonth[hoveredMonth.key] || 0,
                        color: s.color
                      }))
                      .sort((a, b) => b.val - a.val)
                      .map((item, rankIdx) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[10px] font-mono text-slate-400 w-3 text-right">
                              {rankIdx + 1}.
                            </span>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="truncate text-slate-200">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-white shrink-0">
                            {formatMetricValue(item.val, metric)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
