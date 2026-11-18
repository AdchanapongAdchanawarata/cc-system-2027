/**
 * ============================================================================
 * SUPABASE DATA CATEGORY REGISTRY & SCHEMA DEFINITIONS
 * ============================================================================
 * จัดระเบียบหมวดหมู่ข้อมูลทั้งหมดใน Supabase ทั้งตารางหลัก (Relational Tables)
 * และชุดข้อมูลโมดูลย่อย (Document Collections ใน okr_settings)
 * พร้อมรองรับการเพิ่มหมวดการเก็บข้อมูลใหม่ (Dynamic Custom Categories) ได้อย่างอิสระ
 */

export type DataCategoryGroupId =
  | "CORE_TABLES"
  | "OKR_AND_STRATEGY"
  | "SERVICE_AND_FINANCE"
  | "PORTAL_MODULES"
  | "LINE_AND_AI"
  | "SYSTEM_AND_AUDIT"
  | "CUSTOM_CATEGORIES";

export interface DataCategoryGroupMeta {
  id: DataCategoryGroupId;
  title: string;
  subtitle: string;
  badgeColor: string;
  description: string;
}

export const DATA_CATEGORY_GROUPS: Record<DataCategoryGroupId, DataCategoryGroupMeta> = {
  CORE_TABLES: {
    id: "CORE_TABLES",
    title: "1. ตารางฐานข้อมูลหลัก (Core Relational Tables)",
    subtitle: "PostgreSQL Tables: briefs, assignees, okr_settings",
    badgeColor: "#2563EB",
    description: "ตารางหลักของระบบที่ใช้เก็บข้อมูลสั่งงาน (Briefs), บุคลากร (Assignees) และโครงสร้างตัวชี้วัด/การตั้งค่าระบบ (OKR Settings)",
  },
  OKR_AND_STRATEGY: {
    id: "OKR_AND_STRATEGY",
    title: "2. หมวดเป้าหมาย OKRs & แผนปฏิบัติการ (OKR & Strategy)",
    subtitle: "เป้าหมายองค์กร รายบุคคล แผน Action Plan และมติที่ประชุม",
    badgeColor: "#7C3AED",
    description: "เก็บค่าเป้าหมาย KR1–KR4, R1–R10 รายบุคคล, แผนปฏิบัติการทีม CC และงานสั่งการจากที่ประชุม",
  },
  SERVICE_AND_FINANCE: {
    id: "SERVICE_AND_FINANCE",
    title: "3. หมวดบริการ การเงิน และรหัสงาน (Service Catalog & Finance)",
    subtitle: "ราคากลาง Save Cost และระบบรันเลขรหัสงานอัตโนมัติ",
    badgeColor: "#059669",
    description: "เก็บตารางราคากลางมาตรฐานสำหรับคำนวณมูลค่า Save Cost และลำดับรหัสงาน (Task Code Sequences) ไม่ให้ชนกัน",
  },
  PORTAL_MODULES: {
    id: "PORTAL_MODULES",
    title: "4. หมวดฐานข้อมูลโมดูลเฉพาะทาง (Portal & Specialized Modules)",
    subtitle: "ข่าว RSP, ศูนย์ IDC, คลังลิงก์ผลงาน, องค์ความรู้ KM และผลประเมิน",
    badgeColor: "#D97706",
    description: "ชุดข้อมูลสำหรับฟีเจอร์เฉพาะทางของพอร์ทัล เช่น รายงานข่าวเครือข่าย RSP, งานปรึกษา IDC, คลังผลงาน และประวัติการอบรม",
  },
  LINE_AND_AI: {
    id: "LINE_AND_AI",
    title: "5. หมวดระบบอัตโนมัติ LINE OA & AI Bot (LINE & AI Automation)",
    subtitle: "ตั้งค่ากลุ่ม LINE, ตัวติดตาม Cron, ความจำบอท และคลังข้อความ",
    badgeColor: "#10B981",
    description: "เก็บการตั้งค่ากลุ่มเป้าหมาย LINE OA, ประวัติการส่งรายงานอัตโนมัติ (ป้องกันการส่งซ้ำ) และบริบทการสนทนาของน้อง CC",
  },
  SYSTEM_AND_AUDIT: {
    id: "SYSTEM_AND_AUDIT",
    title: "6. หมวดความปลอดภัย ประวัติระบบ และสำรองข้อมูล (Security & Audit)",
    subtitle: "Audit Trail Logs และสถานะการสำรองข้อมูลล่าสุด",
    badgeColor: "#E11D48",
    description: "เก็บประวัติการแก้ไขข้อมูลในระบบ (พร้อมระบบบีบอัดขนาดอัตโนมัติ) และข้อมูล Snapshot การสำรองฐานข้อมูล",
  },
  CUSTOM_CATEGORIES: {
    id: "CUSTOM_CATEGORIES",
    title: "7. หมวดข้อมูลเพิ่มเติมที่สร้างเอง (Custom Data Categories)",
    subtitle: "ขยายขอบเขตการเก็บข้อมูลใน Supabase เพิ่มเติมได้ตามต้องการ",
    badgeColor: "#0EA5E9",
    description: "หมวดข้อมูลที่ผู้ดูแลระบบหรือทีมพัฒนาสร้างขึ้นเพิ่มเติมสำหรับเก็บข้อมูลชุดใหม่ๆ โดยไม่ต้องแก้โครงสร้างตารางหลัก",
  },
};

