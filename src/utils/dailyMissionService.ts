import { BriefTaskLike } from "@/utils/stats";
import { getMemberCustomQuote } from "@/utils/memberQuote";

export interface DailyMissionResult {
  hasMission: boolean;
  memberName: string;
  memberEmail: string;
  roleTitle: string;
  isDesignLead: boolean;
  isGeneralLead: boolean;
  headline: string;
  urgentTasksCount: number;
  unassignedCount: number;
  overdueCount: number;
  inProgressCount: number;
  missions: string[];
  positiveImpact: string;
  riskImpact: string;
  encouragementQuote: string;
  suggestedActionLabel: string;
  timestamp: string;
}

const ENCOURAGEMENT_QUOTES = [
  "ร่วมมือร่วมใจ เปลี่ยนทุกบรีฟให้เป็นผลงานยอดเยี่ยม",
  "เริ่มต้นด้วยพลัง สร้างสรรค์งานด้วยความตั้งใจ",
  "วินัยและความใส่ใจ คือหัวใจของผลงานมืออาชีพ",
  "ทุกชิ้นงานคือภาพลักษณ์และความภูมิใจของทีม CC",
  "เติมไฟให้พร้อม แล้วสร้างสรรค์สิ่งดีๆ ไปด้วยกัน"
];

