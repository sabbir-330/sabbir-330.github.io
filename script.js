// Everything on the Home page is filled from data.json.
// To change text, links, photo or numbers, edit data.json only.

const $ = (id) => document.getElementById(id);
const html = document.documentElement;

/* ---------- THEME ---------- */
$("themeToggle").addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  try { localStorage.setItem("portfolio-theme", next); } catch (e) {}
});

/* ---------- MOBILE MENU ---------- */
$("menuBtn").addEventListener("click", () => $("navLinks").classList.toggle("open"));

/* ---------- NAVBAR ---------- */
function renderNav(items) {
  $("navLinks").innerHTML = items
    .map((it) => {
      if (it.dropdown) {
        const sub = it.dropdown
          .map((d) => `<a href="${d.href}" data-expertise-tab="${d.tab || ""}">${d.label}</a>`)
          .join("");
        return `<div class="nav-item has-menu">
          <a class="nav-link has-dropdown" href="${it.href}" aria-haspopup="true" aria-expanded="false">${it.label}</a>
          <div class="dropdown-menu">${sub}</div>
        </div>`;
      }
      return `<div class="nav-item"><a class="nav-link" href="${it.href}">${it.label}</a></div>`;
    })
    .join("");

  // first item (Home) is active on the home page
  const first = $("navLinks").querySelector(".nav-link");
  if (first) first.classList.add("active");

  // dropdown open/close
  $("navLinks").querySelectorAll(".has-menu > .nav-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const box = a.parentElement;
      const open = box.classList.toggle("open");
      a.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-menu")) {
      document.querySelectorAll(".has-menu.open").forEach((n) => n.classList.remove("open"));
    }
  });
  $("navLinks").addEventListener("click", (e) => {
    if (e.target.closest(".dropdown-menu a") || (e.target.closest(".nav-link") && !e.target.closest(".has-menu"))) {
      $("navLinks").classList.remove("open");
    }
  });
}

/* ---------- HERO ---------- */
function renderHero(d) {
  const h = d.hero;
  document.title = `${d.hero.nameMain} ${d.hero.nameMuted} | Portfolio`.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
  $("brandText").textContent = d.brand.text;
  const variant = html.getAttribute("data-variant");
  if (/^[1234]$/.test(variant || "")) d.brand.logo = `assets/images/logo-v${variant === "4" ? "3" : variant}.svg`;
  if (d.brand.logo) { $("brandLogo").src = d.brand.logo; const ic = document.querySelector('link[rel="icon"]'); if (ic) ic.href = d.brand.logo; }
  // version 3: stats strip under the hero, tabs in the side column
  if (variant === "3") {
    document.querySelector(".hero-grid").after($("heroStats")); $("heroStats").classList.add("container");
  }

  $("heroEyebrow").textContent = h.eyebrow;
  $("heroNameMain").textContent = h.nameMain;
  $("heroNameMuted").textContent = h.nameMuted;
  $("heroRole").textContent = h.role;
  $("heroDesc").textContent = h.description;

  // Photo: just put the image path/URL in data.json -> hero.photo
  const img = $("heroPhoto");
  img.alt = h.photoAlt || "Profile photo";
  if (h.photo && h.photo.trim()) {
    img.onerror = () => { img.onerror = null; img.src = "assets/images/placeholder.svg"; };
    img.src = h.photo.trim();
  }

  // Buttons
  $("btnWork").querySelector("span").textContent = h.primaryButton.text;
  $("btnWork").href = h.primaryButton.href || "#projects";
  const cv = $("btnCv");
  cv.querySelector("span").textContent = h.cvButton.text;
  if (h.cvButton.file && h.cvButton.file.trim()) {
    cv.href = h.cvButton.file.trim();
    cv.setAttribute("download", h.cvButton.downloadName || "CV.pdf");
  } else {
    cv.href = "#";
  }

  // Social links: empty = icon shown, no link yet
  document.querySelectorAll("[data-social]").forEach((a) => {
    const key = a.dataset.social;
    let url = (d.socials[key] || "").trim();
    if (!url) { a.href = "#"; a.addEventListener("click", (e) => e.preventDefault()); return; }
    if (key === "email" && !url.startsWith("mailto:")) url = "mailto:" + url;
    a.href = url;
    if (!url.startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; }
  });

  // Stats with count-up
  const autoVal = (v) => {
    if (typeof v !== "string" || !v.startsWith("auto:")) return Number(v) || 0;
    const k = v.slice(5);
    if (k === "projects") return d.projects.items.length;
    if (k === "skills") return d.expertise.skills.groups.reduce((n, g) => n + g.items.length, 0);
    if (k === "certificates") return d.expertise.certificates.items.length;
    if (k === "trimesters") return Math.max(d.academics.currentTrimester - 1, 0);
    return 0;
  };
  $("heroStats").innerHTML = d.stats
    .map((s) => `<div><strong data-count="${autoVal(s.value)}" data-suffix="${s.suffix || ""}">0${s.suffix || ""}</strong><span>${s.label}</span></div>`)
    .join("");
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count), suffix = el.dataset.suffix;
    if (!target) { el.textContent = "0" + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- SEARCH (Ctrl + K) ---------- */
function initSearch(items) {
  const flat = [];
  items.forEach((it) => {
    flat.push({ label: it.label, href: it.href });
    (it.dropdown || []).forEach((d) => flat.push({ label: `${it.label}: ${d.label}`, href: d.href, tab: d.tab }));
  });
  let sel = 0, shown = flat;

  const draw = () => {
    $("cmdkResults").innerHTML = shown.length
      ? shown.map((r, i) => `<a class="cmdk-item${i === sel ? " sel" : ""}" href="${r.href}" data-expertise-tab="${r.tab || ""}">${r.label}</a>`).join("")
      : `<p class="cmdk-empty">No results</p>`;
  };
  const open = () => { $("cmdkOverlay").hidden = false; $("cmdkInput").value = ""; shown = flat; sel = 0; draw(); $("cmdkInput").focus(); };
  const close = () => { $("cmdkOverlay").hidden = true; };

  $("cmdkTrigger").addEventListener("click", open);
  $("cmdkOverlay").addEventListener("click", (e) => { if (e.target === $("cmdkOverlay") || e.target.closest(".cmdk-item")) close(); });
  $("cmdkInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    shown = flat.filter((r) => r.label.toLowerCase().includes(q)); sel = 0; draw();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("cmdkOverlay").hidden ? open() : close(); return; }
    if ($("cmdkOverlay").hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); draw(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
    if (e.key === "Enter" && shown[sel]) { if (shown[sel].tab) window.setExpTab && window.setExpTab(shown[sel].tab); location.hash = shown[sel].href; close(); }
  });
}

/* ---------- CHATBOT (keyword FAQ from data.json) ---------- */
function initChat(c) {
  $("chatTitle").textContent = c.title;
  const add = (text, who) => {
    const m = document.createElement("div");
    m.className = `msg ${who}`; m.textContent = text;
    $("chatBody").appendChild(m); $("chatBody").scrollTop = $("chatBody").scrollHeight;
  };
  const norm = (t) => " " + t.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim() + " ";
  const answerFor = (q) => {
    const low = norm(q);
    let best = null, bestScore = 0;
    c.faq.forEach((f) => {
      let score = 0;
      f.keywords.forEach((k) => { if (low.includes(" " + k.toLowerCase() + " ") || (k.length > 3 && low.includes(k.toLowerCase()))) score += k.length; });
      if (score > bestScore) { bestScore = score; best = f; }
    });
    return best ? best.answer : c.fallback;
  };
  const ask = (q, shown) => { add(shown || q, "me"); setTimeout(() => add(answerFor(q), "bot"), 280); };
  const topics = $("chatTopics");
  if (topics && c.topics) {
    topics.innerHTML = c.topics.map((t) => `<button type="button" data-q="${esc(t.q)}">${esc(t.label)}</button>`).join("");
    topics.addEventListener("click", (e) => { const b = e.target.closest("button[data-q]"); if (b) ask(b.dataset.q, b.textContent); });
  }
  $("chatFab").addEventListener("click", () => {
    $("chatBox").hidden = !$("chatBox").hidden;
    if (!$("chatBody").children.length) add(c.welcome, "bot");
    if (!$("chatBox").hidden) $("chatInput").focus();
  });
  $("chatClose").addEventListener("click", () => ($("chatBox").hidden = true));
  $("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("chatInput").value.trim(); if (!q) return;
    $("chatInput").value = ""; ask(q);
  });
}

