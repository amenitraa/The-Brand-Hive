// Central app state
export const state = {
  tasks: [],
  view: 'all',        // 'all' | member name | 'my'
  viewMode: 'table',  // 'table' | 'calendar'
  currentUser: 'Amanda',
  selectedIds: new Set(),
  filters: { status: '', priority: '', project: '', search: '' },
  sortBy: 'due_date',
  sortDir: 'asc',
  groupBy: 'none',    // 'none' | 'status' | 'project' | 'priority'
  collapsedGroups: new Set(),
  isConfigured: false,
};

const listeners = [];
export function subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); }
export function notify() { listeners.forEach(fn => fn({ ...state })); }

export function setState(updates) {
  Object.assign(state, updates);
  notify();
}

export function setTasks(tasks) { state.tasks = tasks; notify(); }

export function addTask(task) {
  state.tasks = [task, ...state.tasks];
  notify();
}

export function updateTaskInState(id, updates) {
  state.tasks = state.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
  notify();
}

export function removeTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  notify();
}

export function removeTasks(ids) {
  const set = new Set(ids);
  state.tasks = state.tasks.filter(t => !set.has(t.id));
  state.selectedIds = new Set([...state.selectedIds].filter(id => !set.has(id)));
  notify();
}

export function toggleSelected(id) {
  const s = new Set(state.selectedIds);
  s.has(id) ? s.delete(id) : s.add(id);
  state.selectedIds = s;
  notify();
}

export function clearSelected() { state.selectedIds = new Set(); notify(); }

export function getFilteredTasks() {
  let tasks = [...state.tasks];
  // View filter
  if (state.view === 'my') tasks = tasks.filter(t => t.assignee === state.currentUser);
  else if (state.view !== 'all') tasks = tasks.filter(t => t.assignee === state.view);
  // Filter bar
  if (state.filters.status) tasks = tasks.filter(t => t.status === state.filters.status);
  if (state.filters.priority) tasks = tasks.filter(t => t.priority === state.filters.priority);
  if (state.filters.project) tasks = tasks.filter(t => t.project === state.filters.project);
  if (state.filters.search) {
    const q = state.filters.search.toLowerCase();
    tasks = tasks.filter(t => t.name.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q) || (t.assignee || '').toLowerCase().includes(q));
  }
  // Sort
  tasks.sort((a, b) => {
    let av = a[state.sortBy] || '', bv = b[state.sortBy] || '';
    if (state.sortBy === 'priority') {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      av = order[av] ?? 4; bv = order[bv] ?? 4;
    }
    if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
    if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return tasks;
}

export function getGroupedTasks() {
  const tasks = getFilteredTasks();
  if (state.groupBy === 'none') return [{ key: null, tasks }];
  const groups = {};
  tasks.forEach(t => {
    const k = t[state.groupBy] || 'none';
    if (!groups[k]) groups[k] = [];
    groups[k].push(t);
  });
  return Object.entries(groups).map(([key, tasks]) => ({ key, tasks }));
}
