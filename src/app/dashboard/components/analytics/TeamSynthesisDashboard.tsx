"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  HeartHandshake,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Target,
  ShieldCheck,
  TrendingUp,
  Heart,
  Send,
  Copy,
  Check,
  Printer,
  Mail,
  FileText,
  Lightbulb,
  Compass,
  Gift,
  ThumbsUp,
  Flame,
  ChevronRight,
  Info,
  Scale,
  Smile,
  Layers,
  HelpCircle,
  PiggyBank,
  Download
} from "lucide-react";
import {
  BriefTaskLike,
  MemberStats,
  TeamExecutiveAnalysis,
  UnitRiskAlert,
  getTaskFinancialDistribution
} from "@/utils/stats";
import { RealtimeOKRSummary } from "@/utils/okrSettings";
import { TeamWorkloadInsights } from "@/utils/teamAnalytics";
import { resolveTaskCode } from "@/utils/taskCodeService";
import TeamSwotTowsAnalysis from "./TeamSwotTowsAnalysis";

interface TeamSynthesisDashboardProps {
  briefs: BriefTaskLike[];
  memberStats: MemberStats[];
  executiveAnalysis: TeamExecutiveAnalysis;
  orgTotals: {
    totalSaveCost: number;
    totalOwnerCost: number;
    totalAssistantCost: number;
    totalProfit?: number;
    avgSaveCostPerMember?: number;
    avgProfitPerMember?: number;
    totalTasks: number;
    tasksWithAssistants: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    activeStaff: number;
  };
  realtimeMetrics?: RealtimeOKRSummary;
  teamWorkloadInsights?: TeamWorkloadInsights;
  unitStats?: Array<{
    unit: string;
    unitLabel: string;
    leadName: string;
    memberCount: number;
    totalSaveCost: number;
    ownerSaveCost: number;
    assistantSaveCost: number;
    ownerTaskCount: number;
    assistantTaskCount: number;
    totalTasksInvolved: number;
    avgDays: number;
    onTimeRate: number;
    members: MemberStats[];
  }>;
  emailDraftText: string;
  onDispatchEmail?: () => void;
  isDispatching?: boolean;
  emailSuccess?: string | null;
  onSelectMember?: (memberId: string) => void;
  onNavigateTab?: (tab: "workloads" | "goals" | "time_efficiency" | "individual_360") => void;
}

