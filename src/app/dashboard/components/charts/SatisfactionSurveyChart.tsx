'use client';

import React, { useMemo } from 'react';
import { Star, CheckCircle2, Mail, Minus, Award, BarChart3, TrendingUp, Users } from 'lucide-react';
import InteractiveDonutChart, { DonutSegment } from './InteractiveDonutChart';
import { computeSatisfactionAnalytics } from '@/utils/okrSettings';

interface SatisfactionSurveyChartProps {
  briefs: any[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function SatisfactionSurveyChart({
  briefs,
  title = "แผนภูมิการทำแบบประเมินความพึงพอใจ (Satisfaction Survey Analytics)",
  subtitle = "วิเคราะห์อัตราการประเมิน 3 สถานะ และคะแนนเฉลี่ย 5 มิติ",
  className = ""
}: SatisfactionSurveyChartProps) {
  const analytics = useMemo(() => {
    return computeSatisfactionAnalytics(briefs);
  }, [briefs]);

  // Segments for Donut chart
  const donutData: DonutSegment[] = useMemo(() => {
    const total = analytics.totalCompletedTasks || 1;
    return [
      {
        key: 'completed',
        label: 'ทำแบบประเมินแล้ว',
        value: analytics.evaluatedCount,
        secondaryValue: `${Math.round((analytics.evaluatedCount / total) * 100)}%`,
        color: '#10b981' // emerald
      },
      {
        key: 'sent',
        label: 'ส่งแบบประเมินแล้ว',
        value: analytics.sentCount,
        secondaryValue: `${Math.round((analytics.sentCount / total) * 100)}%`,
        color: '#3b82f6' // blue
      }
    ];
  }, [analytics]);

  const dimensionList = [
    { key: 'accuracy', name: '1. ความถูกต้องสมบูรณ์', score: analytics.dimensions.accuracy },
    { key: 'timeliness', name: '2. ความตรงต่อเวลา', score: analytics.dimensions.timeliness },
    { key: 'quality', name: '3. คุณภาพและความคิดสร้างสรรค์', score: analytics.dimensions.quality },
    { key: 'attentiveness', name: '4. การประสานงานและความใส่ใจ', score: analytics.dimensions.attentiveness },
    { key: 'ownership', name: '5. ความรับผิดชอบในภาพรวม', score: analytics.dimensions.ownership }
  ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-2xs">
            <Star size={20} className="fill-white" />
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
              {title}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Overall satisfaction rate badge */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-2xl border border-amber-200/80 shadow-2xs self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">คะแนนเฉลี่ยรวมทีม</span>
            <span className="text-lg font-black font-mono text-amber-700 leading-none">
              {analytics.overallAverage}%
            </span>
          </div>
          <div className="h-7 w-[1px] bg-amber-200" />
          <div className="text-xs font-bold text-slate-700">
            {analytics.totalCompletedTasks} ชิ้นงานเสร็จ
          </div>
        </div>
      </div>

      {/* Main Grid: Left Donut, Right 5 Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart of Statuses */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-3xl border border-slate-200/80">
          <InteractiveDonutChart
            title="สัดส่วนแบบประเมินความพึงพอใจ"
            subtitle={`งานที่สำเร็จทั้งหมด ${analytics.totalCompletedTasks} ชิ้นงาน`}
            data={donutData}
            size={190}
            innerRadiusRatio={0.68}
            centerTitle="ตอบรับแล้ว"
            centerValue={`${analytics.responseRate}%`}
            showLegend={false}
          />

          {/* Clean, Orderly Cards for the 2 Statuses */}
          <div className="w-full grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-200/80">
            {/* Card 1: Completed */}
            <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  ทำแบบประเมินแล้ว
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                  {analytics.evaluatedCount} <span className="text-xs font-normal text-slate-400">งาน</span>
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {analytics.totalCompletedTasks > 0 ? Math.round((analytics.evaluatedCount / analytics.totalCompletedTasks) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Card 2: Sent */}
            <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  ส่งแบบประเมินแล้ว
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono pt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                  {analytics.sentCount} <span className="text-xs font-normal text-slate-400">งาน</span>
                </span>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {analytics.totalCompletedTasks > 0 ? Math.round((analytics.sentCount / analytics.totalCompletedTasks) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 5 Dimensions Rating Progress Bars */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              คะแนนเฉลี่ย 5 มิติ (เกณฑ์มาตรฐานเต็ม 5.0 ดาว)
            </span>
            <span className="text-[11px] text-slate-400 font-normal font-mono">
              *คิดจากงานที่ประเมินแล้วและเกณฑ์มาตรฐาน 85%
            </span>
          </div>

          <div className="space-y-2.5">
            {dimensionList.map(dim => {
              const pct = Math.min(100, Math.round((dim.score / 5.0) * 100));
              return (
                <div key={dim.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>{dim.name}</span>
                    <span className="font-mono font-bold text-amber-700">
                      {dim.score.toFixed(1)} / 5.0 <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Breakdown by Unit */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-600">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Users size={13} className="text-slate-400" /> แยกตามฝ่าย:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(analytics.byUnit).map(([unitKey, val]) => (
                <span key={unitKey} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                  <span className="capitalize">{unitKey}</span>: <strong className="font-mono text-amber-800">{val.average}%</strong> ({val.count} งาน)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Notice */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <span>*ข้อกำหนดระบบ: ชิ้นงานที่สำเร็จแล้วและยังรอการตอบกลับการประเมิน ระบบจะนำค่ามาตรฐานความพึงพอใจ 85.0% มาคำนวณให้อัตโนมัติ</span>
        <span className="text-emerald-700 font-medium">มาตรฐานความพึงพอใจองค์กร ≥ 85.0%</span>
      </div>
    </div>
  );
}
