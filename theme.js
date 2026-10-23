// Light / dark / system theme. Loaded in <head> (not deferred) so the page
// never flashes the wrong colours. The choice is remembered per browser.
(function () {
  var KEY = "atelier.theme";
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var root = document.documentElement;

  function getPref() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (e) {}
    return "system";
  }

  function apply() {
    var pref = getPref();
    var mode = pref === "system" ? (media.matches ? "dark" : "light") : pref;
    root.dataset.theme = pref;
    root.dataset.mode = mode;
    var buttons = document.querySelectorAll("[data-theme-value]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].dataset.themeValue === pref));
    }
  }

  function set(pref) {
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply();
  }

  apply();
  media.addEventListener("change", apply);
  document.addEventListener("DOMContentLoaded", apply);
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-theme-value]");
    if (btn) set(btn.dataset.themeValue);
  });

  window.atelierTheme = { get: getPref, set: set };
})();
