"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  X, Printer, Download, Save, Plus, Trash2, 
  Check, AlertCircle, FileText, Building2, User, 
  Copy, Edit3, Search, RefreshCw, Calculator, History,
  ChevronRight, Lock, Unlock, Image as ImageIcon, Sparkles, CheckCircle2
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { STEP_DOCUMENT_LOGO_BASE64 } from "@/utils/stepLogoBase64";
import catalogData from "@/utils/stepQuotationCatalog.json";
import { 
  CALCULATOR_ITEMS, 
  CALCULATOR_CATEGORIES, 
  COMPLEXITY_LEVELS, 
  MULTIPLIER_PRESETS,
  calculateBasePrice,
  calculateItemPrice,
  CalculatorItem 
} from "@/utils/stepDesignPricingCalculator";
import ModernDatePicker from "@/components/ModernDatePicker";
import { createClient } from "@/utils/supabase/client";

// Thai Baht Text Formatter
function convertIntegerToThai(nStr: string): string {
  const d = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const u = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  let t = "";
  if (nStr === "0") return "ศูนย์";
  const r = nStr.split('').reverse().join('');
  for (let i = 0; i < r.length; i++) {
    const dgt = parseInt(r[i]);
    const uIdx = i % 6;
    if (dgt === 0) continue;
    let cTxt = "";
    const uName = u[uIdx];
    if (dgt === 1 && uIdx === 1) cTxt = uName;
    else if (dgt === 2 && uIdx === 1) cTxt = "ยี่" + uName;
    else if (dgt === 1 && uIdx === 0 && i > 0 && r.length > 1) cTxt = "เอ็ด";
    else cTxt = d[dgt] + uName;
    
    if (uIdx === 0 && i > 5) {
      if (i === 6) t = d[dgt] + "ล้าน" + t;
      else {
        const s = r.substring(i);
        const sTxt = convertIntegerToThai(s.split('').reverse().join(''));
        t = sTxt + "ล้าน" + t;
        break;
      }
    } else {
      t = cTxt + t;
    }
  }
  return t;
}

export function numberToThaiText(a: number | string): string {
  let n = String(a).trim();
  if (!n || isNaN(parseFloat(n))) return "ศูนย์บาทถ้วน";
  n = parseFloat(n).toFixed(2);
  if (n === "0.00") return "ศูนย์บาทถ้วน";
  const p = n.split('.');
  const b = p[0];
  const s = p.length > 1 ? p[1] : "00";
  const bTxt = convertIntegerToThai(b);
  let r = bTxt + "บาท";
  const sInt = parseInt(s, 10);
  if (sInt > 0) {
    const sTxt = convertIntegerToThai(String(sInt));
    r += sTxt + "สตางค์";
  } else {
    r += "ถ้วน";
  }
  return r;
}

export const formatCurrency = (n: number | string): string => {
  const val = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(isNaN(val) ? 0 : val);
};

// Thai Date Formatter (e.g. 30 กันยายน 2569)
const formatThaiDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 543;
      const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month} ${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

// Calculate Thai Fiscal Year short digits (e.g. Sep 2026 = 69, Oct 2026 = 70)
export function getThaiFiscalYearShort(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const m = d.getMonth() + 1; // 1-12
  let y = d.getFullYear() + 543;
  if (m >= 10) {
    y += 1;
  }
  return String(y).slice(-2);
}

// Strip internal difficulty score from customer-facing text
export function stripDifficulty(text: string): string {
  if (!text) return "";
  return text.replace(/\s*\(\s*ความยาก[^\)]*\)/g, "").replace(/\s*-\s*$/, "").trim();
}

export type QuotationItem = {
  description: string;
  quantity: number;
  price: number;
};

export interface CalcSelectedEntry {
  uid: string;
  itemId: string;
  item: CalculatorItem;
  difficulty: number;
  multiplier: number;
  customPrice?: number;
  quantity: number;
}

export type StepQuotationData = {
  id?: string;
  documentType: "quote";
  docId: string;
  docDate: string;
  providerName: string;
  providerTaxId: string;
  providerAddress: string;
  providerPhone: string;
  customerName: string;
  customerAddress: string;
  customerTaxId: string;
  customerPhone: string;
  items: QuotationItem[];
  paymentTerms: string;
  discountPercent: number;
  discountAmount: number;
  excludeVat: boolean;
  preparerName: string;
  preparerDate: string;
  preparerSignature: string | null;
  proposerName: string;
  proposerTitle: string;
  proposerDate: string;
  proposerSignature: string | null;
  approverName: string;
  approverDate: string;
  createdAt?: string;
  updatedAt?: string;
};

interface StepQuotationModalProps {
  initialData?: Partial<StepQuotationData>;
  onClose: () => void;
  onSave?: (data: StepQuotationData, totalAmount: number) => void | Promise<void>;
}

