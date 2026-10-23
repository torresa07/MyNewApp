// Submission review: a built-in rule-based crit that works offline, plus
// optional AI feedback from the /api/critique Netlify function.

import { state, getProject, checklistItems, activeProjects } from "../store.js";
import { esc, daysUntil, todayKey, projectOptions, emptyState } from "../ui.js";
import { getImage } from "../images.js";
import { projectForm } from "../forms.js";

const aiResults = new Map(); // projectId -> last AI feedback text

export function renderReview(root, [projectId]) {
  const projects = activeProjects();
  if (!projects.length) {
    root.innerHTML = emptyState("No projects yet", "Create a project and fill in its final checklist, then come back for a review.", `<button class="btn" id="np" type="button">+ Create project</button>`);
    root.querySelector("#np").onclick = () => projectForm();
    return;
  }
  const project = getProject(projectId) || projects[0];
  const report = analyse(project);

  root.innerHTML = `
    <div class="page-head">
      <label class="inline-field">Project <select id="projSel">${projectOptions(projects, project.id)}</select></label>
      <a class="btn btn--ghost" href="#/checklist/${esc(project.id)}">☑ Edit checklist</a>
    </div>

    <section class="panel review-score" style="--accent:${esc(project.color)}">
      <div class="ring ring--lg" style="--p:${report.score}"><span>${report.score}%</span></div>
      <div>
        <p class="eyebrow">Submission readiness</p>
        <h2>${esc(report.headline)}</h2>
        <p class="muted">${esc(report.summary)}</p>
      </div>
    </section>

    <div class="review-grid">
      <section class="panel">
        <h3 class="review-h review-h--missing">Missing — not started</h3>
        ${report.missing.length ? `<ul class="review-list">${report.missing.map((m) => `
          <li><strong>${esc(m.label)}</strong>${m.tip ? `<span>${esc(m.tip)}</span>` : ""}</li>`).join("")}</ul>` : `<p class="muted small">Nothing missing. 🎉</p>`}
      </section>

      <section class="panel">
        <h3 class="review-h review-h--improve">How to improve what you have</h3>
        ${report.improve.length ? `<ul class="review-list">${report.improve.map((m) => `
          <li><strong>${esc(m.label)}</strong>${m.tips.map((t) => `<span>${esc(t)}</span>`).join("")}</li>`).join("")}</ul>` : `<p class="muted small">All quality checks ticked on items you've started.</p>`}
      </section>

      <section class="panel">
        <h3 class="review-h review-h--time">Time check</h3>
        <ul class="review-list">${report.time.map((t) => `<li><span>${esc(t)}</span></li>`).join("")}</ul>
      </section>

      <section class="panel">
        <h3 class="review-h review-h--story">Telling the story</h3>
        <ul class="review-list">${report.story.map((t) => `<li><span>${esc(t)}</span></li>`).join("")}</ul>
      </section>
    </div>

    <section class="panel ai-panel">
      <div class="panel__head">
        <div>
          <h2>AI crit <span class="badge badge--ai">Beta</span></h2>
          <p class="muted small">Sends this checklist, your notes and up to 4 uploaded drawings to an AI tutor for written feedback. Nothing is sent until you press the button.</p>
        </div>
        <button class="btn" id="runAi" type="button">Get AI feedback</button>
      </div>
      <div id="aiOut" class="ai-out">${aiResults.has(project.id) ? markdown(aiResults.get(project.id)) : ""}</div>
    </section>
  `;

  root.querySelector("#projSel").onchange = (e) => (location.hash = `#/review/${e.target.value}`);
  root.querySelector("#runAi").onclick = () => runAi(root, project);
}

/* ---------- Rule-based analysis ---------- */

