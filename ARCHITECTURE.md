# สถาปัตยกรรมระบบและการจัดระเบียบฐานข้อมูล (Modular Architecture & Scaling Guide)

เอกสารนี้อธิบายโครงสร้างโค้ดหลังบ้านและระบบฐานข้อมูล Supabase ที่ถูกจัดระเบียบใหม่แบบแยกส่วนความรับผิดชอบชัดเจน (Modular & Decoupled Architecture) เพื่อให้การแก้ไขโค้ดแต่ละส่วนไม่กระทบกัน และรองรับการขยายสเกลหรือนำไปพัฒนาต่อสำหรับทีม/หน่วยงานอื่นได้อย่างรวดเร็ว

---

## 1. โครงสร้างชั้นโค้ดหลัก (Layered Codebase Structure)

```text
src/
├── config/
│   ├── organizationConfig.ts      # ศูนย์กลางตั้งค่าองค์กร ยูนิต สมาชิก สรรพนาม และโควต้า LINE (Single Source of Truth)
│   └── dataCategories.ts          # สารบบหมวดหมู่ข้อมูลหลังบ้านใน Supabase และโครงสร้าง Custom Data Categories
├── services/
│   ├── supabaseDataStore.ts       # ชั้นจัดการข้อมูล Supabase แยกตามหมวดหมู่ + ระบบเพิ่มหมวดข้อมูลใหม่ (CRUD)
│   └── lineMessagingService.ts    # บริการส่งข้อความ LINE Push (Auto-Chunking 4,000 ตัวอักษร) และจัดรูปแบบรายงาน
├── utils/
│   ├── stats.ts                   # กฎการคำนวณการเงิน Save Cost, โครงการ PM และสถิติภาระงาน
│   ├── okrSettings.ts             # กฎการคำนวณตัวชี้วัด OKRs (KR1-KR4, TIP1-TIP10, R1-R10)
│   ├── lineAiService.ts           # สมองกล AI Bot (น้อง CC) วิเคราะห์ข้อมูลเรียลไทม์จาก Supabase
│   ├── auditLogger.ts             # ระบบบันทึกประวัติการใช้งานพร้อมบีบอัดขนาดอัตโนมัติ (จำกัด 200 รายการล่าสุด)
│   └── cloudSyncService.ts        # ตัวเชื่อมข้อมูล JSON ระหว่าง Supabase และ LocalStorage Cache
└── app/
    ├── api/
    │   ├── notify/route.ts        # API แจ้งเตือนงานใหม่ และสร้างรายงานประจำวัน/สัปดาห์/สิ้นเดือน
    │   ├── cron/route.ts          # ตัวกระจายงานตามตารางเวลา (Morning Brief, Weekly, Monthly)
    │   └── line-webhook/route.ts  # Webhook รับข้อความสนทนาจากกลุ่ม LINE OA
    └── dashboard/components/
        └── SupabaseCategoryManager.tsx # หน้าจอสำรวจและเพิ่มหมวดการเก็บข้อมูลใหม่ใน Supabase
```

---

## 2. การจัดระเบียบหมวดหมู่ข้อมูลใน Supabase (`okr_settings` & Core Tables)

ฐานข้อมูล Supabase แบ่งออกเป็น **7 หมวดหมู่มาตรฐาน**:

1. **`CORE_TABLES` (ตารางหลัก PostgreSQL):**
   - `briefs`: ข้อมูลงานและบรีฟทั้งหมด (ทุกจุดในระบบกรอง `.neq('status', 'purged')` เพื่อไม่ให้ดึงข้อมูลที่ถูกล้างถาวรแล้วมาปะปน)
   - `assignees`: ข้อมูลบุคลากร โครงสร้างยูนิต และโปรไฟล์
   - `okr_settings`: ตัวชี้วัดหลัก 8 รายการ (`KR1`–`KR4`, `TIP1`, `TIP2`, `TIP9`, `TIP10`) และคลังข้อมูลหมวดหมู่ระบบ (`CONFIG_*`)
2. **`OKR_AND_STRATEGY` (หมวดเป้าหมายและแผนกลยุทธ์):**
   - `CONFIG_OKR_STATE_JSON`, `CONFIG_TEAM_ACTION_PLAN_JSON`, `CONFIG_MEETING_TASKS_JSON`
3. **`SERVICE_AND_FINANCE` (หมวดบริการ การเงิน และรหัสงาน):**
   - `CONFIG_SERVICE_PRICING_JSON`, `CONFIG_TASK_SEQUENCES_JSON`
