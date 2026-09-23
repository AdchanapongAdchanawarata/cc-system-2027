/**
 * In-process Background Scheduler for CC Team Line Alerts
 * Runs every 60 seconds to check if any scheduled notification is due.
 */

let isSchedulerRunning = false;

export function initBackgroundScheduler() {
  if (isSchedulerRunning) return;
  if (process.env.NODE_ENV === 'test') return;

  isSchedulerRunning = true;
  console.log('⏰ [CRON SCHEDULER] In-process Background Scheduler initialized.');

  setInterval(async () => {
    try {
      const port = process.env.PORT || 3000;
      const url = `http://localhost:${port}/api/cron`;
      await fetch(url, { method: 'GET' }).catch(() => {});
    } catch (e) {
      // ignore network errors during boot
    }
  }, 60 * 1000); // check every 1 minute
}
