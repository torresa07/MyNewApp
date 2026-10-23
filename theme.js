// Colour themes: White, Soft paper (the original look) or Dark.
// Loaded in <head> (not deferred) so the page never flashes the wrong colours.
// The choice is remembered per browser and shared by the landing page and app.
(function () {
  var KEY = "atelier.theme";
  var THEMES = [
    { id: "white", label: "White", hint: "Clean white background", swatch: ["#ffffff", "#8f9f92"] },
    { id: "paper", label: "Soft paper", hint: "Warm, tracing-paper tones", swatch: ["#f6f3ed", "#a8b59a"] },
    { id: "dark", label: "Dark", hint: "Easy on the eyes at night", swatch: ["#1c1e1b", "#9db2a2"] },
  ];
  var ICONS = {
    white: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    paper: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3M9 11h6M9 15h6"/>',
    dark: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  };
  var root = document.documentElement;

  function getPref() {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === v) return v;
    return "paper"; // default, and what older "light" / "system" choices become
  }

  function icon(id) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[id] + "</svg>";
  }

  function apply() {
    var pref = getPref();
    root.dataset.theme = pref;
    root.dataset.mode = pref;
    var opts = document.querySelectorAll("[data-theme-value]");
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].dataset.themeValue === pref;
      opts[i].classList.toggle("is-current", on);
      opts[i].setAttribute(opts[i].getAttribute("role") === "menuitemradio" ? "aria-checked" : "aria-pressed", String(on));
    }
    var btns = document.querySelectorAll(".theme-menu__btn");
    for (var j = 0; j < btns.length; j++) btns[j].innerHTML = icon(pref) + '<span class="sr-only">Theme</span>';
  }

  function set(pref) {
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply();
  }

  // Swatch preview + name, used in the menu and the settings cards.
  function optionHtml(t, role) {
    return '<button type="button" ' + (role ? 'role="' + role + '" ' : "") + 'class="theme-opt" data-theme-value="' + t.id + '">' +
      '<span class="theme-opt__sw" style="background:linear-gradient(135deg,' + t.swatch[0] + ' 50%,' + t.swatch[1] + ' 50%)"></span>' +
      '<span class="theme-opt__text"><strong>' + t.label + "</strong><small>" + t.hint + "</small></span></button>";
  }

  // Turns every <div data-theme-menu> into a button with a dropdown.
  function buildMenus() {
    var hosts = document.querySelectorAll("[data-theme-menu]:not(.theme-menu)");
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      host.classList.add("theme-menu");
      host.innerHTML =
        '<button type="button" class="theme-menu__btn" aria-haspopup="true" aria-expanded="false" title="Choose a theme"></button>' +
        '<div class="theme-menu__pop" role="menu" aria-label="Theme" hidden><p class="theme-menu__title">Theme</p>' +
        THEMES.map(function (t) { return optionHtml(t, "menuitemradio"); }).join("") + "</div>";
    }
    apply();
  }

  function closeMenus(except) {
    var pops = document.querySelectorAll(".theme-menu__pop");
    for (var i = 0; i < pops.length; i++) {
      if (pops[i] === except) continue;
      pops[i].hidden = true;
      pops[i].previousElementSibling.setAttribute("aria-expanded", "false");
    }
  }

  apply();
  document.addEventListener("DOMContentLoaded", buildMenus);

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".theme-menu__btn");
    if (btn) {
      var pop = btn.nextElementSibling;
      closeMenus(pop);
      pop.hidden = !pop.hidden;
      btn.setAttribute("aria-expanded", String(!pop.hidden));
      if (!pop.hidden) pop.querySelector(".is-current, .theme-opt").focus();
      return;
    }
    var opt = e.target.closest && e.target.closest("[data-theme-value]");
    if (opt) {
      set(opt.dataset.themeValue);
      if (opt.closest(".theme-menu")) closeMenus();
      return;
    }
    if (!(e.target.closest && e.target.closest(".theme-menu__pop"))) closeMenus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenus();
  });

  window.atelierTheme = {
    get: getPref,
    set: set,
    refresh: apply,
    cardsHtml: function () {
      return '<div class="theme-cards" role="group" aria-label="Theme">' + THEMES.map(function (t) { return optionHtml(t); }).join("") + "</div>";
    },
  };
})();
