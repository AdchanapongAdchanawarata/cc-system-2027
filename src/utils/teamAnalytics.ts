import { BriefTaskLike, PersonShare, getTaskFinancialDistribution, getBriefSaveCost, MemberStats } from './stats';
import { getLeadTimeForTask } from './pricing';

export interface BriefTimeWindow {
  briefDateStr: string;
  briefDateFull: string;
  deadlineStr?: string;
  deadlineFull?: string;
  workingDays: number | null;
  text: string;
  tooltip: string;
  isUrgent: boolean;
  slaLeadTime: number;
}

export interface RequesterUrgentStat {
  requesterKey: string;
  requesterName: string;
  requesterEmail?: string;
  teamKey: string;
  teamName: string;
  totalBriefs: number;
  urgentBriefs: number;
  urgentRate: number; // percentage
  avgWorkingDays: number;
  topCategory: string;
  coachingAdvice: string;
  planningHealth: 'critical' | 'warning' | 'good';
}

export interface TeamUrgentStat {
  teamKey: string;
  teamName: string;
  totalBriefs: number;
  urgentBriefs: number;
  urgentRate: number; // percentage
  avgWorkingDays: number;
  topCategory: string;
  teamGuidance: string;
  planningHealth: 'critical' | 'warning' | 'good';
}

export interface UrgentOrderInsights {
  totalBriefs: number;
  totalUrgent: number;
  overallUrgentRate: number;
  topRequesters: RequesterUrgentStat[];
  topTeams: TeamUrgentStat[];
  keyRecommendations: string[];
}

export interface StatusCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TeamDemandStat {
  teamKey: string;
  teamName: string;
  count: number;
  percentage: number;
  totalSaveCost: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
}

export interface CategoryPopularityStat {
  category: string;
  unit: string;
  count: number;
  percentage: number;
  totalSaveCost: number;
  avgTurnaroundDays: number;
  onTimeRate: number;
}

export interface MemberWorkTypeSpecialization {
  category: string;
  count: number;
  percentage: number;
  totalSaveCost: number;
}

export interface MemberBestPerformance {
  category: string;
  count: number;
  avgTurnaroundDays: number;
  onTimeRate: number;
  ratingBadge: 'fastest' | 'flawless' | 'high_volume';
  highlightText: string;
}

export interface TeamAffinity {
  teamKey: string;
  teamName: string;
  count: number;
  percentage: number;
  saveCost: number;
}

export interface PeerAffinity {
  peerId: string;
  peerName: string;
  peerUnit: string;
  collaborationCount: number;
  roleDescription: string;
  roleType: 'peer_assisted' | 'i_assisted' | 'mutual';
}

export interface MemberIntelligenceProfile {
  assigneeId: string;
  statusBreakdown: StatusCounts;
  topSpecializations: MemberWorkTypeSpecialization[];
  bestPerformances: MemberBestPerformance[];
  clientTeamAffinities: TeamAffinity[];
  peerCollaborations: PeerAffinity[];
}

export interface StepTeam {
  abbr: string;
  th: string;
  en: string;
}

export const OFFICIAL_STEP_TEAMS: StepTeam[] = [
  { abbr: "CC", th: "ทีมสร้างสรรค์และการสื่อสาร (งานภายใน CC)", en: "Creative and Communication (Internal)" },
  { abbr: "NMCO", th: "ประสานงานอุทยานฯ ภาคเหนือ และ อว.", en: "RSP, North and MHESI Coordination Office" },
  { abbr: "INCO", th: "เชื่อมโยงความร่วมมือภาคอุตสาหกรรม", en: "Industry Collaboration Office" },
  { abbr: "PITI", th: "บ่มเพาะนวัตกรรมและเทคโนโลยี", en: "Potential Innovation and Technology Incubation" },
  { abbr: "QS", th: "ระบบคุณภาพ", en: "Quality System" },
  { abbr: "TECH SPIN", th: "ถ่ายทอดเทคโนโลยีและร่วมทุน", en: "Technology Transfer and Spin-off Company" },
  { abbr: "PUBSEC", th: "ร่วมมือภาครัฐและสังคม", en: "Public Sector Collaborative Project" },
  { abbr: "LINC", th: "ศูนย์บริการนวัตกรรมและทรัพย์สินทางปัญญา", en: "Linking Innovation to Market" },
  { abbr: "GA", th: "บริหารงานทั่วไป", en: "General Administration" },
  { abbr: "HD", th: "พัฒนาขีดความสามารถบุคลากร", en: "Human Resources Capacity Development" },
  { abbr: "AFP", th: "บัญชี การเงิน และพัสดุ", en: "Accounting, Finance, and Procurement" },
  { abbr: "IASA", th: "พันธกิจสากลและการเชื่อมโยงเครือข่าย", en: "International Affairs and Strategic Alliances" },
  { abbr: "FOODFABR", th: "โรงงานต้นแบบนวัตกรรมอาหาร", en: "Innovative Food Fabrication Pilot Plant" },
  { abbr: "TECH UP", th: "ส่งเสริมโครงสร้างพื้นฐานเทคโนโลยีเชิงลึก", en: "Deep-technology and Scale-Up Facility Support" },
  { abbr: "ISI", th: "บ่มเพาะธุรกิจสตาร์ทอัพ", en: "Innovative Startup Incubator" },
  { abbr: "IFU", th: "บริการอาคารสถานที่และโครงสร้างพื้นฐาน", en: "Infrastructure & Facilities Utilization" },
  { abbr: "LES", th: "บริการห้องปฏิบัติการและเครื่องมือวิทยาศาสตร์", en: "Laboratory & Equipment Services" },
  { abbr: "SIT", th: "กลยุทธ์และการปรับเปลี่ยนองค์กร", en: "Strategy, Initiative and Transformation" },
  { abbr: "IQI", th: "พัฒนาคุณภาพโครงสร้างพื้นฐาน", en: "Infrastructure Quality Improvement" },
  { abbr: "IMO", th: "บริหารจัดการนวัตกรรม", en: "Innovation Management Office" },
  { abbr: "EIC", th: "ศูนย์พัฒนาผู้ประกอบการและนวัตกรรม", en: "Entrepreneurship & Innovation Center" },
  { abbr: "CRM", th: "ลูกค้าสัมพันธ์และการตลาด", en: "Customer Relationship Management" },
  { abbr: "MI", th: "นวัตกรรมการตลาด", en: "Market Innovation" },
  { abbr: "OTHER", th: "หน่วยงานภายนอก / อื่นๆ", en: "Other Departments / External" },
];

