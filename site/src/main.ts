import { compileMarkdownInBrowser } from "./compile";
import { saveTextFile } from "./save";
import {
  SHARE_MAX_RAW_BYTES,
  buildShareUrl,
  decodeShareFragment,
  encodeShareFragment,
} from "./share";

const drop = document.getElementById("drop") as HTMLElement;
const fileInput = document.getElementById("file") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLElement;
const compare = document.getElementById("compare") as HTMLElement;
const range = document.getElementById("compare-range") as HTMLInputElement;

const pdfInput = document.getElementById("pdf-file") as HTMLInputElement;
const rdocInput = document.getElementById("rdoc-file") as HTMLInputElement;
const pdfFrame = document.getElementById("pdf-frame") as HTMLIFrameElement;
const rdocFrame = document.getElementById("rdoc-frame") as HTMLIFrameElement;
const pdfPlaceholder = document.getElementById("pdf-placeholder") as HTMLElement;
const rdocPlaceholder = document.getElementById("rdoc-placeholder") as HTMLElement;
const dualStatus = document.getElementById("dual-status") as HTMLElement;
const btnPdfClear = document.getElementById("btn-pdf-clear") as HTMLButtonElement | null;
const btnRdocClear = document.getElementById("btn-rdoc-clear") as HTMLButtonElement | null;

const mdEditor = document.getElementById("md-editor") as HTMLTextAreaElement | null;
const btnConvert = document.getElementById("btn-convert") as HTMLButtonElement | null;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement | null;
const btnSave = document.getElementById("btn-save") as HTMLButtonElement | null;
const btnCopyShare = document.getElementById("btn-copy-share") as HTMLButtonElement | null;
const sharePanel = document.getElementById("share-panel") as HTMLElement | null;
const shareUrlEl = document.getElementById("share-url") as HTMLInputElement | null;

const SAMPLE_MD = `# Hello from .rdoc

Drop your own Markdown — or start with this sample.

## Why it exists

PDFs fight phones. Web pages need the network. **.rdoc** is one UTF-8 file that reflows, stays offline, and opens in any browser.

::: tip
Try the theme button and footnotes on your phone.
:::

Quote:

> Offline-first beats zoom-and-pan.

### Footnote

Tap here [^1] on mobile.

\`\`\`bash
npm i && npm run build
node dist/cli.js build note.md -o note.rdoc.html
\`\`\`

[^1]: Popover footnotes — no jump to the page footer.
`;

let lastHtml = "";
let lastFilename = "document.rdoc.html";
let lastMarkdown = SAMPLE_MD;
let pdfBlobUrl: string | null = null;
let rdocBlobUrl: string | null = null;

function setStatus(msg: string, ok = true) {
  statusEl.textContent = msg;
  statusEl.dataset.ok = ok ? "1" : "0";
}

function setDualStatus(msg: string, ok = true) {
  if (!dualStatus) return;
  dualStatus.textContent = msg;
  dualStatus.dataset.ok = ok ? "1" : "0";
}

function revoke(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

function showFrame(frame: HTMLIFrameElement, placeholder: HTMLElement, url: string) {
  frame.src = url;
  frame.hidden = false;
  placeholder.hidden = true;
}

function hideFrame(frame: HTMLIFrameElement, placeholder: HTMLElement) {
  frame.removeAttribute("src");
  frame.hidden = true;
  placeholder.hidden = false;
}

async function compileToHtml(md: string, name: string) {
  const result = await compileMarkdownInBrowser(md, { filename: name });
  lastHtml = result.html;
  lastFilename = name.replace(/\.md$/i, "") + ".rdoc.html";
  lastMarkdown = md;
  if (mdEditor && mdEditor.value !== md) mdEditor.value = md;
  return result;
}

async function convertAndDownload(md: string, name: string) {
  setStatus("Compiling…");
  try {
    const result = await compileToHtml(md, name);
    const how = await saveTextFile(lastFilename, result.html);
    setStatus(
      `Done · ${lastFilename} · ${(result.bytes / 1024).toFixed(1)} KB · SHA ${result.contentHash.slice(0, 12)}…` +
        (how === "picker" ? " · saved" : " · downloaded"),
    );
    revoke(rdocBlobUrl);
    rdocBlobUrl = URL.createObjectURL(
      new Blob([result.html], { type: "text/html;charset=utf-8" }),
    );
    showFrame(rdocFrame, rdocPlaceholder, rdocBlobUrl);
    setDualStatus("Right pane updated with freshly generated .rdoc.html");
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      setStatus("Save cancelled");
      return;
    }
    setStatus(err instanceof Error ? err.message : String(err), false);
  }
}

async function previewRdocFromMd(md: string, name: string) {
  setDualStatus("Compiling Markdown for preview…");
  try {
    const result = await compileToHtml(md, name);
    revoke(rdocBlobUrl);
    rdocBlobUrl = URL.createObjectURL(
      new Blob([result.html], { type: "text/html;charset=utf-8" }),
    );
    showFrame(rdocFrame, rdocPlaceholder, rdocBlobUrl);
    setDualStatus(
      `Preview ready · ${(result.bytes / 1024).toFixed(1)} KB · use Save or Share when ready`,
    );
    setStatus(`Compiled ${lastFilename} · ready to save or share`);
  } catch (err) {
    setDualStatus(err instanceof Error ? err.message : String(err), false);
  }
}

