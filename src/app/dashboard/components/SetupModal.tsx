"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, Plus, Trash2, User, Target, DollarSign, Shield, 
  Edit2, Check, AlertCircle, Briefcase, Phone, Mail, Award, CheckCircle2,
  Sparkles, TrendingUp, Save, RotateCcw, HelpCircle, Star, Users, Info,
  Calculator, History, Calendar, BarChart3, PlusCircle, ArrowUpRight, ArrowDownRight, Minus,
  AlertTriangle, Link2, ExternalLink,
  Database, HardDrive, ShieldAlert, Archive, RefreshCw, Download, FileSpreadsheet,
  Lock, Unlock, ShieldCheck, Eye
} from "lucide-react";
import GoogleSheetsSyncHub from "./GoogleSheetsSyncHub";
import AuditLogsAndBackupHub from "./AuditLogsAndBackupHub";
import AiControlHub from "./AiControlHub";
import { 
  getStorageQuotaStats, 
  purgeCompletedTaskAttachments, 
  purgeLocalCache, 
  exportDatabaseBackup, 
  type StorageQuotaStats 
} from "@/utils/storageQuotaService";
import { 
  getStoredOKRSettings, 
  saveStoredOKRSettings, 
  fetchOKRSettingsFromSupabase,
  saveOKRSettingsToSupabase,
  OKRSettingsState, 
  DEFAULT_KRS, 
  DEFAULT_TIPS,
  KRMetric,
  RMetric,
  TIPMetric,
  QuarterlyRecord,
  computeActiveTarget,
  computeKRTargetFromR,
  computeReachEngagementValues,
  calculateQuarterGrowth
} from "@/utils/okrSettings";
import { createClient } from "@/utils/supabase/client";
import { fetchPricingFromCloud, savePricingToCloud, DEFAULT_STEP_PRICING, getStandardLeadTimeForService } from "@/utils/pricing";
import { 
  MemberProfile, 
  AssigneeRole, 
  parseMemberRecord, 
  encodeMemberUnit 
} from "@/utils/memberProfile";
import { getMemberSurveyUrl } from "@/utils/surveyTokens";
import CustomSelect, { Option } from "./CustomSelect";

const ASSIGNEE_UNIT_OPTIONS: Option[] = [
  { value: "creative", label: "🎨 DESIGN (Creative)" },
  { value: "content", label: "📝 CONTENT (Content)" },
  { value: "pr", label: "📢 PR (Public Relations)" },
  { value: "internal", label: "💼 INTERNAL (งานภายในทีม CC)" },
  { value: "management", label: "👔 Management (Executive)" },
];

const ASSIGNEE_ROLE_OPTIONS: Option[] = [
  { value: "assignee", label: "👤 Assignee (ผู้ปฏิบัติงาน)" },
  { value: "admin", label: "🛡️ Admin (ผู้ดูแลระบบ)" },
  { value: "executive", label: "👔 Executive (สำหรับส่ง/รับอีเมล ไม่ใช่งานปฏิบัติการ)" },
  { value: "viewer", label: "👁️ Viewer (ผู้เข้าชม - เข้าดูได้ทุกฟังก์ชัน แก้ไขไม่ได้)" },
];

const OKR_QUARTER_OPTIONS: Option[] = [
  { value: "Q1", label: "Q1 (ต.ค. - ธ.ค.)" },
  { value: "Q2", label: "Q2 (ม.ค. - มี.ค.)" },
  { value: "Q3", label: "Q3 (เม.ย. - มิ.ย.)" },
  { value: "Q4", label: "Q4 (ก.ค. - ก.ย.)" },
];

const PRICING_UNIT_OPTIONS: Option[] = [
  { value: "creative", label: "🎨 DESIGN (Creative Designer)" },
  { value: "content", label: "📝 CONTENT (Content Creator)" },
  { value: "pr", label: "📢 PR (Public Relations)" },
  { value: "internal", label: "💼 INTERNAL (งานภายในทีม CC)" },
];

const PRICING_UNIT_UPPER_OPTIONS: Option[] = [
  { value: "creative", label: "DESIGN (CREATIVE)" },
  { value: "content", label: "CONTENT" },
  { value: "pr", label: "PR" },
  { value: "internal", label: "INTERNAL" },
];

const KR_CURRENCY_OPTIONS: Option[] = [
  { value: "no", label: "ไม่ใช่ (นับเป็นจำนวน)" },
  { value: "yes", label: "ใช่ (เป็นยอดเงินบาท)" },
];

const R_COMPUTE_OPTIONS: Option[] = [
  { value: "auto", label: "⚡ คำนวณอัตโนมัติจากงาน" },
  { value: "manual", label: "✍️ กรอกสะสมเอง" },
];

type Assignee = MemberProfile;

type OKR = { 
  id: string; 
  type: string; 
  unit?: string;
  description: string; 
  target_value: string; 
  is_active: boolean; 
};

type ServicePricing = {
  id: string;
  unit: string;
  service_name: string;
  standard_price: number;
  lead_time_days?: number;
  description?: string;
  is_active: boolean;
};

// Default pricing fallback loaded dynamically from DEFAULT_STEP_PRICING (65 deliverables with lead times)
const DEFAULT_PRICING: Omit<ServicePricing, 'id'>[] = DEFAULT_STEP_PRICING.map(item => ({
  ...item,
  is_active: true
}));

