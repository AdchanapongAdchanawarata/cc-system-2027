"use client";

import { useState, useEffect, useCallback } from "react";
import CustomSelect from "./CustomSelect";
import { createClient } from "@/utils/supabase/client";
import { 
  UserCircle2, CalendarDays, Tags, KanbanSquare, Flame, 
  CheckCircle2, XCircle, Trash2, Copy, ClockAlert, History, 
  Users, Star, MessageSquare, Undo2, Redo2, RotateCcw, AlertCircle, Mail,
  LayoutList
} from "lucide-react";
import BriefDetailsModal from "./BriefDetailsModal";
import TrashBinModal from "./TrashBinModal";
import InProgressEmailModal from "./InProgressEmailModal";
import { getStandardPriceForTask } from "@/utils/pricing";
import { globalHistoryManager } from "@/utils/historyManager";

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
  { id: "pending", label: "Pending (รอดำเนินการ)", shortLabel: "PENDING", color: "border-amber-400 bg-amber-50" },
  { id: "in_progress", label: "In Progress (กำลังทำ)", shortLabel: "IN PROGRESS", color: "border-blue-400 bg-blue-50" },
  { id: "completed", label: "Completed (เสร็จสิ้น)", shortLabel: "COMPLETED", color: "border-emerald-400 bg-emerald-50" },
  { id: "cancelled", label: "Cancelled (ยกเลิก)", shortLabel: "CANCELLED", color: "border-rose-400 bg-rose-50" }
];

const getAssigneeColorClass = (unitStr: string, hasAssignee: boolean) => {
  if (!hasAssignee) return "text-slate-400 font-normal";
  switch (unitStr?.toLowerCase()) {
    case 'creative': return 'text-[#8b5cf6] font-bold hover:text-[#7c3aed]';
    case 'content': return 'text-[#ec4899] font-bold hover:text-[#db2777]';
    case 'pr': return 'text-[#1877F2] font-bold hover:text-[#1466d0]';
    case 'internal': return 'text-[#27272a] font-bold hover:text-black';
    default: return 'text-[#00a884] font-bold hover:text-[#008f6f]';
  }
};

