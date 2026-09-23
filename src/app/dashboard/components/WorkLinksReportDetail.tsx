"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Link2,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Pin,
  Check,
  X,
  Download,
  RotateCcw,
  Globe,
  FolderGit2,
  Layers,
  Sparkles,
  Share2,
  Copy,
  Building2,
  HardDrive,
  Tag,
  FolderPlus
} from "lucide-react";
import CustomSelect, { Option } from "./CustomSelect";
import ExportDataDropdown from "./ExportDataDropdown";

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

const DEFAULT_WORK_LINKS: WorkLinkItem[] = [
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

export default function WorkLinksReportDetail() {
  const [links, setLinks] = useState<WorkLinkItem[]>(DEFAULT_WORK_LINKS);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WorkLinkItem | null>(null);
  const [editIsCustomSubCategory, setEditIsCustomSubCategory] = useState(false);
  const [editCustomSubCategoryInput, setEditCustomSubCategoryInput] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // New Link State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("ระบบภายใน STeP");
  const [newSubCategory, setNewSubCategory] = useState<string>("CC Tracking & ISO");
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [customSubCategoryInput, setCustomSubCategoryInput] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("https://");
  const [newUnits, setNewUnits] = useState("ทุกยูนิตในทีม CC");
  const [newPinned, setNewPinned] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_work_links_v2");
      if (saved) {
        try {
          setLinks(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveLinks = (items: WorkLinkItem[]) => {
    setLinks(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_work_links_v2", JSON.stringify(items));
    }
  };

  // Available Subcategories for filter & selections
  const availableSubCategories = useMemo(() => {
    const set = new Set<string>();
    if (selectedCategory !== "ALL" && DEFAULT_SUBCATEGORIES_BY_CAT[selectedCategory]) {
      DEFAULT_SUBCATEGORIES_BY_CAT[selectedCategory].forEach(s => set.add(s));
    } else {
      Object.values(DEFAULT_SUBCATEGORIES_BY_CAT).flat().forEach(s => set.add(s));
    }
    links.forEach(l => {
      if (l.subCategory && (selectedCategory === "ALL" || l.category === selectedCategory)) {
        set.add(l.subCategory);
      }
    });
    return Array.from(set);
  }, [links, selectedCategory]);

  const filteredLinks = useMemo(() => {
    return links
      .filter(item => {
        if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
        if (selectedSubCategory !== "ALL" && item.subCategory !== selectedSubCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.url.toLowerCase().includes(q) ||
            item.targetUnits.toLowerCase().includes(q) ||
            (item.subCategory && item.subCategory.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
  }, [links, selectedCategory, selectedSubCategory, searchQuery]);

  // Toggle Pinned
  const handleTogglePin = (id: string) => {
    const updated = links.map(l => (l.id === id ? { ...l, isPinned: !l.isPinned } : l));
    saveLinks(updated);
  };

  // Start Edit
  const handleStartEdit = (item: WorkLinkItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setEditIsCustomSubCategory(false);
    setEditCustomSubCategoryInput("");
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const finalSubCat = editIsCustomSubCategory
      ? (editCustomSubCategoryInput.trim() || editForm.subCategory || "หมวดย่อยทั่วไป")
      : (editForm.subCategory || "หมวดย่อยทั่วไป");

    const updatedItem = {
      ...editForm,
      subCategory: finalSubCat,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const updated = links.map(l => (l.id === editForm.id ? updatedItem : l));
    saveLinks(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("ต้องการลบลิงก์การทำงานนี้ใช่หรือไม่?")) {
      const updated = links.filter(l => l.id !== id);
      saveLinks(updated);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2500);
  };

  const handleResetToDefault = () => {
    if (confirm("ต้องการรีเซ็ตคลังลิงก์เป็นค่าเริ่มต้นใช่หรือไม่?")) {
      saveLinks(DEFAULT_WORK_LINKS);
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      alert("กรุณาระบุชื่อระบบและ URL ลิงก์");
      return;
    }

    const finalSubCategory = isCustomSubCategory
      ? (customSubCategoryInput.trim() || "หมวดย่อยทั่วไป")
      : (newSubCategory || "หมวดย่อยทั่วไป");

    const newItem: WorkLinkItem = {
      id: `wl-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      subCategory: finalSubCategory,
      description: newDescription.trim(),
      url: newUrl.trim(),
      targetUnits: newUnits.trim(),
      isPinned: newPinned,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const updated = [newItem, ...links];
    saveLinks(updated);
    setShowAddModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewUrl("https://");
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput("");
  };

  // Helper to build Subcategory Options for Dropdowns
  const getSubCategoryOptions = (cat: string): Option[] => {
    const presets = DEFAULT_SUBCATEGORIES_BY_CAT[cat] || [];
    const fromLinks = Array.from(new Set(links.filter(l => l.category === cat && l.subCategory).map(l => l.subCategory!)));
    const combined = Array.from(new Set([...presets, ...fromLinks]));

    const options: Option[] = combined.map(sub => ({
      value: sub,
      label: (
        <div className="flex items-center gap-2">
          <Tag size={12} className="text-amber-600 shrink-0" />
          <span>{sub}</span>
        </div>
      )
    }));

    options.push({
      value: "__custom__",
      label: (
        <div className="flex items-center gap-1.5 text-[#E03131] font-bold">
          <Plus size={13} className="shrink-0" />
          <span>+ เพิ่มหมวดย่อยใหม่ (พิมพ์เอง)...</span>
        </div>
      )
    });

    return options;
  };

  const categoryDropdownOptions: Option[] = WORK_LINK_CATEGORIES.map(cat => ({
    value: cat,
    label: (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#E03131]" />
        <span className="font-semibold">{cat}</span>
      </div>
    )
  }));

  // Export to CSV
  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"ทะเบียนลิ้งค์อื่นๆ ที่เกี่ยวข้อง ทีม CC (Related Quick Links 2026)"`);
    lines.push(`"อ้างอิงเอกสาร","Google Sheet ทะเบียนลิงก์การทำงาน CC (https://docs.google.com/spreadsheets/d/1IOaPxt095bc7M_xsdUmspY_WHkpOncx3/edit?gid=1479523574#gid=1479523574)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");
    lines.push('"ลำดับ","ชื่อระบบ / ทรัพยากร","หมวดหมู่หลัก","หมวดย่อย","คำอธิบายการใช้งาน","URL ลิงก์","ยูนิตผู้ใช้งาน","ปักหมุด","วันที่อัปเดต"');

    links.forEach((l, idx) => {
      lines.push(`${idx + 1},"${l.title.replace(/"/g, '""')}","${l.category}","${(l.subCategory || "").replace(/"/g, '""')}","${l.description.replace(/"/g, '""')}","${l.url}","${l.targetUnits}","${l.isPinned ? "ปักหมุด" : "-"}","${l.updatedAt}"`);
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Related_Quick_Links_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold border border-cyan-200">
              <Link2 size={14} className="text-cyan-600" />
              <span>CC Work Resource &amp; External Portal Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ลิ้งค์อื่นๆ ที่เกี่ยวข้อง (Related Quick Links &amp; Resources)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ศูนย์รวมลิ้งค์เครื่องมือทำงาน คลาวด์ไดรฟ์ส่วนกลาง แพลตฟอร์มโซเชียล และแบบฟอร์มทางการ พร้อมระบบจัดหมวดหมู่และหมวดย่อย ให้อ่านง่ายและเข้าถึงรวดเร็ว
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href="https://docs.google.com/spreadsheets/d/1IOaPxt095bc7M_xsdUmspY_WHkpOncx3/edit?gid=1479523574#gid=1479523574"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all shadow-2xs"
              title="เปิด Google Sheet ต้นทาง"
            >
              <span>เปิด Google Sheet</span>
              <ExternalLink size={12} />
            </a>

            <ExportDataDropdown
              reportId="work-links"
              reportTitle="ทำเนียบลิงก์งาน (Work Links)"
              buttonText="Export Data"
            />

            <button
              onClick={() => {
                setShowAddModal(true);
                setIsCustomSubCategory(false);
                setCustomSubCategoryInput("");
                const presets = DEFAULT_SUBCATEGORIES_BY_CAT[newCategory] || [];
                if (presets.length > 0) setNewSubCategory(presets[0]);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span>เพิ่มลิ้งค์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Categories Pill Filter & SubCategory Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["ALL", ...WORK_LINK_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubCategory("ALL");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "ทั้งหมดทุกหมวด" : cat}
              </button>
            ))}

            {/* SubCategory Filter Dropdown */}
            {availableSubCategories.length > 0 && (
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                  <Tag size={11} className="text-amber-600" />
                  <span>หมวดย่อย:</span>
                </span>
                <CustomSelect
                  value={selectedSubCategory}
                  onChange={(val) => setSelectedSubCategory(val)}
                  options={[
                    { value: "ALL", label: "ทุกหมวดย่อย" },
                    ...availableSubCategories.map(sub => ({
                      value: sub,
                      label: `# ${sub}`
                    }))
                  ]}
                  triggerClassName="h-8 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-full font-bold text-amber-900 text-xs shadow-2xs transition-all flex items-center gap-1.5 text-left"
                  dropdownClassName="w-60"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อระบบ, URL, หมวดย่อย..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-60 sm:w-64"
              />
            </div>

            <button
              onClick={handleResetToDefault}
              title="รีเซ็ตคลังลิงก์เป็นค่าเริ่มต้น"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Links List View */}
      <div className="space-y-3">
        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            <Link2 size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">ไม่พบลิ้งค์ที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          filteredLinks.map((item, index) => {
            const isEditing = editingId === item.id;

            if (isEditing && editForm) {
              return (
                <div key={item.id} className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-sm space-y-4 animate-premium-fade">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Edit2 size={13} />
                      แก้ไขข้อมูลลิ้งค์: {item.title}
                    </span>
                    <span className="text-[11px] font-mono text-amber-700">ID: {item.id}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">ชื่อระบบ / หัวข้อ:</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="ชื่อระบบ"
                        className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">หมวดหมู่หลัก:</label>
                      <CustomSelect
                        value={editForm.category}
                        onChange={(val) => {
                          const presets = DEFAULT_SUBCATEGORIES_BY_CAT[val] || [];
                          setEditForm({
                            ...editForm,
                            category: val,
                            subCategory: presets.length > 0 ? presets[0] : editForm.subCategory
                          });
                          setEditIsCustomSubCategory(false);
                        }}
                        options={categoryDropdownOptions}
                        triggerClassName="w-full h-10 px-3 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 text-xs shadow-2xs text-left"
                        dropdownClassName="w-full"
                      />
                    </div>
                  </div>

                  {/* Subcategory Selector & Write-in */}
                  <div className="p-3 bg-white/90 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag size={12} className="text-amber-600" />
                        <span>หมวดย่อย (Subcategory):</span>
                      </label>
                      <span className="text-[10px] text-slate-500">เลือกจากรายการ หรือ เพิ่มหมวดย่อยใหม่</span>
                    </div>

                    <CustomSelect
                      value={editIsCustomSubCategory ? "__custom__" : (editForm.subCategory || "")}
                      onChange={(val) => {
                        if (val === "__custom__") {
                          setEditIsCustomSubCategory(true);
                        } else {
                          setEditIsCustomSubCategory(false);
                          setEditForm({ ...editForm, subCategory: val });
                        }
                      }}
                      options={getSubCategoryOptions(editForm.category)}
                      triggerClassName="w-full h-10 px-3 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-xs shadow-2xs text-left"
                      dropdownClassName="w-full"
                    />

                    {editIsCustomSubCategory && (
                      <div className="pt-1 animate-premium-fade space-y-1">
                        <label className="text-[10.5px] font-bold text-amber-800 flex items-center gap-1">
                          <Plus size={11} className="text-amber-600" />
                          พิมพ์ชื่อหมวดย่อยใหม่ที่ต้องการ:
                        </label>
                        <input
                          type="text"
                          value={editCustomSubCategoryInput}
                          onChange={e => setEditCustomSubCategoryInput(e.target.value)}
                          placeholder="เช่น แคมเปญพิเศษ, โมบายแอป, ภาพถ่ายสต็อก..."
                          className="w-full p-2 border border-amber-400 rounded-xl text-xs font-semibold bg-amber-50/50 focus:bg-white focus:outline-none focus:border-[#E03131]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">URL ลิ้งค์:</label>
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 border border-amber-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">ยูนิตผู้ใช้งาน:</label>
                      <input
                        type="text"
                        value={editForm.targetUnits}
                        onChange={e => setEditForm({ ...editForm, targetUnits: e.target.value })}
                        placeholder="เช่น ทุกยูนิตในทีม CC"
                        className="w-full p-2 border border-amber-300 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">คำอธิบายรายละเอียด:</label>
                    <textarea
                      rows={2}
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="คำอธิบายการใช้งาน..."
                      className="w-full p-2 border border-amber-300 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => { setEditingId(null); setEditForm(null); }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-full cursor-pointer transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full cursor-pointer transition-all shadow-xs"
                    >
                      บันทึกการแก้ไข
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:shadow-md hover:border-slate-300 ${
                  item.isPinned
                    ? "ring-2 ring-orange-400/50 border-orange-300 bg-gradient-to-r from-orange-50/20 via-white to-white"
                    : "border-slate-200/90"
                }`}
              >
                {/* Left Info Section */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Category Pill / Pin Indicator */}
                  <div className="shrink-0 flex flex-col items-center gap-1 mt-0.5">
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      title={item.isPinned ? "ถอดหมุด" : "ปักหมุดรายการนี้"}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        item.isPinned
                          ? "text-orange-600 bg-orange-100/90 hover:bg-orange-200"
                          : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Pin size={15} className={item.isPinned ? "fill-current" : ""} />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">#{index + 1}</span>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      {item.subCategory && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1">
                          <Tag size={10} className="text-amber-600" />
                          <span>{item.subCategory}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                        ยูนิต: {item.targetUnits}
                      </span>
                      {item.isPinned && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800">
                          ปักหมุด
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        อัปเดต: {item.updatedAt}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#E03131] hover:underline transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink size={13} className="text-slate-400 inline shrink-0" />
                      </a>
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-0.5">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-cyan-700 hover:text-cyan-900 hover:underline truncate max-w-xl block"
                      >
                        {item.url}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Actions Toolbar */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end shrink-0">
                  <button
                    onClick={() => handleCopy(item.url, item.id)}
                    title="คัดลอก URL"
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copySuccessId === item.id ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>คัดลอกลิ้งค์</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEdit(item)}
                    title="แก้ไขข้อมูล"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="ลบลิ้งค์"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs group active:scale-98"
                  >
                    <span>เปิดลิ้งค์</span>
                    <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-[#E03131] flex items-center justify-center">
                  <Link2 size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  เพิ่มลิ้งค์อื่นๆ ที่เกี่ยวข้อง / ทรัพยากรใหม่
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLink} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อระบบ / โฟลเดอร์ / ทรัพยากร:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="เช่น Google Drive สื่อประชาสัมพันธ์กิจกรรม..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">หมวดหมู่หลัก:</label>
                  <CustomSelect
                    value={newCategory}
                    onChange={(val) => {
                      setNewCategory(val);
                      const presets = DEFAULT_SUBCATEGORIES_BY_CAT[val] || [];
                      if (presets.length > 0) {
                        setNewSubCategory(presets[0]);
                      }
                      setIsCustomSubCategory(false);
                    }}
                    options={categoryDropdownOptions}
                    triggerClassName="w-full h-[42px] px-3.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs shadow-2xs text-left"
                    dropdownClassName="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ยูนิตผู้ใช้งานหลัก:</label>
                  <input
                    type="text"
                    value={newUnits}
                    onChange={e => setNewUnits(e.target.value)}
                    placeholder="เช่น ทุกยูนิตในทีม CC"
                    className="w-full h-[42px] px-3.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Subcategory Selection & Custom Write-in */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-600" />
                    <span>หมวดย่อย (Subcategory):</span>
                  </label>
                  <span className="text-[10.5px] text-slate-500">เลือกที่มีอยู่ หรือ พิมพ์ใหม่</span>
                </div>

                <CustomSelect
                  value={isCustomSubCategory ? "__custom__" : newSubCategory}
                  onChange={(val) => {
                    if (val === "__custom__") {
                      setIsCustomSubCategory(true);
                    } else {
                      setIsCustomSubCategory(false);
                      setNewSubCategory(val);
                    }
                  }}
                  options={getSubCategoryOptions(newCategory)}
                  triggerClassName="w-full h-[40px] px-3.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs shadow-2xs text-left"
                  dropdownClassName="w-full"
                />

                {isCustomSubCategory && (
                  <div className="pt-1 animate-premium-fade space-y-1">
                    <label className="text-[10.5px] font-bold text-amber-800 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-600" />
                      ระบุชื่อหมวดย่อยใหม่:
                    </label>
                    <input
                      type="text"
                      required={isCustomSubCategory}
                      value={customSubCategoryInput}
                      onChange={e => setCustomSubCategoryInput(e.target.value)}
                      placeholder="พิมพ์ชื่อหมวดย่อยใหม่ เช่น นิทรรศการ, คอนเทนต์ AI..."
                      className="w-full p-2.5 rounded-xl bg-white border border-amber-300 font-semibold text-xs text-slate-900 focus:outline-none focus:border-[#E03131] shadow-2xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">URL ลิ้งค์ปลายทาง:</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">คำอธิบายการใช้งาน:</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="อธิบายสั้นๆ ว่าลิ้งค์นี้ใช้ทำอะไร หรือใครต้องเข้าถึง..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={newPinned}
                  onChange={e => setNewPinned(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-700 font-bold cursor-pointer">
                  ปักหมุดรายการนี้ (แสดงด้านบนสุด)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  บันทึกเข้าสู่คลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
