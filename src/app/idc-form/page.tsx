"use client";

import { useState } from "react";
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Mail, 
  FileText, 
  Palette, 
  Clock, 
  ArrowLeft,
  Check,
  Share2,
  Copy
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";

// Assignee Pim (พิม AC) ID
const PIM_ASSIGNEE_ID = "47adfbc2-8d0e-4dc7-87ad-98895be82026";
const PIM_NAME = "พิม AC";

export type ServiceConsultationType =
  | "product_design"
  | "packaging_design"
  | "print_media"
  | "logo_branding"
  | "ci_branding"
  | "other";

export const SERVICE_OPTIONS: { key: ServiceConsultationType; label: string }[] = [
  { key: "product_design", label: "ออกแบบผลิตภัณฑ์" },
  { key: "packaging_design", label: "ออกแบบบรรจุภัณฑ์" },
  { key: "print_media", label: "ออกแบบสื่อสิ่งพิมพ์" },
  { key: "logo_branding", label: "ออกแบบตราสัญลักษณ์" },
  { key: "ci_branding", label: "ออกแบบอัตลักษณ์ ( CI )" },
  { key: "other", label: "อื่นๆ (ระบุ)" }
];

export type OrganizationType = "private" | "government";
export type BusinessType = "food_processing" | "agriculture_biotech" | "tourism" | "digital" | "other";

export const IDC_BUSINESS_TYPE_OPTIONS: ModernSelectOption[] = [
  { value: "food_processing", label: "1. การแปรรูปอาหาร", desc: "อุตสาหกรรมแปรรูปอาหาร เกษตรแปรรูป และอาหารแห่งอนาคต" },
  { value: "agriculture_biotech", label: "2. การเกษตรและเทคโนโลยีชีวภาพ", desc: "การเกษตรสมัยใหม่ เกษตรแม่นยำ และชีวภัณฑ์นวัตกรรม" },
  { value: "tourism", label: "3. การท่องเที่ยว", desc: "การท่องเที่ยวสร้างสรรค์ การบริการ และสุขภาพ Well-being" },
  { value: "digital", label: "4. ดิจิทัล", desc: "เทคโนโลยีดิจิทัล ซอฟต์แวร์ แพลตฟอร์ม และปัญญาประดิษฐ์" },
  { value: "other", label: "5. อื่นๆ (ระบุ)", desc: "หัตถกรรม พลังงานสะอาด หรือธุรกิจกลุ่มอื่นๆ" }
];

