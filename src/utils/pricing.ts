// Standard STeP Fastwork Service Pricing reference & lookup utility

export type ServicePriceItem = {
  unit: string;
  service_name: string;
  standard_price: number;
  description?: string;
};

export const DEFAULT_STEP_PRICING: ServicePriceItem[] = [
  // --- Creative Designer ---
  { unit: 'creative', service_name: 'Logo Design', standard_price: 2500, description: 'ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก' },
  { unit: 'creative', service_name: 'Key Visual (KV)', standard_price: 3500, description: 'ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ' },
  { unit: 'creative', service_name: 'Print Poster / Flyer', standard_price: 750, description: 'ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า' },
  { unit: 'creative', service_name: 'Brochure / Leaflet', standard_price: 1200, description: 'ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ' },
  { unit: 'creative', service_name: 'Backdrop (ฉากหลัง)', standard_price: 2500, description: 'ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์' },
  { unit: 'creative', service_name: 'Book Layout (≤10 หน้า)', standard_price: 2500, description: 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า' },
  { unit: 'creative', service_name: 'Book Layout (≥10 หน้า)', standard_price: 5500, description: 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า' },
  { unit: 'creative', service_name: 'Packaging (ครบวงจร)', standard_price: 10000, description: 'ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน' },
  { unit: 'creative', service_name: 'Website Full Design', standard_price: 15000, description: 'ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)' },
  { unit: 'creative', service_name: 'Exhibition Design (Small)', standard_price: 4500, description: 'ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)' },
  { unit: 'creative', service_name: '3D Render Visualization', standard_price: 2500, description: 'ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)' },
  { unit: 'creative', service_name: 'Signage Design (Small/Big)', standard_price: 1000, description: 'ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)' },
  { unit: 'creative', service_name: 'ถ่ายภาพผลิตภัณฑ์ (Product Photography)', standard_price: 3500, description: 'ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา' },
  { unit: 'creative', service_name: 'ถ่ายภาพบุคคล (Portrait Photography)', standard_price: 3000, description: 'ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง' },
  { unit: 'creative', service_name: 'Product Design', standard_price: 20000, description: 'ออกแบบผลิตภัณฑ์เชิงสร้างสรรค์' },
  { unit: 'creative', service_name: 'อื่นๆ (Others)', standard_price: 1500, description: 'งานออกแบบหรือบริการอื่นๆ นอกเหนือจากที่ระบุไว้' },

  // --- PR (Public Relations & Event Coverage) ---
  { unit: 'pr', service_name: 'ข่าวประชาสัมพันธ์บริการ (RSP)', standard_price: 1500, description: 'ข่าวเครือข่าย RSP ภาคเหนือ' },
  { unit: 'pr', service_name: 'ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)', standard_price: 1500, description: 'การโปรโมทก่อนเริ่มงานหรือโครงการ' },
  { unit: 'pr', service_name: 'ข่าวการจัดกิจกรรม/โครงการ', standard_price: 1500, description: 'ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ' },
  { unit: 'pr', service_name: 'ข่าวการจัดประชุม/อบรม/สัมมนา', standard_price: 1500, description: 'ข่าวงานประชุม การอบรม หรือสัมมนา' },
  { unit: 'pr', service_name: 'ข่าวเกี่ยวกับผู้บริหาร', standard_price: 1500, description: 'ข่าวภารกิจหรือการแถลงของผู้บริหาร' },
  { unit: 'pr', service_name: 'ข่าวการรับรางวัล', standard_price: 1500, description: 'ข่าวความสำเร็จหรือการรับรางวัลต่างๆ' },
  { unit: 'pr', service_name: 'ข่าวศึกษาดูงาน', standard_price: 1500, description: 'ข่าวการต้อนรับคณะศึกษาดูงาน' },
  { unit: 'pr', service_name: 'Press Release (ข่าวแจกสื่อมวลชน)', standard_price: 1500, description: 'เขียนข่าวประชาสัมพันธ์ภาษาไทยเพื่อส่งสื่อ' },
  { unit: 'pr', service_name: 'Media Management (ดูแลสื่อมวลชน)', standard_price: 15000, description: 'เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ' },
  { unit: 'pr', service_name: 'Stage Management (จัดการเวที)', standard_price: 3500, description: 'จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ' },
  { unit: 'pr', service_name: 'MOU / Event Coverage', standard_price: 2500, description: 'ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล' },
  { unit: 'pr', service_name: 'สนับสนุนการจัดกิจกรรม (Support Event)', standard_price: 2500, description: 'งานสนับสนุนและบริการสื่อสารอื่นๆ' },
  { unit: 'pr', service_name: 'อื่นๆ (โปรดระบุ)', standard_price: 1500, description: 'งานประชาสัมพันธ์อื่นๆ นอกเหนือจากที่ระบุ' },

  // --- Content Creator ---
  { unit: 'content', service_name: 'Creative Content Idea', standard_price: 5000, description: 'คิดธีม/ไอเดีย/ Event & Campaign' },
  { unit: 'content', service_name: 'บทความสั้น + ภาพประกอบ', standard_price: 800, description: 'ความยาว 300 - 500 คำ (โพสต์โซเชียล)' },
  { unit: 'content', service_name: 'บทความยาว + ภาพประกอบ', standard_price: 2500, description: 'ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)' },
  { unit: 'content', service_name: 'ตัดต่อคลิปสั้น (Short-form)', standard_price: 1500, description: 'ความยาว 15 - 60 วินาที (TikTok/Reels)' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น โปรโมตการบริการ', standard_price: 2500, description: 'ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์', standard_price: 3500, description: 'ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น Talk Spective', standard_price: 3500, description: 'ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ' },
  { unit: 'content', service_name: 'Copywriting / Storytelling', standard_price: 1500, description: 'การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ' },
  { unit: 'content', service_name: 'Boost Post เพื่อประชาสัมพันธ์', standard_price: 1000, description: 'การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย' },
  { unit: 'content', service_name: 'อื่นๆ (โปรดระบุ)', standard_price: 1000, description: 'งานบริการคอนเทนต์อื่นๆ นอกเหนือจากที่ระบุไว้' },

  // --- Internal ---
  { unit: 'internal', service_name: 'งานเอกสาร/การเงินโครงการ', standard_price: 1500, description: 'ทำงานเอกสาร/การเงินโครงการที่เกี่ยวข้องกับการจัดซื้อจัดจ้าง' },
  { unit: 'internal', service_name: 'งานขึ้นรูป Proposal / TOR', standard_price: 5000, description: 'ทำงานเอกสาร กราฟิก ภาพประกอบ ทีเดียอื่นๆ เพื่อประกอบการ...' },
  { unit: 'internal', service_name: 'งาน Admin / STeP + RSP', standard_price: 1000, description: 'งาน Admin จัดการข้อมูลหลังบ้าน Social Media ของ STeP แ...' },
  { unit: 'internal', service_name: 'งาน Admin / Talk Spective', standard_price: 1000, description: 'งาน Admin หลังบ้าน Social Media ของ Talk Spective' },
  { unit: 'internal', service_name: 'เตรียมงาน VDO / STeP + RSP', standard_price: 1000, description: 'เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / STeP + RSP' },
  { unit: 'internal', service_name: 'เตรียมงาน VDO / Talk Spective', standard_price: 1000, description: 'เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / Talk Spective' },
  { unit: 'internal', service_name: 'บทความ / ภาพประกอบ ของ STeP + RSP', standard_price: 1500, description: 'บทความ / ภาพประกอบ คอนเทนต์ PR ของ STeP + RSP' },
  { unit: 'internal', service_name: 'บทความ / ภาพประกอบ ของ Talk Spective', standard_price: 1500, description: 'บทความ / ภาพประกอบ คอนเทนต์ PR ของ Talk Spective' },
  { unit: 'internal', service_name: 'งานให้คำปรึกษาเชิงสร้างสรรค์', standard_price: 1500, description: 'งานให้คำปรึกษาที่เกี่ยวข้องกับงานสร้างสรรค์ ออกแบบ คอนเทน...' },
  { unit: 'internal', service_name: 'งานจัดทำ / แก้ไข Presentation', standard_price: 5000, description: 'งานจัดทำ / แก้ไข สไลด์ Presentation' },
  { unit: 'internal', service_name: 'งานวิทยากร', standard_price: 5000, description: 'เป็นวิทยากรให้กับหน่วยงาน โครงการ กิจกรรมต่างๆ' },
  { unit: 'internal', service_name: 'ดูแล / ประสานงานนักข่าว', standard_price: 3000, description: 'ดูแลประสานงานนักข่าว เพื่อมาทำข่าวให้กับโครงการ กิจกรรม' },
  { unit: 'internal', service_name: 'ประสานงานโครงการ', standard_price: 1500, description: 'ช่วยประสานงานโครงการของคนภายในทีมและองค์กร นอกเหนือ...' },
  { unit: 'internal', service_name: 'เขียนข่าว ( นอกเหนือจาก Task งาน )', standard_price: 1500, description: 'เขียนข่าว ที่ได้รับมอบหมายนอกเหนือจาก Task งานที่มีอยู่เดิม' },
  { unit: 'internal', service_name: 'เขียน Press Release ( นอกเหนือจาก Task งาน )', standard_price: 1500, description: 'เขียน Press Release ที่ได้รับมอบหมายนอกเหนือจาก Task งา...' },
  { unit: 'internal', service_name: 'ทำงานลงพื้นที่ / นอกสถานที่ ( นอกเหนือจาก Task งาน )', standard_price: 5000, description: 'ทำงานลงพื้นที่ ที่นอกเหนือจาก Task งาน เช่น ถ่ายภาพนอกสถา...' },
  { unit: 'internal', service_name: 'ดูแล / ประสานงาน KOL INFLU', standard_price: 1500, description: 'ดูแลประสานงาน KOL INFLU เพื่อมาทำข่าวให้กับโครงการ กิจก...' },
  { unit: 'internal', service_name: 'ช่วยงาน Event', standard_price: 3000, description: 'ช่วยงาน Event ในพื้นที่ / นอกพื้นที่ ของทีมและองค์กร' },
  { unit: 'internal', service_name: 'เตรียมงานที่ Whoop Studio', standard_price: 1500, description: 'เตรียมงาน ถ่ายภาพ คอนเทนต์ PR ที่ Whoop Studio' },
  { unit: 'internal', service_name: 'ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ( นอกเหนือจาก Task งาน )', standard_price: 1500, description: 'ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ที่อยู่นอกเหนือจาก Task งาน' },
  { unit: 'internal', service_name: 'ติดตามผู้บริหาร ตามภารกิจขององค์กร ( นอกเหนือจาก Task งาน )', standard_price: 1500, description: 'งานติดตามผู้บริหาร ตามภารกิจขององค์กร เช่น PR คอนเทนต์ ...' },
  { unit: 'internal', service_name: 'ตัดต่องาน VDO / Talk Spective', standard_price: 3000, description: 'ตัดต่องาน ทำคอนเทนต์ VDO / Talk Spective' },
  { unit: 'internal', service_name: 'ตัดต่องาน VDO / STeP + RSP', standard_price: 3000, description: 'ตัดต่องาน ทำคอนเทนต์ VDO / STeP + RSP' },
  { unit: 'internal', service_name: 'ได้รับมอบหมายให้ทำงานในวันหยุด เสาร์ - อาทิตย์ ชดเชย', standard_price: 3000, description: 'ได้รับมอบหมายจากผู้บังคับบัญชาให้ทำงานในวันหยุด เสาร์ - อาทิตย์ ชดเชย' },
  { unit: 'internal', service_name: 'ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ', standard_price: 1000, description: 'ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ ทั้งงาน ออกแบบ คอนเทนต์ PR' },
  { unit: 'internal', service_name: 'PM โครงการของ CC', standard_price: 50000, description: 'PM โครงการของ CC (รายรับ ต้นทุน กำไร พร้อมระบุ DESIGN / CONTENT / PR)' }
];

export function getActivePricingList(): ServicePriceItem[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cc_service_pricing');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return DEFAULT_STEP_PRICING;
}

export function getStandardPriceForTask(unit: string | undefined, category: string | undefined, projectName?: string): number | null {
  const list = getActivePricingList();
  const normalizedUnit = (unit || '').toLowerCase().trim();
  const normalizedCat = (category || '').toLowerCase().trim();
  const normalizedProj = (projectName || '').toLowerCase().trim();

  // 1. Direct match with category and unit
  if (normalizedCat) {
    const directMatch = list.find(p => 
      p.unit.toLowerCase() === normalizedUnit && 
      (p.service_name.toLowerCase() === normalizedCat || 
       normalizedCat.includes(p.service_name.toLowerCase()) || 
       p.service_name.toLowerCase().includes(normalizedCat))
    );
    if (directMatch) return directMatch.standard_price;
  }

  // 2. Fallback match with any unit if unit didn't match
  if (normalizedCat) {
    const crossUnitMatch = list.find(p => 
      p.service_name.toLowerCase() === normalizedCat || 
      normalizedCat.includes(p.service_name.toLowerCase()) || 
      p.service_name.toLowerCase().includes(normalizedCat)
    );
    if (crossUnitMatch) return crossUnitMatch.standard_price;
  }

  // 3. Fallback match with project name keywords if category was not specified
  if (normalizedProj) {
    const projMatch = list.find(p => 
      (normalizedUnit ? p.unit.toLowerCase() === normalizedUnit : true) &&
      (normalizedProj.includes(p.service_name.toLowerCase()) || 
       (p.service_name.toLowerCase().includes('วิดีโอ') && normalizedProj.includes('วิดีโอ')) ||
       (p.service_name.toLowerCase().includes('ถ่ายภาพ') && normalizedProj.includes('ถ่ายภาพ')) ||
       (p.service_name.toLowerCase().includes('ข่าว') && normalizedProj.includes('ข่าว')) ||
       (p.service_name.toLowerCase().includes('บทความ') && normalizedProj.includes('บทความ')))
    );
    if (projMatch) return projMatch.standard_price;
  }

  return null;
}
