# WI-002 After Proposal - Mobile Top Chrome Consumes Too Much Viewport

The mobile menu chrome is at most 72px tall, with no empty ghost pills and a clear Menu button aligned to the right.

Verification:
- Compare against `../before/mobile-01-home.png`.
- `.app-menu-bar` height is no more than 72px at 390px.
- Disabled undo/redo controls do not render as empty pills on mobile.
