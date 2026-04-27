# Gemini Prompt Templates — Travel Planner PWA

Copy-paste these into Claude Code at the start of each TODO item session.
Replace `<project>` with the absolute path to your project root.
Replace `[Item Xa]` / `[description]` with the actual item.

---

## 1. Session start — orient on a TODO item

Use this **before touching any code**. Replaces manually reading source files.

```
Use gemini_prompt with:
  model: pro
  working_directory: <project>
  prompt: "I am about to work on Item [Xa]: [description from TODO.md].

  Read the codebase and tell me:
  1. Which files and functions I will need to touch
  2. The current data structure relevant to this change
  3. Any existing patterns I must follow to stay consistent
  4. Any risks — functions that call into this area, things that could break
  5. Anything non-obvious I should know before I start

  Be specific: file names, function names, approximate line numbers."
```

---

## 2. Map what calls what (before touching a module)

```
Use gemini_prompt with:
  model: flash
  working_directory: <project>
  files: ["js/tabs.js", "js/transport.js"]
  prompt: "Map the call chain for [function name]. What calls it, what does it call,
  and what data does it read/write? Return as a simple call tree."
```

---

## 3. Find all usages of a function or variable

```
Use gemini_prompt with:
  model: flash
  working_directory: <project>
  prompt: "Find every place [functionName / variableName] is referenced in the codebase.
  Return as a table: file | line | how it's used (read/write/call)"
```

---

## 4. Understand the data structure for a feature

```
Use gemini_prompt with:
  model: flash
  working_directory: <project>
  prompt: "Show me the complete data structure for [journeys / accommodation / packing / cities].
  Include: where it's defined, how it's stored in localStorage, and the shape of one example object.
  Pull from actual code, not comments."
```

---

## 5. Pre-commit review (before every git commit)

```
Use gemini_prompt with:
  model: pro
  working_directory: <project>
  files: ["index.html"]
  prompt: "Review the changes I just made to [function name / area of code].

  Check for:
  - Missing saveData() calls after mutations
  - Broken references to functions or variables
  - Inconsistency with how similar features work elsewhere in the codebase
  - Edge cases: empty arrays, null values, first/last items
  - Any rendering function that should be called but isn't

  Return: a bullet list of issues found (or 'looks clean' if none)."
```

---

## 6. Investigate a bug

```
Use gemini_prompt with:
  model: pro
  working_directory: <project>
  prompt: "Bug report: [describe exactly what happens and when].

  Read the codebase and:
  1. Identify the most likely cause (file + function + line range)
  2. Explain why this causes the symptom
  3. Suggest the minimal fix
  4. Flag any related code that might have the same problem"
```

---

## 7. Summarise a spec file before starting

```
Use gemini_prompt with:
  model: flash
  working_directory: <project>
  files: ["todo/accommodation-spec-conversion.md"]
  prompt: "Summarise this spec as a numbered implementation checklist.
  For each step, note which file and function will need to change.
  Flag any ambiguities or decisions that need to be made before starting."
```

---

## 8. Check for consistency after a change

```
Use gemini_prompt with:
  model: flash
  working_directory: <project>
  prompt: "I just added/changed [feature]. Scan the codebase and check:
  - Are there other places that do the same thing I should update to match?
  - Does the JSON export/import handle the new field correctly?
  - Are there any hardcoded references to the old structure I missed?
  Return a list of anything that needs updating."
```

---

## Quick reference

| Situation | Model | Template # |
|-----------|-------|-----------|
| Starting a TODO item | pro | 1 |
| Understanding a module | flash | 2 |
| Finding all usages | flash | 3 |
| Understanding data shape | flash | 4 |
| Before every commit | pro | 5 |
| Investigating a bug | pro | 6 |
| Reading a spec file | flash | 7 |
| Checking consistency after change | flash | 8 |
