"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Users, Sparkles, Newspaper, ShieldCheck, 
  ArrowLeft, Download, Calendar, Search, Filter, CheckCircle2, 
  Clock, ExternalLink, Plus, AlertCircle, 
  ChevronRight, Award, FolderOpen, Eye, BarChart3, TrendingUp, Layers,
  HeartHandshake, BrainCircuit, CalendarDays, Link2, Activity, GraduationCap
} from "lucide-react";

import MeetingReportDetail from "./MeetingReportDetail";
import InnovationDesignCenterReport from "./InnovationDesignCenterReport";
import RspPressReport from "./RspPressReport";
import IsoReportDetail from "./IsoReportDetail";
import StakeholdersReportDetail from "./StakeholdersReportDetail";
import KmReportDetail from "./KmReportDetail";
import TeamActionPlanReportDetail from "./TeamActionPlanReportDetail";
import WorkLinksReportDetail from "./WorkLinksReportDetail";
import ActivityLogReportDetail from "./ActivityLogReportDetail";
import TrainingReportDetail from "./TrainingReportDetail";
import ExportDataDropdown from "./ExportDataDropdown";

type ReportType =
  | "meeting"
  | "design-center"
  | "rsp-press"
  | "iso"
  | "stakeholders"
  | "km"
  | "action-plan"
  | "work-links"
  | "activity"
  | "training"
  | null;

interface DataReportsViewProps {
  onSubReportChange?: (subReportId: ReportType) => void;
}

export default function DataReportsView({ onSubReportChange }: DataReportsViewProps = {}) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [idcActiveTab, setIdcActiveTab] = useState<"form" | "records" | "dashboard" | "pm-design">("records");
  const [idcExportPdfTrigger, setIdcExportPdfTrigger] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rep = params.get("report") as ReportType;
      if (rep === "stakeholders") {
        setSelectedReport("iso");
        const url = new URL(window.location.href);
        url.searchParams.set("report", "iso");
        url.searchParams.set("tab", "stakeholders");
        window.history.replaceState({}, "", url.toString());
        onSubReportChange?.("iso");
        return;
      }
      const validReports: ReportType[] = [
        "meeting", "design-center", "rsp-press", "iso", 
        "km", "action-plan", "work-links", "activity", "training"
      ];
      if (rep && validReports.includes(rep)) {
        setSelectedReport(rep);
        onSubReportChange?.(rep);
      }
    }
  }, [onSubReportChange]);

  const handleSelectReport = (rId: ReportType) => {
    setSelectedReport(rId);
    if (rId === "design-center") {
      setIdcActiveTab("records");
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (rId) {
        url.searchParams.set("report", rId);
      } else {
        url.searchParams.delete("report");
        url.searchParams.delete("tab");
        url.searchParams.delete("wi");
        url.searchParams.delete("dimension");
        url.searchParams.delete("section");
      }
      window.history.pushState({}, "", url.toString());
    }
    onSubReportChange?.(rId);
  };

  const reports = [
    {
      id: "meeting" as const,
      title: "Meeting Report",
      icon: Users,
      delay: "0ms",
      lines: [
        "บันทึกการประชุมทีม CC",
        "สรุปมติที่ประชุมและข้อสั่งการ",
        "พร้อมติดตามผลการดำเนินงาน"
      ]
    },
    {
      id: "design-center" as const,
      title: "Innovation Design Center Report",
      icon: Sparkles,
      delay: "80ms",
      lines: [
        "รายงานสถิติงานออกแบบ",
        "ผลงานนวัตกรรมต้นแบบ",
        "และสถิติการใช้งานห้องแล็บ"
      ]
    },
    {
      id: "rsp-press" as const,
      title: "RSP Press Report",
      icon: Newspaper,
      delay: "160ms",
      lines: [
        "ข่าวประชาสัมพันธ์เครือข่าย",
        "สรุปยอดเผยแพร่ผ่านสื่อมวลชน",
        "และผลสัมฤทธิ์การสื่อสาร"
      ]
    },
    {
      id: "iso" as const,
      title: "ISO Report",
      icon: ShieldCheck,
      delay: "240ms",
      lines: [
        "เอกสารระบบคุณภาพ ISO",
        "ขั้นตอนการปฏิบัติงาน (WI)",
        "และการตรวจประเมินความเสี่ยง"
      ]
    },
    {
      id: "km" as const,
      title: "KM คลังความรู้",
      icon: BrainCircuit,
      delay: "320ms",
      lines: [
        "คลังความรู้และนวัตกรรม",
        "AI Weekly Creative Trends",
        "บทความและไฟล์แบ่งปันในทีม"
      ]
    },
    {
      id: "action-plan" as const,
      title: "แผนดำเนินงานของทีม",
      icon: CalendarDays,
      delay: "400ms",
      lines: [
        "แผนการดำเนินงานประจำปี",
        "ติดตาม Timeline และผู้รับผิดชอบ",
        "แก้ไขและอัปเดตได้ทุกรายการ"
      ]
    },
    {
      id: "work-links" as const,
      title: "ลิ้งค์อื่นๆ ที่เกี่ยวข้อง",
      icon: Link2,
      delay: "480ms",
      lines: [
        "รวมลิงก์เครื่องมือและไฟล์ทำงาน",
        "คลาวด์ไดรฟ์และแบบฟอร์มทางการ",
        "แก้ไขและเพิ่มลิงก์ได้ตลอดเวลา"
      ]
    },
    {
      id: "activity" as const,
      title: "Activity Log",
      icon: Activity,
      delay: "560ms",
      lines: [
        "บันทึกกิจกรรมและความแอคทีฟ",
        "ตรวจสอบการมีส่วนร่วมในระบบ",
        "แจ้งเตือนงานค้างและประวัติงาน"
      ]
    }
  ];

  // If no report selected, render the 8 Dieter Rams circular buttons (4x2 Grid)
  if (!selectedReport) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center py-6 sm:py-10 animate-premium-fade relative">


        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 max-w-2xl px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
            Back of House
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 font-light">
            ระบบสนับสนุนการทำงานเบื้องหลัง รายงานสถิติ การจัดการความรู้ แผนงาน และเอกสารมาตรฐานทีม CC
          </p>
        </div>

        {/* 8 Rams Circular Buttons Grid (4 Columns on Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-8 md:gap-10 w-full max-w-6xl px-1 sm:px-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div 
                key={report.id} 
                className="flex flex-col items-center text-center animate-premium-fade" 
                style={{ animationDelay: report.delay }}
              >
                <button
                  type="button"
                  onClick={() => handleSelectReport(report.id)}
                  className="flex flex-col items-center group cursor-pointer w-full focus:outline-none transition-all"
                >
                  {/* Dieter Rams Skeuomorphic Circular Button */}
                  <div className="w-24 h-24 sm:w-32 md:w-36 sm:h-32 md:h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-2 sm:mb-4 group-hover:scale-105 group-active:scale-95 shadow-md group-hover:shadow-xl relative">
                    <Icon 
                      size={34} 
                      className="text-slate-800 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300 sm:w-10 sm:h-10" 
                      strokeWidth={1.5} 
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 text-foreground tracking-wide group-hover:text-primary transition-colors line-clamp-2 px-1">
                    {report.title}
                  </h3>

                  {/* 3-line Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed font-light px-1 max-w-[230px] group-hover:text-foreground/90 transition-colors">
                    {report.lines[0]}<br/>
                    {report.lines[1]}<br/>
                    {report.lines[2]}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Sub-report detail view when one of the 10 buttons is clicked
  const currentReport = reports.find((r) => r.id === selectedReport);

  return (
    <div className="w-full flex-1 flex flex-col space-y-5 animate-premium-fade">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 pt-1 mt-1 border-b border-slate-200 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
          <button
            onClick={() => handleSelectReport(null)}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-surface border border-surface-border shadow-sm rounded-full text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:border-primary/30 hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden sm:inline">Back to Back of House</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <span className="text-slate-300 font-light text-sm sm:text-lg">/</span>

          <div className="flex items-center gap-2">
            {currentReport && <currentReport.icon size={20} className="text-[#f97316] shrink-0" strokeWidth={2.2} />}
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {currentReport?.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportDataDropdown
            reportId={selectedReport}
            reportTitle={currentReport?.title}
            onExportCustom={selectedReport === "design-center" ? (format) => {
              if (format === "pdf") {
                setIdcExportPdfTrigger(t => t + 1);
              } else {
                window.dispatchEvent(new CustomEvent("export-idc-csv"));
              }
            } : undefined}
          />
        </div>
      </div>

      {/* Detail Content per Report */}
      {selectedReport === "meeting" && <MeetingReportDetail />}
      {selectedReport === "design-center" && (
        <InnovationDesignCenterReport
          activeTab={idcActiveTab}
          onTabChange={setIdcActiveTab}
          exportPdfTrigger={idcExportPdfTrigger}
        />
      )}
      {selectedReport === "rsp-press" && <RspPressReport />}
      {selectedReport === "iso" && <IsoReportDetail />}
      {selectedReport === "stakeholders" && <StakeholdersReportDetail />}
      {selectedReport === "km" && <KmReportDetail />}
      {selectedReport === "action-plan" && <TeamActionPlanReportDetail />}
      {selectedReport === "work-links" && <WorkLinksReportDetail />}
      {selectedReport === "activity" && <ActivityLogReportDetail />}
      {selectedReport === "training" && <TrainingReportDetail />}
    </div>
  );
}



