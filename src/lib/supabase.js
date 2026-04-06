export const SUPABASE_URL = 'https://btulujmzywugnubopxif.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dWx1am16eXd1Z251Ym9weGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjc3NjAsImV4cCI6MjA5MDgwMzc2MH0.q2D84VMLtu38A0eHoTlODKLZM9-YxRdO3HnqDxLA8cY';

let supabase = null;

export async function initSupabase() {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return false;
  try {
    const { createClient } = await import(`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm`);
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (e) { console.error('Supabase init failed:', e); return false; }
}

export function isConfigured() { return supabase !== null; }

export async function fetchTasks() {
  if (!supabase) return { data: getDemoTasks(), error: null };
  return supabase.from('tasks').select('*, comments(*)').order('created_at', { ascending: false });
}

export async function createTask(task) {
  if (!supabase) return { data: { ...task, id: crypto.randomUUID(), created_at: new Date().toISOString(), comments: [] }, error: null };
  const { comments, ...taskData } = task;
  return supabase.from('tasks').insert([taskData]).select().single();
}

export async function updateTask(id, updates) {
  if (!supabase) return { data: updates, error: null };
  const { comments, ...updateData } = updates;
  return supabase.from('tasks').update(updateData).eq('id', id).select().single();
}

export async function deleteTask(id) {
  if (!supabase) return { error: null };
  return supabase.from('tasks').delete().eq('id', id);
}

export async function deleteTasks(ids) {
  if (!supabase) return { error: null };
  return supabase.from('tasks').delete().in('id', ids);
}

export async function addComment(taskId, author, text) {
  const comment = { task_id: taskId, author, text, created_at: new Date().toISOString(), id: crypto.randomUUID() };
  if (!supabase) return { data: comment, error: null };
  return supabase.from('comments').insert([{ task_id: taskId, author, text }]).select().single();
}

// Subscribe to task changes (updates, inserts) with notification hooks
export function subscribeToTasks(callback) {
  if (!supabase) return () => {};
  const sub = supabase.channel('tasks-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe();
  return () => supabase.removeChannel(sub);
}

// Subscribe to new comments with notification hooks
export function subscribeToComments(callback) {
  if (!supabase) return () => {};
  const sub = supabase.channel('comments-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, callback)
    .subscribe();
  return () => supabase.removeChannel(sub);
}

function getDemoTasks() {
  const members = ['Amanda', 'Amenitra', 'Vivi', 'Kate', 'Grace', 'Shannon'];
  const projects = ['industry', 'account', 'planning', 'brand-advocacy', 'activation', 'campaign-review', 'web', 'ai'];
  const statuses = ['not-started', 'in-progress', 'done', 'on-hold', 'need-support'];
  const priorities = ['critical', 'high', 'medium', 'low'];
  const names = [
    'Q3 campaign deck for retail vertical', 'Update brand guidelines doc',
    'Social copy for product launch', 'Influencer brief — summer activation',
    'Web homepage hero refresh', 'Competitive analysis — Q4', 'Email newsletter template',
    'Brand advocacy program kickoff', 'AI content strategy doc', 'Campaign review deck — client A',
    'Industry report design', 'Account health dashboard copy', 'Planning doc for H2',
    'Activation event logistics', 'Web blog content calendar', 'AI tools audit',
    'Photography brief', 'Brand voice guidelines v2', 'Social media audit',
    'Partnership announcement copy',
  ];
  const now = new Date();
  return names.map((name, i) => {
    const due = new Date(now);
    due.setDate(due.getDate() + (i % 30) - 10);
    return {
      id: `demo-${i}`, name,
      assignee: members[i % members.length],
      due_date: due.toISOString().split('T')[0],
      priority: priorities[i % priorities.length],
      project: projects[i % projects.length],
      status: statuses[i % statuses.length],
      completed: i % 7 === 0,
      notes: i % 3 === 0 ? 'See Slack thread for context. Deadline is firm.' : '',
      attachments: i % 4 === 0 ? [{ name: 'brief.pdf', size: 124000 }] : [],
      comments: i % 3 === 0 ? [{ id: `c${i}`, author: members[(i+1)%members.length], text: "OOO reminder — I'll be out Aug 12-16, flag if blocked!", created_at: new Date(now.getTime()-86400000).toISOString() }] : [],
      created_at: new Date(now.getTime() - i * 86400000 * 2).toISOString(),
    };
  });
}
