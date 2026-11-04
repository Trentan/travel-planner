---
title: "[Audit]: Interactive Two-Way AI Co-Pilot with Contextual Prompts & Ingestion Diff Engine"
labels: ["jules-suggested", "triage", "ai-builder"]
estimate: "L"
---

# [Audit]: Interactive Two-Way AI Co-Pilot with Contextual Prompts & Ingestion Diff Engine

## Before
`js/ai.js` operates as a static, one-way prompt generator. Users enter trip title, regions, cities, junctions, dates, and vibe into an open form. Clicking "Generate AI Prompt" constructs a JSON schema prompt and dumps it into a readonly `<textarea>` with a "Copy to Clipboard" button.
There is **no in-app mechanism to ingest the AI response back into the trip**, no JSON schema validation/repair, and no ability to prompt modifications to existing days or cities (e.g. "Add lunch near the station on Day 2" or "Reschedule rainy day activities"). Users must manually copy text to an external LLM, copy the raw JSON response, save it as a local `.json` file, and navigate to import.

## Evidence
- `js/ai.js`: `generatePrompt()` outputs text into `#aiPromptOutput`.
- `index.html`: `#ai-modal` contains only input fields and a copy prompt textarea. No response ingestion input or merge controls.

## Proposed
1. Implement a **Two-Way AI Co-Pilot Workflow**:
   - Step 1: Prompt Generation / Direct Query with context scoping.
   - Step 2: "Paste & Apply AI Response" drawer with automatic markdown fence stripping (````json ... ````), schema validation, and error reporting.
2. Add **Contextual Scoped Modification**:
   - Provide `✨ AI` buttons on City and Day timeline headers that pre-scope prompt context to just that City or Day.
   - Support quick prompt chips: *"Make it rain-friendly"*, *"Slow down the pace"*, *"Optimize route order"*.
3. Add **Visual Diff Preview**:
   - Before mutating state, preview changes (e.g., `+3 Added Activities`, `~1 Modified Time`, `-1 Removed`) with explicit "Apply Changes" or "Discard" actions.
4. Support 1-click Undo using `toastManager.showUndo(...)`.

## After
Travelers can interactively generate itineraries or modify specific days using AI without leaving the application or dealing with file import workarounds.

## Estimate
- Effort estimate: L

## Files impacted
- `js/ai.js`
- `index.html`
- `src/css/components.css`
- `js/itinerary.js`

## Acceptance criteria
- [ ] Users can paste an AI-generated JSON response directly into the modal and apply it without saving a local file.
- [ ] Markdown code blocks (````json````) and conversational prose are safely stripped and parsed.
- [ ] Contextual `✨ AI` actions on Day and City cards pre-fill localized context.
- [ ] Applying changes creates a snapshot that can be reverted via 1-click Undo.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: Unit test `parseAndValidateLLMResponse()` with valid JSON, fenced JSON, and malformed JSON.
- Manual test: Generate prompt, paste mock AI response, verify diff preview and timeline update.
