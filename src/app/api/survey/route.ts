// src/app/api/survey/route.ts
// API สำหรับรับผลการประเมินความพึงพอใจ 5 มิติ (CC TEAM Satisfaction Survey)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveMemberFromToken } from '@/utils/surveyTokens';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper function สำหรับค้นหา Brief อย่างยืดหยุ่นและแม่นยำ
async function findTargetBrief(
  supabase: any,
  briefId?: string | null,
  projectName?: string | null,
  token?: string | null
) {
  // 1. ค้นหาด้วย briefId (UUID, Short Hex, หรือ Task Code เช่น PR70-2)
  if (briefId && briefId.trim()) {
    const trimmedId = briefId.trim();

    // 1.1 ตรวจสอบกรณีเป็น UUID เต็มรูปแบบ
    if (UUID_REGEX.test(trimmedId)) {
      const { data, error } = await supabase
        .from('briefs')
        .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
        .eq('id', trimmedId)
        .maybeSingle();
      if (!error && data) return data;
    }

    // 1.2 ตรวจสอบกรณีเป็น UUID Prefix (เช่น 8 ตัวอักษรขึ้นไป)
    if (/^[0-9a-f]{8}/i.test(trimmedId)) {
      const { data: prefixData } = await supabase
        .from('briefs')
        .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
        .ilike('id', `${trimmedId}%`)
        .order('created_at', { ascending: false })
        .limit(1);
      if (prefixData && prefixData.length > 0) return prefixData[0];
    }

    // 1.3 ค้นหาจาก details->>task_code หรือ job_code (แบบ case-insensitive)
    const upperCode = trimmedId.toUpperCase();
    const { data: codeData } = await supabase
      .from('briefs')
      .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
      .or(`details->>task_code.ilike.${trimmedId},details->>task_code.ilike.${upperCode},details->>job_code.ilike.${trimmedId},details->>job_code.ilike.${upperCode}`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (codeData && codeData.length > 0) return codeData[0];

    // 1.4 ค้นหาจาก survey_token ใน details
    const { data: tokenData } = await supabase
      .from('briefs')
      .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
      .eq('details->>survey_token', trimmedId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (tokenData && tokenData.length > 0) return tokenData[0];
  }

  // 2. ค้นหาด้วย projectName
  if (projectName && projectName.trim()) {
    const trimmedProject = projectName.trim();
    const { data: projData } = await supabase
      .from('briefs')
      .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
      .ilike('project_name', `%${trimmedProject}%`)
      .order('created_at', { ascending: false })
      .limit(5);
    if (projData && projData.length > 0) {
      // ให้ความสำคัญกับงานที่เสร็จแล้วและยังไม่ได้ประเมินก่อน
      const unevaluated = projData.find((b: any) => 
        (b.status === 'completed' || b.status === 'complete') && 
        !b.details?.satisfaction_scores?.averagePercent &&
        !b.details?.satisfaction_rate
      );
      return unevaluated || projData[0];
    }
  }

  // 3. ค้นหาด้วย Token ของสมาชิก
  if (token && token.trim()) {
    const trimmedToken = token.trim();
    // โหลดรายชื่อ assignees จาก settings
    const { data: settingRow } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'assignees')
      .maybeSingle();

    let assigneesList: any[] = [];
    if (settingRow?.value) {
      assigneesList = typeof settingRow.value === 'string'
        ? JSON.parse(settingRow.value)
        : settingRow.value;
    }

    const matchedMember = resolveMemberFromToken(trimmedToken, assigneesList);
    if (matchedMember) {
      // ค้นหางานล่าสุดของสมาชิกท่านนี้ที่สถานะ completed (สังเกต: briefs ไม่มีคอลัมน์ assignee ใช้เฉพาะ assignee_id)
      const { data: memberBriefs } = await supabase
        .from('briefs')
        .select('id, project_name, decision_maker, coordinator_nickname, details, status, assignee_id')
        .eq('assignee_id', matchedMember.id)
        .in('status', ['completed', 'complete'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (memberBriefs && memberBriefs.length > 0) {
        // เลือกงานที่ยังไม่มีผลประเมินก่อน
        const unevaluated = memberBriefs.find((b: any) => 
          !b.details?.satisfaction_scores?.averagePercent && 
          !b.details?.satisfaction_rate
        ) || memberBriefs[0];
        return unevaluated;
      }
    }
  }

  return null;
}

// GET: โหลดข้อมูลเบื้องต้นของงาน (ชื่องาน/สังกัด)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const briefId = searchParams.get('b') || searchParams.get('briefId');
    const token = searchParams.get('t') || searchParams.get('token');
    const projectName = searchParams.get('p') || searchParams.get('project');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 500 });
    }

    let projectInfo: any = {
      projectName: '',
      team: '',
      evaluatedBy: 'PM / ผู้ดูแลโครงการ',
      alreadyEvaluated: false,
      existingScores: null
    };

    const brief = await findTargetBrief(supabase, briefId, projectName, token);
    if (brief) {
      projectInfo.briefId = brief.id;
      projectInfo.projectName = brief.project_name || '';
      projectInfo.team = brief.decision_maker || brief.details?.team || '';
      projectInfo.evaluatedBy = brief.coordinator_nickname 
        ? `PM / คุณ${brief.coordinator_nickname}` 
        : 'PM / ผู้ดูแลโครงการ';

      if (brief.details?.satisfaction_scores?.averagePercent || brief.details?.survey_status === 'completed') {
        projectInfo.alreadyEvaluated = true;
        projectInfo.existingScores = brief.details.satisfaction_scores;
      }
    }

    return NextResponse.json({
      success: true,
      data: projectInfo
    });
  } catch (err: any) {
    console.error('Survey GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: บันทึกผลการประเมิน 5 มิติ และคำนวณคะแนนเฉลี่ย
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      briefId, 
      token, 
      scores, 
      comment, 
      evaluatedBy, 
      projectName,
      gender,
      stakeholderRole,
      needs,
      expectations,
      suggestions
    } = body;

    if (!scores) {
      return NextResponse.json({ success: false, error: 'Scores are required' }, { status: 400 });
    }

    const accuracy = Number(scores.accuracy) || 5;
    const timeliness = Number(scores.timeliness) || 5;
    const quality = Number(scores.quality) || 5;
    const attentiveness = Number(scores.attentiveness) || 5;
    const ownership = Number(scores.ownership) || 5;

    const totalPoints = accuracy + timeliness + quality + attentiveness + ownership;
    const averagePercent = Math.round((totalPoints / 25) * 100);
    const avgStar = Number((totalPoints / 5).toFixed(1));

    const finalFeedback = (suggestions || comment || '').trim();
    const finalEvaluator = (evaluatedBy || stakeholderRole || 'ผู้มีส่วนได้ส่วนเสีย / PM').trim();

    const evaluationData = {
      accuracy,
      timeliness,
      quality,
      attentiveness,
      ownership,
      averagePercent,
      gender: gender || 'ไม่ต้องการระบุ',
      stakeholderRole: stakeholderRole || evaluatedBy || 'พนักงาน',
      needs: (needs || '').trim(),
      expectations: (expectations || '').trim(),
      suggestions: (suggestions || '').trim(),
      comment: finalFeedback,
      evaluatedBy: finalEvaluator,
      evaluatedAt: new Date().toISOString(),
      status: 'completed' as const
    };

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 500 });
    }

    const targetBrief = await findTargetBrief(supabase, briefId, projectName, token);

    if (targetBrief) {
      const updatedDetails = {
        ...(targetBrief.details || {}),
        satisfaction_scores: evaluationData,
        satisfaction_rate: averagePercent,
        satisfaction_score: avgStar,
        survey_status: 'completed',
        satisfaction_evaluated_at: evaluationData.evaluatedAt,
        satisfaction_feedback: finalFeedback || 'พึงพอใจต่อการให้บริการ',
        survey_project_name_custom: projectName || undefined
      };

      const { error: updateError } = await supabase
        .from('briefs')
        .update({ details: updatedDetails })
        .eq('id', targetBrief.id);

      if (updateError) {
        console.error('Failed to update brief details in survey:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'บันทึกแบบประเมินความพึงพอใจสำเร็จเรียบร้อย',
        data: {
          briefId: targetBrief.id,
          averagePercent,
          totalPoints,
          evaluationData
        }
      });
    }

    // กรณีมีการระบุรหัสงาน (briefId) แต่ไม่พบในฐานข้อมูล ให้แจ้งเตือนชัดเจนเพื่อไม่ให้เกิดข้อมูลไม่ตรงกัน
    if (briefId) {
      console.warn(`[Survey API] Target brief not found in Supabase for briefId: "${briefId}"`);
      return NextResponse.json({
        success: false,
        error: `ไม่พบข้อมูลงานรหัส "${briefId}" ในระบบ กรุณาตรวจสอบรหัสงานหรือติดต่อผู้ดูแลระบบ`
      }, { status: 404 });
    }

    // กรณีเป็นแบบฟอร์มประเมินอิสระทั่วไป (ไม่ได้ระบุรหัสงาน)
    return NextResponse.json({
      success: true,
      message: 'บันทึกแบบประเมินสำเร็จ (แบบฟอร์มอิสระ)',
      data: {
        briefId: null,
        averagePercent,
        totalPoints,
        evaluationData
      }
    });

  } catch (err: any) {
    console.error('Survey submission error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
