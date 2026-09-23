export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userCode: string;
  userName: string;
  unit: string;
  actionType: "status_update" | "feedback_sent" | "plan_edit" | "iso_evidence" | "meeting_action" | "login" | "upload";
  targetModule: string;
  targetId: string;
  details: string;
}

export const COMPLETE_TEN_ACTIVITIES_PER_MEMBER: ActivityLogItem[] = [
  // ==========================================
  // 1. นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA) - บริหารทีม (Leader)
  // ==========================================
  {
    id: "log-aa-1",
    timestamp: "2026-09-20 12:35",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-042",
    details: "ปรับปรุงสถานะงาน 'NSP Innovation Day 2026' เป็น Completed พร้อมบันทึกหลักฐานการตรวจรับ"
  },
  {
    id: "log-aa-2",
    timestamp: "2026-09-20 11:15",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-08",
    details: "ปรับปรุงเกณฑ์การติดตาม WI-CC-001 ถึง 005 ให้สอดคล้องกับการ Audit มาตรฐาน ISO 9001:2015"
  },
  {
    id: "log-aa-3",
    timestamp: "2026-09-20 10:00",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "feedback_sent",
    targetModule: "Design Review",
    targetId: "BR-2026-039",
    details: "อนุมัติงานออกแบบแบนเนอร์และส่งความคิดเห็นทางเทคนิคให้ยูนิตงานออกแบบปรับปรุงดราฟต์สุดท้าย"
  },
  {
    id: "log-aa-4",
    timestamp: "2026-09-19 16:30",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Management Review",
    targetId: "MR-2026-Q3",
    details: "นำเสนอสรุปผลดำเนินงานและความก้าวหน้าไตรมาส 3 ต่อที่ประชุมคณะกรรมการบริหารอุทยานฯ"
  },
  {
    id: "log-aa-5",
    timestamp: "2026-09-19 14:20",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-9.1",
    details: "อัปโหลดรายงานผลการประเมินความพึงพอใจลูกค้าเฉลี่ย 4.88 เข้าสู่ระบบควบคุมคุณภาพ"
  },
  {
    id: "log-aa-6",
    timestamp: "2026-09-19 11:00",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-037",
    details: "ตรวจรับมอบไฟล์ต้นฉบับ Master Artwork แคมเปญ Deep Tech Showcase ครบถ้วนตามสเปก"
  },
  {
    id: "log-aa-7",
    timestamp: "2026-09-18 15:45",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-01",
    details: "ตรวจสอบและอนุมัติร่างคู่มือ CI Hub ฉบับสมบูรณ์ ร่วมกับทีมออกแบบ (จอย RL)"
  },
  {
    id: "log-aa-8",
    timestamp: "2026-09-18 13:10",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-DOC-12",
    details: "เผยแพร่คู่มือมาตรฐานขั้นตอนการปฏิบัติงาน WI-CC ประจำปีงบประมาณใหม่ลงคลังความรู้กลาง"
  },
  {
    id: "log-aa-9",
    timestamp: "2026-09-18 09:30",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Morning Sync",
    targetId: "SYNC-0918",
    details: "เปิดการประชุมประจำสัปดาห์ มอบหมายทิศทางเร่งด่วนและการประสานงานข้าม 3 ยูนิต"
  },
  {
    id: "log-aa-10",
    timestamp: "2026-09-17 17:00",
    userCode: "AA",
    userName: "จ๊อบ AA",
    unit: "บริหารทีม",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-AA",
    details: "เข้าสู่ระบบเพื่อตรวจสอบรายงาน Audit Trail และประวัติการดำเนินงานประจำวัน"
  },

  // ==========================================
  // 2. นางสาววาสิตา กอบธัญกิจ (วา WK) - บริหารทีม (Assistant)
  // ==========================================
  {
    id: "log-wk-1",
    timestamp: "2026-09-20 12:15",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "feedback_sent",
    targetModule: "Stakeholder Dispatcher",
    targetId: "BR-2026-042",
    details: "ส่งแบบประเมินความพึงพอใจ 5 มิติให้ผู้ขอรับบริการผ่านระบบอัตโนมัติ"
  },
  {
    id: "log-wk-2",
    timestamp: "2026-09-20 11:30",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-041",
    details: "มอบหมายงานในขั้นตอน WI-CC-001 และระบุผู้รับผิดชอบหลักในยูนิตงานออกแบบ"
  },
  {
    id: "log-wk-3",
    timestamp: "2026-09-20 09:45",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Meeting Report",
    targetId: "MTG-2026-09",
    details: "จัดทำบันทึกข้อสั่งการและติดตามประเด็นตกค้างจากการประชุมประจำเดือน"
  },
  {
    id: "log-wk-4",
    timestamp: "2026-09-19 15:50",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-04",
    details: "ตรวจสอบ SLA และบันทึกเวลาตอบรับคำขอบรีฟงานยูนิตสื่อสารองค์กร"
  },
  {
    id: "log-wk-5",
    timestamp: "2026-09-19 13:20",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-7.4",
    details: "แนบหลักฐานการสื่อสารภายในและการส่งต่องานระหว่าง 3 ยูนิตเข้าสู่ระบบทะเบียน ISO"
  },
  {
    id: "log-wk-6",
    timestamp: "2026-09-19 10:15",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-035",
    details: "ตรวจสอบเอกสารตรวจรับงานและปิดคำขอบรีฟโครงการจัดแสดงนวัตกรรม"
  },
  {
    id: "log-wk-7",
    timestamp: "2026-09-18 16:00",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "feedback_sent",
    targetModule: "Stakeholder Dispatcher",
    targetId: "BR-2026-034",
    details: "สรุปคะแนนประเมิน CSAT และประสานงานผู้ขอรับบริการเพื่อรับข้อเสนอแนะเพิ่มเติม"
  },
  {
    id: "log-wk-8",
    timestamp: "2026-09-18 11:40",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-04",
    details: "อัปเดตสารบบทำเนียบเอกสารควบคุม ISO และระเบียบปฏิบัติงานฉบับปรับปรุงล่าสุด"
  },
  {
    id: "log-wk-9",
    timestamp: "2026-09-18 09:00",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-040",
    details: "คัดกรองคำขอบรีฟใหม่จากหน่วยงานภายนอก พร้อมตรวจสอบความครบถ้วนของข้อมูล"
  },
  {
    id: "log-wk-10",
    timestamp: "2026-09-17 16:45",
    userCode: "WK",
    userName: "วา WK",
    unit: "บริหารทีม",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-WK",
    details: "เข้าสู่ระบบเพื่อตรวจสอบสถานะคิวงานคงค้างและตรวจเช็คการตอบกลับของดีไซเนอร์"
  },

  // ==========================================
  // 3. นางสาวรติพร กัลปพฤกษ์ (จอย RL) - ยูนิตงานออกแบบ
  // ==========================================
  {
    id: "log-rl-1",
    timestamp: "2026-09-20 11:45",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-01",
    details: "เผยแพร่บทความความรู้ '5 เทคนิคจัดทำ Key Visual เสร็จไวใน 48 ชั่วโมง'"
  },
  {
    id: "log-rl-2",
    timestamp: "2026-09-20 10:20",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-040",
    details: "อัปเดตสถานะชิ้นงาน 'Corporate Brand Identity 2026' เป็น Completed"
  },
  {
    id: "log-rl-3",
    timestamp: "2026-09-20 09:00",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Design Asset",
    targetId: "ASSET-RL-08",
    details: "อัปโหลดไฟล์เวกเตอร์โลโก้และฟอนต์มาตรฐานลงเซิร์ฟเวอร์กลางเพื่อใช้งานร่วมกัน"
  },
  {
    id: "log-rl-4",
    timestamp: "2026-09-19 15:30",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-01",
    details: "อัปเดตความก้าวหน้าคู่มือ Brand CI Guidelines & Template Hub เป็น 100%"
  },
  {
    id: "log-rl-5",
    timestamp: "2026-09-19 13:40",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-036",
    details: "ส่งดราฟต์ Key Visual ครั้งที่ 2 ให้หัวหน้าทีมตรวจสอบ (Review Stage)"
  },
  {
    id: "log-rl-6",
    timestamp: "2026-09-19 10:50",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "แนบไฟล์ข้อกำหนดการออกแบบและการตรวจรับชิ้นงานตรงตามสเปก ISO 9001"
  },
  {
    id: "log-rl-7",
    timestamp: "2026-09-18 14:15",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-036",
    details: "บันทึกคำชี้แจงการปรับแก้เฉดสีและขนาดตัวอักษรตามข้อคิดเห็นผู้ขอรับบริการ"
  },
  {
    id: "log-rl-8",
    timestamp: "2026-09-18 10:30",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-TMP-03",
    details: "แชร์เทมเพลต Presentation Slide สำหรับงานสัมมนาทางวิชาการและนำเสนอผู้บริหาร"
  },
  {
    id: "log-rl-9",
    timestamp: "2026-09-17 16:10",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-032",
    details: "เริ่มดำเนินการออกแบบ Roll-up Banner โครงการ RSP North Expo 2026"
  },
  {
    id: "log-rl-10",
    timestamp: "2026-09-17 09:15",
    userCode: "RL",
    userName: "จอย RL",
    unit: "งานออกแบบ",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-RL",
    details: "เข้าสู่ระบบและดาวน์โหลดเอกสารบรีฟงานออกแบบสร้างสรรค์จากระบบรับงาน"
  },

  // ==========================================
  // 4. นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี (พิม AC) - ยูนิตงานออกแบบ
  // ==========================================
  {
    id: "log-ac-1",
    timestamp: "2026-09-19 16:40",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "เชื่อมโยงหลักฐานผลงานออกแบบบรรจุภัณฑ์นวัตกรรมเข้ากับข้อกำหนด ISO 8.5"
  },
  {
    id: "log-ac-2",
    timestamp: "2026-09-19 14:50",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-039",
    details: "อัปโหลด Artwork และ Mockup 3 มิติ บรรจุภัณฑ์สินค้าเกษตรแปรรูป"
  },
  {
    id: "log-ac-3",
    timestamp: "2026-09-19 11:20",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-039",
    details: "เปลี่ยนสถานะงานเป็น In Progress พร้อมนัดหมายทดสอบงานพิมพ์ต้นแบบกับโรงพิมพ์"
  },
  {
    id: "log-ac-4",
    timestamp: "2026-09-18 16:30",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-02",
    details: "บันทึกความคืบหน้าการส่งผลงานชิงรางวัล Good Design Award เป็น 100%"
  },
  {
    id: "log-ac-5",
    timestamp: "2026-09-18 13:00",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-02",
    details: "เขียนสรุปกรณีศึกษาการออกแบบบรรจุภัณฑ์รักษ์โลก (Eco-Packaging Design)"
  },
  {
    id: "log-ac-6",
    timestamp: "2026-09-18 09:40",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-033",
    details: "ส่งแบบร่างตราสินค้าและโครงสร้างกล่องให้ลูกค้าพิจารณา 3 รูปแบบ"
  },
  {
    id: "log-ac-7",
    timestamp: "2026-09-17 15:20",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-030",
    details: "ปิดจ๊อบงานออกแบบไดคัทสติกเกอร์และคู่มือการใช้ผลิตภัณฑ์สมุนไพร"
  },
  {
    id: "log-ac-8",
    timestamp: "2026-09-17 11:00",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.2",
    details: "ตรวจสอบข้อกำหนดทางกฎหมายของฉลากอาหารและแนบใบยืนยันความถูกต้อง"
  },
  {
    id: "log-ac-9",
    timestamp: "2026-09-16 14:30",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Design Asset",
    targetId: "ASSET-AC-05",
    details: "อัปโหลดโมเดล 3D Rendering สำหรับนิทรรศการลงในคลังสินทรัพย์สร้างสรรค์"
  },
  {
    id: "log-ac-10",
    timestamp: "2026-09-16 09:10",
    userCode: "AC",
    userName: "พิม AC",
    unit: "งานออกแบบ",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-AC",
    details: "เข้าสู่ระบบเพื่อเช็คคิวงานออกแบบบรรจุภัณฑ์ใหม่ประจำสัปดาห์"
  },

  // ==========================================
  // 5. นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์ (เยียร์ LLP) - ยูนิตงานออกแบบ
  // ==========================================
  {
    id: "log-llp-1",
    timestamp: "2026-09-20 09:40",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-037",
    details: "แก้ไขไฟล์กราฟิกตามข้อสั่งการ Art Director และส่งมอบฉบับ Final"
  },
  {
    id: "log-llp-2",
    timestamp: "2026-09-19 15:10",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Design Asset",
    targetId: "ASSET-LLP-04",
    details: "ส่งออกชุดภาพประกอบ Infographic สำหรับสื่อโซเชียลมีเดียองค์กร"
  },
  {
    id: "log-llp-3",
    timestamp: "2026-09-19 11:45",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-7.5",
    details: "ตรวจสอบการตั้งชื่อไฟล์และจัดเก็บเวอร์ชันงานตามข้อกำหนดมาตรฐาน ISO"
  },
  {
    id: "log-llp-4",
    timestamp: "2026-09-18 14:30",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-037",
    details: "ปรับปรุงสถานะเป็น In Progress เพื่อปรับขนาดแบนเนอร์ Facebook/Instagram"
  },
  {
    id: "log-llp-5",
    timestamp: "2026-09-18 10:15",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-031",
    details: "ส่งมอบชุดไอคอนเวกเตอร์ 24 ชิ้นงาน ให้ทีมผลิตสื่อสร้างสรรค์ใช้งานต่อ"
  },
  {
    id: "log-llp-6",
    timestamp: "2026-09-17 16:50",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-01",
    details: "ช่วยจัดทำเทมเพลตโซเชียลมีเดียในโครงการ CI Hub รวม 8 ชุดสำเร็จเรียบร้อย"
  },
  {
    id: "log-llp-7",
    timestamp: "2026-09-17 13:20",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-RES-05",
    details: "แชร์แหล่งรวมพาเลตต์สีและฟอนต์ลิขสิทธิ์ถูกต้องสำหรับการสื่อสารองค์กร"
  },
  {
    id: "log-llp-8",
    timestamp: "2026-09-16 15:00",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-028",
    details: "ปิดงานออกแบบโปสเตอร์ประกาศรับสมัครผู้ประกอบการนวัตกรรมรุ่นใหม่"
  },
  {
    id: "log-llp-9",
    timestamp: "2026-09-16 10:30",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "บันทึกการส่งมอบไฟล์งานในระบบ Document Control พร้อมใบรับรองตรวจรับ"
  },
  {
    id: "log-llp-10",
    timestamp: "2026-09-15 14:00",
    userCode: "LLP",
    userName: "เยียร์ LLP",
    unit: "งานออกแบบ",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-LLP",
    details: "เข้าสู่ระบบและตรวจสอบตารางงานกราฟิกประจำเดือน"
  },

  // ==========================================
  // 6. นางสาวมัทนิน ยงค์ไสว (นิน MTN) - ยูนิตงานออกแบบ
  // ==========================================
  {
    id: "log-mtn-1",
    timestamp: "2026-09-19 16:20",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-035",
    details: "ส่งแบบร่าง Moodboard งานนิทรรศการ Creative Space 2026 ให้ผู้ว่าจ้างตรวจ"
  },
  {
    id: "log-mtn-2",
    timestamp: "2026-09-19 11:00",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-03",
    details: "จัดทำรายงาน Creative Trend Radar ไตรมาส 3 ฉบับสมบูรณ์"
  },
  {
    id: "log-mtn-3",
    timestamp: "2026-09-18 15:30",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-035",
    details: "ปรับปรุงสถานะเป็น In Progress พร้อมจัดทำโครงสร้างบูธ 3 มิติ"
  },
  {
    id: "log-mtn-4",
    timestamp: "2026-09-18 10:45",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.3",
    details: "บันทึกผลการทบทวนข้อกำหนดการออกแบบนิทรรศการร่วมกับผู้จัดงาน"
  },
  {
    id: "log-mtn-5",
    timestamp: "2026-09-17 14:15",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-029",
    details: "ส่งมอบงานออกแบบ Floor Plan และป้ายนำทาง (Wayfinding) ประจำงาน"
  },
  {
    id: "log-mtn-6",
    timestamp: "2026-09-17 09:30",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-03",
    details: "เผยแพร่บทความวิเคราะห์เทรนด์งานออกแบบเพื่อความยั่งยืน 2027"
  },
  {
    id: "log-mtn-7",
    timestamp: "2026-09-16 16:00",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-029",
    details: "เปลี่ยนสถานะงานเป็น Completed หลังตรวจรับร่วมกับผู้ประสานงาน"
  },
  {
    id: "log-mtn-8",
    timestamp: "2026-09-16 11:20",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-03",
    details: "รวบรวมสถิติการเข้าถึงสื่อดิจิทัลเพื่อใช้ในรายงาน Trend Radar ฉบับใหม่"
  },
  {
    id: "log-mtn-9",
    timestamp: "2026-09-15 15:40",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Design Asset",
    targetId: "ASSET-MTN-02",
    details: "อัปโหลดภาพถ่ายสถานที่จริงและไฟล์ผังงานลงระบบคลาวด์ทีม"
  },
  {
    id: "log-mtn-10",
    timestamp: "2026-09-15 09:00",
    userCode: "MTN",
    userName: "นิน MTN",
    unit: "งานออกแบบ",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-MTN",
    details: "เข้าสู่ระบบและเริ่มจัดเตรียมเอกสารออกแบบนิทรรศการ"
  },

  // ==========================================
  // 7. นายอิศรา แก้วเรือง (ก้อง IK) - ยูนิตงานออกแบบ
  // ==========================================
  {
    id: "log-ik-1",
    timestamp: "2026-09-19 14:10",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-034",
    details: "ตรวจสอบความสอดคล้อง Font CI และโครงสร้างกริดของคู่มือ"
  },
  {
    id: "log-ik-2",
    timestamp: "2026-09-19 09:30",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "Design Asset",
    targetId: "ASSET-IK-03",
    details: "ส่งมอบไฟล์เทมเพลตรายงานประจำปีในรูปแบบ InDesign และ PDF พร้อมพิมพ์"
  },
  {
    id: "log-ik-3",
    timestamp: "2026-09-18 16:15",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-01",
    details: "ช่วยพัฒนา Layout Template สำหรับเอกสารราชการและจดหมายข่าวนวัตกรรม"
  },
  {
    id: "log-ik-4",
    timestamp: "2026-09-18 11:00",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-034",
    details: "ปรับปรุงสถานะงานเป็น In Progress เพื่อเริ่มจัดหน้ารายงาน 60 หน้า"
  },
  {
    id: "log-ik-5",
    timestamp: "2026-09-17 15:45",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "ตรวจสอบความถูกต้องของเนื้อหาและการอ้างอิงสถิติในรายงานตามขั้นตอนคุณภาพ"
  },
  {
    id: "log-ik-6",
    timestamp: "2026-09-17 10:20",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-027",
    details: "ส่งดราฟต์แรกของปกรายงานและตัวอย่างการจัดวางข้อความให้หัวหน้าทีมพิจารณา"
  },
  {
    id: "log-ik-7",
    timestamp: "2026-09-16 14:10",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-TMP-04",
    details: "แชร์เทมเพลตกราฟและไดอะแกรมสถิติที่ตรงตาม Brand CI ลงคลังกลาง"
  },
  {
    id: "log-ik-8",
    timestamp: "2026-09-16 09:50",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-027",
    details: "ปิดจ๊อบงานออกแบบใบปลิวแคมเปญบ่มเพาะสตาร์ทอัพ"
  },
  {
    id: "log-ik-9",
    timestamp: "2026-09-15 16:30",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-7.5",
    details: "จัดเก็บสำเนาไฟล์ต้นฉบับความละเอียดสูงลงในคลังสินทรัพย์ดิจิทัล"
  },
  {
    id: "log-ik-10",
    timestamp: "2026-09-15 10:00",
    userCode: "IK",
    userName: "ก้อง IK",
    unit: "งานออกแบบ",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-IK",
    details: "เข้าสู่ระบบและเริ่มวางแผนจัดหน้าเอกสารสิ่งพิมพ์ประจำเดือน"
  },

  // ==========================================
  // 8. นางสาวสุทธิอาภา คุ้มครอง (ลูกอิน STK) - ยูนิตสื่อสารองค์กร
  // ==========================================
  {
    id: "log-stk-1",
    timestamp: "2026-09-20 11:10",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-04",
    details: "อัปเดตความคืบหน้าแคมเปญข่าว RSP Innovation Stories เป็น 85%"
  },
  {
    id: "log-stk-2",
    timestamp: "2026-09-20 09:15",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-038",
    details: "เผยแพร่ข่าวประชาสัมพันธ์ผลงานสตาร์ทอัพทางสื่อมวลชน 12 สำนัก"
  },
  {
    id: "log-stk-3",
    timestamp: "2026-09-19 16:00",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "upload",
    targetModule: "Press Media",
    targetId: "PRESS-2026-24",
    details: "รวบรวมคลิปปิ้งข่าวและคำนวณมูลค่า PR Value ประจำสัปดาห์"
  },
  {
    id: "log-stk-4",
    timestamp: "2026-09-19 13:30",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "feedback_sent",
    targetModule: "Media Relations",
    targetId: "MEDIA-INV-09",
    details: "ส่งจดหมายเชิญสื่อมวลชนเข้าร่วมงานแถลงข่าวผลงานนวัตกรรม"
  },
  {
    id: "log-stk-5",
    timestamp: "2026-09-18 15:20",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-038",
    details: "อัปเดตสถานะเป็น Completed พร้อมส่งรายงานสรุปยอด Reach 120,000"
  },
  {
    id: "log-stk-6",
    timestamp: "2026-09-18 10:00",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.2",
    details: "บันทึกผลการทบทวนเนื้อหาข่าวกับนักวิจัยก่อนเผยแพร่สู่สาธารณะ"
  },
  {
    id: "log-stk-7",
    timestamp: "2026-09-17 14:40",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-05",
    details: "เผยแพร่บทความ 'เคล็ดลับการเขียน Press Release ให้น่าสนใจและถูกหยิบไปลงข่าว'"
  },
  {
    id: "log-stk-8",
    timestamp: "2026-09-17 09:20",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-04",
    details: "บันทึกยอดสะสมข่าวเผยแพร่ระดับประเทศครบ 48 ชิ้นงาน (เป้าหมาย 50 ชิ้น)"
  },
  {
    id: "log-stk-9",
    timestamp: "2026-09-16 16:15",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-030",
    details: "ตรวจรับภาพถ่ายงานแถลงข่าวและจัดทำชุดข่าวแจกสื่อมวลชน"
  },
  {
    id: "log-stk-10",
    timestamp: "2026-09-16 10:10",
    userCode: "STK",
    userName: "ลูกอิน STK",
    unit: "สื่อสารองค์กร",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-STK",
    details: "เข้าสู่ระบบและเช็คตารางงานประชาสัมพันธ์ประจำวัน"
  },

  // ==========================================
  // 9. นางสาวชนนิกานต์ บุญแก้ว (โอ๊ต CNB) - ยูนิตสื่อสารองค์กร
  // ==========================================
  {
    id: "log-cnb-1",
    timestamp: "2026-09-19 14:15",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "plan_edit",
    targetModule: "Work Links",
    targetId: "WL-06",
    details: "อัปเดตเบอร์โทรผู้สื่อข่าวในฐานข้อมูล Media Directory"
  },
  {
    id: "log-cnb-2",
    timestamp: "2026-09-19 10:30",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-036",
    details: "จัดทำกำหนดการ Press Tour สื่อมวลชนสัญจรชมแล็บนวัตกรรม"
  },
  {
    id: "log-cnb-3",
    timestamp: "2026-09-18 15:40",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "upload",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-036",
    details: "อัปโหลดหนังสือขอความอนุเคราะห์และรายชื่อสื่อมวลชน 18 สำนัก"
  },
  {
    id: "log-cnb-4",
    timestamp: "2026-09-18 11:20",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-05",
    details: "บันทึกความก้าวหน้าโครงการ Press Tour สื่อมวลชน เป็น 100%"
  },
  {
    id: "log-cnb-5",
    timestamp: "2026-09-17 16:00",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "feedback_sent",
    targetModule: "Media Relations",
    targetId: "MEDIA-CALL-03",
    details: "โทรศัพท์ประสานงานยืนยันการเข้าร่วมงานกับหัวหน้าข่าวเศรษฐกิจ"
  },
  {
    id: "log-cnb-6",
    timestamp: "2026-09-17 13:10",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-7.4",
    details: "แนบเอกสารการสื่อสารและการจัดสรรยานพาหนะสำหรับผู้สื่อข่าว"
  },
  {
    id: "log-cnb-7",
    timestamp: "2026-09-16 15:30",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-031",
    details: "ปิดจ๊อบงานจัดทำข่าวสั้นประชาสัมพันธ์กิจกรรม Open House"
  },
  {
    id: "log-cnb-8",
    timestamp: "2026-09-16 10:45",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-DOC-15",
    details: "แชร์แนวทางการจัดงาน Press Tour อย่างมืออาชีพในสไตล์ STeP"
  },
  {
    id: "log-cnb-9",
    timestamp: "2026-09-15 14:20",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-031",
    details: "อัปเดตสถานะเป็น In Progress พร้อมร่างจดหมายข่าว 2 หน้า"
  },
  {
    id: "log-cnb-10",
    timestamp: "2026-09-15 09:30",
    userCode: "CNB",
    userName: "โอ๊ต CNB",
    unit: "สื่อสารองค์กร",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-CNB",
    details: "เข้าสู่ระบบและตรวจสอบการตอบรับเข้าร่วมงานของสื่อมวลชน"
  },

  // ==========================================
  // 10. นางสาวศิริลักษณ์ กันจะนะ (เอ็นจอย SLR) - ยูนิตผลิตสื่อสร้างสรรค์
  // ==========================================
  {
    id: "log-slr-1",
    timestamp: "2026-09-20 09:50",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "WI-CC-003",
    targetId: "BR-2026-038",
    details: "ส่งมอบวิดีโอคลิปสั้นตัวอย่างเพื่อขอรับการตรวจงาน (Review Stage)"
  },
  {
    id: "log-slr-2",
    timestamp: "2026-09-19 16:10",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-06",
    details: "อัปเดตยอดวิวซีรีส์วิดีโอสั้น 'วิทย์ฯ นอกกรอบ' สะสมทะลุ 480,000 วิว"
  },
  {
    id: "log-slr-3",
    timestamp: "2026-09-19 13:00",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "Media Asset",
    targetId: "VIDEO-EP18",
    details: "อัปโหลดไฟล์มาสเตอร์วิดีโอ Reels ความยาว 60 วินาที ตอนที่ 18"
  },
  {
    id: "log-slr-4",
    timestamp: "2026-09-18 16:45",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-038",
    details: "เปลี่ยนสถานะงานเป็น In Progress เพื่อเริ่มขั้นตอน Color Grading และตัดเสียง"
  },
  {
    id: "log-slr-5",
    timestamp: "2026-09-18 10:30",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "ตรวจสอบลิขสิทธิ์ดนตรีประกอบและสเปกไฟล์วิดีโอก่อนเผยแพร่"
  },
  {
    id: "log-slr-6",
    timestamp: "2026-09-17 15:15",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "feedback_sent",
    targetModule: "Creative Production",
    targetId: "STORYBOARD-08",
    details: "ส่งสตอรี่บอร์ดคลิปไวรัลนวัตกรรมให้อาจารย์ที่ปรึกษาพิจารณา"
  },
  {
    id: "log-slr-7",
    timestamp: "2026-09-17 09:40",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-ART-06",
    details: "เขียนแชร์เทคนิค 'การเล่าเรื่องงานวิจัยยากๆ ให้เข้าใจง่ายใน 60 วินาที'"
  },
  {
    id: "log-slr-8",
    timestamp: "2026-09-16 16:20",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-025",
    details: "ปิดจ๊อบงานถ่ายทำวิดีโอสัมภาษณ์ผู้ชนะการแข่งขัน Startup Pitching"
  },
  {
    id: "log-slr-9",
    timestamp: "2026-09-16 11:00",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-06",
    details: "บันทึกความคืบหน้ารวมของโครงการผลิตสื่อสั้นเป็น 80%"
  },
  {
    id: "log-slr-10",
    timestamp: "2026-09-15 13:45",
    userCode: "SLR",
    userName: "เอ็นจอย SLR",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-SLR",
    details: "เข้าสู่ระบบและเริ่มจัดตารางการถ่ายทำวิดีโอภาคสนาม"
  },

  // ==========================================
  // 11. นางสาวกัลยกร อภิวงศ์ (แก้ว KYK) - ยูนิตผลิตสื่อสร้างสรรค์
  // ==========================================
  {
    id: "log-kyk-1",
    timestamp: "2026-09-19 15:50",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-033",
    details: "บันทึกเสียงบรรยาย Voice Over วิดีโอแนะนำแล็บ STeP พร้อมตัดเสียงรบกวน"
  },
  {
    id: "log-kyk-2",
    timestamp: "2026-09-19 10:15",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-07",
    details: "อัปเดตระบบ Virtual Tour 360 ความคืบหน้า 60% พร้อมทดสอบบนเว็บ"
  },
  {
    id: "log-kyk-3",
    timestamp: "2026-09-18 14:40",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-033",
    details: "ปรับปรุงสถานะงานเป็น In Progress เพื่อเริ่มตัดต่อคลิปแนะนำอุปกรณ์แล็บ"
  },
  {
    id: "log-kyk-4",
    timestamp: "2026-09-18 09:20",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-8.5",
    details: "แนบไฟล์บทบรรยายที่ผ่านการตรวจทานความถูกต้องจากผู้เชี่ยวชาญ"
  },
  {
    id: "log-kyk-5",
    timestamp: "2026-09-17 16:30",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "feedback_sent",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-026",
    details: "ส่งดราฟต์เสียงพากย์ 2 ภาษา (ไทย-อังกฤษ) ให้ทีมบริหารประเมิน"
  },
  {
    id: "log-kyk-6",
    timestamp: "2026-09-17 11:10",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-RES-07",
    details: "รวบรวมคลังเอฟเฟกต์เสียงและ BGM ถูกลิขสิทธิ์สำหรับงานมัลติมีเดีย"
  },
  {
    id: "log-kyk-7",
    timestamp: "2026-09-16 15:00",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-026",
    details: "ปิดจ๊อบงานจัดทำสปอตวิทยุและสื่อประชาสัมพันธ์เสียงตามสาย"
  },
  {
    id: "log-kyk-8",
    timestamp: "2026-09-16 09:40",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-07",
    details: "ทดสอบการหมุนมุมกล้อง 360 องศาในห้อง Clean Room"
  },
  {
    id: "log-kyk-9",
    timestamp: "2026-09-15 14:50",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "Media Asset",
    targetId: "AUDIO-SP-04",
    details: "อัปโหลดไฟล์ Master Audio WAV 24-bit ลงเซิร์ฟเวอร์สำรอง"
  },
  {
    id: "log-kyk-10",
    timestamp: "2026-09-15 09:10",
    userCode: "KYK",
    userName: "แก้ว KYK",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-KYK",
    details: "เข้าสู่ระบบเพื่อเช็คคิวงานพากย์เสียงและมัลติมีเดียประจำสัปดาห์"
  },

  // ==========================================
  // 12. นางสาวฐิติยา เข็มพล (ต้า TTY) - ยูนิตผลิตสื่อสร้างสรรค์ (Idle Warning)
  // ==========================================
  {
    id: "log-tty-1",
    timestamp: "2026-09-17 15:30",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "Media Storage",
    targetId: "RAW-FOOT-09",
    details: "จัดเก็บไฟล์ฟุตเทจวิดีโอและแบ็กอัปข้อมูลลง Google Drive กลาง"
  },
  {
    id: "log-tty-2",
    timestamp: "2026-09-17 11:20",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-024",
    details: "อัปเดตสถานะงานตัดต่อวิดีโอสัมภาษณ์เป็น In Progress"
  },
  {
    id: "log-tty-3",
    timestamp: "2026-09-16 16:00",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "Media Storage",
    targetId: "FOOTAGE-EXT-02",
    details: "ถ่ายโอนคลิปบรรยากาศงานประชุมผู้ประกอบการจาก SD Card ลงเซิร์ฟเวอร์"
  },
  {
    id: "log-tty-4",
    timestamp: "2026-09-16 10:15",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-7.1",
    details: "ตรวจสอบอุปกรณ์กล้อง แบตเตอรี่ และบันทึกประวัติการบำรุงรักษา"
  },
  {
    id: "log-tty-5",
    timestamp: "2026-09-15 14:30",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-024",
    details: "รับมอบหมายภารกิจจัดเตรียมอุปกรณ์ถ่ายทำวิดีโอสัมภาษณ์"
  },
  {
    id: "log-tty-6",
    timestamp: "2026-09-15 09:00",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "meeting_action",
    targetModule: "Morning Sync",
    targetId: "SYNC-0915",
    details: "เข้าร่วมการประชุมทีมประจำสัปดาห์และรับมอบหมายภารกิจ"
  },
  {
    id: "log-tty-7",
    timestamp: "2026-09-14 16:20",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "upload",
    targetModule: "KM Hub",
    targetId: "KM-EQ-02",
    details: "อัปเดตบัญชีอุปกรณ์บันทึกภาพและเสียงของยูนิตผลิตสื่อสร้างสรรค์"
  },
  {
    id: "log-tty-8",
    timestamp: "2026-09-14 11:00",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "status_update",
    targetModule: "Briefs Tracking",
    targetId: "BR-2026-020",
    details: "ปิดจ๊อบงานจัดเก็บและสำรองไฟล์สื่อวิดีโอประจำเดือนสิงหาคม"
  },
  {
    id: "log-tty-9",
    timestamp: "2026-09-13 15:10",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "feedback_sent",
    targetModule: "Creative Production",
    targetId: "EQ-LOG-08",
    details: "รายงานสถานะแบตเตอรี่สำรองที่เสื่อมสภาพเพื่อขอจัดซื้อทดแทน"
  },
  {
    id: "log-tty-10",
    timestamp: "2026-09-13 09:30",
    userCode: "TTY",
    userName: "ต้า TTY",
    unit: "ผลิตสื่อสร้างสรรค์",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-TTY",
    details: "เข้าสู่ระบบและตรวจสอบตารางงานควบคุมอุปกรณ์ประจำวัน"
  },

  // ==========================================
  // 13. ผศ.ดร.สุริยะ ทองมุณี (อ.บ่าว ST) - บริหารทีม (Executive)
  // ==========================================
  {
    id: "log-st-1",
    timestamp: "2026-09-20 10:30",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Meeting Report",
    targetId: "MTG-2026-09",
    details: "อนุมัติวาระการประชุมร่วมกับผู้บริหาร STeP ประจำเดือนกันยายน"
  },
  {
    id: "log-st-2",
    timestamp: "2026-09-19 16:30",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Management Review",
    targetId: "MR-2026-Q3",
    details: "ลงนามรับทราบมติที่ประชุมทบทวนการบริหารระบบคุณภาพ ISO 9001"
  },
  {
    id: "log-st-3",
    timestamp: "2026-09-19 11:15",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "feedback_sent",
    targetModule: "Executive Review",
    targetId: "BR-2026-042",
    details: "ให้ข้อเสนอแนะเชิงนโยบายต่อการขับเคลื่อนภาพลักษณ์อุทยานฯ ในระดับชาติ"
  },
  {
    id: "log-st-4",
    timestamp: "2026-09-18 15:00",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "plan_edit",
    targetModule: "Action Plan",
    targetId: "CC-ACT-08",
    details: "รับทราบรายงานความก้าวหน้าระบบบริหารคุณภาพ CAR = 0"
  },
  {
    id: "log-st-5",
    timestamp: "2026-09-18 10:45",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-5.1",
    details: "ลงนามรับรองนโยบายคุณภาพและความมุ่งมั่นของฝ่ายบริหาร (Leadership Commitment)"
  },
  {
    id: "log-st-6",
    timestamp: "2026-09-17 14:00",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "meeting_action",
    targetModule: "Executive Committee",
    targetId: "EX-2026-09",
    details: "มอบนโยบายการขยายความร่วมมือกับเครือข่ายภาคอุตสาหกรรมภาคเหนือ"
  },
  {
    id: "log-st-7",
    timestamp: "2026-09-17 09:30",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "feedback_sent",
    targetModule: "Brand Direction",
    targetId: "CI-GUIDE-26",
    details: "อนุมัติกรอบและทิศทาง Brand CI ฉบับสมบูรณ์สำหรับใช้ในงาน RSP North Expo"
  },
  {
    id: "log-st-8",
    timestamp: "2026-09-16 15:45",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "iso_evidence",
    targetModule: "ISO Report",
    targetId: "Clause-9.3",
    details: "รับรองผลการวิเคราะห์ข้อมูลความพึงพอใจและข้อเสนอแนะเพื่อการปรับปรุง"
  },
  {
    id: "log-st-9",
    timestamp: "2026-09-16 11:20",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "status_update",
    targetModule: "Strategic Project",
    targetId: "SP-CC-2027",
    details: "ตรวจติดตามความก้าวหน้าโครงการเชิงกลยุทธ์ทีมสร้างสรรค์และการสื่อสาร"
  },
  {
    id: "log-st-10",
    timestamp: "2026-09-15 10:00",
    userCode: "ST",
    userName: "ผศ.ดร.สุริยะ (อ.บ่าว ST)",
    unit: "บริหารทีม",
    actionType: "login",
    targetModule: "System Auth",
    targetId: "SEC-ST",
    details: "เข้าสู่ระบบผู้บริหารเพื่อตรวจสอบภาพรวมผลการดำเนินงานของทีม"
  }
];
