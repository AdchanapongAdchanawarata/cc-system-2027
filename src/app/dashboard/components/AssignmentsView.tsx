"use client";

import { useState, useEffect, useCallback } from "react";
import CustomSelect from "./CustomSelect";
import { createClient } from "@/utils/supabase/client";
import { 
  UserCircle2, CalendarDays, Tags, KanbanSquare, Flame, 
  CheckCircle2, XCircle, Trash2, Copy, Clock, ClockAlert, History, 
  Users, Star, MessageSquare, Undo2, Redo2, RotateCcw, AlertCircle, Mail,
  LayoutList, ChevronDown, Check, Search, Eye, Bell, BellRing, BellOff
} from "lucide-react";
import BriefDetailsModal from "./BriefDetailsModal";
import TrashBinModal from "./TrashBinModal";
import InProgressEmailModal from "./InProgressEmailModal";
import CompletedEmailModal from "./CompletedEmailModal";
import { getStandardPriceForTask, shouldInternalTaskSkipEmail, getLeadTimeForTask } from "@/utils/pricing";
import { globalHistoryManager } from "@/utils/historyManager";
import { resolveTaskCode, generateNextTaskCode, getUnitPrefix } from "@/utils/taskCodeService";
import { logActivity, getCurrentActor } from "@/utils/auditLogger";
import { Assignee3DAvatarBadge } from "@/components/Assignee3DAvatarBadge";
import { updateGlobalBriefsStatsCache } from "@/utils/avatarMemberStats";
import { isOperationalAssignee } from "@/utils/memberProfile";
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  playAssignmentChime,
  triggerActiveAssignmentAlert,
} from "@/utils/browserNotification";

