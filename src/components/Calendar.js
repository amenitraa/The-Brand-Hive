import { icons } from '../lib/icons.js';
import { getMembers, memberAvatarStyle, hexToRgba } from '../lib/helpers.js';
import { state, setState } from '../lib/state.js';
import { openTaskModal } from './TaskModal.js';

export function renderCalendar(container) {
  const now = new Date();
  const year = state.calYear ?? now.getFullYear();
  const month = state.calMonth ?? now.getMonth();
  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay-1; i >= 0; i--) cells.push({ date: new Date(year, month-1, daysInPrev-i), other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), other: false });
  while (cells.length % 7 !== 0) cells.push({ date: new Date(year, month+1, cells.length-daysInMonth-firstDay+1), other: true });

  const tasksByDate = {};
  state.tasks.forEach(task => {
    if (!task.due_date || task.completed) return;
    if (state.view !== 'all' && state.view !== 'my' && task.assignee !== state.view) return;
    if (state.view === 'my' && task.assignee !== state.currentUser) return;
    if (!tasksByDate[task.due_date]) tasksByDate[task.due_date] = [];
    tasksByDate[task.due_date].push(task);
  });

  const todayStr = now.toISOString().split('T')[0];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  container.innerHTML = `
    <div class="calendar-wrap">
      <div class="calendar-nav">
        <button class="cal-nav-btn" id="cal-prev">${icons.chevronLeft}</button>
        <h2>${monthName}</h2>
        <button class="cal-nav-btn" id="cal-next">${icons.chevronRight}</button>
        <button class="cal-today-btn" id="cal-today">Today</button>
      </div>
      <div class="calendar-grid">
        ${days.map(d=>`<div class="cal-day-header">${d}</div>`).join('')}
        ${cells.map(cell => {
          const ds = cell.date.toISOString().split('T')[0];
          const isToday = ds === todayStr;
          const dayTasks = tasksByDate[ds] || [];
          const shown = dayTasks.slice(0, 3);
          const extra = dayTasks.length - 3;
          return `
            <div class="cal-day ${cell.other?'other-month':''} ${isToday?'today':''}" data-date="${ds}">
              <div class="cal-day-num ${isToday?'cal-day-num-wrap':''}">${cell.date.getDate()}</div>
              ${shown.map(task => {
                const m = getMembers().find(m=>m.name===task.assignee);
                const bg = m ? hexToRgba(m.color, 0.3) : 'rgba(124,111,205,0.15)';
                const dot = m ? m.color : '#c4b5fd';
                return `<div class="cal-task-chip" data-cal-task="${task.id}" style="background:${bg}" title="${esc(task.name)} — ${task.assignee||'Unassigned'}">
                  <div class="cal-task-dot" style="background:${dot}"></div>
                  ${esc(task.name)}
                </div>`;
              }).join('')}
              ${extra>0?`<div class="cal-more">+${extra} more</div>`:''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelector('#cal-prev').addEventListener('click', () => {
    let m=month-1, y=year; if(m<0){m=11;y--;} setState({calYear:y,calMonth:m});
  });
  container.querySelector('#cal-next').addEventListener('click', () => {
    let m=month+1, y=year; if(m>11){m=0;y++;} setState({calYear:y,calMonth:m});
  });
  container.querySelector('#cal-today').addEventListener('click', () => setState({calYear:now.getFullYear(),calMonth:now.getMonth()}));
  container.querySelectorAll('[data-cal-task]').forEach(chip => chip.addEventListener('click', e=>{ e.stopPropagation(); openTaskModal(chip.dataset.calTask); }));
}

function esc(str) { if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
