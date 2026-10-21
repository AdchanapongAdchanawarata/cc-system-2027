"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, Save, Target, User, Users, Layers, Briefcase, 
  Tag, DollarSign, TrendingUp, Sparkles, Check, AlertCircle, PiggyBank,
  Plus, Trash2, Building2, Palette, FileText, Megaphone
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getActivePricingList, ServicePriceItem, isInternalTaskRequiringEmail } from "@/utils/pricing";
import { generateNextTaskCode } from "@/utils/taskCodeService";
import ModernDatePicker from "@/components/ModernDatePicker";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";
import CustomSelect from "./CustomSelect";
import { OFFICIAL_STEP_TEAMS } from "@/utils/teamAnalytics";
import StepQuotationModal, { StepQuotationData, formatCurrency } from "./StepQuotationModal";
import { isOperationalAssignee, ensureCoreOperationalAssignees, getLoggedInAssigneeId } from "@/utils/memberProfile";
import { getSavedContact, saveContact } from "@/utils/contactMemory";
import { enforceCanonicalBriefIntegrity } from "@/utils/dataIntegrityGuard";

type OKR = { id: string; type: string; description: string };
type Assignee = { id: string; name: string; unit: string; is_active?: boolean };

// Brief form categories for DESIGN, CONTENT, PR
const PM_CREATIVE_CATEGORIES = [
  { name: "Logo Design", desc: "ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก", price: 2500 },
  { name: "Key Visual (KV)", desc: "ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ", price: 3500 },
  { name: "Print Poster / Flyer", desc: "ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า", price: 750 },
  { name: "Brochure / Leaflet", desc: "ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ", price: 1200 },
  { name: "Backdrop (ฉากหลัง)", desc: "ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์", price: 2500 },
  { name: "Book Layout (≤10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า", price: 2500 },
  { name: "Book Layout (≥10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า", price: 5500 },
  { name: "Packaging (ครบวงจร)", desc: "ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน", price: 10000 },
  { name: "Website Full Design", desc: "ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)", price: 15000 },
  { name: "Exhibition Design (Small)", desc: "ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)", price: 4500 },
  { name: "3D Render Visualization", desc: "ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)", price: 2500 },
  { name: "Signage Design (Small/Big)", desc: "ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)", price: 1000 },
  { name: "ถ่ายภาพผลิตภัณฑ์ (Product Photography)", desc: "ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา", price: 3500 },
  { name: "ถ่ายภาพบุคคล (Portrait Photography)", desc: "ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง", price: 3000 },
  { name: "Product Design", desc: "ออกแบบผลิตภัณฑ์เชิงสร้างสรรค์", price: 20000 },
  { name: "อื่นๆ (Others)", desc: "งานออกแบบหรือบริการอื่นๆ นอกเหนือจากที่ระบุไว้", price: 1500 },
];

const PM_CONTENT_CATEGORIES = [
  { name: "Boost Post เพื่อประชาสัมพันธ์", desc: "การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย", price: 1000 },
  { name: "Creative Content Idea", desc: "คิดธีม/ไอเดีย/ Event & Campaign", price: 5000 },
  { name: "ถ่ายทำวิดีโอสั้น โปรโมตการบริการ", desc: "ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ", price: 2500 },
  { name: "ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์", desc: "ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล", price: 3500 },
  { name: "ถ่ายทำวิดีโอสั้น Talk Spective", desc: "ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ", price: 3500 },
  { name: "บทความสั้น + ภาพประกอบ", desc: "ความยาว 300 - 500 คำ (โพสต์โซเชียล)", price: 800 },
  { name: "บทความยาว + ภาพประกอบ", desc: "ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)", price: 2500 },
  { name: "Copywriting / Storytelling", desc: "การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ", price: 1500 },
  { name: "ตัดต่อคลิปสั้น (Short-form)", desc: "ความยาว 15 - 60 วินาที (TikTok/Reels)", price: 1500 },
  { name: "อื่นๆ (โปรดระบุ)", desc: "งานบริการคอนเทนต์อื่นๆ นอกเหนือจากที่ระบุไว้", price: 1000 }
];

const PM_PR_CATEGORIES = [
  { name: "ข่าวประชาสัมพันธ์บริการ (RSP)", desc: "ข่าวเครือข่าย RSP ภาคเหนือ", price: 1500 },
  { name: "ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)", desc: "การโปรโมทก่อนเริ่มงานหรือโครงการ", price: 1500 },
  { name: "ข่าวการจัดกิจกรรม/โครงการ", desc: "ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ", price: 1500 },
  { name: "ข่าวการจัดประชุม/อบรม/สัมมนา", desc: "ข่าวงานประชุม การอบรม หรือสัมมนา", price: 1500 },
  { name: "ข่าวเกี่ยวกับผู้บริหาร", desc: "ข่าวภารกิจหรือการแถลงของผู้บริหาร", price: 1500 },
  { name: "ข่าวการรับรางวัล", desc: "ข่าวความสำเร็จหรือการรับรางวัลต่างๆ", price: 1500 },
  { name: "ข่าวศึกษาดูงาน", desc: "ข่าวการต้อนรับคณะศึกษาดูงาน", price: 1500 },
  { name: "Press Release (ข่าวแจกสื่อมวลชน)", desc: "เขียนข่าวประชาสัมพันธ์ภาษาไทยเพื่อส่งสื่อ", price: 1500 },
  { name: "Media Management (ดูแลสื่อมวลชน)", desc: "เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ", price: 15000 },
  { name: "Stage Management (จัดการเวที)", desc: "จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ", price: 3500 },
  { name: "MOU / Event Coverage", desc: "ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล", price: 2500 },
  { name: "สนับสนุนการจัดกิจกรรม (Support Event)", desc: "งานสนับสนุนและบริการสื่อสารอื่นๆ", price: 2500 },
  { name: "อื่นๆ (โปรดระบุ)", desc: "งานประชาสัมพันธ์อื่นๆ นอกเหนือจากที่ระบุ", price: 1500 }
];