/* ---------- helpers ---------- */
const tc = (s) => String(s).replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase());
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const openModal = (id) => { $(id).hidden = false; document.body.style.overflow = "hidden"; };
const closeModals = () => { document.querySelectorAll(".modal").forEach((m) => (m.hidden = true)); document.body.style.overflow = ""; $("cvFrame").src = "about:blank"; };
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]") || (e.target.classList && e.target.classList.contains("modal"))) closeModals();
});

/* update type -> key and icon (an item can also carry its own "icon" in data.json) */
const bKey = (b) => String(b || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
const B_ICONS = { certified: "fa-award", milestone: "fa-flag-checkered", submitted: "fa-paper-plane", "in-progress": "fa-code" };
const bIcon = (it) => it.icon || B_ICONS[bKey(it.badge)] || "fa-bell";

/* full history: opens from the "View all updates" board or by clicking any board; sidebar filters by type */
function initNewsArchive(items) {
  const types = [...new Set(items.map((i) => i.badge))];
  const count = (t) => items.filter((i) => i.badge === t).length;
  const tab = (k, label, ic, c) => `<button class="jtab" type="button" data-na="${esc(k)}"><i class="fas ${esc(ic)}"></i><span>${esc(label)}</span><em class="na-count">${c}</em></button>`;
  $("newsArchive").innerHTML = `
    <div class="na-grid">
      <aside class="na-side">
        <p class="exp-label"><i class="fas fa-bookmark"></i> ALL UPDATES</p>
        <div class="na-tabs">${tab("all", "All updates", "fa-layer-group", items.length)}${types.map((t) => tab(t, t, bIcon({ badge: t }), count(t))).join("")}</div>
        <div class="summary-card na-sum">
          <div class="sum-tile"><i class="fas fa-list-check"></i><div><span>Total updates</span><strong>${items.length}</strong></div></div>
          <div class="sum-tile"><i class="fas fa-calendar-day"></i><div><span>Latest</span><strong>${esc(fmtDate(items[0].date))}</strong></div></div>
        </div>
      </aside>
      <section class="na-main">
        <header class="panel-head"><span class="ph-ico"><i class="fas fa-clock-rotate-left"></i></span><div><h3 id="naTitle">All Updates</h3><p id="naSub"></p></div><span class="ph-float" aria-hidden="true"><i class="fas fa-clock-rotate-left"></i></span></header>
        <div class="na-list" id="naList"></div>
      </section>
    </div>`;
  const draw = (k, focus) => {
    document.querySelectorAll("#newsArchive .jtab").forEach((t) => t.classList.toggle("active", t.dataset.na === k));
    const rows = items.map((it, i) => [it, i]).filter(([it]) => k === "all" || it.badge === k);
    $("naTitle").textContent = k === "all" ? "All Updates" : k;
    $("naSub").textContent = `${rows.length} ${rows.length === 1 ? "update" : "updates"}, newest first`;
    $("naList").innerHTML = rows.map(([it, i]) => `
      <article class="na-item" data-i="${i}">
        <span class="na-ico is-${bKey(it.badge)}"><i class="fas ${esc(bIcon(it))}"></i></span>
        <div class="na-body">
          <div class="na-top"><time>${esc(fmtDate(it.date))}</time><span class="chip na-chip is-${bKey(it.badge)}">${esc(it.badge)}</span></div>
          <h4>${esc(it.title)}</h4><p>${esc(it.text)}</p>
          ${it.meta ? `<small><i class="fas fa-building-columns"></i> ${esc(it.meta)}</small>` : ""}
        </div>
      </article>`).join("");
    if (focus != null) {
      const el = $("naList").querySelector(`[data-i="${focus}"]`);
      if (el) { el.classList.add("hit"); setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 60); }
    }
  };
  const open = (focus) => { draw("all", focus); $("newsModal").querySelector(".modal-box").scrollTop = 0; openModal("newsModal"); };
  $("newsArchive").addEventListener("click", (e) => { const t = e.target.closest("[data-na]"); if (t) draw(t.dataset.na); });
  const hit = (e) => { const w = e.target.closest("[data-news-open]"); if (!w) return; const v = w.dataset.newsOpen; open(v === "all" ? null : Number(v)); };
  $("newsList").addEventListener("click", hit);
  $("newsList").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(e); } });
}

