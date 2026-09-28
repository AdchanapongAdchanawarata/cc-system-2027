// src/utils/okrSettings.ts
// ระบบจัดการและคำนวณตัวชี้วัด KR/R และ KPI/TIP ทีม CC
import { createClient } from "./supabase/client";

export interface RMetric {
  code: string;           // R1, R2, ..., R9
  krCode: string;         // KR1, KR2, KR3, KR4
  name: string;           // e.g. "จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร"
  weightDescription: string; // e.g. "100% ของเป้าหมาย KR1", "≥85%"
  weightPercent: number;  // 100, 85, 70, 30 etc.
  targetValue: number;    // 1200, 85, 350, 6000000 etc.
  unit: string;           // "งาน", "%", "บาท", "reach", "engagement"
  isCurrency?: boolean;
  isPercentage?: boolean;
  manualInput?: boolean;  // R5, R6 are manually entered
  manualValue?: number;   // stored manual value
}

export interface KRMetric {
  code: string;           // KR1, KR2, KR3, KR4
  name: string;           // e.g. "จำนวนผลงานภายในองค์กรที่สนับสนุนการทำงานขององค์กร"
  weightPercent: number;  // 60%, 10%, 10%, 20%
  baseTarget: number;     // 1200, 350, 1000000, 1500000
  unit: string;           // "งาน", "บาท"
  isCurrency?: boolean;
  rMetrics: RMetric[];
}

export interface TIPMetric {
  code: string;           // TIP1, TIP2, TIP9, TIP10
  name: string;           // e.g. "Total Value Creation"
  description: string;    // e.g. "มูลค่ารวมของโครงการทั้งของภาครัฐและเอกชน"
  weightPercent: number;  // 20%, 10%, 50%, 20%
  baseTarget: number;     // 3000000, 1000000, 15000000, 85
  unit: string;           // "บาท", "%"
  isCurrency?: boolean;
  isPercentage?: boolean;
}

export interface MemberMetricResponsibility {
  memberId: string;
  memberName: string;
  // % responsibility for each R metric (0 - 100)
  rResponsibilities: Record<string, number>; 
  // % responsibility for each TIP metric (0 - 100)
  tipResponsibilities: Record<string, number>;
}

export type SurveyStatus = 'sent' | 'completed' | 'declined';

export interface SatisfactionScores {
  accuracy: number;       // 1 - 5 (ความถูกต้องสมบูรณ์)
  timeliness: number;     // 1 - 5 (ความตรงต่อเวลา)
  quality: number;        // 1 - 5 (งานมีคุณภาพตรงตามบรีฟ)
  attentiveness: number;  // 1 - 5 (มีมนุษยสัมพันธ์ดี เอาใจใส่ต่องาน)
  ownership: number;      // 1 - 5 (มีความเป็นเจ้าของงาน)
  averagePercent: number; // 0 - 100%
  comment?: string;       // ข้อเสนอแนะเพิ่มเติม
  evaluatedBy?: string;   // PM หรือ Requester
  evaluatedAt?: string;   // ISO string
  status?: SurveyStatus;  // 'sent' | 'completed' | 'declined'
}

export interface SatisfactionAnalytics {
  overallAverage: number;
  totalCompletedTasks: number;
  evaluatedCount: number; // ทำแบบประเมินแล้ว
  sentCount: number;      // ส่งแบบประเมินแล้ว (รอทำ)
  declinedCount: number;  // ไม่ทำแบบประเมิน (ค่ามาตรฐาน 85%)
  responseRate: number;
  dimensions: {
    accuracy: number;     // 1 - 5
    timeliness: number;   // 1 - 5
    quality: number;      // 1 - 5
    attentiveness: number;// 1 - 5
    ownership: number;    // 1 - 5
  };
  byUnit: Record<string, { count: number; average: number }>;
}

export interface MemberPacingMetric {
  code: string;
  name: string;
  type: "KR" | "R" | "TIP";
  unit: string;
  isCurrency: boolean;
  isSatisfaction: boolean;
  allocationPct: number;
  annualTarget: number;
  quarterlyTarget: number;
  monthlyTarget: number;
  weeklyTarget: number;
  actualAchieved: number;
  actualThisWeek: number;
  actualThisMonth: number;
  actualThisQuarter: number;
  weeklyExpected: number;
  monthlyExpected: number;
  quarterlyExpected: number;
  weeklyStatus: "on_track" | "at_risk" | "behind";
  monthlyStatus: "on_track" | "at_risk" | "behind";
  quarterlyStatus: "on_track" | "at_risk" | "behind";
  weeklyPacingPct: number;
  monthlyPacingPct: number;
  quarterlyPacingPct: number;
  alertNote?: string;
}

export interface MemberPacingSummary {
  memberId: string;
  memberName: string;
  fiscalYear: number;
  thaiFiscalYear: number;
  currentQuarter: number; // 1 - 4 (Fiscal Quarter: Q1=Oct-Dec, Q2=Jan-Mar, Q3=Apr-Jun, Q4=Jul-Sep)
  currentWeekOfYear: number; // 1 - 52 (Fiscal week)
  currentMonthOfYear: number; // 1 - 12 (Fiscal month: Oct=1 ... Sep=12)
  currentWeekOfQuarter: number; // 1 - 13
  fiscalPeriodLabel: string;
  totalMetricsCount: number;
  totalTasksThisWeek: number;
  totalTasksThisMonth: number;
  totalTasksThisQuarter: number;
  monthlyAtRiskCount: number;
  monthlyBehindCount: number;
  quarterlyAtRiskCount: number;
  quarterlyBehindCount: number;
  weeklyAtRiskCount?: number;
  weeklyBehindCount?: number;
  metrics: MemberPacingMetric[];
}

export interface QuarterlyRecord {
  id: string;
  year: number;             // e.g. 2026
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  reach: number;            // ผลลัพธ์ Reach จริง
  engagement: number;       // ผลลัพธ์ Engagement จริง
  reachValueBaht: number;   // มูลค่าเงิน Reach คำนวณ (฿)
  engagementValueBaht: number; // มูลค่าเงิน Engagement คำนวณ (฿)
  totalValueBaht: number;   // มูลค่าการรับรู้รวม (฿)
  recordedAt: string;       // ISO timestamp
  note?: string;
}

export interface QuarterGrowthResult {
  qoqReachPercent: number | null;
  qoqEngagePercent: number | null;
  qoqValuePercent: number | null;
  yoyReachPercent: number | null;
  yoyEngagePercent: number | null;
  yoyValuePercent: number | null;
}

export interface OKRSettingsState {
  krs: KRMetric[];
  tips: TIPMetric[];
  memberResponsibilities: MemberMetricResponsibility[];
  manualMetrics: {
    r5Reach: number;       // R5: Manual Reach
    r6Engagement: number;  // R6: Manual Engagement
  };
  quarterlyRecords?: QuarterlyRecord[];
  lastUpdated?: string;
}

// -------------------------------------------------------------
// DEFAULT DATA DEFINITION (ตามข้อกำหนดเป๊ะ)
// -------------------------------------------------------------
export const DEFAULT_KRS: KRMetric[] = [
  {
    code: "KR1",
    name: "จำนวนผลงานภายในองค์กรที่สนับสนุนการทำงานขององค์กร",
    weightPercent: 60,
    baseTarget: 1200,
    unit: "งาน",
    rMetrics: [
      {
        code: "R1",
        krCode: "KR1",
        name: "จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร",
        weightDescription: "100% ของเป้าหมาย KR1",
        weightPercent: 100,
        targetValue: 1200,
        unit: "งาน"
      },
      {
        code: "R2",
        krCode: "KR1",
        name: "ร้อยละความพึงพอใจ (ภายในองค์กร)",
        weightDescription: "≥85%",
        weightPercent: 85,
        targetValue: 85.0,
        unit: "%",
        isPercentage: true
      }
    ]
  },
  {
    code: "KR2",
    name: "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
    weightPercent: 10,
    baseTarget: 350,
    unit: "งาน",
    rMetrics: [
      {
        code: "R3",
        krCode: "KR2",
        name: "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
        weightDescription: "100% ของเป้าหมาย KR2",
        weightPercent: 100,
        targetValue: 350,
        unit: "งาน"
      },
      {
        code: "R4",
        krCode: "KR2",
        name: "ร้อยละความพึงพอใจ (ภายนอก มช./RSP)",
        weightDescription: "≥85%",
        weightPercent: 85,
        targetValue: 85.0,
        unit: "%",
        isPercentage: true
      }
    ]
  },
  {
    code: "KR3",
    name: "มูลค่าการรับรู้ที่องค์กรได้รับ",
    weightPercent: 10,
    baseTarget: 1000000,
    unit: "บาท",
    isCurrency: true,
    rMetrics: [
      {
        code: "R5",
        krCode: "KR3",
        name: "จำนวน Reach (กรอกผลลัพธ์สะสมในระบบ)",
        weightDescription: "เป้าหมาย 6,000,000 Reach",
        weightPercent: 70,
        targetValue: 6000000,
        unit: "reach",
        manualInput: true,
        manualValue: 0
      },
      {
        code: "R6",
        krCode: "KR3",
        name: "จำนวน Engagement (กรอกผลลัพธ์สะสมในระบบ)",
        weightDescription: "เป้าหมาย 60,000 Engagements",
        weightPercent: 30,
        targetValue: 60000,
        unit: "engagements",
        manualInput: true,
        manualValue: 0
      }
    ]
  },
  {
    code: "KR4",
    name: "กำไรที่เกิดจากการให้บริการของทีม",
    weightPercent: 20,
    baseTarget: 1500000,
    unit: "บาท",
    isCurrency: true,
    rMetrics: [
      {
        code: "R7",
        krCode: "KR4",
        name: "กำไรบริการภาครัฐ",
        weightDescription: "เป้าหมาย 1,000,000 บาท",
        weightPercent: 70,
        targetValue: 1000000,
        unit: "บาท",
        isCurrency: true
      },
      {
        code: "R8",
        krCode: "KR4",
        name: "กำไรบริการภาคเอกชน",
        weightDescription: "เป้าหมาย 500,000 บาท",
        weightPercent: 30,
        targetValue: 500000,
        unit: "บาท",
        isCurrency: true
      },
      {
        code: "R9",
        krCode: "KR4",
        name: "ร้อยละความพึงพอใจ (งานบริการสร้างรายได้)",
        weightDescription: "≥85%",
        weightPercent: 85,
        targetValue: 85.0,
        unit: "%",
        isPercentage: true
      }
    ]
  }
];

