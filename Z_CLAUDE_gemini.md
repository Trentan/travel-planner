# CLAUDE.md (STRICT • GEMINI-ENFORCED)

This file provides **hard rules** for Claude Code when working in this repository.

> **Primary Objective:** Minimise Anthropic token usage.
> **Method:** Claude orchestrates. Gemini reads/analyzes. Claude writes small, targeted changes.

---

# 🚫 HARD CONSTRAINTS (NON-NEGOTIABLE)

Claude MUST NOT do the following **under any circumstance** unless explicitly instructed by the user:

* ❌ Read any file > 20 lines
* ❌ Open `index.html` fully
* ❌ Scan directories for “context”
* ❌ Load multiple modules to “understand the system”
* ❌ Paste or request large code blocks into chat
* ❌ Perform pre-reading before delegation

If a task requires understanding code:

> ✅ **Claude MUST call `gemini_prompt` FIRST**

Failure to follow this = incorrect behaviour.

---

# 🧠 CORE RULE

> **Gemini reads. Claude thinks and writes.**

* Claude sends ~50–150 tokens of instruction
* Gemini reads the full codebase (free context)
* Claude only acts on Gemini’s **compressed output**

---

# ⚡ MANDATORY WORKFLOW (ENFORCED ORDER)

## Step 0 — NEW SESSION (CRITICAL)

* Start a **fresh Claude session per sub-task**
* Never reuse long conversations

## Step 1 — GEMINI FIRST (ALWAYS)

Before ANY code interaction:

```
Use gemini_prompt with:
  model: pro
  working_directory: <absolute project path>
  prompt: "I am starting [ITEM]. Read the project and return:
           1. Exact files to modify
           2. Functions involved
           3. Risks
           4. Minimal plan
           Be concise."
```

🚫 DO NOT read any files before this step

## Step 2 — TARGETED ACTION ONLY

Claude may:

* Read ONLY specific lines identified by Gemini
* Make small, precise edits

Claude MUST NOT:

* Expand scope
* Re-scan files

## Step 3 — IMPLEMENT

* Modify only files Gemini identified
* Keep changes minimal
* Follow existing patterns exactly

## Step 4 — GEMINI QA (MANDATORY)

Before EVERY commit:

```
Use gemini_prompt with:
  model: flash
  working_directory: <project root>
  prompt: "Review my changes for bugs, missed edge cases, and inconsistencies."
```

## Step 5 — COMMIT

Only after Gemini review passes.

---

# 🔒 FILE ACCESS RULES

Claude may ONLY read files when:

✅ Gemini has returned:

* specific file name
* specific function
* approximate line range

Allowed example:

> "Edit js/auth.js lines ~120–160"

Not allowed:

> "Let me open auth.js to understand it"

---

# 🧾 PROMPT PATTERNS (STRICT)

## ✅ CORRECT (Gemini-first)

### Orientation

```
Use gemini_prompt (pro, wd=.)
"Map TODO item 3. Return files + plan"
```

### Bug finding

```
Use gemini_prompt (flash, wd=.)
"Find cause of [bug]. Return file + line"
```

### Code review

```
Use gemini_prompt (flash, files=[...])
"Review for bugs"
```

---

## ❌ FORBIDDEN (causes token explosion)

* "Read this file"
* "Open index.html"
* "Scan the project"
* "Summarise this code" (without Gemini)
* Pasting large code blocks

---

# 🧠 CONTEXT CONTROL RULES

To prevent token bloat:

* Start a NEW session per sub-task
* Keep conversations SHORT
* Avoid back-and-forth before Gemini call
* Never accumulate large chat history

---

# 🔍 VERIFICATION (REQUIRED)

After every Gemini call, Claude MUST confirm output contains:

```
Model: gemini-*
Tokens: in:XXXX
```

If NOT present:

* Delegation failed
* STOP and retry

---

# 🏗 PROJECT OVERVIEW

Travel Planner PWA is an offline-first, JSON-driven Progressive Web App.

Key principles:

* No backend
* No dependencies
* Single-file architecture
* localStorage persistence

---

# 🧩 DEVELOPMENT RULES

* Make **small, atomic commits**
* One sub-task at a time
* Do NOT fix unrelated issues
* Log everything in SESSION.md

---

# 📋 SESSION START (STRICT TEMPLATE)

On EVERY new session:

```
DO NOT read any project files.

Use gemini_prompt with:
- model: pro
- working_directory: <project root>
- prompt: "I am starting TODO item X. Analyse the codebase and TODO.md.
Return files, functions, risks, and plan."

WAIT for Gemini response before proceeding.
```

---

# 🧪 TESTING CHECKLIST

* App loads without errors
* CRUD operations work
* Drag-and-drop works
* Modes toggle correctly
* Import/export works
* Data persists

---

# 🚨 FAILURE CONDITIONS

The following indicate incorrect behaviour:

* Claude reads large files without Gemini
* Token usage spikes early in session
* No Gemini footer appears
* Claude “explores” codebase independently

If any occur:

> STOP and switch back to Gemini-first workflow

---

# 🧠 FINAL PRINCIPLE

> If Claude is reading code, you're wasting tokens.
> If Gemini is reading code, you're doing it right.

---

END OF FILE
