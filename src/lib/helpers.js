// ====== PASTEL COLOR PALETTE ======
export const PASTEL_COLORS = [
  // Pinks & Roses
  '#ffc8d3','#ffb3c6','#ff9fb3','#ffa8c5','#f9a8d4','#f0abcf','#e9b8d0','#f4c2cc',
  // Purples & Lavenders
  '#e9d5ff','#ddd6fe','#c4b5fd','#d8b4fe','#e0c3fc','#c8b8e8','#b8a9e0','#d4bfff',
  // Blues
  '#bfdbfe','#bae6fd','#a5f3fc','#99d6ea','#b3d9f7','#c5dff8','#aecbf0','#93c5fd',
  // Teals & Mints
  '#99f6e4','#a7f3d0','#6ee7b7','#b2f5d4','#a3e4d7','#c1ece3','#adebd9','#86efac',
  // Greens
  '#bbf7d0','#d1fae5','#c6f6d5','#b2dfdb','#c8e6c9','#dcedc8','#f0fdf4','#a7f3d0',
  // Yellows & Peaches
  '#fef08a','#fde68a','#fcd34d','#fde9c4','#fed7aa','#fdba74','#fbb6b0','#fca5a5',
  // Corals & Salmons
  '#fca5a5','#f9a8a8','#ffb3ae','#ffc0b3','#ffcba4','#ffd6c0','#fecaca','#fda4af',
  // Warm Neutrals / Creams
  '#fef9c3','#fef3c7','#fffbeb','#fef2f2','#f5f0ff','#ede9fe','#f0fdf4','#f0f9ff',
];

// ====== EMOJI ICONS for members & projects ======
export const MEMBER_ICONS = [
  '🌸','🌺','🌻','🌹','🌷','🍀','🌿','🎀',
  '⭐','🌟','✨','💫','🌙','☀️','🌈','🎯',
  '🦋','🐝','🌊','🍃','🎪','🎨','💎','🔮',
  '🏆','🎭','🎸','🎵','🌴','🦚','🦜','🌺',
];

export const PROJECT_ICONS = [
  '📊','📈','📋','📌','🗂️','📁','📝','✏️',
  '💡','🔍','🎯','🚀','⚡','🔥','💼','🏷️',
  '🌐','🤖','📣','🎬','🎨','🛠️','📱','💻',
  '🗺️','🔗','📡','🎤','🏗️','🌱','💰','🎁',
];

// ====== DYNAMIC MEMBERS & PROJECTS (localStorage backed) ======
const DEFAULT_MEMBERS = [
  { name: 'Amanda',   color: '#f9a8d4', icon: '🌸' },
  { name: 'Amenitra', color: '#a7f3d0', icon: '🌿' },
  { name: 'Vivi',     color: '#bfdbfe', icon: '💫' },
  { name: 'Kate',     color: '#e9d5ff', icon: '🦋' },
  { name: 'Grace',    color: '#fde68a', icon: '⭐' },
  { name: 'Shannon',  color: '#fca5a5', icon: '🌺' },
];

const DEFAULT_PROJECTS = [
  { value: 'industry',        label: 'Industry',        color: '#e9d5ff', icon: '📊' },
  { value: 'account',         label: 'Account',         color: '#a7f3d0', icon: '💼' },
  { value: 'planning',        label: 'Planning',        color: '#bfdbfe', icon: '📋' },
  { value: 'brand-advocacy',  label: 'Brand Advocacy',  color: '#f9a8d4', icon: '📣' },
  { value: 'activation',      label: 'Activation',      color: '#fde68a', icon: '⚡' },
  { value: 'campaign-review', label: 'Campaign Review', color: '#fca5a5', icon: '🎬' },
  { value: 'web',             label: 'Web',             color: '#99f6e4', icon: '🌐' },
  { value: 'ai',              label: 'AI',              color: '#ddd6fe', icon: '🤖' },
];

function load(key, def) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : def;
  } catch { return def; }
}

function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function getMembers() { return load('bt_members', DEFAULT_MEMBERS); }
export function getProjects() { return load('bt_projects', DEFAULT_PROJECTS); }

export function saveMember(member) {
  const members = getMembers();
  const idx = members.findIndex(m => m.name === member.name);
  if (idx >= 0) members[idx] = member; else members.push(member);
  save('bt_members', members);
}

export function deleteMember(name) {
  const members = getMembers().filter(m => m.name !== name);
  save('bt_members', members);
}

export function saveProject(project) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.value === project.value);
  if (idx >= 0) projects[idx] = project; else projects.push(project);
  save('bt_projects', projects);
}

export function deleteProject(value) {
  const projects = getProjects().filter(p => p.value !== value);
  save('bt_projects', projects);
}

// Backwards-compat shims
export function getMemberColors() {
  const out = {};
  getMembers().forEach(m => { out[m.name] = { bg: m.color, text: darkenColor(m.color), icon: m.icon }; });
  return out;
}

export function getMemberNames() { return getMembers().map(m => m.name); }

// ====== COLOR UTILS ======
export function darkenColor(hex) {
  // Returns a darkened version of a pastel for text
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*0.45)},${Math.round(g*0.45)},${Math.round(b*0.45)})`;
}

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function projectBadgeStyle(projectValue) {
  const proj = getProjects().find(p => p.value === projectValue);
  if (!proj) return '';
  const bg = hexToRgba(proj.color, 0.25);
  const color = darkenColor(proj.color);
  const border = hexToRgba(proj.color, 0.4);
  return `background:${bg};color:${color};border-color:${border}`;
}

export function memberAvatarStyle(memberName) {
  const member = getMembers().find(m => m.name === memberName);
  if (!member) return { bg: '#e9d5ff', text: '#4a3080', icon: '👤' };
  return { bg: member.color, text: darkenColor(member.color), icon: member.icon };
}

// ====== STATUSES ======
export const STATUSES = [
  { value: 'not-started',   label: 'Not Started' },
  { value: 'in-progress',   label: 'In Progress' },
  { value: 'done',          label: 'Done' },
  { value: 'on-hold',       label: 'On Hold' },
  { value: 'need-support',  label: 'Need Support' },
];

export const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High' },
  { value: 'medium',   label: 'Medium' },
  { value: 'low',      label: 'Low' },
];

// ====== DATE / FORMAT UTILS ======
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDueClass(dateStr, completed) {
  if (!dateStr || completed) return '';
  const diff = (new Date(dateStr + 'T00:00:00') - new Date()) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff < 3) return 'soon';
  return '';
}

export function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

export function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function projectLabel(value) {
  return getProjects().find(p => p.value === value)?.label || value;
}
export function statusLabel(value) {
  return STATUSES.find(s => s.value === value)?.label || value;
}
export function priorityLabel(value) {
  return PRIORITIES.find(p => p.value === value)?.label || value;
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Notifications
export function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
export function sendNotif(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}
export function checkDueReminders(tasks, currentUser) {
  tasks.filter(t => t.assignee === currentUser && !t.completed).forEach(task => {
    if (!task.due_date) return;
    const diff = (new Date(task.due_date + 'T00:00:00') - new Date()) / 86400000;
    if (diff >= 0 && diff <= 1) sendNotif('Task Due Soon', `"${task.name}" is due ${diff < 0.5 ? 'today' : 'tomorrow'}!`);
  });
}
