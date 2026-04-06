import { icons } from '../lib/icons.js';
import { getMembers, initials } from '../lib/helpers.js';
import { getAgentsFromState } from '../lib/agentState.js';
import { state, setState } from '../lib/state.js';
import { openSettings } from './Settings.js';

export function renderSidebar(container) {
  const members = getMembers();
  const agents = getAgentsFromState();
  const deployedCount = agents.filter(a=>a.status==='deployed').length;
  const haltCount = agents.filter(a=>(a.halts||[]).length>0).length;

  container.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-mark" style="font-size:18px;background:#fef9c3;border-color:#fde68a">🐝</div>
          <div>
            <div class="logo-text">The Brand Hive</div>
            <div class="logo-sub">Brand Queens Marketing</div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Task Views</div>
        <div class="nav-item ${state.section==='tasks'&&state.view==='all'?'active':''}" data-section="tasks" data-view="all">
          ${icons.users} All Tasks
          <span class="count-badge">${state.tasks.length}</span>
        </div>
        <div class="nav-item ${state.section==='tasks'&&state.view==='my'?'active':''}" data-section="tasks" data-view="my">
          ${icons.user} My Tasks
          <span class="count-badge">${state.tasks.filter(t=>t.assignee===state.currentUser&&!t.completed).length}</span>
        </div>
        <div class="nav-item ${state.section==='tasks'&&state.viewMode==='calendar'?'active':''}" data-section="tasks" data-viewmode="calendar">
          ${icons.calendar} Calendar
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Team Members</div>
        ${members.map(m => {
          const count = state.tasks.filter(t=>t.assignee===m.name&&!t.completed).length;
          return `
            <div class="member-item ${state.section==='tasks'&&state.view===m.name?'active':''}" data-section="tasks" data-view="${m.name}">
              <div class="member-avatar" style="background:${m.color};font-size:13px">${m.icon}</div>
              ${m.name}
              <span class="count-badge" style="margin-left:auto">${count}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">AI Agents</div>
        <div class="nav-item ${state.section==='agents'?'active':''}" data-section="agents" data-agentTab="board">
          🤖 Agent Hub
          <span class="count-badge" style="margin-left:auto">${agents.length}</span>
        </div>
        <div class="nav-item ${state.section==='agents-directory'?'active':''}" data-section="agents-directory">
          📚 Directory
          <span class="count-badge" style="background:rgba(45,158,107,0.12);color:#1e7a52;border-color:rgba(45,158,107,0.2)">${deployedCount} live</span>
        </div>
        <div class="nav-item ${state.section==='agents-intake'?'active':''}" data-section="agents-intake">
          ➕ New Agent
        </div>
        ${haltCount > 0 ? `
          <div class="nav-item" data-section="agents" data-filter-halts="true" style="color:var(--red)">
            ⚠️ ${haltCount} halt${haltCount!==1?'s':''}
          </div>` : ''}
      </div>

      <div class="sidebar-footer">
        <div class="nav-item" id="open-settings">
          ${icons.grid} Settings & Team
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', () => {
      const section = el.dataset.section;
      const view = el.dataset.view;
      const viewmode = el.dataset.viewmode;
      const filterHalts = el.dataset.filterHalts === 'true';
      const updates = { section, selectedIds: new Set(), filterHalts };
      if (view) updates.view = view;
      if (viewmode) updates.viewMode = viewmode;
      if (section === 'tasks' && !viewmode) updates.viewMode = 'table';
      setState(updates);
    });
  });

  container.querySelector('#open-settings')?.addEventListener('click', openSettings);
}
