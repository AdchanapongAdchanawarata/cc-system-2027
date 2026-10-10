/**
 * Google Sheets (R & KR) Synchronization Utility
 * Supports ALL_KR2026_PROD Google Spreadsheet for Team T18
 * 
 * Target Google Sheet URL:
 * https://docs.google.com/spreadsheets/d/1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0/edit
 * - Tab Data_R (gid=1435414436): Weekly every Friday at 17:00 (Cumulative current total per member)
 * - Tab Data_KR (gid=1942308549): Monthly every last day of month at 17:00 (Cumulative current total for team)
 */

import { 
  isR1Task, 
  isR3Task, 
  isCcPmProject, 
  computeReachEngagementValues, 
  getStoredOKRSettings 
} from '@/utils/okrSettings';

export interface TeamMemberConfig {
  memberId: string;       // CC01 - CC12
  code: string;           // AA, WK, IK, ...
  displayName: string;    // จ๊อบ AA, วา WK, ...
  email: string;          // adchanapong@step.cmu.ac.th, ...
  unit: string;
}

export const TEAM_ID = "T18";
export const TARGET_FY = 2570;

export const TEAM_MEMBERS: TeamMemberConfig[] = [
  { memberId: "CC01", code: "AA", displayName: "จ๊อบ AA", email: "adchanapong@step.cmu.ac.th", unit: "management" },
  { memberId: "CC02", code: "WK", displayName: "วา WK", email: "wasita@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC03", code: "IK", displayName: "ก้อง IK", email: "itsara@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC04", code: "RL", displayName: "จอย RL", email: "ratiporn@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC05", code: "AC", displayName: "พิม AC", email: "autcharaporn@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC06", code: "LLP", displayName: "เยียร์ LLP", email: "lalipat@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC07", code: "STK", displayName: "ลูกอิน STK", email: "suthiarpa@step.cmu.ac.th", unit: "content" },
  { memberId: "CC08", code: "MTN", displayName: "นิน MTN", email: "matanin@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC09", code: "CNB", displayName: "โอ๊ต CNB", email: "chonnikarn@step.cmu.ac.th", unit: "pr" },
  { memberId: "CC10", code: "SRL", displayName: "เอ็นจอย SLR", email: "siriluk@step.cmu.ac.th", unit: "content" },
  { memberId: "CC11", code: "KYK", displayName: "แก้ว KYK", email: "kanyakorn@step.cmu.ac.th", unit: "content" },
  { memberId: "CC12", code: "TTY", displayName: "ต้า TTY", email: "thitiya@step.cmu.ac.th", unit: "pr" },
];

export interface RDefinition {
  rId: string;
  name: string;
  unit: string;
  target: number;
  fy: number;
  description: string;
}

