# UNFINISHED.md

## 🔄 Active

**Item 10a complete** - implemented hybrid backup reminder approach

**Decision:** Simplified approach using browser localStorage (removed IndexedDB over-engineering)

**Done:**
- ✓ Backup reminder system that tracks exports and shows friendly reminders after 7 days or 10 edits
- ✓ Enhanced export button with visual feedback showing last exported filename
- ✓ Edit tracking that triggers reminder after significant changes
- ✓ Removed complex IndexedDB code - kept simple reliable localStorage
- ✓ Exported JSON now properly updates tracking
- ✓ Add backup tracking hooks to saveData()

**Result:** Simple, user-friendly system that lives in browser storage but reminds users to export backups regularly

## 👀 Awaiting Review / Merge

- **Item 9a** - PR #14 open - Fixed title/subtitle loading/saving issues
  --
## Completed

---

*Last updated: 2026-05-11 — Item 10a complete*