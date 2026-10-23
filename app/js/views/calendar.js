import { state, save, allEvents, overdue, nextFinal, getProject } from "../store.js";
import { esc, toKey, addDays, todayKey, daysUntil, relDays, fmtDate, fmtTime, DEADLINE_TYPES } from "../ui.js";
import { deadlineForm, taskForm, projectForm, projectName } from "../forms.js";
import { deadlineRow } from "./dashboard.js";
import { countdownHtml, startCountdown } from "./countdown.js";

let mode = "month";
let cursor = new Date();
let typeFilter = new Set(Object.keys(DEADLINE_TYPES));
let selectedDay = todayKey();
const isPhone = () => window.matchMedia("(max-width: 600px)").matches;

export function renderCalendar(root) {
  const events = allEvents().filter((e) => typeFilter.has(e.type));
  const byDay = new Map();
  for (const e of events) {
    if (!byDay.has(e.date)) byDay.set(e.date, []);
    byDay.get(e.date).push(e);
  }
  const final = nextFinal();
  const late = overdue().filter((e) => typeFilter.has(e.type));
  const upcomingList = events.filter((e) => !e.done && daysUntil(e.date) >= 0);
  const thisWeek = upcomingList.filter((e) => daysUntil(e.date) <= 7);
  const later = upcomingList.filter((e) => daysUntil(e.date) > 7).slice(0, 10);

  root.innerHTML = `
    <div class="cal-layout">
      <section class="panel cal-panel">
        <div class="cal-toolbar">
          <div class="cal-nav">
            <button class="icon-btn" id="prev" type="button" aria-label="Previous">‹</button>
            <h2 id="calTitle">${esc(title())}</h2>
            <button class="icon-btn" id="next" type="button" aria-label="Next">›</button>
            <button class="btn btn--ghost btn--small" id="today" type="button">Today</button>
          </div>
          <div class="cal-tools">
            <div class="seg">
              <button type="button" class="${mode === "month" ? "is-on" : ""}" data-mode="month">Month</button>
              <button type="button" class="${mode === "week" ? "is-on" : ""}" data-mode="week">Week</button>
            </div>
            <button class="btn btn--small" id="addDeadline" type="button">+ Deadline</button>
          </div>
        </div>
        <div class="legend">
          ${Object.entries(DEADLINE_TYPES).map(([k, v]) => `
            <label class="legend__item ${typeFilter.has(k) ? "" : "is-off"}">
              <input type="checkbox" data-type="${k}" ${typeFilter.has(k) ? "checked" : ""} />
              <span class="tag-dot" style="background:${v.color}"></span>${esc(v.label)}
            </label>`).join("")}
        </div>
        ${mode === "month" ? monthGrid(byDay) : weekGrid(byDay)}
        ${mode === "month" ? dayAgenda(byDay) : ""}
      </section>

      <aside class="cal-side">
        <section class="panel panel--countdown">
          ${final ? countdownHtml(final) : `<h2>Final submission</h2><p class="muted">Set a final date on a project to see the countdown.</p>`}
        </section>
        <section class="panel">
          <div class="panel__head"><h2>Deadline tracker</h2></div>
          ${late.length ? `<h3 class="group-title late-text">Overdue</h3><ul class="deadline-list">${late.map(trackRow).join("")}</ul>` : ""}
          <h3 class="group-title">Next 7 days</h3>
          ${thisWeek.length ? `<ul class="deadline-list">${thisWeek.map(trackRow).join("")}</ul>` : `<p class="muted small">Nothing this week.</p>`}
          <h3 class="group-title">Later</h3>
          ${later.length ? `<ul class="deadline-list">${later.map(trackRow).join("")}</ul>` : `<p class="muted small">Nothing scheduled yet.</p>`}
        </section>
      </aside>
    </div>`;

  root.querySelector("#prev").onclick = () => { shift(-1); renderCalendar(root); };
  root.querySelector("#next").onclick = () => { shift(1); renderCalendar(root); };
  root.querySelector("#today").onclick = () => { cursor = new Date(); renderCalendar(root); };
  root.querySelector("#addDeadline").onclick = () => deadlineForm("");
  root.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { mode = b.dataset.mode; renderCalendar(root); }));
  root.querySelectorAll("[data-type]").forEach((el) => (el.onchange = () => {
    el.checked ? typeFilter.add(el.dataset.type) : typeFilter.delete(el.dataset.type);
    renderCalendar(root);
  }));
  root.querySelectorAll("[data-day]").forEach((el) => el.addEventListener("click", (e) => {
    if (e.target.closest("[data-event]") && !isPhone()) return;
    if (isPhone() && mode === "month") {
      selectedDay = el.dataset.day;
      renderCalendar(root);
      root.querySelector(".day-agenda")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    deadlineForm("", null, el.dataset.day);
  }));
  root.querySelectorAll("[data-event]").forEach((el) => el.addEventListener("click", () => {
    if (isPhone() && mode === "month" && el.closest(".cal-cell")) return; // the day tap shows the agenda instead
    openEvent(el.dataset.event);
  }));
  root.querySelector("[data-add-on]")?.addEventListener("click", (e) => deadlineForm("", null, e.currentTarget.dataset.addOn));
  root.querySelectorAll("[data-done]").forEach((el) => el.addEventListener("change", () => {
    const d = state.deadlines.find((x) => x.id === el.dataset.done);
    if (d) d.done = el.checked;
    const t = state.tasks.find((x) => x.id === el.dataset.done);
    if (t) t.done = el.checked;
    save();
  }));

  return final ? startCountdown(root, final) : null;
}

