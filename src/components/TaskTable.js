import { icons } from '../lib/icons.js';
import { memberAvatarStyle, projectBadgeStyle, getProjects, initials, formatDate, getDueClass, fileSize, statusLabel, priorityLabel, projectLabel } from '../lib/helpers.js';
import { state, setState, toggleSelected, clearSelected, getGroupedTasks, updateTaskInState, removeTask, removeTasks } from '../lib/state.js';
import { updateTask, deleteTask, deleteTasks } from '../lib/supabase.js';
import { showToast } from './Toast.js';
import { openTaskModal } from './TaskModal.js';

export function renderTable(container) {
  const groups = getGroupedTasks();
  const allTasks = groups.flatMap(g => g.tasks);
  const allSelected = allTasks.length > 0 && allTasks.every(t => state.selectedIds.has(t.id));

  container.innerHTML = `
    <div class="task-table-wrap" style="height:100%;overflow:auto">
      <table class="task-table">
        <thead>
          <tr>
            <th class="col-select">
              <div class="custom-check ${allSelected?'checked':''}" id="select-all">${allSelected?icons.check:''}</div>
            </th>
            <th class="col-check"></th>
            <th class="col-name sortable ${state.sortBy==='name'?'sorted':''}" data-sort="name">Task <span class="sort-icon">↕</span></th>
            <th class="col-assignee sortable ${state.sortBy==='assignee'?'sorted':''}" data-sort="assignee">Assignee <span class="sort-icon">↕</span></th>
            <th class="col-due sortable ${state.sortBy==='due_date'?'sorted':''}" data-sort="due_date">Due Date <span class="sort-icon">↕</span></th>
            <th class="col-priority sortable ${state.sortBy==='priority'?'sorted':''}" data-sort="priority">Priority <span class="sort-icon">↕</span></th>
            <th class="col-project sortable ${state.sortBy==='project'?'sorted':''}" data-sort="project">Project <span class="sort-icon">↕</span></th>
            <th class="col-status sortable ${state.sortBy==='status'?'sorted':''}" data-sort="status">Status <span class="sort-icon">↕</span></th>
            <th class="col-attach">${icons.paperclip}</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody id="task-tbody">
          ${groups.map(g => renderGroup(g)).join('')}
          <tr class="add-task-row">
            <td colspan="10">
              <button class="add-task-btn" id="inline-add-btn">${icons.plus} Add a task...</button>
            </td>
          </tr>
        </tbody>
      </table>
      ${allTasks.length === 0 ? renderEmpty() : ''}
    </div>
    ${state.selectedIds.size > 0 ? renderBulkBar() : ''}
  `;

  bindEvents(container);
}

function renderGroup({ key, tasks }) {
  if (!key) return tasks.map(t => renderRow(t)).join('');
  const collapsed = state.collapsedGroups.has(key);
  const labelFn = { status: statusLabel, project: v => { const p = getProjects().find(x=>x.value===v); return p ? `${p.icon} ${p.label}` : v; }, priority: priorityLabel, assignee: n=>n };
  const label = (labelFn[state.groupBy]||String)(key);
  return `
    <tr class="group-header-row" data-group="${key}">
      <td colspan="10">
        <span class="group-toggle ${collapsed?'collapsed':''}">${icons.chevronDown}</span>
        ${label} <span style="font-weight:400;margin-left:6px;opacity:0.6">(${tasks.length})</span>
      </td>
    </tr>
    ${collapsed ? '' : tasks.map(t=>renderRow(t)).join('')}
  `;
}

function renderRow(task) {
  const sel = state.selectedIds.has(task.id);
  const avatar = memberAvatarStyle(task.assignee);
  const dueClass = getDueClass(task.due_date, task.completed);
  const attachCount = (task.attachments||[]).length;
  const commentCount = (task.comments||[]).length;
  const projStyle = task.project ? projectBadgeStyle(task.project) : '';
  const proj = task.project ? getProjects().find(p=>p.value===task.project) : null;

  return `
    <tr class="task-row ${sel?'selected':''} ${task.completed?'completed':''}" data-id="${task.id}">
      <td class="col-select cell-pad">
        <div class="custom-check ${sel?'checked':''}" data-select="${task.id}">${sel?icons.check:''}</div>
      </td>
      <td class="col-check cell-pad">
        <div class="complete-btn ${task.completed?'done':''}" data-complete="${task.id}">${task.completed?icons.check:''}</div>
      </td>
      <td class="col-name cell-pad">
        <div class="task-name-cell">
          <div style="flex:1;min-width:0">
            <div class="task-name-text">${escHtml(task.name)}</div>
            ${task.notes?`<div class="task-note-preview">${escHtml(task.notes)}</div>`:''}
          </div>
          ${commentCount>0?`<div class="has-comments-dot" title="${commentCount} comment${commentCount!==1?'s':''}"></div>`:''}
        </div>
      </td>
      <td class="col-assignee cell-pad">
        ${task.assignee ? `
          <div class="assignee-chip">
            <div class="mini-avatar" style="background:${avatar.bg}">${avatar.icon}</div>
            ${task.assignee}
          </div>` : '<span style="color:var(--text-muted);font-size:12px">—</span>'}
      </td>
      <td class="col-due cell-pad">
        <span class="due-date ${dueClass}">${formatDate(task.due_date)||'—'}</span>
      </td>
      <td class="col-priority cell-pad">
        ${task.priority?`<span class="badge badge-priority-${task.priority}">${priorityLabel(task.priority)}</span>`:'—'}
      </td>
      <td class="col-project cell-pad">
        ${proj?`<span class="badge-project" style="${projStyle}">${proj.icon} ${proj.label}</span>`:'—'}
      </td>
      <td class="col-status cell-pad">
        ${task.status?`<span class="badge badge-status-${task.status}">${statusLabel(task.status)}</span>`:'—'}
      </td>
      <td class="col-attach cell-pad">
        ${attachCount>0?`<span class="attach-count">${icons.paperclip} ${attachCount}</span>`:''}
      </td>
      <td class="col-actions cell-pad">
        <div class="row-actions">
          <button class="row-btn" data-edit="${task.id}" title="Edit">${icons.edit}</button>
          <button class="row-btn danger" data-del="${task.id}" title="Delete">${icons.trash}</button>
        </div>
      </td>
    </tr>
  `;
}

