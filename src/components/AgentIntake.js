import { icons } from '../lib/icons.js';
import { createNewAgent, LIFECYCLE_STAGES } from '../lib/agents.js';
import { getMemberNames, PASTEL_COLORS } from '../lib/helpers.js';
import { showToast } from './Toast.js';

const AGENT_ICONS = ['🤖','💡','⚔️','📈','🗓️','♻️','🏆','🎤','🚀','💊','🤝','🔍','📊','🧠','⚡','🎯','🛠️','📣','🌐','🔗','💼','🎬','📋','✏️'];

export function renderIntakeForm(container, onSuccess) {
  const members = getMemberNames();
  let selectedColor = PASTEL_COLORS[Math.floor(Math.random()*20)];
  let selectedIcon = '🤖';
  let selectedLifecycle = [];

  container.innerHTML = `
    <div style="overflow-y:auto;flex:1">
      <div class="intake-wrap">
        <div class="intake-header">
          <h2>➕ New Agent Intake Form</h2>
          <p>Fill this out to submit a new AI agent idea. Claude will help you think through the details after submission.</p>
        </div>

        <div class="intake-card">
          <div class="intake-card-title">🤖 Agent Basics</div>
          <div class="intake-field">
            <div class="intake-label">Agent Name *</div>
            <input class="intake-input" id="i-name" placeholder="e.g. Competitive Intel Summarizer" />
          </div>
          <div class="intake-field">
            <div class="intake-label">What does this agent do? *</div>
            <textarea class="intake-input intake-textarea" id="i-desc" placeholder="Describe what the agent does in plain language..."></textarea>
          </div>
          <div class="intake-field">
            <div class="intake-label">What problem does it solve?</div>
            <textarea class="intake-input intake-textarea" id="i-problem" placeholder="What manual work or pain point does this eliminate?"></textarea>
          </div>
          <div class="intake-row">
            <div class="intake-field">
              <div class="intake-label">Submitted by</div>
              <select class="intake-input intake-select" id="i-submitter">
                <option value="">Select...</option>
                ${members.map(m=>`<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div class="intake-field">
              <div class="intake-label">Priority</div>
              <select class="intake-input intake-select" id="i-priority">
                <option value="low">Low — Nice to have</option>
                <option value="medium" selected>Medium — Would help the team</option>
                <option value="high">High — Urgent need</option>
              </select>
            </div>
          </div>
        </div>

        <div class="intake-card">
          <div class="intake-card-title">🔗 Fit & Scope</div>
          <div class="intake-field">
            <div class="intake-label">Campaign Lifecycle Stage(s)</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
              ${LIFECYCLE_STAGES.map(s=>`
                <div class="tag-opt" data-lc="${s}" style="font-size:12px;cursor:pointer">${cap(s)}</div>
              `).join('')}
            </div>
          </div>
          <div class="intake-field">
            <div class="intake-label">Who will use this? (check all that apply)</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
              ${['Marketing','Sales','Product','PR','Legal','Leadership','Company-wide'].map(t=>`
                <div class="tag-opt ${t==='Marketing'?'selected':''}" data-team="${t}" style="font-size:12px;cursor:pointer">${t}</div>
              `).join('')}
            </div>
          </div>
          <div class="intake-field">
            <div class="intake-label">What are the inputs to this agent?</div>
            <textarea class="intake-input intake-textarea" id="i-inputs" placeholder="e.g. Campaign briefs, meeting notes, CRM data..."></textarea>
          </div>
          <div class="intake-field">
            <div class="intake-label">What does the output look like?</div>
            <textarea class="intake-input intake-textarea" id="i-outputs" placeholder="e.g. A structured summary, a drafted email, a scored list..."></textarea>
          </div>
        </div>

        <div class="intake-card">
          <div class="intake-card-title">🎨 Agent Identity</div>
          <div class="intake-field">
            <div class="intake-label">Choose an icon</div>
            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:6px">
              ${AGENT_ICONS.map(ic=>`
                <div class="icon-opt ${ic===selectedIcon?'selected':''}" data-intake-icon="${ic}">${ic}</div>
              `).join('')}
            </div>
          </div>
          <div class="intake-field">
            <div class="intake-label">Choose a color</div>
            <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin-top:6px">
              ${PASTEL_COLORS.slice(0,36).map(c=>`
                <div class="color-swatch ${c===selectedColor?'selected':''}" data-intake-color="${c}" style="background:${c};border-color:${c===selectedColor?'#333':'transparent'}"></div>
              `).join('')}
            </div>
          </div>
          <div class="preview-row" id="intake-preview">
            <span class="preview-label">Preview:</span>
            <div style="width:36px;height:36px;border-radius:10px;background:${hexRgba(selectedColor,.25)};display:flex;align-items:center;justify-content:center;font-size:20px">${selectedIcon}</div>
            <span id="intake-preview-name" style="font-size:13px;font-weight:500;color:var(--text-primary)">Agent Name</span>
          </div>
        </div>

        <div class="intake-card">
          <div class="intake-card-title">💡 Additional Context</div>
          <div class="intake-field">
            <div class="intake-label">Any AI tools or platforms in mind?</div>
            <input class="intake-input" id="i-partner" placeholder="e.g. Claude, ChatGPT, custom..." />
          </div>
          <div class="intake-field">
            <div class="intake-label">Success looks like...</div>
            <textarea class="intake-input intake-textarea" id="i-success" placeholder="How will we know this agent is working?"></textarea>
          </div>
          <div class="intake-field">
            <div class="intake-label">Anything else? Dependencies, risks, notes?</div>
            <textarea class="intake-input intake-textarea" id="i-notes" placeholder="Blockers, data needed, integrations required..."></textarea>
          </div>
        </div>

        <div class="intake-submit-row">
          <button class="btn btn-ghost" id="intake-clear">Clear Form</button>
          <button class="btn btn-primary" id="intake-submit">${icons.plus} Submit Agent</button>
        </div>
      </div>
    </div>
  `;

  // Lifecycle toggles
  container.querySelectorAll('[data-lc]').forEach(el => {
    el.addEventListener('click', () => {
      const s = el.dataset.lc;
      selectedLifecycle.includes(s) ? selectedLifecycle.splice(selectedLifecycle.indexOf(s),1) : selectedLifecycle.push(s);
      el.classList.toggle('selected');
    });
  });

  // Team toggles
  container.querySelectorAll('[data-team]').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('selected'));
  });

  // Icon picker
  container.querySelectorAll('[data-intake-icon]').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('[data-intake-icon]').forEach(i=>i.classList.remove('selected'));
      el.classList.add('selected');
      selectedIcon = el.dataset.intakeIcon;
      updatePreview(container, selectedColor, selectedIcon);
    });
  });

  // Color picker
  container.querySelectorAll('[data-intake-color]').forEach(sw => {
    sw.addEventListener('click', () => {
      container.querySelectorAll('[data-intake-color]').forEach(s=>{s.classList.remove('selected');s.style.borderColor='transparent';});
      sw.classList.add('selected'); sw.style.borderColor='#333';
      selectedColor = sw.dataset.intakeColor;
      updatePreview(container, selectedColor, selectedIcon);
    });
  });

  // Name → preview
  container.querySelector('#i-name')?.addEventListener('input', e => {
    const prev = container.querySelector('#intake-preview-name');
    if (prev) prev.textContent = e.target.value || 'Agent Name';
  });

  // Submit
  container.querySelector('#intake-submit').addEventListener('click', async () => {
    const name = container.querySelector('#i-name')?.value.trim();
    const desc = container.querySelector('#i-desc')?.value.trim();
    if (!name || !desc) { showToast('Please fill in the agent name and description', 'error'); return; }

    const crossFunctional = [...container.querySelectorAll('[data-team].selected')].map(el=>el.dataset.team);
    const data = {
      name, description: desc,
      icon: selectedIcon, color: selectedColor,
      lifecycle: selectedLifecycle,
      crossFunctional: crossFunctional.length ? crossFunctional : ['Marketing'],
      partner: container.querySelector('#i-partner')?.value || '',
      progressReadout: container.querySelector('#i-problem')?.value || '',
      submittedBy: container.querySelector('#i-submitter')?.value || '',
      inputs: container.querySelector('#i-inputs')?.value || '',
      outputs: container.querySelector('#i-outputs')?.value || '',
      successCriteria: container.querySelector('#i-success')?.value || '',
      notes: container.querySelector('#i-notes')?.value || '',
      priority: container.querySelector('#i-priority')?.value || 'medium',
    };

    createNewAgent(data);
    showToast(`"${name}" added to the agent backlog! 🎉`, 'success');
    if (onSuccess) onSuccess();
  });

  container.querySelector('#intake-clear')?.addEventListener('click', () => {
    if (confirm('Clear the form?')) renderIntakeForm(container, onSuccess);
  });
}

function updatePreview(container, color, icon) {
  const wrap = container.querySelector('#intake-preview');
  if (!wrap) return;
  const iconEl = wrap.querySelector('div');
  if (iconEl) { iconEl.style.background = hexRgba(color,.25); iconEl.textContent = icon; }
}

function hexRgba(hex, a) { if(!hex||!hex.startsWith('#')) return `rgba(180,180,180,${a})`; const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function cap(s) { return s?s.charAt(0).toUpperCase()+s.slice(1):''; }
