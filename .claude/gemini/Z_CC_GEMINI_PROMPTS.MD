⚡ FINAL CHEAT SHEET (Optimised + Token-Safe)
🔵 0. RULES (read once, then follow blindly)
Max 4 turns per session
Max 150–200 tokens per Gemini response
No discussion loops
End session after step 4 (Ctrl+D twice!)

### 0. START a new session for next sub-task (cli)
   claude --dangerously-skip-permissions

### 🟢 1. PREPARE (Gemini maps only — small output)
DO NOT read any project files.

Use gemini_prompt with:
- model: pro
- working_directory: .
- prompt:

"I am starting TODO item 5b.

Return ONLY:
- Files to modify
- Functions involved
- Risks (max 3)
- Minimal plan (3–5 bullets)

Constraints:
- Max 150 tokens
- No explanations
- No code"


### 🟡 2. PRODUCE (Gemini generates patch — no thinking later)
Use gemini_prompt with:
- model: pro
- working_directory: .
- prompt:

"Generate the exact minimal code changes for this plan.

Return:
- Diff-style patch ONLY

Constraints:
- No explanations
- No extra text
- Minimal changes only
- Max 200 tokens"


### 🟠 3. IMPLEMENT
Apply the patch exactly:

Constraints:
- Do NOT read other files
- Do NOT expand scope
- Do NOT refactor
- Only apply what is written


### 🔵 4. REVIEW (Gemini QA — controlled size)
Use gemini_prompt with:
- model: flash
- working_directory: .
- prompt:

"I added/changed 5b.

Check ONLY:
- Missed references
- Import/export handling
- Inconsistent patterns

Return:
- File + issue (bullet list)
- Close off the todo.md task if completed or add item with details for new session start to resolve

Constraints:
- Max 150 tokens
- No explanations
/

### 🔴 5. END SESSION (this is the BIG fix)
Summarise this session in <100 tokens for handover.

(ctrl+D twice) *End session manually

👉 Then STOP and start a new session