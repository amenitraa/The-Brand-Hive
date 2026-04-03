import { icons } from '../lib/icons.js';
import { getAgents, saveAgent, deleteAgent, agentStatusInfo, AGENT_STATUSES, LIFECYCLE_STAGES } from '../lib/agents.js';
import { getMemberNames, PASTEL_COLORS } from '../lib/helpers.js';
import { showToast } from './Toast.js';

export function renderAgentDetail(panel, agentId, onClose, onRefresh) {
  const agents = getAgents();
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return;
  const si = agentStatusInfo(agent.status);
  const members = getMemberNames();

  panel.innerHTML = `
    <div class="agent-detail-header">
      <div style="width:48px;height:48px;border-radius:14px;background:${hexRgba(agent.color,0.25)};display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${agent.icon}</div>
      <div class="agent-detail-header-info">
        <div class="agent-detail-name">${esc(agent.name)}</div>
        <div class="agent-detail-desc">${esc(agent.description)}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
          <div class="agent-status-dot ${si.dot}"></div>
          <span class="agent-status-label ${si.text}" style="font-size:12px">${si.label}</span>
          ${agent.userCount ? `<span style="font-size:12px;color:var(--text-muted)">${icons.user} ${agent.userCount} user${agent.userCount!==1?'s':''}</span>` : ''}
        </div>
      </div>
      <button class="modal-close" id="detail-close">${icons.x}</button>
    </div>

    <div style="display:flex;border-bottom:1px solid var(--border);flex-shrink:0">
      ${['overview','actions','timeline','edit'].map(t=>`
        <div class="settings-tab ${t==='overview'?'active':''}" data-dtab="${t}" style="flex:1;font-size:12px">${cap(t)}</div>
      `).join('')}
    </div>

    <div class="agent-detail-body" id="detail-body"></div>
    <div class="agent-detail-footer">
      <button class="btn btn-danger btn-sm" id="detail-delete">${icons.trash} Delete</button>
      <div style="flex:1"></div>
      ${agent.link ? `<a href="${esc(agent.link)}" target="_blank" class="btn btn-ghost btn-sm">Open Agent ↗</a>` : ''}
      <button class="btn btn-primary btn-sm" id="detail-save">Save Changes</button>
    </div>
  `;

  let activeTab = 'overview';
  renderDetailTab(panel.querySelector('#detail-body'), agent, activeTab, members);

  panel.querySelectorAll('[data-dtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('[data-dtab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.dtab;
      renderDetailTab(panel.querySelector('#detail-body'), agent, activeTab, members);
      bindDetailTabEvents(panel, agent, activeTab, onRefresh);
    });
  });

  bindDetailTabEvents(panel, agent, activeTab, onRefresh);

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
}

function renderDetailTab(body, agent, tab, members) {
  if (tab === 'overview') body.innerHTML = renderOverview(agent, members);
  else if (tab === 'actions') body.innerHTML = renderActions(agent, members);
  else if (tab === 'timeline') body.innerHTML = renderTimeline(agent);
  else if (tab === 'edit') body.innerHTML = renderEdit(agent, members);
}