function openEvent(id) {
  const d = state.deadlines.find((x) => x.id === id);
  if (d) return deadlineForm(d.projectId, d);
  const t = state.tasks.find((x) => x.id === id);
  if (t) return taskForm(t.projectId, t);
  if (id.startsWith("final-")) {
    const p = getProject(id.slice(6));
    if (p) projectForm(p);
  }
}

function title() {
  if (mode === "month") return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const start = weekStart(cursor);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function shift(dir) {
  if (mode === "month") cursor = new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1);
  else cursor = addDays(cursor, 7 * dir);
}

function weekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // weeks start on Monday
  return addDays(d, -offset);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function chip(e) {
  return `<button type="button" class="ev ${e.done ? "is-done" : ""} ${e.kind === "final" ? "ev--final" : ""}" data-event="${esc(e.id)}" style="--c:${DEADLINE_TYPES[e.type]?.color}" title="${esc(e.title)} — ${esc(projectName(e.projectId))}">
    ${e.time ? `<span class="ev__time">${esc(fmtTime(e.time))}</span>` : ""}<span class="ev__title">${esc(e.title)}</span></button>`;
}

function monthGrid(byDay) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = weekStart(first);
  const today = todayKey();
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const day = addDays(start, i);
    const key = toKey(day);
    const items = byDay.get(key) || [];
    const other = day.getMonth() !== cursor.getMonth();
    cells += `
      <div class="cal-cell ${other ? "is-other" : ""} ${key === today ? "is-today" : ""} ${key === selectedDay ? "is-selected" : ""}" data-day="${key}" tabindex="0">
        <span class="cal-cell__num">${day.getDate()}</span>
        <div class="cal-cell__events">${items.slice(0, 3).map(chip).join("")}${items.length > 3 ? `<span class="more">+${items.length - 3} more</span>` : ""}</div>
      </div>`;
    if (i === 34 && addDays(start, 35).getMonth() !== cursor.getMonth()) break;
  }
  return `<div class="cal-month"><div class="cal-head">${WEEKDAYS.map((d) => `<span>${d}</span>`).join("")}</div><div class="cal-grid">${cells}</div></div>`;
}

// Phones: the list of the tapped day's deadlines, under the month grid.
function dayAgenda(byDay) {
  const items = byDay.get(selectedDay) || [];
  return `
    <div class="day-agenda">
      <div class="day-agenda__head">
        <h3>${esc(fmtDate(selectedDay, { weekday: "long", month: "long", day: "numeric" }))}</h3>
        <button type="button" class="btn btn--small btn--ghost" data-add-on="${selectedDay}">+ Add</button>
      </div>
      ${items.length ? `<div class="day-agenda__list">${items.map(chip).join("")}</div>` : `<p class="muted small">Nothing due this day.</p>`}
    </div>`;
}

function weekGrid(byDay) {
  const start = weekStart(cursor);
  const today = todayKey();
  return `<div class="cal-week">${WEEKDAYS.map((name, i) => {
    const day = addDays(start, i);
    const key = toKey(day);
    const items = byDay.get(key) || [];
    return `
      <div class="week-day ${key === today ? "is-today" : ""}" data-day="${key}">
        <div class="week-day__head"><span>${name}</span><strong>${day.getDate()}</strong></div>
        <div class="week-day__events">${items.length ? items.map(chip).join("") : `<span class="muted small">—</span>`}</div>
      </div>`;
  }).join("")}</div>`;
}

function trackRow(e) {
  const checkable = e.kind !== "final";
  return deadlineRow(e).replace(
    '<li class="deadline">',
    `<li class="deadline">${checkable ? `<input type="checkbox" class="deadline__check" data-done="${esc(e.id)}" aria-label="Mark done" />` : ""}`
  );
}
