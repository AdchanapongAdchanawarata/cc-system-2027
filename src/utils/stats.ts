/**
 * Utility for calculating Save Cost distribution, workload stats,
 * turnaround time, efficiency analytics, SWOT, and managerial risk alerts
 * between Team Leads (e.g., จ๊อบ AA), Unit Leads (e.g., วา WK), and Team Members.
 */

import { getStandardPriceForTask } from './pricing';

export interface AssistantAllocation {
  assignee_id: string;
  percentage: number;
}

export interface BriefTaskLike {
  id: string;
  project_name: string;
  unit: string;
  status: string;
  assignee_id: string | null;
  created_at?: string;
  in_progress_at?: string;
  completed_at?: string;
  deadline?: string | null;
  details?: {
    save_cost?: number;
    project_value?: string | number;
    revenue?: number;
    category?: string;
    type?: string;
    service?: string;
    usage_date?: string;
    publish_date?: string;
    assistants?: AssistantAllocation[];
    [key: string]: any;
  };
}

export interface PersonShare {
  assignee_id: string;
  role: 'owner' | 'assistant';
  percentage: number;
  save_cost: number;
  task_count: number;
}

export function getBriefSaveCost(brief: BriefTaskLike): number {
  const isPM = (brief.details?.category || (brief as any).category) === "PM โครงการของ CC";
  if (isPM) {
    const profit = Number(brief.details?.profit !== undefined ? brief.details.profit : ((Number(brief.details?.revenue) || 0) - (Number(brief.details?.cost) || 0)));
    if (profit > 0) return profit;
  }
  if (brief.details?.save_cost !== undefined && brief.details?.save_cost !== null) {
    return Number(brief.details.save_cost) || 0;
  }
  const category = brief.details?.category || brief.details?.type || brief.details?.service;
  const std = getStandardPriceForTask(brief.unit, category, brief.project_name);
  if (std !== null) {
    return std;
  }
  if (brief.details?.revenue !== undefined && brief.details?.revenue !== null) {
    return Number(brief.details.revenue) || 0;
  }
  if (brief.details?.project_value !== undefined && brief.details?.project_value !== null) {
    return Number(brief.details.project_value) || 0;
  }
  return 0;
}

export function getTaskFinancialDistribution(brief: BriefTaskLike): {
  totalSaveCost: number;
  ownerShare: PersonShare | null;
  assistantShares: PersonShare[];
} {
  const totalCost = getBriefSaveCost(brief);
  const assistants = (brief.details?.assistants || []).filter(
    (a) => a.assignee_id && Number(a.percentage) > 0
  );

  const assistantTotalPercent = assistants.reduce(
    (sum, a) => sum + (Number(a.percentage) || 0),
    0
  );

  const ownerPercent = Math.max(0, 100 - assistantTotalPercent);

  const ownerShare: PersonShare | null = brief.assignee_id
    ? {
        assignee_id: brief.assignee_id,
        role: 'owner',
        percentage: ownerPercent,
        save_cost: Math.round((totalCost * ownerPercent) / 100),
        task_count: 1,
      }
    : null;

  const assistantShares: PersonShare[] = assistants.map((a) => {
    const pct = Number(a.percentage) || 0;
    return {
      assignee_id: a.assignee_id,
      role: 'assistant',
      percentage: pct,
      save_cost: Math.round((totalCost * pct) / 100),
      task_count: 1,
    };
  });

  return {
    totalSaveCost: totalCost,
    ownerShare,
    assistantShares,
  };
}

export interface MemberStats {
  assignee_id: string;
  name: string;
  unit: string;
  primaryUnit?: string;
  ownerTaskCount: number;
  assistantTaskCount: number;
  totalTasksInvolved: number;
  ownerSaveCost: number;
  assistantSaveCost: number;
  totalSaveCost: number;

  // PM Project Profit Attribution
  ownerProfit: number;
  assistantProfit: number;
  totalProfit: number;
  pmProjectsCount: number;

  // Back of House & Team Citizenship Score
  internalTasksCount: number;
  citizenshipScore: number; // 0 - 100
  citizenshipTier: 'champion' | 'anchor' | 'contributor' | 'core';
  citizenshipTitle: string;
  citizenshipPillars: {
    peerSupport: number;      // max 25
    internalOps: number;      // max 25
    systemDiscipline: number; // max 25
    qualityClosure: number;   // max 25
  };

  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  
  // Time and Turnaround Analytics
  totalTurnaroundDays: number;
  completedTasksWithTime: number;
  avgTurnaroundDays: number; // e.g. 2.4 days
  fastestDays: number | null;
  slowestDays: number | null;
  onTimeCompletedCount: number;
  lateCompletedCount: number;
  onTimeRate: number; // percentage (0 - 100)
  overdueTasksCount: number; // ongoing tasks currently past deadline
  stalledPendingCount: number; // pending > 3 days
  stalledProgressCount: number; // in progress > 5 days
  saveCostPerDay: number; // totalSaveCost / Math.max(1, totalTurnaroundDays)
  speedCategory: 'fast' | 'balanced' | 'deep' | 'at_risk';
  
  // Individual SWOT & Actionable Recommendations
  strengths: string[];
  weaknesses: string[];
  actionSteps: string[];
  riskImpacts: string[];
}

