import { icons } from '../lib/icons.js';
import { STATUSES, PRIORITIES, getProjects } from '../lib/helpers.js';
import { state, setState } from '../lib/state.js';

export function renderFilterBar(container) {
  const f = state.filters;
  const projects = getProjects();
  const selStyle = `padding:4px 24px 4px 10px;height:28px;font-size:12px;font-weight:500;font-family:var(--font);outline:none;cursor:pointer;border-radius:20px;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239e9b93' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;`;

  container.innerHTML = `
    <div class="filter-bar">
      <div class="search-wrapper">
        ${icons.search}
        <input class="search-input" type="text" placeholder="Search tasks..." value="${f.search}" id="search-inp" />
      </div>
      <select class="filter-sel" id="flt-status" style="${selStyle}background-color:${f.status?'var(--accent-dim)':'var(--bg-elevated)'};border:1px solid ${f.status?'rgba(124,111,205,0.3)':'var(--border)'};color:${f.status?'var(--accent)':'var(--text-secondary)'}">
        <option value="">All Statuses</option>
        ${STATUSES.map(s=>`<option value="${s.value}" ${f.status===s.value?'selected':''}>${s.label}</option>`).join('')}
      </select>
      <select class="filter-sel" id="flt-priority" style="${selStyle}background-color:${f.priority?'var(--accent-dim)':'var(--bg-elevated)'};border:1px solid ${f.priority?'rgba(124,111,205,0.3)':'var(--border)'};color:${f.priority?'var(--accent)':'var(--text-secondary)'}">
        <option value="">All Priorities</option>
        ${PRIORITIES.map(p=>`<option value="${p.value}" ${f.priority===p.value?'selected':''}>${p.label}</option>`).join('')}
      </select>
      <select class="filter-sel" id="flt-project" style="${selStyle}background-color:${f.project?'var(--accent-dim)':'var(--bg-elevated)'};border:1px solid ${f.project?'rgba(124,111,205,0.3)':'var(--border)'};color:${f.project?'var(--accent)':'var(--text-secondary)'}">
        <option value="">All Projects</option>
        ${projects.map(p=>`<option value="${p.value}" ${f.project===p.value?'selected':''}>${p.icon} ${p.label}</option>`).join('')}
      </select>
      <div class="filter-spacer"></div>
      <select id="group-by" style="${selStyle}background-color:var(--bg-elevated);border:1px solid var(--border);color:var(--text-secondary)">
        <option value="none" ${state.groupBy==='none'?'selected':''}>No grouping</option>
        <option value="status" ${state.groupBy==='status'?'selected':''}>Group by Status</option>
        <option value="project" ${state.groupBy==='project'?'selected':''}>Group by Project</option>
        <option value="priority" ${state.groupBy==='priority'?'selected':''}>Group by Priority</option>
        <option value="assignee" ${state.groupBy==='assignee'?'selected':''}>Group by Assignee</option>
      </select>
      ${(f.status||f.priority||f.project||f.search)?`<button class="btn btn-ghost btn-sm" id="clear-filters">${icons.x} Clear</button>`:''}
    </div>
  `;

  let st;
  container.querySelector('#search-inp').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => setState({ filters: { ...state.filters, search: e.target.value } }), 200); });
  container.querySelector('#flt-status').addEventListener('change', e => setState({ filters: { ...state.filters, status: e.target.value } }));
  container.querySelector('#flt-priority').addEventListener('change', e => setState({ filters: { ...state.filters, priority: e.target.value } }));
  container.querySelector('#flt-project').addEventListener('change', e => setState({ filters: { ...state.filters, project: e.target.value } }));
  container.querySelector('#group-by').addEventListener('change', e => setState({ groupBy: e.target.value }));
  container.querySelector('#clear-filters')?.addEventListener('click', () => setState({ filters: { status:'', priority:'', project:'', search:'' } }));
}
