/**
 * Member Profile & Executive Role Utility
 * Handles parsing, encoding, and formal details (Position, Real Name, Phone)
 * for Team Members and Executive Leadership.
 */

export type AssigneeRole = 'admin' | 'assignee' | 'executive' | 'viewer';

export interface MemberProfile {
  id: string;
  name: string; // ชื่อเรียก / ชื่อย่อ (e.g. จ๊อบ AA)
  fullName: string; // ชื่อจริง-นามสกุลทางการ (e.g. นายอัจชนะพงษ์ อัจชนะวราทา)
  position: string; // ตำแหน่ง (e.g. หัวหน้าทีม / พนักงานออกแบบสร้างสรรค์)
  phone: string; // เบอร์โทรศัพท์ (e.g. 062-4166396)
  email: string; // อีเมลหลัก (@step.cmu.ac.th)
  cmuEmail?: string; // อีเมลสำรอง (@cmu.ac.th)
  enName?: string; // ชื่อ-นามสกุลภาษาอังกฤษ
  unit: string; // creative, content, pr, internal, management
  role: AssigneeRole; // admin, assignee, executive
  isActive: boolean;
  lineUserId?: string; // LINE User ID (Uxxxxxxxx)
}

// Official member metadata for all core CC TEAM members and leadership
export const DEFAULT_MEMBER_METADATA: Record<string, { 
  fullName: string; 
  position: string; 
  phone: string;
  enName?: string;
  email?: string;
  cmuEmail?: string;
  lineUserId?: string;
  isExecutive?: boolean;
}> = {
  "อ.บ่าว ST": {
    fullName: "ผศ.ดร.สุริยะ ทองมุณี",
    position: "รองผู้อำนวยการ (Deputy Director) • ผู้บริหาร",
    phone: "098-2696564",
    enName: "Assistant Professor Dr. Suriyah Thongmunee",
    email: "suriyah@step.cmu.ac.th",
    cmuEmail: "suriyah@step.cmu.ac.th",
    isExecutive: true
  },
  "อ.วิน": {
    fullName: "อาจารย์วิน (PW)",
    position: "ผู้บริหาร (Executive)",
    phone: "-",
    isExecutive: true
  },
  "อ.อ้วน": {
    fullName: "ผศ.ดร.ธัญญานุภาพ อานันทนะ (TY)",
    position: "ผู้อำนวยการ (Director) • ผู้บริหาร",
    phone: "-",
    isExecutive: true
  },
  "อ.กอล์ฟ": {
    fullName: "อาจารย์กอล์ฟ (CS)",
    position: "ผู้ช่วยผู้อำนวยการ (Assistant Director) • ผู้บริหาร",
    phone: "-",
    isExecutive: true
  },
  "พี่หนึ่ง": {
    fullName: "พี่หนึ่ง (Supervisor)",
    position: "ผู้บริหาร (Executive / Supervisor)",
    phone: "-",
    isExecutive: true
  },
  "จ๊อบ AA": {
    fullName: "นายอัจชนะพงษ์ อัจชนะวราทา",
    position: "หัวหน้าทีม (Team Leader)",
    phone: "062-4166396",
    enName: "Adchanapong Adchanawarata",
    email: "adchanapong@step.cmu.ac.th",
    cmuEmail: "adchanapong.a@cmu.ac.th",
    lineUserId: "Ucbf8b9fa89f980bd351a3e9b69854a0f"
  },
  "วา WK": {
    fullName: "นางสาววาสิตา กอบธัญกิจ",
    position: "ผู้ช่วยหัวหน้าทีม (Assistant Team Leader)",
    phone: "085-1071229",
    enName: "Wasita Kobtanyakit",
    email: "wasita@step.cmu.ac.th",
    cmuEmail: "wasita.k@cmu.ac.th"
  },
  "จอย RL": {
    fullName: "นางสาวรติพร กัลปพฤกษ์",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "061-5254255",
    enName: "Ratiporn Kanlapaphuk",
    email: "ratiporn@step.cmu.ac.th",
    cmuEmail: "ratiporn.k@cmu.ac.th"
  },
  "พิม AC": {
    fullName: "นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "095-6356992",
    enName: "Autcharaporn Sakdawongsaree",
    email: "autcharaporn@step.cmu.ac.th",
    cmuEmail: "autcharaporn.s@cmu.ac.th"
  },
  "เยียร์ LLP": {
    fullName: "นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "081-4684359",
    enName: "Lalipat Lertlukkanawat",
    email: "lalipat@step.cmu.ac.th",
    cmuEmail: "lalipat.l@cmu.ac.th"
  },
  "ลูกอิน STK": {
    fullName: "นางสาวสุทธิอาภา คุ้มครอง",
    position: "Content Creator (Unit Content)",
    phone: "087-1910010",
    enName: "Suthiarpa Koomkrong",
    email: "suthiarpa@step.cmu.ac.th",
    cmuEmail: "suthiarpa.k@cmu.ac.th"
  },
  "นิน MTN": {
    fullName: "นางสาวมัทนิน ยงค์ไสว",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "098-1529592",
    enName: "Matanin Yongsawai",
    email: "matanin@step.cmu.ac.th",
    cmuEmail: "matanin.y@cmu.ac.th"
  },
  "โอ๊ต CNB": {
    fullName: "นางสาวชนนิกานต์ บุญแก้ว",
    position: "PR (Unit PR)",
    phone: "088-8135494",
    enName: "Chonnikarn Bunkaew",
    email: "chonnikarn@step.cmu.ac.th",
    cmuEmail: "chonnikarn.b@cmu.ac.th"
  },
  "เอ็นจอย SLR": {
    fullName: "นางสาวศิริลักษณ์ กันจะนะ",
    position: "Content Creator (Unit Content)",
    phone: "083-6249641",
    enName: "Siriluk Kanchana",
    email: "siriluk@step.cmu.ac.th",
    cmuEmail: "Siriluk.k@cmu.ac.th"
  },
  "แก้ว KYK": {
    fullName: "นางสาวกัลยกร อภิวงศ์",
    position: "Content Creator (Unit Content)",
    phone: "090-3174818",
    enName: "Kanyakorn Aphiwong",
    email: "kanyakorn@step.cmu.ac.th",
    cmuEmail: "kanyakorn.a@cmu.ac.th"
  },
  "ต้า TTY": {
    fullName: "นางสาวฐิติยา เข็มพล",
    position: "PR (Unit PR)",
    phone: "090-0590926",
    enName: "Thitiya Khempon",
    email: "thitiya@step.cmu.ac.th",
    cmuEmail: "thitiya.kh@cmu.ac.th"
  },
  "ก้อง IK": {
    fullName: "นายอิศรา แก้วเรือง",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "085-1093188",
    enName: "Itsara Kaewruang",
    email: "itsara@step.cmu.ac.th",
    cmuEmail: "itsara.k@cmu.ac.th"
  }
};

