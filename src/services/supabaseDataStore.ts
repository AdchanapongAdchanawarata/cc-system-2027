import { createClient } from "@/utils/supabase/client";
import { getCloudJson, setCloudJson } from "@/utils/cloudSyncService";
import {
  BUILTIN_SUPABASE_CONFIG_CATALOG,
  CUSTOM_CATEGORY_PREFIX,
  CUSTOM_CATEGORY_REGISTRY_KEY,
  CustomCategoryFieldDefinition,
  CustomCategoryRecord,
  CustomDataCategoryDefinition,
  DataCategoryGroupId,
  buildCustomCategoryConfigKey,
  normalizeCategorySlug,
} from "@/config/dataCategories";

export interface CategoryStorageItemStatus {
  configKey: string;
  groupId: DataCategoryGroupId;
  title: string;
  description: string;
  dataShape: "array" | "object" | "counter";
  existsInCloud: boolean;
  recordCount: number;
  sizeBytes: number;
  sizeKb: number;
  maxRecommendedKb: number;
  health: "healthy" | "warning" | "empty";
  isCustomCategory: boolean;
  customCategoryDef?: CustomDataCategoryDefinition;
}

export interface SupabaseArchitectureSummary {
  tables: {
    briefs: {
      activeCount: number;
      trashedCount: number;
      purgedCount: number;
      totalRows: number;
    };
    assignees: {
      activeCount: number;
      totalRows: number;
    };
    okrSettings: {
      okrIndicatorsCount: number;
      systemConfigsCount: number;
      customCategoriesCount: number;
      totalRows: number;
      totalSizeKb: number;
    };
  };
  categories: CategoryStorageItemStatus[];
  customCategories: CustomDataCategoryDefinition[];
  inspectedAt: string;
}

/**
 * คำนวณจำนวนรายการย่อยภายใน JSON (Array length หรือจำนวน Keys ของ Object)
 */
function countJsonItems(rawJson?: string | null): number {
  if (!rawJson) return 0;
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).length;
    return 1;
  } catch {
    return 0;
  }
}

/**
 * ดึงรายการหมวดข้อมูลที่สร้างเพิ่มทั้งหมดจาก Supabase (CONFIG_DATA_CATEGORIES_REGISTRY_JSON)
 */
export async function listCustomCategories(): Promise<CustomDataCategoryDefinition[]> {
  const list = await getCloudJson<CustomDataCategoryDefinition[]>(
    CUSTOM_CATEGORY_REGISTRY_KEY,
    "cc_custom_data_categories_registry_v1",
    []
  );
  return Array.isArray(list) ? list : [];
}

/**
 * สร้างหมวดการเก็บข้อมูลใหม่ใน Supabase (Custom Data Category)
 * บันทึกลงทั้ง Registry และสร้างแถวเก็บข้อมูลเริ่มต้นในตาราง okr_settings ทันที
 */