export interface BuiltinConfigKeyMeta {
  configKey: string;
  groupId: DataCategoryGroupId;
  title: string;
  description: string;
  dataShape: "array" | "object" | "counter";
  localStorageKey?: string;
  maxRecommendedKb: number;
  usedByModules: string[];
}

export const BUILTIN_SUPABASE_CONFIG_CATALOG: BuiltinConfigKeyMeta[] = [
  // OKR_AND_STRATEGY
  {
    configKey: "CONFIG_OKR_STATE_JSON",
    groupId: "OKR_AND_STRATEGY",
    title: "เป้าหมาย OKRs & R-Metrics รายบุคคล",
    description: "เก็บค่าเป้าหมาย KR1–KR4, TIP1–TIP10 และสัดส่วนความรับผิดชอบ R1–R10 ของสมาชิกแต่ละคน",
    dataShape: "object",
    localStorageKey: "cc_okr_settings_v4_fy70",
    maxRecommendedKb: 50,
    usedByModules: ["okrSettings.ts", "DashboardsView.tsx", "notify/route.ts"],
  },
  {
    configKey: "CONFIG_TEAM_ACTION_PLAN_JSON",
    groupId: "OKR_AND_STRATEGY",
    title: "แผนปฏิบัติการทีม (Team Action Plan)",
    description: "รายการแผนงาน โครงการเชิงรุก และความคืบหน้าของทีม CC",
    dataShape: "array",
    localStorageKey: "cc_team_action_plan_v2",
    maxRecommendedKb: 150,
    usedByModules: ["TeamActionPlanReportDetail.tsx"],
  },
  {
    configKey: "CONFIG_MEETING_TASKS_JSON",
    groupId: "OKR_AND_STRATEGY",
    title: "มติที่ประชุมและงานสั่งการ (Meeting Tasks)",
    description: "รายการงานติดตามจากที่ประชุมประจำสัปดาห์/ประจำเดือน",
    dataShape: "array",
    localStorageKey: "cc_meeting_tasks_v1",
    maxRecommendedKb: 150,
    usedByModules: ["MeetingTasksReportDetail.tsx"],
  },

  // SERVICE_AND_FINANCE
  {
    configKey: "CONFIG_SERVICE_PRICING_JSON",
    groupId: "SERVICE_AND_FINANCE",
    title: "ราคากลางมาตรฐาน (Service Pricing Catalog)",
    description: "รายการบริการและราคากลางสำหรับคำนวณมูลค่าประหยัดงบประมาณ (Save Cost) และใบเสนอราคา",
    dataShape: "array",
    localStorageKey: "cc_service_pricing_cache_v2",
    maxRecommendedKb: 100,
    usedByModules: ["servicePricing.ts", "SetupModal.tsx", "StepQuotationModal.tsx"],
  },
  {
    configKey: "CONFIG_TASK_SEQUENCES_JSON",
    groupId: "SERVICE_AND_FINANCE",
    title: "ลำดับรหัสงานอัตโนมัติ (Task Code Sequences)",
    description: "ตัวนับลำดับรหัสงานแยกตามหมวด (เช่น C70-x, PR70-x, RSP70-x, QT70-x) ป้องกันรหัสซ้ำ",
    dataShape: "counter",
    localStorageKey: "cc_task_code_sequences_v1",
    maxRecommendedKb: 10,
    usedByModules: ["taskCodeService.ts"],
  },

  // PORTAL_MODULES
  {
    configKey: "CONFIG_RSP_PRESS_RECORDS_JSON",
    groupId: "PORTAL_MODULES",
    title: "ฐานข้อมูลข่าวเครือข่ายอุทยานวิทย์ฯ (RSP Press Releases)",
    description: "บันทึกข้อมูลข่าวประชาสัมพันธ์และลิงก์ข่าวของเครือข่ายมหาลัยภาคเหนือ (RSP)",
    dataShape: "array",
    localStorageKey: "cc_rsp_press_records_v2_fy70",
    maxRecommendedKb: 250,
    usedByModules: ["RspPressReport.tsx", "rsp-press-form/page.tsx"],
  },
  {
    configKey: "CONFIG_IDC_RECORDS_JSON",
    groupId: "PORTAL_MODULES",
    title: "ฐานข้อมูลศูนย์ออกแบบนวัตกรรม (IDC Records)",
    description: "ข้อมูลการให้คำปรึกษาและรับโจทย์ผู้ประกอบการของ Innovation Design Center",
    dataShape: "array",
    localStorageKey: "cc_idc_records_v1",
    maxRecommendedKb: 200,
    usedByModules: ["InnovationDesignCenterReport.tsx", "idc-form/page.tsx"],
  },
  {
    configKey: "CONFIG_WORK_LINKS_JSON",
    groupId: "PORTAL_MODULES",
    title: "คลังลิงก์ผลงานและสื่อ (Work Links Repository)",
    description: "รวบรวมลิงก์ผลงานออกแบบ วิดีโอ ข่าว และไฟล์ส่งมอบของทีม",
    dataShape: "array",
    localStorageKey: "cc_work_links_v1",
    maxRecommendedKb: 200,
    usedByModules: ["workLinksService.ts", "WorkLinksReportDetail.tsx"],
  },
  {
    configKey: "CONFIG_KM_DATA_JSON",
    groupId: "PORTAL_MODULES",
    title: "ฐานข้อมูลการจัดการความรู้ (KM Articles)",
    description: "บทความ คู่มือการทำงาน และองค์ความรู้ภายในทีม CC",
    dataShape: "array",
    localStorageKey: "cc_km_data_v1",
    maxRecommendedKb: 200,
    usedByModules: ["KnowledgeManagementReport.tsx"],
  },
  {
    configKey: "CONFIG_KM_FILES_JSON",
    groupId: "PORTAL_MODULES",
    title: "รายการไฟล์แนบองค์ความรู้ (KM Files)",
    description: "ลิงก์เอกสารประกอบและเทมเพลตมาตรฐานในคลังความรู้",
    dataShape: "array",
    localStorageKey: "cc_km_files_v1",
    maxRecommendedKb: 150,
    usedByModules: ["KnowledgeManagementReport.tsx"],
  },
  {
    configKey: "CONFIG_STAKEHOLDER_LOGS_JSON",
    groupId: "PORTAL_MODULES",
    title: "ประวัติการส่งงานและผู้มีส่วนได้ส่วนเสีย (Stakeholder Logs)",
    description: "บันทึกการแจ้งเตือนส่งมอบงานและผลตอบรับจากผู้รับบริการ",
    dataShape: "array",
    localStorageKey: "cc_stakeholder_dispatch_v1",
    maxRecommendedKb: 150,
    usedByModules: ["StakeholdersReportDetail.tsx"],
  },
  {
    configKey: "CONFIG_TRAINING_RECORDS_JSON",
    groupId: "PORTAL_MODULES",
    title: "ประวัติการฝึกอบรมและพัฒนาทักษะ (Training Records)",
    description: "ข้อมูลการเข้าอบรม พัฒนาทักษะ (Upskill/Reskill) ของสมาชิกในทีม",
    dataShape: "array",
    localStorageKey: "cc_training_records_v1",
    maxRecommendedKb: 150,
    usedByModules: ["IndividualReportView.tsx"],
  },

  // LINE_AND_AI
  {
    configKey: "CONFIG_LINE_GROUPS_JSON",
    groupId: "LINE_AND_AI",
    title: "ตั้งค่ากลุ่ม LINE OA (LINE Target Groups)",
    description: "รหัส Group ID สำหรับกลุ่มแจ้งเตือนทีมปฏิบัติการ (NOTY) และกลุ่มผู้บริหาร (Executive)",
    dataShape: "object",
    maxRecommendedKb: 10,
    usedByModules: ["lineBotConfig.ts", "LineDispatchHub.tsx"],
  },
  {
    configKey: "CONFIG_LINE_CRON_TRACKER_JSON",
    groupId: "LINE_AND_AI",
    title: "ตัวติดตามการส่งรายงานอัตโนมัติ (LINE Cron Tracker)",
    description: "บันทึกวันที่และสถานะการส่ง Morning Brief, Weekly Report และ Monthly Summary",
    dataShape: "object",
    maxRecommendedKb: 25,
    usedByModules: ["api/cron/route.ts", "LineDispatchHub.tsx"],
  },
  {
    configKey: "CONFIG_LINE_CHAT_MEMORY",
    groupId: "LINE_AND_AI",
    title: "ความจำบริบทการสนทนา LINE AI (Bot Chat Memory)",
    description: "ประวัติการสนทนาล่าสุดในกลุ่ม LINE เพื่อให้บอทตอบคำถามต่อเนื่องได้แม่นยำ",
    dataShape: "object",
    maxRecommendedKb: 50,
    usedByModules: ["lineMemoryService.ts", "lineAiService.ts"],
  },
  {
    configKey: "CONFIG_LINE_BOT_MESSAGES",
    groupId: "LINE_AND_AI",
    title: "ประวัติข้อความแจ้งเตือนบอท (Bot Message Log)",
    description: "บันทึกข้อความที่บอทส่งออกล่าสุดเพื่อตรวจสอบสถานะและใช้อ้างอิง",
    dataShape: "array",
    maxRecommendedKb: 50,
    usedByModules: ["lineMemoryService.ts"],
  },

  // SYSTEM_AND_AUDIT
  {
    configKey: "CONFIG_AUDIT_LOGS_JSON",
    groupId: "SYSTEM_AND_AUDIT",
    title: "ประวัติการใช้งานและแก้ไขข้อมูล (System Audit Trail)",
    description: "บันทึกการสร้าง แก้ไข เปลี่ยนสถานะ และลบงาน (จำกัดสูงสุด 200 รายการล่าสุดพร้อมบีบอัดขนาดอัตโนมัติ)",
    dataShape: "array",
    localStorageKey: "cc_audit_logs_cache_v1",
    maxRecommendedKb: 150,
    usedByModules: ["auditLogger.ts", "ActivityLogReportDetail.tsx"],
  },
  {
    configKey: "CONFIG_LAST_BACKUP_SNAPSHOT",
    groupId: "SYSTEM_AND_AUDIT",
    title: "ข้อมูลการสำรองฐานข้อมูลล่าสุด (Last Backup Metadata)",
    description: "บันทึกวันเวลาและสถิติของการสำรองข้อมูลระบบครั้งล่าสุด",
    dataShape: "object",
    maxRecommendedKb: 10,
    usedByModules: ["backupService.ts", "SetupModal.tsx"],
  },
];

