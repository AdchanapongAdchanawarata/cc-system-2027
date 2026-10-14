// Standard STeP Fastwork Service Pricing reference & lookup utility

export type ServicePriceItem = {
  unit: string;
  service_name: string;
  standard_price: number;
  lead_time_days?: number; // ระยะเวลาเฉลี่ยในการทำงาน / สั่งล่วงหน้าตามเกณฑ์มาตรฐาน (วัน)
  description?: string;
};

export const DEFAULT_STEP_PRICING: ServicePriceItem[] = [
  // --- Creative Designer ---
  { unit: 'creative', service_name: 'Logo Design', standard_price: 2500, lead_time_days: 7, description: 'ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก' },
  { unit: 'creative', service_name: 'Key Visual (KV)', standard_price: 3500, lead_time_days: 5, description: 'ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ' },
  { unit: 'creative', service_name: 'Print Poster / Flyer', standard_price: 750, lead_time_days: 5, description: 'ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า' },
  { unit: 'creative', service_name: 'Brochure / Leaflet', standard_price: 1200, lead_time_days: 5, description: 'ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ' },
  { unit: 'creative', service_name: 'Backdrop (ฉากหลัง)', standard_price: 2500, lead_time_days: 5, description: 'ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์' },
  { unit: 'creative', service_name: 'Book Layout (≤10 หน้า)', standard_price: 2500, lead_time_days: 7, description: 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า' },
  { unit: 'creative', service_name: 'Book Layout (≥10 หน้า)', standard_price: 5500, lead_time_days: 10, description: 'วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า' },
  { unit: 'creative', service_name: 'Packaging (ครบวงจร)', standard_price: 10000, lead_time_days: 10, description: 'ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน' },
  { unit: 'creative', service_name: 'Website Full Design', standard_price: 15000, lead_time_days: 14, description: 'ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)' },
  { unit: 'creative', service_name: 'Exhibition Design (Small)', standard_price: 4500, lead_time_days: 7, description: 'ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)' },
  { unit: 'creative', service_name: '3D Render Visualization', standard_price: 2500, lead_time_days: 5, description: 'ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)' },
  { unit: 'creative', service_name: 'Signage Design (Small/Big)', standard_price: 1000, lead_time_days: 3, description: 'ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)' },
  { unit: 'creative', service_name: 'ถ่ายภาพผลิตภัณฑ์ (Product Photography)', standard_price: 3500, lead_time_days: 5, description: 'ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา' },
  { unit: 'creative', service_name: 'ถ่ายภาพบุคคล (Portrait Photography)', standard_price: 3000, lead_time_days: 3, description: 'ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง' },
  { unit: 'creative', service_name: 'Product Design', standard_price: 20000, lead_time_days: 14, description: 'ออกแบบผลิตภัณฑ์เชิงสร้างสรรค์' },
  { unit: 'creative', service_name: 'อื่นๆ (Others)', standard_price: 1500, lead_time_days: 5, description: 'งานออกแบบหรือบริการอื่นๆ นอกเหนือจากที่ระบุไว้' },

  // --- PR (Public Relations & Event Coverage) ---
  { unit: 'pr', service_name: 'ข่าวประชาสัมพันธ์บริการ (RSP)', standard_price: 1500, lead_time_days: 3, description: 'ข่าวเครือข่าย RSP ภาคเหนือ' },
  { unit: 'pr', service_name: 'ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)', standard_price: 1500, lead_time_days: 3, description: 'การโปรโมทก่อนเริ่มงานหรือโครงการ' },
  { unit: 'pr', service_name: 'ข่าวการจัดกิจกรรม/โครงการ', standard_price: 1500, lead_time_days: 3, description: 'ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ' },
  { unit: 'pr', service_name: 'ข่าวการจัดประชุม/อบรม/สัมมนา', standard_price: 1500, lead_time_days: 3, description: 'ข่าวงานประชุม การอบรม หรือสัมมนา' },
  { unit: 'pr', service_name: 'ข่าวเกี่ยวกับผู้บริหาร', standard_price: 1500, lead_time_days: 3, description: 'ข่าวภารกิจหรือการแถลงของผู้บริหาร' },
  { unit: 'pr', service_name: 'ข่าวการรับรางวัล', standard_price: 1500, lead_time_days: 3, description: 'ข่าวความสำเร็จหรือการรับรางวัลต่างๆ' },
  { unit: 'pr', service_name: 'ข่าวศึกษาดูงาน', standard_price: 1500, lead_time_days: 3, description: 'ข่าวการต้อนรับคณะศึกษาดูงาน' },
  { unit: 'pr', service_name: 'Press Release (ข่าวแจกสื่อมวลชน)', standard_price: 1500, lead_time_days: 3, description: 'เขียนข่าวประชาสัมพันธ์ภาษาไทยเพื่อส่งสื่อ' },
  { unit: 'pr', service_name: 'Media Management (ดูแลสื่อมวลชน)', standard_price: 15000, lead_time_days: 7, description: 'เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ' },
  { unit: 'pr', service_name: 'Stage Management (จัดการเวที)', standard_price: 3500, lead_time_days: 5, description: 'จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ' },
  { unit: 'pr', service_name: 'MOU / Event Coverage', standard_price: 2500, lead_time_days: 3, description: 'ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล' },
  { unit: 'pr', service_name: 'สนับสนุนการจัดกิจกรรม (Support Event)', standard_price: 2500, lead_time_days: 3, description: 'งานสนับสนุนและบริการสื่อสารอื่นๆ' },
  { unit: 'pr', service_name: 'อื่นๆ (โปรดระบุ)', standard_price: 1500, lead_time_days: 3, description: 'งานประชาสัมพันธ์อื่นๆ นอกเหนือจากที่ระบุ' },

  // --- Content Creator ---
  { unit: 'content', service_name: 'Creative Content Idea', standard_price: 5000, lead_time_days: 5, description: 'คิดธีม/ไอเดีย/ Event & Campaign' },
  { unit: 'content', service_name: 'บทความสั้น + ภาพประกอบ', standard_price: 800, lead_time_days: 3, description: 'ความยาว 300 - 500 คำ (โพสต์โซเชียล)' },
  { unit: 'content', service_name: 'บทความยาว + ภาพประกอบ', standard_price: 2500, lead_time_days: 5, description: 'ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)' },
  { unit: 'content', service_name: 'ตัดต่อคลิปสั้น (Short-form)', standard_price: 1500, lead_time_days: 3, description: 'ความยาว 15 - 60 วินาที (TikTok/Reels)' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น โปรโมตการบริการ', standard_price: 2500, lead_time_days: 5, description: 'ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์', standard_price: 3500, lead_time_days: 5, description: 'ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล' },
  { unit: 'content', service_name: 'ถ่ายทำวิดีโอสั้น Talk Spective', standard_price: 3500, lead_time_days: 5, description: 'ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ' },
  { unit: 'content', service_name: 'Copywriting / Storytelling', standard_price: 1500, lead_time_days: 3, description: 'การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ' },
  { unit: 'content', service_name: 'Boost Post เพื่อประชาสัมพันธ์', standard_price: 1000, lead_time_days: 2, description: 'การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย' },
  { unit: 'content', service_name: 'อื่นๆ (โปรดระบุ)', standard_price: 1000, lead_time_days: 3, description: 'งานบริการคอนเทนต์อื่นๆ นอกเหนือจากที่ระบุไว้' },

  // --- Internal ---
  { unit: 'internal', service_name: 'ทำใบเสนอราคา', standard_price: 1500, lead_time_days: 2, description: 'สร้างและออกเอกสารใบเสนอราคา (Quotation) ตามมาตรฐาน STeP CMU' },
  { unit: 'internal', service_name: 'งานเอกสาร/การเงินโครงการ', standard_price: 1500, lead_time_days: 3, description: 'ทำงานเอกสาร/การเงินโครงการที่เกี่ยวข้องกับการจัดซื้อจัดจ้าง' },
  { unit: 'internal', service_name: 'งานขึ้นรูป Proposal / TOR', standard_price: 5000, lead_time_days: 7, description: 'ทำงานเอกสาร กราฟิก ภาพประกอบ ทีเดียอื่นๆ เพื่อประกอบการ...' },
  { unit: 'internal', service_name: 'งาน Admin / STeP + RSP', standard_price: 1000, lead_time_days: 2, description: 'งาน Admin จัดการข้อมูลหลังบ้าน Social Media ของ STeP แ...' },
  { unit: 'internal', service_name: 'งาน Admin / Talk Spective', standard_price: 1000, lead_time_days: 2, description: 'งาน Admin หลังบ้าน Social Media ของ Talk Spective' },
  { unit: 'internal', service_name: 'เตรียมงาน VDO / STeP + RSP', standard_price: 1000, lead_time_days: 3, description: 'เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / STeP + RSP' },
  { unit: 'internal', service_name: 'เตรียมงาน VDO / Talk Spective', standard_price: 1000, lead_time_days: 3, description: 'เตรียมงาน สถานที่ ทำคอนเทนต์ VDO / Talk Spective' },
  { unit: 'internal', service_name: 'บทความ / ภาพประกอบ ของ STeP + RSP', standard_price: 1500, lead_time_days: 3, description: 'บทความ / ภาพประกอบ คอนเทนต์ PR ของ STeP + RSP' },
  { unit: 'internal', service_name: 'บทความ / ภาพประกอบ ของ Talk Spective', standard_price: 1500, lead_time_days: 3, description: 'บทความ / ภาพประกอบ คอนเทนต์ PR ของ Talk Spective' },
  { unit: 'internal', service_name: 'งานให้คำปรึกษาเชิงสร้างสรรค์', standard_price: 1500, lead_time_days: 3, description: 'งานให้คำปรึกษาที่เกี่ยวข้องกับงานสร้างสรรค์ ออกแบบ คอนเทน...' },
  { unit: 'internal', service_name: 'งานจัดทำ / แก้ไข Presentation', standard_price: 5000, lead_time_days: 5, description: 'งานจัดทำ / แก้ไข สไลด์ Presentation' },
  { unit: 'internal', service_name: 'งานวิทยากร', standard_price: 5000, lead_time_days: 7, description: 'เป็นวิทยากรให้กับหน่วยงาน โครงการ กิจกรรมต่างๆ' },
  { unit: 'internal', service_name: 'ดูแล / ประสานงานนักข่าว', standard_price: 3000, lead_time_days: 3, description: 'ดูแลประสานงานนักข่าว เพื่อมาทำข่าวให้กับโครงการ กิจกรรม' },
  { unit: 'internal', service_name: 'ประสานงานโครงการ', standard_price: 1500, lead_time_days: 3, description: 'ช่วยประสานงานโครงการของคนภายในทีมและองค์กร นอกเหนือ...' },
  { unit: 'internal', service_name: 'เขียนข่าว ( นอกเหนือจาก Task งาน )', standard_price: 1500, lead_time_days: 3, description: 'เขียนข่าว ที่ได้รับมอบหมายนอกเหนือจาก Task งานที่มีอยู่เดิม' },
  { unit: 'internal', service_name: 'เขียน Press Release ( นอกเหนือจาก Task งาน )', standard_price: 1500, lead_time_days: 3, description: 'เขียน Press Release ที่ได้รับมอบหมายนอกเหนือจาก Task งา...' },
  { unit: 'internal', service_name: 'ทำงานลงพื้นที่ / นอกสถานที่ ( นอกเหนือจาก Task งาน )', standard_price: 5000, lead_time_days: 5, description: 'ทำงานลงพื้นที่ ที่นอกเหนือจาก Task งาน เช่น ถ่ายภาพนอกสถา...' },
  { unit: 'internal', service_name: 'ดูแล / ประสานงาน KOL INFLU', standard_price: 1500, lead_time_days: 5, description: 'ดูแลประสานงาน KOL INFLU เพื่อมาทำข่าวให้กับโครงการ กิจก...' },
  { unit: 'internal', service_name: 'ช่วยงาน Event', standard_price: 3000, lead_time_days: 3, description: 'ช่วยงาน Event ในพื้นที่ / นอกพื้นที่ ของทีมและองค์กร' },
  { unit: 'internal', service_name: 'เตรียมงานที่ Whoop Studio', standard_price: 1500, lead_time_days: 3, description: 'เตรียมงาน ถ่ายภาพ คอนเทนต์ PR ที่ Whoop Studio' },
  { unit: 'internal', service_name: 'ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ( นอกเหนือจาก Task งาน )', standard_price: 1500, lead_time_days: 3, description: 'ถ่ายภาพ ทำข่าว / ถ่ายวีดีโอ ที่อยู่นอกเหนือจาก Task งาน' },
  { unit: 'internal', service_name: 'ติดตามผู้บริหาร ตามภารกิจขององค์กร ( นอกเหนือจาก Task งาน )', standard_price: 1500, lead_time_days: 3, description: 'งานติดตามผู้บริหาร ตามภารกิจขององค์กร เช่น PR คอนเทนต์ ...' },
  { unit: 'internal', service_name: 'ตัดต่องาน VDO / Talk Spective', standard_price: 3000, lead_time_days: 5, description: 'ตัดต่องาน ทำคอนเทนต์ VDO / Talk Spective' },
  { unit: 'internal', service_name: 'ตัดต่องาน VDO / STeP + RSP', standard_price: 3000, lead_time_days: 5, description: 'ตัดต่องาน ทำคอนเทนต์ VDO / STeP + RSP' },
  { unit: 'internal', service_name: 'ได้รับมอบหมายให้ทำงานในวันหยุด เสาร์ - อาทิตย์ ชดเชย', standard_price: 3000, lead_time_days: 3, description: 'ได้รับมอบหมายจากผู้บังคับบัญชาให้ทำงานในวันหยุด เสาร์ - อาทิตย์ ชดเชย' },
  { unit: 'internal', service_name: 'ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ', standard_price: 1000, lead_time_days: 3, description: 'ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ ทั้งงาน ออกแบบ คอนเทนต์ PR' },
  { unit: 'internal', service_name: 'PM โครงการของ CC', standard_price: 50000, lead_time_days: 14, description: 'PM โครงการของ CC (รายรับ ต้นทุน กำไร พร้อมระบุ DESIGN / CONTENT / PR)' }
];

import { getCloudJson, setCloudJson, CLOUD_KEYS } from "./cloudSyncService";

export function getStandardLeadTimeForService(serviceName?: string): number {
  if (!serviceName) return 3;
  const normalized = serviceName.toLowerCase().trim();
  const matched = DEFAULT_STEP_PRICING.find(d => 
    d.service_name.toLowerCase() === normalized ||
    normalized.includes(d.service_name.toLowerCase()) ||
    d.service_name.toLowerCase().includes(normalized)
  );
  return matched?.lead_time_days || 3;
}

export function mergeWithStandardLeadTimes(list: ServicePriceItem[]): ServicePriceItem[] {
  // If list is legacy where all items were 3 or undefined
  const nonThreeCount = list.filter(item => typeof item.lead_time_days === 'number' && item.lead_time_days !== 3).length;
  const isLegacyAllThree = nonThreeCount === 0 && list.length > 5;

  return list.map(item => {
    const defaultLeadTime = getStandardLeadTimeForService(item.service_name);
    if (typeof item.lead_time_days !== 'number' || isLegacyAllThree) {
      return { ...item, lead_time_days: defaultLeadTime };
    }
    return item;
  });
}

export function getActivePricingList(): ServicePriceItem[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cc_service_pricing');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeWithStandardLeadTimes(parsed);
          const wasLegacy = parsed.filter((item: any) => typeof item.lead_time_days === 'number' && item.lead_time_days !== 3).length === 0;
          if (wasLegacy) {
            localStorage.setItem('cc_service_pricing', JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch {}
  }
  return DEFAULT_STEP_PRICING;
}

export async function fetchPricingFromCloud(): Promise<ServicePriceItem[]> {
  const cloudData = await getCloudJson<ServicePriceItem[]>(
    CLOUD_KEYS.SERVICE_PRICING,
    'cc_service_pricing',
    DEFAULT_STEP_PRICING
  );
  if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
    const merged = mergeWithStandardLeadTimes(cloudData);
    const wasLegacy = cloudData.filter(item => typeof item.lead_time_days === 'number' && item.lead_time_days !== 3).length === 0;
    if (wasLegacy) {
      savePricingToCloud(merged).catch(() => {});
      if (typeof window !== 'undefined') {
        localStorage.setItem('cc_service_pricing', JSON.stringify(merged));
      }
    }
    return merged;
  }
  return DEFAULT_STEP_PRICING;
}

export async function savePricingToCloud(list: ServicePriceItem[]): Promise<boolean> {
  const res = await setCloudJson(
    CLOUD_KEYS.SERVICE_PRICING,
    list,
    'cc_service_pricing'
  );
  return res.success;
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

/**
 * ค้นหาระยะเวลาทำงานมาตรฐานเฉลี่ย (วัน) / Lead Time ตามประเภทงาน
 * เพื่อใช้เป็นระยะเวลามาตรฐานในการตัดสิน "งานด่วน" อย่างเป็นธรรมและเป็นกลาง (Fair & Objective Criteria)
 * เช่น โปสเตอร์กำหนด 5 วัน, PR กำหนด 3 วัน
 */
export function getLeadTimeForTask(unit: string | undefined, category: string | undefined, projectName?: string): number {
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
    if (directMatch && typeof directMatch.lead_time_days === 'number' && directMatch.lead_time_days > 0) {
      return directMatch.lead_time_days;
    }
  }

  // 2. Fallback match with any unit
  if (normalizedCat) {
    const crossUnitMatch = list.find(p => 
      p.service_name.toLowerCase() === normalizedCat || 
      normalizedCat.includes(p.service_name.toLowerCase()) || 
      p.service_name.toLowerCase().includes(normalizedCat)
    );
    if (crossUnitMatch && typeof crossUnitMatch.lead_time_days === 'number' && crossUnitMatch.lead_time_days > 0) {
      return crossUnitMatch.lead_time_days;
    }
  }

  // 3. Fallback match with project name keywords
  if (normalizedProj) {
    const projMatch = list.find(p => 
      (normalizedUnit ? p.unit.toLowerCase() === normalizedUnit : true) &&
      (normalizedProj.includes(p.service_name.toLowerCase()) || 
       (p.service_name.toLowerCase().includes('วิดีโอ') && (normalizedProj.includes('วิดีโอ') || normalizedProj.includes('video'))) ||
       (p.service_name.toLowerCase().includes('ถ่ายภาพ') && (normalizedProj.includes('ถ่ายภาพ') || normalizedProj.includes('photo'))) ||
       (p.service_name.toLowerCase().includes('ข่าว') && normalizedProj.includes('ข่าว')) ||
       (p.service_name.toLowerCase().includes('บทความ') && normalizedProj.includes('บทความ')) ||
       (p.service_name.toLowerCase().includes('poster') && (normalizedProj.includes('โปสเตอร์') || normalizedProj.includes('poster'))))
    );
    if (projMatch && typeof projMatch.lead_time_days === 'number' && projMatch.lead_time_days > 0) {
      return projMatch.lead_time_days;
    }
  }

  // ค่ามาตรฐานตามยูนิตทั่วไปหากไม่ตรงกับรายการใด
  if (normalizedUnit.includes('creative') || normalizedUnit.includes('design')) return 5;
  if (normalizedUnit.includes('content')) return 4;
  if (normalizedUnit.includes('pr')) return 3;
  return 3;
}

/**
 * ตรวจสอบว่าเป็นงานภายใน (Internal Task) หรือไม่
 */
export function isInternalTask(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!brief) return false;
  const unit = (brief.unit || brief.details?.unit || '').toLowerCase().trim();
  // External service units are strictly NEVER internal
  if (['creative', 'content', 'pr', 'design'].includes(unit)) return false;

  if (unit === 'internal') return true;
  if (brief.details?.source === 'internal' || brief.details?.is_internal === true) return true;
  const taskCode = (brief.details?.task_code || brief.details?.project_code || brief.details?.job_code || '').toString().toUpperCase();
  if (taskCode.startsWith('INT') || taskCode.startsWith('IT')) return true;
  const requesterEmail = (brief.details?.requester_email || (brief as any).requester_email || '').toString().toLowerCase();
  if (requesterEmail === 'internal@step.cmu.ac.th') return true;
  return false;
}

/**
 * ตรวจสอบว่าเป็นงานประเภท ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ หรือรหัส IDC หรือไม่
 */
export function isIdcOrEntrepreneurTask(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!brief) return false;
  const details = brief.details || {};
  const taskCode = (
    details.task_code ||
    details.idc_code ||
    details.job_code ||
    details.project_code ||
    ''
  ).toString().toUpperCase().trim();

  const projectName = (brief.project_name || '').toString().toUpperCase();
  const source = (details.source || '').toString().toLowerCase();
  const category = (details.category || details.service_category || details.service_type || '').toString().toLowerCase();

  const isExplicitIdc = (
    Boolean(details.idc_code) ||
    taskCode.startsWith('IDC') ||
    projectName.startsWith('[IDC]') ||
    projectName.startsWith('IDC') ||
    source === 'idc_form' ||
    source === 'idc-form' ||
    details.is_idc === true
  );

  const isEntrepreneurConsultation = (
    category.includes('ปรึกษา') ||
    category.includes('รับโจทย์') ||
    category.includes('ผู้ประกอบการ') ||
    Boolean(details.entrepreneur_name) ||
    Boolean(details.company_name) ||
    Boolean(details.consultation_topic)
  );

  return isExplicitIdc || isEntrepreneurConsultation;
}

