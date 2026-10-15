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
    id: "ownership",
    key: "ownership",
    name: "มีความเป็นเจ้าของงานและความรับผิดชอบ (Ownership)",
    description: "ประเมินในแง่ Sense of Ownership และทัศนคติที่ดีต่อการดูแลโครงการ"
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("okr_settings_updated"));
    }
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
  avgInternalSatisfaction?: number;
  avgExternalSatisfaction?: number;
  avgServiceSatisfaction?: number;
  totalInternalEvaluated?: number;
  totalExternalEvaluated?: number;
  totalServiceEvaluated?: number;
  totalProfitGov: number;
  totalProfitPrivate: number;
  pipelineProfitGov: number;
  pipelineProfitPrivate: number;
  pipelinePmCount?: number;
  totalInternalTasks: number;
  totalExternalTasks: number;
  externalPipelineCount?: number;
  internalPipelineCount?: number;
}

/**
 * ตรวจสอบว่างานนี้นับเข้า R3 (งานภายนอก / มช. / RSP) หรือไม่
 * เงื่อนไข:
 * 1. ติ๊กหน่วยงานเป็น 'CMU', 'RSP', หรือ 'อื่นๆ' / 'Other'
 * 2. งานที่มาจากทีม 'NMCO' ผ่าน task
 * 3. หรือเป็นงานภายนอกองค์กรทั่วไป (ไม่ใช่ STeP / ไม่ใช่ internal)
 */
export function isCcPmProject(brief: any): boolean {
  if (!brief) return false;
  const details = brief.details || {};
  const cat = (details.category || brief.category || "").toString();
  const srv = (details.service || brief.service || details.type || "").toString();
  const pName = (brief.project_name || "").toString();
  return (
    details.is_pm_project === true ||
    cat.trim() === "PM โครงการของ CC" ||
    cat.includes("PM โครงการ") ||
    srv.includes("PM โครงการ") ||
    pName.includes("PM โครงการ") ||
    pName.startsWith("[PM]")
  );
}

