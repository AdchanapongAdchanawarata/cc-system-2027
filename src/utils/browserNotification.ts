/**
 * Browser Desktop Notification & Web Audio Chime Utility
 * For instant active alerting when tasks are assigned to team members
 */

export function isDesktopNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getDesktopNotificationPermission(): NotificationPermission {
  if (!isDesktopNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (!isDesktopNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Failed to request notification permission:', e);
    return Notification.permission;
  }
}

/**
 * Synthesizes an attention-grabbing, pleasant two-tone chime
 * using the browser's Web Audio API (zero audio file downloads required).
 */
export function playAssignmentChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // In some browsers, AudioContext starts in suspended state until user gesture
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: High note (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonious higher chime (880 Hz - A5) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Clean up context after sound completes
    setTimeout(() => {
      try {
        ctx.close().catch(() => {});
      } catch (e) {}
    }, 1000);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

/**
 * Fires an OS-level Native Desktop Notification
 */
export function showDesktopNotification(options: {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  onClick?: () => void;
}): void {
  if (!isDesktopNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'cc-assignment-alert',
      requireInteraction: true, // Remains on screen until clicked or dismissed
      silent: false,
    });

    if (options.onClick) {
      notif.onclick = () => {
        try {
          window.focus();
        } catch (e) {}
        options.onClick?.();
        notif.close();
      };
    }
  } catch (e) {
    console.error('Failed to trigger desktop notification:', e);
  }
}

/**
 * Orchestrates full active alert (Audio Chime + Desktop OS Notification)
 */
export function triggerActiveAssignmentAlert(options: {
  projectName: string;
  taskCode?: string;
  deadline?: string;
  requesterName?: string;
  briefId?: string;
  onOpen?: () => void;
}): void {
  // 1. Play audible sound chime
  playAssignmentChime();

  // 2. Pop up Native OS Notification
  const codeText = options.taskCode ? `[${options.taskCode}] ` : '';
  const deadlineText = options.deadline ? `\n🗓️ กำหนดส่ง: ${options.deadline}` : '';
  const requesterText = options.requesterName ? `\n👤 ผู้ขอ: ${options.requesterName}` : '';

  showDesktopNotification({
    title: `📋 คุณได้รับมอบหมายงานใหม่!`,
    body: `${codeText}${options.projectName}${deadlineText}${requesterText}\n👉 คลิกเพื่อเปิดดูรายละเอียดงานทันที`,
    tag: `task-assign-${options.briefId || Date.now()}`,
    onClick: options.onOpen,
  });
}
