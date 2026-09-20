'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  protocol,
  shell,
  nativeTheme,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const store = require('./lib/store');
const { validateHtml } = require('./lib/validate');
const { checkLatestRelease } = require('./lib/updater');

/** @type {BrowserWindow | null} */
let mainWindow = null;
let pendingOpenPath = null;
/** @type {string[]} */
let fileQueue = [];
/** @type {'light' | 'dark' | 'system'} */
let chromeTheme = 'system';

const COLORS = {
  light: { bg: '#f7fff9', overlay: '#eef6f1', symbol: '#1a262f' },
  dark: { bg: '#0f1a15', overlay: '#15231c', symbol: '#e8f5ee' },
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'rdoc',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function isRdocPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const lower = filePath.toLowerCase();
  return lower.endsWith('.rdoc') || lower.endsWith('.rdoc.html');
}

function appIconPath() {
  const ico = path.join(__dirname, 'icon.ico');
  const png = path.join(__dirname, 'icon.png');
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
}

function samplePath() {
  return path.join(__dirname, 'sample.rdoc');
}

function logoDataUrl() {
  try {
    const png = path.join(__dirname, 'icon.png');
    if (fs.existsSync(png)) {
      return `data:image/png;base64,${fs.readFileSync(png).toString('base64')}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveChromeTheme(hint) {
  if (hint === 'dark' || hint === 'light') return hint;
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

function applyWindowChrome(hint) {
  chromeTheme = hint === 'dark' || hint === 'light' ? hint : 'system';
  const resolved = resolveChromeTheme(hint);
  const c = COLORS[resolved];
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    mainWindow.setBackgroundColor(c.bg);
  } catch {
    /* ignore */
  }
  if (process.platform === 'win32') {
    try {
      mainWindow.setTitleBarOverlay({
        color: c.overlay,
        symbolColor: c.symbol,
        height: 36,
      });
    } catch {
      /* overlay may be unavailable */
    }
  }
  try {
    nativeTheme.themeSource = hint === 'dark' || hint === 'light' ? hint : 'system';
  } catch {
    /* ignore */
  }
}

function injectShellBadge(html, validation) {
  const ok = validation.ok;
  const bg = ok ? '#0b6e4f' : '#b42318';
  const label = validation.label.replace(/</g, '&lt;');
  const detail = String(validation.detail || '').replace(/"/g, '&quot;');
  const badge = `
<style id="rdoc-shell-badge-css">
#rdoc-shell-drag{
  position:fixed;top:0;left:0;right:0;height:36px;z-index:2147483645;
  -webkit-app-region:drag;app-region:drag;
}
#rdoc-shell-badge{
  position:fixed;top:8px;right:14px;z-index:2147483646;
  font:600 11px/1.25 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;
  color:#f7fff9;background:${bg};padding:5px 11px;border-radius:8px;
  box-shadow:0 2px 10px #0003;cursor:default;user-select:none;
  opacity:0.9;letter-spacing:0.02em;
  -webkit-app-region:no-drag;app-region:no-drag;
}
@media print{#rdoc-shell-badge,#rdoc-shell-drag{display:none!important}}
</style>
<div id="rdoc-shell-drag" aria-hidden="true"></div>
<div id="rdoc-shell-badge" title="${detail}">${label}</div>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${badge}</body>`);
  }
  return html + badge;
}

function createWindow() {
  const initial = resolveChromeTheme(null);
  const winOpts = {
    width: 980,
    height: 720,
    minWidth: 420,
    minHeight: 360,
    title: 'rdoc Reader',
    icon: appIconPath(),
    backgroundColor: COLORS[initial].bg,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };

  if (process.platform === 'win32') {
    winOpts.titleBarStyle = 'hidden';
    winOpts.titleBarOverlay = {
      color: COLORS[initial].overlay,
      symbolColor: COLORS[initial].symbol,
      height: 36,
    };
    // Windows 11 mica / acrylic when available (Electron 33+).
    winOpts.backgroundMaterial = 'mica';
  }

  mainWindow = new BrowserWindow(winOpts);

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('rdoc://') || url.startsWith('data:') || url.startsWith('file:')) return;
    if (url === 'about:blank') return;
    event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  buildMenu();
  showWelcome();
}

function showWelcome() {
  if (!mainWindow) return;
  applyWindowChrome(null);
  mainWindow.loadFile(path.join(__dirname, 'welcome.html'));
  mainWindow.setTitle('rdoc Reader');
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.webContents.send('welcome-refresh');
  });
}

function toast(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('toast', msg);
  }
}

function sendWelcomeRefresh() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('welcome-refresh');
  }
}

/**
 * @param {string} filePath
 * @param {{ skipQueue?: boolean }} [opts]
 */
async function openRdocFile(filePath, opts = {}) {
  if (!mainWindow || !filePath) return;
  const resolved = path.resolve(filePath);

  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch {
    dialog.showErrorBox('rdoc Reader', `File not found:\n${resolved}`);
    return;
  }

  if (stat.isDirectory()) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Folders not supported',
      message: 'Drop or open a .rdoc file, not a folder.',
      detail: resolved,
      buttons: ['OK'],
    });
    return;
  }

  if (!isRdocPath(resolved)) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Open anyway', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: 'This does not look like a .rdoc file. Open anyway?',
      detail: resolved,
    });
    if (response !== 0) return;
  }

  let html;
  try {
    html = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    dialog.showErrorBox('rdoc Reader', `Could not read file:\n${err.message}`);
    return;
  }

  const validation = validateHtml(html);
  const title = validation.title || path.basename(resolved);
  store.addRecent(resolved, title);
  applyWindowChrome(validation.themeHint);

  // Custom scheme forces text/html regardless of .rdoc extension.
  const encoded = Buffer.from(resolved, 'utf8').toString('base64url');
  await mainWindow.loadURL(`rdoc://local/doc?p=${encoded}`);
  mainWindow.setTitle(title);

  if (!opts.skipQueue && fileQueue.length) {
    toast(`${fileQueue.length} more file(s) queued — open from Recent or Queued list`);
    sendWelcomeRefresh();
  }
}

/**
 * @param {string[]} paths
 */
async function openDroppedPaths(paths) {
  const list = (paths || []).filter((p) => typeof p === 'string' && p.trim());
  if (!list.length) return;

  const files = [];
  for (const p of list) {
    const resolved = path.resolve(p);
    try {
      const st = fs.statSync(resolved);
      if (st.isDirectory()) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Folders not supported',
          message: 'Folders cannot be opened. Drop .rdoc files only.',
          detail: resolved,
          buttons: ['OK'],
        });
        continue;
      }
      files.push(resolved);
    } catch {
      dialog.showErrorBox('rdoc Reader', `File not found:\n${resolved}`);
    }
  }
  if (!files.length) return;

  const [first, ...rest] = files;
  // Queue extras into recent + in-memory queue (tabs-lite).
  fileQueue = rest;
  for (const extra of rest) {
    try {
      const html = fs.readFileSync(extra, 'utf8');
      const v = validateHtml(html);
      store.addRecent(extra, v.title || path.basename(extra));
    } catch {
      store.addRecent(extra, path.basename(extra));
    }
  }
  await openRdocFile(first, { skipQueue: false });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openDialog(),
        },
        {
          label: 'Open sample',
          click: () => openSample(),
        },
        {
          label: 'Welcome screen',
          click: () => {
            fileQueue = [];
            showWelcome();
          },
        },
        { type: 'separator' },
        {
          label: 'Set as default app…',
          click: () => showDefaultHelp(),
        },
        {
          label: 'Settings…',
          click: () => showSettings(),
        },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'What is .rdoc?',
          click: () => shell.openExternal('https://github.com/DokaiiMob/rdoc#why-rdoc'),
        },
        {
          label: 'Check for updates…',
          click: () => runUpdateCheck({ force: true }),
        },
        {
          label: 'GitHub Releases',
          click: () => shell.openExternal('https://github.com/DokaiiMob/rdoc/releases'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function openDialog() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open .rdoc',
    filters: [
      { name: 'rdoc documents', extensions: ['rdoc', 'html'] },
      { name: 'All files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });
  if (!canceled && filePaths.length) await openDroppedPaths(filePaths);
}

async function openSample() {
  const sample = samplePath();
  if (!fs.existsSync(sample)) {
    dialog.showErrorBox('rdoc Reader', 'Shipped sample.rdoc is missing from the app package.');
    return;
  }
  await openRdocFile(sample);
}

async function showDefaultHelp() {
  const exe = app.isPackaged ? process.execPath : process.execPath;
  const detail = [
    'Windows — Installed (NSIS/MSI):',
    '1. Settings → Apps → Default apps → Choose defaults by file type',
    '2. Assign .rdoc and .rdoc.html to “rdoc Reader”',
    '3. Or right-click a .rdoc → Open with → Choose another app → Always',
    '',
    'Windows — Portable edition:',
    'File associations are not registered automatically. Use Open with →',
    'Always, and point at this executable:',
    exe,
    '',
    'Protocol: rdoc://open?path=C:\\path\\to\\file.rdoc',
    '',
    'Android: open a .rdoc once → “Always” / “Open with rdoc Reader”.',
  ].join('\n');

  await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Set as default',
    message: 'Always open .rdoc with rdoc Reader',
    detail,
    buttons: ['OK', 'Open Windows Default Apps'],
    defaultId: 0,
    cancelId: 0,
  }).then(({ response }) => {
    if (response === 1 && process.platform === 'win32') {
      shell.openExternal('ms-settings:defaultapps');
    }
  });
}

async function showSettings() {
  const settings = store.getSettings();
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Settings',
    message: 'Optional update checks (GitHub Releases)',
    detail:
      'When enabled, the app asks GitHub for the latest reader release on startup. ' +
      'Nothing is downloaded automatically. Currently: ' +
      (settings.autoUpdateCheck ? 'ON' : 'OFF (default)'),
    buttons: [
      settings.autoUpdateCheck ? 'Turn OFF' : 'Turn ON',
      'Check now',
      'Cancel',
    ],
    defaultId: 2,
    cancelId: 2,
  });
  if (response === 0) {
    store.setSettings({ autoUpdateCheck: !settings.autoUpdateCheck });
    toast(`Update checks ${!settings.autoUpdateCheck ? 'enabled' : 'disabled'}`);
  } else if (response === 1) {
    await runUpdateCheck({ force: true });
  }
}

