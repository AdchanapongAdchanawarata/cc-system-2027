import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { shouldSendMorningBriefToday } from '@/utils/lineBotConfig';
import { POST as notifyPOST } from '@/app/api/notify/route';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function getBangkokDate() {
  const bkk = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const hours = bkk.getHours();
  const minutes = bkk.getMinutes();
  const day = bkk.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const yyyy = bkk.getFullYear();
  const mm = String(bkk.getMonth() + 1).padStart(2, '0');
  const dd = String(bkk.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { hours, minutes, day, dateStr, timeStr, bkk };
}

let memoryTracker: Record<string, any> = {};
let isCronExecuting = false;

function getTrackerPath() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'cron_run_tracker.json');
  }
  return path.join(process.cwd(), 'src', 'data', 'cron_run_tracker.json');
}

async function loadTrackerAsync(): Promise<Record<string, any>> {
  let localData: Record<string, any> = { ...memoryTracker };
  try {
    const trackerPath = getTrackerPath();
    if (fs.existsSync(trackerPath)) {
      localData = { ...localData, ...JSON.parse(fs.readFileSync(trackerPath, 'utf-8')) };
    }
  } catch (e) {}

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('okr_settings')
        .select('target_value')
        .eq('description', 'CONFIG_LINE_CRON_TRACKER_JSON')
        .maybeSingle();

      if (data?.target_value) {
        const cloudData = JSON.parse(data.target_value);
        if (cloudData && typeof cloudData === 'object') {
          for (const k of Object.keys(cloudData)) {
            localData[k] = { ...(localData[k] || {}), ...(cloudData[k] || {}) };
          }
        }
      }
    } catch (e) {
      console.warn('[CRON TRACKER] Cloud read warning:', e);
    }
  }

  memoryTracker = localData;
  return localData;
}

async function saveTrackerAsync(tracker: Record<string, any>) {
  // Prune keys older than 40 days to keep payload compact
  const allDates = Object.keys(tracker).sort();
  if (allDates.length > 40) {
    const toRemove = allDates.slice(0, allDates.length - 40);
    toRemove.forEach((k) => delete tracker[k]);
  }

  memoryTracker = tracker;

  try {
    const trackerPath = getTrackerPath();
    const dir = path.dirname(trackerPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2), 'utf-8');
  } catch (e) {}

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = JSON.stringify(tracker);
      const { data: existing } = await supabase
        .from('okr_settings')
        .select('id')
        .eq('description', 'CONFIG_LINE_CRON_TRACKER_JSON')
        .maybeSingle();

      if (existing?.id) {
        await supabase.from('okr_settings').update({ target_value: payload }).eq('id', existing.id);
      } else {
        await supabase.from('okr_settings').insert({
          type: 'KR',
          description: 'CONFIG_LINE_CRON_TRACKER_JSON',
          target_value: payload,
          is_active: true,
        });
      }
    } catch (e) {
      console.warn('[CRON TRACKER] Cloud write warning:', e);
    }
  }
}

async function invokeNotifyInProcess(action: string, extraBody: Record<string, any> = {}) {
  const req = new Request('https://ccteam.vercel.app/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extraBody }),
  });
  const res = await notifyPOST(req);
  const data = await res.json();
  return { ok: res.ok, data };
}

