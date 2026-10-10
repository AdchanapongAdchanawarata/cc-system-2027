"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  isDesktopNotificationSupported,
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  playAssignmentChime,
  triggerActiveAssignmentAlert,
} from "@/utils/browserNotification";
import { Bell, BellRing, ExternalLink, X, CheckCircle2, Volume2 } from "lucide-react";

interface IncomingTaskAlert {
  id: string;
  projectName: string;
  taskCode?: string;
  deadline?: string;
  requesterName?: string;
  unit?: string;
  alertType?: "assigned" | "unassigned_design" | "unassigned_other";
  timestamp: number;
}

function isDesignTask(brief: any): boolean {
  if (!brief) return false;
  const unit = (brief.unit || "").toString().toLowerCase().trim();
  const category = (brief.category || brief.details?.category || brief.details?.service_category || "").toString().toLowerCase().trim();
  const service = (brief.details?.service || brief.details?.service_label || brief.project_name || "").toString().toLowerCase().trim();

  if (unit === "creative" || unit === "design") return true;
  if (category === "design" || category.includes("ออกแบบ")) return true;
  if (
    service.includes("ออกแบบ") ||
    service.includes("design") ||
    service.includes("graphic") ||
    service.includes("ci") ||
    service.includes("artwork") ||
    service.includes("key visual") ||
    service.includes("logo") ||
    service.includes("poster")
  ) {
    return true;
  }

  return false;
}

