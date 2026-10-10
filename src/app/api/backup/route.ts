import { NextResponse } from "next/server";
import { executeSystemBackup } from "@/utils/backupService";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.BACKUP_SECRET;
  
  // If CRON_SECRET is configured, check Bearer token
  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }
  
  // Also check x-backup-token or custom header
  const tokenHeader = request.headers.get("x-backup-token");
  if (cronSecret && tokenHeader === cronSecret) return true;

  // In production, reject if secret is set and doesn't match
  if (process.env.NODE_ENV === "production" && cronSecret) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const result = await executeSystemBackup({
      name: "Automated Monthly Scheduler",
      email: "cron@step.cmu.ac.th",
      role: "system",
    });

    return NextResponse.json({
      success: result.success,
      metadata: result.metadata,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const actor = body.actor || {
      name: "Dashboard Admin",
      email: "admin@step.cmu.ac.th",
      role: "admin",
    };

    const result = await executeSystemBackup(actor);

    return NextResponse.json({
      success: result.success,
      metadata: result.metadata,
      downloadData: result.downloadData,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
