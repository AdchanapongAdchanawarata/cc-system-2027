// STeP Design Pricing Calculator Data & Types
// Sourced from official STeP pricing model:
// https://docs.google.com/spreadsheets/d/1WhQP_LfyYklcMRptSuPB0z3UAPVaH6Qd_yzDoly1J8Y/edit?gid=169831484

export interface CalculatorItem {
  id: string;
  category: "A" | "B" | "C" | "D" | "E" | "CUSTOM" | string;
  categoryName: string;
  type: "main" | "topup";
  name: string;
  difficulty: number; // ค่าความยาก
  unit?: string; // หน่วย เช่น พับ, ชิ้น, หน้า, รูป, SKU
  scope: string; // ขอบเขตงาน
  deliverables?: string; // สิ่งที่ได้รับ
  basePrice: number; // ราคามาตรฐาน
}

export interface ComplexityLevel {
  level: number;
  label: string;
  multiplier: number;
  description: string;
}

export const COMPLEXITY_LEVELS: ComplexityLevel[] = [
  {
    level: 1,
    label: "ระดับ 1: ต่ำมาก",
    multiplier: 0.5,
    description: "งานที่มีองค์ประกอบและรายละเอียดน้อย โครงสร้างงานชัดเจน ใช้ข้อมูลหรือรูปแบบที่มีอยู่แล้ว การจัดวางไม่ซับซ้อน และมีขั้นตอนการออกแบบไม่มาก"
  },
  {
    level: 2,
    label: "ระดับ 2: ต่ำ",
    multiplier: 0.7,
    description: "งานที่มีองค์ประกอบมากขึ้น ต้องพิจารณาการจัดวาง ขนาด สัดส่วน และความสัมพันธ์ขององค์ประกอบ แต่ยังมีโครงสร้างค่อนข้างชัดเจนและสามารถดำเนินงานได้ตามแนวทางที่กำหนด"
  },
  {
    level: 3,
    label: "ระดับ 3: ปานกลาง (มาตรฐาน)",
    multiplier: 1.0,
    description: "งานที่มีองค์ประกอบหลายประเภทหรือมีรายละเอียดหลายส่วน ต้องวิเคราะห์และจัดลำดับข้อมูล รวมถึงต้องพิจารณาความสัมพันธ์ขององค์ประกอบโดยรวม อาจต้องปรับงานให้เหมาะกับหลายขนาดหรือรูปแบบ"
  },
  {
    level: 4,
    label: "ระดับ 4: สูง",
    multiplier: 1.3,
    description: "งานที่มีองค์ประกอบและรายละเอียดจำนวนมาก ต้องจัดการข้อมูลหรือโครงสร้างที่ซับซ้อน มีข้อจำกัดด้านการใช้งาน ขนาด เทคนิค หรือการผลิต และต้องพิจารณาความสัมพันธ์ของหลายส่วนให้ทำงานร่วมกันอย่างเป็นระบบ"
  },
  {
    level: 5,
    label: "ระดับ 5: สูงมาก",
    multiplier: 1.6,
    description: "งานที่มีความซับซ้อนหลายด้านพร้อมกัน ต้องจัดการองค์ประกอบ ข้อมูล รูปแบบ ข้อจำกัดทางเทคนิค และรายละเอียดจำนวนมาก มีขั้นตอนการออกแบบและตรวจสอบหลายขั้น และต้องควบคุมความถูกต้องของงานในภาพรวมอย่างละเอียด"
  }
];

// Presets for 0.5 - 10 เท่า multiplier
export const MULTIPLIER_PRESETS = [
  { value: 0.5, label: "0.5 เท่า (ปรับแก้เล็กน้อย / ต่ำมาก)" },
  { value: 0.7, label: "0.7 เท่า (ดัดแปลง / ต่ำ)" },
  { value: 1.0, label: "1.0 เท่า (มาตรฐานตามสเปก)" },
  { value: 1.3, label: "1.3 เท่า (ปานกลาง)" },
  { value: 1.5, label: "1.5 เท่า (ค่อนข้างยาก)" },
  { value: 2.0, label: "2.0 เท่า (ยากมาก x2)" },
  { value: 3.0, label: "3.0 เท่า (โปรเจกต์พิเศษ x3)" },
  { value: 5.0, label: "5.0 เท่า (ระดับองค์กร x5)" },
  { value: 10.0, label: "10.0 เท่า (ความซับซ้อนสูงสุด x10)" },
];

