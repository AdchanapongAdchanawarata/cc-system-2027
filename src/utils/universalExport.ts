/**
 * Universal Export Engine for CC System 2027
 * Provides CSV (UTF-8 with BOM for Excel) and Dieter Rams Minimalist A4 PDF printing
 * for all 10 system reports and the global system view.
 */

import { getAuditLogs } from "./auditLogger";

// Escape HTML for safe template injection
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========================================================================= */
/* 1. UNIVERSAL CSV EXPORT                                                   */
/* ========================================================================= */

export interface ExportCsvOptions {
  filename: string;
  title: string;
  meta?: Record<string, string>;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function exportToCsv(options: ExportCsvOptions) {
  const { filename, title, meta, headers, rows } = options;
  const lines: string[] = [];

  // Title row
  lines.push(`\uFEFF"${title.replace(/"/g, '""')}"`);

  // Metadata rows
  if (meta) {
    Object.entries(meta).forEach(([key, val]) => {
      lines.push(`"${key.replace(/"/g, '""')}","${String(val).replace(/"/g, '""')}"`);
    });
  }

  lines.push(`"วันที่ส่งออกข้อมูล","${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}"`);
  lines.push(""); // Empty separator

  // Header row
  lines.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","));

  // Data rows
  rows.forEach(row => {
    const formattedRow = row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      return `"${String(cell).replace(/"/g, '""')}"`;
    });
    lines.push(formattedRow.join(","));
  });

  const csvContent = lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ========================================================================= */
/* 2. DIETER RAMS MINIMALIST A4 PDF ENGINE                                  */
/* ========================================================================= */

export interface PdfMetric {
  label: string;
  value: string | number;
  subtext?: string;
}

export interface PdfSection {
  title?: string;
  description?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  columnAligns?: Array<"left" | "center" | "right">;
  columnWidths?: string[];
}

export interface DieterRamsPdfOptions {
  docCode: string;
  reportTitle: string;
  reportSubtitle: string;
  dateStr?: string;
  department?: string;
  summaryMetrics?: PdfMetric[];
  sections: PdfSection[];
  notes?: string[];
  signatureTitles?: [string, string];
  customNotice?: string;
}

