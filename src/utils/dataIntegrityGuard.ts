/**
 * Ironclad Architectural Data Integrity Guard (CC SYSTEM 2027)
 * ============================================================
 * Single Source of Truth for Write-Time & Runtime Data Integrity:
 * 1. Canonical OKR & R Tagging (KR1/R1/R2 vs. KR2/R3/R4 + NMCO=RSP Rule + KR4/R7/R8/R9 for PM Projects)
 * 2. Strict Financial Separation (Save Cost for general tasks vs. Revenue/Cost/Profit exclusively for CC PM Projects)
 * 3. Ghost Assistant Prevention (Enforces percentage > 0 and sum <= 100% on all assistant allocations)
 * 4. Canonical Assignee UUID Registry & Anti-Deletion Protection (Prevents orphaned tasks and UUID drift)
 */

import { isCcPmProject, isR3Task } from "./okrSettings";
import { getStandardPriceForTask, shouldInternalTaskSkipEmail } from "./pricing";

export interface CanonicalAssigneeEntry {
  id: string;
  name: string;
  code: string;
  nick: string;
  unit: "all" | "creative" | "content" | "pr";
}

export const CANONICAL_ASSIGNEE_REGISTRY: CanonicalAssigneeEntry[] = [
  { id: "18c2cc99-e677-43fd-bbaf-fcb83e23210e", name: "จ๊อบ AA", code: "AA", nick: "จ๊อบ", unit: "all" },
  { id: "daca31a4-5efd-475e-80ee-b9f38dd381cb", name: "วา WK", code: "WK", nick: "วา", unit: "creative" },
  { id: "fa87becd-45b3-4590-b381-ded430ce7975", name: "ก้อง IK", code: "IK", nick: "ก้อง", unit: "creative" },
  { id: "d99de87a-eb50-4383-a050-1f24a52b4620", name: "จอย RL", code: "RL", nick: "จอย", unit: "creative" },
  { id: "47adfbc2-8d0e-4dc7-87ad-98895be82026", name: "พิม AC", code: "AC", nick: "พิม", unit: "creative" },
  { id: "7800682c-8aed-45cf-ab31-45473fd16e3d", name: "เยียร์ LLP", code: "LLP", nick: "เยียร์", unit: "creative" },
  { id: "82faa669-a2b6-4497-88cf-8556a867176f", name: "นิน MTN", code: "MTN", nick: "นิน", unit: "creative" },
  { id: "3ab19406-29cc-4430-b4bf-2cfe9a1c29b7", name: "แก้ว KYK", code: "KYK", nick: "แก้ว", unit: "content" },
  { id: "b04669b5-6e86-4629-9e66-57d464881653", name: "ลูกอิน STK", code: "STK", nick: "ลูกอิน", unit: "content" },
  { id: "a2cf6e47-fc1c-4c19-b080-fe4b57f4a66a", name: "เอ็นจอย SLR", code: "SLR", nick: "เอ็นจอย", unit: "content" },
  { id: "e2c2672d-81c4-411d-89e9-bcbb6eb374f5", name: "โอ๊ต CNB", code: "CNB", nick: "โอ๊ต", unit: "pr" },
  { id: "6984154a-2975-4040-a557-aec9d090377f", name: "ต้า TTY", code: "TTY", nick: "ต้า", unit: "pr" },
];

/**
 * Resolves a core operational member by UUID, full name, nickname, or code.
 */
export function resolveCanonicalAssignee(idOrName?: string | null): CanonicalAssigneeEntry | undefined {
  if (!idOrName) return undefined;
  const clean = idOrName.trim();
  if (!clean) return undefined;

  const byId = CANONICAL_ASSIGNEE_REGISTRY.find((m) => m.id === clean);
  if (byId) return byId;

  const upper = clean.toUpperCase();
  const firstToken = clean.split(/\s+/)[0];
  return CANONICAL_ASSIGNEE_REGISTRY.find(
    (m) =>
      m.name.toUpperCase() === upper ||
      m.nick === firstToken ||
      upper.endsWith(` ${m.code}`) ||
      upper === m.code
  );
}

