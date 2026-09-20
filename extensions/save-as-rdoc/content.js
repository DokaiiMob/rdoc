/**
 * Content-script extract: article-shaped HTML for RDOC packaging.
 * Injected on demand from the service worker.
 */
(() => {
  const chromeKill =
    "nav, header, footer, aside, script, style, noscript, iframe, object, embed, form, button, input, select, textarea, [role='navigation'], [role='banner'], [role='contentinfo'], .sidebar, .ads, .advertisement, #cookie-banner";

  function pickRoot() {
    const article = document.querySelector("article");
    if (article && article.innerText.trim().length > 200) return article;
    const main = document.querySelector("main");
    if (main && main.innerText.trim().length > 200) return main;
    let best = null;
    let bestScore = 0;
    for (const el of document.querySelectorAll("div, section, article, main")) {
      const text = el.innerText || "";
      const len = text.trim().length;
      if (len < 400) continue;
      const links = el.querySelectorAll("a").length;
      const score = len - links * 40;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best || document.body;
  }

  function sanitize(root) {
    const clone = root.cloneNode(true);
    clone.querySelectorAll(chromeKill).forEach((n) => n.remove());
    clone.querySelectorAll("*").forEach((el) => {
      for (const attr of [...el.attributes]) {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      }
      if (el.tagName === "A") {
        const href = el.getAttribute("href") || "";
        if (href.startsWith("javascript:")) el.removeAttribute("href");
      }
      if (el.tagName === "IMG") {
        const src = el.getAttribute("src") || "";
        if (/^https?:/i.test(src) || src.startsWith("//")) {
          const alt = el.getAttribute("alt") || "image omitted (external)";
          const span = document.createElement("span");
          span.textContent = `[${alt}]`;
          el.replaceWith(span);
        }
      }
    });
    return clone.innerHTML;
  }

  const root = pickRoot();
  const title =
    document.querySelector("h1")?.innerText?.trim() ||
    document.title?.trim() ||
    "Untitled";
  const author =
    document.querySelector('meta[name="author"]')?.content?.trim() ||
    "Anonymous";
  const description =
    document.querySelector('meta[name="description"]')?.content?.trim() ||
    "";
  const lang = (document.documentElement.lang || "en").slice(0, 16);

  return {
    title,
    author,
    description,
    lang,
    canonicalUrl: location.href,
    bodyHtml: sanitize(root),
  };
})();