/* ---------- LATEST UPDATES (newest first) ---------- */
function renderNews(n) {
  $("newsTitle").textContent = n.title;
  $("newsSub").textContent = n.subtitle;
  const items = [...n.items].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!items.length) { $("news").hidden = true; return; }
  if (n.style === "tree") {
    const tilts = [-1.5, 2.2, -2, 1.6, -1.2, 2, -1.8];
    const sl = (i) => TREE_SLOTS[i] || [0, 0, 3];
    const wrapStyle = (i, o) => `--x:${sl(i)[0]}%;--y:${sl(i)[1]}%;--s:${sl(i)[2]};--dx:${sl(i)[3] || 0};--o:${o}`;
    const hang = (i) => `<svg class="hang" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="3,100 ${50 + (sl(i)[3] || 0) / 9.4 * 100},0 97,100" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
    $("newsList").className = "news-tree" + ((window.__board || n.board) === "white" ? " white" : "") + ((window.__tree || n.tree) === "line" ? " line" : "");
    /* the lowest board on the tree (last slot) also works as "View all updates": hover = history preview, click = full history */
    const card = (it, m, s) => { const va = s === TREE_SLOTS.length - 1; return `
      <article class="sign-wrap${va ? " va" : ""}" role="button" tabindex="0" data-news-open="${va ? "all" : m}" aria-label="${va ? `View all ${items.length} updates` : `Open update: ${esc(it.title)}`}" style="${wrapStyle(s, m)}">
        <div class="sign" style="--tilt:${tilts[s % tilts.length]}deg">${hang(s)}${m === 0 && !va ? '<span class="b-new">NEW</span>' : ""}${va ? `<div class="board board-all">
          <span class="va-ico"><i class="fas fa-layer-group"></i></span>
          <h3>View all updates</h3>
          <p>${items.length} updates so far, newest first. Open the full history.</p>
          <div class="b-foot"><span class="b-meta"><i class="fas fa-hand-pointer"></i> Click to open all</span><span class="b-more">Open <i class="fas fa-arrow-right"></i></span></div>
        ` : `<div class="board is-${bKey(it.badge)}">
          <div class="b-top"><span class="b-ico"><i class="fas ${esc(bIcon(it))}"></i></span><span class="b-date">${esc(fmtDate(it.date))}</span><span class="b-badge">${esc(it.badge)}</span></div>
          <h3>${esc(it.title)}</h3>
          <p title="${esc(it.text)}">${esc(it.text)}</p>
          <div class="b-foot">${it.meta ? `<span class="b-meta">${esc(it.meta)}</span>` : "<span></span>"}<span class="b-more">Details <i class="fas fa-arrow-right"></i></span></div>
        `}</div></div>
      </article>`; };
    $("newsList").innerHTML = '<svg class="tree-svg" id="treeSvg" aria-hidden="true"></svg>' + TREE_SLOTS.map((_, s) => (items[s] ? card(items[s], s, s) : "")).join("");
    initNewsArchive(items, n);
    drawTree();
    if ("ResizeObserver" in window) new ResizeObserver(drawTree).observe($("newsList"));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTree);
    return;
  }
  /* professional timeline: newest 4 here, everything in the "View all updates" page */
  const SHOW = 4;
  $("newsList").className = "news-list na-list news-timeline";
  $("newsList").innerHTML = items.slice(0, SHOW).map((it, i) => `
    <article class="na-item" role="button" tabindex="0" data-news-open="${i}" aria-label="Open update: ${esc(it.title)}">
      <span class="na-ico is-${bKey(it.badge)}"><i class="fas ${esc(bIcon(it))}"></i></span>
      <div class="na-body">
        <div class="na-top"><time>${esc(fmtDate(it.date))}</time><span class="chip na-chip is-${bKey(it.badge)}">${esc(it.badge)}</span></div>
        <h4>${esc(it.title)}</h4><p>${esc(it.text)}</p>
        ${it.meta ? `<small><i class="fas fa-building-columns"></i> ${esc(it.meta)}</small>` : ""}
      </div>
    </article>`).join("") + (items.length > SHOW ? `<button class="btn btn-primary news-all" type="button" data-news-open="all"><i class="fas fa-layer-group"></i> View all updates (${items.length})</button>` : "");
  initNewsArchive(items, n);
}

/* Desktop: the tree is a picture (assets/images/tree.webp) and signs hang at fixed branch points.
   Smaller screens: a simple side tree is drawn instead. */
const TREE_SLOTS = [[51.6, 8.6, 2.91], [27.2, 16.8, 3.43], [73.8, 25.9, 4.12], [18.2, 39.2, 6.4], [48.4, 31.2, 5.4], [69.5, 49.6, 5.98]]; // zig-zag like fruit, newest at the top: x%, y% of the nail, hanger height (% of tree width), optional 4th = how far the board sits left of the nail
function drawTree() {
  const svg = $("treeSvg"); if (!svg) return;
  if (window.matchMedia("(max-width: 991px)").matches) return drawTreeSide();
  svg.innerHTML = "";
}

/* Bare tree behind the signs: trunk + one branch per sign, drawn from the real sign positions */
function drawTreeSide() {
  const box = $("newsList"), svg = $("treeSvg"); if (!svg) return;
  const W = box.clientWidth, H = box.clientHeight;
  const mobile = true;
  const cx = 30;
  const signs = [...box.querySelectorAll(".sign-wrap")];
  if (!signs.length || !W) return;
  const f = (n) => n.toFixed(1);
  const wide = [], thin = [], twigs = [], nails = [];
  signs.forEach((el, i) => {
    const hx = el.offsetLeft + el.offsetWidth / 2, hy = el.offsetTop + 1;
    const dir = hx >= cx ? 1 : -1;
    const P0 = [cx, Math.min(hy + (mobile ? 46 : 92), H - 175)];
    const P2 = [hx + dir * (mobile ? 46 : 70), hy - 26];
    const t = 0.76, k = 2 * t * (1 - t);
    const C = [(hx - (1 - t) * (1 - t) * P0[0] - t * t * P2[0]) / k, (hy - (1 - t) * (1 - t) * P0[1] - t * t * P2[1]) / k];
    thin.push(`M${f(P0[0])} ${f(P0[1])} Q${f(C[0])} ${f(C[1])} ${f(P2[0])} ${f(P2[1])}`);
    // thicker first half (de Casteljau split at 0.5)
    const A = [(P0[0] + C[0]) / 2, (P0[1] + C[1]) / 2], B = [(C[0] + P2[0]) / 2, (C[1] + P2[1]) / 2], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    wide.push(`M${f(P0[0])} ${f(P0[1])} Q${f(A[0])} ${f(A[1])} ${f(M[0])} ${f(M[1])}`);
    // small bare twigs
    twigs.push(`M${f(M[0])} ${f(M[1])} q${dir * 6} -16 ${dir * (i % 2 ? 22 : 12)} -34`);
    twigs.push(`M${f(B[0])} ${f(B[1])} q${-dir * 2} -12 ${dir * 8} -24`);
    nails.push([hx, hy]);
  });
  const top = 14, bw = mobile ? 15 : 26, fw = mobile ? 30 : 86, by = H - 150, bot = H - 12;
  const trunk = `M${f(cx - 5)} ${top + 26} Q${f(cx - 9)} ${f(by * 0.5)} ${f(cx - bw)} ${f(by)} Q${f(cx - bw - 4)} ${f(bot - 30)} ${f(cx - fw)} ${f(bot)} Q${f(cx - fw * 0.45)} ${f(bot - 14)} ${f(cx - fw * 0.2)} ${f(bot)} Q${f(cx)} ${f(bot - 12)} ${f(cx + fw * 0.2)} ${f(bot)} Q${f(cx + fw * 0.45)} ${f(bot - 14)} ${f(cx + fw)} ${f(bot)} Q${f(cx + bw + 4)} ${f(bot - 30)} ${f(cx + bw)} ${f(by)} Q${f(cx + 9)} ${f(by * 0.5)} ${f(cx + 5)} ${top + 26} Z`;
  twigs.push(`M${f(cx)} ${top + 34} q-4 -16 -20 -30`, `M${f(cx)} ${top + 34} q6 -14 16 -22`);
  const st = (d, w, col) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const wood = "var(--wood)", dark = "var(--wood-dark)", o = 5;
  const tw = mobile ? 0.75 : 1;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML =
    `<ellipse cx="${f(cx)}" cy="${f(bot + 2)}" rx="${fw * 1.9}" ry="13" fill="rgba(0,0,0,0.10)"/>` +
    thin.map((d) => st(d, 9 * tw + o, dark)).join("") + wide.map((d) => st(d, 16 * tw + o, dark)).join("") + twigs.map((d) => st(d, 5 * tw + o, dark)).join("") +
    `<path d="${trunk}" fill="${dark}" stroke="${dark}" stroke-width="${o}" stroke-linejoin="round"/>` +
    thin.map((d) => st(d, 9 * tw, wood)).join("") + wide.map((d) => st(d, 16 * tw, wood)).join("") + twigs.map((d) => st(d, 5 * tw, wood)).join("") +
    `<path d="${trunk}" fill="${wood}"/>` +
    `<path d="M${f(cx - bw * 0.35)} ${f(by - 120)} q-3 60 -${f(bw * 0.2)} 120 M${f(cx + bw * 0.3)} ${f(by - 60)} q3 40 0 80" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/>` +
    nails.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="#d9d9d9" stroke="${dark}" stroke-width="3"/>`).join("");
}

