# Atelier roadmap

The plan is to make the app as useful as possible while everything is still saved on each device. **Accounts and the Supabase database come last, in Wave 4.**

Each wave ends with a **quality check (QC) gate**. Don't start the next wave until every box in the gate is ticked.

**How to test each wave:** do the work on a branch and open a pull request. Netlify builds a private test copy of the site (a *deploy preview*) for each pull request. Check the wave there, then merge to `main` to publish it.

**Every QC gate also includes:**
- [ ] Phone (about 390px wide), tablet (768–1024px) and desktop (1280px+) all display correctly
- [ ] The White, Soft paper and Dark themes all display correctly
- [ ] No errors in the browser console
- [ ] Lighthouse scores of 90+ for Accessibility and Best Practices
- [ ] Your sign-off

---

## ✅ Done so far

- [x] Landing page
- [x] Dashboard, Projects, Calendar (month and week), deadline tracker and alerts
- [x] Design journal and mood board
- [x] Final submission checklist and Review tab (built-in review, plus AI crit)
- [x] Precedent library
- [x] Import from PDF: a syllabus or brief becomes a project with its deadlines, tasks and checklist
- [x] Themes: White, Soft paper, Dark
- [x] Layouts for every screen size: bottom tab bar on phones, icon rail on tablets, full sidebar on desktop

**Do this now (no code needed):**
- [ ] Add `ANTHROPIC_API_KEY` in Netlify and redeploy, so PDF import and AI crit work
- [ ] Set a **monthly spending limit** in the Anthropic Console. Until logins exist (Wave 4), anyone who finds the site can use the AI features, and that's paid for on your account.

---

## Wave 1: Everyday essentials

Make the app pleasant to use every day.

- [ ] **Install as a phone app (PWA):** "Add to Home Screen", an app icon, and offline use
- [ ] **Welcome tour** on first visit, with a choice of starting blank, loading the sample projects, or importing a PDF
- [ ] **Quick add:** type "Sections pin-up Friday 9am" and it becomes a deadline with the right date
- [ ] **Search** across projects, tasks, journal notes and precedents
- [ ] **Edit everything:** edit mood board items, remove one image from a journal entry, duplicate a project, drag to reorder checklist items
- [ ] **Subtasks** (e.g. "1:200 model" → base, massing, landscape, photos) and **repeating tasks** (e.g. weekly desk crit)
- [ ] **Undo** after deleting something
- [ ] **Automatic backup reminder:** a gentle nudge to download a backup every two weeks
- [ ] **Accessibility pass:** colour contrast in all three themes, full keyboard use, screen-reader labels
- [ ] **Automated tests** in the repo that run on GitHub for every pull request

**QC gate 1**
- [ ] The app installs on your phone and opens with Wi-Fi turned off
- [ ] A classmate who has never seen it creates a project and a deadline within 2 minutes, without help
- [ ] Quick add gets the date right for "tomorrow", "Friday", "next Tuesday 2pm" and "Nov 12"
- [ ] Every delete can be undone
- [ ] The automated tests pass on GitHub

---

## Wave 2: Smarter planning

Help students plan their time, not just list their deadlines.

- [ ] **Work-back plan:** pick a final date and the app spreads the remaining checklist items and tasks across the days left
- [ ] **Time estimates** on tasks, plus a **weekly workload view** that warns about crunch weeks before they happen
- [ ] **WhatsApp chat import:** upload an exported group chat. AI finds the deadlines and announcements, and you approve each one (uses the same review screen as PDF import).
- [ ] **Photo import:** snap a whiteboard or a printed schedule and the deadlines are read from it
- [ ] **Add to Google or Apple Calendar:** download deadlines as a calendar file
- [ ] **Per-deadline reminders:** choose 1 day, 3 days or 1 week before
- [ ] **Weekly summary:** what got done, what's next, what's at risk

**QC gate 2**
- [ ] The work-back plan for a real project looks doable (check it with a classmate)
- [ ] A real exported studio chat, in both iPhone and Android formats, finds at least 80% of the real deadlines and adds nothing you didn't approve
- [ ] A photo of a printed schedule is read correctly
- [ ] The calendar file opens correctly in Google Calendar and Apple Calendar

---

## Wave 3: Studio craft and presentation

Tools for the architecture work itself.

- [ ] **Board planner:** arrange drawings on an A1 or A0 grid and export a PDF for a test print
- [ ] **Better AI crit:** feedback on each drawing, a check of board layout and legibility, and a history of past crits to show improvement
- [ ] **Model-making log:** material and shopping list with costs, a laser-cut file checklist, and build-progress photos
- [ ] **Draw on images:** sketch notes over uploaded drawings and model photos
- [ ] **Project portfolio export:** the concept timeline, key images and final boards as one PDF
- [ ] **Precedent collections** per project, with your own notes on each precedent

**QC gate 3**
- [ ] The board planner PDF prints at the correct size (A1 or A0) with nothing cropped
- [ ] A tutor reads AI feedback on three real boards and agrees it's specific and correct
- [ ] Notes drawn on images still show after reloading the page
- [ ] The portfolio PDF looks good enough to send to someone

---

## Wave 4: Accounts, database and sharing (Supabase)

Only now add logins. Everything above keeps working, and data moves into the cloud.

- [ ] **Sign in** with an email link or Google (Supabase Auth)
- [ ] **Database** for projects, tasks, deadlines, journal entries and checklists (Supabase Postgres), with security rules so each person sees only their own data
- [ ] **Cloud storage** for images and PDFs (Supabase Storage)
- [ ] **One-tap move:** the first time someone signs in, everything saved in their browser is uploaded to their account
- [ ] **Sync across devices**, still working offline and catching up when back online
- [ ] **AI features require a login**, with a fair-use limit per student, which ends the spending risk above
- [ ] **Studio groups:** invite classmates with a link, a shared studio board, and a tutor role that can post deadlines to everyone
- [ ] **Account deletion and full data export**

**QC gate 4**
- [ ] A change on your phone appears on your laptop within a few seconds
- [ ] Browser data moves into a new account with nothing missing, images and PDFs included
- [ ] Two test accounts can't see each other's data
- [ ] Signed-out visitors can't use the AI features
- [ ] A deadline posted by the tutor appears on every studio member's calendar
- [ ] Deleting an account removes all of its data
