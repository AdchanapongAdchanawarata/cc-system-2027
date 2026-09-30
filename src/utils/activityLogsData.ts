export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userCode: string;
  userName: string;
  unit: string;
  actionType: "status_update" | "feedback_sent" | "plan_edit" | "iso_evidence" | "meeting_action" | "login" | "upload";
  targetModule: string;
  targetId: string;
  details: string;
}

/**
 * Pure FY70 Initial State - Zero Mock Data
 * Real activities will be dynamically generated and tracked via Supabase audit_logs
 */
export const COMPLETE_TEN_ACTIVITIES_PER_MEMBER: ActivityLogItem[] = [];
