import { icons } from '../lib/icons.js';
import { getAgents, saveAgent, deleteAgent, agentStatusInfo, AGENT_STATUSES, LIFECYCLE_STAGES } from '../lib/agents.js';
import { getMemberNames, getMembers, PASTEL_COLORS } from '../lib/helpers.js';
import { showToast } from './Toast.js';

// ====== USAGE LOG HELPERS ======
function getUsageLog(agentId) {
  try { return JSON.parse(localStorage.getItem(`bt_usage_${agentId}`) || '[]'); } catch { return []; }
}
function saveUsageLog(agentId, log) {
  try { localStorage.setItem(`bt_usage_${agentId}`, JSON.stringify(log)); } catch {}
}
function addUsageEntry(agentId, entry) {
  const log = getUsageLog(agentId);
  log.unshift({ ...entry, id: Date.now(), timestamp: new Date().toISOString() });
  saveUsageLog(agentId, log);
  return log;
}
function getAgentStats(agentId) {
  const log = getUsageLog(agentId);
  if (!log.length) return { totalUses: 0, avgRating: 0, uniqueUsers: 0, lastUsed: null, weeklyUses: 0 };
  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const uniqueUsers = [...new Set(log.map(e => e.user))].length;
  const rated = log.filter(e => e.rating > 0);
  const avgRating = rated.length ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length) : 0;
  const weeklyUses = log.filter(e => new Date(e.timestamp) > weekAgo).length;
  return { totalUses: log.length, avgRating: Math.round(avgRating * 10) / 10, uniqueUsers, lastUsed: log[0]?.timestamp, weeklyUses };
}

export function renderAgentDetail(panel, agentId, onClose, onRefresh) {
  const agents = getAgents();
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return;
  const si = agentStatusInfo(agent.status);
  const stats = getAgentStats(agentId);

  panel.innerHTML = `
    <div class="agent-detail-header">
      <div style="width:48px;height:48px;border-radius:14px;background:${hexRgba(agent.color,0.25)};display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${agent.icon}</div>
      <div class="agent-detail-header-info">
        <div class="agent-detail-name">${esc(agent.name)}</div>
        <div class="agent-detail-desc">${esc(agent.description)}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:5px">
            <div class="agent-status-dot ${si.dot}"></div>
            <span class="agent-status-label ${si.text}" style="font-size:12px">${si.label}</span>
          </div>
          ${stats.totalUses > 0 ? `<span style="font-size:12px;color:var(--text-muted)">📊 ${stats.totalUses} uses</span>` : ''}
          ${stats.avgRating > 0 ? `<span style="font-size:12px;color:var(--amber)">⭐ ${stats.avgRating}/5</span>` : ''}
          ${stats.uniqueUsers > 0 ? `<span style="font-size:12px;color:var(--text-muted)">👥 ${stats.uniqueUsers} user${stats.uniqueUsers!==1?'s':''}</span>` : ''}
        </div>
      </div>
      <button class="modal-close" id="detail-close">${icons.x}</button>
    </div>

    <div style="display:flex;border-bottom:1px solid var(--border);flex-shrink:0;overflow-x:auto">
      ${['overview','usage','actions','timeline','edit'].map(t=>`
        <div style="flex:1;padding:11px 8px;text-align:center;font-size:12px;font-weight:500;color:${t==='overview'?'var(--accent)':'var(--text-secondary)'};cursor:pointer;border-bottom:2px solid ${t==='overview'?'var(--accent)':'transparent'};transition:all 0.13s;white-space:nowrap" data-dtab="${t}">${tabLabel(t)}</div>
      `).join('')}
    </div>

    <div class="agent-detail-body"><div id="detail-body" style="display:flex;flex-direction:column;gap:12px;padding-bottom:20px"></div></div>

    <div class="agent-detail-footer">
      <button class="btn btn-danger btn-sm" id="detail-delete">${icons.trash} Delete</button>
      <div style="flex:1"></div>
      <button class="btn btn-ghost btn-sm" id="log-usage-btn" style="color:var(--green);border-color:rgba(45,158,107,0.3)">✅ Log Usage</button>
      ${agent.link ? `<a href="${esc(agent.link)}" target="_blank" class="btn btn-ghost btn-sm">Open Agent ↗</a>` : ''}
      <button class="btn btn-primary btn-sm" id="detail-save">Save Changes</button>
    </div>
  `;

  let activeTab = 'overview';
  renderDetailTab(panel.querySelector('#detail-body'), agent, activeTab);
  bindDetailTabEvents(panel, agent, activeTab, onRefresh, agentId);

  panel.querySelectorAll('[data-dtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('[data-dtab]').forEach(t => {
        t.style.color = 'var(--text-secondary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.style.color = 'var(--accent)';
      tab.style.borderBottomColor = 'var(--accent)';
      activeTab = tab.dataset.dtab;
      renderDetailTab(panel.querySelector('#detail-body'), agent, activeTab);
      bindDetailTabEvents(panel, agent, activeTab, onRefresh, agentId);
    });
  });

  panel.querySelector('#detail-close').addEventListener('click', onClose);
  panel.querySelector('#detail-delete').addEventListener('click', () => {
    if (!confirm('Delete this agent?')) return;
    deleteAgent(agentId);
    showToast('Agent deleted', 'success');
    onClose();
  });
  panel.querySelector('#detail-save').addEventListener('click', () => {
    collectEdits(panel, agent, activeTab);
    saveAgent(agent);
    showToast('Agent saved!', 'success');
    onRefresh();
  });

  // Log usage button
  panel.querySelector('#log-usage-btn').addEventListener('click', () => {
    openLogUsageModal(agentId, agent, () => {
      // Refresh stats in header after logging
      renderAgentDetail(panel, agentId, onClose, onRefresh);
    });
  });
}

