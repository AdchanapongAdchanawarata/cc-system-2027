import { createClient } from "./supabase/client";

export interface StorageQuotaStats {
  dbRowCount: number;
  dbEstimatedMb: number;
  dbLimitMb: number;
  dbPercentage: number;
  
  storageFileCount: number;
  storageEstimatedMb: number;
  storageLimitMb: number;
  storagePercentage: number;

  localStorageKb: number;
  localStorageLimitKb: number;
  localStoragePercentage: number;

  completedBriefsCount: number;
  purgeableFilesCount: number;
  purgeableEstimatedMb: number;

  healthStatus: "healthy" | "warning" | "critical";
  lastChecked: string;
}

// Limits for Supabase Free Tier
export const SUPABASE_FREE_DB_LIMIT_MB = 500;
export const SUPABASE_FREE_STORAGE_LIMIT_MB = 1024; // 1 GB
export const BROWSER_LOCALSTORAGE_LIMIT_KB = 5120; // 5 MB

export async function getStorageQuotaStats(): Promise<StorageQuotaStats> {
  const supabase = createClient();
  let dbRowCount = 0;
  let completedBriefsCount = 0;
  let purgeableFilesCount = 0;
  let purgeableEstimatedMb = 0;
  let totalAttachmentFiles = 0;
  let totalAttachmentBytes = 0;

  try {
    const { data: briefs, count } = await supabase
      .from("briefs")
      .select("id, status, details, created_at", { count: "exact" });

    dbRowCount = count || (briefs ? briefs.length : 0);

    if (briefs && briefs.length > 0) {
      briefs.forEach((b: any) => {
        const isFinished = b.status === "completed" || b.status === "cancelled";
        if (isFinished) completedBriefsCount++;

        const files = b.details?.files || b.details?.attachments || [];
        if (Array.isArray(files) && files.length > 0) {
          totalAttachmentFiles += files.length;
          files.forEach((f: any) => {
            const sizeInBytes = typeof f.size === "number" ? f.size : (typeof f.size === "string" && f.size.includes("MB") ? parseFloat(f.size) * 1024 * 1024 : 1024 * 1024);
            totalAttachmentBytes += sizeInBytes;

            if (isFinished && f.status !== "archived_to_save_space") {
              purgeableFilesCount++;
              purgeableEstimatedMb += sizeInBytes / (1024 * 1024);
            }
          });
        }
      });
    }
  } catch (err) {
    console.warn("Error calculating Supabase briefs quota:", err);
  }

  try {
    const { data: bucketFiles } = await supabase.storage
      .from("brief_attachments")
      .list("", { limit: 100 });

    if (bucketFiles && bucketFiles.length > 0) {
      totalAttachmentFiles = Math.max(totalAttachmentFiles, bucketFiles.length);
      const bucketBytes = bucketFiles.reduce((acc, f) => acc + (f.metadata?.size || 1024 * 512), 0);
      totalAttachmentBytes = Math.max(totalAttachmentBytes, bucketBytes);
    }
  } catch (storageErr) {
    console.warn("Storage bucket listing fallback:", storageErr);
  }

  const estimatedDbMb = Math.round(((20 + (dbRowCount * 0.025)) * 10)) / 10;
  const storageMb = Math.round((totalAttachmentBytes / (1024 * 1024)) * 10) / 10;

  let localTotalBytes = 0;
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          localTotalBytes += key.length * 2 + val.length * 2;
        }
      }
    } catch {
      localTotalBytes = 500 * 1024;
    }
  }
  const localStorageKb = Math.round(localTotalBytes / 1024);

  const dbPercentage = Math.min(100, Math.round((estimatedDbMb / SUPABASE_FREE_DB_LIMIT_MB) * 100));
  const storagePercentage = Math.min(100, Math.round((storageMb / SUPABASE_FREE_STORAGE_LIMIT_MB) * 100));
  const localStoragePercentage = Math.min(100, Math.round((localStorageKb / BROWSER_LOCALSTORAGE_LIMIT_KB) * 100));

  const maxUsage = Math.max(dbPercentage, storagePercentage);
  let healthStatus: "healthy" | "warning" | "critical" = "healthy";
  if (maxUsage >= 80) {
    healthStatus = "critical";
  } else if (maxUsage >= 60) {
    healthStatus = "warning";
  }

  return {
    dbRowCount,
    dbEstimatedMb: estimatedDbMb,
    dbLimitMb: SUPABASE_FREE_DB_LIMIT_MB,
    dbPercentage,

    storageFileCount: totalAttachmentFiles,
    storageEstimatedMb: storageMb,
    storageLimitMb: SUPABASE_FREE_STORAGE_LIMIT_MB,
    storagePercentage,

    localStorageKb,
    localStorageLimitKb: BROWSER_LOCALSTORAGE_LIMIT_KB,
    localStoragePercentage,

    completedBriefsCount,
    purgeableFilesCount,
    purgeableEstimatedMb: Math.round(purgeableEstimatedMb * 10) / 10,

    healthStatus,
    lastChecked: new Date().toISOString()
  };
}

