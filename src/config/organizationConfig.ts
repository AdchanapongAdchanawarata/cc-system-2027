/**
 * ============================================================================
 * CENTRALIZED ORGANIZATION & DOMAIN CONFIGURATION (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * ไฟล์นี้รวบรวมโครงสร้างองค์กร ยูนิต สมาชิกทีม กฎโควต้า LINE และค่าคงที่หลักของระบบไว้ที่เดียว
 * เวลาต้องการแก้ไขข้อมูลสมาชิก เพิ่มยูนิตใหม่ หรือนำระบบไปปรับใช้กับทีม/หน่วยงานอื่น (Scale / White-label)
 * สามารถแก้ไขที่ไฟล์นี้จุดเดียวโดยไม่กระทบโค้ดส่วนคำนวณหรือหน้าบ้าน
 */

export const ORGANIZATION_META = {
  organizationName: "อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP CMU)",
  teamName: "CC TEAM (Corporate Communication & Creative)",
  botName: "น้อง CC",
  fiscalYear: 70,
  fiscalYearLabel: "ปีงบประมาณ 2570 (FY70)",
  timezone: "Asia/Bangkok",
  appBaseUrl: (process.env.NEXT_PUBLIC_APP_URL || "https://ccteam.vercel.app").replace(/\/$/, ""),
} as const;

export type OperationalUnitKey = "creative" | "content" | "pr" | "internal";

export interface UnitDefinition {
  key: OperationalUnitKey;
  label: string;
  thaiLabel: string;
  leadNickname: string;
  isInternal: boolean;
  standardLeadDays: number;
  badgeColor: string;
}

export const UNIT_DEFINITIONS: Record<OperationalUnitKey, UnitDefinition> = {
  creative: {
    key: "creative",
    label: "Creative & Design",
    thaiLabel: "ยูนิต Creative (ออกแบบกราฟิกและสื่อสร้างสรรค์)",
    leadNickname: "วา WK",
    isInternal: false,
    standardLeadDays: 5,
    badgeColor: "#EC4899",
  },
  content: {
    key: "content",
    label: "Content & Video",
    thaiLabel: "ยูนิต Content (ผลิตคอนเทนต์และวิดีโอ)",
    leadNickname: "จ๊อบ AA",
    isInternal: false,
    standardLeadDays: 7,
    badgeColor: "#8B5CF6",
  },
  pr: {
    key: "pr",
    label: "PR & Communication",
    thaiLabel: "ยูนิต PR (ประชาสัมพันธ์และสื่อสารองค์กร)",
    leadNickname: "จ๊อบ AA",
    isInternal: false,
    standardLeadDays: 3,
    badgeColor: "#3B82F6",
  },
  internal: {
    key: "internal",
    label: "Internal Task (งานภายใน)",
    thaiLabel: "งานบริหารจัดการและภารกิจภายในทีม CC",
    leadNickname: "จ๊อบ AA",
    isInternal: true,
    standardLeadDays: 3,
    badgeColor: "#F59E0B",
  },
};

/**
 * รายชื่อสมาชิกหลักของทีมปฏิบัติการ (Fallback ID -> ชื่อเล่นมาตรฐาน)
 */
export const DEFAULT_ASSIGNEE_NAMES: Record<string, string> = {
  "e0927082-1bd9-4a1a-a519-063eb13d2e89": "จ๊อบ AA",
  "cc-core-job": "จ๊อบ AA",
  "94f4d87b-2b7a-4484-8f34-169a3f3a9d61": "วา WK",
  "cc-core-wa": "วา WK",
  "05f84b74-c1cb-4f99-9526-8573221c074a": "ตูน KT",
  "cc-core-toon": "ตูน KT",
  "23f7a440-1082-4665-8620-73832b4f212b": "ฟิวส์ NP",
  "cc-core-fuse": "ฟิวส์ NP",
  "b2c9a684-55d8-4a8e-a4e1-96215c2c0435": "บุ๋มบิ๋ม KW",
  "cc-core-bumbim": "บุ๋มบิ๋ม KW",
  "50e4d6c7-1e8b-4c5a-9b3a-7f8d2e1c4a9b": "เตย TC",
  "cc-core-toey": "เตย TC",
  "79c1130e-3f42-4c6e-9188-2610c8492e1a": "บูม KK",
  "cc-core-boom": "บูม KK",
  "81a24b3c-5d6e-4f7a-8b9c-0d1e2f3a4b5c": "เก่ง KK",
  "cc-core-keng": "เก่ง KK",
  "a94d8c3e-6b2f-4e1a-9c5d-8f7e6a5b4c3d": "โอ๊ต PT",
  "cc-core-oat": "โอ๊ต PT",
  "c3b2a1d0-9e8f-4a7b-8c6d-5e4f3a2b1c0d": "พิม PW",
  "cc-core-pim": "พิม PW",
  "d4e5f6a7-1b2c-4d3e-9f8a-7b6c5d4e3f2a": "พลอย PP",
  "cc-core-ploy": "พลอย PP",
  "f1e2d3c4-5b6a-4c7d-8e9f-0a1b2c3d4e5f": "ออย AP",
  "cc-core-oil": "ออย AP",
};

