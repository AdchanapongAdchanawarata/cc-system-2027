/**
 * PDF Export Utility for CC Job Briefs
 * Generates an official, beautifully formatted A4 print/PDF document
 * with crisp Thai typography, formal signatures, and Save to PDF capabilities.
 */

import { parseMemberRecord } from '@/utils/memberProfile';
import { OFFICIAL_STEP_TEAMS } from '@/utils/teamAnalytics';

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportBriefToPdf(options: {
  brief: any;
  assignees: any[];
  taskCode: string;
  currentCategory: string;
  currentSaveCost: number;
}) {
  const { brief, assignees, taskCode, currentCategory, currentSaveCost } = options;
  const unit = (brief.unit || 'creative').toLowerCase();
  const unitName = unit === 'creative' ? 'Creative Design' : unit === 'content' ? 'Creative Content' : unit === 'pr' ? 'Public Relations (PR)' : 'Internal & Project Management';
  const unitColor = unit === 'creative' ? '#8b5cf6' : unit === 'content' ? '#ec4899' : unit === 'pr' ? '#1877F2' : '#27272a';

  const assigneeObj = assignees.find((a: any) => a.id === brief.assignee_id);
  const profile = assigneeObj ? parseMemberRecord(assigneeObj) : null;
  const assigneeName = assigneeObj ? assigneeObj.name : (brief.assignee_name || '-');
  const assigneeFullName = profile?.fullName || assigneeObj?.name || brief.assignee_name || '-';
  const assigneePosition = profile?.position || 'ผู้รับผิดชอบงานฝ่าย Creative and Communication';
  const assigneePhone = (profile?.phone && profile.phone !== '-') ? profile.phone : '-';
  const assigneeEmail = profile?.email || profile?.cmuEmail || '-';

  // Gender detection for polite particle (ครับ / ค่ะ)
  const nameToCheck = `${assigneeFullName} ${assigneeName}`.trim();
  let politeParticle = 'ค่ะ'; // Default to ค่ะ (majority of CC team members are female)
  if (
    nameToCheck.startsWith('นาย') || 
    nameToCheck.includes('นาย') || 
    nameToCheck.includes('Mr.') || 
    nameToCheck.includes('Mr ') ||
    ['จ๊อบ', 'ก้อง', 'อัจชนะพงษ์', 'อิศรา'].some(maleKeyword => nameToCheck.includes(maleKeyword))
  ) {
    politeParticle = 'ครับ';
  } else if (
    nameToCheck.startsWith('นางสาว') || 
    nameToCheck.startsWith('นาง') || 
    nameToCheck.includes('นางสาว') || 
    nameToCheck.includes('นาง') || 
    nameToCheck.includes('Ms.') || 
    nameToCheck.includes('Mrs.')
  ) {
    politeParticle = 'ค่ะ';
  }

  const statusLabels: Record<string, string> = {
    pending: '⏳ Pending (รอทำ)',
    in_progress: '⚡ In Progress (กำลังทำ)',
    completed: '✅ Completed (เสร็จสิ้น)',
    cancelled: '❌ Cancelled (ยกเลิก)'
  };
  const statusLabel = statusLabels[brief.status] || brief.status || 'Pending';

  const priorityLabels: Record<string, string> = {
    High: '🔥 High (สูงมาก)',
    Medium: '⚡ Medium (ปานกลาง)',
    Low: '☕ Low (ปกติ)'
  };
  const priorityLabel = priorityLabels[brief.priority] || brief.priority || 'Medium';

  const assistants = brief.details?.assistants || [];
  const org = brief.details?.organization || 'STeP';
  const requesterName = brief.coordinator_nickname || brief.requester_name || '-';
  
  // Resolving requester team properly from decision_maker, details.team, etc.
  const rawTeam = (brief.decision_maker || brief.details?.team || brief.team || brief.details?.requester_team || "").toString().trim();
  const matchedTeam = OFFICIAL_STEP_TEAMS.find((t: any) => 
    t.abbr.toUpperCase() === rawTeam.toUpperCase() || 
    rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + " ") ||
    rawTeam.toUpperCase().startsWith(t.abbr.toUpperCase() + "-") ||
    t.th === rawTeam ||
    rawTeam.includes(t.th)
  );
  const requesterTeam = matchedTeam ? `${matchedTeam.abbr} - ${matchedTeam.th}` : (rawTeam || 'STeP');

  const requesterPhone = brief.requester_phone || brief.details?.requester_phone || '-';
  const requesterEmail = brief.requester_email || '-';
  const deadline = brief.deadline ? String(brief.deadline).split('T')[0] : '-';
  const createdAt = new Date(brief.created_at || Date.now()).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const printDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Collect Unit-Specific Rows
  const detailRows: { label: string; value: any }[] = [
    { label: 'ประเภทงาน (Service / Category)', value: currentCategory || '-' },
    { label: 'สังกัดหน่วยงาน (Organization)', value: org }
  ];

  if (unit === 'creative') {
    if (brief.details?.draft_date) detailRows.push({ label: 'วันที่ต้องการดราฟแรก (Draft Date)', value: brief.details.draft_date });
    if (brief.details?.usage_date) detailRows.push({ label: 'วันที่ใช้งานจริง (Usage Date)', value: brief.details.usage_date });
    if (brief.details?.objective) detailRows.push({ label: 'วัตถุประสงค์ (Objective)', value: brief.details.objective });
    if (brief.details?.target_audience) detailRows.push({ label: 'กลุ่มเป้าหมาย (Target Audience)', value: brief.details.target_audience });
    if (brief.details?.content_text || brief.details?.notes) detailRows.push({ label: 'เนื้อหาที่จะใส่ในงาน (Content Text)', value: brief.details.content_text || brief.details.notes });
    if (brief.details?.colors) detailRows.push({ label: 'โทนสีที่ต้องการ (Colors)', value: brief.details.colors });
    if (brief.details?.must_haves) detailRows.push({ label: 'สิ่งที่ต้องมีในงาน (Must Haves)', value: brief.details.must_haves });
    if (brief.details?.must_not_haves) detailRows.push({ label: 'สิ่งที่ไม่ต้องการ / ห้ามมี (Must Not Haves)', value: brief.details.must_not_haves });
  } else if (unit === 'content') {
    if (brief.details?.publish_date) detailRows.push({ label: 'กำหนดการเผยแพร่ผลงาน (Publish Date)', value: brief.details.publish_date });
    if (brief.details?.details || brief.details?.description) detailRows.push({ label: 'รายละเอียดงานโดยสังเขป (Content Details)', value: brief.details.details || brief.details.description });
  } else if (unit === 'pr') {
    if (brief.details?.event_datetime) detailRows.push({ label: 'วันและเวลาจัดกิจกรรม (Event Date/Time)', value: brief.details.event_datetime });
    if (brief.details?.publish_date) detailRows.push({ label: 'วันที่เผยแพร่ข่าว (Publish Date)', value: brief.details.publish_date });
    if (brief.details?.location) detailRows.push({ label: 'สถานที่จัดงาน (Location)', value: brief.details.location });
    if (brief.details?.key_persons) detailRows.push({ label: 'บุคคลสำคัญที่เกี่ยวข้อง (Key Persons)', value: brief.details.key_persons });
    if (brief.details?.photo_source) detailRows.push({ label: 'แหล่งที่มาของภาพข่าว (Photo Source)', value: brief.details.photo_source });
    if (brief.details?.details || brief.details?.description) detailRows.push({ label: 'รายละเอียดกิจกรรมโดยสังเขป (Event Details)', value: brief.details.details || brief.details.description });
  } else if (unit === 'internal') {
    if (brief.details?.details || brief.details?.description) detailRows.push({ label: 'รายละเอียดงานภายใน (Task Details)', value: brief.details.details || brief.details.description });
    if (brief.details?.project_code) detailRows.push({ label: 'โค้ดโครงการ (Project Code)', value: brief.details.project_code });
    if (brief.details?.client_sector) detailRows.push({ label: 'ประเภทบริการ (Client Sector)', value: brief.details.client_sector === 'government' ? '🏛️ ภาครัฐ' : '🏢 ภาคเอกชน' });
    if (brief.details?.revenue) detailRows.push({ label: 'รายรับ (Revenue)', value: `฿${Number(brief.details.revenue).toLocaleString()}` });
    if (brief.details?.cost) detailRows.push({ label: 'ต้นทุน (Cost)', value: `฿${Number(brief.details.cost).toLocaleString()}` });
    if (brief.details?.profit) detailRows.push({ label: 'กำไร (Profit)', value: `฿${Number(brief.details.profit).toLocaleString()}` });
  }

  if (brief.notes || (brief.details?.notes && brief.details?.notes !== brief.details?.content_text)) {
    detailRows.push({ label: 'หมายเหตุเพิ่มเติม (Notes)', value: brief.notes || brief.details?.notes });
  }

  // Satisfaction Survey
  const scores = brief.details?.satisfaction_scores;
  const isCompleted = brief.status === 'completed' || brief.status === 'complete';
  const hasEvaluated = Boolean(
    brief.details?.survey_status === 'completed' || 
    (scores?.averagePercent !== undefined && scores?.averagePercent !== null) ||
    (scores && typeof scores.accuracy === 'number')
  );
  const currentPercent = scores?.averagePercent ?? (brief.details?.satisfaction_rate ?? 85.0);

  const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(taskCode)} - ${escapeHtml(brief.project_name || 'CC Job Brief')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.5;
    }
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: #0f172a;
      color: #fff;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-family: 'Prompt', sans-serif;
      font-size: 13px;
      font-weight: 600;
      border-radius: 9999px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #e03131;
      color: #fff;
    }
    .btn-primary:hover {
      background: #c92a2a;
    }
    .btn-secondary {
      background: #334155;
      color: #fff;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .page-container {
      max-width: 820px;
      margin: 24px auto;
      background: #fff;
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    @media print {
      body {
        background: #fff;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        max-width: 100% !important;
      }
      .avoid-break {
        page-break-inside: avoid;
      }
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .org-title {
      font-family: 'Prompt', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .org-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .badges {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-family: 'Prompt', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .badge-code {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      font-family: monospace;
      font-size: 12px;
    }
    .badge-unit {
      background: ${unitColor};
      color: #fff;
    }
    .badge-cat {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* Project Title */
    .project-name {
      font-family: 'Prompt', sans-serif;
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 18px;
      padding: 10px 14px;
      background: #f8fafc;
      border-left: 4px solid ${unitColor};
      border-radius: 0 8px 8px 0;
    }

    /* Two Columns Meta */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      padding: 14px 16px;
    }
    .card-title {
      font-family: 'Prompt', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .kv-label {
      color: #64748b;
      font-weight: 500;
    }
    .kv-val {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }

    /* Table Specification */
    .section-title {
      font-family: 'Prompt', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 18px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table.spec-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12.5px;
    }
    table.spec-table th, table.spec-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      vertical-align: top;
    }
    table.spec-table td.label-col {
      width: 32%;
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    table.spec-table td.val-col {
      width: 68%;
      color: #1e293b;
      white-space: pre-wrap;
    }

    /* Save Cost Box */
    .save-cost-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      margin-bottom: 20px;
    }
    .save-cost-amount {
      font-family: 'Prompt', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #15803d;
    }

    /* Sign-off section */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
    }
    .sig-line {
      margin-top: 45px;
      border-bottom: 1px solid #94a3b8;
      width: 80%;
      margin-left: auto;
      margin-right: auto;
    }
    .sig-role {
      font-family: 'Prompt', sans-serif;
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      font-weight: 500;
    }
    .footer-note {
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      margin-top: 24px;
    }
  </style>
</head>
<body>

  <!-- Screen Action Bar (Hidden when Printing) -->
  <div class="no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-family: 'Prompt', sans-serif; font-weight: 600; font-size: 14px;">📄 พิมพ์เอกสาร / บันทึกเป็น PDF (CC Job Brief)</span>
      <span style="font-size: 12px; color: #94a3b8;">(เลือกปลายทางเป็น "Save as PDF" หรือ "บันทึกเป็น PDF")</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ พิมพ์ / บันทึกเป็น PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✕ ปิดหน้าต่าง
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="main-title" style="font-family: 'Prompt', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px;">
          Brief Form
        </div>
        <div class="org-sub" style="font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500;">
          ทีม Creative and Communication (CC) • อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: 'Prompt', sans-serif; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">รหัสงาน (Task Code)</div>
        <div style="font-family: monospace, 'Prompt', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; margin-top: 2px;">
          ${escapeHtml(taskCode)}
        </div>
      </div>
    </div>

    <!-- Project Title -->
    <div class="project-name">
      ${escapeHtml(brief.project_name || 'ชื่องานไม่ได้ระบุ')}
    </div>

    <!-- Top Two Cards: CC Staff & Requester -->
    <div class="meta-grid">
      <!-- Left: CC Staff & Status -->
      <div class="card">
        <div class="card-title">CC STAFF &amp; STATUS</div>
        <div class="kv-row">
          <span class="kv-label">ผู้รับผิดชอบหลัก:</span>
          <span class="kv-val">${escapeHtml(assigneeName)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">สถานะงาน:</span>
          <span class="kv-val">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">ความสำคัญ (Priority):</span>
          <span class="kv-val">${escapeHtml(priorityLabel)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">กำหนดส่ง (Deadline):</span>
          <span class="kv-val">${escapeHtml(deadline)}</span>
        </div>
        ${assistants.length > 0 ? `
          <div style="border-top: 1px dashed #e2e8f0; margin-top: 8px; padding-top: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">ผู้ช่วยรับผิดชอบ:</div>
            ${assistants.map((ast: any) => {
              const aObj = assignees.find((a: any) => a.id === ast.assignee_id);
              const aName = aObj ? aObj.name : 'ผู้ช่วย';
              const baht = Math.round((currentSaveCost * (Number(ast.percentage) || 0)) / 100);
              return `<div class="kv-row" style="margin-bottom: 2px;">
                <span class="kv-label">• ${escapeHtml(aName)} (${ast.percentage}%):</span>
                <span class="kv-val" style="color: #15803d;">฿${baht.toLocaleString()}</span>
              </div>`;
            }).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Right: Requester -->
      <div class="card">
        <div class="card-title">REQUESTER (ผู้สั่งงาน)</div>
        <div class="kv-row">
          <span class="kv-label">ผู้ประสานงาน:</span>
          <span class="kv-val">${escapeHtml(requesterName)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">ทีมผู้สั่งงาน:</span>
          <span class="kv-val">${escapeHtml(requesterTeam)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">สังกัดหน่วยงาน:</span>
          <span class="kv-val" style="font-weight: 700; color: #d97706;">${escapeHtml(org)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">เบอร์โทรศัพท์:</span>
          <span class="kv-val">${escapeHtml(requesterPhone)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">อีเมล:</span>
          <span class="kv-val" style="font-size: 11px;">${escapeHtml(requesterEmail)}</span>
        </div>
      </div>
    </div>

    <!-- Brief Details Table -->
    <div class="section-title">
      📋 รายละเอียดงานตามแบบฟอร์มบรีฟ (${escapeHtml(unitName)})
    </div>
    <table class="spec-table">
      <tbody>
        ${detailRows.map(row => `
          <tr>
            <td class="label-col">${escapeHtml(row.label)}</td>
            <td class="val-col">${escapeHtml(row.value)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Attachments (if any) -->
    ${brief.details?.attachments && brief.details.attachments.length > 0 ? `
      <div class="avoid-break" style="margin-bottom: 16px;">
        <div class="section-title">📎 ไฟล์แนบและลิงก์ข้อมูลประกอบ</div>
        <table class="spec-table">
          <tbody>
            ${brief.details.attachments.map((url: string, idx: number) => `
              <tr>
                <td class="label-col">ไฟล์แนบที่ ${idx + 1}</td>
                <td class="val-col"><a href="${escapeHtml(url)}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${escapeHtml(url)}</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Satisfaction Survey (only if completed) -->
    ${isCompleted ? (
      hasEvaluated ? `
        <div class="avoid-break" style="margin-bottom: 16px;">
          <div class="section-title">⭐ ผลการประเมินความพึงพอใจการให้บริการ</div>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 11.5px; font-weight: 700; color: #065f46; background: #d1fae5; padding: 3px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                ✓ ทำแบบประเมินแล้ว (${currentPercent}%)
              </span>
              ${scores?.evaluatedBy ? `<span style="font-size: 11.5px; color: #92400e;">ประเมินโดย: ${escapeHtml(scores.evaluatedBy)}</span>` : ''}
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; margin-bottom: 8px;">
              <div style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #fef3c7;">
                <div style="font-size: 10px; color: #92400e;">ตรงตามบรีฟ</div>
                <div style="font-size: 15px; font-weight: 700; color: #b45309;">${scores?.accuracy ?? 5}/5 ⭐</div>
              </div>
              <div style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #fef3c7;">
                <div style="font-size: 10px; color: #92400e;">คุณภาพ/สร้างสรรค์</div>
                <div style="font-size: 15px; font-weight: 700; color: #b45309;">${scores?.quality ?? 5}/5 ⭐</div>
              </div>
              <div style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #fef3c7;">
                <div style="font-size: 10px; color: #92400e;">ความรวดเร็ว</div>
                <div style="font-size: 15px; font-weight: 700; color: #b45309;">${scores?.timeliness ?? 5}/5 ⭐</div>
              </div>
              <div style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #fef3c7;">
                <div style="font-size: 10px; color: #92400e;">การสื่อสาร</div>
                <div style="font-size: 15px; font-weight: 700; color: #b45309;">${scores?.attentiveness ?? 5}/5 ⭐</div>
              </div>
              <div style="background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #fef3c7;">
                <div style="font-size: 10px; color: #92400e;">ภาพรวม</div>
                <div style="font-size: 15px; font-weight: 700; color: #b45309;">${scores?.ownership ?? 5}/5 ⭐</div>
              </div>
            </div>
            ${scores?.comment ? `<div style="font-size: 12px; color: #78350f; font-style: italic; margin-top: 6px;">“${escapeHtml(scores.comment)}”</div>` : ''}
          </div>
        </div>
      ` : `
        <div class="avoid-break" style="margin-bottom: 16px;">
          <div class="section-title">⭐ ผลการประเมินความพึงพอใจการให้บริการ</div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 700; color: #1e40af; background: #dbeafe; padding: 3px 8px; border-radius: 9999px; border: 1px solid #bfdbfe;">
                ✉️ ส่งแบบประเมินแล้ว
              </span>
              <span style="font-size: 12px; color: #1e40af;">
                ส่งแบบประเมินเข้าอีเมลผู้สั่งงาน (${escapeHtml(requesterEmail || 'ผู้สั่งงาน')}) เรียบร้อยแล้ว (คิดเกณฑ์มาตรฐาน ${currentPercent}% ชั่วคราว)
              </span>
            </div>
          </div>
        </div>
      `
    ) : ''}

    <!-- Save Cost (มูลค่าที่ช่วยประหยัดให้องค์กร) - ด้านล่างสุด -->
    <div class="save-cost-card avoid-break">
      <div>
        <div style="font-family: 'Prompt', sans-serif; font-size: 13px; font-weight: 700; color: #166534;">
          💰 มูลค่าที่ช่วยประหยัดให้องค์กร (Save Cost)
        </div>
        <div style="font-size: 11px; color: #15803d; margin-top: 2px;">
          คำนวณตามอัตราค่าบริการมาตรฐานเปรียบเทียบตลาดของฝ่าย Creative and Communication (STeP)
        </div>
      </div>
      <div class="save-cost-amount">
        ฿${currentSaveCost.toLocaleString()}
      </div>
    </div>

    <!-- Bottom Left: Assignee Contact & Service Commitment -->
    <div class="avoid-break" style="margin-top: 24px; margin-bottom: 20px; display: flex; justify-content: flex-start;">
      <div style="max-width: 480px; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          ผู้รับผิดชอบงาน (Assignee Contact)
        </div>
        <div style="font-family: 'Prompt', sans-serif; font-size: 14px; font-weight: 700; color: #0f172a;">
          ${escapeHtml(assigneeFullName)}
        </div>
        ${assigneePosition ? `<div style="font-size: 11.5px; color: #475569; margin-top: 1px; margin-bottom: 8px;">${escapeHtml(assigneePosition)}</div>` : ''}
        
        <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #334155; margin-bottom: 10px;">
          ${assigneePhone && assigneePhone !== '-' ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #64748b; font-weight: 600;">เบอร์ติดต่อ:</span>
              <span style="font-weight: 600; color: #0f172a;">${escapeHtml(assigneePhone)}</span>
            </div>
          ` : ''}
          ${assigneeEmail && assigneeEmail !== '-' ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #64748b; font-weight: 600;">อีเมล:</span>
              <span style="color: #0f172a;">${escapeHtml(assigneeEmail)}</span>
            </div>
          ` : ''}
        </div>

        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-left: 3px solid #0284c7; padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 11.5px; color: #0369a1; line-height: 1.5;">
          ยินดีให้บริการและพร้อมทำงานนี้ให้อย่างเต็มที่ หากมีข้อสอบถามหรือต้องการปรับแก้เพิ่มเติม สามารถติดต่อได้โดยตรง${politeParticle}
        </div>
      </div>
    </div>


    <!-- Footer Note -->
    <div class="footer-note">
      เอกสารออกโดยระบบ CC Management System 2027 • พิมพ์เมื่อ ${printDate} • วันที่บันทึกคำสั่งงาน ${createdAt}
    </div>
  </div>

  <script>
    // Auto trigger print dialog after page renders
    window.addEventListener('load', function() {
      setTimeout(function() {
        document.title = "";
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
