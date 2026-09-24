"use client";

import React from 'react';

interface PressureGaugeMeterProps {
  value: number; // 0 to 100
  leftLabel?: string;
  midLabel?: string;
  rightLabel?: string;
  needleColor?: string;
  colors?: [string, string, string]; // [left, mid, right]
  labelColors?: [string, string, string];
  size?: 'sm' | 'md';
}

export default function PressureGaugeMeter({
  value,
  leftLabel = "ผ่อนคลาย",
  midLabel = "ตึงตัว",
  rightLabel = "วิกฤต",
  needleColor = "#0f172a",
  colors = ["#10b981", "#f59e0b", "#ef4444"],
  labelColors,
  size = 'md'
}: PressureGaugeMeterProps) {
  const clamped = Math.min(100, Math.max(0, value));
  // Map 0% -> 180 deg (left), 100% -> 0 deg (right)
  const deg = 180 - (clamped / 100) * 180;
  const rad = deg * (Math.PI / 180);

  const cx = 70;
  const cy = 66;
  const needleLen = 38;
  const needleX = cx + needleLen * Math.cos(rad);
  const needleY = cy - needleLen * Math.sin(rad);

  const [leftColor, midColor, rightColor] = colors;
  const leftLabelColor = labelColors?.[0] || leftColor;
  const midLabelColor = labelColors?.[1] || midColor;
  const rightLabelColor = labelColors?.[2] || rightColor;

  return (
    <div className="flex flex-col items-center justify-center my-1 select-none">
      <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
        {/* Background Grey Track */}
        <path
          d="M 24,66 A 46,46 0 0,1 116,66"
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-zinc-750"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Band 1 (0 - 33.33%, 180 deg to 120 deg) */}
        <path
          d="M 24,66 A 46,46 0 0,1 47,26.16"
          fill="none"
          stroke={leftColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Band 2 (33.33% - 66.67%, 120 deg to 60 deg) */}
        <path
          d="M 47,26.16 A 46,46 0 0,1 93,26.16"
          fill="none"
          stroke={midColor}
          strokeWidth="10"
        />
        {/* Band 3 (66.67% - 100%, 60 deg to 0 deg) */}
        <path
          d="M 93,26.16 A 46,46 0 0,1 116,66"
          fill="none"
          stroke={rightColor}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Small Labels at ticks */}
        <text x="20" y="78" fontSize="8" fontWeight="bold" fill={leftLabelColor} textAnchor="middle">{leftLabel}</text>
        <text x="70" y="13" fontSize="8" fontWeight="bold" fill={midLabelColor} textAnchor="middle">{midLabel}</text>
        <text x="120" y="78" fontSize="8" fontWeight="bold" fill={rightLabelColor} textAnchor="middle">{rightLabel}</text>

        {/* Needle Line */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={needleColor === "#0f172a" ? "currentColor" : needleColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          className={`transition-all duration-700 ease-out ${needleColor === "#0f172a" ? "text-slate-900 dark:text-zinc-100" : ""}`}
        />
        {/* Needle Hub */}
        <circle cx={cx} cy={cy} r="5" fill={needleColor === "#0f172a" ? "currentColor" : needleColor} className={needleColor === "#0f172a" ? "text-slate-900 dark:text-zinc-100" : ""} />
        <circle cx={cx} cy={cy} r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}
