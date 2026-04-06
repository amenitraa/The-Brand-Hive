import { getAgents, agentStatusInfo } from '../lib/agents.js';

export function renderAgentDirectory(container) {
  const agents = getAgents();
  const deployed = agents.filter(a => a.status === 'deployed');
  const others = agents.filter(a => a.status !== 'deployed');

  container.innerHTML = `
    <div style="overflow-y:auto;flex:1;padding:20px">
      <div style="max-width:900px;margin:0 auto">
        <div style="margin-bottom:20px">
          <h2 style="font-size:17px;font-weight:700;margin-bottom:4px">📚 Agent Directory</h2>
          <p style="font-size:13px;color:var(--text-secondary)">Live access to all deployed agents. Agents in other stages are shown below for visibility.</p>
        </div>

        ${deployed.length > 0 ? `
          <div style="margin-bottom:10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted)">✅ Deployed — Ready to Use</div>
          <div class="directory-grid" style="padding:0;margin-bottom:24px">
            ${deployed.map(a => renderDirCard(a, true)).join('')}
          </div>` : ''}

        ${others.length > 0 ? `
          <div style="margin-bottom:10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted)">🔧 In Development</div>
          <div class="directory-grid" style="padding:0">
            ${others.map(a => renderDirCard(a, false)).join('')}
          </div>` : ''}
      </div>
    </div>
  `;
}

function renderDirCard(agent, isDeployed) {
  const si = agentStatusInfo(agent.status);
  return `
    <div class="directory-card ${!isDeployed?'directory-not-deployed':''}">
      <div class="directory-card-top">
        <div class="directory-card-icon" style="background:${hexRgba(agent.color,.25)}">${agent.icon}</div>
        <div class="directory-card-name">${esc(agent.name)}</div>
        <span class="directory-card-status ${isDeployed?'directory-deployed':''}" style="${!isDeployed?`background:var(--bg-elevated);color:var(--text-muted)`:''}">
          ${si.label}
        </span>
      </div>
      <div class="directory-card-desc">${esc(agent.description)}</div>
      ${agent.userCount ? `<div style="font-size:11px;color:var(--text-muted)">👥 ${agent.userCount} active user${agent.userCount!==1?'s':''}</div>` : ''}
      ${isDeployed && agent.link ? `
        <a href="${esc(agent.link)}" target="_blank" class="directory-card-link">
          Open Agent ↗
        </a>` : ''}
      ${isDeployed && !agent.link ? `
        <span style="font-size:12px;color:var(--text-muted);font-style:italic">No link set — add one in the agent board</span>
      ` : ''}
      ${!isDeployed ? `<div style="font-size:11px;color:var(--text-muted);font-style:italic">Coming soon</div>` : ''}
    </div>
  `;
}

function hexRgba(hex, a) { if(!hex||!hex.startsWith('#')) return `rgba(180,180,180,${a})`; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function esc(str) { if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