async function runUpdateCheck({ force }) {
  const settings = store.getSettings();
  if (!force && !settings.autoUpdateCheck) return;
  try {
    const result = await checkLatestRelease(app.getVersion());
    if (result.updateAvailable) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update available',
        message: `Version ${result.latest} is available (you have ${app.getVersion()}).`,
        detail: 'Open the GitHub Release page to download. Auto-download is not enabled.',
        buttons: ['Open release', 'Later'],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) shell.openExternal(result.url);
    } else if (force) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Up to date',
        message: `You have the latest release (${result.latest || app.getVersion()}).`,
        buttons: ['OK'],
      });
    }
  } catch (err) {
    if (force) {
      dialog.showErrorBox('Update check failed', err.message || String(err));
    }
  }
}

function registerRdocProtocol() {
  protocol.handle('rdoc', async (request) => {
    try {
      const url = new URL(request.url);
      const host = (url.hostname || '').toLowerCase();

      // Deep-link style: rdoc://open?path=...  (also handled at argv level)
      if (host === 'open' || url.pathname === '//open' || url.pathname.startsWith('/open')) {
        const p = url.searchParams.get('path') || url.searchParams.get('p');
        if (p) {
          const decoded = decodeURIComponent(p);
          setImmediate(() => openRdocFile(decoded));
          return new Response('Opening…', {
            status: 200,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }
      }

      const b64 = url.searchParams.get('p');
      if (!b64) {
        return new Response('Missing path', {
          status: 400,
          headers: { 'content-type': 'text/plain' },
        });
      }
      const filePath = Buffer.from(b64, 'base64url').toString('utf8');
      let html = fs.readFileSync(filePath, 'utf8');
      const validation = validateHtml(html);
      html = injectShellBadge(html, validation);
      const base = pathToFileURL(path.dirname(filePath) + path.sep).href;
      if (!/<base\s/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
      }
      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    } catch (err) {
      return new Response(String(err.message || err), {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  });
}

/**
 * Parse CLI / second-instance argv for file paths or rdoc:// deep links.
 * @param {string[]} argv
 */
function collectOpenTargets(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  /** @type {string[]} */
  const targets = [];
  for (const a of args) {
    if (!a || a.startsWith('-')) continue;
    if (
      a.endsWith('main.js') ||
      a.endsWith('electron.exe') ||
      a.endsWith('electron') ||
      a.endsWith('rdoc Reader.exe')
    ) {
      continue;
    }
    if (a.startsWith('rdoc://')) {
      const filePath = parseDeepLink(a);
      if (filePath) targets.push(filePath);
      continue;
    }
    targets.push(a);
  }
  return targets;
}

function parseDeepLink(urlStr) {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'rdoc:') return null;
    const p = url.searchParams.get('path') || url.searchParams.get('p');
    if (p) return decodeURIComponent(p);
    // rdoc:///C:/foo.rdoc or rdoc://local/C:/foo
    if (url.pathname && url.pathname.length > 1) {
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('/') && /^\/[A-Za-z]:\//.test(pathname)) {
        pathname = pathname.slice(1);
      }
      if (isRdocPath(pathname) || fs.existsSync(pathname)) return pathname;
    }
    return null;
  } catch {
    return null;
  }
}

function registerIpc() {
  ipcMain.handle('open-dropped-paths', async (_e, paths) => {
    await openDroppedPaths(paths || []);
  });
  ipcMain.handle('open-path', async (_e, filePath) => {
    fileQueue = fileQueue.filter((p) => path.resolve(p) !== path.resolve(filePath));
    await openRdocFile(filePath);
  });
  ipcMain.handle('open-dialog', async () => openDialog());
  ipcMain.handle('open-sample', async () => openSample());
  ipcMain.handle('get-welcome-state', async () => ({
    version: app.getVersion(),
    recent: store.getRecent(),
    queue: fileQueue.slice(),
    logoDataUrl: logoDataUrl(),
    settings: store.getSettings(),
  }));
  ipcMain.handle('remove-recent', async (_e, filePath) => store.removeRecent(filePath));
  ipcMain.handle('clear-recent', async () => store.clearRecent());
  ipcMain.handle('show-default-help', async () => showDefaultHelp());
  ipcMain.handle('show-settings', async () => showSettings());
  ipcMain.handle('open-external', async (_e, url) => {
    if (typeof url === 'string' && /^https?:/i.test(url)) {
      await shell.openExternal(url);
    }
  });
  ipcMain.on('doc-theme', (_e, theme) => {
    if (theme === 'dark' || theme === 'light') applyWindowChrome(theme);
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const targets = collectOpenTargets(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    if (targets.length) openDroppedPaths(targets);
  });

  app.whenReady().then(() => {
    store.init(app.getPath('userData'));
    // Register as default protocol client when installed / running from package.
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('rdoc', process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient('rdoc');
    }

    registerRdocProtocol();
    registerIpc();
    createWindow();

    const fromPending = pendingOpenPath ? [pendingOpenPath] : [];
    const fromCli = collectOpenTargets(process.argv);
    const targets = [...fromPending, ...fromCli];
    if (targets.length) openDroppedPaths(targets);

    runUpdateCheck({ force: false });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (app.isReady() && mainWindow) openRdocFile(filePath);
  else pendingOpenPath = filePath;
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  const p = parseDeepLink(url);
  if (!p) return;
  if (app.isReady() && mainWindow) openRdocFile(p);
  else pendingOpenPath = p;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
