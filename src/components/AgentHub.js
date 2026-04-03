import { icons } from '../lib/icons.js';
import { getAgents, saveAgent, deleteAgent, agentStatusInfo, LIFECYCLE_STAGES, AGENT_STATUSES } from '../lib/agents.js';
import { PASTEL_COLORS } from '../lib/helpers.js';
import { showToast } from './Toast.js';
import { renderAgentDetail } from './AgentDetail.js';
import { renderIntakeForm } from './AgentIntake.js';
import { renderAgentDirectory } from './AgentDirectory.js';

let hubTab = 'board'; // 'board' | 'directory' | 'intake' | 'claude'
let filterStatus = '';
let filterLifecycle = '';
let searchQ = '';

export function renderAgentHub(container) {
  container.innerHTML = `
    <div class="agent-hub">
      <div class="hub-nav">
        <button class="hub-nav-btn ${hubTab==='board'?'active':''}" data-tab="board">🗂 Agent Board</button>
        <button class="hub-nav-btn ${hubTab==='directory'?'active':''}" data-tab="directory">📚 Directory</button>
        <button class="hub-nav-btn ${hubTab==='intake'?'active':''}" data-tab="intake">➕ New Agent Intake</button>
        <button class="hub-nav-btn ${hubTab==='claude'?'active':''}" data-tab="claude">✨ Ask Claude</button>
        <div class="hub-nav-spacer"></div>
        ${hubTab === 'board' ? renderBoardFilters() : ''}
      </div>
      <div id="hub-content" style="flex:1;overflow:hidden;display:flex;flex-direction:column"></div>
    </div>
  `;

  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      hubTab = btn.dataset.tab;
      container.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHubContent(container.querySelector('#hub-content'));
    });
  });

  // Filter events
  container.querySelector('#hub-search')?.addEventListener('input', e => { searchQ = e.target.value; renderHubContent(container.querySelector('#hub-content')); });
  container.querySelector('#hub-filter-status')?.addEventListener('change', e => { filterStatus = e.target.value; renderHubContent(container.querySelector('#hub-content')); });
  container.querySelector('#hub-filter-lifecycle')?.addEventListener('change', e => { filterLifecycle = e.target.value; renderHubContent(container.querySelector('#hub-content')); });

  renderHubContent(container.querySelector('#hub-content'));
}

function renderBoardFilters() {
  const selStyle = `height:28px;padding:4px 24px 4px 10px;font-size:12px;font-weight:500;font-family:var(--font);border-radius:20px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-secondary);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239e9b93' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;`;
  return `
    <div style="display:flex;gap:8px;align-items:center">
      <div style="position:relative">
        ${icons.search.replace('svg ', 'svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:12px;height:12px;color:var(--text-muted)" ')}
        <input id="hub-search" value="${searchQ}" placeholder="Search agents..." style="height:28px;padding:4px 10px 4px 28px;font-size:12px;border-radius:20px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-family:var(--font);outline:none;width:180px" />
      </div>
      <select id="hub-filter-status" style="${selStyle}">
        <option value="">All Statuses</option>
        ${AGENT_STATUSES.map(s=>`<option value="${s.value}" ${filterStatus===s.value?'selected':''}>${s.label}</option>`).join('')}
      </select>
      <select id="hub-filter-lifecycle" style="${selStyle}">
        <option value="">All Stages</option>
        ${LIFECYCLE_STAGES.map(s=>`<option value="${s}" ${filterLifecycle===s?'selected':''}>${cap(s)}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderHubContent(content) {
  if (!content) return;
  if (hubTab === 'board') renderBoard(content);
  else if (hubTab === 'directory') renderAgentDirectory(content);
  else if (hubTab === 'intake') renderIntakeForm(content, () => { hubTab = 'board'; renderBoard(content); });
  else if (hubTab === 'claude') renderClaudePanel(content);
}

function renderBoard(content) {
  let agents = getAgents();
  if (searchQ) agents = agents.filter(a => a.name.toLowerCase().includes(searchQ.toLowerCase()) || a.description.toLowerCase().includes(searchQ.toLowerCase()));
  if (filterStatus) agents = agents.filter(a => a.status === filterStatus);
  if (filterLifecycle) agents = agents.filter(a => a.lifecycle.includes(filterLifecycle));

  const stats = getAgents();
  const deployed = stats.filter(a=>a.status==='deployed').length;
  const inProgress = stats.filter(a=>a.status==='in-progress'||a.status==='in-review').length;
  const totalUsers = stats.reduce((s,a)=>s+(a.userCount||0),0);
  const hasHalts = stats.filter(a=>a.halts&&a.halts.length>0).length;

  content.innerHTML = `
    <div style="padding:16px 20px 8px;display:flex;gap:10px;flex-shrink:0">
      ${[
        { val: stats.length, label: 'Total Agents', color: '#e9d5ff' },
        { val: deployed, label: 'Deployed', color: '#a7f3d0' },
        { val: inProgress, label: 'In Progress', color: '#bfdbfe' },
        { val: totalUsers, label: 'Total Users', color: '#fde68a' },
        { val: hasHalts, label: 'Halts / Blockers', color: '#fca5a5' },
      ].map(s=>`
        <div style="background:${s.color};border-radius:var(--radius-lg);padding:10px 16px;min-width:110px;flex:1">
          <div style="font-size:22px;font-weight:700;color:#1a1916">${s.val}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;color:rgba(0,0,0,0.5);margin-top:2px">${s.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="agent-grid-wrap">
      ${agents.length === 0 ? '<div class="empty-state">'+icons.grid+'<h3>No agents found</h3><p>Try adjusting your filters or add a new agent.</p></div>' : ''}
      <div class="agent-grid">
        ${agents.map(a => renderAgentCard(a)).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('[data-agent-id]').forEach(card => {
    card.addEventListener('click', () => openAgentDetail(card.dataset.agentId, content));
  });
  content.querySelectorAll('[data-quick-status]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const agents2 = getAgents();
      const agent = agents2.find(a=>a.id===btn.dataset.agentId);
      if (!agent) return;
      agent.status = btn.dataset.quickStatus;
      saveAgent(agent);
      showToast('Status updated!', 'success');
      renderBoard(content);
    });
  });
}

