import { initSupabase, fetchTasks, subscribeToTasks, subscribeToComments, getClient } from './lib/supabase.js';
import { state, setState, setTasks, addTask, updateTaskInState, subscribe } from './lib/state.js';
import { requestPermission, runAllChecks, checkNewComment, checkStatusAlert, checkNewAssignment, showInAppAlert } from './lib/notifications.js';
import { setAgentStoreClient, fetchAgents, subscribeToAgents } from './lib/agentStore.js';
import { agentState, setAgents, getAgentsFromState } from './lib/agentState.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderTopbar } from './components/Topbar.js';
import { renderFilterBar } from './components/FilterBar.js';
import { renderTable } from './components/TaskTable.js';
import { renderCalendar } from './components/Calendar.js';
import { openTaskModal } from './components/TaskModal.js';

if (!state.section) state.section = 'tasks';

async function init() {
  const app = document.getElementById('app');
  const configured = await initSupabase();
  setState({ isConfigured: configured });

  // Initialize agent store with Supabase client
  if (configured) {
    setAgentStoreClient(getClient());
  }

  // Load tasks and agents in parallel
  const [{ data: tasks }, agents] = await Promise.all([
    fetchTasks(),
    fetchAgents(),
  ]);

  setTasks(tasks || []);
  setAgents(agents || []);
  // Trigger a re-render after agents load so sidebar shows agent counts
  setTimeout(() => {
    const sidebarMount = document.getElementById('sidebar-mount');
    if (sidebarMount) {
      import('./components/Sidebar.js').then(({ renderSidebar }) => renderSidebar(sidebarMount));
    }
  }, 100);

  app.innerHTML = `
    <div class="app-shell">
      <div id="sidebar-mount"></div>
      <div class="main-content">
        ${!configured ? `
          <div class="setup-banner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong>Demo mode</strong> — Supabase not configured. See <strong>README.md</strong> to connect.
          </div>` : ''}
        <div id="topbar-mount"></div>
        <div id="filterbar-mount"></div>
        <div class="content-area" id="content-area"></div>
      </div>
    </div>
  `;

  subscribe(renderAll);
  renderAll(state);

  setTimeout(() => requestPermission(), 3000);

  if (configured) {
    // Subscribe to task changes
    subscribeToTasks(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT') {
        if (!state.tasks.find(t => t.id === row.id)) {
          addTask(row);
          checkNewAssignment(row, state.currentUser);
        }
      } else if (eventType === 'UPDATE') {
        updateTaskInState(row.id, row);
        if (old?.status !== row.status) {
          checkStatusAlert(row, state.currentUser);
          if (row.status === 'on-hold') showInAppAlert(`"${row.name}" was marked On Hold`, 'hold');
          if (row.status === 'need-support') showInAppAlert(`"${row.name}" needs support`, 'support');
        }
      }
    });

    // Subscribe to new comments
    subscribeToComments(async ({ new: comment }) => {
      if (!comment) return;
      const task = state.tasks.find(t => t.id === comment.task_id);
      if (!task || comment.author === state.currentUser) return;
      if (task.assignee !== state.currentUser) return;
      const updatedComments = [...(task.comments || []), comment];
      updateTaskInState(task.id, { comments: updatedComments });
      checkNewComment({ ...task, comments: updatedComments }, state.currentUser);
      showInAppAlert(`${comment.author} commented on "${task.name}"`, 'comment');
    });

    // Subscribe to agent changes — re-fetch and re-render when any agent changes
    subscribeToAgents(async () => {
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents);
      // Re-render sidebar to update counts
      const sidebarMount = document.getElementById('sidebar-mount');
      if (sidebarMount) renderSidebar(sidebarMount);
      // Re-render agent hub if currently visible
      const content = document.getElementById('content-area');
      if (content && (state.section === 'agents' || state.section === 'agents-directory')) {
        import('./components/AgentHub.js').then(({ renderAgentHub }) => {
          renderAgentHub(content, 'board');
        });
      }
    });
  }

  const loader = document.getElementById('loading-screen');
  if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 300); }

  setTimeout(() => {
    runAllChecks(state.tasks, state.currentUser);
    setInterval(() => runAllChecks(state.tasks, state.currentUser), 3600000);
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
    if (topbarMount) topbarMount.style.display = 'none';
    if (filterMount) filterMount.style.display = 'none';
    content.style.overflow = 'hidden';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    let startTab = 'board';
    if (s.section === 'agents-directory') startTab = 'directory';
    if (s.section === 'agents-intake') startTab = 'intake';
    const haltsOnly = s.filterHalts || false;
    import('./components/AgentHub.js').then(({ renderAgentHub }) => {
      renderAgentHub(content, startTab, haltsOnly);
    });
  } else {
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