function renderBulkBar() {
  const count = state.selectedIds.size;
  return `
    <div class="bulk-bar">
      <span class="bulk-bar-count">${count} selected</span>
      <div class="bulk-bar-spacer"></div>
      <select id="bulk-status" class="btn btn-ghost btn-sm" style="cursor:pointer;font-family:var(--font)">
        <option value="">Set Status...</option>
        <option value="not-started">Not Started</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="on-hold">On Hold</option>
        <option value="need-support">Need Support</option>
      </select>
      <select id="bulk-priority" class="btn btn-ghost btn-sm" style="cursor:pointer;font-family:var(--font)">
        <option value="">Set Priority...</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button class="btn btn-danger btn-sm" id="bulk-delete">${icons.trash} Delete</button>
      <button class="btn btn-ghost btn-sm" id="bulk-clear">${icons.x} Deselect</button>
    </div>
  `;
}

function renderEmpty() {
  return `<div class="empty-state">${icons.list}<h3>No tasks found</h3><p>Add a new task or adjust your filters.</p></div>`;
}

function bindEvents(container) {
  container.querySelector('#select-all')?.addEventListener('click', () => {
    const all = getGroupedTasks().flatMap(g=>g.tasks);
    all.every(t=>state.selectedIds.has(t.id)) ? clearSelected() : setState({ selectedIds: new Set(all.map(t=>t.id)) });
  });
  container.querySelectorAll('[data-select]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); toggleSelected(el.dataset.select); }));
  container.querySelectorAll('[data-complete]').forEach(el => el.addEventListener('click', async e => {
    e.stopPropagation();
    const task = state.tasks.find(t=>t.id===el.dataset.complete);
    if (!task) return;
    const completed = !task.completed;
    updateTaskInState(el.dataset.complete, { completed });
    await updateTask(el.dataset.complete, { completed });
    showToast(completed ? 'Task complete! 🎉' : 'Task reopened', 'success');
  }));
  container.querySelectorAll('.task-row').forEach(row => row.addEventListener('click', e => {
    if (e.target.closest('[data-select],[data-complete],[data-edit],[data-del],.row-btn')) return;
    openTaskModal(row.dataset.id);
  }));
  container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openTaskModal(btn.dataset.edit); }));
  container.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    removeTask(btn.dataset.del);
    await deleteTask(btn.dataset.del);
    showToast('Task deleted', 'success');
  }));
  container.querySelectorAll('th[data-sort]').forEach(th => th.addEventListener('click', () => {
    const col = th.dataset.sort;
    setState({ sortBy: col, sortDir: state.sortBy===col ? (state.sortDir==='asc'?'desc':'asc') : 'asc' });
  }));
  container.querySelectorAll('.group-header-row').forEach(row => row.addEventListener('click', () => {
    const key = row.dataset.group;
    const c = new Set(state.collapsedGroups);
    c.has(key) ? c.delete(key) : c.add(key);
    setState({ collapsedGroups: c });
  }));
  container.querySelector('#inline-add-btn')?.addEventListener('click', () => openTaskModal(null));
  container.querySelector('#bulk-status')?.addEventListener('change', async e => {
    const status = e.target.value; if (!status) return;
    const ids = [...state.selectedIds];
    ids.forEach(id => updateTaskInState(id, { status }));
    await Promise.all(ids.map(id => updateTask(id, { status })));
    clearSelected(); showToast(`Updated ${ids.length} tasks`, 'success');
  });
  container.querySelector('#bulk-priority')?.addEventListener('change', async e => {
    const priority = e.target.value; if (!priority) return;
    const ids = [...state.selectedIds];
    ids.forEach(id => updateTaskInState(id, { priority }));
    await Promise.all(ids.map(id => updateTask(id, { priority })));
    clearSelected(); showToast(`Updated ${ids.length} tasks`, 'success');
  });
  container.querySelector('#bulk-delete')?.addEventListener('click', async () => {
    const ids = [...state.selectedIds];
    if (!confirm(`Delete ${ids.length} tasks?`)) return;
    removeTasks(ids); await deleteTasks(ids);
    showToast(`Deleted ${ids.length} tasks`, 'success');
  });
  container.querySelector('#bulk-clear')?.addEventListener('click', clearSelected);
}

function escHtml(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