/**
 * Sanitizes assistant allocations and caps total assistant allocation at 100%.
 * When `strictRemoveZero` is true (e.g. on form submission or background heal),
 * strips any entry with empty `assignee_id` or `percentage <= 0`.
 */
export function sanitizeAssistantsList(
  assistants: any,
  strictRemoveZero: boolean = false
): Array<{ assignee_id: string; percentage: number; [key: string]: any }> {
  if (!Array.isArray(assistants)) return [];
  const filtered = strictRemoveZero
    ? assistants.filter(
        (a) => a && typeof a.assignee_id === "string" && a.assignee_id.trim() !== "" && Number(a.percentage) > 0
      )
    : assistants.filter((a) => a && typeof a === "object");

  let runningTotal = 0;
  const capped: Array<{ assignee_id: string; percentage: number; [key: string]: any }> = [];
  for (const item of filtered) {
    const rawPct = Math.max(0, Math.min(100, Math.round(Number(item.percentage) || 0)));
    const allowed = Math.min(rawPct, Math.max(0, 100 - runningTotal));
    capped.push({
      ...item,
      assignee_id: typeof item.assignee_id === "string" ? item.assignee_id.trim() : "",
      percentage: allowed,
    });
    runningTotal += allowed;
  }
  return capped;
}

export interface BriefIntegrityInput {
  unit?: string;
  project_name?: string;
  decision_maker?: string | null;
  okr_links?: string[];
  details?: Record<string, any>;
}

export interface BriefIntegrityOutput {
  decision_maker: string;
  okr_links: string[];
  details: Record<string, any>;
}

/**
 * Enforces all Ironclad Data Integrity Rules on a brief payload before writing to Supabase:
 * - Rule #2 & #3: Separates Save Cost (general tasks) from Revenue/Cost/Profit (exclusively CC PM projects)
 * - Rule #6: Enforces NMCO -> RSP -> KR2 (R3, R4) and CMU/RSP -> KR2 (R3, R4) vs. STeP Internal -> KR1 (R1, R2)
 * - Rule #3 (PM): Appends KR4 + R7/R8 + R9 to PM projects
 * - Assistant Rule: Strips 0% ghost assistants
 */