export async function createCustomCategory(input: {
  slug: string;
  title: string;
  description: string;
  groupId?: DataCategoryGroupId;
  fields: CustomCategoryFieldDefinition[];
  createdBy?: string;
}): Promise<{ success: boolean; category?: CustomDataCategoryDefinition; error?: string }> {
  const cleanSlug = normalizeCategorySlug(input.slug);
  if (!cleanSlug || cleanSlug.length < 2) {
    return { success: false, error: "รหัสหมวดข้อมูล (Slug) ต้องเป็นภาษาอังกฤษหรือตัวเลขอย่างน้อย 2 ตัวอักษร" };
  }
  if (!input.title.trim()) {
    return { success: false, error: "กรุณาระบุชื่อหมวดข้อมูล" };
  }

  const configKey = buildCustomCategoryConfigKey(cleanSlug);
  const existingList = await listCustomCategories();

  if (existingList.some((c) => c.slug === cleanSlug || c.configKey === configKey)) {
    return { success: false, error: `มีหมวดข้อมูลรหัส ${cleanSlug} อยู่ในระบบแล้ว` };
  }

  const now = new Date().toISOString();
  const newCategory: CustomDataCategoryDefinition = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    slug: cleanSlug,
    configKey,
    title: input.title.trim(),
    description: input.description.trim() || `หมวดข้อมูลเพิ่มเติม (${input.title.trim()})`,
    groupId: input.groupId || "CUSTOM_CATEGORIES",
    fields: input.fields && input.fields.length > 0
      ? input.fields
      : [
          { key: "title", label: "ชื่อรายการ / หัวข้อ", type: "text", required: true },
          { key: "category", label: "หมวดหมู่ย่อย", type: "text" },
          { key: "url", label: "ลิงก์อ้างอิง / ไฟล์แนบ", type: "url" },
          { key: "notes", label: "รายละเอียดเพิ่มเติม", type: "text" },
        ],
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy || "Admin",
  };

  // 1. สร้างแถวเก็บข้อมูลเริ่มต้น [] ใน Supabase okr_settings
  const initRes = await setCloudJson<CustomCategoryRecord[]>(
    configKey,
    [],
    `cc_custom_cat_${cleanSlug.toLowerCase()}`
  );
  if (!initRes.success) {
    return { success: false, error: initRes.error || "ไม่สามารถสร้างแถวข้อมูลใน Supabase ได้" };
  }

  // 2. อัปเดต Registry ของหมวดข้อมูล
  const updatedList = [...existingList, newCategory];
  const regRes = await setCloudJson<CustomDataCategoryDefinition[]>(
    CUSTOM_CATEGORY_REGISTRY_KEY,
    updatedList,
    "cc_custom_data_categories_registry_v1"
  );
  if (!regRes.success) {
    return { success: false, error: regRes.error || "ไม่สามารถบันทึกทะเบียนหมวดข้อมูลได้" };
  }

  return { success: true, category: newCategory };
}

/**
 * ลบหมวดข้อมูลที่สร้างเองออกจาก Supabase
 */
export async function deleteCustomCategory(
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingList = await listCustomCategories();
    const target = existingList.find((c) => c.id === categoryId);
    if (!target) {
      return { success: false, error: "ไม่พบหมวดข้อมูลที่ต้องการลบ" };
    }

    const supabase = createClient();
    await supabase.from("okr_settings").delete().eq("description", target.configKey);

    const updatedList = existingList.filter((c) => c.id !== categoryId);
    await setCloudJson(
      CUSTOM_CATEGORY_REGISTRY_KEY,
      updatedList,
      "cc_custom_data_categories_registry_v1"
    );

    if (typeof window !== "undefined") {
      localStorage.removeItem(`cc_custom_cat_${target.slug.toLowerCase()}`);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "ลบหมวดข้อมูลไม่สำเร็จ" };
  }
}

/**
 * ดึงรายการข้อมูลทั้งหมดภายในหมวดข้อมูลที่สร้างเอง (Custom Category Records)
 */
export async function getCustomCategoryRecords(
  configKeyOrSlug: string
): Promise<CustomCategoryRecord[]> {
  const configKey = configKeyOrSlug.startsWith(CUSTOM_CATEGORY_PREFIX)
    ? configKeyOrSlug
    : buildCustomCategoryConfigKey(configKeyOrSlug);
  const localKey = `cc_custom_cat_${configKey.toLowerCase()}`;
  const records = await getCloudJson<CustomCategoryRecord[]>(configKey, localKey, []);
  return Array.isArray(records) ? records : [];
}

/**
 * เพิ่มรายการข้อมูลใหม่เข้าไปยังหมวดข้อมูลใน Supabase
 */
export async function addCustomCategoryRecord(
  configKeyOrSlug: string,
  values: Record<string, any>,
  createdBy?: string
): Promise<{ success: boolean; record?: CustomCategoryRecord; error?: string }> {
  const configKey = configKeyOrSlug.startsWith(CUSTOM_CATEGORY_PREFIX)
    ? configKeyOrSlug
    : buildCustomCategoryConfigKey(configKeyOrSlug);
  const localKey = `cc_custom_cat_${configKey.toLowerCase()}`;

  const existing = await getCustomCategoryRecords(configKey);
  const now = new Date().toISOString();
  const newRecord: CustomCategoryRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || "ผู้ใช้งาน",
    values,
  };

  const updated = [newRecord, ...existing];
  const res = await setCloudJson(configKey, updated, localKey);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return { success: true, record: newRecord };
}

/**
 * ลบรายการข้อมูลในหมวดข้อมูลที่สร้างเอง
 */
