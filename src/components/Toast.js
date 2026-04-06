import { icons } from '../lib/icons.js';

export function showToast(message, type = 'success', duration = 3500) {
  const root = document.getElementById('toast-root');
  if (!root.querySelector('.toast-container')) {
    root.innerHTML = `<div class="toast-container"></div>`;
  }
  const container = root.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${type === 'success' ? icons.check : icons.warning}
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