export default function InternalTaskModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>(() => ensureCoreOperationalAssignees([]));
  const [pricingList, setPricingList] = useState<ServicePriceItem[]>([]);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    project_name: "",
    assignee_id: "",
    team: "CC",
    category: "",
    organization: "STeP" as "STeP" | "CMU" | "RSP" | "Other",
    organization_other: "",
    description: "",
    deadline: "",
    priority: "Medium",
    selected_okr: "",
    // PM project specific fields
    project_code: "",
    revenue: "",
    cost: "",
    profit: "",
    client_sector: "STeP" as "STeP" | "CMU" | "RSP" | "government" | "private",
    client_agency_name: "",
    pm_work_type: "creative" as "creative" | "content" | "pr",
    pm_work_category: ""
  });

  // Assistants state (ผู้ช่วยรับผิดชอบ รูปแบบเหมือน task ปรกติ 100%)
  const [assistants, setAssistants] = useState<Array<{ assignee_id: string; percentage: number }>>([]);

  // Track Save Cost and manual edit
  const [saveCost, setSaveCost] = useState<number>(0);
  const [manualSaveCostEdit, setManualSaveCostEdit] = useState(false);

  // Track if profit was manually edited by user
  const [manualProfitEdit, setManualProfitEdit] = useState(false);

  // Quotation system state (ตามมาตรฐาน 100% STeP CMU)
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationData, setQuotationData] = useState<StepQuotationData | null>(null);
  const [quotationTotal, setQuotationTotal] = useState<number>(0);
  const [createdBriefId, setCreatedBriefId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch OKRs
      const { data: okrData } = await supabase.from('okr_settings').select('id, type, description').eq('is_active', true);
      if (okrData) setOkrs(okrData);

      // 2. Fetch Assignees (Active members of CC Team - exclude executives, guarantee all 12 core members)
      const { data: assigneeData } = await supabase.from('assignees').select('id, name, unit, is_active').eq('is_active', true).order('name');
      const coreAssignees = ensureCoreOperationalAssignees(assigneeData || []);
      setAssignees(coreAssignees);

      // Auto-assign currently logged-in user in internal tasks / quotations
      const loggedInId = getLoggedInAssigneeId(coreAssignees);
      if (loggedInId) {
        setFormData(prev => ({
          ...prev,
          assignee_id: prev.assignee_id || loggedInId
        }));
      }

      // 3. Fetch Service Pricing (from Supabase or local storage or default STeP list)
      try {
        const { data: pData } = await supabase.from('service_pricing').select('*').eq('is_active', true);
        if (pData && pData.length > 0) {
          setPricingList(pData);
        } else {
          setPricingList(getActivePricingList());
        }
      } catch {
        setPricingList(getActivePricingList());
      }

      // 4. Auto-fill from Contact Memory if available
      const saved = getSavedContact();
      if (saved) {
        if (saved.team) {
          setFormData(prev => ({ ...prev, team: prev.team || saved.team }));
        }
        setIdcFormData(prev => ({
          ...prev,
          clientName: prev.clientName || saved.fullName || saved.nickname || "",
          phone: prev.phone || saved.phone || "",
          email: prev.email || saved.email || ""
        }));
      }
    };

    fetchData();
  }, []);

  // Filter only items from service pricing (internal unit)
  const internalPricing = useMemo(() => {
    const list = pricingList.filter(p => (p.unit || '').toLowerCase() === 'internal');
    return list.length > 0 ? list : pricingList;
  }, [pricingList]);

  // Options for ModernSelect matching reference UI
  const assigneeOptions: ModernSelectOption[] = useMemo(() => {
    const loggedInId = getLoggedInAssigneeId(assignees);
    return [
      { value: "", label: "Unassigned" },
      ...assignees.map(a => ({
        value: a.id,
        label: a.name + (a.id === loggedInId ? " (คุณ)" : ""),
        badge: a.id === loggedInId ? "Logged In" : undefined
      }))
    ];
  }, [assignees]);

  const teamOptions: ModernSelectOption[] = useMemo(() => {
    return OFFICIAL_STEP_TEAMS.map(team => ({
      value: team.abbr,
      label: `${team.abbr} - ${team.th}`,
      desc: team.en
    }));
  }, []);

  const categoryOptions: ModernSelectOption[] = useMemo(() => {
    // 1. Ensure "ทำใบเสนอราคา" (Quotation STeP) is pinned at top
    const quoteItem: ModernSelectOption = {
      value: "ทำใบเสนอราคา",
      label: "📄 ทำใบเสนอราคา",
      desc: "สร้างและออกเอกสารใบเสนอราคาตามมาตรฐาน STeP CMU (บันทึกข้อมูลในระบบ ไม่ส่งเมล)",
      badge: "ระบบเอกสาร"
    };

    const restItems: ModernSelectOption[] = internalPricing
      .filter(item => item.service_name !== "ทำใบเสนอราคา" && item.service_name !== "ทำใบเสนราคา")
      .map(item => {
        const isEmailReq = isInternalTaskRequiringEmail({
          unit: "internal",
          details: { category: item.service_name }
        });

        return {
          value: item.service_name,
          label: item.service_name,
          desc: item.description,
          badge: isEmailReq ? "✉️ มีส่งเมล/ประเมิน" : `฿${item.standard_price.toLocaleString()}`
        };
      });

    return [quoteItem, ...restItems];
  }, [internalPricing]);

  const okrOptions: ModernSelectOption[] = useMemo(() => {
    return [
      { value: "", label: "-- ไม่ระบุ --" },
      ...okrs.map(o => ({
        value: o.id,
        label: `[${o.type}] ${o.description}`,
        badge: o.type
      }))
    ];
  }, [okrs]);

  // STRICT check: Show PM box ONLY when user specifically selects "PM โครงการของ CC"
  const isPMProject = useMemo(() => {
    return formData.category.trim() === "PM โครงการของ CC";
  }, [formData.category]);

  // IDC Consultation form state (when category is ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ)
  const [idcFormData, setIdcFormData] = useState({
    clientName: "",
    companyName: "",
    organizationType: "private" as "private" | "government",
    businessType: "food_processing",
    businessTypeOther: "",
    taxId: "",
    phone: "",
    email: "",
    address: "",
    services: ["product_design"] as string[],
    serviceMain: "product_design" as "product_design" | "packaging_design" | "print_media" | "logo_branding" | "ci_branding" | "other",
    serviceOtherDetail: "",
    pieceCount: 1,
    projectBrief: ""
  });

  const [idcServiceQuantities, setIdcServiceQuantities] = useState<Record<string, number>>({
    product_design: 1
  });

  const updateIdcServiceQty = (key: string, delta: number) => {
    setIdcServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, (prev[key] || 1) + delta)
    }));
  };

  const setIdcServiceQty = (key: string, qty: number) => {
    setIdcServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, qty)
    }));
  };

  const toggleIdcService = (key: string) => {
    setIdcFormData(prev => {
      const exists = prev.services.includes(key);
      const updated = exists
        ? prev.services.filter(k => k !== key)
        : [...prev.services, key];
      return {
        ...prev,
        services: updated,
        serviceMain: (updated[0] || "other") as any
      };
    });
    if (!idcServiceQuantities[key]) {
      setIdcServiceQuantities(prev => ({ ...prev, [key]: 1 }));
    }
  };

  const isConsultationProject = useMemo(() => {
    const cat = (formData.category || "").trim();
    return cat === "ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ" || cat.includes("ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ");
  }, [formData.category]);

  const isQuotationProject = useMemo(() => {
    const cat = (formData.category || "").trim();
    return cat === "ทำใบเสนอราคา" || cat === "ทำใบเสนราคา" || cat.includes("ใบเสนอราคา") || cat.includes("ใบเสนราคา") || Boolean(quotationData);
  }, [formData.category, quotationData]);

  // Category change handler with auto Save Cost update & popup trigger
  const handleCategoryChange = (val: string) => {
    let nextAssigneeId = formData.assignee_id || getLoggedInAssigneeId(assignees);
    if ((val.trim() === "ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ" || val.includes("ให้คำปรึกษา / รับโจทย์ ผู้ประกอบการ")) && !formData.assignee_id) {
      const pim = assignees.find(a => a.name.includes("พิม"));
      if (pim) nextAssigneeId = pim.id;
    }

    // If user selects "ทำใบเสนอราคา" or "ทำใบเสนราคา", immediately pop up UI and compute 30 days deadline
    if (val === 'ทำใบเสนอราคา' || val === 'ทำใบเสนราคา' || val.includes('ใบเสนอราคา') || val.includes('ใบเสนราคา')) {
      setShowQuotationModal(true);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      const dl30 = targetDate.toISOString().split("T")[0];
      setFormData(prev => ({
        ...prev,
        category: val,
        assignee_id: nextAssigneeId,
        deadline: dl30
      }));
    } else {
      setFormData(prev => ({ ...prev, category: val, assignee_id: nextAssigneeId }));
    }

    const matched = pricingList.find(p => p.service_name.toLowerCase() === val.toLowerCase());
    const stdPrice = matched ? matched.standard_price : (val.trim() === "PM โครงการของ CC" ? 50000 : 1500);
    
    if (!manualSaveCostEdit) {
      setSaveCost(quotationTotal > 0 ? quotationTotal : stdPrice);
    }
  };

  // Handle revenue & cost change to auto-compute PM profit
  const handleRevenueChange = (val: string) => {
    setFormData(prev => {
      const next = { ...prev, revenue: val };
      const rev = Number(val) || 0;
      const cst = Number(next.cost) || 0;
      const computedProfit = rev - cst;
      if (!manualProfitEdit) {
        next.profit = computedProfit.toString();
      }
      return next;
    });
  };

  const handleCostChange = (val: string) => {
    setFormData(prev => {
      const next = { ...prev, cost: val };
      const rev = Number(next.revenue) || 0;
      const cst = Number(val) || 0;
      const computedProfit = rev - cst;
      if (!manualProfitEdit) {
        next.profit = computedProfit.toString();
      }
      return next;
    });
  };

  const handleProfitChange = (val: string) => {
    setManualProfitEdit(true);
    setFormData(prev => ({ ...prev, profit: val }));
  };

  // Auto-suggest project_name for IDC consultation
  useEffect(() => {
    if (isConsultationProject) {
      const serviceMap: Record<string, string> = {
        product_design: "ออกแบบผลิตภัณฑ์",
        packaging_design: "ออกแบบบรรจุภัณฑ์",
        print_media: "ออกแบบสื่อสิ่งพิมพ์",
        logo_branding: "ออกแบบตราสัญลักษณ์",
        other: idcFormData.serviceOtherDetail.trim() || "อื่นๆ"
      };
      const sLabel = serviceMap[idcFormData.serviceMain] || "งานให้คำปรึกษา";
      const company = idcFormData.companyName.trim() || idcFormData.clientName.trim();
      if (company && (!formData.project_name || formData.project_name.startsWith("[IDC]"))) {
        setFormData(prev => ({
          ...prev,
          project_name: `[IDC] ให้คำปรึกษา: ${sLabel} - ${company}`
        }));
      }
    }
  }, [isConsultationProject, idcFormData.companyName, idcFormData.clientName, idcFormData.serviceMain, idcFormData.serviceOtherDetail]);

  // Sub-category options for PM Work Type (DESIGN / CONTENT / PR)
  const pmWorkCategoryOptions: ModernSelectOption[] = useMemo(() => {
    let list = PM_CREATIVE_CATEGORIES;
    if (formData.pm_work_type === 'content') list = PM_CONTENT_CATEGORIES;
    if (formData.pm_work_type === 'pr') list = PM_PR_CATEGORIES;

    return [
      { value: "", label: "-- เลือกประเภทงานย่อย --" },
      ...list.map(item => ({
        value: item.name,
        label: item.name,
        desc: item.desc,
        badge: `฿${item.price.toLocaleString()}`
      }))
    ];
  }, [formData.pm_work_type]);

  const handleWorkTypeChange = (type: "creative" | "content" | "pr") => {
    setFormData(prev => ({
      ...prev,
      pm_work_type: type,
      pm_work_category: ""
    }));
  };

  const handleWorkCategoryChange = (catName: string) => {
    setFormData(prev => ({
      ...prev,
      pm_work_category: catName
    }));

    let list = PM_CREATIVE_CATEGORIES;
    if (formData.pm_work_type === 'content') list = PM_CONTENT_CATEGORIES;
    if (formData.pm_work_type === 'pr') list = PM_PR_CATEGORIES;

    const matched = list.find(item => item.name === catName);
    if (matched && !manualSaveCostEdit) {
      setSaveCost(matched.price);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isExternal = formData.organization === "CMU" || formData.organization === "RSP" || formData.organization === "Other" || formData.client_sector === "CMU" || formData.client_sector === "RSP";
      const okrLinks = isExternal 
        ? ["KR2", "R3", "R4"] 
        : (formData.selected_okr ? [formData.selected_okr] : ["KR1", "R1", "R2"]);
      const selectedAssignee = assignees.find(a => a.id === formData.assignee_id);
      
      const revNum = Number(formData.revenue) || 0;
      const costNum = Number(formData.cost) || 0;
      const profitNum = formData.profit !== "" ? Number(formData.profit) : (revNum - costNum);

      // Save Cost value displayed/verified by user
      const finalSaveCost = Number(saveCost) || 0;

      // Valid assistants with assignee_id
      const validAssistants = assistants.filter(a => a.assignee_id && Number(a.percentage) > 0);

      let orgValue = formData.organization === "Other" 
        ? (formData.organization_other.trim() || "อื่นๆ") 
        : (formData.organization || 'STeP');

      if (isPMProject) {
        if (formData.client_sector === 'STeP') orgValue = 'STeP';
        else if (formData.client_sector === 'CMU') orgValue = 'CMU';
        else if (formData.client_sector === 'RSP') orgValue = 'RSP';
        else if (formData.client_agency_name.trim()) orgValue = formData.client_agency_name.trim();
        else orgValue = formData.client_sector === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน';
      }

      const detailsPayload: Record<string, any> = {
        category: formData.category,
        organization: orgValue,
        organization_key: isPMProject ? formData.client_sector : formData.organization,
        organization_other: formData.organization === "Other" ? formData.organization_other.trim() : undefined,
        selected_okr: isExternal ? 'KR2' : (formData.selected_okr || 'KR1'),
        okr_kr: isExternal ? 'KR2' : (formData.selected_okr || 'KR1'),
        r_metrics: isExternal ? ['R3', 'R4'] : ['R1', 'R2'],
        description: formData.description,
        details: formData.description,
        team: formData.team || 'CC',
        save_cost: finalSaveCost,
        project_value: isPMProject && revNum > 0 ? revNum.toString() : finalSaveCost.toString(),
        assistants: validAssistants
      };

      if (isPMProject) {
        detailsPayload.project_code = formData.project_code || null;
        detailsPayload.revenue = revNum;
        detailsPayload.cost = costNum;
        detailsPayload.profit = profitNum;
        detailsPayload.client_sector = formData.client_sector || 'STeP';
        detailsPayload.client_agency_name = formData.client_agency_name ? formData.client_agency_name.trim() : '';
        detailsPayload.pm_work_type = formData.pm_work_type || 'creative';
        detailsPayload.pm_work_category = formData.pm_work_category || '';
        if (formData.pm_work_category) {
          detailsPayload.service_category = formData.pm_work_category;
        }
      }

      // Handle IDC Consultation Form details
      let finalTaskTitle = formData.project_name.trim();
      let finalCoordinator = selectedAssignee ? selectedAssignee.name : 'Internal Work';
      let finalRequesterEmail = 'internal@step.cmu.ac.th';
      let finalDecisionMaker = formData.team || 'CC';
      const effectiveAssigneeId = formData.assignee_id || getLoggedInAssigneeId(assignees);
      let finalAssigneeId = effectiveAssigneeId || null;

      if (isConsultationProject) {
        if (!idcFormData.clientName.trim() || !idcFormData.companyName.trim()) {
          alert("กรุณากรอกชื่อผู้รับบริการ และชื่อสถานประกอบการ ในแบบฟอร์มขอรับคำปรึกษาด้านการออกแบบ");
          setLoading(false);
          return;
        }

        // 1. Generate sequential IDC Code
        let nextNum = 7;
        try {
          const { data: idcList } = await supabase
            .from('briefs')
            .select('id')
            .or('details->>idc_code.not.is.null,project_name.ilike.%[IDC]%');
          if (idcList && idcList.length > 0) {
            nextNum = idcList.length + 1;
          }
        } catch (e) {
          console.warn("Could not fetch IDC count", e);
        }
        const generatedIdcCode = `IDC-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;

        const serviceMap: Record<string, string> = {
          product_design: "ออกแบบผลิตภัณฑ์",
          packaging_design: "ออกแบบบรรจุภัณฑ์",
          print_media: "ออกแบบสื่อสิ่งพิมพ์",
          logo_branding: "ออกแบบตราสัญลักษณ์",
          ci_branding: "ออกแบบอัตลักษณ์ ( CI )",
          other: idcFormData.serviceOtherDetail.trim() || "อื่นๆ"
        };
        const selectedServices = idcFormData.services && idcFormData.services.length > 0
          ? idcFormData.services
          : [idcFormData.serviceMain];
        const totalPieces = selectedServices.reduce((sum, s) => sum + (idcServiceQuantities[s] || 1), 0);
        const selectedLabels = selectedServices.map(s => {
          const name = serviceMap[s] || s;
          const qty = idcServiceQuantities[s] || 1;
          return qty > 1 ? `${name} (${qty} ชิ้น)` : name;
        });
        const sLabel = selectedLabels.join(", ") || "งานให้คำปรึกษา";
        const token = `survey-${Date.now().toString(36)}`;
        const pimId = "47adfbc2-8d0e-4dc7-87ad-98895be82026";
        const pimName = "พิม AC";

        if (!finalAssigneeId) {
          finalAssigneeId = pimId;
        }

        detailsPayload.category = "Design";
        detailsPayload.service_category = "Innovation Design Center (IDC)";
        detailsPayload.idc_code = generatedIdcCode;
        detailsPayload.client_name = idcFormData.clientName.trim();
        detailsPayload.company_name = idcFormData.companyName.trim();
        detailsPayload.organization = idcFormData.organizationType === "government" ? "ภาครัฐ" : "ภาคเอกชน";
        detailsPayload.organization_type = idcFormData.organizationType;
        detailsPayload.work_organization = orgValue;
        detailsPayload.internal_organization = orgValue;
        detailsPayload.business_type = idcFormData.businessType;
        detailsPayload.business_type_other = idcFormData.businessTypeOther.trim();
        detailsPayload.address = idcFormData.address.trim();
        detailsPayload.tax_id = idcFormData.taxId.trim();
        detailsPayload.phone = idcFormData.phone.trim();
        detailsPayload.email = idcFormData.email.trim();
        detailsPayload.services = selectedServices;
        detailsPayload.service_labels = selectedLabels;
        detailsPayload.service_quantities = idcServiceQuantities;
        detailsPayload.service_main = selectedServices[0] || 'other';
        detailsPayload.service_label = sLabel;
        detailsPayload.service_other_detail = idcFormData.serviceOtherDetail.trim();
        detailsPayload.piece_count = totalPieces;
        detailsPayload.revenue = finalSaveCost || 0;
        detailsPayload.description = idcFormData.projectBrief.trim() || formData.description;
        detailsPayload.project_brief = idcFormData.projectBrief.trim() || formData.description;
        detailsPayload.details = idcFormData.projectBrief.trim() || formData.description;
        detailsPayload.survey_token = token;
        detailsPayload.survey_sent = false;
        detailsPayload.assignee_name = selectedAssignee ? selectedAssignee.name : pimName;

        if (!finalTaskTitle || finalTaskTitle.startsWith("[IDC]")) {
          finalTaskTitle = `[IDC] ให้คำปรึกษา: ${sLabel} - ${idcFormData.companyName.trim()}`;
        }
        finalCoordinator = idcFormData.clientName.trim();
        finalRequesterEmail = idcFormData.email.trim() || 'idc@step.cmu.ac.th';
        finalDecisionMaker = idcFormData.organizationType === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน';

        // Persist to local storage for offline / instant availability
        if (typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem("cc_idc_records_v1");
            const existing = saved ? JSON.parse(saved) : [];
            const newRec = {
              id: `idc-rec-${Date.now()}`,
              code: generatedIdcCode,
              date: new Date().toISOString().split("T")[0],
              clientName: idcFormData.clientName.trim(),
              companyName: idcFormData.companyName.trim(),
              organizationType: idcFormData.organizationType,
              businessType: idcFormData.businessType,
              businessTypeOther: idcFormData.businessTypeOther.trim(),
              address: idcFormData.address.trim(),
              taxId: idcFormData.taxId.trim(),
              phone: idcFormData.phone.trim(),
              email: idcFormData.email.trim(),
              serviceMain: idcFormData.serviceMain,
              serviceOtherDetail: idcFormData.serviceOtherDetail.trim(),
              pieceCount: totalPieces,
              serviceQuantities: idcServiceQuantities,
              projectBrief: idcFormData.projectBrief.trim() || formData.description,
              assignee: selectedAssignee ? selectedAssignee.name : pimName,
              revenue: finalSaveCost || 0,
              status: "pending",
              surveyToken: token,
              surveySent: false
            };
            localStorage.setItem("cc_idc_records_v1", JSON.stringify([newRec, ...existing]));
          } catch (e) {
            console.error("Local storage error:", e);
          }
        }
      }

      const isQuotation = formData.category === 'ทำใบเสนอราคา' || formData.category === 'ทำใบเสนราคา' || Boolean(quotationData) || isQuotationProject;

      // Handle Quotation system details (ตามมาตรฐาน 100% STeP CMU)
      if (isQuotation) {
        detailsPayload.quotation = quotationData;
        const totalQuote = quotationTotal || finalSaveCost;
        detailsPayload.revenue = totalQuote;
        detailsPayload.save_cost = totalQuote;
        detailsPayload.project_value = totalQuote.toString();

        // Quotation completes immediately upon issuance and skips evaluation entirely
        detailsPayload.survey_status = 'declined';
        detailsPayload.skip_survey = true;
        detailsPayload.no_evaluation_needed = true;
        detailsPayload.satisfaction_survey_completed = true;
        detailsPayload.quotation_auto_completed = true;
        detailsPayload.completed_at = new Date().toISOString();

        if (quotationData?.customerName) {
          finalCoordinator = quotationData.customerName;
          if (!finalTaskTitle || finalTaskTitle.startsWith("[Quotation]") || finalTaskTitle === "ทำใบเสนอราคา") {
            finalTaskTitle = `[Quotation] ${quotationData.docId || 'QT'} - ${quotationData.customerName}`;
          }
          if (quotationData.customerPhone) {
            detailsPayload.requester_phone = quotationData.customerPhone;
          }
        }
      }

      // Generate guaranteed sequential task code for FY70 (e.g. IT70-1, IT70-2, IT70-3...)
      const prefix = isConsultationProject ? 'IDC' : isQuotation ? 'QT' : 'IT';
      const generatedTaskCode = detailsPayload.task_code || await generateNextTaskCode(prefix);
      detailsPayload.task_code = generatedTaskCode;
      if (prefix === 'IDC') {
        detailsPayload.idc_code = generatedTaskCode;
      }

      const canonical = enforceCanonicalBriefIntegrity({
        unit: 'internal',
        project_name: finalTaskTitle,
        decision_maker: finalDecisionMaker,
        okr_links: okrLinks,
        details: detailsPayload,
      });

      const nowIso = new Date().toISOString();

      if (createdBriefId) {
        const { error } = await supabase.from('briefs').update({
          project_name: finalTaskTitle,
          status: isQuotation ? 'completed' : 'pending',
          completed_at: isQuotation ? nowIso : null,
          priority: formData.priority,
          deadline: formData.deadline || null,
          assignee_id: finalAssigneeId,
          okr_links: canonical.okr_links,
          details: canonical.details,
          requester_email: finalRequesterEmail,
          coordinator_nickname: finalCoordinator,
          decision_maker: canonical.decision_maker
        }).eq('id', createdBriefId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('briefs').insert([{
          project_name: finalTaskTitle,
          unit: 'internal',
          status: isQuotation ? 'completed' : 'pending',
          priority: formData.priority,
          deadline: formData.deadline || null,
          completed_at: isQuotation ? nowIso : null,
          assignee_id: finalAssigneeId,
          okr_links: canonical.okr_links,
          details: canonical.details,
          requester_email: finalRequesterEmail,
          coordinator_nickname: finalCoordinator,
          decision_maker: canonical.decision_maker
        }]);
        if (error) throw error;
      }

      // Automatically remember contact
      if (isConsultationProject) {
        saveContact({
          nickname: idcFormData.clientName.trim(),
          fullName: idcFormData.clientName.trim(),
          phone: idcFormData.phone.trim(),
          email: idcFormData.email.trim()
        });
      } else if (formData.team) {
        saveContact({ team: formData.team });
      }
      
      // Reload page to display new internal task
      window.location.reload();
      
    } catch (error) {
      console.error("Error creating internal task:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกงานภายใน!");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white w-full ${(isConsultationProject || isQuotationProject) ? 'max-w-2xl' : 'max-w-xl'} max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Internal Task
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกงานภายในเชิงข้อมูลในระบบโดยตรง (ไม่ส่งอีเมล) ยกเว้นงาน PM โครงการ, ให้คำปรึกษาเชิงสร้างสรรค์ และให้คำปรึกษา/รับโจทย์ ผู้ประกอบการ
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* 1. Task Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ชื่องาน (Task Name) *
            </label>
            <input 
              required 
              type="text" 
              value={formData.project_name}
              onChange={e => setFormData({...formData, project_name: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E03131] transition-all font-medium placeholder:text-slate-400"
              placeholder="เช่น บริหารโครงการสื่อสารองค์กร ประจำไตรมาส 1/2567"
            />
          </div>

          {/* 2. Assignee & Related Team Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-[#E03131]" />
                Assignee (ผู้รับผิดชอบ)
              </label>
              <ModernSelect
                value={formData.assignee_id}
                onChange={val => setFormData({ ...formData, assignee_id: val })}
                options={assigneeOptions}
                placeholder="Unassigned"
                searchPlaceholder="ค้นหาชื่อ..."
                align="center"
              />
            </div>

            {/* Related Team */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                ทีมที่เกี่ยวข้อง
              </label>
              <ModernSelect
                value={formData.team}
                onChange={val => setFormData({ ...formData, team: val })}
                options={teamOptions}
                placeholder="เลือกทีมที่เกี่ยวข้อง..."
                searchPlaceholder="ค้นหาทีม..."
              />
            </div>

          </div>

          {/* 2.1 Assistants Sub-section inside Assignee (รูปแบบเหมือน task ปรกติ 100%) */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-700 font-bold truncate">ผู้ช่วยรับผิดชอบ (Assistants)</span>
                {isPMProject && (
                  <span 
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full shrink-0"
                    title="คิดสัดส่วนเงินจาก % กำไรสุทธิ (Profit) ของโครงการ"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    คิดจาก % กำไร
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setAssistants(prev => [...prev, { assignee_id: '', percentage: 0 }]);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#e03131] hover:text-white bg-rose-50 hover:bg-[#e03131] border border-rose-200 hover:border-[#e03131] rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Plus size={11} strokeWidth={2.5} className="shrink-0" />
                <span>ขอผู้ช่วย</span>
              </button>
            </div>

            {assistants.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic py-0.5">
                ไม่มีผู้ช่วย (กด "+ ขอผู้ช่วย" เพื่อแบ่งสัดส่วน % งาน)
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {(() => {
                  const pmProfitNum = formData.profit !== "" ? Number(formData.profit) : ((Number(formData.revenue) || 0) - (Number(formData.cost) || 0));
                  const effectiveBaseVal = isPMProject ? pmProfitNum : saveCost;

                  return (
                    <>
                      {assistants.map((assistant, index) => {
                        const assistantBaht = Math.round((effectiveBaseVal * (Number(assistant.percentage) || 0)) / 100);
                        return (
                          <div key={index} className="flex items-center gap-2 group">
                            <div className="flex-1 relative min-w-0">
                              <CustomSelect 
                                triggerClassName="w-full text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-xs hover:border-slate-300 transition-colors truncate text-[12px] h-[28px] flex items-center justify-between"
                                dropdownClassName="w-48 text-[12px]"
                                placeholder="เลือกผู้ช่วย..."
                                value={assistant.assignee_id || ""}
                                onChange={(val) => {
                                  const newAssistants = [...assistants];
                                  newAssistants[index].assignee_id = val;
                                  setAssistants(newAssistants);
                                }}
                                options={[
                                  { value: "", label: "เลือกผู้ช่วย..." },
                                  ...assignees
                                    .filter(a => a.id !== formData.assignee_id && !assistants.some((ast, i) => i !== index && ast.assignee_id === a.id))
                                    .map(a => ({ value: a.id, label: a.name }))
                                ]}
                              />
                            </div>
                            <div className="w-[72px] relative flex items-center border border-slate-200 focus-within:border-[#E03131] rounded-full bg-white shadow-xs transition-colors h-[28px] shrink-0 px-1.5">
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="w-full bg-transparent pl-1 pr-4 py-0.5 text-[12px] text-center focus:outline-none font-semibold text-slate-700 font-mono no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={assistant.percentage === 0 ? '' : assistant.percentage}
                                placeholder="0"
                                onChange={(e) => {
                                  const newAssistants = [...assistants];
                                  newAssistants[index].percentage = parseInt(e.target.value) || 0;
                                  setAssistants(newAssistants);
                                }}
                              />
                              <span className="absolute right-2 text-slate-400 text-[11px] pointer-events-none font-bold">%</span>
                            </div>
                            <div 
                              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 min-w-[65px] text-right text-emerald-700 bg-emerald-50/80 border border-emerald-200/60"
                              title={isPMProject ? "ส่วนแบ่งกำไร (Profit) ของผู้ช่วยท่านนี้" : "มูลค่า Save Cost ของผู้ช่วยท่านนี้"}
                            >
                              ฿{assistantBaht.toLocaleString()}
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newAssistants = [...assistants];
                                newAssistants.splice(index, 1);
                                setAssistants(newAssistants);
                              }}
                              className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบผู้ช่วย"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                      
                      {(() => {
                        const totalPercent = assistants.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
                        if (totalPercent > 100) {
                          return (
                            <div className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-semibold bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                              <AlertCircle size={12} /> สัดส่วนเกิน 100% (รวม {totalPercent}%)
                            </div>
                          );
                        }
                        if (totalPercent > 0) {
                          const ownerPct = Math.max(0, 100 - totalPercent);
                          const ownerBaht = Math.round((effectiveBaseVal * ownerPct) / 100);
                          const assistantBaht = Math.round((effectiveBaseVal * totalPercent) / 100);
                          return (
                            <div className="space-y-1 mt-1.5">
                              <div className="text-[11px] text-slate-600 flex items-center justify-between px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200/80 font-medium">
                                <span>
                                  งานหลัก: <strong className="text-slate-800 font-semibold">{ownerPct}%</strong>{" "}
                                  <span className="font-mono font-bold text-emerald-700">(฿{ownerBaht.toLocaleString()})</span>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span>
                                  ผู้ช่วยรวม: <strong className="text-slate-800 font-semibold">{totalPercent}%</strong>{" "}
                                  <span className="font-mono font-bold text-emerald-700">(฿{assistantBaht.toLocaleString()})</span>
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Category strictly from Service Pricing - Full width */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-amber-500" />
              ประเภทงาน
            </label>
            <ModernSelect
              value={formData.category}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="เลือกประเภทงาน..."
              searchPlaceholder="ค้นหาประเภทงาน (เช่น ทำใบเสนอราคา, VDO, ข่าว, PM, Event)..."
              required
            />
          </div>

          {/* Quotation Document Card (100% STeP CMU Quotation) */}
          {(formData.category === 'ทำใบเสนอราคา' || formData.category === 'ทำใบเสนราคา' || formData.category.includes('ใบเสนอราคา') || quotationData) && (
            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/80 border-2 border-amber-300/90 rounded-2xl p-4.5 space-y-3.5 animate-in fade-in shadow-xs">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        ระบบออกใบเสนอราคา (Quotation)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                        STeP CMU
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                      {quotationData 
                        ? `สร้างและบันทึกใบเสนอราคาเลขที่ ${quotationData.docId} เรียบร้อยแล้ว`
                        : "เอกสารหัวกระดาษและโลโก้อุทยานฯ ตรงตามระบบ Google Apps Script 100%"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuotationModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <FileText size={14} />
                  <span>{quotationData ? "เปิดดู / แก้ไขใบเสนอราคา" : "เปิดฟอร์มออกใบเสนอราคา"}</span>
                </button>
              </div>

              {/* Quotation Details Grid */}
              {quotationData ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    
                    {/* Customer */}
                    <div className="bg-white/90 p-3 rounded-xl border border-amber-200/70 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">ลูกค้า / ผู้รับบริการ</span>
                      <div className="font-bold text-slate-800 text-xs leading-snug break-words">
                        {quotationData.customerName || "ไม่ระบุ"}
                      </div>
                      {quotationData.customerPhone && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          โทร: {quotationData.customerPhone}
                        </div>
                      )}
                    </div>

                    {/* Summary & Numbers */}
                    <div className="bg-white/90 p-3 rounded-xl border border-amber-200/70 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">เลขที่เอกสาร & รายการ</span>
                        <div className="font-mono font-bold text-slate-800">
                          {quotationData.docId} ({quotationData.items?.length || 0} รายการ)
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          วันที่ออก: {quotationData.docDate || "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">ยอดรวมสุทธิ</span>
                        <div className="font-mono font-extrabold text-amber-700 text-base">
                          ฿{formatCurrency(quotationTotal)}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Deadline Notice Pill */}
                  <div className="bg-amber-100/70 border border-amber-200/90 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>⏳</span>
                      <span><strong>กำหนดส่ง (Deadline):</strong> ยืนราคา 30 วันนับจากวันที่ออกเอกสาร</span>
                    </span>
                    <span className="font-mono font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-300">
                      {formData.deadline || "30 วัน"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-800/90 bg-white/60 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between">
                  <span>ยังไม่มีข้อมูลใบเสนอราคา คลิกปุ่มสีส้มด้านบนเพื่อเริ่มกรอกรายละเอียดและพิมพ์/Export</span>
                </div>
              )}

            </div>
          )}

          {/* เป็นภาระงานของหน่วยงานใด Single-Select - Minimal Dieter Rams Style (ซ่อนเมื่อเป็น PM โครงการของ CC) */}
          {!isPMProject && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-500" />
                <span>เป็นภาระงานของหน่วยงานใด</span>
                <span className="text-[#E03131] font-bold">*</span>
              </label>

              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full">
                {[
                  { key: "STeP", label: "STeP" },
                  { key: "CMU", label: "CMU" },
                  { key: "RSP", label: "RSP" },
                  { key: "Other", label: "อื่นๆ" }
                ].map(item => {
                  const isSelected = formData.organization === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const isExternal = item.key === "CMU" || item.key === "RSP" || item.key === "Other";
                        setFormData({ 
                          ...formData, 
                          organization: item.key as any,
                          selected_okr: isExternal ? "KR2" : "KR1"
                        });
                      }}
                      className={`h-10 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer select-none flex items-center justify-center gap-1.5 border ${
                        isSelected
                          ? "bg-slate-600 text-white font-bold border-slate-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
                      }`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive OKR & Metric Mapping Badge */}
              <div className={`mt-2 p-2.5 rounded-2xl border text-xs flex items-center gap-2 transition-all ${
                formData.organization === "CMU" || formData.organization === "RSP"
                  ? "bg-purple-50/80 border-purple-200 text-purple-900"
                  : formData.organization === "STeP"
                  ? "bg-blue-50/80 border-blue-200 text-blue-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <Target size={14} className="shrink-0 text-amber-500" />
                <div className="leading-tight">
                  {formData.organization === "CMU" || formData.organization === "RSP" ? (
                    <span>
                      🎯 <strong>ภาระงานภายนอก ({formData.organization}):</strong> ข้อมูลเชื่อมโยงเข้าสู่ <strong>KR2</strong> (ผลงานภายนอก มช. & RSP) • ตัวชี้วัด <strong>R3</strong> และ <strong>R4</strong> อัตโนมัติ
                    </span>
                  ) : formData.organization === "STeP" ? (
                    <span>
                      🏢 <strong>ภาระงานภายในองค์กร (STeP):</strong> ข้อมูลเชื่อมโยงเข้าสู่ <strong>KR1</strong> (ผลงานบริการภายใน) • ตัวชี้วัด <strong>R1</strong> และ <strong>R2</strong> อัตโนมัติ
                    </span>
                  ) : (
                    <span>
                      🌐 <strong>หน่วยงานอื่นๆ:</strong> เชื่อมโยงเข้าสู่ <strong>KR2</strong> / R3 / R4 (ภาระงานภายนอก)
                    </span>
                  )}
                </div>
              </div>

              {/* ถ้าเลือกอื่นๆ จะมีช่องให้กรอก */}
              {formData.organization === "Other" && (
                <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    value={formData.organization_other}
                    onChange={(e) => setFormData({ ...formData, organization_other: e.target.value })}
                    placeholder="ระบุชื่อหน่วยงานอื่นๆ (เช่น คณะ, สถาบัน หรือ หน่วยงานภายนอก)..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 transition-all shadow-2xs"
                    required={formData.organization === "Other"}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* CONDITIONAL IDC DESIGN CONSULTATION SECTION (Dieter Rams Style) */}
          {isConsultationProject && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
              
              {/* Header / Intro */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      แบบฟอร์มขอรับคำปรึกษาด้านงานสร้างสรรค์
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ทีมสร้างสรรค์และการสื่อสาร : อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                  IDC Intake
                </span>
              </div>

              {/* 1. ข้อมูลผู้รับบริการ & สถานประกอบการ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                  <span className="p-1 rounded-lg bg-orange-100 text-orange-700">
                    <Building2 size={15} />
                  </span>
                  <span>1. ข้อมูลผู้รับบริการ & สถานประกอบการ</span>
                </div>

                {/* Client Name & Company Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้รับบริการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={isConsultationProject}
                      value={idcFormData.clientName}
                      onChange={e => setIdcFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="เช่น คุณกมลรัตน์ เลิศวานิช"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อสถานประกอบการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={isConsultationProject}
                      value={idcFormData.companyName}
                      onChange={e => setIdcFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="เช่น บริษัท ล้านนา ฟรุตส์ แอนด์ ดราย จำกัด"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Organization Type & Business Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทหน่วยงาน <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-[38px]">
                      <button
                        type="button"
                        onClick={() => setIdcFormData(prev => ({ ...prev, organizationType: "private" }))}
                        className={`rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          idcFormData.organizationType === "private"
                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        🏢 ภาคเอกชน
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdcFormData(prev => ({ ...prev, organizationType: "government" }))}
                        className={`rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          idcFormData.organizationType === "government"
                            ? "bg-purple-50 border-purple-500 text-purple-700 shadow-2xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        🏛️ ภาครัฐ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทธุรกิจ / ผลิตภัณฑ์ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={idcFormData.businessType}
                      onChange={e => setIdcFormData(prev => ({ ...prev, businessType: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium h-[38px]"
                    >
                      <option value="food_processing">1. การแปรรูปอาหาร</option>
                      <option value="agriculture_biotech">2. การเกษตรและเทคโนโลยีชีวภาพ</option>
                      <option value="tourism">3. การท่องเที่ยว</option>
                      <option value="digital">4. ดิจิทัล</option>
                      <option value="other">5. อื่นๆ</option>
                    </select>
                  </div>
                </div>

                {idcFormData.businessType === "other" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระบุประเภทธุรกิจเพิ่มเติม
                    </label>
                    <input
                      type="text"
                      value={idcFormData.businessTypeOther}
                      onChange={e => setIdcFormData(prev => ({ ...prev, businessTypeOther: e.target.value }))}
                      placeholder="เช่น งานหัตถกรรมพื้นบ้าน, แฟชั่นสิ่งทอ..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                )}

                {/* Tax ID, Phone, Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขประจำตัวผู้เสียภาษี (13 หลัก)
                    </label>
                    <input
                      type="text"
                      value={idcFormData.taxId}
                      onChange={e => setIdcFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="เช่น 0505562001928"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required={isConsultationProject}
                      value={idcFormData.phone}
                      onChange={e => setIdcFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="เช่น 081-952-4412"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required={isConsultationProject}
                      value={idcFormData.email}
                      onChange={e => setIdcFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="เช่น contact@business.com"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ที่อยู่สถานประกอบการ
                  </label>
                  <textarea
                    rows={2}
                    value={idcFormData.address}
                    onChange={e => setIdcFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="เลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
                  />
                </div>
              </div>

              {/* 2. ประเภทงานที่รับคำปรึกษา */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                  <span className="p-1 rounded-lg bg-orange-100 text-orange-700">
                    <Palette size={15} />
                  </span>
                  <span>2. ประเภทงานที่รับคำปรึกษา</span>
                </div>

                {/* 6 Flat Options (Multi-select) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      เลือกประเภทงานที่ต้องการรับคำปรึกษา <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10.5px] font-medium text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      สามารถเลือกได้หลายอย่าง (ระบุจำนวนชิ้นในแต่ละประเภทได้)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { key: "product_design", label: "ออกแบบผลิตภัณฑ์" },
                      { key: "packaging_design", label: "ออกแบบบรรจุภัณฑ์" },
                      { key: "print_media", label: "ออกแบบสื่อสิ่งพิมพ์" },
                      { key: "logo_branding", label: "ออกแบบตราสัญลักษณ์" },
                      { key: "ci_branding", label: "ออกแบบอัตลักษณ์ ( CI )" },
                      { key: "other", label: "อื่นๆ (ระบุ)" }
                    ].map(opt => {
                      const isSelected = idcFormData.services.includes(opt.key);
                      const qty = idcServiceQuantities[opt.key] || 1;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => toggleIdcService(opt.key)}
                          className={`p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex flex-col justify-between select-none cursor-pointer ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/70 text-orange-950 shadow-2xs ring-1 ring-orange-400"
                              : "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="leading-snug">{opt.label}</span>
                            {isSelected ? (
                              <Check size={14} className="text-orange-600 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>

                          {isSelected && (
                            <div
                              onClick={e => e.stopPropagation()}
                              className="mt-2.5 pt-2 border-t border-orange-200/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150"
                            >
                              <span className="text-slate-600 font-medium text-[11px]">จำนวน:</span>
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-orange-300 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateIdcServiceQty(opt.key, -1)}
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-100 text-orange-800 font-bold cursor-pointer select-none transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={qty}
                                  onChange={e => setIdcServiceQty(opt.key, parseInt(e.target.value) || 1)}
                                  className="w-8 text-center font-mono font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateIdcServiceQty(opt.key, 1)}
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-100 text-orange-800 font-bold cursor-pointer select-none transition-colors"
                                >
                                  +
                                </button>
                                <span className="text-[10.5px] text-slate-500 font-normal pl-0.5">ชิ้น</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {idcFormData.services.includes("other") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระบุประเภทงานอื่นๆ เพิ่มเติม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={idcFormData.services.includes("other")}
                      value={idcFormData.serviceOtherDetail}
                      onChange={e => setIdcFormData(prev => ({ ...prev, serviceOtherDetail: e.target.value }))}
                      placeholder="เช่น ออกแบบกราฟิกตกแต่งหน้าร้าน, ออกแบบของที่ระลึก..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                )}

                {/* Project Brief - Full Width */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รายละเอียดสังเขป / วัตถุประสงค์งาน (Project Brief)
                  </label>
                  <textarea
                    rows={3}
                    value={idcFormData.projectBrief}
                    onChange={e => setIdcFormData(prev => ({ ...prev, projectBrief: e.target.value }))}
                    placeholder="เช่น ต้องการคำปรึกษาการปรับภาพลักษณ์แบรนด์สำหรับส่งออก, การเลือกวัสดุบรรจุภัณฑ์รักษ์โลก ฯลฯ"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
                  />
                </div>

              </div>

            </div>
          )}

          {/* 3. CONDITIONAL PM PROJECT DETAILS SECTION (Dieter Rams Aesthetic) */}
          {isPMProject && (
            <div className="bg-[#F4F4F2] border border-[#D5D5D0] rounded-xl p-4.5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.03)] animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#DCDCD8] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#18181B] text-[#FAFAFA] flex items-center justify-center shadow-xs shrink-0">
                    <Briefcase size={14} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#18181B] uppercase tracking-wider font-mono">
                      ข้อมูลโครงการ PM ของ CC (Financials & Code)
                    </h4>
                    <p className="text-[11px] text-[#71717A]">
                      ระบุโค้ดโครงการ รายรับ และต้นทุนเพื่อคำนวณกำไรสุทธิ
                    </p>
                  </div>
                </div>
                
                {/* Real-time Profit Badge (Braun LCD / Indicator Style) */}
                {formData.revenue && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#18181B] text-[#FAFAFA] border border-[#27272A] shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                    <span>
                      {(Number(formData.profit) || 0) >= 0 ? "PROFIT: " : "LOSS: "}
                      ฿{Number(formData.profit || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Project Code */}
              <div>
                <label className="block text-xs font-bold text-[#3F3F46] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Tag size={13} className="text-[#71717A]" /> โค้ดของโครงการ (Project Code) *
                </label>
                <input 
                  type="text" 
                  value={formData.project_code}
                  onChange={e => setFormData({ ...formData, project_code: e.target.value })}
                  placeholder="เช่น CC-2567-001 หรือ STeP-PRJ-01"
                  className="w-full border border-[#D4D4D0] rounded-lg px-3.5 py-2 text-sm bg-white font-mono font-bold text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] shadow-2xs placeholder:font-normal placeholder:text-[#A1A1AA]"
                />
              </div>

              {/* Service Sector: STeP, CMU, RSP, ภาครัฐ, ภาคเอกชน (Dieter Rams Rocker Buttons) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#3F3F46] uppercase tracking-wider">
                  ประเภทผู้รับบริการ (Sector Type) *
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 w-full">
                  {[
                    { key: "STeP", label: "STeP" },
                    { key: "CMU", label: "CMU" },
                    { key: "RSP", label: "RSP" },
                    { key: "private", label: "เอกชน" },
                    { key: "government", label: "ภาครัฐ" }
                  ].map(sector => {
                    const isSelected = formData.client_sector === sector.key;
                    return (
                      <button
                        key={sector.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, client_sector: sector.key as any })}
                        className={`w-full py-2 px-1 rounded-full border font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                            : 'bg-white text-[#52525B] border-[#D4D4D0] hover:bg-[#EAEAE7] hover:text-[#18181B]'
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                        )}
                        <span className="truncate">{sector.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* If government or private is selected, show agency name input */}
                {(formData.client_sector === 'government' || formData.client_sector === 'private') && (
                  <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider mb-1">
                      ระบุชื่อหน่วยงาน {formData.client_sector === 'government' ? '(เช่น กรมส่งเสริมอุตสาหกรรม, อบจ.เชียงใหม่, สำนักงานนวัตกรรมแห่งชาติ)' : '(เช่น บริษัท บิ๊กซี จำกัด, ห้างหุ้นส่วนจำกัด...)'} *
                    </label>
                    <input 
                      type="text" 
                      value={formData.client_agency_name}
                      onChange={e => setFormData({ ...formData, client_agency_name: e.target.value })}
                      placeholder="ระบุชื่อหน่วยงาน..."
                      className="w-full border border-[#D4D4D0] rounded-lg px-3.5 py-2 text-xs bg-white font-medium text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] shadow-2xs placeholder:text-[#A1A1AA]"
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Revenue, Cost, Profit (Dieter Rams 3-column instrument layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Revenue */}
                <div>
                  <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign size={12} className="text-[#71717A]" /> รายรับ (Revenue)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[#71717A] text-xs">฿</span>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.revenue}
                      onChange={e => handleRevenueChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-[#D4D4D0] rounded-lg font-mono font-bold text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign size={12} className="text-[#71717A]" /> ต้นทุน (Cost)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[#71717A] text-xs">฿</span>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.cost}
                      onChange={e => handleCostChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-[#D4D4D0] rounded-lg font-mono font-bold text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Profit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp size={12} className="text-[#71717A]" /> กำไร (Profit)
                    </label>
                    {manualProfitEdit && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setManualProfitEdit(false);
                          const rev = Number(formData.revenue) || 0;
                          const cst = Number(formData.cost) || 0;
                          setFormData(p => ({ ...p, profit: (rev - cst).toString() }));
                        }}
                        className="text-[10px] text-[#EA580C] hover:underline font-bold font-mono"
                        title="คำนวณอัตโนมัติจาก รายรับ - ต้นทุน"
                      >
                        ↺ อัตโนมัติ
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[#71717A] text-xs">฿</span>
                    <input 
                      type="number" 
                      value={formData.profit}
                      onChange={e => handleProfitChange(e.target.value)}
                      placeholder="รายรับ - ต้นทุน"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-[#ECECE9] border border-[#D4D4D0] rounded-lg font-mono font-bold text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] shadow-2xs"
                    />
                  </div>
                </div>

              </div>

              {/* ประเภทงาน PM: DESIGN / CONTENT / PR (Dieter Rams Braun ET66 Keys) */}
              <div className="pt-3 border-t border-[#DCDCD8] space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[#3F3F46] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Sparkles size={13} className="text-[#71717A]" /> ประเภทงาน (Work Type) *
                    </label>
                    <span className="text-[10px] text-[#71717A] font-medium">เลือกรูปแบบบริการเพื่อกำหนดประเภทงานย่อย</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleWorkTypeChange("creative")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-mono font-bold transition-all shadow-2xs ${
                        formData.pm_work_type === "creative"
                          ? "bg-[#18181B] text-[#FAFAFA] border-[#18181B] shadow-xs"
                          : "bg-white text-[#52525B] border-[#D4D4D0] hover:bg-[#EAEAE7] hover:text-[#18181B]"
                      }`}
                    >
                      {formData.pm_work_type === "creative" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                      ) : (
                        <Palette size={14} className="text-[#71717A]" />
                      )}
                      <span>DESIGN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWorkTypeChange("content")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-mono font-bold transition-all shadow-2xs ${
                        formData.pm_work_type === "content"
                          ? "bg-[#18181B] text-[#FAFAFA] border-[#18181B] shadow-xs"
                          : "bg-white text-[#52525B] border-[#D4D4D0] hover:bg-[#EAEAE7] hover:text-[#18181B]"
                      }`}
                    >
                      {formData.pm_work_type === "content" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                      ) : (
                        <FileText size={14} className="text-[#71717A]" />
                      )}
                      <span>CONTENT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWorkTypeChange("pr")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-mono font-bold transition-all shadow-2xs ${
                        formData.pm_work_type === "pr"
                          ? "bg-[#18181B] text-[#FAFAFA] border-[#18181B] shadow-xs"
                          : "bg-white text-[#52525B] border-[#D4D4D0] hover:bg-[#EAEAE7] hover:text-[#18181B]"
                      }`}
                    >
                      {formData.pm_work_type === "pr" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                      ) : (
                        <Megaphone size={14} className="text-[#71717A]" />
                      )}
                      <span>PR</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#3F3F46] mb-1 flex items-center justify-between">
                    <span>บริการย่อย / ขอบเขตงาน ({formData.pm_work_type === 'creative' ? 'DESIGN' : formData.pm_work_type === 'content' ? 'CONTENT' : 'PR'})</span>
                    {formData.pm_work_category && (
                      <span className="text-[10px] text-[#52525B] font-mono">✓ อัปเดตมูลค่า Save Cost อัตโนมัติ</span>
                    )}
                  </label>
                  <ModernSelect
                    options={pmWorkCategoryOptions}
                    value={formData.pm_work_category}
                    onChange={handleWorkCategoryChange}
                    placeholder="-- เลือกประเภทงานย่อยตาม Brief Form --"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Save Cost Section - Dieter Rams functional readout */}
          <div className="bg-[#F4F4F2] border border-[#D5D5D0] rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#18181B] text-[#FAFAFA] flex items-center justify-center shadow-xs shrink-0">
                  <PiggyBank size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#18181B] uppercase tracking-wider font-mono">
                      มูลค่าที่ช่วยประหยัดให้องค์กร (Save Cost) *
                    </label>
                    {formData.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAEAE7] text-[#52525B] border border-[#D4D4D0] font-bold font-mono">
                        อัตโนมัติ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    มูลค่างานที่ช่วยลดค่าใช้จ่ายให้แก่องค์กร (คำนวณตามราคากลางมาตรฐาน STeP)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-white border border-[#D4D4D0] rounded-lg px-3 py-1.5 shadow-2xs focus-within:border-[#18181B] focus-within:ring-1 focus-within:ring-[#18181B]">
                <span className="font-bold text-[#71717A] text-xs font-mono">฿</span>
                <input
                  type="number"
                  min="0"
                  value={saveCost === 0 && !manualSaveCostEdit ? "" : saveCost}
                  onChange={e => {
                    setManualSaveCostEdit(true);
                    setSaveCost(Number(e.target.value) || 0);
                  }}
                  placeholder="0"
                  className="w-28 text-right font-mono font-bold text-sm sm:text-base text-[#18181B] focus:outline-none"
                />
                <span className="text-xs font-semibold text-[#71717A]">บาท</span>
              </div>
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              รายละเอียดงาน (Description)
            </label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E03131] transition-all resize-y placeholder:text-slate-400"
              placeholder="อธิบายวัตถุประสงค์ ขอบเขตงาน หรือผลลัพธ์ที่ต้องการส่งมอบ..."
            />
          </div>

          {/* 5. Deadline & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deadline (กำหนดส่ง)
                </label>
                {(formData.category === 'ทำใบเสนอราคา' || formData.category === 'ทำใบเสนราคา' || quotationData) && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    ยืนราคา 30 วัน
                  </span>
                )}
              </div>
              <ModernDatePicker 
                value={formData.deadline}
                onChange={val => setFormData({...formData, deadline: val})}
                placeholder="YYYY-MM-DD"
                align="center"
                className="w-full h-[42px] text-sm font-semibold bg-white hover:border-slate-300 border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition-all text-center flex items-center justify-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <CustomSelect
                triggerClassName="w-full h-[42px] text-sm font-semibold bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 shadow-2xs flex items-center justify-between"
                dropdownClassName="w-full"
                value={formData.priority || "Medium"}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                options={[
                  { value: "High", label: "🔥 High" },
                  { value: "Medium", label: "⚡ Medium" },
                  { value: "Low", label: "☕ Low" }
                ]}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs">
              {Number(saveCost) > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <PiggyBank size={14} className="shrink-0" /> Save Cost: ฿{Number(saveCost).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E03131] hover:bg-[#c92a2a] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <Save size={16} /> {loading ? "กำลังบันทึก..." : (isQuotationProject || quotationData ? "บันทึกและส่งมอบสำเร็จ (Completed)" : "บันทึกงานภายใน")}
              </button>
            </div>
          </div>
          
        </form>
      </div>

      {/* Step Quotation 100% Modal */}
      {showQuotationModal && (
        <StepQuotationModal
          initialData={quotationData || undefined}
          onClose={() => setShowQuotationModal(false)}
          onSave={async (data, totalAmount) => {
            setQuotationData(data);
            setQuotationTotal(totalAmount);
            setSaveCost(totalAmount);

            // Compute deadline = docDate + 30 days
            let dl30 = "";
            try {
              const baseDate = data.docDate ? new Date(data.docDate) : new Date();
              baseDate.setDate(baseDate.getDate() + 30);
              dl30 = baseDate.toISOString().split("T")[0];
            } catch {
              const d = new Date();
              d.setDate(d.getDate() + 30);
              dl30 = d.toISOString().split("T")[0];
            }

            const quoteTitle = (!formData.project_name || formData.project_name.startsWith("[Quotation]") || formData.project_name === "ทำใบเสนอราคา")
              ? `[Quotation] ${data.docId} - ${data.customerName || 'ลูกค้า'}`
              : formData.project_name;
            const quoteDesc = (!formData.description || formData.description.startsWith("ใบเสนอราคาเลขที่"))
              ? `ใบเสนอราคาเลขที่ ${data.docId}\nลูกค้า: ${data.customerName}\nรายการบริการ:\n${(data.items || []).map((it, idx) => `${idx + 1}. ${it.description} x ${it.quantity} (฿${(it.quantity * it.price).toLocaleString()})`).join("\n")}\nรวมทั้งสิ้น: ฿${formatCurrency(totalAmount)}`
              : formData.description;

            setFormData(prev => ({
              ...prev,
              category: "ทำใบเสนอราคา",
              project_name: quoteTitle,
              deadline: dl30 || prev.deadline,
              description: quoteDesc
            }));

            // Direct auto-save to Completed per user rule:
            // "พอกรอกเสร็จได้ใบเสนอราคาให้ไปที่ complete เลยเพราะถือว่าเสร็จแล้วและไม่ต้องประเมินใดๆ"
            try {
              const effectiveAssignee = formData.assignee_id || getLoggedInAssigneeId(assignees);
              const matchedAssignee = assignees.find(a => a.id === effectiveAssignee);
              const generatedTaskCode = await generateNextTaskCode('QT');
              const nowIso = new Date().toISOString();

              const quoteDetailsPayload: any = {
                task_code: generatedTaskCode,
                category: 'ทำใบเสนอราคา',
                type: 'ทำใบเสนอราคา',
                description: quoteDesc,
                notes: `ออกใบเสนอราคาสำเร็จเลขที่ ${data.docId}`,
                team: 'CC',
                quotation: data,
                revenue: totalAmount,
                save_cost: totalAmount,
                project_value: totalAmount.toString(),
                assignee_name: matchedAssignee ? matchedAssignee.name : (localStorage.getItem("cc_user_name") || "CC Team"),
                survey_status: 'declined',
                skip_survey: true,
                no_evaluation_needed: true,
                satisfaction_survey_completed: true,
                quotation_auto_completed: true,
                completed_at: nowIso,
              };

              if (data.customerPhone) {
                quoteDetailsPayload.requester_phone = data.customerPhone;
              }

              const canonicalQuote = enforceCanonicalBriefIntegrity({
                unit: 'internal',
                project_name: quoteTitle,
                decision_maker: 'CC',
                okr_links: ['KR1', 'R1', 'R2'],
                details: quoteDetailsPayload,
              });

              if (createdBriefId) {
                await supabase.from('briefs').update({
                  project_name: quoteTitle,
                  status: 'completed',
                  completed_at: nowIso,
                  assignee_id: effectiveAssignee || null,
                  details: canonicalQuote.details,
                  deadline: dl30 || null,
                  coordinator_nickname: data.customerName || 'ลูกค้า'
                }).eq('id', createdBriefId);
              } else {
                const { data: ins, error: insErr } = await supabase.from('briefs').insert([{
                  project_name: quoteTitle,
                  unit: 'internal',
                  status: 'completed',
                  completed_at: nowIso,
                  priority: 'Medium',
                  deadline: dl30 || null,
                  assignee_id: effectiveAssignee || null,
                  okr_links: canonicalQuote.okr_links,
                  details: canonicalQuote.details,
                  requester_email: 'internal@step.cmu.ac.th',
                  coordinator_nickname: data.customerName || 'ลูกค้า',
                  decision_maker: 'CC'
                }]).select('id').single();

                if (!insErr && ins) {
                  setCreatedBriefId(ins.id);
                }
              }
              window.dispatchEvent(new CustomEvent("cc_tasks_updated"));
            } catch (autoSaveErr) {
              console.warn("Auto save quotation brief warning:", autoSaveErr);
            }

            // DO NOT close modal on save - user stays inside to print/export until they click close (X)!
          }}
        />
      )}
    </div>
  );
}
