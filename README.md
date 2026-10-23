# Atelier

A studio organizer for architecture students: studio projects, model making and drawing tasks, crit notes and reviews, final presentation checklists, and a shared studio board for what's due.

This repo currently holds the landing page — plain HTML, CSS and JS, no build step.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
```

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo.
2. Branch: `main`. Build command: leave empty. Publish directory: `.` (already set in `netlify.toml`).
3. Deploy. The waitlist form uses Netlify Forms, so submissions appear under **Forms** in the Netlify dashboard.

## Files

- `index.html` — landing page
- `styles.css` — soft landscape palette (stone, clay, sage, eucalyptus, sky)
- `main.js` — studio board demo (notes saved in the browser's localStorage)
- `netlify.toml` — Netlify config
