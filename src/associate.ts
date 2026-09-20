import { execFile, spawn } from "node:child_process";
import { copyFile, mkdir, writeFile, chmod } from "node:fs/promises";
import { homedir, platform, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSOC_DIR = path.join(ROOT, "assoc");

function cliEntry(): string {
  return path.join(ROOT, "dist", "cli.js");
}

function nodeBin(): string {
  return process.execPath;
}

/** Open .rdoc / .rdoc.html in the default browser with HTML semantics. */
export async function openRdoc(filePath: string): Promise<void> {
  const abs = path.resolve(filePath);
  const ext = path.extname(abs).toLowerCase();
  let toOpen = abs;

  if (ext === ".rdoc") {
    const dest = path.join(
      tmpdir(),
      `rdoc-open-${Date.now()}-${path.basename(abs)}.html`,
    );
    await copyFile(abs, dest);
    toOpen = dest;
  } else if (!/\.(html?|rdoc\.html)$/i.test(path.basename(abs))) {
    // Allow bare names ending in .rdoc.html (extname only sees .html)
    if (!abs.toLowerCase().endsWith(".rdoc.html")) {
      throw new Error(`Неподдерживаемое расширение: ${abs}`);
    }
  }

  const os = platform();
  if (os === "win32") {
    // `start` is a shell builtin; empty title avoids swallowing the path.
    await execFileAsync("cmd", ["/c", "start", "", toOpen], {
      windowsHide: true,
    });
    return;
  }
  if (os === "darwin") {
    await execFileAsync("open", [toOpen]);
    return;
  }
  await execFileAsync("xdg-open", [toOpen]);
}

export async function associate(opts: {
  undo?: boolean;
}): Promise<{ message: string }> {
  const os = platform();
  if (opts.undo) {
    if (os === "win32") return unregisterWindows();
    if (os === "darwin") return unregisterMac();
    return unregisterLinux();
  }
  if (os === "win32") return registerWindows();
  if (os === "darwin") return registerMac();
  return registerLinux();
}

async function registerWindows(): Promise<{ message: string }> {
  const node = nodeBin();
  const cli = cliEntry();
  const psPath = path.join(tmpdir(), `rdoc-associate-${Date.now()}.ps1`);
  const ps = `
$ErrorActionPreference = 'Stop'
$prog = 'rdoc.Document'
$node = '${node.replace(/'/g, "''")}'
$cli = '${cli.replace(/'/g, "''")}'
$cmd = '"' + $node + '" "' + $cli + '" open "%1"'
New-Item -Path "HKCU:\\Software\\Classes\\.rdoc" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\.rdoc" -Name '(default)' -Value $prog
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\.rdoc" -Name 'Content Type' -Value 'application/vnd.rdoc+html'
New-Item -Path "HKCU:\\Software\\Classes\\$prog" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\$prog" -Name '(default)' -Value 'Responsive Document'
New-Item -Path "HKCU:\\Software\\Classes\\$prog\\shell\\open\\command" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Classes\\$prog\\shell\\open\\command" -Name '(default)' -Value $cmd
Write-Output 'OK'
`;
  await writeFile(psPath, ps, "utf8");
  try {
    await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath],
      { windowsHide: true },
    );
  } finally {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(psPath);
    } catch {
      /* ignore */
    }
  }
  return {
    message:
      "Ассоциация .rdoc зарегистрирована в HKCU (открытие через rdoc open → браузер).",
  };
}

async function unregisterWindows(): Promise<{ message: string }> {
  const ps = `
Remove-Item -Path "HKCU:\\Software\\Classes\\.rdoc" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\\Software\\Classes\\rdoc.Document" -Recurse -Force -ErrorAction SilentlyContinue
Write-Output 'OK'
`;
  await execFileAsync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
    { windowsHide: true },
  );
  return { message: "Ассоциация .rdoc удалена из HKCU." };
}