export interface UnitRiskAlert {
  unit: string;
  unitLabel: string;
  leadName: string;
  totalTasks: number;
  completedCount: number;
  pendingCount: number;
  stalledPendingCount: number;
  inProgressCount: number;
  stalledProgressCount: number;
  overdueCount: number;
  avgTurnaroundDays: number;
  onTimeRate: number;
  severity: 'normal' | 'warning' | 'critical';
  title: string;
  situation: string;
  actionSteps: string[];
  riskImpacts: string[];
}

export function aggregateMemberWorkloadAndFinancials(
  briefs: BriefTaskLike[],
  assignees: { id: string; name: string; unit?: string }[]
): MemberStats[] {
  const statsMap: Record<string, MemberStats> = {};

  assignees.forEach((a) => {
    let cleanUnit = a.unit || 'other';
    if (cleanUnit.includes('|')) cleanUnit = cleanUnit.split('|')[0];

    statsMap[a.id] = {
      assignee_id: a.id,
      name: a.name.trim(),
      unit: cleanUnit,
      primaryUnit: cleanUnit,
      ownerTaskCount: 0,
      assistantTaskCount: 0,
      totalTasksInvolved: 0,
      ownerSaveCost: 0,
      assistantSaveCost: 0,
      totalSaveCost: 0,
      ownerProfit: 0,
      assistantProfit: 0,
      totalProfit: 0,
      pmProjectsCount: 0,
      internalTasksCount: 0,
      citizenshipScore: 0,
      citizenshipTier: 'contributor',
      citizenshipTitle: 'ผู้สนับสนุนมาตรฐาน (Active Contributor)',
      citizenshipPillars: {
        peerSupport: 0,
        internalOps: 0,
        systemDiscipline: 0,
        qualityClosure: 0,
      },
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      totalTurnaroundDays: 0,
      completedTasksWithTime: 0,
      avgTurnaroundDays: 0,
      fastestDays: null,
      slowestDays: null,
      onTimeCompletedCount: 0,
      lateCompletedCount: 0,
      onTimeRate: 100,
      overdueTasksCount: 0,
      stalledPendingCount: 0,
      stalledProgressCount: 0,
      saveCostPerDay: 0,
      speedCategory: 'balanced',
      strengths: [],
      weaknesses: [],
      actionSteps: [],
      riskImpacts: [],
    };
  });

  const now = Date.now();
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;

  briefs.forEach((brief) => {
    const isCancelled = brief.status === 'cancelled';
    const isCompleted = brief.status === 'completed';
    const isInProgress = brief.status === 'in_progress';
    const isPending = brief.status === 'pending';

    const { ownerShare, assistantShares } = getTaskFinancialDistribution(brief);

    // Calculate turnaround time in days if completed
    let turnaroundDays: number | null = null;
    if (isCompleted && brief.completed_at) {
      const start = new Date(brief.in_progress_at || brief.created_at || brief.completed_at).getTime();
      const end = new Date(brief.completed_at).getTime();
      if (end >= start) {
        turnaroundDays = Math.max(0.2, Number(((end - start) / ONE_DAY_MS).toFixed(1)));
      }
    }

    // Check days in status
    const createdTime = brief.created_at ? new Date(brief.created_at).getTime() : now;
    const inProgressTime = brief.in_progress_at ? new Date(brief.in_progress_at).getTime() : createdTime;
    const daysInPending = isPending ? Math.floor((now - createdTime) / ONE_DAY_MS) : 0;
    const daysInProgress = isInProgress ? Math.floor((now - inProgressTime) / ONE_DAY_MS) : 0;

    const isStalledPending = isPending && daysInPending >= 3;
    const isStalledProgress = isInProgress && daysInProgress >= 5;

    // Check deadline compliance
    const deadlineStr = brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
    const deadlineTime = deadlineStr ? new Date(deadlineStr).getTime() : null;
    let isTaskOnTime: boolean | null = null;
    let isTaskOverdue = false;

    if (deadlineTime) {
      if (isCompleted && brief.completed_at) {
        const completedTime = new Date(brief.completed_at).getTime();
        isTaskOnTime = completedTime <= deadlineTime + 86400000;
      } else if (!isCompleted && !isCancelled) {
        if (now > deadlineTime + 86400000) {
          isTaskOverdue = true;
        }
      }
    }

    // Profit resolution for PM Projects
    const isInternal = (brief.unit || '').toLowerCase() === 'internal';
    const isPM = (brief.details?.category || (brief as any).category) === "PM โครงการของ CC" ||
                 Boolean(brief.details?.project_code && (brief.details?.revenue !== undefined || brief.details?.cost !== undefined));
    const revNum = Number(brief.details?.revenue) || 0;
    const costNum = Number(brief.details?.cost) || 0;
    const taskProfit = brief.details?.profit !== undefined && brief.details?.profit !== null
      ? Number(brief.details?.profit)
      : (revNum - costNum);
    const hasProfit = (isPM || taskProfit > 0) && !isCancelled;

    // Apply to owner
    if (ownerShare && statsMap[ownerShare.assignee_id]) {
      const stat = statsMap[ownerShare.assignee_id];
      stat.ownerTaskCount += 1;
      stat.totalTasksInvolved += 1;
      if (!isCancelled) {
        stat.ownerSaveCost += ownerShare.save_cost;
        stat.totalSaveCost += ownerShare.save_cost;
      }
      if (hasProfit && taskProfit > 0) {
        const ownerProf = Math.round((taskProfit * (ownerShare.percentage || 100)) / 100);
        stat.ownerProfit += ownerProf;
        stat.totalProfit += ownerProf;
        stat.pmProjectsCount += 1;
      }
      if (isInternal) {
        stat.internalTasksCount += 1;
      }
      if (isCompleted) {
        stat.completedTasks += 1;
        if (turnaroundDays !== null) {
          stat.totalTurnaroundDays += turnaroundDays;
          stat.completedTasksWithTime += 1;
          if (stat.fastestDays === null || turnaroundDays < stat.fastestDays) {
            stat.fastestDays = turnaroundDays;
          }
          if (stat.slowestDays === null || turnaroundDays > stat.slowestDays) {
            stat.slowestDays = turnaroundDays;
          }
        }
        if (isTaskOnTime === true) {
          stat.onTimeCompletedCount += 1;
        } else if (isTaskOnTime === false) {
          stat.lateCompletedCount += 1;
        }
      } else if (isInProgress) {
        stat.inProgressTasks += 1;
        if (isStalledProgress) stat.stalledProgressCount += 1;
      } else if (isPending) {
        stat.pendingTasks += 1;
        if (isStalledPending) stat.stalledPendingCount += 1;
      }

      if (isTaskOverdue) {
        stat.overdueTasksCount += 1;
      }
    }

    // Apply to assistants
    assistantShares.forEach((ast) => {
      if (statsMap[ast.assignee_id]) {
        const stat = statsMap[ast.assignee_id];
        stat.assistantTaskCount += 1;
        stat.totalTasksInvolved += 1;
        if (!isCancelled) {
          stat.assistantSaveCost += ast.save_cost;
          stat.totalSaveCost += ast.save_cost;
        }
        if (hasProfit && taskProfit > 0) {
          const astProf = Math.round((taskProfit * (Number(ast.percentage) || 0)) / 100);
          stat.assistantProfit += astProf;
          stat.totalProfit += astProf;
          stat.pmProjectsCount += 1;
        }
        if (isInternal) {
          stat.internalTasksCount += 1;
        }
        if (isCompleted) stat.completedTasks += 1;
        else if (isInProgress) stat.inProgressTasks += 1;
        else if (isPending) stat.pendingTasks += 1;
      }
    });
  });

  const maxAssistTasks = Math.max(...Object.values(statsMap).map(s => s.assistantTaskCount), 1);
  const maxInternalTasks = Math.max(...Object.values(statsMap).map(s => s.internalTasksCount), 1);

  // Calculate final metrics, SWOT, and Action Steps per member
  Object.values(statsMap).forEach((stat) => {
    // Average days
    if (stat.completedTasksWithTime > 0) {
      stat.avgTurnaroundDays = Number(
        (stat.totalTurnaroundDays / stat.completedTasksWithTime).toFixed(1)
      );
    } else {
      stat.avgTurnaroundDays = 0;
    }

    // On-Time rate
    const ratedTasks = stat.onTimeCompletedCount + stat.lateCompletedCount;
    if (ratedTasks > 0) {
      stat.onTimeRate = Math.round((stat.onTimeCompletedCount / ratedTasks) * 100);
    } else {
      stat.onTimeRate = 100;
    }

    // Save Cost per active day
    if (stat.totalTurnaroundDays > 0) {
      stat.saveCostPerDay = Math.round(stat.totalSaveCost / stat.totalTurnaroundDays);
    } else {
      stat.saveCostPerDay = stat.totalSaveCost;
    }

    // Back of House & Citizenship Score (0 - 100)
    const totalTasks = stat.totalTasksInvolved || (stat.ownerTaskCount + stat.assistantTaskCount);
    const assistRatio = totalTasks > 0 ? Math.round((stat.assistantTaskCount / totalTasks) * 100) : 0;
    const peerScore = Math.min(25, Math.round(
      (stat.assistantTaskCount / maxAssistTasks) * 18 + 
      (assistRatio >= 30 ? 7 : (assistRatio / 30) * 7)
    ));
    const internalScore = Math.min(25, Math.round((stat.internalTasksCount / maxInternalTasks) * 25));
    const stalledCount = stat.stalledPendingCount + stat.stalledProgressCount + stat.overdueTasksCount;
    const disciplineScore = Math.min(25, Math.max(5, Math.round(
      (stat.onTimeRate / 100) * 15 + (stalledCount === 0 ? 10 : Math.max(0, 10 - stalledCount * 2.5))
    )));
    const completionRate = totalTasks > 0 ? (stat.completedTasks / totalTasks) * 100 : 100;
    const qualityScore = Math.min(25, Math.max(5, Math.round(
      (completionRate / 100) * 15 + (stat.avgTurnaroundDays > 0 && stat.avgTurnaroundDays <= 3 ? 10 : 7)
    )));

    const totalCitizenship = Math.min(100, Math.max(10, peerScore + internalScore + disciplineScore + qualityScore));
    stat.citizenshipScore = totalCitizenship;
    stat.citizenshipPillars = {
      peerSupport: peerScore,
      internalOps: internalScore,
      systemDiscipline: disciplineScore,
      qualityClosure: qualityScore,
    };

    if (totalCitizenship >= 85) {
      stat.citizenshipTier = 'champion';
      stat.citizenshipTitle = 'เสาหลักหลังบ้าน (Back-of-House Champion)';
    } else if (totalCitizenship >= 70) {
      stat.citizenshipTier = 'anchor';
      stat.citizenshipTitle = 'ผู้ส่งเสริมความร่วมมือ (Collaboration Anchor)';
    } else if (totalCitizenship >= 55) {
      stat.citizenshipTier = 'contributor';
      stat.citizenshipTitle = 'ผู้สนับสนุนมาตรฐาน (Active Contributor)';
    } else {
      stat.citizenshipTier = 'core';
      stat.citizenshipTitle = 'ผู้ปฏิบัติการเน้นงานหลัก (Core Task Specialist)';
    }

    // Speed Category
    if ((stat.overdueTasksCount > 0 || stat.stalledProgressCount > 0) && stat.onTimeRate < 75) {
      stat.speedCategory = 'at_risk';
    } else if (stat.avgTurnaroundDays > 0 && stat.avgTurnaroundDays <= 2.5) {
      stat.speedCategory = 'fast';
    } else if (stat.totalSaveCost >= 8000 || (stat.completedTasks > 0 && stat.totalSaveCost / stat.completedTasks >= 4000)) {
      stat.speedCategory = 'deep';
    } else {
      stat.speedCategory = 'balanced';
    }

    // --- SWOT Analysis ---
    // 1. Strengths
    const strengths: string[] = [];
    if (stat.totalProfit > 0) {
      strengths.push(`สร้างกำไรโครงการ (Project Profit) รวม ฿${stat.totalProfit.toLocaleString()} บาท จาก ${stat.pmProjectsCount} โครงการ`);
    }
    if (stat.citizenshipScore >= 80) {
      strengths.push(`คะแนนการมีส่วนร่วมหลังบ้านระดับสูง (${stat.citizenshipScore}/100 - ${stat.citizenshipTitle}) เป็นที่พึ่งพาสำคัญของทีม`);
    }
    if (stat.onTimeRate >= 90 && stat.completedTasks > 0) {
      strengths.push(`ส่งมอบงานตรงตามกำหนดสูงถึง ${stat.onTimeRate}% (วินัยส่งมอบยอดเยี่ยม)`);
    }
    if (stat.avgTurnaroundDays > 0 && stat.avgTurnaroundDays <= 3) {
      strengths.push(`ปิดงานได้รวดเร็ว คล่องตัวสูง เฉลี่ยเพียง ${stat.avgTurnaroundDays} วัน/งาน`);
    }
    if (stat.assistantTaskCount >= 2) {
      strengths.push(`มีจิตบริการและ Team Collaboration สูง ช่วยเหลือเพื่อนร่วมทีมถึง ${stat.assistantTaskCount} งาน`);
    }
    if (stat.totalSaveCost >= 10000) {
      strengths.push(`ช่วยองค์กรประหยัดต้นทุน (Save Cost) รวม ฿${stat.totalSaveCost.toLocaleString()} บาท`);
    }
    if (strengths.length === 0) {
      strengths.push('มีความรับผิดชอบต่อภาระงานที่ได้รับมอบหมาย');
    }
    stat.strengths = strengths;

    // 2. Weaknesses & Bottlenecks
    const weaknesses: string[] = [];
    if (stat.stalledPendingCount > 0) {
      weaknesses.push(`มีงานค้างในสถานะ Pending นานเกิน 3 วัน จำนวน ${stat.stalledPendingCount} งาน (ยังไม่เริ่มผลิต)`);
    }
    if (stat.stalledProgressCount > 0) {
      weaknesses.push(`มีงานค้างในสถานะ In Progress นานเกิน 5 วัน จำนวน ${stat.stalledProgressCount} งาน (อาจติดคอขวด)`);
    }
    if (stat.overdueTasksCount > 0) {
      weaknesses.push(`มีงานที่เลยกำหนด Deadline แล้ว ${stat.overdueTasksCount} งาน`);
    }
    if (stat.assistantTaskCount === 0 && stat.ownerTaskCount >= 4) {
      weaknesses.push('รับผิดชอบงานเดี่ยวเป็นหลัก ยังขาดการดึงผู้ช่วยมาช่วยลดภาระ');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('ควบคุมสถานะงานได้ตามเกณฑ์มาตรฐาน ไม่พบคอขวดรุนแรง');
    }
    stat.weaknesses = weaknesses;

    // 3. Actionable Remediation Steps (แนวทางแก้ไข 1, 2, 3)
    const actionSteps: string[] = [];
    if (stat.stalledPendingCount > 0) {
      actionSteps.push('1. ตรวจสอบบรีฟด่วน: ติดต่อผู้ขอบรีฟเพื่อคอนเฟิร์มข้อมูลที่ขาดหาย และปรับสถานะเป็น In Progress ทันที');
    } else {
      actionSteps.push('1. จัดลำดับความสำคัญ (Prioritization): โฟกัสงานที่มี Deadline ใกล้ที่สุด 2 ชิ้นแรกก่อน');
    }

    if (stat.stalledProgressCount > 0 || stat.inProgressTasks >= 3) {
      actionSteps.push('2. มอบหมายผู้ช่วย (Assign Assistant): แบ่งเปอร์เซ็นต์ Save Cost 30-50% ให้เพื่อนร่วมทีมเข้ามาช่วยตัดต่อ/ขึ้นอาร์ตเวิร์ก');
    } else {
      actionSteps.push('2. สื่อสารสถานะเชิงรุก: อัปเดตความคืบหน้าให้ผู้ประสานงานทราบทุกสัปดาห์เพื่อความโปร่งใส');
    }

    if (stat.overdueTasksCount > 0 || stat.stalledProgressCount > 0) {
      actionSteps.push('3. ซอยย่อยชิ้นงาน (Milestone Delivery): ส่งมอบดราฟต์แรกให้ผู้ขอตรวจก่อน ไม่รอส่งมอบจนสมบูรณ์ 100%');
    } else {
      actionSteps.push('3. บันทึกผลการ Save Cost และถอดบทเรียนทักษะ เพื่อยกระดับความเร็วในงานประเภทเดียวกัน');
    }
    stat.actionSteps = actionSteps;

    // 4. Risk Impacts (ความเสี่ยง 1, 2, 3)
    const riskImpacts: string[] = [];
    if (stat.overdueTasksCount > 0 || stat.stalledPendingCount > 0 || stat.stalledProgressCount > 0) {
      riskImpacts.push('1. ความเสี่ยงงานล่าช้ากระทบต่อกำหนดการจัดกิจกรรมหรือแคมเปญของผู้ขอบรีฟ (Timeline Cascade)');
      riskImpacts.push('2. ความเสี่ยงต่อความเหนื่อยล้าสะสมของผู้ปฏิบัติงาน (Burnout Risk) จากงานที่คั่งค้าง');
      riskImpacts.push('3. เสียโอกาสในการบันทึกมูลค่า Save Cost เข้าสู่ระบบตามรอบประเมินประจำไตรมาส');
    } else {
      riskImpacts.push('1. ความเสี่ยงจากการรับงานแทรกโดยไม่ได้ปรับแผนเวลาเดิม');
      riskImpacts.push('2. การกระจุกตัวของงานหากมีแคมเปญใหญ่เข้ามาพร้อมกัน');
      riskImpacts.push('3. ความต่อเนื่องของไฟล์ต้นฉบับและการส่งต่องานกรณีลางาน');
    }
    stat.riskImpacts = riskImpacts;
  });

  return Object.values(statsMap).sort((a, b) => b.totalSaveCost - a.totalSaveCost);
}