export function analyse(project) {
  const items = checklistItems(project.id);
  const missing = [];
  const improve = [];
  const time = [];
  const story = [];
  let points = 0;

  for (const item of items) {
    const { entry, criteria } = item;
    const critFrac = criteria.length ? criteria.filter((c) => entry.criteria[c.key]).length / criteria.length : 1;
    const base = entry.status === "done" ? 0.75 : entry.status === "progress" ? 0.35 : 0;
    points += entry.status === "todo" ? 0 : base + 0.25 * critFrac;

    if (entry.status === "todo") {
      missing.push({ label: item.label, tip: criteria[0]?.tip });
      continue;
    }
    const tips = criteria.filter((c) => !entry.criteria[c.key]).map((c) => c.tip);
    if (entry.status === "done" && !entry.imageIds.length && !entry.note) {
      tips.push("Marked done but nothing attached — upload the drawing or a photo so you can review the whole set side by side.");
    }
    if (tips.length) improve.push({ label: item.label + (entry.status === "progress" ? " (in progress)" : ""), tips });
  }

  const score = Math.round((points / items.length) * 100);
  const remaining = items.filter((i) => i.entry.status !== "done").length;

  // Time
  if (project.finalDate) {
    const days = daysUntil(project.finalDate);
    if (days < 0) time.push(`The final date passed ${-days} days ago. Update it if the deadline moved.`);
    else if (!remaining) time.push(`Everything is marked done with ${days} days to go — use the time to refine and print a test board.`);
    else {
      const perDay = remaining / Math.max(days, 1);
      time.push(`${remaining} items left and ${days} day${days === 1 ? "" : "s"} until submission.`);
      if (perDay > 1) time.push(`That's more than one item per day — prioritise the hero drawings (plans, sections, the board) and simplify the rest.`);
      else if (days <= 3) time.push("Final stretch: freeze the design now and focus on drawing quality and the board layout.");
      else time.push(`About ${Math.ceil(days / Math.max(remaining, 1))} day(s) per item. Leave the last 2 days for printing and model photos.`);
    }
  } else {
    time.push("No final submission date set — add one to get a time plan.");
  }
  const lateTasks = state.tasks.filter((t) => t.projectId === project.id && !t.done && t.due && t.due < todayKey());
  if (lateTasks.length) time.push(`${lateTasks.length} overdue task${lateTasks.length > 1 ? "s" : ""}: ${lateTasks.slice(0, 3).map((t) => t.title).join(", ")}.`);

  // Story / process
  const journal = state.journal.filter((j) => j.projectId === project.id);
  const decisions = journal.filter((j) => j.kind === "decision");
  const crits = journal.filter((j) => j.kind === "crit");
  if (!journal.length) story.push("Your design journal is empty. Write 3–4 entries about how the concept developed — juries love to hear the process.");
  else {
    if (!journal.some((j) => j.kind === "concept")) story.push("Add a concept entry that states the big idea in one or two sentences — it's the opening line of your presentation.");
    if (!decisions.length) story.push("Record your key design decisions and why you made them; they become the answers to jury questions.");
    else story.push(`${decisions.length} design decision${decisions.length > 1 ? "s" : ""} recorded — use them as talking points.`);
    if (crits.length) story.push(`Check you've responded to the ${crits.length} piece${crits.length > 1 ? "s" : ""} of crit feedback in your journal.`);
    const last = journal.map((j) => j.date).sort().pop();
    if (last && daysUntil(last) < -10) story.push("No journal entries in over 10 days — capture recent changes before you forget why you made them.");
  }
  const boardItem = items.find((i) => i.key === "board");
  if (boardItem && boardItem.entry.status !== "todo" && !boardItem.entry.criteria?.narrative) {
    story.push("Plan the board as a story: context → concept → plans & sections → experience (renders/model).");
  }
  if (!state.mood.some((m) => m.projectId === project.id)) story.push("No mood board yet — a material palette helps explain your atmosphere and material choices.");

  const headline =
    score >= 85 ? "Nearly ready to pin up" :
    score >= 60 ? "Good progress — a few gaps" :
    score >= 30 ? "Taking shape" : "Just getting started";
  const summary = `${items.length - remaining} of ${items.length} items done, ${missing.length} not started. ` +
    (improve.length ? `${improve.reduce((n, i) => n + i.tips.length, 0)} improvement suggestions below.` : "No open quality checks on started items.");

  return { score, headline, summary, missing, improve, time, story };
}

/* ---------- AI feedback ---------- */

async function runAi(root, project) {
  const out = root.querySelector("#aiOut");
  const button = root.querySelector("#runAi");
  button.disabled = true;
  button.textContent = "Reviewing…";
  out.innerHTML = `<p class="muted">Your AI tutor is looking at the submission… this can take up to a minute.</p>`;

  try {
    const items = checklistItems(project.id);
    const payload = {
      project: { name: project.name, course: project.course, phase: project.phase, brief: project.description, finalDate: project.finalDate },
      items: items.map((i) => ({
        label: i.label,
        status: i.entry.status,
        note: i.entry.note,
        checksDone: i.criteria.filter((c) => i.entry.criteria[c.key]).map((c) => c.text),
        checksOpen: i.criteria.filter((c) => !i.entry.criteria[c.key]).map((c) => c.text),
      })),
      journal: state.journal.filter((j) => j.projectId === project.id).map((j) => ({ date: j.date, kind: j.kind, title: j.title, text: j.text })),
      images: await collectImages(items),
    };

    const res = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if ([404, 405, 501].includes(res.status)) throw new Error("AI feedback isn't switched on yet. It works once the site is deployed on Netlify with an ANTHROPIC_API_KEY environment variable (see the README).");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `The AI service returned an error (${res.status}).`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      out.innerHTML = markdown(text);
    }
    aiResults.set(project.id, text);
  } catch (err) {
    out.innerHTML = `<p class="ai-error">${esc(err.message)}</p>`;
  } finally {
    button.disabled = false;
    button.textContent = "Get AI feedback again";
  }
}

// Up to 4 images, the most presentation-critical first, scaled down for upload.
async function collectImages(items) {
  const priority = ["board", "sections", "floor-plans", "renderings", "site-plan", "elevations", "diagrams", "model", "details"];
  const sorted = [...items].sort((a, b) => {
    const ia = priority.indexOf(a.key), ib = priority.indexOf(b.key);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const out = [];
  for (const item of sorted) {
    for (const id of item.entry.imageIds) {
      if (out.length >= 4) return out;
      const src = await getImage(id);
      if (src) out.push({ label: item.label, data: await shrink(src, 1000) });
    }
  }
  return out;
}

function shrink(dataUrl, max) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = () => resolve(dataUrl.split(",")[1]);
    img.src = dataUrl;
  });
}

// Tiny, safe markdown: escapes first, then headings, bold, bullets.
function markdown(src) {
  const lines = esc(src).split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    if (bullet) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${bullet[1]}</li>`;
      continue;
    }
    if (inList) { html += "</ul>"; inList = false; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) html += `<h4>${h[2]}</h4>`;
    else if (line.trim()) html += `<p>${line}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}
