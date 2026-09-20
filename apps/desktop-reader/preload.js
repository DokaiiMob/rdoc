'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rdocDesktop', {
  openDroppedPaths: (paths) => ipcRenderer.invoke('open-dropped-paths', paths),
});

window.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = [...(e.dataTransfer?.files || [])];
    const paths = files.map((f) => f.path).filter(Boolean);
    if (paths.length) window.rdocDesktop.openDroppedPaths(paths);
  });
});
