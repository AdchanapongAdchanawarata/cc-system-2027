import { BriefTaskLike } from "@/utils/stats";
import { getMemberCustomQuote } from "@/utils/memberQuote";
import { isExecutive } from "@/utils/memberProfile";

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
  dueTodayCount?: number;
  todoCount?: number;
  myTasksCount?: number;
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
  memberEmail: string,
  assignees?: { id: string; name: string; email?: string }[]
): DailyMissionResult {
  // If the member is an Executive/Director, do NOT generate operational daily mission cards
  if (isExecutive(memberName) || isExecutive(memberEmail)) {
    return {
      hasMission: false,
      memberName: memberName || "ผู้บริหาร",
      memberEmail: memberEmail || "",
      roleTitle: "ผู้บริหาร (Executive / Advisory)",
      isDesignLead: false,
      isGeneralLead: false,
      headline: "ผู้บริหาร (ไม่มีภารกิจการผลิตประจำวัน)",
      urgentTasksCount: 0,
      unassignedCount: 0,
      overdueCount: 0,
      inProgressCount: 0,
      dueTodayCount: 0,
      todoCount: 0,
      myTasksCount: 0,
      missions: [],
      positiveImpact: "",
      riskImpact: "",
      encouragementQuote: "",
      suggestedActionLabel: "",
      timestamp: new Date().toISOString(),
    };
  }

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

  // Build matched assignee IDs for accurate personal task lookup
  const matchedAssigneeIds = new Set<string>();
  const assigneeIdToMember = new Map<string, any>();
  if (assignees && assignees.length > 0) {
    assignees.forEach((a) => {
      assigneeIdToMember.set(a.id, a);
      const aName = (a.name || "").toLowerCase().trim();
      const aEmail = (a.email || "").toLowerCase().trim();
      if (
        (normName && (aName.includes(normName) || normName.includes(aName))) ||
        (normEmail && aEmail && (aEmail.includes(normEmail) || normEmail.includes(aEmail)))
      ) {
        matchedAssigneeIds.add(a.id);
      }
    });
  }

  // Tasks assigned to this specific member (Main owner or Assistant)
  const myTasks = activeBriefs.filter((b: any) => {
    // 1. Direct Assignee ID match
    if (b.assignee_id && matchedAssigneeIds.has(b.assignee_id)) return true;

    // 2. Resolve assignee name & email (including lookup from assignees table if brief only has assignee_id)
    let bAssigneeName = (
      b.assignees?.name ||
      b.assignee_name ||
      b.details?.assignee_name ||
      b.details?.assignee ||
      ""
    ).toLowerCase().trim();
    let bAssigneeEmail = (b.assignees?.email || b.details?.assignee_email || "").toLowerCase().trim();

    if (!bAssigneeName && b.assignee_id && assigneeIdToMember.has(b.assignee_id)) {
      const found = assigneeIdToMember.get(b.assignee_id);
      bAssigneeName = (found.name || "").toLowerCase().trim();
      if (!bAssigneeEmail) bAssigneeEmail = (found.email || "").toLowerCase().trim();
    }

    if (normName && bAssigneeName && (bAssigneeName.includes(normName) || normName.includes(bAssigneeName))) return true;
    if (normEmail && bAssigneeEmail && (bAssigneeEmail.includes(normEmail) || normEmail.includes(bAssigneeEmail))) return true;

    // 3. Assistants check (Strictly non-empty and non-zero percentage)
    if (Array.isArray(b.details?.assistants)) {
      const isAst = b.details.assistants.some((ast: any) => {
        if (!ast) return false;
        // Ignore inactive or 0% assistants
        if (ast.percentage !== undefined && Number(ast.percentage) <= 0) return false;

        // ID match
        if (ast.assignee_id && matchedAssigneeIds.has(ast.assignee_id)) return true;

        // Name / Email match
        let astName = (ast.name || "").toLowerCase().trim();
        let astEmail = (ast.email || "").toLowerCase().trim();
        if ((!astName || !astEmail) && ast.assignee_id && assigneeIdToMember.has(ast.assignee_id)) {
          const foundAst = assigneeIdToMember.get(ast.assignee_id);
          if (!astName) astName = (foundAst.name || "").toLowerCase().trim();
          if (!astEmail) astEmail = (foundAst.email || "").toLowerCase().trim();
        }

        if (normName && astName && (astName.includes(normName) || normName.includes(astName))) return true;
        if (normEmail && astEmail && (astEmail.includes(normEmail) || normEmail.includes(astEmail))) return true;

        return false;
      });
      if (isAst) return true;
    }

    return false;
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
  const myTodo = myTasks.filter((b) => b.status === "pending");

  const customMemberQuote = getMemberCustomQuote(memberName);
  const quote = customMemberQuote || ENCOURAGEMENT_QUOTES[Math.floor(Math.random() * ENCOURAGEMENT_QUOTES.length)];

  const formatTaskNames = (tasks: any[], max: number = 2) => {
    const names = tasks.slice(0, max).map((t) => `"${t.project_name || t.details?.project_name || 'งานที่ได้รับมอบหมาย'}"`).join(", ");
    const more = tasks.length > max ? ` และอีก ${tasks.length - max} งาน` : "";
    return names + more;
  };

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
    if (myTasks.length > 0) {
      missions.push(`📌 ภารกิจรับผิดชอบส่วนตัวของคุณ: มีงานในความดูแล ${myTasks.length} งาน (กำลังทำ ${myInProgress.length} งาน • รอเริ่ม ${myTodo.length} งาน)`);
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
      dueTodayCount: myDueToday.length,
      todoCount: myTodo.length,
      myTasksCount: myTasks.length,
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
    if (myTasks.length > 0) {
      missions.push(`💼 งานโปรเจกต์และบรีฟที่คุณดูแลโดยตรง: รวม ${myTasks.length} งาน (กำลังดำเนินการ ${myInProgress.length} งาน)`);
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
      dueTodayCount: myDueToday.length,
      todoCount: myTodo.length,
      myTasksCount: myTasks.length,
      missions,
      positiveImpact: "💡 ผลลัพธ์เชิงบวก: ควบคุมภาพรวมงานได้ราบรื่น หนุนเป้าหมาย KR2/KR3/KR4 สร้างความพึงพอใจของผู้รับบริการ และรักษาเสถียรภาพของทีม",
      riskImpact: "⚠️ ความเสี่ยงหากละเลย: งานที่คอขวดอาจไม่ได้รับการกระจายความช่วยเหลือทันท่วงที ส่งผลต่อกำหนดส่งขององค์กร",
      encouragementQuote: quote,
      suggestedActionLabel: "เข้าสู่หน้าบริหารจัดการงานทีม",
      timestamp: new Date().toISOString(),
    };
  }

  // Case 3: Team Specialists & Operational Members (Personal Focus)
  const missions: string[] = [];
  if (myOverdue.length > 0) {
    missions.push(`🚨 คุณมีงานเกินกำหนดส่ง ${myOverdue.length} งาน (${formatTaskNames(myOverdue)}) เร่งประสานงานหรือส่งดราฟต์เพื่อปิดงาน`);
  }
  if (myDueToday.length > 0) {
    missions.push(`🗓️ มีงานต้องส่งมอบในวันนี้ ${myDueToday.length} งาน (${formatTaskNames(myDueToday)}) ตรวจเช็คความถูกต้องและส่งมอบตามนัด`);
  }
  if (myInProgress.length > 0) {
    missions.push(`⚡ เดินหน้าทำงานที่กำลังดำเนินการ ${myInProgress.length} งาน (${formatTaskNames(myInProgress)}) เพื่อให้พร้อมส่งตรวจตามกรอบเวลา`);
  }
  if (myTodo.length > 0) {
    missions.push(`📋 มีงานในคิวรอเริ่ม (To-Do) ของคุณ ${myTodo.length} งาน (${formatTaskNames(myTodo)}) ศึกษาบรีฟและเตรียมทรัพยากรล่วงหน้า`);
  }
  if (missions.length === 0) {
    missions.push(`✨ ยอดเยี่ยมมาก! ปัจจุบันคุณไม่มีงานคั่งค้างหรือเกินกำหนด พร้อมเริ่มบรีฟใหม่ใน TO-DO LIST หรือสนับสนุนเพื่อนร่วมทีม`);
    missions.push(`💡 วันนี้แนะนำศึกษา CI ต่อยอดไอเดียสร้างสรรค์ หรือช่วยงาน Cross-Skilling เพื่อผลักดันเป้าหมายภาพรวมทีม`);
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
    dueTodayCount: myDueToday.length,
    todoCount: myTodo.length,
    myTasksCount: myTasks.length,
    missions,
    positiveImpact: "💡 ผลลัพธ์เชิงบวก: การส่งมอบตรงเวลาช่วยสร้างประวัติการทำงานที่ดีเด่น หนุนค่า R ในตัวชี้วัดบุคคล และสร้างความพึงพอใจของผู้รับบริการในระดับยอดเยี่ยม",
    riskImpact: "⚠️ ความเสี่ยงหากล่าช้า: ส่งผลต่อแผนการประชาสัมพันธ์ของหน่วยงานผู้ขอ และกระทบอัตราส่งมอบตรงเวลา (On-Time Delivery)",
    encouragementQuote: quote,
    suggestedActionLabel: myInProgress.length > 0 ? "เข้าสู่หน้ารายการงานของคุณ" : "เข้าเริ่มปฏิบัติงานใน To-Do List",
    timestamp: new Date().toISOString(),
  };
}
