/*! rdoc runtime <10KB — TOC, progress, theme, font, footnotes, print */
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
    tocList.innerHTML = html || "<li><em>Нет заголовков</em></li>";
  }
  buildToc();

  function onScroll() {
    if (!progress || !article) return;
    var rect = article.getBoundingClientRect();
    var total = article.scrollHeight - window.innerHeight;
    var scrolled = Math.min(Math.max(-rect.top, 0), total || 1);
    var pct = total > 0 ? (scrolled / total) * 100 : 100;
    progress.style.width = pct + "%";

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

  function openToc(open) {
    if (!toc || !backdrop) return;
    toc.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
  }

  document.getElementById("btn-toc")?.addEventListener("click", function () {
    openToc(!toc.classList.contains("open"));
  });
  backdrop?.addEventListener("click", function () {
    openToc(false);
  });
  tocList?.addEventListener("click", function (e) {
    if (e.target && e.target.tagName === "A") openToc(false);
  });

  document.getElementById("btn-fs-up")?.addEventListener("click", function () {
    fs = Math.min(1.5, +(fs + 0.0625).toFixed(4));
    applyFs();
  });
  document.getElementById("btn-fs-dn")?.addEventListener("click", function () {
    fs = Math.max(0.875, +(fs - 0.0625).toFixed(4));
    applyFs();
  });
  document.getElementById("btn-theme")?.addEventListener("click", function () {
    var cur = localStorage.getItem("rdoc-theme") || "system";
    var next = cur === "system" ? "dark" : cur === "dark" ? "light" : "system";
    setTheme(next);
  });
  document.getElementById("btn-print")?.addEventListener("click", function () {
    window.print();
  });

  function closeFn() {
    if (pop) pop.hidden = true;
  }
  document.getElementById("rdoc-fn-close")?.addEventListener("click", closeFn);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeFn();
      openToc(false);
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