export async function purgeCompletedTaskAttachments(): Promise<{
  success: boolean;
  purgedBriefsCount: number;
  purgedFilesCount: number;
  freedMb: number;
  error?: string;
}> {
  const supabase = createClient();
  let purgedBriefsCount = 0;
  let purgedFilesCount = 0;
  let freedBytes = 0;

  try {
    const { data: briefs, error } = await supabase
      .from("briefs")
      .select("id, status, details")
      .in("status", ["completed", "cancelled"]);

    if (error) throw error;
    if (!briefs || briefs.length === 0) {
      return { success: true, purgedBriefsCount: 0, purgedFilesCount: 0, freedMb: 0 };
    }

    for (const b of briefs) {
      const files = b.details?.files || b.details?.attachments || [];
      if (!Array.isArray(files) || files.length === 0) continue;

      let hasChanged = false;
      const filePathsToRemove: string[] = [];

      const archivedFiles = files.map((f: any) => {
        if (f.status === "archived_to_save_space") return f;

        hasChanged = true;
        purgedFilesCount++;
        const sizeInBytes = typeof f.size === "number" ? f.size : (typeof f.size === "string" && f.size.includes("MB") ? parseFloat(f.size) * 1024 * 1024 : 1024 * 1024);
        freedBytes += sizeInBytes;

        if (f.path) filePathsToRemove.push(f.path);
        if (f.name && !f.path) filePathsToRemove.push(f.name);

        return {
          name: f.name || "attachment",
          originalSize: f.size || "1MB",
          status: "archived_to_save_space",
          archivedNote: "[ไฟล์ถูกเคลียร์พื้นที่หลังงานเสร็จสิ้นตามนโยบาย Free Tier]",
          archivedAt: new Date().toISOString()
        };
      });

      if (hasChanged) {
        if (filePathsToRemove.length > 0) {
          try {
            await supabase.storage.from("brief_attachments").remove(filePathsToRemove);
          } catch (storageErr) {
            console.warn("Storage remove non-fatal error:", storageErr);
          }
        }

        const updatedDetails = {
          ...b.details,
          files: archivedFiles,
          attachments: archivedFiles,
          storageCleanedAt: new Date().toISOString()
        };

        await supabase
          .from("briefs")
          .update({ details: updatedDetails })
          .eq("id", b.id);

        purgedBriefsCount++;
      }
    }

    return {
      success: true,
      purgedBriefsCount,
      purgedFilesCount,
      freedMb: Math.round((freedBytes / (1024 * 1024)) * 10) / 10
    };
  } catch (err: any) {
    console.error("Failed to purge completed task attachments:", err);
    return {
      success: false,
      purgedBriefsCount,
      purgedFilesCount,
      freedMb: 0,
      error: err.message || "เกิดข้อผิดพลาดในการล้างไฟล์"
    };
  }
}

export function purgeLocalCache(): { freedKb: number } {
  if (typeof window === "undefined") return { freedKb: 0 };

  let beforeBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) beforeBytes += (localStorage.getItem(k) || "").length * 2;
  }

  const tempPrefixes = ["temp_", "mock_", "debug_", "draft_preview_", "cache_"];
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && tempPrefixes.some(p => k.startsWith(p))) {
      keysToRemove.push(k);
    }
  }

  keysToRemove.forEach(k => localStorage.removeItem(k));

  let afterBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) afterBytes += (localStorage.getItem(k) || "").length * 2;
  }

  return { freedKb: Math.max(0, Math.round((beforeBytes - afterBytes) / 1024)) };
}

export async function exportDatabaseBackup(): Promise<boolean> {
  const supabase = createClient();
  try {
    const [briefsRes, assigneesRes, settingsRes] = await Promise.all([
      supabase.from("briefs").select("*"),
      supabase.from("assignees").select("*"),
      supabase.from("system_settings").select("*")
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      app: "CC System 2027",
      version: "2.0-free-tier-safe",
      data: {
        briefs: briefsRes.data || [],
        assignees: assigneesRes.data || [],
        systemSettings: settingsRes.data || []
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_System_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Failed to export backup:", err);
    return false;
  }
}