export function computeDailyMission(
  briefs: BriefTaskLike[],
  memberName: string,
  memberEmail: string
): DailyMissionResult {
  const normName = (memberName || "").toLowerCase().trim();
  const normEmail = (memberEmail || "").toLowerCase().trim();

  const isWah = normName.includes("วา") || normName.includes("wk") || normEmail.includes("wasita");
  const isKong = normName.includes("ก้อง") || normName.includes("kong") || normEmail.includes("thanawut");
  const isJob = normName.includes("จ๊อบ") || normName.includes("aa") || normEmail.includes("adchanapong");

  const isDesignLead = isWah || isKong;
  const isGeneralLead = isJob;

  const activeBriefs = (briefs || []).filter(
    (b) => !b.details?.is_deleted && !b.details?.is_permanently_deleted && b.status !== "purged"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Creative/Design tasks
  const designBriefs = activeBriefs.filter((b) => {
    const u = (b.unit || "").toLowerCase();
    const c = (b.details?.category || b.category || "").toLowerCase();
    return u === "creative" || u === "design" || c.includes("design") || c.includes("ออกแบบ");
  });

  const unassignedDesign = designBriefs.filter(
    (b) => (!b.assignee_id || b.assignee_id === "unassigned" || b.assignee_id === "") && b.status === "pending"
  );

  const overdueDesign = designBriefs.filter((b) => {
    const isNotDone = b.status === "pending" || b.status === "in_progress";
    const d = b.details?.publish_date || b.deadline || b.details?.target_deadline;
    return isNotDone && d && new Date(d).getTime() < today.getTime();
  });

  const inProgressDesign = designBriefs.filter((b) => b.status === "in_progress");

  // General unassigned
  const allUnassigned = activeBriefs.filter(
    (b) => (!b.assignee_id || b.assignee_id === "unassigned" || b.assignee_id === "") && b.status === "pending"
  );

  const allOverdue = activeBriefs.filter((b) => {
    const isNotDone = b.status === "pending" || b.status === "in_progress";
    const d = b.details?.publish_date || b.deadline || b.details?.target_deadline;
    return isNotDone && d && new Date(d).getTime() < today.getTime();
  });

  // Tasks assigned to this specific member
  const myTasks = activeBriefs.filter((b) => {
    const isPrimary = (b.assignee_name || "").toLowerCase().includes(normName) ||
                      (b.details?.assignee_name || "").toLowerCase().includes(normName);
    const isAssist = Array.isArray(b.details?.assistants) &&
                     b.details.assistants.some((ast: any) => (ast.name || "").toLowerCase().includes(normName));
    return isPrimary || isAssist;
  });

  const myOverdue = myTasks.filter((b) => {
    const isNotDone = b.status === "pending" || b.status === "in_progress";
    const d = b.details?.publish_date || b.deadline || b.details?.target_deadline;
    return isNotDone && d && new Date(d).getTime() < today.getTime();
  });

  const myDueToday = myTasks.filter((b) => {
    const isNotDone = b.status === "pending" || b.status === "in_progress";
    const d = b.details?.publish_date || b.deadline || b.details?.target_deadline;
    if (!isNotDone || !d) return false;
    const taskDate = new Date(d);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const myInProgress = myTasks.filter((b) => b.status === "in_progress");

  const customMemberQuote = getMemberCustomQuote(memberName);
  const quote = customMemberQuote || ENCOURAGEMENT_QUOTES[Math.floor(Math.random() * ENCOURAGEMENT_QUOTES.length)];

  // Case 1: Design Supervisor / Leads (วา WK, ก้อง)
  if (isDesignLead) {
    const missions: string[] = [];
    if (unassignedDesign.length > 0) {
      missions.push(`🎨 มีงานออกแบบตกค้างใน UNASSIGNED จำนวน ${unassignedDesign.length} งาน ต้องเร่งพิจารณาและมอบหมายผู้รับผิดชอบทันที`);
    }
    if (overdueDesign.length > 0) {
      missions.push(`🚨 ตรวจพบงานออกแบบในยูนิตเกินกำหนดส่ง (Overdue) ${overdueDesign.length} งาน ต้องเร่งรัดและติดตามดราฟต์ด่วน`);
    }
    if (inProgressDesign.length > 0) {
      missions.push(`👀 ติดตามความคืบหน้านักออกแบบในยูนิตที่กำลังดำเนินการอยู่ ${inProgressDesign.length} งาน เพื่อให้ส่งดราฟต์แรกตามแผน`);
    }
    if (missions.length === 0) {
      missions.push(`✨ ยูนิต Creative & Design จัดสรรคิวงานได้ยอดเยี่ยม ไม่มีงานค้างใน UNASSIGNED ตรวจสอบความเรียบร้อยของชิ้นงานตามกำหนด`);
    }

    return {
      hasMission: true,
      memberName: isWah ? "วา WK" : (isKong ? "ก้อง IK" : (memberName || "ทีมงาน")),
      memberEmail,
      roleTitle: "ผู้ดูแลและควบคุมกำกับงานออกแบบ (Design Unit Lead)",
      isDesignLead: true,
      isGeneralLead: false,
      headline: `ภารกิจกำกับดูแลงานออกแบบประจำวัน (${unassignedDesign.length} รอมอบหมาย • ${overdueDesign.length} เกินกำหนด)`,
      urgentTasksCount: unassignedDesign.length + overdueDesign.length,
      unassignedCount: unassignedDesign.length,
      overdueCount: overdueDesign.length,
      inProgressCount: inProgressDesign.length,
      missions,
      positiveImpact: "💡 ผลลัพธ์เชิงบวก: เมื่อแจกแจงงานรวดเร็ว งานจะไม่คั่งค้าง หนุนตัวชี้วัด KR2/R3 ด้านงานผลิต และสร้างระดับความพึงพอใจของผู้รับบริการสูงกว่าเกณฑ์เป้าหมาย (≥ 85%)",
      riskImpact: "⚠️ ความเสี่ยงหากละเลย: งานใน UNASSIGNED ที่ไม่ถูกมอบหมายจะทำให้เวลาผลิตหดสั้นลง เกิดงานเร่งกระชั้นชิด งานเกินกำหนดส่ง และฉุดคะแนนประสิทธิภาพของยูนิต Creative",
      encouragementQuote: quote,
      suggestedActionLabel: unassignedDesign.length > 0 ? "เร่งมอบหมายงานใน UNASSIGNED ทันที" : "เข้าตรวจสอบคิวงานออกแบบ",
      timestamp: new Date().toISOString(),
    };
  }

  // Case 2: Team Admin / General Lead (จ๊อบ AA)
  if (isGeneralLead) {
    const missions: string[] = [];
    if (allUnassigned.length > 0) {
      missions.push(`📋 ตรวจสอบคิวงานใหม่ที่ยังไม่ระบุผู้รับผิดชอบรวม ${allUnassigned.length} งาน ประสานหัวหน้ายูนิตเร่งแจกแจง`);
    }
    if (allOverdue.length > 0) {
      missions.push(`⚠️ มีงานค้างเกินกำหนดส่งในระบบรวม ${allOverdue.length} งาน ติดตามเพื่อประเมินความเสี่ยงและสนับสนุนข้ามยูนิต`);
    }
    missions.push(`📊 ตรวจสอบภาพรวมตัวชี้วัด OKRs & Financial Save Cost และบริหารโควต้าการส่งสรุปประจำวัน`);

    return {
      hasMission: true,
      memberName: "จ๊อบ AA",
      memberEmail,
      roleTitle: "หัวหน้าทีมและผู้บริหารระบบ (CC Team Leader)",
      isDesignLead: false,
      isGeneralLead: true,
      headline: `ภารกิจบริหารและกำกับภาพรวมทีมประจำวัน (${allUnassigned.length} รอมอบหมาย • ${allOverdue.length} เกินกำหนด)`,
      urgentTasksCount: allUnassigned.length + allOverdue.length,
      unassignedCount: allUnassigned.length,
      overdueCount: allOverdue.length,
      inProgressCount: activeBriefs.filter((b) => b.status === "in_progress").length,
      missions,
      positiveImpact: "💡 ผลลัพธ์เชิงบวก: ควบคุมภาพรวมงานได้ราบรื่น หนุนเป้าหมาย KR2/KR3/KR4 สร้างความพึงพอใจของผู้รับบริการ และรักษาเสถียรภาพของทีม",
      riskImpact: "⚠️ ความเสี่ยงหากละเลย: งานที่คอขวดอาจไม่ได้รับการกระจายความช่วยเหลือทันท่วงที ส่งผลต่อกำหนดส่งขององค์กร",
      encouragementQuote: quote,
      suggestedActionLabel: "เข้าสู่หน้าบริหารจัดการงานทีม",
      timestamp: new Date().toISOString(),
    };
  }

  // Case 3: Team Specialists & Operational Members
  const missions: string[] = [];
  if (myOverdue.length > 0) {
    missions.push(`🚨 คุณมีงานที่เกินกำหนดส่ง ${myOverdue.length} งาน เร่งประสานหรือส่งดราฟต์เพื่อปิดงาน`);
  }
  if (myDueToday.length > 0) {
    missions.push(`🗓️ มีงานที่มีกำหนดส่งมอบในวันนี้ ${myDueToday.length} งาน ตรวจเช็คความถูกต้องและส่งมอบ`);
  }
  if (myInProgress.length > 0) {
    missions.push(`⚡ เดินหน้าทำงานที่กำลังดำเนินการ ${myInProgress.length} งาน เพื่อให้พร้อมส่งตรวจตามกรอบเวลา`);
  }
  if (missions.length === 0) {
    missions.push(`✨ ปัจจุบันไม่มีงานคั่งค้างหรือเกินกำหนด ตรวจสอบบรีฟใน TO-DO LIST หรือสนับสนุนเพื่อนร่วมทีม`);
  }

  return {
    hasMission: true,
    memberName: memberName || "เพื่อนร่วมทีม CC",
    memberEmail,
    roleTitle: "ผู้ปฏิบัติงานทีมสร้างสรรค์และการสื่อสาร (Creative Specialist)",
    isDesignLead: false,
    isGeneralLead: false,
    headline: `ภารกิจประจำวันของคุณ (${myDueToday.length} ส่งวันนี้ • ${myOverdue.length} เกินกำหนด)`,
    urgentTasksCount: myOverdue.length + myDueToday.length,
    unassignedCount: 0,
    overdueCount: myOverdue.length,
    inProgressCount: myInProgress.length,
    missions,
    positiveImpact: "💡 ผลลัพธ์เชิงบวก: การส่งมอบตรงเวลาช่วยสร้างประวัติการทำงานที่ดีเด่น หนุนค่า R ในตัวชี้วัดบุคคล และสร้างความพึงพอใจของผู้รับบริการในระดับยอดเยี่ยม",
    riskImpact: "⚠️ ความเสี่ยงหากล่าช้า: ส่งผลต่อแผนการประชาสัมพันธ์ของหน่วยงานผู้ขอ และกระทบอัตราส่งมอบตรงเวลา (On-Time Delivery)",
    encouragementQuote: quote,
    suggestedActionLabel: "เข้าเริ่มปฏิบัติงานใน To-Do List",
    timestamp: new Date().toISOString(),
  };
}
