# Atelier

A studio organizer for architecture students.

- **Landing page** — `/` (`index.html`)
- **The app** — `/app/`
  - **Dashboard**: active projects, tasks due today, upcoming deadlines, overall progress, countdown to the next final submission, quick "create project" button
  - **Projects**: model-making and drawing tasks, deadlines per project
  - **Calendar & deadlines**: month and week views, colour-coded deadline types, deadline tracker, alerts (in-app banner, bell, and optional browser reminders)
  - **Design journal & mood board**: concept timeline (concepts, sketches, design decisions, crit feedback), reference images, colour palettes (including extracting a palette from an image), material palettes
  - **Final submission checklist**: site plan, floor plans, sections, elevations, details, renderings, diagrams, physical model, final board — each with quality checks, notes and uploads
  - **Review**: instant built-in review of what's missing and how to improve, plus optional AI feedback
  - **Precedents**: curated precedent library and trusted inspiration sites

- **Themes**: light, dark and system (follows the device), switchable on every page

See [ROADMAP.md](ROADMAP.md) for the phased plan.

Everything a student adds is saved in their own browser (text in `localStorage`, images in IndexedDB). There is no account or database yet; *Settings & data* can download and restore a backup.

## Deploy to Netlify

1. In Netlify: **Add new site → Import an existing project**, pick this repo, branch `main`.
2. Leave the build command empty. Publish directory is `.` (set in `netlify.toml`).
3. Deploy.

### Turn on AI feedback (optional)

The **Review → Get AI feedback** button calls a Netlify Edge Function (`netlify/edge-functions/critique.js`, served at `/api/critique`) that sends the checklist, notes, journal and up to 4 uploaded drawings to Claude.

1. Create an API key at <https://console.anthropic.com/>.
2. In Netlify: **Site configuration → Environment variables → Add a variable**, name `ANTHROPIC_API_KEY`, paste the key.
3. Redeploy (**Deploys → Trigger deploy**).

Each review is a paid API call on your Anthropic account. Without the key, everything else in the app still works and the button explains that AI feedback isn't set up.

## Run locally

```sh
npx serve .
```

Then open <http://localhost:3000/app/>. (The AI feedback button needs `netlify dev` to run the edge function locally.)

## Files

- `index.html`, `styles.css`, `main.js` — landing page
- `theme.js` — light / dark / system theme switch shared by both pages
- `app/` — the app (plain HTML/CSS/JS modules, no build step)
  - `app/js/views/` — one file per screen
  - `app/js/data/` — checklist template and precedent library
- `netlify/edge-functions/critique.js` — AI feedback endpoint
- `netlify.toml` — Netlify config