function loadPdfFile(file: File) {
  revoke(pdfBlobUrl);
  pdfBlobUrl = URL.createObjectURL(file);
  showFrame(pdfFrame, pdfPlaceholder, pdfBlobUrl);
  setDualStatus(
    `PDF loaded locally (${(file.size / 1024).toFixed(0)} KB). ` +
      "Browsers use their built-in PDF viewer — layout may differ from a native reader. Nothing is uploaded.",
  );
}

function loadRdocHtml(html: string, name: string) {
  lastHtml = html;
  lastFilename = name.endsWith(".html") ? name : name + ".rdoc.html";
  revoke(rdocBlobUrl);
  rdocBlobUrl = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  showFrame(rdocFrame, rdocPlaceholder, rdocBlobUrl);
  setDualStatus(`Loaded ${lastFilename} into the right pane (client-side only).`);
}

drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  void f.text().then((t) => convertAndDownload(t, f.name || "document.md"));
});
drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  void f.text().then((t) => convertAndDownload(t, f.name || "document.md"));
});

document.getElementById("btn-sample")?.addEventListener("click", () => {
  void convertAndDownload(SAMPLE_MD, "sample.md");
});

btnConvert?.addEventListener("click", () => {
  const md = mdEditor?.value ?? lastMarkdown;
  void previewRdocFromMd(md, "document.md");
});

btnSave?.addEventListener("click", async () => {
  try {
    if (!lastHtml) {
      const md = mdEditor?.value ?? lastMarkdown;
      await compileToHtml(md, "document.md");
    }
    const how = await saveTextFile(lastFilename, lastHtml);
    setStatus(
      how === "picker"
        ? `Saved ${lastFilename} via file picker`
        : `Downloaded ${lastFilename}`,
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      setStatus("Save cancelled");
      return;
    }
    setStatus(err instanceof Error ? err.message : String(err), false);
  }
});

btnShare?.addEventListener("click", async () => {
  try {
    const md = (mdEditor?.value ?? lastMarkdown).trim();
    if (!md) {
      setStatus("Nothing to share — paste Markdown first.", false);
      return;
    }
    setStatus("Compressing share link…");
    const fragment = await encodeShareFragment({ kind: "md", text: md });
    const url = buildShareUrl(fragment);
    if (shareUrlEl) shareUrlEl.value = url;
    sharePanel?.removeAttribute("hidden");
    setStatus(
      `Share link ready · ${(new TextEncoder().encode(md).byteLength / 1024).toFixed(1)} KB raw ` +
        `(limit ${SHARE_MAX_RAW_BYTES / 1000} KB). Copy and send the URL.`,
    );
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), false);
  }
});

btnCopyShare?.addEventListener("click", async () => {
  const url = shareUrlEl?.value;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Share link copied to clipboard");
  } catch {
    shareUrlEl?.select();
    setStatus("Select the link and copy manually", false);
  }
});

pdfInput?.addEventListener("change", () => {
  const f = pdfInput.files?.[0];
  if (!f) return;
  loadPdfFile(f);
});

rdocInput?.addEventListener("change", () => {
  const f = rdocInput.files?.[0];
  if (!f) return;
  const name = f.name || "document.rdoc.html";
  if (/\.md$/i.test(name) || f.type.includes("markdown") || f.type === "text/plain") {
    void f.text().then((t) => previewRdocFromMd(t, name));
    return;
  }
  void f.text().then((t) => loadRdocHtml(t, name));
});

document.getElementById("btn-pick-pdf")?.addEventListener("click", () => pdfInput.click());
document.getElementById("btn-pick-rdoc")?.addEventListener("click", () => rdocInput.click());

btnPdfClear?.addEventListener("click", () => {
  revoke(pdfBlobUrl);
  pdfBlobUrl = null;
  pdfInput.value = "";
  hideFrame(pdfFrame, pdfPlaceholder);
  setDualStatus("PDF pane cleared");
});

btnRdocClear?.addEventListener("click", () => {
  revoke(rdocBlobUrl);
  rdocBlobUrl = null;
  rdocInput.value = "";
  hideFrame(rdocFrame, rdocPlaceholder);
  setDualStatus("rdoc pane cleared");
});

if (range && compare) {
  const apply = () => compare.style.setProperty("--pos", `${range.value}%`);
  range.addEventListener("input", apply);
  apply();
}

if (mdEditor && !mdEditor.value) {
  mdEditor.value = SAMPLE_MD;
}

async function restoreFromHash() {
  const raw = location.hash;
  if (!raw || raw === "#") return;
  try {
    const payload = await decodeShareFragment(raw);
    if (!payload) return;
    if (payload.kind === "md") {
      lastMarkdown = payload.text;
      if (mdEditor) mdEditor.value = payload.text;
      setStatus("Restored Markdown from share link — convert, save, or re-share.");
      document.getElementById("try")?.scrollIntoView({ behavior: "smooth" });
      const convert = window.confirm(
        "This link contains Markdown. Convert it to .rdoc.html and preview now?",
      );
      if (convert) await previewRdocFromMd(payload.text, "shared.md");
    } else {
      loadRdocHtml(payload.text, "shared.rdoc.html");
      setStatus("Restored .rdoc.html from share link — use Save to download.");
      document.getElementById("compare-live")?.scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), false);
  }
}

void restoreFromHash();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = new URL("sw.js", document.baseURI || location.href);
    void navigator.serviceWorker.register(swUrl.href).catch(() => {
      /* offline registration may fail on file:// — ignore */
    });
  });
}
