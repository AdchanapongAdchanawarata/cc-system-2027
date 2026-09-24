"use client";

import React, { useState, useMemo } from "react";
import { 
  Coins, DollarSign, TrendingUp, CreditCard, Briefcase, 
  Calendar, User, Users, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Sparkles, Plus, Tag
} from "lucide-react";
import { TEAMS_MAP } from "@/utils/teamAnalytics";
import { BriefTaskLike } from "@/utils/stats";

interface CCIncomingProjectsBannerProps {
  briefs: BriefTaskLike[];
  assignees: { id: string; name: string; unit?: string }[];
  onSelectBrief?: (brief: BriefTaskLike) => void;
  onCreateInternalTask?: () => void;
}

export function isPMProjectBrief(b: BriefTaskLike): boolean {
  if (b.status === "cancelled") return false;
  const cat = (b.details?.category || b.details?.service_name || "").trim().toLowerCase();
  if (
    cat === "pm โครงการของ cc".toLowerCase() || 
    cat.includes("pm โครงการ") || 
    cat.includes("pm project")
  ) {
    return true;
  }
  if (b.details?.project_code && (b.details?.revenue !== undefined || b.details?.cost !== undefined)) {
    return true;
  }
  return false;
}

export default function CCIncomingProjectsBanner({
  briefs,
  assignees,
  onSelectBrief,
  onCreateInternalTask
}: CCIncomingProjectsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter ONLY projects matching "PM โครงการของ CC"
  const pmProjects = useMemo(() => {
    return briefs.filter(isPMProjectBrief);
  }, [briefs]);

  // Aggregate financial metrics
  const totals = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;

    pmProjects.forEach((b) => {
      const rev = Number(b.details?.revenue) || 0;
      const cst = Number(b.details?.cost) || 0;
      const prof = b.details?.profit !== undefined && b.details?.profit !== null
        ? Number(b.details?.profit)
        : (rev - cst);

      revenue += rev;
      cost += cst;
      profit += prof;

      if (b.status === "completed") completedCount++;
      else if (b.status === "in_progress") inProgressCount++;
      else pendingCount++;
    });

    const marginRate = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      marginRate,
      totalProjects: pmProjects.length,
      completedCount,
      inProgressCount,
      pendingCount
    };
  }, [pmProjects]);

  // Resolve Assignee name by ID
  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return "ยังไม่ระบุ PM";
    const found = assignees.find((a) => a.id === assigneeId);
    return found ? found.name : "ยังไม่ระบุ PM";
  };

  // Format date in Thai
  const formatThaiDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Check if task is overdue
  const checkIsOverdue = (b: BriefTaskLike) => {
    if (b.status === "completed" || b.status === "cancelled" || !b.deadline) return false;
    const now = new Date().getTime();
    const dTime = new Date(b.deadline).getTime();
    return dTime < now;
  };

  return (
    <div className="w-full bg-gradient-to-br from-white via-slate-50/50 to-amber-50/30 dark:from-surface dark:via-surface dark:to-surface rounded-3xl border-2 border-amber-200/80 dark:border-amber-500/30 p-5 md:p-6 shadow-sm space-y-5 transition-all">
      
      {/* 1. Header Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/60 dark:border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 mt-0.5">
            <Coins size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-foreground">
                โครงการที่มีเงินเข้าของ CC
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                <Sparkles size={11} className="text-amber-600 dark:text-amber-400" />
                ประเภทงาน: PM โครงการของ CC
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              สรุปผลรวมรายรับ, ต้นทุน, กำไรสุทธิ และรายละเอียดโครงการบริหารจัดการ (Project Management) ที่มีเงินเข้าทีม
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onCreateInternalTask && (
            <button
              type="button"
              onClick={onCreateInternalTask}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>สร้างโครงการ PM</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-surface-border/40 hover:bg-slate-100 dark:hover:bg-surface-border text-slate-700 dark:text-foreground text-xs font-bold rounded-xl border border-slate-200 dark:border-surface-border transition-all cursor-pointer shadow-2xs"
          >
            <span>{isExpanded ? "ซ่อนรายการ" : `แสดงรายการ (${totals.totalProjects})`}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Cards (ผลรวม รายรับ ต้นทุน กำไร) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* รายรับรวม (Total Revenue) */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 p-4 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
              รายรับรวม (Revenue)
            </span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold">
              +฿
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 dark:text-emerald-300 tracking-tight">
            ฿{totals.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium mt-1 flex items-center gap-1">
            <span>รายรับเงินเข้าโครงการทั้งหมด</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* ต้นทุนรวม (Total Cost) */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-rose-200/80 dark:border-rose-500/30 p-4 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={15} className="text-rose-600 dark:text-rose-400" />
              ต้นทุนรวม (Cost)
            </span>
            <span className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-bold">
              -฿
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-950 dark:text-rose-300 tracking-tight">
            ฿{totals.totalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 font-medium mt-1 flex items-center gap-1">
            <span>ต้นทุนและค่าใช้จ่ายดำเนินงาน</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/40 dark:bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* กำไรสุทธิ (Total Profit) */}
        <div className={`bg-white dark:bg-surface rounded-2xl border p-4 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group ${
          totals.totalProfit >= 0 ? "border-indigo-200/80 dark:border-indigo-500/30" : "border-rose-300 dark:border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20"
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={15} className="text-indigo-600 dark:text-indigo-400" />
              กำไรสุทธิ (Profit)
            </span>
            {totals.totalRevenue > 0 && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                totals.marginRate >= 0 ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300" : "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300"
              }`}>
                {totals.marginRate}% Margin
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
            totals.totalProfit >= 0 ? "text-indigo-950 dark:text-indigo-300" : "text-rose-600 dark:text-rose-400"
          }`}>
            ฿{totals.totalProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 font-medium mt-1 flex items-center gap-1">
            <span>{totals.totalProfit >= 0 ? "กำไรสุทธิเข้าทีม CC" : "ผลการดำเนินงานติดลบ"}</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/40 dark:bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* จำนวนโครงการทั้งหมด (Total Projects) */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-surface-border p-4 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={15} className="text-slate-600 dark:text-slate-400" />
              โครงการทั้งหมด
            </span>
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-surface-border text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
              {totals.totalProjects}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-foreground tracking-tight">
            {totals.totalProjects} <span className="text-xs font-normal text-slate-500 dark:text-muted-foreground">โครงการ</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-muted-foreground font-medium mt-1 flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">เสร็จ {totals.completedCount}</span>
            <span>•</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold">ทำ {totals.inProgressCount}</span>
            <span>•</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">รอ {totals.pendingCount}</span>
          </div>
        </div>

      </div>

      {/* 3. Projects Detailed Table / List (เมื่อคลี่ออก) */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-amber-600 dark:text-amber-400" />
              รายการโครงการที่มีเงินเข้า ({pmProjects.length} โครงการ)
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              คลิกที่โครงการเพื่อเปิดดูหรือแก้ไขรายละเอียดบรีฟ
            </span>
          </div>

          {pmProjects.length === 0 ? (
            /* Empty State */
            <div className="bg-white/80 dark:bg-surface/80 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 mx-auto flex items-center justify-center font-bold text-xl">
                <Coins size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-foreground">
                  ยังไม่มีข้อมูลโครงการที่มีเงินเข้า (PM โครงการของ CC)
                </h4>
                <p className="text-xs text-slate-500 dark:text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                  สามารถสร้างโครงการได้โดยกดปุ่ม <span className="font-bold text-slate-700 dark:text-slate-300">"+ Internal Task"</span> ที่แถบเมนูด้านบน แล้วเลือกประเภทงานเป็น <span className="font-bold text-amber-700 dark:text-amber-400">"PM โครงการของ CC"</span> พร้อมระบุรหัสโครงการ รายรับ ต้นทุน กำไร และ PM ผู้รับผิดชอบ
                </p>
              </div>
              {onCreateInternalTask && (
                <button
                  type="button"
                  onClick={onCreateInternalTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 mt-2"
                >
                  <Plus size={14} />
                  <span>สร้างโครงการ PM โครงการของ CC แรก</span>
                </button>
              )}
            </div>
          ) : (
            /* Projects Table */
            <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200/90 dark:border-surface-border shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 dark:bg-surface-border/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-surface-border">
                    <tr>
                      <th className="py-3 px-3.5 whitespace-nowrap">รหัสโครงการ</th>
                      <th className="py-3 px-3.5">ชื่อโครงการ</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-center">ทีมที่เกี่ยวข้อง</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">PM ผู้รับผิดชอบ</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-center">เดดไลน์</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-center">สถานะ</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-right">รายรับ</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-right">ต้นทุน</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-right">กำไรสุทธิ</th>
                      <th className="py-3 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-border font-medium">
                    {pmProjects.map((project) => {
                      const projectCode = project.details?.project_code || `CC-PM-${project.id.slice(0, 4).toUpperCase()}`;
                      const revenue = Number(project.details?.revenue) || 0;
                      const cost = Number(project.details?.cost) || 0;
                      const profit = project.details?.profit !== undefined && project.details?.profit !== null
                        ? Number(project.details?.profit)
                        : (revenue - cost);

                      const pmName = getAssigneeName(project.assignee_id);
                      const relatedTeamKey = project.details?.team || (project as any).decision_maker || project.details?.department || "CC";
                      const teamInfo = TEAMS_MAP[relatedTeamKey.toUpperCase()] || { th: relatedTeamKey, en: relatedTeamKey };
                      const isOverdue = checkIsOverdue(project);

                      return (
                        <tr
                          key={project.id}
                          onClick={() => onSelectBrief && onSelectBrief(project)}
                          className="hover:bg-amber-50/40 dark:hover:bg-surface-border/40 cursor-pointer transition-colors group"
                        >
                          {/* รหัสโครงการ (Project Code) */}
                          <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            <span className="bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 inline-flex items-center gap-1">
                              <Tag size={10} className="text-indigo-500 dark:text-indigo-400" />
                              {projectCode}
                            </span>
                          </td>

                          {/* ชื่อโครงการ (Project Name) */}
                          <td className="py-3 px-3.5 max-w-[220px]">
                            <div className="font-bold text-slate-900 dark:text-foreground truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors" title={project.project_name}>
                              {project.project_name}
                            </div>
                            {project.details?.description && (
                              <div className="text-[11px] text-slate-400 dark:text-muted-foreground truncate mt-0.5" title={project.details.description}>
                                {project.details.description}
                              </div>
                            )}
                          </td>

                          {/* ทีมที่เกี่ยวข้อง (Related Team) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-center">
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-surface-border text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-surface-border"
                              title={`${relatedTeamKey}: ${teamInfo.th}`}
                            >
                              {relatedTeamKey}
                            </span>
                          </td>

                          {/* PM คือใคร (PM / Assignee) */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{pmName}</span>
                          </td>

                          {/* เดดไลน์ (Deadline) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-center font-mono">
                            <div className="flex items-center justify-center gap-1">
                              <Calendar size={11} className={isOverdue ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-muted-foreground"} />
                              <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                                {formatThaiDate(project.deadline)}
                              </span>
                            </div>
                            {isOverdue && (
                              <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded mt-0.5">
                                เกินกำหนด
                              </span>
                            )}
                          </td>

                          {/* สถานะ (Status) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-center">
                            {project.status === "completed" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle2 size={11} /> เสร็จสิ้น
                              </span>
                            ) : project.status === "in_progress" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" /> กำลังทำ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <Clock size={11} /> รอเริ่ม
                              </span>
                            )}
                          </td>

                          {/* รายรับ (Revenue) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            ฿{revenue.toLocaleString()}
                          </td>

                          {/* ต้นทุน (Cost) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-semibold text-rose-700 dark:text-rose-400">
                            ฿{cost.toLocaleString()}
                          </td>

                          {/* กำไร (Profit) */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-black">
                            <span className={profit >= 0 ? "text-indigo-900 dark:text-indigo-300" : "text-rose-600 dark:text-rose-400"}>
                              ฿{profit.toLocaleString()}
                            </span>
                          </td>

                          {/* Action Arrow */}
                          <td className="py-3 px-3 text-center text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
