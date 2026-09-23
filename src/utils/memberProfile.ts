/**
 * Member Profile & Executive Role Utility
 * Handles parsing, encoding, and formal details (Position, Real Name, Phone)
 * for Team Members and Executive Leadership.
 */

export type AssigneeRole = 'admin' | 'assignee' | 'executive';

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
}

// Official member metadata for all 12 core CC TEAM members
export const DEFAULT_MEMBER_METADATA: Record<string, { 
  fullName: string; 
  position: string; 
  phone: string;
  enName?: string;
  cmuEmail?: string;
}> = {
  "อ.บ่าว ST": {
    fullName: "ผศ.ดร.สุริยะ ทองมุณี",
    position: "รองผู้อำนวยการ (Deputy Director) • บริหารทีม",
    phone: "098-2696564",
    enName: "Assistant Professor Dr. Suriyah Thongmunee",
    cmuEmail: "suriyah@step.cmu.ac.th"
  },
  "จ๊อบ AA": {
    fullName: "นายอัจชนะพงษ์ อัจชนะวราทา",
    position: "หัวหน้าทีม (Team Leader)",
    phone: "062-4166396",
    enName: "Adchanapong Adchanawarata",
    cmuEmail: "adchanapong.a@cmu.ac.th"
  },
  "วา WK": {
    fullName: "นางสาววาสิตา กอบธัญกิจ",
    position: "ผู้ช่วยหัวหน้าทีม (Assistant Team Leader)",
    phone: "085-1071229",
    enName: "Wasita Kobtanyakit",
    cmuEmail: "wasita.k@cmu.ac.th"
  },
  "จอย RL": {
    fullName: "นางสาวรติพร กัลปพฤกษ์",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "061-5254255",
    enName: "Ratiporn Kanlapaphuk",
    cmuEmail: "ratiporn.k@cmu.ac.th"
  },
  "พิม AC": {
    fullName: "นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "095-6356992",
    enName: "Autcharaporn Sakdawongsaree",
    cmuEmail: "autcharaporn.s@cmu.ac.th"
  },
  "เยียร์ LLP": {
    fullName: "นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "081-4684359",
    enName: "Lalipat Lertlukkanawat",
    cmuEmail: "lalipat.l@cmu.ac.th"
  },
  "ลูกอิน STK": {
    fullName: "นางสาวสุทธิอาภา คุ้มครอง",
    position: "พนักงานสร้างสรรค์และสื่อสารองค์กร (Creative and Communication Officer)",
    phone: "087-1910010",
    enName: "Suthiarpa Koomkrong",
    cmuEmail: "suthiarpa.k@cmu.ac.th"
  },
  "นิน MTN": {
    fullName: "นางสาวมัทนิน ยงค์ไสว",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "098-1529592",
    enName: "Matanin Yongsawai",
    cmuEmail: "matanin.y@cmu.ac.th"
  },
  "โอ๊ต CNB": {
    fullName: "นางสาวชนนิกานต์ บุญแก้ว",
    position: "พนักงานสร้างสรรค์และสื่อสารองค์กร (Creative and Communication Officer)",
    phone: "088-8135494",
    enName: "Chonnikarn Bunkaew",
    cmuEmail: "chonnikarn.b@cmu.ac.th"
  },
  "เอ็นจอย SLR": {
    fullName: "นางสาวศิริลักษณ์ กันจะนะ",
    position: "พนักงานผลิตสื่อสร้างสรรค์ (Content Creator)",
    phone: "083-6249641",
    enName: "Siriluk Kanchana",
    cmuEmail: "Siriluk.k@cmu.ac.th"
  },
  "แก้ว KYK": {
    fullName: "นางสาวกัลยกร อภิวงศ์",
    position: "พนักงานผลิตสื่อสร้างสรรค์ (Content Creator)",
    phone: "090-3174818",
    enName: "Kanyakorn Aphiwong",
    cmuEmail: "kanyakorn.a@cmu.ac.th"
  },
  "ต้า TTY": {
    fullName: "นางสาวฐิติยา เข็มพล",
    position: "พนักงานผลิตสื่อสร้างสรรค์ (Content Creator)",
    phone: "090-0590926",
    enName: "Thitiya Khempon",
    cmuEmail: "thitiya.kh@cmu.ac.th"
  },
  "ก้อง IK": {
    fullName: "นายอิศรา แก้วเรือง",
    position: "พนักงานออกแบบสร้างสรรค์ (Creative Designer)",
    phone: "085-1093188",
    enName: "Itsara Kaewruang",
    cmuEmail: "itsara.k@cmu.ac.th"
  }
};

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

  const rawUnit: string = raw.unit || '';

  if (rawUnit.includes('|')) {
    const parts = rawUnit.split('|');
    unit = parts[0] || 'creative';
    
    // Parse role
    if (parts[1] === 'admin' || parts[1] === 'executive' || parts[1] === 'assignee') {
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
      } catch {
        // Plain string fallback
        fullName = decodeURIComponent(parts[2] || '');
        position = decodeURIComponent(parts[3] || '');
        phone = decodeURIComponent(parts[4] || '');
      }
    }
  } else {
    unit = rawUnit || 'creative';
    if (raw.role === 'admin' || raw.role === 'executive' || raw.role === 'assignee') {
      role = raw.role;
    }
  }

  // If explicit columns are available on row, prefer them
  if (raw.full_name) fullName = raw.full_name;
  if (raw.position) position = raw.position;
  if (raw.phone) phone = raw.phone;

  // Fallback to default known metadata if empty
  const trimmedName = (raw.name || '').trim();
  const defaultMeta = DEFAULT_MEMBER_METADATA[trimmedName];
  if (defaultMeta) {
    if (!fullName) fullName = defaultMeta.fullName;
    if (!position) position = defaultMeta.position;
    if (!phone) phone = defaultMeta.phone;
    if (!cmuEmail && defaultMeta.cmuEmail) cmuEmail = defaultMeta.cmuEmail;
    if (!enName && defaultMeta.enName) enName = defaultMeta.enName;
  }

  return {
    id: raw.id,
    name: trimmedName,
    fullName: fullName || trimmedName,
    position: position || (role === 'executive' ? 'ผู้บริหาร (Executive)' : 'เจ้าหน้าที่ปฏิบัติการ'),
    phone: phone || '-',
    email: raw.email || '',
    cmuEmail: cmuEmail || '',
    enName: enName || '',
    unit,
    role,
    isActive: raw.is_active ?? true,
  };
}

