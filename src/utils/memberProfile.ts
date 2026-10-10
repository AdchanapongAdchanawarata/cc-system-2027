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

/**
 * Checks if a member has an Executive role
 */
export function isExecutive(memberOrUnit: MemberProfile | { unit?: string; role?: string; name?: string; email?: string } | string | null | undefined): boolean {
  if (!memberOrUnit) return false;
  if (typeof memberOrUnit === 'string') {
    const s = memberOrUnit.toLowerCase();
    return s === 'executive' || 
           s.includes('|executive') || 
           s.includes('บ่าว') || 
           s.includes('suriyah') ||
           s.includes('สุริยะ') ||
           s.includes('pitiwat') ||
           s.includes('ปิติวัฒน์');
  }
  if ('role' in memberOrUnit && memberOrUnit.role === 'executive') return true;
  if ('unit' in memberOrUnit && memberOrUnit.unit) {
    const u = memberOrUnit.unit.toLowerCase();
    if (u.includes('|executive') || u === 'executive' || u === 'management') return true;
  }
  if ('name' in memberOrUnit && memberOrUnit.name) {
    const n = memberOrUnit.name;
    if (n.includes('บ่าว') || n.includes('สุริยะ') || n.includes('ปิติวัฒน์') || n.includes('STeP Director')) return true;
  }
  if ('fullName' in memberOrUnit && (memberOrUnit as any).fullName) {
    const fn = (memberOrUnit as any).fullName;
    if (fn.includes('สุริยะ') || fn.includes('ปิติวัฒน์')) return true;
  }
  if ('email' in memberOrUnit && memberOrUnit.email) {
    const e = memberOrUnit.email.toLowerCase();
    if (e.includes('suriyah') || e.includes('pitiwat')) return true;
  }
  return false;
}

/**
 * Checks if a member has a Viewer role
 */
export function isViewer(memberOrUnit: MemberProfile | { unit?: string; role?: string } | string | null | undefined): boolean {
  if (!memberOrUnit) return false;
  if (typeof memberOrUnit === 'string') {
    return memberOrUnit === 'viewer' || memberOrUnit.includes('|viewer');
  }
  if ('role' in memberOrUnit && memberOrUnit.role === 'viewer') return true;
  if ('unit' in memberOrUnit && memberOrUnit.unit && memberOrUnit.unit.includes('|viewer')) return true;
  return false;
}

/**
 * Checks if a member can be assigned tasks (Assignee or Admin, but NOT Executive or Viewer)
 */
export function isOperationalAssignee(memberOrUnit: MemberProfile | { unit?: string; role?: string; name?: string; email?: string } | string | null | undefined): boolean {
  return !isExecutive(memberOrUnit) && !isViewer(memberOrUnit);
}
