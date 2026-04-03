// ====== AGENT DATA ======
const DEFAULT_AGENTS = [
  {
    id: 'agent-1',
    name: 'Competitive Battle Card Builder',
    description: 'Auto-generates or refreshes battle cards based on competitive intel, positioning your brand\'s strengths against specific rivals.',
    icon: '⚔️',
    color: '#fca5a5',
    status: 'backlog',
    lifecycle: ['planning', 'creation'],
    crossFunctional: ['Sales', 'Marketing'],
    partner: '',
    userCount: 0,
    usageNotes: '',
    progressReadout: 'Identified as high priority for Sales enablement. Awaiting competitive intel data source.',
    actionItems: [
      { id: 'a1-1', text: 'Define competitive data sources', done: false, owner: 'Amanda' },
      { id: 'a1-2', text: 'Map battle card template format', done: false, owner: 'Amenitra' },
    ],
    halts: ['Need to identify competitive intel data feed before build can begin'],
    timeline: [
      { date: '2026-04-01', title: 'Added to backlog', note: 'Identified as Sales team priority', color: '#c4b5fd' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-04-01',
  },
  {
    id: 'agent-2',
    name: 'Thought Leadership Repurposing Agent',
    description: 'Takes long-form thought leadership content and repurposes it into multiple formats for different channels and audiences.',
    icon: '💡',
    color: '#fde68a',
    status: 'in-progress',
    lifecycle: ['creation', 'launch'],
    crossFunctional: ['Marketing'],
    partner: '',
    userCount: 3,
    usageNotes: 'Being tested by Amanda, Vivi, and Shannon for blog-to-social repurposing.',
    progressReadout: 'Core prompt built. Testing with 3 team members across LinkedIn and email formats.',
    actionItems: [
      { id: 'a2-1', text: 'Finalize LinkedIn post format', done: true, owner: 'Vivi' },
      { id: 'a2-2', text: 'Add exec summary output format', done: false, owner: 'Amanda' },
      { id: 'a2-3', text: 'QA with 5 real content pieces', done: false, owner: 'Shannon' },
    ],
    halts: [],
    timeline: [
      { date: '2026-03-10', title: 'Kickoff', note: 'Initial prompt drafted', color: '#6ee7b7' },
      { date: '2026-03-24', title: 'First test run', note: 'Tested with Q1 blog series', color: '#93c5fd' },
      { date: '2026-04-01', title: 'In active testing', note: '3 users piloting', color: '#fcd34d' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-03-10',
  },
  {
    id: 'agent-3',
    name: 'Trend-to-Campaign Idea Agent',
    description: 'Monitors trends and automatically generates campaign concepts tied to what\'s happening in the market.',
    icon: '📈',
    color: '#a7f3d0',
    status: 'backlog',
    lifecycle: ['planning'],
    crossFunctional: ['Marketing'],
    partner: '',
    userCount: 0,
    usageNotes: '',
    progressReadout: 'Concept stage. Need to define trend monitoring sources.',
    actionItems: [
      { id: 'a3-1', text: 'Research trend API options', done: false, owner: 'Kate' },
      { id: 'a3-2', text: 'Define campaign ideation output format', done: false, owner: 'Grace' },
    ],
    halts: [],
    timeline: [
      { date: '2026-04-01', title: 'Added to backlog', note: '', color: '#c4b5fd' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-04-01',
  },
  {
    id: 'agent-4',
    name: 'Cross-Channel Content Planner Agent',
    description: 'Plans and coordinates content across all channels — email, social, web, PR — ensuring consistent messaging and timing.',
    icon: '🗓️',
    color: '#bfdbfe',
    status: 'in-progress',
    lifecycle: ['planning', 'creation', 'activation'],
    crossFunctional: ['Marketing', 'PR'],
    partner: '',
    userCount: 4,
    usageNotes: 'Used weekly by planning leads for content calendar coordination.',
    progressReadout: 'MVP built and in use. Working on adding PR timeline integration.',
    actionItems: [
      { id: 'a4-1', text: 'Integrate PR calendar feed', done: false, owner: 'Amenitra' },
      { id: 'a4-2', text: 'Add approval workflow step', done: false, owner: 'Amanda' },
    ],
    halts: [],
    timeline: [
      { date: '2026-02-15', title: 'Build started', note: 'Core planner logic built', color: '#93c5fd' },
      { date: '2026-03-01', title: 'MVP deployed', note: 'Team using weekly', color: '#6ee7b7' },
      { date: '2026-04-01', title: 'Iteration 2', note: 'PR integration in progress', color: '#fcd34d' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-02-15',
  },
  {
    id: 'agent-5',
    name: 'Content Repurposing Agent',
    description: 'Takes one piece of content and reformats it for email, social, exec summary, and more — saving hours of manual work.',
    icon: '♻️',
    color: '#d8b4fe',
    status: 'deployed',
    lifecycle: ['creation'],
    crossFunctional: ['Marketing', 'Sales'],
    partner: '',
    userCount: 6,
    usageNotes: 'Full team using weekly. Also shared with 2 Sales reps for proposal content.',
    progressReadout: 'Fully deployed and in active use by the entire marketing team.',
    actionItems: [
      { id: 'a5-1', text: 'Create Sales-specific output template', done: false, owner: 'Kate' },
    ],
    halts: [],
    timeline: [
      { date: '2026-02-01', title: 'Build started', note: '', color: '#93c5fd' },
      { date: '2026-02-20', title: 'Deployed', note: 'All 6 team members onboarded', color: '#6ee7b7' },
      { date: '2026-03-15', title: 'Expanded to Sales', note: '2 Sales reps added', color: '#6ee7b7' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-02-01',
  },
  {
    id: 'agent-6',
    name: 'Internal Win/Story Capture Agent',
    description: 'Reads meeting notes, QBR recaps, campaign updates, and launch emails to extract wins, proof points, milestones, and strong anecdotes — structured and ready to reuse.',
    icon: '🏆',
    color: '#fde68a',
    status: 'in-review',
    lifecycle: ['review', 'live'],
    crossFunctional: ['Marketing', 'Sales', 'Leadership'],
    partner: '',
    userCount: 2,
    usageNotes: 'Amenitra and Amanda testing with Q1 QBR materials.',
    progressReadout: 'Agent built and extracting wins correctly. In review for output quality and structure.',
    actionItems: [
      { id: 'a6-1', text: 'Review output with 10 real documents', done: true, owner: 'Amenitra' },
      { id: 'a6-2', text: 'Validate structured format with leadership', done: false, owner: 'Amanda' },
      { id: 'a6-3', text: 'Set up file repository for input docs', done: false, owner: 'Kate' },
    ],
    halts: ['Needs a file repository or vector store setup before scaling'],
    timeline: [
      { date: '2026-03-01', title: 'Build started', note: 'Core extraction prompt built', color: '#93c5fd' },
      { date: '2026-03-20', title: 'First test', note: 'Ran on Q4 campaign notes', color: '#fcd34d' },
      { date: '2026-04-01', title: 'In review', note: 'Testing output quality', color: '#fcd34d' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-03-01',
  },
  {
    id: 'agent-7',
    name: 'Brand Voice Checker',
    description: 'Paste any copy and get instant feedback on tone, consistency, and brand alignment against your brand guidelines.',
    icon: '🎤',
    color: '#f9a8d4',
    status: 'deployed',
    lifecycle: ['creation', 'review'],
    crossFunctional: ['Marketing', 'Sales', 'PR'],
    partner: '',
    userCount: 8,
    usageNotes: 'Most widely used agent. Marketing + 2 PR team members + Sales using for proposal copy.',
    progressReadout: 'Fully deployed. Most used agent on the team. Considering sharing company-wide.',
    actionItems: [
      { id: 'a7-1', text: 'Document brand voice guidelines for agent context', done: true, owner: 'Shannon' },
      { id: 'a7-2', text: 'Explore company-wide rollout', done: false, owner: 'Amanda' },
    ],
    halts: [],
    timeline: [
      { date: '2026-01-15', title: 'Built & deployed', note: 'Fastest build — 1 week', color: '#6ee7b7' },
      { date: '2026-02-10', title: 'Expanded to PR', note: '', color: '#6ee7b7' },
      { date: '2026-03-01', title: 'Sales added', note: 'For proposal copy review', color: '#6ee7b7' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-01-15',
  },
  {
    id: 'agent-8',
    name: 'Cross-Functional Launch Coordinator',
    description: 'Feed it a launch date and brief — it generates a master timeline broken out by team, flags dependencies, identifies conflicts, and auto-generates weekly sync agendas.',
    icon: '🚀',
    color: '#99f6e4',
    status: 'in-progress',
    lifecycle: ['planning', 'launch', 'activation'],
    crossFunctional: ['Marketing', 'Sales', 'Product', 'PR', 'Legal'],
    partner: '',
    userCount: 3,
    usageNotes: 'Being piloted for Q2 product launch with Marketing, Sales, and Product leads.',
    progressReadout: 'Timeline generation working well. Dependency flagging in progress.',
    actionItems: [
      { id: 'a8-1', text: 'Complete dependency detection logic', done: false, owner: 'Vivi' },
      { id: 'a8-2', text: 'Build team-specific view output', done: false, owner: 'Grace' },
      { id: 'a8-3', text: 'Test with Q2 launch brief', done: true, owner: 'Amenitra' },
    ],
    halts: [],
    timeline: [
      { date: '2026-03-15', title: 'Build started', note: 'Timeline generation core complete', color: '#93c5fd' },
      { date: '2026-04-01', title: 'Pilot launched', note: 'Q2 product launch test', color: '#fcd34d' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-03-15',
  },
  {
    id: 'agent-9',
    name: 'Deal Health Checker',
    description: 'Based on deal stage and CRM activity, recommends what marketing content or campaign touchpoint could re-engage the deal.',
    icon: '💊',
    color: '#fca5a5',
    status: 'backlog',
    lifecycle: ['live', 'review'],
    crossFunctional: ['Sales', 'Marketing'],
    partner: '',
    userCount: 0,
    usageNotes: '',
    progressReadout: 'Concept approved by Sales leadership. Awaiting CRM data access.',
    actionItems: [
      { id: 'a9-1', text: 'Get CRM API access', done: false, owner: 'Amanda' },
      { id: 'a9-2', text: 'Map deal stages to content recommendations', done: false, owner: 'Kate' },
    ],
    halts: ['Blocked on CRM API access — working with IT'],
    timeline: [
      { date: '2026-04-01', title: 'Added to backlog', note: 'Sales leadership approved concept', color: '#c4b5fd' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-04-01',
  },
  {
    id: 'agent-10',
    name: 'Sales & Marketing Alignment Agent',
    description: 'Maps active campaigns to deals in pipeline so Sales knows exactly what Marketing is doing that supports their accounts.',
    icon: '🤝',
    color: '#c4b5fd',
    status: 'backlog',
    lifecycle: ['live', 'activation'],
    crossFunctional: ['Sales', 'Marketing'],
    partner: '',
    userCount: 0,
    usageNotes: '',
    progressReadout: 'High priority for Q2. Requires both CRM and campaign data integration.',
    actionItems: [
      { id: 'a10-1', text: 'Define data inputs from both CRM and campaign tools', done: false, owner: 'Amenitra' },
      { id: 'a10-2', text: 'Present concept to Sales leadership', done: false, owner: 'Amanda' },
    ],
    halts: [],
    timeline: [
      { date: '2026-04-01', title: 'Added to backlog', note: 'Q2 priority', color: '#c4b5fd' },
    ],
    link: '',
    agentPrompt: '',
    createdAt: '2026-04-01',
  },
];

export const AGENT_STATUSES = [
  { value: 'backlog',      label: 'Backlog',      dot: 'status-backlog',      text: 'status-label-backlog' },
  { value: 'in-progress',  label: 'In Progress',  dot: 'status-in-progress',  text: 'status-label-in-progress' },
  { value: 'in-review',    label: 'In Review',    dot: 'status-in-review',    text: 'status-label-in-review' },
  { value: 'deployed',     label: 'Deployed',     dot: 'status-deployed',     text: 'status-label-deployed' },
  { value: 'deprecated',   label: 'Deprecated',   dot: 'status-deprecated',   text: 'status-label-deprecated' },
];

export const LIFECYCLE_STAGES = ['planning','creation','launch','live','review','activation'];

export function agentStatusInfo(value) {
  return AGENT_STATUSES.find(s => s.value === value) || AGENT_STATUSES[0];
}

function loadAgents() {
  try {
    const stored = localStorage.getItem('bt_agents');
    return stored ? JSON.parse(stored) : DEFAULT_AGENTS;
  } catch { return DEFAULT_AGENTS; }
}

function saveAgents(agents) {
  try { localStorage.setItem('bt_agents', JSON.stringify(agents)); } catch {}
}

export function getAgents() { return loadAgents(); }

export function saveAgent(agent) {
  const agents = loadAgents();
  const idx = agents.findIndex(a => a.id === agent.id);
  if (idx >= 0) agents[idx] = agent; else agents.push(agent);
  saveAgents(agents);
}

export function deleteAgent(id) {
  saveAgents(loadAgents().filter(a => a.id !== id));
}

export function createNewAgent(data) {
  const agent = {
    id: 'agent-' + Date.now(),
    name: data.name || 'New Agent',
    description: data.description || '',
    icon: data.icon || '🤖',
    color: data.color || '#e9d5ff',
    status: 'backlog',
    lifecycle: data.lifecycle || [],
    crossFunctional: data.crossFunctional || ['Marketing'],
    partner: data.partner || '',
    userCount: 0,
    usageNotes: '',
    progressReadout: data.progressReadout || '',
    actionItems: [],
    halts: [],
    timeline: [{ date: new Date().toISOString().split('T')[0], title: 'Added to backlog', note: data.submittedBy ? `Submitted by ${data.submittedBy}` : '', color: '#c4b5fd' }],
    link: '',
    agentPrompt: '',
    createdAt: new Date().toISOString().split('T')[0],
    intakeData: data,
  };
  const agents = loadAgents();
  agents.unshift(agent);
  saveAgents(agents);
  return agent;
}
