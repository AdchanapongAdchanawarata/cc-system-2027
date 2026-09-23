'use client';

import React, { useState } from 'react';

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  secondaryValue?: string; // e.g. ฿120,000
  color: string;
}

interface InteractiveDonutChartProps {
  title?: string;
  subtitle?: string;
  data: DonutSegment[];
  size?: number;
  innerRadiusRatio?: number;
  centerTitle?: string;
  centerValue?: string;
  showLegend?: boolean;
}

export default function InteractiveDonutChart({
  title,
  subtitle,
  data,
  size = 210,
  innerRadiusRatio = 0.65,
  centerTitle,
  centerValue,
  showLegend = true,
}: InteractiveDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, cur) => acc + (cur.value || 0), 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-2">
          <span className="text-xs">ไม่มีข้อมูล</span>
        </div>
        {title && <p className="text-xs font-semibold text-slate-500">{title}</p>}
      </div>
    );
  }

  const radius = size / 2;
  const strokeWidth = radius * (1 - innerRadiusRatio);
  const chartRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * chartRadius;

  // Compute strokeDasharray and strokeDashoffset for each segment
  let accumulatedPercent = 0;
  const segments = data.map((seg, idx) => {
    const percent = seg.value / total;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...seg,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col h-full">
      {title && (
        <div className="mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-auto py-1">
        {/* SVG Donut Chart */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 origin-center transition-transform"
          >
            {/* Background ring */}
            <circle
              cx={radius}
              cy={radius}
              r={chartRadius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.idx;
              return (
                <circle
                  key={seg.key}
                  cx={radius}
                  cy={radius}
                  r={chartRadius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(seg.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3">
            {activeSegment ? (
              <>
                <span className="text-2xl font-black font-mono text-slate-800 leading-none">
                  {activeSegment.percent}%
                </span>
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px] mt-1">
                  {activeSegment.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeSegment.value} งาน
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                  {centerValue || total}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {centerTitle || "ชิ้นงานทั้งหมด"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 w-full max-w-[320px] space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.idx;
              return (
                <div
                  key={seg.key}
                  onMouseEnter={() => setHoveredIndex(seg.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isHovered ? 'bg-slate-100/80 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                      style={{
                        backgroundColor: seg.color,
                        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                    <span className="font-medium text-slate-800 whitespace-nowrap" title={seg.label}>
                      {seg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-right">
                    <span className="text-slate-400 text-[11px]">{seg.value} ชิ้น</span>
                    <span className="font-bold text-slate-800 text-xs w-9 text-right">
                      {seg.percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
