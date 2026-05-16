# Travel Planner - App Polish Sprint

Self-managed audit + work backlog. No GitHub issues needed.
All items live in `/polish/items/`. Progress tracked in TRACKER.md.

## Quick links
- [Full audit findings](./AUDIT.md)
- [Progress tracker](./TRACKER.md)
- [Work items](./items/)
- [Before screenshots](./screenshots/before/)
- [Proposal assets](./items/proposals/)
- [After screenshots](./screenshots/after/)

## How to work through items
1. Open TRACKER.md - pick the next Todo item
2. Open its WI-XXX.md for full context, before screenshot ref, and proposed fix
3. Create or switch to a branch named for the work item, for example `WI-001_Desktop-App-Menu-Wraps`
4. Implement the fix
5. Run regression: `node scripts/regression-city-nav.js`
6. Take an actual after screenshot and save to `screenshots/after/WI-XXX-after.png`
7. Update TRACKER.md status to Done
8. Commit the WI on the WI branch with the WI number in the commit message, then push that same branch before treating the item as finished