/**
 * ตรวจสอบว่าเป็นงานเครือข่าย RSP หรือไม่ (รหัสขึ้นต้นด้วย RSP, เช่น RSP70-1)
 * ตามข้อตกลงกรณีพิเศษ: รหัสงาน RSP เท่านั้น
 */
export function isRspTask(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!brief) return false;
  const details = brief.details || {};
  const taskCode = (
    details.task_code ||
    details.rsp_code ||
    details.job_code ||
    details.project_code ||
    ''
  ).toString().toUpperCase().trim();

  const projectName = (brief.project_name || '').toString().toUpperCase();
  const source = (details.source || '').toString().toLowerCase();
  const category = (details.category || details.service_category || '').toString().toLowerCase();

  return (
    Boolean(details.rsp_code) ||
    taskCode.startsWith('RSP') ||
    projectName.startsWith('[RSP]') ||
    projectName.startsWith('RSP') ||
    source === 'rsp_press_form' ||
    source === 'rsp-press-form' ||
    category.includes('rsp') ||
    category.includes('press release')
  );
}

/**
 * กฎเหล็กการส่งอีเมลสำหรับขั้นตอน IN PROGRESS:
 * - ทุกงานที่ย้ายเข้า IN PROGRESS ต้องเด้งหน้าต่างดราฟต์อีเมล InProgressEmailModal เสมอ
 * - เพื่อให้ผู้รับผิดชอบงานสามารถตรวจทาน/มอบหมายงานและเปิดส่งใน Gmail หรือส่งผ่านระบบได้อย่างแม่นยำ
 */
