import { state, save, getProject, checklistFor, checklistItems, checklistProgress, activeProjects } from "../store.js";
import { esc, uid, relDays, fmtDate, projectOptions, emptyState, toast } from "../ui.js";
import { saveImage, deleteImage, resizeFile, hydrateImages } from "../images.js";
import { STATUS } from "../data/checklist-template.js";
import { projectForm } from "../forms.js";

const expanded = new Set();
const NEXT = { todo: "progress", progress: "done", done: "todo" };

export function renderChecklist(root, [projectId]) {
  const projects = activeProjects();
  if (!projects.length) {
    root.innerHTML = emptyState("No projects yet", "Create a project to start its final submission checklist.", `<button class="btn" id="np" type="button">+ Create project</button>`);
    root.querySelector("#np").onclick = () => projectForm();
    return;
  }
  const project = getProject(projectId) || projects[0];
  const id = project.id;
  const items = checklistItems(id);
  const { done, total } = checklistProgress(id);
  const pct = Math.round((done / total) * 100);

  root.innerHTML = `
    <div class="page-head">
      <label class="inline-field">Project <select id="projSel">${projectOptions(projects, id)}</select></label>
      <a class="btn btn--ghost" href="#/review/${esc(id)}">◎ Review my submission</a>
    </div>

    <section class="panel cl-summary" style="--accent:${esc(project.color)}">
      <div>
        <p class="eyebrow">Final submission set</p>
        <h2>${esc(project.name)}</h2>
        <p class="muted small">${project.finalDate ? `Due ${esc(fmtDate(project.finalDate, { weekday: "long", month: "long", day: "numeric" }))} · <strong>${esc(relDays(project.finalDate))}</strong>` : `No final date set — <button class="link-btn" id="setDate" type="button">add one</button>`}</p>
      </div>
      <div class="cl-summary__progress">
        <div class="ring ring--lg" style="--p:${pct}"><span>${done}/${total}</span></div>
      </div>
    </section>

    <p class="muted small cl-help">Tap the status to move an item from <em>Not started</em> → <em>In progress</em> → <em>Done</em>. Open an item to tick its quality checks, add notes and upload the drawing or photo.</p>

    <ul class="cl-list">
      ${items.map((item) => itemRow(item)).join("")}
    </ul>

    <form class="cl-add" id="addItem">
      <input name="label" maxlength="60" placeholder="Add another item (e.g. Structural axonometric)" required />
      <button class="btn btn--small" type="submit">+ Add item</button>
    </form>
  `;

  const cl = checklistFor(id);
  const entryOf = (key) => (cl.items[key] ||= { status: "todo", note: "", imageIds: [], criteria: {} });

  root.querySelector("#projSel").onchange = (e) => (location.hash = `#/checklist/${e.target.value}`);
  root.querySelector("#setDate")?.addEventListener("click", () => projectForm(project));
  root.querySelectorAll("[data-status]").forEach((b) => (b.onclick = () => {
    const entry = entryOf(b.dataset.status);
    entry.status = NEXT[entry.status];
    save();
  }));
  root.querySelectorAll("[data-expand]").forEach((b) => (b.onclick = () => {
    const key = b.dataset.expand;
    expanded.has(key) ? expanded.delete(key) : expanded.add(key);
    renderChecklist(root, [id]);
  }));
  root.querySelectorAll("[data-crit]").forEach((el) => (el.onchange = () => {
    const [key, crit] = el.dataset.crit.split(":");
    const entry = entryOf(key);
    entry.criteria[crit] = el.checked;
    if (el.checked && entry.status === "todo") entry.status = "progress";
    save();
  }));
  root.querySelectorAll("[data-note]").forEach((el) => (el.onchange = () => {
    entryOf(el.dataset.note).note = el.value;
    save();
    toast("Note saved");
  }));
  root.querySelectorAll("[data-upload]").forEach((el) => (el.onchange = async () => {
    const entry = entryOf(el.dataset.upload);
    for (const file of el.files) {
      try {
        const imgId = uid();
        await saveImage(imgId, await resizeFile(file));
        entry.imageIds.push(imgId);
      } catch (err) {
        toast(err.message);
      }
    }
    if (entry.status === "todo") entry.status = "progress";
    save();
  }));
  root.querySelectorAll("[data-del-img]").forEach((b) => (b.onclick = async () => {
    const [key, imgId] = b.dataset.delImg.split(":");
    const entry = entryOf(key);
    entry.imageIds = entry.imageIds.filter((x) => x !== imgId);
    await deleteImage(imgId);
    save();
  }));
  root.querySelectorAll("[data-remove-item]").forEach((b) => (b.onclick = () => {
    const key = b.dataset.removeItem;
    cl.custom = cl.custom.filter((c) => c.key !== key);
    delete cl.items[key];
    save();
  }));
  root.querySelector("#addItem").onsubmit = (e) => {
    e.preventDefault();
    const label = new FormData(e.target).get("label").trim();
    if (!label) return;
    cl.custom.push({ key: "custom-" + uid(), label });
    save();
  };
  hydrateImages(root);
}

function itemRow(item) {
  const { entry } = item;
  const open = expanded.has(item.key);
  const critDone = item.criteria.filter((c) => entry.criteria[c.key]).length;
  return `
    <li class="cl-item cl-item--${esc(entry.status)} ${open ? "is-open" : ""}">
      <div class="cl-item__row">
        <button type="button" class="status status--${esc(entry.status)}" data-status="${esc(item.key)}" aria-label="Change status of ${esc(item.label)}">
          <span class="status__box">${entry.status === "done" ? "✓" : entry.status === "progress" ? "◐" : ""}</span>
          <span class="status__text">${STATUS[entry.status].label}</span>
        </button>
        <button type="button" class="cl-item__label" data-expand="${esc(item.key)}" aria-expanded="${open}">
          <span>${esc(item.label)}</span>
          <span class="cl-item__meta">
            ${item.criteria.length ? `<span class="small muted">${critDone}/${item.criteria.length} quality checks</span>` : ""}
            ${entry.imageIds.length ? `<span class="small muted">· ${entry.imageIds.length} 🖼</span>` : ""}
            <span class="chev">${open ? "▴" : "▾"}</span>
          </span>
        </button>
      </div>
      ${open ? `
      <div class="cl-item__body">
        ${item.criteria.length ? `
        <div>
          <h4>Quality checks</h4>
          <ul class="crit-list">${item.criteria.map((c) => `
            <li><label><input type="checkbox" data-crit="${esc(item.key)}:${esc(c.key)}" ${entry.criteria[c.key] ? "checked" : ""} /> ${esc(c.text)}</label></li>`).join("")}
          </ul>
        </div>` : ""}
        <div>
          <h4>Notes</h4>
          <textarea data-note="${esc(item.key)}" rows="3" maxlength="2000" placeholder="Scale, sheet number, what's left to do…">${esc(entry.note)}</textarea>
          <h4>Drawings / photos</h4>
          <div class="thumbs">
            ${entry.imageIds.map((imgId) => `
              <div class="thumb" data-img-wrap><img data-img="${esc(imgId)}" alt="" />
                <button type="button" class="thumb__del" data-del-img="${esc(item.key)}:${esc(imgId)}" aria-label="Remove image">×</button></div>`).join("")}
            <label class="thumb thumb--add">+<span>Upload</span><input type="file" accept="image/*" multiple data-upload="${esc(item.key)}" hidden /></label>
          </div>
          ${item.custom ? `<button type="button" class="link-btn danger" data-remove-item="${esc(item.key)}">Remove this item</button>` : ""}
        </div>
      </div>` : ""}
    </li>`;
}
