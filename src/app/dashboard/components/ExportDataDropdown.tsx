"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, Sparkles, Check } from "lucide-react";
import { executeReportExport } from "@/utils/universalExport";

export interface ExportDataDropdownProps {
  reportId?: string | null;
  reportTitle?: string;
  onExportCustom?: (format: "pdf" | "csv") => void;
  align?: "left" | "right";
  className?: string;
  buttonText?: string;
}

export default function ExportDataDropdown({
  reportId = null,
  reportTitle,
  onExportCustom,
  align = "right",
  className = "",
  buttonText = "Export Data"
}: ExportDataDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "csv" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click & escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectFormat = (format: "pdf" | "csv") => {
    setExportingFormat(format);
    setIsOpen(false);

    try {
      if (onExportCustom) {
        onExportCustom(format);
      } else {
        executeReportExport(reportId, format);
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setTimeout(() => setExportingFormat(null), 1200);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Pill Button matching Dieter Rams minimal design */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer hover:bg-slate-50 active:scale-95"
        title="เลือกส่งออกข้อมูลเป็น PDF หรือ CSV (Excel)"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={14} className="text-slate-600 shrink-0" />
        <span>{buttonText}</span>
        <ChevronDown
          size={12}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dieter Rams Minimalist Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Export Format • เลือกรูปแบบ
            </span>
            {reportTitle && (
              <span className="text-[10.5px] font-semibold text-slate-600 truncate max-w-[140px]" title={reportTitle}>
                {reportTitle}
              </span>
            )}
          </div>

          {/* Options List */}
          <div className="p-1.5 space-y-1">
            {/* Option 1: PDF Document */}
            <button
              type="button"
              onClick={() => handleSelectFormat("pdf")}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                    ส่งออกเป็นไฟล์ PDF (.pdf)
                  </span>
                  <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70">
                    A4 Print
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  เอกสารมาตรฐาน A4 จัดหน้าเรียบร้อย ไม่มีช่องว่างส่วนเกิน เหมาะสำหรับพิมพ์หรือแนบรายงาน
                </p>
              </div>
            </button>

            {/* Option 2: CSV Spreadsheet */}
            <button
              type="button"
              onClick={() => handleSelectFormat("csv")}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                    ส่งออกเป็นไฟล์ CSV (.csv)
                  </span>
                  <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    Excel Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  สเปรดชีตตารางข้อมูล UTF-8 รองรับภาษาไทยสมบูรณ์ เปิดใน Microsoft Excel &amp; Google Sheets ได้ทันที
                </p>
              </div>
            </button>
          </div>

          {/* Minimal Dieter Rams footer note */}
          <div className="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              <span>Dieter Rams Minimalist Standard</span>
            </span>
            <span>UTF-8 &amp; Print Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
