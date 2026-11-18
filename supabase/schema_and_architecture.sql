-- ============================================================================
-- CC SYSTEM 2027 (FY70) - SUPABASE SCHEMA, INDEXES & STORAGE ARCHITECTURE
-- ============================================================================
-- เอกสารโครงสร้างฐานข้อมูลมาตรฐานสำหรับระบบบริหารจัดการงานและตัวชี้วัด (CC Portal)
-- รองรับการนำไปติดตั้งใหม่ (White-label / Scale) หรือขยายหมวดหมู่ข้อมูลเพิ่มเติม
-- ============================================================================

-- 1. ตารางบุคลากรและสมาชิกทีม (assignees)
CREATE TABLE IF NOT EXISTS public.assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  unit TEXT NOT NULL DEFAULT 'creative', -- รูปแบบ: unit|role|urlEncodedProfileJson
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ตารางงานและบรีฟทั้งหมด (briefs)
CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  coordinator_nickname TEXT,
  decision_maker TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  unit TEXT NOT NULL DEFAULT 'creative',
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | completed | cancelled | purged
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  assignee_id UUID REFERENCES public.assignees(id) ON DELETE SET NULL,
  okr_links TEXT[] DEFAULT '{}'::text[],
  project_id TEXT,
  priority TEXT DEFAULT 'normal',
  deadline TIMESTAMPTZ,
  in_progress_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes สำหรับเพิ่มความเร็วในการดึงข้อมูล Dashboard และรายงาน LINE
CREATE INDEX IF NOT EXISTS idx_briefs_status_created ON public.briefs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_unit ON public.briefs (unit);
CREATE INDEX IF NOT EXISTS idx_briefs_assignee_id ON public.briefs (assignee_id);
CREATE INDEX IF NOT EXISTS idx_briefs_deadline ON public.briefs (deadline);

-- 3. ตารางตัวชี้วัด OKRs และคลังข้อมูลหมวดหมู่ระบบ (okr_settings)
-- ใช้เก็บทั้งตัวชี้วัดหลัก (KR1-KR4, TIP1-TIP10) และชุดข้อมูลโมดูลย่อย/หมวดข้อมูลที่สร้างเพิ่ม (CONFIG_*)
CREATE TABLE IF NOT EXISTS public.okr_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'KR' CHECK (type IN ('KR', 'TIP')),
  description TEXT NOT NULL,
  target_value TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_okr_settings_description ON public.okr_settings (description);

-- ============================================================================
-- สารบบหมวดหมู่ข้อมูลในตาราง okr_settings (Categorized Document Store)
-- ============================================================================
-- หมวดที่ 1: เป้าหมาย OKRs & แผนกลยุทธ์ (OKR_AND_STRATEGY)
--   - KR1..KR4, TIP1..TIP10         : ตัวชี้วัดหลักระดับองค์กร
--   - CONFIG_OKR_STATE_JSON         : เป้าหมาย OKRs & R1-R10 รายบุคคล
--   - CONFIG_TEAM_ACTION_PLAN_JSON  : แผนปฏิบัติการเชิงรุกของทีม
--   - CONFIG_MEETING_TASKS_JSON     : มติที่ประชุมและงานสั่งการ
--
-- หมวดที่ 2: บริการ การเงิน และรหัสงาน (SERVICE_AND_FINANCE)
--   - CONFIG_SERVICE_PRICING_JSON   : ราคากลาง Save Cost & ใบเสนอราคา
--   - CONFIG_TASK_SEQUENCES_JSON    : ตัวนับลำดับรหัสงานอัตโนมัติ (Running Sequences)
--
-- หมวดที่ 3: โมดูลเฉพาะทางของพอร์ทัล (PORTAL_MODULES)
--   - CONFIG_RSP_PRESS_RECORDS_JSON : ฐานข้อมูลข่าวเครือข่ายอุทยานวิทย์ฯ (RSP)
--   - CONFIG_IDC_RECORDS_JSON       : ฐานข้อมูลศูนย์ออกแบบนวัตกรรม (IDC)
--   - CONFIG_WORK_LINKS_JSON        : คลังลิงก์ผลงานและสื่อประชาสัมพันธ์
--   - CONFIG_KM_DATA_JSON           : บทความการจัดการความรู้ (KM)
--   - CONFIG_KM_FILES_JSON          : ไฟล์ประกอบในคลังความรู้ (KM Files)
--   - CONFIG_STAKEHOLDER_LOGS_JSON  : ประวัติการส่งงานและประเมินความพึงพอใจ
--   - CONFIG_TRAINING_RECORDS_JSON  : ประวัติการฝึกอบรมและพัฒนาทักษะ
--
-- หมวดที่ 4: ระบบอัตโนมัติ LINE OA & AI Bot (LINE_AND_AI)
--   - CONFIG_LINE_GROUPS_JSON       : รหัสกลุ่ม LINE OA เป้าหมาย
--   - CONFIG_LINE_CRON_TRACKER_JSON : ตัวติดตามการส่งรายงานอัตโนมัติ (Morning/Weekly/Monthly)
--   - CONFIG_LINE_CHAT_MEMORY       : ความจำบริบทการสนทนาของน้อง CC
--   - CONFIG_LINE_BOT_MESSAGES      : ประวัติข้อความแจ้งเตือนของบอท
--
-- หมวดที่ 5: ความปลอดภัยและประวัติระบบ (SYSTEM_AND_AUDIT)
--   - CONFIG_AUDIT_LOGS_JSON        : ประวัติการใช้งานระบบ (จำกัด 200 รายการล่าสุด)
--   - CONFIG_LAST_BACKUP_SNAPSHOT   : ข้อมูลการสำรองฐานข้อมูลล่าสุด
--
-- หมวดที่ 6: หมวดข้อมูลเพิ่มเติมที่ผู้ใช้สร้างเอง (CUSTOM_CATEGORIES)
--   - CONFIG_DATA_CATEGORIES_REGISTRY_JSON : สารบบหมวดข้อมูลที่สร้างเพิ่มทั้งหมด
--   - CONFIG_CUSTOM_CAT_<SLUG>_JSON        : ข้อมูลจริงของแต่ละหมวดที่สร้างเพิ่ม
-- ============================================================================