export const MEMBER_EMAIL_MAP: Record<string, string> = {
  "จ๊อบ AA": "adchanapong@step.cmu.ac.th",
  "วา WK": "wasita@step.cmu.ac.th",
  "ก้อง IK": "itsara@step.cmu.ac.th",
  "จอย RL": "ratiporn@step.cmu.ac.th",
  "พิม AC": "autcharaporn@step.cmu.ac.th",
  "เยียร์ LLP": "lalipat@step.cmu.ac.th",
  "ลูกอิน STK": "suthiarpa@step.cmu.ac.th",
  "นิน MTN": "matanin@step.cmu.ac.th",
  "โอ๊ต CNB": "chonnikarn@step.cmu.ac.th",
  "เอ็นจอย SLR": "siriluk@step.cmu.ac.th",
  "แก้ว KYK": "kanyakorn@step.cmu.ac.th",
  "ต้า TTY": "thitiya@step.cmu.ac.th",
  "อ.บ่าว ST": "suriyah@step.cmu.ac.th",
};

export function getMemberOfficialEmail(name: string, fallback?: string): string {
  if (!name) return fallback || "cc@step.cmu.ac.th";
  const trimmed = name.trim();
  if (MEMBER_EMAIL_MAP[trimmed]) return MEMBER_EMAIL_MAP[trimmed];

  for (const [key, em] of Object.entries(MEMBER_EMAIL_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return em;
    const parts = key.split(' ');
    if (parts.some(p => trimmed.toLowerCase().includes(p.toLowerCase()))) {
      return em;
    }
  }

  if (fallback && /^[\x00-\x7F]+$/.test(fallback) && fallback.includes('@')) {
    return fallback.trim();
  }

  return "cc@step.cmu.ac.th";
}

/**
 * Parses raw Supabase assignee row into structured MemberProfile
 */
export function parseMemberRecord(raw: any): MemberProfile {
  let unit = 'creative';
  let role: AssigneeRole = 'assignee';
  let fullName = '';
  let position = '';
  let phone = '';
  let cmuEmail = '';
  let enName = '';
  let lineUserId = '';

  const rawUnit: string = raw.unit || '';

  if (rawUnit.includes('|')) {
    const parts = rawUnit.split('|');
    unit = parts[0] || 'creative';
    
    // Parse role
    if (parts[1] === 'admin' || parts[1] === 'executive' || parts[1] === 'assignee' || parts[1] === 'viewer') {
      role = parts[1];
    }

    // Parse extra metadata JSON if present
    if (parts[2]) {
      try {
        const decoded = decodeURIComponent(parts[2]);
        const parsed = JSON.parse(decoded);
        fullName = parsed.fullName || parsed.full_name || '';
        position = parsed.position || '';
        phone = parsed.phone || '';
        cmuEmail = parsed.cmuEmail || parsed.cmu_email || '';
        enName = parsed.enName || parsed.en_name || '';
        lineUserId = parsed.lineUserId || parsed.line_user_id || '';
      } catch {
        // Plain string fallback
        fullName = decodeURIComponent(parts[2] || '');
        position = decodeURIComponent(parts[3] || '');
        phone = decodeURIComponent(parts[4] || '');
      }
    }
  } else {
    unit = rawUnit || 'creative';
    if (raw.role === 'admin' || raw.role === 'executive' || raw.role === 'assignee' || raw.role === 'viewer') {
      role = raw.role;
    }
  }

  // If explicit columns are available on row, prefer them
  if (raw.full_name) fullName = raw.full_name;
  if (raw.position) position = raw.position;
  if (raw.phone) phone = raw.phone;
  if (raw.line_user_id) lineUserId = raw.line_user_id;

  // Fallback to default known metadata if empty
  const trimmedName = (raw.name || '').trim();
  const defaultMeta = DEFAULT_MEMBER_METADATA[trimmedName];
  let memberEmail = (raw.email && /^[\x00-\x7F]+$/.test(raw.email) && raw.email.includes('@')) ? raw.email.trim() : '';

  if (defaultMeta) {
    if (!fullName) fullName = defaultMeta.fullName;
    if (!position) position = defaultMeta.position;
    if (!phone) phone = defaultMeta.phone;
    if (!cmuEmail && defaultMeta.cmuEmail) cmuEmail = defaultMeta.cmuEmail;
    if (!enName && defaultMeta.enName) enName = defaultMeta.enName;
    if (!memberEmail && defaultMeta.email) memberEmail = defaultMeta.email;
    if (!lineUserId && defaultMeta.lineUserId) lineUserId = defaultMeta.lineUserId;
    if (defaultMeta.isExecutive) {
      role = 'executive';
    }
  }

  // Explicit safety check for executive names or emails
  if (
    trimmedName.includes('อ.บ่าว') || 
    trimmedName.includes('สุริยะ') || 
    trimmedName.includes('ปิติวัฒน์') ||
    memberEmail.includes('suriyah') ||
    memberEmail.includes('pitiwat')
  ) {
    role = 'executive';
  }

  if (!memberEmail) {
    memberEmail = getMemberOfficialEmail(trimmedName);
  }

  return {
    id: raw.id,
    name: trimmedName,
    fullName: fullName || trimmedName,
    position: position || (role === 'executive' ? 'ผู้บริหาร (Executive)' : role === 'viewer' ? 'ผู้เข้าชม (Viewer)' : 'เจ้าหน้าที่ปฏิบัติการ'),
    phone: phone || '-',
    email: memberEmail,
    cmuEmail: cmuEmail || '',
    enName: enName || '',
    unit,
    role,
    isActive: raw.is_active ?? true,
    lineUserId: lineUserId || undefined,
  };
}

/**
 * Encodes unit, role, and extra metadata into a safe string for the Supabase unit text column
 */
export function encodeMemberUnit(
  unit: string, 
  role: AssigneeRole, 
  meta?: { fullName?: string; position?: string; phone?: string; cmuEmail?: string; enName?: string; lineUserId?: string }
): string {
  const cleanUnit = (unit || 'creative').split('|')[0];
  const payload = {
    fullName: meta?.fullName?.trim() || '',
    position: meta?.position?.trim() || '',
    phone: meta?.phone?.trim() || '',
    cmuEmail: meta?.cmuEmail?.trim() || '',
    enName: meta?.enName?.trim() || '',
    lineUserId: meta?.lineUserId?.trim() || '',
  };
  return `${cleanUnit}|${role}|${encodeURIComponent(JSON.stringify(payload))}`;
}

// Ironclad Core Operational CC TEAM Members Whitelist (12 Core Members)
// Prevents any operational member from ever being misclassified as Executive/Viewer or disappearing from dropdowns/filters
export const CORE_OPERATIONAL_MEMBERS: ReadonlyArray<{
  id: string;
  name: string;
  email: string;
  unit: string;
}> = [
  { id: "18c2cc99-e677-43fd-bbaf-fcb83e23210e", name: "จ๊อบ AA", email: "adchanapong@step.cmu.ac.th", unit: "all|admin" },
  { id: "daca31a4-5efd-475e-80ee-b9f38dd381cb", name: "วา WK", email: "wasita@step.cmu.ac.th", unit: "creative|assignee" },
  { id: "d99de87a-eb50-4383-a050-1f24a52b4620", name: "จอย RL", email: "ratiporn@step.cmu.ac.th", unit: "creative|assignee" },
  { id: "47adfbc2-8d0e-4dc7-87ad-98895be82026", name: "พิม AC", email: "autcharaporn@step.cmu.ac.th", unit: "creative|assignee" },
  { id: "7800682c-8aed-45cf-ab31-45473fd16e3d", name: "เยียร์ LLP", email: "lalipat@step.cmu.ac.th", unit: "creative|assignee" },
  { id: "b04669b5-6e86-4629-9e66-57d464881653", name: "ลูกอิน STK", email: "suthiarpa@step.cmu.ac.th", unit: "content|assignee" },
  { id: "82faa669-a2b6-4497-88cf-8556a867176f", name: "นิน MTN", email: "matanin@step.cmu.ac.th", unit: "creative|assignee" },
  { id: "e2c2672d-81c4-411d-89e9-bcbb6eb374f5", name: "โอ๊ต CNB", email: "chonnikarn@step.cmu.ac.th", unit: "pr|assignee" },
  { id: "a2cf6e47-fc1c-4c19-b080-fe4b57f4a66a", name: "เอ็นจอย SLR", email: "siriluk@step.cmu.ac.th", unit: "content|assignee" },
  { id: "3ab19406-29cc-4430-b4bf-2cfe9a1c29b7", name: "แก้ว KYK", email: "kanyakorn@step.cmu.ac.th", unit: "content|assignee" },
  { id: "6984154a-2975-4040-a557-aec9d090377f", name: "ต้า TTY", email: "thitiya@step.cmu.ac.th", unit: "pr|assignee" },
  { id: "fa87becd-45b3-4590-b381-ded430ce7975", name: "ก้อง IK", email: "itsara@step.cmu.ac.th", unit: "creative|assignee" },
];

export const CORE_OPERATIONAL_MEMBER_IDS = new Set(CORE_OPERATIONAL_MEMBERS.map((m) => m.id));
export const CORE_OPERATIONAL_MEMBER_NAMES = new Set(CORE_OPERATIONAL_MEMBERS.map((m) => m.name));
export const CORE_OPERATIONAL_EMAILS = new Set([
  ...CORE_OPERATIONAL_MEMBERS.map((m) => m.email.toLowerCase()),
  "adchanapong.a@cmu.ac.th",
  "wasita.k@cmu.ac.th",
  "ratiporn.k@cmu.ac.th",
  "autcharaporn.s@cmu.ac.th",
  "lalipat.l@cmu.ac.th",
  "suthiarpa.k@cmu.ac.th",
  "matanin.y@cmu.ac.th",
  "chonnikarn.b@cmu.ac.th",
  "siriluk.k@cmu.ac.th",
  "kanyakorn.a@cmu.ac.th",
  "thitiya.kh@cmu.ac.th",
  "itsara.k@cmu.ac.th",
]);

/**
 * Returns the official short name for a known core member ID (fallback if assignees list hasn't loaded or is filtered)
 */
export function getAssigneeFallbackName(assigneeId?: string | null): string | null {
  if (!assigneeId) return null;
  const found = CORE_OPERATIONAL_MEMBERS.find((m) => m.id === assigneeId);
  return found ? found.name : null;
}

/**
 * Ensures all 12 core operational CC TEAM members are always present in an assignees list
 */
export function ensureCoreOperationalAssignees<T extends { id: string; name: string; email?: string; unit?: string }>(
  rawAssignees: T[] | null | undefined
): T[] {
  const list = (rawAssignees || []).filter((a) => isOperationalAssignee(a));
  const existingIds = new Set(list.map((a) => a.id));
  const existingNames = new Set(list.map((a) => (a.name || "").trim()));

  const result = [...list];
  for (const core of CORE_OPERATIONAL_MEMBERS) {
    if (!existingIds.has(core.id) && !existingNames.has(core.name)) {
      result.push({
        id: core.id,
        name: core.name,
        email: core.email,
        unit: core.unit,
        is_active: true,
      } as unknown as T);
    }
  }
  return result;
}

/**
 * Checks if a member belongs to the 12 core operational CC TEAM members
 */
export function isCoreOperationalMember(
  memberOrUnit: MemberProfile | { id?: string; unit?: string; role?: string; name?: string; email?: string } | string | null | undefined
): boolean {
  if (!memberOrUnit) return false;
  if (typeof memberOrUnit === "string") {
    const trimmed = memberOrUnit.trim();
    if (CORE_OPERATIONAL_MEMBER_IDS.has(trimmed) || CORE_OPERATIONAL_MEMBER_NAMES.has(trimmed) || CORE_OPERATIONAL_EMAILS.has(trimmed.toLowerCase())) {
      return true;
    }
    if (trimmed.includes("|")) {
      const [unitPart, rolePart] = trimmed.split("|");
      const u = (unitPart || "").toLowerCase();
      const r = (rolePart || "").toLowerCase();
      if ((u === "creative" || u === "content" || u === "pr" || u === "all" || u === "internal") && (r === "assignee" || r === "admin")) {
        return true;
      }
    }
    return false;
  }

  const id = ("id" in memberOrUnit && typeof memberOrUnit.id === "string" && memberOrUnit.id.trim()) || "";
  const name = ("name" in memberOrUnit && typeof memberOrUnit.name === "string" && memberOrUnit.name.trim()) || "";
  const email = ("email" in memberOrUnit && typeof memberOrUnit.email === "string" && memberOrUnit.email.trim().toLowerCase()) || "";

  if (id && CORE_OPERATIONAL_MEMBER_IDS.has(id)) return true;
  if (name && CORE_OPERATIONAL_MEMBER_NAMES.has(name)) return true;
  if (email && CORE_OPERATIONAL_EMAILS.has(email)) return true;

  if ("unit" in memberOrUnit && typeof memberOrUnit.unit === "string" && memberOrUnit.unit.includes("|")) {
    const [unitPart, rolePart] = memberOrUnit.unit.split("|");
    const u = (unitPart || "").toLowerCase();
    const r = (rolePart || "").toLowerCase();
    if ((u === "creative" || u === "content" || u === "pr" || u === "all" || u === "internal") && (r === "assignee" || r === "admin")) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a member has an Executive role
 */
export function isExecutive(
  memberOrUnit: MemberProfile | { id?: string; unit?: string; role?: string; name?: string; email?: string } | string | null | undefined
): boolean {
  if (!memberOrUnit) return false;

  // IRONCLAD GUARD: Core operational CC TEAM members are NEVER executives under any circumstance!
  // (Previously, 'Wasita Kobtanyakit' in encoded unit JSON matched s.includes('tanya')!)
  if (isCoreOperationalMember(memberOrUnit)) {
    return false;
  }

  // Extract structured fields WITHOUT scanning raw URL-encoded metadata JSON in unit.split('|')[2]
  let textToCheck = "";
  if (typeof memberOrUnit === "string") {
    if (memberOrUnit.includes("|")) {
      const parts = memberOrUnit.split("|");
      textToCheck = `${parts[0] || ""} ${parts[1] || ""}`;
    } else {
      textToCheck = memberOrUnit;
    }
  } else {
    const rawUnit = ("unit" in memberOrUnit && typeof memberOrUnit.unit === "string") ? memberOrUnit.unit : "";
    const unitParts = rawUnit.split("|");
    const unitPrefix = `${unitParts[0] || ""} ${unitParts[1] || ""}`;
    textToCheck = [
      ("id" in memberOrUnit && memberOrUnit.id) || "",
      ("role" in memberOrUnit && memberOrUnit.role) || "",
      unitPrefix,
      ("name" in memberOrUnit && memberOrUnit.name) || "",
      ("fullName" in memberOrUnit && (memberOrUnit as any).fullName) || "",
      ("email" in memberOrUnit && memberOrUnit.email) || "",
    ].join(" ");
  }

  const s = textToCheck.toLowerCase();

  // 1. Executive keywords in unit/role/position (Do not match 'ผู้บริหารระบบ' which is CC Team Leader)
  if (
    s.includes("executive") ||
    s.includes("|executive") ||
    s.includes("management") ||
    s.includes("director") ||
    s.includes("ผู้อำนวยการ") ||
    s.includes("รองผู้อำนวยการ") ||
    s.includes("ผู้ช่วยผู้อำนวยการ") ||
    (s.includes("ผู้บริหาร") && !s.includes("ผู้บริหารระบบ"))
  ) {
    return true;
  }

  // 2. Specific executive identities (use exact/unambiguous tokens — never bare 'tanya' or bare 'หนึ่ง'):
  // - อ.บ่าว ST (สุริยะ / suriyah)
  if (s.includes("บ่าว") || s.includes("สุริยะ") || s.includes("suriyah") || s.includes("686a3b2e-c83a-48d8-a0c2-fd0dd8fc223a")) return true;

  // - อ.วิน (วรพจน์ / ปิติวัฒน์ / pitiwat)
  if (s.includes("อ.วิน") || s.includes("อาจารย์วิน") || s.includes("วรพจน์") || s.includes("witty win") || s.includes("b42a9d02-89b8-4876-be17-91ae9e638401")) return true;

  // - อ.อ้วน (tanyanuparb / ธัญญานุภาพ / ob-oon)
  if (s.includes("อ.อ้วน") || s.includes("อาจารย์อ้วน") || s.includes("tanyanuparb") || s.includes("ธัญญานุภาพ") || s.includes("ob-oon") || s.includes("b90df01a-6595-4f7a-934b-aaaeffda1acd")) return true;

  // - อ.กอล์ฟ (choncharoen / ชนม์เจริญ)
  if (s.includes("อ.กอล์ฟ") || s.includes("อาจารย์กอล์ฟ") || s.includes("choncharoen") || s.includes("ชนม์เจริญ") || (s.includes("กอล์ฟ") && !s.includes("ก้อง")) || s.includes("75af9cf4-fb88-4a73-b931-2ed6ae2256dd")) return true;

  // - พี่หนึ่ง (พิชาติ / pichart / 3536b2e1-4a69-47c4-a943-79409d8b741f)
  if (s.includes("พี่หนึ่ง") || s.includes("pichart") || s.includes("พิชาติ") || s.includes("3536b2e1-4a69-47c4-a943-79409d8b741f")) return true;

  // - Other director references
  if (s.includes("pitiwat") || s.includes("ปิติวัฒน์") || s.includes("step director")) return true;

  return false;
}

/**
 * Checks if a member has a Viewer role
 */
export function isViewer(memberOrUnit: MemberProfile | { id?: string; unit?: string; role?: string; name?: string; email?: string } | string | null | undefined): boolean {
  if (!memberOrUnit) return false;
  if (isCoreOperationalMember(memberOrUnit)) return false;
  if (typeof memberOrUnit === "string") {
    return memberOrUnit === "viewer" || memberOrUnit.includes("|viewer");
  }
  if ("role" in memberOrUnit && memberOrUnit.role === "viewer") return true;
  if ("unit" in memberOrUnit && memberOrUnit.unit && memberOrUnit.unit.includes("|viewer")) return true;
  return false;
}

/**
 * Checks if a member can be assigned tasks (Assignee or Admin, but NOT Executive or Viewer)
 */
export function isOperationalAssignee(
  memberOrUnit: MemberProfile | { id?: string; unit?: string; role?: string; name?: string; email?: string } | string | null | undefined
): boolean {
  if (!memberOrUnit) return false;
  if (isCoreOperationalMember(memberOrUnit)) return true;
  return !isExecutive(memberOrUnit) && !isViewer(memberOrUnit);
}