export default function ActiveAssignmentNotifier({
  currentMemberName,
  currentMemberEmail,
  assigneesList,
  onOpenTask,
}: {
  currentMemberName?: string;
  currentMemberEmail?: string;
  assigneesList?: { id: string; name: string; email?: string }[];
  onOpenTask?: (taskId: string) => void;
}) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [activeAlert, setActiveAlert] = useState<IncomingTaskAlert | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const dismissedBannerRef = useRef(false);

  // Identify current user's assignee ID(s)
  const myAssigneeIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const perm = getDesktopNotificationPermission();
    setPermission(perm);

    // If permission is default and user hasn't dismissed, show prompt (unless user explicitly disabled notifications)
    const savedDismiss = localStorage.getItem("cc_notif_banner_dismissed");
    const savedSetting = localStorage.getItem("cc_assignment_notifications_enabled");
    if (perm === "default" && !savedDismiss && savedSetting !== "false") {
      setShowPermissionBanner(true);
    }

    const handleToggle = (e: any) => {
      const enabled = e.detail?.enabled;
      if (!enabled) {
        setShowPermissionBanner(false);
        setActiveAlert(null);
      }
    };
    window.addEventListener("cc_notif_toggle", handleToggle);
    return () => window.removeEventListener("cc_notif_toggle", handleToggle);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const email = (currentMemberEmail || localStorage.getItem("cc_user_email") || "").toLowerCase().trim();
    const name = (currentMemberName || localStorage.getItem("cc_user_name") || "").toLowerCase().trim();

    const ids: string[] = [];
    if (assigneesList && assigneesList.length > 0) {
      assigneesList.forEach((a) => {
        const aName = (a.name || "").toLowerCase().trim();
        const aEmail = (a.email || "").toLowerCase().trim();
        if (
          (name && aName && (aName.includes(name) || name.includes(aName))) ||
          (email && aEmail && aEmail === email)
        ) {
          ids.push(a.id);
        }
      });
    }

    myAssigneeIdsRef.current = ids;
  }, [currentMemberName, currentMemberEmail, assigneesList]);

  // Set up Supabase Realtime channel to listen for assignment transitions and unassigned briefs
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("public:briefs_active_assignment_alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "briefs",
        },
        (payload) => {
          const eventType = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          if (!newRow) return;

          // Check if user has muted/disabled assignment notifications
          const isMuted = typeof window !== "undefined" && localStorage.getItem("cc_assignment_notifications_enabled") === "false";
          if (isMuted) return;

          const currentName = (currentMemberName || (typeof window !== "undefined" ? localStorage.getItem("cc_user_name") : "") || "").toLowerCase().trim();
          const currentEmail = (currentMemberEmail || (typeof window !== "undefined" ? localStorage.getItem("cc_user_email") : "") || "").toLowerCase().trim();
          const myIds = myAssigneeIdsRef.current;

          // Identity recognition:
          // วา (Wah WK) -> ดูแล Unit Creative/Design
          const isWah = currentName.includes("วา") || currentName.includes("wk") || currentName.includes("wasita") || currentEmail.includes("wasita");
          // จ๊อบ (Job AA) -> ดูแล Content, PR, Internal Task และภาพรวม
          const isJob = currentName.includes("จ๊อบ") || currentName.includes("aa") || currentName.includes("adchanapong") || currentEmail.includes("adchanapong");

          // -------------------------------------------------------------
          // CASE 1: Assigned to a specific person (TO-DO LIST)
          // -------------------------------------------------------------
          if (newRow.assignee_id && newRow.assignee_id !== "unassigned") {
            const isNewlyAssigned =
              eventType === "INSERT" ||
              ((!oldRow?.assignee_id || oldRow.assignee_id !== newRow.assignee_id) &&
              (newRow.status === "pending" || newRow.status === "in_progress"));

            if (!isNewlyAssigned) return;

            const isAssignedToMe =
              (myIds.length > 0 && myIds.includes(newRow.assignee_id)) ||
              (Boolean(currentName) && Boolean(newRow.assignee_name) && newRow.assignee_name.toLowerCase().trim().includes(currentName));

            if (isAssignedToMe) {
              const taskAlert: IncomingTaskAlert = {
                id: newRow.id,
                projectName: newRow.project_name || "งานใหม่",
                taskCode: newRow.details?.task_code || newRow.details?.idc_code,
                deadline: newRow.usage_date || newRow.details?.target_deadline,
                requesterName: newRow.coordinator_nickname || newRow.requester_name,
                unit: newRow.unit,
                alertType: "assigned",
                timestamp: Date.now(),
              };

              playAssignmentChime();
              triggerActiveAssignmentAlert({
                projectName: `⚡ มอบหมายงานใหม่: ${taskAlert.projectName}`,
                taskCode: taskAlert.taskCode,
                deadline: taskAlert.deadline,
                requesterName: taskAlert.requesterName,
                briefId: taskAlert.id,
                onOpen: () => {
                  if (onOpenTask) onOpenTask(taskAlert.id);
                  else if (typeof window !== "undefined") {
                    window.location.href = `/dashboard?view=assignments&highlightId=${taskAlert.id}`;
                  }
                },
              });

              // Save to Notification History in localStorage (keep latest 30)
              try {
                const history = JSON.parse(localStorage.getItem("cc_recent_assignment_alerts") || "[]");
                const updated = [taskAlert, ...history.filter((h: any) => h.id !== taskAlert.id)].slice(0, 30);
                localStorage.setItem("cc_recent_assignment_alerts", JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("cc_notif_history_updated"));
              } catch (e) {}

              setActiveAlert(taskAlert);
            }
            return;
          }

          // -------------------------------------------------------------
          // CASE 2: Enters UNASSIGNED (No assignee assigned yet)
          // - งานออกแบบ (Design) -> เตือนที่ วา (Wah WK)
          // - ประเภทอื่นนอกเหนืองานออกแบบ -> เตือนที่ จ๊อบ (Job AA)
          // -------------------------------------------------------------
          const isUnassigned = !newRow.assignee_id || newRow.assignee_id === "unassigned" || newRow.assignee_id === "";
          const isPending = newRow.status === "pending" || !newRow.status;

          const isNewOrMovedToUnassigned =
            eventType === "INSERT" ||
            (eventType === "UPDATE" && oldRow?.assignee_id && !newRow.assignee_id) ||
            (eventType === "UPDATE" && oldRow?.status !== "pending" && newRow.status === "pending" && isUnassigned);

          if (isUnassigned && isPending && isNewOrMovedToUnassigned && newRow.status !== "cancelled" && newRow.status !== "purged") {
            const isDesign = isDesignTask(newRow);

            let shouldAlertMe = false;
            let alertHeader = "";
            let alertType: "unassigned_design" | "unassigned_other" = "unassigned_other";

            if (isDesign && isWah) {
              shouldAlertMe = true;
              alertHeader = "🎨 [UNASSIGNED] มีงานออกแบบใหม่เข้ารอการมอบหมาย";
              alertType = "unassigned_design";
            } else if (!isDesign && isJob) {
              shouldAlertMe = true;
              alertHeader = `📋 [UNASSIGNED] มีงานใหม่ (${newRow.unit || 'ทั่วไป'}) เข้ารอการมอบหมาย`;
              alertType = "unassigned_other";
            }

            if (shouldAlertMe) {
              console.log(`[UNASSIGNED ALERT] Dispatched to ${isWah ? 'วา WK' : 'จ๊อบ AA'} for task: ${newRow.project_name}`);

              const taskAlert: IncomingTaskAlert = {
                id: newRow.id,
                projectName: newRow.project_name || "งานใหม่ใน UNASSIGNED",
                taskCode: newRow.details?.task_code || newRow.details?.idc_code,
                deadline: newRow.usage_date || newRow.details?.target_deadline,
                requesterName: newRow.coordinator_nickname || newRow.requester_name,
                unit: newRow.unit,
                alertType,
                timestamp: Date.now(),
              };

              playAssignmentChime();
              triggerActiveAssignmentAlert({
                projectName: `${alertHeader}: "${taskAlert.projectName}"`,
                taskCode: taskAlert.taskCode,
                deadline: taskAlert.deadline,
                requesterName: taskAlert.requesterName,
                briefId: taskAlert.id,
                onOpen: () => {
                  if (onOpenTask) onOpenTask(taskAlert.id);
                  else if (typeof window !== "undefined") {
                    window.location.href = `/dashboard?view=assignments&highlightId=${taskAlert.id}`;
                  }
                },
              });

              // Save to Notification History in localStorage (keep latest 30)
              try {
                const history = JSON.parse(localStorage.getItem("cc_recent_assignment_alerts") || "[]");
                const updated = [taskAlert, ...history.filter((h: any) => h.id !== taskAlert.id)].slice(0, 30);
                localStorage.setItem("cc_recent_assignment_alerts", JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("cc_notif_history_updated"));
              } catch (e) {}

              setActiveAlert(taskAlert);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMemberName, currentMemberEmail, onOpenTask]);

  const handleEnableNotification = async () => {
    const res = await requestDesktopNotificationPermission();
    setPermission(res);
    setShowPermissionBanner(false);
    localStorage.setItem("cc_notif_banner_dismissed", "true");

    if (res === "granted") {
      // Play a test chime and show a welcome confirmation notification
      playAssignmentChime();
      triggerActiveAssignmentAlert({
        projectName: "เปิดระบบแจ้งเตือนสำเร็จ!",
        taskCode: "TEST-ALERT",
        deadline: "พร้อมใช้งานทันที",
        requesterName: "ระบบ CC TEAM",
      });
    }
  };

  const handleTestSoundAndAlert = () => {
    playAssignmentChime();
    triggerActiveAssignmentAlert({
      projectName: "ทดสอบการแจ้งเตือนงานใหม่ (Active Notification)",
      taskCode: "DEMO-01",
      deadline: "วันพรุ่งนี้ 17:00",
      requesterName: "หัวหน้าทีม CC",
      onOpen: () => {
        alert("ระบบพร้อมเปิดงานเข้าสู่หน้าจอทำงานได้ทันทีครับ!");
      },
    });
  };

  return (
    <>
      {/* 1. Permission Prompt Banner (Discreet, animated at top of screen) */}
      {showPermissionBanner && permission === "default" && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-3 border border-white/20 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing size={20} className="animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm leading-snug">เปิดการแจ้งเตือนหน้าจอ (Desktop Alert)</div>
                <div className="text-xs text-white/90 leading-tight truncate">
                  ให้ระบบเด้งเตือนและมีเสียงทันทีที่ได้รับมอบหมายงานใหม่
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEnableNotification}
                className="px-3.5 py-1.5 bg-white text-orange-600 rounded-xl font-bold text-xs shadow-md hover:bg-orange-50 transition-all cursor-pointer active:scale-95"
              >
                เปิดใช้งาน
              </button>
              <button
                onClick={() => {
                  setShowPermissionBanner(false);
                  localStorage.setItem("cc_notif_banner_dismissed", "true");
                }}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. High-Attention Floating Alert Card when a task is newly assigned */}
      {activeAlert && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-orange-500/80 backdrop-blur-xl relative overflow-hidden">
            {/* Glowing Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse" />

            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <BellRing size={16} className="animate-bounce" />
                <span>
                  {activeAlert.alertType === "unassigned_design"
                    ? "🎨 มีงานออกแบบใหม่เข้ารอการมอบหมาย (UNASSIGNED)"
                    : activeAlert.alertType === "unassigned_other"
                    ? "📋 มีงานใหม่เข้ารอการมอบหมาย (UNASSIGNED)"
                    : "⚡ คุณได้รับมอบหมายงานใหม่! (TO-DO LIST)"}
                </span>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="text-base font-bold text-white mb-2 leading-snug line-clamp-2">
              {activeAlert.projectName}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-xl mb-4 border border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px]">รหัสงาน:</span>
                <span className="font-mono font-bold text-amber-300">{activeAlert.taskCode || "CC-TASK"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">กำหนดส่ง:</span>
                <span className="font-bold text-rose-400">{activeAlert.deadline || "ตามบรีฟ"}</span>
              </div>
              {activeAlert.requesterName && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">ผู้ขอรับบริการ:</span>
                  <span className="font-medium text-slate-200">{activeAlert.requesterName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const id = activeAlert.id;
                  setActiveAlert(null);
                  if (onOpenTask) {
                    onOpenTask(id);
                  } else if (typeof window !== "undefined") {
                    window.location.href = `/dashboard?view=assignments&highlightId=${id}`;
                  }
                }}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
              >
                <ExternalLink size={13} />
                <span>{activeAlert.alertType?.startsWith("unassigned") ? "🔍 ดูบรีฟและมอบหมายงาน" : "🚀 เปิดดูงานและเริ่มทำ"}</span>
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
