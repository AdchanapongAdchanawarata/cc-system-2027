import { BriefTaskLike, getTaskFinancialDistribution, getBriefSaveCost, PersonShare } from './stats';

export interface AssigneeInfo {
  id: string;
  name: string;
  unit: string;
  is_active?: boolean;
}

export interface MonthPoint {
  key: string;      // e.g. "2025-10"
  label: string;    // e.g. "ต.ค." or "ต.ค. 68"
  year: number;
  month: number;    // 1-12
}

export interface MemberMonthlyData {
  memberId: string;
  memberName: string;
  unit: string;
  color: string;
  // Map of monthKey -> number
  valuesByMonth: Record<string, number>;
  totalValue: number;
  avgValue: number;
}

export interface BarChartItem {
  id: string;
  name: string;
  unit: string;
  color: string;
  value: number;
  primaryValue?: number;   // e.g. งานหลัก / Owner
  secondaryValue?: number; // e.g. งานช่วย / Assistant
  formattedValue: string;
  unitLabel: string;
  rank?: number;
}

// Distinct 11-Color Palette for CC Team members - Every person has a 100% unique, non-clashing color
export const MEMBER_COLORS = [
  "#ea580c", // 0. จ๊อบ AA (Vivid Orange)
  "#2563eb", // 1. พิม AC (Royal Blue)
  "#eab308", // 2. เยียร์ LLP (Golden Amber/Yellow)
  "#9333ea", // 3. นิน MTN (Electric Purple)
  "#059669", // 4. จอย RL (Emerald Green)
  "#ec4899", // 5. ลูกอิน STK (Hot Pink)
  "#06b6d4", // 6. วา WK (Cyan Sky)
  "#84cc16", // 7. เอ็นจอย SLR (Bright Lime Green)
  "#b45309", // 8. ตั๊ม TTY (Warm Copper/Bronze)
  "#4338ca", // 9. โอ๊ต CNB (Deep Indigo)
  "#dc2626", // 10. แก้ว KYK (Ruby Red)
  // Additional fallback colors
  "#0ea5e9", // 11. Sky Blue
  "#d946ef", // 12. Fuchsia
  "#14b8a6", // 13. Teal
  "#f43f5e", // 14. Coral Rose
  "#6366f1", // 15. Soft Indigo
  "#65a30d", // 16. Olive
  "#ca8a04", // 17. Ochre
  "#7c3aed", // 18. Violet
  "#64748b"  // 19. Slate
];

// Mapping each specific CC team member to their dedicated color
export const MEMBER_NAME_COLOR_MAP: Record<string, string> = {
  // 1. จ๊อบ AA -> Vivid Orange
  "จ๊อบ AA": "#ea580c",
  "จ๊อบ": "#ea580c",
  "job": "#ea580c",
  "aa": "#ea580c",

  // 2. พิม AC -> Royal Blue
  "พิม AC": "#2563eb",
  "พิม": "#2563eb",
  "pim": "#2563eb",
  "ac": "#2563eb",

  // 3. เยียร์ LLP / เบียร์ LLP -> Golden Amber
  "เยียร์ LLP": "#eab308",
  "เยียร์": "#eab308",
  "เบียร์ LLP": "#eab308",
  "เบียร์": "#eab308",
  "year": "#eab308",
  "beer": "#eab308",
  "llp": "#eab308",

  // 4. นิน MTN -> Electric Purple
  "นิน MTN": "#9333ea",
  "นิน": "#9333ea",
  "nin": "#9333ea",
  "mtn": "#9333ea",

  // 5. จอย RL -> Deep Emerald Green (checked after เอ็นจอย by length sorting)
  "จอย RL": "#059669",
  "จอย": "#059669",
  "joy": "#059669",
  "rl": "#059669",

  // 6. ลูกอิน STK -> Hot Pink
  "ลูกอิน STK": "#ec4899",
  "ลูกอิน": "#ec4899",
  "lookin": "#ec4899",
  "stk": "#ec4899",

  // 7. วา WK -> Cyan Sky
  "วา WK": "#06b6d4",
  "วา": "#06b6d4",
  "wa": "#06b6d4",
  "wk": "#06b6d4",

  // 8. เอ็นจอย SLR -> Bright Lime Green (Distinct from Emerald Green)
  "เอ็นจอย SLR": "#84cc16",
  "เอ็นจอย": "#84cc16",
  "enjoy": "#84cc16",
  "slr": "#84cc16",

  // 9. ตั๊ม TTY -> Warm Copper/Bronze
  "ตั๊ม TTY": "#b45309",
  "ตั๊ม": "#b45309",
  "tum": "#b45309",
  "tty": "#b45309",

  // 10. โอ๊ต CNB -> Deep Indigo
  "โอ๊ต CNB": "#4338ca",
  "โอ๊ต": "#4338ca",
  "oat": "#4338ca",
  "cnb": "#4338ca",

  // 11. แก้ว KYK -> Ruby Red
  "แก้ว KYK": "#dc2626",
  "แก้ว": "#dc2626",
  "kaew": "#dc2626",
  "kyk": "#dc2626",
};