export async function deleteCustomCategoryRecord(
  configKeyOrSlug: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  const configKey = configKeyOrSlug.startsWith(CUSTOM_CATEGORY_PREFIX)
    ? configKeyOrSlug
    : buildCustomCategoryConfigKey(configKeyOrSlug);
  const localKey = `cc_custom_cat_${configKey.toLowerCase()}`;

  const existing = await getCustomCategoryRecords(configKey);
  const updated = existing.filter((r) => r.id !== recordId);
  return await setCloudJson(configKey, updated, localKey);
}

/**
 * ตรวจสอบโครงสร้างและหมวดหมู่ข้อมูลทั้งหมดใน Supabase แบบเรียลไทม์
 */
export async function inspectSupabaseArchitecture(): Promise<SupabaseArchitectureSummary> {
  const supabase = createClient();

  const [briefsRes, assigneesRes, settingsRes] = await Promise.all([
    supabase.from("briefs").select("id, status, details"),
    supabase.from("assignees").select("id, is_active"),
    supabase.from("okr_settings").select("id, type, description, target_value, is_active, created_at"),
  ]);

  const briefsData = briefsRes.data || [];
  let activeBriefs = 0;
  let trashedBriefs = 0;
  let purgedBriefs = 0;
  for (const b of briefsData) {
    if (b.status === "purged" || b.details?.is_permanently_deleted) {
      purgedBriefs++;
    } else if (b.details?.is_deleted) {
      trashedBriefs++;
    } else {
      activeBriefs++;
    }
  }

  const assigneesData = assigneesRes.data || [];
  const activeAssignees = assigneesData.filter((a) => a.is_active).length;

  const settingsData = settingsRes.data || [];
  const settingsMap = new Map<string, { id: string; target_value: string }>();
  let okrIndicatorsCount = 0;
  let systemConfigsCount = 0;
  let customCategoriesCount = 0;
  let totalSettingsBytes = 0;

  for (const row of settingsData) {
    const desc = row.description || "";
    const val = row.target_value || "";
    totalSettingsBytes += val.length + desc.length;
    settingsMap.set(desc, { id: row.id, target_value: val });

    if (desc.startsWith(CUSTOM_CATEGORY_PREFIX)) {
      customCategoriesCount++;
    } else if (desc.startsWith("CONFIG_")) {
      systemConfigsCount++;
    } else {
      okrIndicatorsCount++;
    }
  }

  // โหลดรายการ Custom Categories จาก Registry
  let customCategories: CustomDataCategoryDefinition[] = [];
  const regRow = settingsMap.get(CUSTOM_CATEGORY_REGISTRY_KEY);
  if (regRow?.target_value) {
    try {
      const parsed = JSON.parse(regRow.target_value);
      if (Array.isArray(parsed)) customCategories = parsed;
    } catch {}
  }

  // สร้างสถานะของหมวดมาตรฐานทั้งหมด
  const categories: CategoryStorageItemStatus[] = BUILTIN_SUPABASE_CONFIG_CATALOG.map((meta) => {
    const cloudRow = settingsMap.get(meta.configKey);
    const rawVal = cloudRow?.target_value || "";
    const sizeBytes = rawVal.length;
    const sizeKb = Number((sizeBytes / 1024).toFixed(2));
    const recordCount = countJsonItems(rawVal);

    let health: "healthy" | "warning" | "empty" = "healthy";
    if (!cloudRow || sizeBytes <= 2) {
      health = "empty";
    } else if (sizeKb > meta.maxRecommendedKb) {
      health = "warning";
    }

    return {
      configKey: meta.configKey,
      groupId: meta.groupId,
      title: meta.title,
      description: meta.description,
      dataShape: meta.dataShape,
      existsInCloud: Boolean(cloudRow),
      recordCount,
      sizeBytes,
      sizeKb,
      maxRecommendedKb: meta.maxRecommendedKb,
      health,
      isCustomCategory: false,
    };
  });

  // เพิ่มหมวดที่ผู้ใช้สร้างเองเข้าไปในรายการตรวจสอบ
  for (const customCat of customCategories) {
    const cloudRow = settingsMap.get(customCat.configKey);
    const rawVal = cloudRow?.target_value || "";
    const sizeBytes = rawVal.length;
    const sizeKb = Number((sizeBytes / 1024).toFixed(2));
    const recordCount = countJsonItems(rawVal);

    categories.push({
      configKey: customCat.configKey,
      groupId: customCat.groupId || "CUSTOM_CATEGORIES",
      title: customCat.title,
      description: customCat.description,
      dataShape: "array",
      existsInCloud: Boolean(cloudRow),
      recordCount,
      sizeBytes,
      sizeKb,
      maxRecommendedKb: 250,
      health: !cloudRow || recordCount === 0 ? "empty" : sizeKb > 250 ? "warning" : "healthy",
      isCustomCategory: true,
      customCategoryDef: customCat,
    });
  }

  return {
    tables: {
      briefs: {
        activeCount: activeBriefs,
        trashedCount: trashedBriefs,
        purgedCount: purgedBriefs,
        totalRows: briefsData.length,
      },
      assignees: {
        activeCount: activeAssignees,
        totalRows: assigneesData.length,
      },
      okrSettings: {
        okrIndicatorsCount,
        systemConfigsCount,
        customCategoriesCount,
        totalRows: settingsData.length,
        totalSizeKb: Number((totalSettingsBytes / 1024).toFixed(1)),
      },
    },
    categories,
    customCategories,
    inspectedAt: new Date().toISOString(),
  };
}

