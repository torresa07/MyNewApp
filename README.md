# Atelier

A studio organizer for architecture students.

- **Landing page** — `/` (`index.html`)
- **The app** — `/app/`
  - **Import from PDF**: upload a syllabus, project brief or assignment sheet; AI reads it and proposes the project, deadlines, tasks, final-submission items and requirements for the student to review before saving. One PDF can start a new project, or be added to an existing one. The PDF is kept with the project.
  - **Dashboard**: active projects, tasks due today, upcoming deadlines, overall progress, countdown to the next final submission, quick "create project" button
  - **Projects**: model-making and drawing tasks, deadlines per project
  - **Calendar & deadlines**: month and week views, colour-coded deadline types, deadline tracker, alerts (in-app banner, bell, and optional browser reminders)
  - **Design journal & mood board**: concept timeline (concepts, sketches, design decisions, crit feedback), reference images, colour palettes (including extracting a palette from an image), material palettes
  - **Final submission checklist**: site plan, floor plans, sections, elevations, details, renderings, diagrams, physical model, final board — each with quality checks, notes and uploads
  - **Review**: instant built-in review of what's missing and how to improve, plus optional AI feedback
  - **Precedents**: curated precedent library and trusted inspiration sites

- **Themes**: White, Soft paper or Dark, from the theme button on every page or *Settings & data*
- **Responsive**: bottom tab bar on phones, icon rail on tablets, full sidebar on desktop

See [ROADMAP.md](ROADMAP.md) for the next four waves of improvements (accounts and Supabase in Wave 4).

Everything a student adds is saved in their own browser (text in `localStorage`, images in IndexedDB). There is no account or database yet; *Settings & data* can download and restore a backup.

## Deploy to Netlify

1. In Netlify: **Add new site → Import an existing project**, pick this repo, branch `main`.
2. Leave the build command empty. Publish directory is `.` (set in `netlify.toml`).
3. Deploy.

### Turn on the AI features (optional)

Two features use Claude through Netlify Edge Functions:

- **Import from PDF** — `netlify/edge-functions/import-syllabus.js` at `/api/import-syllabus` reads the PDF and returns a structured plan.
- **Review → Get AI feedback** — `netlify/edge-functions/critique.js` at `/api/critique` sends the checklist, notes, journal and up to 4 uploaded drawings.

1. Create an API key at <https://console.anthropic.com/>.
2. In Netlify: **Site configuration → Environment variables → Add a variable**, name `ANTHROPIC_API_KEY`, paste the key.
3. Redeploy (**Deploys → Trigger deploy**).

Each PDF import and each review is a paid API call on your Anthropic account. Without the key, everything else in the app still works and those buttons explain that AI isn't set up.

## Run locally

```sh
npx serve .
```

Then open <http://localhost:3000/app/>. (The AI feedback button needs `netlify dev` to run the edge function locally.)

## Files

- `index.html`, `styles.css`, `main.js` — landing page
- `theme.js`, `theme.css` — theme picker (White / Soft paper / Dark) shared by both pages
- `app/` — the app (plain HTML/CSS/JS modules, no build step)
  - `app/js/views/` — one file per screen
  - `app/js/data/` — checklist template and precedent library
- `netlify/edge-functions/import-syllabus.js` — PDF reading endpoint
- `netlify/edge-functions/critique.js` — AI feedback endpoint
- `netlify/lib/claude.js` — shared helpers for both
- `netlify.toml` — Netlify config