export function shouldSkipEmailForInProgress(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!brief) return true;
  if (brief.details?.is_deleted || brief.details?.is_permanently_deleted || (brief as any).status === 'purged') {
    return true;
  }
  return false;
}

/**
 * กฎเหล็กการส่งอีเมลสำหรับขั้นตอน COMPLETED:
 * - ทุกงานที่ย้ายเข้า COMPLETED ต้องเด้งหน้าต่างดราฟต์อีเมล CompletedEmailModal เสมอ
 * - เพื่อส่งมอบงานและแนบแบบประเมินความพึงพอใจการให้บริการ 5 มิติ
 */
export function shouldSkipEmailForCompleted(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!brief) return true;
  if (brief.details?.is_deleted || brief.details?.is_permanently_deleted || (brief as any).status === 'purged') {
    return true;
  }
  return false;
}

/**
 * ตรวจสอบว่างานภายในชิ้นนี้ มีขั้นตอนที่ต้องส่งอีเมลหรือไม่
 */
export function isInternalTaskRequiringEmail(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  return true;
}

/**
 * ฟังก์ชันกลางสำหรับตรวจสอบการข้ามอีเมลของงานภายใน:
 * รองรับการระบุ status ('in_progress' | 'completed')
 * กฎเด็ดขาด: ต้องเด้งโมดอลส่งอีเมลเสมอเมื่อเข้าสถานะ in_progress หรือ completed
 */
