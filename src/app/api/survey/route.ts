// src/app/api/survey/route.ts
// API สำหรับรับผลการประเมินความพึงพอใจ 5 มิติ (CC TEAM Satisfaction Survey)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveMemberFromToken } from '@/utils/surveyTokens';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// GET: โหลดข้อมูลเบื้องต้นของงาน (ชื่องาน/สังกัด) โดยไม่เปิดเผยชื่อผู้จัดทำ
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const briefId = searchParams.get('b');
    const token = searchParams.get('t');

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

    if (briefId) {
      const { data: brief, error } = await supabase
        .from('briefs')
        .select('id, project_name, decision_maker, coordinator_nickname, details, status')
        .eq('id', briefId)
        .single();

      if (!error && brief) {
        projectInfo.projectName = brief.project_name || '';
        projectInfo.team = brief.decision_maker || brief.details?.team || '';
        projectInfo.evaluatedBy = brief.coordinator_nickname 
          ? `PM / คุณ${brief.coordinator_nickname}` 
          : 'PM / ผู้ดูแลโครงการ';

        if (brief.details?.satisfaction_scores?.averagePercent) {
          projectInfo.alreadyEvaluated = true;
          projectInfo.existingScores = brief.details.satisfaction_scores;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: projectInfo
    });
  } catch (err: any) {
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
      comment: (suggestions || comment || '').trim(),
      evaluatedBy: (evaluatedBy || stakeholderRole || 'ผู้มีส่วนได้ส่วนเสีย').trim(),
      evaluatedAt: new Date().toISOString(),
      status: 'completed' as const
    };

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unconfigured' }, { status: 500 });
    }

    let targetBriefId = briefId;
    let targetAssigneeName = '';

    // กรณีมี briefId ระบุมาชัดเจน
    if (targetBriefId) {
      const { data: existingBrief } = await supabase
        .from('briefs')
        .select('id, details, assignee, assignee_id, project_name')
        .eq('id', targetBriefId)
        .single();

      if (existingBrief) {
        const updatedDetails = {
          ...(existingBrief.details || {}),
          satisfaction_scores: evaluationData,
          survey_status: 'completed'
        };

        await supabase
          .from('briefs')
          .update({ details: updatedDetails })
          .eq('id', targetBriefId);

        targetAssigneeName = existingBrief.assignee || '';
      }
    } 
    // กรณีมี token ของสมาชิกมา แต่ไม่มี briefId
    else if (token) {
      // โหลดรายชื่อ assignees จาก settings
      const { data: settingRow } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'assignees')
        .single();

      let assigneesList: any[] = [];
      if (settingRow?.value) {
        assigneesList = typeof settingRow.value === 'string' 
          ? JSON.parse(settingRow.value) 
          : settingRow.value;
      }

      const matchedMember = resolveMemberFromToken(token, assigneesList);
      if (matchedMember) {
        targetAssigneeName = (matchedMember as any).name || '';

        // ค้นหางานล่าสุดที่เสร็จแล้วของสมาชิกท่านนี้ ที่ยังไม่ได้รับการประเมิน
        const { data: memberBriefs } = await supabase
          .from('briefs')
          .select('id, details, status, created_at')
          .or(`assignee_id.eq.${matchedMember.id},assignee.eq.${(matchedMember as any).name}`)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (memberBriefs && memberBriefs.length > 0) {
          // เลือกงานที่ยังไม่มีผลประเมินก่อน ถ้ามีหมดแล้วให้ใช้อันล่าสุด
          const unevaluated = memberBriefs.find(b => !b.details?.satisfaction_scores?.averagePercent) || memberBriefs[0];
          targetBriefId = unevaluated.id;

          const updatedDetails = {
            ...(unevaluated.details || {}),
            satisfaction_scores: evaluationData,
            survey_status: 'completed',
            survey_project_name_custom: projectName || undefined
          };

          await supabase
            .from('briefs')
            .update({ details: updatedDetails })
            .eq('id', targetBriefId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกแบบประเมินความพึงพอใจสำเร็จเรียบร้อย',
      data: {
        briefId: targetBriefId,
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
