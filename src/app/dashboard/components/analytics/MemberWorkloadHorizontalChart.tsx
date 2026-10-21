"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  Hourglass,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  UserCheck
} from "lucide-react";
import { BriefTaskLike } from "@/utils/stats";
import { MemberProfile, parseMemberRecord, isOperationalAssignee } from "@/utils/memberProfile";
import { Assignee3DAvatarBadge } from "@/components/Assignee3DAvatarBadge";

interface MemberWorkloadHorizontalChartProps {
  briefs: BriefTaskLike[];
  assignees: { id: string; name: string; unit?: string }[];
  memberProfiles?: Map<string, MemberProfile>;
  onSelectMember?: (memberId: string) => void;
}

interface MemberWorkloadData {
  id: string;
  name: string;
  fullName: string;
  unit: string;
  position: string;
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
  leadCount: number;
  assistCount: number;
}

const UNIT_TABS = [
  { key: "all", label: "ทั้งหมด", icon: Layers, desc: "ทุกยูนิตงาน" },
  { key: "creative", label: "Creative", icon: Sparkles, desc: "งานออกแบบและผลิตกราฟิก" },
  { key: "content", label: "Content", icon: Layers, desc: "งานคอนเทนต์และบทความ" },
  { key: "pr", label: "PR", icon: Layers, desc: "งานสื่อสารและประชาสัมพันธ์" },
  { key: "internal", label: "Internal Task", icon: Layers, desc: "งานบริหารและระบบภายใน" },
];

