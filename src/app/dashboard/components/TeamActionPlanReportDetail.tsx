"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CalendarDays,
  ExternalLink,
  Plus,
  Download,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Clock,
  TrendingUp,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Sparkles,
  Eye
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ModernDatePicker from "@/components/ModernDatePicker";
import ExportDataDropdown from "./ExportDataDropdown";
import { exportTeamActionPlanReport } from "@/utils/universalExport";
import { getCloudJson, setCloudJson, CLOUD_KEYS } from "@/utils/cloudSyncService";
import { isCcPmProject } from "@/utils/stats";

export interface ActionPlanItem {
  id: string;
  code: string;
  title: string;
  unit: "งานออกแบบ" | "สื่อสารองค์กร" | "ผลิตสื่อสร้างสรรค์" | "บริหารทีม";
  assignee: string;
  assigneeCode: string;
  quarter?: string;
  startDate: string;
  endDate: string;
  kpi: string;
  budget: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  progress: number;
  isCcLiveProject?: boolean;
  briefId?: string;
  revenue?: number;
  cost?: number;
  profit?: number;
}

export interface InternalPmProject {
  id: string;
  code: string;
  title: string;
  unit: "งานออกแบบ" | "สื่อสารองค์กร" | "ผลิตสื่อสร้างสรรค์" | "บริหารทีม";
  pmName: string;
  pmCode: string;
  budget: string;
  kpi: string;
  deadline?: string | null;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  progress: number;
}

export const DEFAULT_INTERNAL_PM_PROJECTS: InternalPmProject[] = [];

export const DEFAULT_ACTION_PLANS: ActionPlanItem[] = [];

export function getFiscalYearConfig(thaiFiscalYear: number) {
  const christianEndYear = thaiFiscalYear - 543;
  const christianStartYear = christianEndYear - 1;
  const prevThaiYear = thaiFiscalYear - 1;

  const fiscalStart = new Date(`${christianStartYear}-10-01T00:00:00`).getTime();
  const fiscalEnd = new Date(`${christianEndYear}-09-30T23:59:59`).getTime();
  const fiscalTotalMs = fiscalEnd - fiscalStart;

  const months = [
    { key: "m10", label: "ต.ค.", quarter: "Q1", year: `${prevThaiYear}` },
    { key: "m11", label: "พ.ย.", quarter: "Q1", year: `${prevThaiYear}` },
    { key: "m12", label: "ธ.ค.", quarter: "Q1", year: `${prevThaiYear}` },
    { key: "m01", label: "ม.ค.", quarter: "Q2", year: `${thaiFiscalYear}` },
    { key: "m02", label: "ก.พ.", quarter: "Q2", year: `${thaiFiscalYear}` },
    { key: "m03", label: "มี.ค.", quarter: "Q2", year: `${thaiFiscalYear}` },
    { key: "m04", label: "เม.ย.", quarter: "Q3", year: `${thaiFiscalYear}` },
    { key: "m05", label: "พ.ค.", quarter: "Q3", year: `${thaiFiscalYear}` },
    { key: "m06", label: "มิ.ย.", quarter: "Q3", year: `${thaiFiscalYear}` },
    { key: "m07", label: "ก.ค.", quarter: "Q4", year: `${thaiFiscalYear}` },
    { key: "m08", label: "ส.ค.", quarter: "Q4", year: `${thaiFiscalYear}` },
    { key: "m09", label: "ก.ย.", quarter: "Q4", year: `${thaiFiscalYear}` }
  ];

  return {
    thaiFiscalYear,
    christianStartYear,
    christianEndYear,
    prevThaiYear,
    fiscalStart,
    fiscalEnd,
    fiscalTotalMs,
    months,
    label: `แผนดำเนินงานประจำปีงบประมาณ ${thaiFiscalYear} (ตุลาคม ${prevThaiYear} – กันยายน ${thaiFiscalYear})`
  };
}

function getBarPosition(
  startStr: string,
  endStr: string,
  fiscalStart: number,
  fiscalEnd: number,
  fiscalTotalMs: number
) {
  let s = new Date(startStr).getTime();
  let e = new Date(endStr).getTime();
  if (isNaN(s)) s = fiscalStart;
  if (isNaN(e)) e = fiscalEnd;
  if (e < s) e = s + 30 * 86400000;

  const isSpillLeft = s < fiscalStart;
  const isSpillRight = e > fiscalEnd;
  const isEntirelyBefore = e < fiscalStart;
  const isEntirelyAfter = s > fiscalEnd;

  const clampS = Math.max(fiscalStart, Math.min(fiscalEnd, s));
  const clampE = Math.max(fiscalStart, Math.min(fiscalEnd, e));

  const left = ((clampS - fiscalStart) / fiscalTotalMs) * 100;
  const width = Math.max(5, ((clampE - clampS) / fiscalTotalMs) * 100);

  return {
    left: `${Math.min(95, Math.max(0, left))}%`,
    width: `${Math.min(100 - Math.min(95, Math.max(0, left)), width)}%`,
    isSpillLeft,
    isSpillRight,
    isEntirelyBefore,
    isEntirelyAfter
  };
}

const formatThaiDateShort = (dStr: string) => {
  if (!dStr) return "";
  const parts = dStr.split("-");
  if (parts.length !== 3) return dStr;
  const monthNames = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const m = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const yr = (parseInt(parts[0], 10) + 543) % 100;
  return `${day} ${monthNames[m] || parts[1]} ${yr}`;
};

const migratePlansToFY2570 = (items: ActionPlanItem[]): ActionPlanItem[] => {
  return items.map(item => {
    let { startDate, endDate } = item;
    if (startDate && startDate.startsWith("2025-")) {
      startDate = startDate.replace(/^2025-/, "2026-");
    }
    if (endDate) {
      if (endDate.startsWith("2025-")) {
        endDate = endDate.replace(/^2025-/, "2026-");
      } else if (endDate.startsWith("2026-") && item.startDate?.startsWith("2025-")) {
        endDate = endDate.replace(/^2026-/, "2027-");
      }
    }
    return { ...item, startDate, endDate };
  });
};