function renderAgentCard(agent) {
  const si = agentStatusInfo(agent.status);
  const openItems = (agent.actionItems||[]).filter(i=>!i.done).length;
  const hasHalts = (agent.halts||[]).length > 0;
  return `
    <div class="agent-card" data-agent-id="${agent.id}">
      <div class="agent-card-header">
        <div class="agent-icon" style="background:${hexToRgba(agent.color,0.25)}">${agent.icon}</div>
        <div class="agent-card-meta">
          <div class="agent-card-name">${esc(agent.name)}</div>
          <div class="agent-card-desc">${esc(agent.description)}</div>
        </div>
      </div>
      <div class="agent-card-body">
        <div class="agent-card-tags">
          ${(agent.lifecycle||[]).map(l=>`<span class="agent-tag agent-tag-lifecycle">${cap(l)}</span>`).join('')}
          ${(agent.crossFunctional||[]).filter(t=>t!=='Marketing').map(t=>`<span class="agent-tag agent-tag-crossfunc">${esc(t)}</span>`).join('')}
          ${hasHalts ? `<span class="agent-tag" style="background:rgba(201,64,64,0.1);color:#a83232;border:1px solid rgba(201,64,64,0.18)">⚠ Halt</span>` : ''}
        </div>
        ${agent.progressReadout ? `<div style="font-size:12px;color:var(--text-secondary);line-height:1.5;border-left:2px solid ${agent.color};padding-left:8px">${esc(agent.progressReadout)}</div>` : ''}
      </div>
      <div class="agent-card-footer">
        <div class="agent-status-dot ${si.dot}"></div>
        <span class="agent-status-label ${si.text}">${si.label}</span>
        ${agent.userCount ? `<span class="agent-users">${icons.user} ${agent.userCount}</span>` : ''}
        ${openItems > 0 ? `<span class="agent-action-items-count has-items">${icons.list} ${openItems} open</span>` : ''}
      </div>
    </div>
  `;
}

function openAgentDetail(agentId, content) {
  // Slide in detail panel
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.22);backdrop-filter:blur(3px);z-index:1000;display:flex;align-items:flex-start;justify-content:flex-end';
  overlay.id = 'agent-detail-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'agent-detail';
  overlay.appendChild(panel);

  function refreshDetail() {
    renderAgentDetail(panel, agentId, () => {
      overlay.remove();
      renderBoard(content);
    }, refreshDetail);
  }
  refreshDetail();

  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); renderBoard(content); } });
}

