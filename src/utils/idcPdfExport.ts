/**
 * PDF Export Utility for Innovation Design Center (IDC) Report
 * Generates an executive A4 printable/PDF report combining all 3 parts:
 * Part 1: Dataset & 5 Core KPIs Evaluation + IMPACT (ชุดข้อมูล & 5 Core KPIs + IMPACT)
 * Part 2: Design PM Projects & Financials (โครงการ PM งานออกแบบ)
 * Part 3: Strategic Dashboard, SWOT & TOWS Matrix (แดชบอร์ด & วิเคราะห์เชิงกลยุทธ์)
 */

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ExportIDCPdfOptions {
  timeframe: string;
  filterStartDate?: string;
  filterEndDate?: string;
  records: any[];
  kpiMetrics: {
    kpiClients: number;
    kpiPieces: number;
    kpiRevenue: number;
    kpiAvgPerPiece: number;
    kpiImpact: number;
    avgScore: string;
    satisfactionPercentage: number;
    sentCount: number;
    evaluatedCount: number;
    surveyResponseRate: number;
    completedCount: number;
  };
  designPmProjects: any[];
  pmFinancialSummary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    projectCount: number;
    avgRevenuePerProject: number;
    profitMarginPercent: string;
    govCount: number;
    privCount: number;
    govRevenue: number;
    privRevenue: number;
    completedCount: number;
    inProgressCount: number;
    pendingCount: number;
  };
  swotAndTowsAnalysis: {
    strengths: Array<{ id: string; title: string; desc: string; metric: string; source: string }>;
    weaknesses: Array<{ id: string; title: string; desc: string; metric: string; source: string }>;
    opportunities: Array<{ id: string; title: string; desc: string; metric: string; source: string }>;
    threats: Array<{ id: string; title: string; desc: string; metric: string; source: string }>;
    tows: {
      so: { strategy: string; theme: string; tactics: Array<{ code: string; title: string; detail: string; impactKpi: string; target: string }> };
      wo: { strategy: string; theme: string; tactics: Array<{ code: string; title: string; detail: string; impactKpi: string; target: string }> };
      st: { strategy: string; theme: string; tactics: Array<{ code: string; title: string; detail: string; impactKpi: string; target: string }> };
      wt: { strategy: string; theme: string; tactics: Array<{ code: string; title: string; detail: string; impactKpi: string; target: string }> };
    };
    totalCombinedRevenue: number;
    totalCombinedImpact: number;
    privatePct: number;
    govPct: number;
    privateRecords?: number;
    govRecords?: number;
    topClusterName: string;
    topClusterPct: number;
    topServiceName: string;
    topServicePct: number;
  };
}

