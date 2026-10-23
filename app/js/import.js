// Import a class PDF (syllabus, brief, assignment sheet): Claude reads it,
// the student reviews what was found, then it becomes a project (or is added
// to an existing one) with deadlines, tasks, checklist notes and requirements.

import { state, save, getProject, checklistFor, nextProjectColor } from "./store.js";
import { esc, uid, todayKey, openModal, closeModal, projectOptions, fmtDate, DEADLINE_TYPES, toast } from "./ui.js";
import { saveImage } from "./images.js";
import { CHECKLIST_ITEMS } from "./data/checklist-template.js";

const MAX_BYTES = 4.5 * 1024 * 1024;

export function openImport(projectId = "") {
  const form = openModal("Import a class PDF", `
    <p class="muted small">Upload a syllabus, project brief or assignment sheet. Atelier reads it and finds the deadlines, tasks and deliverables — you check everything before it's saved.</p>
    <label class="dropzone">
      <input type="file" name="pdf" accept="application/pdf,.pdf" required />
      <span class="dropzone__icon">⇪</span>
      <strong data-filename>Choose a PDF</strong>
      <span class="muted small">Up to 4.5 MB</span>
    </label>
    <fieldset class="field"><legend>Where should it go?</legend>
      <label class="check"><input type="radio" name="target" value="new" ${projectId ? "" : "checked"} /> Create a new project from this PDF</label>
      ${state.projects.length ? `
      <label class="check"><input type="radio" name="target" value="existing" ${projectId ? "checked" : ""} /> Add it to an existing project</label>
      <select name="projectId" class="indent">${projectOptions(state.projects, projectId)}</select>` : ""}
    </fieldset>
    <div class="import-status" data-status hidden></div>
  `, {
    submitLabel: "Read PDF",
    async onSubmit(fd, formEl) {
      const file = fd.get("pdf");
      const target = fd.get("target");
      const existing = target === "existing" ? getProject(fd.get("projectId")) : null;
      if (!file || !file.size) return true;
      if (file.type && file.type !== "application/pdf") { showStatus(formEl, "That file isn't a PDF.", true); return true; }
      if (file.size > MAX_BYTES) { showStatus(formEl, "That PDF is over 4.5 MB. Try a compressed copy, or just the pages with the brief and schedule.", true); return true; }

      const submit = formEl.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Reading…";
      showStatus(formEl, `<span class="spinner"></span> Reading <strong>${esc(file.name)}</strong>… this usually takes 20–60 seconds.`);
      try {
        const dataUrl = await readAsDataUrl(file);
        const plan = await requestPlan(dataUrl.split(",")[1], existing);
        closeModal();
        reviewPlan(plan, { file, dataUrl, existing });
      } catch (err) {
        showStatus(formEl, esc(err.message), true);
        submit.disabled = false;
        submit.textContent = "Try again";
      }
      return true;
    },
  });
  form.querySelector('input[name="pdf"]').addEventListener("change", (e) => {
    form.querySelector("[data-filename]").textContent = e.target.files[0]?.name || "Choose a PDF";
  });
  const select = form.querySelector('select[name="projectId"]');
  select?.addEventListener("focus", () => (form.querySelector('input[value="existing"]').checked = true));
}

function showStatus(formEl, html, isError = false) {
  const el = formEl.querySelector("[data-status]");
  el.hidden = false;
  el.classList.toggle("is-error", isError);
  el.innerHTML = html;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't open that file."));
    reader.readAsDataURL(file);
  });
}

async function requestPlan(base64, existing) {
  let res;
  try {
    res = await fetch("/api/import-syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf: base64, today: todayKey(), existingProject: existing?.name || "" }),
    });
  } catch (_) {
    throw new Error("Couldn't reach the server. Check your internet connection and try again.");
  }
  if ([404, 405, 501].includes(res.status)) {
    throw new Error("PDF reading isn't switched on yet. It works once the site is deployed on Netlify with an ANTHROPIC_API_KEY environment variable (see the README).");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `The server returned an error (${res.status}).`);
  }
  const text = await res.text();
  const errorAt = text.indexOf("@@ERROR@@");
  if (errorAt >= 0) throw new Error(text.slice(errorAt + 9).trim());
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error("The PDF was read but the result came back incomplete. Please try again.");
  }
}

