"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Newspaper,
  Calendar,
  Building2,
  Users,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
  Globe,
  Tv,
  Radio,
  FileSpreadsheet,
  Trash2,
  Edit3,
  FileText,
  DollarSign,
  ChevronRight,
  Layers,
  Sparkles,
  Link2,
  Paperclip,
  Check,
  X,
  RefreshCw,
  Hash,
  ChevronDown,
  ArrowLeft,
  Copy,
  Send
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from "date-fns";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";
import ModernDatePicker from "@/components/ModernDatePicker";
import { createClient } from "@/utils/supabase/client";
import { getCloudJson, setCloudJson, CLOUD_KEYS } from "@/utils/cloudSyncService";

export type StockTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" | "CUSTOM";

// ==========================================
// 14 Northern RSP Universities & Official Theme Colors
// Exact matched from RSP Northern Network specifications
// ==========================================
export interface RSPUniversity {
  id: string;
  name: string;
  shortName: string;
  color: string; // Hex color
  bgClass: string;
  textClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const RSP_UNIVERSITIES: RSPUniversity[] = [
  {
    id: "cmu",
    name: "มหาวิทยาลัยเชียงใหม่",
    shortName: "CMU",
    color: "#E11D48", // Rose Red / Deep Pink
    bgClass: "bg-[#E11D48]",
    textClass: "text-[#E11D48]",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200"
  },
  {
    id: "mju",
    name: "มหาวิทยาลัยแม่โจ้",
    shortName: "MJU",
    color: "#8B5CF6", // Purple / Violet
    bgClass: "bg-[#8B5CF6]",
    textClass: "text-[#8B5CF6]",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200"
  },
  {
    id: "mfu",
    name: "มหาวิทยาลัยแม่ฟ้าหลวง",
    shortName: "MFU",
    color: "#7C3AED", // Deep Violet
    bgClass: "bg-[#7C3AED]",
    textClass: "text-[#7C3AED]",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    badgeBorder: "border-violet-200"
  },
  {
    id: "up",
    name: "มหาวิทยาลัยพะเยา",
    shortName: "UP",
    color: "#9333EA", // Purple Orchid
    bgClass: "bg-[#9333EA]",
    textClass: "text-[#9333EA]",
    badgeBg: "bg-fuchsia-50",
    badgeText: "text-fuchsia-700",
    badgeBorder: "border-fuchsia-200"
  },
  {
    id: "nu",
    name: "มหาวิทยาลัยนเรศวร",
    shortName: "NU",
    color: "#16A34A", // Emerald Green
    bgClass: "bg-[#16A34A]",
    textClass: "text-[#16A34A]",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200"
  },
  {
    id: "uru",
    name: "มหาวิทยาลัยราชภัฏอุตรดิตถ์",
    shortName: "URU",
    color: "#0D9488", // Teal Green
    bgClass: "bg-[#0D9488]",
    textClass: "text-[#0D9488]",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200"
  },
  {
    id: "psru",
    name: "มหาวิทยาลัยราชภัฏพิบูลสงคราม",
    shortName: "PSRU",
    color: "#EA580C", // Bright Orange
    bgClass: "bg-[#EA580C]",
    textClass: "text-[#EA580C]",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-200"
  },
  {
    id: "cmru",
    name: "มหาวิทยาลัยราชภัฏเชียงใหม่",
    shortName: "CMRU",
    color: "#F43F5E", // Pink Rose
    bgClass: "bg-[#F43F5E]",
    textClass: "text-[#F43F5E]",
    badgeBg: "bg-pink-50",
    badgeText: "text-pink-700",
    badgeBorder: "border-pink-200"
  },
  {
    id: "crru",
    name: "มหาวิทยาลัยราชภัฏเชียงราย",
    shortName: "CRRU",
    color: "#22C55E", // Bright Green
    bgClass: "bg-[#22C55E]",
    textClass: "text-[#22C55E]",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    badgeBorder: "border-green-200"
  },
  {
    id: "lpru",
    name: "มหาวิทยาลัยราชภัฏลำปาง",
    shortName: "LPRU",
    color: "#0284C7", // Sky / Cerulean Blue
    bgClass: "bg-[#0284C7]",
    textClass: "text-[#0284C7]",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200"
  },
  {
    id: "kpru",
    name: "มหาวิทยาลัยราชภัฏกำแพงเพชร",
    shortName: "KPRU",
    color: "#A855F7", // Medium Purple
    bgClass: "bg-[#A855F7]",
    textClass: "text-[#A855F7]",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200"
  },
  {
    id: "pcru",
    name: "มหาวิทยาลัยราชภัฏเพชรบูรณ์",
    shortName: "PCRU",
    color: "#C2410C", // Deep Burnt Orange
    bgClass: "bg-[#C2410C]",
    textClass: "text-[#C2410C]",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200"
  },
  {
    id: "nsru",
    name: "มหาวิทยาลัยราชภัฏนครสวรรค์",
    shortName: "NSRU",
    color: "#F97316", // Amber Orange
    bgClass: "bg-[#F97316]",
    textClass: "text-[#F97316]",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200"
  },
  {
    id: "rmutl",
    name: "มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา",
    shortName: "RMUTL",
    color: "#3B82F6", // Royal Blue
    bgClass: "bg-[#3B82F6]",
    textClass: "text-[#3B82F6]",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200"
  }
];

// ==========================================
// PRESS CATEGORIES (จาก ClickUp Form ตามรูปภาพของผู้ใช้)
// ==========================================
export interface PressCategoryItem {
  id: string;
  name: string;
  color: string;
}

export const PRESS_CATEGORIES: PressCategoryItem[] = [
  {
    id: "activity",
    name: "ข่าวการจัดกิจกรรม/โครงการ",
    color: "#ff2a70" // Vibrant Hot Pink
  },
  {
    id: "mhesi_exec_join",
    name: "ข่าวผู้บริหารเข้าร่วมกิจกรรมของกระทรวง อว.",
    color: "#7048e8" // Vibrant Violet/Purple
  },
  {
    id: "mhesi_exec_visit",
    name: "ข่าวผู้บริหารกระทรวง อว. ลงพื้นที่ติดตามงาน หรือประชุม ที่เกี่ยวข้องกับเครือข่ายมหาวิทยาลัยฯ",
    color: "#d9480f" // Deep Orange/Rust
  },
  {
    id: "pr_non_duplicate",
    name: "ข่าวประชาสัมพันธ์ (โครงการที่รับสมัครจะต้องไม่เป็นโครงการที่ทำเหมือนกันทุกมหาวิทยาลัย)",
    color: "#0052cc" // Vibrant Royal Blue
  },
  {
    id: "pr_service",
    name: "ข่าวประชาสัมพันธ์บริการ",
    color: "#12b886" // Vibrant Teal/Cyan-Green
  },
  {
    id: "success_case",
    name: "ข่าว Success case",
    color: "#5c6779" // Slate Charcoal Gray
  }
];

export const TARGET_AUDIENCES = PRESS_CATEGORIES.map(c => c.name);

// Media Types
export const MEDIA_TYPES = [
  { id: "online", label: "Online (เว็บไซต์ / โซเชียลมีเดีย / ข่าวออนไลน์)", icon: Globe },
  { id: "print", label: "Print (หนังสือพิมพ์ / นิตยสาร / สิ่งพิมพ์)", icon: FileText },
  { id: "tv", label: "TV / Broadcast (สถานีโทรทัศน์ / รายการทีวี)", icon: Tv },
  { id: "radio", label: "Radio / Podcast (วิทยุ / พอดแคสต์)", icon: Radio }
];

export interface PressReleaseItem {
  id: string;
  code: string;
  universityId: string;
  title: string;
  date: string;
  targetAudience: string;
  mediaTypes: string[]; // e.g. ['online', 'print']
  clippingsCount: number;
  prValue?: number; // in Baht (optional / deprecated)
  newsUrl: string;
  reporterName: string;
  reporterContact: string;
  details: string;
  status: "published" | "pending_review" | "draft";
  clippingList?: Array<{ name: string; url: string; date: string }>;
}

// Initial realistic dataset across Northern universities
const INITIAL_PRESS_RELEASES: PressReleaseItem[] = [
  {
    id: "pr-001",
    code: "RSP-PR-2026-001",
    universityId: "cmu",
    title: "อุทยานวิทยาศาสตร์ภาคเหนือ (RSP) โชว์ศักยภาพผลงานวิจัยและนวัตกรรมสู่เชิงพาณิชย์ ในงาน Lanna Innovation Expo",
    date: "2026-09-12",
    targetAudience: "ข่าวการจัดกิจกรรม/โครงการ",
    mediaTypes: ["online", "print", "tv"],
    clippingsCount: 14,
    prValue: 420000,
    newsUrl: "https://www.bangkokbiznews.com/tech/rsp-cmu-2026",
    reporterName: "คุณวิภาวรรณ สุขประเสริฐ",
    reporterContact: "081-445-1234 (wipawan@step.cmu.ac.th)",
    details: "แถลงข่าวผลการดำเนินงานการขับเคลื่อนเทคโนโลยี Deep Tech และการเชื่อมโยงผู้ประกอบการภาคเหนือสู่ตลาดระดับประเทศ",
    status: "published",
    clippingList: [
      { name: "กรุงเทพธุรกิจ ออนไลน์", url: "https://bangkokbiznews.com", date: "2026-09-12" },
      { name: "ไทยรัฐ ฉบับพิมพ์", url: "#", date: "2026-09-13" },
      { name: "Thai PBS รายการจับตาสถานการณ์", url: "#", date: "2026-09-12" }
    ]
  },
  {
    id: "pr-002",
    code: "RSP-PR-2026-002",
    universityId: "mju",
    title: "มหาวิทยาลัยแม่โจ้ หนุนสตาร์ตอัปเกษตรอัจฉริยะ คว้ารางวัลชนะเลิศระดับชาติ โครงการ IRTC 2026",
    date: "2026-09-08",
    targetAudience: "ข่าว Success case",
    mediaTypes: ["online", "print"],
    clippingsCount: 10,
    prValue: 280000,
    newsUrl: "https://www.thairath.co.th/news/mju-irtc-winner",
    reporterName: "อ.ดร.ปรเมศวร์ มั่นคง",
    reporterContact: "089-756-3321",
    details: "ผลงานทีมวิจัยและนักศึกษาแม่โจ้ในการใช้ชีวภัณฑ์ลดการใช้สารเคมีในแปลงผักอินทรีย์",
    status: "published"
  },
  {
    id: "pr-003",
    code: "RSP-PR-2026-003",
    universityId: "nu",
    title: "อุทยานวิทยาศาสตร์ ม.นเรศวร จับมือภาคเอกชน เปิดตัวสารสกัดสมุนไพรลดริ้วรอยจากใบมะม่วงมหาชนก",
    date: "2026-09-02",
    targetAudience: "ข่าวประชาสัมพันธ์บริการ",
    mediaTypes: ["online", "tv"],
    clippingsCount: 12,
    prValue: 350000,
    newsUrl: "https://mgronline.com/local/nu-herb-cosmetics",
    reporterName: "คุณชานนท์ สว่างอารมณ์",
    reporterContact: "084-332-9090",
    details: "ถ่ายทอดเทคโนโลยีสู่ภาคอุตสาหกรรมเครื่องสำอางไทย พร้อมจำหน่ายตลาดเอเชีย",
    status: "published"
  },
  {
    id: "pr-004",
    code: "RSP-PR-2026-004",
    universityId: "mfu",
    title: "ม.แม่ฟ้าหลวง ผลักดันผู้ประกอบการชาอัสสัมเชียงราย สู่ผลิตภัณฑ์ Well-being ระดับพรีเมียม",
    date: "2026-08-28",
    targetAudience: "ข่าว Success case",
    mediaTypes: ["online", "print"],
    clippingsCount: 8,
    prValue: 210000,
    newsUrl: "https://www.chiangmaicitylife.com/mfu-assam-tea",
    reporterName: "คุณลลิตา ธนาพงศ์",
    reporterContact: "086-901-2244",
    details: "โครงการพัฒนาชาพื้นถิ่นภาคเหนือสู่ผลิตภัณฑ์ชะลอวัยด้วยวิทยาศาสตร์อาหาร",
    status: "published"
  },
  {
    id: "pr-005",
    code: "RSP-PR-2026-005",
    universityId: "up",
    title: "ม.พะเยา ขับเคลื่อนเศรษฐกิจฐานราก ถ่ายทอดองค์ความรู้การเพาะเลี้ยงแมลงโปรตีนทางเลือก (BSF) สู่ชุมชน",
    date: "2026-08-22",
    targetAudience: "ข่าวประชาสัมพันธ์บริการ",
    mediaTypes: ["online"],
    clippingsCount: 7,
    prValue: 160000,
    newsUrl: "https://www.posttoday.com/up-bsf-protein",
    reporterName: "คุณกฤษณะ แก้วคำ",
    reporterContact: "081-889-4455",
    details: "การบริหารจัดการขยะอินทรีย์และการสร้างรายได้เสริมให้กลุ่มเกษตรกรจังหวัดพะเยา",
    status: "published"
  },
  {
    id: "pr-006",
    code: "RSP-PR-2026-006",
    universityId: "rmutl",
    title: "มทร.ล้านนา ประกาศความสำเร็จนวัตกรรมเครื่องขึ้นรูปเซรามิกประหยัดพลังงาน ช่วยผู้ประกอบการลำปางลดต้นทุน 40%",
    date: "2026-08-15",
    targetAudience: "ข่าว Success case",
    mediaTypes: ["online", "print", "tv"],
    clippingsCount: 15,
    prValue: 460000,
    newsUrl: "https://www.thansettakij.com/rmutl-ceramic-tech",
    reporterName: "ดร.วิโรจน์ แสนสมบูรณ์",
    reporterContact: "083-221-8877",
    details: "เครื่องขึ้นรูประบบกึ่งอัตโนมัติที่พัฒนาโดยอาจารย์และนักศึกษาสาขาวิศวกรรมศาสตร์",
    status: "published"
  },
  {
    id: "pr-007",
    code: "RSP-PR-2026-007",
    universityId: "cmru",
    title: "มรภ.เชียงใหม่ ปลุกกระแสผ้าทอย้อมสีธรรมชาติล้านนาประยุกต์ ชนะเลิศประกวดนวัตกรรมสร้างสรรค์ R2M ระดับภาคเหนือ",
    date: "2026-08-08",
    targetAudience: "ข่าวประชาสัมพันธ์ (โครงการที่รับสมัครจะต้องไม่เป็นโครงการที่ทำเหมือนกันทุกมหาวิทยาลัย)",
    mediaTypes: ["online"],
    clippingsCount: 9,
    prValue: 190000,
    newsUrl: "https://www.khaosod.co.th/cmru-r2m-weaving",
    reporterName: "คุณปิยะพร คำมูล",
    reporterContact: "087-654-3210",
    details: "การนำสูตรสีธรรมชาติจากใบสักและดอกทองกวาวมาย้อมเส้นใยไหมประยุกต์",
    status: "published"
  },
  {
    id: "pr-008",
    code: "RSP-PR-2026-008",
    universityId: "crru",
    title: "มรภ.เชียงราย เปิดศูนย์บ่มเพาะวิสาหกิจชุมชนชายแดน ผลักดันผลไม้แปรรูปข้ามพรมแดนสู่ยูนนาน",
    date: "2026-07-29",
    targetAudience: "ข่าวผู้บริหารกระทรวง อว. ลงพื้นที่ติดตามงาน หรือประชุม ที่เกี่ยวข้องกับเครือข่ายมหาวิทยาลัยฯ",
    mediaTypes: ["online", "print"],
    clippingsCount: 11,
    prValue: 270000,
    newsUrl: "https://www.matichon.co.th/crru-cross-border-biz",
    reporterName: "คุณสมพร อินต๊ะ",
    reporterContact: "089-112-4433",
    details: "การจับคู่เจรจาธุรกิจออนไลน์กับกลุ่มทุนการค้าปลีกมณฑลยูนนาน ประเทศจีน",
    status: "published"
  },
  {
    id: "pr-009",
    code: "RSP-PR-2026-009",
    universityId: "psru",
    title: "มรภ.พิบูลสงคราม พัฒนาชุดตรวจคัดกรองเชื้อโรคในกล้วยตากบางกระทุ่ม สร้างมาตรฐานส่งออกสู่ยุโรป",
    date: "2026-07-18",
    targetAudience: "ข่าวผู้บริหารเข้าร่วมกิจกรรมของกระทรวง อว.",
    mediaTypes: ["online", "print"],
    clippingsCount: 8,
    prValue: 200000,
    newsUrl: "https://www.dailynews.co.th/psru-dried-banana",
    reporterName: "คุณชัยยุทธ ทองดี",
    reporterContact: "082-334-5566",
    details: "นวัตกรรมเซ็นเซอร์ชีวภาพตรวจจับความชื้นและจุลินทรีย์แบบแม่นยำสูง",
    status: "published"
  },
  {
    id: "pr-010",
    code: "RSP-PR-2026-010",
    universityId: "uru",
    title: "มรภ.อุตรดิตถ์ ต่อยอดงานวิจัยเปลือกทุเรียนหลิน-หลงลับแล ผลิตสารเคลือบยืดอายุผลไม้สด ลดการสูญเสีย",
    date: "2026-07-05",
    targetAudience: "ข่าวการจัดกิจกรรม/โครงการ",
    mediaTypes: ["online", "tv"],
    clippingsCount: 13,
    prValue: 390000,
    newsUrl: "https://www.tnnthailand.com/uru-durian-coating",
    reporterName: "คุณณิชา มณีรัตน์",
    reporterContact: "085-667-8899",
    details: "การแปรรูปเปลือกทุเรียนเหลือทิ้งเป็นไบโอพอลิเมอร์ปลอดภัยเกรดอาหาร",
    status: "published"
  }
];

export default function RspPressReport() {
  const [activeTab, setActiveTab] = useState<"records" | "form" | "dashboard">("records");
  const [records, setRecords] = useState<PressReleaseItem[]>(INITIAL_PRESS_RELEASES);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUniversity, setFilterUniversity] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [selectedPreview, setSelectedPreview] = useState<PressReleaseItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const supabase = createClient();