export function calculateBasePrice(type: "main" | "topup", difficulty: number): number {
  const rate = type === "main" ? 900 : 450;
  return rate * difficulty;
}

export function calculateItemPrice(type: "main" | "topup", difficulty: number, multiplier: number): number {
  const base = calculateBasePrice(type, difficulty);
  return Math.round(base * multiplier);
}

export const CALCULATOR_CATEGORIES = [
  { id: "A", name: "กลุ่ม A: สื่อสิ่งพิมพ์" },
  { id: "B", name: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์" },
  { id: "C", name: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์" },
  { id: "D", name: "กลุ่ม D: Social Media Content" },
  { id: "E", name: "กลุ่ม E: Brand Identity" },
];

export const CALCULATOR_ITEMS: CalculatorItem[] = [
  // --- กลุ่ม A: สื่อสิ่งพิมพ์ ---
  {
    id: "A-M-1",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "main",
    name: "โปสเตอร์ (Poster)",
    difficulty: 6,
    scope: "คิดคอนเซป ภาพองค์ประกอบหลายส่วน",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "A-M-2",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "main",
    name: "แผ่นพับ (Leaflet / Brochure)",
    difficulty: 6,
    scope: "เหมือนโปสเตอร์ + รูปแบบพับ",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "A-M-3",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "main",
    name: "โรลอัพ / X-Stand",
    difficulty: 5,
    scope: "ปรับ Key Visual เดิมตามสัดส่วน",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 4500
  },
  {
    id: "A-M-4",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "main",
    name: "ธงญี่ปุ่น (J-Flag)",
    difficulty: 5,
    scope: "ปรับ Key Visual แนวตั้งยาว",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 4500
  },
  {
    id: "A-M-5",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "main",
    name: "แบ็กดร็อป (Backdrop)",
    difficulty: 5,
    scope: "ปรับ Key Visual ขนาดใหญ่",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 4500
  },
  // Topup A
  {
    id: "A-T-1",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "topup",
    name: "Concept Development (คิดคอนเซปต์)",
    difficulty: 4,
    scope: "คิดคอนเซปเมื่อไม่มีทิศทางเดิม",
    deliverables: "เอกสารแนวคิด",
    basePrice: 1800
  },
  {
    id: "A-T-2",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "topup",
    name: "Graphic Elements สร้างใหม่",
    difficulty: 4,
    scope: "วาดภาพประกอบเอง ไม่ใช้ Stock",
    deliverables: "ไฟล์กราฟิก",
    basePrice: 1800
  },
  {
    id: "A-T-3",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "topup",
    name: "ปรับสัดส่วนตามขนาดจริง",
    difficulty: 2,
    scope: "คำนวณ Scale ใหม่ตามหน้างาน",
    basePrice: 900
  },
  {
    id: "A-T-4",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "topup",
    name: "จำนวนหน้าพับเพิ่ม (ต่อพับ)",
    difficulty: 2,
    unit: "พับ",
    scope: "2 พับ / 3 พับ / Z-fold",
    basePrice: 900
  },
  {
    id: "A-T-5",
    category: "A",
    categoryName: "กลุ่ม A: สื่อสิ่งพิมพ์",
    type: "topup",
    name: "อินโฟกราฟิก / กราฟ / แผนภูมิ",
    difficulty: 1,
    scope: "แปลงตัวเลข / สถิติที่ลูกค้าส่งมาให้เป็นภาพ",
    basePrice: 450
  },

  // --- กลุ่ม B: เอกสารองค์กร / เลย์เอาท์ ---
  {
    id: "B-M-1",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "Design System (Grid/Template) เลย์เอาท์หนังสือ",
    difficulty: 7,
    scope: "จัดวางตามโครงสร้างที่กำหนด",
    deliverables: "แบบ 1 ชุด",
    basePrice: 6300
  },
  {
    id: "B-M-2",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "ปกรายงาน (Report Cover)",
    difficulty: 3,
    scope: "ออกแบบปกเดี่ยว",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 2700
  },
  {
    id: "B-M-3",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "เกียรติบัตร (Certificate)",
    difficulty: 3,
    scope: "จัดวางตามรูปแบบมาตรฐาน",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 2700
  },
  {
    id: "B-M-4",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "นามบัตร (Business Card)",
    difficulty: 6,
    scope: "จัดวางตาม Brand Guideline",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "B-M-5",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "หัวจดหมาย (Letterhead)",
    difficulty: 3,
    scope: "ออกแบบกระดาษหัวจดหมาย",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 2700
  },
  {
    id: "B-M-6",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "ซองจดหมาย (Envelope)",
    difficulty: 3,
    scope: "ออกแบบตามขนาดมาตรฐาน",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 2700
  },
  {
    id: "B-M-7",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "การ์ดเชิญ / บัตรเชิญ (Invitation Card)",
    difficulty: 6,
    scope: "ออกแบบบัตรเชิญงานพิธีการ",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "B-M-8",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "เทมเพลต PowerPoint (Presentation Template)",
    difficulty: 8,
    scope: "ออกแบบสไลด์นำเสนอเป็นชุด",
    deliverables: "เทมเพลต 1 ชุด",
    basePrice: 7200
  },
  {
    id: "B-M-9",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "main",
    name: "แบบฟอร์มเอกสาร (Document Form)",
    difficulty: 5,
    scope: "จัดวางแบบฟอร์มให้กรอกง่าย",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 4500
  },
  // Topup B
  {
    id: "B-T-1",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "topup",
    name: "การจัดวางข้อมูลในหนังสือ 1 แผ่น",
    difficulty: 2,
    unit: "หน้า",
    scope: "1 หน้า",
    basePrice: 900
  },
  {
    id: "B-T-2",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "topup",
    name: "อินโฟกราฟิก / กราฟ / แผนภูมิในเล่ม",
    difficulty: 1,
    scope: "แปลงตัวเลข / สถิติที่ลูกค้าส่งมาให้เป็นภาพ",
    basePrice: 450
  },
  {
    id: "B-T-3",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "topup",
    name: "รีทัช / ปรับสีภาพ (Photo Retouching)",
    difficulty: 0.5,
    unit: "รูป",
    scope: "1 รูป",
    basePrice: 225
  },
  {
    id: "B-T-4",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "topup",
    name: "จัดวางตารางข้อมูลซับซ้อน",
    difficulty: 5,
    scope: "จัดวางตารางและข้อมูลเปรียบเทียบซับซ้อน",
    basePrice: 2250
  },
  {
    id: "B-T-5",
    category: "B",
    categoryName: "กลุ่ม B: เอกสารองค์กร / เลย์เอาท์",
    type: "topup",
    name: "เลย์เอาท์สองภาษา (Bilingual Layout)",
    difficulty: 4,
    scope: "จัดวางไทย-อังกฤษคู่กันในหน้าเดียว เนื้อที่ใช้เพิ่มเป็น 2 เท่า ต้องคิดโครงสร้างใหม่",
    basePrice: 1800
  },

  // --- กลุ่ม C: ฉลาก / บรรจุภัณฑ์ ---
  {
    id: "C-M-1",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "main",
    name: "สติกเกอร์ / ฉลากสินค้า (Sticker / Label)",
    difficulty: 6,
    scope: "พัฒนา Key Visual ใหม่ มีบรีฟ",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "C-M-2",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "main",
    name: "บรรจุภัณฑ์เบื้องต้น (Packaging Design)",
    difficulty: 8,
    scope: "1 งาน = 1 รสชาติ/รุ่น มีบรีฟ",
    deliverables: "แบบ 1 งาน",
    basePrice: 7200
  },
  {
    id: "C-M-3",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "main",
    name: "บริการถ่ายรูปผลิตภัณฑ์ (Product Photography)",
    difficulty: 7,
    scope: "ถ่ายภาพสินค้าประกอบสื่อ",
    deliverables: "ภาพถ่าย 1 ชุด",
    basePrice: 6300
  },
  {
    id: "C-M-4",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "main",
    name: "Mockup 3 มิติผลิตภัณฑ์ (3D Mockup)",
    difficulty: 4,
    scope: "ภาพจำลอง 3D ก่อนผลิตจริง",
    deliverables: "ไฟล์ Mockup",
    basePrice: 3600
  },
  // Topup C
  {
    id: "C-T-1",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "topup",
    name: "Concept Development กระบวนการเต็ม",
    difficulty: 4,
    scope: "ไม่มีแบบต้นทางอ้างอิงเลย (ตีโจทย์ → Concept → Art Direction → Design System)",
    basePrice: 1800
  },
  {
    id: "C-T-2",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "topup",
    name: "ค่าเพิ่มต่อรสชาติ / รุ่น (SKU)",
    difficulty: 2,
    unit: "SKU",
    scope: "ต่อยอดจากงานฐาน",
    basePrice: 900
  },
  {
    id: "C-T-3",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "topup",
    name: "จัดวางข้อมูลบังคับตามกฎหมาย",
    difficulty: 3,
    scope: "โภชนาการ / บาร์โค้ด / อย.",
    basePrice: 1350
  },
  {
    id: "C-T-4",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "topup",
    name: "ทรง Die-cut พิเศษ",
    difficulty: 2,
    scope: "ไม่ใช่ทรงมาตรฐาน",
    basePrice: 900
  },
  {
    id: "C-T-5",
    category: "C",
    categoryName: "กลุ่ม C: ฉลาก / บรรจุภัณฑ์",
    type: "topup",
    name: "สร้างไดไลน์ (Dieline)",
    difficulty: 2,
    scope: "วาดเส้นโครงพับ/ตัดของกล่อง 3 มิติ — ทักษะเฉพาะทางแยกจากการออกแบบกราฟิกหน้ากล่อง",
    basePrice: 900
  },

  // --- กลุ่ม D: Social Media Content ---
  {
    id: "D-M-1",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "โพสต์โซเชียล 1 ภาพ (Single Image Post)",
    difficulty: 5,
    scope: "ออกแบบภาพเดี่ยว",
    deliverables: "ภาพ 1 ภาพ",
    basePrice: 4500
  },
  {
    id: "D-M-2",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "โพสต์โซเชียลหลายภาพ (Carousel Post)",
    difficulty: 7,
    scope: "ชุดภาพต่อเนื่อง",
    deliverables: "ภาพหลายภาพ",
    basePrice: 6300
  },
  {
    id: "D-M-3",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "Poster ออนไลน์ (Digital Poster)",
    difficulty: 7,
    scope: "ออกแบบโปสเตอร์สำหรับโปรโมตออนไลน์",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 6300
  },
  {
    id: "D-M-4",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "อินโฟกราฟิก (Infographic)",
    difficulty: 4,
    scope: "แปลงข้อมูลเป็นภาพ",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 3600
  },
  {
    id: "D-M-5",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "ชุดไอคอน (Icon Set)",
    difficulty: 8,
    scope: "ไอคอนสไตล์เดียวกันเป็นชุด",
    deliverables: "ไอคอน 1 ชุด",
    basePrice: 7200
  },
  {
    id: "D-M-6",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "ภาพปกโซเชียล (Cover / Banner)",
    difficulty: 5,
    scope: "Cover Facebook / LINE OA / Website",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 4500
  },
  {
    id: "D-M-7",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "main",
    name: "เทมเพลต EDM / อีเมล (Email Marketing Template)",
    difficulty: 6,
    scope: "ออกแบบอีเมลโปรโมชัน",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  // Topup D
  {
    id: "D-T-1",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "topup",
    name: "Concept / Copywriting",
    difficulty: 2,
    scope: "คิดข้อความ / ทิศทางเอง",
    basePrice: 900
  },
  {
    id: "D-T-2",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "topup",
    name: "วิเคราะห์ข้อมูลก่อนออกแบบ",
    difficulty: 2,
    scope: "สรุปข้อมูลดิบก่อนแปลงเป็นภาพ",
    basePrice: 900
  },
  {
    id: "D-T-3",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "topup",
    name: "จำนวนภาพเพิ่มต่อชุด (ต่อภาพ)",
    difficulty: 1,
    unit: "ภาพ",
    scope: "เกินจำนวนฐาน",
    basePrice: 450
  },
  {
    id: "D-T-4",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "topup",
    name: "ปรับขนาด Story (แนวตั้ง) เพิ่มจาก Feed",
    difficulty: 2,
    scope: "สัดส่วนต่างกัน ต้องจัดองค์ประกอบใหม่",
    basePrice: 900
  },
  {
    id: "D-T-5",
    category: "D",
    categoryName: "กลุ่ม D: Social Media Content",
    type: "topup",
    name: "อินโฟกราฟิก / กราฟ / แผนภูมิ",
    difficulty: 4,
    scope: "แปลงตัวเลข / สถิติที่ลูกค้าส่งมาให้เป็นภาพ",
    basePrice: 1800
  },

  // --- กลุ่ม E: Brand Identity ---
  {
    id: "E-M-1",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "main",
    name: "โลโก้ (Logo Design)",
    difficulty: 9,
    scope: "ออกแบบตราสัญลักษณ์ตั้งแต่ต้น",
    deliverables: "แบบโลโก้ 1 ชุด",
    basePrice: 8100
  },
  {
    id: "E-M-2",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "main",
    name: "คีย์วิชวลกราฟิก (Key Visual)",
    difficulty: 9,
    scope: "ภาพจำหลักของแบรนด์",
    deliverables: "แบบคีย์วิชวล 1 ชุด",
    basePrice: 8100
  },
  {
    id: "E-M-3",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "main",
    name: "โปสเตอร์ออนไลน์ (Digital Key Poster)",
    difficulty: 6,
    scope: "โปสเตอร์สำหรับสื่อดิจิทัล",
    deliverables: "แบบ 1 ชิ้น",
    basePrice: 5400
  },
  {
    id: "E-M-4",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "main",
    name: "Brand Guideline ฉบับเต็ม (Full Brand Manual)",
    difficulty: 9,
    scope: "คู่มือแบรนด์ครบชุด",
    deliverables: "เอกสาร 1 เล่ม",
    basePrice: 8100
  },
  {
    id: "E-M-5",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "main",
    name: "Mascot / Character Design",
    difficulty: 9,
    scope: "ออกแบบตัวการ์ตูนแทนแบรนด์",
    deliverables: "แบบตัวละคร 1 ชุด",
    basePrice: 8100
  },
  // Topup E
  {
    id: "E-T-1",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "สร้าง Brief + Concept + Mood&Tone",
    difficulty: 4,
    scope: "กระบวนการเต็มเมื่อไม่มีทิศทางเดิม",
    deliverables: "เอกสาร Brief",
    basePrice: 1800
  },
  {
    id: "E-T-2",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "องค์ประกอบในองค์กรตาม Key Visual",
    difficulty: 2,
    unit: "ชิ้น",
    scope: "ประยุกต์ใช้สื่อภายในองค์กร (1 ชิ้นเริ่มต้น)",
    basePrice: 900
  },
  {
    id: "E-T-3",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "คู่มือ Font / แบรนด์อย่างย่อ",
    difficulty: 1,
    scope: "จากแบบที่มีอยู่แล้ว",
    basePrice: 450
  },
  {
    id: "E-T-4",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "โลโก้หลายเวอร์ชัน (แนวนอน/แนวตั้ง/ขาวดำ)",
    difficulty: 2,
    scope: "ใช้งานได้ในทุกสถานการณ์",
    basePrice: 900
  },
  {
    id: "E-T-5",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "กำหนดจานสี (Color Palette)",
    difficulty: 2,
    scope: "สีหลัก / สีรอง / สีเสริมของแบรนด์",
    basePrice: 900
  },
  {
    id: "E-T-6",
    category: "E",
    categoryName: "กลุ่ม E: Brand Identity",
    type: "topup",
    name: "ตรวจสอบความซ้ำซ้อนของโลโก้",
    difficulty: 1,
    scope: "เช็คว่าไม่ซ้ำ/ใกล้เคียงแบรนด์อื่น",
    basePrice: 450
  },
];