/* ---------- Review screen ---------- */

const KEY_LABELS = Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, i.label]));

function reviewPlan(plan, { file, dataUrl, existing }) {
  const p = plan.project || {};
  const deadlines = plan.deadlines || [];
  const tasks = plan.tasks || [];
  const deliverables = plan.deliverables || [];
  const requirements = plan.requirements || [];
  const warnings = plan.warnings || [];
  const count = deadlines.length + tasks.length + deliverables.length + requirements.length;

  openModal(existing ? `Add “${existing.name}” details` : "Review your new project", `
    <div class="import-summary">
      <p class="eyebrow">From ${esc(file.name)}</p>
      <p>${esc(p.summary || "")}</p>
      <p class="muted small">Found ${deadlines.length} deadline${deadlines.length === 1 ? "" : "s"}, ${tasks.length} task${tasks.length === 1 ? "" : "s"}, ${deliverables.length} deliverable${deliverables.length === 1 ? "" : "s"} and ${requirements.length} requirement${requirements.length === 1 ? "" : "s"}. Untick anything you don't want, and fix any dates.</p>
    </div>
    ${warnings.length ? `<div class="import-warn"><strong>Please double-check</strong><ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}

    ${existing ? "" : `
    <h3 class="import-h">Project</h3>
    <label class="field"><span>Name</span><input name="name" required maxlength="80" value="${esc(p.name || file.name.replace(/\.pdf$/i, ""))}" /></label>
    <div class="field-row">
      <label class="field"><span>Course / studio</span><input name="course" maxlength="60" value="${esc(p.course || "")}" /></label>
      <label class="field"><span>Instructor</span><input name="instructor" maxlength="80" value="${esc(p.instructor || "")}" /></label>
    </div>`}
    <div class="field-row">
      <label class="field"><span>Final submission date</span><input type="date" name="finalDate" value="${esc(p.finalDate || existing?.finalDate || "")}" /></label>
      <label class="field"><span>Time</span><input type="time" name="finalTime" value="${esc(p.finalTime || existing?.finalTime || "09:00")}" /></label>
    </div>

    ${deadlines.length ? `<h3 class="import-h">Deadlines</h3>${deadlines.some((d) => d.dateInferred) ? `<p class="muted small">Highlighted dates were worked out from the PDF (e.g. “Week 8”) — please check them.</p>` : ""}<ul class="import-list">${deadlines.map((d, i) => `
      <li>
        <input type="checkbox" name="d${i}" checked aria-label="Include ${esc(d.title)}" />
        <div class="import-list__main">
          <input name="dTitle${i}" value="${esc(d.title)}" maxlength="120" aria-label="Deadline title" />
          ${d.details ? `<span class="muted small">${esc(d.details)}</span>` : ""}
        </div>
        <input type="date" name="dDate${i}" value="${esc(d.date || "")}" class="${d.dateInferred ? "is-guess" : ""}" aria-label="Date" title="${d.dateInferred ? "Worked out from the document — please check" : ""}" />
        <select name="dType${i}" aria-label="Type">${Object.entries(DEADLINE_TYPES).map(([k, v]) => `<option value="${k}" ${k === d.type ? "selected" : ""}>${v.label}</option>`).join("")}</select>
        <input type="hidden" name="dTime${i}" value="${esc(d.time || "")}" />
      </li>`).join("")}</ul>` : ""}

    ${tasks.length ? `<h3 class="import-h">Tasks</h3><ul class="import-list">${tasks.map((t, i) => `
      <li>
        <input type="checkbox" name="t${i}" checked aria-label="Include ${esc(t.title)}" />
        <div class="import-list__main">
          <input name="tTitle${i}" value="${esc(t.title)}" maxlength="120" aria-label="Task title" />
          ${t.details ? `<span class="muted small">${esc(t.details)}</span>` : ""}
        </div>
        <input type="date" name="tDue${i}" value="${esc(t.due || "")}" aria-label="Due date" />
        <select name="tKind${i}" aria-label="Type">
          <option value="model" ${t.kind === "model" ? "selected" : ""}>Model</option>
          <option value="drawing" ${t.kind === "drawing" ? "selected" : ""}>Drawing</option>
          <option value="other" ${t.kind === "other" ? "selected" : ""}>Other</option>
        </select>
      </li>`).join("")}</ul>` : ""}

    ${deliverables.length ? `<h3 class="import-h">Final submission checklist</h3><ul class="import-list import-list--simple">${deliverables.map((d, i) => `
      <li>
        <input type="checkbox" name="v${i}" checked aria-label="Include ${esc(d.label)}" />
        <div class="import-list__main">
          <strong>${esc(d.checklistKey !== "other" ? KEY_LABELS[d.checklistKey] : d.label)}</strong>
          <span class="muted small">${esc(d.requirement || d.label)}</span>
        </div>
      </li>`).join("")}</ul>` : ""}

    ${requirements.length ? `<h3 class="import-h">Requirements &amp; rules</h3><ul class="import-list import-list--simple">${requirements.map((r, i) => `
      <li><input type="checkbox" name="r${i}" checked aria-label="Include requirement" /><div class="import-list__main"><span>${esc(r)}</span></div></li>`).join("")}</ul>` : ""}

    ${count ? "" : `<p class="muted">No dates or deliverables were found in this PDF. You can still save it to the project for reference.</p>`}
    <label class="check"><input type="checkbox" name="keepPdf" checked /> Keep a copy of the PDF in the project</label>
  `, {
    wide: true,
    submitLabel: existing ? "Add to project" : "Create project",
    async onSubmit(fd) {
      const project = existing || {
        id: uid(),
        createdAt: todayKey(),
        name: fd.get("name"),
        course: fd.get("course"),
        instructor: fd.get("instructor"),
        phase: "Concept",
        color: nextProjectColor(),
        description: p.summary || "",
      };
      if (fd.get("finalDate")) { project.finalDate = fd.get("finalDate"); project.finalTime = fd.get("finalTime"); }
      if (!existing) state.projects.push(project);

      deadlines.forEach((d, i) => {
        if (!fd.get(`d${i}`) || !fd.get(`dDate${i}`)) return;
        state.deadlines.push({ id: uid(), projectId: project.id, title: fd.get(`dTitle${i}`) || d.title, date: fd.get(`dDate${i}`), time: fd.get(`dTime${i}`) || "", type: fd.get(`dType${i}`), notes: d.details || "" });
      });
      tasks.forEach((t, i) => {
        if (!fd.get(`t${i}`)) return;
        state.tasks.push({ id: uid(), projectId: project.id, title: fd.get(`tTitle${i}`) || t.title, kind: fd.get(`tKind${i}`), due: fd.get(`tDue${i}`) || "", done: false, notes: t.details || "" });
      });

      const cl = checklistFor(project.id);
      deliverables.forEach((d, i) => {
        if (!fd.get(`v${i}`)) return;
        let key = d.checklistKey;
        if (key === "other" || !KEY_LABELS[key]) {
          key = "custom-" + uid();
          cl.custom.push({ key, label: d.label });
        }
        const entry = (cl.items[key] ||= { status: "todo", note: "", imageIds: [], criteria: {} });
        const line = `From the brief: ${d.requirement || d.label}`;
        if (!entry.note.includes(line)) entry.note = entry.note ? `${entry.note}\n${line}` : line;
      });

      project.requirements = [...new Set([...(project.requirements || []), ...requirements.filter((_, i) => fd.get(`r${i}`))])];

      if (fd.get("keepPdf")) {
        const docId = uid();
        try {
          await saveImage(docId, dataUrl);
          project.documents = [...(project.documents || []), { id: docId, name: file.name, size: file.size, importedAt: todayKey(), summary: p.summary || "" }];
        } catch (_) {
          toast("Saved the plan, but the PDF itself was too big to keep in this browser.");
        }
      }

      save();
      location.hash = `#/projects/${project.id}`;
      toast(existing ? "Added to project" : "Project created from PDF");
    },
  });
}

export function describeDoc(doc) {
  const kb = Math.round(doc.size / 1024);
  return `${kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB"} · imported ${fmtDate(doc.importedAt)}`;
}
