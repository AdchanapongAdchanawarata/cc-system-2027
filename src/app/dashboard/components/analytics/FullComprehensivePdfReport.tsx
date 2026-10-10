"use client";

import React, { useMemo } from "react";
import { 
  Briefcase, PiggyBank, Target, Clock, Users, CheckCircle2, 
  AlertCircle, Sparkles, Award, TrendingUp, HeartHandshake,
  Check, Phone, Mail, ShieldAlert, Zap, Star, ShieldCheck, Activity
} from "lucide-react";
import { BriefTaskLike, MemberStats, getTaskFinancialDistribution, PersonShare } from "@/utils/stats";
import { 
  getBriefClientTeam, 
  getBriefCategory, 
  isTaskOverdue,
  computeTeamDemandStats,
  computeUnitCategoryFrequency,
  computeMemberIntelligenceProfile
} from "@/utils/teamAnalytics";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { 
  OKRSettingsState, 
  getStoredOKRSettings, 
  computeRealtimeMetrics, 
  computeSatisfactionAnalytics,
  RealtimeOKRSummary 
} from "@/utils/okrSettings";

interface Assignee {
  id: string;
  name: string;
  unit: string;
  is_active?: boolean;
}

interface OKR {
  id: string;
  type: string;
  unit?: string;
  description: string;
  target_value: string;
  is_active: boolean;
}

interface FullComprehensivePdfReportProps {
  briefs: BriefTaskLike[];
  assignees: Assignee[];
  memberStats: MemberStats[];
  okrs?: OKR[];
  okrSettings?: OKRSettingsState;
  unitStats: any[];
  orgTotals: {
    totalSaveCost: number;
    totalOwnerCost: number;
    totalAssistantCost: number;
    totalTasks: number;
    tasksWithAssistants: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    activeStaff: number;
  };
  onClose?: () => void;
}

