# Atelier roadmap

Each phase ends with a **quality check (QC) gate**. Nothing moves to the next phase until every box in its gate is ticked and you sign off.

**How each phase is shipped:** work happens on a branch and opens a pull request. Netlify builds a **deploy preview** (a private test copy of the site) for every pull request, so you can try the phase before it goes live. When the QC gate passes, the pull request is merged to `main` and Netlify publishes it.

**The same checks run in every gate:**
- Automated browser tests pass (added in Phase 1).
- A manual run-through on a phone and a laptop, in light and dark themes.
- No errors in the browser console.
- Lighthouse scores of 90 or more for Accessibility and Best Practices.
- Your sign-off.

---

## Phase 0: Light, dark and system themes ✅ built

- A three-way switch (☀ light, ☾ dark, 🖥 system) in the app's top bar and on the landing page.
- **System** follows the phone's or computer's own setting and changes when that setting changes.
- The choice is remembered and shared between the landing page and the app.
- The dark theme is the same landscape palette at dusk: graphite, moss and clay. The deadline colours stay distinguishable.

**QC gate 0**
- [ ] Every screen is readable in light and dark: Dashboard, Projects, Calendar (month and week), Journal, Mood board, Final submission, Review, Precedents and the landing page.
- [ ] *System* switches automatically when you change your phone's appearance setting.
- [ ] The page doesn't flash white when you open it in dark mode.
- [ ] Pop-ups, date pickers and the deadline bell look right in both themes.

---

## Phase 1: Solid foundations

Make the app more reliable and nicer to use every day before adding big features.

- **Installable app (PWA):** "Add to Home Screen" on iPhone and Android, an app icon, and offline use.
- **First-run welcome:** a short three-step tour, and a choice between starting blank or loading the sample projects.
- **Edit everything:** edit mood board items, remove single images from journal entries, reorder checklist items, and duplicate a project.
- **Accessibility pass:** colour contrast to the WCAG AA standard in both themes, full keyboard use, and screen-reader labels.
- **Automated tests:** a browser test suite in the repo that runs on GitHub for every pull request. Later QC gates build on it.
- **Confirm AI feedback on the live site**, including the error messages and what happens on a slow connection.

**QC gate 1**
- [ ] The app installs on your phone and opens with no internet connection.
- [ ] A brand-new visitor understands what to do within one minute (test with a classmate).
- [ ] The automated tests pass on GitHub.
- [ ] Lighthouse scores 90+ for Accessibility in both themes.

---

## Phase 2: Accounts and sync

Today all data lives in one browser. This phase gives each student an account so their work follows them everywhere.

- Sign in with email or Google, using **Supabase** for login, the database and image storage.
- The same projects on phone and laptop, with images stored in the cloud.
- **Move existing data:** the first time someone signs in, the app offers to upload what is already saved in their browser.
- **Privacy:** each student sees only their own data, enforced by database security rules. Account deletion and data export are included.

**QC gate 2**
- [ ] A change made on your phone appears on your laptop.
- [ ] Data saved before accounts existed moves over completely, images included.
- [ ] Student A cannot see Student B's data, tested with two accounts.
- [ ] Signing out and back in loses nothing.

---

## Phase 3: Studio groups and WhatsApp import

Turn the app from a personal tool into a shared studio space.

- **Studios:** create a studio and invite classmates with a link. A "tutor" role can post official deadlines.
- **Shared studio board:** everyone sees what's due and what's been announced. Studio deadlines appear in each member's calendar.
- **WhatsApp chat import:** upload an exported chat. AI finds the dates, deadlines and announcements, and you approve which ones become tasks and notes.
- **Comments:** classmates can leave comments on shared items.

**QC gate 3**
- [ ] The invite link works and a classmate joins in under a minute.
- [ ] A deadline posted by the tutor appears in every member's calendar.
- [ ] Importing a real exported studio chat (iPhone and Android formats) finds at least 80% of the real deadlines, with nothing added without your approval.
- [ ] Removing a member stops them seeing the studio.

---

## Phase 4: Smarter crits and presentation tools

- **Better AI crit:** feedback per drawing, a check on the presentation board layout (hierarchy, legibility, story), and a history of past crits so students can see how they improved.
- **Board planner:** arrange drawings on an A1 or A0 grid and export a PDF for a test print.
- **Auto-schedule:** the app spreads the remaining checklist items over the days left before the final submission.
- **Calendar export:** add deadlines to Google or Apple Calendar.
- **Precedent collections per project**, which can go straight into the journal.

**QC gate 4**
- [ ] AI feedback names specific, correct things in three real student boards (a tutor checks it).
- [ ] The exported PDF prints at the right size.
- [ ] Deadlines appear in Google or Apple Calendar.
- [ ] The full test suite passes, with no Lighthouse drop compared with Phase 3.
