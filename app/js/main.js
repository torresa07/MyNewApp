// Router, shell and deadline alerts.

import { state, save, subscribe, upcoming, overdue, resetAll } from "./store.js";
import { esc, relDays, fmtDate, fmtTime, daysUntil, todayKey, DEADLINE_TYPES, openModal, closeModal, toast } from "./ui.js";
import { projectForm, projectName } from "./forms.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderProjects } from "./views/projects.js";
import { renderCalendar } from "./views/calendar.js";
import { renderJournal } from "./views/journal.js";
import { renderChecklist } from "./views/checklist.js";
import { renderReview } from "./views/review.js";
import { renderInspiration } from "./views/inspiration.js";

const routes = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  projects: { title: "Projects", render: renderProjects },
  calendar: { title: "Calendar & deadlines", render: renderCalendar },
  journal: { title: "Design journal & mood board", render: renderJournal },
  checklist: { title: "Final submission checklist", render: renderChecklist },
  review: { title: "Submission review", render: renderReview },
  inspiration: { title: "Precedents & ideas", render: renderInspiration },
};

const view = document.getElementById("view");
let cleanup = null;

function parseHash() {
  const [, name = "dashboard", ...rest] = location.hash.split("/");
  return { name: routes[name] ? name : "dashboard", params: rest };
}

function render() {
  const { name, params } = parseHash();
  const route = routes[name];
  if (typeof cleanup === "function") cleanup();
  document.getElementById("pageTitle").textContent = route.title;
  document.title = `${route.title} — Atelier`;
  document.querySelectorAll(".side__nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.route === name));
  document.querySelector(".side__nav a.is-active")?.scrollIntoView({ block: "nearest", inline: "center" });
  cleanup = route.render(view, params) || null;
  renderAlerts();
}

let lastRoute = "";
window.addEventListener("hashchange", () => {
  render();
  if (location.hash !== lastRoute) {
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    lastRoute = location.hash;
  }
});
subscribe(render);

/* ---------- Deadline alerts ---------- */

function alertItems() {
  const days = state.settings.alertDays ?? 3;
  return [...overdue(), ...upcoming(days)];
}

function renderAlerts() {
  const items = alertItems();
  const count = document.getElementById("bellCount");
  count.hidden = !items.length;
  count.textContent = items.length;

  const banner = document.getElementById("alertBanner");
  const urgent = items.filter((e) => daysUntil(e.date) <= 1);
  const dismissedKey = "atelier.banner." + todayKey();
  let dismissed = false;
  try { dismissed = sessionStorage.getItem(dismissedKey) === "1"; } catch (_) {}
  if (urgent.length && !dismissed) {
    const first = urgent[0];
    banner.innerHTML = `
      <div class="banner">
        <span class="banner__dot" style="background:${DEADLINE_TYPES[first.type]?.color}"></span>
        <span><strong>${esc(relDays(first.date))}:</strong> ${esc(first.title)}${urgent.length > 1 ? ` <span class="muted">and ${urgent.length - 1} more due soon</span>` : ""}</span>
        <a href="#/calendar" class="banner__link">View deadlines</a>
        <button class="icon-btn" type="button" aria-label="Dismiss" id="bannerClose">×</button>
      </div>`;
    document.getElementById("bannerClose").onclick = () => {
      try { sessionStorage.setItem(dismissedKey, "1"); } catch (_) {}
      banner.innerHTML = "";
    };
  } else {
    banner.innerHTML = "";
  }
}

const pop = document.getElementById("alertsPop");
document.getElementById("bellBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (!pop.hidden) return (pop.hidden = true);
  const items = alertItems();
  const canNotify = "Notification" in window;
  pop.innerHTML = `
    <h3>Coming up</h3>
    ${items.length ? `<ul class="alert-list">${items.map((ev) => `
      <li>
        <span class="tag-dot" style="background:${DEADLINE_TYPES[ev.type]?.color}"></span>
        <div><strong>${esc(ev.title)}</strong><br /><span class="muted">${esc(projectName(ev.projectId))} · ${esc(fmtDate(ev.date))}${ev.time ? " " + esc(fmtTime(ev.time)) : ""}</span></div>
        <span class="chip ${daysUntil(ev.date) < 0 ? "chip--late" : daysUntil(ev.date) <= 1 ? "chip--soon" : ""}">${esc(relDays(ev.date))}</span>
      </li>`).join("")}</ul>` : `<p class="muted">Nothing due in the next ${state.settings.alertDays} days. 🌿</p>`}
    ${canNotify && Notification.permission !== "granted" ? `<button class="btn btn--small btn--ghost" id="enableNotif" type="button">Turn on reminders</button>` : ""}
  `;
  pop.hidden = false;
  document.getElementById("enableNotif")?.addEventListener("click", async () => {
    const result = await Notification.requestPermission();
    toast(result === "granted" ? "Reminders on — you'll be notified when you open Atelier." : "Reminders were not allowed.");
    if (result === "granted") notifyDue();
    pop.hidden = true;
  });
});
document.addEventListener("click", (e) => {
  if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
});