export const DEFAULT_TIPS: TIPMetric[] = [
  {
    code: "TIP1",
    name: "Total Value Creation",
    description: "มูลค่ารวมของโครงการทั้งของภาครัฐและเอกชน (รวม R7 + R8)",
    weightPercent: 20,
    baseTarget: 3000000,
    unit: "บาท",
    isCurrency: true
  },
  {
    code: "TIP2",
    name: "Industrial Income",
    description: "มูลค่ารวมของโครงการเฉพาะเอกชน (จาก R8 ค่าเดียว)",
    weightPercent: 10,
    baseTarget: 1000000,
    unit: "บาท",
    isCurrency: true
  },
  {
    code: "TIP9",
    name: "Economic Impact",
    description: "ผลกระทบทางเศรษฐกิจของทุกโครงการ (คำนวณจาก TIP1 × 5 เท่า Multiplier)",
    weightPercent: 50,
    baseTarget: 15000000,
    unit: "บาท",
    isCurrency: true
  },
  {
    code: "TIP10",
    name: "Overall Satisfaction",
    description: "ความพึงพอใจจากการให้บริการ (ค่าเฉลี่ยความพึงพอใจทุกงานที่ประเมินแล้ว)",
    weightPercent: 20,
    baseTarget: 85.0,
    unit: "%",
    isPercentage: true
  }
];

export const SATISFACTION_CRITERIA = [
  {
    id: "accuracy",
    key: "accuracy",
    name: "ความถูกต้องสมบูรณ์ (Accuracy)",
    description: "ประเมินความสมบูรณ์และถูกต้องของงานตามบรีฟที่ส่งเข้ามา"
  },
  {
    id: "timeliness",
    key: "timeliness",
    name: "ความตรงต่อเวลา (Timeliness)",
    description: "ประเมินการส่งมอบงานตรงตามกรอบเวลาที่ได้ตกลงกันไว้"
  },
  {
    id: "quality",
    key: "quality",
    name: "งานมีคุณภาพตรงตามบรีฟ (Quality)",
    description: "ประเมินในแง่ความสวยงาม ความประณีต และความตรงโจทย์ของชิ้นงาน"
  },
  {
    id: "attentiveness",
    key: "attentiveness",
    name: "มีมนุษยสัมพันธ์ดี เอาใจใส่ต่องาน (Attentiveness)",
    description: "ประเมินเรื่องการประสานงานและความกระตือรือร้นของทีมงาน"
  },
  {
    id: "ownership",
    key: "ownership",
    name: "มีความเป็นเจ้าของงาน (Ownership)",
    description: "ประเมินในแง่ Sense of Ownership และทัศนคติที่ดีต่อการดูแลโครงการ"
  }
];

// -------------------------------------------------------------
// LOCAL STORAGE KEY & INITIALIZER
// -------------------------------------------------------------
const STORAGE_KEY = "cc_kr_kpi_settings_v2";

// -------------------------------------------------------------
// VALUE & FORMULA HELPERS FOR R5 (REACH) & R6 (ENGAGEMENT)
// -------------------------------------------------------------
export function computeReachEngagementValues(
  reach: number,
  engagement: number,
  targetReach: number = 6000000,
  targetEngagement: number = 60000
) {
  // Reach 6,000,000 target = 700,000 Baht (0.1166667 Baht / Reach)
  // Engagement 60,000 target = 300,000 Baht (5.00 Baht / Engagement)
  const reachRate = targetReach > 0 ? 700000 / targetReach : 0.1166667;
  const engageRate = targetEngagement > 0 ? 300000 / targetEngagement : 5.0;

  const reachValueBaht = Math.round(reach * reachRate);
  const engagementValueBaht = Math.round(engagement * engageRate);
  const totalValueBaht = reachValueBaht + engagementValueBaht;

  return {
    reachRate,
    engageRate,
    reachValueBaht,
    engagementValueBaht,
    totalValueBaht
  };
}

// -------------------------------------------------------------
// DYNAMIC KR TARGET CALCULATION DIRECTLY BOUND FROM R METRICS
// (ผูกค่า R กับ ค่า KR โดยผู้ใช้กรอกได้เฉพาะค่า R)
// -------------------------------------------------------------
export function computeKRTargetFromR(kr: KRMetric): number {
  if (!kr.rMetrics || kr.rMetrics.length === 0) return kr.baseTarget || 0;

  if (kr.code === "KR1") {
    // KR1 targets internal tasks count (from R1)
    const r1 = kr.rMetrics.find(r => r.code === "R1") || kr.rMetrics[0];
    return r1 ? r1.targetValue : 1200;
  }

  if (kr.code === "KR2") {
    // KR2 targets external tasks count (from R3)
    const r3 = kr.rMetrics.find(r => r.code === "R3") || kr.rMetrics[0];
    return r3 ? r3.targetValue : 350;
  }

  if (kr.code === "KR3") {
    // KR3 targets monetary awareness value: dynamically computed from R5 & R6
    // Base standard conversion: R5 (target Reach at 0.116667 Baht/Reach = ~700,000 Baht)
    // + R6 (target Engagement at 5.00 Baht/Engage = ~300,000 Baht)
    // When user changes R5 or R6 targetValue, KR3 target recalculates automatically!
    const r5 = kr.rMetrics.find(r => r.code === "R5");
    const r6 = kr.rMetrics.find(r => r.code === "R6");
    const r5Val = r5 ? r5.targetValue : 6000000;
    const r6Val = r6 ? r6.targetValue : 60000;
    
    const r5Rate = 700000 / 6000000; // ~0.1166667 บาท/Reach
    const r6Rate = 300000 / 60000;   // 5.00 บาท/Engagement
    
    return Math.round(r5Val * r5Rate + r6Val * r6Rate);
  }

  if (kr.code === "KR4") {
    // KR4 targets profit sum: R7 (gov profit) + R8 (private profit)
    const r7 = kr.rMetrics.find(r => r.code === "R7");
    const r8 = kr.rMetrics.find(r => r.code === "R8");
    const r7Val = r7 ? r7.targetValue : 1000000;
    const r8Val = r8 ? r8.targetValue : 500000;
    return r7Val + r8Val;
  }

  // Custom KR added by user:
  // If has currency R metrics, sum them:
  const currencyRs = kr.rMetrics.filter(r => r.isCurrency);
  if (currencyRs.length > 0) {
    return currencyRs.reduce((acc, r) => acc + r.targetValue, 0);
  }
  // Otherwise sum non-percentage R metrics or take first
  const nonPctRs = kr.rMetrics.filter(r => !r.isPercentage);
  if (nonPctRs.length > 0) {
    return nonPctRs.reduce((acc, r) => acc + r.targetValue, 0);
  }

  return kr.baseTarget || 0;
}

// -------------------------------------------------------------
// QUARTERLY GROWTH CALCULATION (QoQ & YoY)
// -------------------------------------------------------------
export function calculateQuarterGrowth(
  current: QuarterlyRecord,
  allRecords: QuarterlyRecord[]
): QuarterGrowthResult {
  const quarterOrder = ["Q1", "Q2", "Q3", "Q4"] as const;
  const currentQIndex = quarterOrder.indexOf(current.quarter);

  // Find previous quarter (QoQ)
  let prevYear = current.year;
  let prevQIndex = currentQIndex - 1;
  if (prevQIndex < 0) {
    prevQIndex = 3;
    prevYear = current.year - 1;
  }
  const prevQuarter = quarterOrder[prevQIndex];
  const prevRecord = allRecords.find(r => r.year === prevYear && r.quarter === prevQuarter && r.id !== current.id);

  // Find same quarter last year (YoY)
  const yoyRecord = allRecords.find(r => r.year === current.year - 1 && r.quarter === current.quarter && r.id !== current.id);

  const calcPercent = (curr: number, prev: number | undefined): number | null => {
    if (prev === undefined || prev === null || prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  return {
    qoqReachPercent: prevRecord ? calcPercent(current.reach, prevRecord.reach) : null,
    qoqEngagePercent: prevRecord ? calcPercent(current.engagement, prevRecord.engagement) : null,
    qoqValuePercent: prevRecord ? calcPercent(current.totalValueBaht, prevRecord.totalValueBaht) : null,
    yoyReachPercent: yoyRecord ? calcPercent(current.reach, yoyRecord.reach) : null,
    yoyEngagePercent: yoyRecord ? calcPercent(current.engagement, yoyRecord.engagement) : null,
    yoyValuePercent: yoyRecord ? calcPercent(current.totalValueBaht, yoyRecord.totalValueBaht) : null,
  };
}

export function getStoredOKRSettings(): OKRSettingsState {
  if (typeof window === "undefined") {
    return {
      krs: DEFAULT_KRS,
      tips: DEFAULT_TIPS,
      memberResponsibilities: [],
      manualMetrics: { r5Reach: 0, r6Engagement: 0 },
      quarterlyRecords: []
    };
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        krs: parsed.krs && parsed.krs.length > 0 ? parsed.krs : DEFAULT_KRS,
        tips: parsed.tips && parsed.tips.length > 0 ? parsed.tips : DEFAULT_TIPS,
        memberResponsibilities: parsed.memberResponsibilities || [],
        manualMetrics: parsed.manualMetrics || { r5Reach: 0, r6Engagement: 0 },
        quarterlyRecords: parsed.quarterlyRecords || [],
        lastUpdated: parsed.lastUpdated
      };
    }
  } catch (e) {
    console.warn("Failed to read OKR settings from cache:", e);
  }

  return {
    krs: DEFAULT_KRS,
    tips: DEFAULT_TIPS,
    memberResponsibilities: [],
    manualMetrics: { r5Reach: 0, r6Engagement: 0 },
    quarterlyRecords: []
  };
}

