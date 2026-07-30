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
- Maintain full alignment with active GitHub issues and avoid drift.

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

## GitHub Issue Workflow

### Creating / Working Issues
- Structure issue descriptions with: `Before`, `Evidence`, `Proposed`, `After`, `Estimate`, `Files impacted`, `Tags`, `Acceptance criteria`, and `Verification plan`.
- For UI work, reference or attach `Before` and `Proposed` screenshots before coding.

### Resolving & Closing Issues
- Post a closing comment summarizing: `Before`, `After`, `Estimate`, `Files changed`, `Verification`, and `After screenshots` for visual work.
- DO NOT close GitHub issues or milestones automatically — leave them OPEN until the user gives explicit final approval.
- Delete temporary local screenshot/asset folders (`docs/github-issue-assets/issue-XX/`) before merging PRs.