export default function FullComprehensivePdfReport({
  briefs,
  assignees,
  memberStats,
  okrs,
  okrSettings,
  unitStats,
  orgTotals,
  onClose
}: FullComprehensivePdfReportProps) {
  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }, []);

  const currentMonthYearStr = useMemo(() => {
    return new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long"
    });
  }, []);

  // Operational staff count
  const opsCount = useMemo(() => {
    return assignees.filter(a => !(a.unit || '').includes('|executive')).length || 10;
  }, [assignees]);

  // Realtime OKRs, KRs, Rs and TIPs
  const activeOkrSettings = useMemo(() => okrSettings || getStoredOKRSettings(), [okrSettings]);
  const realtimeMetrics: RealtimeOKRSummary = useMemo(() => {
    return computeRealtimeMetrics(briefs, activeOkrSettings, opsCount, Math.max(opsCount, 11));
  }, [briefs, activeOkrSettings, opsCount]);

  // Satisfaction Analytics
  const satisfactionAnalytics = useMemo(() => computeSatisfactionAnalytics(briefs), [briefs]);

  // Demand Intelligence
  const demandStats = useMemo(() => computeTeamDemandStats(briefs), [briefs]);
  const categoryStats = useMemo(() => computeUnitCategoryFrequency(briefs, "All", 100), [briefs]);

  // Urgent Orders
  const urgentOrders = useMemo(() => {
    const valid = briefs.filter(b => b.status !== 'cancelled');
    const urgentTasks = valid.filter(b => {
      const raw = b as Record<string, any>;
      const p = String(raw.priority || b.details?.priority || '').toLowerCase();
      if (p === 'urgent' || p === 'high' || b.details?.is_urgent === true) return true;
      if (b.deadline && (b.created_at || b.in_progress_at)) {
        const start = new Date(b.created_at || b.in_progress_at || '').getTime();
        const end = new Date(b.deadline).getTime();
        const diffDays = (end - start) / (1000 * 3600 * 24);
        if (diffDays >= 0 && diffDays <= 3) return true;
      }
      return false;
    });

    const teamCount: Record<string, number> = {};
    const catCount: Record<string, number> = {};

    urgentTasks.forEach(t => {
      const tm = getBriefClientTeam(t);
      teamCount[tm.name] = (teamCount[tm.name] || 0) + 1;
      const cat = getBriefCategory(t);
      catCount[cat] = (catCount[cat] || 0) + 1;
    });

    return {
      totalUrgent: urgentTasks.length,
      urgentRate: valid.length > 0 ? Math.round((urgentTasks.length / valid.length) * 100) : 0,
      topTeams: Object.entries(teamCount).sort((a, b) => b[1] - a[1]),
      topCategories: Object.entries(catCount).sort((a, b) => b[1] - a[1])
    };
  }, [briefs]);

  // Overdue Tasks
  const overdueStats = useMemo(() => {
    const overdueTasks = briefs.filter(b => isTaskOverdue(b));
    const teamCount: Record<string, number> = {};
    overdueTasks.forEach(t => {
      const tm = getBriefClientTeam(t);
      teamCount[tm.name] = (teamCount[tm.name] || 0) + 1;
    });
    return {
      totalOverdue: overdueTasks.length,
      topTeams: Object.entries(teamCount).sort((a, b) => b[1] - a[1])
    };
  }, [briefs]);

  // Overall Synergy & On-Time
  const avgOnTimeRate = useMemo(() => {
    if (memberStats.length === 0) return 100;
    return Math.round(memberStats.reduce((acc, m) => acc + m.onTimeRate, 0) / memberStats.length);
  }, [memberStats]);

  const avgTurnaroundDays = useMemo(() => {
    if (unitStats.length === 0) return "3.5";
    return (unitStats.reduce((acc, u) => acc + u.avgDays, 0) / unitStats.length).toFixed(1);
  }, [unitStats]);

  const synergyRate = useMemo(() => {
    return orgTotals.totalTasks > 0
      ? Math.round((orgTotals.tasksWithAssistants / orgTotals.totalTasks) * 100)
      : 0;
  }, [orgTotals]);

  // Sorted Member Stats: 1. หัวหน้าทีม (จ๊อบ AA), 2. ผู้ช่วยหัวหน้าทีม (วา WK), 3. Creative, 4. Content, 5. PR
  const sortedMemberStats = useMemo(() => {
    const getRank = (m: MemberStats) => {
      const name = m.name || "";
      if (name.includes("จ๊อบ")) return 1;
      if (name.includes("วา")) return 2;
      const u = (m.unit || "").toLowerCase();
      if (u.includes("creative")) return 3;
      if (u.includes("content")) return 4;
      if (u.includes("pr")) return 5;
      return 6;
    };
    return [...memberStats].sort((a, b) => {
      const rankDiff = getRank(a) - getRank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name, "th");
    });
  }, [memberStats]);

  // Standard Minimal Header Helper Component
  const renderFormalHeader = (
    subfileMeta: string,
    subfileName: string,
    title: string,
    enTitle: string,
    subtitle: string,
    rightValue: string,
    rightSubtext: string,
    rightBadge: string
  ) => (
    <div className="border-b-2 border-slate-900 pb-2 mb-2 flex items-start justify-between">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            CC INSIGHTS • {subfileMeta}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] font-bold text-slate-600">
            {subfileName}
          </span>
        </div>
        <h2 className="text-base font-black text-slate-950 tracking-tight leading-tight">
          <div>{title}</div>
          {enTitle && (
            <div className="text-xs font-bold text-slate-600 tracking-normal mt-0.5">
              {enTitle}
            </div>
          )}
        </h2>
        <p className="text-[11px] text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-black text-slate-900 font-mono">
          {rightValue}
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          {rightSubtext}
        </div>
        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
          {rightBadge}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white text-slate-900 leading-normal printable-report print:m-0 print:p-0">
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COVER & SUMMARY (Page 1) */}
      {/* ========================================================================= */}
      <section className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-after break-after-page">
        <div className="space-y-2.5">
          {/* Formal Minimal Header */}
          <div className="border-b-2 border-slate-900 pb-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              CC INSIGHTS • OFFICIAL EXECUTIVE DOSSIER
            </span>
            <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
              <div>รายงานสรุปผลการดำเนินงานและการบริการฉบับสมบูรณ์</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5 tracking-normal">(Official Executive Dossier)</div>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่
            </p>
            <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-800 mt-2 pt-1 border-t border-slate-100">
              <span>ประจำเดือน {currentMonthYearStr}</span>
              <span>วันที่ออกเอกสาร: {currentDateStr}</span>
            </div>
          </div>

          {/* 4 Quadrants Executive Key Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  1. มูลค่าประหยัดให้องค์กร (Total Save Cost)
                </span>
                <span className="text-[8.5px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full">
                  ความคุ้มค่าสูงสุด
                </span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                ฿{orgTotals.totalSaveCost.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] text-emerald-800 font-medium flex justify-between border-t border-emerald-200/80 pt-1">
                <span>• งานหลัก (Owner): ฿{orgTotals.totalOwnerCost.toLocaleString()}</span>
                <span>• งานช่วยเกื้อกูล (Assist): ฿{orgTotals.totalAssistantCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-blue-50/90 border-2 border-blue-300 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">
                  2. ภาระงานทั้งหมด (Total Workload)
                </span>
                <span className="text-[8.5px] font-bold bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded-full">
                  {orgTotals.completedTasks} งานเสร็จสิ้น
                </span>
              </div>
              <div className="text-xl font-black font-mono text-blue-950 mt-0.5">
                {orgTotals.totalTasks} <span className="text-xs font-normal text-slate-600">งาน</span>
              </div>
              <div className="mt-1 text-[10px] text-blue-800 font-medium flex gap-3 border-t border-blue-200/80 pt-1">
                <span>• เสร็จสิ้น: {orgTotals.completedTasks}</span>
                <span>• กำลังทำ: {orgTotals.inProgressTasks}</span>
                <span>• รอทำ: {orgTotals.pendingTasks}</span>
              </div>
            </div>

            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  3. สุขภาวะการส่งมอบ (On-Time Delivery)
                </span>
                <span className="text-[8.5px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">
                  รอบเวลาเฉลี่ย {avgTurnaroundDays} วัน
                </span>
              </div>
              <div className="text-xl font-black font-mono text-amber-950 mt-0.5">
                {avgOnTimeRate}%
              </div>
              <div className="mt-1 text-[10px] text-amber-800 font-medium border-t border-amber-200/80 pt-1">
                อัตราส่งมอบงานตรงตามกำหนดเวลามาตรฐานระดับองค์กร
              </div>
            </div>

            <div className="bg-purple-50/90 border-2 border-purple-300 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider">
                  4. พลังความร่วมมือเกื้อกูล (Team Synergy)
                </span>
                <span className="text-[8.5px] font-bold bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-full">
                  Cross-Functional
                </span>
              </div>
              <div className="text-xl font-black font-mono text-purple-950 mt-0.5">
                {synergyRate}%
              </div>
              <div className="mt-1 text-[10px] text-purple-800 font-medium border-t border-purple-200/80 pt-1">
                งานที่มีการกระจายผู้ช่วยร่วมมือกัน ({orgTotals.tasksWithAssistants} จาก {orgTotals.totalTasks} งาน)
              </div>
            </div>
          </div>

          {/* Table of Contents - Executive Clear Hierarchy */}
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/80 space-y-1.5">
            <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>สารบัญ 5 รายงานย่อยต่อเนื่อง (Executive Report Table of Contents)</span>
              <span className="text-[9.5px] text-slate-400 font-normal">รวบรวมข้อมูลครบถ้วนทั้ง 5 หมวดหมู่</span>
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 font-medium">
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <span><strong>1. จำนวนงาน / มูลค่า:</strong> ภาระงานและมูลค่าความคุ้มค่า</span>
                <span className="font-bold text-slate-500 font-mono text-[10px]">หน้า 2</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <span><strong>2. KR/R , KPI/TIP:</strong> เป้าหมายยุทธศาสตร์และการบริการ</span>
                <span className="font-bold text-slate-500 font-mono text-[10px]">หน้า 3</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <span><strong>3. เวลา / สถานะงาน:</strong> ประสิทธิภาพและความเร็วการส่งมอบ</span>
                <span className="font-bold text-slate-500 font-mono text-[10px]">หน้า 4</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                <span><strong>4. รายงานรวมทีม:</strong> สังเคราะห์ภาพรวมและความร่วมมือ</span>
                <span className="font-bold text-slate-500 font-mono text-[10px]">หน้า 5</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between col-span-2">
                <span><strong>5. รายงานรายบุคคลแบบละเอียดทุกคน:</strong> ผลการปฏิบัติงานรายบุคคล 360 องศา ({sortedMemberStats.length} ท่าน: 1. หัวหน้า 2. ผู้ช่วย 3. Creative 4. Content 5. PR)</span>
                <span className="font-bold text-slate-500 font-mono text-[10px]">หน้า 6 เป็นต้นไป</span>
              </div>
            </div>
          </div>

          {/* Context Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] text-slate-600 flex items-center justify-between">
            <span>
              💡 <strong>เป้าหมายเอกสาร:</strong> รายงานฉบับนี้รวบรวมข้อมูลทุกมิติจากการปฏิบัติงานจริงของทีม CC ทั้ง 4 ยูนิต เพื่อใช้สนับสนุนการวางแผนเชิงกลยุทธ์และการจัดสรรกำลังคนของผู้บริหาร
            </span>
            <span className="font-mono font-bold text-slate-700 shrink-0 ml-2">
              รวม {5 + sortedMemberStats.length} หน้าสมบูรณ์
            </span>
          </div>
        </div>

        {/* Footer info on Page 1 */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</span>
          <span className="font-bold font-mono">หน้า 1 • สรุปภาพรวมสำหรับผู้บริหาร (Executive Cover)</span>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. FILE 1: WORKLOADS & SAVE COST (จำนวนงาน / มูลค่า) (Page 2) */}
      {/* ========================================================================= */}
      <section className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-before break-before-page">
        <div className="space-y-2">
          {renderFormalHeader(
            "ไฟล์ย่อยที่ 1 จาก 5",
            "จำนวนงาน / มูลค่า",
            "รายงานสรุปจำนวนงานและมูลค่าความคุ้มค่า",
            "(Workloads & Save Cost)",
            "สรุปสถิติภาระงานเชิงปริมาณ มูลค่าประหยัดงบประมาณ In-House และการวิเคราะห์ความต้องการสั่งงาน",
            `฿${orgTotals.totalSaveCost.toLocaleString()}`,
            "Save Cost สะสมรวม",
            "ความคุ้มค่าสูงสุด"
          )}

          {/* 1.1 Top KPI Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-xl border border-slate-200 bg-emerald-50/60">
              <span className="text-[9.5px] uppercase font-bold text-emerald-800">Save Cost รวม</span>
              <div className="text-sm font-black font-mono text-emerald-950 mt-0.5">
                ฿{orgTotals.totalSaveCost.toLocaleString()}
              </div>
              <span className="text-[8.5px] text-emerald-700">ประหยัดงบประมาณองค์กร</span>
            </div>
            <div className="p-2 rounded-xl border border-slate-200 bg-blue-50/60">
              <span className="text-[9.5px] uppercase font-bold text-blue-800">งานหลัก (Owner)</span>
              <div className="text-sm font-black font-mono text-blue-950 mt-0.5">
                ฿{orgTotals.totalOwnerCost.toLocaleString()}
              </div>
              <span className="text-[8.5px] text-blue-700">สัดส่วนเจ้าของงานหลัก</span>
            </div>
            <div className="p-2 rounded-xl border border-slate-200 bg-amber-50/60">
              <span className="text-[9.5px] uppercase font-bold text-amber-800">งานช่วย (Assistant)</span>
              <div className="text-sm font-black font-mono text-amber-950 mt-0.5">
                ฿{orgTotals.totalAssistantCost.toLocaleString()}
              </div>
              <span className="text-[8.5px] text-amber-700">เกื้อกูลแบ่งเบาภาระ</span>
            </div>
            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/80">
              <span className="text-[9.5px] uppercase font-bold text-slate-700">ภาระงานทั้งหมด</span>
              <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                {orgTotals.totalTasks} งาน
              </div>
              <span className="text-[8.5px] text-slate-500">เสร็จ {orgTotals.completedTasks} | ทำ {orgTotals.inProgressTasks} | รอ {orgTotals.pendingTasks}</span>
            </div>
          </div>

          {/* 1.2 Unit Breakdown Table */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>1.1 สรุปผลงานและมูลค่า Save Cost แยกตามยูนิต (Unit Performance)</span>
              <span className="text-[9.5px] font-normal text-slate-400">ครบทั้ง 4 ยูนิต</span>
            </h3>
            <table className="w-full text-[10.5px] text-left border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-1 px-2">ยูนิต (Unit)</th>
                  <th className="py-1 px-2 text-center">สมาชิก</th>
                  <th className="py-1 px-2 text-center">งานรวม</th>
                  <th className="py-1 px-2 text-right">Save Cost งานหลัก</th>
                  <th className="py-1 px-2 text-right">Save Cost งานช่วย</th>
                  <th className="py-1 px-2 text-right">Save Cost รวม</th>
                  <th className="py-1 px-2 text-center">ส่งตรงเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unitStats.map((u, i) => (
                  <tr key={u.unit} className={i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="py-1 px-2 font-bold text-slate-900">{u.unitLabel}</td>
                    <td className="py-1 px-2 text-center text-slate-600">{u.memberCount} ท่าน</td>
                    <td className="py-1 px-2 text-center font-semibold text-slate-900">{u.totalTasks} งาน</td>
                    <td className="py-1 px-2 text-right font-mono text-slate-700">฿{u.ownerSaveCost.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right font-mono text-slate-700">฿{u.assistantSaveCost.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-700">฿{u.totalSaveCost.toLocaleString()}</td>
                    <td className="py-1 px-2 text-center">
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {u.onTimeRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 1.3 All Members Workload Table (ครบทุกคน) */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>1.2 ตารางสรุปภาระงานและมูลค่ารายบุคคลของสมาชิกทุกคน (All Members Workload)</span>
              <span className="text-[9.5px] font-normal text-slate-400">{sortedMemberStats.length} ท่าน (ครบทุกคน)</span>
            </h3>
            <table className="w-full text-[10px] text-left border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-0.5 px-1.5 w-7 text-center">#</th>
                  <th className="py-0.5 px-1.5">ชื่อสมาชิก</th>
                  <th className="py-0.5 px-1.5">ยูนิต</th>
                  <th className="py-0.5 px-1.5 text-center">งานหลัก</th>
                  <th className="py-0.5 px-1.5 text-center">งานช่วย</th>
                  <th className="py-0.5 px-1.5 text-center">รวมงาน</th>
                  <th className="py-0.5 px-1.5 text-right">Save Cost รวม</th>
                  <th className="py-0.5 px-1.5 text-center">ตรงเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedMemberStats.map((m, i) => (
                  <tr key={m.assignee_id} className={i % 2 === 1 ? "bg-slate-50/40" : "bg-white"}>
                    <td className="py-0.5 px-1.5 text-center font-mono text-slate-400 text-[9.5px]">{i + 1}</td>
                    <td className="py-0.5 px-1.5 font-bold text-slate-900">{m.name}</td>
                    <td className="py-0.5 px-1.5 text-slate-600 text-[9.5px]">{m.unit} Unit</td>
                    <td className="py-0.5 px-1.5 text-center font-mono text-slate-700">{m.ownerTaskCount}</td>
                    <td className="py-0.5 px-1.5 text-center font-mono text-amber-700 font-semibold">{m.assistantTaskCount}</td>
                    <td className="py-0.5 px-1.5 text-center font-mono font-bold text-slate-900">{m.totalTasksInvolved}</td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-700">฿{m.totalSaveCost.toLocaleString()}</td>
                    <td className="py-0.5 px-1.5 text-center font-mono text-[9.5px] font-semibold text-slate-700">{m.onTimeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 1.4 ALL Demanding Clients & Urgent Briefs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block mb-1">
                ฝ่าย/ศูนย์ที่ส่งงานเข้ามา (Client Teams Demand - ครบทุกฝ่าย/ศูนย์)
              </span>
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 text-[9.5px] text-slate-700">
                {demandStats.map((team, idx) => (
                  <div key={team.teamKey || idx} className="py-0.5 flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="truncate pr-1 font-medium">{idx + 1}. {team.teamName}</span>
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                      <span className="font-bold text-slate-900">{team.count} งาน</span>
                      <span className="text-emerald-700 font-bold">฿{team.totalSaveCost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {demandStats.length === 0 && (
                  <div className="col-span-2 text-slate-400 py-1 text-center">ไม่มีข้อมูลการสั่งงาน</div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                สรุปความต้องการงานด่วน (Urgent Orders Analysis)
              </span>
              <div className="space-y-1 text-[10px] text-slate-700">
                <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="text-slate-600 font-medium">สัดส่วนงานด่วนทั้งสิ้น:</span>
                  <span className="font-mono font-black text-rose-700">{urgentOrders.totalUrgent} งาน ({urgentOrders.urgentRate}%)</span>
                </div>
                <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="text-slate-600 font-medium">ฝ่ายที่ส่งงานด่วน:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">
                    {urgentOrders.topTeams.length > 0 
                      ? urgentOrders.topTeams.map(([name, count]) => `${name} (${count})`).join(", ") 
                      : "-"}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 leading-tight pt-0.5">
                  🛡️ <strong>ข้อแนะนำ:</strong> ควรจัดสรรคลังสื่อและ Artwork สำเร็จรูปร่วมกับฝ่ายดังกล่าวเพื่อช่วยลดรอบเวลาจัดทำ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info on Page 2 */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</span>
          <span className="font-bold font-mono">หน้า 2 • ไฟล์ย่อยที่ 1: จำนวนงาน / มูลค่า</span>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. FILE 2: STRATEGIC GOALS (KR/R & KPI/TIP) (Page 3) */}
      {/* ========================================================================= */}
      <section className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-before break-before-page">
        <div className="space-y-2">
          {renderFormalHeader(
            "ไฟล์ย่อยที่ 2 จาก 5",
            "KR/R , KPI/TIP",
            "รายงานสรุปตัวชี้วัดความสำเร็จ",
            "(Strategic Goals: KR/R & KPI/TIP)",
            "ประมวลผลความคืบหน้าจริงจากบรีฟงาน สัมพันธ์กับงานภายใน ภายนอก มูลค่าการรับรู้ กำไร และคะแนนความพึงพอใจ",
            `KR ${realtimeMetrics.overallKRScore}% | TIP ${realtimeMetrics.overallTIPScore}%`,
            "เฉลี่ยความสำเร็จรวม",
            "Strategic Alignment"
          )}

          {/* 2.1 KPI Overview Ribbon */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-blue-50/70 border border-blue-200 p-1.5 rounded-xl">
              <span className="text-[9.5px] text-blue-700 font-bold uppercase block">KR ความสำเร็จรวม</span>
              <div className="text-sm font-mono font-black text-blue-900 mt-0.5">{realtimeMetrics.overallKRScore}%</div>
              <span className="text-[8.5px] text-blue-600">เฉลี่ย 4 KR หลัก</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 p-1.5 rounded-xl">
              <span className="text-[9.5px] text-amber-700 font-bold uppercase block">TIP ความสำเร็จรวม</span>
              <div className="text-sm font-mono font-black text-amber-900 mt-0.5">{realtimeMetrics.overallTIPScore}%</div>
              <span className="text-[8.5px] text-amber-600">ยุทธศาสตร์ & นวัตกรรม</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 p-1.5 rounded-xl">
              <span className="text-[9.5px] text-emerald-700 font-bold uppercase block">ความพึงพอใจเฉลี่ย</span>
              <div className="text-sm font-mono font-black text-emerald-900 mt-0.5">{realtimeMetrics.averageSatisfactionRate}%</div>
              <span className="text-[8.5px] text-emerald-600">ประเมินแล้ว {realtimeMetrics.totalEvaluatedBriefs} งาน</span>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-200 p-1.5 rounded-xl">
              <span className="text-[9.5px] text-indigo-700 font-bold uppercase block">กำไร PM รวม (R7+R8)</span>
              <div className="text-sm font-mono font-black text-indigo-900 mt-0.5 truncate">
                ฿{(realtimeMetrics.totalProfitGov + realtimeMetrics.totalProfitPrivate).toLocaleString()}
              </div>
              <span className="text-[8.5px] text-indigo-600">รัฐ + เอกชน</span>
            </div>
          </div>

          {/* 2.2 ALL KR & R METRICS (ครบทั้ง 4 กลุ่ม และ 9 R) */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>2.1 ตัวชี้วัดผลงานหลักของทีม (Key Results: KR1 – KR4 & R1 – R9 ครบทุกตัว)</span>
              <span className="text-[9.5px] font-normal text-slate-400">คำนวณจากผลงานจริงตามขนาดทีม</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {realtimeMetrics.krs.map((krResult) => {
                const { kr, actualAchieved, activeTarget, percentage, rResults } = krResult;
                return (
                  <div key={kr.code} className="border border-slate-200 bg-white rounded-xl p-2 shadow-2xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-white font-mono font-black text-[9.5px]">
                            {kr.code}
                          </span>
                          <h4 className="text-[11px] font-bold text-slate-900 truncate">
                            {kr.name}
                          </h4>
                        </div>
                      </div>
                      <span className={`text-[9.5px] font-mono font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                        percentage >= 80 ? "bg-emerald-100 text-emerald-800" : percentage >= 40 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {percentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase block font-sans">ผลงานจริง</span>
                        <strong className="text-slate-900 font-bold">
                          {kr.isCurrency ? `฿${actualAchieved.toLocaleString()}` : `${actualAchieved.toLocaleString()} ${kr.unit}`}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] text-emerald-700 uppercase block font-sans">เป้าหมาย</span>
                        <strong className="text-emerald-700 font-bold">
                          {kr.isCurrency ? `฿${activeTarget.toLocaleString()}` : `${activeTarget.toLocaleString()} ${kr.unit}`}
                        </strong>
                      </div>
                    </div>

                    {/* Nested R Metrics Table */}
                    <div className="space-y-0.5">
                      {rResults.map((r) => (
                        <div key={r.code} className="flex items-center justify-between text-[10px] px-1.5 py-0.5 bg-slate-50/70 rounded border border-slate-100">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            <span className="font-mono font-bold text-[9.5px] text-indigo-900">{r.code}:</span>
                            <span className="text-slate-700 truncate">{r.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                            <span className="text-slate-500">
                              {r.isCurrency ? `฿${r.actual.toLocaleString()}` : r.isPercentage ? `${r.actual}%` : `${r.actual.toLocaleString()} ${r.unit}`}
                            </span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-700 font-bold">
                              {r.isCurrency ? `฿${r.activeTarget.toLocaleString()}` : r.isPercentage ? `${r.activeTarget}%` : `${r.activeTarget.toLocaleString()}`}
                            </span>
                            <span className={`px-0.5 rounded font-bold ${r.percentage >= 80 ? "text-emerald-700" : "text-amber-700"}`}>
                              ({r.percentage}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2.3 ALL KPI / TIP METRICS (ครบทั้ง 4 ตัว TIP1, TIP2, TIP9, TIP10) */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>2.2 ตัวชี้วัดยุทธศาสตร์องค์กรและการบริการ (KPI & TIP Metrics ครบทุกตัว)</span>
              <span className="text-[9.5px] font-normal text-slate-400">TIP1, TIP2, TIP9, TIP10</span>
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {realtimeMetrics.tips.map(({ tip, actual, activeTarget, percentage }) => (
                <div key={tip.code} className="border border-slate-200 bg-white p-2 rounded-xl shadow-2xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[10px] text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                      {tip.code}
                    </span>
                    <span className={`text-[9.5px] font-mono font-black ${percentage >= 80 ? "text-emerald-700" : "text-amber-700"}`}>
                      {percentage}%
                    </span>
                  </div>
                  <h5 className="text-[10.5px] font-bold text-slate-900 leading-tight">
                    {tip.name}
                  </h5>
                  <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                    {tip.description}
                  </p>
                  <div className="pt-0.5 border-t border-slate-100 flex justify-between text-[9.5px] font-mono">
                    <span className="text-slate-600">
                      {tip.isCurrency ? `฿${actual.toLocaleString()}` : `${actual}%`}
                    </span>
                    <span className="text-slate-400 font-normal">
                      เป้า: {tip.isCurrency ? `฿${activeTarget.toLocaleString()}` : `${activeTarget}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2.4 Satisfaction Survey 5 Dimensions */}
          <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">
              ผลการประเมินความพึงพอใจ 5 มิติ (Satisfaction Survey 5 Dimensions)
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">1. ความถูกต้องสมบูรณ์</span>
                <span className="font-mono font-black text-slate-900 text-xs">{satisfactionAnalytics.dimensions.accuracy.toFixed(1)}/5</span>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">2. ความตรงต่อเวลา</span>
                <span className="font-mono font-black text-slate-900 text-xs">{satisfactionAnalytics.dimensions.timeliness.toFixed(1)}/5</span>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">3. คุณภาพตรงบรีฟ</span>
                <span className="font-mono font-black text-slate-900 text-xs">{satisfactionAnalytics.dimensions.quality.toFixed(1)}/5</span>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">4. มนุษยสัมพันธ์ดี</span>
                <span className="font-mono font-black text-slate-900 text-xs">{satisfactionAnalytics.dimensions.attentiveness.toFixed(1)}/5</span>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">5. ความเป็นเจ้าของงาน</span>
                <span className="font-mono font-black text-slate-900 text-xs">{satisfactionAnalytics.dimensions.ownership.toFixed(1)}/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info on Page 3 */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</span>
          <span className="font-bold font-mono">หน้า 3 • ไฟล์ย่อยที่ 2: KR/R , KPI/TIP</span>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. FILE 3: TIME, VELOCITY & STATUS (เวลา / สถานะงาน) (Page 4) */}
      {/* ========================================================================= */}
      <section className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-before break-before-page">
        <div className="space-y-2">
          {renderFormalHeader(
            "ไฟล์ย่อยที่ 3 จาก 5",
            "เวลา / สถานะงาน",
            "รายงานสรุปเวลาและประสิทธิภาพการส่งมอบงาน",
            "(Time, Velocity & Reliability)",
            "วิเคราะห์รอบเวลาจัดทำ (Turnaround Days), อัตราการส่งตรงตามกำหนด (On-Time Rate) และการกระจายงาน",
            `เฉลี่ย ${avgTurnaroundDays} วัน | ตรงเวลา ${avgOnTimeRate}%`,
            "เกณฑ์เวลามาตรฐาน",
            "Velocity & Health"
          )}

          {/* 3.1 Velocity KPI Cards */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-[9.5px] uppercase font-bold text-slate-500">ระยะเวลาจัดทำเฉลี่ย</span>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                {avgTurnaroundDays} วัน
              </div>
              <span className="text-[8.5px] text-slate-500">ต่อ 1 ชิ้นงาน</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
              <span className="text-[9.5px] uppercase font-bold text-emerald-700">ส่งมอบตรงเวลา</span>
              <div className="text-base font-black text-emerald-950 mt-0.5 font-mono">
                {avgOnTimeRate}%
              </div>
              <span className="text-[8.5px] text-emerald-700 font-bold">มาตรฐาน On-Time</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
              <span className="text-[9.5px] uppercase font-bold text-blue-700">งานเสร็จสิ้นสะสม</span>
              <div className="text-base font-black text-blue-900 mt-0.5 font-mono">
                {orgTotals.completedTasks} งาน
              </div>
              <span className="text-[8.5px] text-blue-700">ส่งมอบสมบูรณ์</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
              <span className="text-[9.5px] uppercase font-bold text-amber-700">งานอยู่ระหว่างทำ</span>
              <div className="text-base font-black text-amber-900 mt-0.5 font-mono">
                {orgTotals.inProgressTasks} งาน
              </div>
              <span className="text-[8.5px] text-amber-700">รอทำ {orgTotals.pendingTasks} งาน</span>
            </div>
          </div>

          {/* 3.2 Unit Turnaround & Status Breakdown */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>3.1 สถานะงานและความเร็วการส่งมอบรายยูนิต (Turnaround & Status by Unit)</span>
              <span className="text-[9.5px] font-normal text-slate-400">ครบทุกยูนิต</span>
            </h3>
            <table className="w-full text-[10.5px] text-left border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-1 px-2">ยูนิต</th>
                  <th className="py-1 px-2 text-center">เสร็จสิ้นแล้ว</th>
                  <th className="py-1 px-2 text-center">กำลังดำเนินงาน</th>
                  <th className="py-1 px-2 text-center">รอทำ</th>
                  <th className="py-1 px-2 text-center">ระยะเวลาเฉลี่ย (วัน)</th>
                  <th className="py-1 px-2 text-center">ส่งตรงเวลา (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unitStats.map((u, i) => (
                  <tr key={u.unit} className={i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="py-1 px-2 font-bold text-slate-900">{u.unitLabel}</td>
                    <td className="py-1 px-2 text-center font-semibold text-emerald-700 font-mono">{u.completedTasks} งาน</td>
                    <td className="py-1 px-2 text-center font-semibold text-blue-700 font-mono">{u.inProgressTasks} งาน</td>
                    <td className="py-1 px-2 text-center font-semibold text-amber-700 font-mono">{u.pendingTasks} งาน</td>
                    <td className="py-1 px-2 text-center font-mono font-bold text-slate-900">{u.avgDays} วัน</td>
                    <td className="py-1 px-2 text-center font-mono font-bold text-emerald-700">{u.onTimeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3.3 All Members Time & Speed Ranking (ครบทุกคน) */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
              <span>3.2 ตารางจัดอันดับความเร็วและอัตราส่งตรงเวลาของสมาชิกทุกคน (All Members Time & Speed)</span>
              <span className="text-[9.5px] font-normal text-slate-400">{sortedMemberStats.length} ท่าน (ครบทุกคน)</span>
            </h3>
            <table className="w-full text-[10px] text-left border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-0.5 px-1.5 w-7 text-center">#</th>
                  <th className="py-0.5 px-1.5">ชื่อสมาชิก</th>
                  <th className="py-0.5 px-1.5">ยูนิต</th>
                  <th className="py-0.5 px-1.5 text-center">งานเสร็จ</th>
                  <th className="py-0.5 px-1.5 text-center">เวลาเฉลี่ย (วัน)</th>
                  <th className="py-0.5 px-1.5 text-center">ส่งตรงเวลา (%)</th>
                  <th className="py-0.5 px-1.5 text-center">งานค้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedMemberStats.map((m, i) => (
                  <tr key={m.assignee_id} className={i % 2 === 1 ? "bg-slate-50/40" : "bg-white"}>
                    <td className="py-0.5 px-1.5 text-center font-mono text-slate-400 text-[9.5px]">{i + 1}</td>
                    <td className="py-0.5 px-1.5 font-bold text-slate-900">{m.name}</td>
                    <td className="py-0.5 px-1.5 text-slate-600 text-[9.5px]">{m.unit} Unit</td>
                    <td className="py-0.5 px-1.5 text-center font-mono text-emerald-700 font-semibold">{m.completedTasks} งาน</td>
                    <td className="py-0.5 px-1.5 text-center font-mono font-bold text-slate-900">{m.avgTurnaroundDays} วัน</td>
                    <td className="py-0.5 px-1.5 text-center font-mono font-bold text-emerald-700">{m.onTimeRate}%</td>
                    <td className="py-0.5 px-1.5 text-center font-mono text-[9.5px]">
                      {m.overdueTasksCount > 0 ? (
                        <span className="text-rose-600 font-bold">{m.overdueTasksCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3.4 Production Categories & Overdue Watch */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block mb-1">
                ประเภทสื่อและรอบเวลาผลิต (Production Categories - ครบทุกประเภทสื่อ)
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px]">
                {categoryStats.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <span className="truncate pr-1 font-medium">{cat.category}</span>
                    <span className="font-mono text-[9px] text-slate-900 shrink-0 font-bold">{cat.count} งาน ({cat.percentage}%)</span>
                  </div>
                ))}
                {categoryStats.length === 0 && (
                  <div className="col-span-2 text-slate-400 py-1 text-center">ไม่มีข้อมูลประเภทงาน</div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                การบริหารงานคั่งค้างและความเสี่ยง (Workflow Health)
              </span>
              <div className="space-y-1 text-[10px] text-slate-700">
                <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="text-slate-600 font-medium">งานเกินกำหนดส่ง (Overdue):</span>
                  <span className="font-mono font-bold text-rose-700">{overdueStats.totalOverdue} งาน</span>
                </div>
                {overdueStats.topTeams.length > 0 && (
                  <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                    <span className="text-slate-600 font-medium">ฝ่ายที่มีงานเกินกำหนด:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">
                      {overdueStats.topTeams.map(([name, count]) => `${name} (${count})`).join(", ")}
                    </span>
                  </div>
                )}
                <p className="text-[9px] text-slate-500 leading-tight pt-0.5">
                  ⏱️ <strong>การควบคุมรอบเวลา:</strong> ชิ้นงานส่วนใหญ่ส่งมอบได้ตรงเวลา {avgOnTimeRate}% สำหรับงานที่สถานะรอนานเกิน 5 วัน ระบบมีกลไกแจ้งเตือนไปยังผู้ช่วยหัวหน้าทีมเพื่อติดตามและเติมกำลังคน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info on Page 4 */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</span>
          <span className="font-bold font-mono">หน้า 4 • ไฟล์ย่อยที่ 3: เวลา / สถานะงาน</span>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. FILE 4: TEAM SYNTHESIS (รายงานรวมทีม) (Page 5) */}
      {/* ========================================================================= */}
      <section className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-before break-before-page">
        <div className="space-y-2">
          {renderFormalHeader(
            "ไฟล์ย่อยที่ 4 จาก 5",
            "รายงานรวมทีม",
            "รายงานสรุปภาพรวมทีมและการสังเคราะห์การทำงาน",
            "(Team Synthesis)",
            "บทวิเคราะห์บรรยากาศการทำงาน การเกื้อกูลร่วมใจ และการยกย่องสมาชิกผู้สร้างคุณค่าในมิติต่างๆ",
            `ความร่วมมือ ${synergyRate}%`,
            `งานช่วย ${orgTotals.tasksWithAssistants} งาน`,
            "Team Synergy"
          )}

          {/* 4.1 Recognition Champions */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1">
              4.1 ชื่นชมและส่งต่อคำขอบคุณ (ขอบคุณคนเก่ง & เพื่อนช่วยเพื่อนในทีม)
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-black uppercase text-rose-700 tracking-wider">
                  #ลมใต้ปีก • Support Champions
                </span>
                <p className="text-[10px] text-rose-950 font-bold mt-0.5">
                  ช่วยเหลืองานเพื่อนมากที่สุด
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-700">
                  {memberStats
                    .sort((a, b) => b.assistantTaskCount - a.assistantTaskCount)
                    .slice(0, 3)
                    .map((m, i) => (
                      <li key={m.assignee_id} className="flex justify-between font-medium">
                        <span>{i + 1}. {m.name} ({m.unit})</span>
                        <span className="font-bold text-rose-700 font-mono">{m.assistantTaskCount} งาน</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-black uppercase text-emerald-700 tracking-wider">
                  #ส่งมอบเป๊ะ • On-Time Champions
                </span>
                <p className="text-[10px] text-emerald-950 font-bold mt-0.5">
                  ส่งมอบตรงเวลา 100%
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-700">
                  {memberStats
                    .filter(m => m.onTimeRate === 100 && m.completedTasks > 0)
                    .sort((a, b) => b.completedTasks - a.completedTasks)
                    .slice(0, 3)
                    .map((m, i) => (
                      <li key={m.assignee_id} className="flex justify-between font-medium">
                        <span>{i + 1}. {m.name} ({m.unit})</span>
                        <span className="font-bold text-emerald-700 font-mono">{m.completedTasks} งาน</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-black uppercase text-amber-700 tracking-wider">
                  #สร้างสรรค์คุ้มค่า • Value Creators
                </span>
                <p className="text-[10px] text-amber-950 font-bold mt-0.5">
                  Save Cost รวมสูงสุด
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-700">
                  {memberStats
                    .sort((a, b) => b.totalSaveCost - a.totalSaveCost)
                    .slice(0, 3)
                    .map((m, i) => (
                      <li key={m.assignee_id} className="flex justify-between font-medium">
                        <span>{i + 1}. {m.name} ({m.unit})</span>
                        <span className="font-bold text-amber-800 font-mono">฿{m.totalSaveCost.toLocaleString()}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4.2 4-Dimension Development Matrix */}
          <div>
            <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1">
              4.2 ชวนคุย 4 มุมมองเพื่อทีมที่ดีขึ้น (4 Dimensions to Solve & Grow)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border border-slate-200 bg-slate-50/80 p-2.5 rounded-xl space-y-0.5">
                <div className="font-bold text-slate-900 text-[10.5px]">1. ช่วยกันเกลี่ยงานให้สมดุล (จาก: แท็บจำนวนงาน / มูลค่า)</div>
                <p className="text-slate-600 leading-relaxed text-[10px]">
                  💡 <strong>สิ่งที่เห็นในทีม:</strong> มีการร่วมมือกระจายงานช่วยเหลือสูงถึง {synergyRate}%<br />
                  🌱 <strong>ชวนทำด้วยกัน:</strong> งานมูลค่าสูงและซับซ้อน ให้กระจายผู้ช่วยตั้งแต่ขั้นตอนรับบรีฟ เพื่อป้องกันภาระงานสะสม
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50/80 p-2.5 rounded-xl space-y-0.5">
                <div className="font-bold text-slate-900 text-[10.5px]">2. ร่วมมือทำตามเป้าหมาย (จาก: แท็บ KR/R , KPI/TIP)</div>
                <p className="text-slate-600 leading-relaxed text-[10px]">
                  🎯 <strong>สิ่งที่เห็นในทีม:</strong> งานส่วนใหญ่เชื่อมโยงกับ KR บริการและ TIP มูลค่าธุรกิจอย่างเด่นชัด<br />
                  🚀 <strong>ชวนทำด้วยกัน:</strong> สื่อสารให้สมาชิกเห็นคุณค่าของงานประจำวันว่าขับเคลื่อนความสำเร็จองค์กรในส่วนใด
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50/80 p-2.5 rounded-xl space-y-0.5">
                <div className="font-bold text-slate-900 text-[10.5px]">3. จังหวะการทำงานและการส่งมอบ (จาก: แท็บเวลา / สถานะงาน)</div>
                <p className="text-slate-600 leading-relaxed text-[10px]">
                  ⏱️ <strong>สิ่งที่เห็นในทีม:</strong> ส่งมอบตรงเวลา {avgOnTimeRate}% ด้วยระยะเวลาเฉลี่ย {avgTurnaroundDays} วัน<br />
                  💙 <strong>แนวทางดูแลกัน:</strong> หากงานใดเริ่มค้างเกิน 5 วัน ให้เพื่อนหรือหัวหน้ายูนิตร่วมประสานสอบถามเพื่อคลี่คลายข้อติดขัด
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50/80 p-2.5 rounded-xl space-y-0.5">
                <div className="font-bold text-slate-900 text-[10.5px]">4. จุดเด่นและพลังเสริมกัน (จาก: แท็บรายงานรายบุคคล)</div>
                <p className="text-slate-600 leading-relaxed text-[10px]">
                  🌟 <strong>สิ่งที่เห็นในทีม:</strong> สมาชิกทุกคนมีความเชี่ยวชาญเฉพาะตัวที่เกื้อกูลกันรอบด้าน<br />
                  🤝 <strong>ชวนทำด้วยกัน:</strong> สนับสนุนการแลกเปลี่ยนเทคนิคแบบไม่เป็นทางการสัปดาห์ละ 15 นาที เพื่อต่อยอดทักษะร่วมกัน
                </p>
              </div>
            </div>
          </div>

          {/* 4.3 Unit Care & Action Steps */}
          <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-2.5 space-y-1">
            <h4 className="text-[10.5px] font-black uppercase text-indigo-950">
              4.3 แนวทางการสนับสนุนของแต่ละยูนิต (Creative, Content, PR & Internal)
            </h4>
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                <strong className="text-indigo-900 block mb-0.5">Creative Unit:</strong>
                เกลี่ยงาน Artwork ขนาดใหญ่ และจัดระบบคิวงานล่วงหน้า 3 วันทำการ
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                <strong className="text-indigo-900 block mb-0.5">Content Unit:</strong>
                เตรียมข้อมูลดิบและบทสัมภาษณ์ล่วงหน้า เพื่อให้งานเขียนรวดเร็วตรงประเด็น
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                <strong className="text-indigo-900 block mb-0.5">PR Unit:</strong>
                ประสานงานคิวสื่อและกำหนดเวลาเผยแพร่ที่สอดคล้องกับแคมเปญอุทยานฯ
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                <strong className="text-indigo-900 block mb-0.5">Internal Unit:</strong>
                ติดตามและประสานงานข้อมูลระบบภายในให้ทุกยูนิตทำงานได้ต่อเนื่องราบรื่น
              </div>
            </div>
          </div>
        </div>

        {/* Footer info on Page 5 */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
          <span>Creative and Communication (ทีมสร้างสรรค์และการสื่อสาร - CC) | อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</span>
          <span className="font-bold font-mono">หน้า 5 • ไฟล์ย่อยที่ 4: รายงานรวมทีม</span>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. FILE 5: INDIVIDUAL REPORTS (รายงานรายบุคคลแบบละเอียดทุกคน) (Pages 6+) */}
      {/* ========================================================================= */}
      {sortedMemberStats.map((member, mIdx) => {
        const meta = DEFAULT_MEMBER_METADATA[member.name] || {
          fullName: member.name,
          position: "พนักงานทีมสื่อสารองค์กร (CC Specialist)",
          phone: "-"
        };

        const intel = computeMemberIntelligenceProfile(briefs, member.assignee_id, assignees);
        const memberTasks = briefs.filter(b => {
          const { ownerShare, assistantShares } = getTaskFinancialDistribution(b);
          return ownerShare?.assignee_id === member.assignee_id || 
                 assistantShares.some(a => a.assignee_id === member.assignee_id);
        });

        return (
          <section 
            key={member.assignee_id}
            className="flex flex-col justify-between p-4 md:p-6 print:p-0 border-b-2 border-slate-300 print:border-none print:min-h-0 page-break-before break-before-page"
          >
            <div className="space-y-2">
              {/* Member Report Formal Minimal Header */}
              <div className="border-b-2 border-slate-900 pb-2 mb-1.5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      CC INSIGHTS • ไฟล์ย่อยที่ 5 จาก 5
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-600">
                      รายงานรายบุคคลแบบละเอียดทุกคน ({mIdx + 1}/{sortedMemberStats.length})
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                    <div>{meta.fullName}</div>
                    <div className="text-xs font-bold text-slate-600 tracking-normal mt-0.5">
                      ({member.name} • 360° Individual Assessment)
                    </div>
                  </h2>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                    ตำแหน่ง: {meta.position} • ยูนิต: {member.unit} Unit • เบอร์โทร: {meta.phone}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-emerald-700">
                    ฿{member.totalSaveCost.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Save Cost รวมสะสม
                  </div>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-900 text-white">
                    Individual 360 Report
                  </span>
                </div>
              </div>

              {/* 4 Key Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">งานหลัก (Owner)</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {member.ownerTaskCount} งาน
                  </div>
                  <span className="text-[8.5px] text-emerald-700 font-mono font-bold">฿{member.ownerSaveCost.toLocaleString()}</span>
                </div>

                <div className="p-2 rounded-xl border border-slate-200 bg-amber-50/60">
                  <span className="text-[9.5px] uppercase font-bold text-amber-800">งานช่วย (Assistant)</span>
                  <div className="text-sm font-black text-amber-900 mt-0.5 font-mono">
                    {member.assistantTaskCount} งาน
                  </div>
                  <span className="text-[8.5px] text-amber-700 font-mono font-bold">฿{member.assistantSaveCost.toLocaleString()}</span>
                </div>

                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">รอบเวลาเฉลี่ย</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {member.avgTurnaroundDays} วัน
                  </div>
                  <span className="text-[8.5px] text-slate-500">ความเร็วในการส่งมอบ</span>
                </div>

                <div className="p-2 rounded-xl border border-slate-200 bg-emerald-50/60">
                  <span className="text-[9.5px] uppercase font-bold text-emerald-800">ส่งตรงเวลา</span>
                  <div className="text-sm font-black text-emerald-900 mt-0.5 font-mono">
                    {member.onTimeRate}%
                  </div>
                  <span className="text-[8.5px] text-emerald-700">มาตรฐานคุณภาพงาน</span>
                </div>
              </div>

              {/* Specialization & Top Categories */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2 space-y-1">
                  <span className="text-[9.5px] font-black uppercase text-slate-700 tracking-wider block">
                    จุดเด่นและความเชี่ยวชาญเฉพาะบุคคล
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {intel.topSpecializations.map((spec, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-[9.5px] font-bold text-slate-800">
                        {spec.category} ({spec.count} งาน)
                      </span>
                    ))}
                    {intel.topSpecializations.length === 0 && (
                      <span className="text-[9.5px] text-slate-400">พนักงานผู้เชี่ยวชาญรอบด้าน (Generalist)</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-2 space-y-1">
                  <span className="text-[9.5px] font-black uppercase text-slate-700 tracking-wider block">
                    ฝ่าย/ศูนย์ที่ร่วมงานบ่อยที่สุด
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {intel.clientTeamAffinities.map((team, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-[9.5px] font-bold text-slate-800">
                        {team.teamName} ({team.count} งาน)
                      </span>
                    ))}
                    {intel.clientTeamAffinities.length === 0 && (
                      <span className="text-[9.5px] text-slate-400">ยังไม่มีประวัติฝ่ายที่ร่วมงาน</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Detailed Tasks Table - COMPLETE AND UNTRUNCATED */}
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-800 mb-1 flex items-center justify-between">
                  <span>รายการภาระงานทั้งหมดที่รับผิดชอบ ({memberTasks.length} งาน - แสดงครบทุกงาน)</span>
                  <span className="text-[9.5px] font-normal text-slate-400">ทั้งงานหลักและงานช่วย</span>
                </h4>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-1 px-1.5 w-16">รหัสงาน</th>
                        <th className="py-1 px-1.5">ชื่อโครงการ / ชิ้นงาน</th>
                        <th className="py-1 px-1.5 w-16">ยูนิต</th>
                        <th className="py-1 px-1.5 w-22 text-center">บทบาท</th>
                        <th className="py-1 px-1.5 w-16 text-center">สถานะ</th>
                        <th className="py-1 px-1.5 w-20 text-right">Save Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {memberTasks.map((task) => {
                        const { totalSaveCost, ownerShare, assistantShares } = getTaskFinancialDistribution(task);
                        const isOwner = ownerShare?.assignee_id === member.assignee_id;
                        const assistant = assistantShares.find(a => a.assignee_id === member.assignee_id);
                        const roleLabel = isOwner 
                          ? `เจ้าของ (${ownerShare?.percentage || 100}%)` 
                          : `ผู้ช่วย (${assistant?.percentage || 0}%)`;
                        const shareAmount = isOwner 
                          ? (ownerShare?.save_cost || totalSaveCost) 
                          : (assistant?.save_cost || 0);

                        return (
                          <tr key={task.id} className="bg-white hover:bg-slate-50">
                            <td className="py-0.5 px-1.5 font-mono text-slate-500 font-bold text-[9.5px]">
                              {task.details?.project_code || `CC-${task.id.slice(0, 4).toUpperCase()}`}
                            </td>
                            <td className="py-0.5 px-1.5 font-medium text-slate-900 truncate max-w-[220px]" title={task.project_name}>
                              {task.project_name}
                            </td>
                            <td className="py-0.5 px-1.5 text-slate-600 text-[9.5px] uppercase font-bold">
                              {task.unit}
                            </td>
                            <td className="py-0.5 px-1.5 text-center">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                                isOwner ? "bg-blue-50 text-blue-800" : "bg-purple-50 text-purple-800"
                              }`}>
                                {roleLabel}
                              </span>
                            </td>
                            <td className="py-0.5 px-1.5 text-center">
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                                task.status === "completed" 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : task.status === "in_progress" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {task.status === "completed" ? "เสร็จสิ้น" : task.status === "in_progress" ? "กำลังทำ" : "รอรับงาน"}
                              </span>
                            </td>
                            <td className="py-0.5 px-1.5 text-right font-mono font-semibold text-slate-800">
                              ฿{shareAmount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {memberTasks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-3 px-2 text-center text-slate-400">
                            ยังไม่มีข้อมูลบรีฟงานที่เชื่อมโยง
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer on Member Page */}
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
              <span>รายงานรายบุคคล: {meta.fullName} ({member.name}) | CC TEAM STeP</span>
              <span className="font-bold font-mono">หน้า {6 + mIdx} • ไฟล์ย่อยที่ 5: รายงานรายบุคคลแบบละเอียดทุกคน ({mIdx + 1}/{sortedMemberStats.length})</span>
            </div>
          </section>
        );
      })}

    </div>
  );
}
