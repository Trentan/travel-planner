# WI-001 After Proposal - Desktop App Menu Wraps Into A 154px Header

At 1440px the menu bar is one row about 56px tall. Primary controls remain visible; export/import/reset/guide actions live in one grouped button or overflow menu.

Verification:
- Compare against `../before/desktop-02-menu-bar.png`.
- `.app-menu-bar` height is no more than 64px at 1440px.
- No top-menu controls wrap to a second row between 1024px and 1440px.