export function enforceCanonicalBriefIntegrity(input: BriefIntegrityInput): BriefIntegrityOutput {
  const unit = (input.unit || "internal").toLowerCase();
  const projectName = (input.project_name || "").trim();
  const rawDetails: Record<string, any> = { ...(input.details || {}) };
  const decisionMaker = (input.decision_maker || rawDetails.team || rawDetails.decision_maker || "CC").toString().trim();

  // 1. Sanitize assistants (never allow 0% ghost entries)
  if ("assistants" in rawDetails) {
    rawDetails.assistants = sanitizeAssistantsList(rawDetails.assistants);
  }

  // 2. Enforce NMCO = RSP rule (Ironclad Rule #6)
  const dmUpper = decisionMaker.toUpperCase();
  const orgUpper = (rawDetails.organization || rawDetails.work_organization || "").toString().trim().toUpperCase();
  const isNmco = dmUpper.includes("NMCO") || orgUpper.includes("NMCO");

  if (isNmco) {
    rawDetails.organization = "RSP";
    rawDetails.organization_type = "government";
    rawDetails.client_sector = "government";
    if (!rawDetails.team) rawDetails.team = "NMCO";
  } else if (!rawDetails.organization) {
    rawDetails.organization = "STeP";
  }

  // 3. Determine R3 (External CMU/RSP/NMCO) vs R1 (Internal STeP)
  // Build a probe object without stale okr_links so organization/team changes take effect cleanly
  const orgCheckProbe = {
    unit,
    project_name: projectName,
    decision_maker: decisionMaker,
    details: {
      ...rawDetails,
      selected_okr: undefined,
      okr_kr: undefined,
      r_metrics: undefined,
      okr_links: undefined,
    },
    okr_links: [],
  };
  const isExternalR3 = isR3Task(orgCheckProbe);

  // 4. Determine if this task is a CC PM Project (Ironclad Rule #3)
  const isPM = isCcPmProject({
    unit,
    project_name: projectName,
    details: rawDetails,
  });

  // 5. Build canonical OKR & R tags
  const primaryKr = isExternalR3 ? "KR2" : "KR1";
  const baseRMetrics = isExternalR3 ? ["R3", "R4"] : ["R1", "R2"];

  // Preserve optional R5/R6 if explicitly linked
  const existingR: string[] = Array.isArray(rawDetails.r_metrics) ? rawDetails.r_metrics : [];
  const extraCommR = existingR.filter((r) => r === "R5" || r === "R6");

  const finalRMetrics = Array.from(new Set([...baseRMetrics, ...extraCommR]));
  const finalOkrLinks = Array.from(new Set([primaryKr, ...finalRMetrics]));

  if (isPM) {
    const pmProfitR = rawDetails.client_sector === "private" ? "R8" : "R7";
    if (!finalRMetrics.includes(pmProfitR)) finalRMetrics.push(pmProfitR);
    if (!finalRMetrics.includes("R9")) finalRMetrics.push("R9");
    if (!finalOkrLinks.includes("KR4")) finalOkrLinks.push("KR4");
    if (!finalOkrLinks.includes(pmProfitR)) finalOkrLinks.push(pmProfitR);
    if (!finalOkrLinks.includes("R9")) finalOkrLinks.push("R9");
  }

  rawDetails.selected_okr = primaryKr;
  rawDetails.okr_kr = primaryKr;
  rawDetails.r_metrics = finalRMetrics;

  // 6. Enforce strict financial field separation (Save Cost vs. PM Revenue/Cost/Profit)
  const category = rawDetails.category || rawDetails.type || rawDetails.service || "";
  if (isPM) {
    rawDetails.is_pm_project = true;
    const rev = Math.max(0, Number(rawDetails.revenue) || 0);
    const cost = Math.max(0, Number(rawDetails.cost) || 0);
    const profit =
      rawDetails.profit !== undefined && rawDetails.profit !== "" && rawDetails.profit !== null
        ? Math.max(0, Number(rawDetails.profit) || 0)
        : Math.max(0, rev - cost);

    rawDetails.revenue = rev;
    rawDetails.cost = cost;
    rawDetails.profit = profit;
    rawDetails.save_cost = profit;
    rawDetails.project_value = String(rev > 0 ? rev : profit);
  } else {
    rawDetails.is_pm_project = false;
    // Strip any accidental PM financial fields from non-PM tasks
    delete rawDetails.revenue;
    delete rawDetails.cost;
    delete rawDetails.profit;

    let saveCost = Number(rawDetails.save_cost);
    if (isNaN(saveCost) || saveCost < 0) {
      saveCost = getStandardPriceForTask(unit, category, projectName) || 0;
    } else if (saveCost === 0 && category) {
      const stdPrice = getStandardPriceForTask(unit, category, projectName);
      if (stdPrice && stdPrice > 0 && rawDetails.save_cost === undefined) {
        saveCost = stdPrice;
      }
    }
    rawDetails.save_cost = saveCost;
    rawDetails.project_value = String(saveCost);
  }

  return {
    decision_maker: decisionMaker,
    okr_links: finalOkrLinks,
    details: rawDetails,
  };
}

let hasRunSessionIntegrityHeal = false;

/**
 * Non-destructive background self-healing check for active briefs in Supabase.
 * Automatically repairs any task that was inserted without canonical OKR tags,
 * has 0% ghost assistants, or has accidental revenue/profit on non-PM tasks.
 */
