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
  BarChart3
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ExportDataDropdown from "./ExportDataDropdown";
import { COMPLETE_TEN_ACTIVITIES_PER_MEMBER, type ActivityLogItem } from "@/utils/activityLogsData";

interface TeamMemberActivity {
  code: string;
  name: string;
  nickname: string;
  unit: string;
  role: string;
  totalActions: number;
  lastAction: string;
  lastActiveTime: string;
  activityScore: number; // 0 - 100
  status: "high_active" | "normal" | "idle_warning";
}

const TEAM_MEMBERS_METADATA: TeamMemberActivity[] = [
  {
    code: "ST",
    name: "ผศ.ดร.สุริยะ ทองมุณี",
    nickname: "อ.บ่าว",
    unit: "บริหารทีม (Executive)",
    role: "รองผู้อำนวยการอุทยานฯ",
    totalActions: 18,
    lastAction: "ลงนามรับทราบมติที่ประชุมผู้บริหาร STeP",
    lastActiveTime: "วันนี้ 10:15 น.",
    activityScore: 92,
    status: "high_active"
  },
  {
    code: "AA",
    name: "นายอัจชนะพงษ์ อัจชนะวราทา",
    nickname: "จ๊อบ",
    unit: "บริหารทีม (Leader)",
    role: "หัวหน้าทีมสร้างสรรค์และการสื่อสาร",
    totalActions: 48,
    lastAction: "ตรวจสอบและอนุมัติบรีฟงาน Key Visual",
    lastActiveTime: "15 นาทีที่แล้ว",
    activityScore: 98,
    status: "high_active"
  },
  {
    code: "WK",
    name: "นางสาววาสิตา กอบธัญกิจ",
    nickname: "วา",
    unit: "บริหารทีม (Assistant)",
    role: "ผู้ช่วยหัวหน้าทีม",
    totalActions: 42,
    lastAction: "มอบหมายงานในขั้นตอน WI-CC-001",
    lastActiveTime: "30 นาทีที่แล้ว",
    activityScore: 96,
    status: "high_active"
  },
  {
    code: "RL",
    name: "นางสาวรติพร กัลปพฤกษ์",
    nickname: "จอย",
    unit: "ยูนิตงานออกแบบ",
    role: "พนักงานออกแบบสร้างสรรค์",
    totalActions: 36,
    lastAction: "อัปเดตสถานะชิ้นงานเป็น Completed",
    lastActiveTime: "1 ชั่วโมงที่แล้ว",
    activityScore: 94,
    status: "high_active"
  },
  {
    code: "AC",
    name: "นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี",
    nickname: "พิม",
    unit: "ยูนิตงานออกแบบ",
    role: "พนักงานออกแบบสร้างสรรค์",
    totalActions: 29,
    lastAction: "อัปโหลด Artwork และ Mockup บรรจุภัณฑ์",
    lastActiveTime: "2 ชั่วโมงที่แล้ว",
    activityScore: 90,
    status: "high_active"
  },
  {
    code: "LLP",
    name: "นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์",
    nickname: "เยียร์",
    unit: "ยูนิตงานออกแบบ",
    role: "พนักงานออกแบบสร้างสรรค์",
    totalActions: 22,
    lastAction: "แก้ไขไฟล์กราฟิกตามข้อสั่งการ AD",
    lastActiveTime: "วันนี้ 09:40 น.",
    activityScore: 84,
    status: "normal"
  },
  {
    code: "MTN",
    name: "นางสาวมัทนิน ยงค์ไสว",
    nickname: "นิน",
    unit: "ยูนิตงานออกแบบ",
    role: "พนักงานออกแบบสร้างสรรค์",
    totalActions: 20,
    lastAction: "ส่งแบบร่าง Moodboard งานนิทรรศการ",
    lastActiveTime: "เมื่อวาน 16:20 น.",
    activityScore: 80,
    status: "normal"
  },
  {
    code: "IK",
    name: "นายอิศรา แก้วเรือง",
    nickname: "ก้อง",
    unit: "ยูนิตงานออกแบบ",
    role: "พนักงานออกแบบสร้างสรรค์",
    totalActions: 19,
    lastAction: "ตรวจสอบความสอดคล้อง Font CI",
    lastActiveTime: "เมื่อวาน 14:10 น.",
    activityScore: 78,
    status: "normal"
  },
  {
    code: "STK",
    name: "นางสาวสุทธิอาภา คุ้มครอง",
    nickname: "ลูกอิน",
    unit: "ยูนิตสื่อสารองค์กร",
    role: "พนักงานสร้างสรรค์และสื่อสารองค์กร",
    totalActions: 38,
    lastAction: "เผยแพร่ข่าวประชาสัมพันธ์ผ่านสื่อมวลชน",
    lastActiveTime: "45 นาทีที่แล้ว",
    activityScore: 95,
    status: "high_active"
  },
  {
    code: "CNB",
    name: "นางสาวชนนิกานต์ บุญแก้ว",
    nickname: "โอ๊ต",
    unit: "ยูนิตสื่อสารองค์กร",
    role: "พนักงานสร้างสรรค์และสื่อสารองค์กร",
    totalActions: 27,
    lastAction: "จัดทำกำหนดการ Press Tour สื่อมวลชน",
    lastActiveTime: "วันนี้ 11:30 น.",
    activityScore: 88,
    status: "high_active"
  },
  {
    code: "SLR",
    name: "นางสาวศิริลักษณ์ กันจะนะ",
    nickname: "เอ็นจอย",
    unit: "ยูนิตผลิตสื่อสร้างสรรค์",
    role: "พนักงานผลิตสื่อสร้างสรรค์",
    totalActions: 34,
    lastAction: "ตัดต่อคลิปสั้น Reels ตอนที่ 18 เสร็จสิ้น",
    lastActiveTime: "1 ชั่วโมงที่แล้ว",
    activityScore: 92,
    status: "high_active"
  },
  {
    code: "KYK",
    name: "นางสาวกัลยกร อภิวงศ์",
    nickname: "แก้ว",
    unit: "ยูนิตผลิตสื่อสร้างสรรค์",
    role: "พนักงานผลิตสื่อสร้างสรรค์",
    totalActions: 24,
    lastAction: "บันทึกเสียงบรรยาย Voice Over วิดีโอ",
    lastActiveTime: "เมื่อวาน 15:50 น.",
    activityScore: 82,
    status: "normal"
  },
  {
    code: "TTY",
    name: "นางสาวฐิติยา เข็มพล",
    nickname: "ต้า",
    unit: "ยูนิตผลิตสื่อสร้างสรรค์",
    role: "พนักงานผลิตสื่อสร้างสรรค์",
    totalActions: 12,
    lastAction: "จัดเก็บไฟล์ฟุตเทจวิดีโอลง Google Drive กลาง",
    lastActiveTime: "3 วันที่แล้ว",
    activityScore: 58,
    status: "idle_warning"
  }
];