export const R_DEFINITIONS: RDefinition[] = [
  {
    rId: "T18R1",
    name: "จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร",
    unit: "งาน",
    target: 1200,
    fy: 2570,
    description: "จำนวนชิ้นงานภายในองค์กร (STeP) ที่บุคลากรเป็นผู้ดูแลหลักหรือผู้ช่วย"
  },
  {
    rId: "T18R2",
    name: "ร้อยละความพึงพอใจ (ภายในองค์กร)",
    unit: "ร้อยละ",
    target: 85,
    fy: 2570,
    description: "คะแนนความพึงพอใจเฉลี่ย (CSAT %) จากงานภายในองค์กร"
  },
  {
    rId: "T18R3",
    name: "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
    unit: "งาน",
    target: 350,
    fy: 2570,
    description: "จำนวนชิ้นงานภายนอกที่ทำให้ มช. และ RSP"
  },
  {
    rId: "T18R4",
    name: "ร้อยละความพึงพอใจ (ภายนอก มช./RSP)",
    unit: "ร้อยละ",
    target: 85,
    fy: 2570,
    description: "คะแนนความพึงพอใจเฉลี่ย (CSAT %) จากงาน มช. และ RSP"
  },
  {
    rId: "T18R5",
    name: "จำนวน Reach (กรอกผลลัพธ์สะสมในระบบ)",
    unit: "reach",
    target: 6000000,
    fy: 2570,
    description: "ยอด Reach สื่อประชาสัมพันธ์และการเผยแพร่สะสม"
  },
  {
    rId: "T18R6",
    name: "จำนวน Engagement (กรอกผลลัพธ์สะสมในระบบ)",
    unit: "engagements",
    target: 60000,
    fy: 2570,
    description: "ยอด Engagement สื่อประชาสัมพันธ์และการเผยแพร่สะสม"
  },
  {
    rId: "T18R7",
    name: "กำไรที่เกิดจากการให้บริการจากภาครัฐ",
    unit: "บาท",
    target: 1000000,
    fy: 2570,
    description: "กำไรสะสมจากการให้บริการโครงการภาครัฐ"
  },
  {
    rId: "T18R8",
    name: "กำไรที่เกิดจากการให้บริการจากภาคเอกชน",
    unit: "บาท",
    target: 500000,
    fy: 2570,
    description: "กำไรสะสมจากการให้บริการโครงการภาคเอกชน"
  },
  {
    rId: "T18R9",
    name: "ร้อยละความพึงพอใจ (งานบริการสร้างรายได้)",
    unit: "ร้อยละ",
    target: 85,
    fy: 2570,
    description: "คะแนนความพึงพอใจเฉลี่ย (CSAT %) จากงานบริการสร้างรายได้"
  }
];

export interface KRDefinition {
  krId: string;
  name: string;
  unit: string;
  target: number;
  fy: number;
  description: string;
}

export const KR_DEFINITIONS: KRDefinition[] = [
  {
    krId: "T18KR1",
    name: "จำนวนผลงานภายในองค์กรที่สนับสนุนการทำงานขององค์กร",
    unit: "งาน",
    target: 1200,
    fy: 2570,
    description: "จำนวนผลงานภายในองค์กรสะสมรวมทั้งทีม (STeP)"
  },
  {
    krId: "T18KR2",
    name: "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
    unit: "งาน",
    target: 350,
    fy: 2570,
    description: "จำนวนผลงานภายนอกสะสมรวมทั้งทีมที่สนับสนุน มช. และ RSP"
  },
  {
    krId: "T18KR3",
    name: "มูลค่าการรับรู้ที่องค์กรได้รับ",
    unit: "บาท",
    target: 1000000,
    fy: 2570,
    description: "มูลค่าการรับรู้ (Media / PR / Save Cost Value) รวมสะสม"
  },
  {
    krId: "T18KR4",
    name: "กำไรที่เกิดจากการให้บริการของทีม",
    unit: "บาท",
    target: 1500000,
    fy: 2570,
    description: "กำไรสะสมจากการให้บริการของทีมรวมทั้งหมด (ภาครัฐ 1.0M + เอกชน 0.5M)"
  }
];

export interface SheetDataRRow {
  month: string;       // e.g. "SEP"
  week: string;        // e.g. "W4"
  teamId: string;      // "T18"
  memberId: string;    // "CC01" - "CC12"
  rId: string;         // "T18R1" - "T18R9"
  value: number;       // Current cumulative total or 0
  timestamp: string;   // e.g. "9/23/2026 17:00:00"
  updatedBy: string;   // e.g. "adchanapong@step.cmu.ac.th"
  fy: number;          // 2570
}

export interface SheetDataKRRow {
  month: string;       // e.g. "SEP"
  teamId: string;      // "T18"
  krId: string;        // "T18KR1" - "T18KR4"
  value: number;       // Current cumulative total or 0
  timestamp: string;   // e.g. "9/30/2026 17:00:00"
  updatedBy: string;   // e.g. "adchanapong@step.cmu.ac.th"
  fy: number;          // 2570
  reference: string;   // e.g. "รายงานผลการดำเนินงาน CC TEAM ประจำเดือน SEP 2570"
}