/**
 * โครงสร้างนิยามฟิลด์สำหรับหมวดการเก็บข้อมูลที่สร้างเพิ่มเอง (Custom Data Category Field)
 */
export type CustomFieldType = "text" | "number" | "date" | "url" | "select" | "boolean";

export interface CustomCategoryFieldDefinition {
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[]; // สำหรับ type === 'select'
  placeholder?: string;
}

/**
 * โครงสร้างหมวดข้อมูลที่ผู้ใช้สร้างเพิ่มใน Supabase (Custom Data Category Schema)
 * เก็บ Registry รวมไว้ที่ CONFIG_DATA_CATEGORIES_REGISTRY_JSON
 * และเก็บรายการข้อมูลจริงของแต่ละหมวดไว้ที่ CONFIG_CUSTOM_CAT_<SLUG>_JSON
 */
export interface CustomDataCategoryDefinition {
  id: string;
  slug: string; // เช่น "MEDIA_PARTNERS", "STUDIO_EQUIPMENT"
  configKey: string; // เช่น "CONFIG_CUSTOM_CAT_MEDIA_PARTNERS_JSON"
  title: string; // เช่น "ทะเบียนพาร์ทเนอร์สื่อมวลชน"
  description: string;
  groupId: DataCategoryGroupId;
  fields: CustomCategoryFieldDefinition[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CustomCategoryRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  values: Record<string, any>;
}

export const CUSTOM_CATEGORY_REGISTRY_KEY = "CONFIG_DATA_CATEGORIES_REGISTRY_JSON";
export const CUSTOM_CATEGORY_PREFIX = "CONFIG_CUSTOM_CAT_";

/**
 * แปลงรหัส Slug ให้เป็นรูปแบบมาตรฐานตัวพิมพ์ใหญ่ A-Z0-9_
 */
export function normalizeCategorySlug(rawSlug: string): string {
  return rawSlug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * สร้างชื่อคีย์ในตาราง okr_settings สำหรับหมวดข้อมูลที่สร้างใหม่
 */
export function buildCustomCategoryConfigKey(slug: string): string {
  const clean = normalizeCategorySlug(slug);
  return `${CUSTOM_CATEGORY_PREFIX}${clean}_JSON`;
}
