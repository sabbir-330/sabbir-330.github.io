/* Nav: every link plays the same rounded-border pulse after it is clicked */
(function () {
  const box = document.getElementById("navLinks");
  if (!box) return;
  box.addEventListener("click", (e) => {
    const a = e.target.closest(".nav-link");
    if (!a) return;
    a.dataset.fx = "0";
    a.classList.remove("fx"); void a.offsetWidth; a.classList.add("fx");
    clearTimeout(a._fxT); a._fxT = setTimeout(() => a.classList.remove("fx"), 950);
  });
})();