/* percentage text counts up while the ring fills */
function countRings(panel) {
  if (!panel) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  panel.querySelectorAll(".ring-tag[data-to]").forEach((el) => {
    const to = Number(el.dataset.to); if (!to) return;
    if (reduce) { el.textContent = to + "%"; return; }
    const t0 = performance.now();
    const step = (t) => { const p = Math.min((t - t0) / 2000, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + "%"; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

/* ---------- EXPERTISE & JOURNEY ---------- */
function renderExpertise(d) {
  const x = d.expertise, a = d.academics;
  $("expTitle").textContent = x.title;
  const cvFile = (d.hero.cvButton.file || "").trim();
  const cvName = d.hero.cvButton.downloadName || "CV.pdf";
  const cvBtns = () => cvFile
    ? `<a class="btn btn-primary" href="${esc(cvFile)}" download="${esc(cvName)}"><span>Download CV</span> <i class="fas fa-download"></i></a>
       <button class="btn btn-outline" type="button" data-cv-preview><span>Preview</span> <i class="fas fa-eye"></i></button>`
    : `<span class="hint">CV file not added yet.</span>`;
  const head = (p) => `<header class="panel-head"><span class="ph-ico"><i class="fas ${esc(p.icon || "fa-star")}"></i></span><div><h3>${esc(p.title || "")}</h3><p>${esc(p.subtitle || "")}</p></div><span class="ph-float" aria-hidden="true"><i class="fas ${esc(p.icon || "fa-star")}"></i></span></header>`;
  const done = Math.max(a.currentTrimester - 1, 0);

  /* sidebar: academic summary (shown with the Education tab) */
  $("summaryCard").className = "summary-card";
  $("summaryCard").innerHTML = `
    <p class="exp-label">ACADEMIC SUMMARY</p>
    <div class="sum-tile"><i class="fas fa-arrow-trend-up"></i><div><span>Overall CGPA</span><strong>${esc(a.overallCgpa)}</strong></div></div>
    <div class="sum-tile"><i class="fas fa-calendar-check"></i><div><span>Trimester</span><strong>${a.currentTrimester}th running <small>/ ${a.totalTrimesters}</small></strong></div></div>
    <div class="sum-tile"><i class="fas fa-flag-checkered"></i><div><span>Expected Graduation</span><strong>${esc(a.expectedGraduation)}</strong></div></div>
    ${cvFile ? `<a class="btn btn-cv" href="${esc(cvFile)}" download="${esc(cvName)}"><i class="fas fa-download"></i> <span>Download Resume</span></a>` : ""}`;

  /* panels */
  const focus = x.focus;
  const pFocus = head(focus) + `
    <div class="focus-grid">${focus.cards.map((c) => `<div class="focus-card"><div class="ico"><i class="fas ${esc(c.icon)}"></i></div><h4>${esc(c.title)}</h4><p>${esc(c.text)}</p></div>`).join("")}</div>
    <div class="promo"><div><h4>${esc(focus.promo.title)}</h4><p>${esc(focus.promo.text)}</p></div><button class="btn btn-primary" type="button" data-open-chat><span>${esc(focus.promo.button)}</span> <i class="far fa-message"></i></button></div>`;

  const C = 2 * Math.PI * 34;
  const pSkills = head(x.skills) + x.skills.groups.map((g) => `
    <h4 class="group-label"><i class="fas ${esc(g.icon || "fa-layer-group")}"></i> ${esc(g.title)}</h4>
    <div class="skill-grid">${g.items.map((s) => {
      const lvl = Math.min(Math.max(Number(s.level) || 0, 0), 100);
      return `<div class="skill-card">
        <div class="ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="ring-bg"/><circle cx="40" cy="40" r="34" class="ring-fg" style="stroke-dasharray:${C.toFixed(1)};--c:${C.toFixed(1)};--off:${(C * (1 - (lvl || 100) / 100)).toFixed(1)}"/></svg>
          ${s.img ? `<span class="ring-ico has-img"><img src="${esc(s.img)}" alt="" width="30" height="30" loading="lazy"></span>` : `<span class="ring-ico" style="background:${esc(s.color || "var(--green)")}"><i class="${esc(s.icon || "fas fa-code")}"></i></span>`}</div>
        <span class="ring-tag" data-to="${lvl}">${lvl ? "0%" : esc(s.tag || "")}</span>
        <strong>${esc(s.name)}</strong><p>${esc(s.desc)}</p>
      </div>`; }).join("")}</div>`).join("");

  const pExp = head(x.experience) + `<div class="timeline">${x.experience.items.map((e) => `
    <div class="tl-item"><div class="tl-when">${esc(e.when)}</div><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p><span class="chip">${esc(e.status)}</span></div>`).join("")}</div>`;

  const segs = Array.from({ length: a.totalTrimesters }, (_, i) => `<i class="${i < done ? "done" : i === done ? "now" : ""}" title="Trimester ${i + 1}"></i>`).join("");
  const pEdu = head(x.education) + `
    <div class="stat-tiles">
      <div class="stat-tile hl"><i class="fas fa-chart-line"></i><div><span>Overall CGPA</span><strong>${esc(a.overallCgpa)}</strong><small>Up to now</small></div></div>
      <div class="stat-tile"><i class="fas fa-calendar-days"></i><div><span>Trimester</span><strong>${a.currentTrimester}th running</strong><small>out of ${a.totalTrimesters}</small></div></div>
    </div>
    <div class="progress-card"><h4>Degree Progress</h4><div class="segs">${segs}</div>
      <div class="seg-labels"><span>${done} completed</span><span>${a.currentTrimester}th running</span><span>${a.totalTrimesters} total</span></div></div>
    <div class="edu-line">${x.education.institutions.map((i) => `
      <div class="inst"><div class="ico"><i class="fas ${esc(i.logo)}"></i></div>
        <div class="inst-main"><span class="inst-level">${esc(i.level)}</span><h4>${esc(i.name)}</h4><p>${esc(i.degree)}</p><p class="inst-meta"><i class="fas fa-calendar"></i> ${esc(i.when)} &nbsp; <i class="fas fa-location-dot"></i> ${esc(i.where)}</p></div>
        <div class="inst-result"><span>${esc(i.resultLabel || "CGPA (Overall)")}</span><strong>${esc(i.result || a.overallCgpa)}</strong><small>${esc(i.resultNote || a.currentTrimester + "th trimester")}</small></div></div>`).join("")}</div>`;

  const certs = x.certificates.items;
  const pCert = head(x.certificates) + `
    <p class="cert-hint"><i class="fas fa-magnifying-glass-plus"></i> Click a certificate to view it full size</p>
    <div class="cert-grid">${certs.map((c, i) => `
      <button class="cert-card" type="button" data-cert="${i}" aria-label="View ${esc(c.title)} full size">
        <div class="cert-thumb"><img src="${esc(c.image)}" alt="${esc(c.title)} certificate" loading="lazy"><span class="chip">${esc(c.type)}</span><em>Click to view full size</em></div>
        <div class="cert-info"><h4>${esc(c.title)}</h4><p>${esc(c.text)}</p><small><i class="fas fa-building-columns"></i> ${esc(c.issuer)}</small></div>
      </button>`).join("")}</div>`;

  const ach = x.achievements.items;
  const pAch = head(x.achievements) + `
    <div class="ach-grid">${ach.map((c, i) => `
      <${c.image ? 'button type="button" data-ach="' + i + '"' : "div"} class="ach">
        <span class="ach-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="unlocked"><i class="fas fa-circle-check"></i> COMPLETED</span>
        <span class="ach-ico"><i class="fas ${esc(c.icon || "fa-trophy")}"></i><b><i class="fas fa-check"></i></b></span>
        <h4>${esc(c.title)}</h4><p>${esc(c.text)}</p>
      </${c.image ? "button" : "div"}>`).join("")}</div>
    <div class="cta-box"><div><h4>Want the full picture?</h4><p>Get my CV in one page.</p></div><div class="cta-btns">${cvBtns()}</div></div>`;

  const pRes = head(x.resume) + `
    <div class="cta-box"><div><h4>Md Sabbir Ahmed: CV</h4><p>${esc(x.resume.text)}</p></div><div class="cta-btns">${cvBtns()}</div></div>`;

  const bodies = { focus: pFocus, skills: pSkills, experience: pExp, education: pEdu, certificates: pCert, achievements: pAch, resume: pRes };
  const item = (k, sub) => `<button class="jtab${sub ? " sub" : ""}" type="button" data-tab="${k}"><i class="fas ${esc(x[k].icon || "fa-star")}"></i><span>${esc(k === "focus" ? "Focus" : x[k].title.replace(/^My | & Credentials$/g, ""))}</span>${k === "focus" ? '<i class="fas fa-chevron-down chev"></i>' : ""}</button>`;
  $("expTabs").innerHTML = `<div class="jgroup" id="jGroup">${item("focus")}<div class="jsub">${item("skills", 1)}${item("experience", 1)}</div></div>` + ["education", "certificates", "achievements", "resume"].map((k) => item(k)).join("");
  $("expPanels").innerHTML = Object.keys(bodies).map((k) => `<div class="panel" id="panel-${k}" role="tabpanel">${bodies[k]}</div>`).join("");

  const setTab = (k) => {
    if (!bodies[k]) k = "focus";
    document.querySelectorAll(".jtab").forEach((t) => { const on = t.dataset.tab === k; t.classList.toggle("active", on); t.setAttribute("aria-selected", on); });
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + k));
    $("jGroup").classList.toggle("open", ["focus", "skills", "experience"].includes(k));
    $("summaryCard").hidden = k !== "education";
    countRings(document.getElementById("panel-" + k));
  };
  window.setExpTab = setTab;
  setTab("focus");
  $("expTabs").addEventListener("click", (e) => {
    const t = e.target.closest(".jtab"); if (!t) return;
    setTab(t.dataset.tab);
    /* every new option starts from the top of the section (heading + My Journey box in view) */
    const head = document.querySelector("#expertise .sec-head");
    if (head) {
      const y = head.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: Math.max(0, y), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  });
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-expertise-tab]");
    if (l && l.dataset.expertiseTab) setTab(l.dataset.expertiseTab);
  });

  /* lightbox */
  let lbList = [], lbI = 0;
  const lbShow = () => { const it = lbList[lbI]; $("lbImg").src = it.image; $("lbImg").alt = it.title; $("lbCap").textContent = `${it.title}  (${lbI + 1}/${lbList.length})`; };
  const lbOpen = (list, i) => { lbList = list; lbI = i; lbShow(); openModal("lightbox"); };
  $("lbPrev").addEventListener("click", (e) => { e.stopPropagation(); lbI = (lbI - 1 + lbList.length) % lbList.length; lbShow(); });
  $("lbNext").addEventListener("click", (e) => { e.stopPropagation(); lbI = (lbI + 1) % lbList.length; lbShow(); });
  $("expPanels").addEventListener("click", (e) => {
    const c = e.target.closest("[data-cert]"); if (c) lbOpen(certs, Number(c.dataset.cert));
    const a2 = e.target.closest("[data-ach]"); if (a2) lbOpen([ach[Number(a2.dataset.ach)]], 0);
    if (e.target.closest("[data-open-chat]")) { if ($("chatBox").hidden) $("chatFab").click(); }
    if (e.target.closest("[data-cv-preview]")) { $("cvFrame").src = cvFile; $("cvFallback").href = cvFile; $("cvFallback").setAttribute("download", cvName); openModal("cvModal"); }
  });
  document.addEventListener("keydown", (e) => {
    if ($("lightbox").hidden) { if (e.key === "Escape") closeModals(); return; }
    if (e.key === "Escape") closeModals();
    if (e.key === "ArrowLeft") $("lbPrev").click();
    if (e.key === "ArrowRight") $("lbNext").click();
  });
}

/* ---------- PROJECTS ---------- */
function renderProjects(p) {
  $("projTitle").textContent = p.title;
  $("projSub").textContent = p.subtitle;
  $("projFilters").innerHTML = p.filters.map((f, i) => `<button class="tab${i === 0 ? " active" : ""}" type="button" data-filter="${esc(f)}">${esc(f)}</button>`).join("");
  $("projGrid").innerHTML = p.items.map((it, i) => `
    <article class="card proj" data-cats="${esc(it.categories.join("|"))}" data-search="${esc([it.title, it.text, it.kind, ...it.categories, ...(it.tech || [])].join(" ").toLowerCase())}">
      <div class="proj-banner">
        ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.title)} preview" loading="lazy">` : ""}
        ${it.featured ? '<span class="chip badge-new">Featured</span>' : ""}
      </div>
      <div class="proj-body">
        <h3>${esc(it.title)}</h3>
        <div class="proj-kind">${esc(it.kind)}</div>
        <p>${esc(it.text)}</p>
        ${it.tech && it.tech.length ? `<div class="chips">${it.tech.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
        ${it.repo ? `<div class="repo-stats" data-repo="${esc(it.repo)}"></div>` : ""}
        <div class="proj-btns">
          ${it.github ? `<a class="btn btn-outline" href="${esc(it.github)}" target="_blank" rel="noopener"><i class="fab fa-github"></i> <span>GitHub</span></a>` : ""}
          ${it.demo ? `<a class="btn btn-primary" href="${esc(it.demo)}"${it.demo.startsWith("#") ? "" : ' target="_blank" rel="noopener"'}><span>Live Demo</span> <i class="fas ${it.demo.startsWith("#") ? "fa-arrow-right" : "fa-arrow-up-right-from-square"}"></i></a>` : ""}
          ${it.caseStudy ? `<button class="btn btn-primary" type="button" data-case="${i}"><span>Case Study</span> <i class="fas fa-book-open"></i></button>` : ""}
        </div>
      </div>
    </article>`).join("");

  let filter = "All", query = "";
  const apply = () => {
    let shown = 0;
    document.querySelectorAll(".proj").forEach((c) => {
      const ok = (filter === "All" || c.dataset.cats.split("|").includes(filter)) && (!query || c.dataset.search.includes(query));
      c.classList.toggle("hide", !ok); if (ok) shown++;
    });
    $("projEmpty").hidden = shown > 0;
  };
  $("projFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]"); if (!b) return;
    document.querySelectorAll("#projFilters .tab").forEach((t) => t.classList.toggle("active", t === b));
    filter = b.dataset.filter; apply();
  });
  const ps = $("projSearch"); if (ps) ps.addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); apply(); });
  $("projGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-case]"); if (!b) return;
    const it = p.items[Number(b.dataset.case)], c = it.caseStudy;
    const sec = (h, t) => t ? `<h5>${h}</h5><p>${esc(t)}</p>` : "";
    $("caseBody").innerHTML = `<div class="case"><h3 id="caseTitle">${esc(it.title)}</h3>
      ${sec("Overview", c.overview)}${sec("My Role", c.role)}${sec("Approach", c.approach)}${sec("Challenges", c.challenges)}${sec("Outcome", c.outcome)}
      ${c.tech && c.tech.length ? `<div class="chips">${c.tech.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}</div>`;
    openModal("caseModal");
  });
}

/* ---------- GITHUB API (project cards: stars, forks, last update) ---------- */
async function ghJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(url + " " + r.status);
  return r.json();
}
function loadRepoStats() {
  document.querySelectorAll("[data-repo]").forEach(async (el) => {
    try {
      const r = await ghJson(`https://api.github.com/repos/${el.dataset.repo}`);
      const ago = (iso) => { const m = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 2629800000)); if (m < 1) { const dd = Math.floor((Date.now() - new Date(iso)) / 86400000); return dd < 1 ? "today" : dd + "d ago"; } return m < 12 ? m + "mo ago" : Math.floor(m / 12) + "y ago"; };
      el.innerHTML = `<span><i class="fas fa-star"></i> ${r.stargazers_count}</span>${r.language ? `<span><i class="fas fa-circle"></i> ${esc(r.language)}</span>` : ""}<span><i class="far fa-clock"></i> Updated ${ago(r.pushed_at)}</span>`;
    } catch (e) { el.remove(); }
  });
}