// -------------------------------------------------------------
// Date Formatting Helpers
// -------------------------------------------------------------

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function getMonthCode(date: Date = new Date()): string {
  return MONTH_NAMES[date.getMonth()];
}

export function getWeekCode(date: Date = new Date()): string {
  const day = date.getDate();
  const weekNum = Math.min(5, Math.ceil(day / 7));
  return `W${weekNum}`;
}

export function getFiscalYear(date: Date = new Date()): number {
  // Standard Fiscal Year for CC System is 2570 (October 2569 - September 2570 / 2026-2027)
  const month = date.getMonth();
  const yearCE = date.getFullYear();
  const fyCE = month >= 9 ? yearCE + 1 : yearCE;
  const calculatedFY = fyCE + 543;
  return Math.max(TARGET_FY, calculatedFY);
}

export function formatTimestamp(date: Date = new Date()): string {
  // Format matching ALL_KR2026_PROD: M/D/YYYY (no time)
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

// -------------------------------------------------------------
// Computation Engine: Calculate R (Individual) & KR (Team)
// -------------------------------------------------------------

export function calculateAllRRows(
  tasks: any[] = [],
  assignees: any[] = [],
  asOfDate: Date = new Date(),
  updatedBy: string = "adchanapong@step.cmu.ac.th"
): SheetDataRRow[] {
  const month = getMonthCode(asOfDate);
  const week = getWeekCode(asOfDate);
  const fy = getFiscalYear(asOfDate);
  const timestamp = formatTimestamp(asOfDate);

  const rows: SheetDataRRow[] = [];
  const validTasks = (tasks || []).filter(t => t && t.status !== "purged" && !t.details?.is_permanently_deleted && t.status !== "cancelled");

  // Get current stored Reach & Engagement from OKR Settings if available
  const okrSettings = getStoredOKRSettings();
  let latestReach = okrSettings.manualMetrics?.r5Reach || 0;
  let latestEngagement = okrSettings.manualMetrics?.r6Engagement || 0;
  if (okrSettings.quarterlyRecords && okrSettings.quarterlyRecords.length > 0) {
    const sorted = [...okrSettings.quarterlyRecords].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter.localeCompare(a.quarter);
    });
    if (sorted[0]) {
      latestReach = sorted[0].reach;
      latestEngagement = sorted[0].engagement;
    }
  }

  // Count active content and PR members for 50:50 distribution of Reach and Engagement
  const contentMembersCount = TEAM_MEMBERS.filter(m => m.unit === "content").length || 3;
  const prMembersCount = TEAM_MEMBERS.filter(m => m.unit === "pr").length || 2;

  // Match tasks for each of the 12 members
  for (const member of TEAM_MEMBERS) {
    // Find assignee in DB by email or name/code
    const dbAssignee = assignees.find(a => 
      (a.email && member.email && a.email.toLowerCase().trim() === member.email.toLowerCase().trim()) ||
      a.id === member.memberId || 
      (a.name && (a.name.includes(member.code) || a.name.includes(member.displayName)))
    );
    const targetAssigneeId = dbAssignee ? dbAssignee.id : null;

    // Filter member's active tasks (as owner or assistant)
    const memberTasks = validTasks.filter(t => {
      if (!t) return false;
      const isOwner = targetAssigneeId ? t.assignee_id === targetAssigneeId : false;
      const isNameOwner = t.assignee_name && (t.assignee_name.includes(member.code) || t.assignee_name.includes(member.displayName));
      const isAssistant = Array.isArray(t.details?.assistants) && t.details.assistants.some((ast: any) => 
        (targetAssigneeId && ast.assignee_id === targetAssigneeId) ||
        (ast.name && ast.name.includes(member.code))
      );
      return isOwner || isNameOwner || isAssistant;
    });

    // ONLY COMPLETED tasks count for delivered R metrics (R1 - R4)
    const completedTasks = memberTasks.filter(t => t.status === "completed");

    // T18R1: จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร (STeP)
    const internalTasks = completedTasks.filter(t => isR1Task(t));
    const r1Value = internalTasks.length;

    // T18R2: ร้อยละความพึงพอใจ (ภายในองค์กร) - ต้องเป็นคะแนนประเมินจริงเท่านั้น ไม่ใส่ค่าสมมติ
    let internalSatSum = 0;
    let internalSatCnt = 0;
    internalTasks.forEach(t => {
      const details = t.details || {};
      const score = details.satisfaction_scores?.averagePercent;
      if (details.survey_status === 'completed' && score !== undefined && score !== null && Number(score) > 0) {
        internalSatSum += Number(score);
        internalSatCnt++;
      }
    });
    const r2Value = internalSatCnt > 0 
      ? Math.round(internalSatSum / internalSatCnt) 
      : 0;

    // T18R3: จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP
    const externalTasks = completedTasks.filter(t => isR3Task(t));
    const r3Value = externalTasks.length;

    // T18R4: ร้อยละความพึงพอใจ (ภายนอก มช./RSP) - ต้องเป็นคะแนนประเมินจริงเท่านั้น
    let externalSatSum = 0;
    let externalSatCnt = 0;
    externalTasks.forEach(t => {
      const details = t.details || {};
      const score = details.satisfaction_scores?.averagePercent;
      if (details.survey_status === 'completed' && score !== undefined && score !== null && Number(score) > 0) {
        externalSatSum += Number(score);
        externalSatCnt++;
      }
    });
    const r4Value = externalSatCnt > 0 
      ? Math.round(externalSatSum / externalSatCnt) 
      : 0;

    // T18R5: Reach (สะสมประจำตัวตามสัดส่วนยูนิต Content 50% / PR 50% หรือผลลัพธ์ตรงจากงาน)
    let r5Value = 0;
    if (member.unit === "content") {
      r5Value = Math.round((latestReach * 0.5) / contentMembersCount);
    } else if (member.unit === "pr") {
      r5Value = Math.round((latestReach * 0.5) / prMembersCount);
    }
    let taskReachSum = 0;
    for (const t of completedTasks) {
      if (t.details?.reach !== undefined) taskReachSum += Number(t.details.reach) || 0;
      else if (t.details?.views !== undefined) taskReachSum += Number(t.details.views) || 0;
    }
    r5Value = Math.max(r5Value, taskReachSum);

    // T18R6: Engagement (สะสมประจำตัวตามสัดส่วนยูนิต Content 50% / PR 50% หรือผลลัพธ์ตรงจากงาน)
    let r6Value = 0;
    if (member.unit === "content") {
      r6Value = Math.round((latestEngagement * 0.5) / contentMembersCount);
    } else if (member.unit === "pr") {
      r6Value = Math.round((latestEngagement * 0.5) / prMembersCount);
    }
    let taskEngageSum = 0;
    for (const t of completedTasks) {
      if (t.details?.engagement !== undefined) taskEngageSum += Number(t.details.engagement) || 0;
      else if (t.details?.interactions !== undefined) taskEngageSum += Number(t.details.interactions) || 0;
    }
    r6Value = Math.max(r6Value, taskEngageSum);

    // T18R7 & T18R8: กำไรที่เกิดจากการให้บริการจากภาครัฐ/เอกชน (เฉพาะ PM โครงการของ CC)
    let r7Value = 0;
    let r8Value = 0;
    let revenueSatSum = 0;
    let revenueSatCnt = 0;

    memberTasks.forEach(t => {
      const details = t.details || {};
      const isPM = isCcPmProject(t);
      const profit = Number(details.profit !== undefined && details.profit !== null 
        ? details.profit 
        : ((Number(details.revenue) || 0) - (Number(details.cost) || 0)));
      
      if (isPM && profit > 0) {
        const isOwner = targetAssigneeId ? t.assignee_id === targetAssigneeId : false;
        const assistants = (details.assistants || []).filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
        let sharePct = 100;
        if (assistants.length > 0) {
          if (isOwner) {
            const totalAst = assistants.reduce((s: number, a: any) => s + (Number(a.percentage) || 0), 0);
            sharePct = Math.max(0, 100 - totalAst);
          } else {
            const ast = assistants.find((a: any) => a.assignee_id === targetAssigneeId);
            sharePct = Number(ast?.percentage) || 0;
          }
        } else if (!isOwner) {
          sharePct = 0;
        }

        const memberProfit = Math.round((profit * sharePct) / 100);
        const sector = (details.client_sector || details.sector || "").toString().toLowerCase();

        if (sector === "private" || sector === "ภาคเอกชน" || sector === "เอกชน") {
          r8Value += memberProfit;
        } else if (sector === "government" || sector === "ภาครัฐ") {
          r7Value += memberProfit;
        } else {
          r7Value += Math.round(memberProfit * 0.7);
          r8Value += Math.round(memberProfit * 0.3);
        }

        const score = details.satisfaction_scores?.averagePercent;
        if (details.survey_status === 'completed' && score !== undefined && score !== null && Number(score) > 0) {
          revenueSatSum += Number(score);
          revenueSatCnt++;
        }
      }
    });

    // T18R9: ร้อยละความพึงพอใจ (งานบริการสร้างรายได้) - ต้องเป็นคะแนนประเมินจริงเท่านั้น
    const r9Value = revenueSatCnt > 0 
      ? Math.round(revenueSatSum / revenueSatCnt) 
      : 0;

    const valuesMap: Record<string, number> = {
      T18R1: r1Value,
      T18R2: r2Value,
      T18R3: r3Value,
      T18R4: r4Value,
      T18R5: r5Value,
      T18R6: r6Value,
      T18R7: r7Value,
      T18R8: r8Value,
      T18R9: r9Value,
    };

    // Push 9 rows for this member
    for (const rDef of R_DEFINITIONS) {
      rows.push({
        month,
        week,
        teamId: TEAM_ID,
        memberId: member.memberId,
        rId: rDef.rId,
        value: valuesMap[rDef.rId] ?? 0,
        timestamp,
        updatedBy: member.email || updatedBy,
        fy,
      });
    }
  }

  return rows;
}

