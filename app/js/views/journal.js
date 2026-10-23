import { state, save, getProject } from "../store.js";
import { esc, uid, todayKey, fmtDate, openModal, projectOptions, emptyState, toast } from "../ui.js";
import { saveImage, deleteImage, resizeFile, extractPalette, hydrateImages, getImage } from "../images.js";
import { projectForm } from "../forms.js";

let tab = "timeline";

const KINDS = {
  concept: "Concept",
  sketch: "Sketch",
  decision: "Design decision",
  crit: "Crit feedback",
  note: "Note",
};

const MATERIAL_PRESETS = [
  ["Board-formed concrete", "#bdb8ae"], ["Polished concrete", "#cfcac2"], ["White oak", "#d8c3a0"],
  ["Walnut", "#7a5a43"], ["Cross-laminated timber", "#e2cfae"], ["Cork", "#b8946b"],
  ["Rammed earth", "#c49a74"], ["Terracotta tile", "#c47f5e"], ["Handmade brick", "#a8624a"],
  ["Lime render", "#ece6da"], ["Travertine", "#e3d6bf"], ["Slate", "#5d6266"],
  ["Corten steel", "#8c4f2f"], ["Brushed aluminium", "#c4c7c9"], ["Bronze", "#a07c55"],
  ["Clear glass", "#d6e3e6"], ["Polycarbonate", "#e7ecee"], ["Green roof / sedum", "#93a37f"],
];

export function renderJournal(root, [projectId = ""]) {
  if (!state.projects.length) {
    root.innerHTML = emptyState("Start with a project", "Your journal and mood boards belong to a project.", `<button class="btn" id="np" type="button">+ Create project</button>`);
    root.querySelector("#np").onclick = () => projectForm();
    return;
  }
  const match = (x) => !projectId || x.projectId === projectId;
  const entries = state.journal.filter(match).sort((a, b) => a.date.localeCompare(b.date));
  const mood = state.mood.filter(match);

  root.innerHTML = `
    <div class="page-head">
      <label class="inline-field">Project
        <select id="projSel">${projectOptions(state.projects, projectId, { includeAll: true })}</select>
      </label>
      <div class="seg">
        <button type="button" class="${tab === "timeline" ? "is-on" : ""}" data-tab="timeline">Concept timeline</button>
        <button type="button" class="${tab === "mood" ? "is-on" : ""}" data-tab="mood">Mood board</button>
      </div>
    </div>
    ${tab === "timeline" ? timeline(entries, projectId) : moodboard(mood, projectId)}
  `;

  root.querySelector("#projSel").onchange = (e) => (location.hash = `#/journal/${e.target.value}`);
  root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; renderJournal(root, [projectId]); }));
  root.querySelector("#addEntry")?.addEventListener("click", () => entryForm(projectId));
  root.querySelectorAll("[data-edit-entry]").forEach((b) => (b.onclick = () => entryForm(projectId, state.journal.find((x) => x.id === b.dataset.editEntry))));
  root.querySelectorAll("[data-del-entry]").forEach((b) => (b.onclick = async () => {
    if (!confirm("Delete this journal entry?")) return;
    const entry = state.journal.find((x) => x.id === b.dataset.delEntry);
    await Promise.all((entry.imageIds || []).map(deleteImage));
    state.journal = state.journal.filter((x) => x !== entry);
    save();
  }));
  root.querySelector("#addImage")?.addEventListener("click", () => imageForm(projectId));
  root.querySelector("#addPalette")?.addEventListener("click", () => paletteForm(projectId));
  root.querySelector("#addMaterial")?.addEventListener("click", () => materialForm(projectId));
  root.querySelectorAll("[data-del-mood]").forEach((b) => (b.onclick = async () => {
    const item = state.mood.find((x) => x.id === b.dataset.delMood);
    if (!confirm(`Remove "${item.title || "this item"}" from the mood board?`)) return;
    if (item.imageId) await deleteImage(item.imageId);
    state.mood = state.mood.filter((x) => x !== item);
    save();
  }));
  root.querySelectorAll("[data-extract]").forEach((b) => (b.onclick = async () => {
    const item = state.mood.find((x) => x.id === b.dataset.extract);
    const colors = await extractPalette(await getImage(item.imageId));
    if (!colors.length) return toast("Couldn't read colours from that image.");
    state.mood.push({ id: uid(), projectId: item.projectId, kind: "palette", title: `Colours from ${item.title || "image"}`, colors, note: "" });
    save();
    toast("Palette saved to the mood board");
  }));
  root.querySelectorAll("[data-copy]").forEach((el) => (el.onclick = () => {
    navigator.clipboard?.writeText(el.dataset.copy);
    toast(`Copied ${el.dataset.copy}`);
  }));
  hydrateImages(root);
}

/* ---------- Timeline ---------- */

