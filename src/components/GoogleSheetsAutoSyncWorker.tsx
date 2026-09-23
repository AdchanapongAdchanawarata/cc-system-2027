"use client";

import { useEffect, useRef } from 'react';
import { getFiscalYear, getMonthCode, getWeekCode } from '@/utils/googleSheetsSync';

/**
 * Background Auto-Sync Worker for Google Sheets (R & KR)
 * - Runs in dashboard layout
 * - Checks time every 60s
 * - Triggers Friday 17:00 (R Data) -> Auto Push + Email to 12 members
 * - Triggers Month-End 17:00 (KR Data) -> Auto Push + Email to 12 members
 */
export default function GoogleSheetsAutoSyncWorker() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function checkAndTriggerSync() {
      if (isSyncingRef.current) return;

      const now = new Date();
      const dayOfWeek = now.getDay(); // 5 = Friday
      const hour = now.getHours();    // 17 = 17:00
      const weekCode = getWeekCode(now);
      const monthCode = getMonthCode(now);
      const fy = getFiscalYear(now);

      // Check if tomorrow is next month
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isLastDayOfMonth = tomorrow.getMonth() !== now.getMonth();

      // 1. Weekly Friday >= 17:00 for R
      if (dayOfWeek === 5 && hour >= 17) {
        const syncKeyR = `cc_auto_sync_r_${fy}_${monthCode}_${weekCode}`;
        const alreadySyncedR = localStorage.getItem(syncKeyR);

        if (!alreadySyncedR) {
          isSyncingRef.current = true;
          try {
            console.log(`[AUTO-SYNC] Triggering Friday 17:00 R-sync for ${weekCode} ${monthCode} ${fy}...`);
            const res = await fetch('/api/sheets-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'R' })
            });
            const data = await res.json();
            if (data.status === 'success') {
              localStorage.setItem(syncKeyR, JSON.stringify({ syncedAt: new Date().toISOString(), result: data }));
              console.log(`[AUTO-SYNC] R-sync successfully completed!`, data);
            }
          } catch (e) {
            console.error(`[AUTO-SYNC] R-sync failed:`, e);
          } finally {
            isSyncingRef.current = false;
          }
        }
      }

      // 2. Monthly Last Day >= 17:00 for KR
      if (isLastDayOfMonth && hour >= 17) {
        const syncKeyKR = `cc_auto_sync_kr_${fy}_${monthCode}`;
        const alreadySyncedKR = localStorage.getItem(syncKeyKR);

        if (!alreadySyncedKR) {
          isSyncingRef.current = true;
          try {
            console.log(`[AUTO-SYNC] Triggering Month-end 17:00 KR-sync for ${monthCode} ${fy}...`);
            const res = await fetch('/api/sheets-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'KR' })
            });
            const data = await res.json();
            if (data.status === 'success') {
              localStorage.setItem(syncKeyKR, JSON.stringify({ syncedAt: new Date().toISOString(), result: data }));
              console.log(`[AUTO-SYNC] KR-sync successfully completed!`, data);
            }
          } catch (e) {
            console.error(`[AUTO-SYNC] KR-sync failed:`, e);
          } finally {
            isSyncingRef.current = false;
          }
        }
      }
    }

    // Run check on mount
    checkAndTriggerSync();

    // Check every 60 seconds
    const interval = setInterval(checkAndTriggerSync, 60000);
    return () => clearInterval(interval);
  }, []);

  return null; // Silent background worker
}