export function calculateAllKRRows(
  tasks: any[] = [],
  asOfDate: Date = new Date(),
  updatedBy: string = "adchanapong@step.cmu.ac.th"
): SheetDataKRRow[] {
  const month = getMonthCode(asOfDate);
  const fy = getFiscalYear(asOfDate);
  const timestamp = formatTimestamp(asOfDate);
  const validTasks = (tasks || []).filter(t => t && t.status !== "purged" && !t.details?.is_permanently_deleted && t.status !== "cancelled");

  // ONLY COMPLETED tasks count toward delivered KR achievements
  const completedTasks = validTasks.filter(t => t.status === "completed");

  // T18KR1: จำนวนผลงานภายในองค์กร (STeP)
  const kr1Value = completedTasks.filter(t => !isR3Task(t)).length;

  // T18KR2: จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP
  const kr2Value = completedTasks.filter(t => isR3Task(t)).length;

  // T18KR3: มูลค่าการรับรู้ที่องค์กรได้รับ (Media / PR / Save Cost Value)
  const okrSettings = getStoredOKRSettings();
  let manualR5 = okrSettings.manualMetrics?.r5Reach || 0;
  let manualR6 = okrSettings.manualMetrics?.r6Engagement || 0;
  if (okrSettings.quarterlyRecords && okrSettings.quarterlyRecords.length > 0) {
    const sorted = [...okrSettings.quarterlyRecords].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter.localeCompare(a.quarter);
    });
    if (sorted[0]) {
      manualR5 = sorted[0].reach;
      manualR6 = sorted[0].engagement;
    }
  }

  const { totalValueBaht } = computeReachEngagementValues(manualR5, manualR6, 6000000, 60000);
  const totalCompletedSaveCost = completedTasks.reduce((sum, t) => sum + (Number(t.details?.save_cost) || 0), 0);
  const kr3Value = totalValueBaht > 0 ? totalValueBaht : totalCompletedSaveCost;

  // T18KR4: กำไรที่เกิดจากการให้บริการของทีม (เฉพาะ PM โครงการของ CC เท่านั้น)
  let kr4Value = 0;
  for (const t of validTasks) {
    if (!t) continue;
    if (isCcPmProject(t)) {
      const profit = Number(t.details?.profit !== undefined && t.details?.profit !== null
        ? t.details.profit 
        : ((Number(t.details?.revenue) || 0) - (Number(t.details?.cost) || 0)));
      if (profit > 0) {
        kr4Value += profit;
      }
    }
  }

  const valuesMap: Record<string, { value: number; ref: string }> = {
    T18KR1: {
      value: kr1Value,
      ref: `ผลงานภายในองค์กร CC Team ประจำเดือน ${month} ${fy} (รวมสะสม ${kr1Value} ชิ้นงาน)`
    },
    T18KR2: {
      value: kr2Value,
      ref: `ผลงานสนับสนุน มช. และ RSP ประจำเดือน ${month} ${fy} (รวมสะสม ${kr2Value} ชิ้นงาน)`
    },
    T18KR3: {
      value: kr3Value,
      ref: `มูลค่าการรับรู้และ Save Cost สื่อสารองค์กร ประจำเดือน ${month} ${fy} (รวมสะสม ฿${kr3Value.toLocaleString()})`
    },
    T18KR4: {
      value: kr4Value,
      ref: `กำไรจากการให้บริการโครงการของทีม CC ประจำเดือน ${month} ${fy} (รวมสะสม ฿${kr4Value.toLocaleString()})`
    }
  };

  return KR_DEFINITIONS.map(krDef => ({
    month,
    teamId: TEAM_ID,
    krId: krDef.krId,
    value: valuesMap[krDef.krId]?.value ?? 0,
    timestamp,
    updatedBy,
    fy,
    reference: valuesMap[krDef.krId]?.ref ?? ""
  }));
}

