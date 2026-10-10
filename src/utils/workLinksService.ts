import { createClient } from "@/utils/supabase/client";

export interface WorkLinkItem {
  id: string;
  title: string;
  category: "ระบบภายใน STeP" | "Google Drive ส่วนกลาง" | "เครื่องมือออกแบบ & AI" | "แพลตฟอร์ม Social Media" | "สื่อมวลชน & PR" | "เอกสาร & แบบฟอร์มทางการ" | string;
  subCategory?: string;
  description: string;
  url: string;
  targetUnits: string;
  isPinned: boolean;
  updatedAt: string;
}

export const WORK_LINK_CATEGORIES = [
  "ระบบภายใน STeP",
  "Google Drive ส่วนกลาง",
  "เครื่องมือออกแบบ & AI",
  "แพลตฟอร์ม Social Media",
  "สื่อมวลชน & PR",
  "เอกสาร & แบบฟอร์มทางการ"
] as const;

export const DEFAULT_SUBCATEGORIES_BY_CAT: Record<string, string[]> = {
  "ระบบภายใน STeP": ["CC Tracking & ISO", "E-Office จองรถ/แจ้งซ่อม", "ระบบสารสนเทศกลาง STeP", "ระบบการเงิน/จัดซื้อ"],
  "Google Drive ส่วนกลาง": ["Asset Library & ไฟล์กราฟิก", "รูปภาพกิจกรรม & Footage", "เทมเพลตและเอกสารแชร์", "Brand Guideline"],
  "เครื่องมือออกแบบ & AI": ["Graphic Design Suite", "Generative AI Suite", "Typography & Color", "Motion & Video Suite"],
  "แพลตฟอร์ม Social Media": ["Official Web & News", "Facebook & Fanpage", "YouTube & Shorts", "TikTok & Reels"],
  "สื่อมวลชน & PR": ["Media Directory", "Press Release Hub", "สำนักข่าวและนักข่าวท้องถิ่น", "สื่อโทรทัศน์/วิทยุ"],
  "เอกสาร & แบบฟอร์มทางการ": ["สเปรดชีตแผนงาน", "ISO 9001 & WI", "แบบฟอร์มเบิกจ่าย/งบประมาณ", "ใบเสนอราคา & สัญญา"]
};