export default function TeamSynthesisDashboard({
  briefs,
  memberStats,
  executiveAnalysis,
  orgTotals,
  realtimeMetrics,
  teamWorkloadInsights,
  unitStats = [],
  emailDraftText,
  onDispatchEmail,
  isDispatching = false,
  emailSuccess = null,
  onSelectMember,
  onNavigateTab
}: TeamSynthesisDashboardProps) {
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeAnalysisView, setActiveAnalysisView] = useState<"all" | "workload" | "goals" | "time" | "individual">("all");

  // 1. Calculate Team Collaboration & Synergy Metrics
  const synergyRate = useMemo(() => {
    if (!orgTotals.totalTasks || orgTotals.totalTasks === 0) return 0;
    return Math.round((orgTotals.tasksWithAssistants / orgTotals.totalTasks) * 100);
  }, [orgTotals]);

  const assistantValueRatio = useMemo(() => {
    if (!orgTotals.totalSaveCost || orgTotals.totalSaveCost === 0) return 0;
    return Math.round((orgTotals.totalAssistantCost / orgTotals.totalSaveCost) * 100);
  }, [orgTotals]);

  // Strategic Alignment: tasks that have an OKR/TIP or are tied to KR
  const strategicAlignedTasks = useMemo(() => {
    return briefs.filter((b) => {
      const okr = b.details?.selected_okr || b.details?.okr || b.details?.kr;
      return Boolean(okr);
    }).length;
  }, [briefs]);

  const strategicAlignmentRate = useMemo(() => {
    if (briefs.length === 0) return 0;
    return Math.round((strategicAlignedTasks / briefs.length) * 100);
  }, [strategicAlignedTasks, briefs.length]);

  // 2. Identify Champions with warm, encouraging titles
  const supportChampions = useMemo(() => {
    return [...memberStats]
      .filter((m) => m.assistantTaskCount > 0)
      .sort((a, b) => b.assistantTaskCount - a.assistantTaskCount || b.assistantSaveCost - a.assistantSaveCost)
      .slice(0, 3);
  }, [memberStats]);

  const reliabilityChampions = useMemo(() => {
    return [...memberStats]
      .filter((m) => m.completedTasks >= 2)
      .sort((a, b) => b.onTimeRate - a.onTimeRate || a.avgTurnaroundDays - b.avgTurnaroundDays)
      .slice(0, 3);
  }, [memberStats]);

  const valueChampions = useMemo(() => {
    return [...memberStats]
      .sort((a, b) => b.totalSaveCost - a.totalSaveCost)
      .slice(0, 3);
  }, [memberStats]);



  // 5. Team Spirit Encouraging Memo (Ready for LINE / Slack)
  const teamSpiritMemo = useMemo(() => {
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    return `💖 [CC TEAM SPIRIT & SYNERGY MEMO] 💖
ประจำวันที่ ${today}

🌟 สรุปพลังใจและผลงานของทีมเรา:
• พวกเราร่วมกันสร้างมูลค่าประหยัด In-House Save Cost ให้แก่องค์กรรวม ฿${executiveAnalysis.totalSaveCost.toLocaleString()} บาท!
• ปิดงานสำเร็จสมบูรณ์ไปแล้ว ${executiveAnalysis.completedTasks} ชิ้นงาน จากทั้งหมด ${orgTotals.totalTasks} ชิ้น
• อัตราส่งมอบงานตรงเวลาของทีมสูงถึง ${executiveAnalysis.teamOnTimeRate}% ด้วยระยะเวลาเฉลี่ย ${executiveAnalysis.teamAvgTurnaroundDays} วัน/งาน
• งานที่มีการจับมือเป็นผู้ช่วยร่วมกัน (Team Support): ${orgTotals.tasksWithAssistants} งาน (คิดเป็น ${synergyRate}% ของงานทั้งหมด)

🤝 ขอบคุณเสาหลักแห่งการเกื้อกูล (Support Champions):
${supportChampions.map((c, i) => `  ${i + 1}. ${c.name} (${c.unit}) ช่วยเหลือเพื่อนไป ${c.assistantTaskCount} งาน (฿${c.assistantSaveCost.toLocaleString()})`).join("\n")}

✨ สารพลังใจถึงทุกคนในทีม:
"ทุกความสำเร็จของทีม CC ไม่ได้เกิดขึ้นจากคนใดคนหนึ่ง แต่เกิดจากการที่พวกเราคอยเป็นลมใต้ปีก คอยซัพพอร์ต และเติมเต็มให้กันเสมอ ขอบคุณทุกคนที่ทุ่มเทหัวใจให้กับทุกชิ้นงาน หากช่วงนี้เพื่อนคนไหนมีภาระงานหนาแน่น อย่าลังเลที่จะส่งเสียงบอกเพื่อนๆ ในทีม เราพร้อมก้าวเคียงข้างกันเสมอ!"

รักและขอบคุณทีมงาน CC ทุกคนครับ/ค่ะ ❤️`;
  }, [executiveAnalysis, orgTotals, synergyRate, supportChampions]);

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(teamSpiritMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailDraftText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 printable-report animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* PRINT-ONLY FORMAL HEADER (แสดงตามรูปแบบทางการเมื่อ Save PDF / Print) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print-only mb-6 border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-black text-slate-950 leading-tight">
          <div>รายงานสรุปภาพรวมทีมและการสังเคราะห์การทำงาน</div>
          <div className="text-base font-bold text-slate-600 mt-1">(Team Synthesis)</div>
        </h1>
        <div className="flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
          <span>ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
          <span>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP ACTION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-surface-border shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">รายงาน:</span>
          <span className="text-xs font-semibold text-slate-500">รายงานรวมทีม</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center gap-2 print:hidden cursor-pointer shrink-0 whitespace-nowrap"
            title="บันทึกเป็น PDF"
          >
            <Download size={14} />
            <span>Save PDF</span>
          </button>
        </div>
      </div>

      {/* Email Dispatch Success Notification if present */}
      {emailSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{emailSuccess}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOUR KEY TEAM HEARTBEAT & SYNERGY METRICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Team Synergy & Support Index */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white border border-rose-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <HeartHandshake size={16} className="text-rose-600" />
              ความร่วมมือในทีม
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
              งานช่วย
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">{synergyRate}%</span>
            <span className="text-xs text-slate-500 font-medium">ของงานทั้งหมด</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">
            มีงานที่ร่วมมือกัน <span className="font-bold text-rose-700">{orgTotals.tasksWithAssistants}</span> ชิ้น • Save Cost งานช่วย{" "}
            <span className="font-bold text-emerald-700">฿{orgTotals.totalAssistantCost.toLocaleString()}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold">
            <Smile size={13} />
            <span>วัฒนธรรมจับมือช่วยกัน ไม่ทิ้งใครโดดเดี่ยว</span>
          </div>
        </div>

        {/* Metric 2: Collective In-House Value Creation & PM Profit */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <PiggyBank size={16} className="text-emerald-600" />
              มูลค่าประหยัด & กำไร PM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Save Cost & Profit
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-800">
              ฿{executiveAnalysis.totalSaveCost.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              เฉลี่ย ฿{(executiveAnalysis.avgSaveCostPerMember || orgTotals.avgSaveCostPerMember || Math.round(executiveAnalysis.totalSaveCost / (orgTotals.activeStaff || 1))).toLocaleString()} / คน
            </span>
            <span className="text-orange-800 bg-orange-100/80 px-1.5 py-0.5 rounded" title="กำไรโครงการเฉลี่ยต่อคน">
              กำไร ฿{(executiveAnalysis.avgProfitPerMember || orgTotals.avgProfitPerMember || 0).toLocaleString()} / คน
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">
            งานเสร็จสิ้น <span className="font-bold text-slate-900">{executiveAnalysis.completedTasks}</span> งาน • กำไรโครงการ PM รวม{" "}
            <span className="font-bold text-orange-700 font-mono">฿{(executiveAnalysis.totalProfit || orgTotals.totalProfit || 0).toLocaleString()}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 size={13} />
            <span>ประหยัดงบจ้างภายนอก 100% + ผลิตกำไรจากโครงการ PM</span>
          </div>
        </div>

        {/* Metric 3: Healthy Delivery Velocity & Flow */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white border border-blue-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              การส่งมอบงาน
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              ตรงเวลา
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-blue-900">{executiveAnalysis.teamOnTimeRate}%</span>
            <span className="text-xs text-slate-500 font-medium">On-Time Rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">
            ระยะเวลาปิดงานเฉลี่ย <span className="font-bold text-blue-800">{executiveAnalysis.teamAvgTurnaroundDays}</span> วัน/ชิ้นงาน
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
            <ThumbsUp size={13} />
            <span>รักษาสมดุลความเร็วควบคู่กับคุณภาพผลงาน</span>
          </div>
        </div>

        {/* Metric 4: Strategic Goal Alignment (KR & TIP) */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white border border-purple-200/80 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Target size={16} className="text-purple-600" />
              เป้าหมายองค์กร
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
              สอดคล้อง
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-purple-900">{strategicAlignmentRate}%</span>
            <span className="text-xs text-slate-500 font-medium">เชื่อมโยง KR/TIP</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">
            มี {strategicAlignedTasks} งานระบุเป้าหมายตรง • กำลังดำเนินงาน {executiveAnalysis.inProgressTasks} งาน
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center gap-1.5 text-[11px] text-purple-700 font-semibold">
            <Sparkles size={13} />
            <span>ทุกแรงกายสนับสนุนทิศทางความสำเร็จขององค์กร</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. CELEBRATION & GRATITUDE: HEROES WHO LIFT THE TEAM */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} />
              ชื่นชมและส่งต่อคำขอบคุณ
            </span>
            <h3 className="text-lg font-black text-foreground mt-1">
              ขอบคุณคนเก่ง & เพื่อนช่วยเพื่อนในทีม
            </h3>
            <p className="text-xs text-muted mt-0.5">
              ทุกผลงานที่สำเร็จ มีเพื่อนร่วมทีมคอยซัพพอร์ตและเติมเต็มให้กันเสมอ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              <Gift size={13} className="text-amber-600 dark:text-amber-400" />
              ส่งต่อพลังบวกให้กันทุกสัปดาห์
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Champion Column 1: Support Champions (งานช่วยสูงสุด) */}
          <div className="bg-gradient-to-b from-rose-500/10 via-surface to-rose-500/5 rounded-2xl border border-rose-500/20 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Heart size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-foreground">งานช่วยสูงสุด</h4>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Top Support Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full">
                #ลมใต้ปีก
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              ขอขอบคุณสมาชิกที่เข้าไปเป็นผู้ช่วยในงานของเพื่อนมากที่สุด คอยสนับสนุนไม่ให้เพื่อนต้องโดดเดี่ยว:
            </p>

            <div className="space-y-2">
              {supportChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900 dark:text-amber-200"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-foreground">{m.name}</div>
                      <div className="text-[10px] text-muted capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">ช่วย {m.assistantTaskCount} งาน</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">฿{m.assistantSaveCost.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Champion Column 2: Reliability Champions (ส่งตรงเวลาสูงสุด) */}
          <div className="bg-gradient-to-b from-blue-500/10 via-surface to-blue-500/5 rounded-2xl border border-blue-500/20 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-foreground">ส่งตรงเวลาสูงสุด</h4>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Reliability Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                #เป๊ะรอบด้าน
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              ขอขอบคุณสมาชิกที่มีความรับผิดชอบยอดเยี่ยม ส่งมอบงานตรงเวลาอย่างสม่ำเสมอและบริหารเวลาได้อย่างลงตัว:
            </p>

            <div className="space-y-2">
              {reliabilityChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900 dark:text-amber-200"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-foreground">{m.name}</div>
                      <div className="text-[10px] text-muted capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">ตรงเวลา {m.onTimeRate}%</div>
                    <div className="text-[10px] text-muted">เฉลี่ย {m.avgTurnaroundDays} วัน</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Champion Column 3: High Value Creators (ประหยัดงบสูงสุด) */}
          <div className="bg-gradient-to-b from-emerald-500/10 via-surface to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-foreground">ประหยัดงบสูงสุด</h4>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Value Creation Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                #สร้างสรรค์คุ้มค่า
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              ขอขอบคุณพลังความคิดสร้างสรรค์อันยอดเยี่ยมที่ช่วยขับเคลื่อนมูลค่าประหยัด In-House สูงสุดให้แก่องค์กร:
            </p>

            <div className="space-y-2">
              {valueChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900 dark:text-amber-200"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-foreground">{m.name}</div>
                      <div className="text-[10px] text-muted capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">฿{m.totalSaveCost.toLocaleString()}</div>
                    <div className="text-[10px] text-muted">รวม {m.totalTasksInvolved} งาน</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CROSS-TAB INTELLIGENT SYNTHESIS: 4 DIMENSIONS TO SOLVE & GROW */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={16} />
              ชวนคุย 4 มุมมองเพื่อทีมที่ดีขึ้น
            </span>
            <h3 className="text-lg font-black text-foreground mt-1">
              สรุปมุมมอง 4 ด้านเพื่อร่วมมือและพัฒนาทีมไปด้วยกัน
            </h3>
            <p className="text-xs text-muted mt-0.5">
              รวมเรื่องดีๆ และแนวทางดูแลกัน เพื่อให้ทำงานร่วมกันอย่างมีความสุข
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted/10 p-1 rounded-xl border border-surface-border text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveAnalysisView("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "all" ? "bg-surface text-foreground shadow-2xs font-bold border border-surface-border" : "text-muted hover:text-foreground"
              }`}
            >
              ภาพรวมทุกมิติ
            </button>
            <button
              onClick={() => setActiveAnalysisView("workload")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "workload" ? "bg-surface text-foreground shadow-2xs font-bold border border-surface-border" : "text-muted hover:text-foreground"
              }`}
            >
              1. จำนวนงาน & มูลค่า
            </button>
            <button
              onClick={() => setActiveAnalysisView("goals")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "goals" ? "bg-surface text-foreground shadow-2xs font-bold border border-surface-border" : "text-muted hover:text-foreground"
              }`}
            >
              2. KR/R & TIP
            </button>
            <button
              onClick={() => setActiveAnalysisView("time")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "time" ? "bg-surface text-foreground shadow-2xs font-bold border border-surface-border" : "text-muted hover:text-foreground"
              }`}
            >
              3. เวลา & สุขภาวะ
            </button>
            <button
              onClick={() => setActiveAnalysisView("individual")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "individual" ? "bg-surface text-foreground shadow-2xs font-bold border border-surface-border" : "text-muted hover:text-foreground"
              }`}
            >
              4. รายบุคคล & ศักยภาพ
            </button>
          </div>
        </div>

        {/* Dimension Cards */}
        {/* Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dimension 1: From Workloads Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "workload") && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-surface to-surface rounded-2xl border border-emerald-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <PiggyBank size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">1. จำนวนงานและมูลค่าประหยัด</h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">จาก: แท็บจำนวนงาน / มูลค่า</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("workloads")}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 1 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-foreground/90 space-y-2 leading-relaxed">
                <div className="p-3 bg-surface rounded-xl border border-emerald-500/20">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">💡 ข้อมูลในระบบ:</span>
                  {briefs.length === 0 ? (
                    <span>ขณะนี้ยังไม่มีภาระงานในระบบ</span>
                  ) : (
                    <span>ทีมมีมูลค่า In-House Save Cost รวม ฿{orgTotals.totalSaveCost.toLocaleString()} บาท จากงานทั้งหมด {briefs.length} งาน (เฉลี่ย ฿{Math.round(orgTotals.totalSaveCost / Math.max(1, briefs.length)).toLocaleString()} บาท/งาน) {synergyRate > 0 ? `• มีการมอบหมายงานช่วย ${orgTotals.tasksWithAssistants} งาน (${synergyRate}%)` : ""}</span>
                  )}
                </div>
                <div className="p-3 bg-surface rounded-xl border border-emerald-500/20">
                  <span className="font-bold text-foreground block mb-1">📌 ข้อควรปฏิบัติ:</span>
                  บันทึกการจัดสรรงานและระบุผู้ช่วยในระบบเพื่อสะท้อนความร่วมมือและภาระงานจริง
                </div>
              </div>
            </div>
          )}

          {/* Dimension 2: From Goals (KR/TIP) Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "goals") && (
            <div className="bg-gradient-to-br from-purple-500/10 via-surface to-surface rounded-2xl border border-purple-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Target size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">2. การเชื่อมโยงเป้าหมายยุทธศาสตร์</h4>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">จาก: แท็บ KR/R , KPI/TIP</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("goals")}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 2 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-foreground/90 space-y-2 leading-relaxed">
                <div className="p-3 bg-surface rounded-xl border border-purple-500/20">
                  <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">🎯 ข้อมูลในระบบ:</span>
                  {briefs.length === 0 ? (
                    <span>ยังไม่มีข้อมูลงานในระบบ</span>
                  ) : strategicAlignmentRate === 0 ? (
                    <span>ปัจจุบันยังไม่มีการระบุเป้าหมายยุทธศาสตร์ (OKR/TIP) ในรายการบรีฟรอบนี้</span>
                  ) : (
                    <span>มีงานที่ระบุเป้าหมายยุทธศาสตร์จำนวน {strategicAlignedTasks} งาน (คิดเป็น {strategicAlignmentRate}% ของงานทั้งหมด)</span>
                  )}
                </div>
                <div className="p-3 bg-surface rounded-xl border border-purple-500/20">
                  <span className="font-bold text-foreground block mb-1">📌 ข้อควรปฏิบัติ:</span>
                  สามารถระบุเป้าหมายยุทธศาสตร์ (OKR/TIP) ในขั้นตอนรับบรีฟเพื่อให้เห็นความสอดคล้องกับพันธกิจองค์กร
                </div>
              </div>
            </div>
          )}

          {/* Dimension 3: From Time / Efficiency Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "time") && (
            <div className="bg-gradient-to-br from-blue-500/10 via-surface to-surface rounded-2xl border border-blue-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">3. ประสิทธิภาพเวลาและการส่งมอบ</h4>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">จาก: แท็บเวลา / สถานะงาน</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("time_efficiency")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 3 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-foreground/90 space-y-2 leading-relaxed">
                <div className="p-3 bg-surface rounded-xl border border-blue-500/20">
                  <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">⏱️ ข้อมูลในระบบ:</span>
                  {briefs.filter(b => b.status === 'completed').length === 0 ? (
                    <span>ปัจจุบันยังไม่มีงานที่ปิดสมบูรณ์ในระบบ (มีงานกำลังดำเนินงาน {orgTotals.inProgressTasks} งาน, รอทำ {orgTotals.pendingTasks} งาน)</span>
                  ) : (
                    <span>ส่งมอบงานสำเร็จแล้ว {briefs.filter(b => b.status === 'completed').length} งาน (ส่งตรงเวลา {executiveAnalysis.teamOnTimeRate}% เฉลี่ย {executiveAnalysis.teamAvgTurnaroundDays} วัน)</span>
                  )}
                </div>
                <div className="p-3 bg-surface rounded-xl border border-blue-500/20">
                  <span className="font-bold text-foreground block mb-1">📌 ข้อควรปฏิบัติ:</span>
                  ติดตามสถานะและตรวจสอบกำหนดส่งมอบงานของแต่ละบรีฟอย่างสม่ำเสมอ
                </div>
              </div>
            </div>
          )}

          {/* Dimension 4: From Individual Report Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "individual") && (
            <div className="bg-gradient-to-br from-amber-500/10 via-surface to-surface rounded-2xl border border-amber-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Users size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">4. บทบาทและภาระงานรายบุคคล</h4>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">จาก: แท็บรายงานรายบุคคล</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("individual_360")}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 4 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-foreground/90 space-y-2 leading-relaxed">
                <div className="p-3 bg-surface rounded-xl border border-amber-500/20">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">🌟 ข้อมูลในระบบ:</span>
                  สมาชิกในทีม {memberStats.length} คน รับผิดชอบงานหลักรวม {orgTotals.totalTasks} งาน และมีงานที่มีผู้ช่วยร่วมดำเนินงาน {orgTotals.tasksWithAssistants} งาน
                </div>
                <div className="p-3 bg-surface rounded-xl border border-amber-500/20">
                  <span className="font-bold text-foreground block mb-1">📌 ข้อควรปฏิบัติ:</span>
                  ประสานงานและส่งต่อข้อมูลระหว่างยูนิตเพื่อให้การดำเนินงานเป็นไปตามกำหนด
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ACTIVE TASKS & OVERDUE FOLLOW-UP (ข้อมูลงานจริงที่ต้องติดตาม)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box A: Overdue Tasks */}
        {(() => {
          const overdueBriefs = briefs.filter((b) => {
            const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
            return dStr && b.status !== 'completed' && b.status !== 'cancelled' && Date.now() > new Date(dStr).getTime() + 86400000;
          });
          return (
            <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">งานที่เกินกำหนดส่ง (Overdue Tasks)</h4>
                    <p className="text-[11px] text-muted font-medium">รายการงานที่เลยกำหนดส่งมอบและยังไม่ปิดงาน</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  overdueBriefs.length > 0 ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                }`}>
                  {overdueBriefs.length} งาน
                </span>
              </div>

              {overdueBriefs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  ✅ ไม่มีงานค้างเกินกำหนดส่งในระบบ
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {overdueBriefs.map((b) => {
                    const deadlineStr = b.deadline ? String(b.deadline).split('T')[0] : "-";
                    return (
                      <div key={b.id} className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-foreground flex items-center gap-1.5 truncate">
                            <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{resolveTaskCode(b, briefs)}</span>
                            <span className="truncate">{b.project_name || "ไม่ระบุชื่องาน"}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 shrink-0 uppercase font-bold">
                            {b.unit || "CC"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                          <span>ผู้รับผิดชอบ: <strong className="text-foreground">{b.assignee_name || "ทีมงาน CC"}</strong></span>
                          <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">กำหนดส่ง: {deadlineStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Box B: In Progress Tasks */}
        {(() => {
          const inProgressBriefs = briefs.filter((b) => b.status === 'in_progress');
          return (
            <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Layers size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">งานที่กำลังดำเนินงาน (In Progress Tasks)</h4>
                    <p className="text-[11px] text-muted font-medium">รายการงานที่อยู่ในกระบวนการผลิต</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  {inProgressBriefs.length} งาน
                </span>
              </div>

              {inProgressBriefs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-muted/10 border border-surface-border text-center text-xs text-muted font-medium">
                  ไม่มีงานที่อยู่ระหว่างดำเนินการในขณะนี้
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {inProgressBriefs.map((b) => {
                    const deadlineStr = b.deadline ? String(b.deadline).split('T')[0] : "-";
                    return (
                      <div key={b.id} className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-foreground flex items-center gap-1.5 truncate">
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{resolveTaskCode(b, briefs)}</span>
                            <span className="truncate">{b.project_name || "ไม่ระบุชื่องาน"}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 shrink-0 uppercase font-bold">
                            {b.unit || "CC"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                          <span>ผู้รับผิดชอบ: <strong className="text-foreground">{b.assignee_name || "ทีมงาน CC"}</strong></span>
                          <span className="font-mono text-foreground">กำหนดส่ง: {deadlineStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ========================================================================= */}
      {/* 7. INDIVIDUAL TEAM SCORECARD TABLE */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-3xl border border-surface-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Users size={16} />
              ตารางสรุปผลงานและความคุ้มค่ารายบุคคล (Holistic Member Scorecard)
            </span>
            <h3 className="text-base font-black text-foreground mt-1">
              ผลงานรวมทั้งงานหลัก (Owner) และงานช่วย (Assistant) ของทุกคนในทีม
            </h3>
          </div>
          <div className="text-xs text-muted font-mono">
            แสดงสมาชิกทั้งหมด {memberStats.length} คน
          </div>
        </div>

        <div className="border border-surface-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/10 text-muted font-bold border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3.5 text-center">#</th>
                  <th className="py-3 px-3.5">ชื่อ - สังกัด</th>
                  <th className="py-3 px-3.5 text-right">Save Cost รวม</th>
                  <th className="py-3 px-3.5 text-right text-orange-600 dark:text-orange-400">กำไร PM</th>
                  <th className="py-3 px-3.5 text-center">สัดส่วนงาน (หลัก / ช่วย)</th>
                  <th className="py-3 px-3.5 text-center">สถานะงาน (รอทำ / กำลังทำ / เสร็จสิ้น)</th>
                  <th className="py-3 px-3.5 text-center">เวลาเฉลี่ย</th>
                  <th className="py-3 px-3.5 text-center">ตรงเวลา (%)</th>
                  <th className="py-3 px-3.5 text-center">ดัชนีหลังบ้าน (BOH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-medium text-foreground">
                {memberStats.map((m, idx) => (
                  <tr
                    key={m.assignee_id}
                    onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                    className="hover:bg-muted/5 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3.5 text-center text-muted font-mono">{idx + 1}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-foreground">{m.name}</div>
                      <div className="text-[10px] text-muted capitalize">{m.unit} Unit</div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ฿{m.totalSaveCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                      ฿{(m.totalProfit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      <span className="text-foreground font-bold">หลัก {m.ownerTaskCount}</span>
                      <span className="text-muted/40 mx-1">/</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">ช่วย {m.assistantTaskCount}</span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-[11px]">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-amber-600 dark:text-amber-400 font-bold" title="รอทำ">{m.pendingTasks}</span>
                        <span className="text-muted/40">/</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold" title="กำลังทำ">{m.inProgressTasks}</span>
                        <span className="text-muted/40">/</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="เสร็จสิ้น">{m.completedTasks}</span>
                        {m.overdueTasksCount > 0 && (
                          <>
                            <span className="text-muted/40">/</span>
                            <span className="text-rose-600 dark:text-rose-400 font-black" title="ต้องการผู้ช่วยเสริม">⚠️{m.overdueTasksCount}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      {m.avgTurnaroundDays > 0 ? `${m.avgTurnaroundDays} วัน` : "-"}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      <span className={m.onTimeRate >= 80 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                        {m.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.citizenshipTier === 'champion'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                          : m.citizenshipTier === 'anchor'
                          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30'
                          : m.citizenshipTier === 'contributor'
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30'
                          : 'bg-muted/10 text-muted border-surface-border'
                      }`} title={`คะแนนการมีส่วนร่วมและงานหลังบ้าน BOH: ${m.citizenshipScore}/100`}>
                        <span>{m.citizenshipTier === 'champion' ? '🏆' : m.citizenshipTier === 'anchor' ? '🤝' : m.citizenshipTier === 'contributor' ? '🛡️' : '⚙️'}</span>
                        <span>{m.citizenshipTitle} ({m.citizenshipScore})</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. REAL-TIME SWOT ANALYSIS & TOWS STRATEGIC MATRIX (การวิเคราะห์เชิงกลยุทธ์รวมทีม) */}
      {/* ========================================================================= */}
      <TeamSwotTowsAnalysis
        orgTotals={orgTotals}
        executiveAnalysis={executiveAnalysis}
        memberStats={memberStats}
        realtimeMetrics={realtimeMetrics}
        teamWorkloadInsights={teamWorkloadInsights}
        unitStats={unitStats}
      />

    </div>
  );
}
