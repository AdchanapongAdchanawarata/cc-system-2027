<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# กฎเหล็กประจำระบบ CC TEAM (Ironclad Data Integrity Rules)

> [!IMPORTANT]
> กฎเหล็กนี้บังคับใช้อย่างเข้มงวดเด็ดขาดสำหรับการคำนวณและจัดทำรายงานทุกประเภท ทั้งบนหน้า Dashboard และรายงานสรุปส่งไลน์ (`weekly_executive_report`, `monthly_performance_summary`, `morning_brief`) ห้ามคำนวณแบบสุ่มสี่สุ่มห้าหรือสร้างข้อมูลจำลองขึ้นมาเองเด็ดขาด

1. **การกรองข้อมูลที่ถูกต้อง (Single Source of Valid Briefs):**
   - ต้องคัดกรองงานที่ถูกลบ (`details.is_deleted`, `details.is_permanently_deleted`, `status === 'purged'`) ออกเสมอ
   - ต้องคัดกรองงานทดสอบระบบ (`is_test`, benchmark, stress-test) ออกจากการคิดสถิติทุกประเภท

2. **การคำนวณมูลค่า Save Cost (Portfolio vs. Delivered):**
   - ต้องใช้ฟังก์ชันกลาง `getTaskFinancialDistribution(brief)` จาก `@/utils/stats` เสมอ
   - แยกรายงานชัดเจนระหว่าง:
     - **Portfolio Save Cost (รวมในระบบ):** คิดจากงาน Active ทุกสถานะ รวมสัดส่วนเจ้าของงานและงานช่วย
     - **Delivered Save Cost (ส่งมอบสำเร็จ):** คิดจากงานที่สถานะ `completed` เท่านั้น

3. **โครงการสร้างรายได้และกำไร CC (PM Projects & KR4 Profit):**
   - โครงการบริหารจัดการ CC ต้องใช้ `isCcPmProject(brief)` จาก `@/utils/stats`
   - ต้องรายงานความโปร่งใส: รายรับรวม, ต้นทุนรวม และกำไรโครงการรวม
   - สำหรับตัวชี้วัด KR4: กำไรที่รับรู้จริง (Realized) คิดเฉพาะงานที่ส่งมอบและเก็บเงินแล้ว ส่วนงานที่อยู่ระหว่างดำเนินการให้แสดงเป็นยอด **Pipeline อยู่ระหว่างดำเนินงาน** ห้ามทึกทักว่าเป็น 0 หรือไม่กล่าวถึง

4. **ผลประเมินความพึงพอใจ (Satisfaction Survey & Evaluation Count):**
   - **ห้ามแสดงตัวเลข % ลอยๆ โดยไม่ระบุจำนวนงานที่ส่งแบบประเมินกลับมาจริงเด็ดขาด!**
   - รูปแบบที่ถูกต้อง: `100% (ประเมินแล้ว 2 งาน • เป้าหมาย ≥ 85% • บรรลุตามเกณฑ์)`
   - หากมีคะแนนและความคิดเห็น ให้ดึงจาก `details.satisfaction_scores` มาแสดงเป็นไฮไลต์พร้อมผู้ประเมิน

5. **การนับงานและการจัดหมวดหมู่สถานะงาน (Task Classification):**
   - จำแนกสถานะงานเป็น: รอมอบหมาย (Unassigned), รอเริ่มทำ (To-Do List), กำลังดำเนินการ (In Progress), ส่งมอบสำเร็จ (Completed), งานเกินกำหนด (Overdue), งานยกเลิก (Cancelled)
   - ตัวเลขผลรวมต้องตรงกัน 100% ระหว่างสรุปด้านบนและรายละเอียดด้านล่าง

6. **ตัวชี้วัด OKRs & R Metrics:**
   - ใช้ `computeRealtimeMetrics` และ `isR3Task` จาก `@/utils/okrSettings`
   - **งานของ NMCO คืองานของ RSP เสมอ:** งานใดที่สั่งโดยทีม NMCO หรือระบุหน่วยงานเป็น NMCO/RSP ต้องนับเข้าตัวชี้วัด **KR2** (ผลงานภายนอก มช. & RSP) และ **R3 / R4** เสมอ ห้ามนับตกหล่นหรือคิดเป็น R1 ภายในองค์กรเด็ดขาด
   - ดึงเป้าหมายจาก `CONFIG_OKR_STATE_JSON` ในตาราง `okr_settings` แบบไดนามิก

7. **กฎเหล็กการคิดโควต้า LINE OA และการเกลี่ย Morning Brief (LINE Quota & Member Integrity):**
   - **การคิดโควต้าตามจำนวนสมาชิก (Recipient-Based Quota):** LINE Messaging API คิดโควต้า Push เข้ากลุ่มตาม **"จำนวนสมาชิกจริงในกลุ่ม"** เสมอ
     - กลุ่ม `Creative step (NOTY)` มี 12 คน = ใช้ **12 ข้อความ/ครั้ง**
     - กลุ่ม `CC TEAM (Executive)` มี 17 คน = ใช้ **17 ข้อความ/ครั้ง**
     - **ห้ามคำนวณแบบ 1 ข้อความต่อ 1 บอลลูนเด็ดขาด!**
   - **การเกลี่ย Morning Brief ให้สมดุลตลอดเดือน (Quota Balancing & Distribution):**
     - ต้องกันโควต้าบังคับสำหรับรายงานผู้บริหารและสิ้นเดือนไว้ก่อนเสมอ (Weekly Report + Monthly Report + Quota Guard 20 ข้อความ)
     - โควต้าคงเหลือสำหรับ Morning Brief ต้องถูกเฉลี่ย (Distributed) กระจายให้ครอบคลุมทุกสัปดาห์ที่เหลืออย่างสมดุล (เช่น สัปดาห์ละ 2 วัน: วันจันทร์ & วันพุธ)
     - **ห้ามยิงติดต่อกันจนโควต้าหมดเกลี้ยงตั้งแต่ต้นสัปดาห์แล้วปล่อยให้สัปดาห์ท้ายๆ ว่างเปล่าเด็ดขาด!** หากโควต้ามีจำกัด ระบบต้องสลับยิงแบบเฉลี่ยวัน (Balanced Days) โดยอัตโนมัติ