/**
 * Encodes unit, role, and extra metadata into a safe string for the Supabase unit text column
 */
export function encodeMemberUnit(
  unit: string, 
  role: AssigneeRole, 
  meta?: { fullName?: string; position?: string; phone?: string; cmuEmail?: string; enName?: string }
): string {
  const cleanUnit = (unit || 'creative').split('|')[0];
  const payload = {
    fullName: meta?.fullName?.trim() || '',
    position: meta?.position?.trim() || '',
    phone: meta?.phone?.trim() || '',
    cmuEmail: meta?.cmuEmail?.trim() || '',
    enName: meta?.enName?.trim() || '',
  };
  return `${cleanUnit}|${role}|${encodeURIComponent(JSON.stringify(payload))}`;
}

/**
 * Checks if a member has an Executive role
 */
export function isExecutive(memberOrUnit: MemberProfile | { unit?: string; role?: string } | string): boolean {
  if (typeof memberOrUnit === 'string') {
    return memberOrUnit === 'executive' || memberOrUnit.includes('|executive');
  }
  if ('role' in memberOrUnit && memberOrUnit.role === 'executive') return true;
  if ('unit' in memberOrUnit && memberOrUnit.unit && memberOrUnit.unit.includes('|executive')) return true;
  return false;
}

/**
 * Checks if a member can be assigned tasks (Assignee or Admin, but NOT Executive)
 */
export function isOperationalAssignee(memberOrUnit: MemberProfile | { unit?: string; role?: string } | string): boolean {
  return !isExecutive(memberOrUnit);
}
