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
import { getStandardPriceForTask } from "./pricing";

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
export async function runAutomatedDatabaseIntegrityHeal(supabase: any): Promise<{ checked: number; healed: number }> {
  if (hasRunSessionIntegrityHeal || !supabase) return { checked: 0, healed: 0 };
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
      const hasStrayPmFields = !isPM && ((Number(d.revenue) || 0) > 0 || (Number(d.profit) || 0) > 0);
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
