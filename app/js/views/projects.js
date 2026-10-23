import { state, save, getProject, projectProgress, checklistProgress, allEvents } from "../store.js";
import { esc, fmtDate, relDays, todayKey, emptyState, toast } from "../ui.js";
import { projectForm, taskForm, deadlineForm } from "../forms.js";
import { deadlineRow } from "./dashboard.js";

let taskFilter = "all";

export function renderProjects(root, [id]) {
  if (id) return renderDetail(root, id);

  const active = state.projects.filter((p) => !p.archived);
  const archived = state.projects.filter((p) => p.archived);
  root.innerHTML = `
    <div class="page-head">
      <p class="muted">All your studio projects. Click one to manage its tasks and deadlines.</p>
      <button class="btn" id="newProject" type="button">+ New project</button>
    </div>
    ${active.length ? `<div class="project-cards project-cards--grid">${active.map(card).join("")}</div>` :
      emptyState("No active projects", "Create a project for each studio brief.", "")}
    ${archived.length ? `<h2 class="section-title">Archived</h2><div class="project-cards project-cards--grid is-archived">${archived.map(card).join("")}</div>` : ""}
  `;
  root.querySelector("#newProject").onclick = () => projectForm();
}

function card(p) {
  const pct = projectProgress(p.id);
  return `
    <a class="project-card" href="#/projects/${esc(p.id)}" style="--accent:${esc(p.color)}">
      <span class="project-card__phase">${esc(p.phase || "")}</span>
      <h3>${esc(p.name)}</h3>
      <p class="muted small">${esc(p.course || "")}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="project-card__foot"><span>${pct}% complete</span><span>${p.finalDate ? "Final " + esc(fmtDate(p.finalDate)) : "No final date"}</span></div>
    </a>`;
}