export const TEAMS_MAP: Record<string, { th: string; en: string }> = {
  CC: { th: "ทีมสร้างสรรค์และการสื่อสาร", en: "Creative and Communication" },
  NMCO: { th: "ประสานงานอุทยานฯ", en: "RSP, North and MHESI Coordination Office" },
  INCO: { th: "ร่วมมือภาคอุตสาหกรรม", en: "Industry Collaboration Office" },
  PITI: { th: "บ่มเพาะนวัตกรรมฯ", en: "Potential Innovation and Technology Incubation" },
  QS: { th: "ระบบคุณภาพ", en: "Quality System" },
  "TECH SPIN": { th: "ถ่ายทอดเทคโนโลยี", en: "Technology Transfer and Spin-off Company" },
  "Tech Spin": { th: "ถ่ายทอดเทคโนโลยี", en: "Technology Transfer and Spin-off Company" },
  PUBSEC: { th: "ร่วมมือภาครัฐ", en: "Public Sector Collaborative Project" },
  PubSec: { th: "ร่วมมือภาครัฐ", en: "Public Sector Collaborative Project" },
  LINC: { th: "บริการนวัตกรรมและทรัพย์สินทางปัญญา", en: "Linking Innovation to Market" },
  GA: { th: "บริหารงานทั่วไป", en: "General Administration" },
  HD: { th: "พัฒนาบุคลากร", en: "Human Resources Capacity Development" },
  AFP: { th: "บัญชีและพัสดุ", en: "Accounting, Finance, and Procurement" },
  IASA: { th: "พันธกิจสากลฯ", en: "International Affairs and Strategic Alliances" },
  FOODFABR: { th: "นวัตกรรมอาหาร", en: "Innovative Food Fabrication Pilot Plant" },
  "TECH UP": { th: "เทคโนโลยีเชิงลึก", en: "Deep-technology and Scale-Up Facility Support" },
  "Tech Up": { th: "เทคโนโลยีเชิงลึก", en: "Deep-technology and Scale-Up Facility Support" },
  ISI: { th: "บ่มเพาะธุรกิจฯ", en: "Innovative Startup Incubator" },
  IFU: { th: "โครงสร้างพื้นฐานฯ", en: "Infrastructure & Facilities Utilization" },
  IQI: { th: "พัฒนาคุณภาพฯ", en: "Infrastructure Quality Improvement" },
  LES: { th: "ห้องปฏิบัติการฯ", en: "Laboratory & Equipment Services" },
  SIT: { th: "กลยุทธ์และปรับองค์กร", en: "Strategy, Initiative and Transformation" },
  IMO: { th: "บริหารนวัตกรรม", en: "Innovation Management Office" },
  EIC: { th: "พัฒนานวัตกรรมฯ", en: "Entrepreneurship & Innovation Center" },
  CRM: { th: "ลูกค้าสัมพันธ์", en: "Customer Relationship Management" },
  MI: { th: "การตลาดนวัตกรรม", en: "Market Innovation" },
  OTHER: { th: "หน่วยงานภายนอก / อื่นๆ", en: "Other Departments / External" },
};

/**
 * Clean and normalize client team identifier from brief
 */
export function getBriefClientTeam(brief: BriefTaskLike): { key: string; name: string } {
  let raw = (brief as any).decision_maker || brief.details?.team || brief.details?.department || "";
  raw = String(raw).trim();

  if (!raw || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return { key: "CC", name: "CC - สื่อสารองค์กร (งานภายใน)" };
  }

  // Match known abbreviations
  const upper = raw.toUpperCase();
  for (const [abbr, info] of Object.entries(TEAMS_MAP)) {
    if (upper === abbr.toUpperCase() || upper.startsWith(abbr.toUpperCase() + " ") || upper.startsWith(abbr.toUpperCase() + "-")) {
      return { key: abbr, name: `${abbr} - ${info.th}` };
    }
    if (raw.includes(info.th)) {
      return { key: abbr, name: `${abbr} - ${info.th}` };
    }
  }

  return { key: raw, name: raw };
}

/**
 * Extract work category from brief
 */
export function getBriefCategory(brief: BriefTaskLike): string {
  const cat = brief.details?.category || brief.details?.type || brief.details?.service;
  if (cat && String(cat).trim() && String(cat).trim() !== "อื่นๆ" && String(cat).trim() !== "Others") {
    return String(cat).trim();
  }
  if (brief.project_name && brief.project_name.length <= 40) {
    return brief.project_name.trim();
  }
  return "งานออกแบบและคอนเทนต์ทั่วไป";
}

/**
 * Check if a brief is overdue
 */
export function isTaskOverdue(brief: BriefTaskLike): boolean {
  if (brief.status === "completed" || brief.status === "cancelled") return false;
  const dStr = brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
  if (!dStr) return false;
  try {
    const deadlineTime = new Date(dStr).getTime() + 86400000;
    return Date.now() > deadlineTime;
  } catch {
    return false;
  }
}

/**
 * Calculate brief date and available working days window to deadline
 */
