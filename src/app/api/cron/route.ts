import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { shouldSendMorningBriefToday } from '@/utils/lineBotConfig';

function getBangkokDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bkk = new Date(utc + (3600000 * 7));
  const hours = bkk.getHours();
  const minutes = bkk.getMinutes();
  const day = bkk.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dateStr = bkk.toISOString().split('T')[0];
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { hours, minutes, day, dateStr, timeStr, bkk };
}

let memoryTracker: Record<string, any> = {};

function getTrackerPath() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'cron_run_tracker.json');
  }
  return path.join(process.cwd(), 'src', 'data', 'cron_run_tracker.json');
}

function getTracker() {
  try {
    const trackerPath = getTrackerPath();
    if (fs.existsSync(trackerPath)) {
      return JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    }
  } catch (e) {
    // fallback to in-memory
  }
  return memoryTracker;
}

function saveTracker(tracker: Record<string, any>) {
  memoryTracker = tracker;
  try {
    const trackerPath = getTrackerPath();
    const dir = path.dirname(trackerPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Fallback to in-memory cron tracker:', e);
  }
}

export async function GET(request: Request) {
  return handleCronDispatch(request);
}

export async function POST(request: Request) {
  return handleCronDispatch(request);
}

async function handleCronDispatch(request: Request) {
  const { hours, minutes, day, dateStr, timeStr, bkk } = getBangkokDate();
  const tracker = getTracker();
  if (!tracker[dateStr]) {
    tracker[dateStr] = {};
  }

  const triggeredActions: string[] = [];
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

  // 1. DAILY DISPATCH: 09:00 AM - Morning Brief (Workdays Mon-Thu only, between 09:00 - 09:15)
  // Sent to 'Creative step (NOTY)' with Dynamic Quota Balancing across weeks
  if (isMonToThu && hours === 9 && minutes <= 15 && !tracker[dateStr]['morning_brief']) {
    try {
      const pacing = await shouldSendMorningBriefToday(bkk);
      if (pacing.allowed) {
        await fetch(`${origin}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'morning_brief' })
        });
        tracker[dateStr]['morning_brief'] = new Date().toISOString();
        triggeredActions.push(`morning_brief (${pacing.reason})`);
      } else {
        console.log(`[CRON PACING SKIP] ${pacing.reason}`);
        tracker[dateStr]['morning_brief'] = `SKIPPED: ${pacing.reason}`;
      }
    } catch (e) {
      console.error('Cron error on morning_brief:', e);
    }
  }

  // 1.1 WEEKLY EXECUTIVE DISPATCH: Every Friday at 16:30 PM (บ่าย 4 โมงครึ่ง) -> Pushed to 'CC TEAM' (Executives & Team)
  // Skip on the last Friday/week of month because Monthly Executive Report already covers it
  if (day === 5 && hours === 16 && minutes >= 30 && minutes <= 45 && !isLastFridayOfMonth(bkk) && !tracker[dateStr]['weekly_executive_report']) {
    try {
      await fetch(`${origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'weekly_executive_report' })
      });
      tracker[dateStr]['weekly_executive_report'] = new Date().toISOString();
      triggeredActions.push('weekly_executive_report (Friday 16:30 to CC TEAM)');
    } catch (e) {
      console.error('Cron error on weekly_executive_report:', e);
    }
  }

  // 2. MONTHLY DISPATCH: 09:00 AM on the Last Workday of each month -> Pushed to 'CC TEAM' (18 members)
  if (isLastWorkdayOfMonth(bkk) && hours === 9 && minutes <= 15 && !tracker[dateStr]['monthly_performance_summary']) {
    try {
      await fetch(`${origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'monthly_performance_summary' })
      });
      tracker[dateStr]['monthly_performance_summary'] = new Date().toISOString();
      triggeredActions.push('monthly_performance_summary (09:00 Last Workday to CC TEAM)');
    } catch (e) {
      console.error('Cron error on monthly_performance_summary:', e);
    }

    // 2.1 AUTOMATED MONTHLY BACKUP TO SUPABASE STORAGE
    try {
      const cronSecret = process.env.CRON_SECRET || process.env.BACKUP_SECRET || '';
      await fetch(`${origin}/api/backup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {})
        },
        body: JSON.stringify({
          actor: {
            name: 'Cron Automated Monthly Backup',
            email: 'cron@step.cmu.ac.th',
            role: 'system'
          }
        })
      });
      tracker[dateStr]['monthly_system_backup'] = new Date().toISOString();
      triggeredActions.push('monthly_system_backup (Auto Snapshot to Supabase Storage)');
    } catch (bkErr) {
      console.error('Cron error on monthly_system_backup:', bkErr);
    }

    // 2.2 AUTOMATED ARCHIVAL: Vacuum & Purge tasks older than 90 days
    try {
      const { purgeOldPurgedTasksArchival } = await import('@/utils/storageQuotaService');
      const vacuumRes = await purgeOldPurgedTasksArchival(90);
      if (vacuumRes.success && vacuumRes.purgedCount > 0) {
        tracker[dateStr]['monthly_vacuum_archival'] = `${vacuumRes.purgedCount} tasks`;
        triggeredActions.push(`monthly_vacuum_archival (${vacuumRes.purgedCount} purged tasks removed)`);
      }
    } catch (vacErr) {
      console.error('Cron error on monthly_vacuum_archival:', vacErr);
    }
  }

  saveTracker(tracker);

  return NextResponse.json({
    success: true,
    bangkokTime: `${dateStr} ${timeStr}`,
    dayOfWeek: day,
    triggered: triggeredActions,
    todayStatus: tracker[dateStr]
  });
}