export function saveStoredOKRSettings(settings: OKRSettingsState): void {
  if (typeof window === "undefined") return;
  try {
    const dataToSave = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Failed to save OKR settings to cache:", e);
  }
}

/**
 * Fetch OKR Settings and Member Responsibilities directly from Supabase okr_settings (Cloud Sync)
 * Ensures settings remain rock-solid across devices, browsers, and users.
 */
export async function fetchOKRSettingsFromSupabase(): Promise<OKRSettingsState> {
  const local = getStoredOKRSettings();

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('okr_settings')
      .select('id, description, target_value')
      .eq('description', 'CONFIG_OKR_STATE_JSON')
      .maybeSingle();

    if (!error && data && data.target_value) {
      try {
        const parsed = JSON.parse(data.target_value);
        if (parsed && Array.isArray(parsed.krs)) {
          const merged: OKRSettingsState = {
            krs: parsed.krs && parsed.krs.length > 0 ? parsed.krs : DEFAULT_KRS,
            tips: parsed.tips && parsed.tips.length > 0 ? parsed.tips : DEFAULT_TIPS,
            memberResponsibilities: Array.isArray(parsed.memberResponsibilities) ? parsed.memberResponsibilities : [],
            manualMetrics: parsed.manualMetrics || { r5Reach: 0, r6Engagement: 0 },
            quarterlyRecords: Array.isArray(parsed.quarterlyRecords) ? parsed.quarterlyRecords : [],
            lastUpdated: parsed.lastUpdated || new Date().toISOString()
          };
          saveStoredOKRSettings(merged);
          return merged;
        }
      } catch (pe) {
        console.warn("Failed to parse CONFIG_OKR_STATE_JSON from Supabase:", pe);
      }
    }
  } catch (e) {
    console.warn("fetchOKRSettingsFromSupabase encountered error:", e);
  }

  return local;
}

/**
 * Save OKR Settings and Member Responsibilities permanently to Supabase cloud database
 */