export function shouldInternalTaskSkipEmail(
  brief: {
    unit?: string | null;
    project_name?: string | null;
    details?: any;
  },
  status?: 'in_progress' | 'completed' | string
): boolean {
  if (!brief) return true;
  if (brief.details?.is_deleted || brief.details?.is_permanently_deleted || (brief as any).status === 'purged') {
    return true;
  }
  return false;
}

/**
 * ตรวจสอบว่างานภายใน (Internal Task) เป็นกรณีพิเศษที่ยังคงต้องถูกประเมินความพึงพอใจหรือไม่
 * ข้อตกลงกรณีพิเศษ:
 * - รหัสงาน RSP หรือ IDC หรือ ให้คำปรึกษา/รับโจทย์ผู้ประกอบการ
 */
export function isInternalTaskRequiringEvaluation(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!isInternalTask(brief)) return true; // งานภายนอก (Creative, Content, PR) ต้องประเมินตามปกติ
  
  // ตรวจสอบกรณีพิเศษ IDC หรือ RSP ก่อน
  if (isRspTask(brief) || isIdcOrEntrepreneurTask(brief)) {
    return true;
  }

  const taskCode = (
    brief.details?.task_code ||
    brief.details?.job_code ||
    brief.details?.project_code ||
    ''
  ).toString().toUpperCase().trim();

  // กรณีพิเศษตามข้อตกลง: รหัสงาน RSP หรือ IDC เท่านั้น
  const isSpecialTaskCode =
    taskCode.startsWith('RSP') ||
    taskCode.startsWith('IDC') ||
    Boolean(brief.details?.rsp_code) ||
    Boolean(brief.details?.idc_code);

  if (isSpecialTaskCode) return true;

  return false;
}

/**
 * ตรวจสอบว่างานนี้เป็นงาน Internal ทั่วไปที่ไม่ต้องถูกประเมิน (ควรตัดออกจากลิสต์การส่งประเมิน) หรือไม่
 */
export function shouldSkipEvaluationForInternalTask(brief: {
  unit?: string | null;
  project_name?: string | null;
  details?: any;
}): boolean {
  if (!isInternalTask(brief)) return false; // งานภายนอกไม่ใช่ internal จึงไม่ถูกตัด
  return !isInternalTaskRequiringEvaluation(brief);
}

