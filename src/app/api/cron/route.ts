import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

  const isWeekday = day >= 1 && day <= 5;

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

  // 1. DAILY DISPATCH: 09:00 AM - Morning Brief (Workdays Mon-Fri, between 09:00 - 09:15)
  // Sent to 'Creative step (NOTY)'
  if (isWeekday && hours === 9 && minutes <= 15 && !tracker[dateStr]['morning_brief']) {
    try {
      await fetch(`${origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'morning_brief' })
      });
      tracker[dateStr]['morning_brief'] = new Date().toISOString();
      triggeredActions.push('morning_brief (09:00)');
    } catch (e) {
      console.error('Cron error on morning_brief:', e);
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