async function registerLinux(): Promise<{ message: string }> {
  const mimeDir = path.join(homedir(), ".local", "share", "mime", "packages");
  const appDir = path.join(homedir(), ".local", "share", "applications");
  await mkdir(mimeDir, { recursive: true });
  await mkdir(appDir, { recursive: true });

  const mimeXml = `<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/vnd.rdoc+html">
    <comment>Responsive Document</comment>
    <glob pattern="*.rdoc"/>
    <sub-class-of type="text/html"/>
  </mime-type>
</mime-info>
`;
  await writeFile(path.join(mimeDir, "rdoc.xml"), mimeXml, "utf8");

  const desktop = `[Desktop Entry]
Type=Application
Name=RDOC Viewer
Comment=Open Responsive Document in the default browser
Exec=${nodeBin()} ${cliEntry()} open %f
MimeType=application/vnd.rdoc+html;
NoDisplay=true
Terminal=false
Categories=Office;Viewer;
`;
  const desktopPath = path.join(appDir, "rdoc.desktop");
  await writeFile(desktopPath, desktop, "utf8");
  await chmod(desktopPath, 0o755);

  try {
    await execFileAsync("update-mime-database", [
      path.join(homedir(), ".local", "share", "mime"),
    ]);
  } catch {
    /* optional */
  }
  try {
    await execFileAsync("update-desktop-database", [appDir]);
  } catch {
    /* optional */
  }
  try {
    await execFileAsync("xdg-mime", [
      "default",
      "rdoc.desktop",
      "application/vnd.rdoc+html",
    ]);
  } catch {
    /* optional */
  }

  return {
    message:
      "MIME application/vnd.rdoc+html и rdoc.desktop установлены в ~/.local/share.",
  };
}

async function unregisterLinux(): Promise<{ message: string }> {
  const { unlink } = await import("node:fs/promises");
  const mime = path.join(
    homedir(),
    ".local",
    "share",
    "mime",
    "packages",
    "rdoc.xml",
  );
  const desktop = path.join(
    homedir(),
    ".local",
    "share",
    "applications",
    "rdoc.desktop",
  );
  for (const f of [mime, desktop]) {
    try {
      await unlink(f);
    } catch {
      /* ignore */
    }
  }
  return { message: "Linux-ассоциация .rdoc удалена (MIME + desktop)." };
}

async function registerMac(): Promise<{ message: string }> {
  const binDir = path.join(homedir(), ".local", "bin");
  await mkdir(binDir, { recursive: true });
  const wrapper = path.join(binDir, "rdoc-open");
  const script = `#!/bin/bash
exec "${nodeBin()}" "${cliEntry()}" open "$@"
`;
  await writeFile(wrapper, script, "utf8");
  await chmod(wrapper, 0o755);

  // Prefer duti when present; otherwise instruct manual association.
  try {
    await execFileAsync("duti", [
      "-s",
      "com.apple.Safari",
      ".rdoc",
      "all",
    ]);
    return {
      message:
        `Установлен wrapper ${wrapper}. duti: .rdoc → Safari (файл всё равно проходит через rdoc open, если открывать через wrapper). Рекомендуется: Finder → Get Info → Open with → ${wrapper}.`,
    };
  } catch {
    return {
      message:
        `Установлен ${wrapper}. Назначьте его программой по умолчанию для .rdoc через Finder → Get Info → Open with.`,
    };
  }
}

async function unregisterMac(): Promise<{ message: string }> {
  const { unlink } = await import("node:fs/promises");
  const wrapper = path.join(homedir(), ".local", "bin", "rdoc-open");
  try {
    await unlink(wrapper);
  } catch {
    /* ignore */
  }
  return { message: "macOS wrapper rdoc-open удалён (если был)." };
}

/** Write static association helpers into assoc/ (idempotent docs material). */
export function getAssocDir(): string {
  return ASSOC_DIR;
}

/** Spawn detached open — unused helper for future GUI. */
export function spawnOpen(filePath: string): void {
  const child = spawn(nodeBin(), [cliEntry(), "open", filePath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