// Browser notifications for items due today/tomorrow, once per item per day.
function notifyDue() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = todayKey();
  const notified = state.settings.notified || {};
  let changed = false;
  for (const ev of alertItems().filter((e) => daysUntil(e.date) <= 1)) {
    const key = `${ev.id}:${today}`;
    if (notified[key]) continue;
    try {
      new Notification(`${relDays(ev.date)}: ${ev.title}`, { body: projectName(ev.projectId), icon: "../favicon.svg" });
    } catch (_) {}
    notified[key] = true;
    changed = true;
  }
  if (changed) {
    // Drop stale keys so this doesn't grow forever.
    for (const k of Object.keys(notified)) if (!k.endsWith(today)) delete notified[k];
    state.settings.notified = notified;
    save();
  }
}

/* ---------- Shell buttons ---------- */

document.getElementById("quickNew").addEventListener("click", () => projectForm());

document.getElementById("settingsBtn").addEventListener("click", () => {
  openModal("Settings & data", `
    <h4>Appearance</h4>
    ${window.atelierTheme ? window.atelierTheme.cardsHtml() : ""}
    <label class="field"><span>Alert me about deadlines this many days ahead</span>
      <input type="number" name="alertDays" min="1" max="30" value="${esc(state.settings.alertDays ?? 3)}" /></label>
    <p class="muted small">Everything you add is saved privately in this browser on this device.</p>
    <div class="settings-actions">
      <button type="button" class="btn btn--ghost btn--small" id="exportData">Download a backup</button>
      <label class="btn btn--ghost btn--small">Restore backup<input type="file" accept="application/json" id="importData" hidden /></label>
      <button type="button" class="btn btn--ghost btn--small" id="sampleData">Load sample projects</button>
      <button type="button" class="btn btn--ghost btn--small danger" id="clearData">Clear everything</button>
    </div>
    <p class="muted small">Backups include your text, dates and checklists. Images stay in this browser.</p>
  `, {
    onSubmit(fd) {
      state.settings.alertDays = Math.max(1, Math.min(30, Number(fd.get("alertDays")) || 3));
      save();
    },
  });
  window.atelierTheme?.refresh();
  document.getElementById("exportData").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atelier-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById("importData").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.projects)) throw new Error("bad file");
      Object.assign(state, data);
      save();
      closeModal();
      toast("Backup restored");
    } catch (_) {
      toast("That file isn't an Atelier backup.");
    }
  };
  document.getElementById("sampleData").onclick = async () => {
    if (!confirm("Replace everything with the sample projects?")) return;
    await resetAll({ withSample: true });
    closeModal();
  };
  document.getElementById("clearData").onclick = async () => {
    if (!confirm("Delete all projects, notes and images? This can't be undone.")) return;
    await resetAll();
    closeModal();
    toast("All data cleared");
  };
});

render();
notifyDue();
