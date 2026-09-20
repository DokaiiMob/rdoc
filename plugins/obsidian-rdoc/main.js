var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RdocPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/assets.ts
var RDOC_VERSION = "1.1.0";
var READER_CSS = '/* rdoc reader \u2014 adaptive offline typography, no external fonts */\r\n:root {\r\n  color-scheme: light dark;\r\n  --bg: #f7f5f1;\r\n  --bg-elev: #ffffff;\r\n  --fg: #1a1a1a;\r\n  --muted: #5c5c5c;\r\n  --border: #e2ddd4;\r\n  --accent: #0b6e4f;\r\n  --accent-soft: #d8efe6;\r\n  --callout: #fff8e7;\r\n  --callout-border: #e6c86a;\r\n  --code-bg: #f0ece4;\r\n  --shadow: 0 8px 28px rgba(26, 26, 26, 0.12);\r\n  --measure: 42rem;\r\n  --pad: clamp(1rem, 4vw, 1.75rem);\r\n  --fs: 1.0625rem;\r\n  --lh: 1.7;\r\n  --radius: 10px;\r\n  --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto,\r\n    "Helvetica Neue", Arial, sans-serif;\r\n  --serif: Georgia, "Charter", "Iowan Old Style", "Times New Roman", Times,\r\n    serif;\r\n  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono",\r\n    monospace;\r\n}\r\n\r\n@media (prefers-color-scheme: dark) {\r\n  :root:not([data-theme="light"]) {\r\n    --bg: #121416;\r\n    --bg-elev: #1b1e22;\r\n    --fg: #ececec;\r\n    --muted: #a0a6ad;\r\n    --border: #2c3238;\r\n    --accent: #5dcea2;\r\n    --accent-soft: #1a332a;\r\n    --callout: #2a2618;\r\n    --callout-border: #8a7430;\r\n    --code-bg: #23282e;\r\n    --shadow: 0 10px 32px rgba(0, 0, 0, 0.45);\r\n  }\r\n}\r\n\r\n:root[data-theme="dark"] {\r\n  --bg: #121416;\r\n  --bg-elev: #1b1e22;\r\n  --fg: #ececec;\r\n  --muted: #a0a6ad;\r\n  --border: #2c3238;\r\n  --accent: #5dcea2;\r\n  --accent-soft: #1a332a;\r\n  --callout: #2a2618;\r\n  --callout-border: #8a7430;\r\n  --code-bg: #23282e;\r\n  --shadow: 0 10px 32px rgba(0, 0, 0, 0.45);\r\n}\r\n\r\n:root[data-theme="light"] {\r\n  --bg: #f7f5f1;\r\n  --bg-elev: #ffffff;\r\n  --fg: #1a1a1a;\r\n  --muted: #5c5c5c;\r\n  --border: #e2ddd4;\r\n  --accent: #0b6e4f;\r\n  --accent-soft: #d8efe6;\r\n  --callout: #fff8e7;\r\n  --callout-border: #e6c86a;\r\n  --code-bg: #f0ece4;\r\n  --shadow: 0 8px 28px rgba(26, 26, 26, 0.12);\r\n}\r\n\r\n*,\r\n*::before,\r\n*::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\nhtml {\r\n  scroll-behavior: smooth;\r\n  -webkit-text-size-adjust: 100%;\r\n}\r\n\r\nbody {\r\n  margin: 0;\r\n  font-family: var(--ui);\r\n  font-size: var(--fs);\r\n  line-height: var(--lh);\r\n  color: var(--fg);\r\n  background: var(--bg);\r\n  text-rendering: optimizeLegibility;\r\n}\r\n\r\nhtml[data-font="serif"] body,\r\nhtml[data-font="serif"] article#rdoc-content {\r\n  font-family: var(--serif);\r\n}\r\n\r\nhtml[data-font="serif"] .rdoc-bar,\r\nhtml[data-font="serif"] .rdoc-toc,\r\nhtml[data-font="serif"] .rdoc-overlay,\r\nhtml[data-font="serif"] .rdoc-more,\r\nhtml[data-font="serif"] .rdoc-fn-pop {\r\n  font-family: var(--ui);\r\n}\r\n\r\n/* reading progress */\r\n#rdoc-progress {\r\n  position: fixed;\r\n  inset: 0 auto auto 0;\r\n  height: 3px;\r\n  width: 0;\r\n  z-index: 60;\r\n  background: var(--accent);\r\n  pointer-events: none;\r\n}\r\n\r\n/* chrome */\r\n.rdoc-bar {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 40;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 0.4rem;\r\n  padding: 0.55rem var(--pad);\r\n  background: color-mix(in srgb, var(--bg-elev) 92%, transparent);\r\n  backdrop-filter: blur(10px);\r\n  border-bottom: 1px solid var(--border);\r\n  transition: opacity 0.2s ease, transform 0.2s ease;\r\n}\r\n\r\n.rdoc-bar button {\r\n  appearance: none;\r\n  border: 1px solid var(--border);\r\n  background: var(--bg-elev);\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 0.8125rem;\r\n  padding: 0.35rem 0.55rem;\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n  min-height: 2.1rem;\r\n}\r\n\r\n.rdoc-bar button:hover,\r\n.rdoc-bar button:focus-visible,\r\n.rdoc-bar button[aria-pressed="true"] {\r\n  border-color: var(--accent);\r\n  outline: none;\r\n}\r\n\r\n.rdoc-bar button[aria-pressed="true"] {\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n}\r\n\r\n.rdoc-bar .spacer {\r\n  flex: 1;\r\n  min-width: 0.5rem;\r\n}\r\n\r\n.rdoc-title-chip {\r\n  font-size: 0.8125rem;\r\n  color: var(--muted);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  max-width: 28vw;\r\n}\r\n\r\n/* zen / focus mode */\r\nhtml[data-zen="1"] .rdoc-chrome {\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  transition: opacity 0.25s ease;\r\n}\r\n\r\nhtml[data-zen="1"] .rdoc-bar {\r\n  transform: translateY(-100%);\r\n}\r\n\r\nhtml[data-zen="1"].rdoc-zen-reveal .rdoc-chrome {\r\n  opacity: 1;\r\n  pointer-events: auto;\r\n}\r\n\r\nhtml[data-zen="1"].rdoc-zen-reveal .rdoc-bar {\r\n  transform: none;\r\n}\r\n\r\nhtml[data-zen="1"] .rdoc-toc:not(.open),\r\nhtml[data-zen="1"] .rdoc-toc-backdrop:not(.open) {\r\n  opacity: 0;\r\n  pointer-events: none;\r\n}\r\n\r\nhtml[data-zen="1"] #rdoc-progress {\r\n  opacity: 1;\r\n  pointer-events: none;\r\n}\r\n\r\n.rdoc-zen-edge {\r\n  position: fixed;\r\n  z-index: 55;\r\n  pointer-events: none;\r\n}\r\n\r\nhtml[data-zen="1"] .rdoc-zen-edge {\r\n  pointer-events: auto;\r\n}\r\n\r\n.rdoc-zen-edge-top {\r\n  inset: 0 0 auto 0;\r\n  height: 28px;\r\n}\r\n\r\n.rdoc-zen-edge-bottom {\r\n  inset: auto 0 0 0;\r\n  height: 28px;\r\n}\r\n\r\n/* layout */\r\n.rdoc-shell {\r\n  display: grid;\r\n  grid-template-columns: 1fr;\r\n  max-width: calc(var(--measure) + 16rem);\r\n  margin: 0 auto;\r\n}\r\n\r\n.rdoc-toc {\r\n  display: none;\r\n  position: fixed;\r\n  inset: auto 0 0 0;\r\n  z-index: 50;\r\n  max-height: min(70vh, 28rem);\r\n  overflow: auto;\r\n  padding: 1rem var(--pad) 1.25rem;\r\n  background: var(--bg-elev);\r\n  border-top: 1px solid var(--border);\r\n  box-shadow: var(--shadow);\r\n  border-radius: 16px 16px 0 0;\r\n}\r\n\r\n.rdoc-toc.open {\r\n  display: block;\r\n}\r\n\r\n.rdoc-toc h2 {\r\n  margin: 0 0 0.75rem;\r\n  font-size: 0.95rem;\r\n  letter-spacing: 0.02em;\r\n  text-transform: uppercase;\r\n  color: var(--muted);\r\n}\r\n\r\n.rdoc-toc ol {\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n}\r\n\r\n.rdoc-toc a {\r\n  display: block;\r\n  padding: 0.55rem 0.35rem;\r\n  color: var(--fg);\r\n  text-decoration: none;\r\n  border-radius: 6px;\r\n  font-size: 0.95rem;\r\n}\r\n\r\n.rdoc-toc a:hover,\r\n.rdoc-toc a[aria-current="true"] {\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n}\r\n\r\n.rdoc-toc .l2 {\r\n  padding-left: 1rem;\r\n  font-size: 0.875rem;\r\n  color: var(--muted);\r\n}\r\n\r\n.rdoc-toc-backdrop {\r\n  display: none;\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 45;\r\n  background: rgba(0, 0, 0, 0.35);\r\n}\r\n\r\n.rdoc-toc-backdrop.open {\r\n  display: block;\r\n}\r\n\r\n@media (min-width: 960px) {\r\n  .rdoc-shell {\r\n    grid-template-columns: 14rem minmax(0, var(--measure));\r\n    gap: 2rem;\r\n    padding: 0 var(--pad);\r\n  }\r\n\r\n  .rdoc-toc {\r\n    display: block;\r\n    position: sticky;\r\n    top: 3.5rem;\r\n    inset: auto;\r\n    max-height: calc(100vh - 4.5rem);\r\n    align-self: start;\r\n    margin-top: 1.5rem;\r\n    padding: 0.5rem 0.25rem;\r\n    background: transparent;\r\n    border: 0;\r\n    box-shadow: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  .rdoc-toc-backdrop,\r\n  #btn-toc {\r\n    display: none !important;\r\n  }\r\n}\r\n\r\n/* article \u2014 ~65\u201375ch measure via rem + padding */\r\narticle#rdoc-content {\r\n  max-width: var(--measure);\r\n  margin: 0 auto;\r\n  padding: 1.5rem var(--pad) 5rem;\r\n}\r\n\r\narticle#rdoc-content > *:first-child {\r\n  margin-top: 0;\r\n}\r\n\r\nh1,\r\nh2,\r\nh3,\r\nh4 {\r\n  line-height: 1.25;\r\n  letter-spacing: -0.01em;\r\n  scroll-margin-top: 4rem;\r\n}\r\n\r\nh1 {\r\n  font-size: clamp(1.75rem, 5vw, 2.35rem);\r\n  margin: 0 0 0.75rem;\r\n}\r\n\r\nh2 {\r\n  font-size: clamp(1.35rem, 3.5vw, 1.65rem);\r\n  margin: 2.25rem 0 0.75rem;\r\n  padding-top: 0.5rem;\r\n  border-top: 1px solid var(--border);\r\n}\r\n\r\nh3 {\r\n  font-size: 1.15rem;\r\n  margin: 1.75rem 0 0.5rem;\r\n}\r\n\r\np {\r\n  margin: 0 0 1.05rem;\r\n}\r\n\r\na {\r\n  color: var(--accent);\r\n}\r\n\r\nimg,\r\nsvg {\r\n  max-width: 100%;\r\n  height: auto;\r\n  display: block;\r\n  margin: 1.25rem auto;\r\n}\r\n\r\narticle#rdoc-content img {\r\n  cursor: zoom-in;\r\n}\r\n\r\nfigure {\r\n  margin: 1.5rem 0;\r\n}\r\n\r\nfigcaption {\r\n  margin-top: 0.5rem;\r\n  font-size: 0.875rem;\r\n  color: var(--muted);\r\n  text-align: center;\r\n}\r\n\r\nblockquote {\r\n  margin: 1.25rem 0;\r\n  padding: 0.25rem 0 0.25rem 1rem;\r\n  border-left: 3px solid var(--accent);\r\n  color: var(--muted);\r\n}\r\n\r\nblockquote p:last-child {\r\n  margin-bottom: 0;\r\n}\r\n\r\npre {\r\n  overflow-x: auto;\r\n  padding: 1rem;\r\n  margin: 1.25rem 0;\r\n  background: var(--code-bg);\r\n  border: 1px solid var(--border);\r\n  border-radius: var(--radius);\r\n  font-family: var(--mono);\r\n  font-size: 0.875rem;\r\n  line-height: 1.55;\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\ncode {\r\n  font-family: var(--mono);\r\n  font-size: 0.9em;\r\n  background: var(--code-bg);\r\n  padding: 0.12em 0.35em;\r\n  border-radius: 4px;\r\n}\r\n\r\npre code {\r\n  background: none;\r\n  padding: 0;\r\n  font-size: inherit;\r\n}\r\n\r\ntable {\r\n  width: 100%;\r\n  border-collapse: collapse;\r\n  margin: 1.25rem 0;\r\n  font-size: 0.95rem;\r\n  display: block;\r\n  overflow-x: auto;\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\nth,\r\ntd {\r\n  border: 1px solid var(--border);\r\n  padding: 0.55rem 0.7rem;\r\n  text-align: left;\r\n  vertical-align: top;\r\n}\r\n\r\nth {\r\n  background: var(--accent-soft);\r\n}\r\n\r\n/* sticky first column (default on narrow + explicit mode) */\r\n@media (max-width: 720px) {\r\n  html:not([data-table-mode="cards"]) article#rdoc-content table th:first-child,\r\n  html:not([data-table-mode="cards"]) article#rdoc-content table td:first-child {\r\n    position: sticky;\r\n    left: 0;\r\n    z-index: 1;\r\n    background: var(--bg-elev);\r\n    box-shadow: 2px 0 0 var(--border);\r\n  }\r\n\r\n  html:not([data-table-mode="cards"]) article#rdoc-content table th:first-child {\r\n    background: var(--accent-soft);\r\n  }\r\n}\r\n\r\nhtml[data-table-mode="sticky"] article#rdoc-content table th:first-child,\r\nhtml[data-table-mode="sticky"] article#rdoc-content table td:first-child {\r\n  position: sticky;\r\n  left: 0;\r\n  z-index: 1;\r\n  background: var(--bg-elev);\r\n  box-shadow: 2px 0 0 var(--border);\r\n}\r\n\r\nhtml[data-table-mode="sticky"] article#rdoc-content table th:first-child {\r\n  background: var(--accent-soft);\r\n}\r\n\r\n@media (max-width: 720px) {\r\n  html[data-table-mode="cards"] article#rdoc-content table,\r\n  html[data-table-mode="cards"] article#rdoc-content thead,\r\n  html[data-table-mode="cards"] article#rdoc-content tbody,\r\n  html[data-table-mode="cards"] article#rdoc-content th,\r\n  html[data-table-mode="cards"] article#rdoc-content td,\r\n  html[data-table-mode="cards"] article#rdoc-content tr {\r\n    display: block;\r\n  }\r\n\r\n  html[data-table-mode="cards"] article#rdoc-content thead {\r\n    position: absolute;\r\n    width: 1px;\r\n    height: 1px;\r\n    overflow: hidden;\r\n    clip: rect(0 0 0 0);\r\n  }\r\n\r\n  html[data-table-mode="cards"] article#rdoc-content tr {\r\n    margin: 0 0 1rem;\r\n    border: 1px solid var(--border);\r\n    border-radius: var(--radius);\r\n    background: var(--bg-elev);\r\n    overflow: hidden;\r\n  }\r\n\r\n  html[data-table-mode="cards"] article#rdoc-content td {\r\n    border: 0;\r\n    border-bottom: 1px solid var(--border);\r\n    padding: 0.65rem 0.85rem;\r\n  }\r\n\r\n  html[data-table-mode="cards"] article#rdoc-content td:last-child {\r\n    border-bottom: 0;\r\n  }\r\n\r\n  html[data-table-mode="cards"] article#rdoc-content td::before {\r\n    content: attr(data-label);\r\n    display: block;\r\n    font-size: 0.75rem;\r\n    font-weight: 700;\r\n    color: var(--muted);\r\n    text-transform: uppercase;\r\n    letter-spacing: 0.03em;\r\n    margin-bottom: 0.2rem;\r\n  }\r\n}\r\n\r\n.rdoc-callout {\r\n  margin: 1.35rem 0;\r\n  padding: 1rem 1.1rem;\r\n  background: var(--callout);\r\n  border: 1px solid var(--callout-border);\r\n  border-radius: var(--radius);\r\n}\r\n\r\n.rdoc-callout > strong:first-child {\r\n  display: block;\r\n  margin-bottom: 0.35rem;\r\n  color: var(--fg);\r\n}\r\n\r\n.rdoc-formula {\r\n  margin: 1.5rem auto;\r\n  text-align: center;\r\n  overflow-x: auto;\r\n}\r\n\r\nhr {\r\n  border: 0;\r\n  border-top: 1px solid var(--border);\r\n  margin: 2rem 0;\r\n}\r\n\r\n/* footnotes as large tappable refs + popover */\r\n.rdoc-fn-ref {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: 1.6rem;\r\n  min-height: 1.6rem;\r\n  margin: 0 0.1rem;\r\n  padding: 0 0.35rem;\r\n  border: 0;\r\n  border-radius: 999px;\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n  font: inherit;\r\n  font-size: 0.75rem;\r\n  font-weight: 700;\r\n  vertical-align: super;\r\n  cursor: pointer;\r\n}\r\n\r\n.rdoc-fn-ref:focus-visible {\r\n  outline: 2px solid var(--accent);\r\n  outline-offset: 2px;\r\n}\r\n\r\n.rdoc-fn-pop {\r\n  position: fixed;\r\n  z-index: 70;\r\n  left: var(--pad);\r\n  right: var(--pad);\r\n  bottom: 1rem;\r\n  max-width: 28rem;\r\n  margin: 0 auto;\r\n  padding: 1rem 1.1rem;\r\n  background: var(--bg-elev);\r\n  color: var(--fg);\r\n  border: 1px solid var(--border);\r\n  border-radius: 12px;\r\n  box-shadow: var(--shadow);\r\n}\r\n\r\n.rdoc-fn-pop[hidden] {\r\n  display: none;\r\n}\r\n\r\n.rdoc-fn-pop header {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 0.5rem;\r\n  margin-bottom: 0.5rem;\r\n  font-size: 0.8rem;\r\n  color: var(--muted);\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.04em;\r\n}\r\n\r\n.rdoc-fn-pop button {\r\n  appearance: none;\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 1.25rem;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  padding: 0.25rem;\r\n}\r\n\r\n.rdoc-meta {\r\n  margin: 0 0 1.5rem;\r\n  color: var(--muted);\r\n  font-size: 0.9rem;\r\n}\r\n\r\n/* reading ruler */\r\n.rdoc-ruler {\r\n  position: fixed;\r\n  left: 0;\r\n  right: 0;\r\n  height: 1.35em;\r\n  z-index: 30;\r\n  pointer-events: none;\r\n  background: color-mix(in srgb, var(--accent) 18%, transparent);\r\n  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent);\r\n  transform: translateY(-50%);\r\n  display: none;\r\n}\r\n\r\nhtml[data-ruler="1"] .rdoc-ruler {\r\n  display: block;\r\n}\r\n\r\n/* overlays: find, help, more, lightbox */\r\n.rdoc-overlay {\r\n  position: fixed;\r\n  z-index: 80;\r\n  background: var(--bg-elev);\r\n  color: var(--fg);\r\n  border: 1px solid var(--border);\r\n  border-radius: 12px;\r\n  box-shadow: var(--shadow);\r\n  padding: 0.85rem 1rem;\r\n}\r\n\r\n.rdoc-overlay[hidden] {\r\n  display: none;\r\n}\r\n\r\n.rdoc-find {\r\n  top: 3.5rem;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  width: min(28rem, calc(100% - 2 * var(--pad)));\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 0.4rem;\r\n  align-items: center;\r\n}\r\n\r\n.rdoc-find input {\r\n  flex: 1 1 10rem;\r\n  min-width: 0;\r\n  font: inherit;\r\n  padding: 0.4rem 0.55rem;\r\n  border: 1px solid var(--border);\r\n  border-radius: 8px;\r\n  background: var(--bg);\r\n  color: var(--fg);\r\n}\r\n\r\n.rdoc-find button {\r\n  appearance: none;\r\n  border: 1px solid var(--border);\r\n  background: var(--bg);\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 0.8125rem;\r\n  padding: 0.35rem 0.55rem;\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n}\r\n\r\n.rdoc-find .rdoc-find-count {\r\n  font-size: 0.8rem;\r\n  color: var(--muted);\r\n  min-width: 4rem;\r\n}\r\n\r\nmark.rdoc-hl {\r\n  background: color-mix(in srgb, var(--accent) 35%, #ffe066);\r\n  color: inherit;\r\n  padding: 0 0.05em;\r\n  border-radius: 2px;\r\n}\r\n\r\nmark.rdoc-hl.rdoc-hl-cur {\r\n  outline: 2px solid var(--accent);\r\n  background: color-mix(in srgb, var(--accent) 45%, #ffd24d);\r\n}\r\n\r\n.rdoc-help,\r\n.rdoc-more {\r\n  top: 50%;\r\n  left: 50%;\r\n  transform: translate(-50%, -50%);\r\n  width: min(24rem, calc(100% - 2 * var(--pad)));\r\n  max-height: min(80vh, 32rem);\r\n  overflow: auto;\r\n}\r\n\r\n.rdoc-help h2,\r\n.rdoc-more h2 {\r\n  margin: 0 0 0.75rem;\r\n  font-size: 1rem;\r\n}\r\n\r\n.rdoc-help dl {\r\n  margin: 0;\r\n  display: grid;\r\n  grid-template-columns: auto 1fr;\r\n  gap: 0.35rem 0.85rem;\r\n  font-size: 0.9rem;\r\n}\r\n\r\n.rdoc-help dt {\r\n  font-family: var(--mono);\r\n  font-size: 0.8rem;\r\n  color: var(--accent);\r\n}\r\n\r\n.rdoc-help dd {\r\n  margin: 0;\r\n  color: var(--muted);\r\n}\r\n\r\n.rdoc-more .rdoc-more-row {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 0.4rem;\r\n  margin-bottom: 0.75rem;\r\n}\r\n\r\n.rdoc-more button {\r\n  appearance: none;\r\n  border: 1px solid var(--border);\r\n  background: var(--bg);\r\n  color: var(--fg);\r\n  font: inherit;\r\n  font-size: 0.8125rem;\r\n  padding: 0.4rem 0.65rem;\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n}\r\n\r\n.rdoc-more button[aria-pressed="true"] {\r\n  border-color: var(--accent);\r\n  background: var(--accent-soft);\r\n  color: var(--accent);\r\n}\r\n\r\n.rdoc-backdrop-ui {\r\n  display: none;\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 75;\r\n  background: rgba(0, 0, 0, 0.4);\r\n}\r\n\r\n.rdoc-backdrop-ui.open {\r\n  display: block;\r\n}\r\n\r\n.rdoc-lightbox {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 90;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: var(--pad);\r\n  background: rgba(0, 0, 0, 0.82);\r\n  cursor: zoom-out;\r\n}\r\n\r\n.rdoc-lightbox[hidden] {\r\n  display: none;\r\n}\r\n\r\n.rdoc-lightbox img {\r\n  max-width: min(96vw, 1200px);\r\n  max-height: 92vh;\r\n  margin: 0;\r\n  cursor: default;\r\n  box-shadow: var(--shadow);\r\n}\r\n\r\n.rdoc-toast {\r\n  position: fixed;\r\n  z-index: 95;\r\n  bottom: 1.25rem;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  padding: 0.5rem 0.9rem;\r\n  background: var(--bg-elev);\r\n  border: 1px solid var(--border);\r\n  border-radius: 8px;\r\n  box-shadow: var(--shadow);\r\n  font-size: 0.85rem;\r\n  pointer-events: none;\r\n}\r\n\r\n.rdoc-toast[hidden] {\r\n  display: none;\r\n}\r\n\r\n/* print presets \u2014 density via data-print-preset; @page size set by runtime */\r\n@page {\r\n  margin: 1.2cm;\r\n}\r\n\r\n@media print {\r\n  :root {\r\n    --bg: #fff;\r\n    --fg: #000;\r\n    --muted: #333;\r\n    --border: #ccc;\r\n    --accent: #000;\r\n    --code-bg: #f5f5f5;\r\n  }\r\n\r\n  html[data-print-preset="a4"],\r\n  html[data-print-preset="letter"] {\r\n    --fs: 11pt;\r\n    --lh: 1.45;\r\n  }\r\n\r\n  html[data-print-preset="compact"] {\r\n    --fs: 9.5pt;\r\n    --lh: 1.35;\r\n  }\r\n\r\n  .rdoc-chrome,\r\n  #rdoc-progress,\r\n  .rdoc-bar,\r\n  .rdoc-toc,\r\n  .rdoc-toc-backdrop,\r\n  .rdoc-fn-pop,\r\n  .rdoc-shell > nav,\r\n  .rdoc-overlay,\r\n  .rdoc-backdrop-ui,\r\n  .rdoc-lightbox,\r\n  .rdoc-ruler,\r\n  .rdoc-zen-edge,\r\n  .rdoc-toast,\r\n  mark.rdoc-hl {\r\n    display: none !important;\r\n  }\r\n\r\n  .rdoc-shell {\r\n    display: block !important;\r\n    max-width: none !important;\r\n    margin: 0 !important;\r\n    padding: 0 !important;\r\n    grid-template-columns: none !important;\r\n  }\r\n\r\n  article#rdoc-content {\r\n    max-width: none !important;\r\n    width: 100% !important;\r\n    margin: 0 !important;\r\n    padding: 0 !important;\r\n  }\r\n\r\n  a {\r\n    color: inherit;\r\n    text-decoration: none;\r\n  }\r\n\r\n  pre,\r\n  table,\r\n  .rdoc-callout,\r\n  figure {\r\n    break-inside: avoid;\r\n  }\r\n\r\n  html[data-print-preset="compact"] h2 {\r\n    margin-top: 1rem;\r\n    padding-top: 0.25rem;\r\n  }\r\n\r\n  html[data-print-preset="compact"] p {\r\n    margin-bottom: 0.65rem;\r\n  }\r\n}\r\n';
var READER_JS = `/*! rdoc runtime \u2014 TOC, theme, serif, zen, find, TTS, lightbox, print */\r
(function () {\r
  var root = document.documentElement;\r
  var article = document.getElementById("rdoc-content");\r
  var progress = document.getElementById("rdoc-progress");\r
  var toc = document.getElementById("rdoc-toc");\r
  var backdrop = document.getElementById("rdoc-toc-backdrop");\r
  var tocList = document.getElementById("rdoc-toc-list");\r
  var pop = document.getElementById("rdoc-fn-pop");\r
  var popBody = document.getElementById("rdoc-fn-body");\r
  var fs = parseFloat(localStorage.getItem("rdoc-fs") || "1.0625");\r
  var printPresets = ["a4", "letter", "compact"];\r
  var printLabels = { a4: "A4", letter: "Letter", compact: "Compact" };\r
  var findMarks = [];\r
  var findIdx = -1;\r
  var toastTimer;\r
\r
  var manifest = {};\r
  try {\r
    var mEl = document.getElementById("rdoc-manifest");\r
    if (mEl) manifest = JSON.parse(mEl.textContent || "{}");\r
  } catch (e) {}\r
  var contentHash = manifest.contentHash || "anon";\r
  var scrollKey = "rdoc-scroll-" + contentHash;\r
\r
  function $(id) {\r
    return document.getElementById(id);\r
  }\r
\r
  function toast(msg) {\r
    var t = $("rdoc-toast");\r
    if (!t) {\r
      t = document.createElement("div");\r
      t.id = "rdoc-toast";\r
      t.className = "rdoc-toast rdoc-chrome";\r
      document.body.appendChild(t);\r
    }\r
    t.textContent = msg;\r
    t.hidden = false;\r
    clearTimeout(toastTimer);\r
    toastTimer = setTimeout(function () {\r
      t.hidden = true;\r
    }, 1600);\r
  }\r
\r
  function safeColor(c) {\r
    if (!c || typeof c !== "string") return null;\r
    c = c.trim();\r
    if (/[;{}]|url\\s*\\(/i.test(c)) return null;\r
    if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;\r
    if (/^[a-zA-Z]{3,20}$/.test(c)) return c;\r
    if (/^rgba?\\(\\s*[\\d.\\s%,./]+\\)$/.test(c)) return c;\r
    if (/^hsla?\\(\\s*[\\d.\\s%,./\xB0]+\\)$/.test(c)) return c;\r
    return null;\r
  }\r
\r
  var accent = safeColor(manifest.themeAccent);\r
  if (accent) {\r
    root.style.setProperty("--accent", accent);\r
    root.style.setProperty(\r
      "--accent-soft",\r
      "color-mix(in srgb, " + accent + " 22%, var(--bg-elev))",\r
    );\r
  }\r
\r
  function applyFs() {\r
    root.style.setProperty("--fs", fs + "rem");\r
    localStorage.setItem("rdoc-fs", String(fs));\r
  }\r
  applyFs();\r
\r
  function setTheme(mode) {\r
    if (mode === "system") root.removeAttribute("data-theme");\r
    else root.setAttribute("data-theme", mode);\r
    localStorage.setItem("rdoc-theme", mode);\r
  }\r
  setTheme(localStorage.getItem("rdoc-theme") || "system");\r
\r
  function setSerif(on) {\r
    if (on) root.setAttribute("data-font", "serif");\r
    else root.removeAttribute("data-font");\r
    localStorage.setItem("rdoc-serif", on ? "1" : "0");\r
    var b = $("btn-serif");\r
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");\r
  }\r
  setSerif(localStorage.getItem("rdoc-serif") === "1");\r
\r
  function setZen(on) {\r
    if (on) root.setAttribute("data-zen", "1");\r
    else {\r
      root.removeAttribute("data-zen");\r
      root.classList.remove("rdoc-zen-reveal");\r
    }\r
    localStorage.setItem("rdoc-zen", on ? "1" : "0");\r
    var b = $("btn-zen");\r
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");\r
  }\r
\r
  function setRuler(on) {\r
    if (on) root.setAttribute("data-ruler", "1");\r
    else root.removeAttribute("data-ruler");\r
    localStorage.setItem("rdoc-ruler", on ? "1" : "0");\r
    var b = $("btn-ruler");\r
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");\r
  }\r
\r
  function setTableMode(mode) {\r
    root.setAttribute("data-table-mode", mode);\r
    localStorage.setItem("rdoc-tables", mode);\r
    var b = $("btn-tables");\r
    if (b) b.setAttribute("aria-pressed", mode === "cards" ? "true" : "false");\r
  }\r
\r
  function applyPrintPreset(p) {\r
    if (printPresets.indexOf(p) < 0) p = "a4";\r
    root.setAttribute("data-print-preset", p);\r
    localStorage.setItem("rdoc-print", p);\r
    var btn = $("btn-print-preset");\r
    if (btn) btn.textContent = printLabels[p] || p;\r
    var st = $("rdoc-print-page");\r
    if (!st) {\r
      st = document.createElement("style");\r
      st.id = "rdoc-print-page";\r
      document.head.appendChild(st);\r
    }\r
    var size = p === "letter" ? "letter" : "A4";\r
    var margin =\r
      p === "compact" ? "0.8cm" : p === "letter" ? "0.75in" : "1.4cm";\r
    st.textContent = "@page{size:" + size + ";margin:" + margin + "}";\r
  }\r
  applyPrintPreset(localStorage.getItem("rdoc-print") || "a4");\r
\r
  function slugify(text) {\r
    return text\r
      .toLowerCase()\r
      .trim()\r
      .replace(/[^\\w\\u0400-\\u04FF\\s-]/g, "")\r
      .replace(/\\s+/g, "-");\r
  }\r
\r
  function buildToc() {\r
    if (!article || !tocList) return;\r
    var heads = article.querySelectorAll("h2, h3");\r
    var html = "";\r
    for (var i = 0; i < heads.length; i++) {\r
      var h = heads[i];\r
      if (!h.id) h.id = slugify(h.textContent || "section-" + i);\r
      var cls = h.tagName === "H3" ? ' class="l2"' : "";\r
      html +=\r
        "<li" +\r
        cls +\r
        '><a href="#' +\r
        h.id +\r
        '">' +\r
        (h.textContent || "") +\r
        "</a></li>";\r
    }\r
    tocList.innerHTML = html || "<li><em>No headings</em></li>";\r
  }\r
  buildToc();\r
\r
  function prepTables() {\r
    if (!article) return;\r
    var tables = article.querySelectorAll("table");\r
    for (var t = 0; t < tables.length; t++) {\r
      var table = tables[t];\r
      var headers = [];\r
      var ths = table.querySelectorAll("thead th");\r
      if (!ths.length) ths = table.querySelectorAll("tr:first-child th, tr:first-child td");\r
      for (var i = 0; i < ths.length; i++) headers.push((ths[i].textContent || "").trim());\r
      var rows = table.querySelectorAll("tbody tr");\r
      if (!rows.length) rows = table.querySelectorAll("tr");\r
      for (var r = 0; r < rows.length; r++) {\r
        var cells = rows[r].querySelectorAll("td");\r
        for (var c = 0; c < cells.length; c++) {\r
          if (!cells[c].getAttribute("data-label") && headers[c])\r
            cells[c].setAttribute("data-label", headers[c]);\r
        }\r
      }\r
    }\r
  }\r
  prepTables();\r
  setTableMode(localStorage.getItem("rdoc-tables") || "sticky");\r
\r
  var scrollSaveTimer;\r
  function onScroll() {\r
    if (!progress || !article) return;\r
    var rect = article.getBoundingClientRect();\r
    var total = article.scrollHeight - window.innerHeight;\r
    var scrolled = Math.min(Math.max(-rect.top, 0), total || 1);\r
    var pct = total > 0 ? (scrolled / total) * 100 : 100;\r
    progress.style.width = pct + "%";\r
\r
    clearTimeout(scrollSaveTimer);\r
    scrollSaveTimer = setTimeout(function () {\r
      try {\r
        localStorage.setItem(scrollKey, String(window.scrollY | 0));\r
      } catch (e) {}\r
    }, 200);\r
\r
    if (!tocList) return;\r
    var links = tocList.querySelectorAll("a");\r
    var current = null;\r
    var heads = article.querySelectorAll("h2, h3");\r
    for (var i = 0; i < heads.length; i++) {\r
      if (heads[i].getBoundingClientRect().top <= 96) current = heads[i].id;\r
    }\r
    for (var j = 0; j < links.length; j++) {\r
      var a = links[j];\r
      if (a.getAttribute("href") === "#" + current)\r
        a.setAttribute("aria-current", "true");\r
      else a.removeAttribute("aria-current");\r
    }\r
  }\r
  window.addEventListener("scroll", onScroll, { passive: true });\r
  onScroll();\r
\r
  try {\r
    var savedY = parseInt(localStorage.getItem(scrollKey) || "0", 10);\r
    if (savedY > 0) {\r
      requestAnimationFrame(function () {\r
        window.scrollTo(0, savedY);\r
      });\r
    }\r
  } catch (e) {}\r
\r
  function openToc(open) {\r
    if (!toc || !backdrop) return;\r
    toc.classList.toggle("open", open);\r
    backdrop.classList.toggle("open", open);\r
  }\r
\r
  $("btn-toc")?.addEventListener("click", function () {\r
    openToc(!toc.classList.contains("open"));\r
  });\r
  backdrop?.addEventListener("click", function () {\r
    openToc(false);\r
  });\r
  tocList?.addEventListener("click", function (e) {\r
    if (e.target && e.target.tagName === "A") openToc(false);\r
  });\r
\r
  function bumpFs(dir) {\r
    fs = Math.min(1.5, Math.max(0.875, +(fs + dir * 0.0625).toFixed(4)));\r
    applyFs();\r
  }\r
  $("btn-fs-up")?.addEventListener("click", function () {\r
    bumpFs(1);\r
  });\r
  $("btn-fs-dn")?.addEventListener("click", function () {\r
    bumpFs(-1);\r
  });\r
  $("btn-theme")?.addEventListener("click", function () {\r
    var cur = localStorage.getItem("rdoc-theme") || "system";\r
    setTheme(cur === "system" ? "dark" : cur === "dark" ? "light" : "system");\r
  });\r
  $("btn-serif")?.addEventListener("click", function () {\r
    setSerif(root.getAttribute("data-font") !== "serif");\r
  });\r
  $("btn-print-preset")?.addEventListener("click", function () {\r
    var cur = root.getAttribute("data-print-preset") || "a4";\r
    var i = printPresets.indexOf(cur);\r
    applyPrintPreset(printPresets[(i + 1) % printPresets.length]);\r
    toast("Print: " + printLabels[root.getAttribute("data-print-preset")]);\r
  });\r
  $("btn-print")?.addEventListener("click", function () {\r
    window.print();\r
  });\r
\r
  function copyText(text, okMsg) {\r
    function done() {\r
      toast(okMsg || "Copied");\r
    }\r
    if (navigator.clipboard && navigator.clipboard.writeText) {\r
      navigator.clipboard.writeText(text).then(done).catch(function () {\r
        fallback();\r
      });\r
    } else fallback();\r
    function fallback() {\r
      var ta = document.createElement("textarea");\r
      ta.value = text;\r
      document.body.appendChild(ta);\r
      ta.select();\r
      try {\r
        document.execCommand("copy");\r
        done();\r
      } catch (e) {\r
        toast("Copy failed");\r
      }\r
      document.body.removeChild(ta);\r
    }\r
  }\r
\r
  $("btn-copy")?.addEventListener("click", function () {\r
    copyText(article ? article.innerText : "", "Plain text copied");\r
  });\r
  $("btn-cite")?.addEventListener("click", function () {\r
    var parts = [\r
      manifest.title || document.title,\r
      manifest.author,\r
      manifest.created ? String(manifest.created).slice(0, 10) : "",\r
      manifest.canonicalUrl || "",\r
    ].filter(Boolean);\r
    copyText(parts.join(". "), "Citation copied");\r
  });\r
\r
  /* UI scaffold: ruler, zen edges, overlays, lightbox */\r
  var ruler = document.createElement("div");\r
  ruler.className = "rdoc-ruler rdoc-chrome";\r
  ruler.setAttribute("aria-hidden", "true");\r
  document.body.appendChild(ruler);\r
\r
  var edgeTop = document.createElement("div");\r
  edgeTop.className = "rdoc-zen-edge rdoc-zen-edge-top";\r
  var edgeBot = document.createElement("div");\r
  edgeBot.className = "rdoc-zen-edge rdoc-zen-edge-bottom";\r
  document.body.appendChild(edgeTop);\r
  document.body.appendChild(edgeBot);\r
\r
  function revealZen(on) {\r
    root.classList.toggle("rdoc-zen-reveal", !!on);\r
  }\r
  edgeTop.addEventListener("mouseenter", function () {\r
    revealZen(true);\r
  });\r
  edgeBot.addEventListener("mouseenter", function () {\r
    revealZen(true);\r
  });\r
  document.querySelector(".rdoc-bar")?.addEventListener("mouseleave", function () {\r
    if (root.getAttribute("data-zen") === "1") revealZen(false);\r
  });\r
\r
  var uiBackdrop = document.createElement("div");\r
  uiBackdrop.className = "rdoc-backdrop-ui rdoc-chrome";\r
  uiBackdrop.id = "rdoc-ui-backdrop";\r
  document.body.appendChild(uiBackdrop);\r
\r
  var findBox = document.createElement("div");\r
  findBox.className = "rdoc-overlay rdoc-find rdoc-chrome";\r
  findBox.id = "rdoc-find";\r
  findBox.hidden = true;\r
  findBox.innerHTML =\r
    '<input type="search" id="rdoc-find-input" placeholder="Find in document\u2026" autocomplete="off">' +\r
    '<span class="rdoc-find-count" id="rdoc-find-count"></span>' +\r
    '<button type="button" id="rdoc-find-prev" title="Previous">\u2191</button>' +\r
    '<button type="button" id="rdoc-find-next" title="Next">\u2193</button>' +\r
    '<button type="button" id="rdoc-find-close" title="Close">\xD7</button>';\r
  document.body.appendChild(findBox);\r
\r
  var helpBox = document.createElement("div");\r
  helpBox.className = "rdoc-overlay rdoc-help rdoc-chrome";\r
  helpBox.id = "rdoc-help";\r
  helpBox.hidden = true;\r
  helpBox.setAttribute("role", "dialog");\r
  helpBox.innerHTML =\r
    "<h2>Keyboard shortcuts</h2><dl>" +\r
    "<dt>t</dt><dd>Toggle table of contents</dd>" +\r
    "<dt>+ / =</dt><dd>Larger font</dd>" +\r
    "<dt>-</dt><dd>Smaller font</dd>" +\r
    "<dt>d</dt><dd>Cycle theme</dd>" +\r
    "<dt>s</dt><dd>Toggle serif font</dd>" +\r
    "<dt>z</dt><dd>Zen / focus mode</dd>" +\r
    "<dt>?</dt><dd>This help</dd>" +\r
    "<dt>Ctrl/Cmd+F</dt><dd>Find in document</dd>" +\r
    "<dt>Esc</dt><dd>Close overlays / exit zen</dd>" +\r
    "</dl><p style=\\"margin:.75rem 0 0;font-size:.8rem;color:var(--muted)\\">Browser Find (Edit menu) still works.</p>";\r
  document.body.appendChild(helpBox);\r
\r
  var moreBox = document.createElement("div");\r
  moreBox.className = "rdoc-overlay rdoc-more rdoc-chrome";\r
  moreBox.id = "rdoc-more";\r
  moreBox.hidden = true;\r
  moreBox.innerHTML =\r
    "<h2>Reading options</h2>" +\r
    '<div class="rdoc-more-row">' +\r
    '<button type="button" id="btn-zen">Zen</button>' +\r
    '<button type="button" id="btn-ruler">Ruler</button>' +\r
    '<button type="button" id="btn-tables">Table cards</button>' +\r
    '<button type="button" id="btn-help">Shortcuts (?)</button>' +\r
    "</div>" +\r
    '<div class="rdoc-more-row">' +\r
    '<button type="button" id="btn-tts">Speak</button>' +\r
    '<button type="button" id="btn-tts-stop">Stop TTS</button>' +\r
    "</div>";\r
  document.body.appendChild(moreBox);\r
\r
  var lightbox = document.createElement("div");\r
  lightbox.className = "rdoc-lightbox rdoc-chrome";\r
  lightbox.id = "rdoc-lightbox";\r
  lightbox.hidden = true;\r
  lightbox.setAttribute("role", "dialog");\r
  lightbox.innerHTML = "<img alt=\\"\\">";\r
  document.body.appendChild(lightbox);\r
\r
  function setUiOpen(which) {\r
    var map = { find: findBox, help: helpBox, more: moreBox };\r
    for (var k in map) {\r
      if (map[k]) map[k].hidden = k !== which;\r
    }\r
    uiBackdrop.classList.toggle("open", !!which);\r
    if (which === "find") {\r
      var inp = $("rdoc-find-input");\r
      if (inp) setTimeout(function () {\r
        inp.focus();\r
        inp.select();\r
      }, 0);\r
    }\r
  }\r
\r
  function closeUi() {\r
    setUiOpen(null);\r
    clearFind();\r
  }\r
\r
  uiBackdrop.addEventListener("click", closeUi);\r
\r
  $("btn-more")?.addEventListener("click", function () {\r
    if (!moreBox.hidden) closeUi();\r
    else setUiOpen("more");\r
  });\r
  $("btn-help")?.addEventListener("click", function () {\r
    setUiOpen("help");\r
  });\r
\r
  setZen(localStorage.getItem("rdoc-zen") === "1");\r
  setRuler(localStorage.getItem("rdoc-ruler") === "1");\r
\r
  $("btn-zen")?.addEventListener("click", function () {\r
    setZen(root.getAttribute("data-zen") !== "1");\r
  });\r
  $("btn-ruler")?.addEventListener("click", function () {\r
    setRuler(root.getAttribute("data-ruler") !== "1");\r
  });\r
  $("btn-tables")?.addEventListener("click", function () {\r
    var cur = root.getAttribute("data-table-mode") || "sticky";\r
    setTableMode(cur === "cards" ? "sticky" : "cards");\r
    toast(cur === "cards" ? "Tables: sticky column" : "Tables: card stack");\r
  });\r
\r
  document.addEventListener(\r
    "mousemove",\r
    function (e) {\r
      if (root.getAttribute("data-ruler") === "1")\r
        ruler.style.top = e.clientY + "px";\r
      if (root.getAttribute("data-zen") === "1") {\r
        if (e.clientY < 40 || e.clientY > window.innerHeight - 40)\r
          revealZen(true);\r
      }\r
    },\r
    { passive: true },\r
  );\r
\r
  /* find */\r
  function clearFind() {\r
    for (var i = 0; i < findMarks.length; i++) {\r
      var m = findMarks[i];\r
      var p = m.parentNode;\r
      if (!p) continue;\r
      p.replaceChild(document.createTextNode(m.textContent || ""), m);\r
      p.normalize();\r
    }\r
    findMarks = [];\r
    findIdx = -1;\r
    var c = $("rdoc-find-count");\r
    if (c) c.textContent = "";\r
  }\r
\r
  function highlightFind(q) {\r
    clearFind();\r
    if (!article || !q) return;\r
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null);\r
    var nodes = [];\r
    while (walker.nextNode()) {\r
      var n = walker.currentNode;\r
      if (!n.nodeValue || !n.nodeValue.trim()) continue;\r
      if (n.parentElement && n.parentElement.closest("script,style")) continue;\r
      nodes.push(n);\r
    }\r
    var lower = q.toLowerCase();\r
    for (var i = 0; i < nodes.length; i++) {\r
      var node = nodes[i];\r
      var text = node.nodeValue;\r
      var idx = text.toLowerCase().indexOf(lower);\r
      if (idx < 0) continue;\r
      var frag = document.createDocumentFragment();\r
      var pos = 0;\r
      while (idx >= 0) {\r
        if (idx > pos) frag.appendChild(document.createTextNode(text.slice(pos, idx)));\r
        var mark = document.createElement("mark");\r
        mark.className = "rdoc-hl";\r
        mark.textContent = text.slice(idx, idx + q.length);\r
        frag.appendChild(mark);\r
        findMarks.push(mark);\r
        pos = idx + q.length;\r
        idx = text.toLowerCase().indexOf(lower, pos);\r
      }\r
      if (pos < text.length)\r
        frag.appendChild(document.createTextNode(text.slice(pos)));\r
      node.parentNode.replaceChild(frag, node);\r
    }\r
    var c = $("rdoc-find-count");\r
    if (c) c.textContent = findMarks.length ? "1/" + findMarks.length : "0";\r
    if (findMarks.length) jumpFind(0);\r
  }\r
\r
  function jumpFind(i) {\r
    if (!findMarks.length) return;\r
    findIdx = ((i % findMarks.length) + findMarks.length) % findMarks.length;\r
    for (var j = 0; j < findMarks.length; j++)\r
      findMarks[j].classList.toggle("rdoc-hl-cur", j === findIdx);\r
    findMarks[findIdx].scrollIntoView({ block: "center", behavior: "smooth" });\r
    var c = $("rdoc-find-count");\r
    if (c) c.textContent = findIdx + 1 + "/" + findMarks.length;\r
  }\r
\r
  var findInput = $("rdoc-find-input");\r
  var findTimer;\r
  findInput?.addEventListener("input", function () {\r
    clearTimeout(findTimer);\r
    findTimer = setTimeout(function () {\r
      highlightFind(findInput.value.trim());\r
    }, 120);\r
  });\r
  $("rdoc-find-next")?.addEventListener("click", function () {\r
    jumpFind(findIdx + 1);\r
  });\r
  $("rdoc-find-prev")?.addEventListener("click", function () {\r
    jumpFind(findIdx - 1);\r
  });\r
  $("rdoc-find-close")?.addEventListener("click", closeUi);\r
  findInput?.addEventListener("keydown", function (e) {\r
    if (e.key === "Enter") {\r
      e.preventDefault();\r
      jumpFind(e.shiftKey ? findIdx - 1 : findIdx + 1);\r
    }\r
  });\r
\r
  /* TTS */\r
  function stopTts() {\r
    if (window.speechSynthesis) window.speechSynthesis.cancel();\r
  }\r
  function speakText(text) {\r
    if (!window.speechSynthesis || !text) {\r
      toast("TTS unavailable");\r
      return;\r
    }\r
    stopTts();\r
    var u = new SpeechSynthesisUtterance(text);\r
    if (manifest.lang) u.lang = manifest.lang;\r
    window.speechSynthesis.speak(u);\r
  }\r
  $("btn-tts")?.addEventListener("click", function () {\r
    var sel = window.getSelection && String(window.getSelection());\r
    if (sel && sel.trim()) {\r
      speakText(sel.trim());\r
      return;\r
    }\r
    if (!article) return;\r
    var h = article.querySelector("h1, h2, h3");\r
    var start = h || article;\r
    var parts = [];\r
    var n = start;\r
    while (n && parts.join(" ").length < 4000) {\r
      if (n.innerText) parts.push(n.innerText);\r
      n = n.nextElementSibling;\r
    }\r
    speakText(parts.join("\\n\\n"));\r
  });\r
  $("btn-tts-stop")?.addEventListener("click", stopTts);\r
\r
  /* lightbox */\r
  function closeLightbox() {\r
    lightbox.hidden = true;\r
    lightbox.querySelector("img").removeAttribute("src");\r
  }\r
  article?.addEventListener("click", function (e) {\r
    var t = e.target;\r
    if (!t || t.tagName !== "IMG") return;\r
    e.preventDefault();\r
    var img = lightbox.querySelector("img");\r
    img.src = t.currentSrc || t.src;\r
    img.alt = t.alt || "";\r
    lightbox.hidden = false;\r
  });\r
  lightbox.addEventListener("click", function (e) {\r
    if (e.target === lightbox) closeLightbox();\r
  });\r
\r
  function closeFn() {\r
    if (pop) pop.hidden = true;\r
  }\r
  $("rdoc-fn-close")?.addEventListener("click", closeFn);\r
\r
  function typingTarget(el) {\r
    if (!el) return false;\r
    var tag = el.tagName;\r
    return (\r
      tag === "INPUT" ||\r
      tag === "TEXTAREA" ||\r
      tag === "SELECT" ||\r
      el.isContentEditable\r
    );\r
  }\r
\r
  document.addEventListener("keydown", function (e) {\r
    if (e.key === "Escape") {\r
      closeFn();\r
      openToc(false);\r
      closeLightbox();\r
      closeUi();\r
      stopTts();\r
      if (root.getAttribute("data-zen") === "1") setZen(false);\r
      return;\r
    }\r
\r
    if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {\r
      e.preventDefault();\r
      setUiOpen("find");\r
      return;\r
    }\r
\r
    if (typingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;\r
\r
    var k = e.key;\r
    if (k === "t" || k === "T") {\r
      e.preventDefault();\r
      openToc(!toc || !toc.classList.contains("open"));\r
    } else if (k === "+" || k === "=") {\r
      e.preventDefault();\r
      bumpFs(1);\r
    } else if (k === "-" || k === "_") {\r
      e.preventDefault();\r
      bumpFs(-1);\r
    } else if (k === "d" || k === "D") {\r
      e.preventDefault();\r
      $("btn-theme")?.click();\r
    } else if (k === "s" || k === "S") {\r
      e.preventDefault();\r
      setSerif(root.getAttribute("data-font") !== "serif");\r
    } else if (k === "z" || k === "Z") {\r
      e.preventDefault();\r
      setZen(root.getAttribute("data-zen") !== "1");\r
    } else if (k === "?") {\r
      e.preventDefault();\r
      if (!helpBox.hidden) closeUi();\r
      else setUiOpen("help");\r
    }\r
  });\r
\r
  document.addEventListener("click", function (e) {\r
    var t = e.target;\r
    if (!t || !t.classList || !t.classList.contains("rdoc-fn-ref")) return;\r
    e.preventDefault();\r
    var id = t.getAttribute("data-fn");\r
    var note = id && document.getElementById("fn-" + id);\r
    if (!pop || !popBody || !note) return;\r
    popBody.innerHTML = note.innerHTML;\r
    pop.hidden = false;\r
  });\r
})();\r
`;