export function isR3Task(b: any): boolean {
  if (!b) return false;
  const details = b.details || {};

  // 1. ตรวจสอบจาก OKR Tags โดยตรง (KR2, R3, R4) เป็นลำดับแรก
  const okrLinks = Array.isArray(b.okr_links) ? b.okr_links : (Array.isArray(details.okr_links) ? details.okr_links : []);
  const selectedOkr = (details.selected_okr || details.okr_kr || "").toString().trim().toUpperCase();
  const rMetrics = Array.isArray(details.r_metrics) ? details.r_metrics : [];
  if (
    okrLinks.includes("KR2") || 
    okrLinks.includes("R3") || 
    okrLinks.includes("R4") || 
    selectedOkr === "KR2" || 
    rMetrics.includes("R3") || 
    rMetrics.includes("R4")
  ) {
    return true;
  }

  const org = (details.organization || b.organization || details.work_organization || "").toString().trim().toUpperCase();
  const orgKey = (details.organization_key || "").toString().trim().toUpperCase();
  const clientSector = (details.client_sector || "").toString().trim().toUpperCase();
  const team = (b.decision_maker || details.decision_maker || details.team || b.team || "").toString().trim().toUpperCase();
  const unit = (b.unit || "").toString().trim().toUpperCase();

  // 2. งานของ NMCO คืองานของ RSP เสมอ (นับใน KR2 และ R3 ด้วย)
  if (
    team === "NMCO" || 
    team.includes("NMCO") || 
    org === "NMCO" || 
    org.includes("NMCO") || 
    orgKey === "NMCO" ||
    orgKey.includes("NMCO")
  ) {
    return true;
  }

  // 3. ตรวจสอบหมวดหน่วยงานเฉพาะที่เป็น CMU, RSP หรือ อุทยานวิทยาศาสตร์ภาคเหนือ หรือ มช.
  if (
    org === "CMU" || org === "RSP" ||
    orgKey === "CMU" || orgKey === "RSP" ||
    clientSector === "CMU" || clientSector === "RSP" ||
    unit === "RSP" ||
    org.includes("CMU") || org.includes("RSP") || org.includes("มช") || 
    org.includes("มหาวิทยาลัยเชียงใหม่") || org.includes("อุทยานวิทยาศาสตร์ภาคเหนือ") ||
    team === "CMU" || team === "RSP" ||
    team.includes("CMU") || team.includes("RSP") || team.includes("มช")
  ) {
    return true;
  }

  // นอกเหนือจากนี้จัดเป็น R1 ภายในองค์กรทั้งหมด (STeP ภายใน)
  return false;
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
  let internalPipelineCount = 0;
  let externalPipelineCount = 0;

  let totalGovProfit = 0;
  let totalPrivateProfit = 0;
  let pipelineGovProfit = 0;
  let pipelinePrivateProfit = 0;
  let pipelinePmCount = 0;

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
    
    const sector = details.client_sector || details.sector || "";
    const profitVal = Number(details.profit) !== undefined && details.profit !== null
      ? Number(details.profit)
      : (Number(details.revenue || 0) - Number(details.cost || 0));

    // Check client sector for PM project: government vs private
    // งานโครงการของ CC ทั้งหมดจัดเป็นงานบริการภาครัฐ (R7) ยกเว้นระบุชัดเจนว่าเป็นภาคเอกชน (Private)
    // รับรู้กำไรจริง (Actual Profit) เฉพาะงานที่เสร็จสิ้นสมบูรณ์ (completed) เท่านั้น เพื่อป้องกันตัวเลขเกินจริง
    const isPM = isCcPmProject(b);
    if (isPM && b.status !== "cancelled" && profitVal > 0) {
      const sec = (sector || "").toLowerCase().trim();
      const isPrivate = sec === "private" || sec === "เอกชน" || sec === "ภาคเอกชน";
      if (isCompleted) {
        if (isPrivate) {
          totalPrivateProfit += profitVal;
        } else {
          totalGovProfit += profitVal;
        }
      } else {
        // งานที่อยู่ระหว่างดำเนินการ (In Progress) จัดเป็น Pipeline ยังไม่รับรู้เป็นผลสำเร็จจริง
        pipelinePmCount++;
        if (isPrivate) {
          pipelinePrivateProfit += profitVal;
        } else {
          pipelineGovProfit += profitVal;
        }
      }
    }

    // Satisfaction score: ONLY count genuine evaluation results from real survey submissions
    if (isCompleted) {
      const scores = details.satisfaction_scores;
      let realSatScore: number | null = null;

      if (typeof scores?.averagePercent === "number" && details.survey_status !== "declined") {
        realSatScore = scores.averagePercent;
      } else if (typeof scores?.accuracy === "number" && details.survey_status !== "declined") {
        const sum = (scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy));
        realSatScore = Math.round((sum / 25) * 100);
      } else if ((details.survey_status === "completed" || (typeof details.satisfaction_rate === "number" && details.satisfaction_rate > 0)) && details.survey_status !== "declined") {
        realSatScore = Number(details.satisfaction_rate);
      }

      if (realSatScore !== null) {
        allSatisfactionSum += realSatScore;
        allSatisfactionCount += 1;

        if (isInternalTask) {
          internalSatisfactionSum += realSatScore;
          internalSatisfactionCount += 1;
        } else {
          externalSatisfactionSum += realSatScore;
          externalSatisfactionCount += 1;
        }

        if (isPM && profitVal > 0) {
          serviceSatisfactionSum += realSatScore;
          serviceSatisfactionCount += 1;
        }
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
    } else if (b.status !== "cancelled") {
      if (isInternalTask) {
        internalPipelineCount += 1;
      } else {
        externalPipelineCount += 1;
      }
    }
  });

  // Calculate satisfaction averages (0% if none evaluated yet)
  const avgOverallSatisfaction = allSatisfactionCount > 0 
    ? Math.round((allSatisfactionSum / allSatisfactionCount) * 10) / 10 
    : 0;

  const avgInternalSatisfaction = internalSatisfactionCount > 0
    ? Math.round((internalSatisfactionSum / internalSatisfactionCount) * 10) / 10
    : 0;

  const avgExternalSatisfaction = externalSatisfactionCount > 0
    ? Math.round((externalSatisfactionSum / externalSatisfactionCount) * 10) / 10
    : 0;

  const avgServiceSatisfaction = serviceSatisfactionCount > 0
    ? Math.round((serviceSatisfactionSum / serviceSatisfactionCount) * 10) / 10
    : 0;

  // Active Target scaling helper
  const scaleTarget = (base: number) => computeActiveTarget(base, totalTeamCapacityCount, activeOperationalMembersCount);

  // -------------------------------------------------------------
  // DYNAMIC TARGETS EXTRACTED FROM SETTINGS (with fallback to defaults)
  // -------------------------------------------------------------
  const kr1Config = settings.krs.find(k => k.code === "KR1") || settings.krs[0] || DEFAULT_KRS[0];
  const kr2Config = settings.krs.find(k => k.code === "KR2") || settings.krs[1] || DEFAULT_KRS[1];
  const kr3Config = settings.krs.find(k => k.code === "KR3") || settings.krs[2] || DEFAULT_KRS[2];
  const kr4Config = settings.krs.find(k => k.code === "KR4") || settings.krs[3] || DEFAULT_KRS[3];

  const r1Config = kr1Config.rMetrics.find(r => r.code === "R1");
  const r2Config = kr1Config.rMetrics.find(r => r.code === "R2");
  const r3Config = kr2Config.rMetrics.find(r => r.code === "R3");
  const r4Config = kr2Config.rMetrics.find(r => r.code === "R4");
  const r5Config = kr3Config.rMetrics.find(r => r.code === "R5");
  const r6Config = kr3Config.rMetrics.find(r => r.code === "R6");
  const r7Config = kr4Config.rMetrics.find(r => r.code === "R7");
  const r8Config = kr4Config.rMetrics.find(r => r.code === "R8");
  const r9Config = kr4Config.rMetrics.find(r => r.code === "R9");

  // R1: งานภายใน
  const baseR1 = r1Config?.targetValue ?? 1200;
  const targetR1 = scaleTarget(baseR1);
  const progR1: RealtimeMetricProgress = {
    code: "R1",
    name: r1Config?.name || "จำนวนผลงานที่สนับสนุนการให้บริการภายในองค์กร",
    actual: internalCompletedCount,
    target: baseR1,
    activeTarget: targetR1,
    percentage: targetR1 > 0 ? Math.min(100, Math.round((internalCompletedCount / targetR1) * 100)) : 0,
    unit: r1Config?.unit || "งาน",
    status: internalCompletedCount >= targetR1 ? "on_track" : (internalCompletedCount / targetR1 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สำเร็จแล้ว ${internalCompletedCount} งาน จากเป้าหมายทีม ${targetR1} งาน`
  };

  // R2: ความพึงพอใจภายใน (0% หากไม่มีการประเมินจริง)
  const baseR2 = r2Config?.targetValue ?? 85.0;
  const progR2: RealtimeMetricProgress = {
    code: "R2",
    name: r2Config?.name || "ร้อยละความพึงพอใจ (ภายในองค์กร)",
    actual: internalSatisfactionCount > 0 ? avgInternalSatisfaction : 0,
    target: baseR2,
    activeTarget: baseR2,
    percentage: internalSatisfactionCount > 0 ? Math.min(100, Math.round((avgInternalSatisfaction / baseR2) * 100)) : 0,
    unit: "%",
    isPercentage: true,
    status: internalSatisfactionCount === 0 ? "behind" : (avgInternalSatisfaction >= baseR2 ? "on_track" : "warning"),
    breakdownDetail: internalSatisfactionCount > 0 
      ? `ประเมินแล้ว ${internalSatisfactionCount} งาน (เฉลี่ย ${avgInternalSatisfaction}%)`
      : `รอผลประเมินเมื่อส่งมอบงาน (0% • ยังไม่มีการประเมินจริง • เป้าหมาย ≥ ${baseR2}%)`
  };

  // R3: งานภายนอก มช. / RSP
  const baseR3 = r3Config?.targetValue ?? 350;
  const targetR3 = scaleTarget(baseR3);
  const progR3: RealtimeMetricProgress = {
    code: "R3",
    name: r3Config?.name || "จำนวนผลงานภายนอกที่สนับสนุนการทำงานของ มช. และ RSP",
    actual: externalCompletedCount,
    target: baseR3,
    activeTarget: targetR3,
    percentage: targetR3 > 0 ? Math.min(100, Math.round((externalCompletedCount / targetR3) * 100)) : 0,
    unit: r3Config?.unit || "งาน",
    status: externalCompletedCount >= targetR3 ? "on_track" : (externalCompletedCount / targetR3 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `ส่งมอบสำเร็จ ${externalCompletedCount} งาน | อยู่ระหว่างดำเนินงาน (Pipeline) ${externalPipelineCount} งาน (เป้าหมายทีม ${targetR3} งาน)`
  };

  // R4: ความพึงพอใจภายนอก มช./RSP (0% หากไม่มีการประเมินจริง)
  const baseR4 = r4Config?.targetValue ?? 85.0;
  const progR4: RealtimeMetricProgress = {
    code: "R4",
    name: r4Config?.name || "ร้อยละความพึงพอใจ (ภายนอก มช./RSP)",
    actual: externalSatisfactionCount > 0 ? avgExternalSatisfaction : 0,
    target: baseR4,
    activeTarget: baseR4,
    percentage: externalSatisfactionCount > 0 ? Math.min(100, Math.round((avgExternalSatisfaction / baseR4) * 100)) : 0,
    unit: "%",
    isPercentage: true,
    status: externalSatisfactionCount === 0 ? "behind" : (avgExternalSatisfaction >= baseR4 ? "on_track" : "warning"),
    breakdownDetail: externalSatisfactionCount > 0 
      ? `ประเมินแล้ว ${externalSatisfactionCount} งาน (เฉลี่ย ${avgExternalSatisfaction}% • เป้าหมาย ≥ ${baseR4}%)`
      : `รอผลประเมินเมื่อส่งมอบงาน มช./RSP (0% • ยังไม่มีการประเมินจริง • เป้าหมาย ≥ ${baseR4}%)`
  };

  // R5 & R6: Reach & Engagement
  const targetR5 = r5Config?.targetValue ?? 6000000;
  const targetR6 = r6Config?.targetValue ?? 60000;

  const { reachValueBaht, engagementValueBaht, totalValueBaht, reachRate, engageRate } = computeReachEngagementValues(
    manualR5,
    manualR6,
    targetR5,
    targetR6
  );

  const progR5: RealtimeMetricProgress = {
    code: "R5",
    name: r5Config?.name || "จำนวน Reach (กรอกผลลัพธ์สะสมในระบบ)",
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
    name: r6Config?.name || "จำนวน Engagement (กรอกผลลัพธ์สะสมในระบบ)",
    actual: manualR6,
    target: targetR6,
    activeTarget: targetR6,
    percentage: targetR6 > 0 ? Math.min(100, Math.round((manualR6 / targetR6) * 100)) : 0,
    unit: "engagements",
    status: manualR6 >= targetR6 ? "on_track" : (manualR6 / targetR6 > 0.5 ? "warning" : "behind"),
    breakdownDetail: `สะสม ${manualR6.toLocaleString()} Engagements (แบ่ง Content 50%: ${Math.round(manualR6 * 0.5).toLocaleString()} | PR 50%: ${Math.round(manualR6 * 0.5).toLocaleString()}) คิดเป็นมูลค่า ฿${engagementValueBaht.toLocaleString()} (สูตร: Eng. × ${engageRate.toFixed(2)} ฿)`
  };

  // R7: กำไร PM ภาครัฐ (รับรู้เฉพาะงานส่งมอบแล้วเท่านั้น)
  const baseR7 = r7Config?.targetValue ?? 1000000;
  const targetR7 = scaleTarget(baseR7);
  const progR7: RealtimeMetricProgress = {
    code: "R7",
    name: r7Config?.name || "กำไรบริการภาครัฐ",
    actual: totalGovProfit,
    target: baseR7,
    activeTarget: targetR7,
    percentage: targetR7 > 0 ? Math.min(100, Math.round((totalGovProfit / targetR7) * 100)) : 0,
    unit: "บาท",
    isCurrency: true,
    status: totalGovProfit >= targetR7 ? "on_track" : (totalGovProfit / targetR7 > 0.5 ? "warning" : "behind"),
    breakdownDetail: pipelineGovProfit > 0
      ? `ส่งมอบเสร็จจริง ฿${totalGovProfit.toLocaleString()} | อยู่ระหว่างดำเนินงาน (Pipeline) ฿${pipelineGovProfit.toLocaleString()} (เป้าหมาย ฿${targetR7.toLocaleString()})`
      : `ส่งมอบเสร็จจริง ฿${totalGovProfit.toLocaleString()} จากเป้าหมาย ฿${targetR7.toLocaleString()}`
  };

  // R8: กำไร PM ภาคเอกชน (รับรู้เฉพาะงานส่งมอบแล้วเท่านั้น)
  const baseR8 = r8Config?.targetValue ?? 500000;
  const targetR8 = scaleTarget(baseR8);
  const progR8: RealtimeMetricProgress = {
    code: "R8",
    name: r8Config?.name || "กำไรบริการภาคเอกชน",
    actual: totalPrivateProfit,
    target: baseR8,
    activeTarget: targetR8,
    percentage: targetR8 > 0 ? Math.min(100, Math.round((totalPrivateProfit / targetR8) * 100)) : 0,
    unit: "บาท",
    isCurrency: true,
    status: totalPrivateProfit >= targetR8 ? "on_track" : (totalPrivateProfit / targetR8 > 0.5 ? "warning" : "behind"),
    breakdownDetail: pipelinePrivateProfit > 0
      ? `ส่งมอบเสร็จจริง ฿${totalPrivateProfit.toLocaleString()} | อยู่ระหว่างดำเนินงาน (Pipeline) ฿${pipelinePrivateProfit.toLocaleString()} (เป้าหมาย ฿${targetR8.toLocaleString()})`
      : `ส่งมอบเสร็จจริง ฿${totalPrivateProfit.toLocaleString()} จากเป้าหมาย ฿${targetR8.toLocaleString()}`
  };

  // R9: ความพึงพอใจงานบริการสร้างรายได้ (0% หากไม่มีการประเมินจริง)
  const baseR9 = r9Config?.targetValue ?? 85.0;
  const progR9: RealtimeMetricProgress = {
    code: "R9",
    name: r9Config?.name || "ร้อยละความพึงพอใจ (งานบริการสร้างรายได้)",
    actual: serviceSatisfactionCount > 0 ? avgServiceSatisfaction : 0,
    target: baseR9,
    activeTarget: baseR9,
    percentage: serviceSatisfactionCount > 0 ? Math.min(100, Math.round((avgServiceSatisfaction / baseR9) * 100)) : 0,
    unit: "%",
    isPercentage: true,
    status: serviceSatisfactionCount === 0 ? "behind" : (avgServiceSatisfaction >= baseR9 ? "on_track" : "warning"),
    breakdownDetail: serviceSatisfactionCount > 0 
      ? `ประเมินแล้ว ${serviceSatisfactionCount} งาน (เฉลี่ย ${avgServiceSatisfaction}%)`
      : `รอผลประเมินงานสร้างรายได้ (0% • ยังไม่มีการประเมินจริง • เป้าหมาย ≥ ${baseR9}%)`
  };

  // -------------------------------------------------------------
  // CALCULATE KR1 - KR4
  // -------------------------------------------------------------
  const kr1Actual = internalCompletedCount;
  const kr1Raw = computeKRTargetFromR(kr1Config);
  const kr1Target = scaleTarget(kr1Raw);
  const kr1Percent = kr1Target > 0 ? Math.min(100, Math.round((kr1Actual / kr1Target) * 100)) : 0;

  const kr2Actual = externalCompletedCount;
  const kr2Raw = computeKRTargetFromR(kr2Config);
  const kr2Target = scaleTarget(kr2Raw);
  const kr2Percent = kr2Target > 0 ? Math.min(100, Math.round((kr2Actual / kr2Target) * 100)) : 0;

  const kr3ActualVal = totalValueBaht;
  const kr3Raw = computeKRTargetFromR(kr3Config);
  const kr3Target = kr3Raw;
  const kr3Percent = kr3Target > 0 ? Math.min(100, Math.round((kr3ActualVal / kr3Target) * 100)) : 0;

  const kr4ActualVal = totalGovProfit + totalPrivateProfit;
  const kr4Raw = computeKRTargetFromR(kr4Config);
  const kr4Target = scaleTarget(kr4Raw);
  const kr4Percent = kr4Target > 0 ? Math.min(100, Math.round((kr4ActualVal / kr4Target) * 100)) : 0;

  const krResults: RealtimeKRResult[] = [
    {
      kr: kr1Config,
      actualAchieved: kr1Actual,
      target: kr1Raw,
      activeTarget: kr1Target,
      percentage: kr1Percent,
      rResults: [progR1, progR2]
    },
    {
      kr: kr2Config,
      actualAchieved: kr2Actual,
      target: kr2Raw,
      activeTarget: kr2Target,
      percentage: kr2Percent,
      rResults: [progR3, progR4]
    },
    {
      kr: kr3Config,
      actualAchieved: kr3ActualVal,
      target: kr3Raw,
      activeTarget: kr3Target,
      percentage: kr3Percent,
      rResults: [progR5, progR6]
    },
    {
      kr: kr4Config,
      actualAchieved: kr4ActualVal,
      target: kr4Raw,
      activeTarget: kr4Target,
      percentage: kr4Percent,
      rResults: [progR7, progR8, progR9]
    }
  ];

  // -------------------------------------------------------------
  // CALCULATE TIP1, TIP2, TIP9, TIP10
  // -------------------------------------------------------------
  const tip1Config = settings.tips.find(t => t.code === "TIP1") || settings.tips[0] || DEFAULT_TIPS[0];
  const tip2Config = settings.tips.find(t => t.code === "TIP2") || settings.tips[1] || DEFAULT_TIPS[1];
  const tip9Config = settings.tips.find(t => t.code === "TIP9") || settings.tips[2] || DEFAULT_TIPS[2];
  const tip10Config = settings.tips.find(t => t.code === "TIP10") || settings.tips[3] || DEFAULT_TIPS[3];

  const tip1Actual = totalGovProfit + totalPrivateProfit;
  const tip1Base = tip1Config.baseTarget ?? (baseR7 + baseR8);
  const tip1Target = scaleTarget(tip1Base);
  const tip1Percent = tip1Target > 0 ? Math.min(100, Math.round((tip1Actual / tip1Target) * 100)) : 0;

  const tip2Actual = totalPrivateProfit;
  const tip2Base = tip2Config.baseTarget ?? baseR8;
  const tip2Target = scaleTarget(tip2Base);
  const tip2Percent = tip2Target > 0 ? Math.min(100, Math.round((tip2Actual / tip2Target) * 100)) : 0;

  const tip9Actual = tip1Actual * 5;
  const tip9Base = tip9Config.baseTarget ?? (tip1Base * 5);
  const tip9Target = scaleTarget(tip9Base);
  const tip9Percent = tip9Target > 0 ? Math.min(100, Math.round((tip9Actual / tip9Target) * 100)) : 0;

  const tip10Actual = avgOverallSatisfaction;
  const tip10Base = tip10Config.baseTarget ?? 85.0;
  const tip10Percent = allSatisfactionCount > 0 ? Math.min(100, Math.round((tip10Actual / tip10Base) * 100)) : 0;

  const tipResults: RealtimeTIPResult[] = [
    {
      tip: tip1Config,
      actual: tip1Actual,
      target: tip1Base,
      activeTarget: tip1Target,
      percentage: tip1Percent,
      status: tip1Actual >= tip1Target ? "on_track" : (tip1Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: tip2Config,
      actual: tip2Actual,
      target: tip2Base,
      activeTarget: tip2Target,
      percentage: tip2Percent,
      status: tip2Actual >= tip2Target ? "on_track" : (tip2Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: tip9Config,
      actual: tip9Actual,
      target: tip9Base,
      activeTarget: tip9Target,
      percentage: tip9Percent,
      status: tip9Actual >= tip9Target ? "on_track" : (tip9Percent >= 50 ? "warning" : "behind")
    },
    {
      tip: tip10Config,
      actual: tip10Actual,
      target: tip10Base,
      activeTarget: tip10Base,
      percentage: tip10Percent,
      status: allSatisfactionCount === 0 ? "behind" : (tip10Actual >= tip10Base ? "on_track" : "warning")
    }
  ];

  // Weighted average calculation according to official strategic weights
  const kr1W = kr1Config.weightPercent ?? 40;
  const kr2W = kr2Config.weightPercent ?? 30;
  const kr3W = kr3Config.weightPercent ?? 10;
  const kr4W = kr4Config.weightPercent ?? 20;
  const totalKrWeight = kr1W + kr2W + kr3W + kr4W;

  const overallKRScore = totalKrWeight > 0
    ? Math.round((kr1Percent * kr1W + kr2Percent * kr2W + kr3Percent * kr3W + kr4Percent * kr4W) / totalKrWeight)
    : 0;

  const w1 = tip1Config.weightPercent ?? 20;
  const w2 = tip2Config.weightPercent ?? 10;
  const w9 = tip9Config.weightPercent ?? 50;
  const w10 = tip10Config.weightPercent ?? 20;
  const totalTipWeight = w1 + w2 + w9 + w10;

  const overallTIPScore = totalTipWeight > 0
    ? Math.round((tip1Percent * w1 + tip2Percent * w2 + tip9Percent * w9 + tip10Percent * w10) / totalTipWeight)
    : 0;

  return {
    krs: krResults,
    tips: tipResults,
    overallKRScore,
    overallTIPScore,
    totalEvaluatedBriefs: allSatisfactionCount,
    averageSatisfactionRate: avgOverallSatisfaction,
    avgInternalSatisfaction,
    avgExternalSatisfaction,
    avgServiceSatisfaction,
    totalInternalEvaluated: internalSatisfactionCount,
    totalExternalEvaluated: externalSatisfactionCount,
    totalServiceEvaluated: serviceSatisfactionCount,
    totalProfitGov: totalGovProfit,
    totalProfitPrivate: totalPrivateProfit,
    pipelineProfitGov: pipelineGovProfit,
    pipelineProfitPrivate: pipelinePrivateProfit,
    pipelinePmCount,
    totalInternalTasks: internalCompletedCount,
    totalExternalTasks: externalCompletedCount,
    externalPipelineCount,
    internalPipelineCount
  };
}

/**
 * Compute Satisfaction Survey Analytics (Breakdown of Sent, Completed, Declined, and 5-Dimension Averages)
 */
export function computeSatisfactionAnalytics(briefs: any[]): SatisfactionAnalytics {
  const completedBriefs = briefs.filter(b => b.status === "completed" || b.status === "complete");
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

    // Calculate taskPercent with full resilience
    let taskPercent: number | null = null;
    if (typeof scores?.averagePercent === "number") {
      taskPercent = scores.averagePercent;
    } else if (typeof scores?.accuracy === "number") {
      const sum = (scores.accuracy + (scores.timeliness || scores.accuracy) + (scores.quality || scores.accuracy) + (scores.attentiveness || scores.accuracy) + (scores.ownership || scores.accuracy));
      taskPercent = Math.round((sum / 25) * 100);
    } else if (typeof details.satisfaction_rate === "number" && (details.satisfaction_rate > 0 || details.survey_status === "completed")) {
      taskPercent = Number(details.satisfaction_rate);
    }

    const isDeclined = details.survey_status === "declined";
    if (isDeclined) {
      declinedCount += 1;
    }

    const isEvaluated = !isDeclined && taskPercent !== null && (
      details.survey_status === "completed" ||
      Boolean(scores) ||
      (typeof details.satisfaction_rate === "number" && details.satisfaction_rate > 0)
    );

    if (isEvaluated && taskPercent !== null) {
      evaluatedCount += 1;
      overallPercentSum += taskPercent;
      
      // 5 Dimensions
      const acc = typeof scores?.accuracy === "number" ? scores.accuracy : Math.round((taskPercent / 100) * 5 * 10) / 10;
      const time = typeof scores?.timeliness === "number" ? scores.timeliness : acc;
      const qual = typeof scores?.quality === "number" ? scores.quality : acc;
      const att = typeof scores?.attentiveness === "number" ? scores.attentiveness : acc;
      const own = typeof scores?.ownership === "number" ? scores.ownership : acc;

      accSum += acc;
      timeSum += time;
      qualSum += qual;
      attSum += att;
      ownSum += own;
      dimCount += 1;

      if (!byUnit[unit]) {
        byUnit[unit] = { count: 0, sum: 0, average: 0 };
      }
      byUnit[unit].count += 1;
      byUnit[unit].sum += taskPercent;
      byUnit[unit].average = Math.round((byUnit[unit].sum / byUnit[unit].count) * 10) / 10;
    } else if (!isDeclined) {
      sentCount += 1;
    }
  });

  const overallAverage = evaluatedCount > 0 
    ? Math.round((overallPercentSum / evaluatedCount) * 10) / 10 
    : 0;

  const responseRate = totalCompletedTasks > 0
    ? Math.round((evaluatedCount / totalCompletedTasks) * 100)
    : 0;

  const defaultDimScore = 0; // 0 when no evaluations exist
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
          const scores = details.satisfaction_scores;
          if (scores && typeof scores.averagePercent === "number" && details.survey_status !== "sent") {
            sumSat += Number(scores.averagePercent);
            cntSat += 1;
          } else if (details.survey_status === "completed" && typeof details.satisfaction_rate === "number") {
            sumSat += Number(details.satisfaction_rate);
            cntSat += 1;
          }
        });
        return cntSat > 0 ? Math.round((sumSat / cntSat) * 10) / 10 : 0;
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
      const calcGovProfit = (tasks: any[]) => {
        let val = 0;
        tasks.forEach(b => {
          if (b.status !== "completed") return;
          if (!isCcPmProject(b)) return;
          const details = b.details || {};
          const sec = (details.client_sector || details.sector || "").toLowerCase().trim();
          const isPrivate = sec === "private" || sec === "เอกชน" || sec === "ภาคเอกชน";
          if (isPrivate) return;

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
          } else if (!isOwner) {
            memberSharePct = 0;
          }
          const profit = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0)) || 0;
          if (profit > 0) {
            val += Math.round((profit * (memberSharePct / 100) * allocPct) / 100);
          }
        });
        return val;
      };
      actualAchieved = calcGovProfit(completedMemberTasks);
      actualThisWeek = calcGovProfit(tasksThisWeek);
      actualThisMonth = calcGovProfit(tasksThisMonth);
      actualThisQuarter = calcGovProfit(tasksThisQuarter);
    } else if (r.code === "R8") {
      const calcPrivateProfit = (tasks: any[]) => {
        let val = 0;
        tasks.forEach(b => {
          if (b.status !== "completed") return;
          if (!isCcPmProject(b)) return;
          const details = b.details || {};
          const sec = (details.client_sector || details.sector || "").toLowerCase().trim();
          const isPrivate = sec === "private" || sec === "เอกชน" || sec === "ภาคเอกชน";
          if (!isPrivate) return;

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
          } else if (!isOwner) {
            memberSharePct = 0;
          }
          const profit = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0)) || 0;
          if (profit > 0) {
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
      if (actualAchieved === 0) {
        weeklyStatus = "behind";
        monthlyStatus = "behind";
        quarterlyStatus = "behind";
        weeklyPacingPct = 0;
        monthlyPacingPct = 0;
        quarterlyPacingPct = 0;
      } else if (actualAchieved >= 85.0) {
        weeklyStatus = "on_track";
        monthlyStatus = "on_track";
        quarterlyStatus = "on_track";
        weeklyPacingPct = Math.round((actualAchieved / 85.0) * 100);
        monthlyPacingPct = weeklyPacingPct;
        quarterlyPacingPct = weeklyPacingPct;
      } else if (actualAchieved >= 80.0) {
        weeklyStatus = "at_risk";
        monthlyStatus = "at_risk";
        quarterlyStatus = "at_risk";
        monthlyAtRiskCount++;
        quarterlyAtRiskCount++;
        weeklyPacingPct = Math.round((actualAchieved / 85.0) * 100);
        monthlyPacingPct = weeklyPacingPct;
        quarterlyPacingPct = weeklyPacingPct;
      } else {
        weeklyStatus = "behind";
        monthlyStatus = "behind";
        quarterlyStatus = "behind";
        monthlyBehindCount++;
        quarterlyBehindCount++;
        weeklyPacingPct = Math.round((actualAchieved / 85.0) * 100);
        monthlyPacingPct = weeklyPacingPct;
        quarterlyPacingPct = weeklyPacingPct;
      }
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
        if (b.status !== "completed") return;
        if (!isCcPmProject(b)) return;
        const details = b.details || {};
        const sec = (details.client_sector || details.sector || "").toLowerCase().trim();
        const isPrivate = sec === "private" || sec === "เอกชน" || sec === "ภาคเอกชน";
        if (!privateOnly || isPrivate) {
          const profit = Number(details.profit) || (Number(details.revenue || 0) - Number(details.cost || 0)) || 0;
          if (profit > 0) {
            p += Math.round((profit * allocPct) / 100);
          }
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
          const scores = details.satisfaction_scores;
          if (scores && typeof scores.averagePercent === "number" && details.survey_status !== "sent") {
            sumSat += Number(scores.averagePercent);
            cntSat += 1;
          } else if (details.survey_status === "completed" && typeof details.satisfaction_rate === "number") {
            sumSat += Number(details.satisfaction_rate);
            cntSat += 1;
          }
        });
        return cntSat > 0 ? Math.round((sumSat / cntSat) * 10) / 10 : 0;
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
