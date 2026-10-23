import { state, save } from "../store.js";
import { esc, uid, openModal, projectOptions, toast } from "../ui.js";
import { PRECEDENTS, SOURCES, TYPOLOGIES, searchLinks } from "../data/precedents.js";

let typeFilter = "All";
let query = "";
let savedOnly = false;

export function renderInspiration(root) {
  const custom = (state.customPrecedents || []).map((p) => ({ ...p, custom: true }));
  const all = [...custom, ...PRECEDENTS];
  const saved = new Set(state.savedPrecedents);
  const q = query.toLowerCase();
  const list = all.filter((p) =>
    (typeFilter === "All" || p.type === typeFilter) &&
    (!savedOnly || saved.has(p.name) || p.custom) &&
    (!q || `${p.name} ${p.architect} ${p.place} ${p.idea}`.toLowerCase().includes(q))
  );

  root.innerHTML = `
    <section class="panel">
      <div class="panel__head">
        <div><h2>Where to look for ideas</h2><p class="muted small">Trusted sites architecture students use for precedents. They open in a new tab.</p></div>
      </div>
      <div class="sources">${SOURCES.map((s) => `
        <a class="source" href="${esc(s.url)}" target="_blank" rel="noopener">
          <strong>${esc(s.name)} ↗</strong><span>${esc(s.text)}</span>
        </a>`).join("")}</div>
    </section>

    <section class="panel">
      <div class="panel__head">
        <div><h2>Precedent library</h2><p class="muted small">${PRECEDENTS.length} key buildings with the idea to take away and which drawing to study. Save the ones you like.</p></div>
        <button class="btn btn--small" id="addPrec" type="button">+ Add your own</button>
      </div>
      <div class="prec-filters">
        <input type="search" id="precSearch" placeholder="Search by name, architect, city or idea…" value="${esc(query)}" />
        <div class="chips">${TYPOLOGIES.map((t) => `<button type="button" class="chip-btn ${t === typeFilter ? "is-on" : ""}" data-type="${esc(t)}">${esc(t)}</button>`).join("")}
          <button type="button" class="chip-btn ${savedOnly ? "is-on" : ""}" id="savedOnly">♥ Saved (${saved.size + custom.length})</button>
        </div>
      </div>
      ${list.length ? `<div class="prec-grid">${list.map((p) => card(p, saved.has(p.name))).join("")}</div>` : `<p class="muted">No precedents match. Try another filter.</p>`}
    </section>
  `;

  const search = root.querySelector("#precSearch");
  search.oninput = () => {
    query = search.value;
    renderInspiration(root);
    const again = root.querySelector("#precSearch");
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  };
  root.querySelectorAll("[data-type]").forEach((b) => (b.onclick = () => { typeFilter = b.dataset.type; renderInspiration(root); }));
  root.querySelector("#savedOnly").onclick = () => { savedOnly = !savedOnly; renderInspiration(root); };
  root.querySelectorAll("[data-save]").forEach((b) => (b.onclick = () => {
    const name = b.dataset.save;
    state.savedPrecedents = saved.has(name) ? state.savedPrecedents.filter((n) => n !== name) : [...state.savedPrecedents, name];
    save();
  }));
  root.querySelectorAll("[data-del-custom]").forEach((b) => (b.onclick = () => {
    state.customPrecedents = state.customPrecedents.filter((p) => p.id !== b.dataset.delCustom);
    save();
  }));
  root.querySelector("#addPrec").onclick = addForm;
}

function card(p, isSaved) {
  const links = p.custom ? null : searchLinks(p);
  return `
    <article class="prec">
      <div class="prec__cover" aria-hidden="true">${cover(p)}</div>
      <div class="prec__body">
        <div class="prec__top">
          <span class="badge">${esc(p.type || "Precedent")}</span>
          ${p.custom
            ? `<button type="button" class="icon-btn icon-btn--sm" data-del-custom="${esc(p.id)}" aria-label="Remove">×</button>`
            : `<button type="button" class="heart ${isSaved ? "is-on" : ""}" data-save="${esc(p.name)}" aria-label="${isSaved ? "Unsave" : "Save"} ${esc(p.name)}">${isSaved ? "♥" : "♡"}</button>`}
        </div>
        <h3>${esc(p.name)}</h3>
        <p class="small muted">${esc(p.architect || "")}${p.year ? ` · ${esc(p.year)}` : ""}${p.place ? ` · ${esc(p.place)}` : ""}</p>
        <p class="prec__idea">${esc(p.idea || "")}</p>
        ${p.study ? `<p class="small"><strong>Study:</strong> ${esc(p.study)}</p>` : ""}
        <div class="prec__links">
          ${links ? `
            <a href="${links.archdaily}" target="_blank" rel="noopener">ArchDaily ↗</a>
            <a href="${links.wikipedia}" target="_blank" rel="noopener">Wikipedia ↗</a>
            <a href="${links.images}" target="_blank" rel="noopener">Plans &amp; sections ↗</a>`
          : p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Open link ↗</a>` : ""}
        </div>
      </div>
    </article>`;
}

// Deterministic abstract "plan" cover so every card has its own drawing.
function cover(p) {
  let h = 0;
  for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);
  let shapes = "";
  for (let i = 0; i < 5; i++) {
    const x = 20 + rand() * 180, y = 15 + rand() * 70;
    const w = 30 + rand() * 90, ht = 20 + rand() * 50;
    shapes += rand() > 0.75
      ? `<circle cx="${x + w / 3}" cy="${y + ht / 3}" r="${ht / 2}" fill="none" stroke="#3d3c38" stroke-opacity=".5" />`
      : `<rect x="${x}" y="${y}" width="${w}" height="${ht}" fill="${i === 0 ? "#3d3c38" : "none"}" fill-opacity=".08" stroke="#3d3c38" stroke-opacity=".55" />`;
  }
  return `<svg viewBox="0 0 280 120" preserveAspectRatio="xMidYMid slice"><rect width="280" height="120" fill="${esc(p.color || "#d9d2c5")}" opacity=".55"/>${shapes}<line x1="0" y1="${100 + rand() * 15}" x2="280" y2="${95 + rand() * 20}" stroke="#3d3c38" stroke-opacity=".3"/></svg>`;
}

function addForm() {
  openModal("Add your own precedent", `
    <label class="field"><span>Name</span><input name="name" required maxlength="80" /></label>
    <div class="field-row">
      <label class="field"><span>Architect</span><input name="architect" maxlength="80" /></label>
      <label class="field"><span>Year</span><input name="year" maxlength="10" /></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Place</span><input name="place" maxlength="60" /></label>
      <label class="field"><span>Typology</span><select name="type">${TYPOLOGIES.slice(1).map((t) => `<option>${t}</option>`).join("")}</select></label>
    </div>
    <label class="field"><span>Link (e.g. ArchDaily page)</span><input name="url" type="url" placeholder="https://" /></label>
    <label class="field"><span>The idea to take away</span><textarea name="idea" rows="3" maxlength="400"></textarea></label>
    ${state.projects.length ? `<label class="field"><span>For project</span><select name="projectId"><option value="">—</option>${projectOptions(state.projects)}</select></label>` : ""}
  `, {
    submitLabel: "Save precedent",
    onSubmit(fd) {
      const data = Object.fromEntries(fd);
      if (data.url && !/^https?:\/\//i.test(data.url)) data.url = "";
      state.customPrecedents = [...(state.customPrecedents || []), { id: uid(), color: "#c2b6cf", ...data }];
      save();
      toast("Precedent saved");
    },
  });
}