export default function MemberWorkloadHorizontalChart({
  briefs = [],
  assignees = [],
  memberProfiles,
  onSelectMember,
}: MemberWorkloadHorizontalChartProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [showZeroWorkload, setShowZeroWorkload] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"total" | "inProgress" | "completed" | "pending">("total");

  // Operational assignees only (excluding executives)
  const operationalAssignees = useMemo(() => {
    return assignees.filter((a) => isOperationalAssignee(a));
  }, [assignees]);

  // ID to Assignee map
  const assigneeMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; unit?: string }>();
    operationalAssignees.forEach((a) => map.set(a.id, a));
    return map;
  }, [operationalAssignees]);

  // Valid briefs (excluding cancelled and purged)
  const validBriefs = useMemo(() => {
    return briefs.filter((b) => b.status !== "cancelled" && b.status !== "purged");
  }, [briefs]);

  // Count briefs available in each unit tab for badge counts
  const unitBriefCounts = useMemo(() => {
    const counts: Record<string, number> = { all: validBriefs.length };
    UNIT_TABS.forEach((tab) => {
      if (tab.key === "all") return;
      counts[tab.key] = validBriefs.filter(
        (b) => (b.unit || "").toLowerCase() === tab.key.toLowerCase()
      ).length;
    });
    return counts;
  }, [validBriefs]);

  // Filter briefs according to active unit filter
  const filteredBriefs = useMemo(() => {
    if (selectedUnit === "all") return validBriefs;
    return validBriefs.filter(
      (b) => (b.unit || "").toLowerCase() === selectedUnit.toLowerCase()
    );
  }, [validBriefs, selectedUnit]);

  // Compute workload for each member based on filtered briefs
  const memberWorkloads = useMemo(() => {
    const dataMap: Record<string, MemberWorkloadData> = {};

    // Initialize all operational members
    operationalAssignees.forEach((a) => {
      const prof = memberProfiles?.get(a.id) || parseMemberRecord(a);
      let cleanUnit = a.unit || "CC TEAM";
      if (cleanUnit.includes("|")) cleanUnit = cleanUnit.split("|")[0];

      dataMap[a.id] = {
        id: a.id,
        name: a.name.trim(),
        fullName: prof.fullName || a.name,
        unit: cleanUnit,
        position: prof.position || "สมาชิกทีมปฏิบัติการ",
        completed: 0,
        inProgress: 0,
        pending: 0,
        total: 0,
        leadCount: 0,
        assistCount: 0,
      };
    });

    // Tally tasks for each brief
    filteredBriefs.forEach((brief) => {
      const status = brief.status || "pending";
      const ownerId = brief.assignee_id;
      const assistants = (brief.details?.assistants || []).filter(
        (ast) => ast.assignee_id && Number(ast.percentage) > 0
      );

      // Tally owner
      if (ownerId && dataMap[ownerId]) {
        dataMap[ownerId].leadCount += 1;
        dataMap[ownerId].total += 1;
        if (status === "completed") dataMap[ownerId].completed += 1;
        else if (status === "in_progress") dataMap[ownerId].inProgress += 1;
        else dataMap[ownerId].pending += 1;
      }

      // Tally assistants
      assistants.forEach((ast) => {
        const astId = ast.assignee_id;
        if (astId && dataMap[astId]) {
          dataMap[astId].assistCount += 1;
          dataMap[astId].total += 1;
          if (status === "completed") dataMap[astId].completed += 1;
          else if (status === "in_progress") dataMap[astId].inProgress += 1;
          else dataMap[astId].pending += 1;
        }
      });
    });

    return Object.values(dataMap);
  }, [operationalAssignees, filteredBriefs, memberProfiles]);

  // Sort members: primary sort descending, secondary by total then name
  const sortedMembers = useMemo(() => {
    return [...memberWorkloads].sort((a, b) => {
      if (sortBy === "total") {
        if (b.total !== a.total) return b.total - a.total;
        if (b.inProgress !== a.inProgress) return b.inProgress - a.inProgress;
        return b.completed - a.completed;
      }
      if (sortBy === "inProgress") {
        if (b.inProgress !== a.inProgress) return b.inProgress - a.inProgress;
        return b.total - a.total;
      }
      if (sortBy === "completed") {
        if (b.completed !== a.completed) return b.completed - a.completed;
        return b.total - a.total;
      }
      if (sortBy === "pending") {
        if (b.pending !== a.pending) return b.pending - a.pending;
        return b.total - a.total;
      }
      return b.total - a.total;
    });
  }, [memberWorkloads, sortBy]);

  // Separate active workload members and zero-workload members
  const activeMembers = useMemo(() => {
    return sortedMembers.filter((m) => m.total > 0);
  }, [sortedMembers]);

  const zeroMembers = useMemo(() => {
    return sortedMembers.filter((m) => m.total === 0);
  }, [sortedMembers]);

  // Overall totals in the filtered view
  const overallTotals = useMemo(() => {
    const totalTasks = filteredBriefs.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    filteredBriefs.forEach((b) => {
      if (b.status === "completed") completed++;
      else if (b.status === "in_progress") inProgress++;
      else pending++;
    });

    return { totalTasks, completed, inProgress, pending };
  }, [filteredBriefs]);

  // Find max total tasks across all members for proportional bar scaling
  const maxMemberTotal = useMemo(() => {
    const max = Math.max(...memberWorkloads.map((m) => m.total), 1);
    return max;
  }, [memberWorkloads]);

  const displayedMembers = showZeroWorkload ? sortedMembers : activeMembers;

  return (
    <div className="w-full bg-surface border border-surface-border rounded-2xl p-5 md:p-6 shadow-xs transition-all mb-6">
      {/* Top Header: Title, Description, and Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-foreground">
                  ปริมาณภาระงานรายบุคคล <span className="hidden sm:inline text-sm font-normal text-muted-foreground">(Member Workload Distribution)</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                  {activeMembers.length} / {operationalAssignees.length} คนมีงาน
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                แผนภูมิแนวนอนเรียงลำดับจากผู้มีภาระงานมากที่สุด ผสมสัดส่วนสถานะงาน (เสร็จ / กำลังทำ / รอทำ)
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-2 px-3 rounded-xl border border-surface-border self-start lg:self-center text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0 inline-block" />
            <span>เสร็จสิ้น (Completed)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-md bg-blue-500 shrink-0 inline-block" />
            <span>กำลังทำ (In Progress)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0 inline-block" />
            <span>รอทำ (Pending)</span>
          </div>
        </div>
      </div>

      {/* Unit Sub-filter Tabs & Quick Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 pb-4">
        {/* Unit Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-1 shrink-0">
            <Filter size={13} />
            กรองยูนิต:
          </span>
          {UNIT_TABS.map((tab) => {
            const isActive = selectedUnit === tab.key;
            const count = unitBriefCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedUnit(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-surface border border-surface-border text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                }`}
                title={tab.desc}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <ArrowUpDown size={12} />
            เรียงตาม:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-surface border border-surface-border rounded-xl px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="total">ภาระงานรวม (มาก ➔ น้อย)</option>
            <option value="inProgress">กำลังทำ (มาก ➔ น้อย)</option>
            <option value="completed">เสร็จสิ้น (มาก ➔ น้อย)</option>
            <option value="pending">รอทำ (มาก ➔ น้อย)</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-surface-border flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">งานในมุมมองนี้</div>
            <div className="text-lg font-bold text-foreground font-mono mt-0.5">
              {overallTotals.totalTasks} <span className="text-xs font-normal text-muted-foreground">งาน</span>
            </div>
          </div>
          <Layers size={18} className="text-slate-400" />
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">เสร็จสิ้นแล้ว</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {overallTotals.completed}{" "}
              <span className="text-xs font-normal opacity-80">
                ({overallTotals.totalTasks ? Math.round((overallTotals.completed / overallTotals.totalTasks) * 100) : 0}%)
              </span>
            </div>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>

        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">กำลังดำเนินการ</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
              {overallTotals.inProgress}{" "}
              <span className="text-xs font-normal opacity-80">
                ({overallTotals.totalTasks ? Math.round((overallTotals.inProgress / overallTotals.totalTasks) * 100) : 0}%)
              </span>
            </div>
          </div>
          <Clock size={18} className="text-blue-500" />
        </div>

        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">รอเริ่มดำเนินการ</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {overallTotals.pending}{" "}
              <span className="text-xs font-normal opacity-80">
                ({overallTotals.totalTasks ? Math.round((overallTotals.pending / overallTotals.totalTasks) * 100) : 0}%)
              </span>
            </div>
          </div>
          <Hourglass size={18} className="text-amber-500" />
        </div>
      </div>

      {/* Main Horizontal Bars List */}
      <div className="space-y-3">
        {displayedMembers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-surface-border rounded-xl">
            ไม่พบข้อมูลภาระงานในยูนิตที่เลือก
          </div>
        ) : (
          displayedMembers.map((member, index) => {
            // Proportional width relative to the maximum member total tasks
            const barWidthPercent = maxMemberTotal > 0 ? (member.total / maxMemberTotal) * 100 : 0;

            // Segments percentages within the member's total tasks
            const completedPct = member.total > 0 ? (member.completed / member.total) * 100 : 0;
            const inProgressPct = member.total > 0 ? (member.inProgress / member.total) * 100 : 0;
            const pendingPct = member.total > 0 ? (member.pending / member.total) * 100 : 0;

            const isTopRank = index < 3 && member.total > 0;
            const rankBadgeColors =
              index === 0
                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300"
                : index === 1
                ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200"
                : index === 2
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400";

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember && onSelectMember(member.id)}
                className={`p-3 rounded-xl border border-surface-border bg-surface hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all ${
                  onSelectMember ? "cursor-pointer" : ""
                }`}
              >
                {/* Row Header: Rank, Name, Unit, and Breakdown Numbers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-bold font-mono flex items-center justify-center border shrink-0 ${rankBadgeColors}`}
                    >
                      {index + 1}
                    </span>

                    {/* Member Avatar with Click/Hover Persona Card */}
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Assignee3DAvatarBadge name={member.name} size={24} showBorder />
                    </div>

                    {/* Member Name & Position */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{member.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 uppercase">
                        {member.unit}
                      </span>
                      {member.leadCount > 0 && member.assistCount > 0 && (
                        <span className="hidden md:inline text-[10px] text-muted-foreground font-mono">
                          (หลัก {member.leadCount} + ช่วย {member.assistCount})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Total & Breakdown Pills */}
                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {member.completed > 0 && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200/50">
                          เสร็จ {member.completed}
                        </span>
                      )}
                      {member.inProgress > 0 && (
                        <span className="text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-200/50">
                          ทำ {member.inProgress}
                        </span>
                      )}
                      {member.pending > 0 && (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200/50">
                          รอ {member.pending}
                        </span>
                      )}
                    </div>

                    <div className="font-bold font-mono text-sm px-2.5 py-0.5 rounded-lg bg-foreground text-background">
                      {member.total} <span className="text-[10px] font-normal opacity-80">งาน</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal Stacked Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-4 overflow-hidden relative shadow-inner">
                  {member.total > 0 ? (
                    <div
                      className="h-full flex items-center transition-all duration-500 rounded-full overflow-hidden"
                      style={{ width: `${Math.max(barWidthPercent, 4)}%` }}
                    >
                      {/* Completed Segment (Green) */}
                      {member.completed > 0 && (
                        <div
                          style={{ width: `${completedPct}%` }}
                          className="h-full bg-emerald-500 hover:bg-emerald-600 transition-colors relative group flex items-center justify-center min-w-[14px]"
                          title={`เสร็จสิ้น: ${member.completed} งาน (${Math.round(completedPct)}%)`}
                        >
                          {completedPct >= 3 && (
                            <span className="text-[10px] font-bold text-white font-mono leading-none">
                              {member.completed}
                            </span>
                          )}
                        </div>
                      )}

                      {/* In Progress Segment (Blue) */}
                      {member.inProgress > 0 && (
                        <div
                          style={{ width: `${inProgressPct}%` }}
                          className="h-full bg-blue-500 hover:bg-blue-600 transition-colors relative group flex items-center justify-center min-w-[14px]"
                          title={`กำลังทำ: ${member.inProgress} งาน (${Math.round(inProgressPct)}%)`}
                        >
                          {inProgressPct >= 3 && (
                            <span className="text-[10px] font-bold text-white font-mono leading-none">
                              {member.inProgress}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pending Segment (Amber) */}
                      {member.pending > 0 && (
                        <div
                          style={{ width: `${pendingPct}%` }}
                          className="h-full bg-amber-400 hover:bg-amber-500 transition-colors relative group flex items-center justify-center min-w-[14px]"
                          title={`รอทำ: ${member.pending} งาน (${Math.round(pendingPct)}%)`}
                        >
                          {pendingPct >= 3 && (
                            <span className="text-[10px] font-bold text-slate-900 font-mono leading-none">
                              {member.pending}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                      ไม่มีภาระงาน
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Toggle for 0 workload members */}
      {zeroMembers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-500" />
            <span>
              สมาชิกที่ไม่มีภาระงานในมุมมองนี้: <strong>{zeroMembers.length} คน</strong> ({zeroMembers.map((m) => m.name).join(", ")})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowZeroWorkload(!showZeroWorkload)}
            className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
          >
            {showZeroWorkload ? (
              <>
                <span>ซ่อนผู้ไม่มีงาน</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>แสดงทุกคน ({operationalAssignees.length} คน)</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