function timeline(entries, projectId) {
  return `
    <section class="panel">
      <div class="panel__head">
        <div><h2>How the concept developed</h2><p class="muted small">Concepts, sketches, design decisions and crit feedback in order — so you can tell the story of your project at review.</p></div>
        <button class="btn" id="addEntry" type="button">+ New entry</button>
      </div>
      ${entries.length ? `<ol class="timeline">${entries.map((e) => `
        <li class="tl-item tl-item--${esc(e.kind)}">
          <div class="tl-item__date">${esc(fmtDate(e.date, { month: "short", day: "numeric" }))}</div>
          <div class="tl-item__card">
            <div class="tl-item__head">
              <span class="badge badge--${esc(e.kind)}">${esc(KINDS[e.kind] || "Note")}</span>
              ${!projectId ? `<span class="muted small">${esc(getProject(e.projectId)?.name || "")}</span>` : ""}
              <span class="tl-item__actions">
                <button class="link-btn" data-edit-entry="${esc(e.id)}" type="button">Edit</button>
                <button class="link-btn" data-del-entry="${esc(e.id)}" type="button">Delete</button>
              </span>
            </div>
            <h3>${esc(e.title)}</h3>
            ${e.text ? `<p>${esc(e.text).replace(/\n/g, "<br />")}</p>` : ""}
            ${(e.imageIds || []).length ? `<div class="thumbs">${e.imageIds.map((id) => `<a data-img-wrap class="thumb"><img data-img="${esc(id)}" alt="" /></a>`).join("")}</div>` : ""}
          </div>
        </li>`).join("")}</ol>` :
        emptyState("No entries yet", "Write down your first concept, upload a sketch, or record a design decision.")}
    </section>`;
}

function entryForm(projectId, existing) {
  const e = existing || { title: "", text: "", kind: "concept", date: todayKey(), projectId: projectId || state.projects[0].id, imageIds: [] };
  openModal(existing ? "Edit entry" : "New journal entry", `
    <div class="field-row">
      <label class="field"><span>Type</span><select name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${k === e.kind ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="field"><span>Date</span><input type="date" name="date" value="${esc(e.date)}" required /></label>
    </div>
    <label class="field"><span>Project</span><select name="projectId">${projectOptions(state.projects, e.projectId)}</select></label>
    <label class="field"><span>Title</span><input name="title" required maxlength="120" value="${esc(e.title)}" placeholder="e.g. Moved the stair to the light well" /></label>
    <label class="field"><span>Notes — what did you decide and why?</span><textarea name="text" rows="5" maxlength="4000">${esc(e.text)}</textarea></label>
    <label class="field"><span>Sketches or images</span><input type="file" name="images" accept="image/*" multiple /></label>
    ${e.imageIds.length ? `<p class="muted small">${e.imageIds.length} image(s) attached. New uploads are added.</p>` : ""}
  `, {
    submitLabel: existing ? "Save" : "Add to journal",
    async onSubmit(fd) {
      const files = fd.getAll("images").filter((f) => f && f.size);
      const ids = await storeFiles(files);
      const data = { kind: fd.get("kind"), date: fd.get("date"), projectId: fd.get("projectId"), title: fd.get("title"), text: fd.get("text") };
      if (existing) Object.assign(existing, data, { imageIds: [...existing.imageIds, ...ids] });
      else state.journal.push({ id: uid(), ...data, imageIds: ids });
      save();
    },
  });
}

async function storeFiles(files) {
  const ids = [];
  for (const file of files) {
    try {
      const dataUrl = await resizeFile(file);
      const id = uid();
      await saveImage(id, dataUrl);
      ids.push(id);
    } catch (err) {
      toast(err.message || "Couldn't save one of the images.");
    }
  }
  return ids;
}

/* ---------- Mood board ---------- */

function moodboard(items, projectId) {
  return `
    <section class="panel">
      <div class="panel__head">
        <div><h2>Mood board</h2><p class="muted small">Reference images, colour combinations and material palettes. Tip: pull a palette straight out of any image.</p></div>
        <div class="btn-group">
          <button class="btn btn--small" id="addImage" type="button">+ Image</button>
          <button class="btn btn--small btn--ghost" id="addPalette" type="button">+ Colour palette</button>
          <button class="btn btn--small btn--ghost" id="addMaterial" type="button">+ Material palette</button>
        </div>
      </div>
      ${items.length ? `<div class="masonry">${items.map((m) => moodCard(m, projectId)).join("")}</div>` :
        emptyState("Your board is empty", "Add reference images, colour palettes or materials.")}
    </section>`;
}

function moodCard(m, projectId) {
  const head = `
    <div class="mood__head">
      <div><strong>${esc(m.title || "Untitled")}</strong>${!projectId ? `<span class="muted small"> · ${esc(getProject(m.projectId)?.name || "")}</span>` : ""}</div>
      <button class="icon-btn icon-btn--sm" data-del-mood="${esc(m.id)}" type="button" aria-label="Remove">×</button>
    </div>`;
  const note = m.note ? `<p class="small muted">${esc(m.note)}</p>` : "";
  if (m.kind === "image") {
    return `<article class="mood mood--image">
      <div data-img-wrap class="mood__img"><img data-img="${esc(m.imageId)}" alt="${esc(m.title)}" /></div>
      <div class="mood__body">${head}${note}<button class="link-btn" data-extract="${esc(m.id)}" type="button">Extract colour palette</button></div>
    </article>`;
  }
  if (m.kind === "palette") {
    return `<article class="mood">
      <div class="palette">${m.colors.map((c) => `<button type="button" class="palette__sw" style="background:${esc(c)}" data-copy="${esc(c)}" title="Copy ${esc(c)}"><span>${esc(c)}</span></button>`).join("")}</div>
      <div class="mood__body">${head}${note}</div>
    </article>`;
  }
  return `<article class="mood">
    <div class="mood__body">${head}
      <ul class="materials">${(m.materials || []).map((x) => `<li><span class="mat" style="background:${esc(x.color)}"></span>${esc(x.name)}</li>`).join("")}</ul>
      ${note}
    </div>
  </article>`;
}

