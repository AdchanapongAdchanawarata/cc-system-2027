/**
 * Google Sheets (R & KR) Synchronization Utility
 * Supports ALL_KR2026_PROD Google Spreadsheet for Team T18
 * 
 * Target Google Sheet URL:
 * https://docs.google.com/spreadsheets/d/1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0/edit
 * - Tab Data_R (gid=1435414436): Weekly every Friday at 17:00 (Cumulative current total per member)
 * - Tab Data_KR (gid=1942308549): Monthly every last day of month at 17:00 (Cumulative current total for team)
 */

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
  { memberId: "CC07", code: "STK", displayName: "ลูกอิน STK", email: "suthiarpa@step.cmu.ac.th", unit: "pr" },
  { memberId: "CC08", code: "MTN", displayName: "นิน MTN", email: "matanin@step.cmu.ac.th", unit: "creative" },
  { memberId: "CC09", code: "CNB", displayName: "โอ๊ต CNB", email: "chonnikarn@step.cmu.ac.th", unit: "pr" },
  { memberId: "CC10", code: "SRL", displayName: "เอ็นจอย SLR", email: "siriluk@step.cmu.ac.th", unit: "content" },
  { memberId: "CC11", code: "KYK", displayName: "แก้ว KYK", email: "kanyakorn@step.cmu.ac.th", unit: "content" },
  { memberId: "CC12", code: "TTY", displayName: "ต้า TTY", email: "thitiya@step.cmu.ac.th", unit: "content" },
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

  // Match tasks for each of the 12 members
  for (const member of TEAM_MEMBERS) {
    // Find assignee ID in DB that matches this member
    const dbAssignee = assignees.find(a => 
      a.id === member.memberId || 
      (a.name && (a.name.includes(member.code) || a.name.includes(member.displayName)))
    );
    const targetAssigneeId = dbAssignee ? dbAssignee.id : null;

    // Filter member's tasks (as owner or assistant)
    const memberTasks = tasks.filter(t => {
      if (!t) return false;
      const isOwner = targetAssigneeId ? t.assignee_id === targetAssigneeId : false;
      const isNameOwner = t.assignee_name && (t.assignee_name.includes(member.code) || t.assignee_name.includes(member.displayName));
      const isAssistant = Array.isArray(t.details?.assistants) && t.details.assistants.some((ast: any) => 
        (targetAssigneeId && ast.assignee_id === targetAssigneeId) ||
        (ast.name && ast.name.includes(member.code))
      );
      return isOwner || isNameOwner || isAssistant;
    });

    // Compute metrics
    // T18R1: จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร (STeP)
    const internalTasks = memberTasks.filter(t => {
      const sector = t.details?.client_sector || (t as any).client_sector || "";
      const team = t.details?.team || (t as any).team || "";
      const isInternalUnit = t.unit?.toLowerCase() === "internal";
      return isInternalUnit || sector === "STeP" || team === "STeP" || (!sector && !team);
    });
    const r1Value = internalTasks.length;

    // T18R2: ร้อยละความพึงพอใจ (ภายในองค์กร)
    const internalScores = internalTasks
      .map(t => Number(t.details?.satisfaction_scores?.averagePercent))
      .filter(s => !isNaN(s) && s > 0);
    const r2Value = internalScores.length > 0 
      ? Math.round(internalScores.reduce((a, b) => a + b, 0) / internalScores.length)
      : (r1Value > 0 ? 85 : 0);

    // T18R3: จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP
    const cmuRspTasks = memberTasks.filter(t => {
      const sector = t.details?.client_sector || (t as any).client_sector || "";
      const team = t.details?.team || (t as any).team || "";
      return sector === "CMU" || sector === "RSP" || team === "CMU" || team === "RSP";
    });
    const r3Value = cmuRspTasks.length;

    // T18R4: ร้อยละความพึงพอใจ (ภายนอก มช./RSP)
    const cmuRspScores = cmuRspTasks
      .map(t => Number(t.details?.satisfaction_scores?.averagePercent))
      .filter(s => !isNaN(s) && s > 0);
    const r4Value = cmuRspScores.length > 0
      ? Math.round(cmuRspScores.reduce((a, b) => a + b, 0) / cmuRspScores.length)
      : (r3Value > 0 ? 85 : 0);

    // T18R5: จำนวน Reach (กรอกผลลัพธ์สะสมในระบบ)
    let r5Value = 0;
    for (const t of memberTasks) {
      if (t.details?.reach !== undefined) r5Value += Number(t.details.reach) || 0;
      else if (t.details?.views !== undefined) r5Value += Number(t.details.views) || 0;
      else if (t.unit?.toLowerCase() === "pr") r5Value += 5000; // estimated fallback per PR post
    }

    // T18R6: จำนวน Engagement (กรอกผลลัพธ์สะสมในระบบ)
    let r6Value = 0;
    for (const t of memberTasks) {
      if (t.details?.engagement !== undefined) r6Value += Number(t.details.engagement) || 0;
      else if (t.details?.interactions !== undefined) r6Value += Number(t.details.interactions) || 0;
      else if (t.unit?.toLowerCase() === "content") r6Value += 200;
    }

    // T18R7: กำไรที่เกิดจากการให้บริการจากภาครัฐ
    let r7Value = 0;
    const govTasks = memberTasks.filter(t => {
      const sector = t.details?.client_sector || (t as any).client_sector || "";
      return sector === "government" || sector === "ภาครัฐ";
    });
    for (const t of govTasks) {
      const profit = Number(t.details?.profit || t.profit || 0);
      r7Value += profit > 0 ? profit : (Number(t.details?.save_cost) || 0);
    }

    // T18R8: กำไรที่เกิดจากการให้บริการจากภาคเอกชน
    let r8Value = 0;
    const pvtTasks = memberTasks.filter(t => {
      const sector = t.details?.client_sector || (t as any).client_sector || "";
      return sector === "private" || sector === "ภาคเอกชน" || sector === "เอกชน";
    });
    for (const t of pvtTasks) {
      const profit = Number(t.details?.profit || t.profit || 0);
      r8Value += profit > 0 ? profit : (Number(t.details?.save_cost) || 0);
    }

    // T18R9: ร้อยละความพึงพอใจ (งานบริการสร้างรายได้)
    const revenueTasks = [...govTasks, ...pvtTasks];
    const revScores = revenueTasks
      .map(t => Number(t.details?.satisfaction_scores?.averagePercent))
      .filter(s => !isNaN(s) && s > 0);
    const r9Value = revScores.length > 0
      ? Math.round(revScores.reduce((a, b) => a + b, 0) / revScores.length)
      : (revenueTasks.length > 0 ? 85 : 0);

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

  // T18KR1: จำนวนผลงานภายในองค์กรที่สนับสนุนการทำงานขององค์กร
  const internalTasks = tasks.filter(t => {
    if (!t) return false;
    const sector = t.details?.client_sector || (t as any).client_sector || "";
    const team = t.details?.team || (t as any).team || "";
    const isInternalUnit = t.unit?.toLowerCase() === "internal";
    return isInternalUnit || sector === "STeP" || team === "STeP" || (!sector && !team);
  });
  const kr1Value = internalTasks.length;

  // T18KR2: จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP
  const cmuRspTasks = tasks.filter(t => {
    if (!t) return false;
    const sector = t.details?.client_sector || (t as any).client_sector || "";
    const team = t.details?.team || (t as any).team || "";
    return sector === "CMU" || sector === "RSP" || team === "CMU" || team === "RSP";
  });
  const kr2Value = cmuRspTasks.length;

  // T18KR3: มูลค่าการรับรู้ที่องค์กรได้รับ
  let kr3Value = 0;
  for (const t of tasks) {
    if (!t) continue;
    const saveCost = Number(t.details?.save_cost) || 0;
    const prValue = Number(t.details?.pr_value || t.details?.media_value) || 0;
    kr3Value += prValue > 0 ? prValue : saveCost;
  }

  // T18KR4: กำไรที่เกิดจากการให้บริการของทีม
  let kr4Value = 0;
  for (const t of tasks) {
    if (!t) continue;
    const isPM = (t.details?.category || (t as any).category) === "PM โครงการของ CC";
    const profit = Number(t.details?.profit !== undefined ? t.details.profit : ((Number(t.details?.revenue) || 0) - (Number(t.details?.cost) || 0)));
    if (profit > 0) {
      kr4Value += profit;
    } else {
      const sector = t.details?.client_sector || (t as any).client_sector || "";
      if (sector === "government" || sector === "private") {
        kr4Value += Number(t.details?.save_cost) || 0;
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
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Replace all code with this script
 * 4. Click Deploy > New Deployment
 * 5. Select type: "Web app"
 * 6. Set Description: "CC System Sync Webhook"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click Deploy and copy the Web App URL into CC System!
 */

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (payload.type === "Data_R") {
      var sheet = ss.getSheetByName("Data_R");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet Data_R not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var rows = payload.rows || [];
      // Expected columns: Month, Week, TeamID, MemberID, R_ID, Value, Timestamp, UpdatedBy, FY
      var appendData = rows.map(function(r) {
        return [r.month, r.week, r.teamId, r.memberId, r.rId, r.value, r.timestamp, r.updatedBy, r.fy];
      });
      if (appendData.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, appendData.length, 9).setValues(appendData);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "Data_R", inserted: appendData.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.type === "Data_KR") {
      var sheet = ss.getSheetByName("Data_KR");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet Data_KR not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var rows = payload.rows || [];
      // Expected columns: Month, TeamID, KR_ID, Value, Timestamp, UpdatedBy, FY, Reference
      var appendData = rows.map(function(r) {
        return [r.month, r.teamId, r.krId, r.value, r.timestamp, r.updatedBy, r.fy, r.reference || ""];
      });
      if (appendData.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, appendData.length, 8).setValues(appendData);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "Data_KR", inserted: appendData.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown payload type" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    system: "CC TEAM Google Sheet Sync Connector",
    spreadsheet: "ALL_KR2026_PROD",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