// -------------------------------------------------------------
// Formatters for Google Sheet Paste (TSV) & Download (CSV)
// -------------------------------------------------------------

export function rRowsToTSV(rows: SheetDataRRow[]): string {
  // Google Sheets Tab-Separated Values (no header row for direct paste at the bottom)
  return rows
    .map(r => `${r.month}\t${r.week}\t${r.teamId}\t${r.memberId}\t${r.rId}\t${r.value}\t${r.timestamp}\t${r.updatedBy}\t${r.fy}`)
    .join('\n');
}

export function rRowsToCSV(rows: SheetDataRRow[]): string {
  const header = "Month,Week,TeamID,MemberID,R_ID,Value,Timestamp,UpdatedBy,FY";
  const lines = rows.map(r => 
    `"${r.month}","${r.week}","${r.teamId}","${r.memberId}","${r.rId}",${r.value},"${r.timestamp}","${r.updatedBy}",${r.fy}`
  );
  return [header, ...lines].join('\n');
}

export function krRowsToTSV(rows: SheetDataKRRow[]): string {
  return rows
    .map(r => `${r.month}\t${r.teamId}\t${r.krId}\t${r.value}\t${r.timestamp}\t${r.updatedBy}\t${r.fy}\t${r.reference.replace(/\t/g, ' ')}`)
    .join('\n');
}

