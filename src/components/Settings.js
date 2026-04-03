import { icons } from '../lib/icons.js';
import {
  getMembers, getProjects, saveMember, deleteMember, saveProject, deleteProject,
  PASTEL_COLORS, MEMBER_ICONS, PROJECT_ICONS,
  darkenColor, hexToRgba, slugify, initials
} from '../lib/helpers.js';
import { notify } from '../lib/state.js';
import { showToast } from './Toast.js';

export function openSettings() {
  const root = document.getElementById('modal-root');
  render(root, 'members');

  function render(root, activeTab) {
    root.innerHTML = `
      <div class="settings-overlay" id="settings-overlay">
        <div class="settings-panel">
          <div class="settings-header">
            <h2>⚙️ Team Settings</h2>
            <button class="modal-close" id="settings-close">${icons.x}</button>
          </div>
          <div class="settings-tabs">
            <div class="settings-tab ${activeTab==='members'?'active':''}" data-tab="members">👥 Members</div>
            <div class="settings-tab ${activeTab==='projects'?'active':''}" data-tab="projects">📁 Projects</div>
          </div>
          <div class="settings-body">
            ${activeTab === 'members' ? renderMembersTab() : renderProjectsTab()}
          </div>
        </div>
      </div>
    `;

    // Tab switching
    root.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => render(root, tab.dataset.tab));
    });

    // Close
    root.querySelector('#settings-close').addEventListener('click', () => close(root));
    root.querySelector('#settings-overlay').addEventListener('click', e => {
      if (e.target === root.querySelector('#settings-overlay')) close(root);
    });

    // Tab-specific bindings
    if (activeTab === 'members') bindMembersTab(root, () => render(root, 'members'));
    else bindProjectsTab(root, () => render(root, 'projects'));
  }
}

// ===== MEMBERS TAB =====
function renderMembersTab() {
  const members = getMembers();
  return `
    <div class="settings-section">
      <div class="settings-section-title">
        Team Members <span style="font-size:11px;color:var(--text-muted);font-weight:400">${members.length} people</span>
      </div>
      ${members.map(m => `
        <div class="settings-card" data-member="${escHtml(m.name)}">
          <div class="settings-card-icon" style="background:${m.color}">
            ${m.icon || initials(m.name)}
          </div>
          <div style="flex:1">
            <div class="settings-card-label">${escHtml(m.name)}</div>
          </div>
          <div class="settings-card-actions">
            <button class="row-btn" data-edit-member="${escHtml(m.name)}" title="Edit">${icons.edit}</button>
            <button class="row-btn danger" data-del-member="${escHtml(m.name)}" title="Remove">${icons.trash}</button>
          </div>
        </div>
      `).join('')}
    </div>

    <div id="member-editor" style="display:none">
      ${renderMemberEditor(null)}
    </div>

    <div class="add-form" id="add-member-form" style="display:none">
      ${renderMemberEditor(null, true)}
    </div>

    <button class="btn btn-ghost" id="show-add-member" style="width:100%;margin-top:8px;justify-content:center">
      ${icons.plus} Add Team Member
    </button>
  `;
}

function renderMemberEditor(member, isNew = false) {
  const m = member || { name: '', color: PASTEL_COLORS[0], icon: MEMBER_ICONS[0] };
  return `
    <div class="add-form-title">${isNew ? 'Add New Member' : `Edit: ${m.name}`}</div>
    <div class="add-form-row">
      <input type="text" id="me-name" placeholder="Name" value="${escHtml(m.name)}" ${!isNew ? 'readonly style="opacity:0.6"' : ''} />
    </div>
    <div class="picker-label">Choose a color</div>
    <div class="color-picker-grid" id="me-color-grid">
      ${PASTEL_COLORS.map(c => `
        <div class="color-swatch ${c===m.color?'selected':''}" data-color="${c}" style="background:${c};border-color:${c===m.color?'#333':'transparent'}"></div>
      `).join('')}
    </div>
    <div class="picker-label">Choose an icon</div>
    <div class="icon-picker-grid" id="me-icon-grid">
      ${MEMBER_ICONS.map(ic => `
        <div class="icon-opt ${ic===m.icon?'selected':''}" data-icon="${ic}">${ic}</div>
      `).join('')}
    </div>
    <div class="preview-row">
      <span class="preview-label">Preview:</span>
      <div id="me-preview" style="width:32px;height:32px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:16px">${m.icon}</div>
      <span id="me-preview-name" style="font-size:13px;font-weight:500;color:var(--text-primary)">${m.name || 'Name'}</span>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="me-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="me-save">${isNew ? 'Add Member' : 'Save Changes'}</button>
    </div>
  `;
}