function tabLabel(t) {
  const labels = { overview: '📋 Overview', usage: '📊 Usage', actions: '✅ Actions', timeline: '📅 Timeline', edit: '✏️ Edit' };
  return labels[t] || t;
}

// ====== TAB RENDERERS ======
function renderDetailTab(body, agent, tab) {
  if (tab === 'overview') body.innerHTML = renderOverview(agent);
  else if (tab === 'usage') body.innerHTML = renderUsage(agent);
  else if (tab === 'actions') body.innerHTML = renderActions(agent);
  else if (tab === 'timeline') body.innerHTML = renderTimeline(agent);
  else if (tab === 'edit') body.innerHTML = renderEdit(agent);
}

function renderOverview(agent) {
  const stats = getAgentStats(agent.id);
  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
      ${[
        { val: stats.totalUses, label: 'Total Uses', color: agent.color },
        { val: stats.weeklyUses, label: 'This Week', color: '#bfdbfe' },
        { val: stats.avgRating > 0 ? `${stats.avgRating}★` : '—', label: 'Avg Rating', color: '#fde68a' },
      ].map(s=>`
        <div style="background:${hexRgba(s.color,0.18)};border-radius:var(--radius-lg);padding:12px;text-align:center;border:1px solid ${hexRgba(s.color,0.25)}">
          <div style="font-size:22px;font-weight:700;color:${darken(s.color)}">${s.val}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;color:${darken(s.color)};opacity:0.7;margin-top:2px">${s.label}</div>
        </div>
      `).join('')}
    </div>

    ${(agent.halts||[]).length > 0 ? `
      <div style="background:rgba(201,64,64,0.06);border:1px solid rgba(201,64,64,0.2);border-radius:var(--radius-lg);padding:12px 14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--red);margin-bottom:8px">⚠ Halts & Blockers</div>
        ${agent.halts.map(h=>`<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--red);padding:4px 0">${icons.warning} ${esc(h)}</div>`).join('')}
      </div>` : ''}

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">📋 Progress Readout</div>
      <div style="padding:12px 14px">
        <textarea id="ov-progress" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;min-height:80px;resize:vertical;transition:all 0.13s" onfocus="this.style.borderColor='rgba(124,111,205,0.5)'" onblur="this.style.borderColor=''">${esc(agent.progressReadout||'')}</textarea>
      </div>
    </div>

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">🔗 Campaign Lifecycle</div>
      <div style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px">
        ${LIFECYCLE_STAGES.map(s=>{
          const active = (agent.lifecycle||[]).includes(s);
          return `<div data-stage="${s}" style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.13s;background:${active?hexRgba(agent.color,0.25):'var(--bg-elevated)'};color:${active?darken(agent.color):'var(--text-muted)'};border:1px solid ${active?hexRgba(agent.color,0.4):'var(--border)'}">${cap(s)}</div>`;
        }).join('')}
      </div>
    </div>

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">👥 Cross-Functional Teams</div>
      <div style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px">
        ${['Marketing','Sales','Product','PR','Legal','Leadership'].map(t=>{
          const active = (agent.crossFunctional||[]).includes(t);
          return `<div data-team="${t}" style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.13s;background:${active?'var(--accent-dim)':'var(--bg-elevated)'};color:${active?'var(--accent)':'var(--text-secondary)'};border:1px solid ${active?'rgba(124,111,205,0.4)':'var(--border)'}">${t}</div>`;
        }).join('')}
      </div>
    </div>

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">💬 Usage Notes</div>
      <div style="padding:12px 14px">
        <textarea id="ov-usage" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;min-height:60px;resize:vertical" placeholder="How is this agent being used day to day?">${esc(agent.usageNotes||'')}</textarea>
      </div>
    </div>

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">🔗 Agent Link / URL</div>
      <div style="padding:12px 14px">
        <input id="ov-link" value="${esc(agent.link||'')}" placeholder="https://..." style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none" />
      </div>
    </div>
  `;
}

function renderUsage(agent) {
  const log = getUsageLog(agent.id);
  const stats = getAgentStats(agent.id);
  const members = getMembers();

  // Weekly breakdown
  const now = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weekData = Array(7).fill(0);
  log.forEach(e => {
    const d = new Date(e.timestamp);
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 7) weekData[6 - diff]++;
  });
  const maxDay = Math.max(...weekData, 1);

  // Unique users breakdown
  const userCounts = {};
  log.forEach(e => { userCounts[e.user] = (userCounts[e.user] || 0) + 1; });

  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
      ${[
        { val: stats.totalUses, label: 'Total Uses', bg: hexRgba(agent.color,0.15), color: darken(agent.color) },
        { val: stats.weeklyUses, label: 'This Week', bg: 'rgba(96,165,250,0.12)', color: '#2a65b8' },
        { val: stats.uniqueUsers, label: 'Unique Users', bg: 'rgba(45,158,107,0.1)', color: '#1e7a52' },
        { val: stats.avgRating > 0 ? `${stats.avgRating}★` : '—', label: 'Avg Rating', bg: 'rgba(196,125,26,0.1)', color: '#9e6314' },
      ].map(s=>`
        <div style="background:${s.bg};border-radius:var(--radius-lg);padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:${s.color}">${s.val}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;color:${s.color};opacity:0.7;margin-top:1px">${s.label}</div>
        </div>
      `).join('')}
    </div>

    ${stats.lastUsed ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;font-family:var(--mono)">Last used: ${new Date(stats.lastUsed).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</div>` : ''}

    <!-- Weekly bar chart -->
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:12px">Usage — Last 7 Days</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:60px">
        ${weekData.map((count, i) => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-size:10px;color:var(--text-muted);font-weight:600">${count||''}</div>
            <div style="width:100%;border-radius:4px 4px 0 0;background:${hexRgba(agent.color,0.7)};height:${count?Math.max((count/maxDay)*44,6):2}px;transition:height 0.3s"></div>
            <div style="font-size:9px;color:var(--text-muted)">${days[(new Date().getDay()-6+i+7)%7]}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- User breakdown -->
    ${Object.keys(userCounts).length > 0 ? `
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:10px">Usage by Team Member</div>
        ${Object.entries(userCounts).sort((a,b)=>b[1]-a[1]).map(([user, count]) => {
          const m = members.find(m=>m.name===user);
          const pct = Math.round((count/stats.totalUses)*100);
          return `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:24px;height:24px;border-radius:50%;background:${m?.color||'#e9d5ff'};display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${m?.icon||'👤'}</div>
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                  <span style="font-size:12px;font-weight:500">${esc(user)}</span>
                  <span style="font-size:11px;color:var(--text-muted)">${count} use${count!==1?'s':''}</span>
                </div>
                <div style="height:5px;background:var(--bg-elevated);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${m?.color||agent.color};border-radius:4px;transition:width 0.3s"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>` : ''}

    <!-- Usage log feed -->
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">
        Usage Log
      </div>
      <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
        ${log.length === 0 ? `
          <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
            No usage logged yet. Click <strong>Log Usage</strong> after using this agent!
          </div>` : ''}
        ${log.map(entry => {
          const m = members.find(m=>m.name===entry.user);
          return `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-elevated);border-radius:var(--radius);border:1px solid var(--border)">
              <div style="width:28px;height:28px;border-radius:50%;background:${m?.color||'#e9d5ff'};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${m?.icon||'👤'}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap">
                  <span style="font-size:12px;font-weight:600">${esc(entry.user)}</span>
                  <span style="font-size:11px;color:var(--text-muted);font-family:var(--mono)">${relTime(entry.timestamp)}</span>
                  ${entry.rating ? `<span style="font-size:11px">${'⭐'.repeat(entry.rating)}</span>` : ''}
                </div>
                ${entry.note ? `<div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${esc(entry.note)}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderActions(agent) {
  const items = agent.actionItems || [];
  const halts = agent.halts || [];
  return `
    ${halts.length > 0 ? `
      <div style="background:rgba(201,64,64,0.06);border:1px solid rgba(201,64,64,0.2);border-radius:var(--radius-lg);padding:12px 14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--red);margin-bottom:8px">⚠ Halts</div>
        ${halts.map((h,i)=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="flex:1;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--red)">${icons.warning} ${esc(h)}</div>
            <button class="row-btn danger" data-del-halt="${i}">${icons.x}</button>
          </div>`).join('')}
      </div>` : ''}

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        ✅ Action Items
        <button class="btn btn-ghost btn-sm" id="add-action-item">${icons.plus} Add</button>
      </div>
      <div style="padding:0 14px">
        ${items.length === 0 ? '<div style="padding:14px 0;color:var(--text-muted);font-size:13px">No action items yet.</div>' : ''}
        ${items.map((item,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
            <div class="action-check ${item.done?'done':''}" data-check="${i}">${item.done?icons.check:''}</div>
            <div style="flex:1;font-size:13px;color:var(--text-primary);${item.done?'text-decoration:line-through;color:var(--text-muted)':''}">${esc(item.text)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${esc(item.owner||'')}</div>
            <button class="row-btn danger" data-del-action="${i}">${icons.x}</button>
          </div>`).join('')}
      </div>
    </div>

    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--red);border-bottom:1px solid var(--border)">⚠ Add Halt / Blocker</div>
      <div style="padding:12px 14px;display:flex;gap:8px">
        <input id="halt-input" placeholder="Describe the blocker..." style="flex:1;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none" />
        <button class="btn btn-danger btn-sm" id="add-halt">Add</button>
      </div>
    </div>
  `;
}

function renderTimeline(agent) {
  const items = [...(agent.timeline||[])].reverse();
  return `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        📅 Timeline
      </div>
      <div style="padding:14px 16px">
        <div style="display:flex;flex-direction:column;gap:0">
          ${items.map((item,i)=>`
            <div style="display:flex;gap:12px;position:relative">
              ${i < items.length-1 ? `<div style="position:absolute;left:7px;top:16px;bottom:-4px;width:1px;background:var(--border)"></div>` : ''}
              <div style="width:15px;height:15px;border-radius:50%;background:${item.color||agent.color};border:2px solid var(--bg-surface);flex-shrink:0;margin-top:2px;position:relative;z-index:1"></div>
              <div style="flex:1;padding-bottom:16px">
                <div style="font-size:10px;font-family:var(--mono);color:var(--text-muted)">${item.date}</div>
                <div style="font-size:13px;font-weight:500;color:var(--text-primary);margin:2px 0">${esc(item.title)}</div>
                ${item.note?`<div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${esc(item.note)}</div>`:''}
              </div>
            </div>`).join('')}
        </div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Add Event</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input id="tl-date" type="date" value="${new Date().toISOString().split('T')[0]}" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:7px 10px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;width:100%" />
            <input id="tl-title" placeholder="Event title" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:7px 10px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;width:100%" />
            <input id="tl-note" placeholder="Notes (optional)" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:7px 10px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;width:100%" />
            <button class="btn btn-primary btn-sm" id="add-tl-btn" style="align-self:flex-end">${icons.plus} Add Event</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEdit(agent) {
  return `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:10px 14px;background:var(--bg-elevated);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);border-bottom:1px solid var(--border)">✏️ Edit Agent</div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:12px">
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Name</div><input id="edit-name" value="${esc(agent.name)}" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none" /></div>
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Description</div><textarea id="edit-desc" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;min-height:70px;resize:vertical">${esc(agent.description)}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Status</div>
            <select id="edit-status" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;cursor:pointer;appearance:none">
              ${AGENT_STATUSES.map(s=>`<option value="${s.value}" ${agent.status===s.value?'selected':''}>${s.label}</option>`).join('')}
            </select>
          </div>
          <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Partner</div><input id="edit-partner" value="${esc(agent.partner||'')}" placeholder="e.g. Claude, OpenAI..." style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none" /></div>
        </div>
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Icon (emoji)</div><input id="edit-icon" value="${agent.icon||'🤖'}" style="width:60px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px;font-size:20px;color:var(--text-primary);font-family:var(--font);outline:none;text-align:center" maxlength="4" /></div>
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Color</div>
          <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px">
            ${PASTEL_COLORS.slice(0,36).map(c=>`<div class="color-swatch ${c===agent.color?'selected':''}" data-edit-color="${c}" style="background:${c};border-color:${c===agent.color?'#333':'transparent'}"></div>`).join('')}
          </div>
        </div>
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px">Agent Prompt</div><textarea id="edit-prompt" placeholder="Paste or write the agent's system prompt here..." style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;min-height:120px;resize:vertical">${esc(agent.agentPrompt||'')}</textarea></div>
      </div>
    </div>
  `;
}

