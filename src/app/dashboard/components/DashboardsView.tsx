"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  BarChart3, PiggyBank, Users, CheckCircle2, Clock, 
  Briefcase, Award, Search, Filter, Sparkles, ShieldCheck, 
  Layers, ArrowUpRight, ChevronRight, X, UserCheck, Percent,
  Mail, Copy, Check, Printer, AlertTriangle, Zap, Gauge, 
  FileText, ChevronDown, User, TrendingUp, HelpCircle, Target, Scale, Send,
  Star, MessageSquare, Info, HeartHandshake, Share2, FileDown, Download, Calendar, DollarSign, ExternalLink,
  RotateCcw
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  getStoredOKRSettings, 
  fetchOKRSettingsFromSupabase,
  computeRealtimeMetrics, 
  RealtimeOKRSummary,
  isR3Task 
} from "@/utils/okrSettings";
import { resolveTaskCode } from "@/utils/taskCodeService";
import { MemberProfile, parseMemberRecord, getMemberOfficialEmail, isExecutive, isOperationalAssignee, ensureCoreOperationalAssignees } from "@/utils/memberProfile";
import { createClient } from "@/utils/supabase/client";
import { enforceCanonicalBriefIntegrity, runAutomatedDatabaseIntegrityHeal } from "@/utils/dataIntegrityGuard";
import { 
  BriefTaskLike, 
  MemberStats, 
  aggregateMemberWorkloadAndFinancials, 
  getBriefSaveCost,
  getTaskFinancialDistribution,
  generateTeamExecutiveAnalysis,
  TeamExecutiveAnalysis,
  UnitRiskAlert,
  PersonShare,
  isCcPmProject
} from "@/utils/stats";
import MemberTimelineChart, { StockTimeframe, TimelineGranularity } from "./charts/MemberTimelineChart";
import AnalyticsChartContainer from "./charts/AnalyticsChartContainer";
import DualAssistantBarChart from "./charts/DualAssistantBarChart";
import { updateGlobalBriefsStatsCache } from "@/utils/avatarMemberStats";
import TeamDemandOverview from "./analytics/TeamDemandOverview";
import MemberSpecializationCard from "./analytics/MemberSpecializationCard";
import CCIncomingProjectsBanner from "./analytics/CCIncomingProjectsBanner";
import MemberWorkloadHorizontalChart from "./analytics/MemberWorkloadHorizontalChart";
import IndividualReportView from "./analytics/IndividualReportView";
import TeamSynthesisDashboard from "./analytics/TeamSynthesisDashboard";
import FullComprehensivePdfReport from "./analytics/FullComprehensivePdfReport";
import SatisfactionSurveyChart from "./charts/SatisfactionSurveyChart";
import QuarterlyReachEngagementModal from "./QuarterlyReachEngagementModal";
import BriefDetailsModal from "./BriefDetailsModal";
import { 
  get12MonthsTimeline, 
  compute12MonthMemberTimeline, 
  BarChartItem, 
  getMemberColor 
} from "@/utils/chartStats";
import {
  computeUnitStatusBreakdown,
  computeTeamDemandStats,
  computeUnitCategoryFrequency,
  computeMemberIntelligenceProfile,
  computeTeamWorkloadInsights
} from "@/utils/teamAnalytics";
import WorkloadContinuityInsights from "./analytics/WorkloadContinuityInsights";
import BackOfHouseCitizenshipCard from "./analytics/BackOfHouseCitizenshipCard";

type Assignee = {
  id: string;
  name: string;
  unit: string;
  is_active?: boolean;
};

type OKR = {
  id: string;
  type: string;
  unit?: string;
  description: string;
  target_value: string;
  is_active: boolean;
};