// Custom Clockwise Overdue Icon matching user's reference (circular arrow with clock hands)
export function OverdueClockIcon({ size = 20, className = "text-[#E03131]" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 7v5l3.5 2" />
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

// Clean, minimal Surveillance/Watch icon (crisp eye contour with filled pupil)
export function WatchEyeIcon({ size = 10, className = "text-black shrink-0" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Brief = {
  id: string;
  project_name: string;
  unit: string;
  status: string;
  created_at: string;
  in_progress_at?: string;
  completed_at?: string;
  requester_email: string;
  coordinator_nickname: string;
  assignee_id: string | null;
  priority: string;
  deadline: string | null;
  details: any;
  okr_links: string[];
};

type Assignee = {
  id: string;
  name: string;
  email?: string;
  unit?: string;
};

type OKR = {
  id: string;
  type: string;
  description: string;
};

const COLUMNS = [
  { 
    id: "unassigned", 
    label: "Unassigned (รอมอบหมาย)", 
    shortLabel: "UNASSIGNED", 
    headerBg: "bg-slate-100/90 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-600 text-slate-700 dark:text-zinc-200 border-t-slate-500",
    badgeBg: "bg-slate-200/90 dark:bg-zinc-700 text-slate-800 dark:text-zinc-100"
  },
  { 
    id: "pending", 
    label: "TO-DO LIST (รอทำ)", 
    shortLabel: "TO-DO LIST", 
    headerBg: "bg-[#fef3c7] dark:bg-amber-950/70 border-amber-300 dark:border-amber-600/70 text-[#78350f] dark:text-amber-200 border-t-amber-500",
    badgeBg: "bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100"
  },
  { 
    id: "in_progress", 
    label: "In Progress (กำลังทำ)", 
    shortLabel: "IN PROGRESS", 
    headerBg: "bg-[#dbeafe] dark:bg-blue-950/70 border-blue-300 dark:border-blue-600/70 text-[#1e40af] dark:text-blue-200 border-t-blue-500",
    badgeBg: "bg-blue-200/90 dark:bg-blue-900/80 text-blue-950 dark:text-blue-100"
  },
  { 
    id: "completed", 
    label: "Completed (เสร็จสิ้น)", 
    shortLabel: "COMPLETED", 
    headerBg: "bg-[#d1fae5] dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-600/70 text-[#065f46] dark:text-emerald-200 border-t-emerald-500",
    badgeBg: "bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100"
  },
  { 
    id: "cancelled", 
    label: "Cancelled (ยกเลิก)", 
    shortLabel: "CANCELLED", 
    headerBg: "bg-[#ffe4e6] dark:bg-rose-950/70 border-rose-300 dark:border-rose-600/70 text-[#9f1239] dark:text-rose-200 border-t-rose-500",
    badgeBg: "bg-rose-200/90 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100"
  }
];

const COLUMN_THEMES: Record<string, {
  label: string;
  activeBg: string;
  activeBorder: string;
  inactiveBg: string;
  textColor: string;
  inactiveBadge: string;
  activeBadge: string;
}> = {
  unassigned: {
    label: "Unassigned",
    activeBg: "bg-slate-700 text-white shadow-xs",
    activeBorder: "border-slate-700",
    inactiveBg: "bg-slate-100/90 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700",
    textColor: "text-slate-700 dark:text-zinc-200",
    inactiveBadge: "bg-slate-200 text-slate-800 dark:bg-zinc-700 dark:text-zinc-100",
    activeBadge: "bg-white/25 text-white",
  },
  pending: {
    label: "TO-DO LIST",
    activeBg: "bg-amber-500 text-white shadow-xs",
    activeBorder: "border-amber-500",
    inactiveBg: "bg-[#fef3c7]/80 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/70",
    textColor: "text-[#78350f] dark:text-amber-300",
    inactiveBadge: "bg-amber-200/90 text-amber-950 dark:bg-amber-900/80 dark:text-amber-100",
    activeBadge: "bg-white/25 text-white",
  },
  in_progress: {
    label: "Progress",
    activeBg: "bg-blue-600 text-white shadow-xs",
    activeBorder: "border-blue-600",
    inactiveBg: "bg-[#dbeafe]/80 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800/70",
    textColor: "text-[#1e40af] dark:text-blue-300",
    inactiveBadge: "bg-blue-200/90 text-blue-950 dark:bg-blue-900/80 dark:text-blue-100",
    activeBadge: "bg-white/25 text-white",
  },
  completed: {
    label: "Done",
    activeBg: "bg-emerald-600 text-white shadow-xs",
    activeBorder: "border-emerald-600",
    inactiveBg: "bg-[#d1fae5]/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/70",
    textColor: "text-[#065f46] dark:text-emerald-300",
    inactiveBadge: "bg-emerald-200/90 text-emerald-950 dark:bg-emerald-900/80 dark:text-emerald-100",
    activeBadge: "bg-white/25 text-white",
  },
  cancelled: {
    label: "Cancel",
    activeBg: "bg-rose-600 text-white shadow-xs",
    activeBorder: "border-rose-600",
    inactiveBg: "bg-[#ffe4e6]/80 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/70",
    textColor: "text-[#9f1239] dark:text-rose-300",
    inactiveBadge: "bg-rose-200/90 text-rose-950 dark:bg-rose-900/80 dark:text-rose-100",
    activeBadge: "bg-white/25 text-white",
  },
};

const getAssigneeColorClass = (unitStr: string, hasAssignee: boolean) => {
  if (!hasAssignee) return "text-slate-400 dark:text-slate-400 font-normal";
  switch (unitStr?.toLowerCase()) {
    case 'creative': return 'text-[#7c3aed] dark:text-[#c4b5fd] font-bold hover:text-[#6d28d9]';
    case 'content': return 'text-[#db2777] dark:text-[#f472b6] font-bold hover:text-[#be185d]';
    case 'pr': return 'text-[#1d4ed8] dark:text-[#93c5fd] font-bold hover:text-[#1e40af]';
    case 'internal': return 'text-slate-800 dark:text-slate-100 font-bold hover:text-slate-900';
    default: return 'text-[#047857] dark:text-[#6ee7b7] font-bold hover:text-[#065f46]';
  }
};

export default function AssignmentsView() {
  // ทุกคนที่ login หรือเปิดหน้า task จะต้องเห็นมุมมอง All CC เสมอ เพื่อให้ตระหนักถึงภาพรวมงานของทีมก่อนที่จะเลือกยูนิตย่อย
  const [filter, setFilter] = useState<string>("All CC");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isAssigneeFilterOpen, setIsAssigneeFilterOpen] = useState(false);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "my_tasks" | "unassigned" | "overdue">("all");
  
  // Drag and Drop state
  const [draggedBriefId, setDraggedBriefId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverBriefId, setDragOverBriefId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);

  // Undo / Redo & Trash state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; type?: "info" | "success" } | null>(null);

  // In-Progress Email Draft Modal state
  const [pendingInProgressBrief, setPendingInProgressBrief] = useState<Brief | null>(null);

  // Completed Handover & Survey Email Draft Modal state
  const [pendingCompletedBrief, setPendingCompletedBrief] = useState<Brief | null>(null);

  // Mobile Kanban Column Tab Switcher State
  const [mobileStatusTab, setMobileStatusTab] = useState<string>("pending");

  // Status Revert Confirmation State
  const [revertConfirmData, setRevertConfirmData] = useState<{
    brief: Brief;
    targetStatus: string;
    currentStatus: string;
  } | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [isNotifEnabled, setIsNotifEnabled] = useState<boolean>(true);
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [isNotifHistoryOpen, setIsNotifHistoryOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const perm = getDesktopNotificationPermission();
      setNotifPermission(perm);
      const savedSetting = localStorage.getItem("cc_assignment_notifications_enabled");
      if (savedSetting !== null) {
        setIsNotifEnabled(savedSetting === "true");
      } else {
        setIsNotifEnabled(perm === "granted");
      }

      // Load notif history
      const loadHistory = () => {
        try {
          const list = JSON.parse(localStorage.getItem("cc_recent_assignment_alerts") || "[]");
          setNotifHistory(list);
        } catch {}
      };
      loadHistory();
      window.addEventListener("cc_notif_history_updated", loadHistory);
      return () => window.removeEventListener("cc_notif_history_updated", loadHistory);
    }
  }, []);

  // Sync tasks when updated remotely (e.g. from Team Action Plan & Annual Roadmap)
  useEffect(() => {
    const handleRemoteBriefUpdate = (e: any) => {
      const { id, updates } = e.detail || {};
      if (!id || !updates) return;
      setBriefs(prev => prev.map(b => b.id === id ? { 
        ...b, 
        ...updates, 
        details: { ...(b.details || {}), ...(updates.details || {}) } 
      } : b));
      if (selectedBrief && selectedBrief.id === id) {
        setSelectedBrief(prev => prev ? { 
          ...prev, 
          ...updates, 
          details: { ...(prev.details || {}), ...(updates.details || {}) } 
        } : null);
      }
    };
    window.addEventListener("cc_briefs_updated", handleRemoteBriefUpdate);
    return () => window.removeEventListener("cc_briefs_updated", handleRemoteBriefUpdate);
  }, [selectedBrief]);

  // ทุกคนที่ login หรือเปิดหน้า task จะต้องเห็นมุมมอง All CC เสมอ เพื่อให้ตระหนักถึงภาพรวมงานของทีม

  // Listen to History Manager changes
  useEffect(() => {
    const updateHistoryState = () => {
      setCanUndo(globalHistoryManager.canUndo());
      setCanRedo(globalHistoryManager.canRedo());
      setUndoCount(globalHistoryManager.getUndoCount());
      setRedoCount(globalHistoryManager.getRedoCount());
    };

    updateHistoryState();
    const unsubscribe = globalHistoryManager.subscribe(updateHistoryState);
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: "info" | "success" = "success") => {
    setActionToast({ message, type });
    setTimeout(() => {
      setActionToast(prev => (prev?.message === message ? null : prev));
    }, 3000);
  };

  const handleUndo = useCallback(async () => {
    if (!globalHistoryManager.canUndo()) return;
    try {
      const action = await globalHistoryManager.undo();
      if (action) {
        showToast(`↩ ย้อนกลับ: ${action.description}`);
      }
    } catch (err) {
      console.error("Undo error:", err);
    }
  }, []);

  const handleRedo = useCallback(async () => {
    if (!globalHistoryManager.canRedo()) return;
    try {
      const action = await globalHistoryManager.redo();
      if (action) {
        showToast(`↪ ไปข้างหน้า: ${action.description}`);
      }
    } catch (err) {
      console.error("Redo error:", err);
    }
  }, []);

  // Global Keyboard Shortcuts: Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key.toLowerCase() === "z") {
          if (e.shiftKey) {
            // Ctrl+Shift+Z = Redo
            e.preventDefault();
            handleRedo();
          } else {
            // Ctrl+Z = Undo
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key.toLowerCase() === "y") {
          // Ctrl+Y = Redo
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    fetchData();

    // Supabase Realtime channel for instantaneous multi-user syncing
    const channel = supabase
      .channel("public:assignments_view_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "briefs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBrief = payload.new as Brief;
            if (newBrief.status !== "purged" && !newBrief.details?.is_permanently_deleted) {
              setBriefs((prev) => {
                if (prev.some((b) => b.id === newBrief.id)) return prev;
                return [...prev, newBrief];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Brief;
            setBriefs((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
            setSelectedBrief((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id;
            setBriefs((prev) => prev.filter((b) => b.id !== deletedId));
            setSelectedBrief((prev) => (prev && prev.id === deletedId ? null : prev));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check URL query param ?highlightId=... to automatically open selected brief
  useEffect(() => {
    if (typeof window !== "undefined" && briefs.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const highlightId = params.get("highlightId");
      if (highlightId) {
        const found = briefs.find((b) => b.id === highlightId);
        if (found) {
          setSelectedBrief(found);
        }
      }
    }
  }, [briefs]);

  const fetchData = async () => {
    const { data: briefsData } = await supabase
      .from('briefs')
      .select('*')
      .neq('status', 'purged')
      .order('created_at', { ascending: true }); // Ascending for sequence ID calculation

    if (briefsData) {
      const filtered = briefsData.filter(b => b.status !== 'purged' && !b.details?.is_permanently_deleted);
      setBriefs(filtered);
    }

    const { data: assigneesData } = await supabase.from('assignees').select('id, name, email, unit').eq('is_active', true);
    if (assigneesData) {
      const operationalOnly = assigneesData.filter(a => isOperationalAssignee(a));
      setAssignees(operationalOnly);
      if (briefsData) {
        updateGlobalBriefsStatsCache(briefsData, operationalOnly);
      }
    }

    const { data: okrData } = await supabase.from('okr_settings').select('id, type, description').eq('is_active', true);
    if (okrData) setOkrs(okrData);
  };

  const isViewer = typeof window !== "undefined" && localStorage.getItem("cc_user_role") === "viewer";

  const updateFieldInternal = async (id: string, updates: any) => {
    if (isViewer) {
      alert("โหมดผู้เข้าชม (Viewer Mode): คุณมีสิทธิ์อ่านอย่างเดียว ไม่สามารถแก้ไขข้อมูลได้");
      return;
    }
    const brief = briefs.find(b => b.id === id);
    setBriefs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBrief && selectedBrief.id === id) {
      setSelectedBrief(prev => prev ? { ...prev, ...updates } : null);
    }
    if (updates.deadline) {
      const curDetails = updates.details || brief?.details || {};
      updates.details = {
        ...curDetails,
        deadline: updates.deadline,
        target_deadline: updates.deadline,
      };
    }

    await supabase.from('briefs').update(updates).eq('id', id);

    // Sync action plan cache in localStorage immediately
    if (typeof window !== "undefined") {
      try {
        const savedPlans = localStorage.getItem("cc_team_action_plan_v2_fy70");
        if (savedPlans) {
          const parsed = JSON.parse(savedPlans);
          if (Array.isArray(parsed)) {
            let planChanged = false;
            const updatedPlans = parsed.map((p: any) => {
              if (p.briefId === id || p.id === `cc-pm-${id}` || p.id === id) {
                planChanged = true;
                return {
                  ...p,
                  endDate: updates.deadline ? String(updates.deadline).split("T")[0].split(" ")[0] : p.endDate,
                  status: updates.status || p.status,
                  title: updates.project_name || p.title,
                };
              }
              return p;
            });
            if (planChanged) {
              localStorage.setItem("cc_team_action_plan_v2_fy70", JSON.stringify(updatedPlans));
              localStorage.setItem("cc_team_action_plan_v1", JSON.stringify(updatedPlans));
            }
          }
        }
      } catch {}

      // Broadcast brief update to entire dashboard & Action Plan / Roadmap
      window.dispatchEvent(new CustomEvent("cc_briefs_updated", { detail: { id, updates } }));
      window.dispatchEvent(new CustomEvent("cc_tasks_updated"));
    }

    // Audit Log for Activity Trail (ISO 9001:2015)
    try {
      const actor = getCurrentActor();
      const taskCode = brief?.details?.task_code || getTaskCode(brief?.unit || 'internal', id);
      let action: any = "TASK_EDIT";
      if (updates.status && updates.status !== brief?.status) {
        action = "STATUS_CHANGE";
      } else if (updates.assignee_id && updates.assignee_id !== brief?.assignee_id) {
        action = "ASSIGNEE_CHANGE";
      } else if (updates.deadline && updates.deadline !== brief?.deadline) {
        action = "DEADLINE_CHANGE";
      }
      logActivity({
        action,
        task_id: id,
        task_code: taskCode,
        project_name: brief?.project_name,
        actor_name: actor.name,
        actor_email: actor.email,
        actor_role: actor.role,
        details: {
          updates,
          previous: {
            status: brief?.status,
            assignee_id: brief?.assignee_id,
            deadline: brief?.deadline,
          },
        },
      });
    } catch {}
  };

  const updateField = async (
    id: string,
    field: string,
    value: any,
    recordHistory: boolean = true,
    bypassRevertCheck: boolean = false,
    reason?: string
  ) => {
    if (isViewer) {
      alert("โหมดผู้เข้าชม (Viewer Mode): คุณมีสิทธิ์อ่านอย่างเดียว ไม่สามารถแก้ไขหรือเปลี่ยนสถานะงานได้");
      return;
    }
    const brief = briefs.find(b => b.id === id);
    if (!brief) return;

    // Enforce valid status transition workflow rules
    if (field === 'status') {
      const currentStatus = brief.status || 'pending';
      if (currentStatus === value) return;

      // Check if this is reverting / moving backwards
      const isRevert =
        (currentStatus === 'completed' && value !== 'completed') ||
        (currentStatus === 'in_progress' && value === 'pending') ||
        (currentStatus === 'in_progress' && value === 'cancelled') ||
        (currentStatus === 'cancelled' && (value === 'pending' || value === 'in_progress'));

      if (isRevert && !bypassRevertCheck) {
        setRevertReason("");
        setRevertConfirmData({
          brief,
          targetStatus: value,
          currentStatus
        });
        return;
      }

      // 1. From 'pending' to unassigned
      if (currentStatus === 'pending') {
        if (value === 'unassigned') {
          updateField(brief.id, 'assignee_id', '');
          updateField(brief.id, 'status', 'pending');
          showToast(`ย้าย "${brief.project_name}" ไปที่ UNASSIGNED (รอมอบหมาย)`, "info");
          return;
        }
      }

      // 2. Intercept in_progress transition to require draft email modal
      if (value === 'in_progress' && !bypassRevertCheck) {
        setPendingInProgressBrief(brief);
        return;
      }

      // 3. Intercept completed transition to require delivery & survey draft email modal
      if (value === 'completed' && !bypassRevertCheck) {
        setPendingCompletedBrief(brief);
        return;
      }
    }

    const previousValue = (brief as any)[field];
    const previousInProgressAt = brief.in_progress_at;
    const previousCompletedAt = brief.completed_at;

    const now = new Date().toISOString();
    let updates: any = { [field]: value };
    
    // Auto-set timestamps for status changes
    if (field === 'status') {
      if (value === 'in_progress' && !brief.in_progress_at) updates.in_progress_at = now;
      if (value === 'completed' || value === 'cancelled') updates.completed_at = now;
      if (reason) {
        const details = { ...(brief.details || {}) };
        details.status_revert_reason = reason;
        details.status_reverted_at = now;
        updates.details = details;
      }
    } else if (field === 'assignee_id') {
      const details = { ...(brief.details || {}) };
      if (value) {
        if (!details.assigned_at) {
          details.assigned_at = now;
        }
      } else {
        delete details.assigned_at;
      }
      updates.details = details;
    }

    // Record into HistoryManager (supports 50 operations)
    if (recordHistory && previousValue !== value) {
      const description = field === 'status'
        ? `ย้าย "${brief.project_name}" ไป ${value}${reason ? ` (เหตุผล: ${reason})` : ''}`
        : field === 'assignee_id'
        ? `เปลี่ยนผู้รับผิดชอบ "${brief.project_name}"`
        : `แก้ไข ${field} ของ "${brief.project_name}"`;

      globalHistoryManager.push({
        id: Math.random().toString(36).substring(2, 9),
        type: field === 'status' ? 'MOVE_STATUS' : field === 'assignee_id' ? 'CHANGE_ASSIGNEE' : 'UPDATE_FIELD',
        description,
        briefId: id,
        timestamp: Date.now(),
        undo: async () => {
          let undoUpdates: any = { [field]: previousValue };
          if (field === 'status') {
            undoUpdates.in_progress_at = previousInProgressAt;
            undoUpdates.completed_at = previousCompletedAt;
          }
          await updateFieldInternal(id, undoUpdates);
        },
        redo: async () => {
          await updateFieldInternal(id, updates);
        }
      });
    }

    await updateFieldInternal(id, updates);

    // Provide immediate feedback for internal tasks that skip emails
    if (field === 'status') {
      if (value === 'in_progress' && shouldInternalTaskSkipEmail(brief, 'in_progress')) {
        showToast(`⚡ เริ่มงาน "${brief.project_name}" (บันทึกข้อมูลงานภายใน ไม่ต้องส่งอีเมล)`);
      } else if (value === 'completed' && shouldInternalTaskSkipEmail(brief, 'completed')) {
        showToast(`✅ ส่งมอบงาน "${brief.project_name}" (บันทึกข้อมูลงานภายใน ไม่ต้องส่งอีเมล)`);
      }
    }

    // If status changed to completed or assignee changed, notify API (Only if not skipped internal task)
    if (field === 'status' && value === 'completed') {
      if (!shouldInternalTaskSkipEmail(brief, 'completed')) {
        const assignee = assignees.find(a => a.id === brief?.assignee_id);
        fetch('/api/notify', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'task_completed', 
            briefId: brief.id, 
            assigneeId: brief?.assignee_id,
            projectName: brief.project_name,
            assigneeName: assignee?.name || 'ทีม CC',
            requesterEmail: brief.requester_email,
            requesterName: brief.coordinator_nickname
          }) 
        }).catch(console.error);
      }
    }
    else if (field === 'assignee_id' && value) {
      const assignee = assignees.find(a => a.id === value);
      if (assignee) {
        const isFromUnassigned = !previousValue || previousValue === '' || previousValue === 'unassigned';
        showToast(
          isFromUnassigned
            ? `⚡ มอบหมายงาน "${brief.project_name}" ให้ ${assignee.name} (ย้ายเข้า TO-DO LIST เรียบร้อย)`
            : `🔄 เปลี่ยนผู้รับผิดชอบ "${brief.project_name}" เป็น ${assignee.name}`,
          "success"
        );
      }
    }
  };

  // --- CONFIRM IN-PROGRESS EMAIL DISPATCH ---
  const handleConfirmInProgressEmail = async (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string; assigneeId?: string }) => {
    if (!pendingInProgressBrief) return;
    const b = pendingInProgressBrief;
    const taskCode = getTaskCode(b.unit, b.id);
    const now = new Date().toISOString();
    const targetAssigneeId = emailData.assigneeId || b.assignee_id;
    const assignee = assignees.find(a => a.id === targetAssigneeId);

    // 1. Update brief in Supabase & local state
    const updates: any = {
      status: 'in_progress',
      assignee_id: targetAssigneeId,
      in_progress_at: b.in_progress_at || now,
      requester_email: emailData.to || b.requester_email,
    };

    // Push to history stack
    globalHistoryManager.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'MOVE_STATUS',
      description: `เริ่มงาน "${b.project_name}" (In Progress)`,
      briefId: b.id,
      timestamp: Date.now(),
      undo: async () => {
        await updateFieldInternal(b.id, { status: b.status, in_progress_at: b.in_progress_at });
      },
      redo: async () => {
        await updateFieldInternal(b.id, updates);
      }
    });

    await updateFieldInternal(b.id, updates);

    // 2. Dispatch email & LINE alert via /api/notify
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kickoff_in_progress_email',
          briefId: b.id,
          taskCode,
          projectName: b.project_name,
          assigneeName: assignee?.name || 'ทีม CC',
          from: emailData.from,
          senderName: emailData.senderName,
          to: emailData.to,
          cc: emailData.cc,
          subject: emailData.subject,
          body: emailData.body,
        }),
      });
    } catch (err) {
      console.error('Failed to notify kickoff email:', err);
    }

    showToast(`⚡ เริ่มงาน "${b.project_name}" สำเร็จ! เปิดร่างอีเมลใน Gmail เรียบร้อยแล้ว (กรุณากด Send ในแท็บ Gmail เพื่อส่งจริง)`);
    setPendingInProgressBrief(null);
  };

  // --- CANCEL IN-PROGRESS (STAY AT PENDING) ---
  const handleCancelInProgress = () => {
    if (pendingInProgressBrief) {
      showToast(`งาน "${pendingInProgressBrief.project_name}" ยังคงอยู่ที่สถานะ Pending (รอทำ)`, "info");
    }
    setPendingInProgressBrief(null);
  };

  // --- CONFIRM COMPLETED EMAIL & SURVEY DISPATCH ---
  const handleConfirmCompletedEmail = async (emailData: {
    to: string;
    cc: string[];
    subject: string;
    body: string;
    from?: string;
    senderName?: string;
    assigneeId?: string;
  }) => {
    if (!pendingCompletedBrief) return;
    const b = pendingCompletedBrief;
    const taskCode = getTaskCode(b.unit, b.id);
    const now = new Date().toISOString();

    const existingDetails = b.details || {};
    const updatedDetails = {
      ...existingDetails,
      survey_status: existingDetails.survey_status || "sent",
      // Never inject fake 85.0 fallback - only preserve real survey rates if already evaluated
      ...(existingDetails.satisfaction_scores?.averagePercent ? { satisfaction_rate: existingDetails.satisfaction_scores.averagePercent } : {}),
    };

    const targetAssigneeId = emailData.assigneeId || b.assignee_id;
    const updates: any = {
      status: "completed",
      completed_at: b.completed_at || now,
      assignee_id: targetAssigneeId,
      requester_email: emailData.to || b.requester_email,
      details: updatedDetails,
    };

    // Push to history stack
    globalHistoryManager.push({
      id: Math.random().toString(36).substring(2, 9),
      type: "MOVE_STATUS",
      description: `ส่งมอบงาน "${b.project_name}" (Completed)`,
      briefId: b.id,
      timestamp: Date.now(),
      undo: async () => {
        await updateFieldInternal(b.id, {
          status: b.status,
          completed_at: b.completed_at,
          details: existingDetails,
        });
      },
      redo: async () => {
        await updateFieldInternal(b.id, updates);
      },
    });

    await updateFieldInternal(b.id, updates);

    // Dispatch completion & survey alert via /api/notify
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "task_completed",
          briefId: b.id,
          taskCode,
          projectName: b.project_name,
          unit: b.unit,
          assigneeId: targetAssigneeId,
          requesterEmail: emailData.to,
          assigneeName:
            assignees.find((a) => a.id === targetAssigneeId)?.name || "ทีม CC",
          requesterName: b.coordinator_nickname,
        }),
      });
    } catch (err) {
      console.error("Failed to notify completed email:", err);
    }

    showToast(
      `⚡ ส่งมอบงาน "${b.project_name}" สำเร็จ! เปิดร่างอีเมลแบบประเมินใน Gmail เรียบร้อยแล้ว (กรุณากด Send ในแท็บ Gmail เพื่อส่งจริง)`
    );
    setPendingCompletedBrief(null);
  };

  // --- CANCEL COMPLETED (STAY AT IN-PROGRESS) ---
  const handleCancelCompleted = () => {
    if (pendingCompletedBrief) {
      showToast(
        `งาน "${pendingCompletedBrief.project_name}" ยังคงอยู่ที่สถานะ In Progress`,
        "info"
      );
    }
    setPendingCompletedBrief(null);
  };

  // --- CONFIRM STATUS REVERT (MOVE BACKWARDS) ---
  const handleConfirmRevertStatus = async () => {
    if (!revertConfirmData) return;
    const { brief, targetStatus } = revertConfirmData;
    const reasonToSave = revertReason.trim();
    setRevertConfirmData(null);

    await updateField(brief.id, 'status', targetStatus, true, true, reasonToSave);
    showToast(
      `⚠️ เลื่อนเปลี่ยนสถานะงาน "${brief.project_name}" เป็น ${targetStatus.toUpperCase()} สำเร็จ (กรุณาแจ้ง PM และหัวหน้าทีม)`,
      "info"
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    requestAnimationFrame(() => {
      setDraggedBriefId(id);
    });
  };

  const handleDragEnd = () => {
    setDraggedBriefId(null);
    setDragOverColId(null);
    setDragOverBriefId(null);
    setDropPosition(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent, colId: string) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !e.currentTarget.contains(related)) {
      if (dragOverColId === colId) {
        setDragOverColId(null);
        setDragOverBriefId(null);
        setDropPosition(null);
      }
    }
  };

  const handleCardDragOver = (e: React.DragEvent, targetBriefId: string, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggedBriefId === targetBriefId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "before" : "after";

    if (dragOverColId !== colId) setDragOverColId(colId);
    if (dragOverBriefId !== targetBriefId || dropPosition !== pos) {
      setDragOverBriefId(targetBriefId);
      setDropPosition(pos);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    columnId: string,
    targetBriefId?: string | null,
    position?: "before" | "after" | null
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const activeDraggedId = draggedBriefId;
    setDraggedBriefId(null);
    setDragOverColId(null);
    setDragOverBriefId(null);
    setDropPosition(null);

    if (isViewer) {
      alert("โหมดผู้เข้าชม (Viewer Mode): คุณมีสิทธิ์อ่านอย่างเดียว ไม่สามารถเปลี่ยนสถานะงานได้");
      return;
    }
    if (!activeDraggedId) return;

    const brief = briefs.find(b => b.id === activeDraggedId);
    if (!brief) return;

    if (columnId === 'pending' && !brief.assignee_id) {
      setSelectedBrief(brief);
      showToast(`กรุณากำหนดผู้รับผิดชอบงาน "${brief.project_name}" เพื่อย้ายเข้า TO-DO LIST (รอทำ)`, "info");
      return;
    }

    // Determine target status and assignee
    const currentStatus = brief.status || 'pending';
    let newStatus = columnId;
    let newAssigneeId = brief.assignee_id;
    if (columnId === 'unassigned') {
      newAssigneeId = null;
      newStatus = 'pending';
      showToast(`ย้าย "${brief.project_name}" ไปที่ UNASSIGNED (รอมอบหมาย)`, "info");
    }

    // 1. Check if this is reverting / moving backwards
    const isRevert =
      (currentStatus === 'completed' && columnId !== 'completed') ||
      (currentStatus === 'in_progress' && columnId === 'pending') ||
      (currentStatus === 'in_progress' && columnId === 'unassigned') ||
      (currentStatus === 'in_progress' && columnId === 'cancelled') ||
      (currentStatus === 'cancelled' && (columnId === 'pending' || columnId === 'in_progress'));

    if (isRevert) {
      setRevertReason("");
      setRevertConfirmData({
        brief,
        targetStatus: columnId === 'unassigned' ? 'pending' : columnId,
        currentStatus
      });
      return;
    }

    // 2. Intercept in_progress transition to require draft email modal (and allow assigning inside modal)
    if (columnId === 'in_progress' && currentStatus !== 'in_progress') {
      setPendingInProgressBrief({
        ...brief,
        assignee_id: newAssigneeId || brief.assignee_id,
      });
      return;
    }

    // 3. Intercept completed transition to require delivery & survey draft email modal
    if (columnId === 'completed' && currentStatus !== 'completed') {
      setPendingCompletedBrief({
        ...brief,
        assignee_id: newAssigneeId || brief.assignee_id,
      });
      return;
    }

    // Compute reordering in destination column
    const colBriefs = getColumnBriefs(columnId).filter(b => b.id !== activeDraggedId);
    let targetIndex = colBriefs.length;

    if (targetBriefId) {
      const idx = colBriefs.findIndex(b => b.id === targetBriefId);
      if (idx !== -1) {
        targetIndex = position === "before" ? idx : idx + 1;
      }
    }

    const updatedColBriefs = [...colBriefs];
    updatedColBriefs.splice(targetIndex, 0, { ...brief, status: newStatus, assignee_id: newAssigneeId });

    // Assign integer ranks (10, 20, 30, ...)
    const rankMap = new Map<string, number>();
    updatedColBriefs.forEach((b, idx) => {
      rankMap.set(b.id, (idx + 1) * 10);
    });

    const targetRank = rankMap.get(activeDraggedId) || 10;
    const curDetails = brief.details || {};
    const updatedDetails = {
      ...curDetails,
      kanban_order: targetRank
    };

    const updates: any = {
      status: newStatus,
      assignee_id: newAssigneeId,
      details: updatedDetails
    };

    const now = new Date().toISOString();
    if (newStatus === 'in_progress' && !brief.in_progress_at) updates.in_progress_at = now;
    if ((newStatus === 'completed' || newStatus === 'cancelled') && !brief.completed_at) updates.completed_at = now;

    // Optimistically update all reordered briefs in state
    setBriefs(prev => prev.map(b => {
      if (b.id === activeDraggedId) {
        return { ...b, ...updates };
      }
      if (rankMap.has(b.id)) {
        return {
          ...b,
          details: { ...(b.details || {}), kanban_order: rankMap.get(b.id)! }
        };
      }
      return b;
    }));

    // Record history
    globalHistoryManager.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'MOVE_STATUS',
      description: `ย้าย "${brief.project_name}" ไป ${columnId}`,
      briefId: activeDraggedId,
      timestamp: Date.now(),
      undo: async () => {
        await updateFieldInternal(activeDraggedId, { status: brief.status, assignee_id: brief.assignee_id, details: brief.details });
      },
      redo: async () => {
        await updateFieldInternal(activeDraggedId, updates);
      }
    });

    await updateFieldInternal(activeDraggedId, updates);

    // Provide user feedback for tasks that skip email or move to pending
    if (newStatus === 'in_progress' && currentStatus !== 'in_progress') {
      showToast(`⚡ เริ่มงาน "${brief.project_name}" (บันทึกข้อมูลงานภายใน ไม่ต้องส่งอีเมล)`);
    } else if (newStatus === 'completed' && currentStatus !== 'completed') {
      showToast(`✅ ส่งมอบงาน "${brief.project_name}" (บันทึกข้อมูลงานภายใน ไม่ต้องส่งอีเมล)`);
    } else if (newStatus === 'pending' && columnId !== 'unassigned' && currentStatus !== 'pending') {
      showToast(`⏳ ย้าย "${brief.project_name}" ไป TO-DO LIST (รอทำ)`, "info");
    }

    // Save siblings rank updates to Supabase in background
    try {
      const supabase = createClient();
      for (const b of updatedColBriefs) {
        if (b.id !== activeDraggedId) {
          const rank = rankMap.get(b.id)!;
          if (b.details?.kanban_order !== rank) {
            const siblingDetails = { ...(b.details || {}), kanban_order: rank };
            supabase.from('briefs').update({ details: siblingDetails }).eq('id', b.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to persist sibling ranks:", err);
    }
  };

  // --- SOFT DELETE TO TRASH (WITH 50-STEP UNDO) ---
  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isViewer) {
      alert("โหมดผู้เข้าชม (Viewer Mode): คุณมีสิทธิ์อ่านอย่างเดียว ไม่สามารถลบงานได้");
      return;
    }
    const brief = briefs.find(b => b.id === id);
    if (!brief) return;

    const previousDetails = { ...(brief.details || {}) };
    const newDetails = {
      ...previousDetails,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      previous_status: brief.status
    };

    // Push action to history stack
    globalHistoryManager.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'DELETE_TO_TRASH',
      description: `ย้าย "${brief.project_name}" ลงถังขยะ`,
      briefId: id,
      timestamp: Date.now(),
      undo: async () => {
        await updateFieldInternal(id, { details: previousDetails });
      },
      redo: async () => {
        await updateFieldInternal(id, { details: newDetails });
      }
    });

    await updateFieldInternal(id, { details: newDetails });
    showToast(`🗑️ ย้าย "${brief.project_name}" ลงถังขยะแล้ว (สามารถกดกู้คืนได้)`);
  };

  // --- RESTORE FROM TRASH (WITH UNDO) ---
  const handleRestoreTask = async (id: string) => {
    const brief = briefs.find(b => b.id === id);
    if (!brief) return;

    const previousDetails = { ...(brief.details || {}) };
    const cleanDetails = { ...previousDetails };
    delete cleanDetails.is_deleted;
    delete cleanDetails.deleted_at;
    delete cleanDetails.previous_status;

    globalHistoryManager.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'RESTORE_FROM_TRASH',
      description: `กู้คืน "${brief.project_name}" กลับมาบอร์ด`,
      briefId: id,
      timestamp: Date.now(),
      undo: async () => {
        await updateFieldInternal(id, { details: previousDetails });
      },
      redo: async () => {
        await updateFieldInternal(id, { details: cleanDetails });
      }
    });

    await updateFieldInternal(id, { details: cleanDetails });
    showToast(` กู้คืน "${brief.project_name}" กลับสู่บอร์ดแล้ว`);
  };

  // --- PERMANENT DELETE ---
  const handlePermanentDelete = async (id: string) => {
    const target = briefs.find(b => b.id === id);
    setBriefs(prev => prev.filter(b => b.id !== id));
    await supabase.from('briefs').update({
      status: 'purged',
      details: {
        ...(target?.details || {}),
        is_deleted: false,
        is_permanently_deleted: true,
        purged_at: new Date().toISOString()
      }
    }).eq('id', id);

    try {
      const actor = getCurrentActor();
      logActivity({
        action: "TASK_PURGE",
        task_id: id,
        task_code: target?.details?.task_code || getTaskCode(target?.unit || 'internal', id),
        project_name: target?.project_name,
        actor_name: actor.name,
        actor_email: actor.email,
        actor_role: actor.role,
        details: { project_name: target?.project_name, unit: target?.unit }
      });
    } catch {}

    showToast(`ลบงานออกจากระบบอย่างถาวรแล้ว`, "info");
  };

  // --- EMPTY TRASH ---
  const handleEmptyTrash = async () => {
    const trashedBriefsToPurge = briefs.filter(b => b.details?.is_deleted && b.status !== 'purged');
    if (trashedBriefsToPurge.length === 0) return;

    const trashedIds = trashedBriefsToPurge.map(b => b.id);
    setBriefs(prev => prev.filter(b => !trashedIds.includes(b.id)));
    for (let i = 0; i < trashedBriefsToPurge.length; i += 20) {
      const chunk = trashedBriefsToPurge.slice(i, i + 20);
      await Promise.all(chunk.map(b => 
        supabase.from('briefs').update({
          status: 'purged',
          details: {
            ...(b.details || {}),
            is_deleted: false,
            is_permanently_deleted: true,
            purged_at: new Date().toISOString()
          }
        }).eq('id', b.id)
      ));
    }

    try {
      const actor = getCurrentActor();
      logActivity({
        action: "TASK_PURGE",
        actor_name: actor.name,
        actor_email: actor.email,
        actor_role: actor.role,
        details: { purged_count: trashedIds.length, purged_ids: trashedIds }
      });
    } catch {}

    showToast(`ล้างถังขยะเรียบร้อยแล้ว (${trashedIds.length} รายการ)`, "info");
  };

  // --- DUPLICATE TASK (WITH UNDO) ---
  const handleDuplicateTask = async (e: React.MouseEvent, brief: Brief) => {
    e.stopPropagation();
    const { id, created_at, ...rest } = brief;
    rest.project_name = `${rest.project_name} (Copy)`;
    // Ensure duplicate is active
    if (rest.details?.is_deleted) {
      const cleanDetails = { ...rest.details };
      delete cleanDetails.is_deleted;
      delete cleanDetails.deleted_at;
      rest.details = cleanDetails;
    }

    // Assign new guaranteed forward-only sequential task code for duplicate task in FY70
    const dupPrefix = getUnitPrefix(brief.unit, brief.details?.category);
    const newDupCode = await generateNextTaskCode(dupPrefix);
    rest.details = { ...(rest.details || {}), task_code: newDupCode };

    const { data, error } = await supabase.from('briefs').insert([rest]).select();
    if (data && data.length > 0) {
      const newBrief = data[0];
      setBriefs(prev => [...prev, newBrief]);

      // Push to history stack
      globalHistoryManager.push({
        id: Math.random().toString(36).substring(2, 9),
        type: 'DUPLICATE_TASK',
        description: `สร้างสำเนางาน "${newBrief.project_name}"`,
        briefId: newBrief.id,
        timestamp: Date.now(),
        undo: async () => {
          await supabase.from('briefs').delete().eq('id', newBrief.id);
          setBriefs(prev => prev.filter(b => b.id !== newBrief.id));
        },
        redo: async () => {
          const { data: reInserted } = await supabase.from('briefs').insert([newBrief]).select();
          if (reInserted && reInserted.length > 0) {
            setBriefs(prev => [...prev, reInserted[0]]);
          }
        }
      });

      showToast(` คัดลอกงาน "${newBrief.project_name}" สำเร็จ (${newDupCode})`);
    }
  };

  const getTaskCode = (unit: string, id: string) => {
    const b = briefs.find(item => item.id === id);
    if (b?.details?.task_code) {
      return b.details.task_code;
    }
    return resolveTaskCode(b || { unit, id }, briefs);
  };

  const getTaskAges = (brief: Brief) => {
    const now = new Date().getTime();
    const created = new Date(brief.created_at).getTime();
    const assignedTime = brief.details?.assigned_at ? new Date(brief.details.assigned_at).getTime() : null;
    const inProgress = brief.in_progress_at ? new Date(brief.in_progress_at).getTime() : null;
    const completed = brief.completed_at ? new Date(brief.completed_at).getTime() : null;
    const ONE_DAY = 1000 * 3600 * 24;

    const hasAssignee = Boolean(brief.assignee_id && brief.assignee_id.trim() !== '');

    let unassignedDays = 0;
    let pendingDays = 0;
    let inProgressDays = 0;
    let completedDays = 0;

    if (!hasAssignee) {
      // งานที่ยังไม่มีผู้รับผิดชอบ: นับวันทั้งหมดตั้งแต่วันส่งบรีฟ (created_at) เป็น Unassigned (รอมอบหมาย)
      const unassignedEnd = inProgress || (brief.status === 'cancelled' && completed ? completed : now);
      unassignedDays = Math.max(0, Math.floor((unassignedEnd - created) / ONE_DAY));
      pendingDays = 0;
    } else {
      // งานที่มีผู้รับผิดชอบแล้ว
      if (assignedTime && assignedTime >= created) {
        unassignedDays = Math.max(0, Math.floor((assignedTime - created) / ONE_DAY));
        const pendingEnd = inProgress || (brief.status === 'cancelled' && completed ? completed : now);
        pendingDays = Math.max(0, Math.floor((pendingEnd - assignedTime) / ONE_DAY));
      } else {
        // กรณีไม่มี timestamp assigned_at บันทึกไว้เดิม
        unassignedDays = 0;
        const pendingEnd = inProgress || (brief.status === 'cancelled' && completed ? completed : now);
        pendingDays = Math.max(0, Math.floor((pendingEnd - created) / ONE_DAY));
      }
    }

    // In Progress: in_progress until completed (or now)
    if (inProgress) {
      const ipEnd = completed || (brief.status === 'cancelled' && completed ? completed : now);
      inProgressDays = Math.max(0, Math.floor((ipEnd - inProgress) / ONE_DAY));
    }

    // Completed: completed until now
    if (completed) {
      completedDays = Math.max(0, Math.floor((now - completed) / ONE_DAY));
    }

    // Fix negative days edge cases from instant state changes
    if (unassignedDays < 0) unassignedDays = 0;
    if (pendingDays < 0) pendingDays = 0;
    if (inProgressDays < 0) inProgressDays = 0;
    if (completedDays < 0) completedDays = 0;

    return { unassignedDays, pendingDays, inProgressDays, completedDays };
  };

  // Trashed briefs (exclude purged/permanently deleted)
  const trashedBriefs = briefs.filter(b => b.details?.is_deleted && !b.details?.is_permanently_deleted && b.status !== 'purged');

  // Active briefs (Filter out trashed & purged briefs)
  const activeBriefs = briefs.filter(b => !b.details?.is_deleted && !b.details?.is_permanently_deleted && b.status !== 'purged');

  // Sort active briefs descending for display so newest is on top
  const displayBriefs = activeBriefs
    .filter(b => {
      // 1. Strict filter by Unit Tab (All CC, Creative, Content, PR, Internal)
      if (filter !== "All CC") {
        const targetUnit = filter.toLowerCase();
        const briefUnit = (b.unit || "").toLowerCase();
        if (briefUnit !== targetUnit) {
          return false;
        }
      }

      // 2. Filter by Assignee (supports multi-select comparison and unassigned)
      if (selectedAssigneeIds.length > 0) {
        const matchesPrimary = b.assignee_id && selectedAssigneeIds.includes(b.assignee_id);
        const matchesAssistant = b.details?.assistants && Array.isArray(b.details.assistants) &&
          b.details.assistants.some((ast: any) => selectedAssigneeIds.includes(ast.assignee_id));
        const matchesUnassigned = selectedAssigneeIds.includes('unassigned') && !b.assignee_id;
        if (!matchesPrimary && !matchesAssistant && !matchesUnassigned) return false;
      }

      // 3. Quick Filter (my_tasks, unassigned, overdue)
      if (quickFilter === "unassigned") {
        if (b.assignee_id || b.status !== "pending") return false;
      } else if (quickFilter === "overdue") {
        const isNotDone = b.status === "pending" || b.status === "in_progress";
        const deadline = b.details?.publish_date || b.deadline || b.details?.target_deadline;
        const isOverdue = isNotDone && deadline && new Date(deadline).getTime() < new Date().setHours(0, 0, 0, 0);
        if (!isOverdue) return false;
      } else if (quickFilter === "my_tasks") {
        const currentName = (typeof window !== "undefined" ? localStorage.getItem("cc_user_name") : "") || "";
        const currentEmail = (typeof window !== "undefined" ? localStorage.getItem("cc_user_email") : "") || "";
        const myAssignee = assignees.find(a => 
          (currentName && a.name.toLowerCase().includes(currentName.toLowerCase())) ||
          (currentEmail && a.email && a.email.toLowerCase() === currentEmail.toLowerCase())
        );
        if (myAssignee) {
          const isMine = b.assignee_id === myAssignee.id;
          const isMyAssist = b.details?.assistants && Array.isArray(b.details.assistants) &&
            b.details.assistants.some((ast: any) => ast.assignee_id === myAssignee.id);
          if (!isMine && !isMyAssist) return false;
        }
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const code = getTaskCode(b.unit, b.id).toLowerCase();
      return code.includes(q) || 
             b.project_name.toLowerCase().includes(q) || 
             b.details?.description?.toLowerCase().includes(q) ||
             b.details?.notes?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const orderA = a.details?.kanban_order;
      const orderB = b.details?.kanban_order;
      if (typeof orderA === "number" && typeof orderB === "number") return orderA - orderB;
      if (typeof orderA === "number") return -1;
      if (typeof orderB === "number") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Categorize tasks cleanly into 5 distinct columns: UNASSIGNED, TO-DO LIST (Pending), IN PROGRESS, COMPLETED, CANCELLED
  const getColumnBriefs = (colId: string) => {
    return displayBriefs.filter((b) => {
      if (colId === "unassigned") {
        return (!b.assignee_id || b.assignee_id === '') && b.status === 'pending';
      }
      if (colId === "pending") {
        return Boolean(b.assignee_id && b.assignee_id !== '') && b.status === 'pending';
      }
      return b.status === colId;
    });
  };

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-70px)] md:h-[calc(100vh-80px)] min-h-[640px] md:min-h-[760px] mb-2 bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden p-2 sm:p-3 md:p-3.5 animate-in fade-in duration-200">
      
      {/* Header Toolbar: Tasks + Unit Selector (Left) & Search + กรองคน + Undo/Redo + Trash (Right) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-2 sm:mb-2.5 gap-2 pb-2 border-b border-surface-border print:hidden shrink-0">
        
        {/* Left Side: Tasks Title + Unit Tabs */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="p-1 sm:p-1.5 rounded-lg bg-[#E03131]/10 text-[#E03131]">
              <LayoutList size={18} className="sm:w-[20px] sm:h-[20px]" />
            </span>
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground mr-1">
              Tasks
            </h2>
          </div>

          {/* Unit Selector: All CC, Creative, Content, PR, Internal */}
          <div className="grid grid-cols-5 w-full sm:w-auto inline-flex bg-surface p-0.5 rounded-xl border border-surface-border shadow-2xs">
            {["All CC", "Creative", "Content", "PR", "Internal"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1.5 px-2 sm:px-3.5 text-center text-xs font-semibold rounded-lg transition-all truncate cursor-pointer ${
                  filter === f
                    ? "bg-[#E03131] text-white shadow-2xs font-bold"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Smart Quick Filters */}
          <div className="hidden lg:flex items-center gap-1 bg-surface p-0.5 rounded-xl border border-surface-border shadow-2xs text-[11px]">
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                quickFilter === "all" ? "bg-zinc-900 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("my_tasks")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                quickFilter === "my_tasks" ? "bg-orange-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              งานของฉัน
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("unassigned")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                quickFilter === "unassigned" ? "bg-rose-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              รอมอบหมาย
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("overdue")}
              className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                quickFilter === "overdue" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              เกินกำหนด
            </button>
          </div>
        </div>

        {/* Right Side: Search + กรองคน + History Controls + Trash Bin (Single Unified Row) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full xl:w-auto">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0 sm:w-48 md:w-56">
            <input 
              type="text" 
              placeholder="ค้นหา รหัส, ชื่อ, ข้อความ..." 
              className="h-8 pl-7.5 sm:pl-8 pr-2.5 sm:pr-3 text-xs rounded-xl border border-surface-border focus:outline-none focus:border-primary w-full shadow-2xs bg-surface text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Assignee Filter Button & Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAssigneeFilterOpen(!isAssigneeFilterOpen)}
              className={`h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                selectedAssigneeIds.length > 0
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-surface border-surface-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Users size={12} className={selectedAssigneeIds.length > 0 ? "text-[#f97316]" : ""} />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {selectedAssigneeIds.length === 0
                  ? "กรองคน"
                  : selectedAssigneeIds.length === 1
                  ? (assignees.find(a => a.id === selectedAssigneeIds[0])?.name || (selectedAssigneeIds[0] === 'unassigned' ? 'ยังไม่ระบุ' : 'กรอง 1 คน'))
                  : `กรองคน (${selectedAssigneeIds.length})`}
              </span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${isAssigneeFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {isAssigneeFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsAssigneeFilterOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Users size={13} className="text-[#f97316]" />
                      <span>กรองตามผู้รับผิดชอบงาน</span>
                    </span>
                    {selectedAssigneeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAssigneeIds([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {/* "All" Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedAssigneeIds([])}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedAssigneeIds.length === 0
                          ? "bg-zinc-900 text-white font-bold"
                          : "hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedAssigneeIds.length === 0 ? "bg-[#f97316]" : "bg-zinc-300"}`} />
                        <span>ทุกคน (All Members)</span>
                      </span>
                      {selectedAssigneeIds.length === 0 && <Check size={13} className="text-[#f97316]" />}
                    </button>

                    <div className="my-1 border-t border-zinc-100" />

                    {/* Member Options with Checkboxes */}
                    {assignees.map((a) => {
                      const isSelected = selectedAssigneeIds.includes(a.id);
                      const scopedBriefs = filter === "All CC" ? activeBriefs : activeBriefs.filter(b => (b.unit || '').toLowerCase() === filter.toLowerCase());
                      const taskCount = scopedBriefs.filter(b => b.assignee_id === a.id).length;

                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== a.id));
                            } else {
                              setSelectedAssigneeIds([...selectedAssigneeIds, a.id]);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-orange-50 text-orange-950 font-bold border border-orange-200"
                              : "hover:bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate mr-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-[#E03131] accent-[#E03131] cursor-pointer"
                            />
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            isSelected ? "bg-orange-200 text-orange-900" : "bg-zinc-100 text-zinc-500"
                          }`}>
                            {taskCount}
                          </span>
                        </button>
                      );
                    })}

                    {/* Unassigned Option */}
                    {(() => {
                      const isUnassignedSelected = selectedAssigneeIds.includes('unassigned');
                      const scopedBriefs = filter === "All CC" ? activeBriefs : activeBriefs.filter(b => (b.unit || '').toLowerCase() === filter.toLowerCase());
                      const unassignedCount = scopedBriefs.filter(b => !b.assignee_id).length;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (isUnassignedSelected) {
                              setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== 'unassigned'));
                            } else {
                              setSelectedAssigneeIds([...selectedAssigneeIds, 'unassigned']);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between cursor-pointer mt-1 ${
                            isUnassignedSelected
                              ? "bg-rose-50 text-rose-950 font-bold border border-rose-200"
                              : "hover:bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate mr-1">
                            <input
                              type="checkbox"
                              checked={isUnassignedSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-[#E03131] accent-[#E03131] cursor-pointer"
                            />
                            <span className="truncate">ยังไม่ได้กำหนดคนรับ</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            isUnassignedSelected ? "bg-rose-200 text-rose-900" : "bg-zinc-100 text-zinc-500"
                          }`}>
                            {unassignedCount}
                          </span>
                        </button>
                      );
                    })()}
                  </div>

                  <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10.5px] text-zinc-400">
                      ติ๊กเพื่อเทียบงานหลายคนพร้อมกัน
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAssigneeFilterOpen(false)}
                      className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-[11px] font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Icons: Undo / Redo in a compact h-8 pill */}
          <div className="flex items-center bg-surface border border-surface-border rounded-xl h-8 px-1 shadow-2xs shrink-0">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1 rounded-lg transition-all flex items-center justify-center ${
                canUndo
                  ? "text-foreground hover:bg-muted/50 active:scale-95 cursor-pointer"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              title={canUndo ? `ย้อนกลับ (Ctrl+Z) - ย้อนได้อีก ${undoCount}/50 ครั้ง` : "ไม่มีประวัติให้ย้อนกลับ"}
            >
              <Undo2 size={13} />
            </button>

            <div className="w-[1px] h-3.5 bg-surface-border mx-0.5" />

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1 rounded-lg transition-all flex items-center justify-center ${
                canRedo
                  ? "text-foreground hover:bg-muted/50 active:scale-95 cursor-pointer"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              title={canRedo ? `ไปข้างหน้า (Ctrl+Y / Ctrl+Shift+Z) - ทำซ้ำได้อีก ${redoCount}/50 ครั้ง` : "ไม่มีประวัติให้ไปข้างหน้า"}
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Trash Bin Button - h-8 height matched */}
          <button
            onClick={() => setIsTrashOpen(true)}
            className="h-8 flex items-center gap-1 px-2.5 rounded-xl bg-surface border border-surface-border shadow-2xs text-xs font-semibold text-foreground hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer relative shrink-0"
            title="เปิดถังขยะ (Trash Bin)"
          >
            <Trash2 size={13} className={trashedBriefs.length > 0 ? "text-rose-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">ถังขยะ</span>
            {trashedBriefs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold leading-none">
                {trashedBriefs.length}
              </span>
            )}
          </button>

          {/* Active Desktop Notification Bell Toggle with History Dropdown */}
          <div className="relative shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={async () => {
                if (isNotifEnabled) {
                  // Toggle OFF
                  setIsNotifEnabled(false);
                  localStorage.setItem("cc_assignment_notifications_enabled", "false");
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("cc_notif_toggle", { detail: { enabled: false } }));
                  }
                  showToast("🔕 ปิดการแจ้งเตือนงานแล้ว", "info");
                } else {
                  // Toggle ON
                  let perm = notifPermission;
                  if (perm !== "granted") {
                    perm = await requestDesktopNotificationPermission();
                    setNotifPermission(perm);
                  }
                  setIsNotifEnabled(true);
                  localStorage.setItem("cc_assignment_notifications_enabled", "true");
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("cc_notif_toggle", { detail: { enabled: true } }));
                  }
                  playAssignmentChime();
                  if (perm === "granted") {
                    showToast("🔔 เปิดการแจ้งเตือนงานแล้ว (มีเสียง & หน้าจอป๊อปอัป)");
                  } else {
                    showToast("🔔 เปิดการแจ้งเตือนแล้ว (อนุญาตสิทธิ์ในเบราว์เซอร์เพื่อให้เด้งบนจอ)");
                  }
                }
              }}
              className={`w-8 h-8 rounded-xl border shadow-2xs flex items-center justify-center transition-all cursor-pointer relative shrink-0 select-none active:scale-95 ${
                isNotifEnabled
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:border-emerald-400"
                  : "bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 hover:text-slate-600 dark:hover:text-zinc-300"
              }`}
              title={isNotifEnabled ? "การแจ้งเตือนเปิดอยู่ (คลิกเพื่อปิด)" : "การแจ้งเตือนปิดอยู่ (คลิกเพื่อเปิด)"}
              aria-label={isNotifEnabled ? "การแจ้งเตือนเปิดอยู่ (คลิกเพื่อปิด)" : "การแจ้งเตือนปิดอยู่ (คลิกเพื่อเปิด)"}
            >
              {isNotifEnabled ? (
                <div className="relative flex items-center justify-center">
                  <Bell size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              ) : (
                <BellOff size={15} className="text-slate-400 dark:text-zinc-500" />
              )}
            </button>

            {/* Notification History Popover Button */}
            <button
              type="button"
              onClick={() => setIsNotifHistoryOpen(!isNotifHistoryOpen)}
              className={`h-8 px-2 rounded-xl border shadow-2xs flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer select-none ${
                isNotifHistoryOpen
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-surface border-surface-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              title="ประวัติการแจ้งเตือนงานล่าสุด"
            >
              <span>ประวัติ</span>
              {notifHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-mono font-bold leading-none">
                  {notifHistory.length}
                </span>
              )}
            </button>

            {/* Popover Drawer */}
            {isNotifHistoryOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotifHistoryOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 text-foreground">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                      <BellRing size={14} className="text-[#f97316]" />
                      <span>ประวัติการแจ้งเตือนงาน (Notification History)</span>
                    </div>
                    {notifHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("cc_recent_assignment_alerts");
                          setNotifHistory([]);
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        ล้างประวัติ
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {notifHistory.length === 0 ? (
                      <div className="py-6 text-center text-zinc-400 text-xs">
                        ไม่มีประวัติการแจ้งเตือนใหม่ในขณะนี้
                      </div>
                    ) : (
                      notifHistory.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => {
                            setIsNotifHistoryOpen(false);
                            const brief = briefs.find(b => b.id === item.id);
                            if (brief) setSelectedBrief(brief);
                          }}
                          className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-orange-50/60 dark:hover:bg-zinc-800 hover:border-orange-200 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 line-clamp-1">
                              {item.projectName}
                            </span>
                            <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                              {item.timestamp ? new Date(item.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-400">
                            {item.taskCode && (
                              <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{item.taskCode}</span>
                            )}
                            {item.requesterName && (
                              <span>ผู้ขอ: {item.requesterName}</span>
                            )}
                            {item.deadline && (
                              <span className="text-rose-500 ml-auto font-mono">กำหนด: {item.deadline}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Floating Action Toast */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* Mobile Kanban Column Switcher: 5-Column Grid with Authentic Web Colors */}
      <div className="grid grid-cols-5 md:hidden bg-slate-100/90 dark:bg-zinc-800/80 p-1 rounded-2xl gap-1 mb-2 shrink-0 border border-slate-200/80 dark:border-zinc-700 shadow-2xs w-full">
        {COLUMNS.map((col) => {
          const count = getColumnBriefs(col.id).length;
          const isActive = mobileStatusTab === col.id;
          const theme = COLUMN_THEMES[col.id];

          return (
            <button
              key={col.id}
              onClick={() => setMobileStatusTab(col.id)}
              className={`w-full py-1.5 px-0.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                isActive
                  ? `${theme.activeBg} ${theme.activeBorder} shadow-xs scale-[1.02]`
                  : `${theme.inactiveBg} ${theme.textColor} hover:brightness-95`
              }`}
            >
              <span className="truncate w-full text-center tracking-tight">{theme.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] sm:text-[9.5px] font-mono font-bold leading-none ${
                isActive ? theme.activeBadge : theme.inactiveBadge
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board - 5 Columns: UNASSIGNED, TO-DO LIST, IN PROGRESS, COMPLETED, CANCELLED */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-5 gap-2 sm:gap-2.5 overflow-hidden h-full">
        {COLUMNS.map(col => {
          const columnBriefs = getColumnBriefs(col.id);
          const isColDragOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id} 
              className={`w-full flex-col h-full min-h-0 bg-slate-100/50 rounded-xl p-1.5 sm:p-2 transition-all border ${
                isColDragOver
                  ? "border-slate-300 dark:border-zinc-600 bg-slate-100/80 dark:bg-zinc-800/50"
                  : "border-transparent hover:border-slate-200"
              } ${
                mobileStatusTab === col.id ? "flex" : "hidden md:flex"
              }`}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id, dragOverBriefId, dropPosition)}
            >
              
              {/* Column Header: Hidden on mobile (since top tab switcher already displays it); Visible on md+ */}
              <div className={`hidden md:flex items-center justify-between mb-2 px-2.5 py-1.5 rounded-xl border border-t-4 shadow-2xs shrink-0 ${col.headerBg}`}>
                <h3 className="font-bold text-[11px] sm:text-xs uppercase tracking-wide truncate">{col.shortLabel}</h3>
                <span className={`text-[11px] sm:text-xs font-bold px-1.5 py-0.2 rounded-full shadow-2xs shrink-0 ${col.badgeBg}`}>
                  {columnBriefs.length}
                </span>
              </div>
              
              {/* Column Cards */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-2 pr-0.5 custom-scrollbar"
                onDragOver={(e) => {
                  if (e.target === e.currentTarget) {
                    handleColumnDragOver(e, col.id);
                  }
                }}
              >
                {/* Empty column ClickUp placeholder */}
                {draggedBriefId && isColDragOver && columnBriefs.filter(b => b.id !== draggedBriefId).length === 0 && (
                  <div className="w-full min-h-[105px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-100/70 dark:bg-zinc-800/40 transition-all duration-150 pointer-events-none" />
                )}

                {columnBriefs.map(brief => {
                const ages = getTaskAges(brief);
                
                let isOverdue = false;
                let daysUntilDue: number | null = null;
                if (brief.status !== 'completed' && brief.status !== 'cancelled') {
                  const dateStr = brief.details?.publish_date || brief.deadline || brief.details?.usage_date;
                  if (dateStr) {
                    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    let dueYear: number, dueMonth: number, dueDay: number;
                    if (match) {
                      dueYear = parseInt(match[1], 10);
                      dueMonth = parseInt(match[2], 10) - 1;
                      dueDay = parseInt(match[3], 10);
                    } else {
                      const d = new Date(dateStr);
                      dueYear = d.getFullYear();
                      dueMonth = d.getMonth();
                      dueDay = d.getDate();
                    }
                    const dueDate = new Date(dueYear, dueMonth, dueDay);
                    const now = new Date();
                    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const msPerDay = 1000 * 60 * 60 * 24;
                    const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / msPerDay);
                    daysUntilDue = diffDays;
                    if (diffDays < 0) {
                      isOverdue = true;
                    }
                  }
                }
                
                const prio = brief.details?.priority?.toLowerCase() || brief.priority?.toLowerCase() || '';
                const isExplicitUrgent = (prio === 'high' || prio === 'urgent' || prio === 'critical') && brief.status !== 'completed' && brief.status !== 'cancelled';
                const slaLeadTime = getLeadTimeForTask(brief.unit, brief.details?.category || brief.details?.service_name, brief.project_name);
                const isSlaUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue < slaLeadTime;
                // ไอคอนงานด่วนจะขึ้นเมื่อ: กำหนดสถานะด่วนพิเศษ, เข้าข่ายสั่งกระชั้นชิดกว่าระยะเวลามาตรฐาน, หรือเหลือน้อยกว่า 3 วัน
                const isUrgent = (isExplicitUrgent || isSlaUrgent || (daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3)) && !isOverdue && brief.status !== 'completed' && brief.status !== 'cancelled';
                const hasTopBadge = isOverdue || isUrgent;

                const revCount = brief.details?.revisions_count || 0;
                
                // Construct detailed reasons for Surveillance / Quality Watch
                const watchReasons: string[] = [];
                if (revCount >= 3) {
                  watchReasons.push(`แก้ไขงานแล้ว ${revCount} ครั้ง (เกินเกณฑ์ควบคุมคุณภาพ WI 3 ครั้ง)`);
                } else if (revCount === 2) {
                  watchReasons.push("แก้ไขงานแล้ว 2 ครั้ง (ใกล้แตะเพดานควบคุมคุณภาพ WI 3 ครั้ง)");
                }

                if (brief.status === 'pending') {
                  if (brief.assignee_id && ages.pendingDays > 3) {
                    watchReasons.push(`ค้างอยู่ใน To-Do List นาน ${ages.pendingDays} วัน (เกณฑ์ปกติไม่เกิน 3 วัน)`);
                  } else if (!brief.assignee_id && ages.unassignedDays > 3) {
                    watchReasons.push(`รอมอบหมายผู้รับผิดชอบนาน ${ages.unassignedDays} วัน (เกณฑ์ปกติไม่เกิน 3 วัน)`);
                  }
                } else if (brief.status === 'in_progress') {
                  if (ages.inProgressDays > 14) {
                    watchReasons.push(`กำลังดำเนินการต่อเนื่องนาน ${ages.inProgressDays} วัน`);
                  }
                }

                if (brief.status === 'pending' && daysUntilDue !== null && daysUntilDue <= 2 && daysUntilDue >= 0) {
                  watchReasons.push(`ใกล้ถึงกำหนดส่ง (เหลือ ${daysUntilDue === 0 ? "วันนี้" : `${daysUntilDue} วัน`}) แต่ยังไม่ได้เริ่ม In-Progress`);
                }

                const isUnderWatch = watchReasons.length > 0 && brief.status !== 'completed' && brief.status !== 'cancelled';

                const isDraggingThis = draggedBriefId === brief.id;
                const isTargetElsewhere = Boolean(dragOverColId && (dragOverColId !== col.id || (dragOverBriefId && dragOverBriefId !== brief.id)));

                if (isDraggingThis) {
                  if (isTargetElsewhere) {
                    return null;
                  }
                  return (
                    <div 
                      key={brief.id}
                      className="w-full min-h-[105px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-100/70 dark:bg-zinc-800/40 transition-all duration-150 pointer-events-none"
                    />
                  );
                }

                const isDropBefore = isColDragOver && dragOverBriefId === brief.id && dropPosition === 'before';
                const isDropAfter = isColDragOver && dragOverBriefId === brief.id && dropPosition === 'after';

                return (
                  <div key={brief.id} className="space-y-2">
                    {/* ClickUp Blank Insertion Placeholder BEFORE */}
                    {isDropBefore && (
                      <div className="w-full min-h-[105px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-100/70 dark:bg-zinc-800/40 transition-all duration-150 pointer-events-none" />
                    )}

                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, brief.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, brief.id, col.id)}
                      onClick={() => setSelectedBrief(brief)}
                      className="bg-surface p-2.5 rounded-xl border border-surface-border shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group flex flex-col justify-between relative min-h-[105px] select-none"
                    >
                    {/* Corner Status Icons: Overdue (Clockwise Clock Arrow) or Urgent/Due <= 3 days (Red Flame) - Enlarged size=20, No circle container */}
                    {isOverdue ? (
                      <div 
                        className="absolute top-2 right-2 z-10 text-[#E03131] dark:text-rose-500 flex items-center justify-center animate-in zoom-in-75 duration-200" 
                        title="เลยกำหนดส่ง (OVERDUE)"
                      >
                        <OverdueClockIcon size={20} className="text-[#E03131] dark:text-rose-500" />
                      </div>
                    ) : isUrgent ? (
                      <div 
                        className="absolute top-2 right-2 z-10 text-[#E03131] dark:text-rose-500 flex items-center justify-center animate-in zoom-in-75 duration-200" 
                        title={isSlaUrgent 
                          ? `งานด่วนตามระยะเวลามาตรฐาน (มาตรฐาน ${slaLeadTime} วัน, เหลือ ${daysUntilDue === 0 ? "วันนี้" : `${daysUntilDue} วัน`})` 
                          : `งานด่วน / กำหนดส่งภายใน ${daysUntilDue === 0 ? "วันนี้" : `${daysUntilDue} วัน`}`}
                      >
                        <Flame size={20} className="fill-[#E03131] dark:fill-rose-500 text-[#E03131] dark:text-rose-500" />
                      </div>
                    ) : null}

                    {/* Task Name - Clamped to max 3 lines per user requirement */}
                    <h4 
                      className={`font-semibold text-foreground text-xs leading-snug break-words line-clamp-3 ${hasTopBadge ? 'pr-7' : 'pr-0'}`}
                      title={brief.project_name}
                    >
                      <span className={`font-bold mr-1 ${
                        brief.unit?.toLowerCase() === "creative" ? "text-[#7c3aed] dark:text-[#c4b5fd]" : 
                        brief.unit?.toLowerCase() === "content" ? "text-[#db2777] dark:text-[#f472b6]" : 
                        brief.unit?.toLowerCase() === "pr" ? "text-[#1d4ed8] dark:text-[#93c5fd]" : 
                        brief.unit?.toLowerCase() === "internal" ? "text-slate-800 dark:text-slate-100" : 
                        "text-[#047857] dark:text-[#6ee7b7]"
                      }`}>
                        {getTaskCode(brief.unit, brief.id)}
                      </span>
                      {/* Surveillance / Watch Badge with Interactive Hover Details */}
                      {isUnderWatch && (
                        <span 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-[#FFD43B] hover:bg-[#FCC419] text-black shadow-xs transition-all cursor-help mr-1.5 align-middle group/watch relative select-none"
                          title={`🔍 เฝ้าระวัง:\n${watchReasons.map(r => `• ${r}`).join('\n')}`}
                        >
                          <WatchEyeIcon size={10} className="text-black shrink-0" />
                          <span className="tracking-tight font-black text-black leading-none">เฝ้าระวัง</span>

                          {/* Elegant Hover Popover Card */}
                          <span className="hidden group-hover/watch:flex flex-col absolute left-0 bottom-full mb-2 z-50 w-64 p-2.5 bg-slate-900/95 dark:bg-black/95 text-white backdrop-blur-md rounded-xl shadow-2xl border border-yellow-400/40 text-left pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
                            <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-[11px] mb-1 pb-1 border-b border-white/10">
                              <WatchEyeIcon size={12} className="shrink-0 text-yellow-400" />
                              <span>รายการเฝ้าระวัง (Watch List)</span>
                            </span>
                            <span className="space-y-1 text-[10px] text-slate-200 font-normal leading-relaxed block">
                              {watchReasons.map((reason, idx) => (
                                <span key={idx} className="flex items-start gap-1.5 block">
                                  <span className="text-yellow-400 font-bold leading-none mt-1 shrink-0">•</span>
                                  <span>{reason}</span>
                                </span>
                              ))}
                            </span>
                            <span className="mt-1.5 pt-1 border-t border-white/10 text-[9px] text-slate-400 flex items-center justify-between">
                              <span>เกณฑ์ควบคุมคุณภาพงาน</span>
                              <span className="text-yellow-400/90 font-mono font-semibold">CC QUALITY</span>
                            </span>
                          </span>
                        </span>
                      )}
                      {brief.project_name}
                    </h4>
                    
                    <div className="flex flex-col gap-1">
                      {/* Row 1: Assignee and Date */}
                      <div className="flex items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-300 min-h-[22px]">
                        <div className="flex items-center flex-1 min-w-0">
                          <CustomSelect 
                            triggerClassName={`text-left text-xs py-0 px-0 rounded transition-colors focus:outline-none cursor-pointer w-auto max-w-[145px] truncate ${getAssigneeColorClass(brief.unit, Boolean(brief.assignee_id))}`}
                            dropdownClassName="w-52"
                            placeholder="Unassigned"
                            value={brief.assignee_id || ""}
                            onChange={(val) => { updateField(brief.id, 'assignee_id', val); }}
                            renderValue={(val) => {
                              const matched = assignees.find(a => a.id === val);
                              if (!matched) return "Unassigned";
                              return (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Assignee3DAvatarBadge name={matched.name} size={18} showBorder />
                                  <span className="truncate">{matched.name}</span>
                                </div>
                              );
                            }}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...assignees.map(a => ({ 
                                value: a.id, 
                                label: (
                                  <div className="flex items-center gap-2">
                                    <Assignee3DAvatarBadge name={a.name} size={18} showBorder />
                                    <span>{a.name}</span>
                                  </div>
                                ) 
                              }))
                            ]}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                          {brief.status === 'completed' && (
                            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium" title="Completed Date">
                              <CheckCircle2 size={11} />
                              {brief.completed_at ? new Date(brief.completed_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '-'}
                            </span>
                          )}
                          {brief.status === 'cancelled' && (
                            <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium" title="Canceled Date">
                              <XCircle size={11} />
                              {brief.completed_at ? new Date(brief.completed_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '-'}
                            </span>
                          )}
                          {(() => {
                            const isUrgentOrOverdue = (isOverdue || isUrgent) && brief.status !== 'completed' && brief.status !== 'cancelled';
                            const hasDeadline = Boolean(brief.details?.publish_date || brief.deadline || brief.details?.usage_date);
                            const formattedDate = hasDeadline 
                              ? formatDate(brief.details?.publish_date || brief.deadline || brief.details?.usage_date) 
                              : "ไม่มีกำหนด";

                            return (
                              <span 
                                className={`flex items-center gap-1 transition-all ${
                                  isUrgentOrOverdue
                                    ? "text-[#E03131] dark:text-rose-400 font-bold text-[13px] tracking-tight"
                                    : "text-slate-500 dark:text-slate-400 text-[11px]"
                                }`} 
                                title={isOverdue ? "เลยกำหนดส่ง (Overdue)" : isUrgent ? "งานด่วน (Urgent)" : "กำหนดส่ง"}
                              >
                                <Clock 
                                  size={isUrgentOrOverdue ? 13 : 11} 
                                  className={isUrgentOrOverdue ? "text-[#E03131] dark:text-rose-400 shrink-0" : "text-slate-400 dark:text-slate-500 shrink-0"} 
                                />
                                <span>{formattedDate}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Row 2: Badges + Task Age in single unified line */}
                      <div className="flex items-center justify-between gap-1 h-5 pt-0.5 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex gap-1 items-center min-w-0 overflow-hidden">
                          <span className={`text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                            brief.unit?.toLowerCase() === "creative" ? "bg-[#8b5cf6]" : 
                            brief.unit?.toLowerCase() === "content" ? "bg-[#ec4899]" : 
                            brief.unit?.toLowerCase() === "pr" ? "bg-[#1877F2]" : 
                            brief.unit?.toLowerCase() === "internal" ? "bg-slate-700 dark:bg-slate-600 text-white" : 
                            "bg-[#00a884]"
                          }`}>
                            {brief.unit}
                          </span>
                          {((brief as any).decision_maker || brief.details?.team) && (
                            <span 
                              className="text-slate-600 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-surface-border/50 uppercase truncate max-w-[130px] shrink-1 min-w-0"
                              title={(brief as any).decision_maker || brief.details?.team}
                            >
                              {(brief as any).decision_maker || brief.details?.team}
                            </span>
                          )}
                          {/* Assistant Pill (expands when room allows) */}
                          {brief.details?.assistants && brief.details.assistants.some((a: any) => a.assignee_id && Number(a.percentage) > 0) && (() => {
                            const activeAsts = brief.details.assistants.filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
                            const totalPct = activeAsts.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0);
                            const firstAst = assignees.find((as: any) => as.id === activeAsts[0]?.assignee_id);
                            return (
                              <span 
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-1 py-0.5 rounded-full shrink-1 min-w-0 max-w-[110px] truncate"
                                title={`ผู้ช่วย: ${activeAsts.map((a: any) => {
                                  const m = assignees.find(as => as.id === a.assignee_id);
                                  return `${m?.name || 'ผู้ช่วย'} (${a.percentage}%)`;
                                }).join(', ')}`}
                              >
                                <Users size={9} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">+{activeAsts.length} {activeAsts.length === 1 && firstAst?.name ? `${firstAst.name} ` : ''}({totalPct}%)</span>
                              </span>
                            );
                          })()}
                          {/* Satisfaction Rating / Survey Pill */}
                          {(brief.status === 'completed' || brief.status === 'complete') && (() => {
                            const scores = brief.details?.satisfaction_scores;
                            const satPercent = typeof scores?.averagePercent === "number"
                              ? scores.averagePercent
                              : typeof brief.details?.satisfaction_rate === "number" && (brief.details.satisfaction_rate > 0 || brief.details.survey_status === 'completed')
                              ? Number(brief.details.satisfaction_rate)
                              : typeof scores?.accuracy === "number"
                              ? Math.round(((scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy)) / 25) * 100)
                              : null;

                            const isEvaluated = satPercent !== null && brief.details?.survey_status !== 'declined';

                            if (isEvaluated) {
                              return (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded-full shrink-0"
                                  title={brief.details?.satisfaction_scores?.comment ? `ข้อเสนอแนะ: "${brief.details.satisfaction_scores.comment}"` : `ประเมินแล้ว ${satPercent}%`}
                                >
                                  <Star size={9} className="fill-amber-400 text-amber-500" />
                                  <span>{satPercent}%</span>
                                </span>
                              );
                            }

                            if (shouldInternalTaskSkipEmail(brief)) {
                              return (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded-full shrink-0"
                                  title="งานภายใน บันทึกข้อมูลในระบบเรียบร้อย (ไม่ต้องทำแบบประเมิน/ส่งเมล)"
                                >
                                  <span>บันทึกแล้ว</span>
                                </span>
                              );
                            }

                            return (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingCompletedBrief(brief);
                                }}
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded-full shrink-0 cursor-pointer shadow-2xs transition-colors"
                                title="คลิกเพื่อเปิดส่งแบบประเมินใน Gmail หรือส่งมอบงาน"
                              >
                                <Mail size={9} className="text-blue-600 dark:text-blue-400" />
                                <span>ประเมิน</span>
                              </button>
                            );
                          })()}
                        </div>
                        
                        {/* Task Age Indicators */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight shrink-0 ml-auto">
                          <span title="Days in Unassigned (รอมอบหมาย)" className="flex items-center gap-0.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span> {ages.unassignedDays}d
                          </span>
                          <span title="Days in Pending (รอทำ)" className="flex items-center gap-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> {ages.pendingDays}d
                          </span>
                          <span title="Days in Progress (กำลังทำ)" className="flex items-center gap-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> {ages.inProgressDays}d
                          </span>
                        </div>
                      </div>
                    </div>
                      
                    {/* Quick Actions (Hover) */}
                    <div className="absolute bottom-1.5 right-1.5 flex flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-0.5 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={(e) => handleDuplicateTask(e, brief)}
                        className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-2xs"
                        title="Duplicate Task"
                      >
                        <Copy size={11} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTask(e, brief.id)}
                        className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shadow-2xs"
                        title="Delete Task"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                    {/* ClickUp Blank Insertion Placeholder AFTER */}
                    {isDropAfter && (
                      <div className="w-full min-h-[105px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-100/70 dark:bg-zinc-800/40 transition-all duration-150 pointer-events-none" />
                    )}
                  </div>
                );
              })}

              {/* ClickUp Blank Placeholder at bottom of column when dragging over column space */}
              {isColDragOver && !dragOverBriefId && draggedBriefId && columnBriefs.filter(b => b.id !== draggedBriefId).length > 0 && (
                <div className="w-full min-h-[105px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-100/70 dark:bg-zinc-800/40 transition-all duration-150 pointer-events-none" />
              )}
            </div>
          </div>
        );
      })}
      </div>

      {/* Details Modal */}
      {selectedBrief && (
        <BriefDetailsModal 
          brief={selectedBrief} 
          assignees={assignees}
          taskCode={getTaskCode(selectedBrief.unit, selectedBrief.id)}
          onUpdateField={updateField}
          onClose={() => setSelectedBrief(null)} 
        />
      )}

      {/* In-Progress Kickoff Email Draft Modal */}
      {pendingInProgressBrief && (
        <InProgressEmailModal
          isOpen={Boolean(pendingInProgressBrief)}
          brief={pendingInProgressBrief}
          assignees={assignees}
          taskCode={getTaskCode(pendingInProgressBrief.unit, pendingInProgressBrief.id)}
          onConfirmSend={handleConfirmInProgressEmail}
          onCancel={handleCancelInProgress}
        />
      )}

      {/* Completed Handover & Survey Email Draft Modal */}
      {pendingCompletedBrief && (
        <CompletedEmailModal
          isOpen={Boolean(pendingCompletedBrief)}
          brief={pendingCompletedBrief}
          assignees={assignees}
          taskCode={getTaskCode(pendingCompletedBrief.unit, pendingCompletedBrief.id)}
          onConfirmSend={handleConfirmCompletedEmail}
          onCancel={handleCancelCompleted}
        />
      )}

      {/* Trash Bin Modal */}
      <TrashBinModal 
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashedBriefs={trashedBriefs}
        onRestore={handleRestoreTask}
        onPermanentDelete={handlePermanentDelete}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Status Revert Confirmation Modal (Request 2) */}
      {revertConfirmData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  ยืนยันการเลื่อนเปลี่ยนสถานะงาน
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  คุณแน่ใจว่าจะเลื่อนเปลี่ยนสถานะใช่มั้ย? เพราะอาจสร้างความสับสนให้กับ PM ผู้รับงาน กรุณาแจ้งเหตุผลให้ PM และหัวหน้าทีม ผู้ช่วยหัวหน้าทีมทราบด้วย
                </p>
              </div>
            </div>

            {/* Task Info Snapshot */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-surface-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">{getTaskCode(revertConfirmData.brief.unit, revertConfirmData.brief.id)}</span>
                <span className="text-[11px] text-muted-foreground">{revertConfirmData.brief.coordinator_nickname} ({revertConfirmData.brief.requester_email})</span>
              </div>
              <p className="font-medium text-foreground line-clamp-2">{revertConfirmData.brief.project_name}</p>
              <div className="flex items-center gap-2 pt-1 font-semibold">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase text-[10px]">
                  {revertConfirmData.currentStatus}
                </span>
                <span className="text-muted-foreground">➔</span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white uppercase text-[10px]">
                  {revertConfirmData.targetStatus}
                </span>
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>เหตุผลในการย้อนสถานะงาน:</span>
                <span className="text-[10.5px] text-muted-foreground font-normal">(แนะนำให้ระบุเพื่อส่งต่อทีม)</span>
              </label>
              <textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="เช่น มีการปรับแก้บรีฟ, รอคอนเฟิร์มข้อมูลจาก PM, รื้อดราฟใหม่..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-surface-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none shadow-2xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRevertConfirmData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              >
                ยกเลิก (คงสถานะเดิม)
              </button>
              <button
                type="button"
                onClick={handleConfirmRevertStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <AlertCircle size={14} />
                <span>ยืนยันการเลื่อนเปลี่ยนสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
