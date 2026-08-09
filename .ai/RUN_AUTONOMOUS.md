# Autonomous Local Execution Engine (GitHub Native)

**Project:** Travel Planner App  
**Target:** Google Play Release Milestone (`v1.0.0-google-play`)  
**Integration:** GitHub CLI (`gh`)  

---

## 1. Safety & Environment Verification

Before running, execute in terminal:

1. Confirm git working branch:
   ```bash
   git checkout -b ai-release-hardening
   ```
2. Verify GitHub CLI authentication:
   ```bash
   gh auth status
   ```

---

## 2. Core Operational Loop

```
┌────────────────────────────────────────────────────────┐
│ 1. Fetch highest priority open issue from GitHub       │
│    gh issue list --milestone "v1.0.0-google-play"      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Read issue details                                  │
│    gh issue view <issue-id>                            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Assume Developer Agent role & apply fix             │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
       [PASSES TESTS]                 [FAILS TESTS]
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│ Close GitHub Issue    │       │ Retry (Max 3)          │
│ gh issue close <id>   │       │ If 3 failures:         │
│ Commit git changes    │       │ Label as "blocked"     │
└───────────┬───────────┘       └───────────┬────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Fetch next issue until milestone reaches 100%       │
└───────────────────────────┴────────────────────────────┘
```

---

## 3. GitHub Execution Protocol

- **Audit Run (QA Agent):**
  Uses `gh issue create` to log every bug found into the GitHub Milestone instead of writing to a text file.

- **Fix Run (Developer Agent):**
  Reads issue text via `gh issue view <id>`, writes fixes, verifies with local tests, and closes issue with `gh issue close <id>`.

- **Release Run (Release Agent):**
  Queries `gh milestone view "v1.0.0-google-play"` to verify all issues are closed before running the production build.