export default function AssignmentsView() {
  const [filter, setFilter] = useState("All CC");
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drag and Drop state
  const [draggedBriefId, setDraggedBriefId] = useState<string | null>(null);

  // Undo / Redo & Trash state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; type?: "info" | "success" } | null>(null);

  // In-Progress Email Draft Modal state
  const [pendingInProgressBrief, setPendingInProgressBrief] = useState<Brief | null>(null);

  // Mobile Kanban Column Tab Switcher State
  const [mobileStatusTab, setMobileStatusTab] = useState<string>("pending");

  // Status Revert Confirmation State
  const [revertConfirmData, setRevertConfirmData] = useState<{
    brief: Brief;
    targetStatus: string;
    currentStatus: string;
  } | null>(null);
  const [revertReason, setRevertReason] = useState("");

  const supabase = createClient();

  // Auto-detect logged in employee's unit to preselect tab (Creative / Content / PR / Internal)
  useEffect(() => {
    try {
      const savedUnit = localStorage.getItem("cc_user_unit");
      const unitMap: Record<string, string> = {
        creative: "Creative",
        content: "Content",
        pr: "PR",
        internal: "Internal",
      };
      if (savedUnit && unitMap[savedUnit.toLowerCase()]) {
        setFilter(unitMap[savedUnit.toLowerCase()]);
        return;
      }

      // Fallback: match by email or name from assignees
      const savedEmail = localStorage.getItem("cc_user_email");
      const savedName = localStorage.getItem("cc_user_name");
      if (savedEmail || savedName) {
        supabase
          .from("assignees")
          .select("unit, email, name")
          .then(({ data }) => {
            if (data && data.length > 0) {
              const matched = data.find(
                (a) =>
                  (savedEmail && a.email && a.email.toLowerCase() === savedEmail.toLowerCase()) ||
                  (savedName && a.name && a.name.includes(savedName))
              );
              if (matched && matched.unit) {
                const u = matched.unit.split("|")[0].toLowerCase();
                if (unitMap[u]) {
                  localStorage.setItem("cc_user_unit", u);
                  setFilter(unitMap[u]);
                }
              }
            }
          });
      }
    } catch (e) {
      console.warn("Auto tab selection notice:", e);
    }
  }, []);

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
  }, [filter]);

  const fetchData = async () => {
    let query = supabase.from('briefs').select('*').order('created_at', { ascending: true }); // Ascending for sequence ID calculation
    
    if (filter !== "All CC") {
      query = query.eq('unit', filter.toLowerCase());
    }

    const { data: briefsData } = await query;
    if (briefsData) setBriefs(briefsData);

    const { data: assigneesData } = await supabase.from('assignees').select('id, name, email, unit').eq('is_active', true);
    if (assigneesData) {
      const operationalOnly = assigneesData.filter(a => !(a.unit || '').includes('|executive'));
      setAssignees(operationalOnly);
    }

    const { data: okrData } = await supabase.from('okr_settings').select('id, type, description').eq('is_active', true);
    if (okrData) setOkrs(okrData);
  };

  const updateFieldInternal = async (id: string, updates: any) => {
    setBriefs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBrief && selectedBrief.id === id) {
      setSelectedBrief(prev => prev ? { ...prev, ...updates } : null);
    }
    await supabase.from('briefs').update(updates).eq('id', id);
  };

  const updateField = async (
    id: string,
    field: string,
    value: any,
    recordHistory: boolean = true,
    bypassRevertCheck: boolean = false,
    reason?: string
  ) => {
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

      // 1. From 'pending': can only move to 'in_progress' or 'cancelled'
      if (currentStatus === 'pending') {
        if (value === 'completed') {
          alert(
            "⚠️ ไม่สามารถย้ายงานจาก 'Pending' ไปยังสถานะ 'Completed' ได้โดยตรง!\n\n" +
            "📌 ขั้นตอนการทำงานที่ถูกต้อง:\n" +
            "1. กำหนดผู้รับผิดชอบงาน (Assignee)\n" +
            "2. ย้ายสถานะไปที่ 'In Progress (กำลังทำ)' เพื่อส่งอีเมลตั้งต้นแจ้งเริ่มงานและข้อความบรีฟให้ PM และทีมงาน\n" +
            "3. ดำเนินการผลิตและตรวจแก้แต่ละดราฟจนส่งมอบงานสมบูรณ์ จึงจะเปลี่ยนสถานะเป็น 'Completed'"
          );
          return;
        }
        if (value !== 'in_progress' && value !== 'cancelled' && value !== 'pending') {
          alert("⚠️ จากสถานะ Pending สามารถย้ายไปได้เฉพาะ In Progress (กำลังทำ) หรือ Cancelled (ยกเลิก) เท่านั้น");
          return;
        }
      }

      // 2. Intercept in_progress transition to require assignee and draft email modal
      if (value === 'in_progress' && !bypassRevertCheck) {
        if (!brief.assignee_id) {
          alert(
            "⚠️ ไม่สามารถเริ่มงานได้: กรุณากำหนดผู้รับผิดชอบงาน (Assignee) ก่อนเปลี่ยนสถานะเป็น In Progress\n\n" +
            "📌 เพื่อให้ระบบดึงข้อมูลผู้รับผิดชอบ (ชื่อ, ตำแหน่ง, เบอร์ติดต่อ, อีเมล) ใส่ในร่างอีเมลแจ้งเริ่มงานได้อย่างถูกต้องครับ"
          );
          return;
        }
        setPendingInProgressBrief(brief);
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

    // If status changed to completed or assignee changed, notify API
    if (field === 'status' && value === 'completed') {
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
    else if (field === 'assignee_id' && value) {
      const assignee = assignees.find(a => a.id === value);
      if (assignee) {
        fetch('/api/notify', { 
          method: 'POST', 
          body: JSON.stringify({ 
            action: 'assignee_changed', 
            briefId: brief.id, 
            projectName: brief.project_name, 
            assigneeName: assignee.name 
          }) 
        }).catch(console.error);
      }
    }
  };

  // --- CONFIRM IN-PROGRESS EMAIL DISPATCH ---
  const handleConfirmInProgressEmail = async (emailData: { to: string; cc: string[]; subject: string; body: string; from?: string; senderName?: string }) => {
    if (!pendingInProgressBrief) return;
    const b = pendingInProgressBrief;
    const taskCode = getTaskCode(b.unit, b.id);
    const now = new Date().toISOString();
    const assignee = assignees.find(a => a.id === b.assignee_id);

    // 1. Update brief in Supabase & local state
    const updates: any = {
      status: 'in_progress',
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

    showToast(`⚡ เริ่มงาน "${b.project_name}" และส่งอีเมลแจ้ง PM เรียบร้อยแล้ว!`);
    setPendingInProgressBrief(null);
  };

  // --- CANCEL IN-PROGRESS (STAY AT PENDING) ---
  const handleCancelInProgress = () => {
    if (pendingInProgressBrief) {
      showToast(`งาน "${pendingInProgressBrief.project_name}" ยังคงอยู่ที่สถานะ Pending`, "info");
    }
    setPendingInProgressBrief(null);
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
    setDraggedBriefId(id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { (e.target as HTMLElement).style.opacity = "0.5"; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedBriefId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedBriefId) {
      updateField(draggedBriefId, 'status', columnId);
      setDraggedBriefId(null);
    }
  };

  // --- SOFT DELETE TO TRASH (WITH 50-STEP UNDO) ---
  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
    await supabase.from('briefs').delete().eq('id', id);
    setBriefs(prev => prev.filter(b => b.id !== id));
    showToast(`ลบงานออกจากระบบอย่างถาวรแล้ว`, "info");
  };

  // --- EMPTY TRASH ---
  const handleEmptyTrash = async () => {
    const trashedIds = briefs.filter(b => b.details?.is_deleted).map(b => b.id);
    if (trashedIds.length === 0) return;

    await supabase.from('briefs').delete().in('id', trashedIds);
    setBriefs(prev => prev.filter(b => !trashedIds.includes(b.id)));
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

      showToast(` คัดลอกงาน "${newBrief.project_name}" สำเร็จ`);
    }
  };

  const getTaskCode = (unit: string, id: string) => {
    const prefix = unit === 'creative' ? 'DS' : unit === 'content' ? 'CT' : unit === 'pr' ? 'PR' : 'IT';
    // Calculate index based on active non-deleted briefs
    const activeUnitBriefs = briefs.filter(b => b.unit === unit && !b.details?.is_deleted);
    const index = activeUnitBriefs.findIndex(b => b.id === id) + 1;
    // 70 is for fiscal year 2570
    return `${prefix}70-${index || 1}`;
  };

  const getTaskAges = (brief: Brief) => {
    const now = new Date().getTime();
    const created = new Date(brief.created_at).getTime();
    const inProgress = brief.in_progress_at ? new Date(brief.in_progress_at).getTime() : null;
    const completed = brief.completed_at ? new Date(brief.completed_at).getTime() : null;

    // Pending: created until in_progress (or now)
    const pendingEnd = inProgress || (brief.status === 'cancelled' ? now : now);
    let pendingDays = Math.max(0, Math.floor((pendingEnd - created) / (1000 * 3600 * 24)));
    
    // In Progress: in_progress until completed (or now)
    let inProgressDays = 0;
    if (inProgress) {
      const ipEnd = completed || (brief.status === 'cancelled' ? now : now);
      inProgressDays = Math.max(0, Math.floor((ipEnd - inProgress) / (1000 * 3600 * 24)));
    }

    // Completed: completed until now
    let completedDays = 0;
    if (completed) {
      completedDays = Math.floor((now - completed) / (1000 * 3600 * 24));
    }

    // Fix negative days edge cases from instant state changes
    if (pendingDays < 0) pendingDays = 0;
    if (inProgressDays < 0) inProgressDays = 0;
    if (completedDays < 0) completedDays = 0;

    return { pendingDays, inProgressDays, completedDays };
  };

  // Trashed briefs
  const trashedBriefs = briefs.filter(b => b.details?.is_deleted);

  // Active briefs (Filter out trashed briefs)
  const activeBriefs = briefs.filter(b => !b.details?.is_deleted);

  // Sort active briefs descending for display so newest is on top
  const displayBriefs = activeBriefs
    .filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const code = getTaskCode(b.unit, b.id).toLowerCase();
      return code.includes(q) || 
             b.project_name.toLowerCase().includes(q) || 
             b.details?.description?.toLowerCase().includes(q) ||
             b.details?.notes?.toLowerCase().includes(q);
    })
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100vh-140px)] min-h-[520px] md:min-h-[580px] mb-4 bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col gap-3.5 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-surface-border print:hidden shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#E03131]/10 text-[#E03131]">
                <LayoutList size={22} />
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Tasks
              </h2>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              บริหารจัดการงานประจำวันของทีม กระจายภาระงาน (Workloads) และอัปเดตความคืบหน้าโปรเจกต์
            </p>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 shrink-0">
        
        {/* Left: Unit Filter Pills */}
        <div className="flex bg-surface p-1 rounded-full border border-surface-border shadow-xs overflow-x-auto no-scrollbar">
          {["All CC", "Creative", "Content", "PR", "Internal"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap cursor-pointer ${
                filter === f ? "bg-[#E03131] text-white shadow-xs font-semibold" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Right: History Controls (Undo / Redo 50 steps), Trash Bin & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* History Controls: Back ↩ & Forward ↪ */}
          <div className="flex items-center bg-surface border border-surface-border rounded-full p-1 shadow-xs gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 px-2.5 text-xs font-semibold ${
                canUndo
                  ? "text-foreground hover:bg-muted/50 active:scale-95 cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed opacity-50"
              }`}
              title={canUndo ? `ย้อนกลับ (Ctrl+Z) - ย้อนได้อีก ${undoCount}/50 ครั้ง` : "ไม่มีประวัติให้ย้อนกลับ"}
            >
              <Undo2 size={15} />
              <span className="hidden sm:inline">Back</span>
              {undoCount > 0 && (
                <span className="text-[10px] bg-muted text-foreground rounded-full px-1.5 py-0.2">
                  {undoCount}
                </span>
              )}
            </button>

            <div className="w-[1px] h-4 bg-surface-border" />

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-full transition-all flex items-center gap-1 px-2.5 text-xs font-semibold ${
                canRedo
                  ? "text-foreground hover:bg-muted/50 active:scale-95 cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed opacity-50"
              }`}
              title={canRedo ? `ไปข้างหน้า (Ctrl+Y / Ctrl+Shift+Z) - ทำซ้ำได้อีก ${redoCount}/50 ครั้ง` : "ไม่มีประวัติให้ไปข้างหน้า"}
            >
              <span className="hidden sm:inline">Forward</span>
              <Redo2 size={15} />
              {redoCount > 0 && (
                <span className="text-[10px] bg-muted text-foreground rounded-full px-1.5 py-0.2">
                  {redoCount}
                </span>
              )}
            </button>
          </div>

          {/* Trash Bin Button with Counter Badge */}
          <button
            onClick={() => setIsTrashOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border shadow-xs text-xs font-semibold text-foreground hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer relative"
            title="เปิดถังขยะ (Trash Bin) เพื่อดูกระดาษที่ถูกลบ หรือ Restore กู้คืน"
          >
            <Trash2 size={15} className={trashedBriefs.length > 0 ? "text-rose-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">ถังขยะ</span>
            {trashedBriefs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {trashedBriefs.length}
              </span>
            )}
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[140px] sm:flex-initial">
            <input 
              type="text" 
              placeholder="ค้นหา รหัส, ชื่อ, ข้อความ..." 
              className="pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-full border border-surface-border focus:outline-none focus:border-primary w-full sm:w-52 md:w-60 shadow-xs bg-surface text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

        </div>
      </div>

      {/* Floating Action Toast */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* Mobile Kanban Column Switcher (Visible on mobile/tablet, hidden on md+) */}
      <div className="flex md:hidden items-center bg-slate-100 p-1.5 rounded-2xl gap-1.5 mb-3 shrink-0 overflow-x-auto no-scrollbar border border-slate-200 shadow-2xs">
        {COLUMNS.map((col) => {
          const count = displayBriefs.filter(b => b.status === col.id).length;
          const isActive = mobileStatusTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileStatusTab(col.id)}
              className={`shrink-0 flex-1 min-w-fit py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{col.shortLabel}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-4 gap-4 overflow-hidden h-full">
        {COLUMNS.map(col => (
          <div 
            key={col.id} 
            className={`w-full flex-col h-full min-h-0 bg-slate-100/50 rounded-xl p-2 sm:p-2.5 transition-colors border border-transparent hover:border-slate-200 ${
              mobileStatusTab === col.id ? "flex" : "hidden md:flex"
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            
            {/* Column Header */}
            <div className={`flex items-center justify-between mb-3 px-3 py-2 bg-surface border border-surface-border rounded-md border-t-4 shadow-2xs shrink-0 ${col.color}`}>
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">{col.shortLabel}</h3>
              <span className="text-xs font-semibold text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {displayBriefs.filter(b => b.status === col.id).length}
              </span>
            </div>
            
            {/* Column Cards */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
              {displayBriefs.filter(b => b.status === col.id).map(brief => {
                const ages = getTaskAges(brief);
                
                let isOverdue = false;
                if (brief.status !== 'completed' && brief.status !== 'cancelled') {
                  const dateStr = brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
                  if (dateStr) {
                    const due = new Date(dateStr);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    if (due < today) isOverdue = true;
                  }
                }
                
                const prio = brief.details?.priority?.toLowerCase() || brief.priority?.toLowerCase() || '';
                const isUrgent = (prio === 'high' || prio === 'urgent' || prio === 'critical') && brief.status !== 'completed' && brief.status !== 'cancelled';
                const hasTopBadge = isOverdue || isUrgent;

                const revCount = brief.details?.revisions_count || 0;
                const isWiBreached = (isOverdue && brief.status !== 'completed' && brief.status !== 'cancelled') || revCount >= 3;
                const isWiAtRisk = !isWiBreached && (revCount === 2 || (brief.status === 'pending' && ages.pendingDays > 3));

                return (
                  <div 
                    key={brief.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, brief.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedBrief(brief)}
                    className="bg-surface p-3 rounded-lg border border-surface-border shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group flex flex-col relative"
                  >
                    {/* Sticker Tags */}
                    {isOverdue ? (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-[#E03131] text-white rounded-full shadow-[0_2px_8px_rgba(224,49,49,0.4)] z-10 flex items-center justify-center border-2 border-white" title="OVERDUE">
                        <History size={19} strokeWidth={1.75} />
                      </div>
                    ) : isUrgent ? (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-[#FF5722] text-white rounded-full shadow-[0_2px_8px_rgba(255,87,34,0.4)] z-10 flex items-center justify-center border-2 border-white" title="URGENT">
                        {/* Running Person SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                          <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
                        </svg>
                      </div>
                    ) : null}

                    {/* Task Name - full width without extra right padding unless badge exists */}
                    <h4 className={`font-semibold text-foreground text-[13px] leading-snug mb-2 line-clamp-3 break-words ${hasTopBadge ? 'pr-8' : 'pr-0'}`}>
                      <span className={`font-bold mr-1 ${brief.unit?.toLowerCase() === "creative" ? "text-[#8b5cf6]" : brief.unit?.toLowerCase() === "content" ? "text-[#ec4899]" : brief.unit?.toLowerCase() === "pr" ? "text-[#1877F2]" : brief.unit?.toLowerCase() === "internal" ? "text-[#27272a]" : "text-[#00a884]"}`}>{getTaskCode(brief.unit, brief.id)}</span>
                      {/* isWiBreached icon removed per user request */}
                      {isWiAtRisk && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 mr-1 align-middle" title="งานนี้มีแนวโน้มหลุดเกณฑ์ WI (ค้างนาน หรือแก้ไขใกล้เกินเกณฑ์)">
                          ⚠️ เสี่ยง WI
                        </span>
                      )}
                      {brief.project_name}
                    </h4>
                    
                    <div className="flex flex-col gap-1.5">
                      
                      {/* Row 1: Assignee and Date */}
                      <div className="flex items-center justify-between gap-x-1 gap-y-1 text-xs text-slate-600 flex-nowrap">
                        <div className="flex items-center flex-1 min-w-0">
                          <CustomSelect 
                            triggerClassName={`text-left text-xs py-0.5 px-0 rounded transition-colors focus:outline-none cursor-pointer w-auto max-w-[135px] truncate ${getAssigneeColorClass(brief.unit, Boolean(brief.assignee_id))}`}
                            dropdownClassName="w-48"
                            placeholder="Unassigned"
                            value={brief.assignee_id || ""}
                            onChange={(val) => { updateField(brief.id, 'assignee_id', val); }}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...assignees.map(a => ({ value: a.id, label: a.name }))
                            ]}
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          {brief.status === 'completed' && (
                            <span className="flex items-center gap-0.5 text-emerald-600" title="Completed Date">
                              <CheckCircle2 size={12} />
                              {brief.completed_at ? new Date(brief.completed_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '-'}
                            </span>
                          )}
                          {brief.status === 'cancelled' && (
                            <span className="flex items-center gap-0.5 text-rose-600 font-medium" title="Canceled Date">
                              <XCircle size={12} />
                              {brief.completed_at ? new Date(brief.completed_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '-'}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-500">
                            <Flame size={13} className="text-red-500" fill="currentColor" />
                            <span>
                              {(brief.deadline || brief.details?.usage_date || brief.details?.publish_date) 
                                ? formatDate(brief.deadline || brief.details?.usage_date || brief.details?.publish_date) 
                                : "ไม่มีกำหนด"
                              }
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Row 1.5: Assistants indicator if any */}
                      {brief.details?.assistants && brief.details.assistants.some((a: any) => a.assignee_id && Number(a.percentage) > 0) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-full w-fit">
                          <Users size={11} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold">
                            +{brief.details.assistants.filter((a: any) => a.assignee_id && Number(a.percentage) > 0).length} ผู้ช่วย
                          </span>
                          <span className="text-emerald-600/80 font-mono">
                            ({brief.details.assistants.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0)}%)
                          </span>
                        </div>
                      )}

                      {/* Row 1.6: Satisfaction Rating Badge (only on completed tasks) */}
                      {(brief.status === 'completed' || brief.status === 'complete') && (
                        brief.details?.satisfaction_scores?.averagePercent !== undefined ? (
                          <div 
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50/95 border border-amber-200/90 px-2 py-0.5 rounded-full w-fit mt-1 shadow-2xs"
                            title={brief.details?.satisfaction_scores?.comment ? `ข้อเสนอแนะ: "${brief.details.satisfaction_scores.comment}"` : `ประเมินแล้ว ${brief.details.satisfaction_scores.averagePercent}%`}
                          >
                            <Star size={10} className="fill-amber-400 text-amber-500" />
                            <span>{brief.details.satisfaction_scores.averagePercent}% พึงพอใจ</span>
                            {brief.details?.satisfaction_scores?.comment && (
                              <span className="text-[9px] text-amber-600 font-normal italic truncate max-w-[90px]">
                                • {brief.details.satisfaction_scores.comment}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50/90 border border-blue-200/90 px-2 py-0.5 rounded-full w-fit mt-1 shadow-2xs"
                            title={`ส่งแบบประเมินเข้าอีเมลผู้สั่งงานแล้ว (${brief.requester_email || 'ผู้สั่งงาน'}) แต่ยังไม่ทำแบบประเมิน (คิดเกณฑ์มาตรฐาน 85.0% ชั่วคราว)`}
                          >
                            <Mail size={10} className="text-blue-600" />
                            <span>ส่งแบบประเมินแล้ว</span>
                          </div>
                        )
                      )}

                      {/* Row 2: Badges & Task Age */}
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <div className="flex gap-1 items-center min-w-0 flex-wrap">
                          <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${brief.unit?.toLowerCase() === "creative" ? "bg-[#8b5cf6]" : brief.unit?.toLowerCase() === "content" ? "bg-[#ec4899]" : brief.unit?.toLowerCase() === "pr" ? "text-[#1877F2]" : brief.unit?.toLowerCase() === "internal" ? "bg-[#27272a]" : "bg-[#00a884]"}`}>
                            {brief.unit}
                          </span>
                          {((brief as any).decision_maker || brief.details?.team) && (
                            <span 
                              className="text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 uppercase truncate max-w-[85px]"
                              title={(brief as any).decision_maker || brief.details?.team}
                            >
                              {(brief as any).decision_maker || brief.details?.team}
                            </span>
                          )}
                          {isWiAtRisk && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 shrink-0" title="มีแนวโน้มหลุดเกณฑ์ WI">
                              ⚠️ เสี่ยง WI
                            </span>
                          )}
                        </div>
                        
                        {/* Task Age Indicators and Completed Day */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium tracking-tighter shrink-0 ml-auto">
                          <span title="Days in Pending" className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm"></span> {ages.pendingDays}d
                          </span>
                          <span title="Days in Progress" className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-sm"></span> {ages.inProgressDays}d
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions (Hover) */}
                      <div className="absolute bottom-2 right-2 flex flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                        <button 
                          onClick={(e) => handleDuplicateTask(e, brief)}
                          className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                          title="Duplicate Task"
                        >
                          <Copy size={12} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteTask(e, brief.id)}
                          className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                          title="Delete Task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        ))}
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