/**
 * จัดระเบียบฐานข้อมูลอัตโนมัติ (Deduplicate OKRs + บีบอัด Audit Logs + ลบแถวขยะที่เลิกใช้)
 */
export async function organizeAndOptimizeSupabase(): Promise<{
  success: boolean;
  removedDuplicateOkrs: number;
  freedKb: number;
  message: string;
}> {
  try {
    const supabase = createClient();
    const { data: settings } = await supabase
      .from("okr_settings")
      .select("id, type, description, target_value, created_at")
      .order("created_at", { ascending: true });

    if (!settings) {
      return { success: true, removedDuplicateOkrs: 0, freedKb: 0, message: "ไม่พบข้อมูลที่ต้องจัดระเบียบ" };
    }

    let freedBytes = 0;
    const seenPrefixes = new Set<string>();
    const duplicateIds: string[] = [];

    for (const row of settings) {
      const desc = row.description || "";
      if (desc.startsWith("CONFIG_")) continue;
      const prefix = desc.split(":")[0].trim();
      if (seenPrefixes.has(prefix)) {
        duplicateIds.push(row.id);
        freedBytes += (row.target_value || "").length + desc.length;
      } else {
        seenPrefixes.add(prefix);
      }
    }

    if (duplicateIds.length > 0) {
      await supabase.from("okr_settings").delete().in("id", duplicateIds);
    }

    // บีบอัด CONFIG_AUDIT_LOGS_JSON หากมีขนาดเกิน 150 KB
    const auditRow = settings.find((r) => r.description === "CONFIG_AUDIT_LOGS_JSON");
    if (auditRow?.target_value && auditRow.target_value.length > 150 * 1024) {
      const beforeLen = auditRow.target_value.length;
      try {
        const parsed = JSON.parse(auditRow.target_value);
        if (Array.isArray(parsed)) {
          const slimmed = parsed.slice(0, 200).map((e: any) => ({
            id: e.id,
            task_id: e.task_id,
            task_code: e.task_code,
            project_name: e.project_name ? String(e.project_name).slice(0, 150) : undefined,
            action: e.action,
            actor_name: e.actor_name,
            actor_email: e.actor_email,
            actor_role: e.actor_role,
            timestamp: e.timestamp,
            details: e.details?.field
              ? { field: e.details.field, old_value: e.details.old_value, new_value: e.details.new_value }
              : {},
          }));
          const newStr = JSON.stringify(slimmed);
          await supabase.from("okr_settings").update({ target_value: newStr }).eq("id", auditRow.id);
          freedBytes += Math.max(0, beforeLen - newStr.length);
        }
      } catch {}
    }

    const freedKb = Number((freedBytes / 1024).toFixed(1));
    return {
      success: true,
      removedDuplicateOkrs: duplicateIds.length,
      freedKb,
      message: `จัดระเบียบฐานข้อมูลเรียบร้อย (ลบแถวซ้ำ ${duplicateIds.length} รายการ • คืนพื้นที่ ${freedKb} KB)`,
    };
  } catch (err: any) {
    return {
      success: false,
      removedDuplicateOkrs: 0,
      freedKb: 0,
      message: err?.message || "เกิดข้อผิดพลาดในการจัดระเบียบฐานข้อมูล",
    };
  }
}
