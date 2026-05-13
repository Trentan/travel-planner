# CODEX.md

> **If the user's message matches a command below, execute it immediately and stop reading. Do not read further unless the command explicitly requires project context.**

---

## Command Dictionary

> **Key:** `{N}` = item number, `{a}` = sub-task letter, `{i}` = sub-item roman numeral, e.g. `Start 3b` or `Confirm 3b-ii`

### Session Commands

| Command | Action |
|---|---|
| `Start {Nai}` | Read `TODO.md` then `UNFINISHED.md`. Record and commit to `UNFINISHED.md`: item name, branch, full sub-task/sub-item breakdown, expected files to touch, estimated commits. Reply with this information and remind the user to proceed with `Confirm {Nai}`. |
| `Confirm {Nai}` | Proceed with the stated sub-task or sub-item using information from `UNFINISHED.md`. No further confirmation needed unless information is missing or clarification is required. Update `UNFINISHED.md` with recent changes; move `Item-{Nai}` to Awaiting Review with a change summary and matching commit IDs. Commit and push branch. Reply notifying the user to review changes for `Item-{Nai}`. |
| `Resume` | Read `UNFINISHED.md` and `git log`. Reply with: branch, last commit, what was done, exact next step. Wait for go-ahead before doing anything. |
| `Park` | Update `UNFINISHED.md` with current state and exact next step. Push branch. Reply with branch name and next step. Stop all work immediately. |

### Status Commands

| Command | Action |
|---|---|
| `Where up to` | Read `UNFINISHED.md`. Reply with one line only: item + sub-task, branch, last commit message. Nothing else. |
| `Status` | Read `UNFINISHED.md`. Reply with: active item + sub-task, branch, last commit, next step, anything awaiting review. Do not start work. |
| `Pending` | Read `UNFINISHED.md`. List all Awaiting Review items: item, branch, one-line summary. Do not start work. |

### TODO Commands

| Command | Action |
|---|---|
| `New Item` | Ask the user to describe the item. Auto-increment item number from `TODO.md`. Write to `TODO.md` with task and sub-task breakdown. Commit and push. Reply with exactly what was written. |
| `Add to {Na}` | Ask the user to describe the new sub-task or sub-item. Append to the correct item in `TODO.md` using the next available letter or roman numeral. Commit and push. Reply with exactly what was written. |
| `Complete {Nai}` | The user is declaring this item done. Do not verify, read code, grep, or check implementation. Trust the user. Immediately mark referenced item/sub-task/sub-item `[x]` in `TODO.md` for the stated sub-task/sub-item. Cascade upward: if all sub-items under a sub-task are done, mark the sub-task `[x]`; if all sub-tasks under a task are done, mark the task `[x]`. Move the item from Awaiting Review to Completed in `UNFINISHED.md`. Commit, push branch, and create a pull request for review to main. Reply with branch and Pull Request link. |
| `Finish {Nai}` | Complete the pending Pull Request for the item referenced in `UNFINISHED.md` Completed section. Move the item from Completed in `UNFINISHED.md` to `VERIFIED.md`. Commit and push. Reply with outcome. |

---

> **Commands above require no further context. Only read below if starting a new session, resuming work, or beginning a `Start` / `Confirm` command.**

---

## Project Overview

Travel Planner PWA is a completely offline, JSON-driven Progressive Web App for managing complex travel itineraries, budgets, and packing lists. No build process or dependencies; pure HTML/CSS/JS that runs entirely in the browser.

Key architectural decisions:

- Offline-first: Service Worker caches assets for offline functionality.
- JSON data engine: all trip data lives in a single portable JSON file.
- No server or database required; uses browser `localStorage` for persistence.
- Drag-and-drop itinerary planning with live budget calculations.

## File Structure

- `index.html`: main HTML structure, loads external modules.
- `style.css`: complete application styles.
- `manifest.json`: PWA configuration for mobile installation.
- `sw.js`: Service Worker for offline caching.
- `js/`: JavaScript modules.
- `backups/`: exported trip JSON files.
- `TODO.md`: active task queue; read from main branch, owned by user.
- `UNFINISHED.md`: live session state; owned by the agent, lives on feature branch.
- `VERIFIED.md`: completed and confirmed items; owned by user, append-only archive.

## Development Commands

Run the app:

```powershell
start index.html
```

Or use any local server:

```powershell
python -m http.server 8000
```

Test JavaScript syntax after editing JS files:

```powershell
node --check js\data.js
node --check js\itinerary.js
```

For import/export, cities, transit, accommodation, transport, or budget behavior, test against:

```text
backups/2026_June_July_Europe_Thailand.json
```

## Development Workflow

### Three-file system