export async function saveOKRSettingsToSupabase(settings: OKRSettingsState): Promise<{ success: boolean; error?: string }> {
  // Always update local cache first
  saveStoredOKRSettings(settings);

  try {
    const supabase = createClient();
    const payload = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(payload);

    const { data: existing } = await supabase
      .from('okr_settings')
      .select('id')
      .eq('description', 'CONFIG_OKR_STATE_JSON')
      .maybeSingle();

    if (existing && existing.id) {
      const { error } = await supabase
        .from('okr_settings')
        .update({ target_value: jsonStr, is_active: true })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('okr_settings')
        .insert([{
          type: 'KR',
          description: 'CONFIG_OKR_STATE_JSON',
          target_value: jsonStr,
          is_active: true
        }]);
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error("saveOKRSettingsToSupabase failed:", err);
    return { success: false, error: err?.message || "Failed to persist to Supabase" };
  }
}


// -------------------------------------------------------------
// DYNAMIC SCALING FOR ACTIVE MEMBERS
// (ถ้าลบใครออก เป้าหมายรวมของระบบจะลดลง โดยไม่เพิ่มภาระให้คนอื่น)
// -------------------------------------------------------------
export function computeActiveTarget(
  baseTarget: number,
  allMembersCount: number,
  activeMembersCount: number
): number {
  if (allMembersCount <= 0 || activeMembersCount <= 0) return baseTarget;
  const ratio = Math.min(1, activeMembersCount / allMembersCount);
  return Math.round(baseTarget * ratio);
}

// -------------------------------------------------------------
// DYNAMIC CALCULATION ENGINE FROM REAL BRIEFS DATA
// -------------------------------------------------------------
export interface RealtimeMetricProgress {
  code: string;
  name: string;
  actual: number;
  target: number;
  activeTarget: number;  // Adjusted target based on active team size
  percentage: number;    // % achieved
  unit: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  status: "on_track" | "warning" | "behind";
  breakdownDetail?: string;
}

export interface RealtimeKRResult {
  kr: KRMetric;
  actualAchieved: number;
  target: number;
  activeTarget: number;
  percentage: number;
  rResults: RealtimeMetricProgress[];
}

export interface RealtimeTIPResult {
  tip: TIPMetric;
  actual: number;
  target: number;
  activeTarget: number;
  percentage: number;
  status: "on_track" | "warning" | "behind";
}

export interface RealtimeOKRSummary {
  krs: RealtimeKRResult[];
  tips: RealtimeTIPResult[];
  overallKRScore: number;
  overallTIPScore: number;
  totalEvaluatedBriefs: number;
  averageSatisfactionRate: number;
  totalProfitGov: number;
  totalProfitPrivate: number;
  totalInternalTasks: number;
  totalExternalTasks: number;
}

/**
 * ตรวจสอบว่างานนี้นับเข้า R3 (งานภายนอก / มช. / RSP) หรือไม่
 * เงื่อนไข:
 * 1. ติ๊กหน่วยงานเป็น 'CMU', 'RSP', หรือ 'อื่นๆ' / 'Other'
 * 2. งานที่มาจากทีม 'NMCO' ผ่าน task
 * 3. หรือเป็นงานภายนอกองค์กรทั่วไป (ไม่ใช่ STeP / ไม่ใช่ internal)
 */
export function isR3Task(b: any): boolean {
  if (!b) return false;
  const details = b.details || {};
  const org = (details.organization || b.organization || "").toString().trim().toUpperCase();
  const team = (b.decision_maker || details.team || b.team || "").toString().trim().toUpperCase();

  // 1. ตรวจสอบหมวดหน่วยงาน (CMU, RSP, อื่นๆ)
  if (org === "CMU" || org === "RSP" || org === "OTHER" || org === "OTHERS" || org === "อื่นๆ") {
    return true;
  }

  // 2. งานจากทีม NMCO (ไม่ว่าจะหน่วยงานใด หรือส่งผ่านระบบ task)
  if (team === "NMCO") {
    return true;
  }

  // 3. หากเลือกเป็น STeP ชัดเจน -> ไม่ใช่ R3 (จะนับเป็น R1)
  if (org === "STEP") {
    return false;
  }

  // 4. หากมาจากใบบรีฟฟอร์ม 3 อันหลัก (creative, content, pr)
  const unit = (b.unit || "").toLowerCase();
  const isMain3 = unit === "creative" || unit === "content" || unit === "pr";
  if (isMain3) {
    // ถ้ามาจาก 3 ฟอร์มหลัก และทีมที่สั่งงานไม่ใช่ NMCO -> เป็น STeP ทั้งหมด (R1 ภายใน)
    return team === "NMCO";
  }

  const serviceName = details.service || details.type || "";
  const isInternal = unit === "internal" || serviceName.includes("STeP") || details.is_internal;

  return !isInternal;
}

/**
 * ตรวจสอบว่างานนี้นับเข้า R1 (งานสนับสนุนภายในองค์กร) หรือไม่
 * นอกเหนือจาก R3 จะนับเข้า R1 ทั้งหมด
 */
export function isR1Task(b: any): boolean {
  return !isR3Task(b);
}

export function computeRealtimeMetrics(
  briefs: any[],
  settings: OKRSettingsState,
  activeOperationalMembersCount: number = 10,
  totalTeamCapacityCount: number = 10
): RealtimeOKRSummary {
  let manualR5 = settings.manualMetrics?.r5Reach || 0;
  let manualR6 = settings.manualMetrics?.r6Engagement || 0;

  if (settings.quarterlyRecords && settings.quarterlyRecords.length > 0) {
    const sorted = [...settings.quarterlyRecords].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter.localeCompare(a.quarter);
    });
    if (sorted[0]) {
      manualR5 = sorted[0].reach;
      manualR6 = sorted[0].engagement;
    }
  }

  // 1. Analyze briefs
  let internalCompletedCount = 0;
  let externalCompletedCount = 0;

  let totalGovProfit = 0;
  let totalPrivateProfit = 0;

  let internalSatisfactionSum = 0;
  let internalSatisfactionCount = 0;

  let externalSatisfactionSum = 0;
  let externalSatisfactionCount = 0;

  let serviceSatisfactionSum = 0;
  let serviceSatisfactionCount = 0;

  let allSatisfactionSum = 0;
  let allSatisfactionCount = 0;

  briefs.forEach((b: any) => {
    const isCompleted = b.status === "completed";
    const details = b.details || {};
    const isR3 = isR3Task(b);
    const isInternalTask = !isR3;
    
    // Check client sector for PM project: government vs private
    const sector = details.client_sector || details.sector || "";
    const profitVal = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0)) || 0;

    if (sector === "private") {
      totalPrivateProfit += profitVal;
    } else if (sector === "government") {
      totalGovProfit += profitVal;
    } else if (profitVal > 0) {
      // Default PM profit without explicit sector tags goes 70% gov, 30% private
      totalGovProfit += Math.round(profitVal * 0.7);
      totalPrivateProfit += Math.round(profitVal * 0.3);
    }

    // Satisfaction score: default 85% if not evaluated or declined
    if (isCompleted) {
      let satScore = 85.0;
      if (details.satisfaction_scores?.averagePercent !== undefined && details.satisfaction_scores?.averagePercent !== null) {
        satScore = Number(details.satisfaction_scores.averagePercent);
      } else if (details.satisfaction_rate !== undefined && details.satisfaction_rate !== null) {
        satScore = Number(details.satisfaction_rate);
      } else if (details.satisfaction_scores && typeof details.satisfaction_scores.accuracy === 'number') {
        const sum = (details.satisfaction_scores.accuracy + 
                     details.satisfaction_scores.timeliness + 
                     details.satisfaction_scores.quality + 
                     details.satisfaction_scores.attentiveness + 
                     details.satisfaction_scores.ownership);
        satScore = Math.round((sum / 25) * 100);
      } else {
        // Default standard 85.0% when unrated or "ไม่ทำแบบความพึงพอใจ"
        satScore = 85.0;
      }

      allSatisfactionSum += satScore;
      allSatisfactionCount += 1;

      if (isInternalTask) {
        internalSatisfactionSum += satScore;
        internalSatisfactionCount += 1;
      } else {
        externalSatisfactionSum += satScore;
        externalSatisfactionCount += 1;
      }

      if (profitVal > 0 || sector === "government" || sector === "private") {
        serviceSatisfactionSum += satScore;
        serviceSatisfactionCount += 1;
      }
    }

    // Counts for KR1 and KR2
    if (isCompleted) {
      if (isInternalTask) {
        internalCompletedCount += 1;
      } else {
        // External (มช., RSP, หน่วยงานภายนอก)
        externalCompletedCount += 1;
      }
    }
  });

  // Calculate satisfaction averages (fallback to standard baseline 85.0% if none evaluated yet)
  const avgOverallSatisfaction = allSatisfactionCount > 0 
    ? Math.round((allSatisfactionSum / allSatisfactionCount) * 10) / 10 
    : 85.0;

  const avgInternalSatisfaction = internalSatisfactionCount > 0
    ? Math.round((internalSatisfactionSum / internalSatisfactionCount) * 10) / 10
    : avgOverallSatisfaction;

  const avgExternalSatisfaction = externalSatisfactionCount > 0
    ? Math.round((externalSatisfactionSum / externalSatisfactionCount) * 10) / 10
    : avgOverallSatisfaction;

  const avgServiceSatisfaction = serviceSatisfactionCount > 0
    ? Math.round((serviceSatisfactionSum / serviceSatisfactionCount) * 10) / 10
    : avgOverallSatisfaction;

  // Active Target scaling helper
  const scaleTarget = (base: number) => computeActiveTarget(base, totalTeamCapacityCount, activeOperationalMembersCount);

  // -------------------------------------------------------------
  // CALCULATE R1 - R9
  // -------------------------------------------------------------
  // R1: งานภายใน
  const targetR1 = scaleTarget(1200);
  const progR1: RealtimeMetricProgress = {
    code: "R1",
    name: "จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร",
    actual: internalCompletedCount,
    target: 1200,
    activeTarget: targetR1,
    percentage: targetR1 > 0 ? Math.min(100, Math.round((internalCompletedCount / targetR1) * 100)) : 0,
    unit: "งาน",
    status: internalCompletedCount >= targetR1 ? "on_track" : (internalCompletedCount / targetR1 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สำเร็จแล้ว ${internalCompletedCount} งาน จากเป้าหมายทีม ${targetR1} งาน`
  };

  // R2: ความพึงพอใจภายใน
  const progR2: RealtimeMetricProgress = {
    code: "R2",
    name: "ร้อยละความพึงพอใจ (ภายในองค์กร)",
    actual: avgInternalSatisfaction,
    target: 85.0,
    activeTarget: 85.0,
    percentage: Math.min(100, Math.round((avgInternalSatisfaction / 85.0) * 100)),
    unit: "%",
    isPercentage: true,
    status: avgInternalSatisfaction >= 85 ? "on_track" : "warning",
    breakdownDetail: `ประเมินแล้ว ${internalSatisfactionCount} งาน (เฉลี่ย ${avgInternalSatisfaction}%)`
  };

  // R3: งานภายนอก มช. / RSP
  const targetR3 = scaleTarget(350);
  const progR3: RealtimeMetricProgress = {
    code: "R3",
    name: "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
    actual: externalCompletedCount,
    target: 350,
    activeTarget: targetR3,
    percentage: targetR3 > 0 ? Math.min(100, Math.round((externalCompletedCount / targetR3) * 100)) : 0,
    unit: "งาน",
    status: externalCompletedCount >= targetR3 ? "on_track" : (externalCompletedCount / targetR3 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สำเร็จแล้ว ${externalCompletedCount} งาน จากเป้าหมายทีม ${targetR3} งาน`
  };

  // R4: ความพึงพอใจภายนอก
  const progR4: RealtimeMetricProgress = {
    code: "R4",
    name: "ร้อยละความพึงพอใจ (ภายนอก มช./RSP)",
    actual: avgExternalSatisfaction,
    target: 85.0,
    activeTarget: 85.0,
    percentage: Math.min(100, Math.round((avgExternalSatisfaction / 85.0) * 100)),
    unit: "%",
    isPercentage: true,
    status: avgExternalSatisfaction >= 85 ? "on_track" : "warning",
    breakdownDetail: `ประเมินแล้ว ${externalSatisfactionCount} งาน (เฉลี่ย ${avgExternalSatisfaction}%)`
  };

  // R5 & R6: Reach & Engagement
  const targetR5 = settings.krs[2]?.rMetrics.find(r => r.code === "R5")?.targetValue || 6000000;
  const targetR6 = settings.krs[2]?.rMetrics.find(r => r.code === "R6")?.targetValue || 60000;

  const { reachValueBaht, engagementValueBaht, totalValueBaht, reachRate, engageRate } = computeReachEngagementValues(
    manualR5,
    manualR6,
    targetR5,
    targetR6
  );

  const progR5: RealtimeMetricProgress = {
    code: "R5",
    name: "จำนวน Reach (กรอกผลลัพธ์สะสมในระบบ)",
    actual: manualR5,
    target: targetR5,
    activeTarget: targetR5,
    percentage: targetR5 > 0 ? Math.min(100, Math.round((manualR5 / targetR5) * 100)) : 0,
    unit: "reach",
    status: manualR5 >= targetR5 ? "on_track" : (manualR5 / targetR5 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สะสม ${manualR5.toLocaleString()} Reach (แบ่ง Content 50%: ${Math.round(manualR5 * 0.5).toLocaleString()} | PR 50%: ${Math.round(manualR5 * 0.5).toLocaleString()}) คิดเป็นมูลค่า ฿${reachValueBaht.toLocaleString()} (สูตร: Reach × ${reachRate.toFixed(4)} ฿)`
  };

  const progR6: RealtimeMetricProgress = {
    code: "R6",
    name: "จำนวน Engagement (กรอกผลลัพธ์สะสมในระบบ)",
    actual: manualR6,
    target: targetR6,
    activeTarget: targetR6,
    percentage: targetR6 > 0 ? Math.min(100, Math.round((manualR6 / targetR6) * 100)) : 0,
    unit: "engagements",
    status: manualR6 >= targetR6 ? "on_track" : (manualR6 / targetR6 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สะสม ${manualR6.toLocaleString()} Engagements (แบ่ง Content 50%: ${Math.round(manualR6 * 0.5).toLocaleString()} | PR 50%: ${Math.round(manualR6 * 0.5).toLocaleString()}) คิดเป็นมูลค่า ฿${engagementValueBaht.toLocaleString()} (สูตร: Eng. × ${engageRate.toFixed(2)} ฿)`
  };

  // R7: กำไร PM ภาครัฐ
  const targetR7 = scaleTarget(1000000);
  const progR7: RealtimeMetricProgress = {
    code: "R7",
    name: "กำไรบริการภาครัฐ",
    actual: totalGovProfit,
    target: 1000000,
    activeTarget: targetR7,
    percentage: targetR7 > 0 ? Math.min(100, Math.round((totalGovProfit / targetR7) * 100)) : 0,
    unit: "บาท",
    isCurrency: true,
    status: totalGovProfit >= targetR7 ? "on_track" : (totalGovProfit / targetR7 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `กำไรจริง ฿${totalGovProfit.toLocaleString()} จากเป้าหมาย ฿${targetR7.toLocaleString()}`
  };

  // R8: กำไร PM ภาคเอกชน
  const targetR8 = scaleTarget(500000);
  const progR8: RealtimeMetricProgress = {
    code: "R8",
    name: "กำไรบริการภาคเอกชน",
    actual: totalPrivateProfit,
    target: 500000,
    activeTarget: targetR8,
    percentage: targetR8 > 0 ? Math.min(100, Math.round((totalPrivateProfit / targetR8) * 100)) : 0,
    unit: "บาท",
    isCurrency: true,
    status: totalPrivateProfit >= targetR8 ? "on_track" : (totalPrivateProfit / targetR8 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `กำไรจริง ฿${totalPrivateProfit.toLocaleString()} จากเป้าหมาย ฿${targetR8.toLocaleString()}`
  };

  // R9: ความพึงพอใจงานบริการสร้างรายได้
  const progR9: RealtimeMetricProgress = {
    code: "R9",
    name: "ร้อยละความพึงพอใจ (งานบริการสร้างรายได้)",
    actual: avgServiceSatisfaction,
    target: 85.0,
    activeTarget: 85.0,
    percentage: Math.min(100, Math.round((avgServiceSatisfaction / 85.0) * 100)),
    unit: "%",
    isPercentage: true,
    status: avgServiceSatisfaction >= 85 ? "on_track" : "warning",
    breakdownDetail: `ประเมินแล้ว ${serviceSatisfactionCount} งาน (เฉลี่ย ${avgServiceSatisfaction}%)`
  };

  // -------------------------------------------------------------
  // CALCULATE KR1 - KR4
  // -------------------------------------------------------------
  const kr1Actual = internalCompletedCount;
  const kr1Target = scaleTarget(computeKRTargetFromR(settings.krs[0] || DEFAULT_KRS[0]));
  const kr1Percent = kr1Target > 0 ? Math.min(100, Math.round((kr1Actual / kr1Target) * 100)) : 0;

  const kr2Actual = externalCompletedCount;
  const kr2Target = scaleTarget(computeKRTargetFromR(settings.krs[1] || DEFAULT_KRS[1]));
  const kr2Percent = kr2Target > 0 ? Math.min(100, Math.round((kr2Actual / kr2Target) * 100)) : 0;

  const kr3ActualVal = totalValueBaht;
  const kr3Target = computeKRTargetFromR(settings.krs[2] || DEFAULT_KRS[2]);
  const kr3Percent = kr3Target > 0 ? Math.min(100, Math.round((kr3ActualVal / kr3Target) * 100)) : 0;

  const kr4ActualVal = totalGovProfit + totalPrivateProfit;
  const kr4Target = scaleTarget(computeKRTargetFromR(settings.krs[3] || DEFAULT_KRS[3]));
  const kr4Percent = kr4Target > 0 ? Math.min(100, Math.round((kr4ActualVal / kr4Target) * 100)) : 0;

  const krResults: RealtimeKRResult[] = [
    {
      kr: settings.krs[0] || DEFAULT_KRS[0],
      actualAchieved: kr1Actual,
      target: 1200,
      activeTarget: kr1Target,
      percentage: kr1Percent,
      rResults: [progR1, progR2]
    },
    {
      kr: settings.krs[1] || DEFAULT_KRS[1],
      actualAchieved: kr2Actual,
      target: 350,
      activeTarget: kr2Target,
      percentage: kr2Percent,
      rResults: [progR3, progR4]
    },
    {
      kr: settings.krs[2] || DEFAULT_KRS[2],
      actualAchieved: kr3ActualVal,
      target: 1000000,
      activeTarget: kr3Target,
      percentage: kr3Percent,
      rResults: [progR5, progR6]
    },
    {
      kr: settings.krs[3] || DEFAULT_KRS[3],
      actualAchieved: kr4ActualVal,
      target: 1500000,
      activeTarget: kr4Target,
      percentage: kr4Percent,
      rResults: [progR7, progR8, progR9]
    }
  ];

  // -------------------------------------------------------------
  // CALCULATE TIP1, TIP2, TIP9, TIP10
  // TIP1 = R7 + R8
  // TIP2 = R8
  // TIP9 = TIP1 * 5 (Economic Multiplier)
  // TIP10 = Average Satisfaction Rate
  // -------------------------------------------------------------
  const tip1Actual = totalGovProfit + totalPrivateProfit;
  const tip1Target = scaleTarget(3000000);
  const tip1Percent = tip1Target > 0 ? Math.min(100, Math.round((tip1Actual / tip1Target) * 100)) : 0;

  const tip2Actual = totalPrivateProfit;
  const tip2Target = scaleTarget(1000000);
  const tip2Percent = tip2Target > 0 ? Math.min(100, Math.round((tip2Actual / tip2Target) * 100)) : 0;

  const tip9Actual = tip1Actual * 5;
  const tip9Target = tip1Target * 5;
  const tip9Percent = tip9Target > 0 ? Math.min(100, Math.round((tip9Actual / tip9Target) * 100)) : 0;

  const tip10Actual = avgOverallSatisfaction;
  const tip10Target = 85.0;
  const tip10Percent = Math.min(100, Math.round((tip10Actual / tip10Target) * 100));

  const tipResults: RealtimeTIPResult[] = [
    {
      tip: settings.tips[0] || DEFAULT_TIPS[0],
      actual: tip1Actual,
      target: 3000000,
      activeTarget: tip1Target,
      percentage: tip1Percent,
      status: tip1Actual >= tip1Target ? "on_track" : (tip1Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: settings.tips[1] || DEFAULT_TIPS[1],
      actual: tip2Actual,
      target: 1000000,
      activeTarget: tip2Target,
      percentage: tip2Percent,
      status: tip2Actual >= tip2Target ? "on_track" : (tip2Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: settings.tips[2] || DEFAULT_TIPS[2],
      actual: tip9Actual,
      target: 15000000,
      activeTarget: tip9Target,
      percentage: tip9Percent,
      status: tip9Actual >= tip9Target ? "on_track" : (tip9Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: settings.tips[3] || DEFAULT_TIPS[3],
      actual: tip10Actual,
      target: 85.0,
      activeTarget: 85.0,
      percentage: tip10Percent,
      status: tip10Actual >= 85 ? "on_track" : "warning"
    }
  ];

  // Straight unweighted average of 4 KRs and 4 TIPs
  const overallKRScore = Math.round(
    (kr1Percent + kr2Percent + kr3Percent + kr4Percent) / 4
  );

  const overallTIPScore = Math.round(
    (tip1Percent + tip2Percent + tip9Percent + tip10Percent) / 4
  );

  return {
    krs: krResults,
    tips: tipResults,
    overallKRScore,
    overallTIPScore,
    totalEvaluatedBriefs: allSatisfactionCount,
    averageSatisfactionRate: avgOverallSatisfaction,
    totalProfitGov: totalGovProfit,
    totalProfitPrivate: totalPrivateProfit,
    totalInternalTasks: internalCompletedCount,
    totalExternalTasks: externalCompletedCount
  };
}

/**
 * Compute Satisfaction Survey Analytics (Breakdown of Sent, Completed, Declined, and 5-Dimension Averages)
 */
export function computeSatisfactionAnalytics(briefs: any[]): SatisfactionAnalytics {
  const completedBriefs = briefs.filter(b => b.status === "completed");
  const totalCompletedTasks = completedBriefs.length;

  let evaluatedCount = 0;
  let sentCount = 0;
  let declinedCount = 0;

  let accSum = 0;
  let timeSum = 0;
  let qualSum = 0;
  let attSum = 0;
  let ownSum = 0;
  let dimCount = 0;

  let overallPercentSum = 0;
  const byUnit: Record<string, { count: number; sum: number; average: number }> = {};

  completedBriefs.forEach(b => {
    const details = b.details || {};
    const unit = (b.unit || "other").toLowerCase();
    const scores = details.satisfaction_scores;
    const surveyStatus: SurveyStatus = details.survey_status 
      || (scores?.averagePercent ? "completed" : details.survey_status === "declined" ? "declined" : "sent");

    let taskPercent = 85.0; // default 85%

    if (scores && typeof scores.averagePercent === "number" && surveyStatus !== "sent") {
      evaluatedCount += 1;
      taskPercent = scores.averagePercent;
      
      // 5 Dimensions
      if (typeof scores.accuracy === "number") accSum += scores.accuracy;
      if (typeof scores.timeliness === "number") timeSum += scores.timeliness;
      if (typeof scores.quality === "number") qualSum += scores.quality;
      if (typeof scores.attentiveness === "number") attSum += scores.attentiveness;
      if (typeof scores.ownership === "number") ownSum += scores.ownership;
      dimCount += 1;
    } else {
      sentCount += 1;
      taskPercent = 85.0; // default 85% standard score
    }

    overallPercentSum += taskPercent;

    if (!byUnit[unit]) {
      byUnit[unit] = { count: 0, sum: 0, average: 85.0 };
    }
    byUnit[unit].count += 1;
    byUnit[unit].sum += taskPercent;
    byUnit[unit].average = Math.round((byUnit[unit].sum / byUnit[unit].count) * 10) / 10;
  });

  const overallAverage = totalCompletedTasks > 0 
    ? Math.round((overallPercentSum / totalCompletedTasks) * 10) / 10 
    : 85.0;

  const responseRate = totalCompletedTasks > 0
    ? Math.round((evaluatedCount / totalCompletedTasks) * 100)
    : 0;

  const defaultDimScore = 4.3; // ~85% of 5.0
  const dimensions = {
    accuracy: dimCount > 0 ? Math.round((accSum / dimCount) * 10) / 10 : defaultDimScore,
    timeliness: dimCount > 0 ? Math.round((timeSum / dimCount) * 10) / 10 : defaultDimScore,
    quality: dimCount > 0 ? Math.round((qualSum / dimCount) * 10) / 10 : defaultDimScore,
    attentiveness: dimCount > 0 ? Math.round((attSum / dimCount) * 10) / 10 : defaultDimScore,
    ownership: dimCount > 0 ? Math.round((ownSum / dimCount) * 10) / 10 : defaultDimScore,
  };

  const formattedByUnit: Record<string, { count: number; average: number }> = {};
  Object.keys(byUnit).forEach(k => {
    formattedByUnit[k] = { count: byUnit[k].count, average: byUnit[k].average };
  });

  return {
    overallAverage,
    totalCompletedTasks,
    evaluatedCount,
    sentCount,
    declinedCount,
    responseRate,
    dimensions,
    byUnit: formattedByUnit
  };
}

export interface FiscalYearInfo {
  fiscalYear: number;
  thaiFiscalYear: number;
  fiscalQuarter: number; // 1 | 2 | 3 | 4
  fiscalQuarterName: string; // "Q1 (ต.ค. - ธ.ค.)" ... "Q4 (ก.ค. - ก.ย.)"
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  fiscalQuarterStart: Date;
  fiscalQuarterEnd: Date;
  currentWeekOfFiscalYear: number; // 1 - 52
  currentMonthOfFiscalYear: number; // 1 - 12 (1 = Oct ... 12 = Sep)
  currentWeekOfQuarter: number; // 1 - 13
  label: string; // "ปีงบประมาณ 2569 (1 ต.ค. - 30 ก.ย.)"
}

export function getFiscalYearInfo(date: Date = new Date()): FiscalYearInfo {
  const month = date.getMonth(); // 0 = Jan, ..., 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec
  const year = date.getFullYear();

  let fiscalYear: number;
  let fiscalQuarter: number;
  let fiscalYearStart: Date;
  let fiscalYearEnd: Date;
  let fiscalQuarterStart: Date;
  let fiscalQuarterEnd: Date;

  if (month >= 9) {
    // October (9), November (10), December (11) -> Fiscal Year = year + 1, Quarter = 1
    fiscalYear = year + 1;
    fiscalQuarter = 1;
    fiscalYearStart = new Date(year, 9, 1, 0, 0, 0);
    fiscalYearEnd = new Date(year + 1, 8, 30, 23, 59, 59);
    fiscalQuarterStart = new Date(year, 9, 1, 0, 0, 0);
    fiscalQuarterEnd = new Date(year, 11, 31, 23, 59, 59);
  } else {
    // January (0) to September (8) -> Fiscal Year = year
    fiscalYear = year;
    fiscalYearStart = new Date(year - 1, 9, 1, 0, 0, 0);
    fiscalYearEnd = new Date(year, 8, 30, 23, 59, 59);

    if (month <= 2) {
      // Jan, Feb, Mar -> Q2
      fiscalQuarter = 2;
      fiscalQuarterStart = new Date(year, 0, 1, 0, 0, 0);
      fiscalQuarterEnd = new Date(year, 2, 31, 23, 59, 59);
    } else if (month <= 5) {
      // Apr, May, Jun -> Q3
      fiscalQuarter = 3;
      fiscalQuarterStart = new Date(year, 3, 1, 0, 0, 0);
      fiscalQuarterEnd = new Date(year, 5, 30, 23, 59, 59);
    } else {
      // Jul, Aug, Sep -> Q4
      fiscalQuarter = 4;
      fiscalQuarterStart = new Date(year, 6, 1, 0, 0, 0);
      fiscalQuarterEnd = new Date(year, 8, 30, 23, 59, 59);
    }
  }

  const thaiFiscalYear = fiscalYear + 543;

  // Weeks elapsed since Oct 1 of this fiscal year
  const diffTime = Math.max(1, date.getTime() - fiscalYearStart.getTime());
  const diffDays = Math.floor(diffTime / (24 * 3600 * 1000));
  const currentWeekOfFiscalYear = Math.min(52, Math.max(1, Math.ceil(diffDays / 7)));

  // Month of fiscal year (1 = Oct, ..., 12 = Sep)
  const currentMonthOfFiscalYear = month >= 9 ? month - 8 : month + 4;

  // Weeks elapsed in current quarter
  const diffQTime = Math.max(1, date.getTime() - fiscalQuarterStart.getTime());
  const diffQDays = Math.floor(diffQTime / (24 * 3600 * 1000));
  const currentWeekOfQuarter = Math.min(13, Math.max(1, Math.ceil(diffQDays / 7)));

  const quarterLabels: Record<number, string> = {
    1: "Q1 (ต.ค. - ธ.ค.)",
    2: "Q2 (ม.ค. - มี.ค.)",
    3: "Q3 (เม.ย. - มิ.ย.)",
    4: "Q4 (ก.ค. - ก.ย.)"
  };

  return {
    fiscalYear,
    thaiFiscalYear,
    fiscalQuarter,
    fiscalQuarterName: quarterLabels[fiscalQuarter] || `Q${fiscalQuarter}`,
    fiscalYearStart,
    fiscalYearEnd,
    fiscalQuarterStart,
    fiscalQuarterEnd,
    currentWeekOfFiscalYear,
    currentMonthOfFiscalYear,
    currentWeekOfQuarter,
    label: `ปีงบประมาณ ${thaiFiscalYear} (1 ต.ค. - 30 ก.ย.)`
  };
}

/**
 * Compute Member Pacing and Target Alerts (Monthly & Quarterly for every KR, R, and TIP based on Fiscal Year Oct 1 - Sep 30)
 */
export function computeMemberPacingAlerts(
  memberId: string,
  memberName: string,
  settings: OKRSettingsState,
  briefs: any[],
  memberUnit?: string,
  totalOpsCount: number = 10
): MemberPacingSummary {
  const now = new Date();
  const fiscal = getFiscalYearInfo(now);

  const currentQuarter = fiscal.fiscalQuarter;
  const currentWeekOfYear = fiscal.currentWeekOfFiscalYear;
  const currentMonthOfYear = fiscal.currentMonthOfFiscalYear;
  const currentWeekOfQuarter = fiscal.currentWeekOfQuarter;

  // Member tasks
  const memberTasks = briefs.filter((b: any) => {
    if (b.status === "cancelled") return false;
    const isOwner = b.assignee_id === memberId;
    const isAssistant = Array.isArray(b.details?.assistants) && b.details.assistants.some((a: any) => a.assignee_id === memberId);
    return isOwner || isAssistant;
  });

  const completedMemberTasks = memberTasks.filter(b => b.status === "completed");

  // Helper to extract completion or activity timestamp
  const getTaskCompletedTime = (b: any): number => {
    if (b.completed_at) return new Date(b.completed_at).getTime();
    if (b.details?.completed_at) return new Date(b.details.completed_at).getTime();
    if (b.updated_at) return new Date(b.updated_at).getTime();
    if (b.created_at) return new Date(b.created_at).getTime();
    return 0;
  };

  // Time boundaries for Week, Month, and Fiscal Quarter
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekTime = startOfWeek.getTime();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfMonthTime = startOfMonth.getTime();

  const startOfQuarterTime = fiscal.fiscalQuarterStart.getTime();

  const tasksThisWeek = completedMemberTasks.filter(b => getTaskCompletedTime(b) >= startOfWeekTime);
  const tasksThisMonth = completedMemberTasks.filter(b => getTaskCompletedTime(b) >= startOfMonthTime);
  const tasksThisQuarter = completedMemberTasks.filter(b => getTaskCompletedTime(b) >= startOfQuarterTime);

  // Determine member's unit (e.g. 'content', 'pr', 'creative', 'internal')
  const resolvedUnit = (
    memberUnit ||
    briefs.find((b: any) => b.assignee_id === memberId)?.unit ||
    ""
  ).toLowerCase();

  // Distinct member counts for Content and PR teams (for 50:50 Reach/Engagement split)
  const contentMemberIds = new Set<string>();
  const prMemberIds = new Set<string>();
  briefs.forEach((b: any) => {
    const u = (b.unit || "").toLowerCase();
    if (u === "content" && b.assignee_id) contentMemberIds.add(b.assignee_id);
    if (u === "pr" && b.assignee_id) prMemberIds.add(b.assignee_id);
  });
  const contentMembersCount = Math.max(1, contentMemberIds.size || 2);
  const prMembersCount = Math.max(1, prMemberIds.size || 2);

  // Latest Reach & Engagement from quarterly records or manual input
  let latestReach = settings.manualMetrics?.r5Reach || 0;
  let latestEngagement = settings.manualMetrics?.r6Engagement || 0;
  if (settings.quarterlyRecords && settings.quarterlyRecords.length > 0) {
    const sorted = [...settings.quarterlyRecords].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter.localeCompare(a.quarter);
    });
    if (sorted[0]) {
      latestReach = sorted[0].reach;
      latestEngagement = sorted[0].engagement;
    }
  }

  const resp = settings.memberResponsibilities?.find(r => r.memberId === memberId) || {
    memberId,
    memberName,
    rResponsibilities: {},
    tipResponsibilities: {}
  };

  const defaultEqualPct = Math.round((100 / (totalOpsCount || 1)) * 10) / 10;
  const allRMetrics = settings.krs.flatMap(kr => kr.rMetrics);
  const allTIPMetrics = settings.tips;

  const pacingMetrics: MemberPacingMetric[] = [];
  let monthlyAtRiskCount = 0;
  let monthlyBehindCount = 0;
  let quarterlyAtRiskCount = 0;
  let quarterlyBehindCount = 0;

  // 1. Process R Metrics
  allRMetrics.forEach(r => {
    const isSat = r.isPercentage || r.unit === "%" || ["R2", "R4", "R9"].includes(r.code);
    const isReachOrEngage = r.code === "R5" || r.code === "R6";

    // 50:50 allocation rule for Content and PR on R5 (Reach) and R6 (Engagement)
    let allocPct = defaultEqualPct;
    if (isSat) {
      allocPct = 100;
    } else if (isReachOrEngage) {
      if (resolvedUnit === "content") {
        allocPct = Math.round((50 / contentMembersCount) * 10) / 10;
      } else if (resolvedUnit === "pr") {
        allocPct = Math.round((50 / prMembersCount) * 10) / 10;
      } else {
        // Other units (Creative, Internal, etc.) have 0% responsibility for Reach/Engagement
        allocPct = 0;
      }
    } else {
      allocPct = (typeof resp.rResponsibilities?.[r.code] === 'number') ? resp.rResponsibilities[r.code] : 0;
    }

    // 1. เป้าหมายทั้งปีงบประมาณ
    const annualTarget = isSat ? 85.0 : Math.round((r.targetValue * allocPct) / 100);

    // 2. ดูที่เป้าแล้วหาร: เดือน (÷12), ไตรมาส (÷4), สัปดาห์ (÷52) ตามปีงบประมาณ
    const quarterlyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 4) * 10) / 10 : 0);
    const monthlyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 12) * 10) / 10 : 0);
    const weeklyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 52) * 10) / 10 : 0);

    // Calculate actual achieved for this member (all-time, this week, this month, this quarter)
    let actualAchieved = 0;
    let actualThisWeek = 0;
    let actualThisMonth = 0;
    let actualThisQuarter = 0;

    if (r.code === "R1") {
      actualAchieved = completedMemberTasks.filter(isR1Task).length;
      actualThisWeek = tasksThisWeek.filter(isR1Task).length;
      actualThisMonth = tasksThisMonth.filter(isR1Task).length;
      actualThisQuarter = tasksThisQuarter.filter(isR1Task).length;
    } else if (r.code === "R2" || r.code === "R4" || r.code === "R9") {
      const calcSat = (tasks: any[]) => {
        let sumSat = 0;
        let cntSat = 0;
        tasks.forEach(b => {
          const details = b.details || {};
          const score = details.satisfaction_scores?.averagePercent ?? details.satisfaction_rate ?? 85.0;
          sumSat += Number(score);
          cntSat += 1;
        });
        return cntSat > 0 ? Math.round((sumSat / cntSat) * 10) / 10 : 85.0;
      };
      actualAchieved = calcSat(completedMemberTasks);
      actualThisWeek = calcSat(tasksThisWeek);
      actualThisMonth = calcSat(tasksThisMonth);
      actualThisQuarter = calcSat(tasksThisQuarter);
    } else if (r.code === "R3") {
      actualAchieved = completedMemberTasks.filter(isR3Task).length;
      actualThisWeek = tasksThisWeek.filter(isR3Task).length;
      actualThisMonth = tasksThisMonth.filter(isR3Task).length;
      actualThisQuarter = tasksThisQuarter.filter(isR3Task).length;
    } else if (r.code === "R5") {
      if (resolvedUnit === "content") {
        actualAchieved = Math.round((latestReach * 0.5) / contentMembersCount);
      } else if (resolvedUnit === "pr") {
        actualAchieved = Math.round((latestReach * 0.5) / prMembersCount);
      } else {
        actualAchieved = 0;
      }
      actualThisQuarter = actualAchieved;
      actualThisMonth = Math.round(actualAchieved / 3);
      actualThisWeek = Math.round(actualAchieved / 13);
    } else if (r.code === "R6") {
      if (resolvedUnit === "content") {
        actualAchieved = Math.round((latestEngagement * 0.5) / contentMembersCount);
      } else if (resolvedUnit === "pr") {
        actualAchieved = Math.round((latestEngagement * 0.5) / prMembersCount);
      } else {
        actualAchieved = 0;
      }
      actualThisQuarter = actualAchieved;
      actualThisMonth = Math.round(actualAchieved / 3);
      actualThisWeek = Math.round(actualAchieved / 13);
    } else if (r.code === "R7") {
      const calcSaveCost = (tasks: any[]) => {
        let val = 0;
        tasks.forEach(b => {
          const details = b.details || {};
          const isOwner = b.assignee_id === memberId;
          const assistants = (details.assistants || []).filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
          let memberSharePct = 100;
          if (assistants.length > 0) {
            if (isOwner) {
              const totalAst = assistants.reduce((s: number, a: any) => s + (Number(a.percentage) || 0), 0);
              memberSharePct = Math.max(0, 100 - totalAst);
            } else {
              const ast = assistants.find((a: any) => a.assignee_id === memberId);
              memberSharePct = Number(ast?.percentage) || 0;
            }
          }
          const isPM = (details.category || b.category) === "PM โครงการของ CC";
          const profit = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0));
          const baseV = isPM && profit > 0
            ? profit
            : (Number(details.save_cost || details.revenue) || 0);
          val += Math.round((baseV * (memberSharePct / 100) * allocPct) / 100);
        });
        return val;
      };
      actualAchieved = calcSaveCost(completedMemberTasks);
      actualThisWeek = calcSaveCost(tasksThisWeek);
      actualThisMonth = calcSaveCost(tasksThisMonth);
      actualThisQuarter = calcSaveCost(tasksThisQuarter);
    } else if (r.code === "R8") {
      const calcPrivateProfit = (tasks: any[]) => {
        let val = 0;
        tasks.forEach(b => {
          const details = b.details || {};
          if (details.client_sector === "private" || details.sector === "private") {
            const isOwner = b.assignee_id === memberId;
            const assistants = (details.assistants || []).filter((a: any) => a.assignee_id && Number(a.percentage) > 0);
            let memberSharePct = 100;
            if (assistants.length > 0) {
              if (isOwner) {
                const totalAst = assistants.reduce((s: number, a: any) => s + (Number(a.percentage) || 0), 0);
                memberSharePct = Math.max(0, 100 - totalAst);
              } else {
                const ast = assistants.find((a: any) => a.assignee_id === memberId);
                memberSharePct = Number(ast?.percentage) || 0;
              }
            }
            const profit = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0)) || 0;
            val += Math.round((profit * (memberSharePct / 100) * allocPct) / 100);
          }
        });
        return val;
      };
      actualAchieved = calcPrivateProfit(completedMemberTasks);
      actualThisWeek = calcPrivateProfit(tasksThisWeek);
      actualThisMonth = calcPrivateProfit(tasksThisMonth);
      actualThisQuarter = calcPrivateProfit(tasksThisQuarter);
    } else {
      actualAchieved = completedMemberTasks.length;
      actualThisWeek = tasksThisWeek.length;
      actualThisMonth = tasksThisMonth.length;
      actualThisQuarter = tasksThisQuarter.length;
    }

    // Expected pacing to date
    const weeklyExpected = isSat
      ? 85.0
      : (annualTarget > 0 ? Math.min(annualTarget, Math.round((annualTarget * currentWeekOfYear) / 52)) : 0);
    const monthlyExpected = isSat
      ? 85.0
      : (annualTarget > 0 ? Math.min(annualTarget, Math.round((annualTarget * currentMonthOfYear) / 12)) : 0);
    const quarterlyExpected = isSat
      ? 85.0
      : (annualTarget > 0 ? Math.min(annualTarget, Math.round(quarterlyTarget * (currentWeekOfQuarter / 13))) : 0);

    let weeklyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let monthlyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let quarterlyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let weeklyPacingPct = 100;
    let monthlyPacingPct = 100;
    let quarterlyPacingPct = 100;

    if (allocPct === 0 || annualTarget === 0) {
      weeklyStatus = "on_track";
      monthlyStatus = "on_track";
      quarterlyStatus = "on_track";
      weeklyPacingPct = 100;
      monthlyPacingPct = 100;
      quarterlyPacingPct = 100;
    } else if (isSat) {
      if (actualAchieved >= 85.0) {
        weeklyStatus = "on_track";
        monthlyStatus = "on_track";
        quarterlyStatus = "on_track";
      } else if (actualAchieved >= 80.0) {
        weeklyStatus = "at_risk";
        monthlyStatus = "at_risk";
        quarterlyStatus = "at_risk";
        monthlyAtRiskCount++;
        quarterlyAtRiskCount++;
      } else {
        weeklyStatus = "behind";
        monthlyStatus = "behind";
        quarterlyStatus = "behind";
        monthlyBehindCount++;
        quarterlyBehindCount++;
      }
      weeklyPacingPct = Math.round((actualAchieved / 85.0) * 100);
      monthlyPacingPct = weeklyPacingPct;
      quarterlyPacingPct = weeklyPacingPct;
    } else {
      weeklyPacingPct = weeklyExpected > 0 ? Math.round((actualAchieved / weeklyExpected) * 100) : 100;
      monthlyPacingPct = monthlyExpected > 0 ? Math.round((actualAchieved / monthlyExpected) * 100) : 100;
      quarterlyPacingPct = quarterlyExpected > 0 ? Math.round((actualAchieved / quarterlyExpected) * 100) : 100;

      if (actualAchieved >= weeklyExpected) {
        weeklyStatus = "on_track";
      } else if (actualAchieved >= weeklyExpected * 0.7) {
        weeklyStatus = "at_risk";
      } else {
        weeklyStatus = "behind";
      }

      if (actualAchieved >= monthlyExpected) {
        monthlyStatus = "on_track";
      } else if (actualAchieved >= monthlyExpected * 0.7) {
        monthlyStatus = "at_risk";
        monthlyAtRiskCount++;
      } else {
        monthlyStatus = "behind";
        monthlyBehindCount++;
      }

      if (actualAchieved >= quarterlyExpected) {
        quarterlyStatus = "on_track";
      } else if (actualAchieved >= quarterlyExpected * 0.7) {
        quarterlyStatus = "at_risk";
        quarterlyAtRiskCount++;
      } else {
        quarterlyStatus = "behind";
        quarterlyBehindCount++;
      }
    }

    pacingMetrics.push({
      code: r.code,
      name: r.name,
      type: "R",
      unit: r.unit,
      isCurrency: !!r.isCurrency,
      isSatisfaction: isSat,
      allocationPct: allocPct,
      annualTarget,
      quarterlyTarget,
      monthlyTarget,
      weeklyTarget,
      actualAchieved,
      actualThisWeek,
      actualThisMonth,
      actualThisQuarter,
      weeklyExpected,
      monthlyExpected,
      quarterlyExpected,
      weeklyStatus,
      monthlyStatus,
      quarterlyStatus,
      weeklyPacingPct,
      monthlyPacingPct,
      quarterlyPacingPct
    });
  });

  // 2. Process TIP Metrics
  allTIPMetrics.forEach(t => {
    const isSat = t.isPercentage || t.unit === "%" || ["TIP10"].includes(t.code);
    const allocPct = isSat ? 100 : ((typeof resp.tipResponsibilities?.[t.code] === 'number') ? resp.tipResponsibilities[t.code] : 0);

    // 1. เป้าหมายทั้งปีงบประมาณ
    const annualTarget = isSat ? 85.0 : Math.round((t.baseTarget * allocPct) / 100);

    // 2. ดูที่เป้าแล้วหาร: เดือน (÷12), ไตรมาส (÷4), สัปดาห์ (÷52) ตามปีงบประมาณ
    const quarterlyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 4) * 10) / 10 : 0);
    const monthlyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 12) * 10) / 10 : 0);
    const weeklyTarget = isSat ? 85.0 : (annualTarget > 0 ? Math.round((annualTarget / 52) * 10) / 10 : 0);

    let actualAchieved = 0;
    let actualThisWeek = 0;
    let actualThisMonth = 0;
    let actualThisQuarter = 0;

    const calcProfit = (tasks: any[], privateOnly: boolean = false) => {
      let p = 0;
      tasks.forEach(b => {
        const details = b.details || {};
        if (!privateOnly || details.client_sector === "private" || details.sector === "private") {
          const profit = Number(details.profit) || 0;
          p += Math.round((profit * allocPct) / 100);
        }
      });
      return p;
    };

    if (t.code === "TIP1") {
      actualAchieved = calcProfit(completedMemberTasks, false);
      actualThisWeek = calcProfit(tasksThisWeek, false);
      actualThisMonth = calcProfit(tasksThisMonth, false);
      actualThisQuarter = calcProfit(tasksThisQuarter, false);
    } else if (t.code === "TIP2") {
      actualAchieved = calcProfit(completedMemberTasks, true);
      actualThisWeek = calcProfit(tasksThisWeek, true);
      actualThisMonth = calcProfit(tasksThisMonth, true);
      actualThisQuarter = calcProfit(tasksThisQuarter, true);
    } else if (t.code === "TIP9") {
      actualAchieved = calcProfit(completedMemberTasks, false) * 5;
      actualThisWeek = calcProfit(tasksThisWeek, false) * 5;
      actualThisMonth = calcProfit(tasksThisMonth, false) * 5;
      actualThisQuarter = calcProfit(tasksThisQuarter, false) * 5;
    } else if (t.code === "TIP10") {
      const calcSat = (tasks: any[]) => {
        let sumSat = 0;
        let cntSat = 0;
        tasks.forEach(b => {
          const details = b.details || {};
          const score = details.satisfaction_scores?.averagePercent ?? details.satisfaction_rate ?? 85.0;
          sumSat += Number(score);
          cntSat += 1;
        });
        return cntSat > 0 ? Math.round((sumSat / cntSat) * 10) / 10 : 85.0;
      };
      actualAchieved = calcSat(completedMemberTasks);
      actualThisWeek = calcSat(tasksThisWeek);
      actualThisMonth = calcSat(tasksThisMonth);
      actualThisQuarter = calcSat(tasksThisQuarter);
    } else {
      actualAchieved = completedMemberTasks.length;
      actualThisWeek = tasksThisWeek.length;
      actualThisMonth = tasksThisMonth.length;
      actualThisQuarter = tasksThisQuarter.length;
    }

    const weeklyExpected = isSat ? 85.0 : (annualTarget > 0 ? Math.min(annualTarget, Math.round((annualTarget * currentWeekOfYear) / 52)) : 0);
    const monthlyExpected = isSat ? 85.0 : (annualTarget > 0 ? Math.min(annualTarget, Math.round((annualTarget * currentMonthOfYear) / 12)) : 0);
    const quarterlyExpected = isSat ? 85.0 : (annualTarget > 0 ? Math.min(annualTarget, Math.round(quarterlyTarget * (currentWeekOfQuarter / 13))) : 0);

    let weeklyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let monthlyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let quarterlyStatus: "on_track" | "at_risk" | "behind" = "on_track";
    let weeklyPacingPct = 100;
    let monthlyPacingPct = 100;
    let quarterlyPacingPct = 100;

    if (allocPct === 0 || annualTarget === 0) {
      weeklyStatus = "on_track";
      monthlyStatus = "on_track";
      quarterlyStatus = "on_track";
      weeklyPacingPct = 100;
      monthlyPacingPct = 100;
      quarterlyPacingPct = 100;
    } else if (isSat) {
      if (actualAchieved >= 85.0) {
        weeklyStatus = "on_track";
        monthlyStatus = "on_track";
        quarterlyStatus = "on_track";
      } else if (actualAchieved >= 80.0) {
        weeklyStatus = "at_risk";
        monthlyStatus = "at_risk";
        quarterlyStatus = "at_risk";
        monthlyAtRiskCount++;
        quarterlyAtRiskCount++;
      } else {
        weeklyStatus = "behind";
        monthlyStatus = "behind";
        quarterlyStatus = "behind";
        monthlyBehindCount++;
        quarterlyBehindCount++;
      }
      weeklyPacingPct = Math.round((actualAchieved / 85.0) * 100);
      monthlyPacingPct = weeklyPacingPct;
      quarterlyPacingPct = weeklyPacingPct;
    } else {
      weeklyPacingPct = weeklyExpected > 0 ? Math.round((actualAchieved / weeklyExpected) * 100) : 100;
      monthlyPacingPct = monthlyExpected > 0 ? Math.round((actualAchieved / monthlyExpected) * 100) : 100;
      quarterlyPacingPct = quarterlyExpected > 0 ? Math.round((actualAchieved / quarterlyExpected) * 100) : 100;

      if (actualAchieved >= weeklyExpected) {
        weeklyStatus = "on_track";
      } else if (actualAchieved >= weeklyExpected * 0.7) {
        weeklyStatus = "at_risk";
      } else {
        weeklyStatus = "behind";
      }

      if (actualAchieved >= monthlyExpected) {
        monthlyStatus = "on_track";
      } else if (actualAchieved >= monthlyExpected * 0.7) {
        monthlyStatus = "at_risk";
        monthlyAtRiskCount++;
      } else {
        monthlyStatus = "behind";
        monthlyBehindCount++;
      }

      if (actualAchieved >= quarterlyExpected) {
        quarterlyStatus = "on_track";
      } else if (actualAchieved >= quarterlyExpected * 0.7) {
        quarterlyStatus = "at_risk";
        quarterlyAtRiskCount++;
      } else {
        quarterlyStatus = "behind";
        quarterlyBehindCount++;
      }
    }

    pacingMetrics.push({
      code: t.code,
      name: t.name,
      type: "TIP",
      unit: t.unit,
      isCurrency: !!t.isCurrency,
      isSatisfaction: isSat,
      allocationPct: allocPct,
      annualTarget,
      quarterlyTarget,
      monthlyTarget,
      weeklyTarget,
      actualAchieved,
      actualThisWeek,
      actualThisMonth,
      actualThisQuarter,
      weeklyExpected,
      monthlyExpected,
      quarterlyExpected,
      weeklyStatus,
      monthlyStatus,
      quarterlyStatus,
      weeklyPacingPct,
      monthlyPacingPct,
      quarterlyPacingPct
    });
  });

  return {
    memberId,
    memberName,
    fiscalYear: fiscal.fiscalYear,
    thaiFiscalYear: fiscal.thaiFiscalYear,
    currentQuarter,
    currentWeekOfYear,
    currentMonthOfYear,
    currentWeekOfQuarter,
    fiscalPeriodLabel: fiscal.label,
    totalMetricsCount: pacingMetrics.length,
    totalTasksThisWeek: tasksThisWeek.length,
    totalTasksThisMonth: tasksThisMonth.length,
    totalTasksThisQuarter: tasksThisQuarter.length,
    monthlyAtRiskCount,
    monthlyBehindCount,
    quarterlyAtRiskCount,
    quarterlyBehindCount,
    metrics: pacingMetrics
  };
}
