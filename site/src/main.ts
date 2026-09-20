import { compileMarkdownInBrowser } from "./compile";

const drop = document.getElementById("drop") as HTMLElement;
const fileInput = document.getElementById("file") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLElement;
const compare = document.getElementById("compare") as HTMLElement;
const range = document.getElementById("compare-range") as HTMLInputElement;

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

function setStatus(msg: string, ok = true) {
  statusEl.textContent = msg;
  statusEl.dataset.ok = ok ? "1" : "0";
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function convert(md: string, name: string) {
  setStatus("Compiling…");
  try {
    const result = await compileMarkdownInBrowser(md, { filename: name });
    const out = name.replace(/\.md$/i, "") + ".rdoc.html";
    download(out, result.html);
    setStatus(
      `Done · ${out} · ${(result.bytes / 1024).toFixed(1)} KB · SHA ${result.contentHash.slice(0, 12)}…`,
    );
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), false);
  }
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
  void f.text().then((t) => convert(t, f.name || "document.md"));
});
drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  void f.text().then((t) => convert(t, f.name || "document.md"));
});

document.getElementById("btn-sample")?.addEventListener("click", () => {
  void convert(SAMPLE_MD, "sample.md");
});

if (range && compare) {
  const apply = () => compare.style.setProperty("--pos", `${range.value}%`);
  range.addEventListener("input", apply);
  apply();
}