export default function SetupModal({ onClose, isReadOnly = false }: { onClose: () => void; isReadOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<"team" | "okr" | "pricing" | "storage" | "sheets-sync" | "ai-control">("team");
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [activeBriefs, setActiveBriefs] = useState<any[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [pricingList, setPricingList] = useState<ServicePricing[]>([]);
  const [okrSubTab, setOkrSubTab] = useState<"krs" | "tips" | "responsibility">("krs");
  const [okrState, setOkrState] = useState<OKRSettingsState>(getStoredOKRSettings);
  const [saveOKRSuccess, setSaveOKRSuccess] = useState<string | null>(null);
  const [manualR5Input, setManualR5Input] = useState<string>(() => (getStoredOKRSettings().manualMetrics?.r5Reach || 0).toString());
  const [manualR6Input, setManualR6Input] = useState<string>(() => (getStoredOKRSettings().manualMetrics?.r6Engagement || 0).toString());
  const [pricingUnitFilter, setPricingUnitFilter] = useState<string>("all");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isResponsibilityLocked, setIsResponsibilityLocked] = useState<boolean>(true);
  const [isSavingOKR, setIsSavingOKR] = useState<boolean>(false);
  const [cloudSyncTime, setCloudSyncTime] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    service_name: string;
    unit: string;
    description: string;
    standard_price: number;
    lead_time_days: number;
  }>({ service_name: "", unit: "creative", description: "", standard_price: 0, lead_time_days: 3 });

  // Storage Quota State
  const [quotaStats, setQuotaStats] = useState<StorageQuotaStats | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [showCleanConfirmModal, setShowCleanConfirmModal] = useState(false);

  const refreshQuotaStats = async () => {
    setLoadingQuota(true);
    try {
      const stats = await getStorageQuotaStats();
      setQuotaStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    if (activeTab === "storage") {
      refreshQuotaStats();
    }
  }, [activeTab]);

  const handlePurgeCompleted = async () => {
    setIsCleaning(true);
    try {
      const res = await purgeCompletedTaskAttachments();
      if (res.success) {
        setCleanMessage(`✅ ล้างไฟล์แนบงานที่เสร็จสิ้นแล้วเรียบร้อย (${res.purgedFilesCount} ไฟล์ คืนพื้นที่ ~${res.freedMb} MB) โดยเก็บประวัติงานไว้ครบถ้วน`);
        await refreshQuotaStats();
      } else {
        setCleanMessage(`❌ ไม่สามารถล้างไฟล์ได้: ${res.error}`);
      }
    } catch (e: any) {
      setCleanMessage(`❌ เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setIsCleaning(false);
      setShowCleanConfirmModal(false);
    }
  };

  const handlePurgeLocalCache = () => {
    const res = purgeLocalCache();
    alert(`⚡ เคลียร์ไฟล์แคชและข้อมูลชั่วคราวเรียบร้อย (ประหยัดพื้นที่ ~${res.freedKb} KB)`);
    refreshQuotaStats();
  };

  const handleExportBackup = async () => {
    const ok = await exportDatabaseBackup();
    if (ok) {
      alert("💾 ส่งออกไฟล์สำรองข้อมูลฐานข้อมูล CC System (JSON) สำเร็จเรียบร้อย!");
    } else {
      alert("❌ ส่งออกไฟล์สำรองข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };
  
  const supabase = createClient();

  // Form states
  const [newAssignee, setNewAssignee] = useState({ 
    name: "", 
    fullName: "",
    position: "",
    phone: "",
    email: "", 
    unit: "creative", 
    role: "assignee" as AssigneeRole 
  });

  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);
  const [memberSatisfactionStats, setMemberSatisfactionStats] = useState<Record<string, { avg: number; count: number }>>({});

  // Quarterly Tracker state
  const currentYear = new Date().getFullYear();
  const [recordYear, setRecordYear] = useState<number>(currentYear);
  const [recordQuarter, setRecordQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
  const [recordReach, setRecordReach] = useState<string>("");
  const [recordEngagement, setRecordEngagement] = useState<string>("");
  const [recordNote, setRecordNote] = useState<string>("");

  // CRUD Dialog States
  const [showAddKRModal, setShowAddKRModal] = useState(false);
  const [newKRForm, setNewKRForm] = useState({
    code: "",
    name: "",
    unit: "งาน",
    isCurrency: false
  });

  const [showAddRModal, setShowAddRModal] = useState(false);
  const [targetKRForR, setTargetKRForR] = useState<string>("");
  const [newRForm, setNewRForm] = useState({
    code: "",
    name: "",
    targetValue: 100,
    unit: "งาน",
    isCurrency: false,
    isPercentage: false,
    manualInput: false
  });

  const [showAddTIPModal, setShowAddTIPModal] = useState(false);
  const [newTIPForm, setNewTIPForm] = useState({
    code: "",
    name: "",
    description: "",
    baseTarget: 1000000,
    unit: "บาท",
    isCurrency: true,
    isPercentage: false
  });

  const [newOkr, setNewOkr] = useState({ 
    type: "KR", 
    unit: "all",
    description: "", 
    target_value: "" 
  });

  const [newPricing, setNewPricing] = useState({
    unit: "creative",
    service_name: "",
    standard_price: "",
    lead_time_days: "3",
    description: ""
  });

  const handleSaveAllOKRSettings = async (overrideState?: OKRSettingsState) => {
    const stateToSave: OKRSettingsState = {
      ...(overrideState || okrState),
      manualMetrics: {
        r5Reach: parseFloat(manualR5Input.replace(/,/g, '')) || 0,
        r6Engagement: parseFloat(manualR6Input.replace(/,/g, '')) || 0
      },
      lastUpdated: new Date().toISOString()
    };

    setOkrState(stateToSave);
    saveStoredOKRSettings(stateToSave);

    setIsSavingOKR(true);
    try {
      const res = await saveOKRSettingsToSupabase(stateToSave);
      if (res.success) {
        setIsResponsibilityLocked(true);
        setCloudSyncTime(stateToSave.lastUpdated || new Date().toISOString());
        setSaveOKRSuccess("✅ บันทึกเป้าหมาย KR/R และ TIP เรียบร้อยแล้ว (จำค่าถาวร)");
        setTimeout(() => setSaveOKRSuccess(null), 3500);
      } else {
        setSaveOKRSuccess("✅ บันทึกลงเครื่องเรียบร้อยแล้ว");
        setTimeout(() => setSaveOKRSuccess(null), 3000);
      }
    } catch (e: any) {
      console.error("Save error:", e);
      saveStoredOKRSettings(stateToSave);
      setSaveOKRSuccess("✅ บันทึกลงเครื่องเรียบร้อยแล้ว");
      setTimeout(() => setSaveOKRSuccess(null), 3000);
    } finally {
      setIsSavingOKR(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Fetch Assignees
    const { data: aData } = await supabase.from('assignees').select('*').order('created_at', { ascending: true });
    if (aData) {
      const parsed: Assignee[] = aData.map((a: any) => parseMemberRecord(a));
      setAssignees(parsed);
    }
    
    // 2. Fetch OKRs & Cloud Synchronized OKR State
    try {
      const cloudState = await fetchOKRSettingsFromSupabase();
      if (cloudState) {
        setOkrState(cloudState);
        setManualR5Input((cloudState.manualMetrics?.r5Reach || 0).toString());
        setManualR6Input((cloudState.manualMetrics?.r6Engagement || 0).toString());
        if (cloudState.lastUpdated) {
          setCloudSyncTime(cloudState.lastUpdated || null);
        }
      }
    } catch (err) {
      console.warn("fetchOKRSettingsFromSupabase notice:", err);
    }

    const { data: oData } = await supabase.from('okr_settings').select('*').order('created_at', { ascending: true });
    if (oData) setOkrs(oData);

    // 3. Fetch Service Pricing (Cloud Sync with Supabase okr_settings)
    try {
      const cloudPricing = await fetchPricingFromCloud();
      setPricingList(cloudPricing as any);
    } catch (err) {
      console.warn('Error fetching pricing from cloud:', err);
    }

    // 4. Fetch Brief Satisfaction Stats & Active Briefs for Google Sheet Sync
    try {
      const { data: bData } = await supabase.from('briefs').select('*').neq('status', 'purged');
      if (bData) {
        const validBriefs = bData.filter((b: any) => b.status !== 'purged' && !b.details?.is_permanently_deleted);
        setActiveBriefs(validBriefs);

        const statsMap: Record<string, { avg: number; count: number }> = {};
        const tempSums: Record<string, { sum: number; count: number }> = {};
        validBriefs.forEach((b: any) => {
          if (b.details?.is_deleted) return;
          const score = b.details?.satisfaction_scores?.averagePercent;
          if (typeof score === 'number' && score > 0) {
            const mId = b.assignee_id;
            if (mId) {
              if (!tempSums[mId]) tempSums[mId] = { sum: 0, count: 0 };
              tempSums[mId].sum += score;
              tempSums[mId].count += 1;
            }
          }
        });
        Object.keys(tempSums).forEach(mId => {
          const { sum, count } = tempSums[mId];
          statsMap[mId] = {
            avg: Math.round(sum / count),
            count
          };
        });
        setMemberSatisfactionStats(statsMap);
      }
    } catch (e) {
      console.warn('Failed to load brief satisfaction stats in setup:', e);
    }
  };

  // --- TEAM ACTIONS ---
  const handleAddAssignee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      alert("โหมดผู้เข้าชม (Viewer Mode): ไม่สามารถเพิ่มสมาชิกใหม่ได้");
      return;
    }
    if (!newAssignee.name.trim()) return;

    const encodedUnit = encodeMemberUnit(newAssignee.unit, newAssignee.role, {
      fullName: newAssignee.fullName,
      position: newAssignee.position,
      phone: newAssignee.phone
    });

    const payload = {
      name: newAssignee.name.trim(),
      email: newAssignee.email?.trim() || null,
      unit: encodedUnit,
      is_active: true
    };

    await supabase.from('assignees').insert([payload]);

    setNewAssignee({ 
      name: "", 
      fullName: "",
      position: "",
      phone: "",
      email: "", 
      unit: "creative", 
      role: "assignee" 
    });
    fetchData();
  };

  const handleToggleAssigneeStatus = async (id: string, currentStatus: boolean) => {
    if (isReadOnly) return;
    await supabase.from('assignees').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const handleToggleAssigneeRole = async (assignee: Assignee) => {
    if (isReadOnly) return;
    const cycle: Record<AssigneeRole, AssigneeRole> = {
      assignee: 'admin',
      admin: 'executive',
      executive: 'viewer',
      viewer: 'assignee'
    };
    const nextRole = cycle[assignee.role] || 'assignee';
    const encodedUnit = encodeMemberUnit(assignee.unit, nextRole, {
      fullName: assignee.fullName,
      position: assignee.position,
      phone: assignee.phone
    });

    await supabase.from('assignees').update({ unit: encodedUnit }).eq('id', assignee.id);
    fetchData();
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!editingMember) return;

    const encodedUnit = encodeMemberUnit(editingMember.unit, editingMember.role, {
      fullName: editingMember.fullName,
      position: editingMember.position,
      phone: editingMember.phone
    });

    await supabase.from('assignees').update({
      name: editingMember.name.trim(),
      email: editingMember.email?.trim() || null,
      unit: encodedUnit,
      is_active: editingMember.isActive
    }).eq('id', editingMember.id);

    setEditingMember(null);
    fetchData();
  };

  const handleDeleteAssignee = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`คุณต้องการลบรายชื่อ "${name}" ออกจากทีมใช่หรือไม่?`)) {
      await supabase.from('assignees').delete().eq('id', id);
      fetchData();
    }
  };

  const handleCopySurveyLink = (member: Assignee) => {
    const url = getMemberSurveyUrl(member.id);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedMemberId(member.id);
      setTimeout(() => setCopiedMemberId(null), 2500);
    }
  };

  // --- OKR ACTIONS ---
  const handleAddOkr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOkr.description) return;
    await supabase.from('okr_settings').insert([newOkr]);
    setNewOkr({ type: "KR", unit: "all", description: "", target_value: "" });
    fetchData();
  };

  const handleToggleOkr = async (id: string, currentStatus: boolean) => {
    await supabase.from('okr_settings').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const handleDeleteOkr = async (id: string) => {
    if (confirm('คุณต้องการลบเป้าหมาย OKR นี้ใช่หรือไม่?')) {
      await supabase.from('okr_settings').delete().eq('id', id);
      fetchData();
    }
  };

  // --- PRICING ACTIONS ---
  const handleAddPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPricing.service_name || !newPricing.standard_price) return;

    const priceNum = parseFloat(newPricing.standard_price.replace(/,/g, '')) || 0;
    const leadTimeNum = parseInt(newPricing.lead_time_days || '3', 10) || 3;
    const newEntry = {
      unit: newPricing.unit,
      service_name: newPricing.service_name,
      standard_price: priceNum,
      lead_time_days: leadTimeNum,
      description: newPricing.description,
      is_active: true
    };

    const localItem: ServicePricing = {
      ...newEntry,
      id: 'price-' + Date.now()
    };
    const updated = [...pricingList, localItem];
    setPricingList(updated);
    await savePricingToCloud(updated as any);

    setNewPricing({ unit: "creative", service_name: "", standard_price: "", lead_time_days: "3", description: "" });
  };

  const handleStartEditRow = (p: ServicePricing) => {
    setEditingRowId(p.id);
    setEditFormData({
      service_name: p.service_name,
      unit: p.unit,
      description: p.description || "",
      standard_price: Number(p.standard_price) || 0,
      lead_time_days: p.lead_time_days || 3
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
  };

  const handleSaveEditRow = async (id: string) => {
    if (!editFormData.service_name.trim()) {
      alert("กรุณาระบุชื่องาน / รายการ");
      return;
    }
    const updatePayload = {
      service_name: editFormData.service_name.trim(),
      unit: editFormData.unit,
      description: editFormData.description.trim(),
      standard_price: Number(editFormData.standard_price) || 0,
      lead_time_days: Number(editFormData.lead_time_days) || 3
    };

    const updated = pricingList.map(p => p.id === id ? { ...p, ...updatePayload } : p);
    setPricingList(updated);
    await savePricingToCloud(updated as any);
    setEditingRowId(null);
  };

  const handleDeletePricing = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบราคางาน "${name}" ใช่หรือไม่?`)) {
      const updated = pricingList.filter(p => p.id !== id);
      setPricingList(updated);
      await savePricingToCloud(updated as any);
    }
  };

  const handleResetStandardLeadTimes = async () => {
    if (confirm("ต้องการอัปเดตระยะเวลาเฉลี่ย (Lead Time) ทุกรายการให้เป็นไปตามจริงมาตรฐานทั่วไปของแต่ละงานใช่หรือไม่?")) {
      const updated = pricingList.map(p => ({
        ...p,
        lead_time_days: getStandardLeadTimeForService(p.service_name)
      }));
      setPricingList(updated);
      await savePricingToCloud(updated as any);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cc_service_pricing', JSON.stringify(updated));
      }
      alert("อัปเดตระยะเวลาเฉลี่ยมาตรฐานจริงทุกรายการเรียบร้อยแล้วครับ");
    }
  };

  const getUnitColor = (unit: string) => {
    switch (unit?.toLowerCase()) {
      case 'creative': return 'bg-purple-100 text-[#8b5cf6] border-purple-200';
      case 'content': return 'bg-pink-100 text-[#ec4899] border-pink-200';
      case 'pr': return 'bg-blue-100 text-[#1877F2] border-blue-200';
      case 'internal': return 'bg-zinc-100 text-[#27272a] border-zinc-300';
      case 'management': return 'bg-amber-100 text-[#b45309] border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredPricing = pricingUnitFilter === 'all' 
    ? pricingList 
    : pricingList.filter(p => p.unit?.toLowerCase() === pricingUnitFilter.toLowerCase());

  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#181a1c]/90 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[99vw] 2xl:max-w-[1850px] h-[96vh] max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">System Setup & Control</h2>
            <p className="text-xs text-slate-500 mt-0.5">จัดการทีมงาน, กำหนด OKRs/KPIs และปรับราคางานหลังบ้าน</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/60 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Read-Only Viewer Mode Notice Banner */}
        {isReadOnly && (
          <div className="bg-cyan-50 border-b border-cyan-200 px-6 py-2.5 flex items-center justify-between text-cyan-900 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-cyan-600 shrink-0" />
              <span>โหมดผู้เข้าชม (Viewer Mode) • ดูการตั้งค่าระบบได้ทุกส่วนแบบอ่านอย่างเดียว (Read-Only) ไม่สามารถแก้ไข บันทึก หรือลบข้อมูลได้</span>
            </div>
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-cyan-300">
              Read Only
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex px-6 pt-3 border-b border-slate-100 gap-8 bg-white">
          <button 
            onClick={() => setActiveTab("team")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "team" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={16} /> Manage Team
          </button>
          
          <button 
            onClick={() => setActiveTab("okr")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "okr" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target size={16} /> KR/R , TIP
          </button>

          <button 
            onClick={() => setActiveTab("pricing")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "pricing" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DollarSign size={16} /> Service Pricing
          </button>

          <button 
            onClick={() => setActiveTab("storage")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "storage" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database size={16} /> Storage
          </button>

          <button 
            onClick={() => setActiveTab("sheets-sync")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "sheets-sync" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet size={16} /> Google Sheet Sync
          </button>

          <button 
            onClick={() => setActiveTab("ai-control")}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "ai-control" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles size={16} /> AI Control & Guardrails
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
          
          {/* TAB 1: MANAGE TEAM */}
          {activeTab === "team" && (
            <div className="space-y-6">
              {/* Add Member Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Plus size={16} className="text-primary" /> เพิ่มสมาชิกใหม่ในทีม (Add Team Member / Executive)
                  </h3>
                  <span className="text-xs text-slate-500">กำหนดบทบาท Assignee, Admin หรือ Executive</span>
                </div>

                <form onSubmit={handleAddAssignee} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* ชื่อเรียก / ชื่อเล่น */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ชื่อ / ชื่อเล่น (Display Name) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={newAssignee.name} 
                        onChange={e => setNewAssignee({...newAssignee, name: e.target.value})} 
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary" 
                        placeholder="เช่น จ๊อบ AA, ดร.ชาญชัย" 
                      />
                    </div>

                    {/* ชื่อจริง-นามสกุล */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ชื่อจริง-นามสกุล (Official Name)
                      </label>
                      <input 
                        type="text" 
                        value={newAssignee.fullName} 
                        onChange={e => setNewAssignee({...newAssignee, fullName: e.target.value})} 
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary" 
                        placeholder="เช่น นายอดิชาญพงศ์ วรรณกุล" 
                      />
                    </div>

                    {/* ตำแหน่ง */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ตำแหน่งทางการ (Position)
                      </label>
                      <input 
                        type="text" 
                        value={newAssignee.position} 
                        onChange={e => setNewAssignee({...newAssignee, position: e.target.value})} 
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary" 
                        placeholder="เช่น ผู้อำนวยการอุทยานฯ, CC Lead" 
                      />
                    </div>

                    {/* เบอร์โทรศัพท์ */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        เบอร์โทรศัพท์ (Phone)
                      </label>
                      <input 
                        type="tel" 
                        value={newAssignee.phone} 
                        onChange={e => setNewAssignee({...newAssignee, phone: e.target.value})} 
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary font-mono" 
                        placeholder="เช่น 081-883-4920" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* อีเมล */}
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล (Email)</label>
                      <input 
                        type="email" 
                        value={newAssignee.email} 
                        onChange={e => setNewAssignee({...newAssignee, email: e.target.value})} 
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary" 
                        placeholder="member@step.cmu.ac.th" 
                      />
                    </div>

                    {/* สายงาน (Unit) */}
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">สายงาน (Unit)</label>
                      <CustomSelect
                        value={newAssignee.unit}
                        onChange={(val) => setNewAssignee({ ...newAssignee, unit: val })}
                        options={ASSIGNEE_UNIT_OPTIONS}
                        triggerClassName="w-full text-left text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                        dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                      />
                    </div>

                    {/* สิทธิ์ใช้งาน (Role) */}
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">สิทธิ์ใช้งาน (Role)</label>
                      <CustomSelect
                        value={newAssignee.role}
                        onChange={(val) => setNewAssignee({ ...newAssignee, role: val as AssigneeRole })}
                        options={ASSIGNEE_ROLE_OPTIONS}
                        triggerClassName="w-full text-left text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                        dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus size={16} /> บันทึกเพิ่มสมาชิก
                    </button>
                  </div>
                </form>
              </div>

              {/* Members Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    รายชื่อสมาชิกและ Executive ทั้งหมด ({assignees.length} คน)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    *คลิกที่ป้ายบทบาทเพื่อสลับสิทธิ์ หรือกดไอคอนดินสอเพื่อแก้ไขข้อมูลทางการ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3 min-w-[150px]">สมาชิก (ชื่อเรียก / ชื่อจริง)</th>
                        <th className="px-3.5 py-3 max-w-[220px]">ตำแหน่งทางการ</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">เบอร์โทรศัพท์</th>
                        <th className="px-3.5 py-3 max-w-[180px]">อีเมล</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">Unit</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">บทบาท (Role)</th>
                        <th className="px-3 py-3 text-center whitespace-nowrap">สถานะ</th>
                        <th className="px-3.5 py-3 text-center whitespace-nowrap">แบบประเมิน</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignees.map(a => (
                        <tr key={a.id} className={`hover:bg-slate-50/80 transition-colors ${!a.isActive ? "opacity-50 bg-slate-50" : ""}`}>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-800 text-sm leading-tight">{a.name}</div>
                            {a.fullName && a.fullName !== a.name ? (
                              <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{a.fullName}</div>
                            ) : null}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 text-xs leading-snug max-w-[220px]">
                            {a.position || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {a.phone || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 text-xs max-w-[180px] truncate" title={a.email || ""}>
                            {a.email || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded border ${getUnitColor(a.unit)}`}>
                              {a.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleAssigneeRole(a)}
                              disabled={isReadOnly}
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold transition-all border ${
                                a.role === 'admin'
                                  ? "bg-slate-900 text-amber-300 border-slate-700 shadow-sm"
                                  : a.role === 'executive'
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200 shadow-2xs font-bold"
                                  : a.role === 'viewer'
                                  ? "bg-cyan-50 text-cyan-800 border-cyan-200 shadow-2xs font-bold"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              } ${!isReadOnly ? "hover:scale-105 cursor-pointer" : "opacity-90 cursor-default"}`}
                              title={isReadOnly ? "โหมดผู้เข้าชม (Read-Only)" : "คลิกเพื่อสลับบทบาท (Assignee -> Admin -> Executive -> Viewer)"}
                            >
                              {a.role === 'admin' ? (
                                <>
                                  <Shield size={12} className="text-amber-400" /> Admin
                                </>
                              ) : a.role === 'executive' ? (
                                <>
                                  <Briefcase size={12} className="text-indigo-600" /> Executive
                                </>
                              ) : a.role === 'viewer' ? (
                                <>
                                  <Eye size={12} className="text-cyan-600" /> Viewer
                                </>
                              ) : (
                                <>
                                  <User size={12} /> Assignee
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button 
                              onClick={() => handleToggleAssigneeStatus(a.id, a.isActive)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                a.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              }`}
                            >
                              {a.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopySurveyLink(a)}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    copiedMemberId === a.id
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-2xs"
                                      : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 shadow-2xs"
                                  }`}
                                  title="คัดลอกลิงก์แบบประเมินเฉพาะบุคคล (ไม่แสดงชื่อใน URL หรือหน้าฟอร์ม เพื่อความเป็นกลาง)"
                                >
                                  {copiedMemberId === a.id ? (
                                    <>
                                      <Check size={12} className="text-emerald-600" /> คัดลอกแล้ว!
                                    </>
                                  ) : (
                                    <>
                                      <Link2 size={12} className="text-amber-600" /> ลิงก์ประเมิน
                                    </>
                                  )}
                                </button>
                                <a
                                  href={getMemberSurveyUrl(a.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                  title="เปิดดูหน้าแบบประเมิน (ไม่ระบุชื่อ) ในแท็บใหม่"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                              {memberSatisfactionStats[a.id]?.count > 0 ? (
                                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/60" title={`คะแนนเฉลี่ย ${memberSatisfactionStats[a.id].avg}% จากการประเมิน ${memberSatisfactionStats[a.id].count} งาน`}>
                                  <Star size={10} className="fill-amber-400 text-amber-500" />
                                  <span>{memberSatisfactionStats[a.id].avg}% ({memberSatisfactionStats[a.id].count} งาน)</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">
                                  ยังไม่มีประเมิน
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingMember({ ...a })}
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                title="แก้ไขข้อมูลทางการ (ชื่อจริง, ตำแหน่ง, เบอร์โทร)"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignee(a.id, a.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="ลบสมาชิก"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {assignees.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                            ยังไม่มีรายชื่อสมาชิกในทีม กรุณาเพิ่มข้อมูลด้านบน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE KR/R , KPI/TIP */}
          {activeTab === "okr" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Header Banner & Sub Tabs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Target size={18} className="text-primary" />
                      ระบบจัดการตัวชี้วัด KR/R , TIP
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      กำหนดค่าเป้าหมายทีม, ผลลัพธ์ Reach/Engagement สะสม และโควตาความรับผิดชอบรายบุคคล
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("คุณต้องการคืนค่าเริ่มต้นมาตรฐานของ KR1-KR4 และ TIP1-TIP10 ใช่หรือไม่?")) {
                          const resetState: OKRSettingsState = {
                            krs: DEFAULT_KRS,
                            tips: DEFAULT_TIPS,
                            memberResponsibilities: [],
                            manualMetrics: { r5Reach: 0, r6Engagement: 0 }
                          };
                          setOkrState(resetState);
                          setManualR5Input("0");
                          setManualR6Input("0");
                          saveStoredOKRSettings(resetState);
                          setSaveOKRSuccess("คืนค่าเริ่มต้นมาตรฐานเรียบร้อยแล้ว");
                          setTimeout(() => setSaveOKRSuccess(null), 3000);
                        }
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={13} /> คืนค่าเริ่มต้น
                    </button>

                    <button
                      type="button"
                      disabled={isSavingOKR}
                      onClick={() => handleSaveAllOKRSettings()}
                      className="text-xs font-bold px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
                    >
                      {isSavingOKR ? <RefreshCw size={14} className="animate-spin text-amber-400" /> : <Save size={14} className="text-amber-400" />}
                      <span>บันทึกการตั้งค่าทั้งหมด</span>
                    </button>
                  </div>
                </div>


                {saveOKRSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>{saveOKRSuccess}</span>
                  </div>
                )}

                {/* Sub-Navigation Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setOkrSubTab("krs")}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      okrSubTab === "krs"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🎯</span> 1. ตัวชี้วัด KR & R (KR1 - KR4)
                  </button>

                  <button
                    type="button"
                    onClick={() => setOkrSubTab("tips")}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      okrSubTab === "tips"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>✨</span> 2. ตัวชี้วัด KPI & TIP (TIP1 - TIP10)
                  </button>

                  <button
                    type="button"
                    onClick={() => setOkrSubTab("responsibility")}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      okrSubTab === "responsibility"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>👥</span> 3. กำหนด % ความรับผิดชอบรายบุคคล
                  </button>
                </div>
              </div>

              {/* DYNAMIC TARGET NOTICE */}
              <div className="bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">ระบบปรับเป้าหมายอัตโนมัติตามขนาดทีม (Dynamic Target Scaling):</span>
                  <span className="text-blue-800 ml-1">
                    สมาชิกผู้ปฏิบัติงานที่เปิดใช้งานอยู่ปัจจุบันมี <strong>{assignees.filter(a => a.role !== 'executive' && !(a.unit || '').includes('|executive')).length} คน</strong> จากเป้าหมายอ้างอิงเต็มทีม หากมีการลบสมาชิกออกจากระบบ ค่าเป้าหมายรวมของระบบจะลดลงตามสัดส่วนโดยอัตโนมัติ โดยไม่เพิ่มภาระเป้าหมายให้แก่สมาชิกคนอื่น
                  </span>
                </div>
              </div>

              {/* SUBTAB 1: KR & R */}
              {okrSubTab === "krs" && (
                <div className="space-y-5">
                  
                  {/* Quarterly Recording System (บันทึกผลลัพธ์จริง R5 Reach & R6 Engagement สะสม) */}
                  <div className="bg-gradient-to-br from-purple-50/90 via-pink-50/30 to-indigo-50/40 border border-purple-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2.5 rounded-xl bg-purple-600 text-white shadow-2xs">
                          <TrendingUp size={18} />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            บันทึกผลลัพธ์จริง R5 (Reach) และ R6 (Engagement) สะสมเป็นไตรมาส
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono">
                              ผูกกับ KR3 (฿1,000,000)
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            บันทึกผลลัพธ์สะสมตามไตรมาส ระบบคำนวณมูลค่าทางการเงิน และเปรียบเทียบการเติบโต QoQ % และ YoY % ให้อัตโนมัติ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quarterly Entry Form */}
                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-3">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar size={14} className="text-purple-600" />
                        <span>เพิ่มผลลัพธ์ไตรมาสใหม่:</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">ปี (พ.ศ. / ค.ศ.)</label>
                          <input
                            type="number"
                            value={recordYear}
                            onChange={(e) => setRecordYear(parseInt(e.target.value) || currentYear)}
                            className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">ไตรมาส</label>
                          <CustomSelect
                            value={recordQuarter}
                            onChange={(val) => setRecordQuarter(val as "Q1" | "Q2" | "Q3" | "Q4")}
                            options={OKR_QUARTER_OPTIONS}
                            triggerClassName="w-full text-left text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-2xs hover:border-slate-300 transition-colors"
                            dropdownClassName="w-48 shadow-xl border-slate-200 z-[100]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            R5: Reach จริงสะสม
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="เช่น 1500000"
                            value={recordReach}
                            onChange={(e) => setRecordReach(e.target.value)}
                            className="w-full text-xs font-mono font-bold text-purple-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            R6: Engagement สะสม
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="เช่น 25000"
                            value={recordEngagement}
                            onChange={(e) => setRecordEngagement(e.target.value)}
                            className="w-full text-xs font-mono font-bold text-pink-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">หมายเหตุ (ถ้ามี)</label>
                          <input
                            type="text"
                            placeholder="เช่น แคมเปญเปิดตัว"
                            value={recordNote}
                            onChange={(e) => setRecordNote(e.target.value)}
                            className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const rVal = parseFloat(recordReach.replace(/,/g, '')) || 0;
                              const eVal = parseFloat(recordEngagement.replace(/,/g, '')) || 0;
                              if (rVal === 0 && eVal === 0) {
                                alert("กรุณาระบุค่า Reach หรือ Engagement อย่างน้อย 1 ค่า");
                                return;
                              }

                              const targetR5 = okrState.krs.find(k => k.code === "KR3")?.rMetrics.find(r => r.code === "R5")?.targetValue || 6000000;
                              const targetR6 = okrState.krs.find(k => k.code === "KR3")?.rMetrics.find(r => r.code === "R6")?.targetValue || 60000;

                              const calc = computeReachEngagementValues(rVal, eVal, targetR5, targetR6);
                              const existingRecords = okrState.quarterlyRecords || [];

                              const newRec: QuarterlyRecord = {
                                id: `${recordYear}-${recordQuarter}-${Date.now()}`,
                                year: recordYear,
                                quarter: recordQuarter,
                                reach: rVal,
                                engagement: eVal,
                                reachValueBaht: calc.reachValueBaht,
                                engagementValueBaht: calc.engagementValueBaht,
                                totalValueBaht: calc.totalValueBaht,
                                recordedAt: new Date().toISOString(),
                                note: recordNote.trim() || undefined
                              };

                              // Replace if exists for same year + quarter, or append
                              const filtered = existingRecords.filter(r => !(r.year === recordYear && r.quarter === recordQuarter));
                              const updatedRecords = [...filtered, newRec].sort((a, b) => {
                                if (a.year !== b.year) return a.year - b.year;
                                return a.quarter.localeCompare(b.quarter);
                              });

                              const updatedState: OKRSettingsState = {
                                ...okrState,
                                quarterlyRecords: updatedRecords,
                                manualMetrics: {
                                  r5Reach: rVal,
                                  r6Engagement: eVal
                                }
                              };

                              setOkrState(updatedState);
                              setManualR5Input(rVal.toString());
                              setManualR6Input(eVal.toString());
                              saveStoredOKRSettings(updatedState);
                              setRecordReach("");
                              setRecordEngagement("");
                              setRecordNote("");
                              setSaveOKRSuccess(`บันทึกผลลัพธ์สะสมไตรมาส ${recordQuarter}/${recordYear} เรียบร้อยแล้ว`);
                              setTimeout(() => setSaveOKRSuccess(null), 3000);
                            }}
                            className="w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1 shadow-xs transition-all"
                          >
                            <Save size={13} /> บันทึกไตรมาส
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Historical Quarterly Records Table */}
                    {okrState.quarterlyRecords && okrState.quarterlyRecords.length > 0 && (
                      <div className="bg-white rounded-xl border border-purple-100 shadow-2xs overflow-hidden">
                        <div className="px-4 py-2.5 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <History size={14} className="text-purple-600" />
                            ประวัติผลลัพธ์และอัตราเติบโตแต่ละไตรมาส ({okrState.quarterlyRecords.length} รายการ)
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            *เทียบ QoQ (ไตรมาสก่อนหน้า) และ YoY (ไตรมาสเดียวกันปีที่แล้ว)
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                              <tr>
                                <th className="px-3.5 py-2.5">ไตรมาส</th>
                                <th className="px-3.5 py-2.5 text-right">R5 (Reach)</th>
                                <th className="px-3.5 py-2.5 text-center">เติบโต QoQ / YoY</th>
                                <th className="px-3.5 py-2.5 text-right">R6 (Engagement)</th>
                                <th className="px-3.5 py-2.5 text-center">เติบโต QoQ / YoY</th>
                                <th className="px-3.5 py-2.5 text-right">มูลค่ารวม (KR3)</th>
                                <th className="px-3.5 py-2.5">หมายเหตุ</th>
                                <th className="px-3 py-2.5 text-center w-12">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {okrState.quarterlyRecords.map((qRec) => {
                                const growth = calculateQuarterGrowth(qRec, okrState.quarterlyRecords || []);
                                return (
                                  <tr key={qRec.id} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="px-3.5 py-2.5 font-bold font-mono text-purple-900">
                                      {qRec.quarter}/{qRec.year}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">
                                      {qRec.reach.toLocaleString()}
                                      <div className="text-[10px] text-slate-400 font-normal">
                                        ≈ ฿{qRec.reachValueBaht.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center font-mono text-[11px]">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span className={`inline-flex items-center font-bold ${
                                          growth.qoqReachPercent === null ? 'text-slate-400' :
                                          growth.qoqReachPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                          {growth.qoqReachPercent === null ? '-' : `${growth.qoqReachPercent >= 0 ? '+' : ''}${growth.qoqReachPercent}%`}
                                        </span>
                                        <span className="text-slate-300">/</span>
                                        <span className={`inline-flex items-center ${
                                          growth.yoyReachPercent === null ? 'text-slate-400' :
                                          growth.yoyReachPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                          {growth.yoyReachPercent === null ? '-' : `${growth.yoyReachPercent >= 0 ? '+' : ''}${growth.yoyReachPercent}%`}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">
                                      {qRec.engagement.toLocaleString()}
                                      <div className="text-[10px] text-slate-400 font-normal">
                                        ≈ ฿{qRec.engagementValueBaht.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center font-mono text-[11px]">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span className={`inline-flex items-center font-bold ${
                                          growth.qoqEngagePercent === null ? 'text-slate-400' :
                                          growth.qoqEngagePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                          {growth.qoqEngagePercent === null ? '-' : `${growth.qoqEngagePercent >= 0 ? '+' : ''}${growth.qoqEngagePercent}%`}
                                        </span>
                                        <span className="text-slate-300">/</span>
                                        <span className={`inline-flex items-center ${
                                          growth.yoyEngagePercent === null ? 'text-slate-400' :
                                          growth.yoyEngagePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                          {growth.yoyEngagePercent === null ? '-' : `${growth.yoyEngagePercent >= 0 ? '+' : ''}${growth.yoyEngagePercent}%`}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-purple-700">
                                      ฿{qRec.totalValueBaht.toLocaleString()}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                      {qRec.note || "-"}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`คุณต้องการลบข้อมูลไตรมาส ${qRec.quarter}/${qRec.year} หรือไม่?`)) {
                                            const filtered = (okrState.quarterlyRecords || []).filter(r => r.id !== qRec.id);
                                            const updatedState = { ...okrState, quarterlyRecords: filtered };
                                            setOkrState(updatedState);
                                            saveStoredOKRSettings(updatedState);
                                          }
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                        title="ลบรายการไตรมาสนี้"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add KR Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Target size={15} className="text-primary" />
                      รายการเป้าหมาย KR และ R-Metrics ทั้งหมด ({okrState.krs.length} KRs)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSavingOKR}
                        onClick={() => handleSaveAllOKRSettings()}
                        className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                        title="บันทึกค่าเป้าหมาย KR และ R ทั้งหมดลงระบบถาวร"
                      >
                        {isSavingOKR ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span>{isSavingOKR ? "กำลังบันทึก..." : "💾 บันทึกเป้าหมาย KR & R"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewKRForm({
                            code: `KR${okrState.krs.length + 1}`,
                            name: "",
                            unit: "งาน",
                            isCurrency: false
                          });
                          setShowAddKRModal(true);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <Plus size={13} /> เพิ่ม KR ใหม่
                      </button>
                    </div>
                  </div>

                  {/* KR Cards */}
                  <div className="space-y-4">
                    {okrState.krs.map((kr, krIndex) => {
                      const calculatedTarget = computeKRTargetFromR(kr);
                      return (
                        <div 
                          key={kr.code} 
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                          {/* KR Header */}
                          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs">
                                {kr.code}
                              </span>
                              <div>
                                <input
                                  type="text"
                                  value={kr.name}
                                  onChange={(e) => {
                                    const updated = [...okrState.krs];
                                    updated[krIndex].name = e.target.value;
                                    const updatedState = { ...okrState, krs: updated };
                                    setOkrState(updatedState);
                                    saveStoredOKRSettings(updatedState);
                                  }}
                                  className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-primary px-1 py-0.5 rounded focus:bg-white focus:outline-none"
                                />
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                                  <span className="flex items-baseline gap-1.5 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1 rounded-xl shadow-2xs">
                                    <span className="text-slate-600 font-bold text-xs">เป้าหมายทีม:</span>
                                    <strong className="text-emerald-700 font-mono text-base sm:text-lg font-black tracking-tight">
                                      {kr.isCurrency ? `฿${calculatedTarget.toLocaleString()}` : `${calculatedTarget.toLocaleString()} ${kr.unit}`}
                                    </strong>
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <span>🔗</span> ผูกกับค่า R (คำนวณอัตโนมัติ)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Add R Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextRNum = (kr.rMetrics.length > 0)
                                    ? parseInt(kr.rMetrics[kr.rMetrics.length - 1].code.replace(/\D/g, '') || "0") + 1
                                    : krIndex * 2 + 1;
                                  setTargetKRForR(kr.code);
                                  setNewRForm({
                                    code: `R${nextRNum}`,
                                    name: "",
                                    targetValue: 100,
                                    unit: kr.unit || "งาน",
                                    isCurrency: !!kr.isCurrency,
                                    isPercentage: false,
                                    manualInput: false
                                  });
                                  setShowAddRModal(true);
                                }}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-all"
                              >
                                <Plus size={12} /> เพิ่ม R ย่อย
                              </button>

                              {/* Delete KR button if custom or confirmed */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`คุณต้องการลบเป้าหมาย ${kr.code} และ R ย่อยทั้งหมดใช่หรือไม่?`)) {
                                    const updated = okrState.krs.filter((_, i) => i !== krIndex);
                                    const updatedState = { ...okrState, krs: updated };
                                    setOkrState(updatedState);
                                    saveStoredOKRSettings(updatedState);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                title="ลบ KR นี้"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Nested R-Metrics Table without 'เกณฑ์เป้าหมาย' */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px]">
                                <tr>
                                  <th className="px-4 py-2.5 w-16 text-center">รหัส</th>
                                  <th className="px-4 py-2.5">ชื่อตัวชี้วัดย่อย (R-Metric)</th>
                                  <th className="px-4 py-2.5 w-44 text-right">เป้าหมาย (Target)</th>
                                  <th className="px-4 py-2.5 w-48 text-center">ประเภทการคำนวณ / สูตร</th>
                                  <th className="px-3 py-2.5 w-12 text-center">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {kr.rMetrics.map((r, rIndex) => (
                                  <tr key={r.code} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 text-center">
                                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                                        {r.code}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={r.name}
                                        onChange={(e) => {
                                          const updated = [...okrState.krs];
                                          updated[krIndex].rMetrics[rIndex].name = e.target.value;
                                          const updatedState = { ...okrState, krs: updated };
                                          setOkrState(updatedState);
                                          saveStoredOKRSettings(updatedState);
                                        }}
                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-primary px-1 py-0.5 font-medium text-slate-800 focus:bg-white focus:outline-none rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          step={r.isPercentage ? "0.1" : "1"}
                                          value={r.targetValue}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const updated = [...okrState.krs];
                                            updated[krIndex].rMetrics[rIndex].targetValue = val;
                                            const updatedState = { ...okrState, krs: updated };
                                            setOkrState(updatedState);
                                            saveStoredOKRSettings(updatedState);
                                          }}
                                          className="w-28 px-2 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg text-right focus:outline-none focus:border-primary"
                                        />
                                        <span className="text-[10px] text-slate-400 min-w-[28px] text-left">{r.unit}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        {/* Distinct calculation badge */}
                                        {r.code === "R1" || r.code === "R3" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                            <span>⚡</span> นับจากงานจริง
                                          </span>
                                        ) : r.code === "R2" || r.code === "R4" || r.code === "R9" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                            <span>⭐</span> เฉลี่ยแบบประเมิน
                                          </span>
                                        ) : r.code === "R5" || r.code === "R6" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                                            <span>📊</span> บันทึกสะสมไตรมาส
                                          </span>
                                        ) : r.code === "R7" || r.code === "R8" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                            <span>💰</span> กำไรโครงการ PM
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
                                            <span>⚙️</span> {r.manualInput ? "กรอกเอง" : "คำนวณอัตโนมัติ"}
                                          </span>
                                        )}

                                        {/* Formula preview for R5 & R6 with dynamic rates */}
                                        {r.code === "R5" && (
                                          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 whitespace-nowrap shadow-2xs">
                                            สูตร: Reach × (700,000 ÷ {r.targetValue.toLocaleString()}) ≈ {(r.targetValue > 0 ? 700000 / r.targetValue : 0).toFixed(4)} ฿
                                          </span>
                                        )}
                                        {r.code === "R6" && (
                                          <span className="text-[10px] font-mono text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200 whitespace-nowrap shadow-2xs">
                                            สูตร: Engagement × (300,000 ÷ {r.targetValue.toLocaleString()}) = {(r.targetValue > 0 ? 300000 / r.targetValue : 0).toFixed(2)} ฿
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`คุณต้องการลบตัวชี้วัด ${r.code} ใช่หรือไม่?`)) {
                                            const updated = [...okrState.krs];
                                            updated[krIndex].rMetrics = updated[krIndex].rMetrics.filter((_, i) => i !== rIndex);
                                            const updatedState = { ...okrState, krs: updated };
                                            setOkrState(updatedState);
                                            saveStoredOKRSettings(updatedState);
                                          }
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                        title="ลบ R นี้"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* SUBTAB 2: KPI & TIP */}
              {okrSubTab === "tips" && (
                <div className="space-y-4">
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✨</span> สูตรการคำนวณตัวชี้วัดเชิงยุทธศาสตร์ TIP:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px] ml-1">
                      <li><strong>TIP1 (Total Value Creation):</strong> นำกำไร/มูลค่าของ R7 (ภาครัฐ) และ R8 (ภาคเอกชน) มารวมกัน</li>
                      <li><strong>TIP2 (Industrial Income):</strong> ใช้ผลงานจริงจาก R8 (ภาคเอกชน) ค่าเดียว</li>
                      <li><strong>TIP9 (Economic Impact):</strong> คำนวณจาก TIP1 × 5 เท่า Multiplier (มาตรฐานตัวคูณผลกระทบทางเศรษฐกิจของอุทยานฯ)</li>
                      <li><strong>TIP10 (Satisfaction):</strong> ค่าเฉลี่ยคะแนนความพึงพอใจ 5 มิติของงานทั้งหมดที่ได้รับการประเมินแล้ว</li>
                    </ul>
                  </div>

                  {/* Add TIP Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      รายการตัวชี้วัดเชิงยุทธศาสตร์ ({okrState.tips.length} TIPs)
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSavingOKR}
                        onClick={() => handleSaveAllOKRSettings()}
                        className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                        title="บันทึกค่าเป้าหมาย TIP ทั้งหมดลงระบบถาวร"
                      >
                        {isSavingOKR ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span>{isSavingOKR ? "กำลังบันทึก..." : "💾 บันทึกเป้าหมาย TIP"}</span>
                      </button>
                      <button
                      type="button"
                      onClick={() => {
                        setNewTIPForm({
                          code: `TIP${okrState.tips.length + 1}`,
                          name: "",
                          description: "",
                          baseTarget: 1000000,
                          unit: "บาท",
                          isCurrency: true,
                          isPercentage: false
                        });
                        setShowAddTIPModal(true);
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Plus size={13} /> เพิ่ม KPI/TIP ใหม่
                    </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {okrState.tips.map((tip, idx) => (
                      <div 
                        key={tip.code}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-mono font-black text-xs">
                            {tip.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`คุณต้องการลบตัวชี้วัด ${tip.code} ใช่หรือไม่?`)) {
                                const updated = okrState.tips.filter((_, i) => i !== idx);
                                const updatedState = { ...okrState, tips: updated };
                                setOkrState(updatedState);
                                saveStoredOKRSettings(updatedState);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="ลบ TIP นี้"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={tip.name}
                            onChange={(e) => {
                              const updated = [...okrState.tips];
                              updated[idx].name = e.target.value;
                              const updatedState = { ...okrState, tips: updated };
                              setOkrState(updatedState);
                              saveStoredOKRSettings(updatedState);
                            }}
                            className="text-sm font-bold text-slate-800 w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-amber-500 px-1 py-0.5 rounded focus:bg-white focus:outline-none"
                          />
                          <textarea
                            value={tip.description}
                            onChange={(e) => {
                              const updated = [...okrState.tips];
                              updated[idx].description = e.target.value;
                              const updatedState = { ...okrState, tips: updated };
                              setOkrState(updatedState);
                              saveStoredOKRSettings(updatedState);
                            }}
                            rows={2}
                            className="text-xs text-slate-500 mt-1 leading-relaxed w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-amber-500 px-1 py-0.5 rounded focus:bg-white focus:outline-none resize-none"
                          />
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-400 font-semibold">
                            เป้าหมายทีม (Target):
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={tip.isPercentage ? "0.1" : "1000"}
                              value={tip.baseTarget}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...okrState.tips];
                                updated[idx].baseTarget = val;
                                const updatedState = { ...okrState, tips: updated };
                                setOkrState(updatedState);
                                saveStoredOKRSettings(updatedState);
                              }}
                              className="w-32 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded-xl text-right focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-xs text-slate-600 font-semibold">{tip.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: MEMBER RESPONSIBILITY % (ครบทุก R และทุก TIP) */}
              {okrSubTab === "responsibility" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4 sm:p-5">
                  {(() => {
                    // Extract all R metrics and all TIP metrics dynamically
                    const allRMetrics = okrState.krs.flatMap(kr => kr.rMetrics);
                    const allTIPMetrics = okrState.tips;
                    const ops = assignees.filter(a => a.role !== 'executive' && !(a.unit || '').includes('|executive'));

                    const isSatMetric = (code: string, unit?: string, isPercentage?: boolean) => {
                      return isPercentage || unit === '%' || ['R2', 'R4', 'R9', 'TIP10'].includes(code);
                    };

                    return (
                      <>
                        <div className="space-y-3 border-b border-slate-100 pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Users size={16} className="text-primary" />
                                กำหนด % สัดส่วนความรับผิดชอบค่า R และ TIP ของสมาชิกแต่ละคน (ครบทุกตัวชี้วัด)
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                แสดงครบทุก R ({allRMetrics.map(r => r.code).join(", ")}) และทุก TIP ({allTIPMetrics.map(t => t.code).join(", ")}) พร้อมโควตาเป้าหมายที่คำนวณตามสัดส่วน % (เกณฑ์ความพึงพอใจเป็นมาตรฐานทุกคน ≥ 85%)
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isResponsibilityLocked}
                              onClick={() => {
                                if (ops.length === 0) return;
                                if (!confirm(`คุณต้องการจัดสรรสัดส่วนให้ทุกคนเท่ากัน (100% ÷ ${ops.length}) ใช่หรือไม่?\n⚠️ การกระทำนี้จะเขียนทับค่าสัดส่วนที่บันทึกไว้เดิมทั้งหมด`)) {
                                  return;
                                }
                                const equalPct = Math.round((100 / ops.length) * 10) / 10;
                                
                                const newResp = ops.map(a => {
                                  const rResp: Record<string, number> = {};
                                  allRMetrics.forEach(r => {
                                    if (isSatMetric(r.code, r.unit, r.isPercentage)) {
                                      rResp[r.code] = 100;
                                    } else {
                                      rResp[r.code] = equalPct;
                                    }
                                  });
                                  const tipResp: Record<string, number> = {};
                                  allTIPMetrics.forEach(t => {
                                    if (isSatMetric(t.code, t.unit, t.isPercentage)) {
                                      tipResp[t.code] = 100;
                                    } else {
                                      tipResp[t.code] = equalPct;
                                    }
                                  });
                                  return {
                                    memberId: a.id,
                                    memberName: a.name,
                                    rResponsibilities: rResp,
                                    tipResponsibilities: tipResp
                                  };
                                });

                                setOkrState({ ...okrState, memberResponsibilities: newResp });
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-2xs ${
                                isResponsibilityLocked
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "border-slate-300 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <RotateCcw size={12} /> จัดสรรสัดส่วนเท่ากันทุกคน (100% ÷ {ops.length || 1})
                            </button>
                          </div>

                          {/* Dieter Rams Protection & Stability Status Bar */}
                          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isResponsibilityLocked
                              ? "bg-slate-900 text-white border-slate-800 shadow-sm"
                              : "bg-amber-500/10 text-amber-950 border-amber-300 shadow-sm"
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isResponsibilityLocked
                                  ? "bg-slate-800 text-amber-400 border border-slate-700"
                                  : "bg-amber-500 text-white"
                              }`}>
                                {isResponsibilityLocked ? <Lock size={18} /> : <Unlock size={18} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                                    {isResponsibilityLocked ? "โหมดปกป้องค่าตัวชี้วัด (Locked & Protected)" : "โหมดกำลังแก้ไขสัดส่วน (Editing Active)"}
                                  </h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                                    isResponsibilityLocked
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                      : "bg-amber-500 text-white"
                                  }`}>
                                    {isResponsibilityLocked ? "ปลอดภัย • ล็อกค่าแล้ว" : "กำลังแก้ไข"}
                                  </span>
                                </div>
                                <p className={`text-[11px] mt-0.5 ${isResponsibilityLocked ? "text-slate-400" : "text-amber-800"}`}>
                                  {isResponsibilityLocked
                                    ? `ป้องกันค่าสัดส่วนเปลี่ยนแปลงโดยไม่ได้ตั้งใจ ข้อมูลจัดเก็บบนฐานข้อมูลคลาวด์ ${cloudSyncTime ? `(ล่าสุด: ${new Date(cloudSyncTime).toLocaleDateString('th-TH')})` : ''}`
                                    : "คุณสามารถแก้ไขตัวเลขในตารางด้านล่างได้ เมื่อเสร็จสิ้นกรุณากด 'บันทึกลงคลาวด์ & ล็อกค่า'"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isResponsibilityLocked ? (
                                <button
                                  type="button"
                                  onClick={() => setIsResponsibilityLocked(false)}
                                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02]"
                                >
                                  <Unlock size={13} className="text-amber-400" /> ปลดล็อกเพื่อแก้ไข
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={isSavingOKR}
                                    onClick={async () => {
                                      setIsSavingOKR(true);
                                      try {
                                        const res = await saveOKRSettingsToSupabase(okrState);
                                        if (res.success) {
                                          setIsResponsibilityLocked(true);
                                          setCloudSyncTime(okrState.lastUpdated || new Date().toISOString());
                                          setSaveOKRSuccess("☁️ บันทึกลงฐานข้อมูล Supabase และล็อกค่าเรียบร้อยแล้ว");
                                          setTimeout(() => setSaveOKRSuccess(null), 3500);
                                        } else {
                                          alert("บันทึกลงคลาวด์ไม่สำเร็จ: " + res.error);
                                        }
                                      } finally {
                                        setIsSavingOKR(false);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#ff4400] hover:bg-[#e03d00] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                                  >
                                    {isSavingOKR ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                    <span>บันทึกลงคลาวด์ &amp; ล็อกค่า</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const cloudState = await fetchOKRSettingsFromSupabase();
                                      setOkrState(cloudState);
                                      setIsResponsibilityLocked(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
                                  >
                                    ยกเลิก
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Responsive horizontal & vertical scrollable table */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(96vh-240px)] border border-slate-200 rounded-xl shadow-xs custom-scrollbar">
                          <table className="min-w-[1500px] w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0 z-20 shadow-xs">
                              <tr>
                                <th className="px-4 py-3 min-w-[170px] sticky left-0 bg-slate-50 z-30 border-r border-slate-200 shadow-xs">
                                  สมาชิกในทีม
                                </th>
                                <th className="px-3 py-3 text-center min-w-[90px] border-r border-slate-200">
                                  สายงาน
                                </th>
                                
                                 {/* Dynamic R Columns */}
                                {allRMetrics.map(r => {
                                  const isSat = isSatMetric(r.code, r.unit, r.isPercentage);
                                  const colSum = ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.rResponsibilities?.[r.code] === 'number') ? resp.rResponsibilities[r.code] : 0;
                                    return sum + (typeof val === 'number' ? val : 0);
                                  }, 0);
                                  const roundedColSum = Math.round(colSum * 10) / 10;
                                  const diff = Math.round((100 - roundedColSum) * 10) / 10;
                                  const isFull = Math.abs(diff) < 0.05;

                                  return (
                                    <th key={r.code} className="px-3 py-3 text-center min-w-[150px] bg-blue-50/50 border-l border-slate-200">
                                      <div className="font-mono text-blue-700 font-bold text-xs">{r.code}</div>
                                      <div className="text-[10px] text-slate-600 font-medium truncate max-w-[140px] mx-auto mt-0.5" title={r.name}>
                                        {r.name}
                                      </div>

                                      {/* Target Highlight */}
                                      <div className="my-1">
                                        <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-300/80 inline-block shadow-2xs font-mono">
                                          เป้า: {isSat ? `≥ ${r.targetValue.toLocaleString()}%` : r.isCurrency ? `฿${r.targetValue.toLocaleString()}` : `${r.targetValue.toLocaleString()} ${r.unit}`}
                                        </span>
                                      </div>

                                      {/* 100% Allocation Status Indicator */}
                                      <div className="mt-1">
                                        {isSat ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs whitespace-nowrap">
                                            <Users size={10} /> มาตรฐานทุกคน (≥85%)
                                          </span>
                                        ) : isFull ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                            <CheckCircle2 size={11} className="text-emerald-600" /> แบ่งครบ 100% ✅
                                          </span>
                                        ) : diff > 0 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap">
                                            <AlertCircle size={11} className="text-amber-600" /> ขาด {diff}% (รวม {roundedColSum}%)
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs whitespace-nowrap">
                                            <AlertTriangle size={11} className="text-rose-600" /> เกิน {Math.abs(diff)}% (รวม {roundedColSum}%)
                                          </span>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })}

                                {/* Dynamic TIP Columns */}
                                {allTIPMetrics.map(t => {
                                  const isSat = isSatMetric(t.code, t.unit, t.isPercentage);
                                  const colSum = ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.tipResponsibilities?.[t.code] === 'number') ? resp.tipResponsibilities[t.code] : 0;
                                    return sum + (typeof val === 'number' ? val : 0);
                                  }, 0);

                                  const roundedColSum = Math.round(colSum * 10) / 10;
                                  const diff = Math.round((100 - roundedColSum) * 10) / 10;
                                  const isFull = Math.abs(diff) < 0.05;

                                  return (
                                    <th key={t.code} className="px-3 py-3 text-center min-w-[150px] bg-amber-50/50 border-l border-slate-200">
                                      <div className="font-mono text-amber-700 font-bold text-xs">{t.code}</div>
                                      <div className="text-[10px] text-slate-600 font-medium truncate max-w-[140px] mx-auto mt-0.5" title={t.name}>
                                        {t.name}
                                      </div>

                                      {/* Target Highlight */}
                                      <div className="my-1">
                                        <span className="text-xs sm:text-sm font-black text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-300/80 inline-block shadow-2xs font-mono">
                                          เป้า: {isSat ? `≥ ${t.baseTarget.toLocaleString()}%` : t.isCurrency ? `฿${t.baseTarget.toLocaleString()}` : `${t.baseTarget.toLocaleString()} ${t.unit}`}
                                        </span>
                                      </div>

                                      {/* 100% Allocation Status Indicator */}
                                      <div className="mt-1">
                                        {isSat ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs whitespace-nowrap">
                                            <Users size={10} /> มาตรฐานทุกคน (≥85%)
                                          </span>
                                        ) : isFull ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                            <CheckCircle2 size={11} className="text-emerald-600" /> แบ่งครบ 100% ✅
                                          </span>
                                        ) : diff > 0 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap">
                                            <AlertCircle size={11} className="text-amber-600" /> ขาด {diff}% (รวม {roundedColSum}%)
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs whitespace-nowrap">
                                            <AlertTriangle size={11} className="text-rose-600" /> เกิน {Math.abs(diff)}% (รวม {roundedColSum}%)
                                          </span>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {ops.map(m => {
                                const resp = okrState.memberResponsibilities?.find(r => r.memberId === m.id) || {
                                  memberId: m.id,
                                  memberName: m.name,
                                  rResponsibilities: {},
                                  tipResponsibilities: {}
                                };

                                const updateRPct = (metricCode: string, val: number) => {
                                  const curList = okrState.memberResponsibilities ? [...okrState.memberResponsibilities] : [];
                                  const existingIdx = curList.findIndex(r => r.memberId === m.id);
                                  if (existingIdx !== -1) {
                                    curList[existingIdx].rResponsibilities = {
                                      ...curList[existingIdx].rResponsibilities,
                                      [metricCode]: val
                                    };
                                  } else {
                                    curList.push({
                                      memberId: m.id,
                                      memberName: m.name,
                                      rResponsibilities: { [metricCode]: val },
                                      tipResponsibilities: {}
                                    });
                                  }
                                  setOkrState({ ...okrState, memberResponsibilities: curList });
                                };

                                const updateTIPPct = (metricCode: string, val: number) => {
                                  const curList = okrState.memberResponsibilities ? [...okrState.memberResponsibilities] : [];
                                  const existingIdx = curList.findIndex(r => r.memberId === m.id);
                                  if (existingIdx !== -1) {
                                    curList[existingIdx].tipResponsibilities = {
                                      ...curList[existingIdx].tipResponsibilities,
                                      [metricCode]: val
                                    };
                                  } else {
                                    curList.push({
                                      memberId: m.id,
                                      memberName: m.name,
                                      rResponsibilities: {},
                                      tipResponsibilities: { [metricCode]: val }
                                    });
                                  }
                                  setOkrState({ ...okrState, memberResponsibilities: curList });
                                };

                                return (
                                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                                      {m.name}
                                    </td>
                                    <td className="px-3 py-3 text-center border-r border-slate-200">
                                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {m.unit}
                                      </span>
                                    </td>

                                    {/* R Metric Inputs */}
                                    {allRMetrics.map(r => {
                                      const isSat = isSatMetric(r.code, r.unit, r.isPercentage);
                                      if (isSat) {
                                        return (
                                          <td key={r.code} className="px-2.5 py-3 text-center border-l border-slate-100 bg-blue-50/20">
                                            <div className="inline-flex flex-col items-center justify-center">
                                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-bold text-xs font-mono shadow-2xs">
                                                ≥ 85.0%
                                              </span>
                                              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">มาตรฐานทุกคน</span>
                                            </div>
                                          </td>
                                        );
                                      }

                                      const pct = (typeof resp.rResponsibilities?.[r.code] === 'number') ? resp.rResponsibilities[r.code] : 0;
                                      const quota = Math.round((r.targetValue * pct) / 100);

                                      return (
                                        <td key={r.code} className="px-2.5 py-3 text-center border-l border-slate-100">
                                          <div className="flex items-center justify-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              step="0.1"
                                              disabled={isResponsibilityLocked}
                                              value={pct}
                                              onChange={(e) => updateRPct(r.code, parseFloat(e.target.value) || 0)}
                                              className={`w-14 px-1 py-0.5 text-xs font-mono font-bold text-center border rounded-lg transition-colors ${
                                                isResponsibilityLocked
                                                  ? "bg-slate-100/80 text-slate-600 border-slate-200 cursor-not-allowed"
                                                  : "border-blue-400 focus:border-blue-600 bg-white text-slate-900 shadow-2xs"
                                              }`}
                                            />
                                            <span className="text-[10px] text-slate-400">%</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            {r.isCurrency ? `฿${quota.toLocaleString()}` : `${quota.toLocaleString()} ${r.unit}`}
                                          </div>
                                        </td>
                                      );
                                    })}

                                    {/* TIP Metric Inputs */}
                                    {allTIPMetrics.map(t => {
                                      const isSat = isSatMetric(t.code, t.unit, t.isPercentage);
                                      if (isSat) {
                                        return (
                                          <td key={t.code} className="px-2.5 py-3 text-center border-l border-slate-100 bg-amber-50/20">
                                            <div className="inline-flex flex-col items-center justify-center">
                                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-bold text-xs font-mono shadow-2xs">
                                                ≥ 85.0%
                                              </span>
                                              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">มาตรฐานทุกคน</span>
                                            </div>
                                          </td>
                                        );
                                      }

                                      const pct = (typeof resp.tipResponsibilities?.[t.code] === 'number') ? resp.tipResponsibilities[t.code] : 0;
                                      const quota = Math.round((t.baseTarget * pct) / 100);

                                      return (
                                        <td key={t.code} className="px-2.5 py-3 text-center border-l border-slate-100">
                                          <div className="flex items-center justify-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              step="0.1"
                                              disabled={isResponsibilityLocked}
                                              value={pct}
                                              onChange={(e) => updateTIPPct(t.code, parseFloat(e.target.value) || 0)}
                                              className={`w-14 px-1 py-0.5 text-xs font-mono font-bold text-center border rounded-lg transition-colors ${
                                                isResponsibilityLocked
                                                  ? "bg-slate-100/80 text-slate-600 border-slate-200 cursor-not-allowed"
                                                  : "border-amber-400 focus:border-amber-600 bg-white text-slate-900 shadow-2xs"
                                              }`}
                                            />
                                            <span className="text-[10px] text-slate-400">%</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            {t.isCurrency ? `฿${quota.toLocaleString()}` : `${quota.toLocaleString()} ${t.unit}`}
                                          </div>
                                        </td>
                                      );
                                    })}

                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-100/95 font-bold border-t-2 border-slate-300 sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                              <tr>
                                <th className="px-4 py-3 sticky left-0 bg-slate-100 z-30 border-r border-slate-300 font-black text-slate-800 text-xs">
                                  รวมสัดส่วนจัดสรรทั้งหมด
                                </th>
                                <th className="px-3 py-3 text-center text-slate-500 font-mono text-xs border-r border-slate-300">
                                  {ops.length} คน
                                </th>
                                {allRMetrics.map(r => {
                                  const isSat = isSatMetric(r.code, r.unit, r.isPercentage);
                                  if (isSat) {
                                    return (
                                      <th key={`foot-${r.code}`} className="px-2.5 py-2.5 text-center border-l border-slate-200 font-normal">
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                                          มาตรฐานทุกคน
                                        </span>
                                      </th>
                                    );
                                  }
                                  const colSum = ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.rResponsibilities?.[r.code] === 'number') ? resp.rResponsibilities[r.code] : 0;
                                    return sum + (typeof val === 'number' ? val : 0);
                                  }, 0);
                                  const roundedColSum = Math.round(colSum * 10) / 10;
                                  const isFull = Math.abs(roundedColSum - 100) < 0.05;
                                  const quotaSum = Math.round(ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.rResponsibilities?.[r.code] === 'number') ? resp.rResponsibilities[r.code] : 0;
                                    return sum + Math.round((r.targetValue * val) / 100);
                                  }, 0));

                                  return (
                                    <th key={`foot-${r.code}`} className="px-2.5 py-2.5 text-center border-l border-slate-200 font-mono font-normal">
                                      <div className={`text-xs font-black ${isFull ? 'text-emerald-700' : roundedColSum < 100 ? 'text-amber-700' : 'text-rose-700'}`}>
                                        {roundedColSum}% {isFull ? '✅' : roundedColSum < 100 ? '⚠️' : '❌'}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-medium">
                                        {r.isCurrency ? `฿${quotaSum.toLocaleString()}` : `${quotaSum.toLocaleString()} ${r.unit}`}
                                      </div>
                                    </th>
                                  );
                                })}
                                {allTIPMetrics.map(t => {
                                  const isSat = isSatMetric(t.code, t.unit, t.isPercentage);
                                  if (isSat) {
                                    return (
                                      <th key={`foot-${t.code}`} className="px-2.5 py-2.5 text-center border-l border-slate-200 font-normal">
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                                          มาตรฐานทุกคน
                                        </span>
                                      </th>
                                    );
                                  }
                                  const colSum = ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.tipResponsibilities?.[t.code] === 'number') ? resp.tipResponsibilities[t.code] : 0;
                                    return sum + (typeof val === 'number' ? val : 0);
                                  }, 0);
                                  const roundedColSum = Math.round(colSum * 10) / 10;
                                  const isFull = Math.abs(roundedColSum - 100) < 0.05;
                                  const quotaSum = Math.round(ops.reduce((sum, m) => {
                                    const resp = okrState.memberResponsibilities?.find(res => res.memberId === m.id);
                                    const val = (typeof resp?.tipResponsibilities?.[t.code] === 'number') ? resp.tipResponsibilities[t.code] : 0;
                                    return sum + Math.round((t.baseTarget * val) / 100);
                                  }, 0));

                                  return (
                                    <th key={`foot-${t.code}`} className="px-2.5 py-2.5 text-center border-l border-slate-200 font-mono font-normal">
                                      <div className={`text-xs font-black ${isFull ? 'text-amber-800' : roundedColSum < 100 ? 'text-amber-700' : 'text-rose-700'}`}>
                                        {roundedColSum}% {isFull ? '✅' : roundedColSum < 100 ? '⚠️' : '❌'}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-medium">
                                        {t.isCurrency ? `฿${quotaSum.toLocaleString()}` : `${quotaSum.toLocaleString()} ${t.unit}`}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </tfoot>

                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SERVICE PRICING (ราคางานหลังบ้าน) */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              {/* Add Pricing Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" /> กำหนดราคามาตรฐานงานบริการหลังบ้าน (Service Standard Pricing)
                  </h3>
                  <span className="text-xs text-slate-500">สำหรับคำนวณมูลค่างานในระบบ Dashboards & Financials</span>
                </div>

                <form onSubmit={handleAddPricing} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">สายงาน (Unit)</label>
                    <CustomSelect
                      value={newPricing.unit}
                      onChange={(val) => setNewPricing({ ...newPricing, unit: val })}
                      options={PRICING_UNIT_OPTIONS}
                      triggerClassName="w-full text-left text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                      dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่องาน / บริการ (Service Name)</label>
                    <input 
                      type="text" 
                      required 
                      value={newPricing.service_name} 
                      onChange={e => setNewPricing({...newPricing, service_name: e.target.value})} 
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" 
                      placeholder="เช่น Key Visual, Print Poster" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                      <span>ระยะเวลาเฉลี่ย (วัน)</span>
                      <span className="text-[10px] text-amber-600 font-bold">ระยะเวลามาตรฐาน</span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      max="90"
                      value={newPricing.lead_time_days} 
                      onChange={e => setNewPricing({...newPricing, lead_time_days: e.target.value})} 
                      className="w-full text-sm border border-amber-300 rounded-lg px-3 py-2 font-mono font-bold text-amber-800 bg-amber-50/40" 
                      placeholder="เช่น 5" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ราคามาตรฐาน (฿)</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={newPricing.standard_price} 
                      onChange={e => setNewPricing({...newPricing, standard_price: e.target.value})} 
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800" 
                      placeholder="1500" 
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายงาน (Description)</label>
                    <input 
                      type="text" 
                      value={newPricing.description} 
                      onChange={e => setNewPricing({...newPricing, description: e.target.value})} 
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" 
                      placeholder="รายละเอียดสโคปงาน..." 
                    />
                  </div>

                  <div className="sm:col-span-12 flex justify-end mt-2">
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus size={16} /> บันทึกราคางานบริการ
                    </button>
                  </div>
                </form>
              </div>

              {/* Pricing Filter Tabs & Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
                  <div className="flex gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all', label: 'All Units' },
                      { id: 'creative', label: 'DESIGN' },
                      { id: 'content', label: 'CONTENT' },
                      { id: 'pr', label: 'PR' },
                      { id: 'internal', label: 'INTERNAL' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPricingUnitFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all flex items-center gap-1.5 ${
                          pricingUnitFilter === tab.id 
                            ? "bg-slate-900 text-white shadow-sm" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[10px] opacity-75 font-normal">
                          ({tab.id === 'all' ? pricingList.length : pricingList.filter(p => p.unit?.toLowerCase() === tab.id).length})
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetStandardLeadTimes}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      title="อัปเดตระยะเวลาเฉลี่ยให้เป็นไปตามจริงมาตรฐานทั่วไปของแต่ละงาน"
                    >
                      ⏱️ รีเซ็ตระยะเวลาเฉลี่ยมาตรฐานจริง
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('คุณต้องการรีเซ็ตราคางานทั้งหมดเป็นค่าเริ่มต้นเฉลี่ยต่ำสุดของ STeP (Fastwork) ใช่หรือไม่?')) {
                          const initList: ServicePricing[] = DEFAULT_PRICING.map((item, idx) => ({
                            ...item,
                            id: 'init-' + idx + '-' + Date.now()
                          }));
                          setPricingList(initList);
                          await savePricingToCloud(initList as any);
                          localStorage.setItem('cc_service_pricing', JSON.stringify(initList));
                        }
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      ↺ รีเซ็ตเป็นราคามาตรฐาน STeP
                    </button>
                    <span className="text-xs text-slate-500 font-medium">
                      (แสดงทั้งหมด {filteredPricing.length} รายการ)
                    </span>
                  </div>
                </div>

                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3">ชื่องาน / รายการ (Deliverable)</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">คำอธิบาย</th>
                      <th className="px-3 py-3 text-center whitespace-nowrap">ระยะเวลาเฉลี่ย (วัน)</th>
                      <th className="px-4 py-3 text-right">ราคามาตรฐาน (THB)</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPricing.map(p => {
                      const isEditing = editingRowId === p.id;
                      return (
                        <tr key={p.id} className={`${isEditing ? 'bg-amber-50/60' : 'hover:bg-slate-50/80'} transition-colors`}>
                          {/* 1. Name */}
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-md focus:border-primary focus:outline-none bg-white shadow-xs"
                                value={editFormData.service_name}
                                onChange={e => setEditFormData({ ...editFormData, service_name: e.target.value })}
                                placeholder="ระบุชื่องาน"
                                autoFocus
                              />
                            ) : (
                              p.service_name
                            )}
                          </td>

                          {/* 2. Unit */}
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <CustomSelect
                                value={editFormData.unit}
                                onChange={(val) => setEditFormData({ ...editFormData, unit: val })}
                                options={PRICING_UNIT_UPPER_OPTIONS}
                                triggerClassName="text-left text-xs font-bold uppercase px-2.5 py-1.5 border border-slate-300 rounded-md bg-white shadow-xs hover:border-slate-400 transition-colors"
                                dropdownClassName="w-48 shadow-xl border-slate-200 z-[100]"
                              />
                            ) : (
                              <span className={`uppercase text-[10px] font-bold px-2.5 py-1 rounded-md border ${getUnitColor(p.unit)}`}>
                                {p.unit?.toLowerCase() === 'creative' ? 'DESIGN' : p.unit?.toLowerCase() === 'content' ? 'CONTENT' : p.unit?.toLowerCase() === 'pr' ? 'PR' : p.unit}
                              </span>
                            )}
                          </td>

                          {/* 3. Description */}
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md focus:border-primary focus:outline-none bg-white shadow-xs"
                                value={editFormData.description}
                                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                placeholder="คำอธิบาย (ถ้ามี)"
                              />
                            ) : (
                              <span className="max-w-xs block truncate" title={p.description || ""}>
                                {p.description || "-"}
                              </span>
                            )}
                          </td>

                          {/* 4. Lead Time (ระยะเวลาเฉลี่ย วัน) */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="90"
                                  className="w-16 text-center px-1.5 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-md focus:border-amber-500 focus:outline-none bg-amber-50/50 shadow-xs"
                                  value={editFormData.lead_time_days}
                                  onChange={e => setEditFormData({ ...editFormData, lead_time_days: parseInt(e.target.value, 10) || 1 })}
                                />
                                <span className="text-slate-500 text-xs font-medium">วัน</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ⏱️ {p.lead_time_days ?? getStandardLeadTimeForService(p.service_name)} วัน
                              </span>
                            )}
                          </td>

                          {/* 5. Price */}
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end">
                                <span className="text-slate-400 font-bold mr-1 text-xs">฿</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-24 text-right px-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-md focus:border-primary focus:outline-none bg-white shadow-xs"
                                  value={editFormData.standard_price}
                                  onChange={e => setEditFormData({ ...editFormData, standard_price: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            ) : (
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                ฿{Number(p.standard_price).toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* 5. Actions */}
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveEditRow(p.id)}
                                  className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                                  title="บันทึกการแก้ไข"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEditRow}
                                  className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                                  title="ยกเลิก"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleStartEditRow(p)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="แก้ไข (ชื่อ, Unit, คำอธิบาย, ราคา)"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePricing(p.id, p.service_name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                  title="ลบรายการ"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPricing.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                          ยังไม่มีข้อมูลราคางานในหมวดหมู่นี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE & FREE TIER HEALTH (พื้นที่จัดเก็บ & โควตาฟรี) */}
          {activeTab === "storage" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Info Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                      quotaStats?.healthStatus === "critical"
                        ? "bg-rose-100 text-rose-600 border-rose-200 animate-pulse"
                        : quotaStats?.healthStatus === "warning"
                        ? "bg-amber-100 text-amber-600 border-amber-200"
                        : "bg-emerald-100 text-emerald-600 border-emerald-200"
                    }`}>
                      <Database size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          ระบบตรวจสอบพื้นที่จัดเก็บ &amp; โควตาฟรี (Storage &amp; Free Tier Health)
                        </h3>
                        <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                          quotaStats?.healthStatus === "critical"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : quotaStats?.healthStatus === "warning"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {quotaStats?.healthStatus === "critical"
                            ? "🔴 ข้อมูลใกล้เต็มโควตาฟรี"
                            : quotaStats?.healthStatus === "warning"
                            ? "🟡 เฝ้าระวังโควตา"
                            : "🟢 พื้นที่ปกติ (Optimal)"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ควบคุมการใช้งานฐานข้อมูล Supabase และ Storage Bucket ให้อยู่ในขีดจำกัดแพ็กเกจฟรี (DB 500 MB / Storage 1 GB)
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="ดาวน์โหลดไฟล์สำรองข้อมูล JSON ก่อนทำการล้างข้อมูลใดๆ"
                    >
                      <Download size={13} />
                      <span>สำรองข้อมูล (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePurgeLocalCache}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="เคลียร์หน่วยความจำแคชและข้อมูลชั่วคราวในเบราว์เซอร์"
                    >
                      <RefreshCw size={13} />
                      <span>เคลียร์แคช</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCleanConfirmModal(true)}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="ล้างไฟล์แนบของโครงการที่เสร็จสิ้นหรือยกเลิกแล้วเพื่อคืนพื้นที่ โดยเก็บประวัติงานไว้"
                    >
                      <Trash2 size={13} />
                      <span>ล้างไฟล์งานที่เสร็จแล้ว</span>
                    </button>

                    <button
                      type="button"
                      onClick={refreshQuotaStats}
                      disabled={loadingQuota}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                      title="รีเฟรชข้อมูลพื้นที่"
                    >
                      <RefreshCw size={14} className={loadingQuota ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Alert Message Banner if any */}
                {cleanMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-premium-fade">
                    <span>{cleanMessage}</span>
                    <button onClick={() => setCleanMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">✕</button>
                  </div>
                )}

                {/* 3 Metric Gauges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Gauge 1: Database Size */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Database size={14} className="text-indigo-600" />
                        <span>ขนาดฐานข้อมูล (Supabase DB)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {quotaStats ? `${quotaStats.dbEstimatedMb} MB / 500 MB` : "คำนวณ..."}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          (quotaStats?.dbPercentage || 0) > 80
                            ? "bg-rose-500"
                            : (quotaStats?.dbPercentage || 0) > 60
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.max(4, quotaStats?.dbPercentage || 4)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>ใช้ไป {quotaStats?.dbPercentage || 0}%</span>
                      <span>บันทึก {quotaStats?.dbRowCount || 0} เรคอร์ด</span>
                    </div>
                  </div>

                  {/* Gauge 2: File Storage Bucket */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <HardDrive size={14} className="text-emerald-600" />
                        <span>คลังไฟล์แนบ (Storage Bucket)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {quotaStats ? `${quotaStats.storageEstimatedMb} MB / 1,024 MB` : "คำนวณ..."}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          (quotaStats?.storagePercentage || 0) > 80
                            ? "bg-rose-500"
                            : (quotaStats?.storagePercentage || 0) > 60
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                        style={{ width: `${Math.max(4, quotaStats?.storagePercentage || 4)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>ใช้ไป {quotaStats?.storagePercentage || 0}%</span>
                      <span>ไฟล์ในระบบ {quotaStats?.storageFileCount || 0} ไฟล์</span>
                    </div>
                  </div>

                  {/* Gauge 3: Local Storage / Cache */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Archive size={14} className="text-purple-600" />
                        <span>แคชเบราว์เซอร์ (Browser Cache)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {quotaStats ? `${quotaStats.localStorageKb} KB / 5,120 KB` : "คำนวณ..."}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${Math.max(4, quotaStats?.localStoragePercentage || 4)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>ใช้ไป {quotaStats?.localStoragePercentage || 0}%</span>
                      <span>ขีดจำกัด 5 MB ต่อเครื่อง</span>
                    </div>
                  </div>
                </div>

                {/* Quick Summary / Recommendation Banner */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2.5">
                    <Info size={18} className="text-amber-600 shrink-0" />
                    <span className="leading-relaxed">
                      <strong>สถานะข้อมูลพร้อมคืนพื้นที่:</strong> มีโครงการที่เสร็จสิ้นแล้ว <strong>{quotaStats?.completedBriefsCount || 0} โครงการ</strong> ซึ่งมีไฟล์แนบที่สามารถล้างเพื่อประหยัดพื้นที่ได้ <strong>{quotaStats?.purgeableFilesCount || 0} ไฟล์ (~{quotaStats?.purgeableEstimatedMb || 0} MB)</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCleanConfirmModal(true)}
                    disabled={!quotaStats || quotaStats.purgeableFilesCount === 0}
                    className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs whitespace-nowrap"
                  >
                    ล้างไฟล์ส่วนนี้ทันที
                  </button>
                </div>
              </div>

              {/* Guidelines & Policy Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> นโยบายการบริหารพื้นที่ฟรี (Free Tier Longevity Policy)
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>คงอยู่ถาวรไม่คิดค่าบริการ:</strong> ระบบถูกออกแบบให้ทำงานภายในแพ็กเกจฟรีของ Supabase (Database 500 MB และ Storage 1 GB) โดยไม่ต้องอัปเกรดแผนแบบเสียเงิน</li>
                  <li><strong>การล้างไฟล์ปลอดภัย 100%:</strong> การกด "ล้างไฟล์งานที่เสร็จแล้ว" จะลบเฉพาะไฟล์ Binary ขนาดใหญ่ เช่น PSD, Video, PDF ออกจาก Storage โดย <strong>ข้อมูลชื่องาน, ผู้ขอ, วันที่, งบประมาณ, และ KPI จะยังคงอยู่ในระบบครบถ้วนทุกประการ</strong></li>
                  <li><strong>แนะนำสำรองข้อมูลเป็นประจำ:</strong> แนะนำให้กดปุ่ม "สำรองข้อมูล (JSON)" เพื่อดาวน์โหลดชุดข้อมูลเก็บสำรองไว้ก่อนดำเนินการล้างข้อมูล</li>
                </ul>
              </div>

              {/* AUTOMATED MONTHLY BACKUP & AUDIT TRAIL HUB (FY70) */}
              <AuditLogsAndBackupHub />
            </div>
          )}

          {/* TAB 5: GOOGLE SHEET SYNC */}
          {activeTab === "sheets-sync" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <GoogleSheetsSyncHub tasks={activeBriefs} assignees={assignees} />
            </div>
          )}

          {/* TAB 6: AI CONTROL & ANTI-HALLUCINATION GUARDRAILS */}
          {activeTab === "ai-control" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AiControlHub />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-slate-400" />
            <span>การเปลี่ยนแปลงจะมีผลต่อการคำนวณในระบบทันที</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "okr" && (
              <button
                type="button"
                disabled={isSavingOKR}
                onClick={() => handleSaveAllOKRSettings()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                {isSavingOKR ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{isSavingOKR ? "กำลังบันทึก..." : "💾 บันทึกเป้าหมาย (Save All)"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              ปิดหน้าต่าง (Close)
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Confirm Purge Completed Files inside SetupModal */}
      {showCleanConfirmModal && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                ยืนยันการล้างไฟล์แนบของโครงการที่เสร็จสิ้นแล้ว?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจะทำการลบเฉพาะ <strong>ไฟล์แนบขนาดใหญ่ (รูปภาพ/PDF/ZIP)</strong> ของงานที่สถานะ Completed หรือ Cancelled เพื่อคืนพื้นที่จัดเก็บให้อยู่ในโควตาฟรี
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>จำนวนไฟล์ที่จะถูกล้าง:</span>
                <span className="font-bold font-mono text-slate-900">{quotaStats?.purgeableFilesCount || 0} ไฟล์</span>
              </div>
              <div className="flex justify-between">
                <span>พื้นที่ที่จะได้คืน:</span>
                <span className="font-bold font-mono text-emerald-600">~{quotaStats?.purgeableEstimatedMb || 0} MB</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/60">
                <span>ข้อมูลโครงการ, KPI, ผู้ขอ, วันที่:</span>
                <span>คงอยู่ครบ 100%</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCleanConfirmModal(false)}
                disabled={isCleaning}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePurgeCompleted}
                disabled={isCleaning}
                className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCleaning && <RefreshCw size={12} className="animate-spin" />}
                <span>{isCleaning ? "กำลังล้างไฟล์..." : "ยืนยันล้างไฟล์เพื่อคืนพื้นที่"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-primary" />
                <h3 className="font-bold text-slate-800 text-base">แก้ไขข้อมูลสมาชิกและบทบาท</h3>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ชื่อ / ชื่อย่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ชื่อจริง-นามสกุลทางการ
                  </label>
                  <input
                    type="text"
                    value={editingMember.fullName}
                    onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary"
                    placeholder="เช่น นายอดิชาญพงศ์ วรรณกุล"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ตำแหน่งทางการ (Position)
                  </label>
                  <input
                    type="text"
                    value={editingMember.position}
                    onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary"
                    placeholder="เช่น ผู้อำนวยการอุทยานฯ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-primary"
                    placeholder="เช่น 081-883-4920"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล (Email)</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary"
                  placeholder="member@step.cmu.ac.th"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">สายงาน (Unit)</label>
                  <CustomSelect
                    value={editingMember.unit}
                    onChange={(val) => setEditingMember({ ...editingMember, unit: val })}
                    options={ASSIGNEE_UNIT_OPTIONS}
                    triggerClassName="w-full text-left text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                    dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">บทบาท (Role)</label>
                  <CustomSelect
                    value={editingMember.role}
                    onChange={(val) => setEditingMember({ ...editingMember, role: val as AssigneeRole })}
                    options={ASSIGNEE_ROLE_OPTIONS}
                    triggerClassName="w-full text-left text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs"
                    dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Check size={14} /> บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD KR */}
      {showAddKRModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Target size={16} className="text-primary" /> เพิ่มเป้าหมาย KR ใหม่
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัส KR</label>
                <input
                  type="text"
                  value={newKRForm.code}
                  onChange={(e) => setNewKRForm({ ...newKRForm, code: e.target.value })}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 uppercase"
                  placeholder="เช่น KR5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเป้าหมายผลงาน (KR)</label>
                <input
                  type="text"
                  value={newKRForm.name}
                  onChange={(e) => setNewKRForm({ ...newKRForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="เช่น ผลิตสื่อวิดีโอประชาสัมพันธ์องค์กร"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={newKRForm.unit}
                    onChange={(e) => setNewKRForm({ ...newKRForm, unit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="เช่น งาน, บาท, ชิ้น"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เป็นมูลค่าเงิน (บาท)?</label>
                  <CustomSelect
                    value={newKRForm.isCurrency ? "yes" : "no"}
                    onChange={(val) => setNewKRForm({ ...newKRForm, isCurrency: val === "yes" })}
                    options={KR_CURRENCY_OPTIONS}
                    triggerClassName="w-full text-left text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                    dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-800">
                💡 หมายเหตุ: ค่าเป้าหมายของ KR จะถูกคำนวณอัตโนมัติจาก R-Metrics ย่อยที่คุณเพิ่มเข้าไปภายหลัง
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddKRModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newKRForm.code.trim() || !newKRForm.name.trim()) {
                    alert("กรุณากรอกรหัสและชื่อ KR ให้ครบถ้วน");
                    return;
                  }
                  const newKR: KRMetric = {
                    code: newKRForm.code.toUpperCase().trim(),
                    name: newKRForm.name.trim(),
                    weightPercent: 10,
                    baseTarget: 0,
                    unit: newKRForm.unit.trim() || "งาน",
                    isCurrency: newKRForm.isCurrency,
                    rMetrics: []
                  };
                  const updatedKRs = [...okrState.krs, newKR];
                  const updatedState = { ...okrState, krs: updatedKRs };
                  setOkrState(updatedState);
                  saveStoredOKRSettings(updatedState);
                  setShowAddKRModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-xs"
              >
                บันทึก KR ใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD R METRIC */}
      {showAddRModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle size={16} className="text-blue-600" /> เพิ่มตัวชี้วัดย่อย R ภายใต้ {targetKRForR}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">รหัส R</label>
                  <input
                    type="text"
                    value={newRForm.code}
                    onChange={(e) => setNewRForm({ ...newRForm, code: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 uppercase"
                    placeholder="เช่น R10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={newRForm.unit}
                    onChange={(e) => setNewRForm({ ...newRForm, unit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="เช่น งาน, ชิ้น, บาท"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อตัวชี้วัดย่อย</label>
                <input
                  type="text"
                  value={newRForm.name}
                  onChange={(e) => setNewRForm({ ...newRForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="เช่น จำนวนงานที่ส่งมอบตรงเวลา"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เป้าหมาย (Target)</label>
                  <input
                    type="number"
                    value={newRForm.targetValue}
                    onChange={(e) => setNewRForm({ ...newRForm, targetValue: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทการประมวลผล</label>
                  <CustomSelect
                    value={newRForm.manualInput ? "manual" : "auto"}
                    onChange={(val) => setNewRForm({ ...newRForm, manualInput: val === "manual" })}
                    options={R_COMPUTE_OPTIONS}
                    triggerClassName="w-full text-left text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition-colors shadow-2xs font-medium"
                    dropdownClassName="w-full shadow-xl border-slate-200 z-[100]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newRForm.code.trim() || !newRForm.name.trim()) {
                    alert("กรุณากรอกรหัสและชื่อ R ให้ครบถ้วน");
                    return;
                  }
                  const newR: RMetric = {
                    code: newRForm.code.toUpperCase().trim(),
                    krCode: targetKRForR,
                    name: newRForm.name.trim(),
                    weightDescription: "",
                    weightPercent: 100,
                    targetValue: newRForm.targetValue,
                    unit: newRForm.unit.trim() || "งาน",
                    isCurrency: newRForm.unit.trim() === "บาท",
                    isPercentage: newRForm.unit.trim() === "%",
                    manualInput: newRForm.manualInput
                  };

                  const updatedKRs = okrState.krs.map(k => {
                    if (k.code === targetKRForR) {
                      return {
                        ...k,
                        rMetrics: [...k.rMetrics, newR]
                      };
                    }
                    return k;
                  });

                  const updatedState = { ...okrState, krs: updatedKRs };
                  setOkrState(updatedState);
                  saveStoredOKRSettings(updatedState);
                  setShowAddRModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                เพิ่ม R ใน {targetKRForR}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TIP */}
      {showAddTIPModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> เพิ่มตัวชี้วัดเชิงยุทธศาสตร์ TIP ใหม่
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTIPModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">รหัส TIP</label>
                  <input
                    type="text"
                    value={newTIPForm.code}
                    onChange={(e) => setNewTIPForm({ ...newTIPForm, code: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 uppercase"
                    placeholder="เช่น TIP3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={newTIPForm.unit}
                    onChange={(e) => setNewTIPForm({ ...newTIPForm, unit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="เช่น บาท, %, โครงการ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อตัวชี้วัด</label>
                <input
                  type="text"
                  value={newTIPForm.name}
                  onChange={(e) => setNewTIPForm({ ...newTIPForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="เช่น Intellectual Property Licensing"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายสูตร / ความหมาย</label>
                <textarea
                  value={newTIPForm.description}
                  onChange={(e) => setNewTIPForm({ ...newTIPForm, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none"
                  placeholder="เช่น รายได้จากการอนุญาตให้ใช้สิทธิ์ในผลงานสร้างสรรค์"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เป้าหมายทีม (Base Target)</label>
                <input
                  type="number"
                  value={newTIPForm.baseTarget}
                  onChange={(e) => setNewTIPForm({ ...newTIPForm, baseTarget: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddTIPModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newTIPForm.code.trim() || !newTIPForm.name.trim()) {
                    alert("กรุณากรอกรหัสและชื่อ TIP ให้ครบถ้วน");
                    return;
                  }
                  const newTIP: TIPMetric = {
                    code: newTIPForm.code.toUpperCase().trim(),
                    name: newTIPForm.name.trim(),
                    description: newTIPForm.description.trim(),
                    weightPercent: 10,
                    baseTarget: newTIPForm.baseTarget,
                    unit: newTIPForm.unit.trim() || "บาท",
                    isCurrency: newTIPForm.unit.trim() === "บาท",
                    isPercentage: newTIPForm.unit.trim() === "%"
                  };
                  const updatedTIPS = [...okrState.tips, newTIP];
                  const updatedState = { ...okrState, tips: updatedTIPS };
                  setOkrState(updatedState);
                  saveStoredOKRSettings(updatedState);
                  setShowAddTIPModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs"
              >
                บันทึก TIP ใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

