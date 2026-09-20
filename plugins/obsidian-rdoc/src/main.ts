import {
  App,
  Component,
  MarkdownRenderer,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";
import {
  arrayBufferToBase64,
  mimeFromPath,
  sanitizeRenderedHtml,
  wrapRdocDocument,
} from "./export";

interface RdocSettings {
  author: string;
  lang: string;
  extension: ".rdoc.html" | ".rdoc";
  outputFolder: string;
}

const DEFAULT_SETTINGS: RdocSettings = {
  author: "Anonymous",
  lang: "ru",
  extension: ".rdoc.html",
  outputFolder: "",
};

export default class RdocPlugin extends Plugin {
  settings: RdocSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("file-down", "Export note to .rdoc", () => {
      void this.exportActiveNote();
    });

    this.addCommand({
      id: "export-note-to-rdoc",
      name: "Export current note to .rdoc",
      callback: () => {
        void this.exportActiveNote();
      },
    });

    this.addCommand({
      id: "export-note-to-rdoc-clipboard-path",
      name: "Export current note to .rdoc (show path)",
      callback: () => {
        void this.exportActiveNote(true);
      },
    });

    this.addSettingTab(new RdocSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async exportActiveNote(announcePath = false) {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new Notice("Откройте Markdown-заметку для экспорта в .rdoc");
      return;
    }

    try {
      new Notice("Сборка .rdoc…");
      const markdown = await this.app.vault.read(file);
      const title =
        file.basename ||
        markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
        "Untitled";

      const bodyHtml = await this.renderNoteHtml(markdown, file.path);
      const inlined = await this.inlineImages(bodyHtml, file.path);

      const { html, manifest } = await wrapRdocDocument({
        title,
        author: this.settings.author,
        lang: this.settings.lang,
        bodyHtml: inlined,
      });

      const outName = `${file.basename}${this.settings.extension}`;
      const folder = (this.settings.outputFolder || "").replace(/^\/+|\/+$/g, "");
      const noteDir = file.parent?.path && file.parent.path !== "/" ? file.parent.path : "";
      const outPath = folder
        ? `${folder}/${outName}`
        : noteDir
          ? `${noteDir}/${outName}`
          : outName;

      if (folder) {
        const parts = folder.split("/");
        let acc = "";
        for (const part of parts) {
          acc = acc ? `${acc}/${part}` : part;
          if (!(await this.app.vault.adapter.exists(acc))) {
            await this.app.vault.createFolder(acc);
          }
        }
      }

      const existing = this.app.vault.getAbstractFileByPath(outPath);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, html);
      } else {
        await this.app.vault.create(outPath, html);
      }

      const msg = announcePath
        ? `✓ .rdoc: ${outPath} (${manifest.wordCount} слов, SHA ${manifest.contentHash.slice(0, 8)}…)`
        : `✓ Экспорт: ${outName}`;
      new Notice(msg, 6000);
    } catch (err) {
      console.error(err);
      new Notice(
        `Ошибка экспорта .rdoc: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async renderNoteHtml(markdown: string, sourcePath: string): Promise<string> {
    const host = document.createElement("div");
    // Off-DOM render host
    host.style.display = "none";
    document.body.appendChild(host);
    const component = new Component();
    component.load();
    try {
      await MarkdownRenderer.render(
        this.app,
        markdown,
        host,
        sourcePath,
        component,
      );
      return sanitizeRenderedHtml(host.innerHTML);
    } finally {
      component.unload();
      host.remove();
    }
  }

  private async inlineImages(html: string, sourcePath: string): Promise<string> {
    const container = document.createElement("div");
    container.innerHTML = html;
    const imgs = Array.from(container.querySelectorAll("img"));

    for (const img of imgs) {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) continue;
      if (/^https?:/i.test(src) || src.startsWith("//")) {
        img.remove();
        continue;
      }

      // Obsidian may use app://, vault-relative, or encoded paths.
      let linkpath = src;
      try {
        linkpath = decodeURIComponent(src);
      } catch {
        /* keep */
      }
      linkpath = linkpath
        .replace(/^app:\/\/[^/]+\//, "")
        .replace(/^\/+/, "");

      const dest =
        this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) ||
        this.app.vault.getAbstractFileByPath(linkpath);

      if (!(dest instanceof TFile)) {
        // Try basename fallback
        const base = linkpath.split("/").pop() ?? linkpath;
        const alt = this.app.metadataCache.getFirstLinkpathDest(base, sourcePath);
        if (!(alt instanceof TFile)) {
          img.removeAttribute("src");
          continue;
        }
        await this.applyBinary(img, alt);
        continue;
      }
      await this.applyBinary(img, dest);
    }

    return container.innerHTML;
  }

  private async applyBinary(img: HTMLImageElement, file: TFile) {
    const mime = mimeFromPath(file.path) ?? "application/octet-stream";
    const buf = await this.app.vault.readBinary(file);
    const b64 = arrayBufferToBase64(buf);
    img.setAttribute("src", `data:${mime};base64,${b64}`);
  }
}

class RdocSettingTab extends PluginSettingTab {
  plugin: RdocPlugin;

  constructor(app: App, plugin: RdocPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "RDOC export" });

    new Setting(containerEl)
      .setName("Author")
      .setDesc("Поле author в манифесте")
      .addText((t) =>
        t.setValue(this.plugin.settings.author).onChange(async (v) => {
          this.plugin.settings.author = v || "Anonymous";
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Language")
      .setDesc("BCP-47 (например ru, en)")
      .addText((t) =>
        t.setValue(this.plugin.settings.lang).onChange(async (v) => {
          this.plugin.settings.lang = v || "ru";
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Extension")
      .setDesc(".rdoc.html — без ассоциации ОС; .rdoc — после rdoc associate")
      .addDropdown((d) =>
        d
          .addOption(".rdoc.html", ".rdoc.html")
          .addOption(".rdoc", ".rdoc")
          .setValue(this.plugin.settings.extension)
          .onChange(async (v) => {
            this.plugin.settings.extension = v as RdocSettings["extension"];
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("Пусто = рядом с заметкой; иначе папка относительно корня vault")
      .addText((t) =>
        t
          .setPlaceholder("exports")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (v) => {
            this.plugin.settings.outputFolder = v.trim();
            await this.plugin.saveSettings();
          }),
      );
  }
}