// src/export.ts
var RDOC_CSP = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'; img-src data: blob:; script-src 'unsafe-inline'; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'";
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function normalizeForHash(text) {
  const nfc = text.normalize("NFC");
  const lf = nfc.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return lf.trim();
}
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashArticleContent(articleInner) {
  return sha256Hex(normalizeForHash(articleInner));
}
function estimateReading(html) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
var MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif"
};
function mimeFromPath(p) {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? null;
}
function sanitizeRenderedHtml(html) {
  let out = html;
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]+href=["']https?:[^"']+["'][^>]*>/gi, "");
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return out;
}
async function wrapRdocDocument(opts) {
  const created = (/* @__PURE__ */ new Date()).toISOString();
  const bodyHtml = sanitizeRenderedHtml(opts.bodyHtml);
  const { words, minutes } = estimateReading(bodyHtml);
  const articleInner = `<header class="rdoc-meta">
  <div><strong>${escapeHtml(opts.title)}</strong></div>
  <div>${escapeHtml(opts.author)} \xB7 ${escapeHtml(created.slice(0, 10))} \xB7 ~${minutes} \u043C\u0438\u043D \u0447\u0442\u0435\u043D\u0438\u044F</div>
</header>
${bodyHtml}`;
  const contentHash = await hashArticleContent(articleInner);
  const manifest = {
    format: "rdoc",
    version: RDOC_VERSION,
    title: opts.title,
    author: opts.author,
    created,
    lang: opts.lang,
    contentHash,
    readingMinutes: minutes,
    wordCount: words,
    description: opts.description || void 0
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(manifest.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="${RDOC_CSP}">
<meta name="generator" content="rdoc-obsidian ${RDOC_VERSION}">
<meta name="description" content="${escapeHtml(manifest.description ?? "")}">
<title>${escapeHtml(manifest.title)}</title>
<!--
  RDOC \u2014 Responsive Document (self-contained polyglot).
  Exported from Obsidian. Spec: docs/rfc-0001-rdoc.md
-->
<script type="application/rdoc+json" id="rdoc-manifest">
${manifestJson}
<\/script>
<style>
${READER_CSS}
</style>
</head>
<body>
<div id="rdoc-progress" class="rdoc-chrome" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0447\u0442\u0435\u043D\u0438\u044F"></div>
<header class="rdoc-bar rdoc-chrome">
  <button type="button" id="btn-toc" aria-controls="rdoc-toc">\u2630 TOC</button>
  <span class="rdoc-title-chip">${escapeHtml(manifest.title)}</span>
  <span class="spacer"></span>
  <button type="button" id="btn-fs-dn" title="Smaller font">A\u2212</button>
  <button type="button" id="btn-fs-up" title="Larger font">A+</button>
  <button type="button" id="btn-serif" title="Serif reading font">Serif</button>
  <button type="button" id="btn-theme" title="Theme">Theme</button>
  <button type="button" id="btn-copy" title="Copy plain text">Copy</button>
  <button type="button" id="btn-cite" title="Copy citation">Cite</button>
  <button type="button" id="btn-print-preset" title="Print page size">A4</button>
  <button type="button" id="btn-more" title="More options" aria-haspopup="true">\u22EF</button>
  <button type="button" id="btn-print" title="Print / PDF">PDF</button>
</header>
<div class="rdoc-toc-backdrop rdoc-chrome" id="rdoc-toc-backdrop"></div>
<div class="rdoc-shell">
  <nav class="rdoc-toc rdoc-chrome" id="rdoc-toc" aria-label="\u041E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435">
    <h2>\u0421\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435</h2>
    <ol id="rdoc-toc-list"></ol>
  </nav>
  <article id="rdoc-content">
${articleInner}
  </article>
</div>
<aside class="rdoc-fn-pop rdoc-chrome" id="rdoc-fn-pop" hidden role="dialog" aria-label="\u0421\u043D\u043E\u0441\u043A\u0430">
  <header><span>\u0421\u043D\u043E\u0441\u043A\u0430</span><button type="button" id="rdoc-fn-close" aria-label="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">\xD7</button></header>
  <div id="rdoc-fn-body"></div>
</aside>
<script>
${READER_JS}
<\/script>
</body>
</html>
`;
  return { html, manifest };
}

// src/main.ts
var DEFAULT_SETTINGS = {
  author: "Anonymous",
  lang: "ru",
  extension: ".rdoc.html",
  outputFolder: ""
};
var RdocPlugin = class extends import_obsidian.Plugin {
  settings = DEFAULT_SETTINGS;
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
      }
    });
    this.addCommand({
      id: "export-note-to-rdoc-clipboard-path",
      name: "Export current note to .rdoc (show path)",
      callback: () => {
        void this.exportActiveNote(true);
      }
    });
    this.addSettingTab(new RdocSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async exportActiveNote(announcePath = false) {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new import_obsidian.Notice("\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 Markdown-\u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u0434\u043B\u044F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u0432 .rdoc");
      return;
    }
    try {
      new import_obsidian.Notice("\u0421\u0431\u043E\u0440\u043A\u0430 .rdoc\u2026");
      const markdown = await this.app.vault.read(file);
      const title = file.basename || markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "Untitled";
      const bodyHtml = await this.renderNoteHtml(markdown, file.path);
      const inlined = await this.inlineImages(bodyHtml, file.path);
      const { html, manifest } = await wrapRdocDocument({
        title,
        author: this.settings.author,
        lang: this.settings.lang,
        bodyHtml: inlined
      });
      const outName = `${file.basename}${this.settings.extension}`;
      const folder = (this.settings.outputFolder || "").replace(/^\/+|\/+$/g, "");
      const noteDir = file.parent?.path && file.parent.path !== "/" ? file.parent.path : "";
      const outPath = folder ? `${folder}/${outName}` : noteDir ? `${noteDir}/${outName}` : outName;
      if (folder) {
        const parts = folder.split("/");
        let acc = "";
        for (const part of parts) {
          acc = acc ? `${acc}/${part}` : part;
          if (!await this.app.vault.adapter.exists(acc)) {
            await this.app.vault.createFolder(acc);
          }
        }
      }
      const existing = this.app.vault.getAbstractFileByPath(outPath);
      if (existing instanceof import_obsidian.TFile) {
        await this.app.vault.modify(existing, html);
      } else {
        await this.app.vault.create(outPath, html);
      }
      const msg = announcePath ? `\u2713 .rdoc: ${outPath} (${manifest.wordCount} \u0441\u043B\u043E\u0432, SHA ${manifest.contentHash.slice(0, 8)}\u2026)` : `\u2713 \u042D\u043A\u0441\u043F\u043E\u0440\u0442: ${outName}`;
      new import_obsidian.Notice(msg, 6e3);
    } catch (err) {
      console.error(err);
      new import_obsidian.Notice(
        `\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 .rdoc: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  async renderNoteHtml(markdown, sourcePath) {
    const host = document.createElement("div");
    host.style.display = "none";
    document.body.appendChild(host);
    const component = new import_obsidian.Component();
    component.load();
    try {
      await import_obsidian.MarkdownRenderer.render(
        this.app,
        markdown,
        host,
        sourcePath,
        component
      );
      return sanitizeRenderedHtml(host.innerHTML);
    } finally {
      component.unload();
      host.remove();
    }
  }
  async inlineImages(html, sourcePath) {
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
      let linkpath = src;
      try {
        linkpath = decodeURIComponent(src);
      } catch {
      }
      linkpath = linkpath.replace(/^app:\/\/[^/]+\//, "").replace(/^\/+/, "");
      const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) || this.app.vault.getAbstractFileByPath(linkpath);
      if (!(dest instanceof import_obsidian.TFile)) {
        const base = linkpath.split("/").pop() ?? linkpath;
        const alt = this.app.metadataCache.getFirstLinkpathDest(base, sourcePath);
        if (!(alt instanceof import_obsidian.TFile)) {
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
  async applyBinary(img, file) {
    const mime = mimeFromPath(file.path) ?? "application/octet-stream";
    const buf = await this.app.vault.readBinary(file);
    const b64 = arrayBufferToBase64(buf);
    img.setAttribute("src", `data:${mime};base64,${b64}`);
  }
};
var RdocSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "RDOC export" });
    new import_obsidian.Setting(containerEl).setName("Author").setDesc("\u041F\u043E\u043B\u0435 author \u0432 \u043C\u0430\u043D\u0438\u0444\u0435\u0441\u0442\u0435").addText(
      (t) => t.setValue(this.plugin.settings.author).onChange(async (v) => {
        this.plugin.settings.author = v || "Anonymous";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Language").setDesc("BCP-47 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 ru, en)").addText(
      (t) => t.setValue(this.plugin.settings.lang).onChange(async (v) => {
        this.plugin.settings.lang = v || "ru";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Extension").setDesc(".rdoc.html \u2014 \u0431\u0435\u0437 \u0430\u0441\u0441\u043E\u0446\u0438\u0430\u0446\u0438\u0438 \u041E\u0421; .rdoc \u2014 \u043F\u043E\u0441\u043B\u0435 rdoc associate").addDropdown(
      (d) => d.addOption(".rdoc.html", ".rdoc.html").addOption(".rdoc", ".rdoc").setValue(this.plugin.settings.extension).onChange(async (v) => {
        this.plugin.settings.extension = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Output folder").setDesc("\u041F\u0443\u0441\u0442\u043E = \u0440\u044F\u0434\u043E\u043C \u0441 \u0437\u0430\u043C\u0435\u0442\u043A\u043E\u0439; \u0438\u043D\u0430\u0447\u0435 \u043F\u0430\u043F\u043A\u0430 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043A\u043E\u0440\u043D\u044F vault").addText(
      (t) => t.setPlaceholder("exports").setValue(this.plugin.settings.outputFolder).onChange(async (v) => {
        this.plugin.settings.outputFolder = v.trim();
        await this.plugin.saveSettings();
      })
    );
  }
};