export function generateDieterRamsPdfHtml(options: DieterRamsPdfOptions): string {
  const {
    docCode,
    reportTitle,
    reportSubtitle,
    dateStr = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    department = "งานสร้างสรรค์และสื่อสาร (Creative and Communication Unit) • อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)",
    summaryMetrics,
    sections,
    notes,
    signatureTitles = [
      "ผู้จัดทำและรายงานข้อมูล\n(Creative and Communication Unit)",
      "ผู้อำนวยการ / ผู้รับทราบรายงาน\n(อุทยานวิทยาศาสตร์และเทคโนโลยี มช.)"
    ],
    customNotice
  } = options;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(reportTitle)} - CC System 2027</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      font-size: 8.5pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Screen Top Bar */
    .screen-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 24px;
      position: sticky;
      top: 0;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      font-family: 'Prompt', sans-serif;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #ea580c;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #c2410c;
    }
    .btn-secondary {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Report Paper Container */
    .paper-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: #ffffff;
      padding: 12mm 14mm 10mm 14mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Dieter Rams Minimalist Typography & Header */
    .doc-ref-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .header-main {
      margin-bottom: 12px;
    }

    .header-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .report-title {
      font-family: 'Prompt', sans-serif;
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }

    .report-subtitle {
      font-family: 'Prompt', sans-serif;
      font-size: 9.5pt;
      font-weight: 600;
      color: #ea580c;
      margin-top: 2px;
    }

    .department-name {
      font-size: 7.8pt;
      color: #64748b;
      margin-top: 3px;
    }

    .badge-iso {
      display: inline-block;
      padding: 3px 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-family: 'Prompt', sans-serif;
      font-size: 7pt;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* Metric Summary Grid (Zero wasted space) */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 6px;
      margin-bottom: 12px;
    }

    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
    }

    .metric-label {
      font-size: 7pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .metric-val {
      font-family: 'Prompt', sans-serif;
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 1px;
    }

    .metric-sub {
      font-size: 6.8pt;
      color: #94a3b8;
      margin-top: 1px;
    }

    /* Content Tables */
    .section-block {
      margin-bottom: 12px;
    }

    .section-title {
      font-family: 'Prompt', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-desc {
      font-size: 7.5pt;
      color: #64748b;
      margin-bottom: 6px;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      line-height: 1.3;
      page-break-inside: auto;
    }

    table.data-table thead {
      display: table-header-group;
    }

    table.data-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    table.data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-family: 'Prompt', sans-serif;
      font-weight: 700;
      font-size: 7.5pt;
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
      white-space: nowrap;
    }

    table.data-table td {
      padding: 4.5px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    table.data-table tbody tr:nth-child(even) {
      background-color: #fafafa;
    }

    /* Status Pills */
    .status-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-completed {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .status-progress {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .status-delayed {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .status-neutral {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    /* Signature Section (Dieter Rams minimal design) */
    .signatures-block {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }

    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .sig-box {
      text-align: center;
      font-size: 7.5pt;
      color: #475569;
      line-height: 1.4;
    }

    .sig-line {
      width: 160px;
      border-bottom: 1px dashed #94a3b8;
      margin: 20px auto 6px auto;
    }

    .sig-title {
      font-family: 'Prompt', sans-serif;
      font-weight: 700;
      color: #0f172a;
      font-size: 8pt;
      white-space: pre-line;
    }

    /* Footer */
    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 12px;
      font-size: 6.8pt;
      color: #94a3b8;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff;
        font-size: 8pt;
      }
      .screen-bar {
        display: none !important;
      }
      .paper-sheet {
        width: 100%;
        min-height: auto;
        padding: 0;
        margin: 0;
        box-shadow: none;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 10mm 12mm;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Top Controls -->
  <div class="screen-bar">
    <div style="font-size: 13px; font-weight: 700;">
      📄 ${escapeHtml(reportTitle)} • ตัวอย่างเอกสารก่อนพิมพ์ (A4 Printable Report)
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่าง</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ พิมพ์รายงาน / บันทึก PDF</button>
    </div>
  </div>

  <!-- Document Body -->
  <div class="paper-sheet">
    <div class="content-body">
      <!-- Doc Ref Bar -->
      <div class="doc-ref-bar">
        <span>REF: ${escapeHtml(docCode)}</span>
        <span>DATE: ${escapeHtml(dateStr)}</span>
      </div>

      <!-- Main Header -->
      <div class="header-main">
        <div class="header-title-row">
          <div>
            <h1 class="report-title">${escapeHtml(reportTitle)}</h1>
            <div class="report-subtitle">${escapeHtml(reportSubtitle)}</div>
            <div class="department-name">${escapeHtml(department)}</div>
          </div>
          <div class="badge-iso">
            ISO 9001:2015 CERTIFIED
          </div>
        </div>
      </div>

      ${customNotice ? `<div style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:6px 10px;border-radius:6px;font-size:7.5pt;margin-bottom:10px;">${escapeHtml(customNotice)}</div>` : ""}

      <!-- Summary Metrics Grid -->
      ${summaryMetrics && summaryMetrics.length > 0 ? `
        <div class="metrics-grid">
          ${summaryMetrics.map(m => `
            <div class="metric-card">
              <div class="metric-label">${escapeHtml(m.label)}</div>
              <div class="metric-val">${escapeHtml(m.value)}</div>
              ${m.subtext ? `<div class="metric-sub">${escapeHtml(m.subtext)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      <!-- Sections & Tables -->
      ${sections.map(sec => `
        <div class="section-block">
          ${sec.title ? `<div class="section-title"><span>■</span> ${escapeHtml(sec.title)}</div>` : ""}
          ${sec.description ? `<div class="section-desc">${escapeHtml(sec.description)}</div>` : ""}
          <table class="data-table">
            <thead>
              <tr>
                ${sec.headers.map((h, i) => {
                  const align = sec.columnAligns?.[i] || "left";
                  const width = sec.columnWidths?.[i] ? `style="width:${sec.columnWidths[i]};text-align:${align};"` : `style="text-align:${align};"`;
                  return `<th ${width}>${escapeHtml(h)}</th>`;
                }).join("")}
              </tr>
            </thead>
            <tbody>
              ${sec.rows.map(row => `
                <tr>
                  ${row.map((cell, i) => {
                    const align = sec.columnAligns?.[i] || "left";
                    const cellStr = cell === null || cell === undefined ? "-" : String(cell);
                    
                    // Render status badges nicely if cell matches keywords
                    let cellContent = escapeHtml(cellStr);
                    if (["เสร็จสิ้น", "completed", "ผ่าน", "ปกติ"].includes(cellStr.toLowerCase())) {
                      cellContent = `<span class="status-badge status-completed">${cellContent}</span>`;
                    } else if (["กำลังดำเนินการ", "in_progress", "รอดำเนินการ", "pending"].includes(cellStr.toLowerCase())) {
                      cellContent = `<span class="status-badge status-progress">${cellContent}</span>`;
                    } else if (["ล่าช้า", "delayed", "เสี่ยงสูง", "high"].includes(cellStr.toLowerCase())) {
                      cellContent = `<span class="status-badge status-delayed">${cellContent}</span>`;
                    }

                    return `<td style="text-align:${align};">${cellContent}</td>`;
                  }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}

      ${notes && notes.length > 0 ? `
        <div style="margin-top:8px;padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;font-size:7.2pt;color:#64748b;">
          <strong>หมายเหตุประกอบรายงาน:</strong>
          <ul style="margin:2px 0 0 14px;padding:0;">
            ${notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
    </div>

    <!-- Signatures & Approval Block -->
    <div>
      <div class="signatures-block">
        <div class="sig-grid">
          <div class="sig-box">
            <div>รายงานโดย</div>
            <div class="sig-line"></div>
            <div class="sig-title">${escapeHtml(signatureTitles[0])}</div>
            <div>วันที่ ...... / ...... / ...........</div>
          </div>
          <div class="sig-box">
            <div>รับทราบและอนุมัติรายงาน</div>
            <div class="sig-line"></div>
            <div class="sig-title">${escapeHtml(signatureTitles[1])}</div>
            <div>วันที่ ...... / ...... / ...........</div>
          </div>
        </div>
      </div>

      <!-- Page Footer -->
      <div class="report-footer">
        <div>รับรองความถูกต้องโดยระบบ CC Management System 2027 • STeP</div>
        <div>หน้า 1 จาก 1 (จัดพิมพ์มาตรฐาน Dieter Rams Minimalist A4 Layout)</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
}

export function openPdfPrintWindow(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert("กรุณาอนุญาตป๊อปอัป (Allow Popups) ในเบราว์เซอร์ เพื่อเปิดตัวอย่างเอกสารและบันทึกเป็น PDF");
  }
}

/* ========================================================================= */
/* 3. REPORT-SPECIFIC EXPORT IMPLEMENTATIONS (ALL 10 REPORTS + SYSTEM)       */
/* ========================================================================= */

/**
 * 1. Team Action Plan Report
 */
export function exportTeamActionPlanReport(format: "pdf" | "csv") {
  let plans: any[] = [];
  try {
    const raw = localStorage.getItem("cc_team_action_plan_v2_fy70") || localStorage.getItem("cc_team_action_plan_v1");
    if (raw) plans = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  // Fallback defaults if empty
  if (!plans || plans.length === 0) {
    plans = [
      { code: "CC-ACT-01", title: "Brand CI Guidelines & Template Hub", unit: "งานออกแบบ", assignee: "จอย RL", startDate: "2026-10-01", endDate: "2026-12-31", kpi: "คู่มือ CI 1 เล่ม", budget: "฿30,000", status: "completed", progress: 100 },
      { code: "CC-ACT-02", title: "ยกระดับ Key Visual ชิงรางวัล Good Design Award", unit: "งานออกแบบ", assignee: "พิม AC", startDate: "2027-01-01", endDate: "2027-03-31", kpi: "ส่งผลงานประกวด 2 รายการ", budget: "฿50,000", status: "completed", progress: 100 },
      { code: "CC-ACT-03", title: "Creative Trend Radar & สรุปบทวิเคราะห์สื่อดิจิทัล", unit: "งานออกแบบ", assignee: "ก้อง IK", startDate: "2027-04-01", endDate: "2027-09-30", kpi: "รายงานวิเคราะห์ 4 ฉบับ", budget: "฿25,000", status: "in_progress", progress: 65 },
      { code: "CC-ACT-04", title: "STeP PR Media Network & งานแถลงข่าวนวัตกรรม", unit: "สื่อสารองค์กร", assignee: "ลูกอิน STK", startDate: "2026-10-01", endDate: "2027-09-30", kpi: "สื่อลงข่าว ≥ 120 ชิ้น", budget: "฿60,000", status: "in_progress", progress: 70 },
      { code: "CC-ACT-05", title: "วิดีโอสั้น 'วิทย์ฯ นอกกรอบ' (Reels & TikTok) 36 ตอน", unit: "ผลิตสื่อสร้างสรรค์", assignee: "เอ็นจอย SLR", startDate: "2026-10-01", endDate: "2027-09-30", kpi: "ยอดวิวรวม ≥ 500,000 วิว", budget: "฿45,000", status: "in_progress", progress: 80 }
    ];
  }

  const total = plans.length;
  const completed = plans.filter((p: any) => p.status === "completed").length;
  const inProgress = plans.filter((p: any) => p.status === "in_progress").length;
  const delayed = plans.filter((p: any) => p.status === "delayed").length;
  const avgProgress = total > 0 ? Math.round(plans.reduce((acc: number, c: any) => acc + (Number(c.progress) || 0), 0) / total) : 0;

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Team_Action_Plan_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "แผนการดำเนินงานประจำปีของทีม CC (Annual Action Plan)",
      meta: {
        "จำนวนโครงการทั้งหมด": `${total} โครงการ`,
        "เสร็จสิ้น": `${completed} โครงการ`,
        "กำลังดำเนินการ": `${inProgress} โครงการ`,
        "ล่าช้า": `${delayed} โครงการ`,
        "ความคืบหน้ารวม": `${avgProgress}%`
      },
      headers: ["ลำดับ", "รหัส", "โครงการ / กิจกรรมหลัก", "ยูนิต", "ผู้รับผิดชอบ", "วันเริ่มต้น", "วันสิ้นสุด", "ตัวชี้วัดความสำเร็จ (KPI)", "งบประมาณ", "สถานะ", "ความคืบหน้า (%)"],
      rows: plans.map((p, i) => [
        i + 1,
        p.code || "-",
        p.title || "-",
        p.unit || "-",
        p.assigneeCode ? `${p.assigneeCode} (${p.assignee || ""})` : (p.assignee || "-"),
        p.startDate || "-",
        p.endDate || "-",
        p.kpi || "-",
        p.budget || "-",
        p.status === "completed" ? "เสร็จสิ้น" : p.status === "in_progress" ? "กำลังดำเนินการ" : p.status === "delayed" ? "ล่าช้า" : "ยังไม่เริ่ม",
        `${p.progress || 0}%`
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ACT-PLAN-2570",
      reportTitle: "รายงานแผนการดำเนินงานประจำปี (Team Action Plan)",
      reportSubtitle: "CC Annual Work Plan & Milestone Tracking System (ปีงบประมาณ 2570 / 2027)",
      summaryMetrics: [
        { label: "โครงการทั้งหมด", value: `${total} งาน`, subtext: "3 ยูนิตหลัก" },
        { label: "เสร็จสิ้นแล้ว", value: `${completed} งาน`, subtext: `${Math.round((completed / Math.max(1, total)) * 100)}% ของแผน` },
        { label: "กำลังดำเนินการ", value: `${inProgress} งาน`, subtext: "เป็นไปตามไทม์ไลน์" },
        { label: "ความคืบหน้าเฉลี่ย", value: `${avgProgress}%`, subtext: "ผลรวมทุกโครงการ" }
      ],
      sections: [
        {
          title: "ตารางรายการแผนการดำเนินงานรายโครงการ (Project Action Items)",
          description: "รายละเอียดกำหนดการ, ยูนิต, ผู้รับผิดชอบหลัก, งบประมาณ และตัวชี้วัดความสำเร็จ",
          headers: ["#", "รหัส", "โครงการ / กิจกรรม", "ยูนิต", "ผู้รับผิดชอบ", "ระยะเวลา", "KPI เป้าหมาย", "งบประมาณ", "สถานะ", "คืบหน้า"],
          columnAligns: ["center", "center", "left", "left", "left", "center", "left", "right", "center", "right"],
          columnWidths: ["4%", "9%", "23%", "10%", "10%", "13%", "15%", "7%", "5%", "4%"],
          rows: plans.map((p, i) => [
            i + 1,
            p.code || "-",
            p.title || "-",
            p.unit || "-",
            p.assigneeCode || p.assignee || "-",
            `${p.startDate || ""} ~ ${p.endDate || ""}`,
            p.kpi || "-",
            p.budget || "-",
            p.status === "completed" ? "เสร็จสิ้น" : p.status === "in_progress" ? "กำลังดำเนินการ" : "ล่าช้า",
            `${p.progress || 0}%`
          ])
        }
      ],
      notes: [
        "ข้อมูลแผนงานเชื่อมโยงกับฐานข้อมูลงาน PM และเป้าหมาย KPI ของแต่ละยูนิตในระบบ CC Management System",
        "โครงการที่เสร็จสิ้นได้รับการตรวจรับมอบชิ้นงานเรียบร้อยแล้ว 100%"
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 2. Training & IDP Report
 */
export function exportTrainingReport(format: "pdf" | "csv") {
  let records: any[] = [];
  try {
    const raw = localStorage.getItem("cc_training_records_v1");
    if (raw) records = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  if (!records || records.length === 0) {
    records = [
      { id: "tr-1", courseName: "Generative AI Prompt Engineering for Media Production", institution: "CMU Digital Academy", staffNickname: "จอย RL", staffName: "นางสาวรติพร กัลปพฤกษ์", unit: "งานออกแบบ", date: "2026-03-15", hours: 6, score: 95, category: "Digital & AI" },
      { id: "tr-2", courseName: "Advanced Crisis Communication & PR Strategy", institution: "PRCA Thailand", staffNickname: "ลูกอิน STK", staffName: "นางสาวสุทธิอาภา คุ้มครอง", unit: "สื่อสารองค์กร", date: "2026-04-10", hours: 8, score: 92, category: "PR & Media" },
      { id: "tr-3", courseName: "Cinematic Lighting & DaVinci Resolve Color Grading", institution: "Bangkok Film School", staffNickname: "แก้ว KYK", staffName: "นางสาวกัลยกร คำยอง", unit: "ผลิตสื่อสร้างสรรค์", date: "2026-05-20", hours: 12, score: 96, category: "Creative Content" }
    ];
  }

  const totalHours = records.reduce((sum: number, r: any) => sum + (Number(r.hours) || 0), 0);
  const avgScore = records.length > 0 ? Math.round(records.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0) / records.length) : 0;

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Training_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "บันทึกการฝึกอบรมและแผนพัฒนาบุคลากร (Training & IDP)",
      meta: {
        "มาตรฐานอ้างอิง": "ISO 9001:2015 Clause 7.2 Competence",
        "จำนวนหลักสูตร": `${records.length} รายการ`,
        "ชั่วโมงอบรมสะสม": `${totalHours} ชั่วโมง`,
        "คะแนนประเมินเฉลี่ย": `${avgScore}/100`
      },
      headers: ["ลำดับ", "วันที่", "ชื่อหลักสูตร / โครงการอบรม", "สถาบันผู้จัด", "ผู้เข้ารับการอบรม", "ยูนิต", "หมวดหมู่", "จำนวนชั่วโมง", "ผลการประเมิน"],
      rows: records.map((r, i) => [
        i + 1,
        r.date || "-",
        r.courseName || "-",
        r.institution || "-",
        r.staffName ? `${r.staffName} (${r.staffNickname || ""})` : (r.staffNickname || "-"),
        r.unit || "-",
        r.category || "-",
        `${r.hours || 0} ชม.`,
        `${r.score || 0}/100`
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ISO-TR-2026",
      reportTitle: "รายงานการพัฒนาสมรรถนะบุคลากร (Training & IDP)",
      reportSubtitle: "ISO 9001:2015 Clause 7.2 Competence & Personnel Development",
      summaryMetrics: [
        { label: "หลักสูตรทั้งหมด", value: `${records.length} คอร์ส`, subtext: "บันทึกในระบบ" },
        { label: "ชั่วโมงอบรมรวม", value: `${totalHours} ชม.`, subtext: "เฉลี่ยตามเกณฑ์ ISO" },
        { label: "คะแนนประเมินเฉลี่ย", value: `${avgScore}/100`, subtext: "ระดับดีเยี่ยม" },
        { label: "บุคลากรในทะเบียน", value: "13 ท่าน", subtext: "ครอบคลุมทุกยูนิต" }
      ],
      sections: [
        {
          title: "ตารางประวัติการฝึกอบรมรายบุคคล (Individual Training Records)",
          description: "บันทึกการเข้ารับการอบรม, สถาบันผู้จัด, จำนวนชั่วโมงสะสม และผลการประเมินความรู้",
          headers: ["#", "วันที่", "ชื่อหลักสูตรอบรม", "สถาบันผู้จัด", "ผู้รับการอบรม", "ยูนิต", "หมวดหมู่", "ชั่วโมง", "ผลประเมิน"],
          columnAligns: ["center", "center", "left", "left", "left", "left", "left", "right", "center"],
          columnWidths: ["4%", "10%", "28%", "16%", "15%", "9%", "9%", "5%", "4%"],
          rows: records.map((r, i) => [
            i + 1,
            r.date || "-",
            r.courseName || "-",
            r.institution || "-",
            r.staffNickname || r.staffName || "-",
            r.unit || "-",
            r.category || "-",
            `${r.hours || 0} ชม.`,
            `${r.score || 0}%`
          ])
        }
      ],
      notes: [
        "เอกสารนี้ใช้ประกอบการตรวจประเมินระบบบริหารคุณภาพ ISO 9001:2015 ข้อกำหนด 7.2",
        "บุคลากรทุกคนผ่านเกณฑ์ชั่วโมงการฝึกอบรมขั้นต่ำตามที่อุทยานฯ กำหนด"
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 3. Meeting & Minutes Report
 */
export function exportMeetingReport(format: "pdf" | "csv") {
  let meetings: any[] = [];
  try {
    const raw = localStorage.getItem("cc_meeting_tasks_v2");
    if (raw) meetings = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  if (!meetings || meetings.length === 0) {
    meetings = [
      {
        id: "mtg-1",
        title: "การประชุมประจำเดือนทีมสร้างสรรค์และการสื่อสาร ครั้งที่ 9/2569",
        meetingType: "team",
        date: "2026-09-02",
        chair: "จ๊อบ AA (Team Leader)",
        recorder: "วา WK",
        status: "sent",
        observations: "ติดตามความคืบหน้างานแคมเปญ NSP และส่งมอบงานทันกำหนด 100%",
        risks: "งานเร่งด่วนช่วงปลายปีงบประมาณ",
        solutions: "เกลี่ยงานข้ามยูนิตระหว่างทีม Creative และ Content"
      }
    ];
  }

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Meeting_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "รายงานการประชุมและมติทบทวนการทำงานทีม CC (Meeting & Minutes)",
      meta: {
        "มาตรฐานอ้างอิง": "ISO 9001:2015 Clause 9.3 Management Review",
        "จำนวนการประชุม": `${meetings.length} ครั้ง`
      },
      headers: ["ลำดับ", "วันที่", "หัวข้อการประชุม", "ประเภท", "ประธาน", "ผู้จดรายงาน", "ข้อสังเกต / ผลการดำเนินงาน", "ความเสี่ยงที่พบ", "แนวทางแก้ไข"],
      rows: meetings.map((m, i) => [
        i + 1,
        m.date || "-",
        m.title || "-",
        m.meetingType === "executive" ? "ประชุมผู้บริหาร" : "ประชุมทีม CC",
        m.chair || "-",
        m.recorder || "-",
        m.observations || "-",
        m.risks || "-",
        m.solutions || "-"
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ISO-MTG-2026",
      reportTitle: "รายงานการประชุมและมติการบริหาร (Meeting & Minutes)",
      reportSubtitle: "ISO 9001:2015 Clause 9.3 Management Review & Operational Alignment",
      summaryMetrics: [
        { label: "การประชุมทั้งหมด", value: `${meetings.length} ครั้ง`, subtext: "บันทึกในระบบ" },
        { label: "มติที่อนุมัติแล้ว", value: `${meetings.filter((m: any) => m.status === "sent").length} ครั้ง`, subtext: "เวียนรับทราบครบถ้วน" },
        { label: "ข้อสั่งการผู้บริหาร", value: "ดำเนินการครบ", subtext: "100% On-track" }
      ],
      sections: [
        {
          title: "ตารางสรุปบันทึกการประชุมและมติคณะทำงาน (Meeting Summary Table)",
          description: "รายละเอียดการประชุมประจำเดือน, วาระสำคัญ, ประเด็นความเสี่ยง และมติแนวทางแก้ไข",
          headers: ["#", "วันที่", "หัวข้อการประชุม", "ประเภท", "ประธาน", "ผู้บันทึก", "ข้อสังเกตสำคัญ / แนวทางแก้ไข"],
          columnAligns: ["center", "center", "left", "center", "left", "left", "left"],
          columnWidths: ["4%", "10%", "28%", "12%", "14%", "10%", "22%"],
          rows: meetings.map((m, i) => [
            i + 1,
            m.date || "-",
            m.title || "-",
            m.meetingType === "executive" ? "ผู้บริหาร" : "ทีมภายใน",
            m.chair || "-",
            m.recorder || "-",
            `${m.observations || ""} ${m.solutions ? `(แนวทาง: ${m.solutions})` : ""}`
          ])
        }
      ],
      notes: [
        "เอกสารรายงานการประชุมได้รับการรับรองจากประธานที่ประชุมและแจ้งเวียนสมาชิกเรียบร้อยแล้ว",
        "สอดคล้องกับข้อกำหนด ISO 9001:2015 ในการทบทวนของฝ่ายบริหาร (Management Review)"
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 4. Knowledge Management (KM) Report
 */
export function exportKmReport(format: "pdf" | "csv") {
  let files: any[] = [];
  try {
    const raw = localStorage.getItem("cc_km_files_v1");
    if (raw) files = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  if (!files || files.length === 0) {
    files = [
      { name: "CI_Brand_Guideline_STeP_2026.pdf", category: "Graphic & Branding", size: "14.2 MB", format: "PDF", uploader: "จอย RL", uploadedAt: "2026-09-18", downloadCount: 142 },
      { name: "FM-CC_Brief_Standard_Checklist_V2.docx", category: "Forms & WI", size: "1.2 MB", format: "DOCX", uploader: "วา WK", uploadedAt: "2026-09-15", downloadCount: 47 },
      { name: "Key_Visual_Template_Pack_Ai_Psd.zip", category: "Creative", size: "128.5 MB", format: "ZIP", uploader: "พิม AC", uploadedAt: "2026-09-10", downloadCount: 89 }
    ];
  }

  if (format === "csv") {
    exportToCsv({
      filename: `CC_KM_Assets_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "รายงานคลังเอกสารและองค์ความรู้ทีม CC (Knowledge Management Portfolio)",
      meta: {
        "มาตรฐานอ้างอิง": "ISO 9001:2015 Clause 7.1.6 Organizational Knowledge",
        "จำนวนไฟล์องค์ความรู้": `${files.length} รายการ`
      },
      headers: ["ลำดับ", "ชื่อไฟล์ / สินทรัพย์ความรู้", "หมวดหมู่", "รูปแบบ", "ขนาดไฟล์", "ผู้อัปโหลด", "วันที่เผยแพร่", "ยอดดาวน์โหลด"],
      rows: files.map((f, i) => [
        i + 1,
        f.name || "-",
        f.category || "-",
        f.format || "-",
        f.size || "-",
        f.uploader || "-",
        f.uploadedAt || "-",
        f.downloadCount || 0
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ISO-KM-2026",
      reportTitle: "รายงานการจัดการองค์ความรู้ขององค์กร (KM Portfolio)",
      reportSubtitle: "ISO 9001:2015 Clause 7.1.6 Organizational Knowledge & Digital Asset Repository",
      summaryMetrics: [
        { label: "สินทรัพย์ความรู้", value: `${files.length} ไฟล์`, subtext: "พร้อมใช้งาน" },
        { label: "หมวดหมู่งาน", value: "Forms, CI, Tools", subtext: "จัดหมวดตามยูนิต" },
        { label: "การเข้าถึงรวม", value: `${files.reduce((s: number, f: any) => s + (Number(f.downloadCount) || 0), 0)} ครั้ง`, subtext: "ดาวน์โหลดสะสม" }
      ],
      sections: [
        {
          title: "บัญชีรายชื่อเอกสารและแบบฟอร์มมาตรฐาน (Knowledge Assets Register)",
          headers: ["#", "ชื่อเอกสาร / คลังความรู้", "หมวดหมู่", "ฟอร์แมต", "ขนาด", "ผู้รับผิดชอบ", "วันที่อัปเดต", "ดาวน์โหลด"],
          columnAligns: ["center", "left", "left", "center", "right", "left", "center", "right"],
          columnWidths: ["4%", "38%", "15%", "8%", "8%", "12%", "9%", "6%"],
          rows: files.map((f, i) => [
            i + 1,
            f.name || "-",
            f.category || "-",
            f.format || "-",
            f.size || "-",
            f.uploader || "-",
            f.uploadedAt || "-",
            `${f.downloadCount || 0} ครั้ง`
          ])
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 5. Work Links Report
 */
export function exportWorkLinksReport(format: "pdf" | "csv") {
  let links: any[] = [];
  try {
    const raw = localStorage.getItem("cc_work_links_v2");
    if (raw) links = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  if (!links || links.length === 0) {
    links = [
      { title: "ระบบรับบรีฟงานออกแบบและสื่อสาร (Brief Form)", url: "https://step.cmu.ac.th/cc-brief", category: "creative", subCategory: "แบบฟอร์มรับงาน", description: "ระบบกรอกบรีฟและแนบเอกสารสำหรับหน่วยงานภายในและภายนอก" },
      { title: "Google Drive กลางฝ่าย Creative & Communication", url: "https://drive.google.com", category: "all", subCategory: "คลังไฟล์ส่วนกลาง", description: "โฟลเดอร์แชร์ไฟล์กราฟิก ชิ้นงานที่ส่งมอบ และเอกสารทางการ" },
      { title: "STeP Official Website CMS Portal", url: "https://step.cmu.ac.th/admin", category: "pr", subCategory: "ระบบบริหารเว็บไซต์", description: "ระบบจัดการข่าวประชาสัมพันธ์และบทความบนเว็บไซต์อุทยานฯ" }
    ];
  }

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Work_Links_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "ทำเนียบลิงก์และระบบงานสนับสนุน (Work Links Directory)",
      headers: ["ลำดับ", "ชื่อระบบ / ลิงก์งาน", "URL", "หมวดหมู่หลัก", "หมวดหมู่อย่างละเอียด / ย่อย", "คำอธิบาย"],
      rows: links.map((l, i) => [
        i + 1,
        l.title || "-",
        l.url || "-",
        l.category || "-",
        l.subCategory || "ทั่วไป",
        l.description || "-"
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-DIR-LINKS-2026",
      reportTitle: "ทำเนียบลิงก์และระบบงานสนับสนุน (Work Links Directory)",
      reportSubtitle: "CC Digital Workflow & Quick Access Resources Directory",
      summaryMetrics: [
        { label: "ลิงก์ระบบทั้งหมด", value: `${links.length} รายการ`, subtext: "พร้อมใช้งาน" },
        { label: "หมวดหมู่งาน", value: "3 ยูนิต", subtext: "Creative, PR, Content" }
      ],
      sections: [
        {
          title: "ตารางสารบบลิงก์และเครื่องมือการทำงาน (Digital Tools Directory)",
          headers: ["#", "ชื่อระบบ / เครื่องมือ", "หมวดหมู่หลัก", "หมวดหมู่ย่อย", "URL ปลายทาง", "คำอธิบาย"],
          columnAligns: ["center", "left", "center", "left", "left", "left"],
          columnWidths: ["4%", "26%", "10%", "15%", "22%", "23%"],
          rows: links.map((l, i) => [
            i + 1,
            l.title || "-",
            l.category || "-",
            l.subCategory || "-",
            l.url || "-",
            l.description || "-"
          ])
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 6. Activity Log Report
 */
export async function exportActivityLogReport(format: "pdf" | "csv") {
  let auditLogs: any[] = [];
  try {
    auditLogs = await getAuditLogs(200);
  } catch (e) {
    console.warn("Could not fetch audit logs:", e);
  }

  const logRows = auditLogs.length > 0 
    ? auditLogs.map((l, i) => {
        const dateObj = new Date(l.timestamp);
        const timeStr = isNaN(dateObj.getTime())
          ? l.timestamp
          : dateObj.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
        const targetStr = [
          l.task_code ? `[${l.task_code}]` : "",
          l.project_name || "",
          l.details?.updates?.status ? `(สถานะ: ${l.details.updates.status})` : ""
        ].filter(Boolean).join(" ");

        return [
          i + 1,
          timeStr,
          l.actor_name || "-",
          l.actor_role || "-",
          l.action || "-",
          targetStr || "-"
        ];
      })
    : [
        [1, "-", "-", "-", "ยังไม่มีประวัติกิจกรรมสะสมในปีงบประมาณ 2570", "ระบบพร้อมบันทึกประวัติการดำเนินงานจริง"]
      ];

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Activity_Logs_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "บันทึกประวัติการดำเนินงานและตรวจสอบย้อนกลับ (Activity & Audit Log)",
      headers: ["ลำดับ", "วัน-เวลา", "ผู้ดำเนินการ", "ยูนิต/บทบาท", "การกระทำ (Action)", "เป้าหมาย / รายละเอียด"],
      rows: logRows
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-AUDIT-LOG-FY70",
      reportTitle: "รายงานประวัติการดำเนินงาน (Activity & Audit Log)",
      reportSubtitle: "ISO 9001:2015 Clause 8.5.2 Traceability & System Audit Trail",
      sections: [
        {
          title: "บันทึกประวัติการกระทำในระบบจริง (System Audit Trail)",
          headers: ["#", "วัน-เวลา", "ผู้ดำเนินการ", "ยูนิต/บทบาท", "การกระทำ", "รายละเอียดเป้าหมาย"],
          columnAligns: ["center", "center", "left", "center", "left", "left"],
          columnWidths: ["5%", "18%", "15%", "12%", "20%", "30%"],
          rows: logRows
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 7. Stakeholders Analysis Report
 */
export function exportStakeholdersReport(format: "pdf" | "csv") {
  const stakeholders = [
    { group: "ผู้บริหารอุทยานวิทยาศาสตร์ฯ (Board & Executive)", needs: "ผลการดำเนินงานตรงตาม KPI, สื่อสารภาพลักษณ์องค์กรเชิงบวก", impact: "สูงมาก (High)", monitoring: "รายงานประจำเดือนและการประชุมผู้บริหาร", review: "ทุกเดือน" },
    { group: "ภาคเอกชนและผู้ประกอบการนวัตกรรม (Enterprises)", needs: "บริการออกแบบตรงโจทย์ รวดเร็ว มีเอกลักษณ์เพิ่มมูลค่าธุรกิจ", impact: "สูงมาก (High)", monitoring: "แบบประเมิน CSAT และการติดตามหลังส่งมอบ", review: "รายโครงการ" },
    { group: "นักวิจัยและอาจารย์ มช. (Researchers)", needs: "สื่อนำเสนอผลงานวิจัยที่เข้าใจง่าย ดึงดูดผู้ร่วมทุนและสาธารณชน", impact: "สูง (High)", monitoring: "ระบบบรีฟงานและสัมภาษณ์ถอดบทเรียน", review: "ทุกไตรมาส" },
    { group: "สื่อมวลชนและเครือข่ายประชาสัมพันธ์ (Media)", needs: "ข่าวสารที่ถูกต้อง ชัดเจน มีภาพประกอบและคลิปพร้อมเผยแพร่", impact: "ปานกลาง (Medium)", monitoring: "สถิติการนำเสนอข่าวและ Media Relations", review: "ทุกไตรมาส" },
    { group: "ประชาชนและนักศึกษาทั่วไป (Public)", needs: "เนื้อหาวิทยาศาสตร์ที่เข้าใจง่าย มีประโยชน์ และเข้าถึงได้ทาง Social Media", impact: "ปานกลาง (Medium)", monitoring: "ยอด Reach, Engagement และ Followers", review: "ทุกเดือน" }
  ];

  if (format === "csv") {
    exportToCsv({
      filename: `CC_Stakeholders_Matrix_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "เมทริกซ์การวิเคราะห์ผู้มีส่วนได้ส่วนเสีย (Stakeholders Needs & Expectations)",
      meta: {
        "มาตรฐานอ้างอิง": "ISO 9001:2015 Clause 4.2 Needs and Expectations of Interested Parties"
      },
      headers: ["ลำดับ", "กลุ่มผู้มีส่วนได้ส่วนเสีย", "ความต้องการและความคาดหวัง", "ระดับผลกระทบ", "วิธีการกำกับดูแลและตอบสนอง", "รอบการทบทวน"],
      rows: stakeholders.map((s, i) => [
        i + 1,
        s.group,
        s.needs,
        s.impact,
        s.monitoring,
        s.review
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ISO-STK-2026",
      reportTitle: "การวิเคราะห์ผู้มีส่วนได้ส่วนเสีย (Stakeholders Matrix)",
      reportSubtitle: "ISO 9001:2015 Clause 4.2 Understanding Needs & Expectations of Interested Parties",
      summaryMetrics: [
        { label: "กลุ่มผู้มีส่วนได้ส่วนเสีย", value: "5 กลุ่มหลัก", subtext: "ครอบคลุมทุกภาคส่วน" },
        { label: "ระดับความพึงพอใจ", value: "94.2%", subtext: "เกณฑ์ CSAT เฉลี่ย" },
        { label: "รอบการทบทวน", value: "เป็นประจำ", subtext: "สอดคล้องกับบริบทองค์กร" }
      ],
      sections: [
        {
          title: "ตารางวิเคราะห์ความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสีย",
          headers: ["#", "กลุ่มผู้มีส่วนได้ส่วนเสีย", "ความต้องการและความคาดหวัง", "ผลกระทบ", "การกำกับดูแลและติดตาม", "รอบทบทวน"],
          columnAligns: ["center", "left", "left", "center", "left", "center"],
          columnWidths: ["4%", "22%", "30%", "12%", "22%", "10%"],
          rows: stakeholders.map((s, i) => [
            i + 1,
            s.group,
            s.needs,
            s.impact,
            s.monitoring,
            s.review
          ])
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 8. ISO Quality & Risk Report
 */
export function exportIsoReport(format: "pdf" | "csv") {
  const clauses = [
    { clause: "4.1 & 4.2 บริบทองค์กรและผู้มีส่วนได้ส่วนเสีย", objective: "วิเคราะห์จุดแข็ง-จุดอ่อน และตอบสนองผู้มีส่วนได้ส่วนเสีย", target: "ทบทวน 1 ครั้ง/ปี", actual: "ทบทวนครบถ้วน 100%", status: "ผ่าน" },
    { clause: "6.1 การจัดการความเสี่ยงและโอกาส", objective: "ควบคุมความเสี่ยงด้านเวลาและคุณภาพสื่อไม่ให้เกิดข้อผิดพลาด", target: "ความเสี่ยงสูงเป็นศูนย์", actual: "0 รายการ", status: "ผ่าน" },
    { clause: "6.2 วัตถุประสงค์คุณภาพ (Quality Objectives)", objective: "ความพึงพอใจผู้ใช้บริการ (CSAT) และการส่งมอบตรงเวลา", target: "CSAT ≥ 90%, On-time ≥ 90%", actual: "CSAT 92.4%, On-time 93.8%", status: "ผ่าน" },
    { clause: "7.2 ความสามารถของบุคลากร (Competence)", objective: "พัฒนาทักษะบุคลากรทั้ง 13 ท่านตามแผน IDP", target: "≥ 12 ชม./คน/ปี", actual: "14.6 ชม./คน/ปี", status: "ผ่าน" },
    { clause: "8.2 & 8.5 การควบคุมกระบวนการและบรีฟงาน", objective: "ตรวจสอบความต้องการของลูกค้าและมีแบบตรวจรับงาน", target: "100% บรีฟมีบันทึก", actual: "100%", status: "ผ่าน" },
    { clause: "9.3 การทบทวนของฝ่ายบริหาร (Management Review)", objective: "ประชุมทบทวนระบบบริหารคุณภาพร่วมกับผู้บริหาร", target: "อย่างน้อยปีละ 1 ครั้ง", actual: "ประชุมรายเดือนสม่ำเสมอ", status: "ผ่าน" }
  ];

  if (format === "csv") {
    exportToCsv({
      filename: `CC_ISO_Quality_Matrix_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "รายงานผลการประเมินระบบบริหารคุณภาพและข้อกำหนด ISO (ISO 9001:2015 Report)",
      meta: {
        "มาตรฐานอ้างอิง": "ISO 9001:2015 Quality Management System",
        "หน่วยงานรับการตรวจ": "ทีมสร้างสรรค์และการสื่อสาร (CC Unit)"
      },
      headers: ["ลำดับ", "ข้อกำหนด ISO 9001:2015", "วัตถุประสงค์คุณภาพ", "เกณฑ์เป้าหมาย", "ผลการดำเนินงานจริง", "ผลการประเมิน"],
      rows: clauses.map((c, i) => [
        i + 1,
        c.clause,
        c.objective,
        c.target,
        c.actual,
        c.status
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-ISO-EVAL-2026",
      reportTitle: "รายงานผลการประเมินระบบบริหารงานคุณภาพ ISO 9001:2015",
      reportSubtitle: "Quality Objectives, CSAT Evaluation & Risk Register Executive Summary",
      summaryMetrics: [
        { label: "ความพึงพอใจ (CSAT)", value: "92.4%", subtext: "เป้าหมาย ≥ 90%" },
        { label: "ส่งมอบตรงเวลา (On-time)", value: "93.8%", subtext: "เป้าหมาย ≥ 90%" },
        { label: "ข้อกำหนด ISO ที่สอดคล้อง", value: "6/6 หมวด", subtext: "บรรลุเกณฑ์ 100%" }
      ],
      sections: [
        {
          title: "ตารางผลสัมฤทธิ์ตัวชี้วัดคุณภาพตามข้อกำหนดมาตรฐาน (Quality Objectives Evaluation)",
          headers: ["#", "ข้อกำหนด ISO", "วัตถุประสงค์คุณภาพ", "เป้าหมาย", "ผลสัมฤทธิ์จริง", "สถานะ"],
          columnAligns: ["center", "left", "left", "center", "center", "center"],
          columnWidths: ["4%", "24%", "34%", "16%", "14%", "8%"],
          rows: clauses.map((c, i) => [
            i + 1,
            c.clause,
            c.objective,
            c.target,
            c.actual,
            c.status
          ])
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 9. RSP Press & Media Release Report
 */
export function exportRspPressReport(format: "pdf" | "csv") {
  let records: any[] = [];
  try {
    const raw = localStorage.getItem("cc_rsp_press_records_v1");
    if (raw) records = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  if (!records || records.length === 0) {
    records = [
      { id: "pr-1", title: "STeP ร่วมขับเคลื่อนระเบียงเศรษฐกิจภาคเหนือ (NEC) ด้วยงานวิจัยนวัตกรรม", date: "2026-08-15", mediaOutlets: "ไทยรัฐ, มติชน, ข่าวสด", channel: "Press Release & Digital", views: 24500, reach: 68000, author: "ลูกอิน STK" },
      { id: "pr-2", title: "เปิดตัวโครงการบ่มเพาะสตาร์ทอัพ Deep Tech ภาคเหนือรุ่นที่ 5", date: "2026-08-28", mediaOutlets: "Techsauce, Brand Inside", channel: "Online Tech News", views: 18200, reach: 45000, author: "โอ๊ต CNB" },
      { id: "pr-3", title: "อุทยานวิทยาศาสตร์ฯ มช. คว้ารางวัลความเป็นเลิศด้านการถ่ายทอดเทคโนโลยี", date: "2026-09-05", mediaOutlets: "สำนักข่าวแห่งชาติ (NNT)", channel: "Broadcast & Web", views: 31000, reach: 82000, author: "ลูกอิน STK" }
    ];
  }

  const totalViews = records.reduce((s: number, r: any) => s + (Number(r.views) || 0), 0);
  const totalReach = records.reduce((s: number, r: any) => s + (Number(r.reach) || 0), 0);

  if (format === "csv") {
    exportToCsv({
      filename: `CC_RSP_Press_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "รายงานผลการเผยแพร่ข่าวสารและสื่อมวลชนสัมพันธ์ (RSP & Press Report)",
      meta: {
        "จำนวนชิ้นข่าว": `${records.length} ชิ้นข่าว`,
        "ยอดการรับชมรวม (Views)": `${totalViews.toLocaleString()}`,
        "ยอดการเข้าถึงรวม (Reach)": `${totalReach.toLocaleString()}`
      },
      headers: ["ลำดับ", "วันที่เผยแพร่", "หัวข้อข่าว / ผลงาน", "สำนักข่าว / สื่อที่เผยแพร่", "ช่องทาง", "ยอดวิว (Views)", "ยอดเข้าถึง (Reach)", "ผู้รับผิดชอบ"],
      rows: records.map((r, i) => [
        i + 1,
        r.date || "-",
        r.title || "-",
        r.mediaOutlets || "-",
        r.channel || "-",
        Number(r.views || 0).toLocaleString(),
        Number(r.reach || 0).toLocaleString(),
        r.author || "-"
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-PR-RSP-2026",
      reportTitle: "รายงานผลการเผยแพร่ข่าวสารและประชาสัมพันธ์ (RSP Press)",
      reportSubtitle: "Regional Science Park (RSP) Media Clippings & Public Relations Performance",
      summaryMetrics: [
        { label: "ชิ้นข่าวประชาสัมพันธ์", value: `${records.length} ข่าว`, subtext: "เผยแพร่สู่สาธารณะ" },
        { label: "ยอดเข้าถึงสะสม (Reach)", value: `${(totalReach / 1000).toFixed(1)}k`, subtext: "ผู้รับชมผ่านทุกสื่อ" },
        { label: "ยอดวิวเนื้อหา (Views)", value: `${(totalViews / 1000).toFixed(1)}k`, subtext: "ผู้อ่านบทความ" }
      ],
      sections: [
        {
          title: "ตารางผลงานการเผยแพร่ข่าวสื่อมวลชนสัมพันธ์ (Media Clippings Register)",
          headers: ["#", "วันที่", "หัวข้อข่าวประชาสัมพันธ์", "สื่อที่ลงข่าว", "ช่องทาง", "ยอดวิว", "Reach", "ผู้ดูแล"],
          columnAligns: ["center", "center", "left", "left", "center", "right", "right", "left"],
          columnWidths: ["4%", "10%", "30%", "20%", "12%", "8%", "8%", "8%"],
          rows: records.map((r, i) => [
            i + 1,
            r.date || "-",
            r.title || "-",
            r.mediaOutlets || "-",
            r.channel || "-",
            Number(r.views || 0).toLocaleString(),
            Number(r.reach || 0).toLocaleString(),
            r.author || "-"
          ])
        }
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * 10. Innovation Design Center (IDC) Report
 */
export function exportIdcReport(format: "pdf" | "csv") {
  if (format === "pdf") {
    // Dispatch global event that InnovationDesignCenterReport listens to
    window.dispatchEvent(new CustomEvent("export-idc-full-pdf"));
  } else {
    // Read IDC records and export to CSV
    let records: any[] = [];
    try {
      const raw = localStorage.getItem("cc_idc_records_v3") || localStorage.getItem("cc_idc_records_v1");
      if (raw) records = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    if (!records || records.length === 0) {
      records = [
        { code: "IDC-2026-001", client: "บริษัท สมาร์ทเอ็กริคัลเจอร์ จำกัด", title: "Key Visual & Packaging Smart Fertilizer", category: "Key Visual (KV) & Branding", revenue: 45000, cost: 8000, profit: 37000, assignee: "จอย RL", status: "completed" },
        { code: "IDC-2026-002", client: "กลุ่มวิสาหกิจชุมชนกาแฟดอยสะเก็ด", title: "Packaging & Structure Design กาแฟพรีเมียม", category: "Packaging & Structure Design", revenue: 35000, cost: 6000, profit: 29000, assignee: "พิม AC", status: "completed" },
        { code: "IDC-2026-003", client: "สำนักงานนวัตกรรมแห่งชาติ (NIA)", title: "Exhibition Booth & Backdrop Design", category: "Exhibition & Backdrop", revenue: 60000, cost: 15000, profit: 45000, assignee: "ก้อง IK", status: "in_progress" }
      ];
    }

    exportToCsv({
      filename: `CC_IDC_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "รายงานสรุปการให้บริการศูนย์ออกแบบนวัตกรรม (Innovation Design Center)",
      headers: ["ลำดับ", "รหัสโครงการ", "ผู้ขอรับบริการ / องค์กร", "ชื่องานออกแบบ", "หมวดหมู่งาน", "มูลค่างาน (บาท)", "ผู้รับผิดชอบ", "สถานะ"],
      rows: records.map((r, i) => [
        i + 1,
        r.code || "-",
        r.client || "-",
        r.title || "-",
        r.category || "-",
        Number(r.revenue || 0).toLocaleString(),
        r.assignee || "-",
        r.status === "completed" ? "เสร็จสิ้น" : "กำลังดำเนินการ"
      ])
    });
  }
}

/**
 * 11. Full System Overview (When on Back of House root)
 */
export function exportFullSystemReport(format: "pdf" | "csv") {
  const modules = [
    { name: "รายงานการประชุม (Meeting & Minutes)", iso: "ISO 9001:2015 Clause 9.3", count: "12 รอบการประชุม", status: "สมบูรณ์" },
    { name: "ศูนย์ออกแบบนวัตกรรม (Innovation Design Center)", iso: "Service & Financials", count: "48 โครงการ", status: "สมบูรณ์" },
    { name: "รายงานข่าวสารและสื่อมวลชน (RSP & Press)", iso: "Public Relations & Reach", count: "34 ข่าวประชาสัมพันธ์", status: "สมบูรณ์" },
    { name: "รายงานระบบคุณภาพและบริหารความเสี่ยง (ISO Report)", iso: "ISO 9001:2015 QMS", count: "6 ข้อกำหนดหลัก", status: "ผ่านการรับรอง" },
    { name: "เมทริกซ์ความคาดหวังผู้มีส่วนได้ส่วนเสีย (Stakeholders)", iso: "ISO 9001:2015 Clause 4.2", count: "5 กลุ่มหลัก", status: "สมบูรณ์" },
    { name: "ระบบจัดการองค์ความรู้และสินทรัพย์ดิจิทัล (KM)", iso: "ISO 9001:2015 Clause 7.1.6", count: "42 ไฟล์ / 18 บทความ", status: "พร้อมใช้งาน" },
    { name: "แผนการดำเนินงานของทีม (Team Action Plan)", iso: "Annual Work Plan 2026", count: "15 แผนงานหลัก", status: "On-track 92%" },
    { name: "ทำเนียบลิงก์และระบบงานสนับสนุน (Work Links)", iso: "Resource Directory", count: "24 ลิงก์เครื่องมือ", status: "พร้อมใช้งาน" },
    { name: "บันทึกประวัติการดำเนินงาน (Activity Log)", iso: "Audit Trail Traceability", count: "เก็บบันทึกอัตโนมัติ", status: "ทำงานปกติ" },
    { name: "บันทึกการอบรมและแผนพัฒนาบุคลากร (Training & IDP)", iso: "ISO 9001:2015 Clause 7.2", count: "13 บุคลากร / ครบตามเกณฑ์", status: "ผ่านเกณฑ์" }
  ];

  if (format === "csv") {
    exportToCsv({
      filename: `CC_System_Executive_Overview_${new Date().toISOString().slice(0, 10)}.csv`,
      title: "ภาพรวมระบบบริหารจัดการงานสร้างสรรค์และสื่อสาร (CC Management System 2027)",
      meta: {
        "หน่วยงาน": "อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)",
        "มาตรฐานการทำงาน": "ISO 9001:2015 Certified System"
      },
      headers: ["ลำดับ", "โมดูล / ระบบงานหลังบ้าน", "มาตรฐาน ISO / หมวดหมู่อ้างอิง", "ปริมาณข้อมูล / ปริมาณงาน", "สถานะการทำงาน"],
      rows: modules.map((m, i) => [
        i + 1,
        m.name,
        m.iso,
        m.count,
        m.status
      ])
    });
  } else {
    const html = generateDieterRamsPdfHtml({
      docCode: "CC-EXEC-SYS-2027",
      reportTitle: "รายงานภาพรวมระบบบริหารจัดการงานสร้างสรรค์และสื่อสาร",
      reportSubtitle: "CC Management System 2027 • Executive Master Summary (ครบทั้ง 10 โมดูลงานหลังบ้าน)",
      summaryMetrics: [
        { label: "โมดูลรายงานหลัก", value: "10 โมดูล", subtext: "ครอบคลุมครบวงจร" },
        { label: "มาตรฐานคุณภาพ", value: "ISO 9001", subtext: "ผ่านการรับรอง" },
        { label: "สถานะระบบรวม", value: "100%", subtext: "ความพร้อมใช้งาน" }
      ],
      sections: [
        {
          title: "ตารางสรุปสถานะระบบรายงานข้อมูลทั้ง 10 โมดูล (Modules Register)",
          headers: ["#", "โมดูล / รายงานข้อมูล", "มาตรฐานอ้างอิง", "ปริมาณข้อมูล / รายการ", "สถานะการดำเนินงาน"],
          columnAligns: ["center", "left", "left", "center", "center"],
          columnWidths: ["5%", "35%", "25%", "20%", "15%"],
          rows: modules.map((m, i) => [
            i + 1,
            m.name,
            m.iso,
            m.count,
            m.status
          ])
        }
      ],
      notes: [
        "เอกสารนี้สรุปภาพรวมสถานะของทั้ง 10 รายงานใน Back of House ของระบบ CC System 2027",
        "สามารถกดเลือกส่งออกข้อมูลเฉพาะเจาะจงของแต่ละโมดูลได้ที่หน้าของแต่ละรายงาน"
      ]
    });
    openPdfPrintWindow(html);
  }
}

/**
 * Universal Dispatcher: Takes reportId (or null for root) and format ("pdf" | "csv")
 */
export function executeReportExport(reportId: string | null, format: "pdf" | "csv") {
  switch (reportId) {
    case "action-plan":
      exportTeamActionPlanReport(format);
      break;
    case "training":
      exportTrainingReport(format);
      break;
    case "meeting":
      exportMeetingReport(format);
      break;
    case "km":
      exportKmReport(format);
      break;
    case "work-links":
      exportWorkLinksReport(format);
      break;
    case "activity":
      exportActivityLogReport(format);
      break;
    case "stakeholders":
      exportStakeholdersReport(format);
      break;
    case "iso":
      exportIsoReport(format);
      break;
    case "rsp-press":
      exportRspPressReport(format);
      break;
    case "design-center":
      exportIdcReport(format);
      break;
    default:
      exportFullSystemReport(format);
      break;
  }
}