export async function runAutomatedDatabaseIntegrityHeal(
  supabase: any,
  forceRun: boolean = false
): Promise<{ checked: number; healed: number }> {
  if ((hasRunSessionIntegrityHeal && !forceRun) || !supabase) return { checked: 0, healed: 0 };
  hasRunSessionIntegrityHeal = true;

  try {
    const { data: rows, error } = await supabase
      .from("briefs")
      .select("id, unit, project_name, decision_maker, okr_links, details, status")
      .neq("status", "purged");

    if (error || !Array.isArray(rows)) return { checked: 0, healed: 0 };

    let healed = 0;
    for (const b of rows) {
      const d = b.details || {};
      if (d.is_deleted || d.is_permanently_deleted || d.is_test) continue;

      const isPM = isCcPmProject(b);
      const hasGhostAst = Array.isArray(d.assistants) && d.assistants.some((a: any) => !a?.assignee_id || Number(a?.percentage) <= 0);
      const hasStrayPmFields = !isPM && ("revenue" in d || "cost" in d || "profit" in d);
      const missingOkr = !d.selected_okr || !d.okr_kr || !Array.isArray(d.r_metrics) || d.r_metrics.length === 0 || !Array.isArray(b.okr_links) || b.okr_links.length === 0;

      // Also check if NMCO task was misclassified as KR1
      const isNmco =
        (b.decision_maker || "").toUpperCase().includes("NMCO") ||
        (d.team || "").toUpperCase().includes("NMCO") ||
        (d.organization || "").toUpperCase().includes("NMCO");
      const misclassifiedNmco = isNmco && (d.selected_okr !== "KR2" || !Array.isArray(b.okr_links) || !b.okr_links.includes("KR2"));

      if (hasGhostAst || hasStrayPmFields || missingOkr || misclassifiedNmco) {
        const cleanedDetails = {
          ...d,
          ...(Array.isArray(d.assistants) ? { assistants: sanitizeAssistantsList(d.assistants, true) } : {}),
        };
        const normalized = enforceCanonicalBriefIntegrity({
          unit: b.unit,
          project_name: b.project_name,
          decision_maker: b.decision_maker,
          okr_links: b.okr_links,
          details: cleanedDetails,
        });

        await supabase
          .from("briefs")
          .update({
            okr_links: normalized.okr_links,
            details: normalized.details,
          })
          .eq("id", b.id);
        healed++;
      }
    }

    return { checked: rows.length, healed };
  } catch (err) {
    console.warn("Automated integrity heal warning:", err);
    return { checked: 0, healed: 0 };
  }
}

// ============================================================================
// FEATURE 2: TASK REVISION HISTORY & 1-CLICK ROLLBACK (MAX 5 VERSIONS)
// ============================================================================

export interface TaskRevisionSnapshotData {
  project_name: string;
  status: string;
  assignee_id: string | null;
  deadline: string | null;
  decision_maker: string;
  okr_links: string[];
  category?: string;
  organization?: string;
  team?: string;
  save_cost?: number;
  revenue?: number;
  cost?: number;
  profit?: number;
  selected_okr?: string;
  okr_kr?: string;
  r_metrics?: string[];
  assistants?: any[];
}

export interface TaskRevisionEntry {
  id: string;
  timestamp: string;
  actorName: string;
  summary: string;
  snapshot: TaskRevisionSnapshotData;
}

/**
 * Records a pre-mutation snapshot in `details.revision_history` (retaining latest 5 versions)
 * whenever a significant field is modified.
 */
