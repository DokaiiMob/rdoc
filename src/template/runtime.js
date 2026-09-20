/*! rdoc runtime — TOC, theme, serif, zen, find, TTS, lightbox, print */
(function () {
  var root = document.documentElement;
  var article = document.getElementById("rdoc-content");
  var progress = document.getElementById("rdoc-progress");
  var toc = document.getElementById("rdoc-toc");
  var backdrop = document.getElementById("rdoc-toc-backdrop");
  var tocList = document.getElementById("rdoc-toc-list");
  var pop = document.getElementById("rdoc-fn-pop");
  var popBody = document.getElementById("rdoc-fn-body");
  var fs = parseFloat(localStorage.getItem("rdoc-fs") || "1.0625");
  var printPresets = ["a4", "letter", "compact"];
  var printLabels = { a4: "A4", letter: "Letter", compact: "Compact" };
  var findMarks = [];
  var findIdx = -1;
  var toastTimer;

  var manifest = {};
  try {
    var mEl = document.getElementById("rdoc-manifest");
    if (mEl) manifest = JSON.parse(mEl.textContent || "{}");
  } catch (e) {}
  var contentHash = manifest.contentHash || "anon";
  var scrollKey = "rdoc-scroll-" + contentHash;

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg) {
    var t = $("rdoc-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "rdoc-toast";
      t.className = "rdoc-toast rdoc-chrome";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.hidden = true;
    }, 1600);
  }

  function safeColor(c) {
    if (!c || typeof c !== "string") return null;
    c = c.trim();
    if (/[;{}]|url\s*\(/i.test(c)) return null;
    if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;
    if (/^[a-zA-Z]{3,20}$/.test(c)) return c;
    if (/^rgba?\(\s*[\d.\s%,./]+\)$/.test(c)) return c;
    if (/^hsla?\(\s*[\d.\s%,./°]+\)$/.test(c)) return c;
    return null;
  }

  var accent = safeColor(manifest.themeAccent);
  if (accent) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty(
      "--accent-soft",
      "color-mix(in srgb, " + accent + " 22%, var(--bg-elev))",
    );
  }

  function applyFs() {
    root.style.setProperty("--fs", fs + "rem");
    localStorage.setItem("rdoc-fs", String(fs));
  }
  applyFs();

  function setTheme(mode) {
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    localStorage.setItem("rdoc-theme", mode);
  }
  setTheme(localStorage.getItem("rdoc-theme") || "system");

  function setSerif(on) {
    if (on) root.setAttribute("data-font", "serif");
    else root.removeAttribute("data-font");
    localStorage.setItem("rdoc-serif", on ? "1" : "0");
    var b = $("btn-serif");
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  }
  setSerif(localStorage.getItem("rdoc-serif") === "1");

  function setZen(on) {
    if (on) root.setAttribute("data-zen", "1");
    else {
      root.removeAttribute("data-zen");
      root.classList.remove("rdoc-zen-reveal");
    }
    localStorage.setItem("rdoc-zen", on ? "1" : "0");
    var b = $("btn-zen");
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function setRuler(on) {
    if (on) root.setAttribute("data-ruler", "1");
    else root.removeAttribute("data-ruler");
    localStorage.setItem("rdoc-ruler", on ? "1" : "0");
    var b = $("btn-ruler");
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function setTableMode(mode) {
    root.setAttribute("data-table-mode", mode);
    localStorage.setItem("rdoc-tables", mode);
    var b = $("btn-tables");
    if (b) b.setAttribute("aria-pressed", mode === "cards" ? "true" : "false");
  }

  function applyPrintPreset(p) {
    if (printPresets.indexOf(p) < 0) p = "a4";
    root.setAttribute("data-print-preset", p);
    localStorage.setItem("rdoc-print", p);
    var btn = $("btn-print-preset");
    if (btn) btn.textContent = printLabels[p] || p;
    var st = $("rdoc-print-page");
    if (!st) {
      st = document.createElement("style");
      st.id = "rdoc-print-page";
      document.head.appendChild(st);
    }
    var size = p === "letter" ? "letter" : "A4";
    var margin =
      p === "compact" ? "0.8cm" : p === "letter" ? "0.75in" : "1.4cm";
    st.textContent = "@page{size:" + size + ";margin:" + margin + "}";
  }
  applyPrintPreset(localStorage.getItem("rdoc-print") || "a4");

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0400-\u04FF\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function buildToc() {
    if (!article || !tocList) return;
    var heads = article.querySelectorAll("h2, h3");
    var html = "";
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      if (!h.id) h.id = slugify(h.textContent || "section-" + i);
      var cls = h.tagName === "H3" ? ' class="l2"' : "";
      html +=
        "<li" +
        cls +
        '><a href="#' +
        h.id +
        '">' +
        (h.textContent || "") +
        "</a></li>";
    }
    tocList.innerHTML = html || "<li><em>No headings</em></li>";
  }
  buildToc();

  function prepTables() {
    if (!article) return;
    var tables = article.querySelectorAll("table");
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var headers = [];
      var ths = table.querySelectorAll("thead th");
      if (!ths.length) ths = table.querySelectorAll("tr:first-child th, tr:first-child td");
      for (var i = 0; i < ths.length; i++) headers.push((ths[i].textContent || "").trim());
      var rows = table.querySelectorAll("tbody tr");
      if (!rows.length) rows = table.querySelectorAll("tr");
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll("td");
        for (var c = 0; c < cells.length; c++) {
          if (!cells[c].getAttribute("data-label") && headers[c])
            cells[c].setAttribute("data-label", headers[c]);
        }
      }
    }
  }
  prepTables();
  setTableMode(localStorage.getItem("rdoc-tables") || "sticky");

  var scrollSaveTimer;
  function onScroll() {
    if (!progress || !article) return;
    var rect = article.getBoundingClientRect();
    var total = article.scrollHeight - window.innerHeight;
    var scrolled = Math.min(Math.max(-rect.top, 0), total || 1);
    var pct = total > 0 ? (scrolled / total) * 100 : 100;
    progress.style.width = pct + "%";

    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(function () {
      try {
        localStorage.setItem(scrollKey, String(window.scrollY | 0));
      } catch (e) {}
    }, 200);

    if (!tocList) return;
    var links = tocList.querySelectorAll("a");
    var current = null;
    var heads = article.querySelectorAll("h2, h3");
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top <= 96) current = heads[i].id;
    }
    for (var j = 0; j < links.length; j++) {
      var a = links[j];
      if (a.getAttribute("href") === "#" + current)
        a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  try {
    var savedY = parseInt(localStorage.getItem(scrollKey) || "0", 10);
    if (savedY > 0) {
      requestAnimationFrame(function () {
        window.scrollTo(0, savedY);
      });
    }
  } catch (e) {}

  function openToc(open) {
    if (!toc || !backdrop) return;
    toc.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
  }

  $("btn-toc")?.addEventListener("click", function () {
    openToc(!toc.classList.contains("open"));
  });
  backdrop?.addEventListener("click", function () {
    openToc(false);
  });
  tocList?.addEventListener("click", function (e) {
    if (e.target && e.target.tagName === "A") openToc(false);
  });

  function bumpFs(dir) {
    fs = Math.min(1.5, Math.max(0.875, +(fs + dir * 0.0625).toFixed(4)));
    applyFs();
  }
  $("btn-fs-up")?.addEventListener("click", function () {
    bumpFs(1);
  });
  $("btn-fs-dn")?.addEventListener("click", function () {
    bumpFs(-1);
  });
  $("btn-theme")?.addEventListener("click", function () {
    var cur = localStorage.getItem("rdoc-theme") || "system";
    setTheme(cur === "system" ? "dark" : cur === "dark" ? "light" : "system");
  });
  $("btn-serif")?.addEventListener("click", function () {
    setSerif(root.getAttribute("data-font") !== "serif");
  });
  $("btn-print-preset")?.addEventListener("click", function () {
    var cur = root.getAttribute("data-print-preset") || "a4";
    var i = printPresets.indexOf(cur);
    applyPrintPreset(printPresets[(i + 1) % printPresets.length]);
    toast("Print: " + printLabels[root.getAttribute("data-print-preset")]);
  });
  $("btn-print")?.addEventListener("click", function () {
    window.print();
  });

  function copyText(text, okMsg) {
    function done() {
      toast(okMsg || "Copied");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallback();
      });
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        toast("Copy failed");
      }
      document.body.removeChild(ta);
    }
  }

  $("btn-copy")?.addEventListener("click", function () {
    copyText(article ? article.innerText : "", "Plain text copied");
  });
  $("btn-cite")?.addEventListener("click", function () {
    var parts = [
      manifest.title || document.title,
      manifest.author,
      manifest.created ? String(manifest.created).slice(0, 10) : "",
      manifest.canonicalUrl || "",
    ].filter(Boolean);
    copyText(parts.join(". "), "Citation copied");
  });

  /* UI scaffold: ruler, zen edges, overlays, lightbox */
  var ruler = document.createElement("div");
  ruler.className = "rdoc-ruler rdoc-chrome";
  ruler.setAttribute("aria-hidden", "true");
  document.body.appendChild(ruler);

  var edgeTop = document.createElement("div");
  edgeTop.className = "rdoc-zen-edge rdoc-zen-edge-top";
  var edgeBot = document.createElement("div");
  edgeBot.className = "rdoc-zen-edge rdoc-zen-edge-bottom";
  document.body.appendChild(edgeTop);
  document.body.appendChild(edgeBot);

  function revealZen(on) {
    root.classList.toggle("rdoc-zen-reveal", !!on);
  }
  edgeTop.addEventListener("mouseenter", function () {
    revealZen(true);
  });
  edgeBot.addEventListener("mouseenter", function () {
    revealZen(true);
  });
  document.querySelector(".rdoc-bar")?.addEventListener("mouseleave", function () {
    if (root.getAttribute("data-zen") === "1") revealZen(false);
  });

  var uiBackdrop = document.createElement("div");
  uiBackdrop.className = "rdoc-backdrop-ui rdoc-chrome";
  uiBackdrop.id = "rdoc-ui-backdrop";
  document.body.appendChild(uiBackdrop);

  var findBox = document.createElement("div");
  findBox.className = "rdoc-overlay rdoc-find rdoc-chrome";
  findBox.id = "rdoc-find";
  findBox.hidden = true;
  findBox.innerHTML =
    '<input type="search" id="rdoc-find-input" placeholder="Find in document…" autocomplete="off">' +
    '<span class="rdoc-find-count" id="rdoc-find-count"></span>' +
    '<button type="button" id="rdoc-find-prev" title="Previous">↑</button>' +
    '<button type="button" id="rdoc-find-next" title="Next">↓</button>' +
    '<button type="button" id="rdoc-find-close" title="Close">×</button>';
  document.body.appendChild(findBox);

  var helpBox = document.createElement("div");
  helpBox.className = "rdoc-overlay rdoc-help rdoc-chrome";
  helpBox.id = "rdoc-help";
  helpBox.hidden = true;
  helpBox.setAttribute("role", "dialog");
  helpBox.innerHTML =
    "<h2>Keyboard shortcuts</h2><dl>" +
    "<dt>t</dt><dd>Toggle table of contents</dd>" +
    "<dt>+ / =</dt><dd>Larger font</dd>" +
    "<dt>-</dt><dd>Smaller font</dd>" +
    "<dt>d</dt><dd>Cycle theme</dd>" +
    "<dt>s</dt><dd>Toggle serif font</dd>" +
    "<dt>z</dt><dd>Zen / focus mode</dd>" +
    "<dt>?</dt><dd>This help</dd>" +
    "<dt>Ctrl/Cmd+F</dt><dd>Find in document</dd>" +
    "<dt>Esc</dt><dd>Close overlays / exit zen</dd>" +
    "</dl><p style=\"margin:.75rem 0 0;font-size:.8rem;color:var(--muted)\">Browser Find (Edit menu) still works.</p>";
  document.body.appendChild(helpBox);

  var moreBox = document.createElement("div");
  moreBox.className = "rdoc-overlay rdoc-more rdoc-chrome";
  moreBox.id = "rdoc-more";
  moreBox.hidden = true;
  moreBox.innerHTML =
    "<h2>Reading options</h2>" +
    '<div class="rdoc-more-row">' +
    '<button type="button" id="btn-zen">Zen</button>' +
    '<button type="button" id="btn-ruler">Ruler</button>' +
    '<button type="button" id="btn-tables">Table cards</button>' +
    '<button type="button" id="btn-help">Shortcuts (?)</button>' +
    "</div>" +
    '<div class="rdoc-more-row">' +
    '<button type="button" id="btn-tts">Speak</button>' +
    '<button type="button" id="btn-tts-stop">Stop TTS</button>' +
    "</div>";
  document.body.appendChild(moreBox);

  var lightbox = document.createElement("div");
  lightbox.className = "rdoc-lightbox rdoc-chrome";
  lightbox.id = "rdoc-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.innerHTML = "<img alt=\"\">";
  document.body.appendChild(lightbox);

  function setUiOpen(which) {
    var map = { find: findBox, help: helpBox, more: moreBox };
    for (var k in map) {
      if (map[k]) map[k].hidden = k !== which;
    }
    uiBackdrop.classList.toggle("open", !!which);
    if (which === "find") {
      var inp = $("rdoc-find-input");
      if (inp) setTimeout(function () {
        inp.focus();
        inp.select();
      }, 0);
    }
  }

  function closeUi() {
    setUiOpen(null);
    clearFind();
  }

  uiBackdrop.addEventListener("click", closeUi);

  $("btn-more")?.addEventListener("click", function () {
    if (!moreBox.hidden) closeUi();
    else setUiOpen("more");
  });
  $("btn-help")?.addEventListener("click", function () {
    setUiOpen("help");
  });

  setZen(localStorage.getItem("rdoc-zen") === "1");
  setRuler(localStorage.getItem("rdoc-ruler") === "1");

  $("btn-zen")?.addEventListener("click", function () {
    setZen(root.getAttribute("data-zen") !== "1");
  });
  $("btn-ruler")?.addEventListener("click", function () {
    setRuler(root.getAttribute("data-ruler") !== "1");
  });
  $("btn-tables")?.addEventListener("click", function () {
    var cur = root.getAttribute("data-table-mode") || "sticky";
    setTableMode(cur === "cards" ? "sticky" : "cards");
    toast(cur === "cards" ? "Tables: sticky column" : "Tables: card stack");
  });

  document.addEventListener(
    "mousemove",
    function (e) {
      if (root.getAttribute("data-ruler") === "1")
        ruler.style.top = e.clientY + "px";
      if (root.getAttribute("data-zen") === "1") {
        if (e.clientY < 40 || e.clientY > window.innerHeight - 40)
          revealZen(true);
      }
    },
    { passive: true },
  );

  /* find */
  function clearFind() {
    for (var i = 0; i < findMarks.length; i++) {
      var m = findMarks[i];
      var p = m.parentNode;
      if (!p) continue;
      p.replaceChild(document.createTextNode(m.textContent || ""), m);
      p.normalize();
    }
    findMarks = [];
    findIdx = -1;
    var c = $("rdoc-find-count");
    if (c) c.textContent = "";
  }

  function highlightFind(q) {
    clearFind();
    if (!article || !q) return;
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      if (n.parentElement && n.parentElement.closest("script,style")) continue;
      nodes.push(n);
    }
    var lower = q.toLowerCase();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var text = node.nodeValue;
      var idx = text.toLowerCase().indexOf(lower);
      if (idx < 0) continue;
      var frag = document.createDocumentFragment();
      var pos = 0;
      while (idx >= 0) {
        if (idx > pos) frag.appendChild(document.createTextNode(text.slice(pos, idx)));
        var mark = document.createElement("mark");
        mark.className = "rdoc-hl";
        mark.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(mark);
        findMarks.push(mark);
        pos = idx + q.length;
        idx = text.toLowerCase().indexOf(lower, pos);
      }
      if (pos < text.length)
        frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    }
    var c = $("rdoc-find-count");
    if (c) c.textContent = findMarks.length ? "1/" + findMarks.length : "0";
    if (findMarks.length) jumpFind(0);
  }

  function jumpFind(i) {
    if (!findMarks.length) return;
    findIdx = ((i % findMarks.length) + findMarks.length) % findMarks.length;
    for (var j = 0; j < findMarks.length; j++)
      findMarks[j].classList.toggle("rdoc-hl-cur", j === findIdx);
    findMarks[findIdx].scrollIntoView({ block: "center", behavior: "smooth" });
    var c = $("rdoc-find-count");
    if (c) c.textContent = findIdx + 1 + "/" + findMarks.length;
  }

  var findInput = $("rdoc-find-input");
  var findTimer;
  findInput?.addEventListener("input", function () {
    clearTimeout(findTimer);
    findTimer = setTimeout(function () {
      highlightFind(findInput.value.trim());
    }, 120);
  });
  $("rdoc-find-next")?.addEventListener("click", function () {
    jumpFind(findIdx + 1);
  });
  $("rdoc-find-prev")?.addEventListener("click", function () {
    jumpFind(findIdx - 1);
  });
  $("rdoc-find-close")?.addEventListener("click", closeUi);
  findInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      jumpFind(e.shiftKey ? findIdx - 1 : findIdx + 1);
    }
  });

  /* TTS */
  function stopTts() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function speakText(text) {
    if (!window.speechSynthesis || !text) {
      toast("TTS unavailable");
      return;
    }
    stopTts();
    var u = new SpeechSynthesisUtterance(text);
    if (manifest.lang) u.lang = manifest.lang;
    window.speechSynthesis.speak(u);
  }
  $("btn-tts")?.addEventListener("click", function () {
    var sel = window.getSelection && String(window.getSelection());
    if (sel && sel.trim()) {
      speakText(sel.trim());
      return;
    }
    if (!article) return;
    var h = article.querySelector("h1, h2, h3");
    var start = h || article;
    var parts = [];
    var n = start;
    while (n && parts.join(" ").length < 4000) {
      if (n.innerText) parts.push(n.innerText);
      n = n.nextElementSibling;
    }
    speakText(parts.join("\n\n"));
  });
  $("btn-tts-stop")?.addEventListener("click", stopTts);

  /* lightbox */
  function closeLightbox() {
    lightbox.hidden = true;
    lightbox.querySelector("img").removeAttribute("src");
  }
  article?.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG") return;
    e.preventDefault();
    var img = lightbox.querySelector("img");
    img.src = t.currentSrc || t.src;
    img.alt = t.alt || "";
    lightbox.hidden = false;
  });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  function closeFn() {
    if (pop) pop.hidden = true;
  }
  $("rdoc-fn-close")?.addEventListener("click", closeFn);

  function typingTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeFn();
      openToc(false);
      closeLightbox();
      closeUi();
      stopTts();
      if (root.getAttribute("data-zen") === "1") setZen(false);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      setUiOpen("find");
      return;
    }

    if (typingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

    var k = e.key;
    if (k === "t" || k === "T") {
      e.preventDefault();
      openToc(!toc || !toc.classList.contains("open"));
    } else if (k === "+" || k === "=") {
      e.preventDefault();
      bumpFs(1);
    } else if (k === "-" || k === "_") {
      e.preventDefault();
      bumpFs(-1);
    } else if (k === "d" || k === "D") {
      e.preventDefault();
      $("btn-theme")?.click();
    } else if (k === "s" || k === "S") {
      e.preventDefault();
      setSerif(root.getAttribute("data-font") !== "serif");
    } else if (k === "z" || k === "Z") {
      e.preventDefault();
      setZen(root.getAttribute("data-zen") !== "1");
    } else if (k === "?") {
      e.preventDefault();
      if (!helpBox.hidden) closeUi();
      else setUiOpen("help");
    }
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("rdoc-fn-ref")) return;
    e.preventDefault();
    var id = t.getAttribute("data-fn");
    var note = id && document.getElementById("fn-" + id);
    if (!pop || !popBody || !note) return;
    popBody.innerHTML = note.innerHTML;
    pop.hidden = false;
  });
})();
