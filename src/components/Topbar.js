import { icons } from '../lib/icons.js';
import { getMemberNames, requestNotifPermission } from '../lib/helpers.js';
import { state, setState } from '../lib/state.js';

export function renderTopbar(container, onAddTask) {
  const members = getMemberNames();
  const viewLabel = state.view==='all' ? 'All Tasks' : state.view==='my' ? 'My Tasks' : `${state.view}'s Tasks`;
  const taskCount = state.view==='all' ? state.tasks.length : state.tasks.filter(t => state.view==='my' ? t.assignee===state.currentUser : t.assignee===state.view).length;
  const hasUnread = state.tasks.some(t=>(t.comments||[]).length>0&&!t.completed);

  container.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">${viewLabel}</div>
        <div class="topbar-sub">${taskCount} task${taskCount!==1?'s':''}</div>
      </div>
      <div class="topbar-spacer"></div>
      <div class="topbar-actions">
        <div class="user-selector">
          <span class="user-select-label">Viewing as:</span>
          <select id="current-user-sel">
            ${members.map(m=>`<option value="${m}" ${m===state.currentUser?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="view-toggle">
          <button class="view-btn ${state.viewMode==='table'?'active':''}" data-mode="table">${icons.list} Table</button>
          <button class="view-btn ${state.viewMode==='calendar'?'active':''}" data-mode="calendar">${icons.calendar} Calendar</button>
        </div>
        <button class="btn btn-ghost btn-icon" id="notif-btn" style="position:relative" title="Enable notifications">
          ${icons.bell}
          ${hasUnread?'<span class="notif-badge"></span>':''}
        </button>
        <button class="btn btn-primary" id="add-task-btn">${icons.plus} New Task</button>
      </div>
    </div>
  `;

  container.querySelector('#add-task-btn').addEventListener('click', onAddTask);
  container.querySelector('#notif-btn').addEventListener('click', requestNotifPermission);
  container.querySelector('#current-user-sel').addEventListener('change', e => setState({ currentUser: e.target.value }));
  container.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => setState({ viewMode: btn.dataset.mode })));
}