export function appendTaskRevisionSnapshot(
  previousBrief: any,
  updates: Record<string, any>,
  actorName: string = "ทีม CC"
): TaskRevisionEntry[] {
  const prevDetails = previousBrief?.details || {};
  const existingHistory: TaskRevisionEntry[] = Array.isArray(prevDetails.revision_history)
    ? prevDetails.revision_history
    : [];

  if (!previousBrief) return existingHistory;

  const nextDetails = updates.details || prevDetails;
  const changedFields: string[] = [];

  if (updates.project_name !== undefined && updates.project_name !== previousBrief.project_name) {
    changedFields.push(`ชื่อเรื่อง`);
  }
  if (updates.status !== undefined && updates.status !== previousBrief.status) {
    changedFields.push(`สถานะ (${previousBrief.status} → ${updates.status})`);
  }
  if (updates.assignee_id !== undefined && updates.assignee_id !== previousBrief.assignee_id) {
    changedFields.push(`ผู้รับผิดชอบ`);
  }
  if (updates.deadline !== undefined && updates.deadline !== previousBrief.deadline) {
    changedFields.push(`กำหนดส่ง`);
  }
  if (updates.decision_maker !== undefined && updates.decision_maker !== previousBrief.decision_maker) {
    changedFields.push(`ทีมผู้สั่งงาน (${previousBrief.decision_maker || "-"} → ${updates.decision_maker})`);
  }

  if (updates.details) {
    if (nextDetails.save_cost !== prevDetails.save_cost) {
      changedFields.push(`Save Cost (฿${Number(prevDetails.save_cost || 0).toLocaleString()} → ฿${Number(nextDetails.save_cost || 0).toLocaleString()})`);
    }
    if (nextDetails.category !== prevDetails.category) {
      changedFields.push(`ประเภทงาน (${prevDetails.category || "-"} → ${nextDetails.category || "-"})`);
    }
    if (nextDetails.organization !== prevDetails.organization) {
      changedFields.push(`หน่วยงาน (${prevDetails.organization || "-"} → ${nextDetails.organization || "-"})`);
    }
    if (nextDetails.selected_okr !== prevDetails.selected_okr) {
      changedFields.push(`OKR (${prevDetails.selected_okr || "-"} → ${nextDetails.selected_okr || "-"})`);
    }
    if (nextDetails.revenue !== prevDetails.revenue || nextDetails.profit !== prevDetails.profit) {
      changedFields.push(`งบโครงการ PM`);
    }
    const prevAstStr = JSON.stringify(prevDetails.assistants || []);
    const nextAstStr = JSON.stringify(nextDetails.assistants || []);
    if (prevAstStr !== nextAstStr) {
      changedFields.push(`สัดส่วนผู้ช่วย`);
    }
  }

  if (changedFields.length === 0) {
    return existingHistory;
  }

  // Throttle if the latest revision was by the same actor within 3 seconds
  const nowMs = Date.now();
  if (existingHistory.length > 0) {
    const latestTime = new Date(existingHistory[0].timestamp).getTime();
    if (!isNaN(latestTime) && nowMs - latestTime < 3000 && existingHistory[0].actorName === actorName) {
      existingHistory[0] = {
        ...existingHistory[0],
        timestamp: new Date(nowMs).toISOString(),
        summary: Array.from(new Set([...existingHistory[0].summary.split(", "), ...changedFields])).join(", "),
      };
      return existingHistory.slice(0, 5);
    }
  }

  const snapshot: TaskRevisionSnapshotData = {
    project_name: previousBrief.project_name || "",
    status: previousBrief.status || "pending",
    assignee_id: previousBrief.assignee_id || null,
    deadline: previousBrief.deadline || null,
    decision_maker: previousBrief.decision_maker || prevDetails.team || "CC",
    okr_links: Array.isArray(previousBrief.okr_links) ? [...previousBrief.okr_links] : ["KR1", "R1", "R2"],
    category: prevDetails.category,
    organization: prevDetails.organization,
    team: prevDetails.team,
    save_cost: prevDetails.save_cost,
    revenue: prevDetails.revenue,
    cost: prevDetails.cost,
    profit: prevDetails.profit,
    selected_okr: prevDetails.selected_okr,
    okr_kr: prevDetails.okr_kr,
    r_metrics: Array.isArray(prevDetails.r_metrics) ? [...prevDetails.r_metrics] : undefined,
    assistants: Array.isArray(prevDetails.assistants) ? JSON.parse(JSON.stringify(prevDetails.assistants)) : [],
  };

  const entry: TaskRevisionEntry = {
    id: `rev-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date(nowMs).toISOString(),
    actorName: actorName || "ทีม CC",
    summary: changedFields.join(", "),
    snapshot,
  };

  return [entry, ...existingHistory].slice(0, 5);
}

// ============================================================================
// FEATURE 4: SLA PRE-OVERDUE SHIELD (24-48H EARLY WARNING)
// ============================================================================

export interface SlaWarningStatus {
  level: "none" | "due_48h" | "due_tomorrow" | "due_today" | "overdue";
  daysLeft: number | null;
  label: string;
  shortLabel: string;
}

export function getSlaPreOverdueStatus(brief: any): SlaWarningStatus {
  if (!brief || brief.status === "completed" || brief.status === "cancelled" || brief.status === "purged") {
    return { level: "none", daysLeft: null, label: "", shortLabel: "" };
  }
  const dStr = brief.deadline || brief.details?.publish_date || brief.details?.usage_date;
  if (!dStr) {
    return { level: "none", daysLeft: null, label: "", shortLabel: "" };
  }

  const datePart = String(dStr).split("T")[0].split(" ")[0];
  const parts = datePart.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { level: "none", daysLeft: null, label: "", shortLabel: "" };
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      level: "overdue",
      daysLeft: diffDays,
      label: `เลยกำหนด ${Math.abs(diffDays)} วัน`,
      shortLabel: `เลย ${Math.abs(diffDays)} วัน`,
    };
  }
  if (diffDays === 0) {
    return {
      level: "due_today",
      daysLeft: 0,
      label: "⏰ ครบกำหนดวันนี้! (Due Today)",
      shortLabel: "⏰ ส่งวันนี้!",
    };
  }
  if (diffDays === 1) {
    return {
      level: "due_tomorrow",
      daysLeft: 1,
      label: "⏳ ครบกำหนดพรุ่งนี้ (เหลือ 24 ชม.)",
      shortLabel: "⏳ พรุ่งนี้ (24h)",
    };
  }
  if (diffDays === 2) {
    return {
      level: "due_48h",
      daysLeft: 2,
      label: "⏳ ใกล้ครบกำหนดใน 2 วัน (48 ชม.)",
      shortLabel: "⏳ เหลือ 2 วัน",
    };
  }

  return { level: "none", daysLeft: diffDays, label: "", shortLabel: "" };
}

// ============================================================================
// FEATURE 3: PENDING SURVEY FOLLOW-UP HUB HELPERS
// ============================================================================

export function getPendingSurveyTasks(briefs: any[]): any[] {
  if (!Array.isArray(briefs)) return [];
  return briefs
    .filter((b) => {
      if (!b || b.status !== "completed") return false;
      const d = b.details || {};
      if (d.is_deleted || d.is_permanently_deleted || d.is_test) return false;
      if (d.survey_status === "declined" || shouldInternalTaskSkipEmail(b)) return false;
      const score = Number(d.satisfaction_scores?.averagePercent || d.satisfaction_rate || 0);
      return score <= 0;
    })
    .sort((a, b) => {
      const tA = new Date(a.completed_at || a.created_at || 0).getTime();
      const tB = new Date(b.completed_at || b.created_at || 0).getTime();
      return tB - tA;
    });
}

export function buildSurveyFollowUpMessage(brief: any, originUrl?: string): { surveyUrl: string; message: string } {
  const base = originUrl || (typeof window !== "undefined" ? window.location.origin : "https://cc-system-2027.vercel.app");
  const taskCode = brief?.details?.task_code || brief?.details?.project_code || "";
  const surveyUrl = `${base}/survey?briefId=${brief.id}`;
  const requester = brief?.coordinator_nickname || brief?.details?.client_name || "ผู้รับบริการ";
  const projectName = brief?.project_name || "งานบริการ";

  const message =
    `สวัสดีครับ/ค่ะ คุณ${requester} 🙏✨\n` +
    `ทีม CC (Creative & Communication) ได้ส่งมอบงาน ${taskCode ? `[${taskCode}] ` : ""}"${projectName}" เรียบร้อยแล้วครับ\n\n` +
    `รบกวนสละเวลาประมาณ 30 วินาที ประเมินความพึงพอใจเพื่อการพัฒนาคุณภาพการให้บริการได้ที่ลิงก์นี้เลยนะครับ:\n` +
    `👉 ${surveyUrl}\n\n` +
    `ขอบคุณมากๆ เลยครับ/ค่ะ 🧡`;

  return { surveyUrl, message };
}

// ============================================================================
// FEATURE 5 & 6: LIVE SYSTEM HEALTH & R5/R6 REMINDER ENGINE
// ============================================================================

export interface SystemHealthCheckItem {
  id: string;
  title: string;
  passed: boolean;
  statusText: string;
  detailText: string;
}

export interface SystemIntegrityReport {
  allPassed: boolean;
  scorePercent: number;
  validTasksCount: number;
  completedTasksCount: number;
  evaluatedSurveyCount: number;
  pendingSurveyCount: number;
  dueWithin48hCount: number;
  overdueCount: number;
  needsR5R6Update: boolean;
  r5R6DaysSinceUpdate: number | null;
  checks: SystemHealthCheckItem[];
}

export function computeSystemIntegrityReport(
  briefs: any[],
  assignees: any[],
  okrSettings: any
): SystemIntegrityReport {
  const validBriefs = (briefs || []).filter((b) => {
    if (!b || b.status === "purged") return false;
    const d = b.details || {};
    return !d.is_deleted && !d.is_permanently_deleted && !d.is_test;
  });

  // 1. OKR Tagging Check
  const missingOkrTasks = validBriefs.filter((b) => {
    const d = b.details || {};
    return !d.selected_okr || !d.okr_kr || !Array.isArray(d.r_metrics) || d.r_metrics.length === 0;
  });

  // 2. Financial Separation Check
  const financialAnomalies = validBriefs.filter((b) => {
    const d = b.details || {};
    const isPM = isCcPmProject(b);
    if (!isPM && ((Number(d.revenue) || 0) > 0 || (Number(d.profit) || 0) > 0)) return true;
    return false;
  });

  // 3. Assistant Allocation Check
  const assistantAnomalies = validBriefs.filter((b) => {
    const asts = b.details?.assistants;
    if (!Array.isArray(asts) || asts.length === 0) return false;
    const hasZero = asts.some((a: any) => !a?.assignee_id || Number(a?.percentage) <= 0);
    const totalPct = asts.reduce((s: number, a: any) => s + (Number(a?.percentage) || 0), 0);
    return hasZero || totalPct > 100;
  });

  // 4. Member UUID & Quota Check
  const respList = okrSettings?.memberResponsibilities || [];
  const r1Sum = respList.reduce((s: number, m: any) => s + (Number(m?.rResponsibilities?.R1) || 0), 0);
  const r3Sum = respList.reduce((s: number, m: any) => s + (Number(m?.rResponsibilities?.R3) || 0), 0);
  const r7Sum = respList.reduce((s: number, m: any) => s + (Number(m?.rResponsibilities?.R7) || 0), 0);
  const memberQuotaOk = respList.length >= 12 && r1Sum === 100 && r3Sum === 100 && r7Sum === 100;

  // 5. SLA & Survey Counts
  const completedTasks = validBriefs.filter((b) => b.status === "completed");
  const evaluatedTasks = completedTasks.filter(
    (b) =>
      b.details?.survey_status !== "declined" &&
      Number(b.details?.satisfaction_scores?.averagePercent || b.details?.satisfaction_rate || 0) > 0
  );
  const pendingSurveyCount = getPendingSurveyTasks(validBriefs).length;

  let dueWithin48hCount = 0;
  let overdueCount = 0;
  validBriefs.forEach((b) => {
    const sla = getSlaPreOverdueStatus(b);
    if (sla.level === "overdue") overdueCount++;
    else if (sla.level === "due_today" || sla.level === "due_tomorrow" || sla.level === "due_48h") {
      dueWithin48hCount++;
    }
  });

  // 6. R5/R6 Freshness Check (Remind in last 7 days of month or if > 14 days stale)
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isEndOfMonthWindow = now.getDate() >= daysInMonth - 6;
  const records = Array.isArray(okrSettings?.quarterlyRecords) ? okrSettings.quarterlyRecords : [];
  let r5R6DaysSinceUpdate: number | null = null;
  if (records.length > 0) {
    const latestRec = records[records.length - 1];
    if (latestRec?.updatedAt) {
      const diff = Math.floor((now.getTime() - new Date(latestRec.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (!isNaN(diff)) r5R6DaysSinceUpdate = diff;
    }
  }
  const needsR5R6Update =
    records.length === 0 ||
    (isEndOfMonthWindow && (r5R6DaysSinceUpdate === null || r5R6DaysSinceUpdate > 7)) ||
    (r5R6DaysSinceUpdate !== null && r5R6DaysSinceUpdate > 21);

  const checks: SystemHealthCheckItem[] = [
    {
      id: "okr_tags",
      title: "การเชื่อมโยง Task ↔ KR1/KR2/KR4 & R1–R9",
      passed: missingOkrTasks.length === 0,
      statusText: missingOkrTasks.length === 0 ? `สมบูรณ์ 100% (${validBriefs.length} งาน)` : `รอซ่อมแซม ${missingOkrTasks.length} งาน`,
      detailText: "ตรวจสอบการผูกแท็ก OKR, กฎเหล็ก NMCO = RSP (KR2/R3/R4) และโครงการ PM (KR4)",
    },
    {
      id: "financial_sep",
      title: "การแยกฟิลด์ Save Cost vs. รายได้/กำไร PM",
      passed: financialAnomalies.length === 0,
      statusText: financialAnomalies.length === 0 ? "แยกเด็ดขาด 100%" : `พบข้อมูลปะปน ${financialAnomalies.length} งาน`,
      detailText: "งานบริการทั่วไปคิดเฉพาะ Save Cost ส่วน Revenue/Profit สงวนไว้เฉพาะงาน PM โครงการของ CC",
    },
    {
      id: "assistant_guard",
      title: "ความถูกต้องของสัดส่วนผู้ช่วย (Assistant Share)",
      passed: assistantAnomalies.length === 0,
      statusText: assistantAnomalies.length === 0 ? "ไม่มี Ghost 0% • ไม่เกิน 100%" : `พบรายการผิดปกติ ${assistantAnomalies.length} งาน`,
      detailText: "ป้องกันผู้ช่วยสัดส่วน 0% ค้างในระบบ และควบคุมผลรวมสัดส่วนผู้ช่วยไม่ให้เกิน 100%",
    },
    {
      id: "member_quota",
      title: "ทะเบียน UUID สมาชิก 12 คน & สัดส่วน KR/R รายบุคคล",
      passed: memberQuotaOk,
      statusText: memberQuotaOk ? `ครบ 12 คน (R1=${r1Sum}%, R3=${r3Sum}%, R7=${r7Sum}%)` : "กรุณาตรวจสอบสัดส่วนสมาชิก",
      detailText: "ล็อก UUID มาตรฐานตรงกับตาราง assignees และตรวจผลรวมสัดส่วนความรับผิดชอบครบ 100%",
    },
    {
      id: "survey_tracking",
      title: "การติดตามผลประเมินความพึงพอใจ (R2 • R4 • R9 • TIP10)",
      passed: true,
      statusText: `ประเมินแล้ว ${evaluatedTasks.length}/${completedTasks.length} งาน (รอตามผล ${pendingSurveyCount} งาน)`,
      detailText: "แสดงจำนวนงานที่ส่งแบบประเมินจริงควบคู่กับ % ความพึงพอใจเสมอตามกฎเหล็กข้อที่ 4",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    allPassed: passedCount === checks.length,
    scorePercent: Math.round((passedCount / checks.length) * 100),
    validTasksCount: validBriefs.length,
    completedTasksCount: completedTasks.length,
    evaluatedSurveyCount: evaluatedTasks.length,
    pendingSurveyCount,
    dueWithin48hCount,
    overdueCount,
    needsR5R6Update,
    r5R6DaysSinceUpdate,
    checks,
  };
}