const DEFAULT_ACTIVITY_LOGS: ActivityLogItem[] = COMPLETE_TEN_ACTIVITIES_PER_MEMBER;

export default function ActivityLogReportDetail() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberActivity[]>(TEAM_MEMBERS_METADATA);
  const [logs, setLogs] = useState<ActivityLogItem[]>(COMPLETE_TEN_ACTIVITIES_PER_MEMBER);
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"scoreboard" | "logs" | "insights">("scoreboard");

  // Load saved logs if any and ensure at least 130 items (10 per person)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_activity_logs_v2");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 130) {
            setLogs(parsed);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLogs(COMPLETE_TEN_ACTIVITIES_PER_MEMBER);
      localStorage.setItem("cc_activity_logs_v2", JSON.stringify(COMPLETE_TEN_ACTIVITIES_PER_MEMBER));
    }
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (memberFilter !== "ALL" && log.userCode !== memberFilter) return false;
      if (unitFilter !== "ALL" && !log.unit.includes(unitFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.userName.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.targetModule.toLowerCase().includes(q) ||
          log.targetId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, memberFilter, unitFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const highActive = teamMembers.filter(m => m.status === "high_active").length;
    const idleWarning = teamMembers.filter(m => m.status === "idle_warning").length;
    const totalActions = teamMembers.reduce((acc, c) => acc + c.totalActions, 0);

    return { totalMembers, highActive, idleWarning, totalActions };
  }, [teamMembers]);

  // Export to CSV
  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"บันทึกกิจกรรมและความเคลื่อนไหวของทีม CC (Team Activity Audit Trail)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");
    lines.push('"ลำดับ","วันเวลา","สมาชิก","ยูนิต","ประเภทกิจกรรม","โมดูลที่ทำ","รหัสอ้างอิง","รายละเอียด"');

    logs.forEach((l, idx) => {
      lines.push(`${idx + 1},"${l.timestamp}","${l.userName}","${l.unit}","${l.actionType}","${l.targetModule}","${l.targetId}","${l.details.replace(/"/g, '""')}"`);
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Activity_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-800 text-xs font-bold border border-violet-200">
              <Activity size={14} className="text-violet-600" />
              <span>CC Team Activity &amp; Operational Engagement Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              บันทึกกิจกรรมและความแอคทีฟของทีม (Activity Log)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ติดตามการเข้าใช้งานระบบ การจัดการชิ้นงาน และการมีส่วนร่วมของสมาชิกทั้ง 13 ท่าน เพื่อตรวจสอบความคืบหน้า ป้องกันการละเลยงาน และสร้างความโปร่งใสในกระบวนการ
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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
              <span className="text-xs text-slate-500">ท่าน (ครบ 3 ยูนิต)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">ผู้บริหาร • ผู้นำทีม • พนักงาน</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">ความแอคทีฟระดับสูง</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.highActive}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {Math.round((stats.highActive / stats.totalMembers) * 100)}%
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-700 mt-1">มีกิจกรรมสม่ำเสมอใน 24 ชม.</p>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80">
            <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider block">กิจกรรมทั้งหมดในระบบ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-violet-600">{stats.totalActions}</span>
              <span className="text-xs text-violet-700 font-mono">Operations</span>
            </div>
            <p className="text-[10.5px] text-violet-700 mt-1">อัปเดตงาน • ส่งประเมิน • WI</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">เฝ้าระวัง / นิ่งนาน (Idle)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.idleWarning}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                ควรติดตาม
              </span>
            </div>
            <p className="text-[10.5px] text-amber-700 mt-1">ไม่มีความเคลื่อนไหวเกิน 48 ชม.</p>
          </div>
        </div>

        {/* 3 Nav Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 pt-2 overflow-hidden">
          <button
            onClick={() => setActiveTab("scoreboard")}
            className={`px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === "scoreboard"
                ? "border-[#E03131] text-[#E03131]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck size={16} className="shrink-0" />
            <span className="truncate">1. ความแอคทีฟรายบุคคล</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === "logs"
                ? "border-[#E03131] text-[#E03131]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock size={16} className="shrink-0" />
            <span className="truncate">2. ไทม์ไลน์กิจกรรมล่าสุด</span>
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === "insights"
                ? "border-[#E03131] text-[#E03131]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles size={16} className={`shrink-0 ${activeTab === "insights" ? "text-[#E03131]" : "text-amber-500"}`} />
            <span className="truncate">3. บทวิเคราะห์ AI Insights</span>
          </button>
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
                  คำนวณจากความถี่ในการอัปเดตงาน การส่งแบบประเมิน การตรวจสอบ WI และการแก้ไขบันทึก (คลิกที่การ์ดเพื่อดู 10 กิจกรรมล่าสุด)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <Flame size={13} />
                  <span>เกณฑ์ปกติ: มีกิจกรรมอย่างน้อยสัปดาห์ละ 5 ครั้ง</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {teamMembers.map(m => (
                <div
                  key={m.code}
                  onClick={() => {
                    setMemberFilter(m.code);
                    setActiveTab("logs");
                  }}
                  title={`คลิกเพื่อดู 10 กิจกรรมล่าสุดของ ${m.nickname} (${m.code})`}
                  className={`p-4 rounded-2xl border transition-all space-y-3 shadow-2xs cursor-pointer hover:scale-[1.01] ${
                    m.status === "high_active"
                      ? "bg-slate-50/80 border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                      : m.status === "normal"
                      ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                      : "bg-amber-50/50 border-amber-300 ring-2 ring-amber-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black font-mono flex items-center justify-center text-xs shadow-xs shrink-0">
                        {m.code}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {m.nickname} ({m.code})
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {m.name}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.status === "high_active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : m.status === "normal"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}>
                      {m.status === "high_active" ? "แอคทีฟมาก 🔥" : m.status === "normal" ? "ปกติ" : "นิ่งนาน ⚠️"}
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

                  <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-[11px] space-y-0.5">
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
                          m.activityScore >= 90
                            ? "bg-emerald-500"
                            : m.activityScore >= 75
                            ? "bg-blue-500"
                            : "bg-amber-500"
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
      {/* TAB 2: LIVE AUDIT TRAIL LOGS (10 กิจกรรมล่าสุดของแต่ละคน)              */}
      {/* ===================================================================== */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Quick Notice to Tab 3: AI Insights */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="font-bold text-white block sm:inline mr-2">
                  ต้องการดูบทวิเคราะห์พฤติกรรมการทำงานและข้อเสนอแนะเชิงบริหารฉบับเต็ม?
                </span>
                <span className="text-slate-400 text-[11px]">
                  เข้าถึง 4 มิติการวิเคราะห์เชิงลึก, ดัชนีสุขภาพ 4 ยูนิต, และตารางกำกับดูแล 13 บุคลากร
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("insights")}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>เปิดแท็บ 3: บทวิเคราะห์เชิงบริหาร</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 2. MEMBER FILTER BAR: 13 บุคลากร (คนละ 10 กิจกรรมล่าสุด) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    เลือกดู 10 กิจกรรมล่าสุดของแต่ละคน ({teamMembers.length} บุคลากร • รวม {logs.length} บันทึก)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                    10 รายการ/คน
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  คลิกที่ชื่อเพื่อกรองดูประวัติ 10 รายการย้อนหลังอย่างละเอียดของแต่ละคน
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
                    placeholder="ค้นหาชื่อ, รหัสงาน หรือข้อความ..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
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
                const memberLogCount = logs.filter(l => l.userCode === m.code).length;
                return (
                  <button
                    key={m.code}
                    onClick={() => setMemberFilter(m.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? "bg-[#E03131] text-white border-[#E03131] shadow-2xs"
                        : m.status === "idle_warning"
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? "bg-white"
                        : m.status === "high_active"
                        ? "bg-emerald-500"
                        : m.status === "idle_warning"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-blue-400"
                    }`} />
                    <span>{m.nickname} ({m.code})</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {memberLogCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Member Detail Focus Banner */}
            {memberFilter !== "ALL" && (() => {
              const activeMember = teamMembers.find(m => m.code === memberFilter);
              if (!activeMember) return null;
              return (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-mono font-black text-base flex items-center justify-center shrink-0">
                      {activeMember.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          {activeMember.name} ({activeMember.nickname})
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {activeMember.unit}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeMember.status === "high_active"
                            ? "bg-emerald-100 text-emerald-800"
                            : activeMember.status === "idle_warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {activeMember.status === "high_active" ? "Active สูง" : activeMember.status === "idle_warning" ? "เฝ้าระวัง / นิ่ง" : "ปกติ"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ตำแหน่ง: {activeMember.role} • ใช้งานล่าสุด: <span className="font-mono text-slate-700 font-bold">{activeMember.lastActiveTime}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Activity Score</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{activeMember.activityScore}%</span>
                    </div>
                    <button
                      onClick={() => setMemberFilter("ALL")}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      ดูทุกคน
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Audit Trail Feed */}
            <div className="space-y-2.5 pt-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  ไม่พบข้อมูลกิจกรรมที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  // If filtered to a specific member, compute order 1 to 10
                  const isSingleMember = memberFilter !== "ALL";
                  const itemNumber = isSingleMember ? index + 1 : null;

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        {isSingleMember && (
                          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-mono font-black flex items-center justify-center text-[10px] shrink-0 mt-1">
                            #{itemNumber}
                          </div>
                        )}

                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {log.userCode}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{log.userName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                              {log.unit}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-100 text-violet-800">
                              {log.targetModule}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {log.targetId}
                            </span>
                          </div>

                          <p className="text-slate-700 font-medium">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 sm:self-center font-mono text-[11px] text-slate-400">
                        {log.timestamp}
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
      {/* TAB 3: IN-DEPTH AI INSIGHTS & STRATEGIC MANAGEMENT ANALYTICS          */}
      {/* ===================================================================== */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          {/* 1. EXECUTIVE HEADER BANNER */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/30 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        บทวิเคราะห์พฤติกรรมการทำงานและข้อเสนอแนะเชิงบริหารเชิงลึก
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">
                        AI Strategic Intelligence 2.0
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      ระบบติดตามและวิเคราะห์ความสอดคล้องตามขั้นตอน WI-CC-001, เกณฑ์ SLA, ดัชนีความต่อเนื่อง และการเกลี่ยภาระงาน 13 บุคลากร
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    <CheckCircle2 size={13} /> ปกติ 12 ท่าน
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono animate-pulse">
                    <AlertTriangle size={13} /> เฝ้าระวัง 1 ท่าน (TTY)
                  </span>
                </div>
              </div>

              {/* 4 Executive KPI Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block">ความสม่ำเสมอในระบบ</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">92.3%</span>
                    <span className="text-[11px] font-bold text-emerald-400">High Active</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">12 สมาชิกมีความเคลื่อนไหวสม่ำเสมอ</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block">การตอบสนองคำขอเฉลี่ย</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">1.8 วัน</span>
                    <span className="text-[11px] font-bold text-amber-300">ตามกรอบ SLA</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">เป้าหมายมาตรฐานไม่เกิน 2.5 วัน</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block">สัดส่วนงานช่วย (Assistant)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-400 font-mono">37.5%</span>
                    <span className="text-[11px] font-bold text-blue-300">Save Cost สูง</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">ช่วยเกลี่ยภาระงานข้ามสายงาน</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block">การส่งมอบตรงเวลา</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">98.5%</span>
                    <span className="text-[11px] font-bold text-emerald-300">ISO 9001</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">ไม่มีงานค้างเกินกำหนดหลุดรอบ</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 4 IN-DEPTH ACTIONABLE PILLARS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-slate-900 text-white shadow-2xs">
                <Target size={16} />
              </span>
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                4 เสาหลักการวิเคราะห์เชิงลึกและมาตรการปฏิบัติการเชิงบริหาร
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PILLAR 1: การมอบหมายงานและควบคุมขั้นตอน WI-CC-001 */}
              <div className="bg-white rounded-3xl border border-rose-200/80 p-5 shadow-2xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                    <Briefcase size={13} /> มิติที่ 1 • การมอบหมายงาน (Work Assignment)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    เป้าหมาย: วา (WK)
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-snug">
                    วา ควรจะรีบ assign งานให้นักออกแบบในระบบมากขึ้น
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>ขอบเขตอำนาจหน้าที่:</strong> วา ดูแลและกำกับเฉพาะ <strong>ยูนิตงานออกแบบ (5 คน: จอย, พิม, เยียร์, นิน, ก้อง)</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                    🔍 ข้อค้นพบเชิงลึก (Analytical Findings):
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    ตรวจพบคำขอรับบริการและ Brief งานใหม่รอการจัดสรรเฉลี่ย 1.2 วัน ซึ่งเกินเกณฑ์เริ่มต้นที่ควรระบุผู้รับผิดชอบทันที วาควรรีบกระจายงานในระบบ WI-CC-001 ขั้นตอนที่ 2 เพื่อไม่ให้เกิดคอขวดสะสม และป้องกันไม่ให้ชิ้นงานกระจุกตัวอยู่ที่ จอย (RL) และ พิม (AC) เพียง 2 คน
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-rose-800 uppercase tracking-wider block">
                    📋 มาตรการปฏิบัติการที่แนะนำ (Actionable Directives):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                    <li>วา เข้าตรวจสอบระบบ Brief Queue ทุกวัน เวลา 09:00 น. และ 13:30 น.</li>
                    <li>ระบุผู้รับผิดชอบหลัก (Owner) และงานช่วย (Assistant) ภายใน 4 ชม. หลังรับคำขอ</li>
                    <li>กระจายงาน Artwork และ Mockup ให้ เยียร์ (LLP), นิน (MTN), ก้อง (IK) เพิ่มเติม</li>
                  </ul>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMemberFilter("WK");
                      setActiveTab("logs");
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>ดู 10 กิจกรรมการ Assign ของ วา (WK)</span>
                    <ArrowRight size={13} />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">เกณฑ์ SLA: ≤ 4 ชม.</span>
                </div>
              </div>

              {/* PILLAR 2: การติดตามการไม่เลื่อนสถานะงานและ Inactivity */}
              <div className="bg-white rounded-3xl border border-amber-200/80 p-5 shadow-2xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> มิติที่ 2 • การติดตามสถานะ & Inactivity
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    เป้าหมาย: จ๊อบ (AA)
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-snug">
                    จ๊อบ ควรไปพูดคุยกับ ต้า (TTY) เรื่องการไม่มาเลื่อนสถานะงาน หรือไม่เข้าระบบเลย
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>ขอบเขตอำนาจหน้าที่:</strong> ต้า (TTY) สังกัด <strong>ยูนิตผลิตสื่อสร้างสรรค์</strong> ขึ้นตรงกับ <strong>จ๊อบ (AA - หัวหน้าทีม)</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                    🔍 ข้อค้นพบเชิงลึก (Analytical Findings):
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    พบว่า ต้า (TTY) ไม่มีความเคลื่อนไหวหรือบันทึกกิจกรรมในระบบเกิน 48 ชั่วโมง (Activity Score ตกไปที่ 58%) ขณะที่มีงานค้างในมือสถานะ In Progress ซึ่งเนื่องจากวาดูแลเฉพาะนักออกแบบ จ๊อบ (หัวหน้าทีม) จึงต้องเป็นผู้เข้าไปพูดคุยสอบถามปัญหาหน้างานและกำชับให้เข้าระบบ
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider block">
                    📋 มาตรการปฏิบัติการที่แนะนำ (Actionable Directives):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                    <li>จ๊อบ เข้าไปสอบถามปัญหาหน้างาน (อุปกรณ์ถ่ายทำ/ตัดต่อ, ฟุตเทจค้างส่ง หรือภาระงานอื่น)</li>
                    <li>กำชับให้ต้าเข้ามาเลื่อนสถานะงานในระบบแบบ Real-time ทุกครั้งที่มีความคืบหน้า</li>
                    <li>จัดสรรผู้ช่วย เช่น เอ็นจอย (SLR) หรือ แก้ว (KYK) เข้ามาร่วมตัดต่อเพื่อปลดล็อกคอขวด</li>
                  </ul>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setMemberFilter("TTY");
                        setActiveTab("logs");
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>ดู 10 กิจกรรมของ ต้า (TTY)</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setMemberFilter("AA");
                        setActiveTab("logs");
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>ดูของ จ๊อบ (AA)</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-amber-600 font-bold">เฝ้าระวัง 48 ชม.</span>
                </div>
              </div>

              {/* PILLAR 3: การเกลี่ยสมดุลงานหลักและงานช่วย */}
              <div className="bg-white rounded-3xl border border-blue-200/80 p-5 shadow-2xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                    <TrendingUp size={13} /> มิติที่ 3 • สมดุลงานช่วย (Workload Balance)
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    เป้าหมาย: ทีม CC ทั้งหมด
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-snug">
                    จัดสรรงานช่วย (Assistant Tasks) ร่วมกันเพื่อลด Overload และเพิ่ม Save Cost
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>การประเมิน:</strong> กราฟ 2 แท่งสะท้อนว่างานช่วยสร้างมูลค่าลดต้นทุนหน่วยงานได้สูงมาก
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                    🔍 ข้อค้นพบเชิงลึก (Analytical Findings):
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    สถิติงานช่วยกระจุกตัวอยู่ที่ จอย (RL - 12 งาน), จ๊อบ (AA - 8 งาน), และ ลูกอิน (STK - 7 งาน) ในขณะที่สมาชิกบางท่านยังมีงานช่วยน้อยกว่า 2 งาน การกระจายงานช่วยจะช่วยลดความเหนื่อยล้าของสมาชิกหลัก และเพิ่มการเรียนรู้ทักษะใหม่ระหว่างยูนิต
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-blue-800 uppercase tracking-wider block">
                    📋 มาตรการปฏิบัติการที่แนะนำ (Actionable Directives):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                    <li>กำหนดให้งานขนาด M และ L ต้องมีผู้ช่วย (Assistant) ร่วมทำงานอย่างน้อย 1 คนเสมอ</li>
                    <li>ส่งเสริมนักออกแบบและทีมผลิตสื่อหมุนเวียนรับงานช่วยข้ามสายงาน (Cross-functional)</li>
                    <li>ตรวจสถิติกราฟ 2 แท่ง (งานช่วย vs เงินที่ได้จากงานช่วย) ใน Dashboard ประจำเดือน</li>
                  </ul>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab("scoreboard")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>ดูตารางความแอคทีฟ 13 บุคลากร</span>
                    <ArrowRight size={13} />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">เป้าหมายงานช่วย: ≥ 25%</span>
                </div>
              </div>

              {/* PILLAR 4: การปิดรอบงานและการประเมินความพึงพอใจ CSAT */}
              <div className="bg-white rounded-3xl border border-violet-200/80 p-5 shadow-2xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-800 border border-violet-200 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> มิติที่ 4 • การปิดรอบงาน & CSAT (Quality Assurance)
                  </span>
                  <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                    เป้าหมาย: วา & ทีม PR
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-snug">
                    เร่งส่งแบบประเมินความพึงพอใจ WI-CC-001 ขั้นตอนที่ 5 เพื่อรองรับ ISO 9001
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>การประเมิน:</strong> คะแนน CSAT ส่งผลโดยตรงต่อ KPI R2, R4, R9 และ TIP10
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                    🔍 ข้อค้นพบเชิงลึก (Analytical Findings):
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    มีชิ้นงานที่สถานะขึ้นเป็น Completed แล้วแต่ยังค้างการส่งแบบประเมิน CSAT กลับสู่ผู้ขอรับบริการ ทำให้ระบบไม่สามารถคำนวณคะแนนความพึงพอใจเฉลี่ยได้อย่างสมบูรณ์ วา และ ทีมสื่อสารองค์กร ควรประสานงานปิดรอบงานให้ครบวงจร
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-violet-50/60 border border-violet-100 text-xs space-y-1.5">
                  <span className="text-[10.5px] font-bold text-violet-800 uppercase tracking-wider block">
                    📋 มาตรการปฏิบัติการที่แนะนำ (Actionable Directives):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                    <li>วา ตรวจสอบรายการ Completed Briefs และส่งลิงก์ CSAT ภายใน 48 ชม. หลังส่งมอบงาน</li>
                    <li>กำหนดเกณฑ์คะแนนเฉลี่ยความพึงพอใจรวมของทีมต้องไม่ต่ำกว่า 85.0%</li>
                    <li>นำผลตอบรับของผู้ใช้บริการเสนอในที่ประชุมทบทวนการทำงาน (Management Review) ประจำเดือน</li>
                  </ul>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMemberFilter("ALL");
                      setActiveTab("logs");
                    }}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>ดูไทม์ไลน์บันทึกกิจกรรมทั้ง 130 รายการ</span>
                    <ArrowRight size={13} />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">เป้าหมาย CSAT: ≥ 85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. UNIT HEALTH & OPERATIONAL READINESS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-slate-900 text-white shadow-2xs">
                  <Layers size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    ดัชนีสุขภาพและความพร้อมแยกตาม 4 ยูนิตย่อย (Unit Health & Operational Readiness)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ประเมินอัตราความแอคทีฟ, สายการบังคับบัญชา, และข้อเสนอแนะพัฒนาเฉพาะทาง
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                13 สมาชิก • 4 ยูนิต
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Unit 1: Creative Design */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-800">
                      ยูนิตงานออกแบบ
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">85.2%</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 mt-2">Creative Design</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ผู้ดูแลสายตรง: <strong className="text-slate-800">วา (WK)</strong> • 5 คน
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    ผลงาน Artwork & Mockup ได้มาตรฐานดีเด่น วาควรเร่ง Assign งาน และเกลี่ยงานช่วยจากจอย/พิมสู่คนอื่น
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>สถานะ: คล่องตัวสูง</span>
                  <span className="text-emerald-600 font-bold">● ปกติ</span>
                </div>
              </div>

              {/* Unit 2: Corporate PR */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ยูนิตสื่อสารองค์กร
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">91.0%</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 mt-2">PR & Communication</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ผู้ดูแลสายตรง: <strong className="text-slate-800">อ.บ่าว (ST) / ลูกอิน (STK)</strong> • 2 คน
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    การลงข่าว PR และประสานงานสื่อมวลชนรวดเร็วต่อเนื่อง ปริมาณงานช่วยข้ามยูนิตสูงและมีประสิทธิภาพ
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>สถานะ: เข้มแข็งมาก</span>
                  <span className="text-emerald-600 font-bold">● ปกติ</span>
                </div>
              </div>

              {/* Unit 3: Media Production */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                      ยูนิตผลิตสื่อสร้างสรรค์
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700">71.3%</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 mt-2">Media Production</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ผู้ดูแลสายตรง: <strong className="text-slate-800">จ๊อบ (AA)</strong> • 3 คน
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    มีจุดเฝ้าระวังกรณี ต้า (TTY) ไม่มีความเคลื่อนไหวเกิน 48 ชม. จ๊อบ (หัวหน้าทีม) ควรเข้าไปติดตามเร่งด่วน
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-200/60 text-[10px] text-amber-700 font-mono flex items-center justify-between">
                  <span>สถานะ: ควรติดตาม</span>
                  <span className="text-amber-600 font-bold animate-pulse">● เฝ้าระวัง 1 จุด</span>
                </div>
              </div>

              {/* Unit 4: Management & Executive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                      บริหารและยุทธศาสตร์
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">97.0%</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 mt-2">Management & Exec</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ผู้ดูแลสายตรง: <strong className="text-slate-800">จ๊อบ (AA)</strong> • 3 คน
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    การขับเคลื่อนนโยบาย แผนงาน 2570 และการประสานงานระบบ ISO 9001:2015 มีความเข้มแข็งครบถ้วน
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>สถานะ: มีเสถียรภาพสูง</span>
                  <span className="text-emerald-600 font-bold">● ยอดเยี่ยม</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 13-PERSONNEL OPERATIONAL MATRIX TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-slate-900 text-white shadow-2xs">
                  <Users size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    ตารางเมทริกซ์การบริหารและกำกับดูแลรายบุคคล (13 Personnel Operational Matrix)
                  </h4>
                  <p className="text-xs text-slate-500">
                    สรุปสายการกำกับดูแล, คะแนนความแอคทีฟ, ข้อสังเกตเชิงลึก, และแผนปฏิบัติการเฉพาะบุคคล
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ข้อมูลอัปเดตตาม 130 กิจกรรมล่าสุด
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 px-3">สมาชิก</th>
                    <th className="py-2.5 px-3">ยูนิต</th>
                    <th className="py-2.5 px-3">ผู้ดูแลสายตรง</th>
                    <th className="py-2.5 px-3 text-center">Activity Score</th>
                    <th className="py-2.5 px-3">ข้อสังเกตเชิงลึก (Observations)</th>
                    <th className="py-2.5 px-3">แผนปฏิบัติการที่แนะนำ (Action Plan)</th>
                    <th className="py-2.5 px-3 text-center">ดูประวัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. AA */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          AA
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">จ๊อบ (AA)</strong>
                          <span className="text-[10px] text-slate-400">หัวหน้าทีม</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">บริหารทีม</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">หัวหน้าทีม</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">98%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ขับเคลื่อนงานหลัก คุม SLA สถิติงานช่วยสูง (8 งาน)
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      เข้าไปพูดคุยกับ ต้า (TTY) เรื่องการไม่เลื่อนสถานะ และเกลี่ยงานช่วย
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("AA");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 2. WK */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-rose-50/20">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          WK
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">วา (WK)</strong>
                          <span className="text-[10px] text-slate-400">ผู้ช่วยหัวหน้าทีม</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">บริหาร / ดูแลออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-rose-700">จ๊อบ (AA)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">96%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      รับผิดชอบดูแลเฉพาะทีมนักออกแบบ 5 คน (RL, AC, LLP, MTN, IK)
                    </td>
                    <td className="py-2.5 px-3 text-rose-700 font-bold">
                      เร่ง Assign งานใน WI-CC-001 ให้นักออกแบบ และส่งแบบประเมิน CSAT
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("WK");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 3. RL */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          RL
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">จอย (RL)</strong>
                          <span className="text-[10px] text-slate-400">นักออกแบบ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">งานออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">วา (WK)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">94%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      งานช่วยสูงสุดในทีม (12 งาน) งานหลัก 4 งาน เสี่ยง Overload
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      กระจายงานช่วยให้นักออกแบบคนอื่นร่วมรับผิดชอบ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("RL");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 4. AC */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          AC
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">พิม (AC)</strong>
                          <span className="text-[10px] text-slate-400">นักออกแบบ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">งานออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">วา (WK)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">90%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ส่งมอบเร็วเฉลี่ย 1.6 วัน ตรงเวลา 100%
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      เป็นพี่เลี้ยงช่วยตรวจ Artwork และเป็นผู้ช่วยในงานใหญ่
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("AC");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 5. LLP */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          LLP
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">เยียร์ (LLP)</strong>
                          <span className="text-[10px] text-slate-400">นักออกแบบ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">งานออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">วา (WK)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">84%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      งานกราฟิกและสื่อออนไลน์สม่ำเสมอ งานช่วยยังมีน้อย (2 งาน)
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      วา จัดสรรงานช่วยด้าน Infographic เสริมเพิ่มเติม
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("LLP");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 6. MTN */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          MTN
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">นิน (MTN)</strong>
                          <span className="text-[10px] text-slate-400">นักออกแบบ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">งานออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">วา (WK)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">80%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ชำนาญ Moodboard และนิทรรศการ เข้าระบบปานกลาง
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      สนับสนุนให้รับงานช่วยข้ามยูนิตกับทีมสื่อสารองค์กร
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("MTN");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 7. IK */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          IK
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">ก้อง (IK)</strong>
                          <span className="text-[10px] text-slate-400">นักออกแบบ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">งานออกแบบ</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">วา (WK)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">78%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      เชี่ยวชาญ Font CI และ Brand Identity งานช่วยยังต่ำ (1 งาน)
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      มอบหมายให้เป็นผู้ช่วยตรวจความสอดคล้อง Font CI ในทุกงาน
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("IK");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 8. STK */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          STK
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">ลูกอิน (STK)</strong>
                          <span className="text-[10px] text-slate-400">สื่อสารองค์กร</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">สื่อสารองค์กร</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">อ.บ่าว (ST)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">95%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ประสานงานสื่อมวลชนรวดเร็ว บันทึกกิจกรรมถี่ งานช่วยสูง (7 งาน)
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      ร่วมกับ วา ติดตามผลประเมินความพึงพอใจ CSAT ย้อนหลัง
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("STK");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 9. CNB */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          CNB
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">โอ๊ต (CNB)</strong>
                          <span className="text-[10px] text-slate-400">สื่อสารองค์กร</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">สื่อสารองค์กร</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">อ.บ่าว (ST)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">88%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      เผยแพร่ข่าวและสร้าง Reach & Engagement สูง
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      ผลักดันเป้าหมายยอด Reach ในตัวชี้วัด KPI KR3
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("CNB");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 10. SLR */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          SLR
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">เอ็นจอย (SLR)</strong>
                          <span className="text-[10px] text-slate-400">ผลิตสื่อ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">ผลิตสื่อสร้างสรรค์</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">จ๊อบ (AA)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">86%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ถ่ายทำและตัดต่อ Reel คล่องตัว บันทึกฟุตเทจสม่ำเสมอ
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      จับคู่บัดดี้ร่วมช่วยงานตัดต่อของ ต้า (TTY) เพื่อเร่งปิดงาน
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("SLR");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 11. KYK */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          KYK
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">แก้ว (KYK)</strong>
                          <span className="text-[10px] text-slate-400">ผลิตสื่อ</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">ผลิตสื่อสร้างสรรค์</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">จ๊อบ (AA)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">82%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      ควบคุมเสียงและบันทึกสตูดิโอดีเด่น งานช่วยยังมีน้อย
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      ช่วยทำ Motion Graphic และ Sound Effect ให้ทีมออกแบบ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("KYK");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 12. TTY */}
                  <tr className="hover:bg-amber-50/80 transition-colors bg-amber-50/40">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-mono font-bold flex items-center justify-center text-[10px] animate-pulse">
                          TTY
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">ต้า (TTY)</strong>
                          <span className="text-[10px] text-amber-700 font-bold">ผลิตสื่อ (เฝ้าระวัง)</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">ผลิตสื่อสร้างสรรค์</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-800">จ๊อบ (AA)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-amber-600">58%</td>
                    <td className="py-2.5 px-3 text-amber-900 font-medium leading-relaxed">
                      ⚠️ ไม่มีความเคลื่อนไหวเกิน 48 ชม. มีงานค้าง In Progress
                    </td>
                    <td className="py-2.5 px-3 text-amber-900 font-bold">
                      จ๊อบ (หัวหน้าทีม) เข้าไปพูดคุยสอบถามปัญหา และกำชับให้เลื่อนสถานะ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("TTY");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>

                  {/* 13. ST */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          ST
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">อ.บ่าว (ST)</strong>
                          <span className="text-[10px] text-slate-400">บริหารทีม</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">บริหาร / ยุทธศาสตร์</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">ผู้อำนวยการ</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">97%</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                      กำกับนโยบายภาพรวม ระบบ ISO 9001:2015 และแผนงาน 2570
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      ทบทวนข้อค้นพบและผลการดำเนินงานในที่ประชุม Management Review
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setMemberFilter("ST");
                          setActiveTab("logs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        10 กิจกรรม
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
