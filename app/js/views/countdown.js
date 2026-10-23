import { esc, fromKey, fmtDate, fmtTime } from "../ui.js";
import { checklistProgress } from "../store.js";

export function countdownHtml(project) {
  const cl = checklistProgress(project.id);
  return `
    <div class="countdown" style="--accent:${esc(project.color)}">
      <p class="eyebrow">Countdown to final submission</p>
      <h2>${esc(project.name)}</h2>
      <div class="countdown__clock" data-countdown>
        <div><span data-unit="d">–</span><small>days</small></div>
        <div><span data-unit="h">–</span><small>hours</small></div>
        <div><span data-unit="m">–</span><small>min</small></div>
        <div><span data-unit="s">–</span><small>sec</small></div>
      </div>
      <p class="muted small">${esc(fmtDate(project.finalDate, { weekday: "long", month: "long", day: "numeric" }))}${project.finalTime ? " at " + esc(fmtTime(project.finalTime)) : ""}
        · ${cl.done}/${cl.total} checklist items done</p>
      <a class="link" href="#/checklist/${esc(project.id)}">Open final checklist →</a>
    </div>`;
}

// Ticks the clock every second; returns a cleanup function for the router.
export function startCountdown(root, project) {
  const target = fromKey(project.finalDate, project.finalTime || "23:59");
  const tick = () => {
    const el = root.querySelector("[data-countdown]");
    if (!el) return;
    let diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    el.querySelector('[data-unit="d"]').textContent = d;
    el.querySelector('[data-unit="h"]').textContent = String(h).padStart(2, "0");
    el.querySelector('[data-unit="m"]').textContent = String(m).padStart(2, "0");
    el.querySelector('[data-unit="s"]').textContent = String(s).padStart(2, "0");
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}