export default function TeamActionPlanReportDetail() {
  const isCloudLoadedRef = useRef(false);
  const [currentUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cc_user_role") || "admin";
    }
    return "admin";
  });
  const isViewer = currentUserRole === "viewer";

  const [plans, setPlans] = useState<ActionPlanItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cc_team_action_plan_v2_fy70") || localStorage.getItem("cc_team_action_plan_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(p => !p.code?.startsWith("CC-ACT-") && !p.id?.startsWith("ap-"));
            return migratePlansToFY2570(clean);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_ACTION_PLANS;
  });

  // Save plans to Supabase Cloud + LocalStorage
  useEffect(() => {
    if (!isCloudLoadedRef.current) return;
    if (isViewer) return;
    if (plans && plans.length > 0) {
      setCloudJson(CLOUD_KEYS.TEAM_ACTION_PLAN, plans, "cc_team_action_plan_v2_fy70");
    }
  }, [plans, isViewer]);

  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [projectTypeFilter, setProjectTypeFilter] = useState<"ALL" | "CC_ONLY" | "ACTION_PLAN_ONLY">("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ActionPlanItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Dynamic Fiscal Year State (Default: 2570, starts from 2570)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2570);
  const fiscalConfig = useMemo(() => getFiscalYearConfig(selectedFiscalYear), [selectedFiscalYear]);

  // Import PM Project State
  const [showPmImportModal, setShowPmImportModal] = useState(false);
  const [availablePmProjects, setAvailablePmProjects] = useState<InternalPmProject[]>([]);
  const [selectedPmProjectId, setSelectedPmProjectId] = useState<string>("");
  const [pmStartDate, setPmStartDate] = useState(`${fiscalConfig.christianStartYear}-10-01`);
  const [pmEndDate, setPmEndDate] = useState(`${fiscalConfig.christianEndYear}-09-30`);

  // New Item State
  const [newCode, setNewCode] = useState(`CC-ACT-0${plans.length + 1}`);
  const [newTitle, setNewTitle] = useState("");
  const [newUnit, setNewUnit] = useState<any>("งานออกแบบ");
  const [newAssignee, setNewAssignee] = useState("จ๊อบ AA");
  const [newStartDate, setNewStartDate] = useState("2026-10-01");
  const [newEndDate, setNewEndDate] = useState("2026-12-31");
  const [newKpi, setNewKpi] = useState("");
  const [newBudget, setNewBudget] = useState("฿20,000");
  const [newStatus, setNewStatus] = useState<any>("in_progress");
  const [newProgress, setNewProgress] = useState(0);

  // Load from Supabase Cloud with fallback to LocalStorage
  useEffect(() => {
    async function loadCloudPlans() {
      try {
        const cloudData = await getCloudJson<ActionPlanItem[]>(
          CLOUD_KEYS.TEAM_ACTION_PLAN,
          "cc_team_action_plan_v2_fy70",
          []
        );
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          const cleanCloud = cloudData.filter(p => !p.code?.startsWith("CC-ACT-") && !p.id?.startsWith("ap-"));
          const migrated = migratePlansToFY2570(cleanCloud);
          setPlans(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(migrated);
            return prevStr === nextStr ? prev : migrated;
          });
        }
      } catch (e) {
        console.error("Error loading action plans from cloud:", e);
      } finally {
        isCloudLoadedRef.current = true;
      }
    }
    loadCloudPlans();
  }, []);

  // Fetch Internal & CC PM Projects from Supabase and AUTOMATICALLY LINK to Roadmap
  const syncLiveCcProjects = async () => {
    setIsSyncingLive(true);
    try {
      const supabase = createClient();
      const [briefsRes, assigneesRes] = await Promise.all([
        supabase
          .from("briefs")
          .select("id, project_name, unit, status, priority, deadline, created_at, assignee_id, coordinator_nickname, details")
          .neq("status", "purged")
          .order("created_at", { ascending: false }),
        supabase
          .from("assignees")
          .select("id, name, unit")
      ]);

      if (briefsRes.data && briefsRes.data.length > 0) {
        const assigneesMap: Record<string, { name: string; unit?: string }> = {};
        (assigneesRes.data || []).forEach(a => {
          assigneesMap[a.id] = { name: a.name, unit: a.unit };
        });

        // Filter valid PM & CC projects (Rule 1: filter purged/deleted/cancelled)
        const pmBriefs = briefsRes.data.filter(b => {
          if (b.details?.is_deleted || b.details?.is_permanently_deleted || b.status === "cancelled") return false;
          const isPm = isCcPmProject(b);
          const isInternal = b.unit === "internal";
          const hasProjectCode = Boolean(b.details?.project_code || b.details?.code);
          const hasRevenue = Number(b.details?.revenue) > 0 || Number(b.details?.budget) > 0;
          return isPm || (isInternal && (hasProjectCode || hasRevenue || isPm));
        });

        if (pmBriefs.length > 0) {
          const mappedPmProjects: InternalPmProject[] = [];
          const liveActionPlans: ActionPlanItem[] = [];

          pmBriefs.forEach((b, idx) => {
            const pCode = b.details?.project_code || b.details?.code || `CC-PM-${String(idx + 1).padStart(2, "0")}`;
            const aName = b.assignee_id ? (assigneesMap[b.assignee_id]?.name || "ทีม CC") : (b.coordinator_nickname || "ทีม CC");
            const shortName = aName.split(" ")[0] || aName;
            const rev = Number(b.details?.revenue) || Number(b.details?.budget) || Number(b.details?.project_value) || 0;
            const cost = Number(b.details?.cost) || 0;
            const profit = Number(b.details?.profit) || (rev > 0 ? rev - cost : 0);
            const budgetStr = rev > 0 ? `฿${rev.toLocaleString()}` : (b.details?.budget ? `฿${Number(b.details.budget).toLocaleString()}` : "฿50,000");

            let unitVal: "งานออกแบบ" | "สื่อสารองค์กร" | "ผลิตสื่อสร้างสรรค์" | "บริหารทีม" = "บริหารทีม";
            const catLower = (b.details?.category || b.project_name || "").toLowerCase();
            if (b.unit === "creative" || catLower.includes("ออกแบบ") || catLower.includes("design") || catLower.includes("ci") || catLower.includes("บรรจุภัณฑ์")) {
              unitVal = "งานออกแบบ";
            } else if (b.unit === "pr" || catLower.includes("สื่อสาร") || catLower.includes("ข่าว") || catLower.includes("pr") || catLower.includes("ภาพลักษณ์")) {
              unitVal = "สื่อสารองค์กร";
            } else if (catLower.includes("ผลิตสื่อ") || catLower.includes("วิดีโอ") || catLower.includes("video") || catLower.includes("talkspective") || catLower.includes("content")) {
              unitVal = "ผลิตสื่อสร้างสรรค์";
            }

            let startDate = b.details?.start_date || b.details?.project_start_date;
            if (!startDate && b.created_at) startDate = b.created_at.slice(0, 10);
            if (!startDate) startDate = "2026-10-01";

            let endDate = b.deadline ? b.deadline.slice(0, 10) : b.details?.end_date;
            if (!endDate) endDate = "2027-09-30";
            if (endDate < startDate) endDate = "2027-09-30";

            const isCompleted = b.status === "completed";
            const isDelayed = !isCompleted && Boolean(b.deadline) && new Date(b.deadline).getTime() < Date.now();
            const statusVal: "not_started" | "in_progress" | "completed" | "delayed" = isCompleted ? "completed" : isDelayed ? "delayed" : "in_progress";
            const progressVal = isCompleted ? 100 : (b.details?.progress !== undefined ? Number(b.details.progress) : 50);

            mappedPmProjects.push({
              id: b.id,
              code: pCode,
              title: b.project_name || `โครงการ PM ${pCode}`,
              unit: unitVal,
              pmName: aName,
              pmCode: shortName,
              budget: budgetStr,
              kpi: b.details?.kpi || b.details?.deliverables || "ส่งมอบผลผลิตโครงการและบริหารจัดการตามเป้าหมาย 100%",
              deadline: b.deadline,
              status: statusVal,
              progress: progressVal
            });

            liveActionPlans.push({
              id: `cc-pm-${b.id}`,
              code: pCode,
              title: b.project_name || `โครงการ PM ${pCode}`,
              unit: unitVal,
              assignee: aName,
              assigneeCode: shortName,
              startDate: startDate,
              endDate: endDate,
              kpi: b.details?.kpi || b.details?.deliverables || "ส่งมอบผลผลิตโครงการและบริหารจัดการตามเป้าหมาย 100%",
              budget: budgetStr,
              status: statusVal,
              progress: progressVal,
              isCcLiveProject: true,
              briefId: b.id,
              revenue: rev,
              cost: cost,
              profit: profit
            });
          });

          setAvailablePmProjects(mappedPmProjects);
          if (mappedPmProjects.length > 0) {
            setSelectedPmProjectId(mappedPmProjects[0].id);
            if (mappedPmProjects[0].deadline) setPmEndDate(mappedPmProjects[0].deadline);
          }

          // AUTOMATICALLY MERGE INTO PLANS:
          setPlans(prev => {
            const basePlans = (prev || []).filter(p => !p.code?.startsWith("CC-ACT-") && !p.id?.startsWith("ap-"));
            const updated = [...basePlans];

            liveActionPlans.forEach(liveItem => {
              const matchIdx = updated.findIndex(u => 
                u.id === liveItem.id ||
                u.code === liveItem.code ||
                (u.briefId && u.briefId === liveItem.briefId) ||
                (u.title && liveItem.title && u.title.trim().toLowerCase() === liveItem.title.trim().toLowerCase())
              );

              if (matchIdx >= 0) {
                // Update live values
                updated[matchIdx] = {
                  ...updated[matchIdx],
                  code: liveItem.code,
                  title: liveItem.title,
                  assignee: liveItem.assignee,
                  assigneeCode: liveItem.assigneeCode,
                  budget: liveItem.budget,
                  status: liveItem.status,
                  progress: liveItem.progress,
                  isCcLiveProject: true,
                  briefId: liveItem.briefId,
                  revenue: liveItem.revenue,
                  cost: liveItem.cost,
                  profit: liveItem.profit
                };
              } else {
                // Prepend live CC project
                updated.unshift(liveItem);
              }
            });

            const finalPlans = updated.filter(p => !p.code?.startsWith("CC-ACT-") && !p.id?.startsWith("ap-"));
            if (typeof window !== "undefined") {
              localStorage.setItem("cc_team_action_plan_v2_fy70", JSON.stringify(finalPlans));
              localStorage.setItem("cc_team_action_plan_v1", JSON.stringify(finalPlans));
            }
            return finalPlans;
          });
        }
      }
    } catch (err) {
      console.error("Error syncing live CC PM projects:", err);
    } finally {
      setIsSyncingLive(false);
    }
  };

  useEffect(() => {
    syncLiveCcProjects();
  }, []);

  const saveToStorage = (items: ActionPlanItem[]) => {
    setPlans(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_team_action_plan_v2_fy70", JSON.stringify(items));
      localStorage.setItem("cc_team_action_plan_v1", JSON.stringify(items));
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(item => {
      // Filter by Project Type (All vs CC Projects vs General Action Plans)
      if (projectTypeFilter === "CC_ONLY" && !item.isCcLiveProject) return false;
      if (projectTypeFilter === "ACTION_PLAN_ONLY" && item.isCcLiveProject) return false;

      // In Timeline View: check fiscal year overlap
      if (viewMode === "timeline") {
        let s = new Date(item.startDate).getTime();
        let e = new Date(item.endDate).getTime();
        if (isNaN(s)) s = fiscalConfig.fiscalStart;
        if (isNaN(e)) e = fiscalConfig.fiscalEnd;
        if (e < s) e = s + 30 * 86400000;

        // If completely before or after the selected fiscal year, hide from this fiscal year's Gantt bar
        if (e < fiscalConfig.fiscalStart || s > fiscalConfig.fiscalEnd) {
          return false;
        }
      }

      if (unitFilter !== "ALL" && item.unit !== unitFilter) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.assignee.toLowerCase().includes(q) ||
          item.assigneeCode.toLowerCase().includes(q) ||
          item.kpi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [plans, projectTypeFilter, viewMode, fiscalConfig, unitFilter, statusFilter, searchQuery]);

  // Handle Edit
  const handleStartEdit = (item: ActionPlanItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const updated = plans.map(p => (p.id === editForm.id ? editForm : p));
    saveToStorage(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการแผนดำเนินงานนี้?")) {
      const updated = plans.filter(p => p.id !== id);
      saveToStorage(updated);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("ต้องการรีเซ็ตแผนดำเนินงานกลับเป็นค่าเริ่มต้นพร้อมซิงค์โครงการ CC ใช่หรือไม่?")) {
      saveToStorage(DEFAULT_ACTION_PLANS);
      syncLiveCcProjects();
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("กรุณาระบุชื่อโครงการ / กิจกรรม");
      return;
    }

    const newItem: ActionPlanItem = {
      id: `ap-${Date.now()}`,
      code: newCode || `CC-ACT-${plans.length + 1}`,
      title: newTitle,
      unit: newUnit,
      assignee: newAssignee,
      assigneeCode: newAssignee,
      startDate: newStartDate,
      endDate: newEndDate,
      kpi: newKpi || "ตามแผนงานที่กำหนด",
      budget: newBudget || "-",
      status: newStatus,
      progress: Number(newProgress) || 0
    };

    const updated = [newItem, ...plans];
    saveToStorage(updated);
    setShowAddModal(false);
    setNewTitle("");
    setNewKpi("");
  };

  // Import from PM Project in Internal
  const handleImportPmProject = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = availablePmProjects.find(p => p.id === selectedPmProjectId);
    if (!proj) {
      alert("กรุณาเลือกโครงการ PM");
      return;
    }
    if (!pmStartDate || !pmEndDate) {
      alert("กรุณาระบุวันเริ่มต้นและวันที่สำเร็จของโครงการ");
      return;
    }

    const newItem: ActionPlanItem = {
      id: `ap-pm-${Date.now()}`,
      code: proj.code,
      title: proj.title,
      unit: proj.unit,
      assignee: proj.pmName,
      assigneeCode: proj.pmCode,
      startDate: pmStartDate,
      endDate: pmEndDate,
      kpi: proj.kpi,
      budget: proj.budget,
      status: proj.status,
      progress: proj.progress,
      isCcLiveProject: true,
      briefId: proj.id
    };

    const updated = [newItem, ...plans];
    saveToStorage(updated);
    setShowPmImportModal(false);
    alert(`✅ บรรจุโครงการ "${proj.title}" เข้าสู่แผนดำเนินงานรายปีเรียบร้อยแล้ว!`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"แผนดำเนินงานประจำปี ทีมสร้างสรรค์และการสื่อสาร CC (Action Plan 2026)"`);
    lines.push(`"อ้างอิงเอกสาร","Google Sheet แผนดำเนินงานทีม CC (https://docs.google.com/spreadsheets/d/19FDWHECXPlHreRmHqJZlzEFwPfv2kzLHhQoIiBECu1c/edit?gid=0)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");
    lines.push('"ลำดับ","รหัส","โครงการ / กิจกรรมหลัก","ยูนิตรับผิดชอบ","ผู้รับผิดชอบ","วันเริ่มต้น","วันสิ้นสุด","ตัวชี้วัดความสำเร็จ (KPI)","งบประมาณ","สถานะ","ความคืบหน้า (%)"');

    plans.forEach((p, idx) => {
      const statusStr = p.status === "completed" ? "เสร็จสิ้น" : p.status === "in_progress" ? "กำลังดำเนินการ" : p.status === "delayed" ? "ล่าช้า" : "ยังไม่เริ่ม";
      lines.push(`${idx + 1},"${p.code}","${p.title.replace(/"/g, '""')}","${p.unit}","${p.assigneeCode} (${p.assignee})","${p.startDate}","${p.endDate}","${p.kpi.replace(/"/g, '""')}","${p.budget}","${statusStr}",${p.progress}`);
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Team_Action_Plan_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter(p => p.status === "completed").length;
    const inProgress = plans.filter(p => p.status === "in_progress").length;
    const delayed = plans.filter(p => p.status === "delayed").length;
    const avgProgress = total > 0 ? Math.round(plans.reduce((acc, c) => acc + c.progress, 0) / total) : 0;
    const ccProjectsCount = plans.filter(p => p.isCcLiveProject).length;
    const totalRevenue = plans.reduce((acc, p) => acc + (p.revenue || 0), 0);
    const totalCost = plans.reduce((acc, p) => acc + (p.cost || 0), 0);
    const totalProfit = plans.reduce((acc, p) => acc + (p.profit || 0), 0);

    return { total, completed, inProgress, delayed, avgProgress, ccProjectsCount, totalRevenue, totalCost, totalProfit };
  }, [plans]);

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CalendarDays size={14} className="text-emerald-600" />
              <span>CC Annual Work Plan &amp; Milestone Tracking System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              แผนการดำเนินงานของทีม (Team Action Plan)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ติดตามไทม์ไลน์ ตัวชี้วัดความสำเร็จ (KPI) และความคืบหน้ารายโครงการของทั้ง 3 ยูนิต โดยสามารถแก้ไข เพิ่ม ลบ ข้อมูลได้ทุกรายการแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://docs.google.com/spreadsheets/d/19FDWHECXPlHreRmHqJZlzEFwPfv2kzLHhQoIiBECu1c/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all shadow-2xs"
              title="เปิด Google Sheet ต้นทาง"
            >
              <span>เปิด Google Sheet</span>
              <ExternalLink size={12} />
            </a>

            <ExportDataDropdown
              reportId="action-plan"
              reportTitle="แผนการดำเนินงานของทีม"
              buttonText="Export Data"
            />

            {/* If viewer, show read-only badge, otherwise show import and add buttons */}
            {isViewer ? (
              <div className="px-3.5 py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <Eye size={13} className="text-cyan-600" />
                <span>โหมดผู้เข้าชม (Read-Only)</span>
              </div>
            ) : (
              <>
                {/* Real-time Sync from CC Projects Button */}
                <button
                  onClick={syncLiveCcProjects}
                  disabled={isSyncingLive}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  title="ซิงค์ดึงโครงการล่าสุดของ CC จากฐานข้อมูล Supabase"
                >
                  <RefreshCw size={13} className={isSyncingLive ? "animate-spin text-emerald-600" : "text-emerald-600"} />
                  <span>{isSyncingLive ? "กำลังซิงค์โครงการ..." : "ซิงค์โครงการ CC"}</span>
                </button>

                {/* Button to import from Internal PM Project */}
                <button
                  onClick={() => setShowPmImportModal(true)}
                  className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="ดึงโครงการที่มี CC เป็น PM ใน Internal มาลงแผนงาน"
                >
                  <Briefcase size={14} className="text-amber-700" />
                  <span>+ เพิ่มจากโครงการ PM (Internal)</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>เพิ่มโครงการใหม่</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">โครงการทั้งหมด</span>
              {stats.ccProjectsCount > 0 && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-600" />
                  <span>โครงการ CC: {stats.ccProjectsCount}</span>
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-500">กิจกรรม</span>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">งบรวม: <b className="text-slate-800">฿{stats.totalRevenue.toLocaleString()}</b></span>
              <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-bold">กำไร: ฿{stats.totalProfit.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">สำเร็จแล้ว (Completed)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.completed}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                {Math.round((stats.completed / (stats.total || 1)) * 100)}%
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-700 mt-1">ส่งมอบตามเกณฑ์ KPI สมบูรณ์</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">กำลังดำเนินการ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.inProgress}</span>
              <span className="text-xs text-blue-600">โครงการต่อเนื่อง</span>
            </div>
            <p className="text-[10.5px] text-blue-700 mt-1">ติดตามสถานะอย่างสม่ำเสมอ</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">ความคืบหน้ารวมเฉลี่ย</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-600">{stats.avgProgress}%</span>
              <span className="text-xs text-purple-700 font-mono">Overall Progress</span>
            </div>
            <p className="text-[10.5px] text-purple-700 mt-1">เป้าหมายประจำปีงบประมาณ</p>
          </div>
        </div>

        {/* Financial Transparency Banner (ตามกฎเหล็ก Rule 3: AGENTS.md) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-emerald-50/70 to-blue-50/80 border border-amber-200/80 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ฿
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>สรุปสถานะการเงินโครงการ CC (Financial Transparency)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-300 font-mono text-amber-900 font-bold">
                  KR4 PROFIT
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                รายงานความโปร่งใสด้านงบประมาณ ต้นทุนดำเนินงาน และกำไรโครงการของทีม CC ทั้งหมด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-sans">งบประมาณรวม (Revenue)</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base tabular-nums">
                ฿{stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-sans">ต้นทุนรวม (Total Cost)</span>
              <span className="font-semibold text-rose-600 text-sm sm:text-base tabular-nums">
                ฿{stats.totalCost.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-sans">กำไรโครงการรวม (Profit)</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg text-sm sm:text-base tabular-nums border border-emerald-300/80">
                +฿{stats.totalProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "timeline" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp size={13} />
                <span>แผนภาพไทม์ไลน์รายปี</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers size={13} />
                <span>ตารางข้อมูล</span>
              </button>
            </div>

            {/* Filter by Project Source / Category */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              {[
                { key: "ALL", label: `ทั้งหมด (${plans.length})` },
                { key: "CC_ONLY", label: `💼 โครงการ CC (${stats.ccProjectsCount})` },
                { key: "ACTION_PLAN_ONLY", label: `แผนงานทั่วไป (${plans.length - stats.ccProjectsCount})` }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setProjectTypeFilter(t.key as any)}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    projectTypeFilter === t.key ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              {["ALL", "งานออกแบบ", "สื่อสารองค์กร", "ผลิตสื่อสร้างสรรค์", "บริหารทีม"].map(u => (
                <button
                  key={u}
                  onClick={() => setUnitFilter(u)}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    unitFilter === u ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {u === "ALL" ? "ทุกยูนิต" : u}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              {[
                { key: "ALL", label: "ทุกสถานะ" },
                { key: "in_progress", label: "กำลังทำ" },
                { key: "completed", label: "เสร็จสิ้น" },
                { key: "delayed", label: "ล่าช้า" }
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === s.key ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อโครงการ หรือผู้รับผิดชอบ..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
              />
            </div>

            <ExportDataDropdown
              reportId="action-plan"
              buttonText="Export แผนงาน"
              onExportCustom={(fmt: "pdf" | "csv") => exportTeamActionPlanReport(fmt)}
            />

            <button
              onClick={handleResetToDefault}
              title="รีเซ็ตตารางเป็นค่าเริ่มต้น"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ANNUAL ACTION PLAN TIMELINE GRAPHIC (แผนภาพเส้นกราฟิกไทม์ไลน์รายปี)    */}
      {/* ========================================================================= */}
      {viewMode === "timeline" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Timeline Header Info */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  แผนดำเนินงานและโรดแมปรายปี (Annual Action Plan Roadmap)
                </h3>
                <p className="text-xs text-slate-500">
                  แสดงกราฟิกเส้นไทม์ไลน์ตามวันเริ่มต้นและวันที่สำเร็จของแต่ละโครงการ ยืดหยุ่นรองรับทุกปีงบประมาณและงานข้ามปี
                </p>
              </div>
            </div>

            {/* Fiscal Year Selector & Status Legends */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Fiscal Year Dropdown */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <CalendarDays size={13} className="text-emerald-600" />
                  <span>ปีงบประมาณ:</span>
                </span>
                <select
                  value={selectedFiscalYear}
                  onChange={e => setSelectedFiscalYear(Number(e.target.value))}
                  className="text-xs font-black px-2 py-1 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {[2569, 2570, 2571, 2572, 2573, 2574, 2575, 2576].map(y => (
                    <option key={y} value={y}>
                      {y} (ต.ค. {y - 1} - ก.ย. {y})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Legends */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>เสร็จสิ้น</span>
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>กำลังทำ</span>
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>ล่าช้า</span>
                </span>
                <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-full border border-amber-200 text-[11px] font-bold">
                  <span>⇄</span>
                  <span>งานข้ามปี</span>
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Gantt Grid Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[1020px]">
              {/* Header Columns */}
              <div className="flex border-b border-slate-200 bg-slate-100/90 text-xs font-bold text-slate-700 select-none">
                <div className="w-[340px] shrink-0 p-3 border-r border-slate-200 flex items-center justify-between">
                  <span>โครงการ / แผนงานหลัก (Project &amp; Owner)</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                    ปี {selectedFiscalYear}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  {/* Annual Fiscal Year Bar */}
                  <div className="border-b border-slate-200 text-center py-1.5 text-[11px] uppercase tracking-wider bg-slate-200/60 font-black text-slate-800">
                    {fiscalConfig.label}
                  </div>
                  {/* Months Bar */}
                  <div className="grid grid-cols-12 text-center py-1 text-[10.5px] font-bold text-slate-600 bg-slate-100">
                    {fiscalConfig.months.map(m => (
                      <div key={m.key} className="border-r border-slate-200/80 last:border-r-0">
                        {m.label} <span className="text-[9px] text-slate-400 font-normal">({m.year.slice(2)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body Rows */}
              <div className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหา
                  </div>
                ) : (
                  filteredPlans.map(item => {
                    const barPos = getBarPosition(
                      item.startDate,
                      item.endDate,
                      fiscalConfig.fiscalStart,
                      fiscalConfig.fiscalEnd,
                      fiscalConfig.fiscalTotalMs
                    );
                    const isCompleted = item.status === "completed";
                    const isDelayed = item.status === "delayed";
                    const isInProgress = item.status === "in_progress";

                    const barGradient = isCompleted
                      ? "from-emerald-500 to-teal-500"
                      : isDelayed
                      ? "from-rose-500 to-red-600"
                      : isInProgress
                      ? "from-blue-500 to-indigo-600"
                      : "from-slate-400 to-slate-500";

                    return (
                      <div key={item.id} className="flex hover:bg-slate-50/80 transition-colors group">
                        {/* Project Info Column */}
                        <div className="w-[340px] shrink-0 p-3.5 border-r border-slate-200/80 flex flex-col justify-center gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.code}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.unit}
                            </span>
                            {item.isCcLiveProject && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-0.5" title="โครงการของ CC ที่ซิงค์จากระบบ">
                                <Sparkles size={9} className="text-amber-600" />
                                <span>โครงการ CC</span>
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-600">
                              {item.assigneeCode}
                            </span>

                            {/* Cross-Fiscal-Year Indicators */}
                            {barPos.isSpillLeft && !barPos.isSpillRight && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title={`งานเริ่มก่อนปีงบประมาณ (${item.startDate})`}>
                                ← เริ่มปีก่อน
                              </span>
                            )}
                            {barPos.isSpillRight && !barPos.isSpillLeft && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title={`งานต่อเนื่องไปปีงบถัดไป (${item.endDate})`}>
                                ข้ามปีงบ →
                              </span>
                            )}
                            {barPos.isSpillLeft && barPos.isSpillRight && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="โครงการระยะยาวต่อเนื่องข้ามปี">
                                ⇄ ข้ามปี
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors" title={item.title}>
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>{formatThaiDateShort(item.startDate)} - {formatThaiDateShort(item.endDate)}</span>
                          </div>

                          {/* Financial breakdown: งบประมาณ • ต้นทุน • กำไร CC */}
                          <div className="mt-1 pt-1.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px] font-mono bg-slate-50/90 px-2 py-1.5 rounded-xl border border-slate-200/60">
                            <div className="flex flex-col" title="งบประมาณโครงการ / รายรับ">
                              <span className="text-[9px] text-slate-400 font-sans">งบประมาณ</span>
                              <span className="font-bold text-slate-800 tabular-nums truncate">
                                ฿{(item.revenue !== undefined ? item.revenue : (parseFloat((item.budget || "").replace(/[^0-9.-]+/g, "")) || 0)).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col" title="ต้นทุนโครงการ">
                              <span className="text-[9px] text-slate-400 font-sans">ต้นทุน</span>
                              <span className="font-semibold text-rose-600 tabular-nums truncate">
                                ฿{(item.cost || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col" title="กำไรโครงการ CC">
                              <span className="text-[9px] text-slate-400 font-sans">กำไร CC</span>
                              <span className="font-bold text-emerald-700 tabular-nums truncate">
                                {(item.profit || 0) >= 0 ? `+฿${(item.profit || 0).toLocaleString()}` : `-฿${Math.abs(item.profit || 0).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Gantt Timeline Graphic Bar Column */}
                        <div className="flex-1 relative flex items-center p-2.5">
                          {/* 12-Month Background Grid Lines */}
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                            {fiscalConfig.months.map(m => (
                              <div key={m.key} className="border-r border-slate-100/90 h-full last:border-r-0" />
                            ))}
                          </div>

                          {/* Graphic Timeline Bar */}
                          <div
                            className={`relative h-8 shadow-xs transition-all flex items-center justify-between px-2.5 z-10 hover:scale-[1.01] hover:shadow-md cursor-pointer select-none overflow-hidden ${
                              barPos.isSpillLeft ? "rounded-l-none border-l-2 border-dashed border-amber-300" : "rounded-l-xl"
                            } ${
                              barPos.isSpillRight ? "rounded-r-none border-r-2 border-dashed border-amber-300" : "rounded-r-xl"
                            }`}
                            style={{
                              left: barPos.left,
                              width: barPos.width,
                            }}
                            title={`${item.title} (${formatThaiDateShort(item.startDate)} - ${formatThaiDateShort(item.endDate)})\nงบประมาณ: ฿${(item.revenue || 0).toLocaleString()} | ต้นทุน: ฿${(item.cost || 0).toLocaleString()} | กำไร: ฿${(item.profit || 0).toLocaleString()}\nความคืบหน้า: ${item.progress}%\nตัวชี้วัด: ${item.kpi}${barPos.isSpillLeft ? "\n(งานเริ่มก่อนปีงบประมาณนี้)" : ""}${barPos.isSpillRight ? "\n(ดำเนินงานต่อเนื่องไปปีงบประมาณถัดไป)" : ""}`}
                          >
                            {/* Inner Progress Track Overlay */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-white/20 pointer-events-none"
                              style={{ width: `${item.progress}%` }}
                            />

                            {/* Bar Gradient Classes */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${barGradient} -z-10`} />

                            <div className="flex items-center gap-1.5 text-white text-[11px] font-bold truncate z-10">
                              {barPos.isSpillLeft && (
                                <span className="text-[10px] text-amber-200 font-extrabold shrink-0" title="งานเริ่มก่อนปีงบประมาณนี้">
                                  ◀
                                </span>
                              )}
                              {isCompleted ? (
                                <CheckCircle2 size={13} className="shrink-0 text-white" />
                              ) : (
                                <Clock size={13} className="shrink-0 text-white" />
                              )}
                              <span className="truncate hidden sm:inline">{item.title}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-1.5 z-10">
                              <span className="text-[10px] font-mono font-black text-white bg-black/25 px-1.5 py-0.5 rounded-md">
                                {item.progress}%
                              </span>
                              {barPos.isSpillRight && (
                                <span className="text-[10px] text-amber-200 font-extrabold" title="ดำเนินงานต่อเนื่องข้ามปีงบประมาณถัดไป">
                                  ▶
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDITABLE TABLE VIEW (ตารางข้อมูลรายละเอียด)                              */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-24">รหัส</th>
                  <th className="py-3 px-3 min-w-[200px]">โครงการ / กิจกรรมหลัก</th>
                  <th className="py-3 px-3 w-28 whitespace-nowrap text-center">ยูนิต</th>
                  <th className="py-3 px-3 w-32 whitespace-nowrap text-center">ผู้รับผิดชอบ</th>
                  <th className="py-3 px-3 w-36 text-center whitespace-nowrap">ระยะเวลา</th>
                  <th className="py-3 px-3 min-w-[130px] text-center whitespace-nowrap">การเงิน (งบ • ทุน • กำไร)</th>
                  <th className="py-3 px-3 min-w-[160px]">ตัวชี้วัดความสำเร็จ (KPI)</th>
                  <th className="py-3 px-3 w-32 text-center whitespace-nowrap">สถานะ</th>
                  <th className="py-3 px-3 w-32 text-center whitespace-nowrap">ความคืบหน้า</th>
                  <th className="py-3 px-3 w-20 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map(item => {
                  const isEditing = editingId === item.id;

                  if (isEditing && editForm) {
                    return (
                      <tr key={item.id} className="bg-amber-50/50">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editForm.code}
                            onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                            className="w-full p-1 border border-amber-300 rounded text-xs font-mono font-bold bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full p-1 border border-amber-300 rounded text-xs font-medium bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editForm.unit}
                            onChange={e => setEditForm({ ...editForm, unit: e.target.value as any })}
                            className="w-full p-1 border border-amber-300 rounded text-xs bg-white"
                          >
                            <option value="งานออกแบบ">งานออกแบบ</option>
                            <option value="สื่อสารองค์กร">สื่อสารองค์กร</option>
                            <option value="ผลิตสื่อสร้างสรรค์">ผลิตสื่อสร้างสรรค์</option>
                            <option value="บริหารทีม">บริหารทีม</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editForm.assigneeCode}
                            onChange={e => setEditForm({ ...editForm, assigneeCode: e.target.value })}
                            className="w-full p-1 border border-amber-300 rounded text-xs bg-white text-center"
                          />
                        </td>
                        <td className="py-2 px-2 space-y-1">
                          <ModernDatePicker
                            value={editForm.startDate}
                            onChange={(val) => setEditForm({ ...editForm, startDate: val })}
                            placeholder="วันเริ่ม..."
                            className="w-full h-7 px-2 border border-amber-300 rounded text-[11px] font-mono bg-white"
                          />
                          <ModernDatePicker
                            value={editForm.endDate}
                            onChange={(val) => setEditForm({ ...editForm, endDate: val })}
                            placeholder="วันสิ้นสุด..."
                            className="w-full h-7 px-2 border border-amber-300 rounded text-[11px] font-mono bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editForm.budget}
                            onChange={e => setEditForm({ ...editForm, budget: e.target.value })}
                            className="w-full p-1 border border-amber-300 rounded text-xs bg-white text-center font-mono"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editForm.kpi}
                            onChange={e => setEditForm({ ...editForm, kpi: e.target.value })}
                            className="w-full p-1 border border-amber-300 rounded text-xs bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editForm.status}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                            className="w-full p-1 border border-amber-300 rounded text-xs bg-white"
                          >
                            <option value="not_started">ยังไม่เริ่ม</option>
                            <option value="in_progress">กำลังทำ</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="delayed">ล่าช้า</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editForm.progress}
                            onChange={e => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                            className="w-16 p-1 border border-amber-300 rounded text-xs text-center bg-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveEdit}
                              title="บันทึกการแก้ไข"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              title="ยกเลิก"
                              className="p-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {item.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {item.title}
                          </span>
                          {item.isCcLiveProject && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <Sparkles size={10} className="text-amber-600" />
                              <span>โครงการ CC</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-800 font-medium">
                        {item.assigneeCode}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatThaiDateShort(item.startDate)} - {formatThaiDateShort(item.endDate)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        <div className="flex flex-col items-center gap-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <span className="text-[9px] text-slate-400 font-sans">งบ:</span>
                            <span>฿{(item.revenue !== undefined ? item.revenue : (parseFloat((item.budget || "").replace(/[^0-9.-]+/g, "")) || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-rose-600 font-medium text-[10px]">
                            <span className="text-[9px] text-slate-400 font-sans">ทุน:</span>
                            <span>฿{(item.cost || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                            <span className="text-[9px] text-slate-400 font-sans">กำไร:</span>
                            <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                              {(item.profit || 0) >= 0 ? `+฿${(item.profit || 0).toLocaleString()}` : `-฿${Math.abs(item.profit || 0).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.kpi}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap w-32">
                        <span className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold border min-w-[76px] ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "in_progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.status === "delayed"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {item.status === "completed" ? "เสร็จสิ้น" : item.status === "in_progress" ? "กำลังทำ" : item.status === "delayed" ? "ล่าช้า" : "ยังไม่เริ่ม"}
                        </span>
                      </td>
                      <td className="py-3 px-3 w-32 whitespace-nowrap">
                        <div className="space-y-1 max-w-[100px] mx-auto">
                          <div className="flex items-center justify-center text-[10px] font-mono font-bold text-slate-600">
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                item.progress === 100 ? "bg-emerald-500" : "bg-blue-600"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isViewer ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              title="แก้ไขรายการนี้"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="ลบรายการ"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                เพิ่มโครงการ / แผนดำเนินงานใหม่
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Top Shortcut Banner for PM Project */}
            <div className="p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs text-amber-950 font-bold block">มีโครงการที่มี CC เป็น PM ใน Internal อยู่แล้ว?</span>
                  <span className="text-[10.5px] text-amber-700">ดึงข้อมูลโครงการและ PM อัตโนมัติ โดยระบุแค่วันเริ่มและสิ้นสุด</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowPmImportModal(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold shrink-0 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                ดึงโครงการ PM
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อโครงการ / กิจกรรมหลัก:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="เช่น พัฒนาระบบ Interactive Kiosk งานนิทรรศการ..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">รหัสกิจกรรม:</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ยูนิตรับผิดชอบ:</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="งานออกแบบ">ยูนิตงานออกแบบ</option>
                    <option value="สื่อสารองค์กร">ยูนิตสื่อสารองค์กร</option>
                    <option value="ผลิตสื่อสร้างสรรค์">ยูนิตผลิตสื่อสร้างสรรค์</option>
                    <option value="บริหารทีม">บริหารทีม CC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ผู้รับผิดชอบหลัก:</label>
                <select
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="จ๊อบ AA">จ๊อบ AA (หัวหน้าทีม)</option>
                  <option value="วา WK">วา WK (ผู้ช่วยหัวหน้าทีม)</option>
                  <option value="จอย RL">จอย RL (งานออกแบบ)</option>
                  <option value="พิม AC">พิม AC (งานออกแบบ)</option>
                  <option value="เยียร์ LLP">เยียร์ LLP (งานออกแบบ)</option>
                  <option value="นิน MTN">นิน MTN (งานออกแบบ)</option>
                  <option value="ก้อง IK">ก้อง IK (งานออกแบบ)</option>
                  <option value="ลูกอิน STK">ลูกอิน STK (สื่อสารองค์กร)</option>
                  <option value="โอ๊ต CNB">โอ๊ต CNB (สื่อสารองค์กร)</option>
                  <option value="เอ็นจอย SLR">เอ็นจอย SLR (ผลิตสื่อสร้างสรรค์)</option>
                  <option value="แก้ว KYK">แก้ว KYK (ผลิตสื่อสร้างสรรค์)</option>
                  <option value="ต้า TTY">ต้า TTY (ผลิตสื่อสร้างสรรค์)</option>
                </select>
              </div>

              {/* Timeline Dates for Graphic Roadmap */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <div className="space-y-1">
                  <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    วันเริ่มต้นโครงการ:
                  </label>
                  <ModernDatePicker
                    value={newStartDate}
                    onChange={(val) => setNewStartDate(val)}
                    placeholder="เลือกวันเริ่มต้น..."
                    required={true}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-amber-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    วันที่สำเร็จ / สิ้นสุด:
                  </label>
                  <ModernDatePicker
                    value={newEndDate}
                    onChange={(val) => setNewEndDate(val)}
                    placeholder="เลือกวันสิ้นสุด..."
                    required={true}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-amber-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-amber-700/80 italic">
                  * ข้อมูลวันเริ่ม-สิ้นสุด จะถูกนำไปวาดเส้นกราฟิกแผนดำเนินงานรายปี (Roadmap Timeline) โดยอัตโนมัติ
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ตัวชี้วัดความสำเร็จ (KPI / Deliverable):</label>
                <input
                  type="text"
                  value={newKpi}
                  onChange={e => setNewKpi(e.target.value)}
                  placeholder="เช่น ชิ้นงานผ่านการอนุมัติ 100% และส่งมอบตรงเวลา"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">งบประมาณ:</label>
                  <input
                    type="text"
                    value={newBudget}
                    onChange={e => setNewBudget(e.target.value)}
                    placeholder="เช่น ฿30,000"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ความคืบหน้าเริ่มต้น (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProgress}
                    onChange={e => setNewProgress(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500 text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  บันทึกโครงการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import from Internal PM Project */}
      {showPmImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    เพิ่มจากโครงการที่มี CC เป็น PM (Internal)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ดึงข้อมูลโครงการและ PM อัตโนมัติ โดยระบุเฉพาะวันเริ่มและวันสิ้นสุด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPmImportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportPmProject} className="space-y-4 text-xs">
              {/* Select PM Project */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>เลือกโครงการที่มี CC เป็น PM ในระบบ:</span>
                  <span className="text-[10px] text-amber-700 font-medium">พบ {availablePmProjects.length} โครงการ</span>
                </label>
                <select
                  value={selectedPmProjectId}
                  onChange={e => {
                    setSelectedPmProjectId(e.target.value);
                    const found = availablePmProjects.find(p => p.id === e.target.value);
                    if (found?.deadline) {
                      setPmEndDate(found.deadline);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500 text-xs"
                >
                  {availablePmProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title} — PM: {p.pmCode} ({p.budget})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected PM Project Preview Card */}
              {(() => {
                const currentPm = availablePmProjects.find(p => p.id === selectedPmProjectId);
                if (!currentPm) return null;
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                        {currentPm.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-amber-200">
                        ยูนิต: {currentPm.unit}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs leading-snug">
                      {currentPm.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60">
                      <div>
                        <span className="text-slate-500">ผู้จัดการโครงการ (PM): </span>
                        <strong className="text-slate-800">{currentPm.pmName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">งบประมาณ: </span>
                        <strong className="text-emerald-700 font-mono">{currentPm.budget}</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-amber-100">
                      <span className="font-bold text-slate-700">KPI: </span>
                      <span>{currentPm.kpi}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Requirement: กำหนดเฉพาะวันเริ่มและสิ้นสุด */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CalendarDays size={14} className="text-amber-600" />
                  <span>กำหนดเฉพาะวันเริ่มต้นและวันที่สำเร็จ (Timeline Dates):</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      วันเริ่มต้นโครงการ:
                    </label>
                    <ModernDatePicker
                      value={pmStartDate}
                      onChange={(val) => setPmStartDate(val)}
                      placeholder="เลือกวันเริ่มต้น..."
                      required={true}
                      className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      วันที่สำเร็จ / สิ้นสุด:
                    </label>
                    <ModernDatePicker
                      value={pmEndDate}
                      onChange={(val) => setPmEndDate(val)}
                      placeholder="เลือกวันสิ้นสุด..."
                      required={true}
                      className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  * กำหนดช่วงเวลาเพื่อวาดแท่งกราฟิกไทม์ไลน์ Action Plan รายปีให้อัตโนมัติ
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPmImportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Briefcase size={13} />
                  <span>บรรจุเข้าสู่แผนดำเนินงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
