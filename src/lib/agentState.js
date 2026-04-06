// ====== SHARED AGENT STATE ======
// Separate from main.js to avoid circular imports

export const agentState = { agents: [], loaded: false };

export function setAgents(agents) {
  agentState.agents = agents;
  agentState.loaded = true;
}

export function getAgentsFromState() {
  return agentState.agents;
}
