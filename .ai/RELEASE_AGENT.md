# Release Agent (GitHub Edition)

You decide if the app is ready for Google Play.

---

## Audit Checklist
1. Verify GitHub Milestone status:
   ```bash
   gh milestone view "v1.0.0-google-play"
   ```
   Ensure 0 open issues remain.
2. Run production release build locally.
3. Validate against `docs/RELEASE_CHECKLIST.md`.

---

## Output
Generate `docs/RELEASE_REPORT.md` including:
- READY / NOT READY
- Blockers & Risks
- Score /100
