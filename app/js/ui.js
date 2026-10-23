// Shared UI helpers: escaping, dates, modal, toast.

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- Dates (stored as local YYYY-MM-DD strings) ---------- */

export function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromKey(key, time) {
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  const [hh, mm] = (time || "23:59").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export const todayKey = () => toKey(new Date());

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysUntil(key) {
  const start = fromKey(todayKey(), "00:00");
  const end = fromKey(key, "00:00");
  return Math.round((end - start) / 86400000);
}

export function relDays(key) {
  const n = daysUntil(key);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n < 0) return `${-n} days overdue`;
  return `In ${n} days`;
}

export function fmtDate(key, opts = { month: "short", day: "numeric" }) {
  const d = fromKey(key, "12:00");
  return d ? d.toLocaleDateString(undefined, opts) : "";
}

export function fmtTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* ---------- Colour coding ---------- */

export const DEADLINE_TYPES = {
  submission: { label: "Final submission", color: "var(--c-submission)" },
  review: { label: "Review / crit", color: "var(--c-review)" },
  model: { label: "Model", color: "var(--c-model)" },
  drawing: { label: "Drawing", color: "var(--c-drawing)" },
  studio: { label: "Studio / other", color: "var(--c-studio)" },
};

export const PROJECT_COLORS = ["#a8b59a", "#c9a690", "#bccad0", "#c2b6cf", "#d9c79a", "#9fb3a8", "#d4a5a5"];

/* ---------- Modal ---------- */

const modalRoot = () => document.getElementById("modal");

export function openModal(title, bodyHtml, { onSubmit, submitLabel = "Save", wide = false } = {}) {
  const root = modalRoot();
  root.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel ${wide ? "modal__panel--wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <form class="modal__form">
        <header class="modal__head">
          <h2>${esc(title)}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Close">×</button>
        </header>
        <div class="modal__body">${bodyHtml}</div>
        ${onSubmit ? `<footer class="modal__foot">
          <button type="button" class="btn btn--ghost" data-close>Cancel</button>
          <button type="submit" class="btn">${esc(submitLabel)}</button>
        </footer>` : ""}
      </form>
    </div>`;
  root.hidden = false;
  document.body.classList.add("no-scroll");
  const form = root.querySelector("form");
  root.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!onSubmit) return;
    const keepOpen = await onSubmit(new FormData(form), form);
    if (keepOpen !== true) closeModal();
  });
  const first = form.querySelector("input, textarea, select");
  if (first) first.focus();
  return form;
}

export function closeModal() {
  const root = modalRoot();
  root.hidden = true;
  root.innerHTML = "";
  document.body.classList.remove("no-scroll");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalRoot()?.hidden) closeModal();
});

/* ---------- Toast ---------- */

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--in"));
  setTimeout(() => {
    el.classList.remove("toast--in");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

export function projectOptions(projects, selectedId, { includeAll = false } = {}) {
  const opts = projects.map(
    (p) => `<option value="${esc(p.id)}" ${p.id === selectedId ? "selected" : ""}>${esc(p.name)}</option>`
  );
  if (includeAll) opts.unshift(`<option value="" ${!selectedId ? "selected" : ""}>All projects</option>`);
  return opts.join("");
}

export function emptyState(title, text, actionHtml = "") {
  return `<div class="empty"><h3>${esc(title)}</h3><p>${esc(text)}</p>${actionHtml}</div>`;
}
