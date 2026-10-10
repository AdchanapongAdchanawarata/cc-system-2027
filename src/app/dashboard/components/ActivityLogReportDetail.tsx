"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  UserCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Flame,
  UserX,
  RefreshCw,
  Download,
  Eye,
  FileCheck,
  Send,
  Upload,
  Edit3,
  LogIn,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Briefcase,
  Copy,
  Check,
  Target,
  ShieldCheck,
  Users,
  BarChart3,
  User
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ExportDataDropdown from "./ExportDataDropdown";
import { getAuditLogs, AuditLogEntry } from "@/utils/auditLogger";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";

interface MemberActivitySummary {
  code: string;
  name: string;
  nickname: string;
  unit: string;
  role: string;
  totalActions: number;
  assignedTasksCount: number;
  completedTasksCount: number;
  lastAction: string;
  lastActiveTime: string;
  activityScore: number;
  status: "high_active" | "normal" | "ready";
}

export default function ActivityLogReportDetail() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [assigneesList, setAssigneesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"scoreboard" | "logs" | "insights">("scoreboard");

  // Load real system data and clear any stale mock data
  const loadRealData = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        // Clear stale mock demo caches
        localStorage.removeItem("cc_activity_logs_v3_fy70");
      }

      const supabase = createClient();
      const [auditData, briefsRes, assigneesRes] = await Promise.all([
        getAuditLogs(200),
        supabase.from("briefs").select("*").neq("status", "purged").order("created_at", { ascending: false }),
        supabase.from("assignees").select("id, name, unit, is_active")
      ]);

      setLogs(auditData || []);
      const activeBriefs = (briefsRes.data || []).filter(
        b => b && b.status !== "purged" && !b.details?.is_permanently_deleted
      );
      setBriefs(activeBriefs);
      setAssigneesList(assigneesRes.data || []);
    } catch (err) {
      console.warn("Error loading activity log data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Compute 12 operational members' real-world activity based strictly on database records (excluding executives)
  const teamMembers = useMemo<MemberActivitySummary[]>(() => {
    const list: MemberActivitySummary[] = [];

    Object.entries(DEFAULT_MEMBER_METADATA).forEach(([displayKey, meta]) => {
      // Exclude executive leadership from operational workload matrix (ผู้บริหาร ไม่รวมในภาระงานปฏิบัติการ)
      if (
        meta.isExecutive || 
        displayKey.includes("อ.บ่าว") || 
        meta.position.includes("รองผู้อำนวยการ") || 
        meta.position.includes("ผู้บริหาร")
      ) {
        return;
      }

      // Split displayKey: e.g. "จ๊อบ AA" -> nickname: "จ๊อบ", code: "AA"
      const parts = displayKey.split(" ");
      const nickname = parts[0] || displayKey;
      const code = parts[1] || "";

      // Find matched assignee in assignees table
      const matchedAssignee = assigneesList.find(a => 
        a.name === displayKey || 
        (a.name && (a.name.includes(nickname) || (code && a.name.includes(code))))
      );
      const assigneeId = matchedAssignee?.id;

      // Find real briefs involving this member as direct assignee or assistant
      const memberBriefs = briefs.filter(b => {
        // 1. Direct assignee_id match
        if (assigneeId && b.assignee_id === assigneeId) return true;

        // 2. Assignee name / nickname match
        if (b.assignee_name && (b.assignee_name.includes(nickname) || (code && b.assignee_name.includes(code)))) return true;

        // 3. Array of assignees
        if (Array.isArray(b.assignees) && b.assignees.some((a: any) => 
          (typeof a === "string" && (a.includes(nickname) || (code && a.includes(code)))) ||
          (a && typeof a === "object" && (a.id === assigneeId || a.name?.includes(nickname) || (code && a.name?.includes(code))))
        )) return true;

        // 4. Assistants array in details
        if (Array.isArray(b.details?.assistants) && b.details.assistants.some((ast: any) =>
          (assigneeId && ast.assignee_id === assigneeId) ||
          (typeof ast === "string" && (ast.includes(nickname) || (code && ast.includes(code)))) ||
          (ast && typeof ast === "object" && (ast.id === assigneeId || ast.name?.includes(nickname) || (code && ast.name?.includes(code))))
        )) return true;

        // 5. Assistant designer field
        if (b.assistant_designer && (b.assistant_designer.includes(nickname) || (code && b.assistant_designer.includes(code)))) return true;

        // 6. Lead designer
        if (b.lead_designer && (b.lead_designer.includes(nickname) || (code && b.lead_designer.includes(code)))) return true;

        return false;
      });

      const assignedTasksCount = memberBriefs.length;
      const completedTasksCount = memberBriefs.filter(b => b.status === "completed").length;

      // Find real audit logs involving this member
      const memberLogs = logs.filter(l => {
        const actor = (l.actor_name || "").toLowerCase();
        return actor.includes(nickname.toLowerCase()) || (code && actor.includes(code.toLowerCase()));
      });

      const totalActions = memberLogs.length + assignedTasksCount;

      // Find latest action & timestamp
      let lastAction = "รอเริ่มบันทึกกิจกรรม";
      let lastActiveTime = "ยังไม่มีกิจกรรมในรอบ";

      if (memberLogs.length > 0) {
        const latestLog = memberLogs[0];
        lastAction = latestLog.action === "STATUS_CHANGE"
          ? `เปลี่ยนสถานะงาน ${latestLog.task_code || ""} (${latestLog.details?.updates?.status || "อัปเดต"})`
          : latestLog.action === "ASSIGNEE_CHANGE"
          ? `มอบหมายงาน ${latestLog.task_code || ""}`
          : latestLog.action === "SYSTEM_BACKUP"
          ? "สำรองข้อมูลระบบ"
          : `${latestLog.action} ${latestLog.task_code || ""}`;

        const dateObj = new Date(latestLog.timestamp);
        lastActiveTime = isNaN(dateObj.getTime())
          ? latestLog.timestamp
          : dateObj.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            }) + " น.";
      } else if (memberBriefs.length > 0) {
        const latestBrief = memberBriefs[0];
        lastAction = `รับมอบหมายงาน: ${latestBrief.project_name || latestBrief.id}`;
        const dateObj = new Date(latestBrief.created_at);
        lastActiveTime = isNaN(dateObj.getTime())
          ? latestBrief.created_at
          : dateObj.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            }) + " น.";
      }

      // Activity Score: strictly 0 if 0 actions, otherwise derived from actual events
      const activityScore = totalActions === 0 ? 0 : Math.min(100, 60 + totalActions * 5);
      const status: "high_active" | "normal" | "ready" = totalActions >= 5 ? "high_active" : totalActions >= 1 ? "normal" : "ready";

      list.push({
        code,
        name: meta.fullName,
        nickname,
        unit: meta.position.includes("รองผู้อำนวยการ") || meta.position.includes("หัวหน้าทีม")
          ? "บริหารทีม"
          : meta.position.includes("ออกแบบ")
          ? "ยูนิตงานออกแบบ"
          : meta.position.includes("สื่อสารองค์กร")
          ? "ยูนิตสื่อสารองค์กร"
          : "ยูนิตผลิตสื่อสร้างสรรค์",
        role: meta.position,
        totalActions,
        assignedTasksCount,
        completedTasksCount,
        lastAction,
        lastActiveTime,
        activityScore,
        status
      });
    });

    return list;
  }, [logs, briefs, assigneesList]);

  // Filtered Logs for Tab 2
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (memberFilter !== "ALL") {
        const actor = (log.actor_name || "").toLowerCase();
        const member = teamMembers.find(m => m.code === memberFilter);
        if (member) {
          const matchNick = actor.includes(member.nickname.toLowerCase());
          const matchCode = member.code && actor.includes(member.code.toLowerCase());
          if (!matchNick && !matchCode) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const taskCode = (log.task_code || "").toLowerCase();
        const proj = (log.project_name || "").toLowerCase();
        const actor = (log.actor_name || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        return taskCode.includes(q) || proj.includes(q) || actor.includes(q) || action.includes(q);
      }
      return true;
    });
  }, [logs, memberFilter, searchQuery, teamMembers]);

  // Top Summary Statistics
  const stats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const highActive = teamMembers.filter(m => m.status === "high_active").length;
    const readyCount = teamMembers.filter(m => m.status === "ready").length;
    const totalActions = logs.length;

    return { totalMembers, highActive, readyCount, totalActions };
  }, [teamMembers, logs]);

  // Dynamic Executive Insights derived 100% from genuine database data
  const insights = useMemo(() => {
    const activeTasks = briefs.filter(b => b.status === "in_progress");
    const completedTasks = briefs.filter(b => b.status === "completed");
    const pendingTasks = briefs.filter(b => b.status === "pending");

    // Overdue tasks
    const now = Date.now();
    const overdueTasks = briefs.filter(b => 
      b.status !== "completed" && b.deadline && new Date(b.deadline).getTime() < now
    );

    // Assistant / Collaboration tasks
    const assistantTasks = briefs.filter(b => 
      b.assistant_designer || (b.details?.assistants && b.details.assistants.length > 0)
    );

    // Survey closure rate
    const surveyedCount = completedTasks.filter(b => 
      b.details?.survey_status === "completed" || b.details?.satisfaction_scores
    ).length;

    // By Unit
    const units = {
      creative: briefs.filter(b => b.unit === "creative"),
      content: briefs.filter(b => b.unit === "content"),
      pr: briefs.filter(b => b.unit === "pr"),
      internal: briefs.filter(b => b.unit === "internal"),
    };

    return {
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      assistantTasksCount: assistantTasks.length,
      surveyedCount,
      units
    };
  }, [briefs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "STATUS_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">เปลี่ยนสถานะ</span>;
      case "ASSIGNEE_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">เปลี่ยนผู้รับผิดชอบ</span>;
      case "DEADLINE_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">แก้ไขกำหนดส่ง</span>;
      case "TASK_PURGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">ลบถาวร (Purge)</span>;
      case "SYSTEM_BACKUP":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">สำรองข้อมูล</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-800 text-xs font-bold border border-violet-200">
              <Activity size={14} className="text-violet-600" />
              <span>CC Team Activity &amp; Operational Audit Trail (FY70)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              บันทึกกิจกรรมและความเคลื่อนไหวของทีม (Activity Log)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ติดตามการเข้าใช้งานระบบ การจัดการชิ้นงาน และประวัติกิจกรรมของสมาชิกทั้ง 12 ท่าน ตามมาตรฐาน ISO 9001:2015 ข้อกำหนด 8.5.2 (Traceability) ด้วยข้อมูลจริงจากระบบ
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={loadRealData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              title="รีเฟรชข้อมูลจริง"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            </button>
            <ExportDataDropdown
              reportId="activity"
              reportTitle="บันทึกกิจกรรม (Activity Log)"
              buttonText="Export Data"
            />
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">บุคลากรทั้งหมด</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalMembers}</span>
              <span className="text-xs text-slate-500">ท่าน (ครบ 4 ยูนิต)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">ผู้บริหาร • ผู้นำทีม • พนักงานสร้างสรรค์</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">ความแอคทีฟระดับสูง</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.highActive}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {stats.totalMembers > 0 ? Math.round((stats.highActive / stats.totalMembers) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-700 mt-1">มีกิจกรรมต่อเนื่องในรอบเวลา</p>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80">
            <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider block">กิจกรรมจริงในระบบ (Audit Trail)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-violet-600">{stats.totalActions}</span>
              <span className="text-xs text-violet-700 font-mono">บันทึก</span>
            </div>
            <p className="text-[10.5px] text-violet-700 mt-1">บันทึกสถานะ • มอบหมายงาน • สำรองข้อมูล</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">สถานะความพร้อมเริ่มปีงบ 70</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">100%</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                พร้อมปฏิบัติงาน
              </span>
            </div>
            <p className="text-[10.5px] text-blue-700 mt-1">ระบบ Audit Trail รองรับทุกขั้นตอน</p>
          </div>
        </div>

        {/* 3 Nav Tabs - Capsule Red Pill Design (Per Reference) */}
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab("scoreboard")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === "scoreboard"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <UserCheck size={16} className="shrink-0" />
              <span className="truncate">1. ความแอคทีฟรายบุคคล</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === "logs"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <Clock size={16} className="shrink-0" />
              <span className="truncate">2. ไทม์ไลน์กิจกรรมจริง (Audit Trail)</span>
            </button>

            <button
              onClick={() => setActiveTab("insights")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === "insights"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <Sparkles size={16} className={`shrink-0 ${activeTab === "insights" ? "text-white" : "text-amber-500"}`} />
              <span className="truncate">3. บทวิเคราะห์เชิงบริหาร</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PERSONNEL ACTIVITY SCOREBOARD                                 */}
      {/* ===================================================================== */}
      {activeTab === "scoreboard" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  ระดับความแอคทีฟและการมีส่วนร่วมในระบบ (Team Engagement Scoreboard)
                </h3>
                <p className="text-xs text-slate-500">
                  ประมวลผลจากกิจกรรมจริงในระบบ Supabase Audit Trail และภาระงานที่ได้รับมอบหมาย
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 size={13} />
                  <span>ข้อมูลจริงจากระบบ 100%</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {teamMembers.map(m => (
                <div
                  key={m.code || m.nickname}
                  onClick={() => {
                    setMemberFilter(m.code || "ALL");
                    setActiveTab("logs");
                  }}
                  title={`คลิกเพื่อดูประวัติกิจกรรมของ ${m.nickname}`}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black font-mono flex items-center justify-center text-xs shadow-xs shrink-0">
                        {m.code || m.nickname.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {m.nickname} {m.code ? `(${m.code})` : ""}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {m.name}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.status === "high_active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : m.status === "normal"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {m.status === "high_active" ? "แอคทีฟสูง" : m.status === "normal" ? "ปกติ" : "รอเริ่มกิจกรรม"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">ยูนิต:</span>
                      <span className="font-bold text-slate-800">{m.unit}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">กิจกรรมสะสม:</span>
                      <span className="font-mono font-bold text-slate-900">{m.totalActions} ครั้ง</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">เข้าใช้งานล่าสุด:</span>
                      <span className="font-mono font-bold text-slate-600">{m.lastActiveTime}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">การกระทำล่าสุด:</span>
                    <p className="text-slate-700 font-medium truncate">
                      {m.lastAction}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Activity Score</span>
                      <span className="font-bold text-slate-700">{m.activityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          m.activityScore >= 80
                            ? "bg-emerald-500"
                            : m.activityScore > 0
                            ? "bg-blue-500"
                            : "bg-slate-300"
                        }`}
                        style={{ width: `${m.activityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE AUDIT TRAIL LOGS                                          */}
      {/* ===================================================================== */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  บันทึกประวัติกิจกรรมจริงในระบบ ({logs.length} รายการ)
                </h4>
                <p className="text-xs text-slate-500">
                  ตรวจสอบย้อนกลับทุกการกระทำ ใครเปลี่ยนสถานะงาน ใครส่งออกข้อมูล หรือใครสำรองข้อมูล
                </p>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัสงาน, ชื่องาน, หรือผู้กระทำ..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-primary w-56 sm:w-64"
                  />
                </div>
                {memberFilter !== "ALL" && (
                  <button
                    onClick={() => {
                      setMemberFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>

            {/* Member Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setMemberFilter("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  memberFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>ทุกคนทั้งหมด</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  memberFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {logs.length}
                </span>
              </button>

              {teamMembers.map(m => {
                const isSelected = memberFilter === m.code;
                const memberLogCount = logs.filter(l => (l.actor_name || "").includes(m.nickname)).length;
                return (
                  <button
                    key={m.code || m.nickname}
                    onClick={() => setMemberFilter(m.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? "bg-[#E03131] text-white border-[#E03131] shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{m.nickname} {m.code ? `(${m.code})` : ""}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {memberLogCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Audit Trail List */}
            <div className="space-y-2.5 pt-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-14 text-slate-400 text-xs space-y-2">
                  <Clock size={28} className="mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600">ยังไม่มีประวัติกิจกรรมสะสมสำหรับปีงบประมาณ 2570</p>
                  <p className="text-[11px] text-slate-400">ระบบ Audit Trail พร้อมบันทึกทุกการเคลื่อนไหวเมื่อมีการเริ่มปฏิบัติงานจริง</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const dateDisplay = isNaN(dateObj.getTime())
                    ? log.timestamp
                    : dateObj.toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " น.";

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActionBadge(log.action)}
                          {log.task_code && (
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {log.task_code}
                            </span>
                          )}
                          <span className="font-bold text-slate-800">
                            {log.project_name || "ระบบงาน"}
                          </span>
                        </div>

                        {log.details?.updates && (
                          <div className="text-[11.5px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                            {log.details.previous?.status && log.details.updates?.status && (
                              <span>
                                สถานะ: <span className="line-through text-slate-400">{log.details.previous.status}</span> <ArrowRight size={10} className="inline mx-0.5" /> <span className="font-bold text-blue-600">{log.details.updates.status}</span>
                              </span>
                            )}
                            {log.details.updates?.deadline && (
                              <span>
                                กำหนดส่ง: <span className="font-semibold text-amber-700">{log.details.updates.deadline}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {log.details?.filename && (
                          <div className="text-[11.5px] text-teal-700">
                            ไฟล์สำรอง: {log.details.filename} ({log.details.totalBriefs} รายการ)
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10.5px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <User size={11} /> {log.actor_name} ({(log.actor_name?.includes("วา") || log.actor_email?.includes("wasita")) && log.actor_role === "admin" ? "assignee" : log.actor_role})
                          </span>
                          <span>•</span>
                          <span>{dateDisplay}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: IN-DEPTH EXECUTIVE & OPERATIONAL ANALYTICS                     */}
      {/* ===================================================================== */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          {/* Header Banner - Graphite Gradient Background */}
          <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-zinc-800">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      บทวิเคราะห์พฤติกรรมการทำงานและความพร้อมเชิงบริหาร (Executive Insights)
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 leading-relaxed">
                      ประมวลผลจากข้อมูลงานจริงในระบบปีงบประมาณ 2570 เพื่อสนับสนุนการตัดสินใจตามมาตรฐาน ISO 9001:2015
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    <CheckCircle2 size={13} /> ข้อมูลจริงในระบบ: {briefs.length} งาน
                  </span>
                </div>
              </div>

              {/* 4 Executive KPI Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 shadow-inner">
                  <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-semibold">งานกำลังผลิต (In Progress)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">{insights.activeTasksCount}</span>
                    <span className="text-xs font-bold text-blue-400">งาน</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">กระจายใน 4 ยูนิตสร้างสรรค์</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 shadow-inner">
                  <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-semibold">งานเสร็จสมบูรณ์ (Completed)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{insights.completedTasksCount}</span>
                    <span className="text-xs font-bold text-emerald-300">งาน</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">ส่งมอบตามเกณฑ์คุณภาพ</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 shadow-inner">
                  <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-semibold">งานช่วยร่วมยูนิต (Collaboration)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-400 font-mono">{insights.assistantTasksCount}</span>
                    <span className="text-xs font-bold text-purple-300">งานช่วย</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">เกลี่ยภาระงานข้ามสายงาน</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 shadow-inner">
                  <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider block font-semibold">งานเกินกำหนดส่ง (Overdue)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${insights.overdueTasksCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {insights.overdueTasksCount}
                    </span>
                    <span className="text-xs font-bold text-zinc-300">งาน</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {insights.overdueTasksCount === 0 ? "ตรงตามกำหนดเวลา" : "ควรเร่งติดตาม"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Operational Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1.5">
                <Briefcase size={13} /> มิติที่ 1 • การจัดสรรภาระงาน (Workload Allocation)
              </span>
              <h5 className="text-sm font-black text-slate-900">
                สถานะการกระจายงานจริงในรอบเวลา
              </h5>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 block">สรุปข้อมูลจริง:</span>
                <p className="text-slate-700">
                  {briefs.length === 0
                    ? "เริ่มต้นปีงบประมาณ 2570 ยังไม่มีบรีฟค้างในระบบ ทีมงานทั้ง 12 ท่านพร้อมรับงานใหม่อย่างเต็มกำลัง"
                    : `มีงานทั้งหมดในระบบ ${briefs.length} รายการ (กำลังทำ ${insights.activeTasksCount} งาน, รอมอบหมาย ${insights.pendingTasksCount} งาน)`}
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                <AlertTriangle size={13} /> มิติที่ 2 • การติดตามสถานะ &amp; กำหนดส่ง (Lead Time &amp; กำหนดส่งมอบ)
              </span>
              <h5 className="text-sm font-black text-slate-900">
                การควบคุมความล่าช้าและงานค้างรอบ
              </h5>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 block">สรุปข้อมูลจริง:</span>
                <p className="text-slate-700">
                  {insights.overdueTasksCount === 0
                    ? "ไม่พบงานที่เกินกำหนดส่งในระบบ การดำเนินงานของทีมเป็นไปตามกรอบเวลามาตรฐาน"
                    : `พบงานที่เกินกำหนดส่งจำนวน ${insights.overdueTasksCount} รายการ หัวหน้าทีมและผู้ช่วยควรเข้าติดตาม`}
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
                <TrendingUp size={13} /> มิติที่ 3 • สมดุลงานช่วย (Collaborative Support)
              </span>
              <h5 className="text-sm font-black text-slate-900">
                สถิติการช่วยงานข้ามสายงานและการประหยัดต้นทุน
              </h5>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 block">สรุปข้อมูลจริง:</span>
                <p className="text-slate-700">
                  {insights.assistantTasksCount === 0
                    ? "ยังไม่มีการบันทึกงานช่วยในรอบเวลา แนะนำให้ระบุผู้ช่วยในงานขนาดกลางและใหญ่เพื่อเกลี่ยภาระงาน"
                    : `มีการมอบหมายงานช่วยแล้ว ${insights.assistantTasksCount} งาน ช่วยลดคอขวดและเพิ่มขีดความสามารถของทีม`}
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-800 border border-violet-200 inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} /> มิติที่ 4 • การปิดรอบงาน &amp; CSAT (Quality Assurance)
              </span>
              <h5 className="text-sm font-black text-slate-900">
                การติดตามแบบประเมินความพึงพอใจตาม ISO 9001
              </h5>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 block">สรุปข้อมูลจริง:</span>
                <p className="text-slate-700">
                  {insights.completedTasksCount === 0
                    ? "ยังไม่มีงานที่ปิดสมบูรณ์ในรอบเวลา เมื่อส่งมอบงานแล้วระบบจะแจ้งเตือนให้ส่งแบบประเมิน CSAT ทันที"
                    : `ส่งมอบงานแล้ว ${insights.completedTasksCount} งาน (ได้รับการประเมินแล้ว ${insights.surveyedCount} งาน)`}
                </p>
              </div>
            </div>
          </div>

          {/* 12 Personnel Operational Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  ตารางสรุปภาระงานและสถานะบุคลากร (12 Personnel Operational Matrix)
                </h4>
                <p className="text-xs text-slate-500">
                  รายงานจำนวนงานจริงที่ได้รับมอบหมายและสถานะความพร้อมของแต่ละท่าน
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {teamMembers.length} สมาชิก • 3 ยูนิตปฏิบัติการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 px-3">สมาชิก</th>
                    <th className="py-2.5 px-3">ยูนิต</th>
                    <th className="py-2.5 px-3 text-center">งานที่รับมอบหมาย</th>
                    <th className="py-2.5 px-3 text-center">งานที่เสร็จสิ้น</th>
                    <th className="py-2.5 px-3">การกระทำล่าสุด</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map(m => (
                    <tr key={m.code || m.nickname} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                            {m.code || m.nickname.slice(0, 2)}
                          </span>
                          <div>
                            <strong className="text-slate-900 block font-bold">{m.nickname} {m.code ? `(${m.code})` : ""}</strong>
                            <span className="text-[10px] text-slate-400">{m.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{m.unit}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{m.assignedTasksCount} งาน</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">{m.completedTasksCount} งาน</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{m.lastAction}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.assignedTasksCount > 0
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {m.assignedTasksCount > 0 ? `กำลังผลิต ${m.assignedTasksCount} งาน` : "พร้อมรับงาน"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