function renderClaudePanel(content) {
  const agents = getAgents();
  content.innerHTML = `
    <div class="claude-panel">
      <div class="claude-messages" id="claude-messages">
        <div class="claude-msg assistant">
          <div class="claude-avatar ai">✨</div>
          <div class="claude-bubble">
            Hi! I'm here to help with your AI agent strategy. I can analyze your agents' progress, suggest optimizations, help write or refine agent prompts, recommend new agents based on your team's needs, or help you think through how agents fit into your campaign lifecycle.<br><br>
            What would you like to work on?
          </div>
        </div>
      </div>
      <div class="quick-prompts">
        <button class="quick-prompt" data-prompt="Analyze the overall health of our agent program and give me a status readout.">📊 Program health check</button>
        <button class="quick-prompt" data-prompt="Which of our agents have blockers or halts right now and what do you recommend?">⚠️ Review blockers</button>
        <button class="quick-prompt" data-prompt="Recommend 3 new AI agents our brand marketing team should build next based on what we already have.">💡 Suggest new agents</button>
        <button class="quick-prompt" data-prompt="Help me write a strong agent prompt for our Brand Voice Checker agent.">✏️ Write an agent prompt</button>
        <button class="quick-prompt" data-prompt="How should we prioritize our backlog agents for Q2?">🗓 Prioritize backlog</button>
        <button class="quick-prompt" data-prompt="Which of our agents could be expanded to support the Sales team?">🤝 Sales expansion opps</button>
      </div>
      <div class="claude-input-row">
        <textarea class="claude-input" id="claude-input" placeholder="Ask about your agents, get recommendations, write prompts..." rows="1"></textarea>
        <button class="claude-send" id="claude-send">${icons.send}</button>
      </div>
    </div>
  `;

  const input = content.querySelector('#claude-input');
  const sendBtn = content.querySelector('#claude-send');
  const messages = content.querySelector('#claude-messages');

  function autoResize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 100) + 'px'; }
  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  sendBtn.addEventListener('click', sendMessage);

  content.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => { input.value = btn.dataset.prompt; sendMessage(); });
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    // Add user message
    messages.innerHTML += `
      <div class="claude-msg user">
        <div class="claude-avatar user-av">👤</div>
        <div class="claude-bubble">${esc(text)}</div>
      </div>
    `;

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    messages.innerHTML += `
      <div class="claude-msg assistant" id="${typingId}">
        <div class="claude-avatar ai">✨</div>
        <div class="claude-bubble"><div class="claude-typing"><span></span><span></span><span></span></div></div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    // Build context from agents
    const agentContext = agents.map(a => `- ${a.name} (${a.status}): ${a.description} | Progress: ${a.progressReadout || 'N/A'} | Users: ${a.userCount} | Halts: ${(a.halts||[]).join('; ')||'None'} | Lifecycle: ${(a.lifecycle||[]).join(', ')}`).join('\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an AI agent strategy advisor embedded in a brand marketing team's internal hub. You have deep knowledge of their AI agent program. Here is the current state of all their agents:\n\n${agentContext}\n\nThe team is: Amanda, Amenitra, Vivi, Kate, Grace, Shannon (brand marketing). They also work cross-functionally with Sales. Be concise, practical, and specific. Format your responses clearly using line breaks. Don't use markdown headers — use plain text with line breaks and emoji for structure.`,
          messages: [{ role: 'user', content: text }]
        })
      });
      const data = await response.json();
      const reply = data.content?.map(c => c.text || '').join('') || 'Sorry, I couldn\'t get a response. Please try again.';
      document.getElementById(typingId)?.remove();
      messages.innerHTML += `
        <div class="claude-msg assistant">
          <div class="claude-avatar ai">✨</div>
          <div class="claude-bubble" style="white-space:pre-wrap">${esc(reply)}</div>
        </div>
      `;
    } catch (e) {
      document.getElementById(typingId)?.remove();
      messages.innerHTML += `
        <div class="claude-msg assistant">
          <div class="claude-avatar ai">✨</div>
          <div class="claude-bubble" style="color:var(--red)">Couldn't connect to Claude. Please check your connection and try again.</div>
        </div>
      `;
    }

    sendBtn.disabled = false;
    messages.scrollTop = messages.scrollHeight;
  }
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(200,200,200,${alpha})`;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function esc(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