export default function StepQuotationModal({
  initialData,
  onClose,
  onSave
}: StepQuotationModalProps) {
  const [mounted, setMounted] = useState(false);
  // Reorder tabs: 1. Calculator 2. Editor 3. History
  const [activeTab, setActiveTab] = useState<"calculator" | "editor" | "history">(
    initialData?.items && initialData.items.length > 0 && initialData.items[0].description
      ? "editor"
      : "calculator"
  );

  // Save & Lock State
  const [isSaved, setIsSaved] = useState(Boolean(initialData?.docId));
  const [showWarningNotice, setShowWarningNotice] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);

  // History list
  const [historyList, setHistoryList] = useState<StepQuotationData[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Document Fields
  const [docId, setDocId] = useState(initialData?.docId || "");
  const [docDate, setDocDate] = useState(initialData?.docDate || new Date().toISOString().split("T")[0]);

  // Provider
  const [providerName] = useState(initialData?.providerName || "อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่");
  const [providerTaxId] = useState(initialData?.providerTaxId || "0-9940-00423-17-9");
  const [providerAddress] = useState(
    initialData?.providerAddress || 
    "อาคารอำนวยการอุทยานวิทยาศาสตร์ภาคเหนือ (จังหวัดเชียงใหม่) ชั้น 2 (อาคารA) 155 หมู่ 2 ต.แม่เหียะ อ.เมือง จ.เชียงใหม่ 50100"
  );
  const [providerPhone] = useState(initialData?.providerPhone || "โทร: 0 5394 8678 | อีเมล: info@step.cmu.ac.th");

  // Customer
  const [customerName, setCustomerName] = useState(initialData?.customerName || "");
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || "");
  const [customerTaxId, setCustomerTaxId] = useState(initialData?.customerTaxId || "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || "");

  // Items
  const [items, setItems] = useState<QuotationItem[]>(
    initialData?.items && initialData.items.length > 0 
      ? initialData.items.map(it => ({ ...it, description: stripDifficulty(it.description) }))
      : [{ description: "", quantity: 1, price: 0 }]
  );

  // Discount & Tax (Item 2)
  const [discountPercent, setDiscountPercent] = useState<number>(initialData?.discountPercent || 0);
  const [discountAmount, setDiscountAmount] = useState<number>(initialData?.discountAmount || 0);
  const [excludeVat, setExcludeVat] = useState(initialData?.excludeVat ?? true);

  // Signatures (Item 4: ModernDatePicker)
  const [preparerName, setPreparerName] = useState(() => {
    if (initialData?.preparerName && initialData.preparerName !== "พนักงานออกแบบสร้างสรรค์") {
      return initialData.preparerName;
    }
    if (typeof window !== "undefined") {
      const storedFullname = localStorage.getItem("cc_user_fullname");
      if (storedFullname) return storedFullname;
      const storedName = localStorage.getItem("cc_user_name");
      if (storedName) return storedName;
    }
    return initialData?.preparerName || "พนักงานออกแบบสร้างสรรค์";
  });
  const [preparerDate, setPreparerDate] = useState(initialData?.preparerDate || new Date().toISOString().split("T")[0]);
  const [preparerSig, setPreparerSig] = useState<string | null>(initialData?.preparerSignature || null);

  const [proposerName, setProposerName] = useState(initialData?.proposerName || "นายอัจชนะพงษ์ อัจชนะวราทา");
  const [proposerTitle, setProposerTitle] = useState(initialData?.proposerTitle || "หัวหน้างานสร้างสรรค์และการสื่อสาร");
  const [proposerDate, setProposerDate] = useState(initialData?.proposerDate || new Date().toISOString().split("T")[0]);
  const [proposerSig, setProposerSig] = useState<string | null>(initialData?.proposerSignature || null);

  const [approverName, setApproverName] = useState(initialData?.approverName || "ผศ.ดร.เกษมศักดิ์ อุทัยชนะ");
  const [approverDate, setApproverDate] = useState(initialData?.approverDate || new Date().toISOString().split("T")[0]);

  // Payment Terms State (Requirement 4: Auto 50% default, editable)
  const [paymentTerms, setPaymentTerms] = useState<string>(initialData?.paymentTerms || "");
  const [isCustomPaymentTerms, setIsCustomPaymentTerms] = useState<boolean>(Boolean(initialData?.paymentTerms));

  // Calculator State (Requirement 1: 900฿ & 450฿ Multiplier Model 0.5 - 10 เท่า, Red X, Plus button for variations)
  const [calcCategory, setCalcCategory] = useState<string>("ALL");
  const [calcSearch, setCalcSearch] = useState<string>("");
  const [calcEntries, setCalcEntries] = useState<CalcSelectedEntry[]>([]);
  const [customJobs, setCustomJobs] = useState<CalculatorItem[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomType, setNewCustomType] = useState<"main" | "topup">("main");
  const [newCustomDifficulty, setNewCustomDifficulty] = useState<number>(5);
  const [newCustomScope, setNewCustomScope] = useState("");

  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Customers and Products Catalog from Google Sheet
  const customers = useMemo(() => catalogData.customers || [], []);
  const products = useMemo(() => catalogData.products || [], []);

  // Track modifications to lock export if modified after save
  const handleFieldChange = () => {
    setIsSaved(false);
  };

  // Load history from LocalStorage & Supabase briefs on mount
  useEffect(() => {
    setMounted(true);
    const loadHistory = async () => {
      let merged: StepQuotationData[] = [];
      try {
        const local = localStorage.getItem("step_quotations_history_v1");
        if (local) {
          merged = JSON.parse(local);
        }
      } catch (e) {
        console.warn("Failed to parse local history", e);
      }

      // Also query Supabase briefs that have quotation
      try {
        const supabase = createClient();
        const { data: briefsWithQuotation } = await supabase
          .from("briefs")
          .select("id, details, created_at")
          .not("details->quotation", "is", null);

        if (briefsWithQuotation) {
          briefsWithQuotation.forEach(b => {
            const q = b.details?.quotation;
            if (q && q.docId && !merged.some(m => m.docId === q.docId)) {
              merged.push({
                ...q,
                id: b.id,
                createdAt: b.created_at
              });
            }
          });
        }
      } catch (err) {
        console.warn("Failed to fetch supabase quotations", err);
      }

      setHistoryList(merged);

      // Auto generate next sequence number if no docId provided (Item 1: QT-ปีงบ-1 ... ไม่ซ้ำกัน)
      if (!initialData?.docId) {
        const currentFiscal = getThaiFiscalYearShort(new Date().toISOString().split("T")[0]);
        const pattern = new RegExp(`^QT-${currentFiscal}-(\\d+)$`, "i");

        let maxSeq = 0;
        merged.forEach(item => {
          const match = item.docId?.match(pattern);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });

        const nextNum = maxSeq + 1;
        setDocId(`QT-${currentFiscal}-${nextNum}`);
      }
    };

    loadHistory();
  }, [initialData?.docId]);

  // Financial Computations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
  }, [items]);

  const effectiveDiscount = useMemo(() => {
    return Math.max(0, Math.min(subtotal, Number(discountAmount) || 0));
  }, [subtotal, discountAmount]);

  const afterDiscount = useMemo(() => {
    return Math.max(0, subtotal - effectiveDiscount);
  }, [subtotal, effectiveDiscount]);

  const vatAmount = useMemo(() => {
    return excludeVat ? 0 : afterDiscount * 0.07;
  }, [excludeVat, afterDiscount]);

  const totalAmount = useMemo(() => {
    return afterDiscount + vatAmount;
  }, [afterDiscount, vatAmount]);

  // 50% / 50% Payment terms calculations (Requirement 4: Auto 50% default)
  const installmentAmount = useMemo(() => {
    return totalAmount / 2;
  }, [totalAmount]);

  const defaultPaymentTermsText = useMemo(() => {
    return `1. ชำระเงิน งวดที่ 1 จำนวน 50% เป็นเงิน (${formatCurrency(installmentAmount)}) บาท\n   ( ภายใน 7 วัน หลังจากลงนามยอมรับรายละเอียดของขอบเขตงาน )\n\n2. ชำระเงิน งวดที่ 2 จำนวน 50% เป็นเงิน (${formatCurrency(installmentAmount)}) บาท\n   ( ภายใน 7 วัน หลังจากส่งมอบผลงานการออกแบบทั้งหมดแล้วเสร็จ )`;
  }, [installmentAmount]);

  // Keep paymentTerms in sync with 50% auto calculation unless customized by user
  useEffect(() => {
    if (!isCustomPaymentTerms) {
      setPaymentTerms(defaultPaymentTermsText);
    }
  }, [defaultPaymentTermsText, isCustomPaymentTerms]);

  // Item 2: Handle discount percentage change
  const handleDiscountPercentChange = (valStr: string) => {
    handleFieldChange();
    const pct = parseFloat(valStr) || 0;
    setDiscountPercent(pct);
    const computedBaht = Math.round((subtotal * pct) / 100 * 100) / 100;
    setDiscountAmount(computedBaht);
  };

  // Item 2: Handle discount Baht change (allowing custom decimals or rounded amounts)
  const handleDiscountAmountChange = (valStr: string) => {
    handleFieldChange();
    const baht = parseFloat(valStr) || 0;
    setDiscountAmount(baht);
    if (subtotal > 0) {
      const computedPct = Math.round((baht / subtotal) * 10000) / 100;
      setDiscountPercent(computedPct);
    }
  };

  // Autocomplete customer
  const handleSelectCustomer = (name: string) => {
    handleFieldChange();
    setCustomerName(name);
    const found = customers.find(c => (c.CustomerName || "").toLowerCase() === name.toLowerCase());
    if (found) {
      if (found.Address) setCustomerAddress(found.Address);
      if (found.TaxID) setCustomerTaxId(found.TaxID);
      if (found.Phone) setCustomerPhone(found.Phone);
    }
  };

  // Item management
  const updateItem = (index: number, field: keyof QuotationItem, val: any) => {
    handleFieldChange();
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const addItem = () => {
    handleFieldChange();
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    handleFieldChange();
    if (items.length <= 1) {
      setItems([{ description: "", quantity: 1, price: 0 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Save Quotation
  const handleSave = async () => {
    const payload: StepQuotationData = {
      documentType: "quote",
      docId: docId.trim(),
      docDate,
      providerName,
      providerTaxId,
      providerAddress,
      providerPhone,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerTaxId: customerTaxId.trim(),
      customerPhone: customerPhone.trim(),
      items: items.filter(it => it.description.trim() || it.price > 0),
      paymentTerms: paymentTerms || defaultPaymentTermsText,
      discountPercent,
      discountAmount: effectiveDiscount,
      excludeVat,
      preparerName,
      preparerDate,
      preparerSignature: preparerSig,
      proposerName,
      proposerTitle,
      proposerDate,
      proposerSignature: proposerSig,
      approverName,
      approverDate,
      updatedAt: new Date().toISOString()
    };

    // Update history list in LocalStorage
    try {
      const existing = historyList.filter(h => h.docId !== payload.docId);
      const updatedHistory = [payload, ...existing];
      setHistoryList(updatedHistory);
      localStorage.setItem("step_quotations_history_v1", JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save to local storage", e);
    }

    setIsSaved(true);
    setShowSaveSuccessModal(true);
    setWarningMessage("ระบบนี้ใช้ในการออกใบเสนอราคาของทีม CC การวางบิลและออกใบเสร็จรับเงินต้องดำเนินการออกโดยทีมการเงินของ STeP เท่านั้น");
    setShowWarningNotice(true);

    if (onSave) {
      try {
        await onSave(payload, totalAmount);
      } catch (e) {
        console.warn("onSave async error", e);
      }
    }
  };

  // Action from History: Edit
  const handleHistoryEdit = (item: StepQuotationData) => {
    setDocId(item.docId);
    setDocDate(item.docDate || new Date().toISOString().split("T")[0]);
    setCustomerName(item.customerName || "");
    setCustomerAddress(item.customerAddress || "");
    setCustomerTaxId(item.customerTaxId || "");
    setCustomerPhone(item.customerPhone || "");
    setItems(item.items && item.items.length > 0 ? item.items.map(it => ({ ...it, description: stripDifficulty(it.description) })) : [{ description: "", quantity: 1, price: 0 }]);
    if (item.paymentTerms) {
      setPaymentTerms(item.paymentTerms);
      setIsCustomPaymentTerms(true);
    } else {
      setIsCustomPaymentTerms(false);
    }
    setDiscountPercent(item.discountPercent || 0);
    setDiscountAmount(item.discountAmount || 0);
    setExcludeVat(item.excludeVat ?? true);
    setPreparerName(item.preparerName || "พนักงานออกแบบสร้างสรรค์");
    setPreparerDate(item.preparerDate || new Date().toISOString().split("T")[0]);
    setProposerName(item.proposerName || "นายอัจชนะพงษ์ อัจชนะวราทา");
    setProposerTitle(item.proposerTitle || "หัวหน้างานสร้างสรรค์และการสื่อสาร");
    setProposerDate(item.proposerDate || new Date().toISOString().split("T")[0]);
    setApproverName(item.approverName || "ผศ.ดร.เกษมศักดิ์ อุทัยชนะ");
    setApproverDate(item.approverDate || new Date().toISOString().split("T")[0]);

    setIsSaved(true);
    setActiveTab("editor");
  };

  // Action from History: Copy (Clone to new sequential docId)
  const handleHistoryCopy = (source: StepQuotationData) => {
    const currentFiscal = getThaiFiscalYearShort(new Date().toISOString().split("T")[0]);
    const pattern = new RegExp(`^QT-${currentFiscal}-(\\d+)$`, "i");

    let maxSeq = 0;
    historyList.forEach(item => {
      const match = item.docId?.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextDocId = `QT-${currentFiscal}-${maxSeq + 1}`;

    setDocId(nextDocId);
    setDocDate(new Date().toISOString().split("T")[0]);
    setCustomerName(source.customerName || "");
    setCustomerAddress(source.customerAddress || "");
    setCustomerTaxId(source.customerTaxId || "");
    setCustomerPhone(source.customerPhone || "");
    setItems(source.items && source.items.length > 0 ? source.items.map(it => ({ ...it, description: stripDifficulty(it.description) })) : [{ description: "", quantity: 1, price: 0 }]);
    if (source.paymentTerms) {
      setPaymentTerms(source.paymentTerms);
      setIsCustomPaymentTerms(true);
    } else {
      setIsCustomPaymentTerms(false);
    }
    setDiscountPercent(source.discountPercent || 0);
    setDiscountAmount(source.discountAmount || 0);
    setExcludeVat(source.excludeVat ?? true);
    setPreparerName(source.preparerName || "พนักงานออกแบบสร้างสรรค์");
    setPreparerDate(new Date().toISOString().split("T")[0]);
    setProposerName(source.proposerName || "นายอัจชนะพงษ์ อัจชนะวราทา");
    setProposerTitle(source.proposerTitle || "หัวหน้างานสร้างสรรค์และการสื่อสาร");
    setProposerDate(new Date().toISOString().split("T")[0]);
    setApproverName(source.approverName || "ผศ.ดร.เกษมศักดิ์ อุทัยชนะ");
    setApproverDate(new Date().toISOString().split("T")[0]);

    setIsSaved(false); // newly copied must be saved
    setActiveTab("editor");
  };

  // Action from History: Delete
  const handleHistoryDelete = (targetDocId: string) => {
    if (!confirm(`คุณต้องการลบใบเสนอราคา ${targetDocId} หรือไม่?`)) return;
    const next = historyList.filter(h => h.docId !== targetDocId);
    setHistoryList(next);
    try {
      localStorage.setItem("step_quotations_history_v1", JSON.stringify(next));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  // Print A4 (Faithful graphics and layout 100%)
  const handlePrint = () => {
    if (!isSaved) {
      alert("กรุณากด 'บันทึกข้อมูล' ก่อนจึงจะสามารถสั่งพิมพ์เอกสารได้");
      return;
    }
    if (activeTab !== "editor") {
      setActiveTab("editor");
      setTimeout(() => {
        window.print();
      }, 300);
      return;
    }
    window.print();
  };

  // Export PDF using html2canvas-pro & jsPDF (Clean A4 file, identical graphics)
  const handleExportPDF = async () => {
    if (!isSaved) {
      alert("กรุณากด 'บันทึกข้อมูล' ก่อนจึงจะสามารถ Export เอกสารได้");
      return;
    }
    if (activeTab !== "editor") {
      setActiveTab("editor");
    }
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 250));
      const element = document.getElementById("step-quotation-a4-document");
      if (!element) throw new Error("Document element not found");

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      pdf.save(`${docId || 'Quotation'}_${customerName || 'customer'}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Export JPEG / PNG using html2canvas-pro
  const handleExportImage = async (formatType: "jpeg" | "png") => {
    if (!isSaved) {
      alert("กรุณากด 'บันทึกข้อมูล' ก่อนจึงจะสามารถ Export เอกสารได้");
      return;
    }
    if (activeTab !== "editor") {
      setActiveTab("editor");
    }
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 250));
      const element = document.getElementById("step-quotation-a4-document");
      if (!element) throw new Error("Document element not found");

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false
      });

      const mimeType = formatType === "jpeg" ? "image/jpeg" : "image/png";
      const quality = formatType === "jpeg" ? 0.95 : 1.0;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const link = document.createElement("a");
      link.download = `${docId || 'Quotation'}_${customerName || 'customer'}.${formatType}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ภาพ");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculator Handlers (Requirement 1: Red X, Plus button for variations/more, Custom jobs)
  const handleAddFirstCalcEntry = (item: CalculatorItem) => {
    const newEntry: CalcSelectedEntry = {
      uid: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      item,
      difficulty: item.difficulty || (item.type === "main" ? 5 : 2),
      multiplier: 1.0,
      quantity: 1
    };
    setCalcEntries(prev => [...prev, newEntry]);
  };

  const handleAddMoreCalcEntry = (item: CalculatorItem) => {
    const newEntry: CalcSelectedEntry = {
      uid: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      item,
      difficulty: item.difficulty || (item.type === "main" ? 5 : 2),
      multiplier: 1.0,
      quantity: 1
    };
    setCalcEntries(prev => [...prev, newEntry]);
  };

  const handleRemoveCalcEntry = (uid: string) => {
    setCalcEntries(prev => prev.filter(e => e.uid !== uid));
  };

  const handleRemoveAllItemEntries = (itemId: string) => {
    setCalcEntries(prev => prev.filter(e => e.itemId !== itemId));
  };

  const handleUpdateEntryDifficulty = (uid: string, diff: number) => {
    setCalcEntries(prev => prev.map(e => e.uid === uid ? { ...e, difficulty: Math.max(0.5, diff), customPrice: undefined } : e));
  };

  const handleUpdateEntryMultiplier = (uid: string, mult: number) => {
    setCalcEntries(prev => prev.map(e => e.uid === uid ? { ...e, multiplier: Math.max(0.5, Math.min(10, mult)), customPrice: undefined } : e));
  };

  const handleUpdateEntryCustomPrice = (uid: string, price: number | undefined) => {
    setCalcEntries(prev => prev.map(e => e.uid === uid ? { ...e, customPrice: price } : e));
  };

  const handleUpdateEntryQty = (uid: string, qty: number) => {
    setCalcEntries(prev => prev.map(e => e.uid === uid ? { ...e, quantity: Math.max(1, qty) } : e));
  };

  const handleCreateCustomJob = () => {
    if (!newCustomName.trim()) {
      alert("กรุณาระบุชื่องาน");
      return;
    }
    const customItem: CalculatorItem = {
      id: `custom-${Date.now()}`,
      category: "CUSTOM",
      categoryName: "งานกำหนดเอง",
      type: newCustomType,
      name: newCustomName.trim(),
      difficulty: newCustomDifficulty,
      basePrice: (newCustomType === "main" ? 900 : 450) * newCustomDifficulty,
      scope: newCustomScope.trim() || "งานบริการออกแบบสร้างสรรค์เพิ่มเติม",
      unit: "งาน"
    };
    setCustomJobs(prev => [customItem, ...prev]);
    handleAddFirstCalcEntry(customItem);
    setNewCustomName("");
    setNewCustomScope("");
    setShowAddCustomModal(false);
  };

  // Calculator Computations
  const calcTotals = useMemo(() => {
    let mainTotal = 0;
    let topupTotal = 0;

    calcEntries.forEach(({ item, difficulty, multiplier, customPrice, quantity }) => {
      const baseRate = item.type === "main" ? 900 : 450;
      const standardPrice = baseRate * difficulty;
      const unitPrice = customPrice !== undefined ? customPrice : Math.round(standardPrice * multiplier);
      const lineTotal = unitPrice * quantity;

      if (item.type === "main") {
        mainTotal += lineTotal;
      } else {
        topupTotal += lineTotal;
      }
    });

    return {
      mainTotal,
      topupTotal,
      grandTotal: mainTotal + topupTotal
    };
  }, [calcEntries]);

  // Apply Calculator result to Quotation Tab 2
  const handleApplyCalculatorToQuotation = () => {
    if (calcEntries.length === 0) {
      alert("กรุณาเลือกรายการที่ต้องการคำนวณอย่างน้อย 1 รายการ");
      return;
    }

    const convertedItems: QuotationItem[] = calcEntries.map(({ item, difficulty, multiplier, customPrice, quantity }) => {
      const baseRate = item.type === "main" ? 900 : 450;
      const standardPrice = baseRate * difficulty;
      const unitPrice = customPrice !== undefined ? customPrice : Math.round(standardPrice * multiplier);
      // Clean customer-facing description: strictly NO internal difficulty scores
      const desc = item.scope ? `${item.name} - ${item.scope}` : item.name;
      return {
        description: stripDifficulty(desc),
        quantity,
        price: unitPrice
      };
    });

    handleFieldChange();
    setItems(convertedItems);
    setActiveTab("editor");
  };

  if (!mounted) return null;

  return (
    <div 
      id="step-quotation-modal-overlay" 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div 
        id="step-quotation-modal-container" 
        className="bg-slate-100 w-full max-w-[1500px] h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Top Header - Dieter Rams Functional Minimalism */}
        <div 
          id="step-quotation-modal-header" 
          className="bg-white border-b border-slate-200/90 px-6 py-3 flex items-center justify-between gap-4 shrink-0"
        >
          {/* Left: Branding & Navigation Tabs */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                    ระบบใบเสนอราคา STeP CMU
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Quotation Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  มาตรฐานทางการอุทยานฯ STeP CMU 100%
                </p>
              </div>
            </div>

            {/* Navigation Tabs - Order: 1. คำนวณราคา 2. ออกใบเสนอราคา 3. ประวัติ */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              
              {/* Tab 1: คำนวณราคา */}
              <button
                type="button"
                onClick={() => setActiveTab("calculator")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "calculator"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calculator size={13} className={activeTab === "calculator" ? "text-emerald-500" : ""} />
                <span>คำนวณราคา</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  0.5-10 เท่า
                </span>
              </button>

              {/* Tab 2: ออกใบเสนอราคา */}
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText size={13} className={activeTab === "editor" ? "text-amber-500" : ""} />
                <span>ออกใบเสนอราคา</span>
              </button>

              {/* Tab 3: ประวัติ */}
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "history"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <History size={13} className={activeTab === "history" ? "text-blue-500" : ""} />
                <span>ประวัติ</span>
                {historyList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                    {historyList.length}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* Right: Actions Cluster & Far-Right Close Button */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save size={14} />
              <span>บันทึกข้อมูล</span>
            </button>

            {/* Lock status pill if not saved */}
            {!isSaved && activeTab === "editor" && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium flex items-center gap-1 hidden md:flex">
                <Lock size={11} className="text-amber-600" /> บันทึกก่อนพิมพ์/Export
              </span>
            )}

            {/* Export & Print Segmented Group */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!isSaved}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  isSaved 
                    ? "hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer" 
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title={isSaved ? "พิมพ์เอกสาร A4" : "กรุณาบันทึกข้อมูลก่อนพิมพ์"}
              >
                <Printer size={13} />
                <span className="hidden sm:inline">พิมพ์</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={!isSaved || isExporting}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  isSaved && !isExporting
                    ? "hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer" 
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title={isSaved ? "ดาวน์โหลด PDF (A4)" : "กรุณาบันทึกข้อมูลก่อน Export"}
              >
                <Download size={13} />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportImage("jpeg")}
                disabled={!isSaved || isExporting}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  isSaved && !isExporting
                    ? "hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer" 
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title={isSaved ? "Export ภาพ JPEG" : "กรุณาบันทึกข้อมูลก่อน Export"}
              >
                <ImageIcon size={13} />
                <span>JPEG</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportImage("png")}
                disabled={!isSaved || isExporting}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  isSaved && !isExporting
                    ? "hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer" 
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title={isSaved ? "Export ภาพ PNG" : "กรุณาบันทึกข้อมูลก่อน Export"}
              >
                <ImageIcon size={13} />
                <span>PNG</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="h-5 w-[1px] bg-slate-200"></div>

            {/* Close Button: Far Right Corner */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              title="ปิดหน้าต่าง (Close)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Warning Notice Banner */}
        {showWarningNotice && warningMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500 text-white shrink-0">
                <AlertCircle size={13} />
              </span>
              <strong className="font-semibold">{warningMessage}</strong>
            </div>
            <button
              type="button"
              onClick={() => setShowWarningNotice(false)}
              className="text-amber-700 hover:text-amber-900 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Requirement 4: Save Success & Warning Alert Modal Popup */}
        {showSaveSuccessModal && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
              
              {/* Success Badge */}
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} className="stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  บันทึกสำเร็จ
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  เลขที่เอกสาร: <span className="font-bold text-amber-600">{docId}</span> | วันที่: {formatThaiDate(docDate)}
                </p>
              </div>

              {/* Requirement 2 & 3: Prominent Red Warning Card (BG Red, Text White) */}
              <div className="bg-red-600 rounded-2xl p-4 text-left space-y-2 shadow-md border border-red-700">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <AlertCircle size={18} className="text-white shrink-0" />
                  <span>ข้อกำหนดและคำเตือนสำคัญ</span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed pl-6">
                  ระบบนี้ใช้ในการออกใบเสนอราคาของทีม CC การวางบิลและออกใบเสร็จรับเงินต้องดำเนินการออกโดยทีมการเงินของ STeP เท่านั้น
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveSuccessModal(false);
                    setActiveTab("editor");
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
                >
                  รับทราบ / ดำเนินการต่อที่ใบเสนอราคา
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 1: Editor & Preview */}
        {activeTab === "editor" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left Control Panel */}
            <div 
              id="step-quotation-modal-left-panel"
              className="w-full lg:w-[480px] xl:w-[520px] bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto space-y-4 custom-scrollbar shrink-0"
            >
              
              {/* Document Identity Box (Item 1: QT-ปีงบ-1) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      เลขที่และวันที่เอกสาร
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    ใบเสนอราคา
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">
                      เลขที่เอกสาร (Auto Sequence)
                    </label>
                    <input
                      type="text"
                      value={docId}
                      onChange={(e) => {
                        handleFieldChange();
                        setDocId(e.target.value);
                      }}
                      placeholder="QT-69-1"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">
                      วันที่ออกเอกสาร (Item 4)
                    </label>
                    <ModernDatePicker
                      value={docDate}
                      onChange={(val) => {
                        handleFieldChange();
                        setDocDate(val);
                      }}
                      placeholder="YYYY-MM-DD"
                      className="w-full text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-blue-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ข้อมูลลูกค้า (CUSTOMER)
                    </h3>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1 font-semibold">ชื่อลูกค้า / บริษัท</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      handleFieldChange();
                      setCustomerName(e.target.value);
                    }}
                    placeholder="ระบุชื่อลูกค้า / บริษัท..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1 font-semibold">ที่อยู่ลูกค้า</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => {
                      handleFieldChange();
                      setCustomerAddress(e.target.value);
                    }}
                    placeholder="ที่อยู่สำหรับออกเอกสาร..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      value={customerTaxId}
                      onChange={(e) => {
                        handleFieldChange();
                        setCustomerTaxId(e.target.value);
                      }}
                      placeholder="Tax ID..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => {
                        handleFieldChange();
                        setCustomerPhone(e.target.value);
                      }}
                      placeholder="เบอร์โทร..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Items List (Image 1 fix: cleanly removes the dropdown that was crossed out) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      รายการสินค้า / บริการ
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("calculator")}
                      className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Calculator size={12} /> คำนวณราคา
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">{items.length} รายการ</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 relative group">
                      <div className="flex items-start justify-between gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="รายละเอียดงาน/สินค้า..."
                          rows={2}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pl-7">
                        <div className="w-24">
                          <label className="text-[10px] text-slate-400 block font-semibold">จำนวน</label>
                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-xs text-center bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block font-semibold">ราคา/หน่วย (บาท)</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1 text-xs text-right bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold font-mono text-slate-800"
                          />
                        </div>
                        <div className="w-24 text-right">
                          <label className="text-[10px] text-slate-400 block font-semibold">รวม</label>
                          <span className="text-xs font-bold text-amber-700 font-mono">
                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={14} /> เพิ่มรายการสินค้า/บริการ
                </button>
              </div>

              {/* Item 2: ส่วนลด & ภาษี (กรอกเป็น % และมีราคาที่ลดแสดง + แก้ไขตัวเลขได้กรณีมีทศนิยม) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ส่วนลด & ภาษี (Item 2)
                  </h3>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={excludeVat}
                      onChange={(e) => {
                        handleFieldChange();
                        setExcludeVat(e.target.checked);
                      }}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>ไม่คำนวณ VAT (7%)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">ส่วนลด (%)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discountPercent || ""}
                        onChange={(e) => handleDiscountPercentChange(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 text-xs text-right pr-6 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                      <span className="absolute right-2 text-xs text-slate-400 pointer-events-none font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-semibold">ราคาที่ลด (บาท - แก้ไขได้)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount || ""}
                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 text-xs text-right pr-6 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-800"
                      />
                      <span className="absolute right-2 text-xs text-slate-400 pointer-events-none">฿</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>ยอดรวมก่อนส่วนลด:</span>
                    <span className="font-mono font-bold">฿{formatCurrency(subtotal)}</span>
                  </div>
                  {effectiveDiscount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>ส่วนลด ({discountPercent}%):</span>
                      <span className="font-mono font-bold">-฿{formatCurrency(effectiveDiscount)}</span>
                    </div>
                  )}
                  {!excludeVat && (
                    <div className="flex justify-between text-blue-700">
                      <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                      <span className="font-mono font-bold">+฿{formatCurrency(vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>ยอดรวมสุทธิ:</span>
                    <span className="font-mono text-amber-700">฿{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Item 3: เงื่อนไขการชำระเงิน (Requirement 4: แก้ไขได้ เบื้องต้นคำนวณ 50% อัตโนมัติ) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    เงื่อนไขการชำระเงิน (Item 3)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {isCustomPaymentTerms ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleFieldChange();
                          setIsCustomPaymentTerms(false);
                          setPaymentTerms(defaultPaymentTermsText);
                        }}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 transition cursor-pointer flex items-center gap-1"
                        title="คลิกเพื่อรีเซ็ตกลับเป็นระบบคำนวณ 50% อัตโนมัติ"
                      >
                        <RefreshCw size={10} /> คืนค่า 50% อัตโนมัติ
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        แบ่ง 2 งวด 50% / 50% (อัตโนมัติ)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <textarea
                    value={paymentTerms || defaultPaymentTermsText}
                    onChange={(e) => {
                      handleFieldChange();
                      setIsCustomPaymentTerms(true);
                      setPaymentTerms(e.target.value);
                    }}
                    rows={4}
                    placeholder="ระบุหรือแก้ไขเงื่อนไขการชำระเงิน..."
                    className="w-full p-2.5 text-xs bg-amber-50/40 border border-amber-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium text-slate-700 leading-relaxed custom-scrollbar resize-y"
                  />
                  <p className="text-[10px] text-slate-400">
                    * สามารถแก้ไขข้อความหรือเงื่อนไขด้านในได้ หรือกดปุ่มคืนค่าเพื่อคำนวณ 50% อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Item 4: ข้อมูลผู้ลงนาม (ModernDatePicker) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ข้อมูลผู้ลงนาม & วันที่ (Item 4)
                </h3>

                {/* 1. ผู้จัดทำเอกสาร */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">1. ผู้จัดทำเอกสาร</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="preparer-sig"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setPreparerSig(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="preparer-sig" 
                      className="text-[10px] text-amber-700 hover:text-amber-800 cursor-pointer font-bold bg-white px-2 py-0.5 rounded border border-amber-200"
                    >
                      {preparerSig ? "✓ มีลายเซ็น" : "อัปโหลดลายเซ็น"}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={preparerName}
                      onChange={(e) => {
                        handleFieldChange();
                        setPreparerName(e.target.value);
                      }}
                      placeholder="ชื่อผู้จัดทำ..."
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <ModernDatePicker
                      value={preparerDate}
                      onChange={(val) => {
                        handleFieldChange();
                        setPreparerDate(val);
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* 2. ผู้เสนอราคา */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">2. ผู้เสนอราคา</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="proposer-sig"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setProposerSig(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="proposer-sig" 
                      className="text-[10px] text-amber-700 hover:text-amber-800 cursor-pointer font-bold bg-white px-2 py-0.5 rounded border border-amber-200"
                    >
                      {proposerSig ? "✓ มีลายเซ็น" : "อัปโหลดลายเซ็น"}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={proposerName}
                      onChange={(e) => {
                        handleFieldChange();
                        setProposerName(e.target.value);
                      }}
                      placeholder="ชื่อผู้เสนอราคา..."
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <ModernDatePicker
                      value={proposerDate}
                      onChange={(val) => {
                        handleFieldChange();
                        setProposerDate(val);
                      }}
                      className="text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={proposerTitle}
                    onChange={(e) => {
                      handleFieldChange();
                      setProposerTitle(e.target.value);
                    }}
                    placeholder="ตำแหน่ง..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

              </div>

            </div>

            {/* Right Live A4 Preview */}
            <div 
              id="step-quotation-preview-wrapper"
              className="flex-1 bg-slate-200/80 p-4 lg:p-8 overflow-y-auto flex justify-center items-start custom-scrollbar"
            >
              <div 
                ref={previewRef}
                id="step-quotation-a4-document"
                className="bg-white text-slate-900 shadow-2xl rounded-none w-[210mm] min-h-[297mm] p-[16mm] flex flex-col justify-between relative box-border text-[13px] leading-normal font-sans"
                style={{
                  fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
              >
                <div>
                  {/* Document Header - Dieter Rams Precision Layout */}
                  <div className="border-b-2 border-[#F59E0B] pb-3 mb-4">
                    <div className="flex items-start justify-between gap-5">
                      
                      {/* Left: Official Identity */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-[180px] h-[56px] relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={STEP_DOCUMENT_LOGO_BASE64} 
                            alt="STeP Logo" 
                            className="w-full h-full object-contain object-left" 
                          />
                        </div>

                        <div className="border-l border-slate-300/80 pl-3.5 text-[11px] text-slate-600 leading-tight flex flex-col justify-center min-h-[56px]">
                          <div className="font-bold text-slate-900 text-[12px] tracking-tight leading-snug">
                            <div>อุทยานวิทยาศาสตร์และเทคโนโลยี</div>
                            <div>มหาวิทยาลัยเชียงใหม่</div>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {providerAddress}
                          </div>
                          <div className="text-[9.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono">
                            <span>เลขประจำตัวผู้เสียภาษี: <strong className="text-slate-700">{providerTaxId}</strong></span>
                            <span>•</span>
                            <span>{providerPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quotation Document Meta Block */}
                      <div className="text-right shrink-0">
                        <div className="inline-block text-right">
                          <h1 className="text-[20px] font-black tracking-tight text-slate-900 leading-none">
                            ใบเสนอราคา
                          </h1>
                          <div className="text-[10px] font-bold text-[#D97706] tracking-[0.2em] uppercase mt-0.5 mb-2">
                            QUOTATION
                          </div>

                          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 text-left text-[11px] space-y-0.5 min-w-[195px] shadow-2xs">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-400 font-medium text-[10px]">เลขที่ / No.:</span>
                              <span className="font-mono font-bold text-slate-900">{docId || "QT-69-1"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-400 font-medium text-[10px]">วันที่ / Date:</span>
                              <span className="font-medium text-slate-800">{formatThaiDate(docDate)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-t border-slate-200/70 pt-0.5">
                              <span className="text-slate-400 font-medium text-[10px]">กำหนดยืนราคา:</span>
                              <span className="text-amber-800 font-bold text-[10px]">30 วัน (Valid 30 Days)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 mb-4 text-[12px]">
                    <div className="font-bold text-slate-800 mb-1">
                      ลูกค้า / Customer: <span className="text-slate-900 font-semibold">{customerName || "..........................................................................."}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">
                      <div>ที่อยู่ / Address: {customerAddress || "-"}</div>
                      <div className="flex items-center gap-4 mt-0.5 text-[10px] text-slate-500">
                        <span>เลขประจำตัวผู้เสียภาษี / Tax ID: {customerTaxId || "-"}</span>
                        <span>โทร / Tel: {customerPhone || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-[12px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-300 text-center font-bold">
                          <th className="py-2 px-2 w-10 text-center border-r border-slate-300">#</th>
                          <th className="py-2 px-3 text-left border-r border-slate-300">รายการ / Description</th>
                          <th className="py-2 px-2 w-16 text-center border-r border-slate-300">จำนวน</th>
                          <th className="py-2 px-3 w-28 text-right border-r border-slate-300">ราคา/หน่วย</th>
                          <th className="py-2 px-3 w-28 text-right">รวมเงิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {items.map((it, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}>
                            <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-200 align-top">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 text-slate-800 border-r border-slate-200 whitespace-pre-line leading-snug">
                              {it.description || "-"}
                            </td>
                            <td className="py-2 px-2 text-center font-mono border-r border-slate-200 align-top">
                              {it.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-mono border-r border-slate-200 align-top">
                              {formatCurrency(it.price)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 align-top">
                              {formatCurrency((it.price || 0) * (it.quantity || 1))}
                            </td>
                          </tr>
                        ))}
                        {/* Minimum empty rows for A4 balance */}
                        {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                          <tr key={`empty-${i}`} className="h-7">
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td className="border-r border-slate-200"></td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotal, Discount, VAT & Thai Text Box */}
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    {/* Thai text translation */}
                    <div className="col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        จำนวนเงินตัวอักษร / Total in Words
                      </span>
                      <div className="text-xs font-bold text-slate-800 italic mt-1">
                        ({numberToThaiText(totalAmount)})
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-200 pt-1">
                        * ราคานี้ยังไม่รวมค่าธรรมเนียมการโอน (ถ้ามี)
                      </div>
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="col-span-5 bg-white border border-slate-300 rounded-lg p-2 text-[12px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>รวมเป็นเงิน:</span>
                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                      </div>
                      {effectiveDiscount > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>ส่วนลด ({discountPercent}%):</span>
                          <span className="font-mono">- {formatCurrency(effectiveDiscount)}</span>
                        </div>
                      )}
                      {!excludeVat && (
                        <div className="flex justify-between text-slate-600">
                          <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                          <span className="font-mono">{formatCurrency(vatAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 border-t-2 border-slate-800 pt-1 text-[13px]">
                        <span>จำนวนเงินรวมทั้งสิ้น:</span>
                        <span className="font-mono text-[#F59E0B]">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Terms & Bank Info (Item 3) */}
                  <div className="grid grid-cols-12 gap-3 mb-4 text-[11px]">
                    <div className="col-span-7 bg-amber-50/50 border border-amber-200 rounded-lg p-2.5">
                      <div className="font-bold text-amber-900 mb-1">
                        เงื่อนไขการชำระเงิน / Payment Terms:
                      </div>
                      <div className="text-slate-700 text-[11px] leading-relaxed whitespace-pre-line">
                        {paymentTerms || defaultPaymentTermsText}
                      </div>
                    </div>

                    <div className="col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <div className="font-bold text-slate-800 mb-1">
                        บัญชีสำหรับการชำระเงิน / Bank Account:
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5 leading-tight">
                        <div>ธนาคาร: <strong>ธนาคารกรุงไทย</strong></div>
                        <div>เลขที่บัญชี: <strong className="font-mono text-slate-900">456-0-14259-9</strong></div>
                        <div className="truncate">ชื่อบัญชี: อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2 Signature Columns */}
                <div>
                  <div className="grid grid-cols-2 gap-8 max-w-[540px] mx-auto border-t border-slate-200 pt-3 text-[11px] text-center">
                    
                    {/* 1. Preparer */}
                    <div className="flex flex-col items-center justify-between h-[105px]">
                      <div className="text-slate-500 font-medium">ผู้จัดทำเอกสาร</div>
                      <div className="w-full flex items-center justify-center h-10">
                        {preparerSig ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preparerSig} alt="Sig" className="max-h-10 object-contain" />
                        ) : (
                          <div className="w-36 border-b border-dotted border-slate-400"></div>
                        )}
                      </div>
                      <div className="text-slate-800 font-medium">({preparerName || "................................................"})</div>
                      <div className="text-slate-500 text-[10px]">วันที่: {formatThaiDate(preparerDate)}</div>
                    </div>

                    {/* 2. Proposer */}
                    <div className="flex flex-col items-center justify-between h-[105px]">
                      <div className="text-slate-500 font-medium">ผู้เสนอราคา</div>
                      <div className="w-full flex items-center justify-center h-10">
                        {proposerSig ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={proposerSig} alt="Sig" className="max-h-10 object-contain" />
                        ) : (
                          <div className="w-36 border-b border-dotted border-slate-400"></div>
                        )}
                      </div>
                      <div className="text-slate-800 font-medium">({proposerName || "................................................"})</div>
                      <div className="text-[10px] text-slate-600">{proposerTitle}</div>
                      <div className="text-slate-500 text-[10px]">วันที่: {formatThaiDate(proposerDate)}</div>
                    </div>

                  </div>

                  {/* Document Control Footer */}
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                    <span>FM-CC-005 V.03 วันที่บังคับใช้เอกสาร 1 ต.ค. 2569 (อายุจัดเก็บเอกสาร: 2ปี)</span>
                    <span>STeP CMU Quotation System</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Tab 2: ประวัติการออกใบเสนอ (History) */}
        {activeTab === "history" && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="ค้นหาเลขที่เอกสาร หรือ ชื่อลูกค้า..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  ทั้งหมด <strong>{historyList.length}</strong> ฉบับ
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // Start brand new quotation
                    const currentFiscal = getThaiFiscalYearShort(new Date().toISOString().split("T")[0]);
                    const pattern = new RegExp(`^QT-${currentFiscal}-(\\d+)$`, "i");
                    let maxSeq = 0;
                    historyList.forEach(item => {
                      const match = item.docId?.match(pattern);
                      if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num) && num > maxSeq) maxSeq = num;
                      }
                    });
                    setDocId(`QT-${currentFiscal}-${maxSeq + 1}`);
                    setCustomerName("");
                    setCustomerAddress("");
                    setCustomerTaxId("");
                    setCustomerPhone("");
                    setItems([{ description: "", quantity: 1, price: 0 }]);
                    setDiscountPercent(0);
                    setDiscountAmount(0);
                    setIsSaved(false);
                    setActiveTab("editor");
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> ออกใบเสนอราคาฉบับใหม่
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">เลขที่เอกสาร</th>
                    <th className="py-3 px-4">วันที่ออกเอกสาร</th>
                    <th className="py-3 px-4">ลูกค้า / บริษัท</th>
                    <th className="py-3 px-4 text-center">จำนวนรายการ</th>
                    <th className="py-3 px-4 text-right">ยอดรวมสุทธิ</th>
                    <th className="py-3 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyList
                    .filter(h => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        h.docId?.toLowerCase().includes(q) ||
                        h.customerName?.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => {
                      const calcTot = (item.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0) - (Number(item.discountAmount) || 0);
                      const finalTot = item.excludeVat ? calcTot : calcTot * 1.07;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-700">
                            {item.docId}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {item.docDate || "-"}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {item.customerName || "-"}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {item.items?.length || 0} รายการ
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ฿{formatCurrency(finalTot)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleHistoryEdit(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="แก้ไขใบเสนอราคานี้"
                              >
                                <Edit3 size={15} />
                              </button>
                              
                              {/* Copy */}
                              <button
                                type="button"
                                onClick={() => handleHistoryCopy(item)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="คัดลอก (Copy) และสร้างรหัสใหม่อัตโนมัติ"
                              >
                                <Copy size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleHistoryDelete(item.docId)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="ลบออกจากประวัติ"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {historyList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <History size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">ยังไม่มีประวัติการออกใบเสนอราคา</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          เมื่อกดบันทึกข้อมูลในหน้าออกใบเสนอราคา ข้อมูลจะถูกบันทึกไว้ที่นี่อัตโนมัติ
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: คำนวณราคา (Price Calculator based on Google Sheet) */}
        {activeTab === "calculator" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter, Category Bar & Add Custom Job */}
            <div className="bg-white p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCalcCategory("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    calcCategory === "ALL"
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ทั้งหมด ({CALCULATOR_ITEMS.length + customJobs.length})
                </button>
                {CALCULATOR_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCalcCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      calcCategory === cat.id
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {customJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCalcCategory("CUSTOM")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      calcCategory === "CUSTOM"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    งานที่เพิ่มเอง ({customJobs.length})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="เพิ่มงานอื่นที่ยากต่างกันหรือไม่ได้อยู่ในระบบ"
                >
                  <Plus size={13} className="stroke-[2.5]" />
                  <span>+ เพิ่มงานอื่น / กำหนดเอง</span>
                </button>

                <div className="relative w-full sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={calcSearch}
                    onChange={(e) => setCalcSearch(e.target.value)}
                    placeholder="ค้นหารายการคำนวณ..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Job Adder Modal */}
            {showAddCustomModal && (
              <div className="fixed inset-0 z-[260] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-purple-600" />
                      <span>เพิ่มงานบริการอื่น / กำหนดเอง</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                        ชื่องานบริการ *
                      </label>
                      <input
                        type="text"
                        value={newCustomName}
                        onChange={(e) => setNewCustomName(e.target.value)}
                        placeholder="เช่น ออกแบบ Packaging ลายใหม่, จัดเล่มคู่มือ 50 หน้า..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                          ประเภทงานฐานราคา
                        </label>
                        <select
                          value={newCustomType}
                          onChange={(e) => setNewCustomType(e.target.value as "main" | "topup")}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                        >
                          <option value="main">งานหลัก (ฐาน 900฿)</option>
                          <option value="topup">Top-up (ฐาน 450฿)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                          ค่าความยากเริ่มต้น (Difficulty)
                        </label>
                        <input
                          type="number"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={newCustomDifficulty}
                          onChange={(e) => setNewCustomDifficulty(parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 font-mono font-bold text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                        ขอบเขตงาน / รายละเอียด (Scope)
                      </label>
                      <textarea
                        value={newCustomScope}
                        onChange={(e) => setNewCustomScope(e.target.value)}
                        rows={2}
                        placeholder="ระบุรายละเอียดงานหรือข้อตกลง..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 font-medium resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomModal(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCustomJob}
                      className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition"
                    >
                      เพิ่มเข้าสู่รายการคำนวณ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calculator Items Grid & Selector */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[...CALCULATOR_ITEMS, ...customJobs]
                  .filter(it => {
                    if (calcCategory !== "ALL" && it.category !== calcCategory) return false;
                    if (calcSearch.trim()) {
                      const q = calcSearch.toLowerCase();
                      return (
                        it.name.toLowerCase().includes(q) ||
                        it.scope.toLowerCase().includes(q) ||
                        (it.categoryName && it.categoryName.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  })
                  .map(item => {
                    const matchingEntries = calcEntries.filter(e => e.itemId === item.id);
                    const isSelected = matchingEntries.length > 0;
                    const baseRate = item.type === "main" ? 900 : 450;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          isSelected
                            ? "bg-amber-50/70 border-amber-400 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.type === "main"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-purple-100 text-purple-800 border border-purple-200"
                              }`}>
                                {item.type === "main" ? "งานหลัก (ฐาน 900฿)" : "Top-up (ฐาน 450฿)"}
                              </span>
                              {matchingEntries.length > 0 && (
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full font-mono">
                                  เลือก {matchingEntries.length} รายการ
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </h4>
                          </div>

                          {/* Requirement 1: Red X button when selected, Plus button to add more/variations */}
                          {isSelected ? (
                            <div className="flex items-center gap-1 shrink-0">
                              {/* + Button to add another instance of this job with different difficulty */}
                              <button
                                type="button"
                                onClick={() => handleAddMoreCalcEntry(item)}
                                className="p-1 px-2.5 rounded-xl text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition cursor-pointer flex items-center gap-0.5"
                                title="เพิ่มงานนี้อีกรายการ (ความยากต่างกันได้)"
                              >
                                <Plus size={13} className="stroke-[2.5]" />
                                <span>เพิ่มงาน</span>
                              </button>

                              {/* Red Cross (X) Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAllItemEntries(item.id)}
                                className="p-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition cursor-pointer flex items-center justify-center"
                                title="ลบ / ยกเลิกรายการนี้ทั้งหมด"
                              >
                                <X size={14} className="stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddFirstCalcEntry(item)}
                              className="p-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer shrink-0"
                              title="เลือกคำนวณรายการนี้"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {item.scope}
                        </p>

                        {/* Controls if selected: render each entry */}
                        {isSelected ? (
                          <div className="pt-2 border-t border-amber-200 space-y-3">
                            {matchingEntries.map((entry, entryIdx) => {
                              const standardPrice = baseRate * entry.difficulty;
                              const computedPrice = entry.customPrice !== undefined 
                                ? entry.customPrice 
                                : Math.round(standardPrice * entry.multiplier);

                              return (
                                <div 
                                  key={entry.uid} 
                                  className={`space-y-2 ${
                                    matchingEntries.length > 1 
                                      ? "p-2.5 bg-white/95 rounded-xl border border-amber-300/80 shadow-2xs" 
                                      : ""
                                  }`}
                                >
                                  {/* Sub-header if multiple instances of same job */}
                                  {matchingEntries.length > 1 && (
                                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-amber-200/70 pb-1">
                                      <span>งานชิ้นที่ {entryIdx + 1} (ความยาก {entry.difficulty})</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCalcEntry(entry.uid)}
                                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                        title="ลบเฉพาะรายการนี้"
                                      >
                                        <X size={13} className="stroke-[2.5]" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Formula indicator: 900฿ (or 450฿) x difficulty */}
                                  <div className="bg-white/90 rounded-xl p-2 border border-amber-200/90 text-[11px] space-y-0.5">
                                    <div className="flex items-center justify-between text-slate-600">
                                      <span>ราคามาตรฐาน:</span>
                                      <span className="font-mono font-semibold text-slate-800">
                                        {baseRate}฿ × {entry.difficulty} = ฿{formatCurrency(standardPrice)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {/* Difficulty control */}
                                    <div>
                                      <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">
                                        ค่าความยาก (Difficulty)
                                      </label>
                                      <input
                                        type="number"
                                        min={0.5}
                                        max={20}
                                        step={0.5}
                                        value={entry.difficulty}
                                        onChange={(e) => handleUpdateEntryDifficulty(entry.uid, parseFloat(e.target.value) || 1)}
                                        className="w-full px-2 py-1 text-xs text-center bg-white border border-amber-300 rounded-lg focus:outline-none font-mono font-bold"
                                      />
                                    </div>

                                    {/* Multiplier control (0.5 - 10 เท่า) */}
                                    <div>
                                      <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">
                                        จำนวนเท่า (0.5 - 10 เท่า)
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min={0.5}
                                          max={10}
                                          step={0.1}
                                          value={entry.multiplier}
                                          onChange={(e) => handleUpdateEntryMultiplier(entry.uid, parseFloat(e.target.value) || 1)}
                                          className="w-full px-2 py-1 text-xs text-center bg-white border border-amber-300 rounded-lg focus:outline-none font-mono font-bold text-amber-900"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold shrink-0">เท่า</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {/* Quantity */}
                                    <div>
                                      <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">
                                        จำนวน {item.unit ? `(${item.unit})` : 'ชิ้น'}
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={entry.quantity}
                                        onChange={(e) => handleUpdateEntryQty(entry.uid, parseInt(e.target.value) || 1)}
                                        className="w-full px-2 py-1 text-xs text-center bg-white border border-amber-300 rounded-lg focus:outline-none font-mono font-bold"
                                      />
                                    </div>

                                    {/* Calculated Unit Price with manual override */}
                                    <div>
                                      <label className="text-[10px] text-slate-600 block mb-0.5 font-semibold">
                                        ราคาต่อหน่วย (฿)
                                      </label>
                                      <input
                                        type="number"
                                        value={computedPrice}
                                        onChange={(e) => {
                                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                          handleUpdateEntryCustomPrice(entry.uid, isNaN(val as number) ? undefined : val);
                                        }}
                                        placeholder="คำนวณอัตโนมัติ"
                                        className="w-full px-2 py-1 text-xs text-right bg-white border border-amber-300 rounded-lg focus:outline-none font-mono font-bold text-slate-900"
                                      />
                                    </div>
                                  </div>

                                  {/* Line total summary */}
                                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200/80">
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      ฿{formatCurrency(computedPrice)} × {entry.quantity}
                                    </span>
                                    <span className="font-mono font-bold text-amber-800 text-sm">
                                      ฿{formatCurrency(computedPrice * entry.quantity)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span className="text-[10px] text-slate-400">
                              ราคามาตรฐาน ({baseRate}฿ × {item.difficulty})
                            </span>
                            <span className="font-mono font-bold text-slate-700">
                              ฿{formatCurrency(item.basePrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Calculator Bottom Summary & Import Button */}
            <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">งานหลัก:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ฿{formatCurrency(calcTotals.mainTotal)}
                  </span>
                </div>
                <span className="text-slate-300 font-light text-lg">|</span>
                <div>
                  <span className="text-[11px] text-slate-400 block">งาน Top-up:</span>
                  <span className="font-mono font-bold text-purple-700 text-sm">
                    ฿{formatCurrency(calcTotals.topupTotal)}
                  </span>
                </div>
                <span className="text-slate-300 font-light text-lg">|</span>
                <div>
                  <span className="text-[11px] text-amber-700 block font-bold">ราคารวมทั้งหมด:</span>
                  <span className="font-mono font-bold text-amber-800 text-base">
                    ฿{formatCurrency(calcTotals.grandTotal)}
                  </span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full ml-1 font-mono">
                  {calcEntries.length} รายการที่เลือก
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalcEntries([])}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ล้างรายการที่เลือก
                </button>
                <button
                  type="button"
                  onClick={handleApplyCalculatorToQuotation}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>นำเข้าสู่ใบเสนอราคา (Apply to Quotation)</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
