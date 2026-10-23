import { state, save, activeProjects, projectProgress, upcoming, overdue, nextFinal, checklistProgress } from "../store.js";
import { esc, todayKey, relDays, fmtDate, fmtTime, daysUntil, DEADLINE_TYPES, emptyState } from "../ui.js";
import { projectForm, taskForm, projectName } from "../forms.js";
import { countdownHtml, startCountdown } from "./countdown.js";
import { openImport } from "../import.js";

export function renderDashboard(root) {
  const projects = activeProjects();
  const today = todayKey();
  const todayTasks = state.tasks.filter((t) => t.due && t.due <= today && (!t.done || t.due === today));
  const soon = upcoming(14).slice(0, 6);
  const late = overdue();
  const final = nextFinal();

  // Overall progress across every active project's tasks and checklist.
  let done = 0, total = 0;
  for (const p of projects) {
    const tasks = state.tasks.filter((t) => t.projectId === p.id);
    const cl = checklistProgress(p.id);
    done += tasks.filter((t) => t.done).length + cl.done;
    total += tasks.length + cl.total;
  }
  const overall = total ? Math.round((done / total) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  root.innerHTML = `
    <section class="dash-head">
      <div>
        <p class="eyebrow">${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</p>
        <h1>${greeting}.</h1>
        <p class="muted">${todayTasks.filter((t) => !t.done).length} tasks today · ${upcoming(7).length} deadlines this week${late.length ? ` · <span class="late-text">${late.length} overdue</span>` : ""}</p>
      </div>
      <div class="dash-head__actions">
        <button class="btn" id="dashNewProject" type="button">+ Create project</button>
        <button class="btn btn--ghost" id="dashImport" type="button">⇪ Import PDF</button>
        <button class="btn btn--ghost" id="dashNewTask" type="button">+ Add task</button>
      </div>
    </section>

    <section class="stats">
      <div class="stat"><span class="stat__num">${projects.length}</span><span class="stat__label">Active projects</span></div>
      <div class="stat"><span class="stat__num">${todayTasks.filter((t) => !t.done).length}</span><span class="stat__label">Tasks due today</span></div>
      <div class="stat"><span class="stat__num">${upcoming(7).length}</span><span class="stat__label">Deadlines this week</span></div>
      <div class="stat stat--progress">
        <div class="ring" style="--p:${overall}"><span>${overall}%</span></div>
        <span class="stat__label">Overall progress</span>
      </div>
    </section>

    <div class="dash-grid">
      <section class="panel panel--countdown">
        ${final ? countdownHtml(final) : `<div class="panel__head"><h2>Final submission</h2></div><p class="muted">Add a final submission date to a project to start the countdown.</p>`}
      </section>

      <section class="panel">
        <div class="panel__head"><h2>Upcoming deadlines</h2><a href="#/calendar" class="link">Calendar</a></div>
        ${[...late, ...soon].length ? `<ul class="deadline-list">${[...late, ...soon].slice(0, 5).map(deadlineRow).join("")}</ul>` : `<p class="muted">No deadlines in the next two weeks.</p>`}
      </section>

      <section class="panel panel--wide">
        <div class="panel__head"><h2>Tasks due today</h2><a href="#/projects" class="link">All tasks</a></div>
        ${todayTasks.length ? `<ul class="task-list">${todayTasks.map(taskRow).join("")}</ul>` : `<p class="muted">Nothing due today. A good day to sketch. ✏️</p>`}
      </section>

      <section class="panel panel--wide">
        <div class="panel__head"><h2>Active projects</h2><a href="#/projects" class="link">View all</a></div>
        ${projects.length ? `<div class="project-cards">${projects.map(projectCard).join("")}</div>` :
          emptyState("No projects yet", "Upload your syllabus or project brief and Atelier will set everything up — or start from scratch.", `<div class="btn-group center"><button class="btn" data-import type="button">⇪ Import a PDF</button><button class="btn btn--ghost" data-new-project type="button">+ Create project</button></div>`)}
      </section>
    </div>
  `;

  root.querySelector("#dashNewProject").onclick = () => projectForm();
  root.querySelector("#dashNewTask").onclick = () => taskForm(projects[0]?.id);
  root.querySelector("[data-new-project]")?.addEventListener("click", () => projectForm());
  root.querySelector("#dashImport").onclick = () => openImport();
  root.querySelector("[data-import]")?.addEventListener("click", () => openImport());
  root.querySelectorAll("[data-toggle-task]").forEach((el) =>
    el.addEventListener("change", () => {
      const t = state.tasks.find((x) => x.id === el.dataset.toggleTask);
      t.done = el.checked;
      save();
    })
  );

  return final ? startCountdown(root, final) : null;
}

function taskRow(t) {
  const late = t.due < todayKey() && !t.done;
  return `
    <li class="task ${t.done ? "is-done" : ""}">
      <label>
        <input type="checkbox" data-toggle-task="${esc(t.id)}" ${t.done ? "checked" : ""} />
        <span class="task__title">${esc(t.title)}</span>
      </label>
      <span class="task__meta"><span class="kind kind--${esc(t.kind)}">${t.kind === "model" ? "Model" : t.kind === "drawing" ? "Drawing" : "Task"}</span>
      ${esc(projectName(t.projectId))}${late ? ` · <span class="late-text">${esc(relDays(t.due))}</span>` : ""}</span>
    </li>`;
}

function projectCard(p) {
  const pct = projectProgress(p.id);
  const openTasks = state.tasks.filter((t) => t.projectId === p.id && !t.done).length;
  return `
    <a class="project-card" href="#/projects/${esc(p.id)}" style="--accent:${esc(p.color)}">
      <span class="project-card__phase">${esc(p.phase || "")}</span>
      <h3>${esc(p.name)}</h3>
      <p class="muted small">${esc(p.course || "")}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="project-card__foot">
        <span>${pct}% complete</span>
        <span>${openTasks} open tasks${p.finalDate ? ` · Final ${esc(fmtDate(p.finalDate))}` : ""}</span>
      </div>
    </a>`;
}

export function deadlineRow(ev) {
  const n = daysUntil(ev.date);
  return `
    <li class="deadline">
      <span class="tag-dot" style="background:${DEADLINE_TYPES[ev.type]?.color}"></span>
      <div class="deadline__body">
        <strong>${esc(ev.title)}</strong>
        <span class="muted small">${esc(projectName(ev.projectId))} · ${esc(fmtDate(ev.date, { weekday: "short", month: "short", day: "numeric" }))}${ev.time ? " · " + esc(fmtTime(ev.time)) : ""}</span>
      </div>
      <span class="chip ${n < 0 ? "chip--late" : n <= 2 ? "chip--soon" : ""}">${esc(relDays(ev.date))}</span>
    </li>`;
}
