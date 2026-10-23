// Create / edit forms shared across views.

import { state, save, getProject, nextProjectColor } from "./store.js";
import { esc, uid, openModal, projectOptions, todayKey, DEADLINE_TYPES, PROJECT_COLORS, toast } from "./ui.js";

export function projectForm(existing) {
  const p = existing || { name: "", course: "", phase: "Concept", color: nextProjectColor(), finalDate: "", finalTime: "09:00", description: "" };
  const phases = ["Site analysis", "Concept", "Schematic design", "Design development", "Final presentation"];
  openModal(existing ? "Edit project" : "New project", `
    <label class="field"><span>Project name</span><input name="name" required maxlength="80" value="${esc(p.name)}" placeholder="e.g. Riverside Library" /></label>
    <div class="field-row">
      <label class="field"><span>Studio / course</span><input name="course" maxlength="60" value="${esc(p.course)}" placeholder="e.g. Studio III" /></label>
      <label class="field"><span>Phase</span><select name="phase">${phases.map((ph) => `<option ${ph === p.phase ? "selected" : ""}>${ph}</option>`).join("")}</select></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Final submission date</span><input type="date" name="finalDate" value="${esc(p.finalDate)}" /></label>
      <label class="field"><span>Time</span><input type="time" name="finalTime" value="${esc(p.finalTime || "09:00")}" /></label>
    </div>
    <fieldset class="field"><legend>Colour</legend>
      <div class="swatch-pick">${PROJECT_COLORS.map((c) => `
        <label><input type="radio" name="color" value="${c}" ${c === p.color ? "checked" : ""} /><span style="background:${c}"></span></label>`).join("")}
      </div>
    </fieldset>
    <label class="field"><span>Brief / description</span><textarea name="description" rows="3" maxlength="600">${esc(p.description)}</textarea></label>
  `, {
    submitLabel: existing ? "Save changes" : "Create project",
    onSubmit(fd) {
      const data = Object.fromEntries(fd);
      if (existing) {
        Object.assign(existing, data);
      } else {
        const project = { id: uid(), createdAt: todayKey(), ...data };
        state.projects.push(project);
        location.hash = `#/projects/${project.id}`;
      }
      save();
      toast(existing ? "Project updated" : "Project created");
    },
  });
}

export function taskForm(projectId, existing) {
  if (!state.projects.length) return projectForm();
  const t = existing || { title: "", kind: "drawing", due: todayKey(), projectId };
  openModal(existing ? "Edit task" : "New task", `
    <label class="field"><span>Task</span><input name="title" required maxlength="120" value="${esc(t.title)}" placeholder="e.g. Cut 1:200 massing model" /></label>
    <div class="field-row">
      <label class="field"><span>Type</span><select name="kind">
        <option value="model" ${t.kind === "model" ? "selected" : ""}>Model making</option>
        <option value="drawing" ${t.kind === "drawing" ? "selected" : ""}>Drawing</option>
        <option value="other" ${t.kind === "other" ? "selected" : ""}>Other</option>
      </select></label>
      <label class="field"><span>Due</span><input type="date" name="due" value="${esc(t.due)}" /></label>
    </div>
    <label class="field"><span>Project</span><select name="projectId">${projectOptions(state.projects, t.projectId || projectId)}</select></label>
  `, {
    submitLabel: existing ? "Save" : "Add task",
    onSubmit(fd) {
      const data = Object.fromEntries(fd);
      if (existing) Object.assign(existing, data);
      else state.tasks.push({ id: uid(), done: false, ...data });
      save();
    },
  });
}

export function deadlineForm(projectId, existing, date) {
  const d = existing || { title: "", type: "review", date: date || todayKey(), time: "09:00", projectId: projectId || "" };
  openModal(existing ? "Edit deadline" : "New deadline", `
    <label class="field"><span>What's due?</span><input name="title" required maxlength="120" value="${esc(d.title)}" placeholder="e.g. Interim review" /></label>
    <div class="field-row">
      <label class="field"><span>Date</span><input type="date" name="date" required value="${esc(d.date)}" /></label>
      <label class="field"><span>Time</span><input type="time" name="time" value="${esc(d.time)}" /></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Type</span><select name="type">${Object.entries(DEADLINE_TYPES)
        .map(([k, v]) => `<option value="${k}" ${k === d.type ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
      <label class="field"><span>Project</span><select name="projectId"><option value="">Whole studio</option>${projectOptions(state.projects, d.projectId)}</select></label>
    </div>
    ${existing ? `<button type="button" class="link-btn danger" id="delDeadline">Delete this deadline</button>` : ""}
  `, {
    submitLabel: existing ? "Save" : "Add deadline",
    onSubmit(fd) {
      const data = Object.fromEntries(fd);
      if (existing) Object.assign(existing, data);
      else state.deadlines.push({ id: uid(), ...data });
      save();
    },
  });
  document.getElementById("delDeadline")?.addEventListener("click", () => {
    state.deadlines = state.deadlines.filter((x) => x.id !== existing.id);
    save();
    document.querySelector("#modal [data-close]").click();
  });
}

export function projectName(id) {
  return getProject(id)?.name || "Whole studio";
}
