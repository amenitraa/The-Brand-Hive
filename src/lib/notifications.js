// ====== NOTIFICATION SYSTEM ======
// Handles browser push notifications for:
// - New comments on your tasks
// - Tasks marked On Hold or Need Support
// - New task assigned to you
// - Due date reminders

const NOTIF_KEY = 'bt_notif_seen';

function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]')); } catch { return new Set(); }
}

function markSeen(id) {
  const seen = getSeenIds();
  seen.add(id);
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify([...seen].slice(-500))); } catch {}
}

export async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function sendNotif(title, body, tag) {
  if (!canNotify()) return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: tag || Date.now().toString(),
      badge: '/favicon.ico',
    });
  } catch (e) { console.warn('Notification failed:', e); }
}

// ---- Due date reminders ----
export function checkDueReminders(tasks, currentUser) {
  if (!canNotify()) return;
  const now = new Date();
  const myTasks = tasks.filter(t => t.assignee === currentUser && !t.completed);
  myTasks.forEach(task => {
    if (!task.due_date) return;
    const diff = (new Date(task.due_date + 'T00:00:00') - now) / 86400000;
    const tag = `due-${task.id}-${task.due_date}`;
    const seen = getSeenIds();
    if (seen.has(tag)) return;
    if (diff >= 0 && diff < 1) {
      sendNotif('⏰ Task Due Today!', `"${task.name}" is due today`, tag);
      markSeen(tag);
    } else if (diff >= 1 && diff < 2) {
      sendNotif('📅 Task Due Tomorrow', `"${task.name}" is due tomorrow`, tag);
      markSeen(tag);
    }
  });
}

// ---- New comment on your task ----
export function checkNewComment(task, currentUser) {
  if (!canNotify()) return;
  if (task.assignee !== currentUser) return;
  const comments = task.comments || [];
  if (!comments.length) return;
  const latest = comments[comments.length - 1];
  if (!latest || latest.author === currentUser) return;
  const tag = `comment-${latest.id || latest.created_at}`;
  if (getSeenIds().has(tag)) return;
  sendNotif(`💬 New comment on "${task.name}"`, `${latest.author}: ${latest.text?.slice(0, 80)}`, tag);
  markSeen(tag);
}

// ---- Task status changed to On Hold or Need Support ----
export function checkStatusAlert(task, currentUser) {
  if (!canNotify()) return;
  if (task.assignee !== currentUser) return;
  const alertStatuses = ['on-hold', 'need-support'];
  if (!alertStatuses.includes(task.status)) return;
  const tag = `status-${task.id}-${task.status}`;
  if (getSeenIds().has(tag)) return;
  const emoji = task.status === 'on-hold' ? '⏸' : '🆘';
  const label = task.status === 'on-hold' ? 'On Hold' : 'Needs Support';
  sendNotif(`${emoji} Task marked "${label}"`, `"${task.name}" needs your attention`, tag);
  markSeen(tag);
}

// ---- New task assigned to you ----
export function checkNewAssignment(task, currentUser) {
  if (!canNotify()) return;
  if (task.assignee !== currentUser) return;
  const tag = `assigned-${task.id}`;
  if (getSeenIds().has(tag)) return;
  sendNotif('📋 New task assigned to you', `"${task.name}"`, tag);
  markSeen(tag);
}

// ---- Run all checks on full task list ----
export function runAllChecks(tasks, currentUser) {
  if (!canNotify()) return;
  checkDueReminders(tasks, currentUser);
  tasks.forEach(task => {
    checkNewComment(task, currentUser);
    checkStatusAlert(task, currentUser);
  });
}

// ---- In-app notification toast (always shows, no permission needed) ----
export function showInAppAlert(message, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  let container = root.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; root.appendChild(container); }
  const toast = document.createElement('div');
  const icons = { info: '🔔', success: '✅', warning: '⚠️', comment: '💬', hold: '⏸', support: '🆘' };
  toast.className = `toast ${type === 'success' ? 'success' : ''}`;
  toast.innerHTML = `<span style="font-size:15px">${icons[type]||'🔔'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.25s'; setTimeout(()=>toast.remove(), 250); }, 5000);
}