4. **`PORTAL_MODULES` (หมวดฐานข้อมูลโมดูลเฉพาะทาง):**
   - `CONFIG_RSP_PRESS_RECORDS_JSON`, `CONFIG_IDC_RECORDS_JSON`, `CONFIG_WORK_LINKS_JSON`, `CONFIG_KM_DATA_JSON`, `CONFIG_KM_FILES_JSON`, `CONFIG_STAKEHOLDER_LOGS_JSON`, `CONFIG_TRAINING_RECORDS_JSON`
5. **`LINE_AND_AI` (หมวดระบบอัตโนมัติ LINE OA & AI Bot):**
   - `CONFIG_LINE_GROUPS_JSON`, `CONFIG_LINE_CRON_TRACKER_JSON`, `CONFIG_LINE_CHAT_MEMORY`, `CONFIG_LINE_BOT_MESSAGES`
6. **`SYSTEM_AND_AUDIT` (หมวดความปลอดภัยและสำรองข้อมูล):**
   - `CONFIG_AUDIT_LOGS_JSON` (มีระบบ `sanitizeAuditDetails` ป้องกันไฟล์ขนาดใหญ่ปะปน), `CONFIG_LAST_BACKUP_SNAPSHOT`
7. **`CUSTOM_CATEGORIES` (หมวดข้อมูลเพิ่มเติมที่สร้างเองได้):**
   - เก็บสารบบหมวดที่สร้างใหม่ไว้ใน `CONFIG_DATA_CATEGORIES_REGISTRY_JSON`
   - เก็บรายการข้อมูลของแต่ละหมวดไว้ใน `CONFIG_CUSTOM_CAT_<SLUG>_JSON`

---

## 3. วิธีเพิ่มหมวดการเก็บข้อมูลใหม่ใน Supabase (Extending Data Categories)

### วิธีที่ 1: เพิ่มผ่านหน้าจอระบบ (No-Code / Admin UI)
1. ไปที่หน้า **Dashboard** -> กดปุ่ม **ตั้งค่าระบบ (System Setup)** -> แท็บ **พื้นที่จัดเก็บ & โควตาฟรี (Storage)**
2. ในส่วน **"สารบบหมวดหมู่ข้อมูลหลังบ้าน (Supabase Data Categories & Schema)"** กดปุ่ม **`+ เพิ่มหมวดข้อมูลใน Supabase`**
3. กำหนดชื่อหมวดข้อมูล, รหัสภาษาอังกฤษ (`Slug`), และกำหนดโครงสร้างฟิลด์ (`Text`, `Number`, `Date`, `URL`)
4. สามารถกด **"จัดการข้อมูล"** เพื่อเพิ่ม/ลบรายการข้อมูลในหมวดนั้นลง Supabase ได้ทันที

### วิธีที่ 2: เรียกใช้งานในโค้ดสำหรับนักพัฒนา (Developer API)
```ts
import {
  createCustomCategory,
  getCustomCategoryRecords,
  addCustomCategoryRecord,
} from "@/services/supabaseDataStore";

// 1. ดึงข้อมูลทั้งหมดจากหมวดที่สร้างไว้
const records = await getCustomCategoryRecords("MEDIA_PARTNERS");

// 2. เพิ่มรายการข้อมูลใหม่ลงในหมวดนั้นบน Supabase
await addCustomCategoryRecord("MEDIA_PARTNERS", {
  title: "สำนักข่าวเชียงใหม่นิวส์",
  category: "สื่อออนไลน์ภาคเหนือ",
  url: "https://www.chiangmainews.co.th",
  notes: "พาร์ทเนอร์ประชาสัมพันธ์หลัก",
});
```

---

## 4. แนวทางการนำระบบไปขยายผลหรือปรับใช้กับทีมอื่น (Scaling & White-Labeling)

หากต้องการนำระบบนี้ไปพัฒนาต่อสำหรับทีมอื่นหรือหน่วยงานอื่น:
1. แก้ไขข้อมูลชื่อหน่วยงาน รายชื่อยูนิต รายชื่อสมาชิก และโควต้ากลุ่ม LINE ที่ไฟล์ [`src/config/organizationConfig.ts`](file:///c:/Users/aaadc/OneDrive/Desktop/cc_system_2027/src/config/organizationConfig.ts) เพียงจุดเดียว
2. รันสคริปต์สร้างตารางเริ่มต้นจากไฟล์ [`supabase/schema_and_architecture.sql`](file:///c:/Users/aaadc/OneDrive/Desktop/cc_system_2027/supabase/schema_and_architecture.sql) บนโปรเจกต์ Supabase ใหม่
3. ตั้งค่าตัวแปรสภาพแวดล้อม (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `GEMINI_API_KEY`, และ `CRON_SECRET`
