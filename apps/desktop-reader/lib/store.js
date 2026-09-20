'use strict';

/**
 * Local-only persistence under Electron userData (no cloud, no extra deps).
 */

const fs = require('fs');
const path = require('path');

const MAX_RECENT = 20;

/** @type {string | null} */
let userDataPath = null;

function init(dir) {
  userDataPath = dir;
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

function filePath(name) {
  if (!userDataPath) throw new Error('store not initialized');
  return path.join(userDataPath, name);
}

function readJson(name, fallback) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(name, data) {
  const tmp = filePath(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath(name));
}

function getRecent() {
  const data = readJson('recent-files.json', { items: [] });
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter((it) => it && typeof it.path === 'string');
}

function saveRecent(items) {
  writeJson('recent-files.json', { items: items.slice(0, MAX_RECENT) });
}

/**
 * @param {string} filePathAbs
 * @param {string} [title]
 */
function addRecent(filePathAbs, title) {
  const resolved = path.resolve(filePathAbs);
  const now = new Date().toISOString();
  let items = getRecent().filter((it) => path.resolve(it.path) !== resolved);
  items.unshift({
    path: resolved,
    title: title || path.basename(resolved),
    openedAt: now,
  });
  saveRecent(items);
  return getRecent();
}

function removeRecent(filePathAbs) {
  const resolved = path.resolve(filePathAbs);
  saveRecent(getRecent().filter((it) => path.resolve(it.path) !== resolved));
  return getRecent();
}

function clearRecent() {
  saveRecent([]);
  return [];
}

const DEFAULT_SETTINGS = {
  /** Optional GitHub Releases check — off by default */
  autoUpdateCheck: false,
};

function getSettings() {
  const data = readJson('settings.json', {});
  return { ...DEFAULT_SETTINGS, ...data };
}

function setSettings(partial) {
  const next = { ...getSettings(), ...partial };
  writeJson('settings.json', next);
  return next;
}

module.exports = {
  init,
  getRecent,
  addRecent,
  removeRecent,
  clearRecent,
  getSettings,
  setSettings,
  DEFAULT_SETTINGS,
};