function renderOverview(agent, members) {
  const openItems = (agent.actionItems||[]).filter(i=>!i.done).length;
  return `
    <div class="agent-stats-row">
      <div class="agent-stat"><div class="agent-stat-val">${agent.userCount||0}</div><div class="agent-stat-label">Users</div></div>
      <div class="agent-stat"><div class="agent-stat-val">${(agent.actionItems||[]).length}</div><div class="agent-stat-label">Action Items</div></div>
      <div class="agent-stat"><div class="agent-stat-val">${(agent.halts||[]).length}</div><div class="agent-stat-label">Halts</div></div>
    </div>

    ${(agent.halts||[]).length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-header" style="color:var(--red)">⚠ Halts & Blockers</div>
        <div class="detail-section-body" style="display:flex;flex-direction:column;gap:6px">
          ${agent.halts.map(h=>`<div class="action-halt">${icons.warning} ${esc(h)}</div>`).join('')}
        </div>
      </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-header">📋 Progress Readout</div>
      <div class="detail-section-body">
        <textarea id="ov-progress" class="field-input field-textarea" style="min-height:80px;background:var(--bg-elevated)">${esc(agent.progressReadout||'')}</textarea>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-header">🔗 Campaign Lifecycle Fit</div>
      <div class="detail-section-body">
        <div class="lifecycle-row">
          ${LIFECYCLE_STAGES.map(s=>`
            <div class="lifecycle-pill ${(agent.lifecycle||[]).includes(s)?'active':''}" data-stage="${s}"
              style="background:${(agent.lifecycle||[]).includes(s)?hexRgba(agent.color,0.25):'var(--bg-elevated)'};color:${(agent.lifecycle||[]).includes(s)?darken(agent.color):'var(--text-muted)'};border-color:${(agent.lifecycle||[]).includes(s)?hexRgba(agent.color,0.4):'var(--border)'}">
              ${cap(s)}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-header">👥 Cross-Functional Teams</div>
      <div class="detail-section-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${['Marketing','Sales','Product','PR','Legal','Leadership'].map(t=>`
            <div class="tag-opt ${(agent.crossFunctional||[]).includes(t)?'selected':''}" data-team="${t}" style="font-size:12px;cursor:pointer">${t}</div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-header">💬 Usage Notes</div>
      <div class="detail-section-body">
        <textarea id="ov-usage" class="field-input field-textarea" style="min-height:60px;background:var(--bg-elevated)" placeholder="How is this agent being used day to day?">${esc(agent.usageNotes||'')}</textarea>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-header">🔗 Agent Link / URL</div>
      <div class="detail-section-body">
        <input class="field-input" id="ov-link" value="${esc(agent.link||'')}" placeholder="https://..." style="background:var(--bg-elevated)" />
      </div>
    </div>
  `;
}

function renderActions(agent, members) {
  const items = agent.actionItems || [];
  const halts = agent.halts || [];
  return `
    ${halts.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-header" style="color:var(--red)">⚠ Halts</div>
        <div class="detail-section-body" style="display:flex;flex-direction:column;gap:6px">
          ${halts.map((h,i)=>`
            <div style="display:flex;align-items:center;gap:8px">
              <div class="action-halt" style="flex:1">${icons.warning} ${esc(h)}</div>
              <button class="row-btn danger" data-del-halt="${i}" title="Resolve">${icons.x}</button>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-header">
        ✅ Action Items
        <button class="btn btn-ghost btn-sm" id="add-action-item">${icons.plus} Add</button>
      </div>
      <div class="detail-section-body" style="padding:0">
        ${items.length === 0 ? '<div style="padding:14px 16px;color:var(--text-muted);font-size:13px">No action items yet.</div>' : ''}
        ${items.map((item,i)=>`
          <div class="action-item">
            <div class="action-check ${item.done?'done':''}" data-check="${i}">${item.done?icons.check:''}</div>
            <div class="action-text ${item.done?'done':''}">${esc(item.text)}</div>
            <div class="action-owner">${esc(item.owner||'')}</div>
            <button class="row-btn danger" data-del-action="${i}">${icons.x}</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="detail-section" style="margin-top:0">
      <div class="detail-section-header">
        ⚠ Add Halt / Blocker
      </div>
      <div class="detail-section-body">
        <div style="display:flex;gap:8px">
          <input class="field-input" id="halt-input" placeholder="Describe the blocker..." style="background:var(--bg-elevated);flex:1" />
          <button class="btn btn-danger btn-sm" id="add-halt">Add Halt</button>
        </div>
      </div>
    </div>
  `;
}

function renderTimeline(agent) {
  const items = [...(agent.timeline||[])].reverse();
  return `
    <div class="detail-section">
      <div class="detail-section-header">
        📅 Timeline
        <button class="btn btn-ghost btn-sm" id="add-timeline-event">${icons.plus} Add Event</button>
      </div>
      <div class="detail-section-body">
        <div class="timeline">
          ${items.map((item,i)=>`
            <div class="timeline-item">
              <div class="timeline-line"></div>
              <div class="timeline-dot" style="background:${item.color||agent.color}"></div>
              <div class="timeline-content">
                <div class="timeline-date">${item.date}</div>
                <div class="timeline-title">${esc(item.title)}</div>
                ${item.note?`<div class="timeline-note">${esc(item.note)}</div>`:''}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Add Timeline Event</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input class="field-input" id="tl-date" type="date" value="${new Date().toISOString().split('T')[0]}" style="background:var(--bg-elevated)" />
            <input class="field-input" id="tl-title" placeholder="Event title" style="background:var(--bg-elevated)" />
            <input class="field-input" id="tl-note" placeholder="Notes (optional)" style="background:var(--bg-elevated)" />
            <button class="btn btn-primary btn-sm" id="add-tl-btn" style="align-self:flex-end">${icons.plus} Add Event</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEdit(agent, members) {
  return `
    <div class="detail-section">
      <div class="detail-section-header">✏️ Edit Agent</div>
      <div class="detail-section-body" style="display:flex;flex-direction:column;gap:12px">
        <div><div class="field-label">Name</div><input class="field-input" id="edit-name" value="${esc(agent.name)}" style="background:var(--bg-elevated)" /></div>
        <div><div class="field-label">Description</div><textarea class="field-input field-textarea" id="edit-desc" style="background:var(--bg-elevated)">${esc(agent.description)}</textarea></div>
        <div><div class="field-label">Status</div>
          <select class="field-input field-select" id="edit-status" style="background:var(--bg-elevated)">
            ${AGENT_STATUSES.map(s=>`<option value="${s.value}" ${agent.status===s.value?'selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div><div class="field-label">User Count</div><input class="field-input" id="edit-users" type="number" min="0" value="${agent.userCount||0}" style="background:var(--bg-elevated)" /></div>
        <div><div class="field-label">Partner</div><input class="field-input" id="edit-partner" value="${esc(agent.partner||'')}" placeholder="e.g. OpenAI, Anthropic..." style="background:var(--bg-elevated)" /></div>
        <div>
          <div class="field-label">Icon (emoji)</div>
          <input class="field-input" id="edit-icon" value="${agent.icon||'🤖'}" style="background:var(--bg-elevated);font-size:20px;width:60px" maxlength="4" />
        </div>
        <div>
          <div class="field-label">Color</div>
          <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-top:4px">
            ${PASTEL_COLORS.slice(0,36).map(c=>`
              <div class="color-swatch ${c===agent.color?'selected':''}" data-edit-color="${c}" style="background:${c};border-color:${c===agent.color?'#333':'transparent'}"></div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="field-label">Agent Prompt</div>
          <textarea class="field-input field-textarea" id="edit-prompt" style="background:var(--bg-elevated);min-height:120px" placeholder="Paste or write the agent's system prompt here...">${esc(agent.agentPrompt||'')}</textarea>
        </div>
      </div>
    </div>
  `;
}

function bindDetailTabEvents(panel, agent, tab, onRefresh) {
  // Overview tab
  panel.querySelectorAll('[data-stage]').forEach(el => {
    el.addEventListener('click', () => {
      const s = el.dataset.stage;
      if (!agent.lifecycle) agent.lifecycle = [];
      agent.lifecycle.includes(s) ? agent.lifecycle.splice(agent.lifecycle.indexOf(s),1) : agent.lifecycle.push(s);
      el.classList.toggle('active');
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
      el.classList.toggle('selected');
    });
  });

  // Action items tab
  panel.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.check);
      agent.actionItems[idx].done = !agent.actionItems[idx].done;
      saveAgent(agent);
      showToast('Updated!', 'success');
      renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames());
      bindDetailTabEvents(panel, agent, tab, onRefresh);
    });
  });
  panel.querySelectorAll('[data-del-action]').forEach(el => {
    el.addEventListener('click', () => { agent.actionItems.splice(parseInt(el.dataset.delAction),1); saveAgent(agent); renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames()); bindDetailTabEvents(panel, agent, tab, onRefresh); });
  });
  panel.querySelectorAll('[data-del-halt]').forEach(el => {
    el.addEventListener('click', () => { agent.halts.splice(parseInt(el.dataset.delHalt),1); saveAgent(agent); showToast('Halt resolved!','success'); renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames()); bindDetailTabEvents(panel, agent, tab, onRefresh); });
  });
  panel.querySelector('#add-action-item')?.addEventListener('click', () => {
    const text = prompt('Action item text:'); if (!text) return;
    const owner = prompt('Owner (name):') || '';
    if (!agent.actionItems) agent.actionItems = [];
    agent.actionItems.push({ id: 'ai-'+Date.now(), text, done: false, owner });
    saveAgent(agent); renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames()); bindDetailTabEvents(panel, agent, tab, onRefresh);
  });
  panel.querySelector('#add-halt')?.addEventListener('click', () => {
    const val = panel.querySelector('#halt-input')?.value.trim(); if (!val) return;
    if (!agent.halts) agent.halts = [];
    agent.halts.push(val); saveAgent(agent); showToast('Halt added','success');
    renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames()); bindDetailTabEvents(panel, agent, tab, onRefresh);
  });
  panel.querySelector('#add-tl-btn')?.addEventListener('click', () => {
    const date = panel.querySelector('#tl-date')?.value;
    const title = panel.querySelector('#tl-title')?.value.trim();
    if (!title) return;
    const note = panel.querySelector('#tl-note')?.value || '';
    if (!agent.timeline) agent.timeline = [];
    agent.timeline.push({ date, title, note, color: agent.color });
    saveAgent(agent); renderDetailTab(panel.querySelector('#detail-body'), agent, tab, getMemberNames()); bindDetailTabEvents(panel, agent, tab, onRefresh);
  });

  // Edit tab color picker
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
    agent.progressReadout = panel.querySelector('#ov-progress')?.value || agent.progressReadout;
    agent.usageNotes = panel.querySelector('#ov-usage')?.value || agent.usageNotes;
    agent.link = panel.querySelector('#ov-link')?.value || agent.link;
  } else if (tab === 'edit') {
    agent.name = panel.querySelector('#edit-name')?.value || agent.name;
    agent.description = panel.querySelector('#edit-desc')?.value || agent.description;
    agent.status = panel.querySelector('#edit-status')?.value || agent.status;
    agent.userCount = parseInt(panel.querySelector('#edit-users')?.value) || 0;
    agent.partner = panel.querySelector('#edit-partner')?.value || agent.partner;
    agent.icon = panel.querySelector('#edit-icon')?.value || agent.icon;
    agent.agentPrompt = panel.querySelector('#edit-prompt')?.value || agent.agentPrompt;
  }
}

function getMemberNames() { try { return JSON.parse(localStorage.getItem('bt_members')||'[]').map(m=>m.name); } catch { return []; } }
function hexRgba(hex, a) { if(!hex||!hex.startsWith('#')) return `rgba(180,180,180,${a})`; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function darken(hex) { if(!hex||!hex.startsWith('#')) return '#333'; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgb(${Math.round(r*.4)},${Math.round(g*.4)},${Math.round(b*.4)})`; }
function cap(s) { return s?s.charAt(0).toUpperCase()+s.slice(1):''; }
function esc(str) { if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