function isActionLockedOrDone(dayRecord: Record<string, any>, actionKey: string): boolean {
  if (dayRecord[actionKey]) return true;
  const lockTime = dayRecord[`${actionKey}_lock`];
  if (typeof lockTime === 'number' && Date.now() - lockTime < 60000) {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  return handleCronDispatch(request);
}

export async function POST(request: Request) {
  return handleCronDispatch(request);
}

async function handleCronDispatch(request: Request) {
  if (isCronExecuting) {
    return NextResponse.json({
      success: true,
      message: 'Cron dispatch is currently executing in another request.',
      triggeredActions: [],
    });
  }

  isCronExecuting = true;
  try {
    const { hours, minutes, day, dateStr, timeStr, bkk } = getBangkokDate();
    const tracker = await loadTrackerAsync();
    if (!tracker[dateStr]) {
      tracker[dateStr] = {};
    }

    const triggeredActions: string[] = [];
    let trackerModified = false;
    const origin = new URL(request.url).origin || process.env.NEXT_PUBLIC_APP_URL || 'https://ccteam.vercel.app';

    function isLastWorkdayOfMonth(bkkDate: Date): boolean {
      const curDay = bkkDate.getDay();
      if (curDay < 1 || curDay > 5) return false;
      const year = bkkDate.getFullYear();
      const month = bkkDate.getMonth();
      const curDate = bkkDate.getDate();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

      for (let d = curDate + 1; d <= lastDayOfMonth; d++) {
        const nextDate = new Date(year, month, d);
        const nextDay = nextDate.getDay();
        if (nextDay >= 1 && nextDay <= 5) {
          return false;
        }
      }
      return true;
    }

    function isLastFridayOfMonth(bkkDate: Date): boolean {
      if (bkkDate.getDay() !== 5) return false;
      const year = bkkDate.getFullYear();
      const month = bkkDate.getMonth();
      const curDate = bkkDate.getDate();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      return (curDate + 7) > lastDayOfMonth;
    }

    const isMonToThu = day >= 1 && day <= 4;
    const isLastWorkday = isLastWorkdayOfMonth(bkk);

    // 1. DAILY DISPATCH: 09:00 AM - Morning Brief (Workdays Mon-Thu, catch-up window 09:00 - 12:59 BKK)
    // Sent to 'Creative step (NOTY)' with Dynamic Quota Balancing across weeks
    if (isMonToThu && !isLastWorkday && hours >= 9 && hours < 13 && !isActionLockedOrDone(tracker[dateStr], 'morning_brief')) {
      try {
        tracker[dateStr]['morning_brief_lock'] = Date.now();
        await saveTrackerAsync(tracker);

        const pacing = await shouldSendMorningBriefToday(bkk);
        if (pacing.allowed) {
          const { ok, data } = await invokeNotifyInProcess('morning_brief', { force: true });
          if (ok && data?.lineSent) {
            tracker[dateStr]['morning_brief'] = new Date().toISOString();
            delete tracker[dateStr]['morning_brief_lock'];
            trackerModified = true;
            triggeredActions.push(`morning_brief (${pacing.reason})`);
          } else {
            delete tracker[dateStr]['morning_brief_lock'];
            trackerModified = true;
            console.error('[CRON] morning_brief lineSent was false:', data);
          }
        } else {
          console.log(`[CRON PACING SKIP] ${pacing.reason}`);
          tracker[dateStr]['morning_brief'] = `SKIPPED: ${pacing.reason}`;
          delete tracker[dateStr]['morning_brief_lock'];
          trackerModified = true;
        }
      } catch (e) {
        delete tracker[dateStr]['morning_brief_lock'];
        trackerModified = true;
        console.error('Cron error on morning_brief:', e);
      }
    }

    // 1.1 WEEKLY EXECUTIVE DISPATCH: Every Friday at 16:30 PM (catch-up window 16:30 - 22:59 BKK) -> Pushed to 'CC TEAM'
    // Skip on the last Friday of month because Monthly Performance Summary covers it
    const isFridayReportWindow = day === 5 && ((hours === 16 && minutes >= 30) || (hours >= 17 && hours < 23));
    if (isFridayReportWindow && !isLastFridayOfMonth(bkk) && !isActionLockedOrDone(tracker[dateStr], 'weekly_executive_report')) {
      try {
        tracker[dateStr]['weekly_executive_report_lock'] = Date.now();
        await saveTrackerAsync(tracker);

        const { ok, data } = await invokeNotifyInProcess('weekly_executive_report');
        if (ok && (data?.lineSent || data?.skipped)) {
          tracker[dateStr]['weekly_executive_report'] = data?.skipped ? `SKIPPED: ${data.message}` : new Date().toISOString();
          delete tracker[dateStr]['weekly_executive_report_lock'];
          trackerModified = true;
          triggeredActions.push('weekly_executive_report (Friday 16:30 to CC TEAM)');
        } else {
          delete tracker[dateStr]['weekly_executive_report_lock'];
          trackerModified = true;
          console.error('[CRON] weekly_executive_report lineSent was false:', data);
        }
      } catch (e) {
        delete tracker[dateStr]['weekly_executive_report_lock'];
        trackerModified = true;
        console.error('Cron error on weekly_executive_report:', e);
      }
    }

    // 2. MONTHLY DISPATCH: 09:00 AM on the Last Workday of each month (catch-up window 09:00 - 18:59 BKK) -> Pushed to 'CC TEAM'
    if (isLastWorkday && hours >= 9 && hours < 19 && !isActionLockedOrDone(tracker[dateStr], 'monthly_performance_summary')) {
      try {
        tracker[dateStr]['monthly_performance_summary_lock'] = Date.now();
        await saveTrackerAsync(tracker);

        const { ok, data } = await invokeNotifyInProcess('monthly_performance_summary');
        if (ok && data?.lineSent) {
          tracker[dateStr]['monthly_performance_summary'] = new Date().toISOString();
          delete tracker[dateStr]['monthly_performance_summary_lock'];
          trackerModified = true;
          triggeredActions.push('monthly_performance_summary (09:00 Last Workday to CC TEAM)');
        } else {
          delete tracker[dateStr]['monthly_performance_summary_lock'];
          trackerModified = true;
          console.error('[CRON] monthly_performance_summary lineSent was false:', data);
        }
      } catch (e) {
        delete tracker[dateStr]['monthly_performance_summary_lock'];
        trackerModified = true;
        console.error('Cron error on monthly_performance_summary:', e);
      }

      // 2.1 AUTOMATED MONTHLY BACKUP TO SUPABASE STORAGE
      if (!tracker[dateStr]['monthly_system_backup']) {
        try {
          const cronSecret = process.env.CRON_SECRET || process.env.BACKUP_SECRET || '';
          await fetch(`${origin}/api/backup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
            },
            body: JSON.stringify({
              actor: {
                name: 'Cron Automated Monthly Backup',
                email: 'cron@step.cmu.ac.th',
                role: 'system',
              },
            }),
          });
          tracker[dateStr]['monthly_system_backup'] = new Date().toISOString();
          trackerModified = true;
          triggeredActions.push('monthly_system_backup (Auto Snapshot to Supabase Storage)');
        } catch (bkErr) {
          console.error('Cron error on monthly_system_backup:', bkErr);
        }
      }

      // 2.2 AUTOMATED ARCHIVAL: Vacuum & Purge tasks older than 90 days
      if (!tracker[dateStr]['monthly_vacuum_archival']) {
        try {
          const { purgeOldPurgedTasksArchival } = await import('@/utils/storageQuotaService');
          const vacuumRes = await purgeOldPurgedTasksArchival(90);
          if (vacuumRes.success && vacuumRes.purgedCount > 0) {
            tracker[dateStr]['monthly_vacuum_archival'] = `${vacuumRes.purgedCount} tasks`;
            trackerModified = true;
            triggeredActions.push(`monthly_vacuum_archival (${vacuumRes.purgedCount} purged tasks removed)`);
          }
        } catch (vacErr) {
          console.error('Cron error on monthly_vacuum_archival:', vacErr);
        }
      }
    }

    if (trackerModified) {
      await saveTrackerAsync(tracker);
    }

    return NextResponse.json({
      success: true,
      bangkokTime: `${dateStr} ${timeStr}`,
      triggeredActions,
      todayStatus: tracker[dateStr] || {},
      message:
        triggeredActions.length > 0
          ? `Triggered: ${triggeredActions.join(', ')}`
          : 'No scheduled tasks due at this minute.',
    });
  } finally {
    isCronExecuting = false;
  }
}