export const DEFAULT_WORK_LINKS: WorkLinkItem[] = [
  {
    id: "wl-01",
    title: "Google Drive กลาง: คลังงาน CC & Asset Library 2026",
    category: "Google Drive ส่วนกลาง",
    subCategory: "Asset Library & ไฟล์กราฟิก",
    description: "โฟลเดอร์เก็บไฟล์งานกราฟิก วิดีโอ ภาพถ่ายกิจกรรม และ Brand Assets ทั้งหมดของอุทยานฯ",
    url: "https://drive.google.com",
    targetUnits: "ทุกยูนิตในทีม CC",
    isPinned: true,
    updatedAt: "2026-09-18"
  },
  {
    id: "wl-02",
    title: "ระบบ CC System 2027 Control Center & Tracking",
    category: "ระบบภายใน STeP",
    subCategory: "CC Tracking & ISO",
    description: "ระบบบริหารจัดการคำขอรับบริการ ติดตามสถานะบรีฟ รายงาน ISO 9001 และ Meeting Report",
    url: "https://cc-system-2027.step.cmu.ac.th",
    targetUnits: "ทุกยูนิตในทีม CC",
    isPinned: true,
    updatedAt: "2026-09-20"
  },
  {
    id: "wl-03",
    title: "Google Sheet: แผนดำเนินงานและลิงก์งานที่เกี่ยวข้อง CC",
    category: "เอกสาร & แบบฟอร์มทางการ",
    subCategory: "สเปรดชีตแผนงาน",
    description: "สเปรดชีตต้นฉบับสำหรับแผนดำเนินงานรายปี ทะเบียนลิงก์งาน และข้อสั่งการ",
    url: "https://docs.google.com/spreadsheets/d/1IOaPxt095bc7M_xsdUmspY_WHkpOncx3/edit?gid=1479523574#gid=1479523574",
    targetUnits: "หัวหน้าทีม / ผู้ช่วย",
    isPinned: true,
    updatedAt: "2026-09-15"
  },
  {
    id: "wl-04",
    title: "STeP Official Website & News Room",
    category: "แพลตฟอร์ม Social Media",
    subCategory: "Official Web & News",
    description: "เว็บไซต์หลักอุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ และห้องข่าวประชาสัมพันธ์",
    url: "https://step.cmu.ac.th",
    targetUnits: "สื่อสารองค์กร / PR",
    isPinned: false,
    updatedAt: "2026-09-10"
  },
  {
    id: "wl-05",
    title: "Canva Pro & Adobe Creative Cloud STeP Team Account",
    category: "เครื่องมือออกแบบ & AI",
    subCategory: "Graphic Design Suite",
    description: "บัญชีทีมกลางสำหรับสร้างสไลด์ เทมเพลต Social และการเข้าถึงคลังฟอนต์ลิขสิทธิ์",
    url: "https://www.canva.com",
    targetUnits: "งานออกแบบ / ผลิตสื่อ",
    isPinned: false,
    updatedAt: "2026-09-05"
  },
  {
    id: "wl-06",
    title: "ฐานข้อมูลเครือข่ายสื่อมวลชนและสำนักข่าวภาคเหนือ (Media Directory)",
    category: "สื่อมวลชน & PR",
    subCategory: "Media Directory",
    description: "รายชื่อผู้สื่อข่าว บรรณาธิการ โทรทัศน์ วิทยุ และเพจข่าวท้องถิ่นพร้อมเบอร์ประสานงาน",
    url: "https://drive.google.com",
    targetUnits: "ยูนิตสื่อสารองค์กร",
    isPinned: false,
    updatedAt: "2026-09-12"
  },
  {
    id: "wl-07",
    title: "Midjourney & Runway Gen-3 Production Suite",
    category: "เครื่องมือออกแบบ & AI",
    subCategory: "Generative AI Suite",
    description: "เครื่องมือสร้างภาพ AI และวิดีโอโมชันสำหรับจำลองบรรจุภัณฑ์และคอนเซ็ปต์งานสร้างสรรค์",
    url: "https://runwayml.com",
    targetUnits: "งานออกแบบ / ผลิตสื่อ",
    isPinned: false,
    updatedAt: "2026-09-08"
  },
  {
    id: "wl-08",
    title: "ระบบแจ้งซ่อมและจองยานพาหนะ STeP E-Office",
    category: "ระบบภายใน STeP",
    subCategory: "E-Office จองรถ/แจ้งซ่อม",
    description: "ระบบบริการภายในอุทยานฯ สำหรับจองรถตู้ไปถ่ายทำภายนอก และขอรับบริการอาคาร",
    url: "https://eoffice.step.cmu.ac.th",
    targetUnits: "ทุกยูนิต",
    isPinned: false,
    updatedAt: "2026-08-30"
  }
];

const LOCAL_STORAGE_KEY = "cc_work_links_v2";
const FALLBACK_KEYS = ["cc_work_links_v2", "cc_work_links_v1", "cc_work_links", "cc_links", "work_links"];

/**
 * Get locally cached links
 */
export function getLocalCachedWorkLinks(): WorkLinkItem[] {
  if (typeof window === "undefined") return DEFAULT_WORK_LINKS;
  for (const k of FALLBACK_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn(`Failed to parse cache from ${k}`, e);
      }
    }
  }
  return DEFAULT_WORK_LINKS;
}

/**
 * Fetch links from Supabase cloud database with automatic local cache synchronization
 */
