import { initSupabase, fetchTasks, subscribeToTasks } from './lib/supabase.js';
import { state, setState, setTasks, subscribe } from './lib/state.js';
import { checkDueReminders } from './lib/helpers.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderTopbar } from './components/Topbar.js';
import { renderFilterBar } from './components/FilterBar.js';
import { renderTable } from './components/TaskTable.js';
import { renderCalendar } from './components/Calendar.js';
import { renderAgentHub } from './components/AgentHub.js';
import { openTaskModal } from './components/TaskModal.js';

// Add section to state
if (!state.section) state.section = 'tasks';

async function init() {
  const app = document.getElementById('app');
  const configured = await initSupabase();
  setState({ isConfigured: configured });

  const { data: tasks } = await fetchTasks();
  setTasks(tasks || []);

  app.innerHTML = `
    <div class="app-shell">
      <div id="sidebar-mount"></div>
      <div class="main-content">
        ${!configured ? `
          <div class="setup-banner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong>Demo mode</strong> — Supabase not configured. See <strong>README.md</strong> to connect your database.
          </div>` : ''}
        <div id="topbar-mount"></div>
        <div id="filterbar-mount"></div>
        <div class="content-area" id="content-area"></div>
      </div>
    </div>
  `;

  subscribe(renderAll);
  renderAll(state);

  if (configured) {
    subscribeToTasks(({ eventType, new: row }) => {
      if (eventType === 'INSERT' && !state.tasks.find(t => t.id === row.id)) {
        import('./lib/state.js').then(({ addTask }) => addTask(row));
      }
    });
  }

  const loader = document.getElementById('loading-screen');
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 300);

  setTimeout(() => {
    checkDueReminders(state.tasks, state.currentUser);
    setInterval(() => checkDueReminders(state.tasks, state.currentUser), 3600000);
  }, 2000);
}

function renderAll(s) {
  const sidebarMount = document.getElementById('sidebar-mount');
  if (sidebarMount) renderSidebar(sidebarMount);

  const topbarMount = document.getElementById('topbar-mount');
  const filterMount = document.getElementById('filterbar-mount');
  const content = document.getElementById('content-area');
  if (!content) return;

  const isAgentSection = s.section === 'agents' || s.section === 'agents-directory' || s.section === 'agents-intake';

  if (isAgentSection) {
    // Agent hub — hide topbar and filter bar
    if (topbarMount) topbarMount.style.display = 'none';
    if (filterMount) filterMount.style.display = 'none';
    content.style.overflow = 'hidden';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    // Map section to hub tab
    let startTab = 'board';
    if (s.section === 'agents-directory') startTab = 'directory';
    if (s.section === 'agents-intake') startTab = 'intake';

    import('./components/AgentHub.js').then(({ renderAgentHub }) => {
      renderAgentHub(content, startTab);
    });
  } else {
    // Task views
    if (topbarMount) { topbarMount.style.display = ''; renderTopbar(topbarMount, () => openTaskModal(null)); }
    content.style.overflow = 'auto';
    content.style.display = '';
    content.style.flexDirection = '';

    if (filterMount) {
      if (s.viewMode === 'table') { filterMount.style.display = ''; renderFilterBar(filterMount); }
      else filterMount.style.display = 'none';
    }

    if (s.viewMode === 'calendar') renderCalendar(content);
    else renderTable(content);
  }
}

init();