const UNIT_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  creative: { label: "Creative", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10", border: "border-[#8b5cf6]/30" },
  content: { label: "Content", color: "text-[#ec4899]", bg: "bg-[#ec4899]/10", border: "border-[#ec4899]/30" },
  pr: { label: "PR", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10", border: "border-[#1877F2]/30" },
  internal: { label: "Internal Task", color: "text-slate-800", bg: "bg-slate-100", border: "border-slate-300" },
  other: { label: "Other", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" }
};

interface DashboardsViewProps {
  currentUserRole?: "admin" | "assignee" | "viewer";
}

export default function DashboardsView({ currentUserRole: propRole }: DashboardsViewProps = {}) {
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "assignee" | "viewer">(propRole || "admin");

  useEffect(() => {
    if (propRole) {
      setCurrentUserRole(propRole);
      return;
    }
    const saved = localStorage.getItem("cc_user_role");
    if (saved === "admin" || saved === "assignee" || saved === "viewer") {
      setCurrentUserRole(saved);
    }
  }, [propRole]);

  const isAdmin = currentUserRole === "admin";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tab");
      if (t === "goals" || t === "workloads" || t === "time_efficiency" || t === "individual_360" || t === "executive_report") {
        setActiveTab(t);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<"workloads" | "time_efficiency" | "individual_360" | "executive_report" | "goals">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tab");
      if (t === "goals" || t === "workloads" || t === "time_efficiency" || t === "individual_360" || t === "executive_report") {
        return t;
      }
    }
    return "workloads";
  });
  const [goalTypeFilter, setGoalTypeFilter] = useState<"all" | "KR" | "TIP">("all");
  const [viewMode, setViewMode] = useState<"individual" | "combined">("individual");
  const [unitFilter, setUnitFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"save_cost" | "profit" | "citizenship" | "tasks" | "owner_tasks" | "assistant_tasks" | "avg_value" | "assist_ratio" | "speed" | "ontime" | "risk">("save_cost");
  
  // Selected member for detail modal or 360 profile
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [selectedMemberScope, setSelectedMemberScope] = useState<string>("all");
  const [profileMemberId, setProfileMemberId] = useState<string>("");

  // Chart metric states for each tab (ตารางเปรียบเทียบภาระงานกับระยะเวลา เซตไว้ที่ งานทั้งหมด เสมอ)
  const [workloadChartMetric, setWorkloadChartMetric] = useState<"save_cost" | "tasks_count" | "completed_tasks" | "assist_tasks">("tasks_count");
  const [timeChartMetric, setTimeChartMetric] = useState<"turnaround_days" | "ontime_rate" | "completed_tasks">("turnaround_days");
  const [i360ChartMetric, setI360ChartMetric] = useState<"save_cost" | "tasks_count" | "turnaround_days" | "ontime_rate">("save_cost");
  const [execChartMetric, setExecChartMetric] = useState<"save_cost" | "assist_tasks" | "tasks_count">("save_cost");
  const [goalChartMetric, setGoalChartMetric] = useState<"okr_tasks" | "okr_save_cost">("okr_tasks");

  const timeline12Months = useMemo(() => get12MonthsTimeline(), []);

  // Monthly Executive Email Dispatch Modal State
  const [showEmailDispatchModal, setShowEmailDispatchModal] = useState(false);
  const [customEmailSubject, setCustomEmailSubject] = useState("");
  const [customEmailBody, setCustomEmailBody] = useState("");
  const [execToEmails, setExecToEmails] = useState("pitiwat@step.cmu.ac.th, suriyah@step.cmu.ac.th");
  const [execCcEmails, setExecCcEmails] = useState("");
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<{
    message: string;
  } | null>(null);

  // Copy email notification state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isDispatchingExecEmail, setIsDispatchingExecEmail] = useState(false);
  const [execEmailSuccessMessage, setExecEmailSuccessMessage] = useState<string | null>(null);

  // Copy HTML Share Link & Full Report Print Mode
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isPrintingFullReport, setIsPrintingFullReport] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingFullReport(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/dashboard?view=dashboards`;
      navigator.clipboard.writeText(url);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  const handleDownloadFullReportPdf = () => {
    setIsPrintingFullReport(true);
    setTimeout(() => {
      window.print();
    }, 450);
  };

  const [briefs, setBriefs] = useState<BriefTaskLike[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefForModal, setSelectedBriefForModal] = useState<BriefTaskLike | null>(null);

  // Unified Timeframe & Date Filter States (สำหรับตัวกรองด้านบนสุดทุกแท็บ)
  const today = useMemo(() => new Date(), []);
  
  const defaultDates = useMemo(() => {
    const end = new Date(today);
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      startDate: '2026-09-01',
      endDate: formatDate(end)
    };
  }, [today]);

  const [timeframe, setTimeframe] = useState<StockTimeframe>('ALL');
  const [granularity, setGranularity] = useState<TimelineGranularity>('auto');
  const [startDate, setStartDate] = useState<string>(defaultDates.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDates.endDate);

  const parseDateSafe = (str: string) => {
    if (!str) return null;
    try {
      const parts = str.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const parsedStartDate = useMemo(() => parseDateSafe(startDate), [startDate]);
  const parsedEndDate = useMemo(() => parseDateSafe(endDate), [endDate]);

  // Find earliest brief date for 'ALL'
  const earliestDate = useMemo(() => {
    if (!briefs || briefs.length === 0) return null;
    let minTime = Infinity;
    briefs.forEach(b => {
      const dStr = b.completed_at || b.created_at || b.in_progress_at || b.deadline || b.details?.usage_date || b.details?.publish_date;
      if (dStr) {
        const t = new Date(dStr).getTime();
        if (!isNaN(t) && t < minTime) minTime = t;
      }
    });
    return minTime !== Infinity ? new Date(minTime) : null;
  }, [briefs]);

  const handleTimeframeChange = (tf: StockTimeframe) => {
    setTimeframe(tf);
    const end = new Date();
    let start = new Date();

    const formatDate = (d: Date) => {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
      } catch {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    };

    switch (tf) {
      case '1D':
        start = new Date(end);
        break;
      case '1W': {
        const day = end.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        start.setDate(start.getDate() + diffToMonday);
        break;
      }
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'YTD':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case 'ALL':
        if (earliestDate) {
          start = new Date(earliestDate);
        } else {
          start.setFullYear(start.getFullYear() - 2);
        }
        break;
      case 'CUSTOM':
        return;
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setTimeframe('CUSTOM');
    if (type === 'start') {
      setStartDate(val);
    } else {
      setEndDate(val);
    }
  };

  // Filtered briefs according to the chosen date timeframe
  const effectiveBriefs = useMemo(() => {
    if (timeframe === "ALL") return briefs;
    if (!startDate && !endDate) return briefs;

    const startMs = startDate ? new Date(startDate + "T00:00:00").getTime() : -Infinity;
    const endMs = endDate ? new Date(endDate + "T23:59:59.999").getTime() : Infinity;

    return briefs.filter((brief) => {
      const dStr = brief.completed_at || brief.created_at || brief.in_progress_at || brief.details?.publish_date || brief.deadline || brief.details?.usage_date;
      if (!dStr) return false;
      const t = new Date(dStr).getTime();
      if (isNaN(t)) return false;
      return t >= startMs && t <= endMs;
    });
  }, [briefs, timeframe, startDate, endDate]);

  const [okrSettingsRevision, setOkrSettingsRevision] = useState(0);
  const [showReachEngageModal, setShowReachEngageModal] = useState(false);

  useEffect(() => {
    const handleOkrUpdate = () => {
      setOkrSettingsRevision((prev) => prev + 1);
    };
    window.addEventListener("okr_settings_updated", handleOkrUpdate);
    window.addEventListener("storage", handleOkrUpdate);
    return () => {
      window.removeEventListener("okr_settings_updated", handleOkrUpdate);
      window.removeEventListener("storage", handleOkrUpdate);
    };
  }, []);

  const okrSettings = useMemo(() => getStoredOKRSettings(), [okrSettingsRevision]);

  const realtimeMetrics = useMemo(() => {
    const opsCount = assignees.filter(a => isOperationalAssignee(a)).length;
    // Dynamic scaling: If anyone leaves/inactive, total system targets scale proportionally down
    // without ever pushing or increasing individual targets on remaining creative members
    return computeRealtimeMetrics(effectiveBriefs, okrSettings, opsCount || 12, Math.max(opsCount, 12));
  }, [effectiveBriefs, assignees, okrSettings]);

  const handleUpdateBriefField = async (id: string, field: string, value: any) => {
    try {
      const cur = briefs.find((b) => b.id === id);
      let patchPayload: Record<string, any> = {};

      if (field.startsWith("details.")) {
        const subField = field.replace("details.", "");
        const nextDetails = { ...(cur?.details || {}), [subField]: value };
        const canonical = enforceCanonicalBriefIntegrity({
          unit: cur?.unit,
          project_name: cur?.project_name,
          decision_maker: cur?.decision_maker,
          okr_links: (cur as any)?.okr_links,
          details: nextDetails,
        });
        patchPayload = { details: canonical.details, okr_links: canonical.okr_links };
      } else if (field === "details") {
        const canonical = enforceCanonicalBriefIntegrity({
          unit: cur?.unit,
          project_name: cur?.project_name,
          decision_maker: cur?.decision_maker,
          okr_links: (cur as any)?.okr_links,
          details: value,
        });
        patchPayload = { details: canonical.details, okr_links: canonical.okr_links };
      } else {
        patchPayload = { [field]: value };
      }

      setBriefs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patchPayload } : b))
      );
      if (selectedBriefForModal && selectedBriefForModal.id === id) {
        setSelectedBriefForModal((prev) => (prev ? { ...prev, ...patchPayload } : null));
      }

      await supabase.from("briefs").update(patchPayload).eq("id", id);
    } catch (err) {
      console.error("Failed to update brief:", err);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      runAutomatedDatabaseIntegrityHeal(supabase).catch(() => {});
      // 1. Fetch cloud synchronized OKR settings
      try {
        await fetchOKRSettingsFromSupabase();
        setOkrSettingsRevision((r) => r + 1);
      } catch (okrErr) {
        console.warn("fetchOKRSettingsFromSupabase notice in dashboard:", okrErr);
      }

      const [briefsRes, assigneesRes, okrRes] = await Promise.all([
        supabase.from("briefs").select("*").neq("status", "purged").order("created_at", { ascending: false }),
        supabase.from("assignees").select("id, name, unit, is_active").eq("is_active", true),
        supabase.from("okr_settings").select("*").eq("is_active", true)
      ]);


      if (briefsRes.data) {
        // Exclude trashed and purged items from dashboards & metric calculations
        const activeBriefs = briefsRes.data.filter((b: any) => !b.details?.is_deleted && b.status !== "purged" && !b.details?.is_permanently_deleted);
        setBriefs(activeBriefs);
      }
      if (assigneesRes.data) {
        setAssignees(assigneesRes.data);
        if (assigneesRes.data.length > 0 && !profileMemberId) {
          const ops = assigneesRes.data.filter((a) => isOperationalAssignee(a));
          if (ops.length > 0) setProfileMemberId(ops[0].id);
          else setProfileMemberId(assigneesRes.data[0].id);
        }
      }
      if (okrRes.data) setOkrs(okrRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Predefined Units definition - CC TEAM มี 3 Units: Creative, Content, PR + Internal Unit
  const PREDEFINED_UNITS = useMemo(() => [
    { key: "creative", label: "Creative", lead: "วา WK", isInternal: false },
    { key: "content", label: "Content", lead: "จ๊อบ AA", isInternal: false },
    { key: "pr", label: "PR", lead: "จ๊อบ AA", isInternal: false },
    { key: "internal", label: "Internal Task (งานภายใน)", lead: "จ๊อบ AA", isInternal: true },
  ], []);

  // Filter out executives from operational workload assignees (Executives do not perform production tasks)
  const operationalAssignees = useMemo(() => {
    return ensureCoreOperationalAssignees(assignees);
  }, [assignees]);

  // Executive members list for executive reports & mail recipients (Director first, then Deputy Director)
  const executiveMembers = useMemo(() => {
    return assignees
      .filter((a) => isExecutive(a))
      .map((a) => parseMemberRecord(a))
      .filter((a) => {
        const full = a.fullName || a.name || "";
        const email = a.email || "";
        // Strict filter: Only Director (รศ.ดร.ปิติวัฒน์ วัฒนชัย) and Deputy Director (ผศ.ดร.สุริยะ ทองมุณี)
        return email.includes("pitiwat") || email.includes("suriyah") || full.includes("ปิติวัฒน์") || full.includes("สุริยะ") || full.includes("บ่าว");
      })
      .sort((a, b) => {
        const aIsDirector = a.name.includes("ปิติวัฒน์") || (a.fullName || "").includes("ปิติวัฒน์") || (a.email || "").includes("pitiwat");
        const bIsDirector = b.name.includes("ปิติวัฒน์") || (b.fullName || "").includes("ปิติวัฒน์") || (b.email || "").includes("pitiwat");
        if (aIsDirector && !bIsDirector) return -1;
        if (!aIsDirector && bIsDirector) return 1;
        return 0;
      });
  }, [assignees]);

  // Comprehensive profile mapping for every member (including real name, position, phone)
  const memberProfileMap = useMemo(() => {
    const map = new Map<string, MemberProfile>();
    assignees.forEach((a) => map.set(a.id, parseMemberRecord(a)));
    return map;
  }, [assignees]);

  // All operational staff members for CC email recipients
  const allStaffMembers = useMemo(() => {
    return operationalAssignees.map((a) => {
      const prof = memberProfileMap.get(a.id);
      return {
        id: a.id,
        name: a.name,
        fullName: prof?.fullName || a.name,
        position: prof?.position || "เจ้าหน้าที่ปฏิบัติการ",
        phone: prof?.phone || "-",
        email: prof?.email || getMemberOfficialEmail(a.name),
        unit: a.unit || "CC TEAM"
      };
    });
  }, [operationalAssignees, memberProfileMap]);

  // Compute stats for all members (Global across all units) - using operational assignees
  const memberStats = useMemo(() => {
    return aggregateMemberWorkloadAndFinancials(effectiveBriefs, operationalAssignees);
  }, [effectiveBriefs, operationalAssignees]);

  useEffect(() => {
    const targetBriefs = briefs.length > 0 ? briefs : effectiveBriefs;
    if (targetBriefs.length > 0 && operationalAssignees.length > 0) {
      updateGlobalBriefsStatsCache(targetBriefs, operationalAssignees);
    }
  }, [briefs, effectiveBriefs, operationalAssignees]);

  // Compute stats separated strictly by unit - using operational assignees
  const unitMemberStatsMap = useMemo(() => {
    const map: Record<string, MemberStats[]> = {};
    PREDEFINED_UNITS.forEach((pu) => {
      const uKey = pu.key;
      const uBriefs = effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === uKey);
      map[uKey] = aggregateMemberWorkloadAndFinancials(uBriefs, operationalAssignees);
    });
    return map;
  }, [PREDEFINED_UNITS, effectiveBriefs, operationalAssignees]);

  // Overall Organization Totals
  const orgTotals = useMemo(() => {
    let totalSaveCost = 0;
    let totalOwnerCost = 0;
    let totalAssistantCost = 0;
    let totalProfit = 0;
    let tasksWithAssistants = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;

    effectiveBriefs.forEach((brief) => {
      const isCancelled = brief.status === "cancelled";
      const isCompleted = brief.status === "completed";
      const isInProgress = brief.status === "in_progress";
      const isPending = brief.status === "pending";

      if (isCompleted) completedTasks++;
      if (isInProgress) inProgressTasks++;
      if (isPending) pendingTasks++;

      const { totalSaveCost: cost, ownerShare, assistantShares } = getTaskFinancialDistribution(brief);

      if (assistantShares.length > 0) {
        tasksWithAssistants++;
      }

      if (!isCancelled) {
        totalSaveCost += cost;
        if (ownerShare) totalOwnerCost += ownerShare.save_cost;
        assistantShares.forEach((ast) => {
          totalAssistantCost += ast.save_cost;
        });

        // Compute project profit strictly for CC PM projects
        const isPM = isCcPmProject(brief);
        if (isPM && !isCancelled) {
          const details = brief.details || {};
          const profitVal = Number(details.profit) !== undefined && details.profit !== null
            ? Number(details.profit)
            : (Number(details.revenue || 0) - Number(details.cost || 0));
          if (profitVal > 0) {
            totalProfit += profitVal;
          }
        }
      }
    });

    const activeStaffCount = operationalAssignees.length > 0 ? operationalAssignees.length : 1;
    const avgSaveCostPerMember = Math.round(totalSaveCost / activeStaffCount);
    const avgProfitPerMember = Math.round(totalProfit / activeStaffCount);

    return {
      totalSaveCost,
      totalOwnerCost,
      totalAssistantCost,
      totalProfit,
      avgSaveCostPerMember,
      avgProfitPerMember,
      totalTasks: effectiveBriefs.length,
      tasksWithAssistants,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      activeStaff: operationalAssignees.length
    };
  }, [effectiveBriefs, operationalAssignees]);

  // Executive Team Analysis with Risk Engine
  const executiveAnalysis: TeamExecutiveAnalysis = useMemo(() => {
    return generateTeamExecutiveAnalysis(effectiveBriefs, memberStats);
  }, [effectiveBriefs, memberStats]);

  // Filtered and sorted members for the active unit filter
  const filteredMembers = useMemo(() => {
    const isInternal = unitFilter.toLowerCase() === "internal";
    const isAll = unitFilter === "All";

    let sourceList: MemberStats[] = [];

    if (isAll) {
      sourceList = memberStats;
    } else if (isInternal) {
      // สำหรับ Internal: ทุกคนใน CC TEAM ต้องมีอยู่ใน Internal
      // และสถิติต่างๆ / Save Cost ต้องเป็นเฉพาะงาน Internal เท่านั้น ไม่ปนกับ Unit อื่น
      sourceList = (unitMemberStatsMap["internal"] || []).map((m) => ({
        ...m,
        unit: "internal",
        primaryUnit: m.primaryUnit || m.unit,
      }));
    } else {
      const uKey = unitFilter.toLowerCase();
      const uStats = unitMemberStatsMap[uKey] || [];
      sourceList = uStats.filter(
        (m) => m.unit?.toLowerCase() === uKey || m.totalTasksInvolved > 0
      );
    }

    return sourceList
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            m.unit.toLowerCase().includes(q) ||
            (m.primaryUnit && m.primaryUnit.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "save_cost") return b.totalSaveCost - a.totalSaveCost;
        if (sortBy === "profit") return (b.totalProfit || 0) - (a.totalProfit || 0);
        if (sortBy === "citizenship") return (b.citizenshipScore || 0) - (a.citizenshipScore || 0);
        if (sortBy === "tasks") return b.totalTasksInvolved - a.totalTasksInvolved;
        if (sortBy === "avg_value") {
          const aAvg = a.totalTasksInvolved > 0 ? a.totalSaveCost / a.totalTasksInvolved : 0;
          const bAvg = b.totalTasksInvolved > 0 ? b.totalSaveCost / b.totalTasksInvolved : 0;
          return bAvg - aAvg;
        }
        if (sortBy === "owner_tasks") return b.ownerTaskCount - a.ownerTaskCount;
        if (sortBy === "assistant_tasks") return b.assistantTaskCount - a.assistantTaskCount;
        if (sortBy === "assist_ratio") {
          const aRatio = a.totalTasksInvolved > 0 ? a.assistantTaskCount / a.totalTasksInvolved : 0;
          const bRatio = b.totalTasksInvolved > 0 ? b.assistantTaskCount / b.totalTasksInvolved : 0;
          return bRatio - aRatio;
        }
        if (sortBy === "speed") {
          if (a.completedTasks === 0) return 1;
          if (b.completedTasks === 0) return -1;
          return a.avgTurnaroundDays - b.avgTurnaroundDays;
        }
        if (sortBy === "ontime") return b.onTimeRate - a.onTimeRate;
        if (sortBy === "risk") {
          const aRisk = a.stalledPendingCount + a.stalledProgressCount + a.overdueTasksCount;
          const bRisk = b.stalledPendingCount + b.stalledProgressCount + b.overdueTasksCount;
          return bRisk - aRisk;
        }
        return 0;
      });
  }, [memberStats, unitMemberStatsMap, unitFilter, searchQuery, sortBy]);

  // 4 Key Team Management Insights (Workload Continuity, Avg Value, Support Ratio, Peak Spikes)
  const teamWorkloadInsights = useMemo(() => {
    const isAll = unitFilter === "All";
    const targetBriefs = isAll
      ? effectiveBriefs
      : effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === unitFilter.toLowerCase());
    return computeTeamWorkloadInsights({
      briefs: targetBriefs,
      assignees: operationalAssignees,
      memberStats: filteredMembers,
      weeksToObserve: 16
    });
  }, [effectiveBriefs, operationalAssignees, filteredMembers, unitFilter]);

  // Active Member for 360 View
  const currentProfileMember = useMemo(() => {
    if (!profileMemberId && memberStats.length > 0) return memberStats[0];
    return memberStats.find((m) => m.assignee_id === profileMemberId) || memberStats[0] || null;
  }, [profileMemberId, memberStats]);

  // Unit Breakdown (Combined view) - CC TEAM มี 3 Units: Creative, Content, PR + Internal Unit
  const unitStats = useMemo(() => {
    return PREDEFINED_UNITS.map((pu) => {
      const uKey = pu.key;
      const unitBriefs = effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === uKey);
      const uStats = unitMemberStatsMap[uKey] || [];

      // สำหรับ Internal Unit: สมาชิกคือทุกคนใน CC TEAM
      // และยอด Save Cost ของสมาชิกแต่ละคนจะต้องเป็นเฉพาะงานใน Unit นี้เท่านั้น
      const membersInUnit = pu.isInternal
        ? uStats.map((m) => ({ ...m, unit: "internal", primaryUnit: m.primaryUnit || m.unit }))
        : uStats.filter((m) => m.unit?.toLowerCase() === uKey || m.totalTasksInvolved > 0);

      let ownerSaveCost = 0;
      let assistantSaveCost = 0;
      let ownerTaskCount = 0;
      let assistantTaskCount = 0;
      let completedCount = 0;
      let totalDuration = 0;

      unitBriefs.forEach((b) => {
        const { ownerShare, assistantShares } = getTaskFinancialDistribution(b);
        if (b.status !== "cancelled") {
          if (ownerShare) ownerSaveCost += ownerShare.save_cost;
          assistantShares.forEach((ast) => (assistantSaveCost += ast.save_cost));
        }
        if (ownerShare) ownerTaskCount++;
        assistantTaskCount += assistantShares.length;

        if (b.status === "completed" && b.completed_at) {
          completedCount++;
          const start = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
          const end = new Date(b.completed_at).getTime();
          totalDuration += Math.max(0.2, (end - start) / (1000 * 60 * 60 * 24));
        }
      });

      const totalSaveCost = ownerSaveCost + assistantSaveCost;
      const avgDays = completedCount > 0 ? Number((totalDuration / completedCount).toFixed(1)) : 0;
      const onTimeRate =
        membersInUnit.length > 0
          ? Math.round(membersInUnit.reduce((s, m) => s + m.onTimeRate, 0) / membersInUnit.length)
          : 100;

      return {
        unit: uKey,
        unitLabel: pu.label,
        leadName: pu.lead,
        isInternal: pu.isInternal,
        memberCount: pu.isInternal ? operationalAssignees.length : membersInUnit.length,
        totalSaveCost,
        ownerSaveCost,
        assistantSaveCost,
        ownerTaskCount,
        assistantTaskCount,
        totalTasksInvolved: unitBriefs.length,
        avgDays,
        onTimeRate,
        members: membersInUnit.sort(
          (a, b) => b.totalSaveCost - a.totalSaveCost || b.totalTasksInvolved - a.totalTasksInvolved
        ),
      };
    }).sort((a, b) => b.totalSaveCost - a.totalSaveCost);
  }, [PREDEFINED_UNITS, effectiveBriefs, operationalAssignees, unitMemberStatsMap]);

  // Filtered unit stats according to active top unit filter
  const displayedUnitStats = useMemo(() => {
    if (unitFilter === "All") return unitStats;
    return unitStats.filter((u) => u.unit.toLowerCase() === unitFilter.toLowerCase());
  }, [unitFilter, unitStats]);

  // Unit Goal & OKR Breakdown (Tab: 🎯 KR/R , KPI/TIP)
  const unitGoalStats = useMemo(() => {
    const list = PREDEFINED_UNITS.map((pu) => {
      const uKey = pu.key;
      const unitBriefs = effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === uKey);
      const completedUnitBriefs = unitBriefs.filter((b) => b.status === "completed");

      // R1: งานบริการภายใน (สอดคล้องกับ KR1 รวมทีม)
      const r1Tasks = completedUnitBriefs.filter((b) => !isR3Task(b)).length;

      // R3: งานบริการภายนอก มช. และ RSP (สอดคล้องกับ KR2 รวมทีม)
      const r3Tasks = completedUnitBriefs.filter((b) => isR3Task(b)).length;

      // R7 & R8: PM Profit (สอดคล้องกับ KR4 และ TIP1 รวมทีม - คิดเฉพาะงานส่งมอบแล้วจริง ส่วนงานกำลังทำเป็น Pipeline)
      let pmGovProfit = 0;
      let pmPrivProfit = 0;
      let pmPipelineGov = 0;
      let pmPipelinePriv = 0;
      let pmTasksCount = 0;
      let pmPipelineCount = 0;

      unitBriefs.forEach((b) => {
        if (b.status === "cancelled") return;
        if (!isCcPmProject(b)) return;
        const details = b.details || {};
        const profitVal = Number(details.profit) !== undefined && details.profit !== null
          ? Number(details.profit)
          : (Number(details.revenue || 0) - Number(details.cost || 0));
        if (profitVal > 0) {
          const sec = (details.client_sector || details.sector || "").toLowerCase().trim();
          const isPrivate = sec === "private" || sec === "เอกชน" || sec === "ภาคเอกชน";
          if (b.status === "completed") {
            pmTasksCount++;
            if (isPrivate) pmPrivProfit += profitVal;
            else pmGovProfit += profitVal;
          } else {
            pmPipelineCount++;
            if (isPrivate) pmPipelinePriv += profitVal;
            else pmPipelineGov += profitVal;
          }
        }
      });

      // Satisfaction score for this unit (Unify with computeRealtimeMetrics)
      let satSum = 0;
      let satCount = 0;
      completedUnitBriefs.forEach((b) => {
        const details = b.details || {};
        if (details.survey_status === "declined") return;
        const scores = details.satisfaction_scores;
        if (typeof scores?.averagePercent === "number") {
          satSum += Number(scores.averagePercent);
          satCount++;
        } else if (typeof scores?.accuracy === "number") {
          const sum = (scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy));
          satSum += Math.round((sum / 25) * 100);
          satCount++;
        } else if (details.survey_status === "completed" || (typeof details.satisfaction_rate === "number" && details.satisfaction_rate > 0)) {
          satSum += Number(details.satisfaction_rate);
          satCount++;
        }
      });
      const avgSatisfaction = satCount > 0 ? Math.round(satSum / satCount) : 0;

      const unassignedCount = completedUnitBriefs.filter((b) => !b.assignee_id).length;

      const uStats = unitMemberStatsMap[uKey] || [];
      const membersInUnit = pu.isInternal
        ? uStats.map((m) => ({ ...m, unit: "internal", primaryUnit: m.primaryUnit || m.unit }))
        : uStats.filter((m) => m.unit?.toLowerCase() === uKey || m.totalTasksInvolved > 0);

      return {
        unit: uKey,
        unitLabel: pu.label,
        leadName: pu.lead,
        isInternal: pu.isInternal,
        memberCount: pu.isInternal ? operationalAssignees.length : membersInUnit.length,
        completedCount: completedUnitBriefs.length,
        totalTasks: unitBriefs.length,
        unassignedCount,
        r1Tasks,
        r3Tasks,
        pmTasksCount,
        pmGovProfit,
        pmPrivProfit,
        pmPipelineGov,
        pmPipelinePriv,
        pmPipelineCount,
        totalPmProfit: pmGovProfit + pmPrivProfit,
        avgSatisfaction,
        evaluatedCount: satCount,
        members: membersInUnit.sort((a, b) => b.totalSaveCost - a.totalSaveCost)
      };
    });

    if (unitFilter === "All") return list;
    return list.filter((u) => u.unit.toLowerCase() === unitFilter.toLowerCase());
  }, [PREDEFINED_UNITS, effectiveBriefs, operationalAssignees, unitMemberStatsMap, unitFilter]);

  // Member OKR Contribution Stats for Tab 2 (Goals)
  const memberGoalStats = useMemo(() => {
    return filteredMembers.map((member) => {
      const memberTasks = effectiveBriefs.filter((b) => {
        if (b.status === "cancelled") return false;
        const isOwner = b.assignee_id === member.assignee_id;
        const isAst = Array.isArray(b.details?.assistants) && b.details.assistants.some((a: any) => a.assignee_id === member.assignee_id && Number(a.percentage) > 0);
        return isOwner || isAst;
      });

      const completed = memberTasks.filter((b) => b.status === "completed");

      // R1 tasks (สอดคล้องกับ KR1 รวมทีม)
      const r1Count = completed.filter((b) => !isR3Task(b)).length;

      // R3 tasks (สอดคล้องกับ KR2 รวมทีม)
      const r3Count = completed.filter((b) => isR3Task(b)).length;

      // PM Profit Share (คำนวณเฉพาะโครงการ PM ที่ส่งมอบเสร็จสิ้นจริง สอดคล้องกับ KR4)
      let pmProfitShare = 0;
      let pmPipelineShare = 0;
      let pmCompletedCount = 0;
      let pmPipelineCount = 0;
      memberTasks.forEach((b) => {
        if (!isCcPmProject(b)) return;
        const details = b.details || {};
        const profit = Number(details.profit) !== undefined && details.profit !== null
          ? Number(details.profit)
          : (Number(details.revenue || 0) - Number(details.cost || 0));
        if (profit > 0) {
          const isOwner = b.assignee_id === member.assignee_id;
          const assistants = (details.assistants || []).filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
          let sharePct = 100;
          if (assistants.length > 0) {
            if (isOwner) {
              const totalAst = assistants.reduce((s: number, a: any) => s + (Number(a.percentage) || 0), 0);
              sharePct = Math.max(0, 100 - totalAst);
            } else {
              const ast = assistants.find((a: any) => a.assignee_id === member.assignee_id);
              sharePct = Number(ast?.percentage) || 0;
            }
          } else if (!isOwner) {
            sharePct = 0;
          }
          const shareVal = Math.round((profit * sharePct) / 100);
          if (b.status === "completed") {
            pmCompletedCount++;
            pmProfitShare += shareVal;
          } else {
            pmPipelineCount++;
            pmPipelineShare += shareVal;
          }
        }
      });

      // Average satisfaction score for this member (Unify with computeRealtimeMetrics)
      let satSum = 0;
      let satCnt = 0;
      completed.forEach((b) => {
        const details = b.details || {};
        if (details.survey_status === "declined") return;
        const scores = details.satisfaction_scores;
        if (typeof scores?.averagePercent === "number") {
          satSum += Number(scores.averagePercent);
          satCnt++;
        } else if (typeof scores?.accuracy === "number") {
          const sum = (scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy));
          satSum += Math.round((sum / 25) * 100);
          satCnt++;
        } else if (details.survey_status === "completed" || (typeof details.satisfaction_rate === "number" && details.satisfaction_rate > 0)) {
          satSum += Number(details.satisfaction_rate);
          satCnt++;
        }
      });
      const avgSat = satCnt > 0 ? Math.round(satSum / satCnt) : 0;

      // Total goal-aligned tasks (completed tasks only: every completed task is either R1 or R3)
      const totalGoalTasks = r1Count + r3Count;

      return {
        ...member,
        r1Count,
        r3Count,
        pmCount: pmCompletedCount,
        pmProfitShare,
        pmPipelineShare,
        pmPipelineCount,
        avgSat,
        evaluatedSatCount: satCnt,
        totalGoalTasks,
      };
    });
  }, [filteredMembers, effectiveBriefs]);

  // Tasks detail for selected member modal or 360 profile
  const getMemberTasks = (assigneeId: string, filterUnit?: string) => {
    return effectiveBriefs
      .filter((b) => {
        if (filterUnit && filterUnit !== "all") {
          return (b.unit?.toLowerCase() || "") === filterUnit.toLowerCase();
        }
        return true;
      })
      .map((brief) => {
        const { totalSaveCost, ownerShare, assistantShares } = getTaskFinancialDistribution(brief);
        const isOwner = ownerShare?.assignee_id === assigneeId;
        const assistantMatch = assistantShares.find((ast) => ast.assignee_id === assigneeId);

        if (!isOwner && !assistantMatch) return null;

        let durationDays: number | null = null;
        if (brief.status === "completed" && brief.completed_at) {
          const start = new Date(brief.in_progress_at || brief.created_at || brief.completed_at).getTime();
          const end = new Date(brief.completed_at).getTime();
          durationDays = Math.max(0.2, Number(((end - start) / (1000 * 60 * 60 * 24)).toFixed(1)));
        }

        return {
          brief,
          role: isOwner ? ("owner" as const) : ("assistant" as const),
          percentage: isOwner ? ownerShare?.percentage || 0 : assistantMatch?.percentage || 0,
          shareBaht: isOwner ? ownerShare?.save_cost || 0 : assistantMatch?.save_cost || 0,
          totalTaskCost: totalSaveCost,
          durationDays
        };
      })
      .filter(Boolean) as {
      brief: BriefTaskLike;
      role: "owner" | "assistant";
      percentage: number;
      shareBaht: number;
      totalTaskCost: number;
      durationDays: number | null;
    }[];
  };

  const selectedMemberTasks = useMemo(() => {
    if (!selectedMember) return [];
    return getMemberTasks(selectedMember.assignee_id, selectedMemberScope);
  }, [selectedMember, selectedMemberScope, effectiveBriefs]);

  const profileMemberTasks = useMemo(() => {
    if (!currentProfileMember) return [];
    return getMemberTasks(currentProfileMember.assignee_id);
  }, [currentProfileMember, effectiveBriefs]);

  // Scoped Time & Velocity Metrics for Tab 2 based on unitFilter
  const scopedTimeMetrics = useMemo(() => {
    const isAll = unitFilter === "All";
    const uKey = unitFilter.toLowerCase();

    if (isAll) {
      const completedBriefs = effectiveBriefs.filter((b) => b.status === "completed");
      const saveCostPerUnit = completedBriefs.length > 0 
        ? Math.round(orgTotals.totalSaveCost / completedBriefs.length) 
        : 0;

      return {
        unitLabel: "ภาพรวมทั้งทีม CC",
        avgTurnaroundDays: executiveAnalysis.teamAvgTurnaroundDays,
        onTimeRate: executiveAnalysis.teamOnTimeRate,
        saveCostPerUnit,
        completedCount: completedBriefs.length,
        inProgressCount: orgTotals.inProgressTasks,
        pendingCount: orgTotals.pendingTasks,
        totalTasks: effectiveBriefs.length,
      };
    }

    // Scoped to specific unit
    const unitBriefs = effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === uKey);
    const unitCompleted = unitBriefs.filter((b) => b.status === "completed");
    const unitInProgress = unitBriefs.filter((b) => b.status === "in_progress");
    const unitPending = unitBriefs.filter((b) => b.status === "pending");

    let totalDuration = 0;
    let completedWithTime = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    unitCompleted.forEach((b) => {
      if (b.completed_at) {
        const start = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
        const end = new Date(b.completed_at).getTime();
        if (end >= start) {
          totalDuration += Math.max(0.2, (end - start) / (1000 * 60 * 60 * 24));
          completedWithTime++;
        }
      }
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      if (dStr && b.completed_at) {
        const deadline = new Date(dStr).getTime() + 86400000;
        const completed = new Date(b.completed_at).getTime();
        if (completed <= deadline) onTimeCount++;
        else lateCount++;
      }
    });

    const avgTurnaroundDays = completedWithTime > 0 ? Number((totalDuration / completedWithTime).toFixed(1)) : 0;
    const onTimeRate = onTimeCount + lateCount > 0 ? Math.round((onTimeCount / (onTimeCount + lateCount)) * 100) : (unitCompleted.length > 0 ? 100 : null);

    const uStats = unitStats.find((us) => us.unit === uKey);
    const totalUnitSaveCost = uStats ? uStats.totalSaveCost : 0;
    const saveCostPerUnit = unitCompleted.length > 0 ? Math.round(totalUnitSaveCost / unitCompleted.length) : 0;

    const unitInfo = PREDEFINED_UNITS.find((p) => p.key === uKey);

    return {
      unitLabel: unitInfo ? `${unitInfo.label} Unit` : uKey,
      avgTurnaroundDays,
      onTimeRate,
      saveCostPerUnit,
      completedCount: unitCompleted.length,
      inProgressCount: unitInProgress.length,
      pendingCount: unitPending.length,
      totalTasks: unitBriefs.length,
    };
  }, [unitFilter, briefs, orgTotals, executiveAnalysis, unitStats, PREDEFINED_UNITS]);

  // Filtered Unit Risk Alerts for Tab 2
  const filteredUnitRiskAlerts = useMemo(() => {
    if (unitFilter === "All") return executiveAnalysis.unitRiskAlerts;
    return executiveAnalysis.unitRiskAlerts.filter(
      (a) => a.unit.toLowerCase() === unitFilter.toLowerCase()
    );
  }, [unitFilter, executiveAnalysis.unitRiskAlerts]);

  // Generate Email Draft Text for Executives with Managerial Action Plans
  const emailDraftText = useMemo(() => {
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const execSalutation = executiveMembers.length > 0
      ? executiveMembers.map(e => `${e.fullName || e.name} (${e.position || 'ผู้บริหาร'})`).join(" และ ")
      : "รศ.ดร.ปิติวัฒน์ วัฒนชัย (ผู้อำนวยการ) และ ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)";

    let text = `เรียน ${execSalutation}\n\n`;
    text += `เรื่อง: รายงานสรุปภาพรวมผลการดำเนินงาน ประสิทธิภาพเวลา และการบริหารความเสี่ยงทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)\n`;
    text += `ประจำวันที่: ${today}\n\n`;
    text += `------------------------------------------------------------\n`;
    text += `1. สรุปภาพรวมผลงานและความคุ้มค่า (Executive Summary)\n`;
    text += `------------------------------------------------------------\n`;
    text += `• มูลค่า Save Cost รวมที่ช่วยองค์กรประหยัด: ฿${executiveAnalysis.totalSaveCost.toLocaleString()} บาท\n`;
    text += `  - จากงานหลัก (Owner): ฿${executiveAnalysis.ownerSaveCost.toLocaleString()} บาท\n`;
    text += `  - จากงานช่วย (Assistant): ฿${executiveAnalysis.assistantSaveCost.toLocaleString()} บาท\n`;
    text += `• ปริมาณงานทั้งหมดในระบบ: ${executiveAnalysis.totalTasks} งาน (เสร็จสิ้น ${executiveAnalysis.completedTasks} งาน, กำลังทำ ${executiveAnalysis.inProgressTasks} งาน, รอดำเนินการ ${executiveAnalysis.pendingTasks} งาน)\n`;
    text += `• อัตราการส่งมอบงานตรงตามกำหนด (On-Time Rate): ${executiveAnalysis.teamOnTimeRate}%\n`;
    text += `• ระยะเวลาเฉลี่ยในการปิดงานต่อชิ้น: ${executiveAnalysis.teamAvgTurnaroundDays} วัน/งาน\n`;
    text += `• จำนวนงานที่มีการกระจายผู้ช่วยร่วมรับผิดชอบ: ${orgTotals.tasksWithAssistants} งาน\n\n`;

    text += `------------------------------------------------------------\n`;
    text += `2. สิ่งที่ทีมทำได้ดีเยี่ยม (Key Strengths & Achievements)\n`;
    text += `------------------------------------------------------------\n`;
    executiveAnalysis.whatWentWell.forEach((item, idx) => {
      text += `${idx + 1}. ${item}\n`;
    });
    text += `\n`;

    text += `------------------------------------------------------------\n`;
    text += `3. สิ่งที่ควรปรับปรุงและจุดเฝ้าระวัง (Areas for Improvement)\n`;
    text += `------------------------------------------------------------\n`;
    executiveAnalysis.areasForImprovement.forEach((item, idx) => {
      text += `• ${item}\n`;
    });
    text += `\n`;

    text += `------------------------------------------------------------\n`;
    text += `4. การบริหารความเสี่ยงและแนวทางแก้ไขเร่งด่วนระดับ Unit (Unit Risk Alerts & Actions)\n`;
    text += `------------------------------------------------------------\n`;
    executiveAnalysis.unitRiskAlerts.forEach((alert) => {
      text += `[${alert.unitLabel.toUpperCase()} UNIT] ผู้รับผิดชอบหลัก: ${alert.leadName}\n`;
      text += `สถานะ: ${alert.title}\n`;
      text += `สถานการณ์: ${alert.situation}\n`;
      text += `แนวทางการจัดการของ ${alert.leadName} (วิธีแก้ไข 1, 2, 3):\n`;
      alert.actionSteps.forEach((step) => {
        text += `  ${step}\n`;
      });
      text += `ความเสี่ยงที่จะตามมา หากไม่รีบแก้ไข:\n`;
      alert.riskImpacts.forEach((risk) => {
        text += `  ${risk}\n`;
      });
      text += `\n`;
    });

    text += `ข้อสั่งการสำหรับหัวหน้าทีม (${executiveAnalysis.teamLeadDirectives.teamLeadName}):\n`;
    executiveAnalysis.teamLeadDirectives.actionForLead.forEach((act) => {
      text += `• ${act}\n`;
    });
    text += `\n`;

    // 4.1 OKRs & Key Results (KR / R Metrics)
    text += `------------------------------------------------------------\n`;
    text += `5. สรุปความก้าวหน้าตัวชี้วัด OKRs & R รายตัว (Key Results & Performance Metrics)\n`;
    text += `------------------------------------------------------------\n`;
    if (realtimeMetrics && realtimeMetrics.krs && realtimeMetrics.krs.length > 0) {
      realtimeMetrics.krs.forEach((krRes) => {
        const kr = krRes.kr;
        text += `🎯 [${kr.code}] ${kr.name} (น้ำหนัก ${kr.weightPercent}%)\n`;
        krRes.rResults.forEach((r) => {
          const formattedActual = r.isCurrency ? `฿${r.actual.toLocaleString()}` : (r.isPercentage ? `${r.actual}%` : `${r.actual.toLocaleString()} ${r.unit}`);
          const formattedTarget = r.isCurrency ? `฿${r.target.toLocaleString()}` : (r.isPercentage ? `${r.target}%` : `${r.target.toLocaleString()} ${r.unit}`);
          text += `  • [${r.code}] ${r.name}: ผลงาน ${formattedActual} / เป้าหมาย ${formattedTarget} (${r.percentage.toFixed(1)}%)\n`;
        });
        text += `\n`;
      });
    } else {
      text += `• KR1 (ผลงานบริการภายใน): เป้าหมาย 1,200 งาน • ความพึงพอใจเป้าหมาย ≥ 85%\n`;
      text += `• KR2 (ผลงานภายนอก มช./RSP): เป้าหมาย 350 งาน • ความพึงพอใจเป้าหมาย ≥ 85%\n`;
      text += `• KR3 (การรับรู้): เป้าหมาย 6,000,000 Reach | 60,000 Engagements\n`;
      text += `• KR4 (กำไรการให้บริการ): ภาครัฐ ฿3,000,000 | เอกชน ฿1,000,000\n\n`;
    }

    text += `------------------------------------------------------------\n`;
    text += `6. สรุปผลงานและประสิทธิภาพรายบุคคล (Individual Scorecard)\n`;
    text += `------------------------------------------------------------\n`;
    text += `ลำดับ | ชื่อ-สกุล (ชื่อเรียก) | ตำแหน่งทางการ | เบอร์โทร | Save Cost รวม | ภาระงาน (หลัก/ช่วย) | เวลาเฉลี่ย | ตรงเวลา\n`;
    memberStats.forEach((m, idx) => {
      const prof = memberProfileMap.get(m.assignee_id);
      const fullName = prof?.fullName || m.name;
      const pos = prof?.position || '-';
      const phone = prof?.phone || '-';
      text += `${idx + 1}. ${fullName} (${m.name}) | ${pos} | โทร ${phone} | ฿${m.totalSaveCost.toLocaleString()} | หลัก ${m.ownerTaskCount} / ช่วย ${m.assistantTaskCount} งาน | ${m.avgTurnaroundDays > 0 ? `${m.avgTurnaroundDays} วัน` : "-"} | ${m.onTimeRate}%\n`;
    });

    const reporter = Array.from(memberProfileMap.values()).find(p => p.role === "admin");
    text += `\n------------------------------------------------------------\n`;
    text += `จึงเรียนมาเพื่อโปรดทราบและพิจารณา\n\n`;
    text += `ผู้จัดทำรายงาน: ${reporter?.fullName || "นายอัจชนะพงษ์ อัจชนะวราทา"} (${reporter?.name || "จ๊อบ AA"})\n`;
    text += `ตำแหน่ง: ${reporter?.position || "หัวหน้าทีม (Team Leader)"}\n`;
    text += `เบอร์โทรศัพท์ติดต่อ: ${reporter?.phone || "062-4166396"}\n`;
    text += `อีเมล: ${reporter?.email || "adchanapong@step.cmu.ac.th"}\n`;
    text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)`;

    return text;
  }, [executiveAnalysis, memberStats, orgTotals, executiveMembers, memberProfileMap]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailDraftText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleDispatchExecutiveEmail = async () => {
    setIsDispatchingExecEmail(true);
    setExecEmailSuccessMessage(null);
    try {
      const reporter = Array.from(memberProfileMap.values()).find((p) => p.role === "admin");
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "executive_report_dispatch",
          reportDate: new Date().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          executives: executiveMembers.map((e) => ({
            name: e.name,
            fullName: e.fullName,
            position: e.position,
            phone: e.phone,
            email: e.email,
          })),
          reporterLead: {
            name: reporter?.name || "จ๊อบ AA",
            fullName: reporter?.fullName || "นายอัจชนะพงษ์ อัจชนะวราทา",
            position: reporter?.position || "หัวหน้าทีม (Team Leader)",
            phone: reporter?.phone || "062-4166396",
            email: reporter?.email || "adchanapong@step.cmu.ac.th",
          },
          summary: {
            totalSaveCost: executiveAnalysis.totalSaveCost,
            ownerSaveCost: executiveAnalysis.ownerSaveCost,
            assistantSaveCost: executiveAnalysis.assistantSaveCost,
            totalTasks: executiveAnalysis.totalTasks,
            completedTasks: executiveAnalysis.completedTasks,
            inProgressTasks: executiveAnalysis.inProgressTasks,
            pendingTasks: executiveAnalysis.pendingTasks,
            teamOnTimeRate: executiveAnalysis.teamOnTimeRate,
            teamAvgTurnaroundDays: executiveAnalysis.teamAvgTurnaroundDays,
            tasksWithAssistants: orgTotals.tasksWithAssistants,
          },
          whatWentWell: executiveAnalysis.whatWentWell,
          areasForImprovement: executiveAnalysis.areasForImprovement,
          unitRiskAlerts: executiveAnalysis.unitRiskAlerts,
          memberStats: memberStats.map((m) => {
            const prof = memberProfileMap.get(m.assignee_id);
            return {
              assignee_id: m.assignee_id,
              name: m.name,
              fullName: prof?.fullName || m.name,
              position: prof?.position || "-",
              phone: prof?.phone || "-",
              unit: m.unit,
              totalSaveCost: m.totalSaveCost,
              ownerTaskCount: m.ownerTaskCount,
              assistantTaskCount: m.assistantTaskCount,
              avgTurnaroundDays: m.avgTurnaroundDays,
              onTimeRate: m.onTimeRate,
            };
          }),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExecEmailSuccessMessage(data.message || "ส่งรายงานอย่างเป็นทางการถึงคณะผู้บริหารเรียบร้อยแล้ว!");
        setTimeout(() => setExecEmailSuccessMessage(null), 8000);
      } else {
        alert("ไม่สามารถส่งอีเมลได้: " + (data.error || "เกิดข้อผิดพลาด"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + err.message);
    } finally {
      setIsDispatchingExecEmail(false);
    }
  };

  // Generate Comprehensive Monthly Email Body (Editable by Admin before dispatch)
  const generateMonthlyEmailBody = () => {
    const currentMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const execNames = executiveMembers.length > 0 
      ? executiveMembers.map(e => `${e.fullName || e.name} (${e.position || 'ผู้บริหาร'})`).join(" และ ")
      : "รศ.ดร.ปิติวัฒน์ วัฒนชัย (ผู้อำนวยการ) และ ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)";
    
    let text = `เรียน ${execNames}\n`;
    text += `สำเนา (CC): ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC) ทุกท่าน\n\n`;
    text += `เรื่อง: รายงานสรุปผลการดำเนินงาน ความคืบหน้า และประสิทธิภาพการทำงานประจำเดือน ${currentMonth}\n\n`;
    text += `ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC) ขอส่งรายงานสรุปผลการดำเนินงาน ประสิทธิภาพเวลา ความคุ้มค่าทางงบประมาณ (Save Cost) และการบริหารความเสี่ยง ประจำเดือน ${currentMonth} ดังนี้\n\n`;
    
    text += `============================================================\n`;
    text += `1. รายงานความคืบหน้าภาพรวมของทีม (Team Overview & Workloads)\n`;
    text += `============================================================\n`;
    text += `• มูลค่าประหยัดงบประมาณรวม (Total Save Cost): ฿${executiveAnalysis.totalSaveCost.toLocaleString()} บาท\n`;
    text += `  - มูลค่าจากงานหลัก (Owner): ฿${executiveAnalysis.ownerSaveCost.toLocaleString()} บาท\n`;
    text += `  - มูลค่าจากงานช่วยเกื้อกูล (Assistant): ฿${executiveAnalysis.assistantSaveCost.toLocaleString()} บาท\n`;
    text += `• ภาระงานทั้งหมดในระบบ: ${executiveAnalysis.totalTasks} งาน\n`;
    text += `  - ดำเนินการเสร็จสิ้น: ${executiveAnalysis.completedTasks} งาน\n`;
    text += `  - กำลังดำเนินการ: ${executiveAnalysis.inProgressTasks} งาน\n`;
    text += `  - รอดำเนินการ: ${executiveAnalysis.pendingTasks} งาน\n`;
    text += `• อัตราการส่งมอบงานตรงตามกำหนด (On-Time Rate): ${executiveAnalysis.teamOnTimeRate}%\n`;
    text += `• ระยะเวลาเฉลี่ยในการปิดงาน (Turnaround Time): ${executiveAnalysis.teamAvgTurnaroundDays} วัน/งาน\n`;
    text += `• การร่วมมือกันในทีม (Team Synergy): มีงานช่วยเกื้อกูลกัน ${orgTotals.tasksWithAssistants} งาน\n\n`;

    text += `============================================================\n`;
    text += `2. สิ่งที่ทีมทำได้ดีและประสบความสำเร็จ (Key Achievements & What Worked Well)\n`;
    text += `============================================================\n`;
    if (executiveAnalysis.whatWentWell && executiveAnalysis.whatWentWell.length > 0) {
      executiveAnalysis.whatWentWell.forEach((item, idx) => {
        text += `${idx + 1}. ${item}\n`;
      });
    } else {
      text += `1. ผลิตชิ้นงานสร้างสรรค์สำเร็จลุล่วงด้วยมูลค่าความคุ้มค่าสูงกว่าเกณฑ์เป้าหมาย\n`;
      text += `2. การบริหารจัดการงานที่มีการส่งเสริมเพื่อนช่วยเพื่อน (Team Assistant) มีประสิทธิภาพราบรื่น\n`;
    }
    text += `\n`;

    text += `============================================================\n`;
    text += `3. สิ่งที่ต้องพัฒนาและจุดเฝ้าระวัง (Areas for Improvement & Risks)\n`;
    text += `============================================================\n`;
    if (executiveAnalysis.areasForImprovement && executiveAnalysis.areasForImprovement.length > 0) {
      executiveAnalysis.areasForImprovement.forEach((item, idx) => {
        text += `• ${item}\n`;
      });
    } else {
      text += `• การควบคุมระยะเวลาในสถานะรอดำเนินการ (Pending) เพื่อเพิ่มความเร็วในการเริ่มงาน\n`;
      text += `• การกระจายปริมาณงานให้สมดุลข้ามยูนิตเพื่อป้องกันภาวะงานล้นมือเฉพาะบุคคล\n`;
    }
    text += `\n`;

    text += `============================================================\n`;
    text += `4. แนวทางการแก้ไขพัฒนาและข้อสั่งการ (Action Plans & Directives)\n`;
    text += `============================================================\n`;
    if (executiveAnalysis.unitRiskAlerts && executiveAnalysis.unitRiskAlerts.length > 0) {
      executiveAnalysis.unitRiskAlerts.forEach((alert) => {
        text += `[${alert.unitLabel.toUpperCase()} UNIT] ผู้ดูแล: ${alert.leadName}\n`;
        text += `• สถานการณ์: ${alert.situation}\n`;
        text += `• แนวทางจัดการ: ${alert.actionSteps.join(", ")}\n`;
      });
    }
    if (executiveAnalysis.teamLeadDirectives?.actionForLead) {
      text += `\nข้อสั่งการหัวหน้าทีม (${executiveAnalysis.teamLeadDirectives.teamLeadName}):\n`;
      executiveAnalysis.teamLeadDirectives.actionForLead.forEach((act) => {
        text += `• ${act}\n`;
      });
    }
    text += `\n`;

    text += `============================================================\n`;
    text += `5. สรุปความก้าวหน้าตัวชี้วัด OKRs & R รายตัว (Key Results & Performance Metrics)\n`;
    text += `============================================================\n`;
    if (realtimeMetrics && realtimeMetrics.krs && realtimeMetrics.krs.length > 0) {
      realtimeMetrics.krs.forEach((krRes) => {
        const kr = krRes.kr;
        text += `🔹 [${kr.code}] ${kr.name} (น้ำหนัก ${kr.weightPercent}%)\n`;
        krRes.rResults.forEach((r) => {
          const formattedActual = r.isCurrency ? `฿${r.actual.toLocaleString()}` : (r.isPercentage ? `${r.actual}%` : `${r.actual.toLocaleString()} ${r.unit}`);
          const formattedTarget = r.isCurrency ? `฿${r.target.toLocaleString()}` : (r.isPercentage ? `${r.target}%` : `${r.target.toLocaleString()} ${r.unit}`);
          text += `  • [${r.code}] ${r.name}: ผลงาน ${formattedActual} / เป้าหมาย ${formattedTarget} (${r.percentage.toFixed(1)}%)\n`;
        });
        text += `\n`;
      });
    } else {
      text += `• KR1: จำนวนผลงานภายในองค์กร (1,200 งาน • ความพึงพอใจ ≥ 85%)\n`;
      text += `• KR2: จำนวนผลงานภายนอก มช./RSP (350 งาน • ความพึงพอใจ ≥ 85%)\n`;
      text += `• KR3: มูลค่าการรับรู้ (6,000,000 Reach | 60,000 Engagements)\n`;
      text += `• KR4: กำไรที่เกิดจากการให้บริการ (ภาครัฐ ฿3,000,000 | เอกชน ฿1,000,000)\n\n`;
    }

    text += `============================================================\n`;
    text += `6. สรุปผลงานและประสิทธิภาพรายบุคคลแบบละเอียดทุกคน (Individual 360° Scorecard)\n`;
    text += `============================================================\n`;
    text += `ลำดับ | ชื่อ-สกุล (ชื่อเล่น) | ตำแหน่ง | Save Cost รวม | ภาระงาน (หลัก/ช่วย) | ระยะเวลาเฉลี่ย | ตรงเวลา\n`;
    memberStats.forEach((m, idx) => {
      const prof = memberProfileMap.get(m.assignee_id);
      const fullName = prof?.fullName || m.name;
      const pos = prof?.position || "-";
      text += `${idx + 1}. ${fullName} (${m.name}) | ${pos} | ฿${m.totalSaveCost.toLocaleString()} | หลัก ${m.ownerTaskCount} / ช่วย ${m.assistantTaskCount} งาน | ${m.avgTurnaroundDays > 0 ? `${m.avgTurnaroundDays} วัน` : "-"} | ${m.onTimeRate}%\n`;
    });
    text += `\n`;

    text += `============================================================\n`;
    text += `ระบบตรวจสอบข้อมูลเชิงลึก (Interactive Dashboard):\n`;
    text += `============================================================\n`;
    text += `🔗 เปิดดูข้อมูลและกราฟวิเคราะห์แบบ Realtime ได้ที่:\n`;
    text += `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard?view=dashboards\n\n`;

    const reporter = Array.from(memberProfileMap.values()).find(p => p.role === "admin");
    text += `จึงเรียนมาเพื่อโปรดทราบและพิจารณา\n\n`;
    text += `ผู้จัดทำรายงาน: ${reporter?.fullName || "นายอัจชนะพงษ์ อัจชนะวราทา"} (${reporter?.name || "จ๊อบ AA"})\n`;
    text += `ตำแหน่ง: ${reporter?.position || "หัวหน้าทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC)"}\n`;
    text += `โทร: ${reporter?.phone || "062-4166396"} | อีเมล: ${reporter?.email || "adchanapong@step.cmu.ac.th"}`;

    return text;
  };


  const handleOpenEmailDispatchModal = () => {
    const currentMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    setCustomEmailSubject(`[CC TEAM] รายงานสรุปผลการดำเนินงาน ประสิทธิภาพ และความคุ้มค่าประจำเดือน ${currentMonth}`);
    setCustomEmailBody(generateMonthlyEmailBody());
    setExecToEmails("pitiwat@step.cmu.ac.th, suriyah@step.cmu.ac.th");
    const staffEmails = allStaffMembers.map((s) => s.email).filter(Boolean).join(", ");
    setExecCcEmails(staffEmails);
    setShowEmailDispatchModal(true);
  };

  const handleConfirmDispatchEmailAndLine = async () => {
    // 1. Copy 100% full email body to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(customEmailBody);
      }
    } catch (e) {}

    // 2. Open Gmail Web compose window synchronously so user can send from official account
    try {
      const cleanTo = execToEmails.split(",").map(e => e.trim()).filter(Boolean).join(",");
      const cleanCc = execCcEmails.split(",").map(e => e.trim()).filter(Boolean).join(",");
      const targetTo = encodeURIComponent(cleanTo);
      const targetCc = encodeURIComponent(cleanCc);
      const targetSubject = encodeURIComponent(customEmailSubject.trim());
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const portalUrl = `${origin}/dashboard?view=dashboards`;
      const safeIntro = `เรียน ผู้อำนวยการ และคณะผู้บริหาร\n\nทีมสร้างสรรค์และการสื่อสาร (CC) ขอส่งรายงานสรุปผลการดำเนินงาน ประสิทธิภาพ และความคุ้มค่าประจำเดือน\n\n🔗 ดูข้อมูลและกราฟวิเคราะห์ Dashboard: ${portalUrl}\n\n--------------------------------------------------\n📋 หมายเหตุ: ระบบได้คัดลอกเนื้อหารายงานฉบับเต็มลงใน Clipboard เรียบร้อยแล้ว\n👉 สามารถกด [Ctrl + V] หรือ Paste เพื่อวางเนื้อหาฉบับเต็มทั้งหมดได้ทันทีครับ\n--------------------------------------------------`;
      const targetBody = encodeURIComponent(safeIntro);
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${targetTo}&cc=${targetCc}&su=${targetSubject}&body=${targetBody}`;
      window.open(gmailUrl, '_blank');
    } catch (e) {
      console.error("Failed to open Gmail compose:", e);
    }

    setIsDispatchingExecEmail(true);

    try {
      const reporter = Array.from(memberProfileMap.values()).find((p) => p.role === "admin");

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "executive_report_dispatch",
          toEmails: execToEmails,
          ccEmails: execCcEmails,
          subject: customEmailSubject,
          emailBody: customEmailBody,
          reporter: {
            fullName: reporter?.fullName || "นายอัจชนะพงษ์ อัจชนะวราทา",
            name: reporter?.name || "จ๊อบ AA",
            position: reporter?.position || "หัวหน้าทีม (Team Leader)",
            email: reporter?.email || "adchanapong@step.cmu.ac.th",
            phone: reporter?.phone || "062-4166396",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDispatchSuccessToast({
          message: "เปิดหน้าต่าง Gmail และคัดลอกเนื้อหารายงานฉบับเต็มลง Clipboard สำเร็จ! (กด Ctrl+V เพื่อวางเนื้อหาและกดส่งได้ทันที)",
        });
        setTimeout(() => {
          setShowEmailDispatchModal(false);
        }, 1500);
      } else {
        alert("เกิดข้อผิดพลาดในการส่ง: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("ไม่สามารถส่งรายงานได้: " + err.message);
    } finally {
      setIsDispatchingExecEmail(false);
    }
  };


  // ==========================================
  // CHART DATA MEMOS FOR ALL 5 TABS
  // ==========================================

  // 1. Tab 1: Workloads & Save Cost
  const workloadBarItems: BarChartItem[] = useMemo(() => {
    return filteredMembers.map((m, idx) => {
      let val = m.totalSaveCost;
      let primary = m.ownerSaveCost;
      let secondary = m.assistantSaveCost;
      let formatted = `฿${m.totalSaveCost.toLocaleString()}`;

      if (workloadChartMetric === "tasks_count") {
        val = m.totalTasksInvolved;
        primary = m.ownerTaskCount;
        secondary = m.assistantTaskCount;
        formatted = `${m.totalTasksInvolved} งาน`;
      } else if (workloadChartMetric === "completed_tasks") {
        val = m.completedTasks;
        primary = m.completedTasks;
        secondary = 0;
        formatted = `${m.completedTasks} งาน`;
      } else if (workloadChartMetric === "assist_tasks") {
        val = m.assistantTaskCount;
        primary = 0;
        secondary = m.assistantTaskCount;
        formatted = `${m.assistantTaskCount} งาน (ช่วย)`;
      }

      return {
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
        color: getMemberColor(idx, m.name),
        value: val,
        primaryValue: primary,
        secondaryValue: secondary,
        formattedValue: formatted,
        unitLabel: m.unit
      };
    });
  }, [filteredMembers, workloadChartMetric]);

  const workloadTimelineData = useMemo(() => {
    return compute12MonthMemberTimeline({
      briefs: effectiveBriefs,
      assignees: filteredMembers.map(m => ({
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
      })),
      metric: workloadChartMetric,
      timelineMonths: timeline12Months
    });
  }, [effectiveBriefs, filteredMembers, workloadChartMetric, timeline12Months]);

  const workloadTeamAverage = useMemo(() => {
    if (filteredMembers.length === 0) return 0;
    if (workloadChartMetric === "save_cost") {
      const sum = filteredMembers.reduce((acc, m) => acc + m.totalSaveCost, 0);
      return Math.round(sum / filteredMembers.length);
    }
    if (workloadChartMetric === "tasks_count") {
      const sum = filteredMembers.reduce((acc, m) => acc + m.totalTasksInvolved, 0);
      return Math.round(sum / filteredMembers.length);
    }
    if (workloadChartMetric === "assist_tasks") {
      const sum = filteredMembers.reduce((acc, m) => acc + m.assistantTaskCount, 0);
      return Math.round(sum / filteredMembers.length);
    }
    const sum = filteredMembers.reduce((acc, m) => acc + m.completedTasks, 0);
    return Math.round(sum / filteredMembers.length);
  }, [filteredMembers, workloadChartMetric]);

  // 2. Tab 2: Time & Velocity
  const timeBarItems: BarChartItem[] = useMemo(() => {
    return filteredMembers.map((m, idx) => {
      let val = m.avgTurnaroundDays;
      let formatted = `${m.avgTurnaroundDays} วัน`;

      if (timeChartMetric === "ontime_rate") {
        val = m.onTimeRate;
        formatted = `${m.onTimeRate}%`;
      } else if (timeChartMetric === "completed_tasks") {
        val = m.completedTasks;
        formatted = `${m.completedTasks} งาน`;
      }

      return {
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
        color: getMemberColor(idx, m.name),
        value: val,
        formattedValue: formatted,
        unitLabel: m.unit
      };
    });
  }, [filteredMembers, timeChartMetric]);

  const timeTimelineData = useMemo(() => {
    return compute12MonthMemberTimeline({
      briefs: effectiveBriefs,
      assignees: filteredMembers.map(m => ({
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
      })),
      metric: timeChartMetric,
      timelineMonths: timeline12Months
    });
  }, [effectiveBriefs, filteredMembers, timeChartMetric, timeline12Months]);

  const timeTeamAverage = useMemo(() => {
    if (filteredMembers.length === 0) return 0;
    if (timeChartMetric === "turnaround_days") {
      return Number(executiveAnalysis.teamAvgTurnaroundDays) || 0;
    }
    if (timeChartMetric === "ontime_rate") {
      return executiveAnalysis.teamOnTimeRate || 0;
    }
    const sum = filteredMembers.reduce((acc, m) => acc + m.completedTasks, 0);
    return Math.round(sum / filteredMembers.length);
  }, [filteredMembers, timeChartMetric, executiveAnalysis]);

  // 3. Tab 3: Individual 360
  const i360BarItems: BarChartItem[] = useMemo(() => {
    return memberStats.map((m, idx) => {
      let val = m.totalSaveCost;
      let formatted = `฿${m.totalSaveCost.toLocaleString()}`;

      if (i360ChartMetric === "tasks_count") {
        val = m.totalTasksInvolved;
        formatted = `${m.totalTasksInvolved} งาน`;
      } else if (i360ChartMetric === "turnaround_days") {
        val = m.avgTurnaroundDays;
        formatted = `${m.avgTurnaroundDays} วัน`;
      } else if (i360ChartMetric === "ontime_rate") {
        val = m.onTimeRate;
        formatted = `${m.onTimeRate}%`;
      }

      return {
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
        color: m.assignee_id === profileMemberId ? "#E03131" : getMemberColor(idx, m.name),
        value: val,
        formattedValue: formatted,
        unitLabel: m.unit
      };
    });
  }, [memberStats, i360ChartMetric, profileMemberId]);

  const i360TimelineData = useMemo(() => {
    return compute12MonthMemberTimeline({
      briefs: effectiveBriefs,
      assignees: memberStats.map(m => ({
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
      })),
      metric: i360ChartMetric,
      timelineMonths: timeline12Months
    });
  }, [effectiveBriefs, memberStats, i360ChartMetric, timeline12Months]);

  // 4. Tab 4: Executive Report
  const execBarItems: BarChartItem[] = useMemo(() => {
    return memberStats.map((m, idx) => {
      let val = m.totalSaveCost;
      let formatted = `฿${m.totalSaveCost.toLocaleString()}`;

      if (execChartMetric === "assist_tasks") {
        val = m.assistantTaskCount;
        formatted = `${m.assistantTaskCount} งานช่วย`;
      } else if (execChartMetric === "tasks_count") {
        val = m.totalTasksInvolved;
        formatted = `${m.totalTasksInvolved} งาน`;
      }

      return {
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
        color: getMemberColor(idx, m.name),
        value: val,
        primaryValue: m.ownerSaveCost,
        secondaryValue: m.assistantSaveCost,
        formattedValue: formatted,
        unitLabel: m.unit
      };
    });
  }, [memberStats, execChartMetric]);

  const execTimelineData = useMemo(() => {
    return compute12MonthMemberTimeline({
      briefs: effectiveBriefs,
      assignees: memberStats.map(m => ({
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
      })),
      metric: execChartMetric,
      timelineMonths: timeline12Months
    });
  }, [effectiveBriefs, memberStats, execChartMetric, timeline12Months]);

  // 5. Tab 5: Goals & OKRs
  const goalBarItems: BarChartItem[] = useMemo(() => {
    return memberStats.map((m, idx) => {
      const memberBriefs = effectiveBriefs.filter(b => {
        if (b.status === "cancelled") return false;
        const hasOKR = Boolean(b.details?.selected_okr || (b as any).okr_links?.length);
        if (!hasOKR) return false;
        const dist = getTaskFinancialDistribution(b);
        const shares = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
        return shares.some(s => s.assignee_id === m.assignee_id);
      });

      let okrCount = 0;
      let okrSaveCost = 0;
      memberBriefs.forEach(b => {
        const dist = getTaskFinancialDistribution(b);
        const shares = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
        const myShare = shares.find(s => s.assignee_id === m.assignee_id);
        if (myShare) {
          okrCount += 1;
          okrSaveCost += myShare.save_cost;
        }
      });

      const val = goalChartMetric === "okr_tasks" ? okrCount : Math.round(okrSaveCost);
      const formatted = goalChartMetric === "okr_tasks" ? `${okrCount} งาน OKR` : `฿${Math.round(okrSaveCost).toLocaleString()}`;

      return {
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
        color: getMemberColor(idx, m.name),
        value: val,
        formattedValue: formatted,
        unitLabel: m.unit
      };
    });
  }, [memberStats, effectiveBriefs, goalChartMetric]);

  const goalTimelineData = useMemo(() => {
    return compute12MonthMemberTimeline({
      briefs: effectiveBriefs,
      assignees: memberStats.map(m => ({
        id: m.assignee_id,
        name: m.name,
        unit: m.unit,
      })),
      metric: goalChartMetric,
      timelineMonths: timeline12Months
    });
  }, [effectiveBriefs, memberStats, goalChartMetric, timeline12Months]);

  // 6. Team Demand, Status Breakdown & Category Analytics
  const currentUnitLabel = useMemo(() => {
    if (unitFilter === "All") return "ทุกสายงาน (CC TEAM)";
    if (unitFilter.toLowerCase() === "internal") return "Internal Task (งานภายใน)";
    const u = PREDEFINED_UNITS.find(p => p.key === unitFilter.toLowerCase());
    return u ? `${u.label} Unit` : unitFilter;
  }, [unitFilter, PREDEFINED_UNITS]);

  const unitStatusBreakdown = useMemo(() => {
    return computeUnitStatusBreakdown(briefs, unitFilter);
  }, [briefs, unitFilter]);

  const teamDemandStats = useMemo(() => {
    return computeTeamDemandStats(briefs, unitFilter);
  }, [briefs, unitFilter]);

  const popularCategories = useMemo(() => {
    return computeUnitCategoryFrequency(briefs, unitFilter, 6);
  }, [briefs, unitFilter]);

  const memberIntelligenceProfile = useMemo(() => {
    if (!currentProfileMember) return null;
    return computeMemberIntelligenceProfile(
      briefs, 
      currentProfileMember.assignee_id, 
      assignees.map(a => ({ id: a.id, name: a.name, unit: a.unit }))
    );
  }, [briefs, currentProfileMember, assignees]);

  // If in Full Report Mode, render exclusively the printable report document
  if (isPrintingFullReport) {
    return (
      <div className="w-full min-h-screen bg-white text-slate-900">
        {/* Top Floating Action Bar on screen */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 print:hidden animate-in fade-in backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold">หน้ารายงาน PDF ฉบับเต็ม (เอกสารทางการ 5 มิติ)</span>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer size={13} /> สั่งพิมพ์ / บันทึก PDF อีกครั้ง
          </button>
          <button
            onClick={() => setIsPrintingFullReport(false)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <X size={13} /> ปิดหน้ารายงาน (กลับสู่แดชบอร์ด)
          </button>
        </div>

        <div className="p-4 md:p-8 print:p-0">
          <FullComprehensivePdfReport
            briefs={effectiveBriefs}
            assignees={assignees}
            memberStats={memberStats}
            okrs={okrs}
            okrSettings={okrSettings}
            unitStats={unitStats}
            orgTotals={orgTotals}
            onClose={() => setIsPrintingFullReport(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full bg-surface rounded-2xl border border-surface-border p-4 md:p-6 shadow-xs animate-in fade-in duration-200">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-3.5 mb-5 pb-4 border-b border-surface-border print:hidden">
        <div className="flex flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-[#E03131]/10 text-[#E03131] shrink-0">
              <BarChart3 size={20} className="sm:w-[22px] sm:h-[22px]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight truncate">
                Insights
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate hidden sm:block">
                สรุปผลงาน มูลค่าความคุ้มค่า และประสิทธิภาพการทำงานของทีม CC
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 print:hidden">
            {/* Copy Link HTML button */}
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="คัดลอกลิงก์หน้าเว็บ HTML เพื่อส่งให้เปิดดูข้อมูลแบบโต้ตอบได้ทุกส่วน"
            >
              {copiedShareLink ? (
                <>
                  <Check size={12} className="text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-bold hidden xs:inline">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Share2 size={12} className="text-blue-600 shrink-0" />
                  <span className="hidden xs:inline">แชร์ลิงก์</span>
                </>
              )}
            </button>

            {/* Email Dispatch button - Visible ONLY to Admin */}
            {isAdmin && (
              <button
                onClick={handleOpenEmailDispatchModal}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="ส่งอีเมลรายงานประจำเดือนถึงคณะผู้บริหาร และ CC สมาชิกทีมทุกคน"
              >
                <Mail size={12} className="shrink-0" />
                <span className="hidden xs:inline">ส่งอีเมล</span>
              </button>
            )}

            {/* Save PDF button opposite Insights icon */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="บันทึกหรือพิมพ์รายงานเป็น PDF"
            >
              <Download size={12} className="shrink-0" />
              <span>Save PDF</span>
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs Bar - 5 Columns Grid on Mobile (No Scroll), Flex on Desktop */}
        <div className="w-full grid grid-cols-5 sm:flex sm:items-center gap-1 sm:gap-1.5 bg-slate-100/90 dark:bg-zinc-800/80 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
          <button
            onClick={() => setActiveTab("workloads")}
            className={`flex-1 justify-center px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 cursor-pointer text-center ${
              activeTab === "workloads" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/80"
            }`}
            title="จำนวนงาน / มูลค่า"
          >
            <PiggyBank size={15} className="shrink-0" />
            <span className="truncate w-full sm:w-auto">
              <span className="sm:hidden">มูลค่า/งาน</span>
              <span className="hidden sm:inline">จำนวนงาน / มูลค่า</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`flex-1 justify-center px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 cursor-pointer text-center ${
              activeTab === "goals" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/80"
            }`}
            title="KR/R , KPI/TIP"
          >
            <Target size={15} className="shrink-0" />
            <span className="truncate w-full sm:w-auto">
              <span className="sm:hidden">KR/KPI</span>
              <span className="hidden sm:inline">🎯 KR/R , KPI/TIP</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("time_efficiency")}
            className={`flex-1 justify-center px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 cursor-pointer text-center ${
              activeTab === "time_efficiency" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/80"
            }`}
            title="เวลา / สถานะงาน"
          >
            <Clock size={15} className="shrink-0" />
            <span className="truncate w-full sm:w-auto">
              <span className="sm:hidden">เวลา/สถานะ</span>
              <span className="hidden sm:inline">เวลา / สถานะงาน</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("individual_360")}
            className={`flex-1 justify-center px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 cursor-pointer text-center ${
              activeTab === "individual_360" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/80"
            }`}
            title="รายงานรายบุคคล"
          >
            <User size={15} className="shrink-0" />
            <span className="truncate w-full sm:w-auto">
              <span className="sm:hidden">รายบุคคล</span>
              <span className="hidden sm:inline">รายงานรายบุคคล</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("executive_report")}
            className={`flex-1 justify-center px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 cursor-pointer text-center ${
              activeTab === "executive_report" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/80"
            }`}
            title="รายงานรวมทีม"
          >
            <HeartHandshake size={15} className="shrink-0" />
            <span className="truncate w-full sm:w-auto">
              <span className="sm:hidden">รวมทีม</span>
              <span className="hidden sm:inline">รายงานรวมทีม</span>
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium">กำลังคำนวณสถิติและผลลัพธ์รอบด้าน...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* UNIFIED COMPACT TOP FILTER BAR (ACROSS ALL 5 TABS - MINIMAL DESIGN)        */}
          {/* ========================================================================= */}
          <div className="bg-surface border border-surface-border rounded-2xl p-2.5 sm:p-3 shadow-2xs mb-5 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-2.5">
              {/* Left Group: Unit & Timeframe Segments */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                {/* Unit Segment */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 hidden sm:flex items-center gap-1 shrink-0">
                    <Filter size={12} className="text-slate-400" />
                    ยูนิต:
                  </span>
                  <div className="flex-1 sm:flex-initial flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-700 overflow-x-auto no-scrollbar">
                    {["All", "Creative", "Content", "PR", "Internal"].map((u) => {
                      const isSelected = unitFilter.toLowerCase() === u.toLowerCase();
                      return (
                        <button
                          key={u}
                          onClick={() => setUnitFilter(u)}
                          className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                            isSelected
                              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                          }`}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timeframe Segment */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0 hidden sm:inline">
                    เวลา:
                  </span>
                  <div className="flex-1 sm:flex-initial flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-700 overflow-x-auto no-scrollbar">
                    {([
                      { id: '1D', title: 'วันนี้ (Today)' },
                      { id: '1W', title: 'สัปดาห์นี้ (This Week)' },
                      { id: '1M', title: '1 เดือน' },
                      { id: '3M', title: '3 เดือน' },
                      { id: '6M', title: '6 เดือน' },
                      { id: '1Y', title: '1 ปี' },
                      { id: 'YTD', title: 'ตั้งแต่ต้นปี (YTD)' },
                      { id: 'ALL', title: 'ทั้งหมด (ALL)' }
                    ] as { id: StockTimeframe; title: string }[]).map(({ id: tf, title }) => (
                      <button
                        key={tf}
                        onClick={() => handleTimeframeChange(tf)}
                        title={title}
                        className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center shrink-0 ${
                          timeframe === tf
                            ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Group: Date Range & Search */}
              <div className="flex items-center gap-2 flex-col sm:flex-row w-full lg:w-auto">
                {/* Date Range Pickers (Zero Overflow, Full Width on Mobile) */}
                <div className="flex items-center justify-between gap-1 sm:gap-1.5 bg-slate-50 dark:bg-zinc-800/90 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs text-xs w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Calendar size={13} className="text-orange-500 shrink-0" />
                    <DatePicker
                      selected={parsedStartDate}
                      onChange={(d: Date | null) => {
                        if (d) {
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          handleCustomDateChange('start', `${y}-${m}-${day}`);
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="วันเริ่มต้น"
                      popperClassName="z-[9999]"
                      className="flex-1 min-w-0 w-full sm:w-[92px] bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-bold border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-[11px] font-mono transition-colors"
                    />
                    <span className="text-slate-400 dark:text-zinc-400 font-sans mx-0.5 font-bold text-[11px] shrink-0">ถึง</span>
                    <DatePicker
                      selected={parsedEndDate}
                      onChange={(d: Date | null) => {
                        if (d) {
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          handleCustomDateChange('end', `${y}-${m}-${day}`);
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="วันสิ้นสุด"
                      popperClassName="z-[9999]"
                      className="flex-1 min-w-0 w-full sm:w-[92px] bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-bold border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-[11px] font-mono transition-colors"
                    />
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] sm:text-[10.5px] text-slate-500 dark:text-zinc-300 font-mono font-bold bg-slate-200/70 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full shrink-0">
                    {effectiveBriefs.length} งาน
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-48">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7.5 pr-2.5 py-1 bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-zinc-900 shadow-2xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: WORKLOADS & SAVE COST */}
          {/* ========================================================================= */}
          {activeTab === "workloads" && (
            <div className="flex flex-col gap-6 printable-report animate-in fade-in duration-150">
              
              {/* PRINT-ONLY FORMAL HEADER (แสดงตามรูปแบบทางการเมื่อ Save PDF / Print) */}
              <div className="hidden print:block print-only mb-6 border-b-2 border-slate-900 pb-3">
                <h1 className="text-2xl font-black text-slate-950 leading-tight">
                  <div>รายงานสรุปจำนวนงานและมูลค่าความคุ้มค่า</div>
                  <div className="text-base font-bold text-slate-600 mt-1">(Workloads & Save Cost)</div>
                </h1>
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
                  <span>ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                  <span>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Tab 1 Action Bar (Compact Single Row) */}
              <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-surface-border shadow-2xs print:hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 shrink-0">รายงาน:</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">จำนวนงานและมูลค่าความคุ้มค่า (Workloads & Save Cost)</span>
                </div>
              </div>

              {/* Top KPI Cards (Including Save Cost & PM Profit with Team Averages Per Member) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Save Cost Card */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-emerald-800 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Save Cost รวม</span>
                      <span className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                        <PiggyBank size={18} />
                      </span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-950 tracking-tight">
                      ฿{orgTotals.totalSaveCost.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                      <span>งานหลัก: ฿{orgTotals.totalOwnerCost.toLocaleString()}</span>
                      <span>งานช่วย: ฿{orgTotals.totalAssistantCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                    <span className="text-emerald-700 font-semibold">เฉลี่ยต่อคน:</span>
                    <span className="font-mono bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-md">
                      ฿{orgTotals.avgSaveCostPerMember.toLocaleString()} / คน
                    </span>
                  </div>
                </div>

                {/* 2. PM Project Profit Card */}
                <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-orange-800 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">กำไรโครงการรวม (PM)</span>
                      <span className="p-2 bg-orange-500 text-white rounded-xl shadow-xs">
                        <DollarSign size={18} />
                      </span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-orange-950 tracking-tight">
                      ฿{orgTotals.totalProfit.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-orange-800 font-medium">
                      <span>โครงการมีกำไร: {effectiveBriefs.filter(b => isCcPmProject(b) && (Number(b.details?.profit) || (Number(b.details?.revenue || 0) - Number(b.details?.cost || 0))) > 0).length} โครงการ</span>
                      <span className="text-orange-700 font-bold">Revenue - Cost</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-orange-200/70 flex items-center justify-between text-[11px] font-bold text-orange-900">
                    <span className="text-orange-700 font-semibold">เฉลี่ยต่อคน:</span>
                    <span className="font-mono bg-orange-100/90 text-orange-900 px-2 py-0.5 rounded-md">
                      ฿{orgTotals.avgProfitPerMember.toLocaleString()} / คน
                    </span>
                  </div>
                </div>

                {/* 3. Tasks Count Card */}
                <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-blue-800 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">ภาระงานทั้งหมด (Tasks)</span>
                      <span className="p-2 bg-blue-500 text-white rounded-xl shadow-xs">
                        <Briefcase size={18} />
                      </span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-blue-950 tracking-tight">
                      {orgTotals.totalTasks} <span className="text-xs font-normal text-slate-500">งาน</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-800 font-medium flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 size={12} /> เสร็จ {orgTotals.completedTasks}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-700">กำลังทำ {orgTotals.inProgressTasks}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-700">รอทำ {orgTotals.pendingTasks}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-blue-200/70 flex items-center justify-between text-[11px] font-bold text-blue-900">
                    <span className="text-blue-700 font-semibold">เฉลี่ยต่อคน:</span>
                    <span className="font-mono bg-blue-100/90 text-blue-900 px-2 py-0.5 rounded-md">
                      {(orgTotals.totalTasks / (orgTotals.activeStaff || 1)).toFixed(1)} งาน / คน
                    </span>
                  </div>
                </div>

                {/* 4. Cross-Skilling / Assistants Card */}
                <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-purple-800 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">งานช่วยเกื้อกูล (Assist)</span>
                      <span className="p-2 bg-purple-500 text-white rounded-xl shadow-xs">
                        <Users size={18} />
                      </span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-purple-950 tracking-tight">
                      {orgTotals.tasksWithAssistants} <span className="text-xs font-normal text-slate-500">งาน</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-purple-800 font-medium">
                      <span>{orgTotals.totalTasks > 0 ? Math.round((orgTotals.tasksWithAssistants / orgTotals.totalTasks) * 100) : 0}% ของงานทั้งหมด</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Cross-Skilling</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-purple-200/70 flex items-center justify-between text-[11px] font-bold text-purple-900">
                    <span className="text-purple-700 font-semibold">มูลค่างานช่วย:</span>
                    <span className="font-mono bg-purple-100/90 text-purple-900 px-2 py-0.5 rounded-md">
                      ฿{orgTotals.totalAssistantCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 5. Team Velocity & Citizenship Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-amber-800 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">ความเร็ว & พลังทีม</span>
                      <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                        <Zap size={18} />
                      </span>
                    </div>
                    <div className="text-2xl lg:text-3xl font-black font-mono text-amber-950 tracking-tight">
                      {executiveAnalysis.teamAvgTurnaroundDays} <span className="text-xs font-normal text-slate-500">วัน/งาน</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-amber-800 font-medium">
                      <span>ส่งตรงเวลา {executiveAnalysis.teamOnTimeRate}%</span>
                      <span className="text-emerald-700 font-bold">Velocity OK</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span className="text-amber-700 font-semibold">ดัชนีหลังบ้าน BOH:</span>
                    <span className="font-mono bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-md" title="คะแนนความร่วมมือและงานหลังบ้านภาพรวมทีม">
                      {executiveAnalysis.teamCitizenshipScore} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* โครงการที่มีเงินเข้าของ CC (PM โครงการของ CC: รายรับ, ต้นทุน, กำไร, รหัส, ทีม, PM, เดดไลน์) */}
              <CCIncomingProjectsBanner
                briefs={effectiveBriefs}
                assignees={assignees}
                onSelectBrief={(b) => setSelectedBriefForModal(b)}
              />

              {/* กราฟปริมาณงานรายคน: แผนภูมิแนวนอนเรียงจากคนทำงานมากสุด ผสมสัดส่วนงานรอทำ กำลังทำ เสร็จ และกรอง unit ย่อยได้ */}
              <MemberWorkloadHorizontalChart
                briefs={effectiveBriefs}
                assignees={assignees}
                memberProfiles={memberProfileMap}
                onSelectMember={(memberId) => {
                  const found = memberStats.find((m) => m.assignee_id === memberId);
                  if (found) setSelectedMember(found);
                }}
              />

              {/* สถิติความต้องการและการสั่งงาน: Rank+Score ทีมไหนสั่งงานเยอะสุด, งานด่วนบ่อยสุด, งานเกินระยะเวลามากสุด, สัดส่วนประเภทงาน */}
              <TeamDemandOverview
                briefs={unitFilter === "All" ? effectiveBriefs : effectiveBriefs.filter((b) => (b.unit?.toLowerCase() || "") === unitFilter.toLowerCase())}
                unitLabel={unitFilter === "All" ? "ทุกสายงาน" : `${unitFilter} Unit`}
                onCategoryClick={(cat) => setSearchQuery(cat)}
              />

              {/* 4 Key Team Management Insights (Workload Continuity, Avg Value, Support Ratio, Peak Spikes) */}
              <WorkloadContinuityInsights
                insights={teamWorkloadInsights}
                unitLabel={unitFilter === "All" ? "ทุกยูนิต" : `${unitFilter} Unit`}
                onSelectMember={(assigneeId) => {
                  const targetMember = memberStats.find((m) => m.assignee_id === assigneeId);
                  if (targetMember) {
                    setSelectedMember(targetMember);
                    setSelectedMemberScope(unitFilter.toLowerCase());
                  }
                }}
              />

              {/* Tab 1 Analytics Charts: Timeline (เลือกช่วงเวลา) */}
              <AnalyticsChartContainer
                title="เปรียบเทียบภาระงานกับระยะเวลา"
                subtitle="เปรียบเทียบปริมาณงานที่ทำกับช่วงเวลา ว่ามีคนรับโหลดงานหนักตลอดมั้ย และสลับดูมูลค่างานกับระยะเวลาว่าใครทำงานที่มีมูลค่าสูงบ่อย"
                metricOptions={[
                  { value: "tasks_count", label: "📦 งานทั้งหมด" },
                  { value: "completed_tasks", label: "✅ งานเสร็จ" },
                  { value: "save_cost", label: "💰 Save Cost" },
                  { value: "assist_tasks", label: "🤝 งานช่วย" },
                ]}
                activeMetric={workloadChartMetric}
                onMetricChange={(m) => setWorkloadChartMetric(m as any)}
                timelineChart={
                  <MemberTimelineChart
                    briefs={effectiveBriefs}
                    assignees={filteredMembers.map((m) => ({
                      id: m.assignee_id,
                      name: m.name,
                      unit: m.unit,
                    }))}
                    months={timeline12Months}
                    series={workloadTimelineData.series}
                    teamAverageByMonth={workloadTimelineData.teamAverageByMonth}
                    metric={workloadChartMetric}
                    metricTitle={
                      workloadChartMetric === "save_cost"
                        ? "มูลค่า Save Cost (บาท)"
                        : workloadChartMetric === "tasks_count"
                        ? "ภาระงานรวม (งาน)"
                        : workloadChartMetric === "assist_tasks"
                        ? "ปริมาณงานที่ช่วย (งาน)"
                        : "งานที่เสร็จสิ้น (งาน)"
                    }
                    externalTimeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    externalStartDate={startDate}
                    externalEndDate={endDate}
                    onDateChange={handleCustomDateChange}
                    externalGranularity={granularity}
                    onGranularityChange={setGranularity}
                    hideTimeControls={true}
                  />
                }
              />

              {/* Dual-Bar Comparison: ปริมาณงานที่ช่วย vs จำนวนเงินที่ได้จากการช่วย (ซ่อนตามคำขอผู้ใช้) */}
              {/* <DualAssistantBarChart
                members={filteredMembers}
                onMemberClick={(assigneeId) => {
                  const targetMember = memberStats.find((m) => m.assignee_id === assigneeId);
                  if (targetMember) {
                    setSelectedMember(targetMember);
                    setSelectedMemberScope(unitFilter.toLowerCase());
                  }
                }}
              /> */}

              {/* ========================================================= */}
              {/* 1. มุมมองยูนิตย่อย (SUB-UNIT OVERVIEW)                    */}
              {/* ========================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-900 text-white shadow-2xs">
                      <Layers size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      ผลลัพธ์แยกตามยูนิตย่อย (Sub-unit Workloads & Save Cost)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {unitFilter === "All" ? "แสดงครบทั้ง 4 ยูนิต" : `ยูนิต ${unitFilter}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedUnitStats.map((unitGroup) => {
                    const uStyle = UNIT_LABELS[unitGroup.unit] || UNIT_LABELS.other;
                    const unitShareOfTotal = orgTotals.totalSaveCost > 0 ? Math.round((unitGroup.totalSaveCost / orgTotals.totalSaveCost) * 100) : 0;

                    return (
                      <div key={unitGroup.unit} className="bg-surface border border-surface-border rounded-2xl p-5 shadow-2xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                              {unitGroup.unitLabel} Unit
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              (ผู้ดูแล Unit: <strong className="text-slate-800">{unitGroup.leadName}</strong> • {unitGroup.memberCount} คน)
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Save Cost รวม Unit</div>
                            <div className="text-lg font-black font-mono text-emerald-700">
                              ฿{unitGroup.totalSaveCost.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {unitGroup.isInternal && (
                          <div className="text-[11px] text-slate-600 dark:text-zinc-300 bg-slate-100/90 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 leading-relaxed">
                            ℹ️ <strong>Internal Unit (ผู้ดูแล: จ๊อบ AA):</strong> สมาชิกคือทุกคนใน CC TEAM เพราะทุกคนจะต้องเข้ามาบันทึกงานภายในที่อยู่นอกเหนือ Task บริการ
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-300 mb-1 font-medium">
                            <span>สัดส่วนการ Save Cost ขององค์กร</span>
                            <span className="font-bold font-mono text-slate-800 dark:text-zinc-100">{unitShareOfTotal}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-zinc-700/80 h-3 rounded-full overflow-hidden border border-slate-300/40 dark:border-zinc-600/50">
                            <div style={{ width: `${Math.max(unitShareOfTotal > 0 ? 3 : 0, unitShareOfTotal)}%` }} className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all shadow-xs" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/60">
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">งานหลักรวม</div>
                            <div className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-mono">{unitGroup.ownerTaskCount}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">งานช่วยรวม</div>
                            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{unitGroup.assistantTaskCount}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Save Cost งานหลัก</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">฿{unitGroup.ownerSaveCost.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Save Cost งานช่วย</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">฿{unitGroup.assistantSaveCost.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {unitGroup.isInternal ? "สมาชิกทุกคนใน CC TEAM (ร่วมงานภายใน):" : "สมาชิกใน Unit:"}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {unitGroup.members.map((m) => (
                              <button
                                key={m.assignee_id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setSelectedMemberScope(unitGroup.unit.toLowerCase());
                                }}
                                className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface border border-surface-border hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>{m.name}</span>
                                <span className="text-[10px] font-mono text-emerald-600 font-bold">
                                  ฿{m.totalSaveCost.toLocaleString()}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ดัชนีคุณค่างานหลังบ้านและการมีส่วนร่วมของทีม (Requirement 3: BOH Citizenship & Support Index) */}
              <BackOfHouseCitizenshipCard
                memberStats={filteredMembers}
                executiveAnalysis={executiveAnalysis}
                onSelectMember={(assigneeId) => {
                  const targetMember = memberStats.find((m) => m.assignee_id === assigneeId);
                  if (targetMember) {
                    setSelectedMember(targetMember);
                    setSelectedMemberScope(unitFilter.toLowerCase());
                  }
                }}
              />

              {/* ========================================================= */}
              {/* 2. มุมมองรายบุคคล (INDIVIDUAL MEMBER CARDS)               */}
              {/* ========================================================= */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <User size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      ผลงานรายบุคคลในยูนิต (Individual Member Workloads & Financials)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">เรียงตาม:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="save_cost">💰 Save Cost รวม</option>
                      <option value="profit">💼 กำไรโครงการ (PM)</option>
                      <option value="citizenship">🛡️ คะแนนหลังบ้าน (BOH)</option>
                      <option value="tasks">📦 ภาระงานรวม</option>
                      <option value="assistant_tasks">🤝 งานช่วยเกื้อกูล</option>
                      <option value="speed">⚡ ความเร็วปิดงาน</option>
                      <option value="ontime">🎯 ส่งมอบตรงเวลา</option>
                    </select>
                    <span className="text-xs text-slate-400 font-mono">
                      ({filteredMembers.length} คน)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMembers.map((member, index) => {
                    const isInternalView = unitFilter.toLowerCase() === "internal";
                    const uStyle = isInternalView
                      ? UNIT_LABELS.internal
                      : (UNIT_LABELS[member.unit?.toLowerCase()] || UNIT_LABELS.other);
                    // 1. สัดส่วนจำนวนเงิน Save Cost
                    const costOwnerPct = member.totalSaveCost > 0 ? Math.round((member.ownerSaveCost / member.totalSaveCost) * 100) : 100;
                    const costAssistantPct = 100 - costOwnerPct;

                    // 2. สัดส่วนปริมาณงาน (Tasks)
                    const totalTasksCount = member.totalTasksInvolved || (member.ownerTaskCount + member.assistantTaskCount);
                    const taskOwnerPct = totalTasksCount > 0 ? Math.round((member.ownerTaskCount / totalTasksCount) * 100) : 100;
                    const taskAssistantPct = 100 - taskOwnerPct;

                    const isTopThree = index < 3 && member.totalSaveCost > 0;

                    return (
                      <div
                        key={member.assignee_id}
                        onClick={() => {
                          setSelectedMember(member);
                          setSelectedMemberScope(unitFilter.toLowerCase());
                        }}
                        className="bg-surface border border-surface-border hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                isTopThree
                                  ? index === 0
                                    ? "bg-amber-100 text-amber-700 border border-amber-300 shadow-xs"
                                    : index === 1
                                    ? "bg-slate-200 text-slate-700 border border-slate-300"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {isTopThree ? (index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉") : `#${index + 1}`}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                  {member.name}
                                </h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${uStyle.bg} ${uStyle.color} ${uStyle.border} border mt-0.5`}>
                                  {isInternalView ? "Internal (งานภายใน)" : uStyle.label}
                                  {isInternalView && member.primaryUnit && member.primaryUnit !== "internal" && (
                                    <span className="opacity-75 font-normal ml-0.5 lowercase">({member.primaryUnit})</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {isInternalView ? "Save Cost ภายใน" : "Save Cost รวม"}
                              </div>
                              <div className="text-base font-black font-mono text-emerald-700">
                                ฿{member.totalSaveCost.toLocaleString()}
                              </div>
                              <div className="text-[11px] font-bold font-mono text-orange-600 mt-0.5" title={`กำไรโครงการ PM: หลัก ฿${member.ownerProfit.toLocaleString()} | ช่วย ฿${member.assistantProfit.toLocaleString()}`}>
                                กำไร ฿{(member.totalProfit || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* 2 Comparison Bars: ปริมาณงาน & จำนวนเงินที่ได้จากการช่วย */}
                          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 mb-3 space-y-2.5 shadow-2xs">
                            {/* 1. Bar: ปริมาณงาน (Workload Task Count) */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10.5px] font-semibold">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                  <Briefcase size={11} className="text-blue-600" />
                                  <span>งานหลัก:</span>
                                  <strong className="font-mono text-slate-900">{member.ownerTaskCount} งาน</strong>
                                </span>
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <Users size={11} className="text-amber-500" />
                                  <span>งานช่วย:</span>
                                  <strong className="font-mono text-amber-800">{member.assistantTaskCount} งาน</strong>
                                </span>
                              </div>

                              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden flex gap-0.5 p-[1px] border border-slate-200">
                                <div 
                                  style={{ width: `${taskOwnerPct}%` }} 
                                  className="bg-blue-600 h-full rounded-l-full transition-all" 
                                  title={`ปริมาณงานหลัก ${taskOwnerPct}% (${member.ownerTaskCount} งาน)`}
                                />
                                <div 
                                  style={{ width: `${taskAssistantPct}%` }} 
                                  className="bg-amber-400 h-full rounded-r-full transition-all" 
                                  title={`ปริมาณงานที่ช่วย ${taskAssistantPct}% (${member.assistantTaskCount} งาน)`}
                                />
                              </div>

                              <div className="flex justify-between text-[9.5px] font-mono font-semibold px-0.5 text-slate-500">
                                <span className="text-blue-700">หลัก {taskOwnerPct}%</span>
                                <span className="text-amber-700 font-bold">ช่วย {taskAssistantPct}% (ปริมาณงานที่ช่วย)</span>
                              </div>
                            </div>

                            <div className="border-t border-slate-200/70 pt-2 space-y-1">
                              {/* 2. Bar: จำนวนเงิน Save Cost (Financial Value) */}
                              <div className="flex justify-between items-center text-[10.5px] font-semibold">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                  <span>มูลค่างานหลัก:</span>
                                  <strong className="font-mono text-emerald-700">฿{member.ownerSaveCost.toLocaleString()}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span>ได้จากงานช่วย:</span>
                                  <strong className="font-mono text-amber-700">฿{member.assistantSaveCost.toLocaleString()}</strong>
                                </span>
                              </div>

                              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden flex gap-0.5 p-[1px] border border-slate-200">
                                <div 
                                  style={{ width: `${costOwnerPct}%` }} 
                                  className="bg-emerald-600 h-full rounded-l-full transition-all" 
                                  title={`มูลค่างานหลัก ${costOwnerPct}% (฿${member.ownerSaveCost.toLocaleString()})`}
                                />
                                <div 
                                  style={{ width: `${costAssistantPct}%` }} 
                                  className="bg-amber-400 h-full rounded-r-full transition-all" 
                                  title={`จำนวนเงินที่ได้จากการช่วย ${costAssistantPct}% (฿${member.assistantSaveCost.toLocaleString()})`}
                                />
                              </div>

                              <div className="flex justify-between text-[9.5px] font-mono font-semibold px-0.5 text-slate-500">
                                <span className="text-emerald-700">หลัก {costOwnerPct}%</span>
                                <span className="text-amber-700 font-bold">ช่วย {costAssistantPct}% (เงินที่ได้จากการช่วย)</span>
                              </div>
                            </div>
                          </div>

                          {/* Workload Counts & PM Profit */}
                          <div className="grid grid-cols-4 gap-1 text-center py-1 border-t border-surface-border/60">
                            <div className="p-1.5 bg-muted/20 rounded-lg">
                              <div className="text-[9.5px] text-slate-400 font-medium whitespace-nowrap">งานหลัก</div>
                              <div className="text-sm font-bold text-slate-800 font-mono">{member.ownerTaskCount}</div>
                            </div>
                            <div className="p-1.5 bg-muted/20 rounded-lg">
                              <div className="text-[9.5px] text-slate-400 font-medium whitespace-nowrap">งานช่วย</div>
                              <div className="text-sm font-bold text-amber-700 font-mono">{member.assistantTaskCount}</div>
                            </div>
                            <div className="p-1.5 bg-orange-50/70 border border-orange-200/50 rounded-lg">
                              <div className="text-[9.5px] text-orange-700 font-medium whitespace-nowrap">กำไร PM</div>
                              <div className="text-xs font-black text-orange-800 font-mono">฿{(member.totalProfit || 0).toLocaleString()}</div>
                            </div>
                            <div className="p-1.5 bg-muted/20 rounded-lg">
                              <div className="text-[9.5px] text-slate-400 font-medium whitespace-nowrap">รวมงาน</div>
                              <div className="text-sm font-bold text-slate-900 font-mono">{member.totalTasksInvolved}</div>
                            </div>
                          </div>

                          {/* Management Insight Badges (Including BOH Citizenship Badge) */}
                          {(() => {
                            const avgVal = member.totalTasksInvolved > 0 ? Math.round(member.totalSaveCost / member.totalTasksInvolved) : 0;
                            const mInsight = teamWorkloadInsights.memberInsights.find((mi) => mi.assigneeId === member.assignee_id);
                            return (
                              <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-surface-border/50 text-[10px]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200" title="มูลค่าเฉลี่ยต่องาน">
                                  💎 ฿{avgVal.toLocaleString()}/งาน
                                </span>
                                {member.citizenshipScore > 0 && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${
                                    member.citizenshipTier === 'champion'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : member.citizenshipTier === 'anchor'
                                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                                      : member.citizenshipTier === 'contributor'
                                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`} title={`ดัชนีคะแนนการมีส่วนร่วมและงานหลังบ้าน BOH: ${member.citizenshipScore}/100`}>
                                    🛡️ {member.citizenshipTitle} ({member.citizenshipScore})
                                  </span>
                                )}
                                {mInsight && (
                                  <>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${
                                      mInsight.burnoutRiskLevel === 'critical'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : mInsight.burnoutRiskLevel === 'warning'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`} title={mInsight.burnoutStatusText}>
                                      🏃 ต่อเนื่อง {mInsight.continuityRate}%
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200" title={`สัดส่วนงานช่วย: ${mInsight.assistantRatio}%`}>
                                      🤝 ช่วย {mInsight.assistantRatio}%
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-emerald-700 font-semibold">
                          <span>ดูรายละเอียดงาน ({member.totalTasksInvolved} งาน)</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TIME, VELOCITY & RISK MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === "time_efficiency" && (
            <div className="flex flex-col gap-6 printable-report animate-in fade-in duration-150">
              
              {/* PRINT-ONLY FORMAL HEADER (แสดงตามรูปแบบทางการเมื่อ Save PDF / Print) */}
              <div className="hidden print:block print-only mb-6 border-b-2 border-slate-900 pb-3">
                <h1 className="text-2xl font-black text-slate-950 leading-tight">
                  <div>รายงานสรุปเวลาและประสิทธิภาพการส่งมอบงาน</div>
                  <div className="text-base font-bold text-slate-600 mt-1">(Time & Velocity)</div>
                </h1>
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
                  <span>ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                  <span>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Tab 3 Action Bar */}
              <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-surface-border shadow-2xs print:hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 shrink-0">รายงาน:</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">เวลาและประสิทธิภาพการส่งมอบ (Time & Efficiency)</span>
                </div>
              </div>

              {/* Header Analysis & Highlights - Scoped to selected Unit filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4.5 shadow-xs">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      ความเร็วเฉลี่ยต่อชิ้น ({scopedTimeMetrics.unitLabel})
                    </span>
                    <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-black font-mono text-amber-950 dark:text-amber-100">
                    {scopedTimeMetrics.avgTurnaroundDays > 0 ? scopedTimeMetrics.avgTurnaroundDays : "-"} <span className="text-sm font-normal text-slate-600 dark:text-zinc-400">วัน/งาน</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300 font-medium mt-1">
                    {scopedTimeMetrics.completedCount > 0
                      ? `คำนวณจากงานที่ส่งมอบเสร็จสิ้น ${scopedTimeMetrics.completedCount} งาน`
                      : `กำลังดำเนินการ ${scopedTimeMetrics.inProgressCount} งาน (รอผลงานส่งมอบ)`}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4.5 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      อัตราตรงต่อเวลา ({scopedTimeMetrics.unitLabel})
                    </span>
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-950 dark:text-emerald-100">
                    {scopedTimeMetrics.onTimeRate !== null ? `${scopedTimeMetrics.onTimeRate}%` : "100%"}
                  </div>
                  <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300 font-medium mt-1">
                    {scopedTimeMetrics.completedCount > 0
                      ? "สัดส่วนงานที่ส่งมอบทันตามวัน Deadline หรือก่อนกำหนด"
                      : "รักษามาตรฐานตรงเวลา (ไม่มีงานค้างเกินกำหนด)"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4.5 shadow-xs">
                  <div className="flex items-center justify-between text-purple-800 dark:text-purple-400 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      ดัชนีประสิทธิภาพ Save Cost ({scopedTimeMetrics.unitLabel})
                    </span>
                    <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-3xl font-black font-mono text-purple-950 dark:text-purple-100">
                    ฿{scopedTimeMetrics.saveCostPerUnit.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-purple-900/80 dark:text-purple-300 font-medium mt-1">
                    {scopedTimeMetrics.completedCount > 0
                      ? "มูลค่า Save Cost เฉลี่ยต่อ 1 ชิ้นงานที่ส่งมอบแล้ว"
                      : `ภาระงานสะสมในมือทั้งหมด ${scopedTimeMetrics.totalTasks} งาน`}
                  </p>
                </div>
              </div>



              {/* ========================================================= */}
              {/* 1. มุมมองยูนิตย่อย (SUB-UNIT TIME, VELOCITY & RISK)       */}
              {/* ========================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
                      <Layers size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      สถานะเวลาและความเสี่ยงแยกตามยูนิต (Sub-unit Velocity & Risk Overview)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {unitFilter === "All" ? "แสดงครบทั้ง 4 ยูนิต" : `ยูนิต ${unitFilter}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredUnitRiskAlerts.map((alert) => {
                    const uStyle = UNIT_LABELS[alert.unit] || UNIT_LABELS.other;
                    const unitMembers = alert.unit === "internal"
                      ? (unitMemberStatsMap["internal"] || []).map(m => ({ ...m, unit: "internal", primaryUnit: m.primaryUnit || m.unit }))
                      : (unitMemberStatsMap[alert.unit] || []).filter(m => m.unit?.toLowerCase() === alert.unit || m.totalTasksInvolved > 0);

                    return (
                      <div 
                        key={alert.unit} 
                        className={`rounded-3xl p-5 border transition-all shadow-xs space-y-4 ${
                          alert.severity === 'critical'
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : alert.severity === 'warning'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                            : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                        }`}
                      >
                        {/* Unit Card Header */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-zinc-700/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                                {alert.unit === 'internal' ? "Internal Task (งานภายใน)" : `${alert.unitLabel} Unit`}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                alert.severity === 'critical'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
                                  : alert.severity === 'warning'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                              }`}>
                                {alert.severity === 'critical' ? 'วิกฤต (Critical)' : alert.severity === 'warning' ? 'เฝ้าระวัง (Warning)' : 'ปกติ (Normal)'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1">
                              ผู้ดูแล Unit: <strong className="text-slate-800 dark:text-zinc-100">{alert.leadName}</strong> • สมาชิก {unitMembers.length} คน
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase">งานในมือทั้งหมด</div>
                            <div className="text-base font-bold font-mono text-slate-900 dark:text-zinc-100">{alert.totalTasks} งาน</div>
                          </div>
                        </div>

                        {/* 4 Unit Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white/80 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 text-center">
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">ความเร็วเฉลี่ย</div>
                            <div className="text-xs font-bold font-mono text-amber-900 dark:text-amber-300 mt-0.5">
                              {alert.avgTurnaroundDays > 0 ? `${alert.avgTurnaroundDays} วัน` : "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">ส่งตรงเวลา</div>
                            <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                              {alert.completedCount > 0 ? `${alert.onTimeRate}%` : "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">งานเสร็จแล้ว</div>
                            <div className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-200 mt-0.5">
                              {alert.completedCount} งาน
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">งานค้างเกินเกณฑ์</div>
                            <div className={`text-xs font-bold font-mono mt-0.5 ${
                              alert.stalledPendingCount + alert.stalledProgressCount + alert.overdueCount > 0 ? "text-rose-600 dark:text-rose-400 font-black" : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {alert.stalledPendingCount + alert.stalledProgressCount + alert.overdueCount > 0
                                ? `${alert.stalledPendingCount + alert.stalledProgressCount + alert.overdueCount} งาน`
                                : "ไม่มี"}
                            </div>
                          </div>
                        </div>

                        {/* Situation */}
                        <p className="text-xs text-slate-800 dark:text-zinc-100 bg-white/90 dark:bg-zinc-800/90 p-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 leading-relaxed">
                          📌 <strong>สถานะภาระงาน:</strong> {alert.situation}
                        </p>

                        {/* Action Steps */}
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                            <Zap size={12} className="text-amber-600 dark:text-amber-400" />
                            แนวทางติดตามของ {alert.leadName}:
                          </span>
                          <div className="space-y-1 text-xs text-slate-800 dark:text-zinc-100 bg-white/90 dark:bg-zinc-800/90 p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-700">
                            {alert.actionSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">•</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Real Tasks in this Unit */}
                        {(() => {
                          const tasksInUnit = alert.unit === "internal"
                            ? briefs.filter(b => (b.unit || "").toLowerCase() === "internal")
                            : briefs.filter(b => (b.unit || "").toLowerCase() === alert.unit.toLowerCase());
                          if (tasksInUnit.length === 0) return null;
                          return (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                                📋 รายการงานในยูนิต ({tasksInUnit.length} งาน):
                              </span>
                              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                                {tasksInUnit.map((b) => {
                                  const isOverdue = b.deadline && b.status !== 'completed' && b.status !== 'cancelled' && new Date().getTime() > new Date(b.deadline).getTime() + 86400000;
                                  return (
                                    <div key={b.id} className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs">
                                      <div className="min-w-0 flex-1 truncate">
                                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 mr-1.5">{resolveTaskCode(b, briefs)}</span>
                                        <span className="text-slate-700 dark:text-zinc-300 truncate">{b.project_name || "ไม่ระบุชื่องาน"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {isOverdue && (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                            เกินกำหนด
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                                          {b.status === 'completed' ? 'เสร็จสิ้น' : b.status === 'in_progress' ? 'กำลังทำ' : (!b.assignee_id ? 'รอมอบหมาย' : 'รอทำ')}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Member Speed Roster in this Unit */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            {alert.unit === "internal" ? "สมาชิกทุกคนใน CC TEAM (สถานะความเร็วและตรงเวลา):" : "สมาชิกใน Unit และประสิทธิภาพ:"}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {unitMembers.map((m) => (
                              <button
                                key={m.assignee_id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setSelectedMemberScope(alert.unit);
                                }}
                                className="text-xs font-medium px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-amber-300 dark:hover:border-amber-500 hover:text-amber-800 dark:hover:text-amber-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>{m.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  m.speedCategory === "fast" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" :
                                  m.speedCategory === "deep" ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300" :
                                  m.speedCategory === "at_risk" ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300" : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                                }`}>
                                  {m.avgTurnaroundDays > 0 ? `${m.avgTurnaroundDays}d` : "-"}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                                  {m.onTimeRate}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================= */}
              {/* 2. มุมมองรายบุคคล (INDIVIDUAL TIME, VELOCITY & TABLE)     */}
              {/* ========================================================= */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-900 text-white shadow-2xs">
                      <Clock size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      เวลาและประสิทธิภาพการส่งมอบรายบุคคล (Individual Velocity & On-Time Rate)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    ({filteredMembers.length} คน)
                  </span>
                </div>

                {/* Individual Time & Risk Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMembers.map((member, index) => {
                    const isInternalView = unitFilter.toLowerCase() === "internal";
                    const uStyle = isInternalView
                      ? UNIT_LABELS.internal
                      : (UNIT_LABELS[member.unit?.toLowerCase()] || UNIT_LABELS.other);
                    const totalBottlenecks = member.stalledPendingCount + member.stalledProgressCount + member.overdueTasksCount;

                    return (
                      <div
                        key={member.assignee_id}
                        onClick={() => {
                          setSelectedMember(member);
                          setSelectedMemberScope(unitFilter.toLowerCase());
                        }}
                        className="bg-surface border border-surface-border hover:border-amber-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-amber-700 transition-colors">
                                {member.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                                  {isInternalView ? "Internal Task" : uStyle.label}
                                  {isInternalView && member.primaryUnit && member.primaryUnit !== "internal" && (
                                    <span className="opacity-75 font-normal ml-0.5 lowercase">({member.primaryUnit})</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Speed Category Badge */}
                            <div className="shrink-0 text-right">
                              {member.speedCategory === "fast" && (
                                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200/90 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5">
                                  <Zap size={12} className="text-emerald-500 shrink-0" />
                                  <span>ส่งมอบเร็ว</span>
                                </span>
                              )}
                              {member.speedCategory === "deep" && (
                                <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-purple-200/90 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5">
                                  <Sparkles size={12} className="text-purple-500 shrink-0" />
                                  <span>มูลค่าสูง</span>
                                </span>
                              )}
                              {member.speedCategory === "balanced" && (
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-200/90 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5">
                                  <Scale size={12} className="text-blue-500 shrink-0" />
                                  <span>สมดุลต่อเนื่อง</span>
                                </span>
                              )}
                              {member.speedCategory === "at_risk" && (
                                <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-200/90 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5">
                                  <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                                  <span>ระวังล่าช้า</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 4 Metrics Mini Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-muted/20 rounded-xl border border-surface-border/50 text-center mb-3">
                            <div className="p-1 flex flex-col justify-center items-center">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium whitespace-nowrap">เวลาเฉลี่ย</div>
                              <div className="text-xs font-bold font-mono text-amber-900 dark:text-amber-300 mt-0.5 whitespace-nowrap">
                                {member.avgTurnaroundDays > 0 ? `${member.avgTurnaroundDays} วัน` : "-"}
                              </div>
                            </div>
                            <div className="p-1 flex flex-col justify-center items-center">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium whitespace-nowrap">ตรงเวลา</div>
                              <div className={`text-xs font-bold font-mono mt-0.5 whitespace-nowrap ${member.onTimeRate >= 80 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                                {member.onTimeRate}%
                                {member.lateCompletedCount > 0 && (
                                  <span className="text-[9px] text-rose-500 ml-0.5">(-{member.lateCompletedCount})</span>
                                )}
                              </div>
                            </div>
                            <div className="p-1 flex flex-col justify-center items-center">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium whitespace-nowrap">เสร็จ / ในมือ</div>
                              <div className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-100 mt-0.5 whitespace-nowrap">
                                {member.completedTasks} / {member.inProgressTasks + member.pendingTasks}
                              </div>
                            </div>
                            <div className="p-1 flex flex-col justify-center items-center">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium whitespace-nowrap">งานค้าง</div>
                              <div className={`text-xs font-bold font-mono mt-0.5 whitespace-nowrap ${totalBottlenecks > 0 ? "text-rose-600 dark:text-rose-400 font-black" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {totalBottlenecks > 0 ? `${totalBottlenecks} งาน` : "0"}
                              </div>
                            </div>
                          </div>

                          {/* Action Recommendation */}
                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 bg-slate-50/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-700 mb-3 leading-relaxed">
                            💡 <strong>คำแนะนำเชิงลึก:</strong> {member.actionSteps?.[0] || (member as any).recommendation || "รักษามาตรฐานความเร็วและคุณภาพการทำงานอย่างต่อเนื่อง"}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-amber-700 font-semibold">
                          <span>ดูประวัติและงานในมือ ({member.totalTasksInvolved} งาน)</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Individual Time & Velocity Comparison Table */}
                <div className="bg-surface border border-surface-border rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        ตารางเปรียบเทียบความเร็ว ประสิทธิภาพ และความตรงต่อเวลารายบุคคล
                      </h4>
                      <p className="text-xs text-slate-500">
                        จัดลำดับตามความเร็วในการปิดงาน (Turnaround Time) และสัดส่วนงานที่ส่งตรงตามกำหนด
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-bold bg-muted/40 px-2.5 py-1 rounded-full">
                      {filteredMembers.length} คน
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-surface-border/70 text-slate-500">
                          <th className="pb-2.5 px-3 font-semibold">ชื่อผู้ปฏิบัติงาน</th>
                          <th className="pb-2.5 px-3 font-semibold">ยูนิต</th>
                          <th className="pb-2.5 px-3 font-semibold text-center">งานที่ส่งมอบแล้ว</th>
                          <th className="pb-2.5 px-3 font-semibold text-center">เวลาเฉลี่ย/งาน</th>
                          <th className="pb-2.5 px-3 font-semibold text-center">ช่วงวัน (เร็ว-ช้าสุด)</th>
                          <th className="pb-2.5 px-3 font-semibold text-center">อัตราตรงเวลา</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">Save Cost รวม</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">มูลค่า/วัน</th>
                          <th className="pb-2.5 px-3 font-semibold text-center">สถานะประเมิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50">
                        {filteredMembers.map((m) => {
                          const isInternalView = unitFilter.toLowerCase() === "internal";
                          const uStyle = isInternalView
                            ? UNIT_LABELS.internal
                            : (UNIT_LABELS[m.unit?.toLowerCase()] || UNIT_LABELS.other);

                          return (
                            <tr
                              key={m.assignee_id}
                              onClick={() => {
                                setSelectedMember(m);
                                setSelectedMemberScope(unitFilter.toLowerCase());
                              }}
                              className="hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                              <td className="py-3 px-3 font-bold text-slate-800">
                                {m.name}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                                  {isInternalView ? "Internal (งานภายใน)" : uStyle.label}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                                {m.completedTasks} งาน
                              </td>
                              <td className="py-3 px-3 text-center">
                                {m.avgTurnaroundDays > 0 ? (
                                  <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full ${
                                    m.avgTurnaroundDays <= 2.5
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : m.avgTurnaroundDays <= 5
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                    <Zap size={11} /> {m.avgTurnaroundDays} วัน
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                                {m.fastestDays !== null ? `${m.fastestDays}d - ${m.slowestDays}d` : "-"}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-1">
                                  <span className={`font-mono font-bold ${m.onTimeRate >= 80 ? "text-emerald-700" : "text-amber-700"}`}>
                                    {m.onTimeRate}%
                                  </span>
                                  {m.lateCompletedCount > 0 && (
                                    <span className="text-[10px] text-rose-500 font-mono" title={`ช้ากว่ากำหนด ${m.lateCompletedCount} งาน`}>
                                      (-{m.lateCompletedCount})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                                ฿{m.totalSaveCost.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                                ฿{m.saveCostPerDay.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {m.speedCategory === "fast" && (
                                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/90 shadow-2xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-w-[120px]">
                                    <Zap size={12} className="text-emerald-500 shrink-0" />
                                    <span>ส่งมอบเร็ว</span>
                                  </span>
                                )}
                                {m.speedCategory === "deep" && (
                                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200/90 shadow-2xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-w-[120px]">
                                    <Sparkles size={12} className="text-purple-500 shrink-0" />
                                    <span>มูลค่าสูง</span>
                                  </span>
                                )}
                                {m.speedCategory === "balanced" && (
                                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200/90 shadow-2xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-w-[120px]">
                                    <Scale size={12} className="text-blue-500 shrink-0" />
                                    <span>สมดุลต่อเนื่อง</span>
                                  </span>
                                )}
                                {m.speedCategory === "at_risk" && (
                                  <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200/90 shadow-2xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-w-[120px]">
                                    <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                                    <span>ระวังล่าช้า</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INDIVIDUAL 360° PROFILE & COMPREHENSIVE REPORT */}
          {/* ========================================================================= */}
          {activeTab === "individual_360" && currentProfileMember && (
            <IndividualReportView
              currentProfileMember={currentProfileMember}
              memberStats={memberStats}
              onSelectMember={(assigneeId) => setProfileMemberId(assigneeId)}
              briefs={effectiveBriefs}
              onOpenTaskModal={(brief) => setSelectedBriefForModal(brief)}
              memberProfiles={memberProfileMap}
              executiveMembers={executiveMembers}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TEAM SYNTHESIS & HOLISTIC INTELLIGENCE (รายงานรวมทีม) */}
          {/* ========================================================================= */}
          {activeTab === "executive_report" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              <TeamSynthesisDashboard
                briefs={effectiveBriefs}
                memberStats={memberStats}
                executiveAnalysis={executiveAnalysis}
                orgTotals={orgTotals}
                realtimeMetrics={realtimeMetrics}
                teamWorkloadInsights={teamWorkloadInsights}
                unitStats={unitStats}
                emailDraftText={emailDraftText}
                onDispatchEmail={handleDispatchExecutiveEmail}
                isDispatching={isDispatchingExecEmail}
                emailSuccess={execEmailSuccessMessage}
                onSelectMember={(assigneeId) => {
                  setProfileMemberId(assigneeId);
                  setActiveTab("individual_360");
                }}
                onNavigateTab={(tab) => {
                  if (tab === "workloads") setActiveTab("workloads");
                  else if (tab === "goals") setActiveTab("goals");
                  else if (tab === "time_efficiency") setActiveTab("time_efficiency");
                  else if (tab === "individual_360") setActiveTab("individual_360");
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GOALS (KR / R / TIP) */}
          {activeTab === "goals" && (
            <div className="space-y-6 printable-report animate-in fade-in duration-150">
              
              {/* PRINT-ONLY FORMAL HEADER (แสดงตามรูปแบบทางการเมื่อ Save PDF / Print) */}
              <div className="hidden print:block print-only mb-6 border-b-2 border-slate-900 pb-3">
                <h1 className="text-2xl font-black text-slate-950 leading-tight">
                  <div>รายงานสรุปตัวชี้วัดความสำเร็จ</div>
                  <div className="text-base font-bold text-slate-600 mt-1">(Strategic Goals: KR/R & KPI/TIP)</div>
                </h1>
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
                  <span>ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                  <span>วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Tab 2 Action Bar */}
              <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-surface-border shadow-2xs print:hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 shrink-0">รายงาน:</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 truncate">ตัวชี้วัดความสำเร็จ (KR/R & KPI/TIP)</span>
                </div>
              </div>

              {/* Top Overview & Summary KPI Badges */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <Target className="text-[#E03131]" size={22} />
                      ตัวชี้วัดความสำเร็จ KR / R และ KPI / TIP ทีม CC
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ประมวลผลความคืบหน้าจริงจากบรีฟงาน (Auto-calculated) สัมพันธ์กับงานภายใน, งานภายนอก มช./RSP, กำไรโครงการ PM และคะแนนความพึงพอใจ 5 มิติ
                    </p>
                  </div>
                  
                  {/* Filter buttons for KR / TIP */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
                    <button
                      onClick={() => setGoalTypeFilter("all")}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        goalTypeFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ทั้งหมด ({realtimeMetrics.krs.length + realtimeMetrics.tips.length})
                    </button>
                    <button
                      onClick={() => setGoalTypeFilter("KR")}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        goalTypeFilter === "KR" ? "bg-white text-blue-700 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🎯 KR & R ({realtimeMetrics.krs.length} กลุ่ม)
                    </button>
                    <button
                      onClick={() => setGoalTypeFilter("TIP")}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        goalTypeFilter === "TIP" ? "bg-white text-amber-700 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ✨ KPI & TIP ({realtimeMetrics.tips.length} ตัว)
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 p-3 rounded-2xl">
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">KR ความสำเร็จรวม</div>
                    <div className="text-xl font-mono font-black text-blue-900 dark:text-blue-200 mt-0.5">{realtimeMetrics.overallKRScore}%</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">ถ่วงน้ำหนัก 4 KR</div>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3 rounded-2xl">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">TIP ความสำเร็จรวม</div>
                    <div className="text-xl font-mono font-black text-amber-900 dark:text-amber-200 mt-0.5">{realtimeMetrics.overallTIPScore}%</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">ถ่วงน้ำหนัก 4 ตัวชี้วัด</div>
                  </div>

                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 p-3 rounded-2xl">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">ความพึงพอใจเฉลี่ย</div>
                    <div className="text-xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-0.5 flex items-center gap-1">
                      <Star size={16} className="fill-amber-400 text-amber-500" />
                      {realtimeMetrics.averageSatisfactionRate}%
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">ประเมินแล้ว {realtimeMetrics.totalEvaluatedBriefs} งาน</div>
                  </div>

                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 p-3 rounded-2xl">
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">กำไร PM รวม (R7+R8)</div>
                    <div className="text-lg font-mono font-black text-indigo-900 dark:text-indigo-200 mt-0.5 truncate">
                      ฿{(realtimeMetrics.totalProfitGov + realtimeMetrics.totalProfitPrivate).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium truncate">
                      {((realtimeMetrics.pipelineProfitGov || 0) + (realtimeMetrics.pipelineProfitPrivate || 0)) > 0 ? (
                        <span>เสร็จแล้ว ฿{(realtimeMetrics.totalProfitGov + realtimeMetrics.totalProfitPrivate).toLocaleString()} | กำลังทำ ฿{((realtimeMetrics.pipelineProfitGov || 0) + (realtimeMetrics.pipelineProfitPrivate || 0)).toLocaleString()}</span>
                      ) : (
                        <span>ภาครัฐ ฿{realtimeMetrics.totalProfitGov.toLocaleString()} | เอกชน ฿{realtimeMetrics.totalProfitPrivate.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Satisfaction Survey Analytics Chart */}
              <SatisfactionSurveyChart briefs={effectiveBriefs} />

              {/* SECTION 1: KR & R METRICS */}
              {(goalTypeFilter === "all" || goalTypeFilter === "KR") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      ตัวชี้วัดผลงานหลักของทีม (Key Results & R-Metrics)
                    </h4>
                    <span className="text-xs text-slate-500">
                      เป้าหมายปรับลดอัตโนมัติตามขนาดทีม (ไม่เพิ่มภาระให้สมาชิก)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {realtimeMetrics.krs.map((krResult) => {
                      const { kr, actualAchieved, target, activeTarget, percentage, rResults } = krResult;
                      return (
                        <div 
                          key={kr.code}
                          className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white font-mono font-black text-xs border dark:border-zinc-700">
                                {kr.code}
                              </span>
                              <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                                  {kr.name}
                                </h5>
                              </div>
                            </div>

                            <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                              percentage >= 80 
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60" 
                                : percentage >= 40 
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/60" 
                                : "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                            }`}>
                              {percentage}%
                            </span>
                          </div>

                          {/* Prominent Target & Actual Dual Ribbon */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-zinc-800/90 dark:to-zinc-850/90 border border-slate-200 dark:border-zinc-700">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">ผลงานจริงสะสม</span>
                              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-zinc-100 leading-tight">
                                {kr.isCurrency ? `฿${actualAchieved.toLocaleString()}` : `${actualAchieved.toLocaleString()} ${kr.unit}`}
                              </span>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">เป้าหมายทีม</span>
                              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                                {kr.isCurrency ? `฿${activeTarget.toLocaleString()}` : `${activeTarget.toLocaleString()} ${kr.unit}`}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-zinc-300">
                              <span>ความคืบหน้ารวม</span>
                              <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{percentage}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-700/80 rounded-full overflow-hidden border border-slate-300/40 dark:border-zinc-600/50">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  percentage >= 80 ? "bg-emerald-500" : percentage >= 40 ? "bg-amber-500" : "bg-blue-600"
                                }`}
                                style={{ width: `${Math.max(percentage > 0 ? 3 : 0, Math.min(100, percentage))}%` }}
                              />
                            </div>
                          </div>

                          {/* Special KR2: External CMU & RSP Pipeline & Scope Notice */}
                          {kr.code === "KR2" && (
                            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="text-xs text-purple-950 dark:text-purple-200">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                  <span>ภาระงาน มช. & RSP (KR2 Pipeline)</span>
                                </div>
                                <div className="text-[11px] text-purple-800 dark:text-purple-300 font-medium mt-0.5">
                                  ส่งมอบแล้ว <strong className="font-mono text-emerald-700 dark:text-emerald-400">{actualAchieved}</strong> งาน 
                                  • อยู่ระหว่างดำเนินงาน (Pipeline) <strong className="font-mono text-purple-700 dark:text-purple-300">{realtimeMetrics.externalPipelineCount || 0}</strong> งาน
                                </div>
                              </div>
                              <div className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 text-[11px] font-mono font-bold text-purple-800 dark:text-purple-300 shrink-0 self-start sm:self-auto">
                                รวมในระบบ {actualAchieved + (realtimeMetrics.externalPipelineCount || 0)} งาน
                              </div>
                            </div>
                          )}

                          {/* Special KR3: 50:50 Content & PR split notice and button */}
                          {kr.code === "KR3" && (
                            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="text-xs text-blue-900 dark:text-blue-200">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>📢 สัดส่วนแบ่งปัน 50:50</span>
                                  <span className="text-[10px] font-normal text-blue-700 dark:text-blue-300">(Content 50% / PR 50%)</span>
                                </div>
                                <div className="text-[11px] text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                                  Reach & Engagement ที่กรอกจะถูกกระจายให้ทีม Content และ PR ในจำนวนเท่าๆ กัน
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowReachEngageModal(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <TrendingUp size={14} />
                                <span>บันทึก Reach & Eng.</span>
                              </button>
                            </div>
                          )}

                          {/* Special KR4: PM Projects Realized vs Pipeline Profit Notice */}
                          {kr.code === "KR4" && (
                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="text-xs text-emerald-950 dark:text-emerald-200">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>สถานะโครงการบริหารจัดการ (CC PM Projects)</span>
                                </div>
                                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                                  กำไรรับรู้จริง (ส่งมอบเสร็จ) <strong className="font-mono text-emerald-700 dark:text-emerald-400">฿{actualAchieved.toLocaleString()}</strong>
                                  {" "}• อยู่ระหว่างดำเนินงาน (Pipeline) <strong className="font-mono text-indigo-700 dark:text-indigo-300">฿{((realtimeMetrics.pipelineProfitGov || 0) + (realtimeMetrics.pipelineProfitPrivate || 0)).toLocaleString()}</strong>
                                  {" "}({realtimeMetrics.pipelinePmCount || 0} โครงการ)
                                </div>
                              </div>
                              <div className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700/60 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 shrink-0 self-start sm:self-auto">
                                รวมมูลค่าโครงการ ฿{(actualAchieved + (realtimeMetrics.pipelineProfitGov || 0) + (realtimeMetrics.pipelineProfitPrivate || 0)).toLocaleString()}
                              </div>
                            </div>
                          )}

                          {/* Nested R-Metrics Breakdown */}
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                            <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
                              ตัวชี้วัดย่อย (R-Metrics):
                            </div>
                            <div className="space-y-2">
                              {rResults.map((r) => {
                                // Condense display name if it matches old verbose pattern
                                const displayName = r.name
                                  .replace("กำไรที่เกิดจากการให้บริการภาครัฐ", "กำไรบริการภาครัฐ")
                                  .replace("กำไรที่เกิดจากการให้บริการภาคเอกชน", "กำไรบริการภาคเอกชน")
                                  .replace("จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร", "ผลงานบริการภายในองค์กร")
                                  .replace("จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP", "ผลงานบริการภายนอก (มช. & RSP)");

                                return (
                                  <div 
                                    key={r.code}
                                    className="p-3 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                                  >
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center gap-2.5">
                                        <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 font-mono font-black text-xs text-blue-800 dark:text-blue-300 shrink-0">
                                          {r.code}
                                        </span>
                                        <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs sm:text-sm leading-snug whitespace-normal" title={r.name}>
                                          {displayName}
                                        </span>
                                      </div>
                                      {r.breakdownDetail && (
                                        <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-medium mt-1 pl-8">
                                          {r.breakdownDetail}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-700/60">
                                      <div className="text-left sm:text-right font-mono">
                                        <span className="text-[9.5px] text-slate-400 dark:text-zinc-400 block font-semibold leading-none mb-1">
                                          ผลงานจริง / เป้าหมาย
                                        </span>
                                        <div className="text-xs sm:text-sm font-black flex items-center justify-start sm:justify-end gap-1.5">
                                          <span className="font-black text-slate-900 dark:text-zinc-100">
                                            {r.isCurrency ? `฿${r.actual.toLocaleString()}` : r.isPercentage ? `${r.actual}%` : r.actual.toLocaleString()}
                                          </span>
                                          <span className="text-slate-300 dark:text-zinc-600 font-light">/</span>
                                          <span className="font-black text-emerald-700 dark:text-emerald-400">
                                            {r.isCurrency ? `฿${r.activeTarget.toLocaleString()}` : r.isPercentage ? `${r.activeTarget}%` : `${r.activeTarget.toLocaleString()} ${r.unit}`}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs font-mono shrink-0 min-w-[50px] text-center ${
                                        r.status === 'on_track' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                      }`}>
                                        {r.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: KPI & TIP METRICS */}
              {(goalTypeFilter === "all" || goalTypeFilter === "TIP") && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      ตัวชี้วัดเชิงยุทธศาสตร์และนวัตกรรม (KPI & TIP Metrics)
                    </h4>
                    <span className="text-xs text-slate-500">
                      คำนวณ TIP1, TIP2, TIP9 (Multiplier ×5) และ TIP10 (เฉลี่ยความพึงพอใจ)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {realtimeMetrics.tips.map((tipResult) => {
                      const { tip, actual, target, activeTarget, percentage, status } = tipResult;
                      return (
                        <div 
                          key={tip.code}
                          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-mono font-black text-xs">
                                {tip.code}
                              </span>
                              
                            </div>

                            <h5 className="text-sm font-bold text-slate-800 mt-2">
                              {tip.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2" title={tip.description}>
                              {tip.description}
                            </p>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <div className="flex items-baseline justify-between">
                              <span className="text-lg font-mono font-black text-slate-900">
                                {tip.isCurrency ? `฿${actual.toLocaleString()}` : tip.isPercentage ? `${actual}%` : actual.toLocaleString()}
                              </span>
                              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                                percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {percentage}%
                              </span>
                            </div>

                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>เป้าหมายทีม:</span>
                              <span className="font-mono font-semibold text-slate-600">
                                {tip.isCurrency ? `฿${activeTarget.toLocaleString()}` : tip.isPercentage ? `${activeTarget}%` : activeTarget.toLocaleString()}
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 1. มุมมองยูนิตย่อย (SUB-UNIT GOALS & OKR OVERVIEW)        */}
              {/* ========================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                      <Layers size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      ผลลัพธ์ตัวชี้วัดแยกตามยูนิตย่อย (unit Goals & Strategic Output)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {unitFilter === "All" ? "แสดงครบทั้ง 4 ยูนิต" : `ยูนิต ${unitFilter}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitGoalStats.map((u) => {
                    const uStyle = UNIT_LABELS[u.unit] || UNIT_LABELS.other;
                    return (
                      <div key={u.unit} className="bg-surface border border-surface-border rounded-2xl p-5 shadow-2xs space-y-3.5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${uStyle.bg} ${uStyle.color} ${uStyle.border} border`}>
                              {u.unitLabel} Unit
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              (ผู้ดูแล: <strong className="text-slate-800">{u.leadName}</strong> • {u.memberCount} คน)
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            u.evaluatedCount > 0
                              ? "bg-amber-50 border-amber-200 text-amber-900"
                              : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"
                          }`}>
                            <Star size={12} className={u.evaluatedCount > 0 ? "fill-amber-400 text-amber-500" : "text-slate-400"} />
                            <span>{u.avgSatisfaction}%</span>
                            <span className="text-[10px] font-normal opacity-80">({u.evaluatedCount} รีวิว)</span>
                          </div>
                        </div>

                        {/* 4 Key Goal Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between items-center min-h-[72px]">
                            <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">R1 บริการภายใน</div>
                            <div className="text-sm sm:text-base font-black text-blue-700 font-mono my-0.5">{u.r1Tasks} งาน</div>
                            <div className="text-[9.5px] text-slate-400 font-mono whitespace-nowrap">ตามพันธกิจ</div>
                          </div>

                          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between items-center min-h-[72px]">
                            <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">R3 บริการภายนอก/RSP</div>
                            <div className="text-sm sm:text-base font-black text-indigo-700 font-mono my-0.5">{u.r3Tasks} งาน</div>
                            <div className="text-[9.5px] text-slate-400 font-mono whitespace-nowrap">เครือข่าย/มช.</div>
                          </div>

                          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between items-center min-h-[72px]">
                            <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">กำไร PM รวม (R7+8)</div>
                            <div className="text-sm sm:text-base font-black text-emerald-700 font-mono leading-none my-1">
                              ฿{u.totalPmProfit.toLocaleString()}
                            </div>
                            <div className="text-[9.5px] text-slate-500 font-mono flex items-center justify-center gap-1.5 flex-wrap leading-none">
                              {u.totalPmProfit > 0 ? (
                                <>
                                  <span>รัฐ ฿{u.pmGovProfit.toLocaleString()}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>เอกชน ฿{u.pmPrivProfit.toLocaleString()}</span>
                                </>
                              ) : (u.pmPipelineGov + u.pmPipelinePriv) > 0 ? (
                                <span className="text-indigo-600 font-medium">Pipeline ฿{(u.pmPipelineGov + u.pmPipelinePriv).toLocaleString()}</span>
                              ) : (
                                <span>ยังไม่มีกำไร</span>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between items-center min-h-[72px]">
                            <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">งานเสร็จทั้งหมด</div>
                            <div className="text-sm sm:text-base font-black text-slate-900 font-mono my-0.5">{u.completedCount} งาน</div>
                            <div className="text-[9.5px] text-slate-400 font-mono whitespace-nowrap">ส่งมอบสำเร็จ</div>
                          </div>
                        </div>

                        {/* Member Pills */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>{u.isInternal ? "สมาชิกทุกคนใน CC TEAM:" : "สมาชิกใน Unit:"}</span>
                            {u.unassignedCount > 0 && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full normal-case">
                                ยังไม่มอบหมาย {u.unassignedCount} งาน
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {u.members.map((m) => (
                              <button
                                key={m.assignee_id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setSelectedMemberScope(u.unit.toLowerCase());
                                }}
                                className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface border border-surface-border hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>{m.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  ({m.completedTasks} งาน)
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================= */}
              {/* 2. มุมมองรายบุคคล (INDIVIDUAL MEMBER GOALS & OKRS)        */}
              {/* ========================================================= */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <Target size={13} />
                    </span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                      ผลงานตามตัวชี้วัดรายบุคคล (Individual Member Goals & Outputs)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    ({memberGoalStats.length} คน)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {memberGoalStats.map((member, index) => {
                    const isInternalView = unitFilter.toLowerCase() === "internal";
                    const uStyle = isInternalView
                      ? UNIT_LABELS.internal
                      : (UNIT_LABELS[member.unit?.toLowerCase()] || UNIT_LABELS.other);
                    const isTopThree = index < 3 && member.totalGoalTasks > 0;

                    return (
                      <div
                        key={member.assignee_id}
                        onClick={() => {
                          setSelectedMember(member);
                          setSelectedMemberScope(unitFilter.toLowerCase());
                        }}
                        className="bg-surface border border-surface-border hover:border-blue-300 dark:hover:border-blue-500/60 rounded-2xl p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                isTopThree
                                  ? index === 0
                                    ? "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs"
                                    : index === 1
                                    ? "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {isTopThree ? (index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉") : `#${index + 1}`}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                  {member.name}
                                </h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${uStyle.bg} ${uStyle.color} ${uStyle.border} border mt-0.5`}>
                                  {isInternalView ? "Internal Task" : uStyle.label}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                งานตอบโจทย์เป้าหมาย
                              </div>
                              <div className="text-base font-black font-mono text-blue-700 dark:text-blue-400">
                                {member.totalGoalTasks} งาน
                              </div>
                            </div>
                          </div>

                          {/* 4 Mini Grid for KR / Goals */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-muted/20 rounded-xl border border-surface-border/50 text-center mb-3">
                            <div className="p-1">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">R1 (ภายใน)</div>
                              <div className="text-xs font-bold font-mono text-blue-900 dark:text-blue-300 mt-0.5">
                                {member.r1Count} งาน
                              </div>
                            </div>
                            <div className="p-1">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">R3 (ภายนอก)</div>
                              <div className="text-xs font-bold font-mono text-indigo-900 dark:text-indigo-300 mt-0.5">
                                {member.r3Count} งาน
                              </div>
                            </div>
                            <div className="p-1">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">กำไร PM (R7/8)</div>
                              <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                                ฿{member.pmProfitShare.toLocaleString()}
                              </div>
                              {member.pmProfitShare === 0 && (member.pmPipelineShare || 0) > 0 && (
                                <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono truncate">
                                  กำลังทำ ฿{member.pmPipelineShare.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="p-1">
                              <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">ความพึงพอใจ</div>
                              <div className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                                {member.avgSat}%
                              </div>
                              <div className="text-[9px] font-mono opacity-80 text-slate-400 dark:text-zinc-500">
                                ({member.evaluatedSatCount || 0} รีวิว)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 font-semibold">
                          <span>ดูรายละเอียดงาน ({member.completedTasks} งานเสร็จ)</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Member Tasks Detailed Modal */}
      {selectedMember && isMounted && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-800 truncate">
                  {selectedMember.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="capitalize font-semibold text-slate-700">
                    {selectedMemberScope !== "all" 
                      ? selectedMemberScope === "internal" ? "Internal Task (งานภายใน)" : `${selectedMemberScope} Unit`
                      : `${selectedMember.unit} Unit`}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold font-mono">
                    รวม Save Cost{selectedMemberScope !== "all" ? ` (${selectedMemberScope.toUpperCase()})` : ""}: ฿{selectedMember.totalSaveCost.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4 bg-emerald-50/50 border-b border-emerald-100/60 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">งานหลัก (Owner)</div>
                <div className="text-xs font-bold text-slate-800">{selectedMember.ownerTaskCount} งาน</div>
                <div className="text-xs font-mono font-bold text-emerald-700">฿{selectedMember.ownerSaveCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">งานช่วย (Assistant)</div>
                <div className="text-xs font-bold text-amber-700">{selectedMember.assistantTaskCount} งาน</div>
                <div className="text-xs font-mono font-bold text-emerald-700">฿{selectedMember.assistantSaveCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">รวมงานทั้งหมด</div>
                <div className="text-xs font-bold text-slate-900">{selectedMember.totalTasksInvolved} งาน</div>
                <div className="text-xs font-mono font-bold text-emerald-700">฿{selectedMember.totalSaveCost.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1">
                รายการงานที่เกี่ยวข้อง{selectedMemberScope !== "all" ? ` ใน ${selectedMemberScope === 'internal' ? 'Internal Task (งานภายใน)' : selectedMemberScope.toUpperCase() + ' UNIT'}` : ""} ({selectedMemberTasks.length} งาน):
              </div>
              {selectedMemberTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {selectedMemberScope !== "all"
                    ? `ยังไม่มีประวัติการรับผิดชอบงานใน ${selectedMemberScope === 'internal' ? 'Internal Task (งานภายใน)' : selectedMemberScope.toUpperCase() + ' Unit'}`
                    : "ยังไม่มีประวัติการรับผิดชอบงาน"}
                </div>
              ) : (
                selectedMemberTasks.map(({ brief, role, percentage, shareBaht, totalTaskCost, durationDays }) => (
                  <div key={brief.id} className="pt-2.5 pb-1 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          role === "owner"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}>
                          {role === "owner" ? `เจ้าของงาน (${percentage}%)` : `ผู้ช่วย (${percentage}%)`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Unit: {brief.unit}
                        </span>
                        <span className={`text-[10px] font-semibold ${
                          brief.status === "completed" ? "text-emerald-600" : brief.status === "in_progress" ? "text-blue-600" : "text-amber-600"
                        }`}>
                          • {brief.status}
                        </span>
                        {durationDays !== null && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                            <Clock size={10} /> ใช้เวลา {durationDays} วัน
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 truncate" title={brief.project_name}>
                        {brief.project_name}
                      </h5>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        มูลค่างานรวม: ฿{totalTaskCost.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 font-medium">Save Cost ที่ได้</div>
                      <div className="text-sm font-mono font-bold text-emerald-700">
                        ฿{shareBaht.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ({percentage}%)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Task Brief Details Modal (เปิดดู/แก้ไขรายละเอียดโครงการและตัวเลขการเงิน) */}
      {selectedBriefForModal && (
        <BriefDetailsModal
          brief={selectedBriefForModal}
          assignees={assignees}
          taskCode={selectedBriefForModal.details?.project_code || `CC-${selectedBriefForModal.id.slice(0, 4).toUpperCase()}`}
          onUpdateField={handleUpdateBriefField}
          onClose={() => setSelectedBriefForModal(null)}
        />
      )}

      {/* Quarterly Reach & Engagement Input Modal (บันทึก R5 & R6 รายไตรมาส แบ่ง Content 50% และ PR 50%) */}
      <QuarterlyReachEngagementModal
        isOpen={showReachEngageModal}
        onClose={() => setShowReachEngageModal(false)}
        settings={okrSettings}
        onSaveSettings={() => setOkrSettingsRevision((prev) => prev + 1)}
      />

      {/* ========================================================================= */}
      {/* MODAL: EXECUTIVE MONTHLY EMAIL & LINE DISPATCH (ส่งรายงานประจำเดือน) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: EXECUTIVE MONTHLY EMAIL & LINE DISPATCH (ส่งรายงานประจำเดือน) */}
      {/* ========================================================================= */}
      {showEmailDispatchModal && isMounted && createPortal(
        <div className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[100000] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white w-full max-w-3xl h-[92vh] max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
            
            {/* Sleek Gmail-style Title Bar */}
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white shrink-0">
                  CC-MONTHLY
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-white shrink-0 bg-indigo-600">
                  Executive
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Monthly Dispatch</span>
                </span>
                <span className="text-xs font-semibold text-zinc-300 truncate">
                  ส่งอีเมลรายงานผลการดำเนินงานประจำเดือน • Executive Monthly Dispatch
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customEmailBody);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                  title="คัดลอกเนื้อหาทั้งหมด"
                >
                  {copiedEmail ? (
                    <>
                      <Check size={11} className="text-emerald-400 stroke-[2.5]" />
                      <span className="text-emerald-400 font-bold">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} className="text-zinc-400" />
                      <span>คัดลอก</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailDispatchModal(false)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Form Body - Clean Gmail Compose Window Style */}
            <div className="flex-1 flex flex-col overflow-hidden text-xs bg-white">
              
              {/* Gmail Metadata Section (Ultra-Minimal, Clean Gmail Compose Headers) */}
              <div className="px-4 py-1 border-b border-zinc-200 bg-white shrink-0 divide-y divide-zinc-100 text-[11px]">
                
                {/* Row 1: จาก (From) */}
                <div className="flex items-center gap-2 py-1">
                  <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                    <User size={11} className="text-indigo-600" />
                    <span>จาก:</span>
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                    <span className="font-bold text-zinc-900">
                      {Array.from(memberProfileMap.values()).find(p => p.role === "admin")?.fullName || "นายอัจชนะพงษ์ อัจชนะวราทา"} (จ๊อบ AA)
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                      &lt;adchanapong@step.cmu.ac.th&gt;
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 ml-auto">
                      ผู้จัดทำรายงาน / Team Leader
                    </span>
                  </div>
                </div>

                {/* Row 2: ถึง (To) with editable email field */}
                <div className="flex items-center gap-2 py-1">
                  <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                    <Mail size={11} className="text-zinc-400" />
                    <span>ถึง:</span>
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                      type="text"
                      value={execToEmails}
                      onChange={(e) => setExecToEmails(e.target.value)}
                      placeholder="pitiwat@step.cmu.ac.th, suriyah@step.cmu.ac.th"
                      className="flex-1 bg-transparent hover:bg-zinc-50 focus:bg-white border-0 px-1.5 text-xs font-semibold text-zinc-900 focus:outline-none h-6 placeholder:text-zinc-400 truncate"
                      title="ระบุอีเมลผู้บริหาร คั่นด้วยเครื่องหมายจุลภาค (,)"
                    />
                  </div>
                </div>

                {/* Row 3: สำเนา (Cc) with editable email field & reset button */}
                <div className="flex items-center gap-2 py-1">
                  <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                    <Users size={11} className="text-zinc-400" />
                    <span>สำเนา:</span>
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                      type="text"
                      value={execCcEmails}
                      onChange={(e) => setExecCcEmails(e.target.value)}
                      placeholder="ระบุอีเมลผู้รับสำเนา (CC) เช่น staff1@step.cmu.ac.th, staff2@step.cmu.ac.th..."
                      className="flex-1 bg-transparent hover:bg-zinc-50 focus:bg-white border-0 px-1.5 text-xs font-medium text-zinc-900 focus:outline-none h-6 placeholder:text-zinc-400 truncate"
                      title="แก้ไขหรือเพิ่ม/ลด อีเมลผู้รับสำเนาได้ตามต้องการ"
                    />
                    <button
                      type="button"
                      onClick={() => setExecCcEmails(allStaffMembers.map(s => s.email).filter(Boolean).join(", "))}
                      className="shrink-0 px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="รีเซ็ตเป็นอีเมลสมาชิก CC ทุกคน"
                    >
                      <RotateCcw size={10} className="text-zinc-500" />
                      <span>รีเซ็ตสมาชิก ({allStaffMembers.length})</span>
                    </button>
                  </div>
                </div>

                {/* Row 4: หัวข้อ (Subject) */}
                <div className="flex items-center gap-2 py-1">
                  <span className="w-14 shrink-0 text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                    <FileText size={11} className="text-zinc-400" />
                    <span>หัวข้อ:</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={customEmailSubject}
                      onChange={(e) => setCustomEmailSubject(e.target.value)}
                      className="w-full bg-transparent border-0 px-1.5 text-xs font-semibold text-zinc-800 focus:outline-none h-6 select-all truncate"
                      placeholder="ระบุหัวข้ออีเมล..."
                    />
                  </div>
                </div>

              </div>

              {/* Textarea for Email Body (Takes all remaining vertical space >60%) */}
              <div className="flex-1 flex flex-col p-3 overflow-hidden bg-white">
                <textarea
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="w-full flex-1 p-3 text-xs font-mono sm:font-sans leading-relaxed text-zinc-800 focus:outline-none resize-none bg-white rounded-xl border border-transparent focus:border-zinc-200 hover:border-zinc-100 custom-scrollbar select-text"
                  placeholder="เขียนเนื้อหารายงานในอีเมล..."
                  spellCheck={false}
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmailDispatchModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmDispatchEmailAndLine}
                disabled={isDispatchingExecEmail}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDispatchingExecEmail ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังส่งอีเมล...</span>
                  </>
                ) : (
                  <>
                    <Mail size={14} className="text-white" />
                    <span>ยืนยันส่งอีเมลรายงานประจำเดือน</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Success Toast for Email Dispatch */}
      {dispatchSuccessToast && isMounted && createPortal(
        <div className="fixed bottom-5 right-5 z-[100001] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 max-w-md animate-in slide-in-from-bottom-5 duration-200 no-print">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-white">ส่งอีเมลรายงานประจำเดือนสำเร็จ!</h4>
            <p className="text-[11px] text-slate-300">{dispatchSuccessToast.message}</p>
          </div>
          <button
            onClick={() => setDispatchSuccessToast(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}