export function krRowsToCSV(rows: SheetDataKRRow[]): string {
  const header = "Month,TeamID,KR_ID,Value,Timestamp,UpdatedBy,FY,Reference";
  const lines = rows.map(r => 
    `"${r.month}","${r.teamId}","${r.krId}",${r.value},"${r.timestamp}","${r.updatedBy}",${r.fy},"${r.reference.replace(/"/g, '""')}"`
  );
  return [header, ...lines].join('\n');
}

// -------------------------------------------------------------
// Ready-to-deploy Google Apps Script Code
// -------------------------------------------------------------

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script Web App for ALL_KR2026_PROD
 * Spreadsheet ID: 1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0
 * 
 * Features:
 * - Smart Upsert: Updates existing rows in-place by Primary Key (ZERO DUPLICATES!)
 * - Script Lock: Prevents simultaneous writes and race conditions
 * - Deduplicate Tool: Run 'deduplicateSheets()' in Apps Script to clean past duplicates
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Replace all code with this script
 * 4. Click Deploy > Manage Deployments > Edit (or New Deployment)
 * 5. Select type: "Web app"
 * 6. Set Description: "CC System Sync Webhook (Anti-Duplicate Upsert)"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click Deploy and copy the Web App URL into CC System!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30s
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Script lock timeout" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ------------------------------------------------------------------
    // 1. Data_R (Weekly 9 metrics per member) - Composite Key: Month_Week_TeamID_MemberID_R_ID
    // ------------------------------------------------------------------
    if (payload.type === "Data_R") {
      var sheet = ss.getSheetByName("Data_R");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet Data_R not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var rows = payload.rows || [];
      var lastRow = sheet.getLastRow();
      
      // Index existing rows
      var existingMap = {};
      if (lastRow > 1) {
        var existingData = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
        for (var i = 0; i < existingData.length; i++) {
          var k = String(existingData[i][0]).trim() + "_" + 
                  String(existingData[i][1]).trim() + "_" + 
                  String(existingData[i][2]).trim() + "_" + 
                  String(existingData[i][3]).trim() + "_" + 
                  String(existingData[i][4]).trim();
          existingMap[k] = i + 2; // 1-indexed row in sheet
        }
      }

      var rowsToAppend = [];
      var updatedCount = 0;

      for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        var rowKey = String(r.month).trim() + "_" + 
                     String(r.week).trim() + "_" + 
                     String(r.teamId).trim() + "_" + 
                     String(r.memberId).trim() + "_" + 
                     String(r.rId).trim();

        if (existingMap[rowKey]) {
          // Row already exists! Update in-place (Value, Timestamp, UpdatedBy, FY)
          var targetRow = existingMap[rowKey];
          sheet.getRange(targetRow, 6, 1, 4).setValues([[r.value, r.timestamp, r.updatedBy, r.fy]]);
          updatedCount++;
        } else {
          // New row to append
          rowsToAppend.push([r.month, r.week, r.teamId, r.memberId, r.rId, r.value, r.timestamp, r.updatedBy, r.fy]);
        }
      }

      if (rowsToAppend.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rowsToAppend.length, 9).setValues(rowsToAppend);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        type: "Data_R", 
        inserted: rowsToAppend.length, 
        updated: updatedCount,
        total: rows.length
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ------------------------------------------------------------------
    // 2. Data_KR (Monthly 4 metrics for team) - Composite Key: Month_TeamID_KR_ID
    // ------------------------------------------------------------------
    if (payload.type === "Data_KR") {
      var sheet = ss.getSheetByName("Data_KR");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet Data_KR not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var rows = payload.rows || [];
      var lastRow = sheet.getLastRow();
      
      // Index existing rows
      var existingMap = {};
      if (lastRow > 1) {
        var existingData = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < existingData.length; i++) {
          var k = String(existingData[i][0]).trim() + "_" + 
                  String(existingData[i][1]).trim() + "_" + 
                  String(existingData[i][2]).trim();
          existingMap[k] = i + 2;
        }
      }

      var rowsToAppend = [];
      var updatedCount = 0;

      for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        var rowKey = String(r.month).trim() + "_" + 
                     String(r.teamId).trim() + "_" + 
                     String(r.krId).trim();

        if (existingMap[rowKey]) {
          // Row already exists! Update in-place (Value, Timestamp, UpdatedBy, FY, Reference)
          var targetRow = existingMap[rowKey];
          sheet.getRange(targetRow, 4, 1, 5).setValues([[r.value, r.timestamp, r.updatedBy, r.fy, r.reference || ""]]);
          updatedCount++;
        } else {
          // New row to append
          rowsToAppend.push([r.month, r.teamId, r.krId, r.value, r.timestamp, r.updatedBy, r.fy, r.reference || ""]);
        }
      }

      if (rowsToAppend.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rowsToAppend.length, 8).setValues(rowsToAppend);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        type: "Data_KR", 
        inserted: rowsToAppend.length, 
        updated: updatedCount,
        total: rows.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown payload type" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    system: "CC TEAM Google Sheet Sync Connector",
    spreadsheet: "ALL_KR2026_PROD",
    mode: "Smart Upsert (Anti-Duplicate Enabled)",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันทำความสะอาดข้อมูลซ้ำซ้อนในชีต Data_R และ Data_KR
 * (เลือกฟังก์ชันนี้แล้วกดปุ่ม Run ได้เลยในหน้า Apps Script)
 */
function deduplicateSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ทำความสะอาด Data_R
  var sheetR = ss.getSheetByName("Data_R");
  if (sheetR) {
    var lastRowR = sheetR.getLastRow();
    if (lastRowR > 1) {
      var allDataR = sheetR.getRange(2, 1, lastRowR - 1, 9).getValues();
      var seenR = {};
      var uniqueDataR = [];
      // วนลูปจากล่างขึ้นบนเพื่อเก็บแถวล่าสุดไว้
      for (var i = allDataR.length - 1; i >= 0; i--) {
        var r = allDataR[i];
        var k = String(r[0]).trim() + "_" + String(r[1]).trim() + "_" + String(r[2]).trim() + "_" + String(r[3]).trim() + "_" + String(r[4]).trim();
        if (k !== "____" && !seenR[k]) {
          seenR[k] = true;
          uniqueDataR.unshift(r);
        }
      }
      sheetR.getRange(2, 1, lastRowR - 1, 9).clearContent();
      if (uniqueDataR.length > 0) {
        sheetR.getRange(2, 1, uniqueDataR.length, 9).setValues(uniqueDataR);
      }
      Logger.log("Data_R ล้างข้อมูลซ้ำเรียบร้อย: เหลือ " + uniqueDataR.length + " แถวจากเดิม " + allDataR.length);
    }
  }

  // 2. ทำความสะอาด Data_KR
  var sheetKR = ss.getSheetByName("Data_KR");
  if (sheetKR) {
    var lastRowKR = sheetKR.getLastRow();
    if (lastRowKR > 1) {
      var allDataKR = sheetKR.getRange(2, 1, lastRowKR - 1, 8).getValues();
      var seenKR = {};
      var uniqueDataKR = [];
      for (var j = allDataKR.length - 1; j >= 0; j--) {
        var kr = allDataKR[j];
        var kk = String(kr[0]).trim() + "_" + String(kr[1]).trim() + "_" + String(kr[2]).trim();
        if (kk !== "__" && !seenKR[kk]) {
          seenKR[kk] = true;
          uniqueDataKR.unshift(kr);
        }
      }
      sheetKR.getRange(2, 1, lastRowKR - 1, 8).clearContent();
      if (uniqueDataKR.length > 0) {
        sheetKR.getRange(2, 1, uniqueDataKR.length, 8).setValues(uniqueDataKR);
      }
      Logger.log("Data_KR ล้างข้อมูลซ้ำเรียบร้อย: เหลือ " + uniqueDataKR.length + " แถวจากเดิม " + allDataKR.length);
    }
  }
}
`;