- `TODO.md`: read from main branch to compare to current branch; owned by user.
- `UNFINISHED.md`: agent-owned live state; lives on feature branch; tracks active and awaiting review.
- `VERIFIED.md`: append-only archive of confirmed completed items; owned by user.

---

### On Session Start / Re-entry

> Re-entering a session? Read `CODEX.md`, `TODO.md`, `UNFINISHED.md`, declare status, then wait for go-ahead.

1. Read this entire `CODEX.md` before doing anything else.
2. Sync and orient:
   - `git fetch origin main`
   - `git show origin/main:CODEX.md`
   - `git diff origin/main -- TODO.md`
   - If main `TODO.md` is ahead of local, sync it before relying on it.
   - Determine target branch in this order:
     - `TODO.md` active item `**Branch:**` field.
     - `UNFINISHED.md` `**Branch:**` field.
     - `git branch -a`.
     - If branch does not exist yet, create from main:

```powershell
git checkout main
git pull origin main
git checkout -b item-{N}{letter}-{short-desc}
```

   - Read `UNFINISHED.md`; it is the most precise resume point.

3. Declare status:
   - Which item/sub-task is starting or resuming.
   - Last completed commit, if resuming.
   - Next concrete step.
   - Files expected to be touched.
   - Estimated commit count.
   - Any items awaiting review.

4. Update `UNFINISHED.md` with this status before touching code.
5. Wait for user confirmation before writing code.

---

### Scope Rules

- Work only on the requested item/sub-task.
- Preserve unrelated dirty files.
- If a related bug or improvement is noticed, add it to `## Noticed` in `TODO.md`; do not fix it unless it is part of scope.
- If requested work requires touching something outside scope, flag it and ask before proceeding.

---

### Item Format In TODO.md

Items use lettered sub-tasks. Sub-tasks can have roman numeral sub-items:

```markdown
- [ ] a) Top level sub-task
- [ ] b) Another sub-task
    - [ ] i) Sub-item of b
    - [ ] ii) Another sub-item of b
```

Branch naming:

- `item-8a`: top-level sub-task.
- `item-8b-i`: sub-item.
- `item-8b-ii`: next sub-item.

Commit message format:

- `Item 8a [1 of 2]: what changed`
- `Item 8b-i [1 of 3]: what changed`

---

### Working Through Sub-tasks

- Do one sub-task at a time; no bundling unless explicitly instructed.
- Before starting, verify the app loads without errors in its current state when feasible.
- Keep each commit small and focused.
- After each commit, in this exact order:
  1. Update `UNFINISHED.md` immediately.
  2. Run relevant checks from `TODO.md`.
  3. Summarise exactly what changed, what files were touched, and why.
  4. Push the branch.
  5. Report branch name, commit message, and one-line summary.
- After the final commit of a sub-task:
  1. Push and open a PR for review.
  2. Check `[x]` on that sub-task in `TODO.md` and update the item's status block.
  3. Move active item to `## Awaiting Review` in `UNFINISHED.md` with change summary.
  4. Stop and wait.

---

### UNFINISHED.md Format

Update after orientation and after every commit:

```markdown
# UNFINISHED.md

## Active
- **Item/sub-task:** 8a
- **Branch:** item-8a-country-city
- **Last commit:** `Item 8a [1 of 3]: added ISO country datalist`
- **What was done:** Brief plain-English description of what changed and why
- **Next step:** Exact next step; include file and approximate line if known
- **Files touched:** All files changed so far in this sub-task
- **Known blockers / risks:** Anything needing a decision or that could cause problems
- **Noticed (unscheduled):** Bugs or improvements spotted; copy to TODO.md Noticed too

## Awaiting Review / Merge
- **Item:** 7f, branch `item-7f-packing`, PR open, waiting merge
  - Summary of what changed
```

When active item is confirmed complete, clear the Active block:

```markdown
## Active
none
```

---

### Blockers

If blocked:

- Update `UNFINISHED.md` before stopping.
- Describe the blocker and available options.
- Recommend one option and explain why.
- Wait for the user to choose before continuing.

---

### Oversized Sub-tasks

If a sub-task is too large for one session:

- Say so before starting.
- Recommend a split such as `a-i`, `a-ii`.
- Only proceed once the user agrees.
- Write the agreed split into `UNFINISHED.md`.

---

### Adding New Items

- Increment item numbers; never reuse numbers.
- Break work into lettered sub-tasks before starting.
- Add the item to `TODO.md` before touching code.
- Ask clarifying questions for vague requests.

---

### Completing Items

- Only check `[x]` in `TODO.md` after explicit user confirmation.
- Only move an item out of `TODO.md` after all sub-tasks are confirmed done.
- Do not write to `VERIFIED.md` unless the command explicitly requires it.
- Clear the Active block in `UNFINISHED.md` when an item is fully confirmed done.
