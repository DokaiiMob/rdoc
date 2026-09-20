'use strict';

const { app, BrowserWindow, Menu, dialog, ipcMain, protocol } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

/** @type {BrowserWindow | null} */
let mainWindow = null;
let pendingOpenPath = null;

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

function extractTitle(html, fallback) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (m && m[1].trim()) return m[1].trim();
  const man = html.match(
    /<script[^>]*type=["']application\/rdoc\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (man) {
    try {
      const json = JSON.parse(man[1]);
      if (json && typeof json.title === 'string' && json.title.trim()) {
        return json.title.trim();
      }
    } catch {
      /* ignore */
    }
  }
  return fallback || 'rdoc Reader';
}

function appIconPath() {
  const ico = path.join(__dirname, 'icon.ico');
  const png = path.join(__dirname, 'icon.png');
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 420,
    minHeight: 360,
    title: 'rdoc Reader',
    icon: appIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('rdoc://') || url.startsWith('data:')) return;
    if (url === 'about:blank') return;
    event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  buildMenu();
  showWelcome();
}

function showWelcome() {
  if (!mainWindow) return;
  let logoImg = '';
  try {
    const png = path.join(__dirname, 'icon.png');
    if (fs.existsSync(png)) {
      const b64 = fs.readFileSync(png).toString('base64');
      logoImg = `<img src="data:image/png;base64,${b64}" width="96" height="96" alt="rdoc" style="border-radius:22%;margin-bottom:1rem">`;
    }
  } catch {
    /* ignore */
  }
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>rdoc Reader</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: "Segoe UI", system-ui, sans-serif;
    background: linear-gradient(160deg, #0B6E4F22, #1A3D3222);
    color: CanvasText;
  }
  main { text-align: center; max-width: 28rem; padding: 2rem; }
  h1 { font-size: 1.75rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  p { opacity: 0.8; line-height: 1.5; margin: 0.5rem 0 1.25rem; }
  kbd {
    font: 0.85em ui-monospace, Consolas, monospace;
    border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
    border-bottom-width: 2px; border-radius: 4px; padding: 0.1em 0.4em;
  }
</style>
</head>
<body>
<main>
  ${logoImg}
  <h1>rdoc Reader</h1>
  <p>Open a bare <strong>.rdoc</strong> or <strong>.rdoc.html</strong> file.<br>
  File → Open, drag &amp; drop, or pass a path on the command line.</p>
  <p><kbd>Ctrl</kbd>+<kbd>O</kbd> to browse</p>
</main>
</body>
</html>`;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  mainWindow.setTitle('rdoc Reader');
}

async function openRdocFile(filePath) {
  if (!mainWindow || !filePath) return;
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    dialog.showErrorBox('rdoc Reader', `File not found:\n${resolved}`);
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

  const title = extractTitle(html, path.basename(resolved));
  // Custom scheme forces text/html regardless of .rdoc extension.
  const encoded = Buffer.from(resolved, 'utf8').toString('base64url');
  await mainWindow.loadURL(`rdoc://local/doc?p=${encoded}`);
  mainWindow.setTitle(title);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Open .rdoc',
              filters: [
                { name: 'rdoc documents', extensions: ['rdoc', 'html'] },
                { name: 'All files', extensions: ['*'] },
              ],
              properties: ['openFile'],
            });
            if (!canceled && filePaths[0]) await openRdocFile(filePaths[0]);
          },
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
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerRdocProtocol() {
  protocol.handle('rdoc', async (request) => {
    try {
      const url = new URL(request.url);
      const b64 = url.searchParams.get('p');
      if (!b64) {
        return new Response('Missing path', { status: 400, headers: { 'content-type': 'text/plain' } });
      }
      const filePath = Buffer.from(b64, 'base64url').toString('utf8');
      const html = fs.readFileSync(filePath, 'utf8');
      const base = pathToFileURL(path.dirname(filePath) + path.sep).href;
      // Inject <base> so relative assets (rare in .rdoc) resolve if present.
      let body = html;
      if (!/<base\s/i.test(html)) {
        body = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
      }
      return new Response(body, {
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

function collectCliPath(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  for (const a of args) {
    if (!a || a.startsWith('-')) continue;
    if (a.endsWith('main.js') || a.endsWith('electron.exe') || a.endsWith('electron')) continue;
    return a;
  }
  return null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const p = collectCliPath(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (p) openRdocFile(p);
    }
  });

  app.whenReady().then(() => {
    registerRdocProtocol();
    createWindow();

    ipcMain.handle('open-dropped-paths', async (_e, paths) => {
      const first = (paths || []).find((p) => typeof p === 'string');
      if (first) await openRdocFile(first);
    });

    const fromCli = pendingOpenPath || collectCliPath(process.argv);
    if (fromCli) openRdocFile(fromCli);

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