export default function IDCFormPage() {
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    organizationType: "private" as OrganizationType,
    businessType: "food_processing" as BusinessType,
    businessTypeOther: "",
    address: "",
    taxId: "",
    phone: "",
    email: "",
    services: ["product_design"] as ServiceConsultationType[],
    serviceMain: "product_design" as ServiceConsultationType,
    serviceOtherDetail: "",
    pieceCount: 1,
    projectBrief: ""
  });

  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({
    product_design: 1
  });

  const updateServiceQty = (key: string, delta: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, (prev[key] || 1) + delta)
    }));
  };

  const setServiceQty = (key: string, qty: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, qty)
    }));
  };

  const toggleService = (key: ServiceConsultationType) => {
    setFormData(prev => {
      const exists = prev.services.includes(key);
      const updated = exists
        ? prev.services.filter(k => k !== key)
        : [...prev.services, key];
      return {
        ...prev,
        services: updated,
        serviceMain: updated[0] || "other"
      };
    });
    if (!serviceQuantities[key]) {
      setServiceQuantities(prev => ({ ...prev, [key]: 1 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.companyName.trim()) {
      alert("กรุณากรอกชื่อผู้รับบริการและชื่อสถานประกอบการ");
      return;
    }

    if (formData.services.length === 0) {
      alert("กรุณาเลือกประเภทงานที่ต้องการรับคำปรึกษาอย่างน้อย 1 รายการ");
      return;
    }

    setSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const nowTimestamp = Date.now();
      const token = `survey-${nowTimestamp.toString(36)}`;

      const supabase = createClient();

      // Get count of existing IDC briefs for neat sequential code (e.g. IDC-2026-007)
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
        console.warn("Could not fetch IDC count, using default sequence", e);
      }

      const generatedCode = `IDC-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;

      const serviceMap: Record<ServiceConsultationType, string> = {
        product_design: "ออกแบบผลิตภัณฑ์",
        packaging_design: "ออกแบบบรรจุภัณฑ์",
        print_media: "ออกแบบสื่อสิ่งพิมพ์",
        logo_branding: "ออกแบบตราสัญลักษณ์",
        ci_branding: "ออกแบบอัตลักษณ์ ( CI )",
        other: formData.serviceOtherDetail.trim() || "อื่นๆ"
      };
      const totalPieces = formData.services.reduce((sum, s) => sum + (serviceQuantities[s] || 1), 0);
      const selectedLabels = formData.services.map(s => {
        const name = serviceMap[s] || s;
        const qty = serviceQuantities[s] || 1;
        return qty > 1 ? `${name} (${qty} ชิ้น)` : name;
      });
      const serviceLabel = selectedLabels.join(", ") || "งานให้คำปรึกษา";

      // 1. Insert into Supabase 'briefs' table (Task รวม - Unit Internal, Assignee: พิม)
      const taskTitle = `[IDC] ให้คำปรึกษา: ${serviceLabel} - ${formData.companyName.trim()}`;

      const { error: briefError } = await supabase.from('briefs').insert([{
        project_name: taskTitle,
        unit: 'internal',
        status: 'pending',
        priority: 'Medium',
        assignee_id: PIM_ASSIGNEE_ID,
        coordinator_nickname: formData.clientName.trim(),
        requester_email: formData.email.trim() || 'idc@step.cmu.ac.th',
        decision_maker: formData.organizationType === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน',
        details: {
          category: 'Design',
          service_category: 'Innovation Design Center (IDC)',
          idc_code: generatedCode,
          client_name: formData.clientName.trim(),
          company_name: formData.companyName.trim(),
          organization: formData.organizationType === 'government' ? 'ภาครัฐ' : 'ภาคเอกชน',
          organization_type: formData.organizationType,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          tax_id: formData.taxId.trim(),
          address: formData.address.trim(),
          business_type: formData.businessType,
          business_type_other: formData.businessTypeOther.trim(),
          services: formData.services,
          service_labels: selectedLabels,
          service_quantities: serviceQuantities,
          service_main: formData.services[0] || 'other',
          service_label: serviceLabel,
          service_other_detail: formData.serviceOtherDetail.trim(),
          piece_count: totalPieces,
          revenue: 0,
          description: formData.projectBrief.trim() || `คำขอรับคำปรึกษาศูนย์ IDC: ${serviceLabel}\nผู้รับบริการ: ${formData.clientName.trim()} (${formData.companyName.trim()})\nเบอร์โทร: ${formData.phone.trim()}`,
          project_brief: formData.projectBrief.trim(),
          details: formData.projectBrief.trim() || `คำขอรับคำปรึกษาศูนย์ IDC: ${serviceLabel}\nผู้รับบริการ: ${formData.clientName.trim()} (${formData.companyName.trim()})\nเบอร์โทร: ${formData.phone.trim()}`,
          survey_token: token,
          survey_sent: false,
          assignee_name: PIM_NAME,
          team: 'CC'
        }
      }]);

      if (briefError) {
        console.error("Error inserting brief to Supabase:", briefError);
      }

      // 2. Persist to LocalStorage for IDC Report Dataset (cc_idc_records_v1)
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("cc_idc_records_v1");
          const existing = saved ? JSON.parse(saved) : [];
          const newRecord = {
            id: `idc-rec-${nowTimestamp}`,
            code: generatedCode,
            date: today,
            clientName: formData.clientName.trim(),
            companyName: formData.companyName.trim(),
            organizationType: formData.organizationType,
            businessType: formData.businessType,
            businessTypeOther: formData.businessTypeOther.trim(),
            address: formData.address.trim(),
            taxId: formData.taxId.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            serviceMain: formData.serviceMain,
            serviceOtherDetail: formData.serviceOtherDetail.trim(),
            pieceCount: totalPieces,
            serviceQuantities: serviceQuantities,
            projectBrief: formData.projectBrief.trim(),
            assignee: PIM_NAME,
            revenue: 0,
            status: "pending",
            surveyToken: token,
            surveySent: false
          };
          localStorage.setItem("cc_idc_records_v1", JSON.stringify([newRecord, ...existing]));
        } catch (storageErr) {
          console.error("Error updating local storage:", storageErr);
        }
      }

      setSubmittedCode(generatedCode);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedCode) {
      navigator.clipboard.writeText(submittedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-2 relative overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            แบบฟอร์มขอรับคำปรึกษาด้านงานสร้างสรรค์
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            ทีมสร้างสรรค์และการสื่อสาร : อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)
          </p>
        </div>

        {submittedCode ? (
          /* Success Screen */
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900">บันทึกคำขอรับคำปรึกษาเรียบร้อยแล้ว</h2>
              <p className="text-xs text-slate-500">
                ข้อมูลของท่านได้ถูกส่งเข้าระบบงาน CC Team เรียบร้อยแล้ว เจ้าหน้าที่ (คุณพิม) จะประสานงานกลับเพื่อยืนยันวันเวลานัดหมาย
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รหัสคำขอของท่าน</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-mono font-black text-slate-900">{submittedCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                  title="คัดลอกรหัส"
                >
                  {copiedCode ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSubmittedCode(null);
                  setFormData({
                    clientName: "",
                    companyName: "",
                    organizationType: "private",
                    businessType: "food_processing",
                    businessTypeOther: "",
                    address: "",
                    taxId: "",
                    phone: "",
                    email: "",
                    services: ["product_design"] as ServiceConsultationType[],
                    serviceMain: "product_design",
                    serviceOtherDetail: "",
                    pieceCount: 1,
                    projectBrief: ""
                  });
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto"
              >
                ส่งคำขอเพิ่มเติม
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-[#E03131] hover:bg-[#c92a2a] text-white rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto text-center shadow-xs"
              >
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {/* Section 1: ข้อมูลผู้รับบริการ & สถานประกอบการ */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 size={16} className="text-orange-500" />
                <span>1. ข้อมูลผู้รับบริการ &amp; สถานประกอบการ</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้รับบริการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณกมลรัตน์ เลิศวานิช"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อสถานประกอบการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น บริษัท ล้านนา ฟรุตส์ แอนด์ ดราย จำกัด"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* ประเภทหน่วยงาน: ภาคเอกชน, ภาครัฐ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทหน่วยงาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, organizationType: "private" })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.organizationType === "private"
                          ? "bg-blue-50 text-blue-700 border-blue-400 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏢 ภาคเอกชน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, organizationType: "government" })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.organizationType === "government"
                          ? "bg-purple-50 text-purple-700 border-purple-400 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🏛️ ภาครัฐ</span>
                    </button>
                  </div>
                </div>

                {/* ประเภทธุรกิจ / ผลิตภัณฑ์ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทธุรกิจ / ผลิตภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <ModernSelect
                    value={formData.businessType}
                    onChange={val => setFormData({ ...formData, businessType: val as BusinessType })}
                    options={IDC_BUSINESS_TYPE_OPTIONS}
                    placeholder="เลือกประเภทธุรกิจ / ผลิตภัณฑ์..."
                    searchPlaceholder="ค้นหาประเภทธุรกิจ (เช่น อาหาร, เกษตร, ดิจิทัล)..."
                    searchable={true}
                    className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-2.5 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300"
                  />
                </div>
              </div>

              {formData.businessType === "other" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ระบุประเภทธุรกิจอื่นๆ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น หัตถกรรม, สิ่งทอสร้างสรรค์ ฯลฯ"
                    value={formData.businessTypeOther}
                    onChange={e => setFormData({ ...formData, businessTypeOther: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                  <input
                    type="text"
                    placeholder="เช่น 0505562001928"
                    value={formData.taxId}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 081-952-4412"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="เช่น contact@business.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่สถานประกอบการ</label>
                <textarea
                  rows={2}
                  placeholder="เลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Section 2: ประเภทงานที่รับคำปรึกษา */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Layers size={16} className="text-orange-500" />
                <span>2. ประเภทงานที่รับคำปรึกษา</span>
              </h3>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    เลือกประเภทงานที่ต้องการรับคำปรึกษา <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    สามารถเลือกได้หลายอย่าง (ระบุจำนวนชิ้นในแต่ละประเภทได้)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SERVICE_OPTIONS.map(s => {
                    const isSelected = formData.services.includes(s.key);
                    const qty = serviceQuantities[s.key] || 1;
                    return (
                      <div
                        key={s.key}
                        onClick={() => toggleService(s.key)}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? "bg-orange-50/70 text-orange-950 border-orange-400 shadow-2xs ring-1 ring-orange-400"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="leading-snug">{s.label}</span>
                          {isSelected ? (
                            <CheckCircle2 size={16} className="text-orange-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
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
                                onClick={() => updateServiceQty(s.key, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-orange-100 text-orange-800 font-bold cursor-pointer select-none transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={e => setServiceQty(s.key, parseInt(e.target.value) || 1)}
                                className="w-8 text-center font-mono font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => updateServiceQty(s.key, 1)}
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

              {formData.services.includes("other") && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระบุประเภทงานที่ต้องการรับคำปรึกษาเพิ่มเติม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 3D Visualization, Mockup ต้นแบบเสมือนจริง ฯลฯ"
                    value={formData.serviceOtherDetail}
                    onChange={e => setFormData({ ...formData, serviceOtherDetail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Project Brief - Full Width */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดสังเขป / วัตถุประสงค์งาน (Project Brief)
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ต้องการคำปรึกษาการปรับภาพลักษณ์แบรนด์สำหรับส่งออก, การเลือกวัสดุบรรจุภัณฑ์รักษ์โลก ฯลฯ"
                  value={formData.projectBrief}
                  onChange={e => setFormData({ ...formData, projectBrief: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#E03131] hover:bg-[#c92a2a] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>กำลังส่งข้อมูล...</span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>บันทึกคำขอเข้ารับบริการ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