function renderDetail(root, id) {
  const p = getProject(id);
  if (!p) {
    root.innerHTML = emptyState("Project not found", "It may have been deleted.", `<a class="btn" href="#/projects">Back to projects</a>`);
    return;
  }
  const tasks = state.tasks
    .filter((t) => t.projectId === id)
    .filter((t) => taskFilter === "all" || t.kind === taskFilter)
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9").localeCompare(b.due || "9"));
  const events = allEvents().filter((e) => e.projectId === id && e.kind !== "task" && !e.done);
  const pct = projectProgress(id);
  const cl = checklistProgress(id);

  root.innerHTML = `
    <a href="#/projects" class="link back">← All projects</a>
    <section class="project-hero" style="--accent:${esc(p.color)}">
      <div>
        <p class="eyebrow">${esc(p.course || "Studio project")} · ${esc(p.phase || "")}</p>
        <h1>${esc(p.name)}</h1>
        ${p.description ? `<p class="muted">${esc(p.description)}</p>` : ""}
        <div class="bar bar--lg"><span style="width:${pct}%"></span></div>
        <p class="small muted">${pct}% complete · ${cl.done}/${cl.total} final items done${p.finalDate ? ` · Final submission ${esc(fmtDate(p.finalDate, { weekday: "short", month: "long", day: "numeric" }))} (${esc(relDays(p.finalDate))})` : ""}</p>
      </div>
      <div class="project-hero__actions">
        <button class="btn btn--ghost btn--small" id="editProject" type="button">Edit</button>
        <button class="btn btn--ghost btn--small" id="archiveProject" type="button">${p.archived ? "Restore" : "Archive"}</button>
        <button class="btn btn--ghost btn--small danger" id="deleteProject" type="button">Delete</button>
      </div>
    </section>

    <nav class="quick-links">
      <a href="#/checklist/${esc(id)}">☑ Final checklist</a>
      <a href="#/journal/${esc(id)}">✎ Journal &amp; mood board</a>
      <a href="#/review/${esc(id)}">◎ Review submission</a>
    </nav>

    <div class="detail-grid">
      <section class="panel">
        <div class="panel__head">
          <h2>Model &amp; drawing tasks</h2>
          <button class="btn btn--small" id="addTask" type="button">+ Task</button>
        </div>
        <div class="seg" role="tablist">
          ${[["all", "All"], ["model", "Models"], ["drawing", "Drawings"], ["other", "Other"]].map(([k, l]) =>
            `<button type="button" class="${taskFilter === k ? "is-on" : ""}" data-filter="${k}">${l}</button>`).join("")}
        </div>
        ${tasks.length ? `<ul class="task-list">${tasks.map((t) => `
          <li class="task ${t.done ? "is-done" : ""}">
            <label><input type="checkbox" data-toggle="${esc(t.id)}" ${t.done ? "checked" : ""} /><span class="task__title">${esc(t.title)}</span></label>
            <span class="task__meta">
              <span class="kind kind--${esc(t.kind)}">${t.kind === "model" ? "Model" : t.kind === "drawing" ? "Drawing" : "Task"}</span>
              ${t.due ? `<span class="${!t.done && t.due < todayKey() ? "late-text" : ""}">${esc(relDays(t.due))}</span>` : ""}
              <button class="link-btn" data-edit="${esc(t.id)}" type="button">Edit</button>
              <button class="link-btn" data-del="${esc(t.id)}" type="button" aria-label="Delete task">Delete</button>
            </span>
          </li>`).join("")}</ul>` : `<p class="muted">No tasks here yet.</p>`}
      </section>

      <section class="panel">
        <div class="panel__head">
          <h2>Deadlines</h2>
          <button class="btn btn--small" id="addDeadline" type="button">+ Deadline</button>
        </div>
        ${events.length ? `<ul class="deadline-list">${events.map((e) => deadlineRow(e).replace("<li class=\"deadline\">", `<li class="deadline" data-deadline="${esc(e.id)}">`)).join("")}</ul>` : `<p class="muted">No deadlines yet.</p>`}
      </section>
    </div>
  `;

  root.querySelector("#editProject").onclick = () => projectForm(p);
  root.querySelector("#archiveProject").onclick = () => { p.archived = !p.archived; save(); toast(p.archived ? "Project archived" : "Project restored"); };
  root.querySelector("#deleteProject").onclick = () => {
    if (!confirm(`Delete "${p.name}" and all its tasks, notes and checklist?`)) return;
    state.projects = state.projects.filter((x) => x.id !== id);
    state.tasks = state.tasks.filter((x) => x.projectId !== id);
    state.deadlines = state.deadlines.filter((x) => x.projectId !== id);
    state.journal = state.journal.filter((x) => x.projectId !== id);
    state.mood = state.mood.filter((x) => x.projectId !== id);
    delete state.checklist[id];
    location.hash = "#/projects";
    save();
  };
  root.querySelector("#addTask").onclick = () => taskForm(id);
  root.querySelector("#addDeadline").onclick = () => deadlineForm(id);
  root.querySelectorAll("[data-filter]").forEach((b) => (b.onclick = () => { taskFilter = b.dataset.filter; renderDetail(root, id); }));
  root.querySelectorAll("[data-toggle]").forEach((el) => (el.onchange = () => {
    state.tasks.find((t) => t.id === el.dataset.toggle).done = el.checked;
    save();
  }));
  root.querySelectorAll("[data-edit]").forEach((el) => (el.onclick = () => taskForm(id, state.tasks.find((t) => t.id === el.dataset.edit))));
  root.querySelectorAll("[data-del]").forEach((el) => (el.onclick = () => {
    state.tasks = state.tasks.filter((t) => t.id !== el.dataset.del);
    save();
  }));
  root.querySelectorAll("[data-deadline]").forEach((el) => {
    const d = state.deadlines.find((x) => x.id === el.dataset.deadline);
    if (d) { el.classList.add("is-clickable"); el.onclick = () => deadlineForm(id, d); }
    else el.onclick = () => projectForm(p); // final submission row
  });
}
