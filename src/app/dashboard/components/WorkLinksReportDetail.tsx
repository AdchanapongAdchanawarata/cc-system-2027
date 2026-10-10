"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  FolderPlus,
  Cloud,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  AlertCircle,
  Eye
} from "lucide-react";
import CustomSelect, { Option } from "./CustomSelect";
import ExportDataDropdown from "./ExportDataDropdown";
import { createClient } from "@/utils/supabase/client";
import {
  WorkLinkItem,
  WORK_LINK_CATEGORIES,
  DEFAULT_SUBCATEGORIES_BY_CAT,
  DEFAULT_WORK_LINKS,
  fetchWorkLinksFromSupabase,
  saveWorkLinksToSupabase,
  parsePastedSheetRows,
  getLocalCachedWorkLinks
} from "@/utils/workLinksService";

export type { WorkLinkItem };
export { WORK_LINK_CATEGORIES, DEFAULT_SUBCATEGORIES_BY_CAT };

export default function WorkLinksReportDetail() {
  const [currentUserRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cc_user_role") || "admin";
    }
    return "admin";
  });
  const isViewer = currentUserRole === "viewer";

  const [links, setLinks] = useState<WorkLinkItem[]>(() => {
    if (typeof window !== "undefined") {
      return getLocalCachedWorkLinks();
    }
    return DEFAULT_WORK_LINKS;
  });
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WorkLinkItem | null>(null);
  const [editIsCustomSubCategory, setEditIsCustomSubCategory] = useState(false);
  const [editCustomSubCategoryInput, setEditCustomSubCategoryInput] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"synced" | "saving" | "loading" | "error">("loading");
  const [syncToast, setSyncToast] = useState<string | null>(null);

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

  // Import State
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [parsedImportItems, setParsedImportItems] = useState<WorkLinkItem[]>([]);

  const triggerToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // 1. Initial Load: Fetch from Supabase Cloud
  const loadLinksFromCloud = useCallback(async () => {
    setCloudSyncStatus("loading");
    try {
      const { links: cloudLinks, source } = await fetchWorkLinksFromSupabase();
      if (cloudLinks && cloudLinks.length > 0) {
        setLinks(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(cloudLinks);
          return prevStr === nextStr ? prev : cloudLinks;
        });
      }
      setCloudSyncStatus("synced");
      if (source === "cloud") {
        console.log(`[WorkLinks] Loaded ${cloudLinks.length} links from Supabase cloud`);
      }
    } catch (e) {
      console.error("Error loading links:", e);
      setCloudSyncStatus("error");
    }
  }, []);

  useEffect(() => {
    loadLinksFromCloud();

    // 2. Real-time Subscription to Supabase okr_settings changes
    const supabase = createClient();
    const channel = supabase
      .channel("work_links_realtime_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "okr_settings",
          filter: "description=eq.CONFIG_WORK_LINKS_JSON"
        },
        (payload: any) => {
          if (payload.new && payload.new.target_value) {
            try {
              const freshLinks = JSON.parse(payload.new.target_value);
              if (Array.isArray(freshLinks)) {
                setLinks(freshLinks);
                setCloudSyncStatus("synced");
                triggerToast("⚡ ข้อมูลลิงก์อัปเดตแบบเรียลไทม์จากระบบคลาวด์แล้ว");
              }
            } catch (err) {
              console.warn("Failed to parse realtime links update:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLinksFromCloud]);

  // Save links permanently to Cloud + LocalCache
  const saveLinks = async (items: WorkLinkItem[], customSuccessMsg?: string) => {
    setLinks(items);
    setCloudSyncStatus("saving");

    const res = await saveWorkLinksToSupabase(items);
    if (res.success) {
      setCloudSyncStatus("synced");
      triggerToast(customSuccessMsg || "✅ บันทึกขึ้นระบบคลาวด์ Supabase สำเร็จ");
    } else {
      setCloudSyncStatus("error");
      triggerToast(`⚠️ บันทึกลงแคชในเครื่องแล้ว (คลาวด์แจ้งเตือน: ${res.error || "ขัดข้อง"})`);
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
    saveLinks(updated, "✅ แก้ไขและบันทึกลิงก์ขึ้นระบบคลาวด์แล้ว");
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("ต้องการลบลิงก์การทำงานนี้ออกจากระบบคลาวด์ใช่หรือไม่?")) {
      const updated = links.filter(l => l.id !== id);
      saveLinks(updated, "🗑️ ลบลิงก์ออกจากระบบคลาวด์เรียบร้อยแล้ว");
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2500);
  };

  const handleResetToDefault = () => {
    if (confirm("ต้องการรีเซ็ตคลังลิงก์เป็นค่าเริ่มต้นระบบใช่หรือไม่?")) {
      saveLinks(DEFAULT_WORK_LINKS, "🔄 รีเซ็ตคลังลิงก์เป็นค่าเริ่มต้นสำเร็จ");
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
    saveLinks(updated, `✅ เพิ่มลิงก์ "${newItem.title}" เข้าสู่ระบบคลาวด์สำเร็จ`);
    setShowAddModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewUrl("https://");
    setIsCustomSubCategory(false);
    setCustomSubCategoryInput("");
  };

  // Handle Google Sheet / CSV Paste & Import
  const handleImportTextChange = (text: string) => {
    setImportText(text);
    const parsed = parsePastedSheetRows(text);
    setParsedImportItems(parsed);
  };

  const handleExecuteImport = () => {
    if (parsedImportItems.length === 0) {
      alert("ไม่พบรายการลิงก์ที่สามารถนำเข้าได้ กรุณาตรวจสอบข้อมูลที่คัดลอกมา");
      return;
    }

    let finalLinks: WorkLinkItem[] = [];
    if (importMode === "append") {
      finalLinks = [...parsedImportItems, ...links];
    } else {
      finalLinks = [...parsedImportItems];
    }

    saveLinks(finalLinks, `🎉 นำเข้าข้อมูลสำเร็จ ${parsedImportItems.length} รายการ สู่ระบบคลาวด์`);
    setShowImportModal(false);
    setImportText("");
    setParsedImportItems([]);
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

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-[99999] bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-zinc-700 flex items-center gap-2 animate-bounce">
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold border border-cyan-200">
                <Link2 size={14} className="text-cyan-600" />
                <span>CC Work Resource &amp; External Portal Directory</span>
              </div>

              {/* Cloud Sync Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                {cloudSyncStatus === "saving" ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-emerald-600" />
                    <span>กำลังบันทึกสู่ Supabase...</span>
                  </>
                ) : cloudSyncStatus === "loading" ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-emerald-600" />
                    <span>กำลังดึงข้อมูลคลาวด์...</span>
                  </>
                ) : cloudSyncStatus === "error" ? (
                  <>
                    <AlertCircle size={12} className="text-amber-600" />
                    <span>ทำงานในโหมดออฟไลน์</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>ซิงค์คลาวด์ Supabase แล้ว ({links.length} รายการ)</span>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              ลิ้งค์อื่นๆ ที่เกี่ยวข้อง (Related Quick Links &amp; Resources)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ศูนย์รวมลิ้งค์เครื่องมือทำงาน คลาวด์ไดรฟ์ส่วนกลาง แพลตฟอร์มโซเชียล และแบบฟอร์มทางการ บันทึกและซิงค์ผ่านคลาวด์อัตโนมัติ เข้าถึงได้จากทุกอุปกรณ์
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Direct Google Sheet Link */}
            <a
              href="https://docs.google.com/spreadsheets/d/1IOaPxt095bc7M_xsdUmspY_WHkpOncx3/edit?gid=1479523574#gid=1479523574"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all shadow-2xs"
              title="เปิด Google Sheet ต้นทางสำหรับจัดการลิงก์"
            >
              <span>เปิด Google Sheet</span>
              <ExternalLink size={12} />
            </a>

            {/* If viewer, show read-only badge, otherwise show import and add buttons */}
            {isViewer ? (
              <div className="px-3.5 py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <Eye size={13} className="text-cyan-600" />
                <span>โหมดผู้เข้าชม (Read-Only)</span>
              </div>
            ) : (
              <>
                {/* Smart Import Button */}
                <button
                  onClick={() => {
                    setImportText("");
                    setParsedImportItems([]);
                    setShowImportModal(true);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="คัดลอกจาก Google Sheet มาวางเพื่อเพิ่มหลายรายการพร้อมกัน"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  <span>นำเข้าจาก Sheet / CSV</span>
                </button>

                {/* Export Dropdown */}
                <ExportDataDropdown
                  reportId="work-links"
                  reportTitle="ทำเนียบลิงก์งาน (Work Links)"
                  buttonText="Export Data"
                />

                {/* Manual Add Button */}
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
              </>
            )}
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
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
              <Tag size={13} className="text-slate-500" />
              <span>หมวดย่อย:</span>
            </div>
            <CustomSelect
              value={selectedSubCategory}
              onChange={val => setSelectedSubCategory(val)}
              options={[
                { value: "ALL", label: "ทุกหมวดย่อย" },
                ...availableSubCategories.map(s => ({ value: s, label: s }))
              ]}
              triggerClassName="h-[34px] px-3 bg-slate-50 border border-slate-200 rounded-full font-bold text-xs text-slate-800 shadow-2xs"
              dropdownClassName="w-56"
            />
          </div>
        </div>

        {/* Search Bar & Reset Default Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อระบบ, URL, หมวดย่อย..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadLinksFromCloud}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
              title="ดึงข้อมูลล่าสุดจาก Supabase Cloud"
            >
              <RefreshCw size={11} className={cloudSyncStatus === "loading" ? "animate-spin" : ""} />
              <span>รีเฟรชคลาวด์</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-red-700 bg-slate-50 hover:bg-red-50 rounded-full transition-all cursor-pointer"
              title="รีเซ็ตกลับเป็น 8 รายการตั้งต้นของระบบ"
            >
              <RotateCcw size={11} />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Links List Cards */}
      <div className="space-y-3.5">
        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-800">ไม่พบลิงก์การทำงานตามเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-500">
              ลองเปลี่ยนหมวดหมู่ หรือเคลียร์คำค้นหา เพื่อดูรายการลิงก์ทั้งหมด
            </p>
          </div>
        ) : (
          filteredLinks.map((item, index) => {
            const isEditing = editingId === item.id;

            if (isEditing && editForm) {
              return (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border-2 border-orange-400 shadow-md space-y-4 animate-premium-fade"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-orange-600">แก้ไขข้อมูลลิงก์การทำงาน</span>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">ชื่อระบบ / โฟลเดอร์:</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">หมวดหมู่หลัก:</label>
                      <CustomSelect
                        value={editForm.category}
                        onChange={val => {
                          const presets = DEFAULT_SUBCATEGORIES_BY_CAT[val] || [];
                          setEditForm({
                            ...editForm,
                            category: val,
                            subCategory: presets.length > 0 ? presets[0] : editForm.subCategory
                          });
                          setEditIsCustomSubCategory(false);
                        }}
                        options={categoryDropdownOptions}
                        triggerClassName="w-full h-[40px] px-3.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs shadow-2xs text-left"
                        dropdownClassName="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">หมวดย่อย:</label>
                      <CustomSelect
                        value={editIsCustomSubCategory ? "__custom__" : (editForm.subCategory || "ทั่วไป")}
                        onChange={val => {
                          if (val === "__custom__") {
                            setEditIsCustomSubCategory(true);
                          } else {
                            setEditIsCustomSubCategory(false);
                            setEditForm({ ...editForm, subCategory: val });
                          }
                        }}
                        options={getSubCategoryOptions(editForm.category)}
                        triggerClassName="w-full h-[40px] px-3.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs shadow-2xs text-left"
                        dropdownClassName="w-full"
                      />
                      {editIsCustomSubCategory && (
                        <input
                          type="text"
                          value={editCustomSubCategoryInput}
                          onChange={e => setEditCustomSubCategoryInput(e.target.value)}
                          placeholder="พิมพ์หมวดย่อยใหม่..."
                          className="w-full mt-1.5 p-2 rounded-xl border border-amber-300 font-semibold text-xs text-slate-900 focus:outline-none focus:border-[#E03131] shadow-2xs"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">ยูนิตผู้ใช้งาน:</label>
                      <input
                        type="text"
                        value={editForm.targetUnits}
                        onChange={e => setEditForm({ ...editForm, targetUnits: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-700">URL ลิ้งก์ปลายทาง:</label>
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-700">คำอธิบายการใช้งาน:</label>
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
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
                className={`bg-white p-5 sm:p-6 rounded-3xl border transition-all duration-200 hover:shadow-md ${
                  item.isPinned
                    ? "border-orange-200 bg-gradient-to-r from-orange-50/20 via-white to-white"
                    : "border-slate-200/90 shadow-2xs"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Header Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10.5px] font-black border border-orange-200">
                          <Pin size={11} className="fill-orange-600 text-orange-600" />
                          <span>ปักหมุด</span>
                        </span>
                      )}

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                        {item.category}
                      </span>

                      {item.subCategory && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200">
                          <Tag size={10} className="text-amber-700" />
                          <span>{item.subCategory}</span>
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        ยูนิต: {item.targetUnits}
                      </span>

                      <span className="text-[10px] text-slate-400 font-medium ml-auto sm:ml-0">
                        อัปเดต: {item.updatedAt}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs font-semibold">#{index + 1}</span>
                      <span>{item.title}</span>
                    </h2>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    )}

                    {/* Link Display URL */}
                    <div className="pt-1">
                      <span className="text-[11px] font-mono text-cyan-700 hover:text-cyan-900 break-all select-all">
                        {item.url}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleCopy(item.url, item.id)}
                      className={`px-3 py-2 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        copySuccessId === item.id
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      title="คัดลอก URL ลิงก์"
                    >
                      {copySuccessId === item.id ? (
                        <>
                          <Check size={13} />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>คัดลอกลิ้งค์</span>
                        </>
                      )}
                    </button>

                    {!isViewer && (
                      <>
                        <button
                          onClick={() => handleTogglePin(item.id)}
                          className={`p-2 rounded-full transition-all cursor-pointer ${
                            item.isPinned
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                          }`}
                          title={item.isPinned ? "ถอนหมุด" : "ปักหมุดให้อยู่ด้านบน"}
                        >
                          <Pin size={14} className={item.isPinned ? "fill-orange-600" : ""} />
                        </button>

                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-black inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    >
                      <span>เปิดลิ้งค์</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Smart Import from Google Sheet / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    นำเข้าลิงก์จาก Google Sheet / CSV
                  </h3>
                  <p className="text-xs text-slate-500">
                    วางข้อมูลที่คัดลอกมาจาก Google Sheet เพื่อบันทึกขึ้น Supabase Cloud พร้อมกัน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-600" />
                  วิธีใช้งานง่ายๆ ใน 2 ขั้นตอน:
                </span>
                <p className="text-[11.5px] leading-relaxed text-amber-800">
                  1. เปิด Google Sheet แล้วลากคลุมแถวที่ต้องการ (Column: ชื่อลิงก์, URL, หมวดหมู่ ฯลฯ) แล้วกด <strong>Ctrl+C</strong><br />
                  2. วางลงในช่องด้านล่าง (<strong>Ctrl+V</strong>) ระบบจะแยกแยะชื่อและ URL ให้โดยอัตโนมัติ
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">วางแถวข้อมูลจาก Google Sheet ที่นี่:</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={e => handleImportTextChange(e.target.value)}
                  placeholder={`ตัวอย่างแถวข้อมูลที่ Copy มา:\nGoogle Drive กลาง\thttps://drive.google.com\tGoogle Drive ส่วนกลาง\nCanva Team Account\thttps://canva.com\tเครื่องมือออกแบบ & AI`}
                  className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-2xs"
                />
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-4 pt-1">
                <span className="font-bold text-slate-700">รูปแบบการนำเข้า:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                    className="text-emerald-600"
                  />
                  <span>เพิ่มต่อท้ายรายการเดิม (แนะนำ)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-emerald-600"
                  />
                  <span>แทนที่รายการเดิมทั้งหมด</span>
                </label>
              </div>

              {/* Parsed Preview */}
              {parsedImportItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    ตรวจพบข้อมูลที่พร้อมนำเข้า {parsedImportItems.length} รายการ:
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {parsedImportItems.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800 truncate max-w-xs">{i + 1}. {p.title}</span>
                        <span className="font-mono text-slate-400 text-[10px] truncate max-w-xs">{p.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={parsedImportItems.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  นำเข้า {parsedImportItems.length > 0 ? `(${parsedImportItems.length} รายการ)` : ""} ขึ้นคลาวด์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Work Link */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#E03131] flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  เพิ่มลิ้งค์ทรัพยากร / ระบบงานใหม่
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
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
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
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
                  บันทึกเข้าสู่ระบบคลาวด์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