export function getBriefTimeWindow(brief: BriefTaskLike): BriefTimeWindow | null {
  const rawAny = brief as Record<string, any>;
  const briefDateRaw = rawAny.created_at || brief.details?.brief_date || brief.details?.submission_date || brief.details?.date;
  if (!briefDateRaw) return null;

  const bDate = new Date(briefDateRaw);
  if (isNaN(bDate.getTime())) return null;

  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const briefDay = bDate.getDate();
  const briefMonth = thaiMonths[bDate.getMonth()];
  const briefDateStr = `${briefDay} ${briefMonth}`;
  const briefDateFull = `${briefDay} ${briefMonth} ${bDate.getFullYear() + 543}`;

  const category = getBriefCategory(brief);
  const slaLeadTime = getLeadTimeForTask(brief.unit, category, brief.project_name);

  const deadlineStr = brief.details?.publish_date || brief.deadline || brief.details?.usage_date || brief.details?.delivery_date || (brief.details?.event_datetime ? String(brief.details.event_datetime).split(" ")[0] : null);

  if (!deadlineStr) {
    return {
      briefDateStr,
      briefDateFull,
      workingDays: null,
      text: `สั่ง ${briefDateStr}`,
      tooltip: `วันสั่งงาน: ${briefDateFull} (ไม่ได้ระบุกำหนดส่ง)`,
      isUrgent: false,
      slaLeadTime
    };
  }

  // Parse deadline date cleanly
  const match = String(deadlineStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  let dueYear: number, dueMonth: number, dueDay: number;
  if (match) {
    dueYear = parseInt(match[1], 10);
    dueMonth = parseInt(match[2], 10) - 1;
    dueDay = parseInt(match[3], 10);
  } else {
    const d = new Date(deadlineStr);
    dueYear = d.getFullYear();
    dueMonth = d.getMonth();
    dueDay = d.getDate();
  }
  const dueDate = new Date(dueYear, dueMonth, dueDay);
  const dueDayNum = dueDate.getDate();
  const dueMonthName = thaiMonths[dueDate.getMonth()];
  const deadlineShort = `${dueDayNum} ${dueMonthName}`;
  const deadlineFull = `${dueDayNum} ${dueMonthName} ${dueDate.getFullYear() + 543}`;

  const startDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const workingDays = Math.round((dueDate.getTime() - startDay.getTime()) / msPerDay);

  let daysLabel = "";
  if (workingDays === 0) {
    daysLabel = "ก่อนเดดไลน์ 0 วัน";
  } else if (workingDays === 1) {
    daysLabel = "ก่อนเดดไลน์ 1 วัน";
  } else if (workingDays < 0) {
    daysLabel = "กระชั้นชิด";
  } else {
    daysLabel = `ก่อนเดดไลน์ ${workingDays} วัน`;
  }

  const isUrgent = workingDays <= 3 || workingDays < slaLeadTime || brief.details?.is_urgent === true;

  return {
    briefDateStr,
    briefDateFull,
    deadlineStr: deadlineShort,
    deadlineFull,
    workingDays,
    text: `สั่ง ${briefDateStr}  ( ${daysLabel} )`,
    tooltip: `วันสั่งงาน: ${briefDateFull} | กำหนดส่ง: ${deadlineFull} | ระยะเวลาล่วงหน้าก่อนเดดไลน์: ${workingDays} วัน (เกณฑ์มาตรฐาน ${slaLeadTime} วัน)`,
    isUrgent,
    slaLeadTime
  };
}

/**
 * Check if a task is an urgent/rush order
 */
export function isTaskUrgent(brief: BriefTaskLike): boolean {
  if (brief.status === "cancelled") return false;
  const rawAny = brief as Record<string, any>;
  const p = String(rawAny.priority || brief.details?.priority || '').toLowerCase();
  if (p === 'urgent' || p === 'high' || p === 'critical' || brief.details?.is_urgent === true) return true;

  const tw = getBriefTimeWindow(brief);
  if (tw && tw.workingDays !== null) {
    return tw.isUrgent;
  }
  return false;
}

/**
 * Compute Urgent/Rush Order Insights by Requester and by Team
 */
export function computeUrgentOrderInsights(briefs: BriefTaskLike[]): UrgentOrderInsights {
  const validBriefs = briefs.filter(b => b.status !== "cancelled");
  const totalBriefs = validBriefs.length;

  const requesterMap: Record<string, {
    key: string;
    name: string;
    email?: string;
    teamKey: string;
    teamName: string;
    total: number;
    urgent: number;
    totalWorkingDays: number;
    workingDaysCount: number;
    categories: Record<string, number>;
  }> = {};

  const teamMap: Record<string, {
    key: string;
    name: string;
    total: number;
    urgent: number;
    totalWorkingDays: number;
    workingDaysCount: number;
    categories: Record<string, number>;
  }> = {};

  let totalUrgent = 0;

  validBriefs.forEach(b => {
    const rawAny = b as Record<string, any>;
    const client = getBriefClientTeam(b);
    const cat = getBriefCategory(b);
    const tw = getBriefTimeWindow(b);
    const urgent = isTaskUrgent(b);

    if (urgent) totalUrgent++;

    // Requester identifier: nickname first, then email, then client team
    const requesterName = String(rawAny.coordinator_nickname || b.details?.coordinator_nickname || b.details?.requester_name || rawAny.requester_email || "").trim() || "ไม่ระบุผู้สั่ง";
    const requesterEmail = String(rawAny.requester_email || b.details?.requester_email || "").trim();
    const requesterKey = requesterName.toLowerCase();

    // 1. Group by Requester
    if (!requesterMap[requesterKey]) {
      requesterMap[requesterKey] = {
        key: requesterKey,
        name: requesterName,
        email: requesterEmail,
        teamKey: client.key,
        teamName: client.name,
        total: 0,
        urgent: 0,
        totalWorkingDays: 0,
        workingDaysCount: 0,
        categories: {}
      };
    }
    requesterMap[requesterKey].total++;
    if (urgent) requesterMap[requesterKey].urgent++;
    if (tw && tw.workingDays !== null) {
      requesterMap[requesterKey].totalWorkingDays += Math.max(0, tw.workingDays);
      requesterMap[requesterKey].workingDaysCount++;
    }
    requesterMap[requesterKey].categories[cat] = (requesterMap[requesterKey].categories[cat] || 0) + (urgent ? 2 : 1);

    // 2. Group by Team
    if (!teamMap[client.key]) {
      teamMap[client.key] = {
        key: client.key,
        name: client.name,
        total: 0,
        urgent: 0,
        totalWorkingDays: 0,
        workingDaysCount: 0,
        categories: {}
      };
    }
    teamMap[client.key].total++;
    if (urgent) teamMap[client.key].urgent++;
    if (tw && tw.workingDays !== null) {
      teamMap[client.key].totalWorkingDays += Math.max(0, tw.workingDays);
      teamMap[client.key].workingDaysCount++;
    }
    teamMap[client.key].categories[cat] = (teamMap[client.key].categories[cat] || 0) + (urgent ? 2 : 1);
  });

  // Transform Requesters
  const topRequesters: RequesterUrgentStat[] = Object.values(requesterMap)
    .filter(r => r.total > 0)
    .map(r => {
      const urgentRate = Math.round((r.urgent / r.total) * 100);
      const avgWorkingDays = r.workingDaysCount > 0 ? Number((r.totalWorkingDays / r.workingDaysCount).toFixed(1)) : 0;
      const topCategory = Object.entries(r.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "ทั่วไป";

      let planningHealth: 'critical' | 'warning' | 'good' = 'good';
      let coachingAdvice = "วางแผนการสั่งงานได้เหมาะสม มีการเผื่อเวลาทำงานตามเกณฑ์มาตรฐาน";

      if (r.urgent >= 4 || (r.urgent >= 2 && urgentRate >= 50)) {
        planningHealth = 'critical';
        coachingAdvice = `มีสัดส่วนงานด่วนสูง (${urgentRate}% / ${r.urgent} ครั้ง) โดยเฉพาะงาน "${topCategory}" แนะนำให้แจ้งหัวหน้าทีม CC หรือนัดประชุม Monthly Pipeline ล่วงหน้าเพื่อจองคิวงาน`;
      } else if (r.urgent >= 1 || urgentRate >= 25) {
        planningHealth = 'warning';
        coachingAdvice = `มีประวัติสั่งงานด่วน ${r.urgent} ครั้ง แนะนำให้วางแผนส่งบรีฟงานประเภท "${topCategory}" ล่วงหน้าอย่างน้อย 5-7 วันทำการ เพื่อรักษาคุณภาพตามเกณฑ์ WI`;
      }

      return {
        requesterKey: r.key,
        requesterName: r.name,
        requesterEmail: r.email,
        teamKey: r.teamKey,
        teamName: r.teamName,
        totalBriefs: r.total,
        urgentBriefs: r.urgent,
        urgentRate,
        avgWorkingDays,
        topCategory,
        coachingAdvice,
        planningHealth
      };
    })
    .sort((a, b) => b.urgentBriefs - a.urgentBriefs || b.urgentRate - a.urgentRate);

  // Transform Teams
  const topTeams: TeamUrgentStat[] = Object.values(teamMap)
    .filter(t => t.total > 0)
    .map(t => {
      const urgentRate = Math.round((t.urgent / t.total) * 100);
      const avgWorkingDays = t.workingDaysCount > 0 ? Number((t.totalWorkingDays / t.workingDaysCount).toFixed(1)) : 0;
      const topCategory = Object.entries(t.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "ทั่วไป";

      let planningHealth: 'critical' | 'warning' | 'good' = 'good';
      let teamGuidance = "ทีมนี้บริหารจัดการเวลาสั่งงานได้ตามเกณฑ์มาตรฐานขององค์กร";

      if (t.urgent >= 5 || (t.urgent >= 2 && urgentRate >= 40)) {
        planningHealth = 'critical';
        teamGuidance = `ทีม ${t.key} มีอัตรางานด่วนสูง (${urgentRate}% / ${t.urgent} งาน) แนะนำให้หัวหน้าฝ่ายกำหนดรอบการสรุปบรีฟงานประจำสัปดาห์ (Weekly Batching) และแจ้งทีม CC ก่อนเริ่มจัดกิจกรรม`;
      } else if (t.urgent >= 1 || urgentRate >= 20) {
        planningHealth = 'warning';
        teamGuidance = `ทีม ${t.key} ควรกำชับผู้ประสานงานให้เผื่อระยะเวลาทำงานสำหรับ "${topCategory}" อย่างน้อย 5 วันทำการ เพื่อลดภาระงานเร่งด่วน`;
      }

      return {
        teamKey: t.key,
        teamName: t.name,
        totalBriefs: t.total,
        urgentBriefs: t.urgent,
        urgentRate,
        avgWorkingDays,
        topCategory,
        teamGuidance,
        planningHealth
      };
    })
    .sort((a, b) => b.urgentBriefs - a.urgentBriefs || b.urgentRate - a.urgentRate);

  const overallUrgentRate = totalBriefs > 0 ? Math.round((totalUrgent / totalBriefs) * 100) : 0;

  const keyRecommendations: string[] = [
    "ส่งเสริมให้ PM ทุกทีมใช้ระบบจองคิวงานล่วงหน้า (Early Slot Reservation) แม้รายละเอียดยังไม่ครบ 100%",
    "สำหรับงานด่วนที่มีเวลาทำงานน้อยกว่า 3 วัน ต้องมีขั้นตอนแจ้งหัวหน้าทีมหรือผู้ช่วยหัวหน้าทีม CC ทันทีหลังกดสั่งงาน",
    "นำสถิติการสั่งงานด่วนรายบุคคลและรายทีมไปใช้ในเวที Review การทำงานเพื่อปรับกระบวนการให้ราบรื่นยิ่งขึ้น"
  ];

  return {
    totalBriefs,
    totalUrgent,
    overallUrgentRate,
    topRequesters,
    topTeams,
    keyRecommendations
  };
}

/**
 * 1. Compute Unit Status Breakdown
 */
export function computeUnitStatusBreakdown(
  briefs: BriefTaskLike[],
  unitFilter: string = "All"
): StatusCounts {
  const filtered = briefs.filter(b => {
    if (b.status === "cancelled") return false;
    if (unitFilter === "All") return true;
    if (unitFilter.toLowerCase() === "internal") return b.unit?.toLowerCase() === "internal";
    return b.unit?.toLowerCase() === unitFilter.toLowerCase();
  });

  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;

  filtered.forEach(b => {
    if (b.status === "completed") {
      completed++;
    } else if (b.status === "in_progress") {
      inProgress++;
      if (isTaskOverdue(b)) overdue++;
    } else if (b.status === "pending") {
      pending++;
      if (isTaskOverdue(b)) overdue++;
    }
  });

  return {
    total: filtered.length,
    pending,
    inProgress,
    completed,
    overdue
  };
}

/**
 * 2. Compute Client Team Demand Ranking (แต่ละทีมสั่งงานมากี่ชิ้น)
 */
export function computeTeamDemandStats(
  briefs: BriefTaskLike[],
  unitFilter: string = "All"
): TeamDemandStat[] {
  const filtered = briefs.filter(b => {
    if (b.status === "cancelled") return false;
    if (unitFilter === "All") return true;
    if (unitFilter.toLowerCase() === "internal") return b.unit?.toLowerCase() === "internal";
    return b.unit?.toLowerCase() === unitFilter.toLowerCase();
  });

  const map: Record<string, {
    teamKey: string;
    teamName: string;
    count: number;
    totalSaveCost: number;
    completed: number;
    inProgress: number;
    pending: number;
  }> = {};

  let totalValid = 0;

  filtered.forEach(b => {
    const { key, name } = getBriefClientTeam(b);
    const saveCost = getBriefSaveCost(b);

    if (!map[key]) {
      map[key] = {
        teamKey: key,
        teamName: name,
        count: 0,
        totalSaveCost: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
      };
    }

    map[key].count += 1;
    map[key].totalSaveCost += saveCost;
    totalValid += 1;

    if (b.status === "completed") map[key].completed += 1;
    else if (b.status === "in_progress") map[key].inProgress += 1;
    else if (b.status === "pending") map[key].pending += 1;
  });

  return Object.values(map)
    .map(item => ({
      teamKey: item.teamKey,
      teamName: item.teamName,
      count: item.count,
      percentage: totalValid > 0 ? Math.round((item.count / totalValid) * 100) : 0,
      totalSaveCost: item.totalSaveCost,
      completedCount: item.completed,
      inProgressCount: item.inProgress,
      pendingCount: item.pending
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 3. Compute Popular Work Categories in Unit (งานชิ้นไหนคนสั่งบ่อยในแต่ละ Unit)
 */
export function computeUnitCategoryFrequency(
  briefs: BriefTaskLike[],
  unitFilter: string = "All",
  limit: number = 6
): CategoryPopularityStat[] {
  const filtered = briefs.filter(b => {
    if (b.status === "cancelled") return false;
    if (unitFilter === "All") return true;
    if (unitFilter.toLowerCase() === "internal") return b.unit?.toLowerCase() === "internal";
    return b.unit?.toLowerCase() === unitFilter.toLowerCase();
  });

  const catMap: Record<string, {
    category: string;
    unit: string;
    count: number;
    totalSaveCost: number;
    totalDuration: number;
    completedWithTime: number;
    onTimeCount: number;
    lateCount: number;
  }> = {};

  let totalTasks = 0;

  filtered.forEach(b => {
    const cat = getBriefCategory(b);
    const saveCost = getBriefSaveCost(b);
    const u = b.unit || "other";

    if (!catMap[cat]) {
      catMap[cat] = {
        category: cat,
        unit: u,
        count: 0,
        totalSaveCost: 0,
        totalDuration: 0,
        completedWithTime: 0,
        onTimeCount: 0,
        lateCount: 0
      };
    }

    catMap[cat].count += 1;
    catMap[cat].totalSaveCost += saveCost;
    totalTasks += 1;

    // Time & On-time
    if (b.status === "completed" && b.completed_at) {
      const start = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
      const end = new Date(b.completed_at).getTime();
      if (end >= start) {
        catMap[cat].totalDuration += Math.max(0.2, (end - start) / (1000 * 60 * 60 * 24));
        catMap[cat].completedWithTime += 1;
      }

      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      if (dStr) {
        const deadline = new Date(dStr).getTime() + 86400000;
        if (end <= deadline) catMap[cat].onTimeCount += 1;
        else catMap[cat].lateCount += 1;
      }
    }
  });

  return Object.values(catMap)
    .map(item => {
      const avgDays = item.completedWithTime > 0 
        ? Number((item.totalDuration / item.completedWithTime).toFixed(1)) 
        : 0;
      const totalRated = item.onTimeCount + item.lateCount;
      const onTimeRate = totalRated > 0 
        ? Math.round((item.onTimeCount / totalRated) * 100) 
        : 100;

      return {
        category: item.category,
        unit: item.unit,
        count: item.count,
        percentage: totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0,
        totalSaveCost: item.totalSaveCost,
        avgTurnaroundDays: avgDays,
        onTimeRate
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 4, 5, 6. Compute Individual Member Intelligence Profile:
 * - Specialization (ใครทำงานประเภทไหนเยอะ)
 * - Best Performance (ทำงานประเภทไหนได้ดี)
 * - Client Team Affinity (ชอบทำงานกับทีมไหน)
 * - Peer Collaboration (ทำงานร่วมกับใครบ่อยสุด)
 */
export function computeMemberIntelligenceProfile(
  briefs: BriefTaskLike[],
  memberId: string,
  allAssignees: { id: string; name: string; unit: string }[]
): MemberIntelligenceProfile {
  const memberBriefs = briefs.filter(b => {
    if (b.status === "cancelled") return false;
    const dist = getTaskFinancialDistribution(b);
    const shares: PersonShare[] = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
    return shares.some(s => s.assignee_id === memberId);
  });

  // 1. Status breakdown
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;

  // 2. Category tracking
  const catStats: Record<string, {
    category: string;
    count: number;
    saveCost: number;
    totalDuration: number;
    completedCount: number;
    onTimeCount: number;
    lateCount: number;
  }> = {};

  // 3. Client team tracking
  const clientTeamStats: Record<string, { key: string; name: string; count: number; saveCost: number }> = {};

  // 4. Peer collaboration tracking
  const peerStats: Record<string, { peerId: string; count: number; asOwnerCount: number; asAssistCount: number }> = {};

  const assigneeNameMap = new Map<string, { name: string; unit: string }>();
  allAssignees.forEach(a => assigneeNameMap.set(a.id, { name: a.name, unit: a.unit }));

  memberBriefs.forEach(b => {
    const dist = getTaskFinancialDistribution(b);
    const allShares: PersonShare[] = [dist.ownerShare, ...dist.assistantShares].filter((s): s is PersonShare => s !== null);
    const myShare = allShares.find(s => s.assignee_id === memberId);
    const myCost = myShare ? myShare.save_cost : getBriefSaveCost(b);
    const isOwner = myShare ? myShare.role === "owner" : b.assignee_id === memberId;

    // Status
    if (b.status === "completed") completed++;
    else if (b.status === "in_progress") {
      inProgress++;
      if (isTaskOverdue(b)) overdue++;
    } else if (b.status === "pending") {
      pending++;
      if (isTaskOverdue(b)) overdue++;
    }

    // Category
    const cat = getBriefCategory(b);
    if (!catStats[cat]) {
      catStats[cat] = {
        category: cat,
        count: 0,
        saveCost: 0,
        totalDuration: 0,
        completedCount: 0,
        onTimeCount: 0,
        lateCount: 0
      };
    }
    catStats[cat].count += 1;
    catStats[cat].saveCost += myCost;

    if (b.status === "completed" && b.completed_at) {
      const start = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
      const end = new Date(b.completed_at).getTime();
      if (end >= start) {
        catStats[cat].totalDuration += Math.max(0.2, (end - start) / (1000 * 60 * 60 * 24));
        catStats[cat].completedCount += 1;
      }
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      if (dStr) {
        const deadline = new Date(dStr).getTime() + 86400000;
        if (end <= deadline) catStats[cat].onTimeCount += 1;
        else catStats[cat].lateCount += 1;
      }
    }

    // Client team affinity
    const client = getBriefClientTeam(b);
    if (!clientTeamStats[client.key]) {
      clientTeamStats[client.key] = { key: client.key, name: client.name, count: 0, saveCost: 0 };
    }
    clientTeamStats[client.key].count += 1;
    clientTeamStats[client.key].saveCost += myCost;

    // Peer collaboration
    allShares.forEach(other => {
      if (other.assignee_id !== memberId) {
        if (!peerStats[other.assignee_id]) {
          peerStats[other.assignee_id] = {
            peerId: other.assignee_id,
            count: 0,
            asOwnerCount: 0,
            asAssistCount: 0
          };
        }
        peerStats[other.assignee_id].count += 1;
        if (isOwner) peerStats[other.assignee_id].asOwnerCount += 1;
        else peerStats[other.assignee_id].asAssistCount += 1;
      }
    });
  });

  const totalMemberTasks = Math.max(1, memberBriefs.length);

  // Top Specializations
  const topSpecializations: MemberWorkTypeSpecialization[] = Object.values(catStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(c => ({
      category: c.category,
      count: c.count,
      percentage: Math.round((c.count / totalMemberTasks) * 100),
      totalSaveCost: c.saveCost
    }));

  // Best Performances (งานที่ทำได้ดีเด่น)
  const bestPerformances: MemberBestPerformance[] = Object.values(catStats)
    .filter(c => c.completedCount >= 1)
    .map(c => {
      const avgDays = Number((c.totalDuration / c.completedCount).toFixed(1));
      const totalOnTimeTested = c.onTimeCount + c.lateCount;
      const onTimeRate = totalOnTimeTested > 0 
        ? Math.round((c.onTimeCount / totalOnTimeTested) * 100) 
        : 100;

      let ratingBadge: 'fastest' | 'flawless' | 'high_volume' = 'flawless';
      let highlightText = `ตรงเวลา ${onTimeRate}% (เฉลี่ย ${avgDays} วัน)`;

      if (avgDays <= 2.0 && c.completedCount >= 2) {
        ratingBadge = 'fastest';
        highlightText = `ปิดงานเร็วเป็นเลิศ (เฉลี่ยเพียง ${avgDays} วัน)`;
      } else if (onTimeRate === 100 && c.completedCount >= 2) {
        ratingBadge = 'flawless';
        highlightText = `ส่งมอบตรงเวลาแม่นยำ 100% ไร้งานดีเลย์`;
      } else if (c.count >= 4) {
        ratingBadge = 'high_volume';
        highlightText = `ชำนาญสูง ปิดงานไปแล้ว ${c.completedCount} ชิ้น`;
      }

      return {
        category: c.category,
        count: c.count,
        avgTurnaroundDays: avgDays,
        onTimeRate,
        ratingBadge,
        highlightText
      };
    })
    .sort((a, b) => {
      if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
      return a.avgTurnaroundDays - b.avgTurnaroundDays;
    })
    .slice(0, 3);

  // Client Team Affinities (ชอบทำงานกับทีมไหน)
  const clientTeamAffinities: TeamAffinity[] = Object.values(clientTeamStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(t => ({
      teamKey: t.key,
      teamName: t.name,
      count: t.count,
      percentage: Math.round((t.count / totalMemberTasks) * 100),
      saveCost: t.saveCost
    }));

  // Peer Collaborations (คู่หูที่ร่วมงานบ่อยที่สุด)
  const peerCollaborations: PeerAffinity[] = Object.values(peerStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(p => {
      const info = assigneeNameMap.get(p.peerId);
      const name = info ? info.name : p.peerId;
      const unit = info ? info.unit : "";
      let roleDesc = `ร่วมงานกัน ${p.count} งาน`;
      let roleType: 'peer_assisted' | 'i_assisted' | 'mutual' = 'mutual';
      if (p.asOwnerCount > p.asAssistCount) {
        roleDesc = `มาช่วยเรา ${p.count} งาน`;
        roleType = 'peer_assisted';
      } else if (p.asAssistCount > p.asOwnerCount) {
        roleDesc = `เราไปช่วย ${p.count} งาน`;
        roleType = 'i_assisted';
      }

      return {
        peerId: p.peerId,
        peerName: name,
        peerUnit: unit,
        collaborationCount: p.count,
        roleDescription: roleDesc,
        roleType
      };
    });

  return {
    assigneeId: memberId,
    statusBreakdown: {
      total: memberBriefs.length,
      pending,
      inProgress,
      completed,
      overdue
    },
    topSpecializations,
    bestPerformances,
    clientTeamAffinities,
    peerCollaborations
  };
}

// =========================================================================
// 4 KEY TEAM MANAGEMENT METRICS (ความต่อเนื่อง, มูลค่าเฉลี่ย, งานช่วย, สัปดาห์พีค)
// =========================================================================

export interface MemberContinuityInsight {
  assigneeId: string;
  name: string;
  unit: string;

  // Metric 1: Active Workload Continuity (Burnout Risk)
  activeWeeksCount: number;
  totalWeeksObserved: number;
  continuityRate: number; // 0 - 100%
  consecutiveActiveWeeks: number;
  weeklyAverageTasks: number; // เฉลี่ยจำนวนงานต่อสัปดาห์
  burnoutRiskLevel: 'critical' | 'warning' | 'normal';
  burnoutStatusText: string;

  // Metric 2: Average Value per Task (฿/ชิ้น)
  totalSaveCost: number;
  totalTasks: number;
  avgValuePerTask: number;
  impactProfile: 'high_impact' | 'high_volume' | 'balanced';
  impactBadgeText: string;

  // Metric 3: Assistant / Support Ratio
  ownerTaskCount: number;
  assistantTaskCount: number;
  assistantRatio: number; // 0 - 100%
  assistantSaveCost: number;
  supportProfile: 'top_supporter' | 'balanced' | 'lead_driver';
  supportBadgeText: string;

  // Metric 4: Personal Peak Spike
  peakWeekLabel: string;
  peakWeekCount: number;
}

export interface TeamPeakSpike {
  weekIndex: number;
  weekKey: string;
  weekLabel: string;
  startDateStr: string;
  endDateStr: string;
  concurrentTaskCount: number;
  completedTaskCount: number;
  totalSaveCost: number;
  ratioToAverage: number; // e.g. 1.8x
  isPeak: boolean;
}

export interface TeamWorkloadInsights {
  // 1. Continuity & Burnout
  teamAvgContinuityRate: number;
  burnoutRiskCount: number;
  burnoutRiskMembers: MemberContinuityInsight[];

  // 2. Average Value
  teamAvgValuePerTask: number;
  highImpactCount: number;
  topValueMember: MemberContinuityInsight | null;

  // 3. Support Ratio
  teamAvgAssistantRatio: number;
  topSupportCount: number;
  topSupportMember: MemberContinuityInsight | null;

  // 4. Team Peak Spikes
  peakSpikePeriod: TeamPeakSpike | null;
  topSpikePeriods: TeamPeakSpike[];
  teamWeeklyAverageTasks: number;

  // Current Observation Period
  currentMonthRangeLabel: string; // e.g. "1 - 9 ก.ย. (เดือนปัจจุบัน)"

  // All member insights
  memberInsights: MemberContinuityInsight[];
  weeklySpikes: TeamPeakSpike[];
}

const THAI_MONTH_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function computeTeamWorkloadInsights({
  briefs,
  assignees,
  memberStats,
  weeksToObserve = 16
}: {
  briefs: BriefTaskLike[];
  assignees: { id: string; name: string; unit?: string }[];
  memberStats: MemberStats[];
  weeksToObserve?: number;
}): TeamWorkloadInsights {
  const now = Date.now();
  const ONE_DAY_MS = 86400000;
  const ONE_WEEK_MS = ONE_DAY_MS * 7;

  // Pre-process briefs for rapid lookup (exclude cancelled, deleted, purged, and test tasks)
  const nonCancelledBriefs = briefs.filter((b: any) => {
    if (!b || b.status === 'cancelled' || b.status === 'purged') return false;
    const d = b.details || {};
    if (d.is_deleted === true || d.is_permanently_deleted === true || d.is_test === true) return false;
    return true;
  });

  // Determine realistic observation window based on available data
  let earliestCreated = now;
  nonCancelledBriefs.forEach((b) => {
    const t = new Date(b.created_at || now).getTime();
    if (t < earliestCreated) earliestCreated = t;
  });

  // Calculate actual span of weeks with recorded data (minimum 4 weeks, up to weeksToObserve)
  const actualSpanWeeks = Math.max(4, Math.ceil((now - earliestCreated) / ONE_WEEK_MS));
  const effectiveWeeks = Math.min(weeksToObserve, actualSpanWeeks);

  // Build weekly intervals (from earliest to current week)
  interface WeekInterval {
    index: number;
    start: number;
    end: number;
    key: string;
    label: string;
    startDateStr: string;
    endDateStr: string;
  }

  const intervals: WeekInterval[] = [];
  for (let i = effectiveWeeks - 1; i >= 0; i--) {
    const end = now - i * ONE_WEEK_MS;
    const start = end - ONE_WEEK_MS;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const sLabel = `${sDate.getDate()} ${THAI_MONTH_ABBR[sDate.getMonth()]}`;
    const eLabel = `${eDate.getDate()} ${THAI_MONTH_ABBR[eDate.getMonth()]}`;
    const key = `w-${i}`;
    const label = i === 0 ? 'สัปดาห์นี้' : `${i} สัปดาห์ก่อน`;

    intervals.push({
      index: effectiveWeeks - 1 - i,
      start,
      end,
      key,
      label,
      startDateStr: sLabel,
      endDateStr: eLabel,
    });
  }

  const processedBriefs = nonCancelledBriefs.map((b) => {
    const created = new Date(b.created_at || now).getTime();
    const completed = b.status === 'completed' && b.completed_at ? new Date(b.completed_at).getTime() : null;
    const { totalSaveCost, ownerShare, assistantShares } = getTaskFinancialDistribution(b);
    const participantIds = new Set<string>();
    if (b.assignee_id) participantIds.add(b.assignee_id);
    (b.details?.assistants || []).forEach((ast: any) => {
      if (ast.assignee_id && Number(ast.percentage) > 0) participantIds.add(ast.assignee_id);
    });

    return {
      id: b.id,
      created,
      completed,
      status: b.status,
      participantIds,
      totalSaveCost,
      ownerAssigneeId: b.assignee_id,
      assistants: b.details?.assistants || []
    };
  });

  // Calculate weekly concurrent tasks & spikes across team
  const weeklySpikes: TeamPeakSpike[] = intervals.map((interval) => {
    let concurrent = 0;
    let completedInWeek = 0;
    let saveCostInWeek = 0;

    processedBriefs.forEach((b) => {
      const isActiveInWeek = b.created <= interval.end && (!b.completed || b.completed >= interval.start);
      if (isActiveInWeek) {
        concurrent++;
      }

      if (b.completed && b.completed >= interval.start && b.completed <= interval.end) {
        completedInWeek++;
        saveCostInWeek += b.totalSaveCost;
      }
    });

    return {
      weekIndex: interval.index,
      weekKey: interval.key,
      weekLabel: interval.label,
      startDateStr: interval.startDateStr,
      endDateStr: interval.endDateStr,
      concurrentTaskCount: concurrent,
      completedTaskCount: completedInWeek,
      totalSaveCost: saveCostInWeek,
      ratioToAverage: 1,
      isPeak: false,
    };
  });

  // Calculate baseline average from active weeks for meaningful ratio
  const activeWeeks = weeklySpikes.filter((w) => w.concurrentTaskCount > 0);
  const baselineAverage = activeWeeks.length > 0
    ? Number((activeWeeks.reduce((acc, w) => acc + w.concurrentTaskCount, 0) / activeWeeks.length).toFixed(1))
    : 1;

  const teamWeeklyAverageTasks = baselineAverage;

  let maxConcurrent = 0;
  weeklySpikes.forEach((w) => {
    w.ratioToAverage = baselineAverage > 0 ? Number((w.concurrentTaskCount / baselineAverage).toFixed(1)) : 1;
    if (w.concurrentTaskCount > maxConcurrent) {
      maxConcurrent = w.concurrentTaskCount;
    }
  });

  weeklySpikes.forEach((w) => {
    if (w.concurrentTaskCount === maxConcurrent && maxConcurrent > 0) {
      w.isPeak = true;
    }
  });

  const peakSpikePeriod = weeklySpikes.find((w) => w.isPeak) || weeklySpikes[weeklySpikes.length - 1] || null;
  const topSpikePeriods = [...weeklySpikes]
    .sort((a, b) => b.concurrentTaskCount - a.concurrentTaskCount)
    .slice(0, 4);

  // Compute 4 metrics for each member
  const memberInsights: MemberContinuityInsight[] = memberStats.map((m) => {
    const memberId = m.assignee_id;

    // 1. Weekly activity
    let activeWeeksCount = 0;
    const activeInIntervals: boolean[] = [];

    // Track weekly task count for this member to find personal peak
    let memberPeakCount = 0;
    let memberPeakLabel = 'สัปดาห์นี้';

    intervals.forEach((interval) => {
      let countInWeek = 0;
      processedBriefs.forEach((b) => {
        if (!b.participantIds.has(memberId)) return;
        const isActiveInWeek = b.created <= interval.end && (!b.completed || b.completed >= interval.start);
        if (isActiveInWeek) {
          countInWeek++;
        }
      });

      if (countInWeek > 0) {
        activeWeeksCount++;
        activeInIntervals.push(true);
      } else {
        activeInIntervals.push(false);
      }

      if (countInWeek > memberPeakCount) {
        memberPeakCount = countInWeek;
        memberPeakLabel = `${interval.label} (${interval.startDateStr} - ${interval.endDateStr})`;
      }
    });

    // Consecutive active weeks counting back from the latest week (intervals[intervals.length - 1])
    let consecutiveActiveWeeks = 0;
    for (let i = activeInIntervals.length - 1; i >= 0; i--) {
      if (activeInIntervals[i]) {
        consecutiveActiveWeeks++;
      } else {
        break;
      }
    }

    // Average tasks per active week (or per observed weeks)
    const effectiveWeeksDiv = Math.max(1, activeWeeksCount);
    const weeklyAverageTasks = Number((m.totalTasksInvolved / effectiveWeeksDiv).toFixed(1));

    const continuityRate = Math.round((activeWeeksCount / Math.max(1, intervals.length)) * 100);

    let burnoutRiskLevel: 'critical' | 'warning' | 'normal' = 'normal';
    let burnoutStatusText = `ภาระงานเหมาะสม เฉลี่ย ~${weeklyAverageTasks} งาน/สัปดาห์`;

    if (continuityRate >= 90 || consecutiveActiveWeeks >= 8) {
      burnoutRiskLevel = 'critical';
      burnoutStatusText = `⚠️ งานต่อเนื่องติดกันนาน (${weeklyAverageTasks} งาน/สัปดาห์ ควรเกลี่ยงานออก)`;
    } else if (continuityRate >= 75 || consecutiveActiveWeeks >= 5) {
      burnoutRiskLevel = 'warning';
      burnoutStatusText = `⚡ ภาระงานค่อนข้างแน่น (~${weeklyAverageTasks} งาน/สัปดาห์ เฝ้าระวัง)`;
    }

    // 2. Average Value per Task
    const totalTasks = m.totalTasksInvolved;
    const avgValuePerTask = totalTasks > 0 ? Math.round(m.totalSaveCost / totalTasks) : 0;

    let impactProfile: 'high_impact' | 'high_volume' | 'balanced' = 'balanced';
    let impactBadgeText = 'สมดุล (Balanced)';

    if (avgValuePerTask >= 30000 || (m.totalSaveCost >= 200000 && totalTasks <= 10)) {
      impactProfile = 'high_impact';
      impactBadgeText = '💎 High-Impact Specialist (งานยาก/มูลค่าสูงมาก)';
    } else if (totalTasks >= 15 && avgValuePerTask < 20000) {
      impactProfile = 'high_volume';
      impactBadgeText = '🚀 High-Volume Contributor (เน้นงานไว เชิงปริมาณ)';
    }

    // 3. Assistant / Support Ratio
    const assistantRatio = totalTasks > 0 ? Math.round((m.assistantTaskCount / totalTasks) * 100) : 0;
    let supportProfile: 'top_supporter' | 'balanced' | 'lead_driver' = 'balanced';
    let supportBadgeText = 'ผู้ร่วมงานรอบด้าน';

    if (assistantRatio >= 50) {
      supportProfile = 'top_supporter';
      supportBadgeText = '🤝 เสาหลักงานช่วย (Key Supporter)';
    } else if (assistantRatio <= 20 && m.ownerTaskCount > 0) {
      supportProfile = 'lead_driver';
      supportBadgeText = '🎯 เจ้าของโปรเจกต์หลัก (Lead Driver)';
    }

    return {
      assigneeId: memberId,
      name: m.name,
      unit: m.unit,
      activeWeeksCount,
      totalWeeksObserved: intervals.length,
      continuityRate,
      consecutiveActiveWeeks,
      weeklyAverageTasks,
      burnoutRiskLevel,
      burnoutStatusText,
      totalSaveCost: m.totalSaveCost,
      totalTasks,
      avgValuePerTask,
      impactProfile,
      impactBadgeText,
      ownerTaskCount: m.ownerTaskCount,
      assistantTaskCount: m.assistantTaskCount,
      assistantRatio,
      assistantSaveCost: m.assistantSaveCost,
      supportProfile,
      supportBadgeText,
      peakWeekLabel: memberPeakLabel,
      peakWeekCount: memberPeakCount || m.ownerTaskCount + m.assistantTaskCount
    };
  });

  // Aggregated Team Metrics
  const teamAvgContinuityRate = Math.round(
    memberInsights.reduce((s, m) => s + m.continuityRate, 0) / Math.max(1, memberInsights.length)
  );

  const burnoutRiskMembers = memberInsights.filter((m) => m.burnoutRiskLevel === 'critical');
  const burnoutRiskCount = burnoutRiskMembers.length;

  const totalTeamCost = memberStats.reduce((s, m) => s + m.totalSaveCost, 0);
  const totalTeamTasks = memberStats.reduce((s, m) => s + m.totalTasksInvolved, 0);
  const teamAvgValuePerTask = totalTeamTasks > 0 ? Math.round(totalTeamCost / totalTeamTasks) : 0;

  const highImpactMembers = memberInsights.filter((m) => m.impactProfile === 'high_impact');
  const highImpactCount = highImpactMembers.length;
  const topValueMember = [...memberInsights].sort((a, b) => b.avgValuePerTask - a.avgValuePerTask)[0] || null;

  const totalAssistantTasks = memberStats.reduce((s, m) => s + m.assistantTaskCount, 0);
  const teamAvgAssistantRatio = totalTeamTasks > 0 ? Math.round((totalAssistantTasks / totalTeamTasks) * 100) : 0;
  const topSupportMembers = memberInsights.filter((m) => m.supportProfile === 'top_supporter');
  const topSupportCount = topSupportMembers.length;
  const topSupportMember = [...memberInsights].sort((a, b) => b.assistantRatio - a.assistantRatio)[0] || null;

  const nowDate = new Date(now);
  const currentMonthRangeLabel = `1 - ${nowDate.getDate()} ${THAI_MONTH_ABBR[nowDate.getMonth()]}`;

  return {
    teamAvgContinuityRate,
    burnoutRiskCount,
    burnoutRiskMembers,
    teamAvgValuePerTask,
    highImpactCount,
    topValueMember,
    teamAvgAssistantRatio,
    topSupportCount,
    topSupportMember,
    peakSpikePeriod,
    topSpikePeriods,
    teamWeeklyAverageTasks,
    currentMonthRangeLabel,
    memberInsights,
    weeklySpikes,
  };
}
