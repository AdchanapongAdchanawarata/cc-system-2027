-- Migration: Add role to assignees and create service_pricing table with STeP Fastwork Rates

-- 1. Add role column to assignees table
ALTER TABLE assignees 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'assignee';

-- 2. Create service_pricing table for back-office price configuration
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit TEXT NOT NULL,
  service_name TEXT NOT NULL,
  standard_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert standard STeP Fastwork minimum average pricing reference
INSERT INTO service_pricing (unit, service_name, standard_price, description)
VALUES 
  -- Creative Designer
  ('creative', 'Logo Design', 2500, 'ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก'),
  ('creative', 'Key Visual (KV)', 3500, 'ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ'),
  ('creative', 'Print Poster / Flyer', 750, 'ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า'),
  ('creative', 'Brochure / Leaflet', 1200, 'ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ'),
  ('creative', 'Backdrop (ฉากหลัง)', 2500, 'ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์'),
  ('creative', 'Book Layout (≤10 หน้า)', 2500, 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า'),
  ('creative', 'Book Layout (≥10 หน้า)', 5500, 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า'),
  ('creative', 'Packaging (ครบวงจร)', 10000, 'ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน'),
  ('creative', 'Website Full Design', 15000, 'ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)'),
  ('creative', 'Exhibition Design (Small)', 4500, 'ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)'),
  ('creative', '3D Render Visualization', 2500, 'ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)'),
  ('creative', 'Signage Design (Small/Big)', 1000, 'ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)'),
  ('creative', 'ถ่ายภาพผลิตภัณฑ์ (Product Photography)', 3500, 'ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา'),
  ('creative', 'ถ่ายภาพบุคคล (Portrait Photography)', 3000, 'ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง'),

  -- PR (Public Relations & Event Coverage)
  ('pr', 'Media Management', 15000, 'เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ'),
  ('pr', 'Stage Management', 3500, 'จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ'),
  ('pr', 'MOU / Event Coverage', 2500, 'ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล'),
  ('pr', 'Press Release', 1500, 'เขียนข่าวประชาสัมพันธ์ภาษาไทย (ส่งสื่อ)'),
  ('pr', 'ข่าวประชาสัมพันธ์บริการ (RSP)', 1500, 'ข่าวเครือข่าย RSP ภาคเหนือ'),
  ('pr', 'ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)', 1500, 'การโปรโมทก่อนเริ่มงานหรือโครงการ'),
  ('pr', 'ข่าวการจัดกิจกรรม/โครงการ', 1500, 'ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ'),
  ('pr', 'ข่าวการจัดประชุม/อบรม/สัมมนา', 1500, 'ข่าวงานประชุม การอบรม หรือสัมมนา'),
  ('pr', 'ข่าวเกี่ยวกับผู้บริหาร', 1500, 'ข่าวภารกิจหรือการแถลงของผู้บริหาร'),
  ('pr', 'ข่าวการรับรางวัล', 1500, 'ข่าวความสำเร็จหรือการรับรางวัลต่างๆ'),
  ('pr', 'ข่าวศึกษาดูงาน', 1500, 'ข่าวการต้อนรับคณะศึกษาดูงาน'),

  -- Content Creator
  ('content', 'Creative Content Idea', 5000, 'คิดธีม/ไอเดีย/ Event & Campaign'),
  ('content', 'บทความสั้น + ภาพประกอบ', 800, 'ความยาว 300 - 500 คำ (โพสต์โซเชียล)'),
  ('content', 'บทความยาว + ภาพประกอบ', 2500, 'ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)'),
  ('content', 'ตัดต่อคลิปสั้น (Short-form)', 1500, 'ความยาว 15 - 60 วินาที (TikTok/Reels)'),
  ('content', 'ถ่ายทำวิดีโอสั้น โปรโมตการบริการ', 2500, 'ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ'),
  ('content', 'ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์', 3500, 'ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล'),
  ('content', 'ถ่ายทำวิดีโอสั้น Talk Spective', 3500, 'ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ'),
  ('content', 'Copywriting / Storytelling', 1500, 'การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ'),
  ('content', 'Boost Post เพื่อประชาสัมพันธ์', 1000, 'การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย')
ON CONFLICT DO NOTHING;