// ====== LOG USAGE MODAL ======
function openLogUsageModal(agentId, agent, onLogged) {
  const members = getMemberNames();
  let selectedRating = 0;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.25);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:3000';
  overlay.innerHTML = `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;width:400px;box-shadow:var(--shadow-lg);animation:slideIn 0.18s ease">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
        <div style="width:42px;height:42px;border-radius:12px;background:${hexRgba(agent.color,0.25)};display:flex;align-items:center;justify-content:center;font-size:22px">${agent.icon}</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary)">Log Usage</div>
          <div style="font-size:12px;color:var(--text-muted)">${esc(agent.name)}</div>
        </div>
      </div>

      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Who used it?</div>
        <select id="log-user" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;cursor:pointer;appearance:none">
          <option value="">Select team member...</option>
          ${members.map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">How did it perform?</div>
        <div style="display:flex;gap:8px;margin-bottom:4px" id="star-row">
          ${[1,2,3,4,5].map(n=>`<span data-star="${n}" style="font-size:28px;cursor:pointer;filter:grayscale(1) opacity(0.3);transition:all 0.1s">⭐</span>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--text-muted)" id="star-label">Click to rate</div>
      </div>

      <div style="margin-bottom:18px">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Notes (optional)</div>
        <textarea id="log-note" placeholder="What did you use it for? Any feedback?" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text-primary);font-family:var(--font);outline:none;min-height:70px;resize:vertical"></textarea>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="log-cancel" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="log-submit" class="btn btn-primary btn-sm">✅ Log Usage</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Star rating
  const starLabels = ['','Needs work','Could be better','Good','Great!','Outstanding! 🎉'];
  overlay.querySelectorAll('[data-star]').forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.star);
      overlay.querySelectorAll('[data-star]').forEach(s => {
        s.style.filter = parseInt(s.dataset.star) <= selectedRating ? 'none' : 'grayscale(1) opacity(0.3)';
      });
      overlay.querySelector('#star-label').textContent = starLabels[selectedRating];
    });
    star.addEventListener('mouseover', () => {
      overlay.querySelectorAll('[data-star]').forEach(s => {
        s.style.filter = parseInt(s.dataset.star) <= parseInt(star.dataset.star) ? 'none' : 'grayscale(1) opacity(0.3)';
      });
    });
    star.addEventListener('mouseout', () => {
      overlay.querySelectorAll('[data-star]').forEach(s => {
        s.style.filter = parseInt(s.dataset.star) <= selectedRating ? 'none' : 'grayscale(1) opacity(0.3)';
      });
    });
  });

  overlay.querySelector('#log-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#log-submit').addEventListener('click', () => {
    const user = overlay.querySelector('#log-user').value;
    if (!user) { showToast('Please select who used it', 'error'); return; }
    const note = overlay.querySelector('#log-note').value.trim();
    addUsageEntry(agentId, { user, rating: selectedRating, note });

    // Also update userCount on agent
    const agents = getAgents();
    const agent2 = agents.find(a => a.id === agentId);
    if (agent2) {
      const log = getUsageLog(agentId);
      const uniqueUsers = [...new Set(log.map(e => e.user))].length;
      agent2.userCount = uniqueUsers;
      saveAgent(agent2);
    }

    overlay.remove();
    showToast('Usage logged! 📊', 'success');
    if (onLogged) onLogged();
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ====== BIND EVENTS ======
function bindDetailTabEvents(panel, agent, tab, onRefresh, agentId) {
  panel.querySelectorAll('[data-stage]').forEach(el => {
    el.addEventListener('click', () => {
      const s = el.dataset.stage;
      if (!agent.lifecycle) agent.lifecycle = [];
      agent.lifecycle.includes(s) ? agent.lifecycle.splice(agent.lifecycle.indexOf(s),1) : agent.lifecycle.push(s);
      el.style.background = agent.lifecycle.includes(s) ? hexRgba(agent.color,0.25) : 'var(--bg-elevated)';
      el.style.color = agent.lifecycle.includes(s) ? darken(agent.color) : 'var(--text-muted)';
      el.style.borderColor = agent.lifecycle.includes(s) ? hexRgba(agent.color,0.4) : 'var(--border)';
    });
  });
  panel.querySelectorAll('[data-team]').forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.team;
      if (!agent.crossFunctional) agent.crossFunctional = [];
      agent.crossFunctional.includes(t) ? agent.crossFunctional.splice(agent.crossFunctional.indexOf(t),1) : agent.crossFunctional.push(t);
      el.style.background = agent.crossFunctional.includes(t) ? 'var(--accent-dim)' : 'var(--bg-elevated)';
      el.style.color = agent.crossFunctional.includes(t) ? 'var(--accent)' : 'var(--text-secondary)';
      el.style.borderColor = agent.crossFunctional.includes(t) ? 'rgba(124,111,205,0.4)' : 'var(--border)';
    });
  });
  panel.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.check);
      agent.actionItems[idx].done = !agent.actionItems[idx].done;
      saveAgent(agent);
      showToast('Updated!', 'success');
      renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
      bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
    });
  });
  panel.querySelectorAll('[data-del-action]').forEach(el => {
    el.addEventListener('click', () => {
      agent.actionItems.splice(parseInt(el.dataset.delAction),1);
      saveAgent(agent);
      renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
      bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
    });
  });
  panel.querySelectorAll('[data-del-halt]').forEach(el => {
    el.addEventListener('click', () => {
      agent.halts.splice(parseInt(el.dataset.delHalt),1);
      saveAgent(agent);
      showToast('Halt resolved!','success');
      renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
      bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
    });
  });
  panel.querySelector('#add-action-item')?.addEventListener('click', () => {
    const text = prompt('Action item:'); if (!text) return;
    const owner = prompt('Owner:') || '';
    if (!agent.actionItems) agent.actionItems = [];
    agent.actionItems.push({ id: 'ai-'+Date.now(), text, done: false, owner });
    saveAgent(agent);
    renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
    bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
  });
  panel.querySelector('#add-halt')?.addEventListener('click', () => {
    const val = panel.querySelector('#halt-input')?.value.trim(); if (!val) return;
    if (!agent.halts) agent.halts = [];
    agent.halts.push(val); saveAgent(agent); showToast('Halt added','success');
    renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
    bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
  });
  panel.querySelector('#add-tl-btn')?.addEventListener('click', () => {
    const date = panel.querySelector('#tl-date')?.value;
    const title = panel.querySelector('#tl-title')?.value.trim(); if (!title) return;
    const note = panel.querySelector('#tl-note')?.value || '';
    if (!agent.timeline) agent.timeline = [];
    agent.timeline.push({ date, title, note, color: agent.color });
    saveAgent(agent);
    renderDetailTab(panel.querySelector('#detail-body'), agent, tab);
    bindDetailTabEvents(panel, agent, tab, onRefresh, agentId);
  });
  panel.querySelectorAll('[data-edit-color]').forEach(sw => {
    sw.addEventListener('click', () => {
      panel.querySelectorAll('[data-edit-color]').forEach(s=>{s.classList.remove('selected');s.style.borderColor='transparent';});
      sw.classList.add('selected'); sw.style.borderColor='#333';
      agent.color = sw.dataset.editColor;
    });
  });
}

