'use client';

import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Download, 
  Send, 
  Search, 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Check, 
  ArrowUpRight, 
  Layers, 
  BarChart3, 
  PieChart as PieChartIcon, 
  FileText,
  Mail,
  Building2,
  Tag,
  Target,
  AlertCircle,
  Star,
  Flame,
  Gem,
  Activity
} from 'lucide-react';
import { BriefTaskLike, MemberStats } from '@/utils/stats';
import { MemberProfile } from '@/utils/memberProfile';
import { computeMemberIntelligenceProfile, computeTeamWorkloadInsights } from '@/utils/teamAnalytics';
import MemberSpecializationCard from './MemberSpecializationCard';
import InteractiveDonutChart, { DonutSegment } from '../charts/InteractiveDonutChart';
import PressureGaugeMeter from '../charts/PressureGaugeMeter';
import { 
  getStoredOKRSettings, 
  computeMemberPacingAlerts, 
  MemberPacingSummary,
  MemberPacingMetric 
} from '@/utils/okrSettings';

const UNIT_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  creative: { label: "Creative", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10", border: "border-[#8b5cf6]/30" },
  pr: { label: "PR", color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10", border: "border-[#06b6d4]/30" },
  content: { label: "Content", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/30" },
  internal: { label: "Internal Task", color: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/30" },
  other: { label: "Other", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
};

interface TaskWithDuration {
  brief: BriefTaskLike;
  role: 'owner' | 'assistant';
  percentage: number;
  shareBaht: number;
  totalTaskCost: number;
  createdTime: number;
  inProgressTime: number | null;
  completedTime: number | null;
  deadlineTime: number | null;
  pendingDays: number;
  inProgressDays: number;
  totalDurationDays: number;
  isCompleted: boolean;
  isOnTime: boolean | null;
  category: string;
  clientTeam: string;
}

interface IndividualReportViewProps {
  currentProfileMember: MemberStats;
  memberStats: MemberStats[];
  onSelectMember: (assigneeId: string) => void;
  briefs: BriefTaskLike[];
  onOpenTaskModal?: (brief: BriefTaskLike) => void;
  memberProfiles?: Map<string, MemberProfile>;
  executiveMembers?: MemberProfile[];
}

// Preset color palette for categories and client teams
const CHART_COLORS = [
  '#0284c7', // Sky Blue
  '#ea580c', // Rams Orange
  '#059669', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#64748b', // Slate
];

export default function IndividualReportView({
  currentProfileMember,
  memberStats,
  onSelectMember,
  briefs,
  onOpenTaskModal,
  memberProfiles,
  executiveMembers,
}: IndividualReportViewProps) {
  // Local state
  const [speedTab, setSpeedTab] = useState<'fastest' | 'slowest'>('fastest');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending'>('all');
  const [taskRoleFilter, setTaskRoleFilter] = useState<'all' | 'owner' | 'assistant'>('all');
  const [pacingMetricFilter, setPacingMetricFilter] = useState<'all' | 'R' | 'TIP'>('all');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMessage, setDispatchSuccessMessage] = useState<string | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Compute OKR / KR / R / TIP Pacing & Alerts for this member
  const pacingSummary = useMemo<MemberPacingSummary>(() => {
    const settings = getStoredOKRSettings();
    return computeMemberPacingAlerts(
      currentProfileMember.assignee_id,
      currentProfileMember.name,
      settings,
      briefs,
      currentProfileMember.unit
    );
  }, [currentProfileMember.assignee_id, currentProfileMember.name, currentProfileMember.unit, briefs]);

  const filteredPacingMetrics = useMemo(() => {
    if (pacingMetricFilter === 'all') return pacingSummary.metrics;
    return pacingSummary.metrics.filter((m) => m.type === pacingMetricFilter);
  }, [pacingSummary, pacingMetricFilter]);

  // Resolved Member Formal Profile (real name, official title, phone)
  const currentMemberProfile = useMemo(() => {
    return memberProfiles?.get(currentProfileMember.assignee_id);
  }, [memberProfiles, currentProfileMember.assignee_id]);

  // Sorted member list: 1. หัวหน้า (จ๊อบ AA), 2. ผู้ช่วย (วา WK), 3. Creative, 4. Content, 5. PR
  const sortedMemberList = useMemo(() => {
    const getRank = (m: MemberStats) => {
      const name = m.name || '';
      if (name.includes('จ๊อบ')) return 1;
      if (name.includes('วา')) return 2;
      const u = (m.unit || '').toLowerCase();
      if (u.includes('creative')) return 3;
      if (u.includes('content')) return 4;
      if (u.includes('pr')) return 5;
      return 6;
    };
    return [...memberStats].sort((a, b) => {
      const diff = getRank(a) - getRank(b);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'th');
    });
  }, [memberStats]);

  // Compute Member Intelligence & Specialization Profile (Frequent tasks, Best performances, Client team affinity, Top co-workers)
  const memberIntelligenceProfile = useMemo(() => {
    if (!currentProfileMember) return null;
    const assigneesList = memberStats.map((m) => ({
      id: m.assignee_id,
      name: m.name,
      unit: m.unit,
    }));
    return computeMemberIntelligenceProfile(briefs, currentProfileMember.assignee_id, assigneesList);
  }, [currentProfileMember, briefs, memberStats]);

  // 4 Key Personal Management Insights (Continuity, Value per task, Support ratio, Personal peak)
  const personalWorkloadInsight = useMemo(() => {
    if (!currentProfileMember) return null;
    const assigneesList = memberStats.map((m) => ({
      id: m.assignee_id,
      name: m.name,
      unit: m.unit,
    }));
    const insights = computeTeamWorkloadInsights({
      briefs,
      assignees: assigneesList,
      memberStats: [currentProfileMember],
      weeksToObserve: 16,
    });
    return insights.memberInsights[0] || null;
  }, [currentProfileMember, briefs, memberStats]);

  // Compute all tasks for this member with rich timeline duration breakdown
  const memberTasksWithDetails: TaskWithDuration[] = useMemo(() => {
    if (!currentProfileMember) return [];
    const now = Date.now();
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;
    const assigneeId = currentProfileMember.assignee_id;

    return briefs
      .map((brief) => {
        const assistants = brief.details?.assistants || [];
        const isOwner = brief.assignee_id === assigneeId;
        const assistantMatch = assistants.find((a: any) => a.assignee_id === assigneeId);

        if (!isOwner && !assistantMatch) return null;

        // Role & percentage
        let percentage = 100;
        let role: 'owner' | 'assistant' = 'owner';
        if (isOwner) {
          const totalAssistantPct = assistants.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0);
          percentage = Math.max(0, 100 - totalAssistantPct);
        } else if (assistantMatch) {
          role = 'assistant';
          percentage = Number(assistantMatch.percentage) || 0;
        }

        const totalCost = Number(brief.details?.save_cost || brief.details?.revenue || 0);
        const shareBaht = Math.round((totalCost * percentage) / 100);

        // Timeline milestones
        const createdTime = brief.created_at ? new Date(brief.created_at).getTime() : now;
        const inProgressTime = brief.in_progress_at ? new Date(brief.in_progress_at).getTime() : null;
        const completedTime = brief.completed_at ? new Date(brief.completed_at).getTime() : null;
        
        const deadlineStr = brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
        const deadlineTime = deadlineStr ? new Date(deadlineStr).getTime() : null;

        // Status duration breakdown:
        // 1. Pending duration (รอเริ่ม):
        let pendingDays = 0;
        if (inProgressTime && inProgressTime >= createdTime) {
          pendingDays = Number(((inProgressTime - createdTime) / ONE_DAY_MS).toFixed(1));
        } else if (completedTime && completedTime >= createdTime) {
          pendingDays = 0; // bypassed directly to complete
        } else if (brief.status === 'pending') {
          pendingDays = Number(((now - createdTime) / ONE_DAY_MS).toFixed(1));
        }

        // 2. In Progress duration (กำลังทำ):
        let inProgressDays = 0;
        const activeStartTime = inProgressTime || createdTime;
        if (brief.status === 'completed' && completedTime) {
          inProgressDays = Number((Math.max(0.1, (completedTime - activeStartTime) / ONE_DAY_MS)).toFixed(1));
        } else if (brief.status === 'in_progress') {
          inProgressDays = Number((Math.max(0.1, (now - activeStartTime) / ONE_DAY_MS)).toFixed(1));
        }

        // 3. Total turnaround duration:
        let totalDurationDays = 0;
        if (brief.status === 'completed' && completedTime) {
          totalDurationDays = Number(((completedTime - createdTime) / ONE_DAY_MS).toFixed(1));
          if (totalDurationDays <= 0) totalDurationDays = inProgressDays || 0.5;
        } else {
          totalDurationDays = Number(((now - createdTime) / ONE_DAY_MS).toFixed(1));
        }

        // Deadline check
        let isOnTime: boolean | null = null;
        if (deadlineTime) {
          if (brief.status === 'completed' && completedTime) {
            isOnTime = completedTime <= deadlineTime + 86400000;
          } else {
            isOnTime = now <= deadlineTime + 86400000;
          }
        }

        // Category & Client Team
        const category = brief.details?.category || brief.details?.type || brief.details?.service || 'งานทั่วไป';
        const clientTeam = brief.details?.team || brief.details?.customer_team || brief.details?.client || 'ทีมทั่วไป';

        return {
          brief,
          role,
          percentage,
          shareBaht,
          totalTaskCost: totalCost,
          createdTime,
          inProgressTime,
          completedTime,
          deadlineTime,
          pendingDays: Math.max(0, pendingDays),
          inProgressDays: Math.max(0.1, inProgressDays),
          totalDurationDays: Math.max(0.2, totalDurationDays),
          isCompleted: brief.status === 'completed',
          isOnTime,
          category,
          clientTeam,
        };
      })
      .filter(Boolean) as TaskWithDuration[];
  }, [currentProfileMember, briefs]);

  // 1. TOP 10 FASTEST & TOP 10 SLOWEST TASKS (Completed tasks)
  const completedTasks = useMemo(() => {
    return memberTasksWithDetails.filter((t) => t.isCompleted);
  }, [memberTasksWithDetails]);

  const top10Fastest = useMemo(() => {
    return [...completedTasks]
      .sort((a, b) => a.totalDurationDays - b.totalDurationDays)
      .slice(0, 10);
  }, [completedTasks]);

  const top10Slowest = useMemo(() => {
    return [...completedTasks]
      .sort((a, b) => b.totalDurationDays - a.totalDurationDays)
      .slice(0, 10);
  }, [completedTasks]);

  // 2. WEEKLY & MONTHLY VELOCITY (งานสำเร็จต่อสัปดาห์ / ต่อเดือน)
  const velocityMetrics = useMemo(() => {
    if (completedTasks.length === 0) {
      return {
        avgPerWeek: 0,
        avgPerMonth: 0,
        peakWeekCount: 0,
        peakMonthCount: 0,
        weeklyData: [] as { label: string; count: number; countBaht: number }[],
        monthlyData: [] as { label: string; count: number; countBaht: number }[],
      };
    }

    const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;
    const now = Date.now();

    // Group by last 8 weeks
    const weekBuckets: { [key: string]: { count: number; countBaht: number; label: string } } = {};
    for (let i = 7; i >= 0; i--) {
      const key = `w-${i}`;
      weekBuckets[key] = {
        count: 0,
        countBaht: 0,
        label: i === 0 ? 'สัปดาห์นี้' : `${i} สัปดาห์ก่อน`,
      };
    }

    // Group by last 6 months
    const monthBuckets: { [key: string]: { count: number; countBaht: number; label: string } } = {};
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const curDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets[key] = {
        count: 0,
        countBaht: 0,
        label: `${monthNames[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`,
      };
    }

    let earliestTime = now;

    completedTasks.forEach((t) => {
      const time = t.completedTime || t.createdTime;
      if (time < earliestTime) earliestTime = time;

      // Week calculation
      const diffWeeks = Math.floor((now - time) / ONE_WEEK_MS);
      if (diffWeeks >= 0 && diffWeeks <= 7) {
        const key = `w-${diffWeeks}`;
        if (weekBuckets[key]) {
          weekBuckets[key].count += 1;
          weekBuckets[key].countBaht += t.shareBaht;
        }
      }

      // Month calculation
      const d = new Date(time);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets[mKey]) {
        monthBuckets[mKey].count += 1;
        monthBuckets[mKey].countBaht += t.shareBaht;
      }
    });

    const activeWeeks = Math.max(1, Math.ceil((now - earliestTime) / ONE_WEEK_MS));
    const activeMonths = Math.max(1, Math.ceil(activeWeeks / 4.33));

    const avgPerWeek = Number((completedTasks.length / activeWeeks).toFixed(1));
    const avgPerMonth = Number((completedTasks.length / activeMonths).toFixed(1));

    const weeklyData = Object.values(weekBuckets);
    const monthlyData = Object.values(monthBuckets);

    const peakWeekCount = Math.max(0, ...weeklyData.map((w) => w.count));
    const peakMonthCount = Math.max(0, ...monthlyData.map((m) => m.count));

    return {
      avgPerWeek,
      avgPerMonth,
      peakWeekCount,
      peakMonthCount,
      weeklyData,
      monthlyData,
    };
  }, [completedTasks]);

  // 3. PIE CHART DATA: CATEGORY BREAKDOWN (%)
  const categoryChartData: DonutSegment[] = useMemo(() => {
    const map: { [key: string]: { count: number; saveCost: number } } = {};
    memberTasksWithDetails.forEach((t) => {
      const cat = t.category || 'งานทั่วไป';
      if (!map[cat]) map[cat] = { count: 0, saveCost: 0 };
      map[cat].count += 1;
      map[cat].saveCost += t.shareBaht;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);
    return sorted.map(([cat, val], idx) => ({
      key: cat,
      label: cat,
      value: val.count,
      secondaryValue: `฿${val.saveCost.toLocaleString()}`,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [memberTasksWithDetails]);

  // 4. PIE CHART DATA: CLIENT TEAM AFFINITY (%)
  const teamChartData: DonutSegment[] = useMemo(() => {
    const map: { [key: string]: { count: number; saveCost: number } } = {};
    memberTasksWithDetails.forEach((t) => {
      const team = t.clientTeam || 'ทีมทั่วไป';
      if (!map[team]) map[team] = { count: 0, saveCost: 0 };
      map[team].count += 1;
      map[team].saveCost += t.shareBaht;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);
    return sorted.map(([team, val], idx) => ({
      key: team,
      label: team,
      value: val.count,
      secondaryValue: `฿${val.saveCost.toLocaleString()}`,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [memberTasksWithDetails]);

  // 5. FILTERED TASKS LIST
  const filteredTaskList = useMemo(() => {
    return memberTasksWithDetails
      .filter((t) => {
        // Search
        if (taskSearchQuery.trim()) {
          const q = taskSearchQuery.toLowerCase();
          const matchName = (t.brief.project_name || '').toLowerCase().includes(q);
          const matchCode = (t.brief.details?.project_code || '').toLowerCase().includes(q);
          const matchCat = (t.category || '').toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchCat) return false;
        }

        // Status
        if (taskStatusFilter !== 'all' && t.brief.status !== taskStatusFilter) {
          return false;
        }

        // Role
        if (taskRoleFilter !== 'all' && t.role !== taskRoleFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Priority 1: Status order (in_progress -> pending -> completed)
        const statusWeight: Record<string, number> = {
          in_progress: 1,
          pending: 2,
          completed: 3,
        };
        const weightA = statusWeight[a.brief.status] || 99;
        const weightB = statusWeight[b.brief.status] || 99;
        if (weightA !== weightB) return weightA - weightB;

        // Priority 2: Date descending (newest projects first)
        const dateA = a.brief.created_at ? new Date(a.brief.created_at).getTime() : 0;
        const dateB = b.brief.created_at ? new Date(b.brief.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [memberTasksWithDetails, taskSearchQuery, taskStatusFilter, taskRoleFilter]);

  // Performance grade computation
  const performanceGrade = useMemo(() => {
    const rate = currentProfileMember.onTimeRate || 0;
    const count = currentProfileMember.completedTasks || 0;
    if (rate >= 90 && count >= 10) return { grade: 'A+', label: 'ยอดเยี่ยมระดับแนวหน้า (Exceptional)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (rate >= 80 && count >= 5) return { grade: 'A', label: 'ดีเยี่ยมตรงเวลา (High Performer)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (rate >= 70) return { grade: 'B+', label: 'ได้มาตรฐาน (Solid Consistent)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'B', label: 'กำลังพัฒนาประสิทธิภาพ (Developing)', color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }, [currentProfileMember]);

  // Handle PDF Export
  const handleSavePdf = () => {
    window.print();
  };

  // Handle Monthly Report Auto-Dispatch Simulation
  const handleTestDispatch = async () => {
    setIsDispatching(true);
    setDispatchSuccessMessage(null);

    try {
      const curMonth = new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' });
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'monthly_individual_report',
          memberName: currentProfileMember.name,
          memberFullName: currentMemberProfile?.fullName || currentProfileMember.name,
          memberPosition: currentMemberProfile?.position || '-',
          memberPhone: currentMemberProfile?.phone || '-',
          memberEmail: currentMemberProfile?.email,
          memberUnit: currentProfileMember.unit,
          monthYear: curMonth,
          executives: (executiveMembers || []).map((e) => ({
            name: e.name,
            fullName: e.fullName,
            position: e.position,
            phone: e.phone,
            email: e.email,
          })),
          stats: {
            totalSaveCost: currentProfileMember.totalSaveCost,
            completedTasks: currentProfileMember.completedTasks,
            onTimeRate: currentProfileMember.onTimeRate,
            avgTurnaroundDays: currentProfileMember.avgTurnaroundDays,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDispatchSuccessMessage(
          `ระบบได้จัดส่งรายงานสรุปผลงานของ ${currentMemberProfile?.fullName || currentProfileMember.name} ไปยังเจ้าของรายงาน, หัวหน้าทีม และคณะผู้บริหารเรียบร้อยแล้ว!`
        );
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      setDispatchSuccessMessage('ส่งรายงานสำเร็จ (Simulated Notification Dispatched)');
    } finally {
      setIsDispatching(false);
    }
  };

  const uStyle = UNIT_LABELS[currentProfileMember.unit?.toLowerCase()] || UNIT_LABELS.other;

  return (
    <div className="flex flex-col gap-6 printable-report animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* PRINT-ONLY FORMAL HEADER (แสดงตามรูปแบบทางการเมื่อ Save PDF / Print) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print-only mb-6 border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-black text-slate-950 leading-tight">
          <div>รายงานสรุปผลงานและประสิทธิภาพรายบุคคล</div>
          <div className="text-base font-bold text-slate-600 mt-1">(Individual Performance & Efficiency)</div>
        </h1>
        <div className="flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
          <span>ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
          <span>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTION BAR & MEMBER SELECTOR (ซ่อนตอนพิมพ์) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-surface-border shadow-2xs no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">รายงาน:</span>
            <span className="text-xs font-semibold text-muted">
              รายงานสรุปผลงานและประสิทธิภาพรายบุคคล • ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-surface-border hidden sm:block" />
          <span className="text-xs font-bold text-foreground">เลือกดูโปรไฟล์:</span>
          <select
            value={currentProfileMember.assignee_id}
            onChange={(e) => onSelectMember(e.target.value)}
            className="bg-surface border border-surface-border text-xs rounded-full px-4 py-2 font-bold text-foreground shadow-2xs cursor-pointer focus:outline-none focus:border-primary transition-all hover:border-slate-400"
          >
            {sortedMemberList.map((m) => (
              <option key={m.assignee_id} value={m.assignee_id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Button: Save PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSavePdf}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center gap-2 print:hidden cursor-pointer"
          >
            <Download size={14} />
            <span>Save PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFILE CARD HEADER & 4 EXECUTIVE PILLARS */}
      {/* ========================================================================= */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs relative overflow-hidden page-break-avoid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-surface-border">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900">
                {currentMemberProfile?.fullName ? currentMemberProfile.fullName : currentProfileMember.name}
              </h2>
              {currentMemberProfile?.fullName && (
                <span className="text-sm font-semibold text-slate-500">
                  ({currentProfileMember.name})
                </span>
              )}
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                {currentProfileMember.unit} Unit
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {performanceGrade.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
              {currentMemberProfile?.position && (
                <span className="font-medium text-slate-700">
                  ตำแหน่ง: <strong className="font-semibold text-slate-900">{currentMemberProfile.position}</strong>
                </span>
              )}
              {currentMemberProfile?.phone && (
                <span className="text-slate-500">
                  โทร: <span className="font-mono text-slate-700 font-medium">{currentMemberProfile.phone}</span>
                </span>
              )}
              {currentMemberProfile?.email && (
                <span className="text-slate-500">
                  อีเมล: <span className="font-mono text-slate-700">{currentMemberProfile.email}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ผู้ปฏิบัติงานหลักและผู้ช่วยร่วมขับเคลื่อนมูลค่าโครงการ CC TEAM
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-5 py-3 text-right shrink-0">
            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Save Cost สะสมทั้งหมด</div>
            <div className="text-2xl font-black font-mono text-emerald-700">
              ฿{currentProfileMember.totalSaveCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              จาก {currentProfileMember.totalTasksInvolved} โครงการที่เกี่ยวข้อง
            </div>
          </div>
        </div>

        {/* 4 Pillars of Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          {/* Workload Split */}
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-surface-border/60">
            <div className="text-[11px] text-slate-500 font-medium mb-1">งานหลัก vs งานช่วย</div>
            <div className="text-lg font-bold text-slate-800 font-mono">
              {currentProfileMember.ownerTaskCount} <span className="text-xs text-slate-400 font-normal">หลัก</span> / {currentProfileMember.assistantTaskCount} <span className="text-xs text-slate-400 font-normal">ช่วย</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              รวม {currentProfileMember.totalTasksInvolved} ชิ้นงาน
            </div>
          </div>

          {/* Assistant Value */}
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-surface-border/60">
            <div className="text-[11px] text-slate-500 font-medium mb-1">Save Cost งานช่วย (Cross-Skill)</div>
            <div className="text-lg font-bold text-amber-700 font-mono">
              ฿{currentProfileMember.assistantSaveCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ({currentProfileMember.totalSaveCost > 0 ? Math.round((currentProfileMember.assistantSaveCost / currentProfileMember.totalSaveCost) * 100) : 0}% ของผลงานรวม)
            </div>
          </div>

          {/* Turnaround Time */}
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-surface-border/60">
            <div className="text-[11px] text-slate-500 font-medium mb-1">ความเร็วเฉลี่ย (Turnaround)</div>
            <div className="text-lg font-bold text-blue-700 font-mono">
              {currentProfileMember.avgTurnaroundDays > 0 ? `${currentProfileMember.avgTurnaroundDays} วัน` : "-"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              เร็วสุด {currentProfileMember.fastestDays ?? "-"}d / นานสุด {currentProfileMember.slowestDays ?? "-"}d
            </div>
          </div>

          {/* On-time Delivery */}
          <div className="p-3.5 bg-muted/20 rounded-2xl border border-surface-border/60">
            <div className="text-[11px] text-slate-500 font-medium mb-1">อัตราส่งมอบตรงเวลา (On-Time)</div>
            <div className="text-lg font-bold text-emerald-700 font-mono">
              {currentProfileMember.onTimeRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentProfileMember.lateCompletedCount > 0 ? `ล่าช้า ${currentProfileMember.lateCompletedCount} งาน` : "ส่งตรงเวลา 100%"}
            </div>
          </div>
        </div>

        {/* SWOT ANALYSIS & ACTION PLANS 1 2 3 (คงไว้ในการ์ดโปรไฟล์เหมือนเดิมครบถ้วน) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-surface-border">
          {/* Strengths */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              จุดเด่นและสิ่งที่ทำได้ดีเยี่ยม (Strengths)
            </h4>
            <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
              {currentProfileMember.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              จุดอ่อนหรือคอขวดที่ต้องเฝ้าระวัง (Weaknesses & Bottlenecks)
            </h4>
            <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
              {currentProfileMember.weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Steps 1 2 3 */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-600" />
              แนวทางการจัดการที่ควรปฏิบัติ (Action Steps 1, 2, 3)
            </h4>
            <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
              {currentProfileMember.actionSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Impacts 1 2 3 */}
          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-rose-600" />
              ความเสี่ยงที่จะตามมา หากไม่รีบปรับปรุง (Risk Impacts 1, 2, 3)
            </h4>
            <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
              {currentProfileMember.riskImpacts.map((risk, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">⚠️</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Member Intelligence & Specialization Profile (คงไว้ครบทั้ง 4 ส่วน: งานที่ทำเยอะสุด, งานที่ทำได้ดี, ทีมที่ร่วมงานบ่อย, คู่หูที่ร่วมงานบ่อย) */}
      {memberIntelligenceProfile && (
        <div className="page-break-avoid">
          <MemberSpecializationCard
            profile={memberIntelligenceProfile}
            memberName={currentProfileMember.name}
            memberUnit={currentProfileMember.unit}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: OKRS / KR / R & KPI / TIP PACING & REGULAR ALERTS */}
      {/* ========================================================================= */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs space-y-5 page-break-avoid">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#E03131] text-white shadow-2xs">
              <Target size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 flex-wrap">
                เป้าหมาย OKRs / KR / R และ KPI / TIP ประจำตัว
                <span className="text-xs font-normal text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {pacingSummary.fiscalPeriodLabel} • ไตรมาส Q{pacingSummary.currentQuarter}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ⚡ สัปดาห์นี้ทำได้ {pacingSummary.totalTasksThisWeek} งาน • เดือนนี้ทำได้ {pacingSummary.totalTasksThisMonth} งาน
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ติดตามสัดส่วนความรับผิดชอบ %, เป้าหมายประจำปีงบประมาณ หารเฉลี่ยรายเดือน (÷12) และรายไตรมาส (÷4)
              </p>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setPacingMetricFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                pacingMetricFilter === 'all' ? 'bg-surface text-foreground shadow-2xs font-black border border-surface-border' : 'text-muted hover:text-foreground'
              }`}
            >
              ทั้งหมด ({pacingSummary.metrics.length})
            </button>
            <button
              onClick={() => setPacingMetricFilter('R')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                pacingMetricFilter === 'R' ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-2xs font-black border border-surface-border' : 'text-muted hover:text-foreground'
              }`}
            >
              🎯 KR / R ({pacingSummary.metrics.filter((m) => m.type === 'R').length})
            </button>
            <button
              onClick={() => setPacingMetricFilter('TIP')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                pacingMetricFilter === 'TIP' ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-2xs font-black border border-surface-border' : 'text-muted hover:text-foreground'
              }`}
            >
              ✨ KPI / TIP ({pacingSummary.metrics.filter((m) => m.type === 'TIP').length})
            </button>
          </div>
        </div>

        {/* Regular Performance Alert Banner */}
        {pacingSummary.monthlyBehindCount + pacingSummary.quarterlyBehindCount > 0 ? (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </span>
              <div>
                <div className="text-sm font-black text-rose-950 flex items-center gap-2">
                  แจ้งเตือนความเร็วเป้าหมาย: พบตัวชี้วัดที่ต่ำกว่าเกณฑ์สะสม (Behind Target)
                  <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-xs font-bold font-mono">
                    {pacingSummary.monthlyBehindCount + pacingSummary.quarterlyBehindCount} ตัวชี้วัด
                  </span>
                </div>
                <div className="text-xs text-rose-800 mt-1">
                  กรุณาเร่งความเร็วในการส่งมอบชิ้นงานให้สอดคล้องกับเป้าหมายรายเดือน เพื่อป้องกันการหลุดเป้าหมายประจำไตรมาส Q{pacingSummary.currentQuarter}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {pacingSummary.monthlyBehindCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-200 text-rose-900 text-xs font-black">
                  เดือน: ล่าช้า {pacingSummary.monthlyBehindCount}
                </span>
              )}
              {pacingSummary.quarterlyBehindCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-300 text-rose-950 text-xs font-black">
                  ไตรมาส: ล่าช้า {pacingSummary.quarterlyBehindCount}
                </span>
              )}
            </div>
          </div>
        ) : pacingSummary.monthlyAtRiskCount + pacingSummary.quarterlyAtRiskCount > 0 ? (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </span>
              <div>
                <div className="text-sm font-black text-amber-950 flex items-center gap-2">
                  เฝ้าระวังเป้าหมาย: มีตัวชี้วัดที่ใกล้หลุดเกณฑ์เป้าหมายสะสม (At Risk)
                  <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-xs font-bold font-mono">
                    {pacingSummary.monthlyAtRiskCount + pacingSummary.quarterlyAtRiskCount} ตัวชี้วัด
                  </span>
                </div>
                <div className="text-xs text-amber-800 mt-1">
                  ผลงานสะสมคิดเป็น 70-99% ของเกณฑ์ที่ควรจะทำได้ตามรอบเวลาปีงบประมาณ
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 text-xs font-bold">
                เสี่ยงหลุดเป้า {pacingSummary.monthlyAtRiskCount + pacingSummary.quarterlyAtRiskCount} รายการ
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <CheckCircle2 size={16} />
              </span>
              <div className="text-xs font-bold text-emerald-950">
                สถานะดีเยี่ยม: ทุกตัวชี้วัดผลงานดำเนินการสอดคล้องตามเป้าหมายของเดือนและไตรมาส (All Metrics On Track)
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              100% On Track
            </span>
          </div>
        )}

        {/* Metrics Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredPacingMetrics.map((m) => {
            const formatVal = (v: number, isLarge = false) => {
              if (m.isCurrency) return <>฿{v.toLocaleString()}</>;
              if (m.isSatisfaction) return <>{v.toFixed(1)}%</>;
              const numStr = Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1);
              const isReach = m.code === 'R5' || m.name.toLowerCase().includes('reach');
              const isEng = m.code === 'R6' || m.name.toLowerCase().includes('engagement');
              if (isReach || isEng) {
                const tinyUnit = isReach ? 'reach' : 'eng.';
                return (
                  <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap">
                    <span>{numStr}</span>
                    <span className={`${isLarge ? 'text-[11px]' : 'text-[8.5px]'} font-normal text-slate-400 font-sans tracking-tight`}>
                      {tinyUnit}
                    </span>
                  </span>
                );
              }
              return (
                <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap">
                  <span>{numStr}</span>
                  <span className={`${isLarge ? 'text-xs' : 'text-[9.5px]'} font-normal text-slate-400 font-sans`}>
                    {m.unit}
                  </span>
                </span>
              );
            };

            const statusBadge = (st: 'on_track' | 'at_risk' | 'behind', labelPrefix: string) => {
              if (st === 'on_track') {
                return (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {labelPrefix}: ตามเป้า
                  </span>
                );
              }
              if (st === 'at_risk') {
                return (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300/80 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {labelPrefix}: เสี่ยง
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300/80 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {labelPrefix}: ต่ำเป้า
                </span>
              );
            };

            return (
              <div
                key={m.code}
                className={`p-4 rounded-2xl border transition-all ${
                  m.monthlyStatus === 'behind' || m.quarterlyStatus === 'behind'
                    ? 'bg-rose-50/40 border-rose-200'
                    : m.monthlyStatus === 'at_risk' || m.quarterlyStatus === 'at_risk'
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                } shadow-2xs space-y-3`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-xs font-black font-mono rounded-lg ${
                        m.type === 'R' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {m.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {m.isSatisfaction ? 'เกณฑ์ทุกคน 85%' : `รับผิดชอบ ${m.allocationPct}%`}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-2" title={m.name}>
                      {m.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block">ผลงานจริงสะสม</span>
                    <span className="text-base font-black font-mono text-slate-900 leading-tight">
                      {formatVal(m.actualAchieved)}
                    </span>
                  </div>
                </div>

                {/* Prominent Annual Target Box */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/40 border border-emerald-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        เป้าหมายทั้งปีงบประมาณ (Target)
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 leading-tight">
                        {formatVal(m.annualTarget, true)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        บรรลุเป้าหมาย
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 leading-tight">
                        {m.annualTarget > 0 ? Math.min(100, Math.round((m.actualAchieved / m.annualTarget) * 100)) : (m.allocationPct === 0 ? 100 : 0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-emerald-100/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.monthlyStatus === 'behind' || m.quarterlyStatus === 'behind'
                          ? 'bg-rose-500'
                          : m.monthlyStatus === 'at_risk' || m.quarterlyStatus === 'at_risk'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{
                        width: `${m.annualTarget > 0 ? Math.min(100, Math.round((m.actualAchieved / m.annualTarget) * 100)) : (m.allocationPct === 0 ? 100 : 0)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Weekly & Monthly Actual Progress Ribbon */}
                <div className="flex items-center justify-between text-xs bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0">สัปดาห์นี้ทำได้:</span>
                    <span className="font-mono font-black text-slate-900">{formatVal(m.actualThisWeek)}</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0">เดือนนี้ทำได้:</span>
                    <span className="font-mono font-black text-blue-700">{formatVal(m.actualThisMonth)}</span>
                  </div>
                </div>

                {/* 2-Pillar Breakdown: เดือน (÷12) / ไตรมาส (÷4) ตามปีงบประมาณ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100/80">
                  {/* 1. Monthly Target (÷12) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-600 shrink-0" title="เป้าเฉลี่ยต่อเดือน (เป้าทั้งปี ÷ 12)">
                        เป้าเดือน (÷12)
                      </span>
                      {statusBadge(m.monthlyStatus, 'M')}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-[10px] text-slate-400 font-sans shrink-0">ทำได้เดือนนี้:</span>
                        <span className="font-black text-slate-900 text-right">{formatVal(m.actualThisMonth)}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-mono pt-0.5 border-t border-slate-200/40">
                        <span className="text-[10px] text-slate-400 font-sans shrink-0">เป้าเฉลี่ย:</span>
                        <span className="font-bold text-slate-600 text-right">{formatVal(m.monthlyTarget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Quarterly Target (÷4) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-600 shrink-0" title={`เป้าเฉลี่ยต่อไตรมาส (เป้าทั้งปี ÷ 4) - Q${pacingSummary.currentQuarter}`}>
                        เป้าไตรมาส Q{pacingSummary.currentQuarter} (÷4)
                      </span>
                      {statusBadge(m.quarterlyStatus, 'Q')}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-[10px] text-slate-400 font-sans shrink-0">ทำได้ไตรมาส:</span>
                        <span className="font-black text-slate-900 text-right">{formatVal(m.actualThisQuarter)}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-mono pt-0.5 border-t border-slate-200/40">
                        <span className="text-[10px] text-slate-400 font-sans shrink-0">เป้าเฉลี่ย:</span>
                        <span className="font-bold text-slate-600 text-right">{formatVal(m.quarterlyTarget)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notes */}
        <div className="pt-2 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>*{pacingSummary.fiscalPeriodLabel}: คำนวณเป้าหมายหารเฉลี่ยตามสัดส่วน รายเดือน (÷12 เดือน) และรายไตรมาส (÷4 ไตรมาส)</span>
          <span className="text-emerald-700 font-semibold">*เกณฑ์ความพึงพอใจมาตรฐาน 85.0% ทุกคน (ไม่ตกแม้ไม่ได้ทำแบบประเมิน)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 PERSONAL MANAGEMENT METRICS (Continuity, Value, Support, Peak) */}
      {/* ========================================================================= */}
      {personalWorkloadInsight && (
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs page-break-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                <span>4 มิติการบริหารและกระจายงานส่วนบุคคล (Workload & Capacity Balance)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                วิเคราะห์ความต่อเนื่อง การส่งมอบงาน การกระจายงาน และช่วงงานหนาแน่นของ {currentProfileMember.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                รอบการวิเคราะห์: {personalWorkloadInsight.totalWeeksObserved} สัปดาห์
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. Personal Workload Continuity */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      1. ความต่อเนื่องของงาน
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Workload Flow</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      เกณฑ์วัด: มีงานต่อเนื่อง {personalWorkloadInsight.consecutiveActiveWeeks} สัปดาห์
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Activity size={16} />
                  </span>
                </div>

                {/* Pressure Gauge Meter for Continuity */}
                <PressureGaugeMeter
                  value={Math.min(95, Math.max(15, Math.round(
                    personalWorkloadInsight.consecutiveActiveWeeks <= 2 
                      ? (personalWorkloadInsight.consecutiveActiveWeeks / 2) * 33.33 
                      : personalWorkloadInsight.consecutiveActiveWeeks <= 4 
                      ? 33.33 + ((personalWorkloadInsight.consecutiveActiveWeeks - 2) / 2) * 33.34 
                      : 66.67 + Math.min(28, ((personalWorkloadInsight.consecutiveActiveWeeks - 4) / 4) * 28)
                  )))}
                  leftLabel="ผ่อนคลาย"
                  midLabel="สม่ำเสมอ"
                  rightLabel="ล้นมือ!"
                  needleColor={personalWorkloadInsight.burnoutRiskLevel === 'critical' ? '#ef4444' : personalWorkloadInsight.continuityRate >= 60 ? '#f59e0b' : '#10b981'}
                />

                {/* Status Box */}
                <div className="mt-1">
                  {personalWorkloadInsight.burnoutRiskLevel === 'critical' ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-rose-100/70 border border-rose-200 text-rose-900 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🔴 ระดับ 3: ความดันสูง</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(เสี่ยงหมดไฟ)</div>
                      </div>
                      <span className="text-[10px] text-rose-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>งานต่อเนื่อง {personalWorkloadInsight.consecutiveActiveWeeks} สัปดาห์ติดต่อกัน</span>
                    </div>
                  ) : personalWorkloadInsight.continuityRate >= 60 ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-amber-100/70 border border-amber-200 text-amber-900 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟡 ระดับ 2: งานเข้าต่อเนื่อง</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(สม่ำเสมอ)</div>
                      </div>
                      <span className="text-[10px] text-amber-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>มีงาน {personalWorkloadInsight.activeWeeksCount} จาก {personalWorkloadInsight.totalWeeksObserved} สัปดาห์</span>
                    </div>
                  ) : (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-100/70 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🟢 ระดับ 1: ผ่อนคลาย</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(งานไม่สะสม)</div>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>มีจังหวะสลับพักหายใจ โหลดงานไม่สะสมล้นมือ</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 space-y-1 text-xs">
                <div className="text-[10px] text-slate-600 bg-white/80 rounded px-2 py-1 flex items-center justify-between border border-slate-200/60">
                  <span>ปริมาณงานเฉลี่ย:</span>
                  <strong className="font-bold text-emerald-700">ทำงานเหมาะสม ~{personalWorkloadInsight.weeklyAverageTasks} ชิ้น/สัปดาห์</strong>
                </div>
              </div>
            </div>

            {/* 2. Value per Task */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      2. เกจสร้างมูลค่าผลงาน
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Impact vs Volume</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      เกณฑ์วัด: Save Cost เฉลี่ยต่องาน
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Gem size={16} />
                  </span>
                </div>

                {/* Pressure Gauge Meter for Value */}
                <PressureGaugeMeter
                  value={Math.min(95, Math.max(15, Math.round(
                    personalWorkloadInsight.avgValuePerTask <= 30000 
                      ? (personalWorkloadInsight.avgValuePerTask / 30000) * 33.33 
                      : personalWorkloadInsight.avgValuePerTask <= 120000 
                      ? 33.33 + ((personalWorkloadInsight.avgValuePerTask - 30000) / 90000) * 33.34 
                      : 66.67 + Math.min(28, ((personalWorkloadInsight.avgValuePerTask - 120000) / 180000) * 28)
                  )))}
                  leftLabel="เน้นงานไว"
                  midLabel="สมดุล"
                  rightLabel="โปรเจกต์ใหญ่"
                  colors={["#0284c7", "#8b5cf6", "#059669"]}
                  labelColors={["#0284c7", "#7c3aed", "#059669"]}
                  needleColor="#059669"
                />

                <div className="mt-1">
                  {personalWorkloadInsight.avgValuePerTask >= 120000 ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-100/70 border border-emerald-200 text-emerald-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>💎 สเกลโปรเจกต์ใหญ่</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(High-Impact)</div>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                        เฉลี่ย ฿{personalWorkloadInsight.avgValuePerTask.toLocaleString()}/ชิ้น (เน้นงานสเกลใหญ่)
                      </span>
                    </div>
                  ) : personalWorkloadInsight.avgValuePerTask >= 30000 ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-purple-100/70 border border-purple-200 text-purple-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>⚖️ สเกลงานสมดุล</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(Balanced)</div>
                      </div>
                      <span className="text-[10px] text-purple-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                        เฉลี่ย ฿{personalWorkloadInsight.avgValuePerTask.toLocaleString()}/ชิ้น (สมดุล)
                      </span>
                    </div>
                  ) : (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-sky-100/70 border border-sky-200 text-sky-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🚀 เน้นงานส่งมอบเร็ว</div>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>(High Volume)</div>
                      </div>
                      <span className="text-[10px] text-sky-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>
                        เฉลี่ย ฿{personalWorkloadInsight.avgValuePerTask.toLocaleString()}/ชิ้น (เน้นงานไว)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 space-y-1 text-xs">
                <div className="text-[10px] text-slate-600 bg-white/80 rounded px-2 py-1 flex items-center justify-between border border-slate-200/60">
                  <span>Save Cost รวม:</span>
                  <strong className="font-mono text-emerald-700 font-bold">฿{personalWorkloadInsight.totalSaveCost.toLocaleString()} ({personalWorkloadInsight.totalTasks} งาน)</strong>
                </div>
              </div>
            </div>

            {/* 3. Support Ratio */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      3. เกจสัดส่วนงานช่วย
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Support Ratio</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      เกณฑ์วัด: % งานช่วยเพื่อน
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-amber-50 text-amber-700 border-amber-200">
                    <Users size={16} />
                  </span>
                </div>

                {/* Pressure Gauge Meter for Support */}
                <PressureGaugeMeter
                  value={Math.min(95, Math.max(15, Math.round(
                    personalWorkloadInsight.assistantRatio <= 12 
                      ? (personalWorkloadInsight.assistantRatio / 12) * 33.33 
                      : personalWorkloadInsight.assistantRatio <= 30 
                      ? 33.33 + ((personalWorkloadInsight.assistantRatio - 12) / 18) * 33.34 
                      : 66.67 + Math.min(28, ((personalWorkloadInsight.assistantRatio - 30) / 30) * 28)
                  )))}
                  leftLabel="งานเดี่ยว"
                  midLabel="ร่วมมือพอดี"
                  rightLabel="ช่วยหนักมาก"
                  colors={["#0284c7", "#10b981", "#f59e0b"]}
                  labelColors={["#0284c7", "#059669", "#d97706"]}
                  needleColor="#d97706"
                />

                <div className="mt-1">
                  {personalWorkloadInsight.assistantRatio > 30 ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-amber-100/70 border border-amber-200 text-amber-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🤝 เสาหลักงานช่วย</div>
                      </div>
                      <span className="text-[10px] text-amber-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>ถูกดึงตัวไปเป็นผู้ช่วยบ่อยเป็นพิเศษ</span>
                    </div>
                  ) : personalWorkloadInsight.assistantRatio >= 12 ? (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-emerald-100/70 border border-emerald-200 text-emerald-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🤝 ร่วมมือสมดุล</div>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>ทำงานหลักและช่วยเพื่อนได้ลงตัว</span>
                    </div>
                  ) : (
                    <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-sky-100/70 border border-sky-200 text-sky-950 p-2.5 rounded-xl space-y-0.5">
                      <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                        <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>🎯 เน้นรับผิดชอบงานหลัก</div>
                      </div>
                      <span className="text-[10px] text-sky-700 block mt-0.5 text-center w-full" style={{ textAlign: 'center' }}>งานหลัก {personalWorkloadInsight.ownerTaskCount} งาน</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 space-y-1 text-xs">
                <div className="text-[10px] text-slate-600 bg-white/80 rounded px-2 py-1 flex items-center justify-between border border-slate-200/60">
                  <span>งานหลัก {personalWorkloadInsight.ownerTaskCount} งาน</span>
                  <strong className="text-amber-800 font-bold">ช่วยเพื่อน {personalWorkloadInsight.assistantTaskCount} งาน ({personalWorkloadInsight.assistantRatio}%)</strong>
                </div>
              </div>
            </div>

            {/* 4. Personal Peak Week */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      4. สัปดาห์งานพีคสุด
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Peak Workload</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      เกณฑ์วัด: งานสูงสุดในรอบปี
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs bg-blue-50 text-blue-700 border-blue-200">
                    <TrendingUp size={16} />
                  </span>
                </div>

                {/* Pressure Gauge Meter for Peak */}
                <PressureGaugeMeter
                  value={Math.min(95, Math.max(25, Math.round((personalWorkloadInsight.peakWeekCount || 1) * 15)))}
                  leftLabel="เบาบาง"
                  midLabel="ปกติ"
                  rightLabel="ล้นพิกัด!"
                  needleColor="#2563eb"
                />

                <div className="mt-1">
                  <div className="min-h-[64px] flex flex-col justify-center items-center text-center bg-blue-50 border border-blue-200 text-blue-950 p-2.5 rounded-xl space-y-0.5">
                    <div className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: 'center' }}>
                      <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>⚡ งานชนกันสูงสุด</div>
                      <div className="text-xs font-black text-center w-full leading-tight" style={{ textAlign: 'center' }}>{personalWorkloadInsight.peakWeekCount} งานพร้อมกัน</div>
                    </div>
                    <span className="text-[10px] text-blue-700 truncate block mt-0.5 text-center w-full" title={personalWorkloadInsight.peakWeekLabel} style={{ textAlign: 'center' }}>
                      ช่วงพีค: {personalWorkloadInsight.peakWeekLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 space-y-1 text-xs">
                <div className="text-[10px] text-blue-900 bg-white/80 rounded px-2 py-1 flex items-center justify-between border border-blue-200/60">
                  <span>สถิติงานซ้อนสูงสุด:</span>
                  <strong className="font-bold text-blue-800">{personalWorkloadInsight.peakWeekCount} งานพร้อมกัน</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: WEEKLY & MONTHLY VELOCITY (งานสำเร็จต่อสัปดาห์ / ต่อเดือน) */}
      {/* ========================================================================= */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <span>อัตรางานสำเร็จต่อสัปดาห์และต่อเดือน (Velocity & Delivery Rate)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              สถิติความถี่ในการปิดงานส่งมอบของ {currentProfileMember.name} เพื่อประเมินความสม่ำเสมอในการทำงาน
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">สำเร็จเฉลี่ย/สัปดาห์</div>
              <div className="text-lg font-black font-mono text-emerald-700">
                {velocityMetrics.avgPerWeek} <span className="text-xs font-normal">ชิ้น/สัปดาห์</span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-center">
              <div className="text-[10px] text-blue-800 font-bold uppercase">สำเร็จเฉลี่ย/เดือน</div>
              <div className="text-lg font-black font-mono text-blue-700">
                {velocityMetrics.avgPerMonth} <span className="text-xs font-normal">ชิ้น/เดือน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Velocity Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Weekly Delivery (Last 8 Weeks) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-700">สถิติงานสำเร็จรายสัปดาห์ (ย้อนหลัง 8 สัปดาห์)</span>
              <span className="text-[11px] font-mono text-slate-400">Peak: {velocityMetrics.peakWeekCount} ชิ้น/wk</span>
            </div>
            <div className="grid grid-cols-8 gap-2 items-end h-28 pt-4">
              {velocityMetrics.weeklyData.map((item, idx) => {
                const max = Math.max(1, velocityMetrics.peakWeekCount);
                const heightPct = Math.round((item.count / max) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-emerald-700">
                      {item.count > 0 ? item.count : "-"}
                    </span>
                    <div className="w-full bg-slate-200/80 rounded-t-md h-16 flex items-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t transition-all ${
                          item.count > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-transparent'
                        }`}
                        title={`${item.label}: ${item.count} งาน (฿${item.countBaht.toLocaleString()})`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 truncate w-full text-center" title={item.label}>
                      {idx === 7 ? 'W-นี้' : `W-${7 - idx}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Delivery (Last 6 Months) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-700">สถิติงานสำเร็จรายเดือน (ย้อนหลัง 6 เดือน)</span>
              <span className="text-[11px] font-mono text-slate-400">Peak: {velocityMetrics.peakMonthCount} ชิ้น/mo</span>
            </div>
            <div className="grid grid-cols-6 gap-2.5 items-end h-28 pt-4">
              {velocityMetrics.monthlyData.map((item, idx) => {
                const max = Math.max(1, velocityMetrics.peakMonthCount);
                const heightPct = Math.round((item.count / max) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-blue-700">
                      {item.count > 0 ? item.count : "-"}
                    </span>
                    <div className="w-full bg-slate-200/80 rounded-t-md h-16 flex items-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t transition-all ${
                          item.count > 0 ? 'bg-blue-600 group-hover:bg-blue-700' : 'bg-transparent'
                        }`}
                        title={`${item.label}: ${item.count} งาน (฿${item.countBaht.toLocaleString()})`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: TOP 10 FASTEST & SLOWEST TASKS WITH STATUS STAY BREAKDOWN */}
      {/* ========================================================================= */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs page-break-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <span>ลำดับงานที่ทำเร็วสุด และงานที่ทำนานสุด 10 อันดับ</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              แจกแจงระยะเวลาการทำงาน และระบุชัดเจนว่าสถานะค้างอยู่ที่ขั้นตอนไหนกี่วัน
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center bg-muted/10 p-1 rounded-xl border border-surface-border">
            <button
              onClick={() => setSpeedTab('fastest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                speedTab === 'fastest' ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs border border-surface-border' : 'text-muted hover:text-foreground'
              }`}
            >
              <Zap size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>เร็วสุด 10 อันดับ ({top10Fastest.length})</span>
            </button>
            <button
              onClick={() => setSpeedTab('slowest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                speedTab === 'slowest' ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-xs border border-surface-border' : 'text-muted hover:text-foreground'
              }`}
            >
              <Clock size={13} className="text-amber-600 dark:text-amber-400" />
              <span>นานสุด 10 อันดับ ({top10Slowest.length})</span>
            </button>
          </div>
        </div>

        {/* Top 10 Table */}
        {((speedTab === 'fastest' ? top10Fastest : top10Slowest).length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-400">
            ยังไม่มีข้อมูลงานที่เสร็จสมบูรณ์เพื่อจัดอันดับความเร็ว
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 w-12 text-center">อันดับ</th>
                  <th className="py-2.5 px-3 min-w-[200px]">ชื่อโครงการ / รหัส</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">บทบาท</th>
                  <th className="py-2.5 px-3 text-right">Save Cost</th>
                  <th className="py-2.5 px-3 min-w-[180px]">สถานะค้างที่ขั้นตอนไหน (วัน)</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">เวลารวม</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">การตรงเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(speedTab === 'fastest' ? top10Fastest : top10Slowest).map((task, idx) => {
                  const total = Math.max(0.1, task.pendingDays + task.inProgressDays);
                  const pendingPct = Math.round((task.pendingDays / total) * 100);
                  const inProgressPct = 100 - pendingPct;

                  return (
                    <tr
                      key={task.brief.id}
                      onClick={() => onOpenTaskModal && onOpenTaskModal(task.brief)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 text-center font-bold">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-mono text-xs ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-800 font-black' 
                            : idx === 1 
                            ? 'bg-slate-200 text-slate-700' 
                            : idx === 2 
                            ? 'bg-amber-50 text-amber-900' 
                            : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 hover:text-emerald-700 transition-colors line-clamp-1" title={task.brief.project_name}>
                          {task.brief.project_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>{task.brief.details?.project_code || `CC-${task.brief.id.slice(0, 4).toUpperCase()}`}</span>
                          <span>•</span>
                          <span className="text-slate-500 font-normal">{task.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.role === 'owner' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {task.role === 'owner' ? `งานหลัก (${task.percentage}%)` : `ผู้ช่วย (${task.percentage}%)`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ฿{task.shareBaht.toLocaleString()}
                      </td>

                      {/* Status Stay Duration Bar */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-amber-700 flex items-center gap-1 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                              รอเริ่ม: {task.pendingDays} วัน
                            </span>
                            <span className="text-blue-700 flex items-center gap-1 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                              ทำอยู่: {task.inProgressDays} วัน
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex shadow-inner">
                            <div style={{ width: `${pendingPct}%` }} className="bg-amber-400 h-full" title={`ค้างรอเริ่ม: ${task.pendingDays} วัน`} />
                            <div style={{ width: `${inProgressPct}%` }} className="bg-blue-600 h-full" title={`ค้างกำลังทำ: ${task.inProgressDays} วัน`} />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-black text-slate-800 whitespace-nowrap">
                        {task.totalDurationDays} วัน
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {task.isOnTime === true ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check size={11} /> ตรงเวลา
                          </span>
                        ) : task.isOnTime === false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle size={11} /> เกินกำหนด
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SKILL CATEGORY & TEAM AFFINITY BREAKDOWN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-break-avoid break-inside-avoid print:break-inside-avoid">
        {/* Chart A: Category Breakdown */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs flex flex-col justify-between page-break-avoid break-inside-avoid print:break-inside-avoid">
          <InteractiveDonutChart
            title="4. สัดส่วนประเภทงานที่ปฏิบัติ (Category Breakdown %)"
            subtitle="จำแนกชิ้นงานตามความเชี่ยวชาญ (Graphic, Video, Copywriting, ฯลฯ)"
            data={categoryChartData}
            centerTitle="รวมทุกประเภท"
            centerValue={`${memberTasksWithDetails.length} งาน`}
          />
        </div>

        {/* Chart B: Client Team Affinity Breakdown */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xs flex flex-col justify-between page-break-avoid break-inside-avoid print:break-inside-avoid">
          <InteractiveDonutChart
            title="5. สัดส่วนการทำงานร่วมกับแต่ละทีม (Client Team Affinity %)"
            subtitle="จำแนกชิ้นงานตามทีมผู้สั่งงาน (GA, PITI, NMCO, ฯลฯ)"
            data={teamChartData}
            centerTitle="รวมทุกทีม"
            centerValue={`${teamChartData.length} ทีม`}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: FULL TASKS LEDGER (ลิสต์งานทั้งหมดพร้อมเวลาค้างในสถานะ) */}
      {/* ========================================================================= */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 print:p-4 shadow-xs page-break-avoid break-inside-avoid print:break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <span>รายการงานทั้งหมดและประวัติสถานะ (All Tasks & Status Duration Ledger)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              แสดงรายละเอียดงานทุกชิ้น บอกจำนวนวันที่ค้างในแต่ละสถานะ และเวลารวมที่ใช้ไป ({filteredTaskList.length} รายการ)
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่องาน, รหัส..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-400 w-48 text-slate-800"
              />
            </div>

            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="in_progress">กำลังทำ</option>
              <option value="pending">รอเริ่ม</option>
            </select>

            <select
              value={taskRoleFilter}
              onChange={(e) => setTaskRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกบทบาท</option>
              <option value="owner">งานหลัก</option>
              <option value="assistant">งานช่วย</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-slate-300">
          <table className="w-full table-fixed text-left text-xs print:text-[10px]">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="w-[36%] py-2.5 px-3 font-bold">ชื่อโครงการ / รหัส</th>
                <th className="w-[11%] py-2.5 px-1.5 text-center font-bold">บทบาท</th>
                <th className="w-[12%] py-2.5 px-1.5 text-center font-bold">สถานะปัจจุบัน</th>
                <th className="w-[9%] py-2.5 px-1 text-center font-bold">ค้างรอเริ่ม</th>
                <th className="w-[9%] py-2.5 px-1 text-center font-bold">ค้างกำลังทำ</th>
                <th className="w-[10%] py-2.5 px-1 text-center font-bold">เวลารวม</th>
                <th className="w-[13%] py-2.5 pl-1 pr-3 text-right font-bold">Save Cost ที่ได้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTaskList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบรายการงานตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredTaskList.map((task) => (
                  <tr
                    key={task.brief.id}
                    onClick={() => onOpenTaskModal && onOpenTaskModal(task.brief)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800 line-clamp-1 hover:text-emerald-700 transition-colors" title={task.brief.project_name}>
                        {task.brief.project_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-slate-400 font-mono truncate">
                        <span className="text-slate-600 font-semibold">{task.brief.details?.project_code || `CC-${task.brief.id.slice(0, 4).toUpperCase()}`}</span>
                        <span>•</span>
                        <span>{task.category}</span>
                        <span>•</span>
                        <span>{task.clientTeam}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold inline-block ${
                        task.role === 'owner' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {task.role === 'owner' ? `หลัก ${task.percentage}%` : `ช่วย ${task.percentage}%`}
                      </span>
                    </td>

                    <td className="py-2.5 px-1.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${
                        task.brief.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : task.brief.status === 'in_progress' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          task.brief.status === 'completed' ? 'bg-emerald-500' : task.brief.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-400'
                        }`} />
                        <span>{task.brief.status === 'completed' ? 'เสร็จสิ้น' : task.brief.status === 'in_progress' ? 'กำลังทำ' : 'รอเริ่ม'}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-1 text-center font-mono text-slate-700">
                      {task.pendingDays > 0 ? `${task.pendingDays} วัน` : "-"}
                    </td>

                    <td className="py-2.5 px-1 text-center font-mono text-slate-700">
                      {task.inProgressDays > 0 ? `${task.inProgressDays} วัน` : "-"}
                    </td>

                    <td className="py-2.5 px-1 text-center font-mono font-bold text-slate-900">
                      {task.totalDurationDays} วัน
                    </td>

                    <td className="py-2.5 pl-1 pr-3 text-right font-mono font-bold text-emerald-700 truncate">
                      ฿{task.shareBaht.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MONTHLY REPORT AUTO-DISPATCH (ระบบส่งไฟล์สรุปทุกสิ้นเดือน) */}
      {/* ========================================================================= */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 no-print">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>ระบบส่งรายงานผลงานอัตโนมัติทุกสิ้นเดือน</span>
                </h3>
                <p className="text-xs text-muted mt-1">
                  ระบบจะสร้างไฟล์สรุปผลงานของ <strong>{currentProfileMember.name}</strong> และจัดส่งไปยังผู้เกี่ยวข้องทุกๆ สิ้นเดือน เวลา 18:00 น.
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-muted hover:text-foreground p-1 rounded-full hover:bg-muted/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Recipient Roster */}
            <div className="p-3.5 bg-muted/5 rounded-2xl border border-surface-border space-y-2.5">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                รายชื่อผู้รับรายงาน 4 กลุ่มเป้าหมาย:
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <div className="font-bold text-foreground">1. เจ้าของรายงาน (Assignee)</div>
                    <div className="text-[10px] text-muted">
                      {currentMemberProfile?.fullName || currentProfileMember.name} 
                      {currentMemberProfile?.position ? ` • ${currentMemberProfile.position}` : ` • ${currentProfileMember.unit} Unit`}
                      {currentMemberProfile?.phone && ` • โทร ${currentMemberProfile.phone}`}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">พร้อมส่ง</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <div className="font-bold text-foreground">2. หัวหน้าทีม (Team Lead)</div>
                    <div className="text-[10px] text-muted">นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA) • หัวหน้าทีม (Team Leader) • โทร 062-4166396</div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">พร้อมส่ง</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <div className="font-bold text-foreground">3. ผู้ช่วยหัวหน้าทีม (Assistant Lead)</div>
                    <div className="text-[10px] text-muted">นางสาววาสิตา กอบธัญกิจ (วา WK) • ผู้ช่วยหัวหน้าทีม (Assistant Team Leader) • โทร 085-1071229</div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">พร้อมส่ง</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <div className="font-bold text-foreground">4. คณะผู้บริหาร (Executive Management)</div>
                    <div className="text-[10px] text-muted">
                      {executiveMembers && executiveMembers.length > 0
                        ? executiveMembers.map(e => `${e.fullName || e.name} (${e.position || 'ผู้บริหาร'})`).join(', ')
                        : 'คณะกรรมการบริหารและผู้อำนวยการฝ่าย (Executive Board)'}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {executiveMembers && executiveMembers.length > 0 ? `${executiveMembers.length} ท่าน` : 'พร้อมส่ง'}
                  </span>
                </div>
              </div>
            </div>

            {/* Success toast inside modal */}
            {dispatchSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{dispatchSuccessMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>

              <button
                onClick={handleTestDispatch}
                disabled={isDispatching}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isDispatching ? 'กำลังส่งรายงาน...' : 'ทดสอบส่งรายงานตอนนี้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