export interface TeamExecutiveAnalysis {
  totalSaveCost: number;
  ownerSaveCost: number;
  assistantSaveCost: number;
  totalProfit: number;
  avgSaveCostPerMember: number;
  avgProfitPerMember: number;
  teamCitizenshipScore: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  teamAvgTurnaroundDays: number;
  teamOnTimeRate: number;
  speedChampions: MemberStats[];
  valueChampions: MemberStats[];
  teamworkChampions: MemberStats[];
  profitChampions: MemberStats[];
  citizenshipChampions: MemberStats[];
  overdueTasksCount: number;
  stalledPendingTotal: number;
  stalledProgressTotal: number;
  unitRiskAlerts: UnitRiskAlert[];
  teamLeadDirectives: {
    teamLeadName: string;
    overviewDirective: string;
    actionForLead: string[];
    criticalReminders: string[];
  };
  whatWentWell: string[];
  areasForImprovement: string[];
  strategicRecommendations: string[];
}

export function generateTeamExecutiveAnalysis(
  briefs: BriefTaskLike[],
  members: MemberStats[]
): TeamExecutiveAnalysis {
  const totalTasks = briefs.length;
  const completedTasks = briefs.filter((b) => b.status === 'completed').length;
  const inProgressTasks = briefs.filter((b) => b.status === 'in_progress').length;
  const pendingTasks = briefs.filter((b) => b.status === 'pending').length;

  let totalSaveCost = 0;
  let ownerSaveCost = 0;
  let assistantSaveCost = 0;
  let totalProfit = 0;
  let totalCitizenshipScore = 0;

  members.forEach((m) => {
    totalSaveCost += m.totalSaveCost;
    ownerSaveCost += m.ownerSaveCost;
    assistantSaveCost += m.assistantSaveCost;
    totalProfit += m.totalProfit;
    totalCitizenshipScore += m.citizenshipScore;
  });

  const memberCount = Math.max(1, members.length);
  const avgSaveCostPerMember = Math.round(totalSaveCost / memberCount);
  const avgProfitPerMember = Math.round(totalProfit / memberCount);
  const teamCitizenshipScore = Math.round(totalCitizenshipScore / memberCount);

  // Calculate team average turnaround days
  const membersWithTurnaround = members.filter((m) => m.completedTasksWithTime > 0);
  const teamAvgTurnaroundDays =
    membersWithTurnaround.length > 0
      ? Number(
          (
            membersWithTurnaround.reduce((sum, m) => sum + m.avgTurnaroundDays, 0) /
            membersWithTurnaround.length
          ).toFixed(1)
        )
      : 0;

  // Calculate team on-time delivery rate
  const totalOnTime = members.reduce((sum, m) => sum + m.onTimeCompletedCount, 0);
  const totalLate = members.reduce((sum, m) => sum + m.lateCompletedCount, 0);
  const teamOnTimeRate = totalOnTime + totalLate > 0 ? Math.round((totalOnTime / (totalOnTime + totalLate)) * 100) : 100;

  const overdueTasksCount = members.reduce((sum, m) => sum + m.overdueTasksCount, 0);
  const stalledPendingTotal = members.reduce((sum, m) => sum + m.stalledPendingCount, 0);
  const stalledProgressTotal = members.reduce((sum, m) => sum + m.stalledProgressCount, 0);

  // Champions
  const speedChampions = [...members]
    .filter((m) => m.completedTasks > 0 && m.avgTurnaroundDays > 0)
    .sort((a, b) => a.avgTurnaroundDays - b.avgTurnaroundDays)
    .slice(0, 3);

  const valueChampions = [...members].sort((a, b) => b.totalSaveCost - a.totalSaveCost).slice(0, 3);
  const teamworkChampions = [...members].sort((a, b) => b.assistantTaskCount - a.assistantTaskCount).slice(0, 3);
  const profitChampions = [...members].filter(m => m.totalProfit > 0).sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 3);
  const citizenshipChampions = [...members].sort((a, b) => b.citizenshipScore - a.citizenshipScore).slice(0, 3);

  // Unit-by-Unit Risk Alerts with Lead Names
  // CC TEAM ประกอบด้วย 3 Units: Creative, Content, PR และ Internal Unit สำหรับงานภายในของทุกคน
  const unitNames = ['creative', 'content', 'pr', 'internal'];
  const unitDisplay: Record<string, { label: string; defaultLead: string }> = {
    creative: { label: 'Creative', defaultLead: 'วา WK' },
    content: { label: 'Content', defaultLead: 'จ๊อบ AA' },
    pr: { label: 'PR', defaultLead: 'จ๊อบ AA' },
    internal: { label: 'Internal Task (งานภายใน)', defaultLead: 'จ๊อบ AA' }
  };

  const unitRiskAlerts: UnitRiskAlert[] = unitNames.map((u) => {
    const isInternal = u === 'internal';
    // สำหรับ Internal Unit ถือว่าสมาชิกทุกคนในทีมมีส่วนร่วม
    const uMembers = isInternal ? members : members.filter((m) => m.unit?.toLowerCase() === u);
    
    // คำนวณงานที่สังกัด Unit นี้
    const unitBriefs = briefs.filter((b) => (b.unit?.toLowerCase() || '') === u);
    const uPending = unitBriefs.filter((b) => b.status === 'pending').length;
    const uInProgress = unitBriefs.filter((b) => b.status === 'in_progress').length;
    const uCompletedBriefs = unitBriefs.filter((b) => b.status === 'completed');
    const uCompleted = uCompletedBriefs.length;
    const uTotal = unitBriefs.length;
    
    // ตรวจจับงานค้างและคำนวณเวลาส่งมอบ
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;
    const nowTime = Date.now();
    let uStalledPending = 0;
    let uStalledProgress = 0;
    let uOverdue = 0;
    let uTotalDuration = 0;
    let uCompletedWithTime = 0;
    let uOnTimeCount = 0;
    let uLateCount = 0;

    unitBriefs.forEach((b) => {
      const cTime = b.created_at ? new Date(b.created_at).getTime() : nowTime;
      const ipTime = b.in_progress_at ? new Date(b.in_progress_at).getTime() : cTime;
      if (b.status === 'pending' && Math.floor((nowTime - cTime) / ONE_DAY_MS) >= 3) {
        uStalledPending++;
      }
      if (b.status === 'in_progress' && Math.floor((nowTime - ipTime) / ONE_DAY_MS) >= 5) {
        uStalledProgress++;
      }
      const dStr = b.deadline || b.details?.usage_date || b.details?.publish_date;
      if (dStr && b.status !== 'completed' && b.status !== 'cancelled' && nowTime > new Date(dStr).getTime() + 86400000) {
        uOverdue++;
      }
      if (b.status === 'completed') {
        if (b.completed_at) {
          const start = new Date(b.in_progress_at || b.created_at || b.completed_at).getTime();
          const end = new Date(b.completed_at).getTime();
          if (end >= start) {
            uTotalDuration += Math.max(0.2, (end - start) / ONE_DAY_MS);
            uCompletedWithTime++;
          }
        }
        if (dStr && b.completed_at) {
          const deadline = new Date(dStr).getTime() + 86400000;
          const completed = new Date(b.completed_at).getTime();
          if (completed <= deadline) uOnTimeCount++;
          else uLateCount++;
        }
      }
    });

    const avgTurnaroundDays = uCompletedWithTime > 0 ? Number((uTotalDuration / uCompletedWithTime).toFixed(1)) : 0;
    const onTimeRate = uOnTimeCount + uLateCount > 0 ? Math.round((uOnTimeCount / (uOnTimeCount + uLateCount)) * 100) : 100;

    const info = unitDisplay[u] || { label: u.toUpperCase(), defaultLead: 'จ๊อบ AA' };
    const lead = u === 'creative' ? 'วา WK' : 'จ๊อบ AA';

    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    if (uOverdue > 0 || uStalledProgress >= 2 || uStalledPending >= 3) {
      severity = 'critical';
    } else if (uStalledProgress > 0 || uStalledPending > 0 || uPending >= 3) {
      severity = 'warning';
    }

    const title = severity === 'critical'
      ? `🚨 แจ้งเตือนวิกฤต: ${info.label} Unit พบคอขวดสะสมเกินเกณฑ์มาตรฐาน`
      : severity === 'warning'
      ? `⚠️ แจ้งเตือนเฝ้าระวัง: ${info.label} Unit มีงานที่ค้างในระบบเกิน 3-5 วัน`
      : `✅ ${info.label} Unit สภาพคล่องดี ดำเนินการได้ตามกำหนดเวลา`;

    const situation = severity === 'normal'
      ? `${info.label} Unit มีสภาพคล่องดี ไม่พบงานค้างสะสมเกินเกณฑ์ ส่งมอบตรงเวลา ${onTimeRate}% (งานในมือ ${uTotal} งาน)`
      : isInternal
      ? `งานภายในทีม CC (ทุกคนเป็นสมาชิกร่วมกรอกงาน) พบงาน Pending > 3 วัน ${uStalledPending} งาน, Progress > 5 วัน ${uStalledProgress} งาน, เกินกำหนด ${uOverdue} งาน (รวม ${uTotal} งาน)`
      : `พบงานค้างที่ Pending > 3 วัน จำนวน ${uStalledPending} งาน, งานที่ In Progress > 5 วัน จำนวน ${uStalledProgress} งาน, และงานเกินกำหนด ${uOverdue} งาน (จากงานในมือทั้งหมด ${uTotal} งาน)`;

    const actionSteps = severity === 'normal'
      ? [
          `1. ให้ ${lead} รักษามาตรฐานความเร็ว (Best Practices) และจัดลำดับความสำคัญของงานอย่างต่อเนื่อง`,
          `2. ตรวจสอบตารางงานล่วงหน้าใน Pipeline เพื่อเตรียมพร้อมรับบรีฟใหม่ที่จะเข้ามาในงวดถัดไป`,
          `3. พิจารณาปล่อยกำลังคน (Cross-functional Help) ไปช่วยเพื่อนร่วมทีมใน Unit ที่มีงานหนาแน่น`,
        ]
      : [
          `1. ให้ ${lead} จัดประชุมเคลียร์คอขวดด่วน (15-Min Sync) กับผู้รับผิดชอบงานใน Unit ที่ค้างใน Pending/Progress เพื่อสรุปจุดติดขัด`,
          `2. ใช้ระบบผู้ช่วย (Assign Assistants): มอบหมายสมาชิกใน Unit หรือดึงเพื่อนร่วมทีมมาช่วยแบ่งเบา พร้อมกระจาย Save Cost 30-50%`,
          `3. เจรจาขยายกรอบเวลาหรือซอยย่อยชิ้นงาน (Deliver Drafts): ส่งมอบงานส่วนแรกให้ผู้ขอก่อน ไม่ดองงานไว้รอสมบูรณ์ 100%`,
        ];

    const riskImpacts = severity === 'normal'
      ? [
          `1. ความเสี่ยงอยู่ในระดับต่ำมาก: ระบบงานคล่องตัว ไม่ส่งผลกระทบต่อโปรเจกต์ต้นทาง`,
          `2. ทีมงานมี Workload ที่สมดุล ไม่เกิดภาวะหมดไฟ (Low Burnout Risk)`,
        ]
      : [
          `1. ความเสี่ยงส่งผลกระทบต่อ Deadline ของโปรเจกต์ต้นทาง ทำให้การจัดกิจกรรม/แคมเปญสะดุด (Timeline Cascade)`,
          `2. ความเสี่ยงต่อความเหนื่อยล้าของทีมงานใน Unit (Burnout Risk) จากการรับภาระงานสะสมโดยไม่กระจายงาน`,
          `3. สูญเสียโอกาสในการปิดยอด Save Cost ตามรอบประเมินประจำงวดขององค์กร`,
        ];

    return {
      unit: u,
      unitLabel: info.label,
      leadName: lead,
      totalTasks: uTotal,
      completedCount: uCompleted,
      pendingCount: uPending,
      stalledPendingCount: uStalledPending,
      inProgressCount: uInProgress,
      stalledProgressCount: uStalledProgress,
      overdueCount: uOverdue,
      avgTurnaroundDays,
      onTimeRate,
      severity,
      title,
      situation,
      actionSteps,
      riskImpacts,
    };
  });

  // Directives for Team Lead (จ๊อบ AA)
  const teamLeadDirectives = {
    teamLeadName: 'จ๊อบ AA (หัวหน้าทีม CC & ผู้ดูแล Content, PR, Internal)',
    overviewDirective: `ในฐานะหัวหน้าทีม CC และผู้ดูแล Content, PR, และ Internal Unit ควรเข้ากำกับดูแล Unit ที่มีความเสี่ยงสะสม โดยเฉพาะ Creative Unit (ดูแลโดย วา WK) เพื่อกระจายทรัพยากรให้สมดุล`,
    actionForLead: [
      '1. ติดตามสถานะงานกับ วา WK (ผู้ดูแล Creative Unit) อย่างสม่ำเสมอใน Weekly Standup เพื่อร่วมกันปลดล็อกคอขวด',
      '2. กำกับดูแลงานใน Content Unit, PR Unit และ Internal Tasks ที่ตนเองดูแลโดยตรง ให้ส่งมอบตรงเวลา',
      '3. พิจารณา Reallocate กำลังคนข้าม Unit (Cross-functional help) โดยโยกทีมที่มีภาระเบาไปช่วย Unit ที่งานหนาแน่น',
      '4. เป็นตัวกลางเจรจาตัดทอน Scope งานกับผู้บริหารหรือผู้ขอบรีฟ หากพบว่าเป็นงานที่มีความซับซ้อนสูงเกินทรัพยากร',
    ],
    criticalReminders: [
      'หากงานที่ค้างใน Pending เกิน 5 วัน ไม่ได้รับการมอบหมายหรือเริ่มทำ จะทำให้เกิดความรู้สึกว่าทีมตอบสนองช้า (Slow Response Rate)',
      'ควรกำหนดให้งานที่มีมูลค่า Save Cost สูงเกิน ฿5,000 มีผู้ช่วยประกบอย่างน้อย 1 คนเสมอ เพื่อลด Single Point of Failure',
      'สมาชิกทุกคนใน CC Team ต้องลงบันทึกงานภายในใน Internal Unit อย่างครบถ้วน เพื่อให้เห็นปริมาณงานจริง 100%',
    ],
  };

  // Commentary
  const whatWentWell: string[] = [
    `ทีมช่วยประหยัดงบประมาณองค์กร (In-House Save Cost) ได้รวม ฿${totalSaveCost.toLocaleString()} บาท จากการผลิตผลงานเองโดยไม่ต้องพึ่งพา Outsource`,
    `อัตราการส่งมอบงานตรงตามกำหนด (On-Time Delivery Rate) อยู่ที่ ${teamOnTimeRate}% สะท้อนวินัยในการส่งมอบงานที่วางใจได้`,
    `มีความร่วมมือแบบ Cross-functional Collaboration โดยมีการแบ่งงานผู้ช่วยรวม ฿${assistantSaveCost.toLocaleString()} บาท คิดเป็น ${totalSaveCost > 0 ? Math.round((assistantSaveCost / totalSaveCost) * 100) : 0}% ของมูลค่าทั้งหมด`,
  ];

  if (speedChampions.length > 0) {
    whatWentWell.push(
      `บุคลากรที่ส่งมอบงานได้รวดเร็วโดดเด่น ได้แก่ ${speedChampions.map((c) => `${c.name} (${c.avgTurnaroundDays} วัน)`).join(', ')}`
    );
  }

  const areasForImprovement: string[] = [];
  if (overdueTasksCount > 0) {
    areasForImprovement.push(
      `พบงานคั่งค้างเกินกำหนด (Overdue Tasks) รวม ${overdueTasksCount} งาน ต้องเร่งรัดหรือขอความช่วยเหลือข้าม Unit ทันที`
    );
  }
  if (stalledPendingTotal > 0) {
    areasForImprovement.push(
      `มีงานค้างในสถานะ Pending นานเกิน 3 วัน รวม ${stalledPendingTotal} งาน ควรเร่งเคลียร์บรีฟและเริ่มกระบวนการผลิต`
    );
  }
  if (stalledProgressTotal > 0) {
    areasForImprovement.push(
      `มีงานในสถานะ In Progress นานเกิน 5 วัน รวม ${stalledProgressTotal} งาน ควรตรวจสอบว่าติดปัญหาอะไรและส่งดราฟต์แรกให้ตรวจ`
    );
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('ไม่พบคอขวดรุนแรง ควรรักษาความเร็วและการมอนิเตอร์สถานะงานเช่นนี้ต่อเนื่อง');
  }

  const strategicRecommendations: string[] = [
    'นำสัดส่วนการแบ่งผู้ช่วย (Assistant %) มาใช้เป็น KPI สนับสนุนการสอนงาน (Mentorship) และสร้างทักษะข้ามสายงาน (Cross-skilling)',
    'จัดลำดับความสำคัญของงานกลุ่ม High Save Cost แต่ใช้เวลาสั้น (High Velocity Tasks) เพื่อสร้างผลสัมฤทธิ์อย่างรวดเร็ว (Quick Wins)',
    'สำหรับงานขนาดใหญ่ที่ใช้เวลานาน ให้ซอยย่อย Milestone ย่อย เพื่อให้มองเห็นความคืบหน้าระหว่างทางและป้องกันความล่าช้า',
  ];

  return {
    totalSaveCost,
    ownerSaveCost,
    assistantSaveCost,
    totalProfit,
    avgSaveCostPerMember,
    avgProfitPerMember,
    teamCitizenshipScore,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    teamAvgTurnaroundDays,
    teamOnTimeRate,
    speedChampions,
    valueChampions,
    teamworkChampions,
    profitChampions,
    citizenshipChampions,
    overdueTasksCount,
    stalledPendingTotal,
    stalledProgressTotal,
    unitRiskAlerts,
    teamLeadDirectives,
    whatWentWell,
    areasForImprovement,
    strategicRecommendations,
  };
}
