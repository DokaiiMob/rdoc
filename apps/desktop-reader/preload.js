'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rdocDesktop', {
  openDroppedPaths: (paths) => ipcRenderer.invoke('open-dropped-paths', paths),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
  openDialog: () => ipcRenderer.invoke('open-dialog'),
  openSample: () => ipcRenderer.invoke('open-sample'),
  getWelcomeState: () => ipcRenderer.invoke('get-welcome-state'),
  removeRecent: (filePath) => ipcRenderer.invoke('remove-recent', filePath),
  clearRecent: () => ipcRenderer.invoke('clear-recent'),
  showDefaultHelp: () => ipcRenderer.invoke('show-default-help'),
  showSettings: () => ipcRenderer.invoke('show-settings'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onToast: (cb) => {
    const listener = (_e, msg) => cb(_e, msg);
    ipcRenderer.on('toast', listener);
    return () => ipcRenderer.removeListener('toast', listener);
  },
  onWelcomeRefresh: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('welcome-refresh', listener);
    return () => ipcRenderer.removeListener('welcome-refresh', listener);
  },
  reportTheme: (theme) => ipcRenderer.send('doc-theme', theme),
});

function wireDragDrop() {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = [...(e.dataTransfer?.files || [])];
    const paths = files.map((f) => f.path).filter(Boolean);
    if (paths.length) window.rdocDesktop.openDroppedPaths(paths);
  });
}

function detectAndReportTheme() {
  try {
    const el = document.documentElement;
    const data = (el.getAttribute('data-theme') || '').toLowerCase();
    let theme = null;
    if (data === 'dark' || data === 'night') theme = 'dark';
    else if (data === 'light' || data === 'day') theme = 'light';
    else if (el.classList.contains('dark')) theme = 'dark';
    else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) theme = 'dark';
    else theme = 'light';
    window.rdocDesktop.reportTheme(theme);
  } catch {
    /* ignore */
  }
}

function observeTheme() {
  detectAndReportTheme();
  try {
    const obs = new MutationObserver(() => detectAndReportTheme());
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', detectAndReportTheme);
  } catch {
    /* ignore */
  }
}

window.addEventListener('DOMContentLoaded', () => {
  wireDragDrop();
  // Only observe theme on real documents (not welcome data pages without rdoc mark).
  if (document.getElementById('rdoc-content') || document.querySelector('script[type="application/rdoc+json"]')) {
    observeTheme();
  }
});
