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
3. Implement the fix
4. Run regression: `node scripts/regression-city-nav.js`
5. Take an actual after screenshot and save to `screenshots/after/WI-XXX-after.png`
6. Update TRACKER.md status to Done
7. Commit the WI on the current branch with the WI number in the commit message, then push the branch before treating the item as finished
