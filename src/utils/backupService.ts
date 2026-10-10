import { createClient } from "@/utils/supabase/client";
import { logActivity } from "./auditLogger";

export interface BackupMetadata {
  id: string;
  timestamp: string;
  fiscalYear: string;
  totalBriefs: number;
  totalAssignees: number;
  totalSettings: number;
  sizeBytes: number;
  storagePath?: string;
  status: "success" | "warning" | "failed";
  message?: string;
}

export const BACKUP_BUCKET = "system_backups";

/**
 * Execute a comprehensive backup of the entire CC Management System
 */
export async function executeSystemBackup(actor?: { name: string; email: string; role: string }): Promise<{
  success: boolean;
  metadata?: BackupMetadata;
  downloadData?: any;
  error?: string;
}> {
  const supabase = createClient();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split("T")[0];
  const timeStr = timestamp.split("T")[1].replace(/[:.]/g, "-").slice(0, 8);
  const backupFilename = `backup_FY70_${dateStr}_${timeStr}.json`;

  try {
    // 1. Fetch all system data
    const [briefsRes, assigneesRes, settingsRes, pricingRes] = await Promise.all([
      supabase.from("briefs").select("*").neq("status", "purged"),
      supabase.from("assignees").select("*"),
      supabase.from("okr_settings").select("*"),
      supabase.from("service_pricing").select("*")
    ]);

    const backupPayload = {
      meta: {
        system: "CC Management System 2027",
        version: "2.0-FY70",
        exportedAt: timestamp,
        fiscalYear: "2570",
        stats: {
          activeBriefsCount: briefsRes.data?.length || 0,
          assigneesCount: assigneesRes.data?.length || 0,
          settingsCount: settingsRes.data?.length || 0,
          servicePricingCount: pricingRes.data?.length || 0,
        }
      },
      data: {
        briefs: briefsRes.data || [],
        assignees: assigneesRes.data || [],
        okr_settings: settingsRes.data || [],
        service_pricing: pricingRes.data || []
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const sizeBytes = new Blob([jsonString]).size;

    let storagePath: string | undefined = undefined;
    let uploadSuccess = false;

    // 2. Attempt to upload to Supabase Storage bucket
    try {
      const fileBlob = new Blob([jsonString], { type: "application/json" });
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BACKUP_BUCKET)
        .upload(`monthly_snapshots/${backupFilename}`, fileBlob, {
          contentType: "application/json",
          upsert: true
        });

      if (!uploadErr && uploadData?.path) {
        storagePath = `${BACKUP_BUCKET}/${uploadData.path}`;
        uploadSuccess = true;
      }
    } catch (stErr) {
      console.warn("Storage bucket upload skipped or not available:", stErr);
    }

    const metadata: BackupMetadata = {
      id: `bk_${Date.now()}`,
      timestamp,
      fiscalYear: "2570",
      totalBriefs: briefsRes.data?.length || 0,
      totalAssignees: assigneesRes.data?.length || 0,
      totalSettings: settingsRes.data?.length || 0,
      sizeBytes,
      storagePath,
      status: uploadSuccess ? "success" : "warning",
      message: uploadSuccess 
        ? `บันทึกไปยัง Supabase Storage (${storagePath}) เรียบร้อยแล้ว` 
        : `สำรองข้อมูลสมบูรณ์ พร้อมดาวน์โหลดเป็นไฟล์ JSON (Storage bucket ยังไม่ถูกสร้าง)`,
    };

    // 3. Save latest backup log in okr_settings (CONFIG_LAST_BACKUP_SNAPSHOT)
    try {
      const { data: existing } = await supabase
        .from("okr_settings")
        .select("id")
        .eq("description", "CONFIG_LAST_BACKUP_SNAPSHOT")
        .maybeSingle();

      const snapshotJson = JSON.stringify(metadata);
      if (existing?.id) {
        await supabase
          .from("okr_settings")
          .update({ target_value: snapshotJson, is_active: true })
          .eq("id", existing.id);
      } else {
        await supabase.from("okr_settings").insert([
          {
            type: "KR",
            description: "CONFIG_LAST_BACKUP_SNAPSHOT",
            target_value: snapshotJson,
            is_active: true
          }
        ]);
      }
    } catch (saveErr) {
      console.warn("Could not save backup snapshot log:", saveErr);
    }

    // 4. Log in audit trail
    await logActivity({
      action: "SYSTEM_BACKUP",
      actor_name: actor?.name || "Automated Backup System",
      actor_email: actor?.email || "backup@step.cmu.ac.th",
      actor_role: actor?.role || "system",
      details: {
        filename: backupFilename,
        sizeBytes,
        totalBriefs: metadata.totalBriefs,
        storagePath: metadata.storagePath,
      }
    });

    return {
      success: true,
      metadata,
      downloadData: backupPayload
    };
  } catch (err: any) {
    console.error("Backup execution failed:", err);
    return {
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการสำรองข้อมูล"
    };
  }
}

/**
 * Trigger browser file download of backup payload
 */
export function triggerBackupDownload(backupPayload: any, filename?: string) {
  if (typeof window === "undefined") return;
  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `cc_system_backup_FY70_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