/* ---------- CONTACT + FOOTER ---------- */
function renderContact(d) {
  const c = d.contact, h = d.hero, loc = d.meta.location;
  $("ctTitle").textContent = c.title;
  $("ctSub").textContent = c.subtitle;
  const email = (c.email || d.socials.email || "").trim();
  $("contactCard").className = "card contact-card";
  $("contactCard").innerHTML = `
    <img src="${esc(h.photo)}" alt="${esc(h.photoAlt)}" onerror="this.src='assets/images/placeholder.svg'">
    <div class="avail">${esc(c.badge)}</div>
    <h3>${esc(tc(h.nameMain + " " + h.nameMuted))}</h3>
    <p>${esc(h.role)}</p>
    <div class="ct-list">
      <div><i class="fas fa-location-dot"></i><span>${esc(loc)}</span></div>
      ${c.phone ? `<div><i class="fas fa-phone"></i><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div>` : ""}
      ${email ? `<div><i class="fas fa-envelope"></i><a href="mailto:${esc(email)}">${esc(email)}</a></div>` : ""}
    </div>
    ${c.whatsapp || c.telegram ? `<div class="ct-btns">
      ${c.whatsapp ? `<a class="btn btn-outline" href="${esc(c.whatsapp)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> <span>WhatsApp</span></a>` : ""}
      ${c.telegram ? `<a class="btn btn-outline" href="${esc(c.telegram)}" target="_blank" rel="noopener"><i class="fab fa-telegram"></i> <span>Telegram</span></a>` : ""}</div>` : ""}`;

  const form = $("contactForm"), note = $("formNote");
  const say = (t, cls) => { note.textContent = t; note.className = "form-note " + (cls || ""); toast(t); };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const [name, from, subject, message] = ["name", "email", "subject", "message"].map((k) => (f.get(k) || "").toString().trim());
    if (!name || !from || !subject || !message) return say("Please fill in all fields.", "err");
    if (!/^\S+@\S+\.\S+$/.test(from)) return say("Please enter a valid email address.", "err");
    if (c.formEndpoint) {
      try {
        const r = await fetch(c.formEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ name, email: from, subject, message }) });
        if (!r.ok) throw new Error(r.status);
        form.reset(); confettiBurst(innerWidth / 2, innerHeight / 2); return say("Thanks! Your message was sent.", "ok");
      } catch (err) { return say("Could not send right now. Please try again later.", "err"); }
    }
    if (email) {
      location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + "\n\n" + name + " (" + from + ")")}`;
      return say("Opening your email app…", "ok");
    }
    say("Contact email is not set yet.", "err");
  });
}

function renderFooter(d) {
  const email = (d.contact.email || d.socials.email || "").trim();
  const name = tc(d.hero.nameMain + " " + d.hero.nameMuted);
  const icons = { github: "fab fa-github", linkedin: "fab fa-linkedin-in", email: "fas fa-envelope", facebook: "fab fa-facebook-f", instagram: "fab fa-instagram", telegram: "fab fa-telegram" };
  const socials = Object.entries(d.socials).filter(([, v]) => (v || "").trim())
    .map(([k, v]) => `<a href="${esc(k === "email" && !v.startsWith("mailto:") ? "mailto:" + v : v)}" aria-label="${k}" target="_blank" rel="noopener"><i class="${icons[k]}"></i></a>`).join("");
  const cvFile = (d.hero.cvButton.file || "").trim();
  $("footerGrid").innerHTML = `
    <div class="foot-brand"><a class="brand" href="#home"><img src="${esc(d.brand.logo)}" alt="" width="34" height="34"><span>${esc(d.brand.text)}</span><span class="brand-dot">.</span></a>
      <p><strong>${esc(name)}</strong><br>${esc(d.hero.role)}</p><p style="margin-top:8px">${esc(d.footer.tagline)}</p>
      ${socials ? `<div class="foot-socials">${socials}</div>` : ""}</div>
    <div><h4>Quick Links</h4><ul>
      ${d.nav.filter((n) => !n.dropdown).map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join("")}
      <li><a href="#expertise" data-expertise-tab="skills">Skills</a></li>
      ${cvFile ? `<li><a href="${esc(cvFile)}" target="_blank" rel="noopener">Resume / CV</a></li>` : ""}</ul></div>
    <div><h4>Get in Touch</h4><ul>
      ${email ? `<li><i class="fas fa-envelope"></i> ${esc(email)}</li>` : ""}
      ${d.contact.phone ? `<li><i class="fas fa-phone"></i> ${esc(d.contact.phone)}</li>` : ""}
      <li><i class="fas fa-location-dot"></i> ${esc(d.meta.location)}</li></ul></div>`;
  $("footerBottom").innerHTML = `<span>© ${new Date().getFullYear()} ${esc(name)} · Layout inspired by Toukir’s portfolio</span><span>Last updated ${esc(fmtDate(d.meta.lastUpdated))} · v${esc(d.meta.version)}</span>`;
}

/* ---------- SCROLL SPY ---------- */
function initSpy() {
  const links = [...document.querySelectorAll("#navLinks .nav-link")];
  const map = links.map((a) => ({ a, el: document.querySelector(a.getAttribute("href")) })).filter((x) => x.el);
  const on = () => {
    const y = window.scrollY + 140;
    let cur = map[0];
    map.forEach((m) => { if (m.el.offsetTop <= y) cur = m; });
    links.forEach((l) => l.classList.toggle("active", cur && l === cur.a));
  };
  window.addEventListener("scroll", on, { passive: true });
  on();
}

/* ---------- CHATBOT FAQ TOKENS ---------- */
function chatFaq(d) {
  const skills = d.expertise.skills.groups.flatMap((g) => g.items.map((i) => i.name)).join(", ");
  const projects = d.projects.items.map((p) => p.title).join("; ");
  const certificates = d.expertise.certificates.items.map((c) => c.title).join("; ");
  const a = d.academics;
  const education = `I study ${a.degree} at ${a.university}. My overall CGPA is ${a.overallCgpa}, and I'm in trimester ${a.currentTrimester} of ${a.totalTrimesters}.`;
  const email = (d.contact.email || d.socials.email || "").trim();
  const contact = email ? `You can email me at ${email}, or use the contact form on this page.` : "Please use the contact form in the Contact section of this page.";
  const grp = (re) => { const g = d.expertise.skills.groups.find((x) => re.test(x.title || x.name || "")); return g ? g.items.map((i) => i.name).join(", ") : skills; };
  const demos = d.projects.items.filter((p) => p.demo).map((p) => `${p.title} (${p.demo.startsWith("#") ? "this site" : p.demo})`).join("; ") || "coming soon";
  const news = ((d.news && d.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3).map((n) => n.title).join("; ") || "see the News section";
  const t = { skills, projects, certificates, education, contact, demos, news, github: d.socials.github || "", frontend: grp(/frontend/i), languages: grp(/language/i), tools: grp(/tool/i), backend: grp(/backend/i) };
  return d.chat.faq.map((f) => ({ ...f, answer: f.answer.replace(/\{(\w+)\}/g, (m, k) => (t[k] != null ? t[k] : m)) }));
}

