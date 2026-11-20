/* Dark mode background: slow drifting dots joined by thin lines, fixed behind the whole page.
   Pauses when the tab is hidden, static if reduced motion. */
(function () {
  const cv = document.createElement("canvas");
  cv.className = "hero-net"; cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  const ctx = cv.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dots = [], mx = -999, my = -999, dark = true;
  const LINK = 130;

  function theme() { dark = document.documentElement.getAttribute("data-theme") === "dark"; if (!dark) ctx.clearRect(0, 0, w, h); }
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, Math.max(28, (w * h) / 16000)));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.3 + .8
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const rgb = "76,201,216";
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      if (!still) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) { ctx.strokeStyle = `rgba(${rgb},${.28 * (1 - d / LINK)})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const dm = Math.hypot(a.x - mx, a.y - my);
      if (dm < 160) { ctx.strokeStyle = `rgba(${rgb},${.35 * (1 - dm / 160)})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke(); }
      ctx.fillStyle = `rgba(${rgb},.7)`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
  }
  function loop() { if (dark && !document.hidden) draw(); requestAnimationFrame(loop); }

  size(); theme();
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", size);
  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener("mouseleave", () => { mx = my = -999; });
  if (still) { if (dark) draw(); } else loop();
})();

/* Profile picture: orbiting rings, dots and soft pulses behind the photo */
(function () {
  const ph = document.getElementById("heroPhotoBox");
  if (!ph) return;
  ph.insertAdjacentHTML("afterbegin",
    '<div class="hero-orbit" aria-hidden="true"><i class="o-pulse p1"></i><i class="o-pulse p2"></i><i class="o-ring r1"></i><i class="o-ring r2"></i><b class="o-dot d1"></b><b class="o-dot d2"></b><b class="o-dot d3"></b></div>');
})();
