// ====== SUPABASE-BACKED AGENT STORE ======
// All agent data syncs in real time across the whole team via Supabase.
// Falls back to localStorage if Supabase is not connected.

import { DEFAULT_AGENTS } from './agents.js';
import { setAgents } from './agentState.js';

let supabaseClient = null;

export function setAgentStoreClient(client) {
  supabaseClient = client;
}

// ====== HELPERS ======
function toRow(agent) {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description || '',
    icon: agent.icon || '🤖',
    color: agent.color || '#e9d5ff',
    status: agent.status || 'backlog',
    lifecycle: agent.lifecycle || [],
    cross_functional: agent.crossFunctional || [],
    partner: agent.partner || '',
    user_count: agent.userCount || 0,
    usage_notes: agent.usageNotes || '',
    progress_readout: agent.progressReadout || '',
    action_items: agent.actionItems || [],
    halts: agent.halts || [],
    timeline: agent.timeline || [],
    link: agent.link || '',
    agent_prompt: agent.agentPrompt || '',
    created_at: agent.createdAt || new Date().toISOString().split('T')[0],
  };
}

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    status: row.status,
    lifecycle: row.lifecycle || [],
    crossFunctional: row.cross_functional || [],
    partner: row.partner,
    userCount: row.user_count || 0,
    usageNotes: row.usage_notes,
    progressReadout: row.progress_readout,
    actionItems: row.action_items || [],
    halts: row.halts || [],
    timeline: row.timeline || [],
    link: row.link,
    agentPrompt: row.agent_prompt,
    createdAt: row.created_at,
    comments: [],
  };
}

// ====== FETCH ALL AGENTS ======
export async function fetchAgents() {
  if (!supabaseClient) {
    // localStorage fallback
    try {
      const stored = localStorage.getItem('bt_agents');
      return stored ? JSON.parse(stored) : DEFAULT_AGENTS;
    } catch { return DEFAULT_AGENTS; }
  }
  const { data, error } = await supabaseClient.from('agents').select('*').order('created_at', { ascending: true });
  if (error || !data || data.length === 0) {
    // First time — seed with defaults
    await seedDefaultAgents();
    return DEFAULT_AGENTS;
  }
  return data.map(fromRow);
}

// ====== SEED DEFAULT AGENTS on first load ======
async function seedDefaultAgents() {
  if (!supabaseClient) return;
  try {
    const rows = DEFAULT_AGENTS.map(toRow);
    await supabaseClient.from('agents').upsert(rows, { onConflict: 'id' });
  } catch (e) { console.error('Seed failed:', e); }
}

// ====== SAVE SINGLE AGENT ======
export async function saveAgentToStore(agent) {
  if (!supabaseClient) {
    // localStorage fallback
    try {
      const stored = localStorage.getItem('bt_agents');
      const agents = stored ? JSON.parse(stored) : DEFAULT_AGENTS;
      const idx = agents.findIndex(a => a.id === agent.id);
      if (idx >= 0) agents[idx] = agent; else agents.push(agent);
      localStorage.setItem('bt_agents', JSON.stringify(agents));
    } catch {}
    return;
  }
  const row = toRow(agent);
  await supabaseClient.from('agents').upsert([row], { onConflict: 'id' });
}

// ====== DELETE AGENT ======
export async function deleteAgentFromStore(id) {
  if (!supabaseClient) {
    try {
      const stored = localStorage.getItem('bt_agents');
      const agents = stored ? JSON.parse(stored) : [];
      localStorage.setItem('bt_agents', JSON.stringify(agents.filter(a => a.id !== id)));
    } catch {}
    return;
  }
  await supabaseClient.from('agents').delete().eq('id', id);
}

// ====== CREATE NEW AGENT ======
export async function createAgentInStore(agent) {
  if (!supabaseClient) {
    try {
      const stored = localStorage.getItem('bt_agents');
      const agents = stored ? JSON.parse(stored) : DEFAULT_AGENTS;
      agents.unshift(agent);
      localStorage.setItem('bt_agents', JSON.stringify(agents));
    } catch {}
    return;
  }
  const row = toRow(agent);
  await supabaseClient.from('agents').insert([row]);
}

// ====== USAGE LOGS ======
export async function fetchUsageLogs(agentId) {
  if (!supabaseClient) {
    try {
      return JSON.parse(localStorage.getItem(`bt_usage_${agentId}`) || '[]');
    } catch { return []; }
  }
  const { data } = await supabaseClient
    .from('agent_usage_logs')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id,
    user: r.user_name,
    rating: r.rating,
    note: r.note,
    timestamp: r.created_at,
  }));
}

export async function addUsageLogToStore(agentId, entry) {
  if (!supabaseClient) {
    try {
      const logs = JSON.parse(localStorage.getItem(`bt_usage_${agentId}`) || '[]');
      logs.unshift({ ...entry, id: Date.now(), timestamp: new Date().toISOString() });
      localStorage.setItem(`bt_usage_${agentId}`, JSON.stringify(logs));
    } catch {}
    return;
  }
  await supabaseClient.from('agent_usage_logs').insert([{
    agent_id: agentId,
    user_name: entry.user,
    rating: entry.rating || 0,
    note: entry.note || '',
  }]);
}

// ====== REALTIME SUBSCRIPTION ======
export function subscribeToAgents(callback) {
  if (!supabaseClient) return () => {};
  const sub = supabaseClient.channel('agents-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, payload => {
      callback(payload);
    })
    .subscribe();
  return () => supabaseClient.removeChannel(sub);
}
