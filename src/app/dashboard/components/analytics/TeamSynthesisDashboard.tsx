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
  const [selectedUnitFocus, setSelectedUnitFocus] = useState<string>("all");

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

  // 3. Intelligent Empathy & Care Recommendations
  // Identify members who have high active workloads or overdue tasks to offer friendly assistance
  const membersNeedingCare = useMemo(() => {
    return memberStats
      .filter((m) => {
        const activeTasks = m.inProgressTasks + m.pendingTasks;
        return m.overdueTasksCount > 0 || activeTasks >= 5 || m.stalledProgressCount > 0;
      })
      .map((m) => {
        let careReason = "";
        let suggestedAction = "";
        if (m.overdueTasksCount > 0) {
          careReason = `มีงานที่ต้องการผู้ช่วยเสริม ${m.overdueTasksCount} งาน เพื่อช่วยกันส่งมอบอย่างสบายใจ`;
          suggestedAction = "ส่งเพื่อนร่วมยูนิตเข้าไปประกบช่วยดูไฟล์งานหรือเคลียร์ฟีดแบ็ก";
        } else if (m.inProgressTasks >= 4) {
          careReason = `กำลังมุ่งมั่นดูแลงานพร้อมกัน ${m.inProgressTasks} งาน ควรสนับสนุนเวลาโฟกัส`;
          suggestedAction = "จัดลำดับงานด่วน และแบ่งเบางานรองให้เพื่อนร่วมทีมช่วยซัพพอร์ต";
        } else {
          careReason = "มีงานกำลังรอขั้นตอนถัดไป เพื่อให้กระบวนการลื่นไหล";
          suggestedAction = "นัดคุยสั้นๆ 10 นาที เพื่อตรวจเช็กจุดติดขัดและประสานงานต่อ";
        }
        return {
          member: m,
          careReason,
          suggestedAction
        };
      });
  }, [memberStats]);

  // 4. Cross-Skilling & Buddy Pairing Suggestions
  const buddyPairs = useMemo(() => {
    const creativeMembers = memberStats.filter((m) => m.unit?.toLowerCase() === "creative");
    const contentMembers = memberStats.filter((m) => m.unit?.toLowerCase() === "content");
    const prMembers = memberStats.filter((m) => m.unit?.toLowerCase() === "pr");

    const pairs: Array<{
      leadMember: string;
      buddyMember: string;
      synergyTopic: string;
      benefit: string;
    }> = [];

    if (creativeMembers.length > 0 && contentMembers.length > 0) {
      pairs.push({
        leadMember: creativeMembers[0].name,
        buddyMember: contentMembers[0].name,
        synergyTopic: "Storytelling to Visual Synthesis (คิดบรีฟคู่ภาพ)",
        benefit: "ทำให้งานคอนเทนต์และภาพกราฟิกเข้าขากันตั้งแต่ร่างแรก ลดการแก้งานได้กว่า 30%"
      });
    }

    if (contentMembers.length > 1 && prMembers.length > 0) {
      pairs.push({
        leadMember: contentMembers[1]?.name || contentMembers[0].name,
        buddyMember: prMembers[0].name,
        synergyTopic: "PR Hook & Distribution Rhythm (การจัดจังหวะปล่อยข่าว)",
        benefit: "ช่วยให้ข่าวสารและคอนเทนต์สำคัญเข้าถึงผู้ติดตามตรงเป้าหมายและตรงเวลา"
      });
    }

    if (creativeMembers.length > 1 && prMembers.length > 1) {
      pairs.push({
        leadMember: creativeMembers[1].name,
        buddyMember: prMembers[1].name,
        synergyTopic: "Branded Social Assets (ภาพประกอบข่าวองค์กรแบบด่วน)",
        benefit: "สร้าง Template กึ่งสำเร็จรูปเพื่อช่วยให้ปล่อยภาพข่าวด่วนได้ทันทีในเวลาไม่เกิน 2 ชั่วโมง"
      });
    }

    return pairs;
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} />
              ชื่นชมและส่งต่อคำขอบคุณ
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              ขอบคุณคนเก่ง & เพื่อนช่วยเพื่อนในทีม
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ทุกผลงานที่สำเร็จ มีเพื่อนร่วมทีมคอยซัพพอร์ตและเติมเต็มให้กันเสมอ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Gift size={13} className="text-amber-600" />
              ส่งต่อพลังบวกให้กันทุกสัปดาห์
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Champion Column 1: Support Champions (งานช่วยสูงสุด) */}
          <div className="bg-gradient-to-b from-rose-50/60 via-white to-rose-50/30 rounded-2xl border border-rose-200/80 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Heart size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">งานช่วยสูงสุด</h4>
                  <p className="text-[11px] text-rose-700 font-medium">Top Support Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                #ลมใต้ปีก
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ขอขอบคุณสมาชิกที่เข้าไปเป็นผู้ช่วยในงานของเพื่อนมากที่สุด คอยสนับสนุนไม่ให้เพื่อนต้องโดดเดี่ยว:
            </p>

            <div className="space-y-2">
              {supportChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-rose-700">ช่วย {m.assistantTaskCount} งาน</div>
                    <div className="text-[10px] text-emerald-700">฿{m.assistantSaveCost.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Champion Column 2: Reliability Champions (ส่งตรงเวลาสูงสุด) */}
          <div className="bg-gradient-to-b from-blue-50/60 via-white to-blue-50/30 rounded-2xl border border-blue-200/80 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">ส่งตรงเวลาสูงสุด</h4>
                  <p className="text-[11px] text-blue-700 font-medium">Reliability Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                #เป๊ะรอบด้าน
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ขอขอบคุณสมาชิกที่มีความรับผิดชอบยอดเยี่ยม ส่งมอบงานตรงเวลาอย่างสม่ำเสมอและบริหารเวลาได้อย่างลงตัว:
            </p>

            <div className="space-y-2">
              {reliabilityChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-blue-700">ตรงเวลา {m.onTimeRate}%</div>
                    <div className="text-[10px] text-slate-500">เฉลี่ย {m.avgTurnaroundDays} วัน</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Champion Column 3: High Value Creators (ประหยัดงบสูงสุด) */}
          <div className="bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/30 rounded-2xl border border-emerald-200/80 p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">ประหยัดงบสูงสุด</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">Value Creation Champions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                #สร้างสรรค์คุ้มค่า
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ขอขอบคุณพลังความคิดสร้างสรรค์อันยอดเยี่ยมที่ช่วยขับเคลื่อนมูลค่าประหยัด In-House สูงสุดให้แก่องค์กร:
            </p>

            <div className="space-y-2">
              {valueChampions.map((m, idx) => (
                <div
                  key={m.assignee_id}
                  onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-800" : "bg-amber-700/20 text-amber-900"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{m.unit} Unit</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-800">฿{m.totalSaveCost.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">รวม {m.totalTasksInvolved} งาน</div>
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={16} />
              ชวนคุย 4 มุมมองเพื่อทีมที่ดีขึ้น
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              สรุปมุมมอง 4 ด้านเพื่อร่วมมือและพัฒนาทีมไปด้วยกัน
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              รวมเรื่องดีๆ และแนวทางดูแลกัน เพื่อให้ทำงานร่วมกันอย่างมีความสุข
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveAnalysisView("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ภาพรวมทุกมิติ
            </button>
            <button
              onClick={() => setActiveAnalysisView("workload")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "workload" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. จำนวนงาน & มูลค่า
            </button>
            <button
              onClick={() => setActiveAnalysisView("goals")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "goals" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. KR/R & TIP
            </button>
            <button
              onClick={() => setActiveAnalysisView("time")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "time" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. เวลา & สุขภาวะ
            </button>
            <button
              onClick={() => setActiveAnalysisView("individual")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeAnalysisView === "individual" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              4. รายบุคคล & ศักยภาพ
            </button>
          </div>
        </div>

        {/* Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dimension 1: From Workloads Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "workload") && (
            <div className="bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/40 rounded-2xl border border-emerald-200/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <PiggyBank size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">1. ช่วยกันเกลี่ยงานให้สมดุล</h4>
                    <p className="text-[11px] text-emerald-700 font-medium">จาก: แท็บจำนวนงาน / มูลค่า</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("workloads")}
                    className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 1 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1">💡 สิ่งที่เห็นในทีม:</span>
                  ทีมสร้างมูลค่างานเฉลี่ยได้ถึง ฿{Math.round(orgTotals.totalSaveCost / Math.max(1, briefs.length)).toLocaleString()} บาท/งาน โดยมีอัตราการแบ่งปันงานช่วยสูงถึง {synergyRate}% ของภาระงานทั้งหมด
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="font-bold text-slate-900 block mb-1">🌱 ชวนทำด้วยกัน:</span>
                  สำหรับงานที่มีมูลค่าสูงและมีความซับซ้อน ให้กำหนดสัดส่วนผู้ช่วยร่วมรับผิดชอบตั้งแต่ขั้นตอนรับบรีฟ เพื่อป้องกันไม่ให้ภาระไปตกอยู่กับผู้รับผิดชอบหลักเพียงคนเดียว
                </div>
              </div>
            </div>
          )}

          {/* Dimension 2: From Goals (KR/TIP) Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "goals") && (
            <div className="bg-gradient-to-br from-purple-50/40 via-white to-slate-50/40 rounded-2xl border border-purple-200/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                    <Target size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">2. ร่วมมือทำตามเป้าหมาย</h4>
                    <p className="text-[11px] text-purple-700 font-medium">จาก: แท็บ KR/R , KPI/TIP</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("goals")}
                    className="text-xs text-purple-700 hover:text-purple-900 flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 2 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-900 block mb-1">🎯 สิ่งที่เห็นในทีม:</span>
                  งานที่เชื่อมโยงกับเป้าหมายยุทธศาสตร์มีสัดส่วน {strategicAlignmentRate}% สะท้อนว่าทีมกำลังส่งมอบงานที่ตอบโจทย์ทั้งการบริการภายใน (KR) และเป้าหมายมูลค่าทางธุรกิจ (TIP) อย่างเด่นชัด
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="font-bold text-slate-900 block mb-1">🚀 ชวนทำด้วยกัน:</span>
                  ส่งเสริมให้เพื่อนร่วมทีมทุกคนเข้าใจว่างานประจำวันของตนเชื่อมโยงกับความสำเร็จขององค์กรในส่วนใด จะช่วยสร้างความภาคภูมิใจและพลังใจในการสร้างสรรค์ผลงานยิ่งขึ้น
                </div>
              </div>
            </div>
          )}

          {/* Dimension 3: From Time / Efficiency Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "time") && (
            <div className="bg-gradient-to-br from-blue-50/40 via-white to-slate-50/40 rounded-2xl border border-blue-200/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">3. จังหวะการทำงานและการส่งมอบ</h4>
                    <p className="text-[11px] text-blue-700 font-medium">จาก: แท็บเวลา / สถานะงาน</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("time_efficiency")}
                    className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 3 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">⏱️ สิ่งที่เห็นในทีม:</span>
                  อัตราส่งมอบงานตรงเวลา {executiveAnalysis.teamOnTimeRate}% ด้วยระยะเวลาเฉลี่ย {executiveAnalysis.teamAvgTurnaroundDays} วัน สะท้อนถึงมาตรฐานความรับผิดชอบที่สูงมาก
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-bold text-slate-900 block mb-1">💙 แนวทางดูแลกัน:</span>
                  สำหรับงานที่เริ่มค้างในสถานะรอนานเกิน 5 วัน ให้เพื่อนหรือหัวหน้ายูนิตประสานสอบถามผู้ขอบรีฟเพื่อช่วยเคลียร์ข้อติดขัด ช่วยให้เจ้าของงานไม่ต้องเผชิญความกดดันเพียงลำพัง
                </div>
              </div>
            </div>
          )}

          {/* Dimension 4: From Individual Report Tab */}
          {(activeAnalysisView === "all" || activeAnalysisView === "individual") && (
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50/40 rounded-2xl border border-amber-200/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Users size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">4. จุดเด่นและพลังเสริมกัน</h4>
                    <p className="text-[11px] text-amber-700 font-medium">จาก: แท็บรายงานรายบุคคล</p>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("individual_360")}
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold"
                  >
                    ดูแท็บ 4 <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-900 block mb-1">🌟 สิ่งที่เห็นในทีม:</span>
                  สมาชิกทั้ง {memberStats.length} คนต่างมีความเชี่ยวชาญเฉพาะตัว (Superpower) ที่โดดเด่น ทั้งด้านกราฟิก, การสร้างสรรค์เนื้อหา, และการประชาสัมพันธ์
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <span className="font-bold text-slate-900 block mb-1">🤝 ชวนทำด้วยกัน:</span>
                  จัดให้มีการแลกเปลี่ยนเทคนิคแบบไม่เป็นทางการ (Micro-Knowledge Sharing) 15 นาทีต่อสัปดาห์ เพื่อให้ทุกคนได้ต่อยอดทักษะใหม่ๆ จากเพื่อนร่วมทีมอย่างอบอุ่น
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EMPATHETIC PROBLEM SOLVING & BUDDY ACTIONABLES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box A: Buddy Pairing & Cross-Skilling */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake size={16} />
                การจับคู่บัดดี้ข้ามสายงาน (Cross-Skilling Buddy)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                เรียนรู้และโตไปด้วยกัน
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900">
              ข้อเสนอแนะการเสริมพลังข้ามยูนิต (Creative × Content × PR)
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              การจับคู่ทำงานร่วมกันจะช่วยลดข้อจำกัดของแต่ละสายงาน เพิ่มมุมมองสร้างสรรค์ใหม่ๆ และสร้างความเข้าใจอันดีระหว่างเพื่อนร่วมทีม:
            </p>

            <div className="space-y-3 pt-1">
              {buddyPairs.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5 text-indigo-900">
                      <span>{p.leadMember}</span>
                      <span className="text-slate-400">↔</span>
                      <span>{p.buddyMember}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      คู่หูเสริมพลัง
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">✨ หัวข้อ: {p.synergyTopic}</div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">💡 คุณค่าที่ทีมจะได้รับ: {p.benefit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2 mt-4">
            <Lightbulb size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">เคล็ดลับพลังบวก:</span> บัดดี้ไม่ต้องทำงานแทนกันทั้งหมด เพียงแค่ช่วยรีวิวแนวคิดและส่งกำลังใจให้กันตั้งแต่ต้นทาง จะช่วยลดความกังวลและเพิ่มความมั่นใจได้อย่างมาก
            </div>
          </div>
        </div>

        {/* Box B: Care & Workload Support Hub */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <Heart size={16} className="text-rose-600" />
                พื้นที่ดูแลพลังใจและแบ่งเบาภาระงาน (Heartbeat Care Hub)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                ดูแลกันและกัน
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900">
              โอกาสในการยื่นมือเข้าไปซัพพอร์ตเพื่อนในทีม
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              ระบุสถานการณ์ที่เพื่อนร่วมทีมอาจกำลังต้องการความช่วยเหลือ เพื่อให้ทีมสามารถส่งแรงสนับสนุนเข้าไปอย่างอบอุ่นและทันเวลา:
            </p>

            <div className="space-y-2.5 pt-1">
              {membersNeedingCare.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
                  🎉 สุขภาวะภาระงานของทุกคนในทีมขณะนี้อยู่ในระดับสมดุลยอดเยี่ยม ไม่มีงานคั่งค้างสะสม!
                </div>
              ) : (
                membersNeedingCare.slice(0, 3).map((item) => (
                  <div
                    key={item.member.assignee_id}
                    onClick={() => onSelectMember && onSelectMember(item.member.assignee_id)}
                    className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-all cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 flex items-center gap-2">
                        <span>{item.member.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">({item.member.unit})</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                        กำลังทำ {item.member.inProgressTasks} / รอ {item.member.pendingTasks}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      ❤️ <span className="font-medium">{item.careReason}</span>
                    </div>
                    <div className="text-rose-700 text-[11px] font-semibold">
                      🤝 แนวทางเกื้อกูล: {item.suggestedAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs text-rose-900 flex items-start gap-2 mt-4">
            <Smile size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">หลักการสำคัญ:</span> การยื่นมือเข้าช่วยไม่ใช่เพราะใครทำไม่ทัน แต่เพราะงานของเราคืองานของทีม ความสำเร็จร่วมกันคือเป้าหมายสูงสุด
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. UNIT-BY-UNIT HARMONY & RISK MITIGATION WITH EMPATHY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-indigo-600" />
              การบริหารความเสี่ยงด้วยความเข้าใจและการร่วมมือ (Unit Care & Action Steps)
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              แนวทางการสนับสนุนของแต่ละยูนิต (Creative, Content, PR & Internal)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              วิเคราะห์ความเสี่ยงเชิงโครงสร้าง พร้อมแนวทางที่หัวหน้าทีมและเพื่อนร่วมทีมพร้อมลงไปสนับสนุน
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">กรองยูนิต:</span>
            <select
              value={selectedUnitFocus}
              onChange={(e) => setSelectedUnitFocus(e.target.value)}
              className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">ทุกยูนิต (All Units)</option>
              <option value="creative">Creative Unit</option>
              <option value="content">Content Unit</option>
              <option value="pr">PR Unit</option>
              <option value="internal">Internal Unit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {executiveAnalysis.unitRiskAlerts
            .filter((alert) => selectedUnitFocus === "all" || alert.unit.toLowerCase() === selectedUnitFocus.toLowerCase())
            .map((alert) => (
              <div
                key={alert.unit}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white text-xs space-y-3"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <span className="text-sm text-indigo-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>{alert.unitLabel}</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ผู้ประสานหลัก: <span className="font-bold text-slate-800">{alert.leadName}</span>
                  </span>
                </div>

                <div className="text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900">📌 สถานการณ์ปัจจุบัน:</span> {alert.situation}
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                  <span className="font-bold text-indigo-950 block">🤝 แนวทางที่ทีมและ {alert.leadName} ร่วมมือกัน:</span>
                  <ul className="space-y-1 text-slate-700 pl-1">
                    {alert.actionSteps.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>ความเสี่ยงที่เฝ้าระวัง: {alert.riskImpacts[0] || "การกระจุกตัวของงาน"}</span>
                  <span className="font-bold text-emerald-700">ทีมพร้อมซัพพอร์ต ✓</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. INDIVIDUAL TEAM SCORECARD TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={16} />
              ตารางสรุปผลงานและความคุ้มค่ารายบุคคล (Holistic Member Scorecard)
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">
              ผลงานรวมทั้งงานหลัก (Owner) และงานช่วย (Assistant) ของทุกคนในทีม
            </h3>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            แสดงสมาชิกทั้งหมด {memberStats.length} คน
          </div>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 text-center">#</th>
                  <th className="py-3 px-3.5">ชื่อ - สังกัด</th>
                  <th className="py-3 px-3.5 text-right">Save Cost รวม</th>
                  <th className="py-3 px-3.5 text-right text-orange-800">กำไร PM</th>
                  <th className="py-3 px-3.5 text-center">สัดส่วนงาน (หลัก / ช่วย)</th>
                  <th className="py-3 px-3.5 text-center">สถานะงาน (ทำ / รอ / เสร็จ)</th>
                  <th className="py-3 px-3.5 text-center">เวลาเฉลี่ย</th>
                  <th className="py-3 px-3.5 text-center">ตรงเวลา (%)</th>
                  <th className="py-3 px-3.5 text-center">ดัชนีหลังบ้าน (BOH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {memberStats.map((m, idx) => (
                  <tr
                    key={m.assignee_id}
                    onClick={() => onSelectMember && onSelectMember(m.assignee_id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{m.unit} Unit</div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800">
                      ฿{m.totalSaveCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-orange-700">
                      ฿{(m.totalProfit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      <span className="text-slate-900 font-bold">หลัก {m.ownerTaskCount}</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="text-rose-600 font-bold">ช่วย {m.assistantTaskCount}</span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-[11px]">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-blue-700 font-bold" title="กำลังทำ">{m.inProgressTasks}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-amber-700 font-bold" title="รอเริ่ม">{m.pendingTasks}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-emerald-700 font-bold" title="เสร็จสิ้น">{m.completedTasks}</span>
                        {m.overdueTasksCount > 0 && (
                          <>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600 font-black" title="ต้องการผู้ช่วยเสริม">⚠️{m.overdueTasksCount}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      {m.avgTurnaroundDays > 0 ? `${m.avgTurnaroundDays} วัน` : "-"}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      <span className={m.onTimeRate >= 80 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                        {m.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.citizenshipTier === 'champion'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : m.citizenshipTier === 'anchor'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : m.citizenshipTier === 'contributor'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
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