function imageForm(projectId) {
  openModal("Add reference images", `
    <label class="field"><span>Images</span><input type="file" name="images" accept="image/*" multiple required /></label>
    <label class="field"><span>Title</span><input name="title" maxlength="80" placeholder="e.g. Light through timber slats" /></label>
    <label class="field"><span>Project</span><select name="projectId">${projectOptions(state.projects, projectId || state.projects[0].id)}</select></label>
    <label class="field"><span>Why it matters</span><textarea name="note" rows="2" maxlength="400"></textarea></label>
    <label class="check"><input type="checkbox" name="palette" checked /> Also save its colour palette</label>
  `, {
    submitLabel: "Add to board",
    async onSubmit(fd) {
      const files = fd.getAll("images").filter((f) => f && f.size);
      const ids = await storeFiles(files);
      for (const [i, id] of ids.entries()) {
        const title = fd.get("title") || files[i]?.name.replace(/\.[^.]+$/, "") || "Reference";
        state.mood.push({ id: uid(), projectId: fd.get("projectId"), kind: "image", imageId: id, title, note: fd.get("note") });
        if (fd.get("palette")) {
          const colors = await extractPalette(await getImage(id));
          if (colors.length) state.mood.push({ id: uid(), projectId: fd.get("projectId"), kind: "palette", title: `Colours — ${title}`, colors, note: "" });
        }
      }
      save();
    },
  });
}

function paletteForm(projectId) {
  const defaults = ["#d9d2c5", "#a8b59a", "#bccad0", "#c9a690", "#8f9f92", "#f1ece3"];
  openModal("New colour palette", `
    <label class="field"><span>Name</span><input name="title" required maxlength="60" placeholder="e.g. Desert dusk" /></label>
    <fieldset class="field"><legend>Colours (tap to change, untick to leave out)</legend>
      <div class="color-row">${defaults.map((c, i) => `
        <label class="color-pick"><input type="color" name="c${i}" value="${c}" /><input type="checkbox" name="use${i}" checked aria-label="Use colour ${i + 1}" /></label>`).join("")}
      </div>
    </fieldset>
    <label class="field"><span>Project</span><select name="projectId">${projectOptions(state.projects, projectId || state.projects[0].id)}</select></label>
    <label class="field"><span>Note</span><input name="note" maxlength="200" placeholder="Where would you use it?" /></label>
  `, {
    submitLabel: "Save palette",
    onSubmit(fd) {
      const colors = defaults.map((_, i) => (fd.get(`use${i}`) ? fd.get(`c${i}`) : null)).filter(Boolean);
      state.mood.push({ id: uid(), projectId: fd.get("projectId"), kind: "palette", title: fd.get("title"), colors, note: fd.get("note") });
      save();
    },
  });
}

function materialForm(projectId) {
  openModal("New material palette", `
    <label class="field"><span>Name</span><input name="title" required maxlength="60" placeholder="e.g. Ground floor materials" /></label>
    <fieldset class="field"><legend>Pick materials</legend>
      <div class="material-picks">${MATERIAL_PRESETS.map(([name, color], i) => `
        <label class="mat-pick"><input type="checkbox" name="m${i}" /><span class="mat" style="background:${color}"></span>${esc(name)}</label>`).join("")}
      </div>
    </fieldset>
    <div class="field-row">
      <label class="field"><span>Your own material</span><input name="customName" maxlength="40" placeholder="e.g. Recycled timber" /></label>
      <label class="field field--narrow"><span>Colour</span><input type="color" name="customColor" value="#c2b6a3" /></label>
    </div>
    <label class="field"><span>Project</span><select name="projectId">${projectOptions(state.projects, projectId || state.projects[0].id)}</select></label>
    <label class="field"><span>Note</span><input name="note" maxlength="200" placeholder="e.g. Heavy base, light top" /></label>
  `, {
    submitLabel: "Save materials",
    wide: true,
    onSubmit(fd) {
      const materials = MATERIAL_PRESETS.filter((_, i) => fd.get(`m${i}`)).map(([name, color]) => ({ name, color }));
      if (fd.get("customName")) materials.push({ name: fd.get("customName"), color: fd.get("customColor") });
      if (!materials.length) { toast("Pick at least one material."); return true; }
      state.mood.push({ id: uid(), projectId: fd.get("projectId"), kind: "material", title: fd.get("title"), materials, note: fd.get("note") });
      save();
    },
  });
}
