"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  FolderPlus,
  Layers,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Code,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import {
  DATA_CATEGORY_GROUPS,
  DataCategoryGroupId,
  CustomCategoryFieldDefinition,
  CustomCategoryRecord,
  CustomDataCategoryDefinition,
  CustomFieldType,
  normalizeCategorySlug,
  buildCustomCategoryConfigKey,
} from "@/config/dataCategories";
import {
  inspectSupabaseArchitecture,
  organizeAndOptimizeSupabase,
  createCustomCategory,
  deleteCustomCategory,
  getCustomCategoryRecords,
  addCustomCategoryRecord,
  deleteCustomCategoryRecord,
  SupabaseArchitectureSummary,
} from "@/services/supabaseDataStore";

export default function SupabaseCategoryManager() {
  const [summary, setSummary] = useState<SupabaseArchitectureSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Create new category modal/panel state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newGroup, setNewGroup] = useState<DataCategoryGroupId>("CUSTOM_CATEGORIES");
  const [newFields, setNewFields] = useState<CustomCategoryFieldDefinition[]>([
    { key: "title", label: "ชื่อรายการ / หัวข้อ", type: "text", required: true },
    { key: "category", label: "หมวดหมู่ย่อย", type: "text" },
    { key: "url", label: "ลิงก์อ้างอิง / URL", type: "url" },
    { key: "notes", label: "หมายเหตุ", type: "text" },
  ]);
  const [creating, setCreating] = useState(false);

  // Active custom category record viewer/editor
  const [activeCustomCat, setActiveCustomCat] = useState<CustomDataCategoryDefinition | null>(null);
  const [customRecords, setCustomRecords] = useState<CustomCategoryRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordValues, setRecordValues] = useState<Record<string, any>>({});
  const [savingRecord, setSavingRecord] = useState(false);

  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    CUSTOM_CATEGORIES: true,
    OKR_AND_STRATEGY: true,
    PORTAL_MODULES: true,
    SERVICE_AND_FINANCE: false,
    LINE_AND_AI: false,
    SYSTEM_AND_AUDIT: false,
  });

  const loadArchitecture = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inspectSupabaseArchitecture();
      setSummary(data);
    } catch (err) {
      console.error("Failed to inspect Supabase architecture:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchitecture();
  }, [loadArchitecture]);

  const handleOptimize = async () => {
    setOptimizing(true);
    setStatusMessage(null);
    try {
      const res = await organizeAndOptimizeSupabase();
      setStatusMessage(`✅ ${res.message}`);
      await loadArchitecture();
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddFieldRow = () => {
    setNewFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: "", type: "text", required: false },
    ]);
  };

  const handleRemoveFieldRow = (idx: number) => {
    setNewFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (
    idx: number,
    patch: Partial<CustomCategoryFieldDefinition>
  ) => {
    setNewFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatusMessage(null);
    try {
      const validFields = newFields
        .filter((f) => f.key.trim() && f.label.trim())
        .map((f) => ({
          ...f,
          key: f.key.trim().replace(/[^a-zA-Z0-9_]/g, "_"),
          label: f.label.trim(),
        }));

      const res = await createCustomCategory({
        slug: newSlug,
        title: newTitle,
        description: newDesc,
        groupId: newGroup,
        fields: validFields,
      });

      if (!res.success) {
        setStatusMessage(`⚠️ ${res.error}`);
        return;
      }

      setStatusMessage(
        `✅ สร้างหมวดข้อมูลใหม่ "${res.category?.title}" (${res.category?.configKey}) ใน Supabase เรียบร้อยแล้ว`
      );
      setNewTitle("");
      setNewSlug("");
      setNewDesc("");
      setShowCreateForm(false);
      await loadArchitecture();
      if (res.category) {
        openCustomCategoryRecords(res.category);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (cat: CustomDataCategoryDefinition) => {
    if (!confirm(`ยืนยันการลบหมวดข้อมูล "${cat.title}" (${cat.configKey}) ออกจาก Supabase?`)) {
      return;
    }
    const res = await deleteCustomCategory(cat.id);
    if (res.success) {
      setStatusMessage(`🗑️ ลบหมวดข้อมูล "${cat.title}" เรียบร้อยแล้ว`);
      if (activeCustomCat?.id === cat.id) {
        setActiveCustomCat(null);
        setCustomRecords([]);
      }
      await loadArchitecture();
    } else {
      setStatusMessage(`⚠️ ${res.error}`);
    }
  };

  const openCustomCategoryRecords = async (cat: CustomDataCategoryDefinition) => {
    setActiveCustomCat(cat);
    setLoadingRecords(true);
    const initialVals: Record<string, any> = {};
    cat.fields.forEach((f) => {
      initialVals[f.key] = "";
    });
    setRecordValues(initialVals);
    try {
      const recs = await getCustomCategoryRecords(cat.configKey);
      setCustomRecords(recs);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomCat) return;
    setSavingRecord(true);
    try {
      const res = await addCustomCategoryRecord(activeCustomCat.configKey, recordValues);
      if (res.success && res.record) {
        setCustomRecords((prev) => [res.record!, ...prev]);
        const resetVals: Record<string, any> = {};
        activeCustomCat.fields.forEach((f) => {
          resetVals[f.key] = "";
        });
        setRecordValues(resetVals);
        await loadArchitecture();
      }
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!activeCustomCat) return;
    const res = await deleteCustomCategoryRecord(activeCustomCat.configKey, recordId);
    if (res.success) {
      setCustomRecords((prev) => prev.filter((r) => r.id !== recordId));
      await loadArchitecture();
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-base">
                สารบบหมวดหมู่ข้อมูลหลังบ้าน (Supabase Data Categories & Schema)
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                Modular Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดระเบียบตารางหลักและชุดข้อมูลโมดูลย่อยใน Supabase เป็นหมวดหมู่ชัดเจน พร้อมสร้างหมวดการเก็บข้อมูลใหม่ได้ทันทีโดยไม่กระทบโค้ดส่วนอื่น
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing || loading}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} className={optimizing ? "animate-spin" : ""} />
            {optimizing ? "กำลังจัดระเบียบ..." : "จัดระเบียบฐานข้อมูล"}
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FolderPlus size={14} />
            + เพิ่มหมวดข้อมูลใน Supabase
          </button>

          <button
            type="button"
            onClick={loadArchitecture}
            disabled={loading}
            className="p-2 rounded-xl border border-surface-border hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 transition-colors cursor-pointer"
            title="รีเฟรชข้อมูลหมวดหมู่"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-700 dark:text-sky-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline ml-3 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* 1. Core Relational Tables Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <Database size={12} /> ตารางหลัก #1: briefs
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                Active {summary.tables.briefs.activeCount} งาน
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
              งานที่ใช้งานจริง {summary.tables.briefs.activeCount} รายการ • ถังขยะ {summary.tables.briefs.trashedCount} • ล้างแล้ว (Purged) {summary.tables.briefs.purgedCount}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                <Database size={12} /> ตารางหลัก #2: assignees
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
                Active {summary.tables.assignees.activeCount} คน
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
              บุคลากรทั้งหมดในฐานข้อมูล {summary.tables.assignees.totalRows} รายการ (ทีมปฏิบัติการ & ผู้บริหาร)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <Database size={12} /> ตารางหลัก #3: okr_settings
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                {summary.tables.okrSettings.totalSizeKb} KB
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
              ตัวชี้วัดหลัก {summary.tables.okrSettings.okrIndicatorsCount} ข้อ • โมดูลระบบ {summary.tables.okrSettings.systemConfigsCount} หมวด • สร้างเพิ่ม {summary.tables.okrSettings.customCategoriesCount} หมวด
            </p>
          </div>
        </div>
      )}

      {/* 2. Form to Create a New Data Category in Supabase */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateCategory}
          className="p-4 rounded-2xl bg-sky-500/5 border-2 border-sky-500/30 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <FolderPlus size={16} />
              สร้างหมวดการเก็บข้อมูลใหม่ใน Supabase (New Custom Data Category)
            </h5>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 mb-1">
                ชื่อหมวดข้อมูล (ภาษาไทย/อังกฤษ) *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น ทะเบียนพาร์ทเนอร์สื่อมวลชน"
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-white dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 mb-1">
                รหัสหมวดภาษาอังกฤษ (Slug Key) *
              </label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="เช่น MEDIA_PARTNERS"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-surface-border bg-white dark:bg-zinc-900"
              />
              {newSlug && (
                <p className="text-[10px] text-sky-600 mt-1 font-mono">
                  คีย์ใน Supabase: {buildCustomCategoryConfigKey(newSlug)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 mb-1">
                จัดอยู่ในกลุ่มหมวดหมู่หลัก
              </label>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value as DataCategoryGroupId)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-white dark:bg-zinc-900"
              >
                <option value="CUSTOM_CATEGORIES">7. หมวดข้อมูลเพิ่มเติมที่สร้างเอง (Custom)</option>
                <option value="PORTAL_MODULES">4. หมวดฐานข้อมูลโมดูลเฉพาะทาง (Portal Modules)</option>
                <option value="SERVICE_AND_FINANCE">3. หมวดบริการ การเงิน และรหัสงาน</option>
                <option value="OKR_AND_STRATEGY">2. หมวดเป้าหมาย OKRs & แผนปฏิบัติการ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 mb-1">
              คำอธิบายวัตถุประสงค์ของหมวดข้อมูลนี้
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="อธิบายว่าหมวดข้อมูลนี้ใช้เก็บอะไร หรือเชื่อมต่อกับฟีเจอร์ใดในอนาคต"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-white dark:bg-zinc-900"
            />
          </div>

          {/* Field Schema Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                โครงสร้างฟิลด์ข้อมูลในหมวดนี้ (Schema Fields)
              </label>
              <button
                type="button"
                onClick={handleAddFieldRow}
                className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> เพิ่มฟิลด์ใหม่
              </button>
            </div>

            <div className="space-y-2">
              {newFields.map((field, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => handleFieldChange(idx, { key: e.target.value })}
                    placeholder="field_key"
                    className="col-span-4 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-surface-border bg-white dark:bg-zinc-900"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                    placeholder="ชื่อฟิลด์แสดงผล (เช่น ชื่อสื่อ/สำนักข่าว)"
                    className="col-span-5 px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-white dark:bg-zinc-900"
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      handleFieldChange(idx, { type: e.target.value as CustomFieldType })
                    }
                    className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-surface-border bg-white dark:bg-zinc-900"
                  >
                    <option value="text">ข้อความ (Text)</option>
                    <option value="number">ตัวเลข (Number)</option>
                    <option value="date">วันที่ (Date)</option>
                    <option value="url">ลิงก์ (URL)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveFieldRow(idx)}
                    disabled={newFields.length <= 1}
                    className="col-span-1 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3.5 py-2 rounded-xl border border-surface-border text-xs font-bold text-slate-600 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {creating ? "กำลังสร้างใน Supabase..." : "บันทึกและสร้างหมวดข้อมูลใน Supabase"}
            </button>
          </div>
        </form>
      )}

      {/* 3. Active Custom Category Data Manager Drawer */}
      {activeCustomCat && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border-2 border-sky-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-500/10 text-sky-600 font-mono">
                  {activeCustomCat.configKey}
                </span>
                <h5 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  จัดการข้อมูลในหมวด: {activeCustomCat.title}
                </h5>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeCustomCat.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `import { getCustomCategoryRecords } from "@/services/supabaseDataStore";\nconst records = await getCustomCategoryRecords("${activeCustomCat.slug}");`
                  );
                  setStatusMessage(`📋 คัดลอกโค้ดสำหรับดึงข้อมูลหมวด ${activeCustomCat.slug} แล้ว`);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-200/70 dark:bg-zinc-800 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                <Code size={12} /> คัดลอกโค้ดเชื่อมต่อ (Dev Snippet)
              </button>
              <button
                type="button"
                onClick={() => setActiveCustomCat(null)}
                className="px-2.5 py-1.5 rounded-lg border border-surface-border text-[11px] font-bold text-slate-500 cursor-pointer"
              >
                ปิดหน้าต่างหมวดนี้
              </button>
            </div>
          </div>

          {/* Add Record Form */}
          <form onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            {activeCustomCat.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  {field.label} {field.required ? "*" : ""}
                </label>
                <input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  required={field.required}
                  value={recordValues[field.key] || ""}
                  onChange={(e) =>
                    setRecordValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.label}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-border bg-white dark:bg-zinc-800"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={savingRecord}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              {savingRecord ? "กำลังบันทึก..." : "เพิ่มรายการลง Supabase"}
            </button>
          </form>

          {/* Records Table */}
          <div className="overflow-x-auto rounded-xl border border-surface-border bg-white dark:bg-zinc-900">
            {loadingRecords ? (
              <p className="p-4 text-xs text-slate-400 text-center">กำลังโหลดข้อมูลจาก Supabase...</p>
            ) : customRecords.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center">
                ยังไม่มีรายการข้อมูลในหมวดนี้ สามารถกรอกฟอร์มด้านบนเพื่อเพิ่มข้อมูลชุดแรกเข้าสู่ Supabase ได้ทันที
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-border bg-slate-50 dark:bg-zinc-800/60">
                    {activeCustomCat.fields.map((f) => (
                      <th key={f.key} className="py-2 px-3 font-bold text-slate-600 dark:text-zinc-300">
                        {f.label}
                      </th>
                    ))}
                    <th className="py-2 px-3 font-bold text-slate-600 dark:text-zinc-300 text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {customRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                      {activeCustomCat.fields.map((f) => {
                        const val = rec.values?.[f.key];
                        return (
                          <td key={f.key} className="py-2 px-3 text-slate-700 dark:text-zinc-200">
                            {f.type === "url" && val ? (
                              <a
                                href={String(val)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:underline inline-flex items-center gap-1"
                              >
                                เปิดลิงก์ <ExternalLink size={11} />
                              </a>
                            ) : (
                              String(val ?? "-")
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 4. Categorized Collections Accordion List */}
      {summary && (
        <div className="space-y-2.5">
          {(
            [
              "CUSTOM_CATEGORIES",
              "OKR_AND_STRATEGY",
              "PORTAL_MODULES",
              "SERVICE_AND_FINANCE",
              "LINE_AND_AI",
              "SYSTEM_AND_AUDIT",
            ] as DataCategoryGroupId[]
          ).map((groupId) => {
            const groupMeta = DATA_CATEGORY_GROUPS[groupId];
            const items = summary.categories.filter((c) => c.groupId === groupId);
            const isExpanded = Boolean(expandedGroups[groupId]);
            const totalKb = items.reduce((acc, i) => acc + i.sizeKb, 0).toFixed(1);

            return (
              <div
                key={groupId}
                className="rounded-xl border border-surface-border overflow-hidden bg-slate-50/40 dark:bg-zinc-900/40"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(groupId)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: groupMeta.badgeColor }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                        {groupMeta.title}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                        ({groupMeta.subtitle})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {items.length} หมวดย่อย • {totalKb} KB
                    </span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-surface-border/60 divide-y divide-surface-border/60">
                    {items.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        ยังไม่มีหมวดข้อมูลที่สร้างเองในกลุ่มนี้ — กดปุ่ม{" "}
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(true)}
                          className="text-sky-600 font-bold hover:underline cursor-pointer"
                        >
                          + เพิ่มหมวดข้อมูลใน Supabase
                        </button>{" "}
                        ด้านบนเพื่อสร้างหมวดใหม่ได้ทันที
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.configKey}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                                {item.title}
                              </span>
                              <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
                                {item.configKey}
                              </code>
                              {item.isCustomCategory && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 font-bold">
                                  Custom Category
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
                              {item.recordCount} รายการ
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                item.health === "healthy"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : item.health === "warning"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                              }`}
                            >
                              {item.sizeKb} KB
                            </span>

                            {item.isCustomCategory && item.customCategoryDef && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openCustomCategoryRecords(item.customCategoryDef!)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <FileSpreadsheet size={12} /> จัดการข้อมูล
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(item.customCategoryDef!)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  title="ลบหมวดข้อมูลนี้"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