export async function fetchWorkLinksFromSupabase(): Promise<{ links: WorkLinkItem[]; source: "cloud" | "cache" | "default" }> {
  const localCache = getLocalCachedWorkLinks();

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("okr_settings")
      .select("id, description, target_value")
      .eq("description", "CONFIG_WORK_LINKS_JSON")
      .maybeSingle();

    if (!error && data && data.target_value) {
      try {
        const parsed = JSON.parse(data.target_value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sync to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
          return { links: parsed, source: "cloud" };
        }
      } catch (pe) {
        console.warn("Error parsing CONFIG_WORK_LINKS_JSON from Supabase:", pe);
      }
    }

    // If Supabase was empty or missing but local cache has more links than defaults, upload to cloud
    if (localCache && localCache.length > DEFAULT_WORK_LINKS.length) {
      await saveWorkLinksToSupabase(localCache);
      return { links: localCache, source: "cache" };
    }
  } catch (err) {
    console.warn("Supabase fetchWorkLinks error:", err);
  }

  return { links: localCache, source: localCache === DEFAULT_WORK_LINKS ? "default" : "cache" };
}

/**
 * Save links permanently to Supabase cloud database
 */
export async function saveWorkLinksToSupabase(links: WorkLinkItem[]): Promise<{ success: boolean; error?: string }> {
  // 1. Update local cache immediately for optimistic speed
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
  }

  // 2. Persist to Supabase cloud database
  try {
    const supabase = createClient();
    const jsonStr = JSON.stringify(links);

    const { data: existing } = await supabase
      .from("okr_settings")
      .select("id")
      .eq("description", "CONFIG_WORK_LINKS_JSON")
      .maybeSingle();

    if (existing && existing.id) {
      const { error } = await supabase
        .from("okr_settings")
        .update({
          target_value: jsonStr,
          is_active: true
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("okr_settings")
        .insert([{
          type: "KR",
          description: "CONFIG_WORK_LINKS_JSON",
          target_value: jsonStr,
          is_active: true
        }]);
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error("saveWorkLinksToSupabase error:", err);
    return { success: false, error: err?.message || "Failed to persist to cloud" };
  }
}

/**
 * Parse pasted table rows from Google Sheet or CSV
 */
export function parsePastedSheetRows(text: string): WorkLinkItem[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: WorkLinkItem[] = [];

  for (const line of lines) {
    // Detect delimiter: tab (Google Sheets copy) or comma
    const isTab = line.includes("\t");
    const cols = isTab ? line.split("\t").map(c => c.trim()) : line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));

    if (cols.length === 0) continue;

    // Check if header row
    const firstColLower = cols[0].toLowerCase();
    if (firstColLower.includes("ชื่อ") || firstColLower.includes("title") || firstColLower.includes("ระบบ") || firstColLower.includes("link")) {
      continue;
    }

    // Identify URL column
    let url = "";
    let urlColIdx = -1;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].startsWith("http://") || cols[i].startsWith("https://") || cols[i].startsWith("www.") || cols[i].includes(".com") || cols[i].includes(".th")) {
        url = cols[i].startsWith("www.") ? `https://${cols[i]}` : cols[i];
        urlColIdx = i;
        break;
      }
    }

    // Title is usually col 0 (if not URL)
    let title = cols[0];
    if (urlColIdx === 0 && cols.length > 1) {
      title = cols[1];
    }

    if (!title && !url) continue;
    if (!title && url) title = url;
    if (!url) url = "https://";

    // Attempt to match category
    let category = "เอกสาร & แบบฟอร์มทางการ";
    const subCategory = "สเปรดชีตแผนงาน";
    let description = "";
    const targetUnits = "ทุกยูนิตในทีม CC";

    for (let i = 0; i < cols.length; i++) {
      if (i === urlColIdx) continue;
      const c = cols[i];
      if (WORK_LINK_CATEGORIES.some(cat => cat === c)) {
        category = c;
      } else if (c.length > 20 && !description) {
        description = c;
      }
    }

    results.push({
      id: `wl-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || "ลิงก์ไม่มีชื่อ",
      category,
      subCategory,
      description: description || "นำเข้าจาก Google Sheet / ภายนอก",
      url,
      targetUnits,
      isPinned: false,
      updatedAt: new Date().toISOString().slice(0, 10)
    });
  }

  return results;
}