// 2. Innovation Design Center Report Component
function DesignCenterReportDetail() {
  const designServices = [
    { name: "Key Visual (KV) & Branding", count: 48, revenue: "฿240,000", share: "34%" },
    { name: "Book Layout & Publications", count: 26, revenue: "฿130,000", share: "22%" },
    { name: "Packaging & Structure Design", count: 18, revenue: "฿90,000", share: "16%" },
    { name: "Exhibition & Backdrop", count: 24, revenue: "฿120,000", share: "18%" },
    { name: "3D Render Visualization", count: 12, revenue: "฿60,000", share: "10%" },
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ชิ้นงานออกแบบรวม</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">128 ชิ้นงาน</h4>
          <span className="text-[10.5px] text-purple-600 font-medium">+18.5% จากปีก่อน</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">มูลค่าประเมิน Save Cost</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">฿640,000</h4>
          <span className="text-[10.5px] text-slate-500">ประหยัดงบประมาณองค์กร</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">คะแนนความพึงพอใจการออกแบบ</p>
          <h4 className="text-2xl font-black text-amber-500 mt-1">4.92 / 5.0</h4>
          <span className="text-[10.5px] text-slate-500">จาก 68 ผู้ประเมิน (PM)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ส่งมอบงานตรงเวลา</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">98.4%</h4>
          <span className="text-[10.5px] text-emerald-600 font-medium">On-time Delivery</span>
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3.5 flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span>สัดส่วนการให้บริการศูนย์ออกแบบนวัตกรรม (Innovation Design Center Services)</span>
        </h4>
        <div className="space-y-3">
          {designServices.map((s, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{s.name}</span>
                <div className="flex items-center gap-4 text-slate-600">
                  <span>{s.count} ชิ้น</span>
                  <span className="font-mono font-bold text-slate-900">{s.revenue}</span>
                  <span className="w-10 text-right text-purple-600 font-bold">{s.share}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: s.share }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



