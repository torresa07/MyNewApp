// App state, saved to localStorage. Images live separately in IndexedDB.

import { uid, toKey, addDays, todayKey, daysUntil, PROJECT_COLORS } from "./ui.js";
import { CHECKLIST_ITEMS } from "./data/checklist-template.js";
import { clearImages } from "./images.js";

const KEY = "atelier.app.v1";
const listeners = new Set();

function emptyState() {
  return {
    projects: [],
    tasks: [],
    deadlines: [],
    journal: [],
    mood: [],
    checklist: {},
    savedPrecedents: [],
    customPrecedents: [],
    settings: { alertDays: 3, notified: {} },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch (_) {}
  return seed();
}

export let state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error(err);
    alert("Your browser storage is full. Try removing some images.");
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function resetAll({ withSample = false } = {}) {
  await clearImages();
  state = withSample ? seed() : emptyState();
  save();
}

/* ---------- Selectors ---------- */

export const getProject = (id) => state.projects.find((p) => p.id === id);
export const activeProjects = () => state.projects.filter((p) => !p.archived);

export function checklistFor(projectId) {
  if (!state.checklist[projectId]) {
    state.checklist[projectId] = { items: {}, custom: [] };
  }
  return state.checklist[projectId];
}

export function checklistItems(projectId) {
  const cl = checklistFor(projectId);
  return [...CHECKLIST_ITEMS, ...cl.custom.map((c) => ({ ...c, criteria: [], custom: true }))].map((item) => ({
    ...item,
    entry: cl.items[item.key] || { status: "todo", note: "", imageIds: [], criteria: {} },
  }));
}

export function checklistProgress(projectId) {
  const items = checklistItems(projectId);
  const done = items.filter((i) => i.entry.status === "done").length;
  return { done, total: items.length };
}

export function projectProgress(projectId) {
  const tasks = state.tasks.filter((t) => t.projectId === projectId);
  const cl = checklistProgress(projectId);
  const done = tasks.filter((t) => t.done).length + cl.done;
  const total = tasks.length + cl.total;
  return total ? Math.round((done / total) * 100) : 0;
}

// Everything with a date, normalised for the calendar and tracker.
export function allEvents() {
  const events = [];
  for (const d of state.deadlines) {
    events.push({ id: d.id, kind: "deadline", title: d.title, date: d.date, time: d.time, type: d.type, projectId: d.projectId, done: d.done });
  }
  for (const t of state.tasks) {
    if (!t.due) continue;
    events.push({ id: t.id, kind: "task", title: t.title, date: t.due, type: t.kind === "model" ? "model" : t.kind === "drawing" ? "drawing" : "studio", projectId: t.projectId, done: t.done });
  }
  for (const p of activeProjects()) {
    if (p.finalDate) {
      events.push({ id: "final-" + p.id, kind: "final", title: `Final submission — ${p.name}`, date: p.finalDate, time: p.finalTime, type: "submission", projectId: p.id, done: false });
    }
  }
  return events.sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
}

export function upcoming(days = 14) {
  return allEvents().filter((e) => !e.done && daysUntil(e.date) >= 0 && daysUntil(e.date) <= days);
}

export function overdue() {
  return allEvents().filter((e) => !e.done && daysUntil(e.date) < 0);
}

export function nextFinal() {
  return activeProjects()
    .filter((p) => p.finalDate && daysUntil(p.finalDate) >= 0)
    .sort((a, b) => a.finalDate.localeCompare(b.finalDate))[0];
}

export function nextProjectColor() {
  return PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length];
}

/* ---------- Sample data so the app isn't empty on first open ---------- */

function seed() {
  const s = emptyState();
  const now = new Date();
  const d = (n) => toKey(addDays(now, n));

  const library = { id: uid(), name: "Riverside Library", course: "Studio III", phase: "Design development", color: PROJECT_COLORS[0], finalDate: d(18), finalTime: "09:00", description: "A public library and reading garden on the river edge.", createdAt: todayKey() };
  const pavilion = { id: uid(), name: "Timber Pavilion", course: "Construction Studio", phase: "Concept", color: PROJECT_COLORS[1], finalDate: d(32), finalTime: "14:00", description: "A small timber pavilion exploring joinery and shade.", createdAt: todayKey() };
  s.projects.push(library, pavilion);

  s.tasks.push(
    { id: uid(), projectId: library.id, title: "Cut site model base (1:500)", kind: "model", due: d(0), done: false },
    { id: uid(), projectId: library.id, title: "Redraw long section through reading room", kind: "drawing", due: d(0), done: false },
    { id: uid(), projectId: library.id, title: "Precedent study: Exeter Library", kind: "other", due: d(-1), done: true },
    { id: uid(), projectId: library.id, title: "Massing model iterations ×3", kind: "model", due: d(4), done: false },
    { id: uid(), projectId: pavilion.id, title: "Joinery sketches", kind: "drawing", due: d(2), done: false },
    { id: uid(), projectId: pavilion.id, title: "1:20 joint mock-up", kind: "model", due: d(9), done: false }
  );

  s.deadlines.push(
    { id: uid(), projectId: library.id, title: "Interim review", type: "review", date: d(3), time: "10:00" },
    { id: uid(), projectId: library.id, title: "Site model due", type: "model", date: d(6), time: "17:00" },
    { id: uid(), projectId: pavilion.id, title: "Desk crit with tutor", type: "review", date: d(1), time: "14:30" },
    { id: uid(), projectId: library.id, title: "Sections pin-up", type: "drawing", date: d(10), time: "09:00" },
    { id: uid(), projectId: "", title: "Print room closes early", type: "studio", date: d(5), time: "16:00" }
  );

  s.checklist[library.id] = {
    custom: [],
    items: {
      "site-plan": { status: "done", note: "Drawn at 1:500, needs landscape layer.", imageIds: [], criteria: { north: true, context: true, roof: true } },
      "floor-plans": { status: "progress", note: "Ground and first floor drafted.", imageIds: [], criteria: { labels: true, lineweights: true } },
      diagrams: { status: "progress", note: "", imageIds: [], criteria: { concept: true } },
    },
  };

  s.journal.push(
    { id: uid(), projectId: library.id, date: d(-12), kind: "concept", title: "Library as a covered street", text: "First idea: the library is a public street that runs from the town square down to the river, with reading rooms stepping off it.", imageIds: [] },
    { id: uid(), projectId: library.id, date: d(-6), kind: "decision", title: "Reading room faces north", text: "Moved the main reading room to the north side for even daylight. Trade-off: loses the river view at ground level — solved with a raised terrace.", imageIds: [] },
    { id: uid(), projectId: library.id, date: d(-2), kind: "note", title: "Crit feedback", text: "Tutor: the street idea is strong but the entrance is hidden. Try making the square end more generous.", imageIds: [] }
  );

  s.mood.push(
    { id: uid(), projectId: library.id, kind: "palette", title: "River morning", colors: ["#d9d2c5", "#a8b59a", "#bccad0", "#8f9f92", "#f1ece3"], note: "Soft, calm, daylight." },
    { id: uid(), projectId: library.id, kind: "material", title: "Library materials", materials: [
      { name: "Board-formed concrete", color: "#bdb8ae" },
      { name: "White oak", color: "#d8c3a0" },
      { name: "Bronze mesh", color: "#a07c55" },
      { name: "Lime render", color: "#ece6da" },
    ], note: "Heavy base, warm interior." },
    { id: uid(), projectId: pavilion.id, kind: "palette", title: "Timber + shade", colors: ["#c9a690", "#e8d9c4", "#6f6c64", "#a8b59a"], note: "" }
  );

  return s;
}