export function exportIDCFullPdf(options: ExportIDCPdfOptions) {
  const {
    timeframe,
    filterStartDate,
    filterEndDate,
    records,
    kpiMetrics,
    designPmProjects,
    pmFinancialSummary,
    swotAndTowsAnalysis
  } = options;

  const printDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const filterText = filterStartDate && filterEndDate
    ? `ระหว่างวันที่ ${filterStartDate} ถึง ${filterEndDate}`
    : filterStartDate
    ? `ตั้งแต่วันที่ ${filterStartDate}`
    : filterEndDate
    ? `จนถึงวันที่ ${filterEndDate}`
    : timeframe === 'ALL'
    ? 'ข้อมูลทั้งหมดตั้งแต่เริ่มระบบ (ALL)'
    : `ช่วงเวลา: ${timeframe}`;

  const serviceLabels: Record<string, string> = {
    consultation: '1. เข้ารับคำปรึกษา',
    product_design: '2. ออกแบบผลิตภัณฑ์',
    packaging_design: '3. ออกแบบบรรจุภัณฑ์',
    print_media: '4. ออกแบบสื่อสิ่งพิมพ์',
    logo_branding: '5. ออกแบบตราสัญลักษณ์',
    ci_branding: '6. ออกแบบอัตลักษณ์ (CI)',
    other: '7. อื่นๆ'
  };

  const businessLabels: Record<string, string> = {
    food_processing: 'การแปรรูปอาหาร',
    agriculture_biotech: 'เกษตร & เทคโนชีวภาพ',
    tourism: 'การท่องเที่ยว & บริการ',
    digital: 'ดิจิทัล & ซอฟต์แวร์',
    other: 'อื่นๆ'
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปศูนย์ออกแบบนวัตกรรม (IDC) - 4 หน้าฉบับสมบูรณ์</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background-color: #f1f5f9;
      font-size: 8.5pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Screen Top Bar */
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 24px;
      position: sticky;
      top: 0;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 8px;
      font-family: 'Prompt', sans-serif;
      font-size: 12px;
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
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Page Container (Each page is an explicit A4 sheet) */
    .pdf-page {
      width: 210mm;
      min-height: 297mm;
      margin: 15px auto;
      background: #ffffff;
      padding: 11mm 14mm 9mm 14mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
    }

    .pdf-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    .page-content {
      flex: 1;
    }

    /* Header Styling */
    .report-header {
      border-bottom: 2px solid #ea580c;
      padding-bottom: 7px;
      margin-bottom: 7px;
    }

    .brand-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .org-title {
      font-family: 'Prompt', sans-serif;
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .org-subtitle {
      font-size: 9.5pt;
      font-weight: 700;
      color: #ea580c;
      margin-top: 1px;
    }

    .org-dept {
      font-size: 8pt;
      color: #64748b;
      margin-top: 1px;
    }

    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      min-width: 170px;
    }
    .meta-box strong {
      color: #0f172a;
    }

    /* Page Top Header for Pages 2, 3, 4 */
    .page-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 7px;
      font-size: 7.5pt;
      color: #64748b;
    }
    .page-top-bar strong {
      color: #0f172a;
      font-family: 'Prompt', sans-serif;
      font-size: 8.5pt;
    }

    /* Summary Ribbon */
    .summary-ribbon {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      margin-bottom: 7px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
    }

    /* Section Headings */
    .section-title {
      font-family: 'Prompt', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: #f1f5f9;
      border-left: 3.5px solid #ea580c;
      border-radius: 0 6px 6px 0;
      margin-top: 3px;
      margin-bottom: 7px;
    }

    .section-badge {
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      background: #ea580c;
      color: #ffffff;
    }

    /* KPI Grid 6 Cards */
    .kpi-grid-6 {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 5px;
      margin-bottom: 7px;
    }

    /* KPI Grid 5 Cards */
    .kpi-grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 7px;
    }

    /* KPI Grid 4 Cards */
    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 7px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 6px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 46px;
    }

    .kpi-label {
      font-size: 7pt;
      font-weight: 700;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      line-height: 1.2;
    }

    .kpi-val {
      font-family: 'Prompt', sans-serif;
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin: 1px 0;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .kpi-sub {
      font-size: 6.5pt;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 2px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-highlight-orange { border-left: 3px solid #ea580c; }
    .kpi-highlight-emerald { border-left: 3px solid #059669; }
    .kpi-highlight-blue { border-left: 3px solid #2563eb; }
    .kpi-highlight-purple { border-left: 3px solid #9333ea; }
    .kpi-highlight-amber { border-left: 3px solid #d97706; }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      line-height: 1.25;
      margin-top: 4px;
      margin-bottom: 6px;
    }

    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Prompt', sans-serif;
      font-weight: 600;
      text-align: left;
      padding: 4px 6px;
      border: 1px solid #334155;
    }

    table.data-table td {
      padding: 3.5px 5px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
      color: #1e293b;
    }

    table.data-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    
    /* Authentic Thai Baht Currency Formatting */
    .currency-num {
      font-family: 'Prompt', 'Sarabun', sans-serif;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }

    /* SWOT Quadrants */
    .quadrant-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 6px;
    }

    .quadrant-box {
      border-radius: 6px;
      padding: 8px;
      border: 1px solid #cbd5e1;
    }
    .quadrant-box.s-box { background: #f0fdf4; border-color: #86efac; }
    .quadrant-box.w-box { background: #fff1f2; border-color: #fca5a5; }
    .quadrant-box.o-box { background: #eff6ff; border-color: #93c5fd; }
    .quadrant-box.t-box { background: #fffbeb; border-color: #fde68a; }

    .quadrant-head {
      font-family: 'Prompt', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .quadrant-item {
      background: #ffffff;
      padding: 4px 6px;
      border-radius: 5px;
      border: 1px solid rgba(0,0,0,0.06);
      margin-bottom: 4px;
      font-size: 7.5pt;
      line-height: 1.25;
    }
    .quadrant-item:last-child {
      margin-bottom: 0;
    }

    .quadrant-item-title {
      font-weight: 700;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      margin-bottom: 1px;
    }

    .quadrant-badge {
      font-size: 7pt;
      padding: 0.5px 5px;
      border-radius: 4px;
      font-weight: 700;
      white-space: nowrap;
    }

    /* TOWS Matrix Cards */
    .tows-strategy-box {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 9px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .tows-strategy-box.so-style { border-left: 4px solid #059669; }
    .tows-strategy-box.wo-style { border-left: 4px solid #2563eb; }
    .tows-strategy-box.st-style { border-left: 4px solid #d97706; }
    .tows-strategy-box.wt-style { border-left: 4px solid #e11d48; }

    .tactic-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 4px 6px;
      margin-top: 4px;
      font-size: 7.5pt;
      line-height: 1.25;
    }

    /* Signatures */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1.5px solid #e2e8f0;
    }

    .signature-box {
      text-align: center;
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
    }

    .signature-line {
      width: 170px;
      border-bottom: 1px dashed #94a3b8;
      margin: 24px auto 5px auto;
    }

    /* Page Footer */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 6px;
      font-size: 7pt;
      color: #94a3b8;
    }

    @media print {
      body {
        background: #ffffff;
        font-size: 8pt;
      }
      .pdf-page {
        width: 100%;
        min-height: auto;
        padding: 0;
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        break-after: page;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm 12mm;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Top Bar (Hidden in Print) -->
  <div class="no-print">
    <div style="font-family: 'Prompt', sans-serif; font-weight: 700; font-size: 13px;">
      📄 รายงานสรุปศูนย์ออกแบบนวัตกรรม (IDC) ครอบคลุม 3 ส่วน • ฉบับสมบูรณ์ 4 หน้ามาตรฐาน A4
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่าง</button>
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ พิมพ์รายงาน / บันทึกเป็น PDF
      </button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 1: ส่วนที่ 1 ชุดข้อมูล & การประเมิน 5 Core KPIs + IMPACT               -->
  <!-- ========================================================================= -->
  <div class="pdf-page">
    <div class="page-content">
      <!-- Header -->
      <div class="report-header">
        <div class="brand-bar">
          <div>
            <h1 class="org-title">รายงานสรุปผลการดำเนินงาน ศูนย์ออกแบบนวัตกรรม (IDC)</h1>
            <div class="org-subtitle">ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication)</div>
            <div class="org-dept">อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)</div>
          </div>
          <div class="meta-box">
            <div><strong>ช่วงเวลา:</strong> ${filterText}</div>
            <div><strong>พิมพ์เมื่อ:</strong> ${printDate}</div>
            <div><strong>สถานะรายงาน:</strong> ฉบับสมบูรณ์ (หน้า 1 จาก 4)</div>
          </div>
        </div>
      </div>

      <!-- Executive Summary Ribbon -->
      <div class="summary-ribbon">
        <div>
          <strong>ภาพรวม 2 ระบบ:</strong> รายรับรวม IDC + PM = <strong style="color: #fb923c; font-size: 9.5pt;">฿${swotAndTowsAnalysis.totalCombinedRevenue.toLocaleString()}</strong>
        </div>
        <div>
          <strong>7.5x Economic IMPACT:</strong> <strong style="color: #60a5fa; font-size: 9.5pt;">฿${(swotAndTowsAnalysis.totalCombinedImpact / 1000000).toFixed(2)}M</strong>
        </div>
        <div>
          <strong>PM Margin:</strong> <strong style="color: #34d399; font-size: 9.5pt;">${pmFinancialSummary.profitMarginPercent}%</strong>
        </div>
      </div>

      <!-- Section Title -->
      <div class="section-title">
        <span class="section-badge">ส่วนที่ 1</span>
        <span>ชุดข้อมูล &amp; การประเมิน 5 Core KPIs + IMPACT</span>
      </div>

      <!-- 6 Core KPI Cards (Single Sleek Row of 6) -->
      <div class="kpi-grid-6">
        <div class="kpi-card kpi-highlight-orange">
          <div class="kpi-label">
            <span>(29) KPI คน</span>
            <span style="color: #ea580c;">ราย</span>
          </div>
          <div class="kpi-val">${kpiMetrics.kpiClients}</div>
          <div class="kpi-sub">ผู้รับบริการรวม</div>
        </div>

        <div class="kpi-card kpi-highlight-purple">
          <div class="kpi-label">
            <span>(31) KPI ผลงาน</span>
            <span style="color: #9333ea;">ชิ้น</span>
          </div>
          <div class="kpi-val">${kpiMetrics.kpiPieces}</div>
          <div class="kpi-sub">ผลงาน &amp; คำปรึกษา</div>
        </div>

        <div class="kpi-card kpi-highlight-emerald">
          <div class="kpi-label">
            <span>(30) KPI รายได้</span>
            <span style="color: #059669;">บาท</span>
          </div>
          <div class="kpi-val" style="font-size: 10.5pt;">฿${kpiMetrics.kpiRevenue.toLocaleString()}</div>
          <div class="kpi-sub">รายได้ภายใน</div>
        </div>

        <div class="kpi-card kpi-highlight-blue">
          <div class="kpi-label">
            <span>(32) เฉลี่ย/ชิ้น</span>
            <span style="color: #2563eb;">บาท</span>
          </div>
          <div class="kpi-val" style="font-size: 10.5pt;">฿${kpiMetrics.kpiAvgPerPiece.toLocaleString()}</div>
          <div class="kpi-sub">(30) ÷ (31)</div>
        </div>

        <div class="kpi-card kpi-highlight-purple">
          <div class="kpi-label">
            <span>7.5x IMPACT</span>
            <span style="color: #7c3aed;">บาท</span>
          </div>
          <div class="kpi-val" style="font-size: 10.5pt; color: #7c3aed;">฿${(kpiMetrics.kpiImpact / 1000000).toFixed(2)}M</div>
          <div class="kpi-sub">(30) x 7.5 เท่า</div>
        </div>

        <div class="kpi-card kpi-highlight-amber">
          <div class="kpi-label">
            <span>(34) พึงพอใจ</span>
            <span style="color: #d97706;">★ ${kpiMetrics.avgScore}</span>
          </div>
          <div class="kpi-val" style="color: #d97706;">${kpiMetrics.satisfactionPercentage}%</div>
          <div class="kpi-sub">ส่ง ${kpiMetrics.sentCount} / ตอบ ${kpiMetrics.evaluatedCount}</div>
        </div>
      </div>

      <!-- Table 1: Dataset Records (Fits completely on Page 1) -->
      <div style="font-weight: 700; font-size: 8.5pt; color: #334155; margin-top: 4px; margin-bottom: 2px;">
        ตารางรายชื่อผู้รับบริการและการประเมินความพึงพอใจ (${records.length} รายการ):
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 22px;" class="text-center">#</th>
            <th style="width: 75px;">รหัสงาน</th>
            <th style="width: 68px;" class="text-center">วันที่</th>
            <th>ผู้รับบริการ / สถานประกอบการ</th>
            <th style="width: 45px;" class="text-center">ภาคส่วน</th>
            <th style="width: 85px;">ประเภทธุรกิจ</th>
            <th style="width: 95px;">ประเภทบริการ</th>
            <th style="width: 48px;" class="text-center">จำนวน</th>
            <th style="width: 72px;" class="text-right">รายได้</th>
            <th style="width: 58px;" class="text-center">ประเมิน</th>
          </tr>
        </thead>
        <tbody>
          ${records.length === 0 ? '<tr><td colspan="10" class="text-center" style="padding: 12px; color: #94a3b8;">ไม่มีข้อมูลตามเงื่อนไขที่เลือก</td></tr>' : ''}
          ${records.map((r, idx) => {
            const serviceName = serviceLabels[r.serviceMain] || r.serviceMain || '-';
            const businessName = businessLabels[r.businessType] || r.businessType || '-';
            const sectorName = r.organizationType === 'private' ? 'เอกชน' : 'รัฐ';
            const scoreHtml = typeof r.satisfactionScore === 'number' 
              ? `<span style="color: #059669; font-weight: 700;">★ ${r.satisfactionScore.toFixed(1)}</span>` 
              : `<span style="color: #94a3b8;">${r.surveySent ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}</span>`;
            const unitText = r.serviceMain === 'consultation' ? 'ครั้ง' : 'ชิ้น';

            return `<tr>
              <td class="text-center" style="font-size: 7pt; color: #64748b;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a;">${escapeHtml(r.code)}</td>
              <td class="text-center" style="color: #475569;">${escapeHtml(r.date)}</td>
              <td>
                <div class="font-bold" style="color: #0f172a;">${escapeHtml(r.companyName || r.clientName)}</div>
                <div style="font-size: 7pt; color: #64748b;">คุณ${escapeHtml(r.clientName)}</div>
              </td>
              <td class="text-center"><span style="padding: 1px 4px; border-radius: 4px; font-size: 7pt; background: ${r.organizationType === 'private' ? '#f3e8ff; color: #7e22ce;' : '#eff6ff; color: #1d4ed8;'}">${sectorName}</span></td>
              <td>${businessName}</td>
              <td>${serviceName}</td>
              <td class="text-center font-bold">${r.pieceCount || 1} ${unitText}</td>
              <td class="text-right currency-num" style="color: #047857;">฿${Number(r.revenue || 0).toLocaleString()}</td>
              <td class="text-center">${scoreHtml}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Page 1 Footer -->
    <div class="page-footer">
      <div>รายงานศูนย์ออกแบบนวัตกรรม (IDC) • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
      <div>หน้า 1 จาก 4 (ส่วนที่ 1: ชุดข้อมูล 5 Core KPIs)</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: ส่วนที่ 2 โครงการ PM งานออกแบบ & ผลการดำเนินงานทางการเงิน           -->
  <!-- ========================================================================= -->
  <div class="pdf-page">
    <div class="page-content">
      <!-- Mini Header Bar -->
      <div class="page-top-bar">
        <div><strong>ศูนย์ออกแบบนวัตกรรม (IDC)</strong> • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
        <div>ช่วงเวลา: ${filterText} | หน้า 2 จาก 4</div>
      </div>

      <!-- Section Title -->
      <div class="section-title">
        <span class="section-badge">ส่วนที่ 2</span>
        <span>โครงการ PM งานออกแบบ (Design PM Projects &amp; Financials)</span>
      </div>

      <!-- 5 Financial Cards (Single Row) -->
      <div class="kpi-grid-5">
        <div class="kpi-card kpi-highlight-emerald">
          <div class="kpi-label">รายรับรวม PM</div>
          <div class="kpi-val" style="font-size: 11pt; color: #047857;">฿${pmFinancialSummary.totalRevenue.toLocaleString()}</div>
          <div class="kpi-sub">เฉลี่ย ฿${pmFinancialSummary.avgRevenuePerProject.toLocaleString()}/งาน</div>
        </div>

        <div class="kpi-card kpi-highlight-orange">
          <div class="kpi-label">ต้นทุนรวม</div>
          <div class="kpi-val" style="font-size: 11pt; color: #c2410c;">฿${pmFinancialSummary.totalCost.toLocaleString()}</div>
          <div class="kpi-sub">สัดส่วน ${pmFinancialSummary.totalRevenue > 0 ? ((pmFinancialSummary.totalCost / pmFinancialSummary.totalRevenue) * 100).toFixed(1) : 0}%</div>
        </div>

        <div class="kpi-card kpi-highlight-emerald">
          <div class="kpi-label">กำไรสุทธิรวม</div>
          <div class="kpi-val" style="font-size: 11pt; color: #059669;">฿${pmFinancialSummary.totalProfit.toLocaleString()}</div>
          <div class="kpi-sub">กำไรบริหารจัดการ</div>
        </div>

        <div class="kpi-card kpi-highlight-purple">
          <div class="kpi-label">Margin รวม</div>
          <div class="kpi-val" style="font-size: 11pt; color: #7c3aed;">${pmFinancialSummary.profitMarginPercent}%</div>
          <div class="kpi-sub">เป้าหมาย &gt; 60%</div>
        </div>

        <div class="kpi-card kpi-highlight-blue">
          <div class="kpi-label">จำนวนโครงการ</div>
          <div class="kpi-val" style="font-size: 11pt; color: #1d4ed8;">${pmFinancialSummary.projectCount} งาน</div>
          <div class="kpi-sub">เสร็จ ${pmFinancialSummary.completedCount} / ทำ ${pmFinancialSummary.inProgressCount}</div>
        </div>
      </div>

      <!-- Table 2: PM Design Projects -->
      <div style="font-weight: 700; font-size: 8.5pt; color: #334155; margin-top: 4px; margin-bottom: 2px;">
        ตารางสรุปรายได้และสถานะโครงการ PM งานออกแบบ (${designPmProjects.length} โครงการ):
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 22px;" class="text-center">#</th>
            <th style="width: 80px;">รหัส PM</th>
            <th>ชื่องานโครงการ PM</th>
            <th style="width: 90px;">บริการย่อย</th>
            <th style="width: 45px;" class="text-center">ภาคส่วน</th>
            <th style="width: 80px;">ผู้รับผิดชอบ</th>
            <th style="width: 68px;" class="text-right">รายรับ</th>
            <th style="width: 62px;" class="text-right">ต้นทุน</th>
            <th style="width: 68px;" class="text-right">กำไรสุทธิ</th>
            <th style="width: 48px;" class="text-center">Margin</th>
            <th style="width: 62px;" class="text-center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          ${designPmProjects.length === 0 ? '<tr><td colspan="11" class="text-center" style="padding: 12px; color: #94a3b8;">ไม่มีข้อมูลโครงการ PM ตามเงื่อนไขที่เลือก</td></tr>' : ''}
          ${designPmProjects.map((b, idx) => {
            const code = b.details?.project_code || `PM-CC-${idx + 1}`;
            const rev = Number(b.details?.revenue) || 0;
            const cost = Number(b.details?.cost) || 0;
            const profit = b.details?.profit !== undefined && b.details?.profit !== null && b.details?.profit !== "" 
              ? Number(b.details?.profit) 
              : (rev - cost);
            const margin = rev > 0 ? ((profit / rev) * 100).toFixed(0) : "0";
            const category = b.details?.pm_work_category || b.details?.service_category || b.details?.category || 'Design';
            const sector = b.details?.client_sector === 'government' || code.includes('GOV') ? 'รัฐ' : 'เอกชน';
            const assigneeName = b.coordinator_nickname || '-';
            const statusText = b.status === 'completed' ? 'เสร็จสิ้น' : b.status === 'in_progress' ? 'กำลังทำ' : 'รอดำเนินการ';
            const statusColor = b.status === 'completed' ? '#059669' : b.status === 'in_progress' ? '#2563eb' : '#64748b';

            return `<tr>
              <td class="text-center" style="font-size: 7pt; color: #64748b;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a;">${escapeHtml(code)}</td>
              <td class="font-bold" style="color: #0f172a;">${escapeHtml(b.project_name || '-')}</td>
              <td>${escapeHtml(category)}</td>
              <td class="text-center"><span style="padding: 1px 4px; border-radius: 4px; font-size: 7pt; background: ${sector === 'เอกชน' ? '#f3e8ff; color: #7e22ce;' : '#eff6ff; color: #1d4ed8;'}">${sector}</span></td>
              <td>${escapeHtml(assigneeName)}</td>
              <td class="text-right currency-num">฿${rev.toLocaleString()}</td>
              <td class="text-right currency-num" style="color: #64748b;">฿${cost.toLocaleString()}</td>
              <td class="text-right currency-num" style="color: #047857;">฿${profit.toLocaleString()}</td>
              <td class="text-center font-bold" style="color: #7c3aed;">${margin}%</td>
              <td class="text-center"><span style="color: ${statusColor}; font-weight: 700;">${statusText}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <!-- Financial Summary Box -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt;">
        <div><strong>สรุปตัวเลขรวมโครงการ PM:</strong> ทั้งหมด ${pmFinancialSummary.projectCount} งาน (เสร็จสมบูรณ์ ${pmFinancialSummary.completedCount} งาน)</div>
        <div style="display: flex; gap: 14px;">
          <span>รายรับ: <strong class="currency-num">฿${pmFinancialSummary.totalRevenue.toLocaleString()}</strong></span>
          <span>ต้นทุน: <strong class="currency-num" style="color: #c2410c;">฿${pmFinancialSummary.totalCost.toLocaleString()}</strong></span>
          <span>กำไรสุทธิ: <strong class="currency-num" style="color: #047857;">฿${pmFinancialSummary.totalProfit.toLocaleString()}</strong></span>
          <span>Margin: <strong style="color: #7c3aed;">${pmFinancialSummary.profitMarginPercent}%</strong></span>
        </div>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <div class="page-footer">
      <div>รายงานศูนย์ออกแบบนวัตกรรม (IDC) • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
      <div>หน้า 2 จาก 4 (ส่วนที่ 2: โครงการ PM งานออกแบบ)</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: ส่วนที่ 3 แดชบอร์ด & การประเมินสภาวะแวดล้อม SWOT Analysis (4 มิติ)   -->
  <!-- ========================================================================= -->
  <div class="pdf-page">
    <div class="page-content">
      <!-- Mini Header Bar -->
      <div class="page-top-bar">
        <div><strong>ศูนย์ออกแบบนวัตกรรม (IDC)</strong> • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
        <div>ช่วงเวลา: ${filterText} | หน้า 3 จาก 4</div>
      </div>

      <!-- Section Title -->
      <div class="section-title">
        <span class="section-badge">ส่วนที่ 3</span>
        <span>แดชบอร์ด &amp; การประเมินสภาวะแวดล้อมเชิงกลยุทธ์ (SWOT Analysis 4 มิติ)</span>
      </div>

      <!-- 4 Strategic Overview Cards (Single Row) -->
      <div class="kpi-grid-4">
        <div class="kpi-card">
          <div class="kpi-label">ความสำเร็จโครงการ</div>
          <div class="kpi-val" style="font-size: 11pt; color: #047857;">${kpiMetrics.completedCount} / ${kpiMetrics.kpiClients} งาน</div>
          <div class="kpi-sub">อัตราสำเร็จ ${kpiMetrics.kpiClients > 0 ? Math.round((kpiMetrics.completedCount / kpiMetrics.kpiClients) * 100) : 0}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">สัดส่วนตลาด (เอกชน vs รัฐ)</div>
          <div class="kpi-val" style="font-size: 11pt; color: #1d4ed8;">${swotAndTowsAnalysis.privatePct}% : ${swotAndTowsAnalysis.govPct}%</div>
          <div class="kpi-sub">เอกชน ${swotAndTowsAnalysis.privateRecords} ราย / รัฐ ${swotAndTowsAnalysis.govRecords} ราย</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">คลัสเตอร์ดีมานด์สูงสุด</div>
          <div class="kpi-val" style="font-size: 10pt; color: #0f172a;">${swotAndTowsAnalysis.topClusterName}</div>
          <div class="kpi-sub">สัดส่วน ${swotAndTowsAnalysis.topClusterPct}% ของผู้รับบริการ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">บริการยอดนิยมสูงสุด</div>
          <div class="kpi-val" style="font-size: 10pt; color: #7c3aed;">${swotAndTowsAnalysis.topServiceName}</div>
          <div class="kpi-sub">สัดส่วน ${swotAndTowsAnalysis.topServicePct}% ของงานทั้งหมด</div>
        </div>
      </div>

      <!-- SWOT 4 Quadrants Grid -->
      <div style="font-weight: 700; font-size: 8.5pt; color: #0f172a; margin-top: 4px; margin-bottom: 5px;">
        การวิเคราะห์สภาวะแวดล้อมเชิงกลยุทธ์ (SWOT Analysis สังเคราะห์ 3 มิติข้อมูลสด):
      </div>

      <div class="quadrant-grid">
        <!-- S: Strengths -->
        <div class="quadrant-box s-box">
          <div class="quadrant-head" style="color: #065f46;">
            <span>S - Strengths (จุดแข็งภายใน)</span>
            <span style="font-size: 7.5pt; font-weight: normal;">มาตรฐาน &amp; ความเชี่ยวชาญ</span>
          </div>
          ${swotAndTowsAnalysis.strengths.map(s => `
            <div class="quadrant-item">
              <div class="quadrant-item-title">
                <span>[${s.id}] ${escapeHtml(s.title)}</span>
                <span class="quadrant-badge" style="background: #d1fae5; color: #065f46;">${escapeHtml(s.metric)}</span>
              </div>
              <div style="color: #475569;">${escapeHtml(s.desc)}</div>
            </div>
          `).join('')}
        </div>

        <!-- W: Weaknesses -->
        <div class="quadrant-box w-box">
          <div class="quadrant-head" style="color: #9f1239;">
            <span>W - Weaknesses (จุดอ่อนภายใน)</span>
            <span style="font-size: 7.5pt; font-weight: normal;">ข้อจำกัด &amp; คอขวด</span>
          </div>
          ${swotAndTowsAnalysis.weaknesses.map(w => `
            <div class="quadrant-item">
              <div class="quadrant-item-title">
                <span>[${w.id}] ${escapeHtml(w.title)}</span>
                <span class="quadrant-badge" style="background: #ffe4e6; color: #9f1239;">${escapeHtml(w.metric)}</span>
              </div>
              <div style="color: #475569;">${escapeHtml(w.desc)}</div>
            </div>
          `).join('')}
        </div>

        <!-- O: Opportunities -->
        <div class="quadrant-box o-box">
          <div class="quadrant-head" style="color: #1e40af;">
            <span>O - Opportunities (โอกาสภายนอก)</span>
            <span style="font-size: 7.5pt; font-weight: normal;">ตลาด &amp; นโยบายรัฐ</span>
          </div>
          ${swotAndTowsAnalysis.opportunities.map(o => `
            <div class="quadrant-item">
              <div class="quadrant-item-title">
                <span>[${o.id}] ${escapeHtml(o.title)}</span>
                <span class="quadrant-badge" style="background: #dbeafe; color: #1e40af;">${escapeHtml(o.metric)}</span>
              </div>
              <div style="color: #475569;">${escapeHtml(o.desc)}</div>
            </div>
          `).join('')}
        </div>

        <!-- T: Threats -->
        <div class="quadrant-box t-box">
          <div class="quadrant-head" style="color: #92400e;">
            <span>T - Threats (อุปสรรคภายนอก)</span>
            <span style="font-size: 7.5pt; font-weight: normal;">การแข่งขัน &amp; ความเสี่ยง</span>
          </div>
          ${swotAndTowsAnalysis.threats.map(t => `
            <div class="quadrant-item">
              <div class="quadrant-item-title">
                <span>[${t.id}] ${escapeHtml(t.title)}</span>
                <span class="quadrant-badge" style="background: #fef3c7; color: #92400e;">${escapeHtml(t.metric)}</span>
              </div>
              <div style="color: #475569;">${escapeHtml(t.desc)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Page 3 Footer -->
    <div class="page-footer">
      <div>รายงานศูนย์ออกแบบนวัตกรรม (IDC) • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
      <div>หน้า 3 จาก 4 (ส่วนที่ 3: แดชบอร์ด &amp; การวิเคราะห์ SWOT Analysis)</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: เมทริกซ์กลยุทธ์ TOWS Strategic Matrix (4 ทิศทาง) & การรับรอง          -->
  <!-- ========================================================================= -->
  <div class="pdf-page">
    <div class="page-content">
      <!-- Mini Header Bar -->
      <div class="page-top-bar">
        <div><strong>ศูนย์ออกแบบนวัตกรรม (IDC)</strong> • ทีมสร้างสรรค์และการสื่อสาร (STeP)</div>
        <div>ช่วงเวลา: ${filterText} | หน้า 4 จาก 4</div>
      </div>

      <!-- Section Title -->
      <div class="section-title">
        <span class="section-badge">กลยุทธ์</span>
        <span>เมทริกซ์กำหนดทิศทางกลยุทธ์เชิงปฏิบัติการ TOWS Strategic Matrix (4 ทิศทาง)</span>
      </div>

      <!-- TOWS 4 Boxes (2x2 Grid) -->
      <div class="quadrant-grid" style="gap: 8px;">
        <!-- SO Strategy -->
        <div class="tows-strategy-box so-style">
          <div style="font-family: 'Prompt', sans-serif; font-weight: 700; color: #065f46; font-size: 8.5pt;">
            ${escapeHtml(swotAndTowsAnalysis.tows.so.strategy)}
          </div>
          <div style="font-size: 7.5pt; color: #059669; margin-bottom: 4px;">${escapeHtml(swotAndTowsAnalysis.tows.so.theme)}</div>
          ${swotAndTowsAnalysis.tows.so.tactics.map(t => `
            <div class="tactic-block">
              <div style="font-weight: 700; color: #0f172a;">[${t.code}] ${escapeHtml(t.title)}</div>
              <div style="color: #475569; margin-top: 1px;">${escapeHtml(t.detail)}</div>
              <div style="color: #059669; font-size: 7pt; font-weight: 600; margin-top: 2px;">• เป้าหมาย: ${escapeHtml(t.target)}</div>
            </div>
          `).join('')}
        </div>

        <!-- WO Strategy -->
        <div class="tows-strategy-box wo-style">
          <div style="font-family: 'Prompt', sans-serif; font-weight: 700; color: #1e40af; font-size: 8.5pt;">
            ${escapeHtml(swotAndTowsAnalysis.tows.wo.strategy)}
          </div>
          <div style="font-size: 7.5pt; color: #2563eb; margin-bottom: 4px;">${escapeHtml(swotAndTowsAnalysis.tows.wo.theme)}</div>
          ${swotAndTowsAnalysis.tows.wo.tactics.map(t => `
            <div class="tactic-block">
              <div style="font-weight: 700; color: #0f172a;">[${t.code}] ${escapeHtml(t.title)}</div>
              <div style="color: #475569; margin-top: 1px;">${escapeHtml(t.detail)}</div>
              <div style="color: #2563eb; font-size: 7pt; font-weight: 600; margin-top: 2px;">• เป้าหมาย: ${escapeHtml(t.target)}</div>
            </div>
          `).join('')}
        </div>

        <!-- ST Strategy -->
        <div class="tows-strategy-box st-style">
          <div style="font-family: 'Prompt', sans-serif; font-weight: 700; color: #92400e; font-size: 8.5pt;">
            ${escapeHtml(swotAndTowsAnalysis.tows.st.strategy)}
          </div>
          <div style="font-size: 7.5pt; color: #d97706; margin-bottom: 4px;">${escapeHtml(swotAndTowsAnalysis.tows.st.theme)}</div>
          ${swotAndTowsAnalysis.tows.st.tactics.map(t => `
            <div class="tactic-block">
              <div style="font-weight: 700; color: #0f172a;">[${t.code}] ${escapeHtml(t.title)}</div>
              <div style="color: #475569; margin-top: 1px;">${escapeHtml(t.detail)}</div>
              <div style="color: #d97706; font-size: 7pt; font-weight: 600; margin-top: 2px;">• เป้าหมาย: ${escapeHtml(t.target)}</div>
            </div>
          `).join('')}
        </div>

        <!-- WT Strategy -->
        <div class="tows-strategy-box wt-style">
          <div style="font-family: 'Prompt', sans-serif; font-weight: 700; color: #9f1239; font-size: 8.5pt;">
            ${escapeHtml(swotAndTowsAnalysis.tows.wt.strategy)}
          </div>
          <div style="font-size: 7.5pt; color: #e11d48; margin-bottom: 4px;">${escapeHtml(swotAndTowsAnalysis.tows.wt.theme)}</div>
          ${swotAndTowsAnalysis.tows.wt.tactics.map(t => `
            <div class="tactic-block">
              <div style="font-weight: 700; color: #0f172a;">[${t.code}] ${escapeHtml(t.title)}</div>
              <div style="color: #475569; margin-top: 1px;">${escapeHtml(t.detail)}</div>
              <div style="color: #e11d48; font-size: 7pt; font-weight: 600; margin-top: 2px;">• เป้าหมาย: ${escapeHtml(t.target)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Signatures and Verification Block -->
      <div class="signature-grid">
        <div class="signature-box">
          <div>จัดทำและรายงานโดย</div>
          <div class="signature-line"></div>
          <div style="font-weight: 700; color: #0f172a;">( ทีมสร้างสรรค์และการสื่อสาร )</div>
          <div>Creative and Communication Unit</div>
          <div>อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่</div>
        </div>

        <div class="signature-box">
          <div>รับทราบและอนุมัติรายงาน</div>
          <div class="signature-line"></div>
          <div style="font-weight: 700; color: #0f172a;">( ผู้อำนวยการอุทยานวิทยาศาสตร์และเทคโนโลยี )</div>
          <div>มหาวิทยาลัยเชียงใหม่ (STeP)</div>
          <div>วันที่ ...... / ...... / ...........</div>
        </div>
      </div>
    </div>

    <!-- Page 4 Footer -->
    <div class="page-footer">
      <div>รายงานฉบับสมบูรณ์รับรองโดยระบบ CC Management System 2027 • STeP</div>
      <div>หน้า 4 จาก 4 (เมทริกซ์กำหนดทิศทางกลยุทธ์ TOWS &amp; การรับรอง)</div>
    </div>
  </div>

  <script>
    // Auto trigger print dialog after window loads
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('กรุณาอนุญาตป๊อปอัป (Allow Popups) ในเบราว์เซอร์ เพื่อพิมพ์หรือบันทึกเอกสาร PDF');
  }
}