  // Load persisted records from Supabase cloud with fallback to LocalStorage
  useEffect(() => {
    async function loadCloudRsp() {
      try {
        const cloudData = await getCloudJson<PressReleaseItem[]>(
          CLOUD_KEYS.RSP_PRESS_RECORDS,
          "cc_rsp_press_records_v1"
        );
        if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
          setRecords(cloudData);
        } else {
          setRecords(INITIAL_PRESS_RELEASES);
        }
      } catch (e) {
        console.warn("Failed to load RSP records from cloud:", e);
      }
    }
    loadCloudRsp();
  }, []);

  // Copy share form URL handler
  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/rsp-press-form`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Form State matching ClickUp structure (no PR value / money binding)
  const [formData, setFormData] = useState({
    universityId: "cmu",
    title: "",
    date: new Date().toISOString().split("T")[0],
    targetAudience: "",
    mediaTypes: ["online"] as string[],
    clippingsCount: 1,
    newsUrl: "",
    reporterName: "",
    reporterContact: "",
    details: "",
    attachmentName: ""
  });

  // ==========================================
  // Options for ModernSelect Dropdowns (Matching media_1789635624567.png)
  // ==========================================
  const universityOptions: ModernSelectOption[] = useMemo(() => {
    return RSP_UNIVERSITIES.map(u => ({
      value: u.id,
      label: u.name,
      desc: "เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ",
      icon: (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
          style={{ backgroundColor: u.color }}
        />
      )
    }));
  }, []);

  const categoryOptions: ModernSelectOption[] = useMemo(() => {
    const descMap: Record<string, string> = {
      "ข่าวการจัดกิจกรรม/โครงการ": "กิจกรรม/โครงการที่เกี่ยวข้องหรือได้รับงบประมาณจาก RSP North และ กปว.",
      "ข่าวผู้บริหารเข้าร่วมกิจกรรมของกระทรวง อว.": "ข่าวกิจกรรม/โครงการที่มีผู้บริหารของกระทรวง อว., สป.อว. และ กปว. เข้าร่วม",
      "ข่าวผู้บริหารกระทรวง อว. ลงพื้นที่ติดตามงาน หรือประชุม ที่เกี่ยวข้องกับเครือข่ายมหาวิทยาลัยฯ": "ข่าวการลงพื้นที่ตรวจเยี่ยม ติดตามงาน หรือการประชุมร่วมกับเครือข่ายมหาวิทยาลัย",
      "ข่าวประชาสัมพันธ์ (โครงการที่รับสมัครจะต้องไม่เป็นโครงการที่ทำเหมือนกันทุกมหาวิทยาลัย)": "ประชาสัมพันธ์การจัดกิจกรรม/โครงการที่ไม่ซ้ำซ้อนกับโครงการหลักของเครือข่าย",
      "ข่าวประชาสัมพันธ์บริการ": "ประชาสัมพันธ์บริการห้องปฏิบัติการ โครงสร้างพื้นฐาน หรือบริการอุทยานวิทยาศาสตร์",
      "ข่าว Success case": "กรณีศึกษาความสำเร็จ ผู้ประกอบการ ผลงานวิจัย หรือนวัตกรรมที่เกิดผลสัมฤทธิ์เด่นชัด"
    };

    return PRESS_CATEGORIES.map(cat => ({
      value: cat.name,
      label: cat.name,
      desc: descMap[cat.name] || "ประเภทข่าวกิจกรรมและโครงการเครือข่าย RSP North",
      icon: (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
          style={{ backgroundColor: cat.color }}
        />
      )
    }));
  }, []);

  const universityFilterOptions: ModernSelectOption[] = useMemo(() => {
    return [
      {
        value: "all",
        label: "ทุกมหาวิทยาลัย (14 สถาบัน)",
        desc: "แสดงข้อมูลข่าวประชาสัมพันธ์ครบทั้ง 14 มหาวิทยาลัยเครือข่าย"
      },
      ...RSP_UNIVERSITIES.map(u => ({
        value: u.id,
        label: u.name,
        desc: "เครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ",
        icon: (
          <span
            className="w-2 h-2 rounded-full shrink-0 inline-block"
            style={{ backgroundColor: u.color }}
          />
        )
      }))
    ];
  }, []);

  const categoryFilterOptions: ModernSelectOption[] = useMemo(() => {
    return [
      {
        value: "all",
        label: "ทุกประเภทข่าว (6 ประเภท)",
        desc: "แสดงข่าวทุกประเภทกิจกรรม/โครงการ"
      },
      ...categoryOptions
    ];
  }, [categoryOptions]);

  // Handle Form Submission: Two-way sync to Press Log & Assignments Board
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("กรุณากรอกหัวข้อข่าวประชาสัมพันธ์");
      return;
    }
    if (!formData.targetAudience.trim()) {
      alert("กรุณาเลือกประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่");
      return;
    }

    const newCode = `RSP-PR-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
    const newItem: PressReleaseItem = {
      id: `pr-${Date.now()}`,
      code: newCode,
      universityId: formData.universityId,
      title: formData.title.trim(),
      date: formData.date,
      targetAudience: formData.targetAudience,
      mediaTypes: formData.mediaTypes.length > 0 ? formData.mediaTypes : ["online"],
      clippingsCount: Number(formData.clippingsCount) || 1,
      newsUrl: formData.newsUrl.trim(),
      reporterName: formData.reporterName.trim() || "ไม่ระบุ",
      reporterContact: formData.reporterContact.trim(),
      details: formData.details.trim(),
      status: "published",
      clippingList: formData.newsUrl ? [{ name: "ข่าวออนไลน์", url: formData.newsUrl, date: formData.date }] : []
    };

    const updatedRecords = [newItem, ...records];
    setRecords(updatedRecords);

    // 1. Sync ทางแรก: บันทึกข้อมูลขึ้น Supabase Cloud + LocalStorage
    setCloudJson(CLOUD_KEYS.RSP_PRESS_RECORDS, updatedRecords, "cc_rsp_press_records_v1");

    // 2. Sync ทางที่สอง: ซิงค์ไปหน้าบอร์ดรวม (Task Board / AssignmentsView)
    // งาน internal โอ๊ตเป็นคนทำ (โอ๊ต CNB) ประเภทงาน: เขียนข่าว ( นอกเหนือจาก Task งาน ) ภาระงานของ RSP มูลค่าประหยัด 1,500 บาท
    const uni = RSP_UNIVERSITIES.find(u => u.id === formData.universityId);
    const uniName = uni ? uni.name : formData.universityId;
    const taskTitle = `[RSP] ข่าวประชาสัมพันธ์: ${formData.title.trim()} (${uniName})`;
    const OAT_ID = "e2c2672d-81c4-411d-89e9-bcbb6eb374f5";
    const OAT_NAME = "โอ๊ต CNB";

    try {
      await supabase.from("briefs").insert([{
        project_name: taskTitle,
        unit: "internal",
        status: "pending",
        priority: "Medium",
        assignee_id: OAT_ID,
        coordinator_nickname: formData.reporterName.trim(),
        requester_email: formData.reporterContact.trim() || "chonnikarn@step.cmu.ac.th",
        decision_maker: uniName,
        deadline: formData.date,
        details: {
          category: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          type: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          service: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          work_organization: "RSP",
          internal_organization: "RSP",
          organization: "RSP",
          organization_type: "government",
          client_sector: "government",
          pm_work_type: "pr",
          pm_work_category: formData.targetAudience || "ข่าวการจัดกิจกรรม/โครงการ",
          service_category: formData.targetAudience || "ข่าวการจัดกิจกรรม/โครงการ",
          save_cost: 1500,
          project_value: "1500",
          revenue: 1500,
          cost: 0,
          profit: 1500,
          assignee_name: OAT_NAME,
          university_id: formData.universityId,
          university_name: uniName,
          target_audience: formData.targetAudience,
          publish_date: formData.date,
          news_url: formData.newsUrl.trim(),
          attachment_name: formData.attachmentName,
          description: formData.details.trim(),
          reporter_name: formData.reporterName.trim(),
          reporter_contact: formData.reporterContact.trim(),
          rsp_code: newCode,
          source: "rsp_press_form"
        }
      }]);
    } catch (supabaseErr) {
      console.error("Error syncing brief to Supabase:", supabaseErr);
    }

    // Reset Form
    setFormData({
      universityId: "cmu",
      title: "",
      date: new Date().toISOString().split("T")[0],
      targetAudience: "",
      mediaTypes: ["online"],
      clippingsCount: 1,
      newsUrl: "",
      reporterName: "",
      reporterContact: "",
      details: "",
      attachmentName: ""
    });

    setActiveTab("records");
  };

  // Timeframe and Date Range Filter State
  const [timeframe, setTimeframe] = useState<StockTimeframe>("ALL");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const handleCustomDateChange = (type: "start" | "end", dateStr: string) => {
    setTimeframe("CUSTOM");
    if (type === "start") {
      setFilterStartDate(dateStr);
    } else {
      setFilterEndDate(dateStr);
    }
  };

  const handleTimeframeChange = (tf: StockTimeframe) => {
    setTimeframe(tf);
    const today = new Date();

    switch (tf) {
      case "1D": {
        const todayStr = format(today, "yyyy-MM-dd");
        setFilterStartDate(todayStr);
        setFilterEndDate(todayStr);
        break;
      }
      case "1W": {
        const start = new Date(today);
        start.setDate(today.getDate() - 7);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "1M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "3M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "6M": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 6);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "1Y": {
        const start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "YTD": {
        const start = new Date(today.getFullYear(), 0, 1);
        setFilterStartDate(format(start, "yyyy-MM-dd"));
        setFilterEndDate(format(today, "yyyy-MM-dd"));
        break;
      }
      case "ALL": {
        setFilterStartDate("");
        setFilterEndDate("");
        break;
      }
    }
  };

  const parsedStartDate = useMemo(() => {
    if (!filterStartDate) return null;
    try {
      const parts = filterStartDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return isValid(parseISO(filterStartDate)) ? parseISO(filterStartDate) : null;
    } catch {
      return null;
    }
  }, [filterStartDate]);

  const parsedEndDate = useMemo(() => {
    if (!filterEndDate) return null;
    try {
      const parts = filterEndDate.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return isValid(parseISO(filterEndDate)) ? parseISO(filterEndDate) : null;
    } catch {
      return null;
    }
  }, [filterEndDate]);

  // Date Filtered Records
  const dateFilteredRecords = useMemo(() => {
    return records.filter(item => {
      if (!item.date) return true;
      if (filterStartDate && item.date < filterStartDate) return false;
      if (filterEndDate && item.date > filterEndDate) return false;
      return true;
    });
  }, [records, filterStartDate, filterEndDate]);

  // Filtered Records for Table
  const filteredRecords = useMemo(() => {
    return dateFilteredRecords.filter(item => {
      const uni = RSP_UNIVERSITIES.find(u => u.id === item.universityId);
      const uniName = uni ? uni.name : "";
      const matchSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uniName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reporterName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchUni = filterUniversity === "all" || item.universityId === filterUniversity;
      const matchAudience = filterAudience === "all" || item.targetAudience === filterAudience;

      return matchSearch && matchUni && matchAudience;
    });
  }, [dateFilteredRecords, searchTerm, filterUniversity, filterAudience]);

  // Overall Statistics (Without PR Value)
  const overallStats = useMemo(() => {
    const totalReleases = dateFilteredRecords.length;
    const totalClippings = dateFilteredRecords.reduce((sum, r) => sum + r.clippingsCount, 0);
    const avgClippings = totalReleases > 0 ? (totalClippings / totalReleases).toFixed(1) : "0";
    const activeUnisCount = new Set(dateFilteredRecords.map(r => r.universityId)).size;

    return {
      totalReleases,
      totalClippings,
      avgClippings,
      activeUnisCount
    };
  }, [dateFilteredRecords]);

  // Category Comparison Statistics (เปรียบเทียบตามประเภทข่าว 6 ประเภท)
  const categoryComparison = useMemo(() => {
    const total = dateFilteredRecords.length;
    return PRESS_CATEGORIES.map(cat => {
      const count = dateFilteredRecords.filter(r => r.targetAudience === cat.name).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        ...cat,
        count,
        pct
      };
    }).sort((a, b) => b.count - a.count);
  }, [dateFilteredRecords]);

  const topCategory = useMemo(() => {
    if (categoryComparison.length === 0 || categoryComparison[0].count === 0) {
      return { name: "ไม่มีข้อมูล", count: 0, pct: 0 };
    }
    return categoryComparison[0];
  }, [categoryComparison]);

  const maxCategoryCount = useMemo(() => {
    return Math.max(...categoryComparison.map(c => c.count), 1);
  }, [categoryComparison]);

  // University-by-University Comparison Statistics
  const universityComparison = useMemo(() => {
    const total = dateFilteredRecords.length;
    return RSP_UNIVERSITIES.map(uni => {
      const uniRecords = dateFilteredRecords.filter(r => r.universityId === uni.id);
      const count = uniRecords.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const totalClippings = uniRecords.reduce((sum, r) => sum + r.clippingsCount, 0);

      // Media breakdown
      let onlineCount = 0;
      let printCount = 0;
      let tvCount = 0;
      uniRecords.forEach(r => {
        if (r.mediaTypes.includes("online")) onlineCount++;
        if (r.mediaTypes.includes("print")) printCount++;
        if (r.mediaTypes.includes("tv")) tvCount++;
      });

      return {
        ...uni,
        count,
        pct,
        totalClippings,
        onlineCount,
        printCount,
        tvCount
      };
    }).sort((a, b) => b.count - a.count);
  }, [dateFilteredRecords]);

  const maxReleases = useMemo(() => {
    return Math.max(...universityComparison.map(u => u.count), 1);
  }, [universityComparison]);

  // Export CSV Handler (Without PR Value)
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "รหัสข่าว",
      "สถาบัน / มหาวิทยาลัย",
      "หัวข้อข่าวประชาสัมพันธ์",
      "วันที่เผยแพร่",
      "ประเภทข่าวกิจกรรม/โครงการ",
      "ประเภทสื่อ",
      "จำนวน Clippings (สำนักข่าว)",
      "ผู้รายงานข่าว",
      "เบอร์โทร/อีเมลติดต่อ",
      "ลิงก์ข่าว"
    ];

    const rows = filteredRecords.map(item => {
      const uni = RSP_UNIVERSITIES.find(u => u.id === item.universityId);
      const uniName = uni ? uni.name : item.universityId;
      const mediaLabel = item.mediaTypes.join(", ");

      return [
        `"${item.code}"`,
        `"${uniName}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.date}"`,
        `"${item.targetAudience}"`,
        `"${mediaLabel}"`,
        item.clippingsCount,
        `"${item.reporterName}"`,
        `"${item.reporterContact}"`,
        `"${item.newsUrl}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RSP_Press_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP TAB NAVIGATION: EXACT RED CAPSULE STYLE MATCHING SYSTEM STANDARD      */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex-1 shrink-0 sm:shrink min-w-fit justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "records"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <Newspaper size={15} />
            <span>1. รายการข่าวประชาสัมพันธ์ (Press Log)</span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 shrink-0 sm:shrink min-w-fit justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <BarChart3 size={15} />
            <span>2. แดชบอร์ดเปรียบเทียบแต่ละมหาวิทยาลัย</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIME & DATE RANGE FILTER TOOLBAR (MATCHING SYSTEM STANDARD)               */}
      {/* ========================================================================= */}
      {activeTab !== "form" && (
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Timeframe Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              เวลา:
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs flex-wrap">
              {(
                [
                  { id: "1D", label: "1D", desc: "วันนี้" },
                  { id: "1W", label: "1W", desc: "7 วันที่ผ่านมา" },
                  { id: "1M", label: "1M", desc: "30 วันที่ผ่านมา" },
                  { id: "3M", label: "3M", desc: "3 เดือนที่ผ่านมา" },
                  { id: "6M", label: "6M", desc: "6 เดือนที่ผ่านมา" },
                  { id: "1Y", label: "1Y", desc: "1 ปีที่ผ่านมา" },
                  { id: "YTD", label: "YTD", desc: "ตั้งแต่ต้นปีถึงปัจจุบัน" },
                  { id: "ALL", label: "ALL", desc: "ข้อมูลทั้งหมด" }
                ] as const
              ).map(tf => (
                <button
                  key={tf.id}
                  onClick={() => handleTimeframeChange(tf.id)}
                  title={tf.desc}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeframe === tf.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Date Pickers + Count */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar size={13} className="text-orange-500 shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-500 font-sans">เริ่ม:</span>
                <DatePicker
                  selected={parsedStartDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      handleCustomDateChange("start", `${y}-${m}-${day}`);
                    } else {
                      handleCustomDateChange("start", "");
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วว/ดด/ปปปป"
                  isClearable
                  popperClassName="z-[9999]"
                  className="w-[98px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
                <span className="text-slate-400 font-sans px-0.5">ถึง</span>
                <DatePicker
                  selected={parsedEndDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      handleCustomDateChange("end", `${y}-${m}-${day}`);
                    } else {
                      handleCustomDateChange("end", "");
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="วว/ดด/ปปปป"
                  isClearable
                  popperClassName="z-[9999]"
                  className="w-[98px] bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:outline-none rounded-md px-1.5 py-0.5 text-center cursor-pointer shadow-2xs text-xs font-mono transition-colors"
                />
              </div>
              <span className="text-slate-300 font-light mx-0.5">|</span>
              <span className="text-slate-600 font-bold">
                ({filteredRecords.length} งาน)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PRESS RELEASE LOG & RECORDS TABLE                                  */}
      {/* ========================================================================= */}
      {activeTab === "records" && (
        <div className="space-y-5">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper size={13} className="text-blue-500" />
                <span>ข่าวประชาสัมพันธ์รวม</span>
              </span>
              <div className="my-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{overallStats.totalReleases} ฉบับ</h4>
              </div>
              <p className="text-[10.5px] text-blue-600 font-medium">เผยแพร่ครบ 14 มหาวิทยาลัยเครือข่าย</p>
            </div>

            {/* Requirement 3: Replaced PR Value with Top Category */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-rose-500" />
                <span>ประเภทข่าวสูงสุด</span>
              </span>
              <div className="my-2">
                <h4 className="text-sm font-black text-slate-900 tracking-tight truncate" title={topCategory.name}>
                  {topCategory.name}
                </h4>
              </div>
              <p className="text-[10.5px] text-rose-600 font-medium">{topCategory.count} ข่าว ({topCategory.pct}% ของทั้งหมด)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} className="text-purple-500" />
                <span>การลงข่าว (Clippings)</span>
              </span>
              <div className="my-2">
                <h4 className="text-2xl font-black text-purple-700 tracking-tight">{overallStats.totalClippings} ครั้ง</h4>
              </div>
              <p className="text-[10.5px] text-purple-600 font-medium">เฉลี่ย {overallStats.avgClippings} สื่อต่อข่าว</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-orange-500" />
                <span>มหาวิทยาลัยที่ส่งข่าว</span>
              </span>
              <div className="my-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{overallStats.activeUnisCount} / 14 มหาวิทยาลัย</h4>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium">เครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาหัวข้อข่าว, มหาวิทยาลัย, รหัส หรือผู้รายงาน..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                  title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.csv ภาษาไทยสมบูรณ์)"
                >
                  <Download size={14} />
                  <span>ดาวน์โหลด Excel</span>
                </button>

                <button
                  onClick={() => setActiveTab("form")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E03131] hover:bg-[#c92a2a] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>บันทึกข่าวใหม่</span>
                </button>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Filter size={12} /> ตัวกรอง:
              </span>

              {/* University Filter */}
              <div className="w-64">
                <ModernSelect
                  value={filterUniversity}
                  onChange={(val) => setFilterUniversity(val)}
                  options={universityFilterOptions}
                  placeholder="ทุกมหาวิทยาลัย (14 สถาบัน)"
                  searchPlaceholder="ค้นหาชื่อมหาวิทยาลัย..."
                  searchable={true}
                  className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-1.5 px-3.5 text-xs shadow-2xs"
                />
              </div>

              {/* Audience Filter */}
              <div className="w-72">
                <ModernSelect
                  value={filterAudience}
                  onChange={(val) => setFilterAudience(val)}
                  options={categoryFilterOptions}
                  placeholder="ทุกประเภทข่าว (6 ประเภท)"
                  searchPlaceholder="ค้นหาประเภทข่าว..."
                  searchable={true}
                  className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-1.5 px-3.5 text-xs shadow-2xs"
                />
              </div>

              <span className="text-slate-400 font-mono ml-auto">
                พบ {filteredRecords.length} จาก {records.length} ข่าว
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Newspaper size={16} className="text-blue-600" />
                <span>รายงานการเผยแพร่ข่าวประชาสัมพันธ์ (RSP Press Release Log)</span>
              </h4>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  ไม่พบข้อมูลข่าวประชาสัมพันธ์ตามเงื่อนไขที่ค้นหา
                </div>
              ) : (
                filteredRecords.map(item => {
                  const uni = RSP_UNIVERSITIES.find(u => u.id === item.universityId);
                  const cat = PRESS_CATEGORIES.find(c => c.name === item.targetAudience);

                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* University Badge with exact color */}
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                            style={{ backgroundColor: uni?.color || "#3b82f6" }}
                          >
                            {uni?.name || "ไม่ระบุ"}
                          </span>

                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {item.code}
                          </span>

                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} /> {item.date}
                          </span>

                          <span
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                            style={{ backgroundColor: cat ? cat.color : "#64748b" }}
                          >
                            {item.targetAudience}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                          {item.title}
                        </h5>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>
                            สื่อที่เผยแพร่: <strong>{item.clippingsCount} สำนักข่าว</strong>
                          </span>
                          <span>•</span>
                          <span>
                            ช่องทางสื่อ: <strong className="text-slate-700">{item.mediaTypes.map(m => m.toUpperCase()).join(", ")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            ผู้รายงาน: <strong className="text-slate-700">{item.reporterName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.newsUrl && (
                          <a
                            href={item.newsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
                          >
                            <ExternalLink size={13} />
                            <span>เปิดลิงก์ข่าว</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedPreview(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>ดู Clipping</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRESS RELEASE INTAKE FORM (CLICKUP REPLICA IN CC SYSTEM STYLE)     */}
      {/* ========================================================================= */}
      {activeTab === "form" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Banner & Official RSP Rules */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("records")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
                >
                  <ArrowLeft size={14} />
                  <span>กลับสู่รายการข่าวประชาสัมพันธ์</span>
                </button>

                {/* ปุ่มคัดลอกลิงก์แชร์ฟอร์ม (Requirement 2) */}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 w-fit ${
                    copiedLink
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  title="คัดลอกลิงก์สำหรับส่งให้ผู้ประสานงาน 14 มหาวิทยาลัยกรอกข้อมูลข่าว"
                >
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{copiedLink ? "คัดลอกลิงก์สำเร็จแล้ว!" : "คัดลอกลิงก์แชร์ฟอร์ม"}</span>
                </button>
              </div>

              {/* Requirement 1: Form title separated into two lines with English subtitle underneath & Dieter Rams Orange Banner */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#E8590C] text-white space-y-3 mt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 text-white text-xs font-bold backdrop-blur-xs">
                  <Building2 size={14} />
                  <span>เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ 14 สถาบัน</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                  <div>แบบฟอร์มงานประชาสัมพันธ์</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white/95 mt-2.5">
                    เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ
                  </div>
                </h2>
                <p className="text-sm sm:text-base font-semibold text-white/90 pt-1">
                  (Regional Science Park Northern Network PR Form : RSP NORTH)
                </p>
              </div>
              <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
                <p>
                  ต้องเป็นข่าวกิจกรรม/โครงการ<u className="font-bold text-slate-900">ที่เกี่ยวข้องหรือได้รับงบประมาณ</u> จากอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ และ สำนักงานปลัดกระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (สป.อว.) เท่านั้น!!! กิจกรรม/โครงการในนามอุทยานฯ ของท่าน
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 font-medium text-xs">
                  <li>การกรอกข้อมูลข่าวกิจกรรม/โครงการ ให้ใช้ 1 แบบฟอร์มต่อ 1 ประเภทงานประชาสัมพันธ์</li>
                  <li>เจ้าหน้าที่สื่อสารองค์กร RSP North จะดำเนินการตรวจสอบเนื้อหากิจกรรม/โครงการ ก่อนดำเนินการโพสต์ใน Facebook page : RSP North</li>
                </ol>
              </div>
            </div>

            {/* Intake Form */}
            <form onSubmit={handleFormSubmit} className="space-y-8 pt-2">
              
              {/* ========================================== */}
              {/* ส่วนที่ 1: ข้อมูลทั่วไป                      */}
              {/* ========================================== */}
              <div className="space-y-5">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  ส่วนที่ 1: ข้อมูลทั่วไป
                </h3>

                {/* 1.1 ชื่อเล่นผู้ประสานงาน* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>😎</span>
                    <span>ชื่อเล่นผู้ประสานงาน</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter text"
                    value={formData.reporterName}
                    onChange={e => setFormData({ ...formData, reporterName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 1.2 อีเมล* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>📫</span>
                    <span>อีเมล</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email"
                    value={formData.reporterContact}
                    onChange={e => setFormData({ ...formData, reporterContact: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 1.3 สังกัดเครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>สังกัดเครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernSelect
                    value={formData.universityId}
                    onChange={(val) => setFormData({ ...formData, universityId: val })}
                    options={universityOptions}
                    placeholder="เลือกสังกัดมหาวิทยาลัยเครือข่าย..."
                    searchPlaceholder="ค้นหาชื่อมหาวิทยาลัย..."
                    searchable={true}
                    className="rounded-full bg-white border-slate-200 py-3 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300 transition-all"
                  />
                </div>
              </div>

              {/* ========================================== */}
              {/* ส่วนที่ 2: ประเภทข่าวกิจกรรม/โครงการ          */}
              {/* ========================================== */}
              <div className="space-y-5 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    ส่วนที่ 2: ประเภทข่าวกิจกรรม/โครงการ
                  </h3>

                  {/* ข้อกำหนดประเภทข่าว */}
                  <div className="mt-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 text-xs sm:text-xs leading-relaxed text-slate-600">
                    <h4 className="font-bold text-slate-900">ข้อกำหนดประเภทข่าว</h4>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่ได้รับงบจาก RSP North และ กปว. เท่านั้น</u> เช่น จากแผนงาน 4P/7P/บัดดี้-บัดเดอร์/โครงการบริหารจัดการอุทยานฯ
                      </li>
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่มีผู้บริหารเครือข่ายอุทยานฯ เข้าร่วมกิจกรรมนั้น ๆ</u>
                      </li>
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่มีผู้บริหารของกระทรวง อว., สป.อว. และ กปว. เข้าร่วม</u>
                      </li>
                      <li>
                        ข่าวประชาสัมพันธ์ เช่น ประชาสัมพันธ์การจัดกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่ได้รับงบจากกระทรวง อว. หรือ กปว. โดยจะต้องไม่ใช่ข่าวประชาสัมพันธ์ที่ได้รับงบประมาณให้ทำเหมือนกันทุกมหาวิทยาลัย</u> เช่น การประกาศรับสมัครผู้ประกอบการ, นักศึกษา P1/R2M/IRTC เป็นต้น
                      </li>
                    </ol>
                  </div>
                </div>

                {/* 2.1 ชื่อข่าว/กิจกรรม/โครงการ* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>ชื่อข่าว/กิจกรรม/โครงการ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.2 รายละเอียดข่าวโดยสังเขป (ใคร/ ทำอะไร/ ที่ไหน/ ความเกี่ยวข้อง/ ผลลัพธ์ที่เกิด)* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>รายละเอียดข่าวโดยสังเขป (ใคร/ ทำอะไร/ ที่ไหน/ ความเกี่ยวข้อง/ ผลลัพธ์ที่เกิด)</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter text"
                    value={formData.details}
                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.3 ประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🎉</span>
                    <span>ประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernSelect
                    value={formData.targetAudience}
                    onChange={(val) => setFormData({ ...formData, targetAudience: val })}
                    options={categoryOptions}
                    placeholder="เลือกประเภทข่าวกิจกรรม/โครงการ..."
                    searchPlaceholder="ค้นหาประเภทข่าว (เช่น กิจกรรม, ผู้บริหาร, ประชาสัมพันธ์, Success case)..."
                    searchable={true}
                    className="rounded-full bg-white border-slate-200 py-3 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300 transition-all"
                  />
                </div>

                {/* 2.4 วันที่ต้องการประชาสัมพันธ์ข่าว/กิจกรรม/โครงการ* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>วันที่ต้องการประชาสัมพันธ์ข่าว/กิจกรรม/โครงการ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernDatePicker
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    placeholder="เลือกวันที่ต้องการประชาสัมพันธ์..."
                    required={true}
                    className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-2.5 px-4 text-xs sm:text-sm shadow-2xs"
                  />
                </div>

                {/* 2.5 ลิงก์ข่าวกิจกรรม/โครงการ ที่ดำเนินการเผยแพร่เรียบร้อยแล้ว */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>ลิงก์ข่าวกิจกรรม/โครงการ ที่ดำเนินการเผยแพร่เรียบร้อยแล้ว</span>
                  </label>
                  <input
                    type="url"
                    placeholder="Enter text"
                    value={formData.newsUrl}
                    onChange={e => setFormData({ ...formData, newsUrl: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.6 รูปภาพข่าวกิจกรรมที่เกี่ยวข้อง (อย่างน้อย 5 รูป) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>📷</span>
                    <span>รูปภาพข่าวกิจกรรมที่เกี่ยวข้อง (อย่างน้อย 5 รูป)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id="rsp-upload"
                      className="hidden"
                      onChange={e => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setFormData({ ...formData, attachmentName: `${files.length} ไฟล์ที่เลือกแล้ว` });
                        }
                      }}
                    />
                    <label htmlFor="rsp-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Paperclip size={24} className="text-slate-400" />
                      <p className="text-xs text-slate-500">
                        {formData.attachmentName ? (
                          <span className="font-bold text-emerald-600">{formData.attachmentName}</span>
                        ) : (
                          <>
                            Drop your files here to <span className="underline text-blue-600 font-medium">upload</span>
                          </>
                        )}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button & Cancel Button */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("records")}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#E03131] hover:bg-[#c92a2a] text-white text-sm font-black rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>ส่งแบบฟอร์มประชาสัมพันธ์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UNIVERSITY COMPARISON DASHBOARD (แดชบอร์ดเปรียบเทียบ 14 มหาวิทยาลัย) */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 bg-[#E03131] text-white rounded-xl shadow-xs shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  แดชบอร์ดเปรียบเทียบผลงาน 14 มหาวิทยาลัยเครือข่าย RSP ภาคเหนือ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เปรียบเทียบจำนวนข่าวประชาสัมพันธ์ (Press Releases), มูลค่าสื่อรวม (PR Value) และการเผยแพร่ผ่านช่องทางสื่อต่างๆ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                title="ดาวน์โหลดข้อมูลสรุปเปรียบเทียบเป็น Excel"
              >
                <Download size={14} />
                <span>ดาวน์โหลด Excel</span>
              </button>
            </div>
          </div>

          {/* Ranking & News Category Comparison Bar Charts (Requirements 3 & 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Comparison by News Category (เปรียบเทียบประเภทข่าวกิจกรรม/โครงการ 6 ประเภท) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers size={16} className="text-[#E03131] shrink-0" />
                    <span className="truncate">เปรียบเทียบประเภทข่าวกิจกรรม/โครงการ (Press Releases by Category)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">สัดส่วนการเผยแพร่แบ่งตาม 6 หมวดหมู่ประเภทข่าวเครือข่าย RSP</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#E03131] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shrink-0 whitespace-nowrap">
                  รวม 6 หมวดหมู่
                </span>
              </div>

              <div className="space-y-3.5">
                {categoryComparison.map((cat, idx) => {
                  const pct = maxCategoryCount > 0 ? (cat.count / maxCategoryCount) * 100 : 0;

                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 max-w-[72%]">
                          <span className="w-4 font-mono text-[11px] font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-bold text-slate-800 truncate" title={cat.name}>
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-slate-400 text-[11px] font-mono font-semibold whitespace-nowrap">({cat.pct}%)</span>
                          <span
                            className="font-mono font-bold text-white px-2 py-0.5 rounded-md text-[11px] shadow-2xs whitespace-nowrap"
                            style={{ backgroundColor: cat.color }}
                          >
                            {cat.count} ข่าว
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, cat.count > 0 ? 5 : 0)}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Comparison by Number of Press Releases (จำนวนข่าว) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Newspaper size={16} className="text-blue-600 shrink-0" />
                    <span>เปรียบเทียบจำนวนข่าว 14 มหาวิทยาลัย (Press Releases Count)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">ปริมาณการส่งข่าวเผยแพร่ผ่านเครือข่าย</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0 whitespace-nowrap">
                  รวม {overallStats.totalReleases} ข่าว
                </span>
              </div>

              <div className="space-y-3">
                {[...universityComparison]
                  .sort((a, b) => b.count - a.count)
                  .map((u, idx) => {
                    const pct = maxReleases > 0 ? (u.count / maxReleases) * 100 : 0;

                    return (
                      <div key={u.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 font-mono text-[11px] font-bold text-slate-400">{idx + 1}.</span>
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: u.color }}
                            />
                            <span className="font-bold text-slate-800">{u.name}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-[11px]">{u.totalClippings} Clippings</span>
                            <span className="font-mono font-bold text-slate-900 w-16 text-right">
                              {u.count} ข่าว
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(pct, u.count > 0 ? 4 : 0)}%`,
                              backgroundColor: u.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Detailed University Summary Table (Without PR Value) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-[#E03131]" />
                <span>ตารางเปรียบเทียบผลงานรายสถาบัน 14 มหาวิทยาลัย (Detailed Benchmark Matrix)</span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">สถาบัน / มหาวิทยาลัย</th>
                    <th className="py-3 px-3 text-center">จำนวนข่าว (ฉบับ)</th>
                    <th className="py-3 px-3 text-center">สัดส่วน (%)</th>
                    <th className="py-3 px-3 text-center">Clippings รวม</th>
                    <th className="py-3 px-4 text-center">ช่องทางสื่อที่ใช้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {universityComparison.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: u.color }}
                          />
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {u.count > 0 ? (
                          <span className="text-blue-600 font-bold">{u.count} ข่าว</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 font-bold">
                        {u.count > 0 ? `${u.pct}%` : "-"}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {u.totalClippings > 0 ? `${u.totalClippings} สื่อ` : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[10.5px]">
                          {u.onlineCount > 0 && (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              Online ({u.onlineCount})
                            </span>
                          )}
                          {u.printCount > 0 && (
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              Print ({u.printCount})
                            </span>
                          )}
                          {u.tvCount > 0 && (
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                              TV ({u.tvCount})
                            </span>
                          )}
                          {u.count === 0 && <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLIPPING PREVIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">หลักฐานการลงข่าว (Clipping Details)</h4>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">รหัสและสถาบัน</span>
                <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedPreview.code} • {RSP_UNIVERSITIES.find(u => u.id === selectedPreview.universityId)?.name}
                  </p>
                  {(() => {
                    const cat = PRESS_CATEGORIES.find(c => c.name === selectedPreview.targetAudience);
                    return (
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                        style={{ backgroundColor: cat ? cat.color : "#64748b" }}
                      >
                        {selectedPreview.targetAudience}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">หัวข้อข่าว</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed">
                  {selectedPreview.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10.5px] text-slate-500">จำนวน Clippings:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedPreview.clippingsCount} สำนักข่าว</p>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500">ช่องทางสื่อ:</span>
                  <p className="font-bold text-blue-600 text-sm mt-0.5">{selectedPreview.mediaTypes.map(m => m.toUpperCase()).join(", ")}</p>
                </div>
              </div>

              {selectedPreview.details && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">สรุปเนื้อหาข่าว</span>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    {selectedPreview.details}
                  </p>
                </div>
              )}

              {selectedPreview.newsUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">ลิงก์ข่าวออนไลน์</span>
                  <div className="mt-1">
                    <a
                      href={selectedPreview.newsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all flex items-center gap-1 font-mono"
                    >
                      <Link2 size={13} className="shrink-0" />
                      <span>{selectedPreview.newsUrl}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
