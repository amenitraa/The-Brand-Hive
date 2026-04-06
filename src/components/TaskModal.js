import { icons } from '../lib/icons.js';
import { getMemberNames, getProjects, memberAvatarStyle, projectBadgeStyle, STATUSES, PRIORITIES, initials, fileSize, relativeTime } from '../lib/helpers.js';
import { state, addTask, updateTaskInState } from '../lib/state.js';
import { createTask, updateTask, addComment } from '../lib/supabase.js';
import { showToast } from './Toast.js';

export function openTaskModal(taskId) {
  const task = taskId ? state.tasks.find(t => t.id === taskId) : null;
  const isNew = !task;
  const members = getMemberNames();
  const projects = getProjects();

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-panel">
        <div class="modal-header">
          <h2>${isNew ? '✨ New Task' : '✏️ Edit Task'}</h2>
          <button class="modal-close" id="modal-close">${icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <div class="field-label">Task Name *</div>
            <input class="field-input" type="text" id="f-name" placeholder="What needs to be done?" value="${esc(task?.name||'')}" />
          </div>
          <div class="field-row">
            <div class="field-group">
              <div class="field-label">Assigned To</div>
              <select class="field-input field-select" id="f-assignee">
                <option value="">Unassigned</option>
                ${members.map(m=>`<option value="${m}" ${task?.assignee===m?'selected':''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <div class="field-label">Due Date</div>
              <input class="field-input" type="date" id="f-due" value="${task?.due_date||''}" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <div class="field-label">Priority</div>
              <select class="field-input field-select" id="f-priority">
                <option value="">None</option>
                ${PRIORITIES.map(p=>`<option value="${p.value}" ${task?.priority===p.value?'selected':''}>${p.label}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <div class="field-label">Status</div>
              <select class="field-input field-select" id="f-status">
                ${STATUSES.map(s=>`<option value="${s.value}" ${(task?.status||'not-started')===s.value?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field-group">
            <div class="field-label">Project</div>
            <div class="tag-picker" id="f-project-picker">
              ${projects.map(p=>{
                const sel = task?.project===p.value;
                const style = sel ? projectBadgeStyle(p.value) : '';
                return `<div class="tag-opt ${sel?'selected':''}" data-proj="${p.value}" ${sel?`style="${style}"`:''}>${p.icon} ${p.label}</div>`;
              }).join('')}
            </div>
          </div>
          <div class="field-group">
            <div class="field-label">Notes</div>
            <textarea class="field-input field-textarea" id="f-notes" placeholder="Add context, links, or anything useful...">${esc(task?.notes||'')}</textarea>
          </div>
          <div class="field-group">
            <div class="field-label">Attachments</div>
            <div class="attach-list" id="attach-list">
              ${(task?.attachments||[]).map((a,i)=>renderAttach(a,i)).join('')}
            </div>
            <label class="attach-drop-area" id="drop-area">
              ${icons.paperclip} <span>Click or drag files to attach</span>
              <input type="file" id="file-input" multiple />
            </label>
          </div>
          ${!isNew ? renderComments(task) : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">${isNew ? icons.plus+' Create Task' : icons.check+' Save Changes'}</button>
        </div>
      </div>
    </div>
  `;

  let selectedProject = task?.project || '';
  let attachments = [...(task?.attachments||[])];

  // Project picker
  root.querySelectorAll('[data-proj]').forEach(el => {
    el.addEventListener('click', () => {
      const proj = getProjects().find(p=>p.value===el.dataset.proj);
      root.querySelectorAll('[data-proj]').forEach(e => { e.classList.remove('selected'); e.removeAttribute('style'); });
      if (selectedProject === el.dataset.proj) {
        selectedProject = '';
      } else {
        selectedProject = el.dataset.proj;
        el.classList.add('selected');
        if (proj) el.setAttribute('style', projectBadgeStyle(proj.value));
      }
    });
  });

  function refreshAttachList() {
    const list = root.querySelector('#attach-list');
    list.innerHTML = attachments.map((a,i)=>renderAttach(a,i)).join('');
    list.querySelectorAll('[data-detach]').forEach(btn => btn.addEventListener('click', ()=>{ attachments.splice(parseInt(btn.dataset.detach),1); refreshAttachList(); }));
  }
  root.querySelectorAll('[data-detach]').forEach(btn => btn.addEventListener('click', ()=>{ attachments.splice(parseInt(btn.dataset.detach),1); refreshAttachList(); }));
  root.querySelector('#file-input').addEventListener('change', e => { Array.from(e.target.files).forEach(f=>attachments.push({name:f.name,size:f.size})); refreshAttachList(); });
  const dropArea = root.querySelector('#drop-area');
  dropArea.addEventListener('dragover', e=>{ e.preventDefault(); dropArea.style.borderColor='var(--accent)'; });
  dropArea.addEventListener('dragleave', ()=>{ dropArea.style.borderColor=''; });
  dropArea.addEventListener('drop', e=>{ e.preventDefault(); dropArea.style.borderColor=''; Array.from(e.dataTransfer.files).forEach(f=>attachments.push({name:f.name,size:f.size})); refreshAttachList(); });

  // Comment
  root.querySelector('#comment-send')?.addEventListener('click', async () => {
    const input = root.querySelector('#comment-input');
    const text = input.value.trim(); if (!text) return;
    const comment = { id: crypto.randomUUID(), author: state.currentUser, text, created_at: new Date().toISOString() };
    const taskComments = [...(state.tasks.find(t=>t.id===taskId)?.comments||[]), comment];
    updateTaskInState(taskId, { comments: taskComments });
    await addComment(taskId, state.currentUser, text);
    input.value = '';
    root.querySelector('#comment-list').innerHTML += renderCommentItem(comment);
    showToast('Comment added', 'success');
  });

  // Save
  root.querySelector('#modal-save').addEventListener('click', async () => {
    const name = root.querySelector('#f-name').value.trim();
    if (!name) { showToast('Please enter a task name', 'error'); return; }
    const data = {
      name,
      assignee: root.querySelector('#f-assignee').value,
      due_date: root.querySelector('#f-due').value,
      priority: root.querySelector('#f-priority').value,
      status: root.querySelector('#f-status').value || 'not-started',
      project: selectedProject,
      notes: root.querySelector('#f-notes').value,
      attachments,
    };
    if (isNew) {
      const { data: created, error } = await createTask({ ...data, completed: false, comments: [] });
      if (error) { showToast('Error creating task', 'error'); return; }
      addTask(created);
      showToast('Task created! ✨', 'success');
    } else {
      updateTaskInState(taskId, data);
      await updateTask(taskId, data);
      showToast('Changes saved!', 'success');
    }
    closeModal(root);
  });

  root.querySelector('#modal-close').addEventListener('click', ()=>closeModal(root));
  root.querySelector('#modal-cancel').addEventListener('click', ()=>closeModal(root));
  root.querySelector('#modal-overlay').addEventListener('click', e=>{ if(e.target===root.querySelector('#modal-overlay')) closeModal(root); });
  setTimeout(()=>root.querySelector('#f-name')?.focus(), 50);
}

function renderAttach(a, i) {
  return `<div class="attach-item">${icons.paperclip}<span class="attach-name">${esc(a.name)}</span><span class="attach-size">${fileSize(a.size)}</span><button class="attach-remove" data-detach="${i}">${icons.x}</button></div>`;
}

function renderComments(task) {
  const comments = task?.comments||[];
  const avatar = memberAvatarStyle(state.currentUser);
  return `
    <div class="comments-section">
      <div class="comments-title">💬 Comments (${comments.length})</div>
      <div class="comment-list" id="comment-list">${comments.map(c=>renderCommentItem(c)).join('')}</div>
      <div class="comment-input-row">
        <div class="mini-avatar" style="background:${avatar.bg};font-size:13px;width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center">${avatar.icon}</div>
        <textarea class="field-input" id="comment-input" placeholder="Add a comment, OOO note, or reminder..." style="min-height:60px;resize:none"></textarea>
        <button class="btn btn-primary btn-sm" id="comment-send">${icons.send}</button>
      </div>
    </div>
  `;
}

function renderCommentItem(c) {
  const avatar = memberAvatarStyle(c.author);
  return `
    <div class="comment-item">
      <div style="width:28px;height:28px;border-radius:50%;background:${avatar.bg};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px">${avatar.icon}</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">${esc(c.author)}</span>
          <span class="comment-time">${relativeTime(c.created_at)}</span>
        </div>
        <div class="comment-text">${esc(c.text)}</div>
      </div>
    </div>
  `;
}

function closeModal(root) {
  const overlay = root.querySelector('#modal-overlay');
  if (overlay) { overlay.style.opacity='0'; overlay.style.transition='opacity 0.2s'; setTimeout(()=>{ root.innerHTML=''; },200); }
}

function esc(str) { if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