function collectEdits(panel, agent, tab) {
  if (tab === 'overview') {
    agent.progressReadout = panel.querySelector('#ov-progress')?.value ?? agent.progressReadout;
    agent.usageNotes = panel.querySelector('#ov-usage')?.value ?? agent.usageNotes;
    agent.link = panel.querySelector('#ov-link')?.value ?? agent.link;
  } else if (tab === 'edit') {
    agent.name = panel.querySelector('#edit-name')?.value || agent.name;
    agent.description = panel.querySelector('#edit-desc')?.value || agent.description;
    agent.status = panel.querySelector('#edit-status')?.value || agent.status;
    agent.partner = panel.querySelector('#edit-partner')?.value ?? agent.partner;
    agent.icon = panel.querySelector('#edit-icon')?.value || agent.icon;
    agent.agentPrompt = panel.querySelector('#edit-prompt')?.value ?? agent.agentPrompt;
  }
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff/60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min/60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr/24)}d ago`;
}
function hexRgba(hex, a) { if(!hex||!hex.startsWith('#')) return `rgba(180,180,180,${a})`; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function darken(hex) { if(!hex||!hex.startsWith('#')) return '#333'; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgb(${Math.round(r*.4)},${Math.round(g*.4)},${Math.round(b*.4)})`; }
function cap(s) { return s?s.charAt(0).toUpperCase()+s.slice(1):''; }
function esc(str) { if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
