# AGENTS.md

## Source Of Truth & Branch Naming

GitHub Issues and Milestones are the active source of truth.

- **Issue / Feature Branches**: Use prefix `issue/<number>-<description>` or `feature/<description>` (e.g. `issue/188-onboarding-wizard`, `feature/onboarding-wizard`).
- **Milestone Branches**: Use prefix `milestone<number>` or `milestone/<description>` (e.g. `milestone2`).
- Never create `WI-XXX` files or local tracker rows.

## Session Start

1. Check `git status --short --branch`.
2. Identify the active GitHub issue or milestone. If unspecified, inspect open issues/milestones and pick by priority or user direction.
3. Switch to or create the focused issue/milestone branch.
4. Verify the app runs locally at `http://localhost:3000` for visual work using realistic trip data (`backups/2026_June_July_Europe_Thailand.json`).
5. Preserve unrelated local worktree changes.

## AI Usage Guidelines

- Use AI tools and models purposefully (e.g., Anthropic Claude / Gemini 3.6 Flash / Pro depending on task complexity).
- Delegate heavy codebase research or parallel execution to subagents (`research` / `self`) when context efficiency is needed.
- Follow the two-layer workflow: **Superpowers** for planning and orchestration, **Ponytail** for coding and minimal implementation (see [Planning & Coding Philosophy](#planning--coding-philosophy-superpowers--ponytail-synergy)).
- Maintain full alignment with active GitHub issues and avoid drift.

## Planning & Coding Philosophy (Superpowers + Ponytail Synergy)

Per [DietrichGebert/ponytail#49](https://github.com/DietrichGebert/ponytail/issues/49), **Superpowers** and **Ponytail** compose at different layers without conflict:

1. **Planning & Workflow Layer (Superpowers Plugin)**:
   - Superpowers structures the workflow: requirements exploration (`brainstorming`), step-by-step implementation plans (`writing-plans`), execution tracking (`executing-plans`, `subagent-driven-development`), and systematic debugging (`systematic-debugging`).
   - For multi-step tasks, new features, or architectural adjustments, write unambiguous implementation plans detailing exact files, explicit interfaces, and concrete test assertions before touching code.
   - For complex tasks, use `superpowers:subagent-driven-development` to dispatch fresh subagents per task.

2. **Coding & Implementation Layer (Ponytail Plugin - Lazy Senior Dev Mode)**:
   - Ponytail is the always-on bias governing how code itself is written: **the best code is the code never written**. Solve the entire task with the smallest, simplest working diff (YAGNI).
   - **Scope Check**: Before writing code, inspect every place the change reaches (callers, tests, fixtures, config, exports).
   - **Smallest Complete Change**:
     - Reuse existing codebase helpers, components, and patterns first.
     - Leverage standard platform / web APIs before adding dependencies.
     - No premature abstractions, generic wrappers, boilerplate, or "for later" flexibility that nobody asked for.
     - Fix root causes in shared code once, rather than patching symptoms.
   - **Planning Pushback**: Ponytail actively questions proposed plans: *"Do you actually need this, or does X cover it?"* Prune unnecessary scope or redundant abstraction from plans before execution starts.
   - **Review Gate**: Run `/ponytail-review` or apply Ponytail quality review criteria to gate all code changes and subagent outputs before committing or landing them.

## Token Conservation & Test Execution Rules

- **Launch-and-Inspect Tests (No Verbose Synchronous Waiting)**:
  - NEVER run full test suites (`npm test`, Jest, Playwright) synchronously dumping unbounded stdout/stderr into context.
  - Launch test runs into the background or pipe output to a log file (`npm test > test.log 2>&1`), checking only the final exit code or targeted failure lines.
  - For targeted testing, run only the relevant single test file with silent/reporter flags (e.g., `npx jest path/to/file.test.js --silent`).
- **Targeted Context Reading**:
  - Never view entire multi-hundred line files with `view_file` when only inspecting small blocks. Always use `grep_search` first, then inspect targeted line slices (`StartLine`/`EndLine`).
- **No Redundant Artifact Generation**:
  - Skip planning mode / heavy artifact creation for straightforward fixes, isolated tasks, or one-off checks.


## Standard UI Viewports & Modes

When testing UI changes, verify across desktop and mobile modes:

| Mode ID | Label | Viewport |
|---------|-------|----------|
| `DESKTOP` | Desktop View | 1440 x 900 |
| `MOBILE` | Mobile View | 390 x 844 |

## Manual Verification & Test Plan (Issue #193 Pattern)

Before closing an issue or finalizing a milestone release:

1. **Master Test Plan Checklist**: Incorporate an interactive verification checklist modeled after Issue #193 into `walkthrough.md` and the GitHub Issue/PR review comment.
2. **Coverage**: Ensure tests verify feature functionality across both desktop and mobile viewports (`DESKTOP`: 1440 x 900 and `MOBILE`: 390 x 844) using realistic data.
3. **Regression Tests**:
   - For city import/navigation, transport, itinerary mapping, or map behavior: `node tests/city-nav-regression.js`
   - For general application changes: `npm test`

## AI Audits & Suggested Issues (Google Jules & Subagents)

When performing codebase audits, code health scans, architectural reviews, or recommending tasks **without implementing code directly**:
1. **Never dump unformatted task lists solely in chat or PR descriptions.**
2. **Create one markdown spec per recommendation** inside `.github/suggested-issues/<short-slug>.md` using [.github/suggested-issues/TEMPLATE.md](.github/suggested-issues/TEMPLATE.md).
3. **Commit the markdown files and open a Pull Request.**
4. The repository workflow (`.github/workflows/convert-jules-suggestions.yml`) will automatically parse and convert each `.md` file into an active GitHub issue with labels `jules-suggested, triage`, comment back on the PR with issue links, and close the PR.

## GitHub Issue Workflow

### Creating / Working Issues
- Structure issue descriptions with: `Before`, `Evidence`, `Proposed`, `After`, `Estimate`, `Files impacted`, `Tags`, `Acceptance criteria`, and `Verification plan`.
- For UI work, reference or attach `Before` and `Proposed` screenshots before coding.

### Resolving & Closing Issues
- Post a closing comment summarizing: `Before`, `After`, `Estimate`, `Files changed`, `Verification`, and `After screenshots` for visual work.
- DO NOT close GitHub issues or milestones automatically — leave them OPEN until the user gives explicit final approval.
- Delete temporary local screenshot/asset folders (`docs/github-issue-assets/issue-XX/`) before merging PRs.

## Git Commit & Push Policy

- **Incremental Commit & Push**: Commit and push changes incrementally AS YOU WORK (after completing logical sub-tasks or code modifications), not just at the very end of a task session.
- **Conventional Commits**: Use clear conventional commit messages (e.g., `feat(cities): ...`, `fix(onboarding): ...`) and push immediately to remote (`git push -u origin <branch-name>`).
- Do not accumulate uncommitted or unpushed worktree changes across turns.