/**
 * กฎการเรียกสรรพนาม (Honorifics) ของบอทและระบบแจ้งเตือน
 * รุ่นพี่ (พี่): พี่จ๊อบ, พี่วา, พี่ตูน, พี่พิม, พี่เตย, พี่ออย, พี่โอ๊ต, พี่เก่ง
 * รุ่นน้อง (น้อง): น้องบุ๋มบิ๋ม, น้องพลอย, น้องฟิวส์, น้องบูม
 */
export const JUNIOR_MEMBER_KEYWORDS = ["บุ๋มบิ๋ม", "พลอย", "ฟิวส์", "บูม"] as const;

export const HONORIFIC_MAP: Array<[string, string]> = [
  ["จ๊อบ", "พี่จ๊อบ"],
  ["วา", "พี่วา"],
  ["ตูน", "พี่ตูน"],
  ["พิม", "พี่พิม"],
  ["เตย", "พี่เตย"],
  ["ออย", "พี่ออย"],
  ["โอ๊ต", "พี่โอ๊ต"],
  ["เก่ง", "พี่เก่ง"],
  ["บุ๋มบิ๋ม", "น้องบุ๋มบิ๋ม"],
  ["พลอย", "น้องพลอย"],
  ["ฟิวส์", "น้องฟิวส์"],
  ["บูม", "น้องบูม"],
];

/**
 * กฎเหล็กการคิดโควต้า LINE Messaging API (Ironclad Rule #7)
 */
export const LINE_QUOTA_CONFIG = {
  monthlyLimit: 300,
  safetyReserveMessages: 20,
  groups: {
    noty: {
      roleKey: "noty",
      name: "Creative step (NOTY)",
      memberCount: 12,
      defaultGroupId: "C48efdf0eb2fd50dd4ebce5be940b6f26",
    },
    executive: {
      roleKey: "executive",
      name: "CC TEAM (Executive)",
      memberCount: 17,
      defaultGroupId: "Cf9efaaadfaad2adeadbc79f7883a6d37",
    },
  },
} as const;

/**
 * Helper: แปลงรหัสผู้รับผิดชอบเป็นชื่อมาตรฐาน
 */
export function getAssigneeFallbackName(assigneeId?: string | null): string | null {
  if (!assigneeId) return null;
  return DEFAULT_ASSIGNEE_NAMES[assigneeId] || null;
}

/**
 * Helper: แปลงชื่อสมาชิกให้อยู่ในรูปแบบสรรพนามที่ถูกต้อง (เช่น @พี่จ๊อบ AA, @น้องฟิวส์ NP)
 */
export function formatMemberTag(name?: string | null, withAtPrefix: boolean = true): string {
  const prefixSymbol = withAtPrefix ? "@" : "";
  if (!name || name === "ยังไม่ระบุ" || name === "ยังไม่ระบุผู้รับผิดชอบ") {
    return `${prefixSymbol}ยังไม่ระบุผู้รับผิดชอบ`;
  }
  const clean = name.trim();
  const isJunior = JUNIOR_MEMBER_KEYWORDS.some((jr) => clean.includes(jr));
  const honorific = isJunior ? "น้อง" : "พี่";
  if (clean.startsWith("พี่") || clean.startsWith("น้อง")) {
    return `${prefixSymbol}${clean}`;
  }
  return `${prefixSymbol}${honorific}${clean}`;
}

/**
 * Helper: แปลงรหัสยูนิตเป็นชื่อแสดงผลมาตรฐาน
 */
export function formatUnitLabel(unit?: string | null): string {
  const key = (unit || "").toLowerCase().trim() as OperationalUnitKey;
  if (UNIT_DEFINITIONS[key]) {
    return key === "internal" ? "Internal Task" : key.charAt(0).toUpperCase() + key.slice(1);
  }
  return unit || "ทั่วไป";
}

/**
 * Helper: สร้าง URL เต็มสำหรับเชื่อมโยงไปยังหน้าต่างๆ ของระบบ
 */
export function buildPortalUrl(pathAndQuery: string): string {
  const cleanPath = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${ORGANIZATION_META.appBaseUrl}${cleanPath}`;
}