function bindMembersTab(root, refresh) {
  let selectedColor = PASTEL_COLORS[0];
  let selectedIcon = MEMBER_ICONS[0];
  let editingMember = null;

  function setupEditorBindings(container) {
    // Color picker
    container.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch').forEach(s => { s.classList.remove('selected'); s.style.borderColor = 'transparent'; });
        sw.classList.add('selected');
        sw.style.borderColor = '#333';
        selectedColor = sw.dataset.color;
        updatePreview(container);
      });
    });
    // Icon picker
    container.querySelectorAll('.icon-opt').forEach(ic => {
      ic.addEventListener('click', () => {
        container.querySelectorAll('.icon-opt').forEach(i => i.classList.remove('selected'));
        ic.classList.add('selected');
        selectedIcon = ic.dataset.icon;
        updatePreview(container);
      });
    });
    // Name input → preview
    container.querySelector('#me-name')?.addEventListener('input', () => updatePreview(container));
  }

  function updatePreview(container) {
    const name = container.querySelector('#me-name')?.value || 'Name';
    const prev = container.querySelector('#me-preview');
    const prevName = container.querySelector('#me-preview-name');
    if (prev) { prev.style.background = selectedColor; prev.textContent = selectedIcon; }
    if (prevName) prevName.textContent = name;
  }

  function openEditor(memberName) {
    const members = getMembers();
    editingMember = members.find(m => m.name === memberName);
    if (!editingMember) return;
    selectedColor = editingMember.color;
    selectedIcon = editingMember.icon;

    const editorEl = root.querySelector('#member-editor');
    const addFormEl = root.querySelector('#add-member-form');
    if (addFormEl) addFormEl.style.display = 'none';
    if (editorEl) {
      editorEl.style.display = 'block';
      editorEl.innerHTML = renderMemberEditor(editingMember, false);
      setupEditorBindings(editorEl);
      editorEl.querySelector('#me-cancel').addEventListener('click', () => { editorEl.style.display = 'none'; editingMember = null; });
      editorEl.querySelector('#me-save').addEventListener('click', () => {
        saveMember({ ...editingMember, color: selectedColor, icon: selectedIcon });
        showToast(`${editingMember.name} updated!`, 'success');
        notify();
        refresh();
      });
    }
  }

  // Edit buttons
  root.querySelectorAll('[data-edit-member]').forEach(btn => {
    btn.addEventListener('click', () => openEditor(btn.dataset.editMember));
  });

  // Delete buttons
  root.querySelectorAll('[data-del-member]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`Remove ${btn.dataset.delMember} from the team?`)) return;
      deleteMember(btn.dataset.delMember);
      showToast('Member removed', 'success');
      notify();
      refresh();
    });
  });

  // Show add form
  const showAddBtn = root.querySelector('#show-add-member');
  const addForm = root.querySelector('#add-member-form');
  showAddBtn?.addEventListener('click', () => {
    const editorEl = root.querySelector('#member-editor');
    if (editorEl) editorEl.style.display = 'none';
    editingMember = null;
    selectedColor = PASTEL_COLORS[Math.floor(Math.random() * 16)];
    selectedIcon = MEMBER_ICONS[Math.floor(Math.random() * MEMBER_ICONS.length)];
    addForm.style.display = 'block';
    addForm.innerHTML = renderMemberEditor(null, true);
    addForm.querySelector('.color-swatch[data-color="' + selectedColor + '"]')?.classList.add('selected');
    setupEditorBindings(addForm);
    addForm.querySelector('#me-cancel').addEventListener('click', () => { addForm.style.display = 'none'; });
    addForm.querySelector('#me-save').addEventListener('click', () => {
      const name = addForm.querySelector('#me-name').value.trim();
      if (!name) { showToast('Please enter a name', 'error'); return; }
      if (getMembers().find(m => m.name === name)) { showToast('That name already exists', 'error'); return; }
      saveMember({ name, color: selectedColor, icon: selectedIcon });
      showToast(`${name} added!`, 'success');
      notify();
      refresh();
    });
  });
}