// Pre-sort keys by descending length so "เอ็นจอย" matches before "จอย"
const SORTED_NAME_COLOR_ENTRIES = Object.entries(MEMBER_NAME_COLOR_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

/**
 * Assign unique, distinct color per individual person
 */
export function getMemberColor(index: number, memberNameOrId?: string): string {
  if (memberNameOrId) {
    const clean = memberNameOrId.toLowerCase().trim();
    for (const [key, col] of SORTED_NAME_COLOR_ENTRIES) {
      if (clean.includes(key.toLowerCase())) {
        return col;
      }
    }
  }
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

/**
 * Generate 12 months array ending at reference date (or current date)
 */
export function get12MonthsTimeline(refDate = new Date()): MonthPoint[] {
  const result: MonthPoint[] = [];
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth(); // 0-11

  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-12
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const thaiYearShort = (y + 543) % 100;
    const label = `${THAI_MONTHS_SHORT[m - 1]} '${thaiYearShort}`;

    result.push({
      key,
      label,
      year: y,
      month: m
    });
  }

  return result;
}

/**
 * Extract Month Key "YYYY-MM" from brief date
 */
function getBriefMonthKey(brief: BriefTaskLike): string {
  const dateStr = brief.completed_at || brief.created_at || brief.in_progress_at || brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/**
 * Calculate Turnaround Days for a completed brief
 */
function getBriefTurnaroundDays(brief: BriefTaskLike): number | null {
  if (brief.status !== 'completed' || !brief.completed_at) return null;
  const start = new Date(brief.in_progress_at || brief.created_at || brief.completed_at).getTime();
  const end = new Date(brief.completed_at).getTime();
  if (end < start) return 0.5;
  return Math.max(0.2, Number(((end - start) / (1000 * 60 * 60 * 24)).toFixed(1)));
}

/**
 * Check if brief is on time
 */
function isBriefOnTime(brief: BriefTaskLike): boolean | null {
  if (brief.status !== 'completed' || !brief.completed_at) return null;
  if (!brief.deadline) return true; // Default on-time if no deadline set
  const dEnd = new Date(brief.completed_at);
  const dDue = new Date(brief.deadline);
  dDue.setHours(23, 59, 59, 999);
  return dEnd.getTime() <= dDue.getTime();
}

export type TimelineMetricKey = 
  | 'save_cost'           // Total save cost (฿)
  | 'tasks_count'         // Total tasks count
  | 'turnaround_days'     // Avg turnaround days
  | 'ontime_rate'         // On-time completion rate (%)
  | 'completed_tasks'     // Completed tasks
  | 'assist_tasks'        // Assistant tasks
  | 'okr_tasks'           // OKR linked tasks count
  | 'okr_save_cost';      // OKR linked save cost (฿)

/**
 * Compute 12-Month Timeline data for all active members
 */
export function compute12MonthMemberTimeline({
  briefs,
  assignees,
  metric,
  timelineMonths = get12MonthsTimeline()
}: {
  briefs: BriefTaskLike[];
  assignees: AssigneeInfo[];
  metric: TimelineMetricKey;
  timelineMonths?: MonthPoint[];
}): {
  months: MonthPoint[];
  series: MemberMonthlyData[];
  teamAverageByMonth: Record<string, number>;
  maxMonthlyValue: number;
} {
  const monthKeys = new Set(timelineMonths.map(m => m.key));

  // Intermediate buckets per member per month
  const buckets: Record<string, Record<string, {
    saveCost: number;
    tasksCount: number;
    completedCount: number;
    totalTurnaround: number;
    turnaroundCount: number;
    onTimeCount: number;
    onTimeTotal: number;
    assistCount: number;
    okrCount: number;
    okrSaveCost: number;
  }>> = {};

  assignees.forEach(a => {
    buckets[a.id] = {};
    timelineMonths.forEach(m => {
      buckets[a.id][m.key] = {
        saveCost: 0,
        tasksCount: 0,
        completedCount: 0,
        totalTurnaround: 0,
        turnaroundCount: 0,
        onTimeCount: 0,
        onTimeTotal: 0,
        assistCount: 0,
        okrCount: 0,
        okrSaveCost: 0
      };
    });
  });

  // Distribute briefs
  briefs.forEach(brief => {
    if (brief.status === 'cancelled') return;
    const mKey = getBriefMonthKey(brief);
    if (!monthKeys.has(mKey)) return;

    const dist = getTaskFinancialDistribution(brief);
    const allShares: PersonShare[] = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
    const turnaround = getBriefTurnaroundDays(brief);
    const onTime = isBriefOnTime(brief);
    const hasOKR = Boolean(brief.details?.selected_okr || (brief as any).okr_links?.length);

    allShares.forEach(s => {
      const b = buckets[s.assignee_id]?.[mKey];
      if (!b) return;

      b.saveCost += s.save_cost;
      b.tasksCount += 1;
      if (s.role === 'assistant') {
        b.assistCount += 1;
      }

      if (brief.status === 'completed') {
        b.completedCount += 1;
        if (turnaround !== null) {
          b.totalTurnaround += turnaround;
          b.turnaroundCount += 1;
        }
        if (onTime !== null) {
          b.onTimeTotal += 1;
          if (onTime) b.onTimeCount += 1;
        }
      }

      if (hasOKR) {
        b.okrCount += 1;
        b.okrSaveCost += s.save_cost;
      }
    });
  });

  // Transform into MemberMonthlyData series
  let maxMonthlyValue = 0;
  const series: MemberMonthlyData[] = assignees.map((a, idx) => {
    const valuesByMonth: Record<string, number> = {};
    let sumVal = 0;
    let nonZeroMonths = 0;

    timelineMonths.forEach(m => {
      const b = buckets[a.id]?.[m.key];
      let val = 0;

      if (b) {
        switch (metric) {
          case 'save_cost':
            val = Math.round(b.saveCost);
            break;
          case 'tasks_count':
            val = b.tasksCount;
            break;
          case 'completed_tasks':
            val = b.completedCount;
            break;
          case 'assist_tasks':
            val = b.assistCount;
            break;
          case 'turnaround_days':
            val = b.turnaroundCount > 0 ? Number((b.totalTurnaround / b.turnaroundCount).toFixed(1)) : 0;
            break;
          case 'ontime_rate':
            val = b.onTimeTotal > 0 ? Math.round((b.onTimeCount / b.onTimeTotal) * 100) : 0;
            break;
          case 'okr_tasks':
            val = b.okrCount;
            break;
          case 'okr_save_cost':
            val = Math.round(b.okrSaveCost);
            break;
        }
      }

      valuesByMonth[m.key] = val;
      sumVal += val;
      if (val > 0) nonZeroMonths++;
      if (val > maxMonthlyValue) maxMonthlyValue = val;
    });

    const avg = nonZeroMonths > 0 ? Number((sumVal / nonZeroMonths).toFixed(1)) : 0;

    return {
      memberId: a.id,
      memberName: a.name,
      unit: a.unit,
      color: getMemberColor(idx, a.name || a.id),
      valuesByMonth,
      totalValue: sumVal,
      avgValue: avg
    };
  });

  // Calculate Team Average line for each month
  const teamAverageByMonth: Record<string, number> = {};
  timelineMonths.forEach(m => {
    let monthTotal = 0;
    let activeMembersInMonth = 0;

    series.forEach(s => {
      const v = s.valuesByMonth[m.key] || 0;
      if (v > 0) {
        monthTotal += v;
        activeMembersInMonth++;
      }
    });

    if (metric === 'turnaround_days' || metric === 'ontime_rate') {
      const avg = activeMembersInMonth > 0 ? Number((monthTotal / activeMembersInMonth).toFixed(1)) : 0;
      teamAverageByMonth[m.key] = avg;
      if (avg > maxMonthlyValue) maxMonthlyValue = avg;
    } else {
      const avg = series.length > 0 ? Math.round(monthTotal / series.length) : 0;
      teamAverageByMonth[m.key] = avg;
      if (avg > maxMonthlyValue) maxMonthlyValue = avg;
    }
  });

  return {
    months: timelineMonths,
    series,
    teamAverageByMonth,
    maxMonthlyValue: maxMonthlyValue || 10
  };
}

/**
 * Format numbers cleanly with unit
 */
export function formatMetricValue(val: number, metric: TimelineMetricKey): string {
  switch (metric) {
    case 'save_cost':
    case 'okr_save_cost':
      return `฿${val.toLocaleString()}`;
    case 'tasks_count':
    case 'completed_tasks':
    case 'assist_tasks':
    case 'okr_tasks':
      return `${val.toLocaleString()} งาน`;
    case 'turnaround_days':
      return `${val} วัน`;
    case 'ontime_rate':
      return `${val}%`;
    default:
      return val.toLocaleString();
  }
}

/**
 * Extract exact date from brief
 */
export function getBriefExactDate(brief: BriefTaskLike): Date | null {
  const dateStr = brief.completed_at || brief.created_at || brief.in_progress_at || brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export type TimelineGranularity = 'auto' | 'day' | 'week' | 'month';

export interface FlexibleTimelinePoint extends MonthPoint {
  startDate: Date;
  endDate: Date;
  granularity: 'day' | 'week' | 'month';
}

/**
 * Generate timeline points for any custom start and end date
 */
export function generateCustomTimelinePoints(
  startDate: Date,
  endDate: Date,
  preferredGranularity: TimelineGranularity = 'auto'
): FlexibleTimelinePoint[] {
  let start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
  let end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
  
  if (start.getTime() > end.getTime()) {
    const temp = start;
    start = end;
    end = temp;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let resolvedGranularity: 'day' | 'week' | 'month' = 'month';
  if (preferredGranularity !== 'auto') {
    resolvedGranularity = preferredGranularity;
  } else {
    if (diffDays <= 31) resolvedGranularity = 'day';
    else if (diffDays <= 90) resolvedGranularity = 'week';
    else resolvedGranularity = 'month';
  }

  const points: FlexibleTimelinePoint[] = [];

  if (resolvedGranularity === 'day') {
    const cur = new Date(start);
    while (cur <= end && points.length < 90) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const d = cur.getDate();
      const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const label = `${d} ${THAI_MONTHS_SHORT[m - 1]}`;

      const pStart = new Date(y, m - 1, d, 0, 0, 0, 0);
      const pEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

      points.push({
        key,
        label,
        year: y,
        month: m,
        startDate: pStart,
        endDate: pEnd,
        granularity: 'day'
      });
      cur.setDate(cur.getDate() + 1);
    }
  } else if (resolvedGranularity === 'week') {
    const cur = new Date(start);
    while (cur <= end && points.length < 60) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const d = cur.getDate();
      const pEnd = new Date(cur.getTime() + 6 * 24 * 60 * 60 * 1000 + (23 * 3600 + 59 * 60 + 59) * 1000);
      const endM = pEnd.getMonth() + 1;
      const endD = pEnd.getDate();

      const key = `${y}-W-${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
      const label = `${d} ${THAI_MONTHS_SHORT[m - 1]} - ${endD} ${THAI_MONTHS_SHORT[endM - 1]}`;

      points.push({
        key,
        label,
        year: y,
        month: m,
        startDate: new Date(cur),
        endDate: pEnd,
        granularity: 'week'
      });
      cur.setDate(cur.getDate() + 7);
    }
  } else {
    // Monthly
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cur <= endMonth && points.length < 60) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const thaiYearShort = (y + 543) % 100;
      const label = `${THAI_MONTHS_SHORT[m - 1]} '${thaiYearShort}`;

      const pStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const nextMonth = new Date(y, m, 1, 0, 0, 0, 0);
      const pEnd = new Date(nextMonth.getTime() - 1);

      points.push({
        key,
        label,
        year: y,
        month: m,
        startDate: pStart,
        endDate: pEnd,
        granularity: 'month'
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return points;
}

/**
 * Compute Flexible Member Timeline data for arbitrary start & end date
 */
export function computeFlexibleMemberTimeline({
  briefs,
  assignees,
  metric,
  points
}: {
  briefs: BriefTaskLike[];
  assignees: AssigneeInfo[];
  metric: TimelineMetricKey;
  points: FlexibleTimelinePoint[];
}) {
  const buckets: Record<string, Record<string, {
    saveCost: number;
    tasksCount: number;
    completedCount: number;
    totalTurnaround: number;
    turnaroundCount: number;
    onTimeCount: number;
    onTimeTotal: number;
    assistCount: number;
    okrCount: number;
    okrSaveCost: number;
  }>> = {};

  assignees.forEach(a => {
    buckets[a.id] = {};
    points.forEach(p => {
      buckets[a.id][p.key] = {
        saveCost: 0,
        tasksCount: 0,
        completedCount: 0,
        totalTurnaround: 0,
        turnaroundCount: 0,
        onTimeCount: 0,
        onTimeTotal: 0,
        assistCount: 0,
        okrCount: 0,
        okrSaveCost: 0
      };
    });
  });

  briefs.forEach(brief => {
    if (brief.status === 'cancelled') return;
    const bDate = getBriefExactDate(brief);
    if (!bDate) return;

    // Find point bucket
    const matchedPoint = points.find(p => bDate >= p.startDate && bDate <= p.endDate);
    if (!matchedPoint) return;

    const pKey = matchedPoint.key;
    const dist = getTaskFinancialDistribution(brief);
    const allShares: PersonShare[] = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
    const turnaround = getBriefTurnaroundDays(brief);
    const onTime = isBriefOnTime(brief);
    const hasOKR = Boolean(brief.details?.selected_okr || (brief as any).okr_links?.length);

    allShares.forEach(s => {
      const b = buckets[s.assignee_id]?.[pKey];
      if (!b) return;

      b.saveCost += s.save_cost;
      b.tasksCount += 1;
      if (s.role === 'assistant') {
        b.assistCount += 1;
      }

      if (brief.status === 'completed') {
        b.completedCount += 1;
        if (turnaround !== null) {
          b.totalTurnaround += turnaround;
          b.turnaroundCount += 1;
        }
        if (onTime !== null) {
          b.onTimeTotal += 1;
          if (onTime) b.onTimeCount += 1;
        }
      }

      if (hasOKR) {
        b.okrCount += 1;
        b.okrSaveCost += s.save_cost;
      }
    });
  });

  let maxPointValue = 0;
  let totalPeriodValue = 0;

  const series: MemberMonthlyData[] = assignees.map((a, idx) => {
    const valuesByMonth: Record<string, number> = {};
    let sumVal = 0;
    let nonZeroPoints = 0;

    points.forEach(p => {
      const b = buckets[a.id]?.[p.key];
      let val = 0;

      if (b) {
        switch (metric) {
          case 'save_cost':
            val = Math.round(b.saveCost);
            break;
          case 'tasks_count':
            val = b.tasksCount;
            break;
          case 'completed_tasks':
            val = b.completedCount;
            break;
          case 'assist_tasks':
            val = b.assistCount;
            break;
          case 'turnaround_days':
            val = b.turnaroundCount > 0 ? Number((b.totalTurnaround / b.turnaroundCount).toFixed(1)) : 0;
            break;
          case 'ontime_rate':
            val = b.onTimeTotal > 0 ? Math.round((b.onTimeCount / b.onTimeTotal) * 100) : 0;
            break;
          case 'okr_tasks':
            val = b.okrCount;
            break;
          case 'okr_save_cost':
            val = Math.round(b.okrSaveCost);
            break;
        }
      }

      valuesByMonth[p.key] = val;
      sumVal += val;
      if (val > 0) nonZeroPoints++;
      if (val > maxPointValue) maxPointValue = val;
    });

    totalPeriodValue += sumVal;
    const avg = nonZeroPoints > 0 ? Number((sumVal / nonZeroPoints).toFixed(1)) : 0;

    return {
      memberId: a.id,
      memberName: a.name,
      unit: a.unit,
      color: getMemberColor(idx, a.name || a.id),
      valuesByMonth,
      totalValue: sumVal,
      avgValue: avg
    };
  });

  // Team average line
  const teamAverageByMonth: Record<string, number> = {};
  points.forEach(p => {
    let pointTotal = 0;
    let activeMembersInPoint = 0;

    series.forEach(s => {
      const v = s.valuesByMonth[p.key] || 0;
      if (v > 0) {
        pointTotal += v;
        activeMembersInPoint++;
      }
    });

    if (metric === 'turnaround_days' || metric === 'ontime_rate') {
      const avg = activeMembersInPoint > 0 ? Number((pointTotal / activeMembersInPoint).toFixed(1)) : 0;
      teamAverageByMonth[p.key] = avg;
      if (avg > maxPointValue) maxPointValue = avg;
    } else {
      const avg = series.length > 0 ? Math.round(pointTotal / series.length) : 0;
      teamAverageByMonth[p.key] = avg;
      if (avg > maxPointValue) maxPointValue = avg;
    }
  });

  const sortedMembers = [...series].sort((a, b) => b.totalValue - a.totalValue);
  const topMember = sortedMembers[0] || null;

  return {
    points,
    series,
    teamAverageByMonth,
    maxPointValue: maxPointValue || 10,
    totalPeriodValue,
    topMember
  };
}