/* ---------- EFFECTS ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover)").matches;

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}

function confettiBurst(x, y) {
  if (reduceMotion) return;
  const cv = $("confetti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = [getComputedStyle(html).getPropertyValue("--green").trim() || "#0f9e68", "#2563eb", "#f0a92b", "#ef4444", "#a855f7", "#22d3ee"];
  const ps = Array.from({ length: 110 }, () => {
    const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 9;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0], life: 1 };
  });
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 16.7, 2); last = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    ps.forEach((p) => {
      p.vy += 0.28 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= 0.009 * dt;
      if (p.life > 0 && p.y < cv.height + 20) {
        alive = true; ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
  };
  requestAnimationFrame(frame);
}

function initTyping(phrases) {
  const el = $("heroRole");
  if (!phrases || !phrases.length) return;
  if (reduceMotion) { el.textContent = phrases[0]; return; }
  let i = 0, j = 0, del = false;
  const tick = () => {
    const word = phrases[i];
    j += del ? -1 : 1;
    el.textContent = word.slice(0, j);
    let wait = del ? 35 : 75;
    if (!del && j === word.length) { del = true; wait = 1700; }
    else if (del && j === 0) { del = false; i = (i + 1) % phrases.length; wait = 350; }
    setTimeout(tick, wait);
  };
  el.textContent = ""; tick();
}

function initHeroFx(d) {
  $("heroBadges").innerHTML = (d.hero.badges || []).map((b) => `<span><i class="fas ${esc(b.icon)}"></i>${esc(b.text)}</span>`).join("");
  // CV download: toast + confetti
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[download]");
    if (a && a.getAttribute("href") && a.getAttribute("href") !== "#") { toast("Downloading CV…"); confettiBurst(e.clientX, e.clientY); }
  });
}

function initInteractions() {
  // ripple on buttons
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".btn"); if (!b || reduceMotion) return;
    const r = b.getBoundingClientRect(), size = Math.max(r.width, r.height);
    const s = document.createElement("span"); s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });
  // magnetic pull on buttons and social icons
  if (canHover && !reduceMotion) {
    document.addEventListener("mousemove", (e) => {
      const t = e.target.closest && e.target.closest(".btn, .socials a");
      if (!t) return;
      t.classList.add("mag");
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
      t.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
    });
    document.addEventListener("mouseout", (e) => {
      const t = e.target.closest && e.target.closest(".btn, .socials a");
      if (t && !t.contains(e.relatedTarget)) { t.style.setProperty("--mx", "0px"); t.style.setProperty("--my", "0px"); }
    });
  }
}

function initScrollFx() {
  const bar = $("scrollProgress"), nav = $("navbar"), top = $("toTop");
  const on = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    nav.classList.toggle("scrolled", scrollY > 10);
    top.classList.toggle("show", scrollY > 600);
  };
  addEventListener("scroll", on, { passive: true }); on();
  top.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
}

function initReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const groups = [
    [".sec-head", ""], [".exp-side", "from-left"], ["#expPanels", "from-right"],
    [".news-item", ""], [".sign-wrap", ""], ["#projFilters", ""], [".proj", ""], [".contact-card", "from-left"], [".contact-form", "from-right"], [".footer-grid > div", ""],
  ];
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  groups.forEach(([sel, dir]) => document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add("reveal"); if (dir) el.classList.add(dir);
    el.style.setProperty("--d", Math.min(i, 5) * 0.09 + "s");
    io.observe(el);
  }));
}

function finishLoading() {
  const pl = $("preloader"), go = () => {
    pl.classList.add("done"); document.body.classList.remove("pre"); document.body.classList.add("intro");
    setTimeout(() => pl.remove(), 600);
  };
  const wait = reduceMotion ? 0 : Math.max(0, 900 - performance.now());
  setTimeout(go, wait);
}
setTimeout(() => { if (document.body.classList.contains("pre")) { $("preloader") && $("preloader").classList.add("done"); document.body.classList.remove("pre"); } }, 4000);

/* ---------- START ---------- */
async function init() {
  try {
    const res = await fetch("data.json?v=1795170720", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    renderNav(d.nav);
    renderHero(d);
    renderNews(d.news);
    renderExpertise(d);
    renderProjects(d.projects);
    renderContact(d);
    renderFooter(d);
    initSearch(d.nav);
    initChat({ ...d.chat, faq: chatFaq(d) });
    initSpy();
    loadRepoStats();
    initTyping(d.hero.typed);
    initHeroFx(d);
    initInteractions();
    initScrollFx();
    initReveal();
  } catch (err) {
    console.error(err);
    document.body.classList.remove("pre");
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="position:relative;z-index:500;margin:110px 20px 0;padding:14px;background:#fee;color:#a00;border-radius:8px">Could not load data.json. In VS Code, right-click index.html and choose "Open with Live Server" (double-clicking the file will not work).</p>'
    );
  }
}
init().finally(finishLoading);