// ===== PROJECTS TAB =====
function renderProjectsTab() {
  const projects = getProjects();
  return `
    <div class="settings-section">
      <div class="settings-section-title">
        Projects <span style="font-size:11px;color:var(--text-muted);font-weight:400">${projects.length} types</span>
      </div>
      ${projects.map(p => {
        const bg = hexToRgba(p.color, 0.25);
        const color = darkenColor(p.color);
        return `
          <div class="settings-card" data-project="${escHtml(p.value)}">
            <div class="settings-card-icon" style="background:${bg};color:${color};border-radius:8px;font-size:16px">
              ${p.icon || '📁'}
            </div>
            <div style="flex:1">
              <div class="settings-card-label">${escHtml(p.label)}</div>
              <div class="settings-card-sub">${escHtml(p.value)}</div>
            </div>
            <div class="settings-card-actions">
              <button class="row-btn" data-edit-proj="${escHtml(p.value)}" title="Edit">${icons.edit}</button>
              <button class="row-btn danger" data-del-proj="${escHtml(p.value)}" title="Remove">${icons.trash}</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div id="project-editor" style="display:none">
      ${renderProjectEditor(null)}
    </div>

    <div class="add-form" id="add-project-form" style="display:none">
      ${renderProjectEditor(null, true)}
    </div>

    <button class="btn btn-ghost" id="show-add-project" style="width:100%;margin-top:8px;justify-content:center">
      ${icons.plus} Add Project Type
    </button>
  `;
}

function renderProjectEditor(project, isNew = false) {
  const p = project || { label: '', value: '', color: PASTEL_COLORS[8], icon: PROJECT_ICONS[0] };
  return `
    <div class="add-form-title">${isNew ? 'Add New Project' : `Edit: ${p.label}`}</div>
    <div class="add-form-row">
      <input type="text" id="pe-label" placeholder="Project name (e.g. Partnerships)" value="${escHtml(p.label)}" />
    </div>
    <div class="picker-label">Choose a color</div>
    <div class="color-picker-grid" id="pe-color-grid">
      ${PASTEL_COLORS.map(c => `
        <div class="color-swatch ${c===p.color?'selected':''}" data-color="${c}" style="background:${c};border-color:${c===p.color?'#333':'transparent'}"></div>
      `).join('')}
    </div>
    <div class="picker-label">Choose an icon</div>
    <div class="icon-picker-grid" id="pe-icon-grid">
      ${PROJECT_ICONS.map(ic => `
        <div class="icon-opt ${ic===p.icon?'selected':''}" data-icon="${ic}">${ic}</div>
      `).join('')}
    </div>
    <div class="preview-row">
      <span class="preview-label">Preview:</span>
      <div id="pe-preview" style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${hexToRgba(p.color,0.25)};color:${darkenColor(p.color)};border:1px solid ${hexToRgba(p.color,0.4)}">
        ${p.icon} <span id="pe-preview-label">${p.label || 'Project Name'}</span>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="pe-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="pe-save">${isNew ? 'Add Project' : 'Save Changes'}</button>
    </div>
  `;
}

function bindProjectsTab(root, refresh) {
  let selectedColor = PASTEL_COLORS[8];
  let selectedIcon = PROJECT_ICONS[0];
  let editingProject = null;

  function setupEditorBindings(container) {
    container.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch').forEach(s => { s.classList.remove('selected'); s.style.borderColor = 'transparent'; });
        sw.classList.add('selected');
        sw.style.borderColor = '#333';
        selectedColor = sw.dataset.color;
        updatePreview(container);
      });
    });
    container.querySelectorAll('.icon-opt').forEach(ic => {
      ic.addEventListener('click', () => {
        container.querySelectorAll('.icon-opt').forEach(i => i.classList.remove('selected'));
        ic.classList.add('selected');
        selectedIcon = ic.dataset.icon;
        updatePreview(container);
      });
    });
    container.querySelector('#pe-label')?.addEventListener('input', () => updatePreview(container));
  }

  function updatePreview(container) {
    const label = container.querySelector('#pe-label')?.value || 'Project Name';
    const prev = container.querySelector('#pe-preview');
    const prevLabel = container.querySelector('#pe-preview-label');
    if (prev) {
      prev.style.background = hexToRgba(selectedColor, 0.25);
      prev.style.color = darkenColor(selectedColor);
      prev.style.borderColor = hexToRgba(selectedColor, 0.4);
      prev.childNodes[0] && (prev.innerHTML = `${selectedIcon} <span id="pe-preview-label">${escHtml(label)}</span>`);
    }
  }

  function openEditor(projectValue) {
    const projects = getProjects();
    editingProject = projects.find(p => p.value === projectValue);
    if (!editingProject) return;
    selectedColor = editingProject.color;
    selectedIcon = editingProject.icon;
    const editorEl = root.querySelector('#project-editor');
    const addFormEl = root.querySelector('#add-project-form');
    if (addFormEl) addFormEl.style.display = 'none';
    if (editorEl) {
      editorEl.style.display = 'block';
      editorEl.innerHTML = renderProjectEditor(editingProject, false);
      setupEditorBindings(editorEl);
      editorEl.querySelector('#pe-cancel').addEventListener('click', () => { editorEl.style.display = 'none'; editingProject = null; });
      editorEl.querySelector('#pe-save').addEventListener('click', () => {
        const label = editorEl.querySelector('#pe-label').value.trim();
        if (!label) { showToast('Please enter a name', 'error'); return; }
        saveProject({ ...editingProject, label, color: selectedColor, icon: selectedIcon });
        showToast(`${label} updated!`, 'success');
        notify();
        refresh();
      });
    }
  }

  root.querySelectorAll('[data-edit-proj]').forEach(btn => {
    btn.addEventListener('click', () => openEditor(btn.dataset.editProj));
  });

  root.querySelectorAll('[data-del-proj]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`Remove project "${btn.dataset.delProj}"?`)) return;
      deleteProject(btn.dataset.delProj);
      showToast('Project removed', 'success');
      notify();
      refresh();
    });
  });

  const showAddBtn = root.querySelector('#show-add-project');
  const addForm = root.querySelector('#add-project-form');
  showAddBtn?.addEventListener('click', () => {
    const editorEl = root.querySelector('#project-editor');
    if (editorEl) editorEl.style.display = 'none';
    editingProject = null;
    selectedColor = PASTEL_COLORS[Math.floor(Math.random() * 20)];
    selectedIcon = PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)];
    addForm.style.display = 'block';
    addForm.innerHTML = renderProjectEditor(null, true);
    setupEditorBindings(addForm);
    addForm.querySelector('#pe-cancel').addEventListener('click', () => { addForm.style.display = 'none'; });
    addForm.querySelector('#pe-save').addEventListener('click', () => {
      const label = addForm.querySelector('#pe-label').value.trim();
      if (!label) { showToast('Please enter a name', 'error'); return; }
      const value = slugify(label);
      if (getProjects().find(p => p.value === value)) { showToast('A project with that name already exists', 'error'); return; }
      saveProject({ value, label, color: selectedColor, icon: selectedIcon });
      showToast(`${label} added!`, 'success');
      notify();
      refresh();
    });
  });
}

function close(root) {
  const overlay = root.querySelector('.settings-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => { root.innerHTML = ''; }, 200);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
